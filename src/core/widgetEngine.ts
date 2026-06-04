import type { AppSettings, AppState, WidgetDisplayModel, WidgetSettings, WidgetType } from "./types";
import {
  selectNextClass,
  selectOverallPulse,
  selectRoomReminder,
  selectTodayTasks,
  selectUpcomingTasks,
  selectUpcomingExams,
  selectWeeklyLoad
} from "./selectors";

const nowStamp = "2026-06-03T00:00:00.000Z";

export function getDefaultWidgetSettings(widgetType: WidgetType): WidgetSettings {
  const base = {
    widgetType,
    opacity: 92,
    blur: 18,
    glow: 54,
    radius: 30,
    size: "Hero" as const,
    density: "Detailed" as const,
    updatedAt: nowStamp
  };
  const map: Record<WidgetType, WidgetSettings> = {
    nextClass: { ...base, accent: "blue", size: "Hero" },
    todayTasks: { ...base, accent: "orange", size: "L" },
    classPulse: { ...base, accent: "mint", size: "M" },
    weeklyLoad: { ...base, accent: "violet", size: "M" },
    roomReminder: { ...base, accent: "cyan", size: "L" },
    upcomingTest: { ...base, accent: "rose", size: "M" },
    studyTime: { ...base, accent: "mint", size: "M" }
  };
  return map[widgetType];
}

export function getWidgetDisplayModel(widgetType: WidgetType, state: AppState): WidgetDisplayModel {
  const settings = state.widgetSettings[widgetType] ?? getDefaultWidgetSettings(widgetType);
  const nextClass = selectNextClass(state);
  const todayTasks = selectTodayTasks(state);
  const upcomingTasks = selectUpcomingTasks(state);
  const pulse = nextClass ? selectOverallPulse(state) : selectOverallPulse(state);
  const weeklyLoad = selectWeeklyLoad(state);
  const room = selectRoomReminder(state);
  const exam = selectUpcomingExams(state)[0];
  const examClass = exam ? state.classes.find((course) => course.id === exam.classId) : null;
  const studyPlan = buildStudyTimeWidgetModel(state, todayTasks, upcomingTasks);

  const map: Record<WidgetType, WidgetDisplayModel> = {
    nextClass: {
      widgetType,
      label: "NEXT CLASS",
      value: nextClass?.title ?? "No class",
      title: nextClass ? `Room ${nextClass.room}` : "Schedule clear",
      copy: nextClass ? "Starts in 28 min" : "Add a class to begin",
      status: nextClass ? "Soon" : "Clear",
      items: nextClass ? [`Bring: ${nextClass.reminderSettings.bringItems.join(", ")}`] : [],
      accent: settings.accent
    },
    todayTasks: {
      widgetType,
      label: "TODAY'S TASKS",
      value: String(todayTasks.length),
      title: "tasks left",
      copy: todayTasks.map((task) => task.title).join(", ") || "Nothing due today",
      status: todayTasks.length ? "Due" : "Clear",
      items: todayTasks.map((task) => task.title),
      accent: settings.accent
    },
    classPulse: {
      widgetType,
      label: "CLASS PULSE",
      value: `${pulse.score}%`,
      title: pulse.label,
      copy: pulse.primaryReason,
      status: "Live",
      items: pulse.suggestedActions.map((action) => `Best next tap: ${action}`),
      chart: "pulse",
      accent: settings.accent
    },
    weeklyLoad: {
      widgetType,
      label: "WEEKLY LOAD",
      value: `${weeklyLoad.hours}h`,
      title: weeklyLoad.label,
      copy: `Heaviest block is ${weeklyLoad.heaviestDay}`,
      status: "Steady",
      items: [`${weeklyLoad.blocksToday} study blocks today`],
      chart: "bars",
      accent: settings.accent
    },
    roomReminder: {
      widgetType,
      label: "ROOM REMINDER",
      value: room ? `Room ${room.room}` : "No room",
      title: room ? `Starts in ${room.startsIn}` : "Schedule clear",
      copy: room?.bringItems.length ? `Bring: ${room.bringItems.join(", ")}` : "No items needed",
      status: room ? "Ready" : "Clear",
      items: room ? [room.title] : [],
      accent: settings.accent
    },
    upcomingTest: {
      widgetType,
      label: "UPCOMING TEST",
      value: exam ? formatTestDay(exam.date) : "None",
      title: exam?.title ?? "No tests",
      copy: examClass ? `${examClass.title} review window` : "Add exams to track prep",
      status: exam ? "Prep" : "Clear",
      items: examClass ? [`Review ${examClass.title} notes`] : [],
      chart: "pulse",
      accent: settings.accent
    },
    studyTime: {
      widgetType,
      label: "STUDY TIME",
      value: studyPlan.value,
      title: studyPlan.title,
      copy: studyPlan.copy,
      status: studyPlan.status,
      items: studyPlan.items,
      chart: "bars",
      accent: settings.accent
    }
  };

  return map[widgetType];
}

function buildStudyTimeWidgetModel(
  state: AppState,
  todayTasks: AppState["tasks"],
  upcomingTasks: AppState["tasks"]
) {
  const openTasks = [...todayTasks, ...upcomingTasks].filter((task) => !task.completed);
  const priorityTasks = openTasks.filter((task) => task.priority === "High");
  const focusQueue = [...priorityTasks, ...openTasks.filter((task) => task.priority !== "High")];
  const minutes = focusQueue.slice(0, 3).reduce((sum, task) => sum + focusMinutesForTask(task), 0);
  const cappedMinutes = Math.min(180, Math.max(openTasks.length ? 25 : 0, Math.ceil(minutes / 25) * 25));
  const blockCount = cappedMinutes ? Math.max(1, Math.ceil(cappedMinutes / 25)) : 0;
  const firstTask = focusQueue[0];
  const preferredWindow = state.student.preferences.preferredStudyWindow;

  if (!firstTask) {
    return {
      value: "0m",
      title: "clear today",
      copy: "No open tasks need a focus block",
      status: "Clear",
      items: [preferredWindow]
    };
  }

  return {
    value: formatFocusMinutes(cappedMinutes),
    title: blockCount === 1 ? "focus block" : "focus blocks",
    copy: `Start with ${firstTask.title}`,
    status: todayTasks.length ? "Today" : priorityTasks.length ? "Priority" : "Planned",
    items: [preferredWindow, ...focusQueue.slice(0, 2).map((task) => task.title)]
  };
}

function focusMinutesForTask(task: AppState["tasks"][number]) {
  if (task.type === "Test" || task.type === "Project") return 75;
  if (task.priority === "High") return 50;
  if (task.priority === "Medium") return 35;
  return 25;
}

function formatFocusMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function getWidgetStyleVars(settings: WidgetSettings, appSettings: AppSettings) {
  return {
    opacity: appSettings.reduceTransparency ? 1 : settings.opacity / 100,
    blur: appSettings.reduceTransparency ? 0 : settings.blur,
    glow: appSettings.highContrast ? Math.min(settings.glow, 42) : settings.glow,
    radius: appSettings.reduceTransparency ? Math.min(settings.radius, 30) : settings.radius,
    size: settings.size,
    density: settings.density,
    accent: settings.accent
  };
}

export function mergeWidgetSettings(defaults: WidgetSettings, saved?: Partial<WidgetSettings>) {
  return normalizeWidgetSettings({ ...defaults, ...saved, widgetType: defaults.widgetType });
}

export function normalizeWidgetSettings(input: Partial<WidgetSettings> & { widgetType: WidgetType }): WidgetSettings {
  const defaults = getDefaultWidgetSettings(input.widgetType);
  return {
    ...defaults,
    ...input,
    opacity: clamp(input.opacity ?? defaults.opacity, 58, 100),
    blur: clamp(input.blur ?? defaults.blur, 0, 30),
    glow: clamp(input.glow ?? defaults.glow, 12, 90),
    radius: clamp(input.radius ?? defaults.radius, 24, 36),
    updatedAt: input.updatedAt ?? new Date().toISOString()
  };
}

function formatTestDay(date: string) {
  if (date === "2026-06-05") return "Fri";
  return date.slice(5);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
