import {
  Assignment,
  Course,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetBackground,
  WidgetPalette,
  WidgetPreset
} from "../models";
import {
  daysUntil,
  getNeedsReview,
  getSchedulableAssignments,
  isValidDeadline,
  scoreWork
} from "../logic/planner";

export type StudyPlannerNativeWidgetKind = "today" | "upcoming";

export type StudyPlannerNativeWidgetState =
  | "ready"
  | "demo"
  | "no_classes"
  | "no_reviewed_syllabus"
  | "no_assignments"
  | "needs_review"
  | "no_due_today"
  | "no_upcoming";

export type StudyPlannerNativeWidgetItem = {
  id: string;
  title: string;
  courseCode: string;
  courseColor: string;
  dueLabel: string;
  priority: Assignment["priority"];
  kind: Assignment["kind"];
};

export type StudyPlannerNativeWidgetProps = {
  version: 1;
  kind: StudyPlannerNativeWidgetKind;
  state: StudyPlannerNativeWidgetState;
  generatedAt: string;
  semesterName: string;
  headline: string;
  value: string;
  detail: string;
  footnote: string;
  accentColor: string;
  backgroundColor: string;
  styleLabel: string;
  layoutLabel: string;
  densityLabel: string;
  windowLabel: string;
  courseScopeLabel: string;
  progressLabel: string;
  progress: number;
  iconKey: string;
  actionLabel: string;
  openURL: string;
  signalLabel?: string;
  metricLabel?: string;
  nextLabel?: string;
  timelineLabel?: string;
  items: StudyPlannerNativeWidgetItem[];
};

export type WidgetSyncStatus = {
  state: "idle" | "synced" | "unavailable" | "skipped" | "error";
  message: string;
  updatedAt?: string;
};

export type WidgetSnapshotInput = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  parsedImports: ParsedImport[];
  settings?: UserSettings;
  widgetPresets?: WidgetPreset[];
  demoMode: boolean;
  now?: Date;
};

declare const require: (path: string) => any;

const defaultAccent = "#2F80ED";
const defaultBackground = "#101723";

const paletteAccents: Record<WidgetPalette | "custom", string> = {
  sunset: "#E06C2E",
  ocean: "#2F80ED",
  forest: "#35F2D0",
  lavender: "#56A8FF",
  midnight: "#56A8FF",
  candy: "#38BDF8",
  minimal: "#94A3B8",
  graphite: "#A3E635",
  aurora: "#35F2D0",
  paper: "#2F80ED",
  custom: defaultAccent
};

const backgroundColors: Record<WidgetBackground, string> = {
  glass: "#101723",
  solid: "#0D1422",
  gradient: "#061827",
  dark: "#05070B"
};

export function buildStudyPlannerWidgetSnapshots(input: WidgetSnapshotInput) {
  const now = input.now || new Date();
  const generatedAt = now.toISOString();
  const hasClasses = input.courses.length > 0;
  const reviewedAssignments = getReviewedAssignments(input.assignments, now);
  const reviewCount = getNeedsReview(input.assignments).length;
  const hasReviewedSyllabus = getHasReviewedSyllabus(input.assignments, input.parsedImports);
  const privacyMode = input.settings?.privacyMode === true;
  const todayPreset = findNativePreset("today", input.widgetPresets || []);
  const upcomingPreset = findNativePreset("upcoming", input.widgetPresets || []);
  const todayAssignments = filterAssignmentsForPreset(reviewedAssignments, todayPreset, input.courses);
  const upcomingAssignments = filterAssignmentsForPreset(reviewedAssignments, upcomingPreset, input.courses);
  const upcoming = getUpcomingAssignments(upcomingAssignments, now);
  const dueToday = getTodayWidgetAssignments(todayAssignments, now);
  const todayStyle = getNativeWidgetStyle("today", todayPreset, input.settings);
  const upcomingStyle = getNativeWidgetStyle("upcoming", upcomingPreset, input.settings);
  const base = {
    version: 1 as const,
    generatedAt,
    semesterName: input.semester.name,
    openURL: "studyplanner://widgets"
  };

  if (input.demoMode) {
    return {
      today: emptySnapshot({
        ...base,
        kind: "today",
        state: "demo",
        headline: "Today",
        value: "Import",
        detail: "Demo work stays inside the app",
        footnote: "Scan a real syllabus for widgets",
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "demo",
        headline: "Upcoming",
        value: "Import",
        detail: "Widgets wait for real planner data",
        footnote: "Demo coursework is never shared",
        ...upcomingStyle
      })
    };
  }

  if (!hasClasses) {
    return {
      today: emptySnapshot({
        ...base,
        kind: "today",
        state: "no_classes",
        headline: "Today",
        value: "Class",
        detail: "Add a class first",
        footnote: "Course context makes widgets useful",
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "no_classes",
        headline: "Upcoming",
        value: "Class",
        detail: "Add a class first",
        footnote: "Then add or scan homework",
        ...upcomingStyle
      })
    };
  }

  if (input.assignments.length === 0) {
    const state = hasReviewedSyllabus ? "no_assignments" : "no_reviewed_syllabus";
    const detail = hasReviewedSyllabus ? "No homework in your plan yet" : "Review a syllabus first";
    const footnote = hasReviewedSyllabus ? "Add homework when it appears" : "Scans stay private until approved";

    return {
      today: emptySnapshot({
        ...base,
        kind: "today",
        state,
        headline: "Today",
        value: hasReviewedSyllabus ? "Add" : "Scan",
        detail,
        footnote,
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state,
        headline: "Upcoming",
        value: hasReviewedSyllabus ? "Add" : "Review",
        detail,
        footnote,
        ...upcomingStyle
      })
    };
  }

  if (reviewedAssignments.length === 0 && reviewCount > 0) {
    return {
      today: emptySnapshot({
        ...base,
        kind: "today",
        state: "needs_review",
        headline: "Today",
        value: String(reviewCount),
        detail: "Check scanned dates",
        footnote: "Unreviewed work stays out of widgets",
        ...todayStyle,
        accentColor: "#F59E0B"
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "needs_review",
        headline: "Upcoming",
        value: String(reviewCount),
        detail: "Review before widgets use it",
        footnote: "Open Scan to approve deadlines",
        ...upcomingStyle,
        accentColor: "#F59E0B"
      })
    };
  }

  const nextUpcoming = upcoming[0];
  const todayAccent = privacyMode ? todayStyle.accentColor : colorForAssignment(dueToday[0] || nextUpcoming, input.courses, todayStyle.accentColor);
  const upcomingAccent = privacyMode ? upcomingStyle.accentColor : colorForAssignment(nextUpcoming, input.courses, upcomingStyle.accentColor);
  const overdueToday = dueToday.filter((assignment) => daysUntil(assignment.dueAt, now) < 0).length;

  return {
    today:
      dueToday.length > 0
        ? {
            ...base,
            kind: "today" as const,
            state: "ready" as const,
            headline: "Today",
            value: String(dueToday.length),
            detail: overdueToday > 0 ? `${overdueToday} overdue` : dueToday.length === 1 ? "task due today" : "tasks due today",
            footnote: nextUpcoming ? `Next: ${assignmentDisplayTitle(nextUpcoming, privacyMode)}` : "Keep the day light",
            ...todayStyle,
            accentColor: todayAccent,
            progress: overdueToday > 0 ? 0.86 : Math.min(0.95, Math.max(0.18, 1 / Math.max(dueToday.length, 1))),
            signalLabel: overdueToday > 0 ? "Catch up" : "Do first",
            metricLabel: dueToday[0] ? effortMetricLabel(dueToday[0]) : `${dueToday.length} open`,
            nextLabel: assignmentSignal(dueToday[0], input.courses, now, privacyMode),
            timelineLabel: "Today",
            items: dueToday.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now, privacyMode, todayAccent))
          }
        : emptySnapshot({
            ...base,
            kind: "today",
            state: "no_due_today",
            headline: "Today",
            value: "Clear",
            detail: "Nothing due today",
            footnote: nextUpcoming ? `Next: ${formatDueLabel(nextUpcoming.dueAt, now)}` : "No deadlines queued",
            ...todayStyle,
            accentColor: todayAccent,
            signalLabel: "Clear today",
            metricLabel: nextUpcoming ? "Next deadline set" : "No open work",
            nextLabel: nextUpcoming ? assignmentSignal(nextUpcoming, input.courses, now, privacyMode) : "Add homework when it appears",
            timelineLabel: "Today"
          }),
    upcoming:
      upcoming.length > 0 && nextUpcoming
        ? {
            ...base,
            kind: "upcoming" as const,
            state: "ready" as const,
            headline: "Upcoming",
            value: formatWidgetValueLabel(nextUpcoming.dueAt, now),
            detail: assignmentDisplayTitle(nextUpcoming, privacyMode),
            footnote: `${upcoming.length} open deadline${upcoming.length === 1 ? "" : "s"}`,
            ...upcomingStyle,
            accentColor: upcomingAccent,
            progress: Math.min(0.95, Math.max(0.16, 1 / Math.max(upcoming.length, 1))),
            signalLabel: daysUntil(nextUpcoming.dueAt, now) < 0 ? "Catch up" : "Next deadline",
            metricLabel: effortMetricLabel(nextUpcoming),
            nextLabel: assignmentSignal(nextUpcoming, input.courses, now, privacyMode),
            timelineLabel: formatDueLabel(nextUpcoming.dueAt, now),
            items: upcoming.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now, privacyMode, upcomingAccent))
          }
        : emptySnapshot({
            ...base,
            kind: "upcoming",
            state: "no_upcoming",
            headline: "Upcoming",
            value: "Clear",
            detail: "No upcoming deadlines",
            footnote: reviewCount > 0 ? "Review scanned items when ready" : "Add homework when it appears",
            ...upcomingStyle,
            signalLabel: "Clear week",
            metricLabel: reviewCount > 0 ? `${reviewCount} to review` : "No open work",
            nextLabel: reviewCount > 0 ? "Approve scanned items first" : "Add homework when it appears",
            timelineLabel: "Upcoming"
          })
  };
}

export async function syncStudyPlannerWidgets(input: WidgetSnapshotInput): Promise<WidgetSyncStatus> {
  if (input.settings?.syncEnabled === false) {
    return {
      state: "skipped",
      message: "Widget sync is off in StudyPlanner settings."
    };
  }

  if (getPlatformOS() !== "ios") {
    return {
      state: "skipped",
      message: "Native widgets are available on iOS builds."
    };
  }

  const snapshots = buildStudyPlannerWidgetSnapshots(input);

  try {
    const widgets = loadNativeWidgetModule();
    if (!widgets) {
      return {
        state: "unavailable",
        message: "Install a native iOS build with the widget extension to add widgets."
      };
    }

    widgets.StudyPlannerTodayWidget.updateSnapshot(snapshots.today);
    widgets.StudyPlannerUpcomingWidget.updateSnapshot(snapshots.upcoming);

    return {
      state: "synced",
      message: "Today and Upcoming widgets are using reviewed planner data.",
      updatedAt: snapshots.today.generatedAt
    };
  } catch {
    return {
      state: "unavailable",
      message: "Install a native iOS build with the widget extension to add widgets."
    };
  }
}

function loadNativeWidgetModule() {
  try {
    return require("../widgets/StudyPlannerWidgets");
  } catch {
    return null;
  }
}

function getPlatformOS() {
  try {
    return require("react-native").Platform?.OS || "web";
  } catch {
    return "web";
  }
}

function emptySnapshot(
  value: Omit<StudyPlannerNativeWidgetProps, "items">
): StudyPlannerNativeWidgetProps {
  return {
    ...value,
    items: []
  };
}

function getReviewedAssignments(assignments: Assignment[], now: Date) {
  return getSchedulableAssignments(assignments)
    .filter((assignment) => !assignment.needsReview && !assignment.duplicateOf)
    .sort((a, b) => sortWidgetAssignments(a, b, now));
}

function getTodayWidgetAssignments(assignments: Assignment[], now: Date) {
  return assignments
    .filter((assignment) => daysUntil(assignment.dueAt, now) <= 0)
    .sort((a, b) => sortWidgetAssignments(a, b, now));
}

function getUpcomingAssignments(assignments: Assignment[], now = new Date()) {
  return assignments
    .sort((a, b) => sortWidgetAssignments(a, b, now));
}

function sortWidgetAssignments(a: Assignment, b: Assignment, now: Date) {
  const bucketDelta = widgetDueBucket(a, now) - widgetDueBucket(b, now);
  if (bucketDelta !== 0) return bucketDelta;

  const scoreDelta = scoreWork(b, now) - scoreWork(a, now);
  if (scoreDelta !== 0) return scoreDelta;

  const dueDelta = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  if (dueDelta !== 0) return dueDelta;

  return a.id.localeCompare(b.id);
}

function widgetDueBucket(assignment: Assignment, now: Date) {
  const days = daysUntil(assignment.dueAt, now);
  if (days < 0) return 0;
  if (days === 0) return 1;
  return 2;
}

function getHasReviewedSyllabus(assignments: Assignment[], parsedImports: ParsedImport[]) {
  return (
    parsedImports.some((item) => item.status === "applied" && !item.id.startsWith("demo-")) ||
    assignments.some((assignment) => assignment.source === "scan" || assignment.source === "syllabus")
  );
}

function toWidgetItem(
  assignment: Assignment,
  courses: Course[],
  now: Date,
  privacyMode = false,
  fallbackColor = defaultAccent
): StudyPlannerNativeWidgetItem {
  const course = courses.find((item) => item.id === assignment.courseId);
  return {
    id: assignment.id,
    title: assignmentDisplayTitle(assignment, privacyMode),
    courseCode: privacyMode ? "Class" : course?.code || "Class",
    courseColor: privacyMode ? fallbackColor : readableWidgetAccent(course?.color, fallbackColor),
    dueLabel: formatDueLabel(assignment.dueAt, now),
    priority: assignment.priority,
    kind: assignment.kind
  };
}

function colorForAssignment(assignment: Assignment | undefined, courses: Course[], fallback = defaultAccent) {
  if (!assignment) return fallback;
  return readableWidgetAccent(courses.find((course) => course.id === assignment.courseId)?.color, fallback);
}

function readableWidgetAccent(color: string | undefined, fallback = defaultAccent) {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return fallback;

  const red = parseInt(color.slice(1, 3), 16) / 255;
  const green = parseInt(color.slice(3, 5), 16) / 255;
  const blue = parseInt(color.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance < 0.34 ? fallback : color;
}

function assignmentDisplayTitle(assignment: Assignment, privacyMode: boolean) {
  return privacyMode ? "Hidden assignment" : cleanTitle(assignment.title);
}

function assignmentSignal(assignment: Assignment | undefined, courses: Course[], now: Date, privacyMode = false) {
  if (!assignment) return "Open StudyPlanner";

  if (privacyMode) {
    return [
      formatDueLabel(assignment.dueAt, now),
      assignment.priority === "high" ? "High priority" : undefined
    ].filter(Boolean).join(" / ");
  }

  const course = courses.find((item) => item.id === assignment.courseId);
  const parts = [
    course?.code || "Class",
    formatDueLabel(assignment.dueAt, now),
    assignment.priority === "high" ? "High priority" : undefined
  ].filter(Boolean);

  return parts.join(" / ");
}

function effortMetricLabel(assignment: Assignment) {
  const minutes = Math.max(5, Math.round((assignment.estimatedMinutes || 0) / 5) * 5);
  const priority = assignment.priority === "high" ? "High" : assignment.priority === "medium" ? "Medium" : undefined;
  return [minutes ? `${minutes}m open` : undefined, priority].filter(Boolean).join(" / ");
}

function dueUrgencyLabel(iso: string, now: Date) {
  const days = daysUntil(iso, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return "Soon";
  if (days <= 7) return "This week";
  return "Later";
}

function filterAssignmentsForPreset(assignments: Assignment[], preset?: WidgetPreset, courses: Course[] = []) {
  if (!preset?.classFocusCourseId) return assignments;
  if (!courses.some((course) => course.id === preset.classFocusCourseId)) return assignments;
  return assignments.filter((assignment) => assignment.courseId === preset.classFocusCourseId);
}

function getNativeWidgetStyle(
  kind: StudyPlannerNativeWidgetKind | "upcoming",
  preset?: WidgetPreset,
  settings?: UserSettings
): Pick<
  StudyPlannerNativeWidgetProps,
  | "accentColor"
  | "backgroundColor"
  | "styleLabel"
  | "layoutLabel"
  | "densityLabel"
  | "windowLabel"
  | "courseScopeLabel"
  | "progressLabel"
  | "progress"
  | "iconKey"
  | "actionLabel"
> {
  const palette = preset?.palette || settings?.selectedTheme || "ocean";
  const background = preset?.background || settings?.defaultWidgetStyle || "glass";
  const accentColor =
    palette === "custom"
      ? settings?.customPalette?.[0] || defaultAccent
      : paletteAccents[palette] || defaultAccent;
  const smartSlot = preset?.smartStackSlot;
  const windowLabel =
    preset?.scheduleLabel ||
    (smartSlot === "morning"
      ? "7-10 AM"
      : smartSlot === "between_classes"
        ? "10 AM-3 PM"
        : smartSlot === "study_time"
          ? "3-9 PM"
          : smartSlot === "night_review"
            ? "9 PM+"
            : kind === "today"
              ? "Today"
              : "Upcoming");
  const layout = preset?.layout || "list";
  const densityLabel = preset?.size === "small" ? "Calm" : layout === "compact" || layout === "list" ? "Compact" : "Visual";

  return {
    accentColor,
    backgroundColor: backgroundColors[background] || defaultBackground,
    styleLabel: `${labelize(background)} / ${labelize(palette)}`,
    layoutLabel: labelize(layout),
    densityLabel,
    windowLabel,
    courseScopeLabel: preset?.classFocusCourseId ? "Pinned class" : "All classes",
    progressLabel: kind === "today" ? "Day plan" : "Due map",
    progress: kind === "today" ? 0.62 : 0.44,
    iconKey: preset?.iconKey || (kind === "today" ? "check" : "calendar"),
    actionLabel: kind === "today" ? "Open Today" : "Open Upcoming"
  };
}

function findNativePreset(kind: StudyPlannerNativeWidgetKind | "upcoming", presets: WidgetPreset[]) {
  const type = kind === "today" ? "today" : "due_next";
  return [...presets]
    .filter(
      (preset) =>
        preset.type === type &&
        (preset.size === "small" ||
          preset.size === "medium" ||
          preset.size === "lock_round" ||
          preset.size === "lock_rect" ||
          preset.size === "lock_inline")
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

function labelize(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 72) || "Homework";
}

function formatDueLabel(iso: string, now: Date) {
  if (!isValidDeadline(iso)) return "Review";

  const days = daysUntil(iso, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 6) return weekdayName(iso);
  return shortDate(iso);
}

function formatWidgetValueLabel(iso: string, now: Date) {
  if (!isValidDeadline(iso)) return "Review";

  const days = daysUntil(iso, now);
  if (days < 0) return "Late";
  if (days === 0) return "Today";
  if (days === 1) return "Tmrw";
  if (days <= 6) return weekdayName(iso);
  return shortDate(iso);
}

function weekdayName(iso: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(iso));
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(iso));
}
