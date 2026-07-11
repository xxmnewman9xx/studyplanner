import { AppData, ClassItem, ExamItem, ImportCandidate, StudyBlock, TaskItem } from "../types";
import { dateKey } from "../intelligence";

export type RecurrenceScope = "single" | "future";

export function activeSemesterData(data: AppData): AppData {
  const activeClassIds = new Set(data.classes.filter((klass) => !klass.archivedAt).map((klass) => klass.id));
  const hasClasses = data.classes.length > 0;
  const keepClassOwned = (classId: string) => !hasClasses || activeClassIds.has(classId);
  return {
    ...data,
    classes: data.classes.filter((klass) => !klass.archivedAt),
    tasks: data.tasks.filter((task) => keepClassOwned(task.classId)),
    exams: data.exams.filter((exam) => keepClassOwned(exam.classId)),
    notes: data.notes.filter((note) => keepClassOwned(note.classId)),
    reminders: data.reminders.filter((reminder) => keepClassOwned(reminder.classId)),
    studyBlocks: data.studyBlocks.filter((block) => keepClassOwned(block.classId)),
  };
}

export function hasTaskDate(task: Pick<TaskItem, "missing" | "dueDate">) {
  return !task.missing && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate);
}

export function makeOwnershipId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function classColors(index: number) {
  const colorPairs = [
    ["#0A84FF", "#30D158"],
    ["#7B5CFF", "#FF375F"],
    ["#FF9F0A", "#FFD60A"],
    ["#40C8E0", "#0A84FF"],
    ["#30D158", "#40C8E0"],
    ["#FF375F", "#FF9F0A"],
  ];
  return colorPairs[index % colorPairs.length];
}

function timeValue(iso: string) {
  return new Date(`${iso}T12:00:00`).getTime();
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function recurrenceMatches(task: TaskItem, anchor: TaskItem, scope: RecurrenceScope) {
  if (!anchor.recurringId || task.recurringId !== anchor.recurringId) return task.id === anchor.id;
  if (scope === "single") return task.id === anchor.id;
  const anchorIndex = anchor.recurrenceIndex;
  if (typeof anchorIndex === "number" && typeof task.recurrenceIndex === "number") return task.recurrenceIndex >= anchorIndex;
  return timeValue(task.dueDate) >= timeValue(anchor.dueDate);
}

export function applyTaskRecurrencePatch(tasks: TaskItem[], anchor: TaskItem, patch: Partial<TaskItem>, scope: RecurrenceScope) {
  const dateDelta = patch.dueDate && hasTaskDate(anchor) && hasTaskDate({ dueDate: patch.dueDate, missing: patch.missing })
    ? Math.round((timeValue(patch.dueDate) - timeValue(anchor.dueDate)) / 86400000)
    : 0;
  const resolvesUndatedSeries = scope === "future" && anchor.missing && Boolean(patch.dueDate) && patch.missing === false;
  return tasks.map((task) => {
    if (!recurrenceMatches(task, anchor, scope)) return task;
    const isLaterOccurrence = scope === "future" && task.id !== anchor.id;
    const dueDate = isLaterOccurrence
      ? resolvesUndatedSeries && typeof anchor.recurrenceIndex === "number" && typeof task.recurrenceIndex === "number"
        ? addDays(patch.dueDate!, (task.recurrenceIndex - anchor.recurrenceIndex) * 7)
        : dateDelta !== 0 ? addDays(task.dueDate, dateDelta) : task.dueDate
      : patch.dueDate;
    return {
      ...task,
      ...patch,
      id: task.id,
      dueDate: dueDate || task.dueDate,
      recurringId: task.recurringId,
      recurrenceIndex: task.recurrenceIndex,
      recurrenceEndDate: task.recurrenceEndDate,
    };
  });
}

export function deleteTaskRecurrence(tasks: TaskItem[], anchor: TaskItem, scope: RecurrenceScope) {
  return tasks.filter((task) => !recurrenceMatches(task, anchor, scope));
}

export function canMarkStudyBlockMissed(block: StudyBlock, now = new Date()) {
  if (block.completed || block.missed) return false;
  const explicitEnd = block.endsAt ? Date.parse(block.endsAt) : Number.NaN;
  const inferredEnd = block.startsAt ? Date.parse(block.startsAt) + block.minutes * 60_000 : Number.NaN;
  const endTime = Number.isFinite(explicitEnd) ? explicitEnd : inferredEnd;
  if (Number.isFinite(endTime)) return endTime <= now.getTime();
  return Boolean(block.date && block.date < dateKey(now));
}

function norm(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameTitle(left: unknown, right: unknown) {
  const a = norm(left);
  const b = norm(right);
  return a.length > 2 && b.length > 2 && (a === b || a.includes(b) || b.includes(a));
}

export type ReconciliationMatch =
  | { kind: "class"; id: string; label: string; oldDate?: string; newDate?: string }
  | { kind: "task"; id: string; label: string; oldDate?: string; newDate?: string }
  | { kind: "exam"; id: string; label: string; oldDate?: string; newDate?: string };

export function findImportMatch(data: AppData, candidate: ImportCandidate): ReconciliationMatch | null {
  const payload: any = candidate.payload;
  if (candidate.kind === "class") {
    const incomingCode = norm(payload.code || candidate.title);
    const existing = data.classes.find((klass) => !klass.archivedAt && (norm(klass.code) === incomingCode || sameTitle(klass.name, payload.name || candidate.title)));
    return existing ? { kind: "class", id: existing.id, label: existing.code } : null;
  }
  if (candidate.kind === "task") {
    const existing = data.tasks.find((task) => task.classId === (payload.classId || candidate.classId) && sameTitle(task.title, payload.title || candidate.title));
    return existing ? { kind: "task", id: existing.id, label: existing.title, oldDate: existing.missing ? "Awaiting Date" : existing.dueDate, newDate: payload.missing ? "Awaiting Date" : payload.dueDate } : null;
  }
  if (candidate.kind === "exam") {
    const existing = data.exams.find((exam) => exam.classId === (payload.classId || candidate.classId) && sameTitle(exam.title, payload.title || candidate.title));
    return existing ? { kind: "exam", id: existing.id, label: existing.title, oldDate: existing.dueDate, newDate: payload.dueDate } : null;
  }
  return null;
}

export function applyImportUpdateToData(data: AppData, candidate: ImportCandidate, match: ReconciliationMatch): AppData {
  const payload: any = candidate.payload;
  if (match.kind === "class") {
    return {
      ...data,
      classes: data.classes.map((klass) => klass.id === match.id ? { ...klass, ...(payload as Partial<ClassItem>), id: klass.id, updatedAt: new Date().toISOString() } as ClassItem : klass),
    };
  }
  if (match.kind === "task") {
    return {
      ...data,
      tasks: data.tasks.map((task) => task.id === match.id ? { ...task, ...(payload as Partial<TaskItem>), id: task.id, source: `${task.source} · reconciled` } : task),
    };
  }
  return {
    ...data,
    exams: data.exams.map((exam) => exam.id === match.id ? { ...exam, ...(payload as Partial<ExamItem>), id: exam.id } : exam),
  };
}
