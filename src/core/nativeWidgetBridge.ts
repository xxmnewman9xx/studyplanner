import type {
  Assignment,
  AssignmentKind,
  Course,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetBackground,
  WidgetDataMode,
  WidgetKind,
  WidgetLayout,
  WidgetPalette,
  WidgetPreset,
  WidgetTheme,
  WidgetType as NativeWidgetType
} from "../models";
import { syncStudyPlannerWidgets, type WidgetSnapshotInput, type WidgetSyncStatus } from "../services/widgetSnapshot";
import type { Accent, AppState, ClassCourse, Note, Priority, Task, TaskType, WidgetSettings, WidgetType } from "./types";
import { widgetTypes } from "./sampleData";

export type NativeWidgetSyncStatus = WidgetSyncStatus;

const accentHex: Record<Accent, string> = {
  blue: "#2F80ED",
  mint: "#35F2D0",
  violet: "#8B3DFF",
  orange: "#FF5A1F",
  cyan: "#11BFE3",
  rose: "#EC4899"
};

const nativeSlots: Record<WidgetKind, WidgetType[]> = {
  today: ["todayTasks", "nextClass", "studyTime"],
  upcoming: ["upcomingTest", "roomReminder"],
  week: ["weeklyLoad"],
  classProgress: ["classPulse"]
};

export function selectHomeWidgetTypes(state: AppState): WidgetType[] {
  return [...widgetTypes].sort((left, right) => {
    const leftStamp = new Date(state.widgetSettings[left]?.updatedAt ?? "").getTime() || 0;
    const rightStamp = new Date(state.widgetSettings[right]?.updatedAt ?? "").getTime() || 0;
    if (rightStamp !== leftStamp) return rightStamp - leftStamp;
    return widgetTypes.indexOf(left) - widgetTypes.indexOf(right);
  });
}

export function nativeWidgetKindForCoreWidget(widgetType: WidgetType): WidgetKind {
  if (widgetType === "classPulse") return "classProgress";
  if (widgetType === "weeklyLoad") return "week";
  if (widgetType === "roomReminder" || widgetType === "upcomingTest") return "upcoming";
  return "today";
}

export function buildCoreWidgetSnapshotInput(state: AppState, now = new Date()): WidgetSnapshotInput {
  const assignments = [
    ...state.tasks.map((task) => taskToAssignment(task, now)),
    ...state.exams.map((exam) => ({
      id: exam.id,
      courseId: exam.classId,
      title: exam.title,
      kind: "exam" as const,
      type: "exam" as const,
      dueAt: toIsoDateTime(exam.date, exam.time),
      tags: ["exam"],
      priority: "high" as const,
      estimatedMinutes: 120,
      status: "not_started" as const,
      source: "manual" as const,
      progress: 0,
      reminder: { enabled: true, leadTimeHours: 24 },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }))
  ];

  return {
    semester: stateToSemester(state, now),
    courses: state.classes.map(courseToNativeCourse),
    assignments,
    parsedImports: buildParsedImports(state, assignments, now),
    focusSessions: [],
    settings: stateToNativeSettings(state),
    widgetPresets: buildCoreWidgetPresets(state, now),
    demoMode: false,
    now
  };
}

export async function syncCorePlannerWidgets(state: AppState, now = new Date()): Promise<WidgetSyncStatus> {
  return syncStudyPlannerWidgets(buildCoreWidgetSnapshotInput(state, now));
}

export function buildCoreWidgetPresets(state: AppState, now = new Date()): WidgetPreset[] {
  return (Object.keys(nativeSlots) as WidgetKind[]).map((kind) => {
    const sourceType = newestWidgetTypeForNativeKind(state, kind);
    return widgetSettingToPreset(kind, sourceType, state.widgetSettings[sourceType], state, now);
  });
}

function newestWidgetTypeForNativeKind(state: AppState, kind: WidgetKind) {
  return nativeSlots[kind]
    .slice()
    .sort((left, right) => {
      const leftStamp = new Date(state.widgetSettings[left]?.updatedAt ?? "").getTime() || 0;
      const rightStamp = new Date(state.widgetSettings[right]?.updatedAt ?? "").getTime() || 0;
      return rightStamp - leftStamp;
    })[0] ?? "todayTasks";
}

function widgetSettingToPreset(
  kind: WidgetKind,
  sourceType: WidgetType,
  settings: WidgetSettings,
  state: AppState,
  now: Date
): WidgetPreset {
  const { type, dataMode, layout, iconKey } = nativePresetShape(kind, sourceType);
  const timestamp = settings.updatedAt || now.toISOString();
  return {
    id: `core-${kind}`,
    name: `${coreWidgetLabel(sourceType)} Widget`,
    widgetKind: kind,
    type,
    size: settings.size === "S" ? "small" : "medium",
    theme: themeForWidgetSettings(settings),
    background: backgroundForWidgetSettings(settings),
    palette: paletteForAccent(settings.accent),
    dataMode,
    font: settings.density === "Compact" ? "Rounded" : "SF Pro",
    classFocusCourseId: kind === "classProgress" ? preferredClassId(state) : undefined,
    layout,
    iconKey,
    smartStackSlot: smartStackSlotForWidget(sourceType),
    scheduleLabel: coreWidgetLabel(sourceType),
    themePackId: `core-${settings.accent}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSyncedAt: timestamp
  };
}

function nativePresetShape(kind: WidgetKind, sourceType: WidgetType): {
  type: NativeWidgetType;
  dataMode: WidgetDataMode;
  layout: WidgetLayout;
  iconKey: string;
} {
  if (kind === "today") {
    return {
      type: "today",
      dataMode: sourceType === "studyTime" || sourceType === "nextClass" ? "next_up" : "today",
      layout: sourceType === "studyTime" ? "progress" : sourceType === "nextClass" ? "compact" : "list",
      iconKey: sourceType === "studyTime" ? "timer" : sourceType === "nextClass" ? "book" : "check"
    };
  }
  if (kind === "upcoming") {
    return {
      type: "due_next",
      dataMode: sourceType === "upcomingTest" ? "urgent_only" : "next3",
      layout: sourceType === "roomReminder" ? "compact" : "timeline",
      iconKey: sourceType === "upcomingTest" ? "warning" : "calendar"
    };
  }
  if (kind === "week") {
    return {
      type: "week",
      dataMode: "this_week",
      layout: sourceType === "weeklyLoad" ? "strip" : "summary",
      iconKey: "calendar"
    };
  }
  return {
    type: "class_focus",
    dataMode: "single_class",
    layout: "progress",
    iconKey: "book"
  };
}

function stateToSemester(state: AppState, now: Date): Semester {
  const year = now.getFullYear();
  return {
    id: "core-semester",
    name: state.student.semester || "Current semester",
    startDate: `${year}-01-12`,
    endDate: `${year}-12-18`,
    targetGpa: 3.5
  };
}

function courseToNativeCourse(course: ClassCourse): Course {
  return {
    id: course.id,
    code: courseCode(course.title),
    name: course.title,
    instructor: course.professor,
    teacher: course.professor,
    room: course.room,
    color: accentHex[course.accent],
    meetings: course.days.map((day, index) => ({
      id: `${course.id}-${day}-${index}`,
      day: day as Course["meetings"][number]["day"],
      startTime: course.startTime,
      endTime: course.endTime,
      location: course.room
    })),
    gradeCategories: []
  };
}

function taskToAssignment(task: Task, now: Date): Assignment {
  return {
    id: task.id,
    courseId: task.classId,
    title: task.title,
    kind: assignmentKindForTask(task.type),
    type: assignmentKindForTask(task.type),
    dueAt: toIsoDateTime(task.dueDate, task.dueTime),
    tags: [task.type.toLowerCase()],
    priority: priorityToNative(task.priority),
    estimatedMinutes: estimatedMinutesForTask(task),
    status: task.completed ? "done" : "not_started",
    source: "manual",
    progress: task.completed ? 1 : 0,
    reminder: { enabled: Boolean(task.reminder), leadTimeHours: task.priority === "High" ? 2 : 6 },
    createdAt: task.createdAt || now.toISOString(),
    updatedAt: task.updatedAt || now.toISOString()
  };
}

function stateToNativeSettings(state: AppState): UserSettings {
  return {
    studentName: state.student.name,
    selectedTheme: "ocean",
    customPalette: [],
    appTheme: "classic",
    defaultWidgetStyle: state.appSettings.reduceTransparency ? "light" : "glass",
    onboardingComplete: state.onboardingComplete,
    notificationDefault: `${state.appSettings.defaultClassReminder} min before`,
    focusDefaultMinutes: 25,
    syncEnabled: true,
    privacyMode: false,
    emojiAccentEnabled: true,
    profile: {
      name: state.student.name,
      schoolLevel: "college",
      goal: "stay_organized",
      struggle: "forgetting_deadlines",
      scheduleStyle: "balanced"
    }
  };
}

function buildParsedImports(state: AppState, assignments: Assignment[], now: Date): ParsedImport[] {
  if (assignments.length === 0 && state.scannerState.status !== "complete") return [];
  return [
    {
      id: state.scannerState.completedAt ? "core-scanner-import" : "core-manual-plan",
      title: state.scannerState.completedAt ? "Scanned semester plan" : "Manual semester plan",
      sourceType: state.scannerState.completedAt ? "scan" : "typed",
      status: "applied",
      itemCount: assignments.length,
      createdAt: state.scannerState.completedAt || now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];
}

function preferredClassId(state: AppState) {
  const highPriority = state.tasks.find((task) => !task.completed && task.priority === "High");
  const nextTask = highPriority ?? state.tasks.find((task) => !task.completed);
  return nextTask?.classId ?? state.classes[0]?.id;
}

function assignmentKindForTask(type: TaskType): AssignmentKind {
  if (type === "Test") return "exam";
  if (type === "Project") return "project";
  if (type === "Reading") return "reading";
  if (type === "Report" || type === "Essay") return "assignment";
  return "assignment";
}

function priorityToNative(priority: Priority) {
  return priority.toLowerCase() as Assignment["priority"];
}

function estimatedMinutesForTask(task: Task) {
  if (task.type === "Test" || task.type === "Project") return 120;
  if (task.priority === "High") return 75;
  if (task.priority === "Medium") return 45;
  return 25;
}

function themeForWidgetSettings(settings: WidgetSettings): WidgetTheme {
  if (settings.accent === "mint") return "forest";
  if (settings.accent === "violet" || settings.accent === "rose") return "graphite";
  if (settings.opacity >= 96) return "light";
  return "ocean";
}

function backgroundForWidgetSettings(settings: WidgetSettings): WidgetBackground {
  if (settings.density === "Compact") return "light";
  if (settings.opacity < 74) return "dark";
  return "glass";
}

function paletteForAccent(accent: Accent): WidgetPalette {
  if (accent === "mint") return "forest";
  if (accent === "violet") return "lavender";
  if (accent === "orange") return "sunset";
  if (accent === "rose") return "candy";
  return "ocean";
}

function smartStackSlotForWidget(widgetType: WidgetType): WidgetPreset["smartStackSlot"] {
  if (widgetType === "nextClass" || widgetType === "roomReminder") return "between_classes";
  if (widgetType === "studyTime") return "study_time";
  if (widgetType === "weeklyLoad" || widgetType === "classPulse") return "night_review";
  return "morning";
}

function coreWidgetLabel(widgetType: WidgetType) {
  const labels: Record<WidgetType, string> = {
    nextClass: "Next Class",
    todayTasks: "Today's Tasks",
    classPulse: "Class Pulse",
    weeklyLoad: "Weekly Load",
    roomReminder: "Room Reminder",
    upcomingTest: "Upcoming Test",
    studyTime: "Study Time"
  };
  return labels[widgetType];
}

function courseCode(title: string) {
  const parts = title.match(/[A-Za-z]+|\d+/g) ?? [title];
  const letters = parts
    .filter((part) => /[A-Za-z]/.test(part))
    .map((part) => part.slice(0, 3))
    .join("")
    .slice(0, 5)
    .toUpperCase();
  const number = parts.find((part) => /^\d+$/.test(part)) ?? "";
  return `${letters || "CLS"}${number}`.slice(0, 8);
}

function toIsoDateTime(date: string, time: string) {
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : "23:59";
  return `${date}T${safeTime}:00`;
}

export function notesForNativeWidgets(notes: Note[]) {
  return notes.map((note) => ({
    id: note.id,
    courseId: note.classId,
    title: note.title,
    body: note.summary || note.body,
    tags: note.tags,
    pinned: note.status === "pinned",
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }));
}
