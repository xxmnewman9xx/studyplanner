// Study Now (F4): code picks what to study, templates write the line, and the
// on-device model may only rephrase the one-sentence reason.

import { buildDashboardSnapshot, buildSemesterSnapshot, dateKey, daysUntilDate } from "../intelligence";
import { activeSemesterData } from "../ownership/semesterOwnership";
import { AppData, ExamItem, StudyBlock, TaskItem } from "../types";
import { buildBriefFacts } from "./context";
import { isValidDateInput, noonFromKey } from "./dateKeys";
import { cleanString, normalizeText } from "./text";
import { DailyBrief, ModelRunner, StudyNowCandidate } from "./types";
import { validateDailyBrief } from "./validators";

export const MAX_STUDY_NOW_CANDIDATES = 5;

/** Injected copy function: `t(key, englishFallback, vars)`. */
export type CopyFn = (key: string, fallback: string, vars?: Record<string, string | number>) => string;

/** Every copy key this module uses, with its English fallback. */
export const STUDY_NOW_COPY = {
  line: ["ai.brief.line", "Now: {minutes} min {title}"],
  examIn: ["ai.brief.exam_in", ", exam in {days} days"],
  examTomorrow: ["ai.brief.exam_tomorrow", ", exam tomorrow"],
  examToday: ["ai.brief.exam_today", ", exam today"],
  reasonExam: ["ai.brief.reason_exam", "Your exam is {days} days out. Short sessions now beat a late cram."],
  reasonExamSoon: ["ai.brief.reason_exam_soon", "Your exam is close. One focused pass now matters most."],
  reasonTaskDue: ["ai.brief.reason_task_due", "It's due in {days} days. Starting now keeps it small."],
  reasonTaskTomorrow: ["ai.brief.reason_task_tomorrow", "It's due tomorrow. Starting now keeps it small."],
  reasonTaskToday: ["ai.brief.reason_task_today", "It's due today. Finish it first."],
  reasonTaskOverdue: ["ai.brief.reason_task_overdue", "It's overdue. Clearing it first takes the pressure off."],
  reasonNote: ["ai.brief.reason_note", "A quick recall pass keeps these notes fresh."],
  reasonBlock: ["ai.brief.reason_block", "It's already on today's plan."],
} as const;

function daysUntilKey(key: string | undefined, now: Date) {
  if (!key || !isValidDateInput(key)) return undefined;
  const due = noonFromKey(key);
  return due ? daysUntilDate(due, now) : undefined;
}

function classCodeFor(data: AppData, classId?: string) {
  return classId ? data.classes.find((klass) => klass.id === classId)?.code : undefined;
}

function upcomingExam(exam: ExamItem | undefined, now: Date) {
  if (!exam || typeof exam.score === "number") return undefined;
  const days = daysUntilKey(exam.dueDate, now);
  return typeof days === "number" && days >= 0 ? { exam, days } : undefined;
}

function openTask(task: TaskItem | undefined) {
  return task && !task.done ? task : undefined;
}

function candidateFromBlock(block: StudyBlock, data: AppData, now: Date, prefix: string): StudyNowCandidate | null {
  const exam = block.examId ? upcomingExam(data.exams.find((item) => item.id === block.examId), now) : undefined;
  const task = block.taskId ? openTask(data.tasks.find((item) => item.id === block.taskId)) : undefined;
  if (block.examId && !exam) return null;
  if (block.taskId && !task) return null;
  const title = cleanString(block.title, 120);
  if (!title) return null;
  const kind: StudyNowCandidate["kind"] = block.examId ? "exam_prep" : block.noteId ? "note_review" : block.taskId ? "task" : "study_block";
  const candidate: StudyNowCandidate = {
    id: `${prefix}_${block.id}`,
    kind,
    title,
    minutes: Math.max(5, Math.min(240, Math.round(block.minutes || 25))),
  };
  if (block.classId) candidate.classId = block.classId;
  const code = classCodeFor(data, block.classId);
  if (code) candidate.classCode = code;
  const days = exam ? exam.days : task ? daysUntilKey(task.dueDate, now) : undefined;
  if (typeof days === "number") candidate.daysUntil = days;
  if (block.taskId) candidate.taskId = block.taskId;
  if (block.examId) candidate.examId = block.examId;
  if (block.noteId) candidate.noteId = block.noteId;
  candidate.blockId = block.id;
  return candidate;
}

function dedupeKey(candidate: StudyNowCandidate) {
  return candidate.examId ? `exam:${candidate.examId}` : candidate.taskId ? `task:${candidate.taskId}` : candidate.noteId ? `note:${candidate.noteId}` : `title:${normalizeText(candidate.title)}`;
}

/**
 * Up to 5 deterministic Study Now picks, in priority order:
 * 1. today's incomplete study blocks tied to the nearest exam,
 * 2. today's other incomplete blocks,
 * 3. the dashboard's recommendedFocus block,
 * 4. per-class study recommendations (nearest exam, else nearest open task).
 */
export function studyNowCandidates(data: AppData, now: Date): StudyNowCandidate[] {
  try {
    const active = activeSemesterData(data);
    if (!active.classes.length && !active.tasks.length && !active.exams.length && !active.studyBlocks.length) return [];
    const today = dateKey(now);
    const out: StudyNowCandidate[] = [];
    const keys = new Set<string>();
    const push = (candidate: StudyNowCandidate | null) => {
      if (!candidate || out.length >= MAX_STUDY_NOW_CANDIDATES) return;
      const key = dedupeKey(candidate);
      if (keys.has(key)) return;
      keys.add(key);
      out.push(candidate);
    };

    const todays = active.studyBlocks
      .filter((block) => block.date === today && !block.completed && !block.missed)
      .map((block, index) => ({ block, index, exam: block.examId ? upcomingExam(active.exams.find((exam) => exam.id === block.examId), now) : undefined }));
    todays
      .filter((entry) => entry.exam)
      .sort((a, b) => (a.exam!.days - b.exam!.days) || a.index - b.index)
      .forEach((entry) => push(candidateFromBlock(entry.block, active, now, "sn_block")));
    todays.filter((entry) => !entry.exam).forEach((entry) => push(candidateFromBlock(entry.block, active, now, "sn_block")));

    // Engine snapshots are wrapped separately so a failure in one never hides today's blocks.
    const safe = <T,>(build: () => T, fallback: T) => {
      try {
        return build();
      } catch {
        return fallback;
      }
    };
    const focus = safe(() => buildDashboardSnapshot(active, now).recommendedFocus, undefined);
    if (focus && !focus.completed) push(candidateFromBlock(focus, active, now, "sn_focus"));

    const recommendations = safe(() => buildSemesterSnapshot(active, now).studyRecommendations, []);
    for (const rec of recommendations) {
      const exam = active.exams
        .filter((item) => item.classId === rec.classId)
        .map((item) => upcomingExam(item, now))
        .filter((entry): entry is { exam: ExamItem; days: number } => Boolean(entry))
        .sort((a, b) => a.days - b.days || a.exam.id.localeCompare(b.exam.id))[0];
      const code = classCodeFor(active, rec.classId);
      if (exam) {
        const candidate: StudyNowCandidate = { id: `sn_rec_${rec.id}`, kind: "exam_prep", title: cleanString(exam.exam.title, 120), minutes: rec.minutes, daysUntil: exam.days, examId: exam.exam.id, classId: rec.classId };
        if (code) candidate.classCode = code;
        push(candidate);
        continue;
      }
      const task = active.tasks
        .filter((item) => item.classId === rec.classId && !item.done && isValidDateInput(item.dueDate))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id))[0];
      if (task) {
        const candidate: StudyNowCandidate = { id: `sn_rec_${rec.id}`, kind: "task", title: cleanString(task.title, 120), minutes: rec.minutes, taskId: task.id, classId: rec.classId };
        const days = daysUntilKey(task.dueDate, now);
        if (typeof days === "number") candidate.daysUntil = days;
        if (code) candidate.classCode = code;
        push(candidate);
      }
    }
    return out.filter((candidate) => candidate.title);
  } catch {
    return [];
  }
}

const englishCopy: CopyFn = (_key, fallback, vars) =>
  fallback.replace(/\{(\w+)\}/g, (match, name) => (vars && name in vars ? String(vars[name]) : match));

function lineFor(candidate: StudyNowCandidate, t: CopyFn) {
  const [lineKey, lineFallback] = STUDY_NOW_COPY.line;
  let line = t(lineKey, lineFallback, { minutes: candidate.minutes, title: candidate.title });
  if (candidate.kind === "exam_prep" && typeof candidate.daysUntil === "number" && candidate.daysUntil >= 0) {
    const days = candidate.daysUntil;
    const [key, fallback] = days === 0 ? STUDY_NOW_COPY.examToday : days === 1 ? STUDY_NOW_COPY.examTomorrow : STUDY_NOW_COPY.examIn;
    line += t(key, fallback, { days });
  }
  return line;
}

function reasonFor(candidate: StudyNowCandidate, t: CopyFn) {
  const days = candidate.daysUntil;
  const pick = (entry: readonly [string, string], vars?: Record<string, string | number>) => t(entry[0], entry[1], vars);
  if (candidate.kind === "exam_prep" && typeof days === "number") {
    return days <= 1 ? pick(STUDY_NOW_COPY.reasonExamSoon) : pick(STUDY_NOW_COPY.reasonExam, { days });
  }
  if (candidate.kind === "task" && typeof days === "number") {
    if (days < 0) return pick(STUDY_NOW_COPY.reasonTaskOverdue);
    if (days === 0) return pick(STUDY_NOW_COPY.reasonTaskToday);
    if (days === 1) return pick(STUDY_NOW_COPY.reasonTaskTomorrow);
    return pick(STUDY_NOW_COPY.reasonTaskDue, { days });
  }
  if (candidate.kind === "note_review") return pick(STUDY_NOW_COPY.reasonNote);
  return pick(STUDY_NOW_COPY.reasonBlock);
}

/** Template-only brief for the top candidate (null when there is nothing to study). */
export function templateBrief(candidates: StudyNowCandidate[], data: AppData, now: Date, t: CopyFn = englishCopy, focusIndex = 0): DailyBrief | null {
  const candidate = candidates[focusIndex] || candidates[0];
  if (!candidate) return null;
  return { dateKey: dateKey(now), candidate, line: lineFor(candidate, t), reason: reasonFor(candidate, t), origin: "template" };
}

export type BriefOptions = { signal?: AbortSignal; timeoutMs?: number; locale?: string };

/**
 * Orchestrator: skips the model with ≤ 1 candidate; otherwise accepts the
 * model's focus pick and reason only when they pass `validateDailyBrief`.
 * The line is always template-built from the chosen candidate's facts.
 */
export async function briefWithModel(
  candidates: StudyNowCandidate[],
  data: AppData,
  now: Date,
  t: CopyFn,
  runner: ModelRunner | null,
  options: BriefOptions = {}
): Promise<DailyBrief | null> {
  const template = templateBrief(candidates, data, now, t);
  if (!template || !runner || candidates.length <= 1) return template;
  const facts = buildBriefFacts(candidates, data, now);
  try {
    const result = await runner("dailyBrief", { facts, count: Math.min(candidates.length, MAX_STUDY_NOW_CANDIDATES), locale: options.locale }, { signal: options.signal, timeoutMs: options.timeoutMs });
    if (!result || !result.ok) return template;
    const validated = validateDailyBrief(result.value, candidates.slice(0, MAX_STUDY_NOW_CANDIDATES), facts);
    if (!validated) return template;
    const picked = templateBrief(candidates, data, now, t, validated.focusIndex) || template;
    return { ...picked, reason: validated.body, origin: "onDevice" };
  } catch {
    return template;
  }
}
