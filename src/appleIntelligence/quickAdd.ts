// Natural-language quick-add (F6). The Build 90 regex capture runs first; the
// model is consulted only when it reports issues, and every model answer goes
// through validateTaskProposal before the confirm sheet sees it.

import { createNaturalLanguageTask, findCaptureClassMatches, NaturalLanguageTaskIssue, parseCaptureDate } from "../intelligence";
import { AppData, TaskItem } from "../types";
import { cleanString } from "./text";
import { ModelRunner, TaskProposal } from "./types";
import { resolveBareWeekday, validateTaskProposal } from "./validators";

export type QuickAddResult =
  | { kind: "task"; task: TaskItem }
  | { kind: "proposal"; proposal: TaskProposal; issues: NaturalLanguageTaskIssue[] };

const DATE_WORDS = /\b(?:due\s*(?:on\s*)?[:=-]?\s*)?(?:today|tomorrow|next\s+week|\d{4}-\d{2}-\d{2}|(?:this\s+)?(?:mon|tues?|wed|thur?s?|fri|sat|sun)(?:day|nesday|urday|sday)?)\b/giu;

function heuristicProposal(input: string, data: AppData, now: Date, issues: NaturalLanguageTaskIssue[]): TaskProposal {
  const matches = findCaptureClassMatches(input, data);
  const capture = parseCaptureDate(input, now);
  let dueDate = capture.ok ? capture.dueDate : undefined;
  if (!capture.ok && capture.issue === "date") {
    const weekday = input.match(/\b(?:this\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i);
    if (weekday && !/\bnext\s+(?:mon|tue|wed|thu|fri|sat|sun)/i.test(input)) dueDate = resolveBareWeekday(weekday[0], now) || undefined;
  }
  let title = input.replace(DATE_WORDS, " ");
  matches.forEach((match) => {
    title = title.replace(new RegExp(match.alias.split(" ").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s._/#-]+"), "iu"), " ");
  });
  title = cleanString(title.replace(/^[\s,;:|/\\\-–—]+|[\s,;:|/\\\-–—]+$/g, "").replace(/\b(?:for|in|class)\s*$/i, ""), 120);
  const needs: TaskProposal["needs"] = [];
  if (matches.length !== 1) needs.push("class");
  if (!dueDate) needs.push("date");
  if (title.length < 3 || issues.includes("title")) needs.push("title");
  const proposal: TaskProposal = {
    title: title.length >= 3 ? title : cleanString(input, 120),
    type: /\bexam|midterm|final|quiz\b/i.test(input) ? "Review" : /\bread/i.test(input) ? "Reading" : "Assignment",
    estimateMinutes: 60,
    needs,
    origin: "heuristic",
  };
  if (matches.length === 1) proposal.classId = matches[0].klass.id;
  if (dueDate) proposal.dueDate = dueDate;
  return proposal;
}

export async function quickAddSmart(input: string, data: AppData, now: Date, runner: ModelRunner | null, options: { signal?: AbortSignal; timeoutMs?: number; locale?: string } = {}): Promise<QuickAddResult> {
  const trimmed = String(input || "").trim();
  const regex = createNaturalLanguageTask(trimmed, data);
  if (regex.ok) return { kind: "task", task: regex.task };
  const issues = regex.issues;
  const fallback = (): QuickAddResult => ({ kind: "proposal", proposal: heuristicProposal(trimmed, data, now, issues), issues });
  if (!runner || !trimmed || issues.includes("input")) return fallback();
  try {
    const result = await runner(
      "taskProposal",
      { text: cleanString(trimmed, 300), classes: data.classes.filter((klass) => !klass.archivedAt).slice(0, 12).map((klass) => klass.code), locale: options.locale },
      { signal: options.signal, timeoutMs: options.timeoutMs }
    );
    if (!result || !result.ok) return fallback();
    const proposal = validateTaskProposal(result.value, trimmed, data, now);
    return proposal ? { kind: "proposal", proposal, issues } : fallback();
  } catch {
    return fallback();
  }
}
