import { Platform } from "react-native";
import { AppData, ClassItem, TaskItem, WidgetDensity, WidgetKey, WidgetThemeChoice } from "./types";
import { formatDue } from "./seed";
import { buildSemesterSnapshot, colorForState, daysUntilTask } from "./intelligence";
import { buildSemesterNarrative } from "./semesterNarrative";

export type NativeWidgetKind = "today" | "upcoming" | "week" | "classProgress";

export type NativeWidgetItem = {
  id: string;
  title: string;
  courseCode: string;
  courseColor: string;
  dueLabel: string;
};

export type NativeWidgetSnapshot = {
  version: 1;
  kind: NativeWidgetKind;
  generatedAt: string;
  headline: string;
  value: string;
  detail: string;
  footnote: string;
  accentColor: string;
  backgroundColor: string;
  styleLabel: string;
  densityLabel: string;
  progress: number;
  openURL: string;
  items: NativeWidgetItem[];
  weekLabels?: string[];
  weekCounts?: number[];
};

export type NativeWidgetSnapshots = Record<NativeWidgetKind, NativeWidgetSnapshot>;

export type SemesterLoop = {
  score: number;
  status: "charging" | "steady" | "strained";
  label: string;
  detail: string;
  rings: { label: string; value: number; color: string }[];
};

export type WidgetSyncStatus = {
  state: "synced" | "skipped" | "unavailable" | "error";
  message: string;
  updatedAt?: string;
};

export const widgetThemeOptions: { id: WidgetThemeChoice; label: string; accent: string; background: string }[] = [
  { id: "liquidLight", label: "Liquid Light", accent: "#0A84FF", background: "#F9FAFC" },
  { id: "graphite", label: "Graphite", accent: "#111111", background: "#F4F4F5" },
  { id: "campus", label: "Campus", accent: "#2F80ED", background: "#EEF6FF" },
  { id: "focus", label: "Focus", accent: "#34C759", background: "#F1FFF6" },
  { id: "contrast", label: "High Contrast", accent: "#000000", background: "#FFFFFF" },
];

function activeTheme(data: AppData) {
  return widgetThemeOptions.find((option) => option.id === data.prefs.widgetTheme) || widgetThemeOptions[0];
}

function activeTasks(data: AppData) {
  return data.tasks.filter((task) => !task.done).slice().sort((a, b) => daysUntilTask(a) - daysUntilTask(b));
}

function classFor(data: AppData, classId?: string): ClassItem {
  return data.classes.find((klass) => klass.id === classId) || data.classes[0] || {
    id: "empty",
    code: "Start",
    name: "No semester yet",
    professor: "",
    room: "Scan syllabus",
    days: "",
    time: "",
    next: "",
    health: 0,
    grade: "Add",
    color: "#111111",
    color2: "#111111",
    icon: "scan",
  };
}

function itemFor(data: AppData, task: TaskItem): NativeWidgetItem {
  const klass = classFor(data, task.classId);
  return {
    id: task.id,
    title: task.title,
    courseCode: klass.code,
    courseColor: "#111111",
    dueLabel: formatDue(daysUntilTask(task)),
  };
}

function itemLimit(density: WidgetDensity) {
  if (density === "quiet") return 1;
  if (density === "detailed") return 4;
  return 2;
}

function liquidBackgroundFor(state: string) {
  if (state === "green") return "#F1FFF6";
  if (state === "yellow") return "#FFFBEA";
  if (state === "orange") return "#FFF6EA";
  if (state === "red") return "#FFF1F1";
  if (state === "purple") return "#F7F0FF";
  if (state === "blue") return "#EEF7FF";
  return "#F9FAFC";
}

export function buildSemesterLoop(data: AppData): SemesterLoop {
  const snapshot = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, snapshot);
  const score = snapshot.semesterHealth.overallScore;
  const status = score >= 82 ? "charging" : score >= 64 ? "steady" : "strained";
  return {
    score,
    status,
    label: narrative.widgetLabel,
    detail: narrative.primaryDriver,
    rings: [
      { label: "Grades", value: snapshot.semesterHealth.dimensions.grades.score / 100, color: colorForState(snapshot.semesterHealth.dimensions.grades.colorState) },
      { label: "Prep", value: snapshot.semesterHealth.dimensions.preparedness.score / 100, color: colorForState(snapshot.semesterHealth.dimensions.preparedness.colorState) },
      { label: "Work", value: snapshot.semesterHealth.dimensions.workload.score / 100, color: colorForState(snapshot.semesterHealth.dimensions.workload.colorState) },
    ],
  };
}

export function buildNativeWidgetSnapshots(data: AppData): NativeWidgetSnapshots {
  const now = new Date().toISOString();
  const density = data.prefs.widgetDensity || "balanced";
  const locked = !data.prefs.premium;
  const empty = !(data.classes.length || data.tasks.length || data.exams.length);
  if (locked || empty) {
    const headline = locked ? "Build semester" : "Scan syllabus";
    const value = locked ? "Locked" : "Start";
    const detail = locked ? "Preview only" : "Semester";
    const footnote = locked ? "Unlock to apply your syllabus." : "Syllabus in. Semester out.";
    const base = {
      version: 1 as const,
      generatedAt: now,
      headline,
      value,
      detail,
      footnote,
      accentColor: "#111111",
      backgroundColor: "#F9FAFC",
      styleLabel: "Liquid",
      densityLabel: "quiet",
      progress: 0,
      openURL: "studyplanner://today",
      items: [] as NativeWidgetItem[],
    };
    return {
      today: { ...base, kind: "today" },
      upcoming: { ...base, kind: "upcoming", headline: locked ? "Unlock plan" : "Build plan", detail: locked ? "Required" : "Ready" },
      week: { ...base, kind: "week", headline: "No schedule", weekLabels: ["M", "T", "W", "T", "F", "S", "S"], weekCounts: [0, 0, 0, 0, 0, 0, 0] },
      classProgress: { ...base, kind: "classProgress", headline: "No classes", detail: "Import first" },
    };
  }
  const snapshot = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, snapshot);
  const loop = buildSemesterLoop(data);
  const tasks = activeTasks(data);
  const limit = itemLimit(density);
  const today = tasks.filter((task) => daysUntilTask(task) <= 0).slice(0, limit).map((task) => itemFor(data, task));
  const upcoming = tasks.slice(0, limit + 1).map((task) => itemFor(data, task));
  const classFocus = classFor(data, data.prefs.widgetClassId);
  const classTasks = tasks.filter((task) => task.classId === classFocus.id).slice(0, limit).map((task) => itemFor(data, task));
  const nextAction = snapshot.recommendedActions[0];
  const nextClass = classFor(data);
  const nextTask = tasks[0];
  const weekCounts = snapshot.pressureForecast.weekLoads;
  const overdueCount = tasks.filter((task) => daysUntilTask(task) < 0).length;
  const classPulse = snapshot.classPulses.find((pulse) => pulse.classId === classFocus.id) || snapshot.classPulses[0];

  const semesterAccent = colorForState(snapshot.semesterHealth.colorState);

  const base = {
    version: 1 as const,
    generatedAt: now,
    accentColor: semesterAccent,
    backgroundColor: liquidBackgroundFor(snapshot.semesterHealth.colorState),
    styleLabel: "Liquid Status",
    densityLabel: density,
    openURL: "studyplanner://today",
  };

  return {
    today: {
      ...base,
      kind: "today",
      headline: narrative.widgetLabel,
      value: String(loop.score),
      detail: "Semester Health",
      footnote: narrative.primaryDriver,
      accentColor: semesterAccent,
      backgroundColor: liquidBackgroundFor(snapshot.semesterHealth.colorState),
      progress: loop.score / 100,
      items: today,
    },
    upcoming: {
      ...base,
      kind: "upcoming",
      headline: "Next Move",
      value: narrative.nextMoveLabel,
      detail: nextTask ? classFor(data, nextTask.classId).code : narrative.state,
      footnote: narrative.nextMoveDetail,
      accentColor: nextAction ? colorForState(nextAction.colorState) : overdueCount ? "#FF453A" : "#0A84FF",
      backgroundColor: liquidBackgroundFor(nextAction?.colorState || (overdueCount ? "red" : "blue")),
      progress: Math.max(0, Math.min(1, 1 - overdueCount * 0.18)),
      items: upcoming,
    },
    week: {
      ...base,
      kind: "week",
      headline: narrative.pressureLabel,
      value: narrative.widgetLabel,
      detail: String(loop.score),
      footnote: narrative.primaryDriver,
      accentColor: semesterAccent,
      backgroundColor: liquidBackgroundFor(snapshot.semesterHealth.colorState),
      progress: loop.score / 100,
      items: upcoming.slice(0, 2),
      weekLabels: snapshot.pressureForecast.weekLabels,
      weekCounts,
    },
    classProgress: {
      ...base,
      kind: "classProgress",
      headline: classFocus.code,
      value: classPulse?.forecastLabel || classFocus.grade,
      detail: classPulse?.mode === "unknown" ? "Add grade" : "Forecast",
      footnote: classPulse?.nudge || classTasks[0]?.title || `${classFocus.time} · ${classFocus.room}`,
      accentColor: classPulse ? colorForState(classPulse.colorState) : "#111111",
      backgroundColor: liquidBackgroundFor(classPulse?.colorState || "blue"),
      progress: (classPulse?.forecastScore || Math.round(classFocus.health * 100)) / 100,
      items: classTasks,
    },
  };
}

export async function syncNativeWidgets(data: AppData): Promise<WidgetSyncStatus> {
  if (Platform.OS !== "ios") {
    return { state: "skipped", message: "Native widgets sync on iPhone builds." };
  }

  try {
    const widgets = require("./widgets/StudyPlannerWidgets");
    const snapshots = buildNativeWidgetSnapshots(data);
    widgets.StudyPlannerTodayWidget.updateSnapshot(snapshots.today);
    widgets.StudyPlannerUpcomingWidget.updateSnapshot(snapshots.upcoming);
    widgets.StudyPlannerWeekWidget.updateSnapshot(snapshots.week);
    widgets.StudyPlannerClassProgressWidget.updateSnapshot(snapshots.classProgress);
    const timelines = await Promise.all([
      widgets.StudyPlannerTodayWidget.getTimeline(),
      widgets.StudyPlannerUpcomingWidget.getTimeline(),
      widgets.StudyPlannerWeekWidget.getTimeline(),
      widgets.StudyPlannerClassProgressWidget.getTimeline(),
    ]);
    if (timelines.some((timeline) => !timeline.length)) {
      return { state: "error", message: "Widget timelines did not confirm. Try syncing again.", updatedAt: snapshots.today.generatedAt };
    }
    return { state: "synced", message: "iPhone widgets updated.", updatedAt: snapshots.today.generatedAt };
  } catch (error) {
    return {
      state: "unavailable",
      message: error instanceof Error ? error.message : "Install the native iPhone build to sync widgets.",
    };
  }
}

export function widgetKeyForNativeKind(kind: NativeWidgetKind): WidgetKey {
  if (kind === "today") return "deadline";
  if (kind === "upcoming") return "deadline";
  if (kind === "week") return "health";
  return "nextClass";
}
