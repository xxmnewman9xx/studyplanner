// Deterministic validation gates (MASTER_PLAN §C5). Everything a model returns
// is untrusted until it passes through here. The model proposes; this file
// decides what may be shown; the student confirms.
//
// Pure TypeScript: no react-native imports.

import { dateFromPhrase, MONTH_PATTERN, normalizeGlobalAcademicText } from "../ai";
import { dateKey, findCaptureClassMatches, parseCaptureDate } from "../intelligence";
import { AppData, ImportCandidate, NoteItem } from "../types";
import { addDaysKey, isValidDateInput, weekdayOfKey } from "./dateKeys";
import {
  buildClassCandidate,
  buildExamCandidate,
  buildTaskCandidate,
  canonicalCourseCode,
  classSlug,
  displayTime,
  ExamKind,
  findClassByCode,
  inferTaskType,
  normalizeCode,
  ON_DEVICE_SOURCE,
} from "./payloads";
import { asciiDigits, cleanString, isGrounded, isPlainObject, lineOf, lineText, normalizeText, stableHash, tokenOverlap } from "./text";
import {
  RawSyllabusKind,
  SourceCitation,
  StudyCard,
  StudyNowCandidate,
  StudyQuestion,
  StudySet,
  TaskProposal,
} from "./types";

export const STUDY_SET_SCHEMA_VERSION = 1;
export const MODEL_ITEM_CONFIDENCE = 0.78;
export const MODEL_CLASS_CONFIDENCE = 0.8;

const RAW_KINDS: RawSyllabusKind[] = ["assignment", "exam", "quiz", "midterm", "final", "project", "reading", "lab", "presentation"];

export function isRawKind(value: unknown): value is RawSyllabusKind {
  return typeof value === "string" && (RAW_KINDS as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Dates: parsed ONLY by the exported deterministic parsers.
// ---------------------------------------------------------------------------

const RELATIVE_DATE = /\b(today|tomorrow|tonight|yesterday|next|this|last|in\s+\d+\s+days?)\b/i;
const STRICT_MONTH = String.raw`(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?`;
const ABSOLUTE_DATE_SCAN = new RegExp(
  String.raw`\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s+${STRICT_MONTH}(?:,?\s+\d{4})?|${STRICT_MONTH}\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b`,
  "gi"
);

function preNormalizeDateText(text: string) {
  return asciiDigits(text.normalize("NFKC"))
    .replace(/(\d{4})\s*[年년]\s*(\d{1,2})\s*[月월]\s*(\d{1,2})\s*[日일]?/g, "$1-$2-$3")
    .replace(/[–—]/g, "-");
}

/**
 * Absolute calendar date from verbatim date text, or null. Relative phrases
 * ("next Tuesday", "tomorrow") are rejected for syllabus items because their
 * meaning depends on when the document was written.
 */
export function parseSyllabusDateText(dateText: unknown, now: Date): string | null {
  if (typeof dateText !== "string") return null;
  const raw = cleanString(dateText, 80);
  if (!raw || !/\d/.test(asciiDigits(raw.normalize("NFKC")))) return null;
  let text = normalizeGlobalAcademicText(preNormalizeDateText(raw));
  if (RELATIVE_DATE.test(text)) return null;
  // "Oct 6-10" / "6-10 Oct" are ranges: the first day is the date.
  text = text
    .replace(new RegExp(String.raw`\b(${MONTH_PATTERN})\s+(\d{1,2})\s*-\s*\d{1,2}\b`, "i"), "$1 $2")
    .replace(new RegExp(String.raw`\b(\d{1,2})\s*-\s*\d{1,2}\s+(${MONTH_PATTERN})`, "i"), "$1 $2");
  const parsed = dateFromPhrase(text, now);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  const key = dateKey(parsed);
  return isValidDateInput(key) ? key : null;
}

/** Every absolute date the deterministic scanner can find in `text`, sorted. */
export function scanGroundedDates(text: string, now: Date): string[] {
  const normalized = normalizeGlobalAcademicText(preNormalizeDateText(String(text || "")));
  const found = new Set<string>();
  for (const match of normalized.matchAll(ABSOLUTE_DATE_SCAN)) {
    const key = parseSyllabusDateText(match[0], now);
    if (key) found.add(key);
  }
  return Array.from(found).sort();
}

export type DateWindow = { start: string; end: string };

/** Earliest grounded date − 14 d … latest + 30 d, intersected with now − 60 d … now + 400 d. */
export function syllabusDateWindow(groundedDates: string[], now: Date): DateWindow {
  const today = dateKey(now);
  const absStart = addDaysKey(today, -60);
  const absEnd = addDaysKey(today, 400);
  if (!groundedDates.length) return { start: absStart, end: absEnd };
  const sorted = groundedDates.slice().sort();
  const start = addDaysKey(sorted[0], -14);
  const end = addDaysKey(sorted[sorted.length - 1], 30);
  return { start: start > absStart ? start : absStart, end: end < absEnd ? end : absEnd };
}

function inWindow(key: string, window: DateWindow) {
  return key >= window.start && key <= window.end;
}

function spanContains(span: string, fragment: string) {
  const normalizedFragment = normalizeText(fragment);
  return Boolean(normalizedFragment) && normalizeText(span).includes(normalizedFragment);
}

// ---------------------------------------------------------------------------
// Syllabus chunks
// ---------------------------------------------------------------------------

const CODE_STOPWORDS = new Set(["MWF", "MW", "TR", "TTH", "WEEK", "PAGE", "UNIT", "ROOM", "HALL", "QUIZ", "EXAM", "TEST", "TERM", "FALL", "LAB", "LABS", "PSET", "HW", "DUE", "MOD", "PART", "CH", "SEC", "DAY", "NO", "ID"]);

function codesInLine(line: string): string[] {
  const codes: string[] = [];
  for (const match of line.matchAll(/\b([A-Z]{2,5})\s?(\d{2,4})\b/g)) {
    if (CODE_STOPWORDS.has(match[1])) continue;
    codes.push(`${match[1]} ${match[2]}`);
  }
  return codes;
}

function lastCodeIn(lines: string[]) {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const codes = codesInLine(lines[i]);
    if (codes.length) return codes[codes.length - 1];
  }
  return null;
}

export type SyllabusValidationOptions = {
  /** Whole document text: its grounded dates define the term window (defaults to the chunk). */
  documentText?: string;
  /** Text before this chunk, used to find the course an item belongs to. */
  precedingText?: string;
  /** Class id to use when nothing in the text names a course. */
  fallbackClassId?: string;
};

type CourseRef = { code: string; classId: string };

function mapItemKind(kind: RawSyllabusKind, title: string): { candidate: "task"; type: string } | { candidate: "exam"; examKind?: ExamKind } {
  switch (kind) {
    case "exam":
      return { candidate: "exam", examKind: /\bfinal\b/i.test(title) ? "Final" : /\bmid-?term\b/i.test(title) ? "Midterm" : "Exam" };
    case "quiz":
      return { candidate: "exam", examKind: "Quiz" };
    case "midterm":
      return { candidate: "exam", examKind: "Midterm" };
    case "final":
      return { candidate: "exam", examKind: "Final" };
    case "lab":
      return /practical/i.test(title) ? { candidate: "exam" } : { candidate: "task", type: "Lab" };
    case "reading": {
      const inferred = inferTaskType(title);
      return { candidate: "task", type: inferred === "Assignment" ? "Reading" : inferred };
    }
    case "project": {
      const inferred = inferTaskType(title);
      return { candidate: "task", type: inferred === "Assignment" ? "Project" : inferred };
    }
    default:
      return { candidate: "task", type: inferTaskType(title) };
  }
}

/**
 * Validates one raw `SyllabusChunk` against the chunk text it came from.
 * Returns import candidates marked `origin: "onDevice"` and `approved: false`;
 * `mergeSyllabusCandidates` promotes the ones the heuristic parser agrees with.
 */
export function validateSyllabusChunk(raw: unknown, chunkText: string, data: AppData, now: Date, options: SyllabusValidationOptions = {}): ImportCandidate[] {
  try {
    return validateSyllabusChunkUnsafe(raw, String(chunkText || ""), data, now, options);
  } catch {
    return [];
  }
}

function validateSyllabusChunkUnsafe(raw: unknown, chunkText: string, data: AppData, now: Date, options: SyllabusValidationOptions): ImportCandidate[] {
  if (!isPlainObject(raw) || !chunkText.trim()) return [];
  const rawCourses = Array.isArray(raw.courses) ? raw.courses.slice(0, 6) : [];
  const rawItems = Array.isArray(raw.items) ? raw.items.slice(0, 30) : [];
  const chunkLines = chunkText.split(/\r\n|\r|\n|\f/);
  const precedingLines = String(options.precedingText || "").split(/\r\n|\r|\n|\f/);
  const window = syllabusDateWindow(scanGroundedDates(options.documentText || chunkText, now), now);
  const normalizedChunkCompact = normalizeText(chunkText).replace(/\s+/g, "");

  const classCandidates: ImportCandidate[] = [];
  const courseRefs = new Map<string, CourseRef>();
  const paletteBase = data.classes.length;

  const ensureCourse = (code: string, extra: { name?: string; meetingText?: string } = {}): CourseRef => {
    const key = normalizeCode(code);
    const known = courseRefs.get(key);
    if (known) return known;
    const existing = findClassByCode(data, code);
    if (existing) {
      const ref = { code: existing.code, classId: existing.id };
      courseRefs.set(key, ref);
      return ref;
    }
    const candidate = buildClassCandidate({
      code,
      name: extra.name,
      meetingText: extra.meetingText,
      data,
      now,
      paletteIndex: paletteBase + classCandidates.length,
      confidence: MODEL_CLASS_CONFIDENCE,
      approved: false,
      origin: "onDevice",
    });
    classCandidates.push(candidate);
    const ref = { code, classId: candidate.classId || classSlug(code) };
    courseRefs.set(key, ref);
    return ref;
  };

  for (const course of rawCourses) {
    if (!isPlainObject(course)) continue;
    const code = canonicalCourseCode(course.code);
    const span = typeof course.sourceSpan === "string" ? course.sourceSpan : "";
    if (!code || !isGrounded(span, chunkText)) continue;
    if (!normalizeText(span).replace(/\s+/g, "").includes(normalizeCode(code))) continue;
    const title = cleanString(course.title, 80);
    const name = title && title.length >= 3 && tokenOverlap(title, span) >= 0.5 ? title : undefined;
    const meeting = typeof course.meetingText === "string" && isGrounded(course.meetingText, chunkText) ? cleanString(course.meetingText, 120) : undefined;
    ensureCourse(code, { name, meetingText: meeting });
  }

  const resolveClassId = (courseCode: unknown, spanLine: number | undefined): string => {
    const explicit = canonicalCourseCode(courseCode);
    if (explicit && normalizedChunkCompact.includes(normalizeCode(explicit))) return ensureCourse(explicit).classId;
    const upTo = spanLine ? chunkLines.slice(0, spanLine) : chunkLines;
    const nearest = lastCodeIn(upTo) || lastCodeIn(precedingLines);
    if (nearest) return ensureCourse(nearest).classId;
    return options.fallbackClassId || data.classes.find((klass) => !klass.archivedAt)?.id || data.classes[0]?.id || "bio";
  };

  const items: ImportCandidate[] = [];
  const seen = new Set<string>();
  for (const item of rawItems) {
    if (!isPlainObject(item)) continue;
    if (!isRawKind(item.kind)) continue;
    if (typeof item.title !== "string" || typeof item.dateText !== "string" || typeof item.sourceSpan !== "string") continue;
    const span = item.sourceSpan;
    if (!isGrounded(span, chunkText)) continue;
    const dateText = cleanString(item.dateText, 80);
    if (!dateText || !spanContains(span, dateText)) continue;
    const dueDate = parseSyllabusDateText(dateText, now);
    if (!dueDate || !inWindow(dueDate, window)) continue;

    const title = cleanString(item.title, 200);
    if (title.length < 3 || title.length > 120 || !/\p{L}/u.test(title)) continue;
    if (tokenOverlap(title, span) < 0.5) continue;

    let weight: number | undefined;
    if (typeof item.weightPercent === "number" && Number.isFinite(item.weightPercent) && item.weightPercent >= 0 && item.weightPercent <= 100) {
      const rounded = Math.round(item.weightPercent * 10) / 10;
      const digits = new Set(asciiDigits(chunkText.normalize("NFKC")).match(/\d+(?:\.\d+)?/g) || []);
      if (digits.has(String(rounded))) weight = rounded;
    }
    const time = (typeof item.timeText === "string" && spanContains(span, item.timeText) ? displayTime(item.timeText) : undefined) || displayTime(span);
    const spanLine = lineOf(span, chunkText);
    const classId = resolveClassId(item.courseCode, spanLine);
    const mapped = mapItemKind(item.kind, title);
    const key = `${mapped.candidate}-${title.toLowerCase()}-${dueDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (mapped.candidate === "exam") {
      items.push(buildExamCandidate({ title, classId, dueDate, now, time, kind: mapped.examKind, weight, confidence: MODEL_ITEM_CONFIDENCE, approved: false, origin: "onDevice" }));
    } else {
      items.push(buildTaskCandidate({ title, classId, dueDate, now, time, type: mapped.type, weight, source: ON_DEVICE_SOURCE, confidence: MODEL_ITEM_CONFIDENCE, approved: false, origin: "onDevice" }));
    }
  }

  items.sort((a, b) => String((a.payload as any).dueDate).localeCompare(String((b.payload as any).dueDate)));
  return [...classCandidates, ...items];
}

// ---------------------------------------------------------------------------
// Note study sets
// ---------------------------------------------------------------------------

function citationFor(span: string, sourceText: string): SourceCitation | null {
  if (!isGrounded(span, sourceText)) return null;
  const line = lineOf(span, sourceText);
  const quote = line ? lineText(sourceText, line) : cleanString(span, 200);
  return line ? { quote: cleanString(quote, 240), line } : { quote: cleanString(quote, 240) };
}

function digitsSupported(text: string, source: string) {
  const sourceDigits = new Set(asciiDigits(source.normalize("NFKC")).match(/\d+/g) || []);
  return (asciiDigits(text.normalize("NFKC")).match(/\d+/g) || []).every((digits) => sourceDigits.has(digits));
}

/**
 * Validates a raw `NoteStudySet`. Every card and question must quote the
 * student's own note; MCQs need exactly 4 distinct options and an answer key
 * supported by the quoted line. Returns null when fewer than 3 items survive.
 */
export function validateNoteStudySet(raw: unknown, note: NoteItem, now: Date = new Date()): StudySet | null {
  try {
    return validateNoteStudySetUnsafe(raw, note, now);
  } catch {
    return null;
  }
}

function validateNoteStudySetUnsafe(raw: unknown, note: NoteItem, now: Date): StudySet | null {
  if (!isPlainObject(raw) || !note || typeof note.sourceText !== "string") return null;
  const source = note.sourceText;
  const cards: StudyCard[] = [];
  const questions: StudyQuestion[] = [];
  const cardKeys = new Set<string>();

  for (const card of Array.isArray(raw.cards) ? raw.cards.slice(0, 24) : []) {
    if (cards.length >= 12) break;
    if (!isPlainObject(card)) continue;
    const front = cleanString(card.front, 160);
    const back = cleanString(card.back, 320);
    if (front.length < 2 || back.length < 2 || typeof card.sourceSpan !== "string") continue;
    const citation = citationFor(card.sourceSpan, source);
    if (!citation) continue;
    if (tokenOverlap(back, `${card.sourceSpan} ${front}`) < 0.34) continue;
    if (!digitsSupported(`${front} ${back}`, source)) continue;
    const key = normalizeText(front);
    if (cardKeys.has(key)) continue;
    cardKeys.add(key);
    cards.push({ id: `sc_${stableHash(`${note.id}|card|${front}|${back}`)}`, front, back, source: citation });
  }

  const stemKeys = new Set<string>();
  for (const question of Array.isArray(raw.questions) ? raw.questions.slice(0, 12) : []) {
    if (questions.length >= 6) break;
    if (!isPlainObject(question)) continue;
    const stem = cleanString(question.stem, 240);
    if (stem.length < 3 || typeof question.sourceSpan !== "string") continue;
    if (!Array.isArray(question.options) || question.options.length !== 4) continue;
    const options = question.options.map((option) => cleanString(option, 120));
    if (options.some((option) => !option)) continue;
    const normalizedOptions = options.map((option) => normalizeText(option));
    if (new Set(normalizedOptions).size !== 4 || normalizedOptions.some((option) => !option)) continue;
    const answerIndex = question.answerIndex;
    if (typeof answerIndex !== "number" || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) continue;
    const citation = citationFor(question.sourceSpan, source);
    if (!citation) continue;
    const support = options.map((option) => tokenOverlap(option, question.sourceSpan as string));
    const correctSupport = support[answerIndex];
    if (correctSupport < 0.5 || support.some((value, index) => index !== answerIndex && value >= correctSupport)) continue;
    if (!digitsSupported(`${stem} ${options[answerIndex]}`, source)) continue;
    const stemKey = normalizeText(stem);
    if (stemKeys.has(stemKey)) continue;
    stemKeys.add(stemKey);
    const why = cleanString(question.why, 240);
    questions.push({
      id: `sq_${stableHash(`${note.id}|q|${stem}|${options.join("|")}`)}`,
      stem,
      options: [options[0], options[1], options[2], options[3]],
      answerIndex: answerIndex as 0 | 1 | 2 | 3,
      why: why && digitsSupported(why, source) ? why : citation.quote,
      source: citation,
    });
  }

  if (cards.length + questions.length < 3) return null;

  const concepts = (Array.isArray(raw.concepts) ? raw.concepts : [])
    .map((concept) => cleanString(concept, 60))
    .filter((concept, index, list) => concept.length >= 2 && isGrounded(concept, `${note.title}\n${source}`) && list.findIndex((other) => normalizeText(other) === normalizeText(concept)) === index)
    .slice(0, 8);
  const rawSummary = cleanString(raw.summary, 400);
  const summary = rawSummary && digitsSupported(rawSummary, source) && rawSummary.split(/(?<=[.!?。！？])\s*/).filter(Boolean).length <= 3
    ? rawSummary
    : cleanString(note.summary, 400);

  return {
    noteId: note.id,
    sourceHash: stableHash(source),
    origin: "onDevice",
    summary,
    concepts,
    cards,
    questions,
    createdAt: now.toISOString(),
    schemaVersion: STUDY_SET_SCHEMA_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Daily brief copy fidelity
// ---------------------------------------------------------------------------

const MONTH_WORDS = /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janvier|février|fevrier|avril|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|januar|februar|märz|juni|juli|oktober|dezember|janeiro|fevereiro|março|maio|junho|julho|setembro|outubro|novembro|dezembro)\b/giu;
const MAY_DATE = /\bmay\s+\d/i;
const WEEKDAY_WORDS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|yesterday|weekend|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|mañana|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen)\b/giu;
const NUMBER_WORDS = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|hundred)\b/gi;
const CJK_DATE = /[0-9０-９]+\s*[月日時分]|[月火水木金土日]曜/u;

export type ValidatedBrief = { headline: string; body: string; focusIndex: number };

/**
 * Accepts model copy only when every number, date, weekday, and month it
 * mentions is present in the fact pack it was given.
 */
export function validateDailyBrief(raw: unknown, candidates: StudyNowCandidate[], factText: string): ValidatedBrief | null {
  try {
    if (!isPlainObject(raw) || !Array.isArray(candidates) || !candidates.length) return null;
    const focusIndex = raw.focusIndex;
    if (typeof focusIndex !== "number" || !Number.isInteger(focusIndex) || focusIndex < 0 || focusIndex >= candidates.length) return null;
    if (typeof raw.headline !== "string" || typeof raw.body !== "string") return null;
    const headline = cleanString(raw.headline, 200);
    const body = cleanString(raw.body, 400);
    if (!headline || !body || headline.length > 60 || body.length > 140) return null;
    if (/https?:|www\.|@/i.test(`${headline} ${body}`)) return null;
    const facts = asciiDigits(String(factText || "").normalize("NFKC"));
    const factsLower = facts.toLocaleLowerCase();
    const output = asciiDigits(`${headline} ${body}`.normalize("NFKC"));
    const factDigits = new Set(facts.match(/\d+/g) || []);
    if ((output.match(/\d+/g) || []).some((digits) => !factDigits.has(digits))) return null;
    const lower = output.toLocaleLowerCase();
    const words = [...(lower.match(MONTH_WORDS) || []), ...(lower.match(WEEKDAY_WORDS) || []), ...(lower.match(NUMBER_WORDS) || [])];
    if (MAY_DATE.test(lower)) words.push("may");
    if (words.some((word) => !factsLower.includes(word))) return null;
    if (CJK_DATE.test(output) && !CJK_DATE.test(facts)) return null;
    return { headline, body, focusIndex };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task proposals (quick-add fallback)
// ---------------------------------------------------------------------------

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};

/** "Friday" / "fri" → next such day after today. "next Friday" or naming today is ambiguous → null. */
export function resolveBareWeekday(dateText: string, now: Date): string | null {
  const text = normalizeText(dateText).replace(/^(?:due|on|by)\s+/, "");
  const match = text.match(/^(?:this\s+)?([a-z]+)$/);
  if (!match || !(match[1] in WEEKDAYS)) return null;
  const today = dateKey(now);
  const delta = (WEEKDAYS[match[1]] - weekdayOfKey(today) + 7) % 7;
  if (delta === 0) return null;
  return addDaysKey(today, delta);
}

const TASK_TYPES: Record<RawSyllabusKind, string> = {
  assignment: "Assignment",
  exam: "Exam",
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  project: "Project",
  reading: "Reading",
  lab: "Lab",
  presentation: "Presentation",
};

export function validateTaskProposal(raw: unknown, input: string, data: AppData, now: Date): TaskProposal | null {
  try {
    if (!isPlainObject(raw) || typeof input !== "string" || !input.trim()) return null;
    if (typeof raw.title !== "string" || typeof raw.dateText !== "string" || typeof raw.courseHint !== "string") return null;
    if (!isRawKind(raw.kind)) return null;
    const needs = new Set<TaskProposal["needs"][number]>();

    let title = cleanString(raw.title, 200);
    if (title.length < 3 || title.length > 120 || tokenOverlap(title, input) === 0) {
      const fallback = cleanString(input, 120);
      title = fallback.length >= 3 ? fallback : "";
      needs.add("title");
    }

    let classId: string | undefined;
    const hint = cleanString(raw.courseHint, 80);
    const hintMatches = hint && isGrounded(hint, input) ? findCaptureClassMatches(hint, data) : [];
    const matches = hintMatches.length ? hintMatches : findCaptureClassMatches(input, data);
    if (matches.length === 1) classId = matches[0].klass.id;
    else needs.add("class");

    let dueDate: string | undefined;
    const dateText = cleanString(raw.dateText, 60);
    if (dateText && isGrounded(dateText, input)) {
      const capture = parseCaptureDate(dateText, now);
      if (capture.ok) dueDate = capture.dueDate;
      else if (capture.issue !== "date-ambiguous") {
        dueDate = resolveBareWeekday(dateText, now) || parseSyllabusDateText(dateText, now) || undefined;
      }
    }
    const today = dateKey(now);
    if (dueDate && (!isValidDateInput(dueDate) || dueDate < addDaysKey(today, -1) || dueDate > addDaysKey(today, 400))) dueDate = undefined;
    if (!dueDate) needs.add("date");

    const time = typeof raw.timeText === "string" && isGrounded(raw.timeText, input) ? displayTime(raw.timeText) : undefined;
    const estimate = typeof raw.estimateMinutes === "number" && Number.isFinite(raw.estimateMinutes) ? raw.estimateMinutes : 60;
    const proposal: TaskProposal = {
      title,
      type: TASK_TYPES[raw.kind],
      estimateMinutes: Math.max(15, Math.min(240, Math.round(estimate))),
      needs: (["class", "date", "title"] as const).filter((need) => needs.has(need)),
      origin: "onDevice",
    };
    if (classId) proposal.classId = classId;
    if (dueDate) proposal.dueDate = dueDate;
    if (time) proposal.time = time;
    return proposal;
  } catch {
    return null;
  }
}
