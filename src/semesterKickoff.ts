import type { AppData } from "./types";

export const SEMESTER_KICKOFF_START = "2026-08-24";
export const SEMESTER_KICKOFF_END = "2026-08-31";

export type SemesterKickoffPhase = "upcoming" | "live" | "ended";

export type SemesterKickoffProgress = {
  importComplete: boolean;
  deadlinesReviewed: boolean;
  focusComplete: boolean;
  completedCount: number;
  totalCount: 3;
  isComplete: boolean;
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRealDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDateKey(parsed) === value;
}

export function semesterKickoffPhase(now = new Date()): SemesterKickoffPhase {
  const today = localDateKey(now);
  if (today < SEMESTER_KICKOFF_START) return "upcoming";
  if (today > SEMESTER_KICKOFF_END) return "ended";
  return "live";
}

export function semesterKickoffProgress(
  data: Pick<AppData, "imports" | "tasks" | "exams" | "studyBlocks">,
): SemesterKickoffProgress {
  const importComplete = data.imports.some((item) => item.status === "applied");
  const deadlinesReviewed = importComplete && [
    ...data.tasks.map((item) => item.dueDate),
    ...data.exams.map((item) => item.dueDate),
  ].some(isRealDate);
  const focusComplete = deadlinesReviewed && data.studyBlocks.some((item) => item.completed);
  const completedCount = [importComplete, deadlinesReviewed, focusComplete].filter(Boolean).length;

  return {
    importComplete,
    deadlinesReviewed,
    focusComplete,
    completedCount,
    totalCount: 3,
    isComplete: completedCount === 3,
  };
}
