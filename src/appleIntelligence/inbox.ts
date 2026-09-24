// App Group JSON contracts shared with the App Intents (F4/F6): the Siri
// "Add assignment" inbox the app drains on foreground, and the read-only
// intelligence snapshot Siri/Spotlight answer from with the app killed.

import { dateKey } from "../intelligence";
import { activeSemesterData } from "../ownership/semesterOwnership";
import { AppData } from "../types";
import { diffDaysKey, isValidDateInput } from "./dateKeys";
import { cleanString, isPlainObject } from "./text";
import { DailyBrief } from "./types";

export const MAX_INBOX_ENTRIES = 20;
export type InboxEntry = { id: string; text: string; createdAt: string };
export type InboxDrain = { entries: InboxEntry[]; processedIds: Set<string> };

/**
 * Parses `intent-inbox.json` (an array, or `{ entries: [...] }`) and returns up
 * to 20 unprocessed, validated entries, oldest first. Idempotent: ids already
 * in `processedIds` are skipped, and the returned set includes the new ids.
 * Never throws.
 */
export function drainInbox(rawJson: unknown, processedIds: Set<string>): InboxDrain {
  const processed = new Set<string>(processedIds instanceof Set ? processedIds : []);
  try {
    if (typeof rawJson !== "string" || !rawJson.trim() || rawJson.length > 200_000) return { entries: [], processedIds: processed };
    const parsed: unknown = JSON.parse(rawJson);
    const list = Array.isArray(parsed) ? parsed : isPlainObject(parsed) && Array.isArray(parsed.entries) ? parsed.entries : [];
    const seen = new Set<string>();
    const valid: InboxEntry[] = [];
    for (const row of list.slice(0, 500)) {
      if (!isPlainObject(row)) continue;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(id) || seen.has(id) || processed.has(id)) continue;
      const text = cleanString(row.text, 500);
      if (!text) continue;
      const createdAt = typeof row.createdAt === "string" ? row.createdAt : "";
      const time = Date.parse(createdAt);
      if (!createdAt || !Number.isFinite(time)) continue;
      seen.add(id);
      valid.push({ id, text, createdAt: new Date(time).toISOString() });
    }
    const entries = valid.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).slice(0, MAX_INBOX_ENTRIES);
    entries.forEach((entry) => processed.add(entry.id));
    return { entries, processedIds: processed };
  } catch {
    return { entries: [], processedIds: processed };
  }
}

export type IntelligenceSnapshot = {
  version: 1;
  generatedAt: string;
  dateKey: string;
  studyNow: { line: string; reason: string } | null;
  due: Array<{ title: string; classCode: string; dueDate: string; daysUntil: number }>;
  classes: Array<{ id: string; code: string; name: string }>;
  deadlines: Array<{ id: string; title: string; classCode: string; dueDate: string; kind: "task" | "exam" }>;
};

/** JSON-serializable snapshot written to the App Group for intents and Spotlight. */
export function intelligenceSnapshot(data: AppData, brief: DailyBrief | null, now: Date): IntelligenceSnapshot {
  const today = dateKey(now);
  const active = activeSemesterData(data);
  const codeFor = new Map(active.classes.map((klass) => [klass.id, klass.code]));
  const openTasks = active.tasks
    .filter((task) => !task.done && !task.missing && isValidDateInput(task.dueDate))
    .map((task) => ({ task, daysUntil: diffDaysKey(today, task.dueDate) }));
  const due = openTasks
    .filter((entry) => entry.daysUntil >= -7)
    .sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate) || a.task.id.localeCompare(b.task.id))
    .slice(0, 8)
    .map(({ task, daysUntil }) => ({ title: cleanString(task.title, 120), classCode: codeFor.get(task.classId) || "", dueDate: task.dueDate, daysUntil }));
  const deadlines = [
    ...openTasks
      .filter((entry) => entry.daysUntil >= 0)
      .map(({ task }) => ({ id: task.id, title: cleanString(task.title, 120), classCode: codeFor.get(task.classId) || "", dueDate: task.dueDate, kind: "task" as const })),
    ...active.exams
      .filter((exam) => typeof exam.score !== "number" && isValidDateInput(exam.dueDate) && exam.dueDate >= today)
      .map((exam) => ({ id: exam.id, title: cleanString(exam.title, 120), classCode: codeFor.get(exam.classId) || "", dueDate: exam.dueDate, kind: "exam" as const })),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))
    .slice(0, 60);
  const studyNow = brief && brief.dateKey === today ? { line: cleanString(brief.line, 160), reason: cleanString(brief.reason, 200) } : null;
  return {
    version: 1,
    generatedAt: now.toISOString(),
    dateKey: today,
    studyNow,
    due,
    classes: active.classes.map((klass) => ({ id: klass.id, code: klass.code, name: klass.name })),
    deadlines,
  };
}
