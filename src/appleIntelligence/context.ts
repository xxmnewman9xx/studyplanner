// Fact packs and chunking sized to the on-device model's context window
// (MASTER_PLAN §C1.5: never send the AppData blob, only minimal fact packs).

import { dateKey, daysUntilDate } from "../intelligence";
import { AppData, NoteItem } from "../types";
import { noonFromKey, weekdayOfKey } from "./dateKeys";
import { StudyNowCandidate } from "./types";

/** Tokens reserved for schema, instructions and the response in every call. */
export const RESERVED_TOKENS = 1400;
export const MAX_SYLLABUS_CHUNKS = 8;
const MIN_BUDGET = 300;

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯＀-￯]/u;
const DENSE_SCRIPT = /[Ѐ-ӿ֐-ۿऀ-෿฀-๿Ⴀ-ჿ]/u;

/**
 * Conservative token estimate: CJK ≈ 1 token per char, Devanagari/Arabic/
 * Cyrillic/Thai ≈ 1 per 2 chars, Latin ≈ 1 per 4 chars, plus 1 per line break.
 */
export function estimateTokens(text: string) {
  if (!text) return 0;
  let cjk = 0;
  let dense = 0;
  let other = 0;
  let breaks = 0;
  for (const char of text) {
    if (char === "\n") breaks += 1;
    else if (CJK.test(char)) cjk += 1;
    else if (DENSE_SCRIPT.test(char)) dense += 1;
    else if (!/\s/.test(char)) other += 1;
    else other += 0.25;
  }
  return Math.ceil(cjk + dense / 2 + other / 4 + breaks);
}

export function chunkBudget(contextSize: number) {
  const size = Number.isFinite(contextSize) && contextSize > 0 ? contextSize : 4096;
  return Math.max(MIN_BUDGET, Math.floor(size - RESERVED_TOKENS));
}

const PAGE_MARKER = /^\s*(?:\f|-{2,}\s*page|page\s+\d+(?:\s+of\s+\d+)?\b|\[?page\s*\d+\]?$|p\.\s*\d+\s*$|\d+\s*\/\s*\d+\s*$|ページ|페이지)/i;
const HEADING = /^\s*(?:#{1,4}\s|(?:week|wk|unit|module|part|section|chapter|semana|semaine|woche|semana|第\s*\d+\s*[週回]|\d+\s*주차)\b|[A-Z][A-Z0-9 &:/()'-]{5,}$)/i;

function isBreakLine(line: string) {
  return !line.trim() || PAGE_MARKER.test(line) || HEADING.test(line);
}

/**
 * Splits a syllabus into ≤ 8 chunks that each fit `contextSize − 1400` tokens.
 * Prefers breaking at page markers, headings, and blank lines; consecutive
 * chunks overlap by one line so a heading or table header carries forward.
 * Text past the 8th chunk is left to the heuristic parser.
 */
export function chunkSyllabusText(text: string, contextSize: number): string[] {
  const source = String(text || "").replace(/\r\n?/g, "\n");
  if (!source.trim()) return [];
  const budget = chunkBudget(contextSize);
  if (estimateTokens(source) <= budget) return [source];

  // Oversized single lines are hard-wrapped so every line fits the budget.
  const lines: string[] = [];
  for (const line of source.split("\n")) {
    if (estimateTokens(line) <= budget / 2) {
      lines.push(line);
      continue;
    }
    let rest = line;
    while (rest.length) {
      let cut = Math.max(1, Math.floor(rest.length / Math.ceil(estimateTokens(rest) / (budget / 2))));
      const space = rest.lastIndexOf(" ", cut);
      if (space > cut / 2) cut = space;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut).replace(/^\s+/, "");
    }
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < lines.length && chunks.length < MAX_SYLLABUS_CHUNKS) {
    let used = 0;
    let end = start;
    let lastBreak = -1;
    while (end < lines.length) {
      const cost = estimateTokens(lines[end]) + 1;
      if (used + cost > budget && end > start) break;
      used += cost;
      if (end > start && isBreakLine(lines[end])) lastBreak = end;
      end += 1;
    }
    // Prefer to end right before a break line when one sits in the last 40% of the chunk.
    if (end < lines.length && lastBreak > start + Math.floor((end - start) * 0.6)) end = lastBreak;
    const chunk = lines.slice(start, end).join("\n");
    if (chunk.trim()) chunks.push(chunk);
    if (end >= lines.length) break;
    start = Math.max(start + 1, end - 1);
  }
  return chunks;
}

export type NoteExcerpt = {
  text: string;
  /** 1-based line of `text`'s first line in the note sourceText. */
  startLine: number;
  endLine: number;
  truncated: boolean;
};

/**
 * Note text that fits the study-set budget. Lines are kept contiguous from the
 * top of the note so every citation line number still maps to sourceText.
 */
export function noteForStudySet(note: Pick<NoteItem, "sourceText">, contextSize: number): NoteExcerpt {
  const lines = String(note?.sourceText || "").replace(/\r\n?/g, "\n").split("\n");
  const budget = chunkBudget(contextSize);
  let used = 0;
  let end = 0;
  while (end < lines.length) {
    const cost = estimateTokens(lines[end]) + 1;
    if (used + cost > budget) break;
    used += cost;
    end += 1;
  }
  if (end === 0 && lines.length) {
    // A single enormous first line: clip it by characters.
    const approxChars = Math.max(200, budget * 2);
    return { text: lines[0].slice(0, approxChars), startLine: 1, endLine: 1, truncated: true };
  }
  return { text: lines.slice(0, end).join("\n"), startLine: 1, endLine: Math.max(1, end), truncated: end < lines.length };
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Compact, deterministic fact pack for the daily brief. It is both the model
 * input and the fidelity source that `validateDailyBrief` checks copy against.
 */
export function buildBriefFacts(candidates: StudyNowCandidate[], data: AppData, now: Date) {
  const today = dateKey(now);
  const lines = [`today: ${today} ${WEEKDAY_NAMES[weekdayOfKey(today)]}`];
  candidates.slice(0, 5).forEach((candidate, index) => {
    const parts = [`${index}. ${candidate.minutes} min`, candidate.title.slice(0, 80)];
    if (candidate.classCode) parts.push(candidate.classCode);
    parts.push(candidate.kind.replace("_", " "));
    if (typeof candidate.daysUntil === "number") {
      parts.push(candidate.kind === "exam_prep" ? `exam in ${candidate.daysUntil} days` : `due in ${candidate.daysUntil} days`);
    }
    lines.push(parts.join(" | "));
  });
  const upcomingExam = data.exams
    .filter((exam) => {
      const due = noonFromKey(exam.dueDate);
      return due && daysUntilDate(due, now) >= 0 && typeof exam.score !== "number";
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  if (upcomingExam) {
    const due = noonFromKey(upcomingExam.dueDate);
    lines.push(`next exam: ${upcomingExam.title.slice(0, 80)} in ${due ? daysUntilDate(due, now) : 0} days`);
  }
  const openTasks = data.tasks.filter((task) => !task.done).length;
  lines.push(`open tasks: ${openTasks}`);
  return lines.join("\n");
}
