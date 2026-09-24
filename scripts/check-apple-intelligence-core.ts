/// <reference types="node" />
// Pure checks for the 2.2 on-device intelligence layer: text utils, validators
// (with adversarial model output), merge, context, budget, inbox, Study Now,
// weak topics, heuristic study sets, quick-add, and the QR matrix.

import assert from "node:assert/strict";
import { analyzeSyllabus } from "../src/ai";
import { canInfer, cacheKey, MAX_REGENERATIONS_PER_DAY, regenAllowed, shouldRunBrief } from "../src/appleIntelligence/budget";
import { buildBriefFacts, chunkBudget, chunkSyllabusText, estimateTokens, MAX_SYLLABUS_CHUNKS, noteForStudySet } from "../src/appleIntelligence/context";
import { addDaysKey, dateKey } from "../src/appleIntelligence/dateKeys";
import { drainInbox, intelligenceSnapshot } from "../src/appleIntelligence/inbox";
import { MERGE_CAP, mergeSyllabusCandidates } from "../src/appleIntelligence/merge";
import { quickAddSmart } from "../src/appleIntelligence/quickAdd";
import { briefWithModel, looksEnglish, reasonNamesCandidate, studyNowCandidates, templateBrief, STUDY_NOW_COPY } from "../src/appleIntelligence/studyNow";
import { buildStudySet, extractDefinitionPairs, heuristicStudySet } from "../src/appleIntelligence/studySets";
import { isGrounded, lineOf, normalizeText, stableHash, tokenOverlap } from "../src/appleIntelligence/text";
import { AIAvailabilityState, ModelRunner, PracticeResult, StudyNowCandidate } from "../src/appleIntelligence/types";
import { parseSyllabusDateText, syllabusDateWindow, validateDailyBrief, validateNoteStudySet, validateSyllabusChunk, validateTaskProposal } from "../src/appleIntelligence/validators";
import { computeWeakTopics, proposeWeakTopicBlocks } from "../src/appleIntelligence/weakTopics";
import { dailyCapFor } from "../src/intelligence";
import { qrMatrix } from "../src/qrMatrix";
import { AppData, ImportBatch, ImportCandidate, NoteItem } from "../src/types";
import { defaultData } from "./fixture-data";

let checks = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    checks += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}
const asyncChecks: Array<[string, () => Promise<void>]> = [];
function checkAsync(name: string, fn: () => Promise<void>) {
  asyncChecks.push([name, fn]);
}

const NOW = new Date(2026, 8, 1, 10, 0, 0); // Tue 2026-09-01 local
const TODAY = dateKey(NOW);

function emptyData(): AppData {
  return { ...JSON.parse(JSON.stringify(defaultData)), classes: [], tasks: [], exams: [], notes: [], studyBlocks: [], reminders: [], imports: [] };
}

function withDates(data: AppData, now: Date): AppData {
  // fixture-data dates are relative to the real clock; re-anchor them to NOW.
  const shift = (key: string, offset: number) => addDaysKey(dateKey(now), offset);
  return {
    ...data,
    tasks: data.tasks.map((task) => ({ ...task, dueDate: shift(task.dueDate, task.dueOffset) })),
    exams: data.exams.map((exam) => ({ ...exam, dueDate: shift(exam.dueDate, exam.dueOffset) })),
    studyBlocks: data.studyBlocks.map((block, index) => ({ ...block, date: shift(block.date || "", index === 0 ? 0 : index) })),
  };
}

// ---------------------------------------------------------------------------
// text.ts
// ---------------------------------------------------------------------------

check("normalizeText folds full-width, Arabic-Indic, Devanagari digits and punctuation", () => {
  assert.equal(normalizeText("Quiz ２ — Ｓｅｐ １４!"), "quiz 2 sep 14");
  assert.equal(normalizeText("اختبار ١٤ سبتمبر"), "اختبار 14 سبتمبر");
  assert.equal(normalizeText("परीक्षा १४ सितंबर"), normalizeText("परीक्षा 14 सितंबर"));
  assert.equal(normalizeText("  Lab\tReport:\n2  "), "lab report 2");
});

check("stableHash is FNV-1a 64 over UTF-8", () => {
  const reference = (value: string) => {
    let h = 0xcbf29ce484222325n;
    for (const byte of Buffer.from(value, "utf8")) {
      h ^= BigInt(byte);
      h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
    }
    return h.toString(16).padStart(16, "0");
  };
  for (const value of ["", "a", "foobar", "Mitosis: division 日本語 😀", "x".repeat(5000)]) assert.equal(stableHash(value), reference(value));
  assert.equal(stableHash("a"), "af63dc4c8601ec8c");
});

check("isGrounded: substring, OCR-tolerant window, and rejection of invented spans", () => {
  const source = "Week 5\nLab Report 2 due Sep 25 at 5 PM in room 204\nQuiz 3 on Oct 2";
  assert.ok(isGrounded("lab report 2 due sep 25", source));
  assert.ok(isGrounded("Lab Report 2 due Sep 25 at 5 PM room 204", source), "one dropped word is tolerated (≥ 0.9 tokens)");
  assert.ok(!isGrounded("Lab Report 3 due Sep 25", source));
  assert.ok(!isGrounded("Final exam on December 12", source));
  assert.ok(!isGrounded("", source));
  assert.ok(!isGrounded(42 as unknown as string, source));
  assert.equal(lineOf("Quiz 3 on Oct 2", source), 3);
  assert.equal(lineOf("nothing like this", source), undefined);
  assert.equal(tokenOverlap("quiz 3", "Quiz 3 on Oct 2"), 1);
});

// ---------------------------------------------------------------------------
// validators.ts: syllabus chunks
// ---------------------------------------------------------------------------

const CHUNK = [
  "BIO 210 Human Biology MWF 10:00 AM Science Hall 204",
  "Lab Report 1 due September 14, 5:00 PM (10%)",
  "Quiz 1 on September 21",
  "Midterm Exam on October 15 (30%)",
  "Final Exam on December 12",
  "Quiz 2 on ١٤ سبتمبر",
  "Essay draft due २० सितंबर",
  "Problem Set 4 due ２０２６-１０-０１",
  "Syllabus revised January 5, 2025",
].join("\n");

const goodItems = [
  { kind: "assignment", title: "Lab Report 1", dateText: "September 14", timeText: "5:00 PM", weightPercent: 10, sourceSpan: "Lab Report 1 due September 14, 5:00 PM (10%)" },
  { kind: "quiz", title: "Quiz 1", dateText: "September 21", sourceSpan: "Quiz 1 on September 21" },
  { kind: "midterm", title: "Midterm Exam", dateText: "October 15", weightPercent: 30, sourceSpan: "Midterm Exam on October 15 (30%)" },
  { kind: "final", title: "Final Exam", courseCode: "BIO 210", dateText: "December 12", sourceSpan: "Final Exam on December 12" },
  { kind: "quiz", title: "Quiz 2", dateText: "١٤ سبتمبر", sourceSpan: "Quiz 2 on ١٤ سبتمبر" },
  { kind: "assignment", title: "Essay draft", dateText: "२० सितंबर", sourceSpan: "Essay draft due २० सितंबर" },
  { kind: "assignment", title: "Problem Set 4", dateText: "２０２６-１０-０１", sourceSpan: "Problem Set 4 due ２０２６-１０-０１" },
];

check("validateSyllabusChunk accepts grounded items and builds analyzeSyllabus-shaped payloads", () => {
  const raw = { courses: [{ code: "bio210", title: "Human Biology", meetingText: "MWF 10:00 AM Science Hall 204", sourceSpan: "BIO 210 Human Biology MWF 10:00 AM Science Hall 204" }], items: goodItems };
  const out = validateSyllabusChunk(raw, CHUNK, emptyData(), NOW);
  const klass = out.find((candidate) => candidate.kind === "class");
  assert.ok(klass, "class candidate");
  assert.equal((klass!.payload as any).code, "BIO 210");
  assert.equal((klass!.payload as any).name, "Human Biology");
  assert.equal((klass!.payload as any).days, "MWF");
  assert.equal(klass!.origin, "onDevice");
  const dated = out.filter((candidate) => candidate.kind !== "class");
  assert.equal(dated.length, goodItems.length);
  const byTitle = Object.fromEntries(dated.map((candidate) => [candidate.title, candidate]));
  assert.equal((byTitle["Lab Report 1"].payload as any).dueDate, "2026-09-14");
  assert.equal((byTitle["Lab Report 1"].payload as any).time, "5:00 PM");
  assert.equal((byTitle["Lab Report 1"].payload as any).weight, 10);
  assert.equal((byTitle["Lab Report 1"].payload as any).source, "On-device AI import");
  assert.equal(byTitle["Lab Report 1"].meta, "Lab · due 2026-09-14 · 5:00 PM", "same type inference as analyzeSyllabus");
  assert.equal(byTitle["Quiz 1"].kind, "exam");
  assert.equal((byTitle["Quiz 1"].payload as any).kind, "Quiz");
  assert.equal((byTitle["Quiz 1"].payload as any).room, "Room TBD");
  assert.deepEqual((byTitle["Quiz 1"].payload as any).topics, ["Core concepts", "Practice problems", "Lecture notes"]);
  assert.equal((byTitle["Midterm Exam"].payload as any).weight, 30);
  assert.equal((byTitle["Final Exam"].payload as any).kind, "Final");
  assert.equal((byTitle["Quiz 2"].payload as any).dueDate, "2026-09-14", "Arabic-Indic digits + Arabic month");
  assert.equal((byTitle["Essay draft"].payload as any).dueDate, "2026-09-20", "Devanagari digits + Hindi month");
  assert.equal((byTitle["Problem Set 4"].payload as any).dueDate, "2026-10-01", "full-width ISO date");
  dated.forEach((candidate) => {
    assert.equal(candidate.classId, "bio210", "items link to the chunk's course");
    assert.equal(candidate.approved, false);
    assert.equal(candidate.origin, "onDevice");
    assert.ok(candidate.id.startsWith("ic_"));
  });
});

check("validateSyllabusChunk rejects adversarial model output", () => {
  const adversarial = [
    { kind: "quiz", title: "Quiz 1", dateText: "September 28", sourceSpan: "Quiz 1 on September 21" }, // invented date (not in span)
    { kind: "quiz", title: "Quiz 3", dateText: "September 28", sourceSpan: "Quiz 3 on September 28" }, // invented span
    { kind: "final", title: "Final Exam", dateText: "October 15", sourceSpan: "Final Exam on December 12" }, // date elsewhere in chunk, not in span
    { kind: "exam", title: "Midterm Exam", dateText: "October 15" }, // missing span
    { kind: "assignment", title: "Syllabus revised", dateText: "January 5, 2025", sourceSpan: "Syllabus revised January 5, 2025" }, // out of window
    { kind: "quiz", title: "Quiz 2", dateText: "١٥ سبتمبر", sourceSpan: "Quiz 2 on ١٤ سبتمبر" }, // foreign digits that don't match the span
    { kind: "party", title: "Quiz 1", dateText: "September 21", sourceSpan: "Quiz 1 on September 21" }, // bad kind
    { kind: "quiz", title: "Q", dateText: "September 21", sourceSpan: "Quiz 1 on September 21" }, // title too short
    { kind: "quiz", title: `Quiz ${"x".repeat(130)}`, dateText: "September 21", sourceSpan: "Quiz 1 on September 21" }, // title too long
    { kind: "quiz", title: "Cafeteria menu", dateText: "September 21", sourceSpan: "Quiz 1 on September 21" }, // title not from span
    { kind: "quiz", title: "Quiz 1", dateText: "tomorrow", sourceSpan: "Quiz 1 on September 21" }, // relative date
    { kind: "quiz", title: "Quiz 1", dateText: 20260921, sourceSpan: "Quiz 1 on September 21" }, // wrong type
    null,
    "Quiz 1 on September 21",
  ];
  assert.deepEqual(validateSyllabusChunk({ courses: [], items: adversarial }, CHUNK, emptyData(), NOW), []);
  assert.deepEqual(validateSyllabusChunk({ courses: [{ code: "CHEM 999", sourceSpan: "CHEM 999 Invented" }], items: [] }, CHUNK, emptyData(), NOW), [], "ungrounded course");
  for (const garbage of [null, undefined, "garbage", 42, [], { items: "x" }, { courses: {}, items: {} }]) {
    assert.deepEqual(validateSyllabusChunk(garbage, CHUNK, emptyData(), NOW), []);
  }
  const hostile = new Proxy({}, { get() { throw new Error("boom"); }, has() { throw new Error("boom"); } });
  assert.deepEqual(validateSyllabusChunk(hostile, CHUNK, emptyData(), NOW), []);
});

check("weights outside 0–100 or absent from the text are dropped, the item kept", () => {
  const raw = { courses: [], items: [
    { kind: "midterm", title: "Midterm Exam", dateText: "October 15", weightPercent: 150, sourceSpan: "Midterm Exam on October 15 (30%)" },
    { kind: "quiz", title: "Quiz 1", dateText: "September 21", weightPercent: 45, sourceSpan: "Quiz 1 on September 21" },
  ] };
  const out = validateSyllabusChunk(raw, CHUNK, emptyData(), NOW);
  assert.equal(out.length, 2 + out.filter((c) => c.kind === "class").length);
  out.filter((c) => c.kind !== "class").forEach((candidate) => assert.equal((candidate.payload as any).weight, undefined));
});

check("term window: earliest grounded − 14 d … latest + 30 d, inside now − 60 d … now + 400 d", () => {
  const window = syllabusDateWindow(["2026-09-14", "2026-12-12"], NOW);
  assert.deepEqual(window, { start: "2026-08-31", end: "2027-01-11" });
  const clamped = syllabusDateWindow(["2025-01-05", "2029-01-01"], NOW);
  assert.deepEqual(clamped, { start: addDaysKey(TODAY, -60), end: addDaysKey(TODAY, 400) });
  // A grounded date far outside the document's own term is rejected.
  const chunk = "Reunion picnic assignment due August 1, 2027";
  const raw = { courses: [], items: [{ kind: "assignment", title: "Reunion picnic assignment", dateText: "August 1, 2027", sourceSpan: chunk }] };
  assert.deepEqual(validateSyllabusChunk(raw, chunk, emptyData(), NOW, { documentText: "Term runs September 1 to December 15, 2026" }), []);
  assert.equal(validateSyllabusChunk(raw, chunk, emptyData(), NOW).length, 1, "same item is fine when it is the document's own date");
});

check("date text parsing goes only through the deterministic parsers", () => {
  assert.equal(parseSyllabusDateText("Oct 6–10", NOW), "2026-10-06");
  assert.equal(parseSyllabusDateText("14.10.2026", NOW), "2026-10-14");
  assert.equal(parseSyllabusDateText("14 de septiembre", NOW), "2026-09-14");
  assert.equal(parseSyllabusDateText("9月14日", NOW), "2026-09-14");
  assert.equal(parseSyllabusDateText("2027年1月19日", NOW), "2027-01-19");
  assert.equal(parseSyllabusDateText("next Tuesday", NOW), null);
  assert.equal(parseSyllabusDateText("Tuesday", NOW), null);
  assert.equal(parseSyllabusDateText("2026-02-30", NOW), null);
  assert.equal(parseSyllabusDateText(undefined, NOW), null);
});

// ---------------------------------------------------------------------------
// validators.ts: study sets, briefs, task proposals
// ---------------------------------------------------------------------------

const NOTE: NoteItem = {
  id: "note_cells",
  classId: "bio",
  title: "Cell division",
  createdAt: NOW.toISOString(),
  summary: "How cells divide.",
  terms: [],
  suggestedTasks: [],
  pages: 1,
  sourceText: [
    "Mitosis: division of a nucleus into two identical nuclei.",
    "Meiosis: division that produces four haploid gametes.",
    "Cytokinesis: division of the cytoplasm after mitosis.",
    "Interphase: the phase where DNA replicates before division.",
    "The cell cycle has 4 phases.",
  ].join("\n"),
};

check("validateNoteStudySet keeps grounded items and rejects bad keys, duplicates, and ungrounded spans", () => {
  const raw = {
    summary: "Cells divide by mitosis and meiosis.",
    concepts: ["Mitosis", "Meiosis", "Photosynthesis"],
    cards: [
      { front: "Mitosis", back: "division of a nucleus into two identical nuclei", sourceSpan: "Mitosis: division of a nucleus into two identical nuclei." },
      { front: "Meiosis", back: "produces four haploid gametes", sourceSpan: "Meiosis: division that produces four haploid gametes." },
      { front: "Cell cycle", back: "has 6 phases", sourceSpan: "The cell cycle has 4 phases." }, // digit not in the note
      { front: "Photosynthesis", back: "makes glucose from light", sourceSpan: "Photosynthesis makes glucose." }, // ungrounded
    ],
    questions: [
      { stem: "Which process produces four haploid gametes?", options: ["Mitosis", "Meiosis", "Cytokinesis", "Interphase"], answerIndex: 1, why: "Meiosis produces gametes.", sourceSpan: "Meiosis: division that produces four haploid gametes." },
      { stem: "Bad index", options: ["Mitosis", "Meiosis", "Cytokinesis", "Interphase"], answerIndex: 4, why: "", sourceSpan: "Meiosis: division that produces four haploid gametes." },
      { stem: "Duplicate options", options: ["Mitosis", "mitosis!", "Cytokinesis", "Interphase"], answerIndex: 0, why: "", sourceSpan: "Mitosis: division of a nucleus into two identical nuclei." },
      { stem: "Three options", options: ["Mitosis", "Meiosis", "Cytokinesis"], answerIndex: 0, why: "", sourceSpan: "Mitosis: division of a nucleus into two identical nuclei." },
      { stem: "Wrong key", options: ["Mitosis", "Meiosis", "Cytokinesis", "Interphase"], answerIndex: 0, why: "", sourceSpan: "Meiosis: division that produces four haploid gametes." },
      { stem: "Ungrounded", options: ["A plant", "A cell", "A rock", "A star"], answerIndex: 1, why: "", sourceSpan: "Cells are the unit of life." },
    ],
  };
  const set = validateNoteStudySet(raw, NOTE, NOW);
  assert.ok(set);
  assert.equal(set!.origin, "onDevice");
  assert.equal(set!.cards.length, 2);
  assert.equal(set!.questions.length, 1);
  assert.equal(set!.questions[0].answerIndex, 1);
  assert.equal(set!.questions[0].source.line, 2);
  assert.equal(set!.cards[0].source.line, 1);
  assert.deepEqual(set!.concepts, ["Mitosis", "Meiosis"]);
  assert.equal(set!.sourceHash, stableHash(NOTE.sourceText));
  assert.equal(validateNoteStudySet({ cards: raw.cards.slice(0, 2), questions: [] }, NOTE, NOW), null, "< 3 grounded items → null");
  assert.equal(validateNoteStudySet("nope", NOTE, NOW), null);
});

const briefCandidates: StudyNowCandidate[] = [
  { id: "a", kind: "exam_prep", title: "Organic Chem Midterm", minutes: 45, daysUntil: 4, classCode: "CHEM 311", examId: "e1" },
  { id: "b", kind: "task", title: "Lab Report: Mitosis", minutes: 30, daysUntil: 0, classCode: "BIO 101", taskId: "t2" },
];

check("validateDailyBrief enforces focusIndex range, length, and fact fidelity", () => {
  const facts = buildBriefFacts(briefCandidates, withDates(defaultData, NOW), NOW);
  assert.ok(facts.includes("exam in 4 days"));
  assert.deepEqual(validateDailyBrief({ headline: "Chem first", body: "Your midterm is 4 days out, so 45 minutes now pays off.", focusIndex: 0 }, briefCandidates, facts), { headline: "Chem first", body: "Your midterm is 4 days out, so 45 minutes now pays off.", focusIndex: 0 });
  assert.ok(validateDailyBrief({ headline: "Lab today", body: "You may want to finish the lab report before dinner.", focusIndex: 1 }, briefCandidates, facts), "'may' as a verb is fine");
  assert.equal(validateDailyBrief({ headline: "x", body: "y", focusIndex: 2 }, briefCandidates, facts), null, "focusIndex ≥ candidates");
  assert.equal(validateDailyBrief({ headline: "x", body: "y", focusIndex: -1 }, briefCandidates, facts), null);
  assert.equal(validateDailyBrief({ headline: "x", body: "y", focusIndex: 0.5 }, briefCandidates, facts), null);
  assert.equal(validateDailyBrief({ headline: "Chem", body: "Your midterm is 5 days out.", focusIndex: 0 }, briefCandidates, facts), null, "digits not in facts");
  assert.equal(validateDailyBrief({ headline: "Chem", body: "Your midterm is on Friday.", focusIndex: 0 }, briefCandidates, facts), null, "weekday not in facts");
  assert.equal(validateDailyBrief({ headline: "Chem", body: "Exam on May 4.", focusIndex: 0 }, briefCandidates, facts), null, "month not in facts");
  assert.equal(validateDailyBrief({ headline: "Chem", body: "Three chapters left.", focusIndex: 0 }, briefCandidates, facts), null, "number words not in facts");
  assert.equal(validateDailyBrief({ headline: "Chem", body: "x".repeat(141), focusIndex: 0 }, briefCandidates, facts), null, "body > 140");
  assert.equal(validateDailyBrief({ headline: "x".repeat(61), body: "ok", focusIndex: 0 }, briefCandidates, facts), null, "headline > 60");
  assert.equal(validateDailyBrief({ headline: "Chem", body: "٥ days left", focusIndex: 0 }, briefCandidates, facts), null, "foreign digits normalized before the check");
  assert.equal(validateDailyBrief(null, briefCandidates, facts), null);
});

check("validateTaskProposal resolves only through deterministic resolvers and flags ambiguity", () => {
  const data = withDates(defaultData, NOW);
  const tomorrow = addDaysKey(TODAY, 1);
  const good = validateTaskProposal({ title: "Lab writeup", courseHint: "bio", dateText: "tomorrow", kind: "lab", estimateMinutes: 500 }, "bio lab writeup due tomorrow", data, NOW);
  assert.deepEqual(good, { title: "Lab writeup", type: "Lab", estimateMinutes: 240, needs: [], origin: "onDevice", classId: "bio", dueDate: tomorrow });
  const inventedDate = validateTaskProposal({ title: "Chem problem set", courseHint: "chem", dateText: "2026-10-01", kind: "assignment", estimateMinutes: 5 }, "chem problem set", data, NOW);
  assert.ok(inventedDate);
  assert.deepEqual(inventedDate!.needs, ["date"], "date not in the input → needs date");
  assert.equal(inventedDate!.estimateMinutes, 15);
  const ambiguous = validateTaskProposal({ title: "Study session", courseHint: "history", dateText: "next friday", kind: "exam", estimateMinutes: 60 }, "study session next friday", data, NOW);
  assert.deepEqual(ambiguous!.needs, ["class", "date"], "ungrounded class hint + 'next friday'");
  const weekday = validateTaskProposal({ title: "Essay outline", courseHint: "hist", dateText: "friday", kind: "assignment", estimateMinutes: 60 }, "hist essay outline friday", data, NOW);
  assert.equal(weekday!.dueDate, "2026-09-04");
  assert.equal(weekday!.classId, "hist");
  const hallucinatedTitle = validateTaskProposal({ title: "Buy groceries", courseHint: "bio", dateText: "tomorrow", kind: "assignment", estimateMinutes: 60 }, "bio reading tomorrow", data, NOW);
  assert.ok(hallucinatedTitle!.needs.includes("title"));
  assert.equal(hallucinatedTitle!.title, "bio reading tomorrow");
  assert.equal(validateTaskProposal({ title: 3 }, "x", data, NOW), null);
  assert.equal(validateTaskProposal({ title: "A", courseHint: "", dateText: "", kind: "bogus", estimateMinutes: 1 }, "x", data, NOW), null);
});

// ---------------------------------------------------------------------------
// merge.ts
// ---------------------------------------------------------------------------

check("mergeSyllabusCandidates marks agreement, keeps heuristic items, and holds model-only items unapproved", () => {
  const data = emptyData();
  const heuristic = analyzeSyllabus(CHUNK, data, NOW);
  const model = validateSyllabusChunk({ courses: [{ code: "BIO 210", title: "Human Biology", sourceSpan: CHUNK.split("\n")[0] }], items: goodItems }, CHUNK, data, NOW);
  const merged = mergeSyllabusCandidates(heuristic, model);
  const heuristicKeys = heuristic.candidates.map((candidate) => candidate.id);
  heuristicKeys.forEach((id) => assert.ok(merged.candidates.some((candidate) => candidate.id === id), "no heuristic item lost"));
  const both = merged.candidates.filter((candidate) => candidate.origin === "both");
  const onDevice = merged.candidates.filter((candidate) => candidate.origin === "onDevice");
  assert.ok(both.some((candidate) => candidate.title.toLowerCase() === "quiz 1"), "heuristic and model agree on Quiz 1");
  assert.ok(both.some((candidate) => candidate.title === "Essay draft"), "agreement on the Hindi-dated item");
  both.forEach((candidate) => {
    const before = heuristic.candidates.find((item) => item.id === candidate.id)!;
    assert.equal(candidate.confidence, Math.min(0.99, Math.round((before.confidence + 0.1) * 100) / 100));
    assert.equal(candidate.approved, before.approved);
  });
  onDevice.forEach((candidate) => assert.equal(candidate.approved, false));
  assert.deepEqual(onDevice.map((candidate) => candidate.title), ["Problem Set 4"], "model-only full-width ISO item is added for review");
  const dated = merged.candidates.filter((candidate) => candidate.kind !== "class").map((candidate) => (candidate.payload as any).dueDate || "9999");
  assert.deepEqual(dated, dated.slice().sort(), "sorted by date");
  assert.ok(merged.candidates.findIndex((candidate) => candidate.kind !== "class") >= merged.candidates.filter((candidate) => candidate.kind === "class").length, "classes first");
  assert.equal(mergeSyllabusCandidates(heuristic, []), heuristic, "no model items → heuristic batch unchanged");
});

check("merge caps at 80 with classes > both > heuristic > onDevice", () => {
  const data = emptyData();
  const lines = Array.from({ length: 90 }, (_, index) => `Problem Set ${index + 1} due ${addDaysKey("2026-09-02", index)}`);
  const text = ["MATH 240 Linear Algebra", ...lines].join("\n");
  const heuristic = analyzeSyllabus(text, data, NOW);
  assert.ok(heuristic.candidates.length > MERGE_CAP);
  const model: ImportCandidate[] = validateSyllabusChunk({ courses: [], items: [
    { kind: "assignment", title: "Problem Set 90", dateText: addDaysKey("2026-09-02", 89), sourceSpan: lines[89] },
    { kind: "quiz", title: "Pop quiz", dateText: "2026-09-03", sourceSpan: "Pop quiz 2026-09-03" },
  ] }, `${text}\nPop quiz 2026-09-03`, data, NOW);
  const merged = mergeSyllabusCandidates(heuristic, model);
  assert.equal(merged.candidates.length, MERGE_CAP);
  assert.equal(merged.candidates[0].kind, "class");
  assert.ok(merged.candidates.some((candidate) => candidate.title === "Problem Set 90" && candidate.origin === "both"), "agreed item survives the cap");
  assert.ok(!merged.candidates.some((candidate) => candidate.origin === "onDevice"), "model-only items are cut first");
});

// ---------------------------------------------------------------------------
// context.ts
// ---------------------------------------------------------------------------

check("estimateTokens is CJK-aware", () => {
  assert.equal(estimateTokens(""), 0);
  assert.ok(estimateTokens("情報科学概論") >= 6);
  assert.ok(estimateTokens("abcdefgh") <= 3);
  assert.ok(estimateTokens("परीक्षा परीक्षा") > estimateTokens("exam exam"));
});

check("chunkSyllabusText respects the budget, overlaps one line, and caps at 8 chunks", () => {
  assert.deepEqual(chunkSyllabusText("", 4096), []);
  assert.deepEqual(chunkSyllabusText("BIO 101\nQuiz 1 on Sep 4", 4096), ["BIO 101\nQuiz 1 on Sep 4"]);
  const lines: string[] = [];
  for (let week = 1; week <= 30; week += 1) {
    lines.push(`Week ${week} (Sep ${week})`, ...Array.from({ length: 6 }, (_, i) => `  Day ${i + 1}: reading about topic ${week}.${i} with a longer description of the lecture material and lab`), "");
  }
  const text = lines.join("\n");
  const chunks = chunkSyllabusText(text, 2000);
  const budget = chunkBudget(2000);
  assert.ok(chunks.length > 1 && chunks.length <= MAX_SYLLABUS_CHUNKS);
  chunks.forEach((chunk) => assert.ok(estimateTokens(chunk) <= budget + 2, `chunk within budget (${estimateTokens(chunk)} ≤ ${budget})`));
  for (let i = 1; i < chunks.length; i += 1) {
    const previous = chunks[i - 1].split("\n");
    assert.equal(chunks[i].split("\n")[0], previous[previous.length - 1], "one line of overlap");
  }
  const small = chunkSyllabusText(lines.slice(0, 60).join("\n"), 2600);
  const covered = new Set(small.flatMap((chunk) => chunk.split("\n")));
  lines.slice(0, 60).forEach((line) => assert.ok(covered.has(line), "every line lands in a chunk"));
  const huge = chunkSyllabusText(Array.from({ length: 4000 }, (_, i) => `Line ${i} assignment due soon with details`).join("\n"), 4096);
  assert.equal(huge.length, MAX_SYLLABUS_CHUNKS);
});

check("noteForStudySet keeps line numbers from the top of the note", () => {
  const excerpt = noteForStudySet({ sourceText: Array.from({ length: 2000 }, (_, i) => `Line ${i + 1}: definition text here`).join("\n") }, 4096);
  assert.equal(excerpt.startLine, 1);
  assert.ok(excerpt.truncated);
  assert.equal(excerpt.text.split("\n").length, excerpt.endLine);
  assert.ok(excerpt.text.startsWith("Line 1:"));
  assert.ok(estimateTokens(excerpt.text) <= chunkBudget(4096) + 2);
});

// ---------------------------------------------------------------------------
// budget.ts
// ---------------------------------------------------------------------------

check("budget: cache keys, once-a-day brief, regeneration cap, and every availability state", () => {
  assert.equal(cacheKey("noteStudySet", ["abc", "26.1", "en-US"]), cacheKey("noteStudySet", ["abc", "26.1", "en-US"]));
  assert.notEqual(cacheKey("noteStudySet", ["abc", "26.1", "en-US"]), cacheKey("noteStudySet", ["abc", "26.1", "fr-FR"]));
  assert.notEqual(cacheKey("noteStudySet", ["ab", "c"]), cacheKey("noteStudySet", ["a", "bc"]));
  assert.match(cacheKey("dailyBrief", [TODAY]), /^dailyBrief:v1:[0-9a-f]{16}$/);
  assert.equal(shouldRunBrief(null, TODAY), true);
  assert.equal(shouldRunBrief(TODAY, TODAY), false);
  assert.equal(shouldRunBrief(addDaysKey(TODAY, -1), TODAY), true);
  assert.equal(regenAllowed({}, TODAY), true);
  assert.equal(regenAllowed({ [TODAY]: MAX_REGENERATIONS_PER_DAY - 1 }, TODAY), true);
  assert.equal(regenAllowed({ [TODAY]: MAX_REGENERATIONS_PER_DAY }, TODAY), false);
  assert.equal(regenAllowed({ [addDaysKey(TODAY, -1)]: 50 }, TODAY), true);
  const states: AIAvailabilityState[] = ["available", "unavailable", "unsupportedOS", "missingModule"];
  for (const state of states) {
    for (const appState of ["active", "background", "inactive"]) {
      for (const platform of ["ios", "android", "web"]) {
        assert.equal(canInfer({ appState, availability: { state }, platform }), state === "available" && appState === "active" && platform === "ios");
      }
    }
  }
  assert.equal(canInfer({ appState: "active", availability: null, platform: "ios" }), false);
});

// ---------------------------------------------------------------------------
// inbox.ts
// ---------------------------------------------------------------------------

check("drainInbox validates, caps at 20, and is idempotent", () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: `siri-${i}`, text: `Add bio lab ${i}`, createdAt: new Date(Date.UTC(2026, 8, 1, 10, i)).toISOString() }));
  const raw = JSON.stringify([...rows, { id: "bad id!", text: "x", createdAt: rows[0].createdAt }, { id: "siri-0", text: "dup", createdAt: rows[0].createdAt }, { id: "no-date", text: "x", createdAt: "yesterday" }, { id: "empty", text: "   ", createdAt: rows[0].createdAt }]);
  const first = drainInbox(raw, new Set());
  assert.equal(first.entries.length, 20);
  assert.equal(first.entries[0].id, "siri-0");
  assert.equal(first.entries[0].text, "Add bio lab 0");
  const second = drainInbox(raw, first.processedIds);
  assert.deepEqual(second.entries.map((entry) => entry.id), ["siri-20", "siri-21", "siri-22", "siri-23", "siri-24"]);
  const third = drainInbox(raw, second.processedIds);
  assert.deepEqual(third.entries, [], "replay is idempotent");
  assert.deepEqual(drainInbox(JSON.stringify({ entries: rows.slice(0, 2) }), new Set()).entries.length, 2);
  for (const garbage of ["", "{", "null", "42", "\"x\"", undefined, null, 7, "[1,2,3]"]) {
    assert.deepEqual(drainInbox(garbage as unknown, new Set()).entries, []);
  }
});

check("intelligenceSnapshot is JSON-serializable and bounded", () => {
  const data = withDates(defaultData, NOW);
  const candidates = studyNowCandidates(data, NOW);
  const brief = templateBrief(candidates, data, NOW);
  const snapshot = intelligenceSnapshot(data, brief, NOW);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.dateKey, TODAY);
  assert.ok(snapshot.studyNow && snapshot.studyNow.line.startsWith("Now:"));
  assert.ok(snapshot.due.length <= 8 && snapshot.deadlines.length <= 60);
  assert.ok(snapshot.due.every((row) => !data.tasks.find((task) => task.title === row.title)?.done));
  assert.ok(snapshot.deadlines.every((row, i, list) => i === 0 || list[i - 1].dueDate <= row.dueDate));
  assert.equal(snapshot.classes.length, data.classes.length);
  const stale = intelligenceSnapshot(data, brief ? { ...brief, dateKey: addDaysKey(TODAY, -1) } : null, NOW);
  assert.equal(stale.studyNow, null, "no stale-day text");
});

// ---------------------------------------------------------------------------
// studyNow.ts
// ---------------------------------------------------------------------------

check("studyNowCandidates is deterministic, capped at 5, and prefers the nearest exam's block", () => {
  const data = withDates(defaultData, NOW);
  data.studyBlocks = [
    ...data.studyBlocks,
    { id: "sb_exam_far", day: "Today", time: "", examId: "e3", classId: "fin", title: "Finance review", minutes: 30, reason: "", completed: false, date: TODAY },
    { id: "sb_exam_near", day: "Today", time: "", examId: "e1", classId: "chem", title: "Chem mechanisms review", minutes: 40, reason: "", completed: false, date: TODAY },
  ];
  const first = studyNowCandidates(data, NOW);
  assert.deepEqual(studyNowCandidates(data, NOW), first);
  assert.ok(first.length >= 2 && first.length <= 5);
  assert.equal(first[0].blockId, "sb_exam_near");
  assert.equal(first[0].kind, "exam_prep");
  assert.equal(first[0].daysUntil, 4);
  assert.equal(first[0].classCode, "CHEM 311");
  assert.deepEqual(studyNowCandidates(emptyData(), NOW), []);
});

check("templateBrief builds the line from facts only", () => {
  const brief = templateBrief(briefCandidates, defaultData, NOW);
  assert.equal(brief!.line, "Now: 45 min Organic Chem Midterm");
  assert.equal(brief!.reason, "Your exam is 4 days out. Short sessions now beat a late cram.");
  assert.equal(brief!.origin, "template");
  const task = templateBrief([briefCandidates[1]], defaultData, NOW);
  assert.equal(task!.line, "Now: 30 min Lab Report: Mitosis");
  assert.equal(task!.reason, "It's due today. Finish it first.");
  const keys: string[] = [];
  const t = (key: string, fallback: string, vars?: Record<string, string | number>) => {
    keys.push(key);
    return `[${key}]${vars ? JSON.stringify(vars) : ""}${fallback.length ? "" : ""}`;
  };
  templateBrief(briefCandidates, defaultData, NOW, t);
  assert.deepEqual(keys, ["ai.brief.line", "ai.brief.reason_exam"]);
  Object.values(STUDY_NOW_COPY).forEach(([key]) => assert.match(key, /^ai\.brief\./));
  const pick = { id: "x", kind: "exam_prep" as const, title: "Organic Chem Midterm", minutes: 30, classCode: "CHEM 311", daysUntil: 4 };
  assert.equal(reasonNamesCandidate("Today is a busy day with exams and tasks. Make sure to prioritize your time wisely.", [pick]), false, "generic model advice keeps the template reason");
  assert.equal(reasonNamesCandidate("CHEM 311 is close, so a short pass now pays off.", [pick]), true);
  assert.equal(reasonNamesCandidate("Tu examen de Organic Chem llega pronto.", [pick]), true);
  assert.equal(reasonNamesCandidate("Faltan 4 días para el examen.", [pick]), true);
  const examWeek = { id: "y", kind: "study_block" as const, title: "Exam Week review", minutes: 30 };
  assert.equal(reasonNamesCandidate("Today is a busy day with exams and tasks. Make sure to prioritize your time wisely.", [pick, examWeek]), false, "\"exams\" must not match the title word \"exam\"");
  assert.equal(looksEnglish("Today is a busy day with exams and tasks."), true);
  assert.equal(looksEnglish("CHEM 311 ist bald dran, also lerne jetzt kurz."), false);
  assert.equal(looksEnglish("CHEM 311 : révise-le maintenant."), false);
  assert.equal(templateBrief([], defaultData, NOW), null);
});

checkAsync("briefWithModel skips the model for ≤ 1 candidate and falls back on bad output", async () => {
  let calls = 0;
  const runnerFor = (value: unknown): ModelRunner => async () => {
    calls += 1;
    return { ok: true, value, cached: false };
  };
  const one = await briefWithModel([briefCandidates[0]], defaultData, NOW, (_k, f, v) => f.replace(/\{(\w+)\}/g, (_m, n) => String(v?.[n])), runnerFor({ headline: "x", body: "y", focusIndex: 0 }));
  assert.equal(calls, 0);
  assert.equal(one!.origin, "template");
  const t = (_k: string, f: string, v?: Record<string, string | number>) => f.replace(/\{(\w+)\}/g, (_m, n) => String(v?.[n]));
  const bad = await briefWithModel(briefCandidates, defaultData, NOW, t, runnerFor({ headline: "Go", body: "Exam in 9 days.", focusIndex: 0 }));
  assert.equal(bad!.origin, "template");
  const outOfRange = await briefWithModel(briefCandidates, defaultData, NOW, t, runnerFor({ headline: "Go", body: "Go.", focusIndex: 3 }));
  assert.equal(outOfRange!.origin, "template");
  const good = await briefWithModel(briefCandidates, defaultData, NOW, t, runnerFor({ headline: "Lab first", body: "It's due today, so clear it before chem.", focusIndex: 1 }));
  assert.equal(good!.origin, "onDevice");
  assert.equal(good!.candidate.id, "b");
  assert.equal(good!.line, "Now: 30 min Lab Report: Mitosis", "line stays template-built");
  assert.equal(good!.reason, "It's due today, so clear it before chem.");
  const failing: ModelRunner = async () => ({ ok: false, code: "guardrail" });
  assert.equal((await briefWithModel(briefCandidates, defaultData, NOW, t, failing))!.origin, "template");
  const throwing: ModelRunner = async () => { throw new Error("native crash"); };
  assert.equal((await briefWithModel(briefCandidates, defaultData, NOW, t, throwing))!.origin, "template");
});

// ---------------------------------------------------------------------------
// weakTopics.ts
// ---------------------------------------------------------------------------

check("weak topics stay hidden until 20 answers and propose ≤ 3 blocks before the exam", () => {
  const data = withDates(defaultData, NOW);
  const row = (i: number, concept: string, correct: boolean): PracticeResult => ({ id: `r${i}`, noteId: "n3", classId: "chem", examId: "e1", itemId: `q${i}`, kind: "question", concept, correct, answeredAt: NOW.toISOString() });
  const rows: PracticeResult[] = [];
  for (let i = 0; i < 8; i += 1) rows.push(row(i, i % 2 ? "Carbocations" : "carbocation", i < 6 ? false : true));
  for (let i = 8; i < 14; i += 1) rows.push(row(i, "SN2", i < 11 ? false : true));
  for (let i = 14; i < 19; i += 1) rows.push(row(i, "Nucleophile", true));
  assert.deepEqual(computeWeakTopics(rows, data), [], "19 answers → hidden");
  rows.push(row(19, "Electrophile", false), row(20, "Electrophile", false), row(21, "Electrophile", true));
  const weak = computeWeakTopics(rows, data);
  assert.ok(weak.length >= 2);
  assert.equal(normalizeText(weak[0].concept).startsWith("carbocation"), true, "plural/singular clustered");
  assert.equal(weak[0].attempts, 8);
  assert.ok(weak.every((topic, i, list) => i === 0 || list[i - 1].weakness >= topic.weakness));
  assert.ok(!weak.some((topic) => topic.concept === "Nucleophile"), "no misses → not weak");
  const blocks = proposeWeakTopicBlocks(weak, data, NOW);
  assert.ok(blocks.length >= 1 && blocks.length <= 3);
  const exam = data.exams.find((item) => item.id === "e1")!;
  blocks.forEach((block) => {
    assert.equal(block.source, "exam_prep");
    assert.equal(block.minutes, 25);
    assert.ok(block.date! < exam.dueDate && block.date! >= TODAY);
    assert.equal(block.completed, false);
  });
  assert.deepEqual(proposeWeakTopicBlocks(weak, data, NOW).map((block) => block.id), blocks.map((block) => block.id), "deterministic ids");
});

// ---------------------------------------------------------------------------
// studySets.ts
// ---------------------------------------------------------------------------

const MULTILINGUAL_NOTE: NoteItem = {
  ...NOTE,
  id: "note_multi",
  sourceText: [
    "Unit 3 notes",
    "- Mitosis: division of a nucleus into two identical nuclei",
    "- Meiosis - division that produces four haploid gametes",
    "Cytokinesis is the division of the cytoplasm after mitosis",
    "Fotosíntesis: proceso que convierte la luz en energía química",
    "光合成とは、光のエネルギーで糖をつくる働きである。",
    "प्रकाश संश्लेषण: पौधे प्रकाश से भोजन बनाते हैं",
    "Due: Friday",
    "Chapter 4: Genetics",
    "This process is important because it repairs tissue.",
  ].join("\n"),
};

check("heuristicStudySet parses multilingual definitions into cited cards and MCQs", () => {
  const pairs = extractDefinitionPairs(MULTILINGUAL_NOTE.sourceText);
  const terms = pairs.map((pair) => pair.term);
  assert.deepEqual(terms, ["Mitosis", "Meiosis", "Cytokinesis", "Fotosíntesis", "光合成", "प्रकाश संश्लेषण"]);
  assert.equal(pairs[0].line, 2);
  const set = heuristicStudySet(MULTILINGUAL_NOTE, defaultData, NOW);
  assert.equal(set.origin, "heuristic");
  assert.equal(set.cards.length, 6);
  set.cards.forEach((card) => assert.ok(card.source.line && MULTILINGUAL_NOTE.sourceText.split("\n")[card.source.line - 1].includes(card.front)));
  assert.ok(set.questions.length >= 4 && set.questions.length <= 6);
  set.questions.forEach((question) => {
    assert.equal(new Set(question.options.map((option) => normalizeText(option))).size, 4);
    assert.ok(question.answerIndex >= 0 && question.answerIndex <= 3);
    const pair = pairs.find((item) => item.line === question.source.line)!;
    assert.equal(question.options[question.answerIndex], pair.term, "answer key is the defined term");
    assert.ok(!question.stem.includes(pair.term) || pair.term.length < 3, "term blanked out of the stem");
  });
  assert.deepEqual(heuristicStudySet(MULTILINGUAL_NOTE, defaultData, NOW).questions, set.questions, "deterministic");
  const sparse = heuristicStudySet({ ...NOTE, id: "sparse", sourceText: "Photosynthesis happens in chloroplasts.\nChlorophyll absorbs light.", terms: ["Photosynthesis", "Chlorophyll"] }, defaultData, NOW);
  assert.equal(sparse.questions.length, 0, "fewer than 4 pairs → no MCQs");
  assert.ok(sparse.cards.length >= 1, "concept fallback still yields cited cards");
  sparse.cards.forEach((card) => assert.ok(card.source.line));
});

checkAsync("buildStudySet: skip short notes, validated model set, heuristic on failure", async () => {
  let calls = 0;
  const okRunner: ModelRunner = async () => {
    calls += 1;
    return { ok: true, cached: false, value: {
      summary: "Cells divide.",
      concepts: ["Mitosis"],
      cards: [
        { front: "Mitosis", back: "division of a nucleus into two identical nuclei", sourceSpan: "Mitosis: division of a nucleus into two identical nuclei." },
        { front: "Meiosis", back: "produces four haploid gametes", sourceSpan: "Meiosis: division that produces four haploid gametes." },
        { front: "Cytokinesis", back: "division of the cytoplasm", sourceSpan: "Cytokinesis: division of the cytoplasm after mitosis." },
      ],
      questions: [],
    } };
  };
  const shortSet = await buildStudySet(NOTE, defaultData, okRunner, { contextSize: 4096, now: NOW });
  assert.equal(calls, 0);
  assert.equal(shortSet.origin, "heuristic");
  const longNote = { ...NOTE, sourceText: `${NOTE.sourceText}\n${"Extra context line about cell biology and division.\n".repeat(10)}` };
  const modelSet = await buildStudySet(longNote, defaultData, okRunner, { contextSize: 4096, now: NOW });
  assert.equal(calls, 1);
  assert.equal(modelSet.origin, "onDevice");
  let overflowCalls = 0;
  const overflow: ModelRunner = async () => {
    overflowCalls += 1;
    return { ok: false, code: "contextOverflow" };
  };
  assert.equal((await buildStudySet(longNote, defaultData, overflow, { contextSize: 4096, now: NOW })).origin, "heuristic");
  assert.equal(overflowCalls, 2, "one split-and-retry");
  const junk: ModelRunner = async () => ({ ok: true, cached: false, value: { cards: [{ front: "x", back: "y", sourceSpan: "not in note" }] } });
  assert.equal((await buildStudySet(longNote, defaultData, junk, { contextSize: 4096, now: NOW })).origin, "heuristic");
});

// ---------------------------------------------------------------------------
// quickAdd.ts
// ---------------------------------------------------------------------------

checkAsync("quickAddSmart: regex first, model only on issues, validated proposal", async () => {
  const data = withDates(defaultData, NOW);
  let calls = 0;
  const runner: ModelRunner = async () => {
    calls += 1;
    return { ok: true, cached: false, value: { title: "Lab writeup", courseHint: "bio", dateText: "friday", kind: "lab", estimateMinutes: 90 } };
  };
  const regex = await quickAddSmart("BIO 101 lab report tomorrow", data, NOW, runner);
  assert.equal(regex.kind, "task");
  assert.equal(calls, 0);
  const proposal = await quickAddSmart("bio lab writeup friday", data, NOW, runner);
  assert.equal(calls, 1);
  assert.equal(proposal.kind, "proposal");
  if (proposal.kind === "proposal") {
    assert.equal(proposal.proposal.origin, "onDevice");
    assert.equal(proposal.proposal.dueDate, "2026-09-04");
    assert.equal(proposal.proposal.classId, "bio");
    assert.deepEqual(proposal.proposal.needs, []);
  }
  const heuristic = await quickAddSmart("chem problem set friday", data, NOW, null);
  assert.equal(heuristic.kind, "proposal");
  if (heuristic.kind === "proposal") {
    assert.equal(heuristic.proposal.origin, "heuristic");
    assert.equal(heuristic.proposal.classId, "chem");
    assert.equal(heuristic.proposal.dueDate, "2026-09-04");
  }
  const failing: ModelRunner = async () => ({ ok: false, code: "unsupportedLocale" });
  const fallback = await quickAddSmart("something vague", data, NOW, failing);
  assert.equal(fallback.kind, "proposal");
  if (fallback.kind === "proposal") assert.deepEqual(fallback.proposal.needs.sort(), ["class", "date"]);
});

// ---------------------------------------------------------------------------
// dailyCapFor + QR
// ---------------------------------------------------------------------------

check("dailyCapFor matches buildSchedulePlan personas", () => {
  assert.equal(dailyCapFor({ studyPersonality: "Heavy lifter", workloadStyle: "" }), 210);
  assert.equal(dailyCapFor({ studyPersonality: "Need a nudge", workloadStyle: "Balanced" }), 110);
  assert.equal(dailyCapFor({ studyPersonality: "ADHD friendly", workloadStyle: "" }), 110);
  assert.equal(dailyCapFor({ studyPersonality: "Planner", workloadStyle: "Balanced" }), 150);
});

check("qrMatrix returns a square ECC-M matrix with three finder patterns", () => {
  const link = "https://studyplanner-ai.xxmnewman9xx.workers.dev/p?ct=pack#v1.abcdefghijklmnopqrstuvwxyz0123456789";
  const matrix = qrMatrix(link);
  const size = matrix.length;
  assert.ok(size >= 21 && (size - 17) % 4 === 0, `size ${size} is 4v+17`);
  matrix.forEach((row) => assert.equal(row.length, size));
  const finderAt = (top: number, left: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        assert.equal(matrix[top + r][left + c], ring || core, `finder module ${top + r},${left + c}`);
      }
    }
  };
  finderAt(0, 0);
  finderAt(0, size - 7);
  finderAt(size - 7, 0);
  assert.deepEqual(qrMatrix(""), []);
  assert.deepEqual(qrMatrix("x".repeat(5000)), [], "too long for any QR version");
  assert.ok(qrMatrix("Añadir clase 日本語").length >= 21, "UTF-8 text encodes");
});

(async () => {
  for (const [name, fn] of asyncChecks) {
    try {
      await fn();
      checks += 1;
    } catch (error) {
      console.error(`FAIL: ${name}`);
      throw error;
    }
  }
  console.log(`Apple Intelligence core checks passed (${checks})`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
