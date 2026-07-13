import { Platform } from "react-native";
import { AppData, ClassItem, ExamItem, SemanticColorState, TaskItem, WidgetDensity, WidgetKey, WidgetThemeChoice } from "./types";
import { buildSemesterSnapshot, colorForState, dateKey, daysUntilTask } from "./intelligence";
import { buildSemesterNarrative } from "./semesterNarrative";
import { resolveSemesterThemeColor } from "./semesterTheme";
import { formatPlannerTime, normalizeStorefrontLocale, type StorefrontLocale } from "./storefrontLocale";
import "./widgets/StudyPlannerWidgets";

export type NativeWidgetKind = "today" | "upcoming" | "week" | "classProgress";

export type WidgetDisplayMode = "live" | "empty" | "locked" | "placeholder";

export type WidgetDisplayState = {
  mode: WidgetDisplayMode;
  primaryMetric: string;
  headline: string;
  detail: string;
  accent: string;
  actionLabel: string;
  openURL: string;
};

export type NativeWidgetItem = {
  id: string;
  title: string;
  courseCode: string;
  courseColor: string;
  dueLabel: string;
  timeLabel?: string;
};

export type NativeWidgetCalendarDay = {
  id: string;
  weekday: string;
  dayNumber: string;
  count: number;
  isToday: boolean;
  hasExam: boolean;
};

export type NativeWidgetSnapshot = WidgetDisplayState & {
  version: 1;
  kind: NativeWidgetKind;
  generatedAt: string;
  value: string;
  footnote: string;
  signalLabel?: string;
  timelineLabel?: string;
  updatedLabel?: string;
  accentColor: string;
  backgroundColor: string;
  styleLabel: string;
  densityLabel: string;
  progress: number;
  actionTarget?: string;
  interactionCount?: number;
  lastInteractionLabel?: string;
  ringValue?: string;
  ringLabel?: string;
  items: NativeWidgetItem[];
  calendarDays?: NativeWidgetCalendarDay[];
  weekLabels?: string[];
  weekCounts?: number[];
  examDays?: number[];
  todayIndex?: number;
  peakDayLabel?: string;
  calendarHeadline?: string;
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

export type WidgetCopy = (key: string, fallback: string, vars?: Record<string, string | number>) => string;

const defaultWidgetCopy: WidgetCopy = (_key, fallback, vars = {}) =>
  Object.entries(vars).reduce((text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value)), fallback);

function interpolatingWidgetCopy(source: WidgetCopy): WidgetCopy {
  return (key, fallback, vars = {}) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value)),
      source(key, fallback),
    );
}

export function buildWidgetExampleSnapshot(
  t: WidgetCopy = defaultWidgetCopy,
  locale: StorefrontLocale = "en-US",
): NativeWidgetSnapshot {
  t = interpolatingWidgetCopy(t);
  const accent = "#FF8A00";
  const item: NativeWidgetItem = {
    id: "example-lab-report",
    title: t("widget.example.assignment", "Lab report draft"),
    courseCode: t("widget.example.course", "BIO 201"),
    courseColor: "#34C759",
    dueLabel: t("widget.native.today", "Today"),
    timeLabel: formatPlannerTime("16:00", locale),
  };
  return {
    version: 1,
    kind: "today",
    generatedAt: "example",
    mode: "live",
    primaryMetric: "2",
    headline: t("widget.native.due_today_headline", "Due Today"),
    detail: item.title,
    accent,
    actionLabel: t("widget.native.open_today", "Open Today"),
    openURL: "studyplanner://today",
    value: "2",
    footnote: `${item.courseCode} · ${item.timeLabel}`,
    signalLabel: t("widget.example.label", "Example data"),
    timelineLabel: t("widget.native.today", "Today"),
    updatedLabel: t("widget.example.label", "Example data"),
    accentColor: accent,
    backgroundColor: "#FFF8EF",
    styleLabel: t("widget.native.theme_liquid_light", "Liquid Light"),
    densityLabel: t("widget.native.density_quiet", "Quiet"),
    progress: 0.56,
    items: [item],
  };
}

export const widgetThemeOptions: { id: WidgetThemeChoice; label: string; accent: string; background: string }[] = [
  { id: "liquidLight", label: "Liquid Light", accent: "#0A84FF", background: "#F9FAFC" },
  { id: "graphite", label: "Graphite", accent: "#111111", background: "#F4F4F5" },
  { id: "campus", label: "Campus", accent: "#2F80ED", background: "#EEF6FF" },
  { id: "focus", label: "Focus", accent: "#34C759", background: "#F1FFF6" },
  { id: "contrast", label: "High Contrast", accent: "#000000", background: "#FFFFFF" },
];

const widgetThemeLabelKeys: Record<WidgetThemeChoice, [string, string]> = {
  liquidLight: ["widget.native.theme_liquid_light", "Liquid Light"],
  graphite: ["widget.native.theme_graphite", "Graphite"],
  campus: ["widget.native.theme_campus", "Campus"],
  focus: ["widget.native.theme_focus", "Focus"],
  contrast: ["widget.native.theme_contrast", "High Contrast"],
};

const widgetDensityLabelKeys: Record<WidgetDensity, [string, string]> = {
  quiet: ["widget.native.density_quiet", "Quiet"],
  balanced: ["widget.native.density_balanced", "Balanced"],
  detailed: ["widget.native.density_detailed", "Detailed"],
};

export function widgetThemeLabel(theme: Pick<(typeof widgetThemeOptions)[number], "id" | "label">, t: WidgetCopy = defaultWidgetCopy) {
  const [key, fallback] = widgetThemeLabelKeys[theme.id] || ["widget.native.theme_custom", theme.label];
  return t(key, fallback);
}

export function widgetDensityLabel(density: WidgetDensity, t: WidgetCopy = defaultWidgetCopy) {
  const [key, fallback] = widgetDensityLabelKeys[density] || widgetDensityLabelKeys.balanced;
  return t(key, fallback);
}

function activeTheme(data: AppData) {
  const base = widgetThemeOptions.find((option) => option.id === data.prefs.widgetTheme) || widgetThemeOptions[0];
  if (!data.prefs.semesterThemeColorId && !data.prefs.semesterAccentColor) return base;
  const semesterTheme = resolveSemesterThemeColor(data.prefs.semesterThemeColorId);
  return {
    ...base,
    label: `${semesterTheme.label} ${base.label}`,
    accent: data.prefs.semesterAccentColor || semesterTheme.accent,
    background: semesterTheme.widgetBackground,
  };
}

function activeTasks(data: AppData) {
  return data.tasks.filter((task) => !task.done).slice().sort((a, b) => daysUntilTask(a) - daysUntilTask(b));
}

function daysUntilIso(iso: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.round((new Date(`${iso}T12:00:00`).getTime() - today.getTime()) / 86400000);
}

function activeAssessments(data: AppData) {
  return data.exams.slice().sort((a, b) => daysUntilIso(a.dueDate) - daysUntilIso(b.dueDate));
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

function widgetDueLabel(offset: number, t: WidgetCopy) {
  if (offset < -1) return t("widget.native.days_ago", "{count} days ago", { count: Math.abs(offset) });
  if (offset === -1) return t("widget.native.yesterday", "Yesterday");
  if (offset === 0) return t("widget.native.today", "Today");
  if (offset === 1) return t("widget.native.tomorrow", "Tomorrow");
  return t("widget.native.in_days", "In {count} days", { count: offset });
}

function itemFor(
  data: AppData,
  task: TaskItem,
  t: WidgetCopy = defaultWidgetCopy,
  locale: StorefrontLocale = "en-US",
): NativeWidgetItem {
  const klass = classFor(data, task.classId);
  return {
    id: task.id,
    title: task.title,
    courseCode: klass.code,
    courseColor: klass.color,
    dueLabel: widgetDueLabel(daysUntilTask(task), t),
    timeLabel: task.time ? formatPlannerTime(task.time, locale) : undefined,
  };
}

function examItemFor(
  data: AppData,
  exam: ExamItem,
  t: WidgetCopy = defaultWidgetCopy,
  locale: StorefrontLocale = "en-US",
): NativeWidgetItem {
  const klass = classFor(data, exam.classId);
  return {
    id: exam.id,
    title: exam.title,
    courseCode: klass.code,
    courseColor: klass.color,
    dueLabel: widgetDueLabel(daysUntilIso(exam.dueDate), t),
    timeLabel: exam.time ? formatPlannerTime(exam.time, locale) : undefined,
  };
}

function dueItems(data: AppData, t: WidgetCopy = defaultWidgetCopy, locale: StorefrontLocale = "en-US") {
  const taskItems = activeTasks(data).map((task) => ({ sort: daysUntilTask(task), item: itemFor(data, task, t, locale) }));
  const examItems = activeAssessments(data).map((exam) => ({ sort: daysUntilIso(exam.dueDate), item: examItemFor(data, exam, t, locale) }));
  return [...taskItems, ...examItems].sort((a, b) => a.sort - b.sort);
}

function countdownMetric(offset: number | undefined, t: WidgetCopy) {
  if (offset === undefined) return t("widget.native.ready", "READY").toLocaleUpperCase();
  if (offset < 0) return t("widget.native.overdue", "OVERDUE").toLocaleUpperCase();
  if (offset === 0) return t("widget.native.today", "TODAY").toLocaleUpperCase();
  if (offset === 1) return t("widget.native.tomorrow", "TOMORROW").toLocaleUpperCase();
  return t("widget.native.days_metric", "{count} DAYS", { count: offset }).toLocaleUpperCase();
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

function widgetUpdatedLabel(iso: string, t: WidgetCopy = defaultWidgetCopy, locale: StorefrontLocale = "en-US") {
  try {
    const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
    return t("widget.native.updated_time", "Updated {time}", { time });
  } catch {
    return t("widget.native.updated_now", "Updated now");
  }
}

function todayWeekdayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function localizedWeekdayLabels(t: WidgetCopy = defaultWidgetCopy) {
  return [
    t("widget.weekday.mon", "M"),
    t("widget.weekday.tue", "T"),
    t("widget.weekday.wed", "W"),
    t("widget.weekday.thu", "T"),
    t("widget.weekday.fri", "F"),
    t("widget.weekday.sat", "S"),
    t("widget.weekday.sun", "S"),
  ];
}

function calendarDaysFor(data: AppData, t: WidgetCopy = defaultWidgetCopy): NativeWidgetCalendarDay[] {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const weekdays = localizedWeekdayLabels(t);
  const tasks = activeTasks(data);
  const exams = activeAssessments(data);
  return Array.from({ length: 14 }, (_value, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const iso = dateKey(date);
    const taskCount = tasks.filter((task) => !task.missing && task.dueDate === iso).length;
    const examCount = exams.filter((exam) => exam.dueDate === iso).length;
    const weekdayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return {
      id: iso,
      weekday: weekdays[weekdayIndex] || "",
      dayNumber: String(date.getDate()),
      count: taskCount + examCount,
      isToday: offset === 0,
      hasExam: examCount > 0,
    };
  });
}

function examDayOffsets(data: AppData) {
  return activeAssessments(data)
    .map((exam) => daysUntilIso(exam.dueDate))
    .filter((offset) => offset >= 0 && offset < 7);
}

function peakDayLabel(labels: string[], counts: number[], t: WidgetCopy) {
  const max = Math.max(0, ...counts);
  if (!max) return t("widget.native.light_week", "Light week");
  const index = Math.max(0, counts.findIndex((count) => count === max));
  const label = labels[index] || t("widget.native.this_week", "This week");
  return t("widget.native.peak_day", "Peak {day}", { day: label });
}

function normalizedProgress(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 0;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

const generatedWidgetText: Record<string, [string, string]> = {
  "Add Syllabus": ["widget.native.narrative_add_syllabus", "Add Syllabus"],
  "On Track": ["widget.native.state_on_track", "On Track"],
  "Attention Needed": ["widget.native.state_attention_needed", "Attention Needed"],
  "Recovery Needed": ["widget.native.state_recovery_needed", "Recovery Needed"],
  "Immediate Action": ["widget.native.state_immediate_action", "Immediate Action"],
  "Exam Week": ["widget.native.state_exam_week", "Exam Week"],
  "Pressure Building": ["widget.native.state_pressure_building", "Pressure Building"],
  "Ahead This Week": ["widget.native.state_ahead_this_week", "Ahead This Week"],
  "No semester loaded.": ["widget.native.driver_no_semester_loaded", "No semester loaded."],
  "Build your semester first.": ["widget.native.detail_build_semester_first", "Build your semester first."],
  "Scan syllabus": ["widget.native.next_scan_syllabus", "Scan syllabus"],
  "Scan notes": ["widget.native.next_scan_notes", "Scan notes"],
  "Stay consistent": ["widget.native.next_stay_consistent", "Stay consistent"],
  "Scan or add school material": ["widget.native.next_scan_or_add", "Scan or add school material"],
  "Clear the oldest risk first.": ["widget.native.detail_clear_oldest_risk", "Clear the oldest risk first."],
  "One review block protects preparedness.": ["widget.native.detail_review_block", "One review block protects preparedness."],
  "Raise preparedness before exams.": ["widget.native.detail_raise_preparedness", "Raise preparedness before exams."],
  "Exam prep is light.": ["widget.native.driver_exam_prep_light", "Exam prep is light."],
  "Preparedness needs notes.": ["widget.native.driver_preparedness_needs_notes", "Preparedness needs notes."],
  "Preparedness needs attention.": ["widget.native.driver_preparedness_needs_attention", "Preparedness needs attention."],
  "Pressure is clustering this week.": ["widget.native.driver_pressure_clustering", "Pressure is clustering this week."],
  "Workload is stable.": ["widget.native.driver_workload_stable", "Workload is stable."],
  "Grades are slipping.": ["widget.native.driver_grades_slipping", "Grades are slipping."],
  "Grades are improving.": ["widget.native.driver_grades_improving", "Grades are improving."],
  "Preparedness is slipping.": ["widget.native.driver_preparedness_slipping", "Preparedness is slipping."],
  "Preparedness is improving.": ["widget.native.driver_preparedness_improving", "Preparedness is improving."],
  "Workload is slipping.": ["widget.native.driver_workload_slipping", "Workload is slipping."],
  "Workload is improving.": ["widget.native.driver_workload_improving", "Workload is improving."],
  "Consistency is slipping.": ["widget.native.driver_consistency_slipping", "Consistency is slipping."],
  "Consistency is improving.": ["widget.native.driver_consistency_improving", "Consistency is improving."],
  "No schedule yet": ["widget.native.pressure_no_schedule", "No schedule yet"],
  "Deadline cluster": ["widget.native.pressure_deadline_cluster", "Deadline cluster"],
  "Exam week": ["widget.native.pressure_exam_week", "Exam week"],
  "Heavy week": ["widget.native.pressure_heavy_week", "Heavy week"],
  "Balanced week": ["widget.native.pressure_balanced_week", "Balanced week"],
  "Not enough data": ["widget.native.forecast_not_enough_data", "Not enough data"],
  "Needs recovery": ["widget.native.forecast_needs_recovery", "Needs recovery"],
  "Needs attention.": ["widget.native.reason_needs_attention", "Needs attention."],
  "Stable.": ["widget.native.reason_stable", "Stable."],
  "Prep is light.": ["widget.native.reason_prep_light", "Prep is light."],
  "Estimated.": ["widget.native.reason_estimated", "Estimated."],
  "Add grade.": ["widget.native.reason_add_grade", "Add grade."],
  "Add grade": ["widget.native.add_grade", "Add grade"],
  "No class data.": ["widget.native.reason_no_class_data", "No class data."],
  "Recover missing work.": ["widget.native.nudge_recover_missing", "Recover missing work."],
  "up": ["widget.native.trend_up", "up"],
  "down": ["widget.native.trend_down", "down"],
  "flat": ["widget.native.trend_flat", "flat"],
  "known": ["widget.native.mode_known", "known"],
  "estimated": ["widget.native.mode_estimated", "estimated"],
  "unknown": ["widget.native.mode_unknown", "unknown"],
  "Add classes": ["widget.native.action_add_classes", "Add classes"],
  "Import a syllabus.": ["widget.native.detail_import_syllabus", "Import a syllabus."],
  "Add protected time.": ["widget.native.detail_add_protected_time", "Add protected time."],
  "All set.": ["widget.native.detail_all_set", "All set."],
  "No study block.": ["widget.native.detail_no_study_block", "No study block."],
  "Stay current.": ["widget.native.detail_stay_current", "Stay current."],
  "Overdue.": ["widget.native.due_overdue_sentence", "Overdue."],
  "Due today.": ["widget.native.due_today_sentence", "Due today."],
  "Tomorrow.": ["widget.native.due_tomorrow_sentence", "Tomorrow."],
  "Today": ["widget.native.today", "Today"],
  "Tomorrow": ["widget.native.tomorrow", "Tomorrow"],
  "Yesterday": ["widget.native.yesterday", "Yesterday"],
  "Not set": ["widget.native.not_set", "Not set"],
  "Room TBD": ["widget.native.room_tbd", "Room TBD"],
  "Time TBD": ["widget.native.time_tbd", "Time TBD"],
};

function localizedGeneratedText(value: string | undefined, t: WidgetCopy, genericKey = "widget.native.generated_signal", genericFallback = "Planner signal"): string {
  const text = (value || "").trim();
  if (!text) return "";
  const exact = generatedWidgetText[text];
  if (exact) return t(exact[0], exact[1]);

  let match = text.match(/^(\d+) overdue item reducing health\.$/);
  if (match) return t("widget.native.driver_overdue_one", "{count} overdue item reducing health.", { count: Number(match[1]) });
  match = text.match(/^(\d+) overdue items reducing health\.$/);
  if (match) return t("widget.native.driver_overdue_many", "{count} overdue items reducing health.", { count: Number(match[1]) });
  match = text.match(/^Recover (.+)\.$/);
  if (match) return t("widget.native.nudge_recover_title", "Recover {title}.", { title: match[1] });
  match = text.match(/^Prep for (.+)\.$/);
  if (match) return t("widget.native.nudge_prep_exam", "Prep for {title}.", { title: match[1] });
  match = text.match(/^Review (.+)\. (.+)$/);
  if (match) return t("widget.native.action_review_title_due", "Review {title}. {due}", { title: match[1], due: localizedGeneratedText(match[2], t) });
  match = text.match(/^(.+?): recover (.+)\.$/);
  if (match) return t("widget.native.action_course_recover", "{code}: recover {title}.", { code: match[1], title: match[2] });
  match = text.match(/^(.+?): prep (.+)\. (.+)$/);
  if (match) return t("widget.native.action_course_prep", "{code}: prep {title}. {due}", { code: match[1], title: match[2], due: localizedGeneratedText(match[3], t) });
  match = text.match(/^(.+?): (.+)\. (.+)$/);
  if (match) return t("widget.native.action_course_due", "{code}: {title}. {due}", { code: match[1], title: match[2], due: localizedGeneratedText(match[3], t) });
  match = text.match(/^Lighten (.+)\.$/);
  if (match) return t("widget.native.detail_lighten_day", "Lighten {day}.", { day: match[1] });
  match = text.match(/^Recover (.+)$/);
  if (match) return t("widget.native.next_recover_title", "Recover {title}", { title: match[1] });
  match = text.match(/^Prepare for (.+)$/);
  if (match) return t("widget.native.next_prepare_exam", "Prepare for {title}", { title: match[1] });
  match = text.match(/^Heavy (.+)$/);
  if (match) return t("widget.native.pressure_heavy_day", "Heavy {day}", { day: match[1] });
  match = text.match(/^In (\d+) days$/);
  if (match) return t("widget.native.in_days", "In {count} days", { count: Number(match[1]) });
  match = text.match(/^(\d+) days ago$/);
  if (match) return t("widget.native.days_ago", "{count} days ago", { count: Number(match[1]) });
  match = text.match(/^(\d+) days\.$/);
  if (match) return t("widget.native.due_days_sentence", "{count} days.", { count: Number(match[1]) });
  match = text.match(/^(\d+) overdue$/);
  if (match) return t("widget.native.overdue_count", "{count} overdue", { count: Number(match[1]) });
  match = text.match(/^(\d+) due today$/);
  if (match) return t("widget.native.due_today_count", "{count} due today", { count: Number(match[1]) });
  match = text.match(/^Exam in (\d+)d$/);
  if (match) return t("widget.native.exam_in_days", "Exam in {count}d", { count: Number(match[1]) });
  match = text.match(/^(\d+) unscheduled tasks$/);
  if (match) return t("widget.native.unscheduled_count", "{count} unscheduled tasks", { count: Number(match[1]) });
  match = text.match(/^(.+?) (next)$/);
  if (match) return t("widget.native.action_course_next", "{code} next", { code: match[1] });
  match = text.match(/^(.+?) (exam mode)$/);
  if (match) return t("widget.native.action_course_exam_mode", "{code} exam mode", { code: match[1] });
  match = text.match(/^(.+?) (Not enough data|Needs recovery)$/);
  if (match) return t("widget.native.action_class_forecast", "{code} {forecast}", { code: match[1], forecast: localizedGeneratedText(match[2], t) });
  match = text.match(/^Finish (.+)$/);
  if (match) return t("widget.native.action_finish_title", "Finish {title}", { title: match[1] });
  match = text.match(/^Review (.+)$/);
  if (match) return t("widget.native.action_review_title", "Review {title}", { title: match[1] });
  match = text.match(/^Start (.+)\.$/);
  if (match) return t("widget.native.action_start_title", "Start {title}.", { title: match[1] });

  return t(genericKey, genericFallback);
}

function localizedClassScheduleFootnote(klass: ClassItem, t: WidgetCopy, locale: StorefrontLocale) {
  const time = klass.time ? formatPlannerTime(klass.time, locale) : t("widget.native.time_tbd", "Time TBD");
  const room = localizedGeneratedText(klass.room || "Room TBD", t, "widget.native.room_tbd", "Room TBD");
  return `${time} · ${room}`;
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

export function buildNativeWidgetSnapshots(
  data: AppData,
  t: WidgetCopy = defaultWidgetCopy,
  locale: StorefrontLocale = normalizeStorefrontLocale(Intl.DateTimeFormat().resolvedOptions().locale) || "en-US"
): NativeWidgetSnapshots {
  t = interpolatingWidgetCopy(t);
  const now = new Date().toISOString();
  const density = data.prefs.widgetDensity || "balanced";
  const widgetTheme = activeTheme(data);
  const locked = !data.prefs.premium;
  const empty = !(data.classes.length || data.tasks.length || data.exams.length);
  if (locked || empty) {
    const mode: WidgetDisplayMode = locked ? "locked" : "empty";
    const primaryMetric = locked ? t("widget.native.locked_metric", "NEXT MOVE") : t("widget.native.empty_metric", "START");
    const headline = locked
      ? t("widget.native.locked_headline", "Your next move—on your Home Screen")
      : t("widget.native.empty_headline", "Your semester starts here");
    const detail = locked
      ? t("widget.native.locked_detail", "No coursework appears until you subscribe.")
      : t("widget.native.empty_detail", "Add a syllabus");
    const actionLabel = locked
      ? t("widget.native.unlock_studyplanner", "Unlock StudyPlanner")
      : t("widget.native.add_syllabus", "Add a syllabus");
    const footnote = locked
      ? t("widget.native.private_locked", "Private by default")
      : t("widget.native.empty_support", "Build the plan once. See what matters next.");
    const emptyCalendarDays = calendarDaysFor(data, t);
    const weekLabels = emptyCalendarDays.slice(0, 7).map((day) => day.weekday);
    const base = {
      version: 1 as const,
      generatedAt: now,
      mode,
      primaryMetric,
      headline,
      value: primaryMetric,
      detail,
      footnote,
      signalLabel: locked ? t("widget.native.locked", "Locked") : t("widget.native.setup", "Setup"),
      timelineLabel: t("brand.name", "StudyPlanner"),
      updatedLabel: t("widget.native.ready", "Ready"),
      accent: widgetTheme.accent,
      accentColor: widgetTheme.accent,
      backgroundColor: widgetTheme.background,
      styleLabel: widgetThemeLabel(widgetTheme, t),
      densityLabel: widgetDensityLabel("quiet", t),
      progress: 0,
      ringValue: "0",
      ringLabel: t("health.score", "score"),
      openURL: locked ? "studyplanner://paywall" : "studyplanner://scan",
      actionLabel,
      items: [] as NativeWidgetItem[],
    };
    return {
      today: { ...base, kind: "today" },
      upcoming: { ...base, kind: "upcoming" },
      week: { ...base, kind: "week", weekLabels, weekCounts: [0, 0, 0, 0, 0, 0, 0], calendarDays: emptyCalendarDays, examDays: [], todayIndex: 0, peakDayLabel: t("widget.native.light_week", "Light week"), calendarHeadline: t("widget.native.seven_days", "7 days") },
      classProgress: { ...base, kind: "classProgress" },
    };
  }
  const snapshot = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, snapshot);
  const tasks = activeTasks(data);
  const itemsByDue = dueItems(data, t, locale);
  const limit = itemLimit(density);
  const todayEntries = itemsByDue.filter((entry) => entry.sort <= 0);
  const today = todayEntries.slice(0, limit).map((entry) => entry.item);
  const upcoming = itemsByDue.slice(0, limit + 1).map((entry) => entry.item);
  const classFocus = classFor(data, data.prefs.widgetClassId);
  const classTasks = tasks.filter((task) => task.classId === classFocus.id).slice(0, limit).map((task) => itemFor(data, task, t, locale));
  const nextAction = snapshot.recommendedActions[0];
  const nextTask = tasks[0];
  const nextDueEntry = itemsByDue[0];
  const calendarDays = calendarDaysFor(data, t);
  const weekCounts = calendarDays.slice(0, 7).map((day) => day.count);
  const weekLabels = calendarDays.slice(0, 7).map((day) => day.weekday);
  const examDays = examDayOffsets(data);
  const overdueCount = tasks.filter((task) => daysUntilTask(task) < 0).length;
  const classPulse = snapshot.classPulses.find((pulse) => pulse.classId === classFocus.id) || snapshot.classPulses[0];
  const classProgress = normalizedProgress(classPulse?.forecastScore ?? classFocus.health);
  const todayCount = todayEntries.length;
  const todayItems = today.length ? today : nextDueEntry ? [nextDueEntry.item] : [];
  const todayHeadline = todayCount ? t("widget.native.due_today_headline", "Due Today") : nextDueEntry ? t("widget.native.next_deadline_headline", "Next Deadline") : t("widget.native.clear_today_headline", "Clear Today");
  const todayValue = todayCount ? String(todayCount) : nextDueEntry ? nextDueEntry.item.dueLabel : t("widget.native.clear", "Clear");
  const todayDetail = todayCount ? t("widget.native.due_today_detail", "due today") : nextDueEntry ? nextDueEntry.item.courseCode : t("widget.native.today_lower", "today");
  const todayFootnote = todayItems[0]?.title || localizedGeneratedText(narrative.nextMoveDetail || narrative.primaryDriver, t, "widget.native.detail_review_next_item", "Review the next planner item.");
  const todayState = overdueCount ? "red" : todayCount ? "orange" : snapshot.semesterHealth.colorState;
  const todayProgress = todayCount ? Math.max(0.12, 1 - Math.min(0.88, todayCount * 0.22)) : nextDueEntry ? Math.max(0.22, Math.min(1, 1 - Math.max(0, nextDueEntry.sort) / 30)) : 1;
  const busyDays = weekCounts.filter((count) => count > 0).length;
  const maxWeekLoad = Math.max(0, ...weekCounts);
  const weekState: SemanticColorState = snapshot.pressureForecast.colorState;
  const weekValue = busyDays ? String(busyDays) : "0";
  const weekDetail = busyDays === 1 ? t("widget.native.busy_day", "busy day") : t("widget.native.busy_days", "busy days");
  const weekFootnote = nextDueEntry ? `${nextDueEntry.item.title} ${nextDueEntry.item.dueLabel}` : localizedGeneratedText(narrative.primaryDriver, t, "widget.native.week_load", "Week load");
  const weekPeakLabel = peakDayLabel(weekLabels, weekCounts, t);
  const peakIndex = Math.max(0, weekCounts.findIndex((count) => count === maxWeekLoad));
  const peakDay = calendarDays[peakIndex];
  let peakDayName = weekLabels[peakIndex] || t("widget.native.this_week", "This week");
  if (peakDay?.id) {
    try {
      peakDayName = new Intl.DateTimeFormat(locale, { weekday: "short" })
        .format(new Date(`${peakDay.id}T12:00:00`))
        .toLocaleUpperCase(locale);
    } catch {
      peakDayName = peakDayName.toLocaleUpperCase(locale);
    }
  }
  const weekInsight = maxWeekLoad
    ? t("widget.native.heavy_day_insight", "{day} IS HEAVY", { day: peakDayName })
    : t("widget.native.light_week", "LIGHT WEEK").toLocaleUpperCase(locale);
  const upcomingMetric = countdownMetric(nextDueEntry?.sort, t);
  const classMetric = `${Math.round(classProgress * 100)}%`;

  const semesterAccent = widgetTheme.accent;
  const themedBackground = (state: SemanticColorState | string | undefined) =>
    widgetTheme.id === "liquidLight" && (state === "red" || state === "orange")
      ? liquidBackgroundFor(state)
      : widgetTheme.background;
  const accentForState = (state: SemanticColorState | string | undefined, fallback = semesterAccent) =>
    state === "red" || state === "orange" ? colorForState(state) : fallback;

  const base = {
    version: 1 as const,
    generatedAt: now,
    mode: "live" as const,
    accent: semesterAccent,
    accentColor: semesterAccent,
    backgroundColor: themedBackground(snapshot.semesterHealth.colorState),
    styleLabel: widgetThemeLabel(widgetTheme, t),
    densityLabel: widgetDensityLabel(density, t),
    updatedLabel: widgetUpdatedLabel(now, t, locale),
    openURL: "studyplanner://today",
  };

  return {
    today: {
      ...base,
      kind: "today",
      primaryMetric: todayValue,
      headline: todayHeadline,
      value: todayValue,
      detail: todayFootnote,
      footnote: todayItems[0] ? `${todayItems[0].courseCode} · ${todayItems[0].timeLabel || todayItems[0].dueLabel}` : todayDetail,
      signalLabel: overdueCount ? t("widget.native.overdue_count", "{count} overdue", { count: overdueCount }) : todayCount ? t("widget.native.review_today", "Review today") : t("widget.native.clear_today", "Clear today"),
      timelineLabel: t("widget.native.today", "Today"),
      accent: overdueCount ? "#FF453A" : todayCount ? "#FF9F0A" : semesterAccent,
      accentColor: overdueCount ? "#FF453A" : todayCount ? "#FF9F0A" : semesterAccent,
      backgroundColor: themedBackground(todayState),
      progress: todayProgress,
      actionLabel: t("widget.native.open_today", "Open Today"),
      items: todayItems,
    },
    upcoming: {
      ...base,
      kind: "upcoming",
      primaryMetric: upcomingMetric,
      headline: nextDueEntry?.item.title || t("widget.native.no_deadlines", "No upcoming deadlines"),
      value: upcomingMetric,
      detail: nextDueEntry?.item.courseCode || localizedGeneratedText(narrative.state, t, "widget.native.semester", "Semester"),
      footnote: nextDueEntry ? `${nextDueEntry.item.dueLabel}${nextDueEntry.item.timeLabel ? ` · ${nextDueEntry.item.timeLabel}` : ""}` : localizedGeneratedText(narrative.nextMoveDetail, t, "widget.native.detail_review_next_item", "Review the next planner item."),
      signalLabel: localizedGeneratedText(nextAction?.label || narrative.nextMoveLabel, t, "widget.native.next_move", "Next move"),
      timelineLabel: t("widget.native.next", "Next"),
      accentColor: nextAction ? accentForState(nextAction.colorState) : overdueCount ? "#FF453A" : semesterAccent,
      accent: nextAction ? accentForState(nextAction.colorState) : overdueCount ? "#FF453A" : semesterAccent,
      backgroundColor: themedBackground(nextAction?.colorState || (overdueCount ? "red" : "blue")),
      progress: Math.max(0, Math.min(1, 1 - overdueCount * 0.18)),
      openURL: "studyplanner://review",
      actionLabel: t("widget.native.review", "Review"),
      items: upcoming,
    },
    week: {
      ...base,
      kind: "week",
      primaryMetric: weekInsight,
      headline: maxWeekLoad ? t("widget.native.peak_count", "{count} on the peak day", { count: maxWeekLoad }) : t("widget.native.no_deadlines", "No upcoming deadlines"),
      value: weekInsight,
      detail: t("widget.native.seven_day_workload", "7-day workload"),
      footnote: weekFootnote || `${weekValue} ${weekDetail}`,
      signalLabel: maxWeekLoad ? t("widget.native.max_per_day", "{count} max/day", { count: maxWeekLoad }) : t("widget.native.light_week", "Light week"),
      timelineLabel: t("widget.native.seven_days", "7 days"),
      updatedLabel: weekPeakLabel,
      accent: accentForState(weekState),
      accentColor: accentForState(weekState),
      backgroundColor: themedBackground(weekState),
      progress: busyDays ? Math.max(0.12, 1 - Math.min(0.88, maxWeekLoad * 0.14)) : 1,
      items: upcoming.slice(0, 2),
      calendarDays,
      weekLabels,
      weekCounts,
      examDays,
      todayIndex: 0,
      peakDayLabel: weekPeakLabel,
      calendarHeadline: t("widget.native.calendar_widget", "Calendar widget"),
      openURL: "studyplanner://plan",
      actionLabel: t("today.open_plan", "Open plan"),
    },
    classProgress: {
      ...base,
      kind: "classProgress",
      primaryMetric: classMetric,
      headline: classFocus.code,
      value: classMetric,
      detail: classTasks[0]?.title || t("widget.native.no_next_assignment", "No next assignment"),
      footnote: classFocus.name || localizedClassScheduleFootnote(classFocus, t, locale),
      signalLabel: classPulse?.trend ? localizedGeneratedText(classPulse.trend, t, "widget.native.class_pulse", "Class pulse") : t("widget.native.class_pulse", "Class pulse"),
      timelineLabel: classFocus.code,
      accent: classPulse ? accentForState(classPulse.colorState) : semesterAccent,
      accentColor: classPulse ? accentForState(classPulse.colorState) : semesterAccent,
      backgroundColor: themedBackground(classPulse?.colorState || "blue"),
      progress: classProgress,
      ringValue: String(Math.round(classProgress * 100)),
      ringLabel: t("health.score", "score"),
      openURL: `studyplanner://class?id=${encodeURIComponent(classFocus.id)}`,
      actionLabel: t("widget.native.open_class", "Open Class"),
      items: classTasks,
    },
  };
}

export async function syncNativeWidgets(data: AppData, t: WidgetCopy = defaultWidgetCopy, locale?: StorefrontLocale): Promise<WidgetSyncStatus> {
  if (Platform.OS !== "ios") {
    return { state: "skipped", message: t("widget.native.sync_iphone_only", "Native widgets sync on iPhone builds.") };
  }

  try {
    const widgets = require("./widgets/StudyPlannerWidgets");
    const snapshots = buildNativeWidgetSnapshots(data, t, locale);
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
      return { state: "error", message: t("widget.native.timeline_error", "Widget timelines did not confirm. Try syncing again."), updatedAt: snapshots.today.generatedAt };
    }
    return { state: "synced", message: t("widget.native.synced", "iPhone widgets updated."), updatedAt: snapshots.today.generatedAt };
  } catch (error) {
    return {
      state: "unavailable",
      message: t("widget.native.unavailable", "Install the native iPhone build to sync widgets."),
    };
  }
}

export function widgetKeyForNativeKind(kind: NativeWidgetKind): WidgetKey {
  if (kind === "today") return "deadline";
  if (kind === "upcoming") return "deadline";
  if (kind === "week") return "health";
  return "nextClass";
}
