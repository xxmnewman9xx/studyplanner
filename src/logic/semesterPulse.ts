import {
  Assignment,
  Course,
  FocusSession,
  ParsedImport,
  Semester
} from "../models";
import {
  daysUntil,
  getAssignmentCompletionStats,
  getFocusCompletionStats,
  getNeedsReview,
  getWeekLoad,
  isValidDeadline
} from "./planner";
import type { StudentLifeContext } from "./studentLifeDepth";

export type SemesterPulseStatus =
  | "Ahead"
  | "On Track"
  | "Building"
  | "Heavy"
  | "At Risk"
  | "Recovery";

export type SemesterForecastState =
  | "Calm"
  | "Building"
  | "Heavy"
  | "Peak"
  | "Recovery";

export type SemesterPulseSignal = {
  score: number;
  status: SemesterPulseStatus;
  trend: number;
  trendLabel: string;
  topReason: string;
  nextAction: string;
  supportReason: string;
  forecastState: SemesterForecastState;
  peakLabel: string;
  topRisk: string;
  freeTime: string;
  examPressure: string;
  workloadPressure: string;
  confidence: string;
  classRisk?: {
    course: Course;
    openCount: number;
    riskScore: number;
  };
  wins: string[];
  bars: number[];
  progress: number;
  reviewedOpenCount: number;
  openCount: number;
  reviewCount: number;
  heavyDayCount: number;
};

type SemesterPulseInput = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  focusSessions?: FocusSession[];
  parsedImports?: ParsedImport[];
  studentLife?: StudentLifeContext;
  now?: Date;
};

const maxPulseScore = 98;
const minPulseScore = 18;

export function buildSemesterPulseSignal({
  assignments,
  courses,
  semester,
  focusSessions = [],
  parsedImports = [],
  studentLife,
  now = new Date()
}: SemesterPulseInput): SemesterPulseSignal {
  const active = assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived");
  const trustedOpen = active.filter((assignment) => !assignment.needsReview && !assignment.duplicateOf && isValidDeadline(assignment.dueAt));
  const reviewItems = getNeedsReview(assignments);
  const weekLoad = getWeekLoad(trustedOpen, now);
  const weekScore = weekLoad.reduce((sum, day) => sum + day.score, 0);
  const heavyDays = weekLoad.filter((day) => day.heavy);
  const peakDay = weekLoad.slice().sort((left, right) => right.score - left.score)[0];
  const completionStats = getAssignmentCompletionStats(
    assignments.filter((assignment) => assignment.status !== "archived" && !assignment.needsReview && !assignment.duplicateOf)
  );
  const focusStats = getFocusCompletionStats(focusSessions, now);
  const doneThisWeek = assignments.filter((assignment) => assignment.status === "done" && isThisWeek(assignment.updatedAt || assignment.dueAt, now)).length;
  const overdue = trustedOpen.filter((assignment) => daysUntil(assignment.dueAt, now) < 0);
  const dueSoon = trustedOpen.filter((assignment) => {
    const days = daysUntil(assignment.dueAt, now);
    return Number.isFinite(days) && days >= 0 && days <= 2;
  });
  const examsSoon = trustedOpen.filter((assignment) => {
    const days = daysUntil(assignment.dueAt, now);
    return assignment.kind === "exam" && Number.isFinite(days) && days >= 0 && days <= 14;
  });
  const nextAssignment = trustedOpen.slice().sort(sortByDueDate)[0];
  const nextExam = examsSoon.slice().sort(sortByDueDate)[0] || trustedOpen.filter((assignment) => assignment.kind === "exam").sort(sortByDueDate)[0];
  const topClassRisk = buildClassRisk(courses, trustedOpen, now);
  const reviewedImportCount = parsedImports.filter((item) => item.status === "reviewed" || item.status === "applied").length;
  const widgetWatchMemory = (studentLife?.memory.featureVisits.widgets || 0) + (studentLife?.memory.featureVisits.watch || 0);
  const focusBoost = Math.min(7, Math.round(focusStats.completedMinutesToday / 18) + Math.min(3, studentLife?.memory.focus.completedSessions || 0));
  const completionBoost = Math.round(completionStats.progress * 13);
  const momentumBoost = Math.min(6, doneThisWeek * 2) + Math.min(3, reviewedImportCount) + Math.min(2, Math.floor(widgetWatchMemory / 6));
  const pressurePenalty =
    overdue.length * 12 +
    dueSoon.length * 4 +
    examsSoon.length * 4 +
    heavyDays.length * 6 +
    reviewItems.length * 3 +
    Math.max(0, Math.round((weekScore - 13) / 2));
  const semesterRunway = semesterRunwayScore(semester, now);
  const rawScore = active.length === 0
    ? 94
    : 76 + completionBoost + focusBoost + momentumBoost + semesterRunway - pressurePenalty;
  const score = clamp(Math.round(rawScore), minPulseScore, maxPulseScore);
  const trend = buildTrend(score, completionStats.progress, doneThisWeek, overdue.length, heavyDays.length, studentLife, now);
  const status = statusForPulse(score, active.length, overdue.length, heavyDays.length, examsSoon.length, dueSoon.length, reviewItems.length);
  const forecastState = forecastStateForPulse(status, active.length, overdue.length, heavyDays.length, examsSoon.length, dueSoon.length, reviewItems.length);
  const topReason = buildTopReason({
    reviewCount: reviewItems.length,
    overdue,
    dueSoon,
    nextExam,
    heavyDay: heavyDays[0],
    completionProgress: completionStats.progress,
    now
  });
  const nextAction = buildNextAction({
    reviewCount: reviewItems.length,
    overdue,
    nextExam,
    nextAssignment,
    topClassRisk,
    now
  });
  const supportReason = topClassRisk
    ? `${topClassRisk.course.code || topClassRisk.course.name} is the class pulling hardest.`
    : reviewItems.length > 0
      ? "Review confidence is limiting the Pulse."
      : "Workload pressure is spread across the week.";

  return {
    score,
    status,
    trend,
    trendLabel: trend === 0 ? "steady this week" : `${trend > 0 ? "+" : ""}${trend} this week`,
    topReason,
    nextAction,
    supportReason,
    forecastState,
    peakLabel: peakDay && peakDay.score > 0 ? `${peakDay.label} peak` : "No peak day",
    topRisk: topClassRisk ? `${topClassRisk.course.code || topClassRisk.course.name}: ${topClassRisk.openCount} open` : topReason,
    freeTime: heavyDays.length === 0 ? "Breathing room this week" : `${Math.max(0, 7 - heavyDays.length)} lighter days`,
    examPressure: examsSoon.length === 0 ? "No exams in 14 days" : `${examsSoon.length} exam${examsSoon.length === 1 ? "" : "s"} in 14 days`,
    workloadPressure: `${heavyDays.length} heavy day${heavyDays.length === 1 ? "" : "s"} / ${trustedOpen.length} open`,
    confidence: reviewItems.length === 0 ? "Reviewed data trusted" : `${reviewItems.length} item${reviewItems.length === 1 ? "" : "s"} need review`,
    classRisk: topClassRisk,
    wins: buildWins({
      doneThisWeek,
      focusMinutes: focusStats.completedMinutesToday,
      trend,
      heavyDayCount: heavyDays.length,
      reviewCount: reviewItems.length,
      openCount: active.length,
      reviewedImportCount
    }),
    bars: weekLoad.map((day) => day.score),
    progress: score / 100,
    reviewedOpenCount: trustedOpen.length,
    openCount: active.length,
    reviewCount: reviewItems.length,
    heavyDayCount: heavyDays.length
  };
}

export function pulseStatusColor(status: SemesterPulseStatus) {
  if (status === "Ahead") return "#22C55E";
  if (status === "On Track") return "#21B8A7";
  if (status === "Building") return "#1476FF";
  if (status === "Heavy") return "#FF9500";
  if (status === "At Risk") return "#FF3B30";
  return "#8B3DFF";
}

export function forecastStateColor(state: SemesterForecastState) {
  if (state === "Calm") return "#21B8A7";
  if (state === "Building") return "#1476FF";
  if (state === "Heavy") return "#FF9500";
  if (state === "Peak") return "#FF3B30";
  return "#8B3DFF";
}

function statusForPulse(
  score: number,
  activeCount: number,
  overdueCount: number,
  heavyDayCount: number,
  examsSoonCount: number,
  dueSoonCount: number,
  reviewCount: number
): SemesterPulseStatus {
  if (activeCount === 0) return "Recovery";
  if (overdueCount > 0 || score < 52) return "At Risk";
  if (heavyDayCount >= 3 || examsSoonCount >= 2 || score < 64) return "Heavy";
  if (reviewCount > 0 || dueSoonCount >= 3 || heavyDayCount >= 1 || score < 76) return "Building";
  if (score >= 90) return "Ahead";
  return "On Track";
}

function forecastStateForPulse(
  status: SemesterPulseStatus,
  activeCount: number,
  overdueCount: number,
  heavyDayCount: number,
  examsSoonCount: number,
  dueSoonCount: number,
  reviewCount: number
): SemesterForecastState {
  if (activeCount === 0 || status === "Recovery") return "Recovery";
  if (overdueCount > 0 || heavyDayCount >= 3) return "Peak";
  if (heavyDayCount >= 2 || examsSoonCount >= 2 || status === "Heavy" || status === "At Risk") return "Heavy";
  if (heavyDayCount >= 1 || dueSoonCount >= 2 || reviewCount > 0 || status === "Building") return "Building";
  return "Calm";
}

function buildTrend(
  score: number,
  completionProgress: number,
  doneThisWeek: number,
  overdueCount: number,
  heavyDayCount: number,
  studentLife: StudentLifeContext | undefined,
  now: Date
) {
  const todayKey = dateKeyFromDate(now);
  const previous = studentLife?.memory.forecast.snapshots.find((snapshot) => snapshot.dateKey !== todayKey);
  if (previous) {
    const previousScore = clamp(Math.round(92 - previous.riskScore * 1.7 + completionProgress * 8), minPulseScore, maxPulseScore);
    return clamp(score - previousScore, -18, 18);
  }
  return clamp(Math.round(doneThisWeek * 2 + Math.min(8, (studentLife?.memory.focus.completedSessions || 0) / 2) - overdueCount * 4 - heavyDayCount * 2), -12, 12);
}

function buildTopReason({
  reviewCount,
  overdue,
  dueSoon,
  nextExam,
  heavyDay,
  completionProgress,
  now
}: {
  reviewCount: number;
  overdue: Assignment[];
  dueSoon: Assignment[];
  nextExam?: Assignment;
  heavyDay?: { label: string };
  completionProgress: number;
  now: Date;
}) {
  if (reviewCount > 0) return `${reviewCount} imported item${reviewCount === 1 ? "" : "s"} need review.`;
  if (overdue[0]) return `${shortenPulseTitle(overdue[0].title)} is overdue.`;
  if (nextExam && daysUntil(nextExam.dueAt, now) <= 14) return `${shortenPulseTitle(nextExam.title)} is in ${Math.max(0, daysUntil(nextExam.dueAt, now))} day${daysUntil(nextExam.dueAt, now) === 1 ? "" : "s"}.`;
  if (heavyDay) return `${heavyDay.label} is overloaded.`;
  if (dueSoon[0]) return `${shortenPulseTitle(dueSoon[0].title)} is due soon.`;
  if (completionProgress >= 0.8) return "Most reviewed work is complete.";
  return "Workload is balanced right now.";
}

function buildNextAction({
  reviewCount,
  overdue,
  nextExam,
  nextAssignment,
  topClassRisk,
  now
}: {
  reviewCount: number;
  overdue: Assignment[];
  nextExam?: Assignment;
  nextAssignment?: Assignment;
  topClassRisk?: SemesterPulseSignal["classRisk"];
  now: Date;
}) {
  if (reviewCount > 0) return "Review imported dates.";
  if (overdue[0]) return `Catch up on ${shortenPulseTitle(overdue[0].title)}.`;
  if (nextExam && daysUntil(nextExam.dueAt, now) <= 14) return `Start ${shortCourse(topClassRisk?.course) || "exam prep"} tonight.`;
  if (nextAssignment) return `Start ${shortenPulseTitle(nextAssignment.title)}.`;
  return "Scan or add the next syllabus.";
}

function buildClassRisk(courses: Course[], assignments: Assignment[], now: Date) {
  const ranked = courses
    .map((course) => {
      const courseWork = assignments.filter((assignment) => assignment.courseId === course.id);
      const overdue = courseWork.filter((assignment) => daysUntil(assignment.dueAt, now) < 0).length;
      const exams = courseWork.filter((assignment) => assignment.kind === "exam" && daysUntil(assignment.dueAt, now) <= 14).length;
      const dueSoon = courseWork.filter((assignment) => {
        const days = daysUntil(assignment.dueAt, now);
        return Number.isFinite(days) && days >= 0 && days <= 3;
      }).length;
      return {
        course,
        openCount: courseWork.length,
        riskScore: overdue * 12 + exams * 7 + dueSoon * 4 + courseWork.length * 2
      };
    })
    .filter((item) => item.openCount > 0)
    .sort((left, right) => right.riskScore - left.riskScore);
  return ranked[0];
}

function buildWins({
  doneThisWeek,
  focusMinutes,
  trend,
  heavyDayCount,
  reviewCount,
  openCount,
  reviewedImportCount
}: {
  doneThisWeek: number;
  focusMinutes: number;
  trend: number;
  heavyDayCount: number;
  reviewCount: number;
  openCount: number;
  reviewedImportCount: number;
}) {
  const wins: string[] = [];
  if (openCount === 0) wins.push("You cleared your active schoolwork.");
  if (doneThisWeek > 0) wins.push(`You finished ${doneThisWeek} assignment${doneThisWeek === 1 ? "" : "s"} this week.`);
  if (focusMinutes > 0) wins.push(`You protected ${focusMinutes} focus minute${focusMinutes === 1 ? "" : "s"} today.`);
  if (trend > 0) wins.push(`Your Pulse improved by ${trend} point${trend === 1 ? "" : "s"}.`);
  if (heavyDayCount === 0 && openCount > 0) wins.push("No overloaded days are showing this week.");
  if (reviewCount === 0 && reviewedImportCount > 0) wins.push("Imported work is reviewed and trusted.");
  return wins.length ? wins.slice(0, 3) : ["One reviewed next step keeps the semester moving."];
}

function semesterRunwayScore(semester: Semester, now: Date) {
  if (!isValidDateOnly(semester.startDate) || !isValidDateOnly(semester.endDate)) return 0;
  const start = new Date(`${semester.startDate}T12:00:00`).getTime();
  const end = new Date(`${semester.endDate}T12:00:00`).getTime();
  const current = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const progress = (current - start) / (end - start);
  if (progress < 0.25) return 3;
  if (progress > 0.85) return -2;
  return 1;
}

function isThisWeek(value: string | undefined, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const monday = startOfWeek(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return date >= monday && date <= sunday;
}

function startOfWeek(now: Date) {
  const date = new Date(now);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortByDueDate(left: Assignment, right: Assignment) {
  return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
}

function shortenPulseTitle(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 34 ? `${clean.slice(0, 31)}...` : clean;
}

function shortCourse(course?: Course) {
  if (!course) return "";
  return course.code || course.name.split(/\s+/)[0] || "";
}

function isValidDateOnly(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
