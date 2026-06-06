import { daysUntilExam, daysUntilTask } from "./intelligence";
import { AppData, HealthDimension, SemanticColorState, SemesterAction, SemesterSnapshot } from "./types";

export type SemesterHealthBand = {
  label: "On Track" | "Attention Needed" | "Recovery Needed" | "Immediate Action";
  colorState: SemanticColorState;
};

export type SemesterNarrative = {
  state: string;
  healthLabel: SemesterHealthBand["label"];
  colorState: SemanticColorState;
  reason: string;
  primaryDriver: string;
  nextMoveLabel: string;
  nextMoveDetail: string;
  pressureLabel: string;
  widgetLabel: string;
  notesNudge: string;
  importSummary: {
    classes: number;
    assignments: number;
    exams: number;
    notes: number;
    highPressureWeeks: number;
    firstRecommendation: string;
  };
  dimensions: { key: string; label: string; score: number; trend: string; reason: string; colorState: SemanticColorState }[];
};

export function healthBand(score: number): SemesterHealthBand {
  if (score >= 85) return { label: "On Track", colorState: "green" };
  if (score >= 70) return { label: "Attention Needed", colorState: "yellow" };
  if (score >= 55) return { label: "Recovery Needed", colorState: "orange" };
  return { label: "Immediate Action", colorState: "red" };
}

function trendSymbol(trend: HealthDimension["trend"]) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function firstName(action?: SemesterAction) {
  if (!action) return "";
  return action.label
    .replace(/\s+next$/i, "")
    .replace(/\s+exam mode$/i, " Review")
    .replace(/^Risk radar:\s*/i, "")
    .trim();
}

function countHighPressureWeeks(semester: SemesterSnapshot) {
  return semester.pressureForecast.weekLoads.filter((load) => load >= 72).length;
}

function shortDay(dateKey?: string) {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function dimensionCopy(label: string, verb: string) {
  if (label === "Grades") return `Grades are ${verb}.`;
  return `${label} is ${verb}.`;
}

export function buildSemesterNarrative(data: AppData, semester: SemesterSnapshot): SemesterNarrative {
  const score = semester.semesterHealth.overallScore;
  const band = healthBand(score);
  const hasCoursework = data.classes.length || data.tasks.length || data.exams.length;
  const activeTasks = data.tasks.filter((task) => !task.done);
  const overdue = activeTasks.filter((task) => daysUntilTask(task) < 0);
  const dueSoon = activeTasks.filter((task) => daysUntilTask(task) >= 0 && daysUntilTask(task) <= 2);
  const upcomingExam = data.exams
    .filter((exam) => daysUntilExam(exam) >= 0)
    .sort((a, b) => daysUntilExam(a) - daysUntilExam(b))[0];
  const upcomingExamDays = upcomingExam ? daysUntilExam(upcomingExam) : 99;
  const lowPrep = semester.semesterHealth.dimensions.preparedness.score < 72;
  const weakest = Object.values(semester.semesterHealth.dimensions).sort((a, b) => a.score - b.score)[0];
  const best = Object.values(semester.semesterHealth.dimensions).sort((a, b) => b.score - a.score)[0];
  const topAction = semester.recommendedActions[0];
  const actionName = firstName(topAction);

  if (!hasCoursework) {
    return {
      state: "Add Syllabus",
      healthLabel: band.label,
      colorState: "graphite",
      reason: "No semester loaded.",
      primaryDriver: "No semester loaded.",
      nextMoveLabel: "Scan syllabus",
      nextMoveDetail: "Build your semester first.",
      pressureLabel: "No schedule yet",
      widgetLabel: "Add Syllabus",
      notesNudge: "Import syllabus first.",
      importSummary: {
        classes: 0,
        assignments: 0,
        exams: 0,
        notes: 0,
        highPressureWeeks: 0,
        firstRecommendation: "Scan syllabus",
      },
      dimensions: Object.values(semester.semesterHealth.dimensions).map((dim) => ({
        key: dim.key,
        label: dim.label,
        score: dim.score,
        trend: trendSymbol(dim.trend),
        reason: dim.reason,
        colorState: dim.colorState,
      })),
    };
  }

  let state: string = band.label;
  if (upcomingExamDays <= 7 && lowPrep) state = "Exam Week";
  else if (overdue.length) state = "Recovery Needed";
  else if (semester.pressureForecast.overloadedDays.length) state = "Pressure Building";
  else if (lowPrep && !data.notes.length) state = "Attention Needed";
  else if (score >= 85 && !dueSoon.length) state = "Ahead This Week";

  const primaryDriver = overdue.length
    ? `${overdue.length} overdue ${overdue.length === 1 ? "item" : "items"} reducing health.`
    : upcomingExamDays <= 7 && lowPrep
      ? "Exam prep is light."
      : lowPrep && !data.notes.length
        ? "Preparedness needs notes."
        : lowPrep
          ? "Preparedness needs attention."
      : semester.pressureForecast.overloadedDays.length
        ? "Pressure is clustering this week."
        : weakest.trend === "down"
          ? dimensionCopy(weakest.label, "slipping")
          : best.trend === "up"
            ? dimensionCopy(best.label, "improving")
            : "Workload is stable.";

  const nextMoveLabel = overdue[0]
    ? `Recover ${overdue[0].title}`
    : upcomingExamDays <= 7
      ? `Prepare for ${upcomingExam.title}`
      : lowPrep && !data.notes.length
        ? "Scan notes"
        : actionName || semester.semesterHealth.nextBestAction || "Stay consistent";

  const nextMoveDetail = overdue[0]
    ? "Clear the oldest risk first."
    : upcomingExamDays <= 7
      ? "One review block protects preparedness."
      : lowPrep && !data.notes.length
        ? "Raise preparedness before exams."
        : topAction?.detail || semester.semesterHealth.reason;

  const overloadedDay = shortDay(semester.pressureForecast.overloadedDays[0]);
  const pressureLabel = overloadedDay
    ? `Heavy ${overloadedDay}`
    : dueSoon.length >= 3
      ? "Deadline cluster"
      : upcomingExamDays <= 7
        ? "Exam week"
        : semester.pressureForecast.label;

  const notesNudge = !data.notes.length
    ? "Scan notes before the exam."
    : lowPrep
      ? "Weak topics need notes."
      : "Notes are supporting readiness.";
  const displayHealthLabel: SemesterHealthBand["label"] =
    state === "Attention Needed" || state === "Exam Week" || state === "Pressure Building"
      ? "Attention Needed"
      : state === "Recovery Needed"
        ? "Recovery Needed"
        : state === "Immediate Action"
          ? "Immediate Action"
          : band.label;
  const displayColorState: SemanticColorState =
    state === "Exam Week"
      ? "purple"
      : state === "Pressure Building"
        ? "orange"
        : state === "Attention Needed"
          ? "yellow"
          : state === "Recovery Needed"
            ? "orange"
            : state === "Immediate Action"
              ? "red"
              : band.colorState;

  return {
    state,
    healthLabel: displayHealthLabel,
    colorState: displayColorState,
    reason: semester.semesterHealth.reason,
    primaryDriver,
    nextMoveLabel,
    nextMoveDetail,
    pressureLabel,
    widgetLabel: state,
    notesNudge,
    importSummary: {
      classes: data.classes.length,
      assignments: data.tasks.length,
      exams: data.exams.length,
      notes: data.notes.length,
      highPressureWeeks: countHighPressureWeeks(semester),
      firstRecommendation: nextMoveLabel,
    },
    dimensions: Object.values(semester.semesterHealth.dimensions).map((dim) => ({
      key: dim.key,
      label: dim.label,
      score: dim.score,
      trend: trendSymbol(dim.trend),
      reason: dim.reason,
      colorState: dim.colorState,
    })),
  };
}
