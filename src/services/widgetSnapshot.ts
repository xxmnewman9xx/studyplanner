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
  getAssignmentCompletionStats,
  getNeedsReview,
  getSchedulableAssignments,
  getWeekCompletionStats,
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
  | "no_upcoming"
  | "sync_disabled";

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

export type WidgetSnapshotTranslate = (key: string, fallback?: string) => string;

export type WidgetSnapshotInput = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  parsedImports: ParsedImport[];
  settings?: UserSettings;
  widgetPresets?: WidgetPreset[];
  demoMode: boolean;
  now?: Date;
  locale?: string;
  translate?: WidgetSnapshotTranslate;
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

const defaultTranslate: WidgetSnapshotTranslate = (_key, fallback) => fallback || _key;

function getSnapshotLocalization(input: Pick<WidgetSnapshotInput, "locale" | "translate">) {
  return {
    locale: input.locale || "en-US",
    t: input.translate || defaultTranslate
  };
}

function formatSnapshotTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

export function buildStudyPlannerWidgetSnapshots(input: WidgetSnapshotInput) {
  const now = input.now || new Date();
  const { locale, t } = getSnapshotLocalization(input);
  const generatedAt = now.toISOString();
  const hasClasses = input.courses.length > 0;
  const assignments = input.demoMode ? input.assignments : input.assignments.filter(isRealWidgetAssignment);
  const parsedImports = input.demoMode ? input.parsedImports : input.parsedImports.filter(isRealParsedImport);
  const reviewedAssignments = getReviewedAssignments(assignments, now);
  const reviewedProgressAssignments = getReviewedProgressAssignments(assignments);
  const reviewCount = getNeedsReview(assignments).length;
  const hasReviewedSyllabus = getHasReviewedSyllabus(assignments, parsedImports);
  const privacyMode = input.settings?.privacyMode === true;
  const todayPreset = findNativePreset("today", input.widgetPresets || []);
  const upcomingPreset = findNativePreset("upcoming", input.widgetPresets || []);
  const todayAssignments = filterAssignmentsForPreset(reviewedAssignments, todayPreset, input.courses);
  const upcomingAssignments = filterAssignmentsForPreset(reviewedAssignments, upcomingPreset, input.courses);
  const upcoming = getUpcomingAssignments(upcomingAssignments, now);
  const dueToday = getTodayWidgetAssignments(todayAssignments, now);
  const todayProgressStats = getAssignmentCompletionStats(
    filterAssignmentsForPreset(reviewedProgressAssignments, todayPreset, input.courses).filter(
      (assignment) => daysUntil(assignment.dueAt, now) === 0
    )
  );
  const weekProgressStats = getWeekCompletionStats(assignments, now);
  const todayStyle = getNativeWidgetStyle("today", todayPreset, input.settings, t);
  const upcomingStyle = getNativeWidgetStyle("upcoming", upcomingPreset, input.settings, t);
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
        headline: t("widget_snapshot.today", "Today"),
        value: t("widget_snapshot.import", "Import"),
        detail: t("widget_snapshot.demo_detail_today", "Demo work stays inside the app"),
        footnote: t("widget_snapshot.demo_footnote_today", "Import a real syllabus for widgets"),
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "demo",
        headline: t("widget_snapshot.upcoming", "Upcoming"),
        value: t("widget_snapshot.import", "Import"),
        detail: t("widget_snapshot.demo_detail_upcoming", "Widgets wait for real planner data"),
        footnote: t("widget_snapshot.demo_footnote_upcoming", "Demo coursework is never shared"),
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
        headline: t("widget_snapshot.today", "Today"),
        value: t("widget_snapshot.class", "Class"),
        detail: t("widget_snapshot.add_class_first", "Add a class first"),
        footnote: t("widget_snapshot.course_context", "Course context makes widgets useful"),
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "no_classes",
        headline: t("widget_snapshot.upcoming", "Upcoming"),
        value: t("widget_snapshot.class", "Class"),
        detail: t("widget_snapshot.add_class_first", "Add a class first"),
        footnote: t("widget_snapshot.then_add_homework", "Then add or import homework"),
        ...upcomingStyle
      })
    };
  }

  if (assignments.length === 0) {
    const state = hasReviewedSyllabus ? "no_assignments" : "no_reviewed_syllabus";
    const detail = hasReviewedSyllabus
      ? t("widget_snapshot.no_homework_plan", "No homework in your plan yet")
      : t("widget_snapshot.review_syllabus_first", "Review a syllabus first");
    const footnote = hasReviewedSyllabus
      ? t("widget_snapshot.add_homework_when_appears", "Add homework when it appears")
      : t("widget_snapshot.imports_private", "Imports stay private until approved");

    return {
      today: emptySnapshot({
        ...base,
        kind: "today",
        state,
        headline: t("widget_snapshot.today", "Today"),
        value: hasReviewedSyllabus ? t("widget_snapshot.add", "Add") : t("widget_snapshot.scan", "Scan"),
        detail,
        footnote,
        ...todayStyle
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state,
        headline: t("widget_snapshot.upcoming", "Upcoming"),
        value: hasReviewedSyllabus ? t("widget_snapshot.add", "Add") : t("widget_snapshot.review", "Review"),
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
        headline: t("widget_snapshot.today", "Today"),
        value: String(reviewCount),
        detail: t("widget_snapshot.check_imported_dates", "Check imported dates"),
        footnote: t("widget_snapshot.unreviewed_out", "Unreviewed work stays out of widgets"),
        ...todayStyle,
        accentColor: "#F59E0B"
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "needs_review",
        headline: t("widget_snapshot.upcoming", "Upcoming"),
        value: String(reviewCount),
        detail: t("widget_snapshot.review_before_widgets", "Review before widgets use it"),
        footnote: t("widget_snapshot.open_scan_approve", "Open Scan to approve deadlines"),
        ...upcomingStyle,
        accentColor: "#F59E0B"
      })
    };
  }

  const nextUpcoming = upcoming[0];
  const todayAccent =
    todayPreset || privacyMode ? todayStyle.accentColor : colorForAssignment(dueToday[0] || nextUpcoming, input.courses, todayStyle.accentColor);
  const upcomingAccent =
    upcomingPreset || privacyMode ? upcomingStyle.accentColor : colorForAssignment(nextUpcoming, input.courses, upcomingStyle.accentColor);
  const overdueToday = dueToday.filter((assignment) => daysUntil(assignment.dueAt, now) < 0).length;

  return {
    today:
      dueToday.length > 0
        ? {
            ...base,
            kind: "today" as const,
            state: "ready" as const,
            headline: t("widget_snapshot.today", "Today"),
            value: String(dueToday.length),
            detail:
              overdueToday > 0
                ? formatSnapshotTemplate(t("widget_snapshot.overdue_count", "{count} overdue"), { count: overdueToday })
                : dueToday.length === 1
                  ? t("widget_snapshot.task_due_today", "task due today")
                  : t("widget_snapshot.tasks_due_today", "tasks due today"),
            footnote: nextUpcoming
              ? formatSnapshotTemplate(t("widget_snapshot.next_assignment", "Next: {title}"), {
                  title: assignmentDisplayTitle(nextUpcoming, privacyMode, t)
                })
              : t("widget_snapshot.keep_day_light", "Keep the day light"),
            ...todayStyle,
            accentColor: todayAccent,
            progress: todayProgressStats.total > 0 ? todayProgressStats.progress : 0,
            signalLabel: overdueToday > 0 ? t("widget_snapshot.catch_up", "Catch up") : t("widget_snapshot.do_first", "Do first"),
            metricLabel: dueToday[0]
              ? formatSnapshotTemplate(t("widget_snapshot.complete_count", "{done} of {total} complete"), {
                  done: todayProgressStats.done,
                  total: todayProgressStats.total
                })
              : formatSnapshotTemplate(t("widget_snapshot.open_count", "{count} open"), { count: dueToday.length }),
            nextLabel: assignmentSignal(dueToday[0], input.courses, now, privacyMode, t, locale),
            timelineLabel: t("widget_snapshot.today", "Today"),
            items: dueToday.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now, privacyMode, todayAccent, t, locale))
          }
        : emptySnapshot({
            ...base,
            kind: "today",
            state: "no_due_today",
            headline: t("widget_snapshot.today", "Today"),
            value: t("widget_snapshot.clear", "Clear"),
            detail: t("widget_snapshot.nothing_due_today", "Nothing due today"),
            footnote: nextUpcoming
              ? formatSnapshotTemplate(t("widget_snapshot.next_due_label", "Next: {due}"), {
                  due: formatDueLabel(nextUpcoming.dueAt, now, t, locale)
                })
              : t("widget_snapshot.no_deadlines_queued", "No deadlines queued"),
            ...todayStyle,
            accentColor: todayAccent,
            progress: todayProgressStats.total > 0 ? todayProgressStats.progress : 0,
            signalLabel: t("widget_snapshot.clear_today", "Clear today"),
            metricLabel: todayProgressStats.total > 0
              ? formatSnapshotTemplate(t("widget_snapshot.complete_count", "{done} of {total} complete"), {
                  done: todayProgressStats.done,
                  total: todayProgressStats.total
                })
              : nextUpcoming ? t("widget_snapshot.next_deadline_set", "Next deadline set") : t("widget_snapshot.no_open_work", "No open work"),
            nextLabel: nextUpcoming
              ? assignmentSignal(nextUpcoming, input.courses, now, privacyMode, t, locale)
              : t("widget_snapshot.add_homework_when_appears", "Add homework when it appears"),
            timelineLabel: t("widget_snapshot.today", "Today")
          }),
    upcoming:
      upcoming.length > 0 && nextUpcoming
        ? {
            ...base,
            kind: "upcoming" as const,
            state: "ready" as const,
            headline: t("widget_snapshot.upcoming", "Upcoming"),
            value: formatWidgetValueLabel(nextUpcoming.dueAt, now, t, locale),
            detail: assignmentDisplayTitle(nextUpcoming, privacyMode, t),
            footnote: formatSnapshotTemplate(
              upcoming.length === 1
                ? t("widget_snapshot.one_open_deadline", "{count} open deadline")
                : t("widget_snapshot.open_deadline_count", "{count} open deadlines"),
              { count: upcoming.length }
            ),
            ...upcomingStyle,
            accentColor: upcomingAccent,
            progress: weekProgressStats.total > 0 ? weekProgressStats.progress : 0,
            signalLabel: daysUntil(nextUpcoming.dueAt, now) < 0 ? t("widget_snapshot.catch_up", "Catch up") : t("widget_snapshot.next_deadline", "Next deadline"),
            metricLabel: weekProgressStats.total > 0
              ? formatSnapshotTemplate(t("widget_snapshot.complete_count", "{done} of {total} complete"), {
                  done: weekProgressStats.done,
                  total: weekProgressStats.total
                })
              : effortMetricLabel(nextUpcoming, t),
            nextLabel: assignmentSignal(nextUpcoming, input.courses, now, privacyMode, t, locale),
            timelineLabel: formatDueLabel(nextUpcoming.dueAt, now, t, locale),
            items: upcoming.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now, privacyMode, upcomingAccent, t, locale))
          }
        : emptySnapshot({
            ...base,
            kind: "upcoming",
            state: "no_upcoming",
            headline: t("widget_snapshot.upcoming", "Upcoming"),
            value: t("widget_snapshot.clear", "Clear"),
            detail: t("widget_snapshot.no_upcoming_deadlines", "No upcoming deadlines"),
            footnote: reviewCount > 0
              ? t("widget_snapshot.review_imported_ready", "Review imported items when ready")
              : t("widget_snapshot.add_homework_when_appears", "Add homework when it appears"),
            ...upcomingStyle,
            progress: weekProgressStats.total > 0 ? weekProgressStats.progress : 0,
            signalLabel: t("widget_snapshot.clear_week", "Clear week"),
            metricLabel: reviewCount > 0
              ? formatSnapshotTemplate(t("widget_snapshot.to_review", "{count} to review"), { count: reviewCount })
              : weekProgressStats.total > 0
                ? formatSnapshotTemplate(t("widget_snapshot.complete_count", "{done} of {total} complete"), {
                    done: weekProgressStats.done,
                    total: weekProgressStats.total
                  })
              : t("widget_snapshot.no_open_work", "No open work"),
            nextLabel: reviewCount > 0
              ? t("widget_snapshot.approve_imported_first", "Approve imported items first")
              : t("widget_snapshot.add_homework_when_appears", "Add homework when it appears"),
            timelineLabel: t("widget_snapshot.upcoming", "Upcoming")
          })
  };
}

export async function syncStudyPlannerWidgets(input: WidgetSnapshotInput): Promise<WidgetSyncStatus> {
  const { t } = getSnapshotLocalization(input);

  if (input.settings?.syncEnabled === false) {
    if (getPlatformOS() === "ios") {
      const snapshots = buildSyncDisabledWidgetSnapshots(input);
      const widgets = loadNativeWidgetModule();
      if (widgets) {
        widgets.StudyPlannerTodayWidget.updateSnapshot(snapshots.today);
        widgets.StudyPlannerUpcomingWidget.updateSnapshot(snapshots.upcoming);
        return {
          state: "skipped",
          message: t(
            "widget_snapshot.sync_off_cleared_status",
            "Widget sync is off. Native widgets were cleared to a private off state."
          ),
          updatedAt: snapshots.today.generatedAt
        };
      }
    }

    return {
      state: "skipped",
      message: t("widget_snapshot.sync_off_settings_status", "Widget sync is off in StudyPlanner settings.")
    };
  }

  if (getPlatformOS() !== "ios") {
    return {
      state: "skipped",
      message: t("widget_snapshot.ios_only_status", "Native widgets are available on iOS builds.")
    };
  }

  const snapshots = buildStudyPlannerWidgetSnapshots(input);

  try {
    const widgets = loadNativeWidgetModule();
    if (!widgets) {
      return {
        state: "unavailable",
        message: t("widget_snapshot.install_native_status", "Install a native iOS build with the widget extension to add widgets.")
      };
    }

    widgets.StudyPlannerTodayWidget.updateSnapshot(snapshots.today);
    widgets.StudyPlannerUpcomingWidget.updateSnapshot(snapshots.upcoming);

    return {
      state: "synced",
      message: t("widget_snapshot.synced_status", "Today and Upcoming widgets are using reviewed planner data."),
      updatedAt: snapshots.today.generatedAt
    };
  } catch {
    return {
      state: "unavailable",
      message: t("widget_snapshot.install_native_status", "Install a native iOS build with the widget extension to add widgets.")
    };
  }
}

function buildSyncDisabledWidgetSnapshots(input: WidgetSnapshotInput) {
  const now = input.now || new Date();
  const { t } = getSnapshotLocalization(input);
  const generatedAt = now.toISOString();
  const base = {
    version: 1 as const,
    generatedAt,
    semesterName: input.semester.name,
    openURL: "studyplanner://widgets"
  };
  const todayStyle = getNativeWidgetStyle("today", findNativePreset("today", input.widgetPresets || []), input.settings, t);
  const upcomingStyle = getNativeWidgetStyle("upcoming", findNativePreset("upcoming", input.widgetPresets || []), input.settings, t);

  return {
    today: emptySnapshot({
      ...base,
      kind: "today",
      state: "sync_disabled" as const,
      headline: t("widget_snapshot.today", "Today"),
      value: t("widget_snapshot.off", "Off"),
      detail: t("widget_snapshot.widget_sync_off", "Widget sync is off"),
      footnote: t("widget_snapshot.turn_sync_on", "Turn sync on in StudyPlanner"),
      ...todayStyle,
      progress: 0,
      signalLabel: t("widget_snapshot.sync_off", "Sync off"),
      metricLabel: t("widget_snapshot.no_planner_data_shared", "No planner data shared"),
      nextLabel: t("widget_snapshot.open_widgets_settings", "Open Widgets settings"),
      timelineLabel: t("widget_snapshot.private", "Private")
    }),
    upcoming: emptySnapshot({
      ...base,
      kind: "upcoming",
      state: "sync_disabled" as const,
      headline: t("widget_snapshot.upcoming", "Upcoming"),
      value: t("widget_snapshot.off", "Off"),
      detail: t("widget_snapshot.widget_sync_off", "Widget sync is off"),
      footnote: t("widget_snapshot.native_widgets_cleared", "Native widgets were cleared"),
      ...upcomingStyle,
      progress: 0,
      signalLabel: t("widget_snapshot.sync_off", "Sync off"),
      metricLabel: t("widget_snapshot.no_planner_data_shared", "No planner data shared"),
      nextLabel: t("widget_snapshot.open_widgets_settings", "Open Widgets settings"),
      timelineLabel: t("widget_snapshot.private", "Private")
    })
  };
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

function getReviewedProgressAssignments(assignments: Assignment[]) {
  return assignments.filter(
    (assignment) =>
      assignment.status !== "archived" &&
      isValidDeadline(assignment.dueAt) &&
      !assignment.needsReview &&
      !assignment.duplicateOf
  );
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

function isRealWidgetAssignment(assignment: Assignment) {
  return !assignment.id.startsWith("demo-") && !assignment.sourceId?.startsWith("demo-");
}

function isRealParsedImport(parsedImport: ParsedImport) {
  return !parsedImport.id.startsWith("demo-");
}

function toWidgetItem(
  assignment: Assignment,
  courses: Course[],
  now: Date,
  privacyMode = false,
  fallbackColor = defaultAccent,
  t: WidgetSnapshotTranslate = defaultTranslate,
  locale = "en-US"
): StudyPlannerNativeWidgetItem {
  const course = courses.find((item) => item.id === assignment.courseId);
  return {
    id: assignment.id,
    title: assignmentDisplayTitle(assignment, privacyMode, t),
    courseCode: privacyMode ? t("widget_snapshot.class", "Class") : course?.code || t("widget_snapshot.class", "Class"),
    courseColor: privacyMode ? fallbackColor : readableWidgetAccent(course?.color, fallbackColor),
    dueLabel: formatDueLabel(assignment.dueAt, now, t, locale),
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

function assignmentDisplayTitle(
  assignment: Assignment,
  privacyMode: boolean,
  t: WidgetSnapshotTranslate = defaultTranslate
) {
  return privacyMode ? t("widget_snapshot.hidden_assignment", "Hidden assignment") : cleanTitle(assignment.title, t);
}

function assignmentSignal(
  assignment: Assignment | undefined,
  courses: Course[],
  now: Date,
  privacyMode = false,
  t: WidgetSnapshotTranslate = defaultTranslate,
  locale = "en-US"
) {
  if (!assignment) return t("widget_snapshot.open_studyplanner", "Open StudyPlanner");

  if (privacyMode) {
    return [
      formatDueLabel(assignment.dueAt, now, t, locale),
      assignment.priority === "high" ? t("widget_snapshot.high_priority", "High priority") : undefined
    ].filter(Boolean).join(" / ");
  }

  const course = courses.find((item) => item.id === assignment.courseId);
  const parts = [
    course?.code || t("widget_snapshot.class", "Class"),
    formatDueLabel(assignment.dueAt, now, t, locale),
    assignment.priority === "high" ? t("widget_snapshot.high_priority", "High priority") : undefined
  ].filter(Boolean);

  return parts.join(" / ");
}

function effortMetricLabel(assignment: Assignment, t: WidgetSnapshotTranslate = defaultTranslate) {
  const minutes = Math.max(5, Math.round((assignment.estimatedMinutes || 0) / 5) * 5);
  const priority =
    assignment.priority === "high"
      ? t("widget_snapshot.high", "High")
      : assignment.priority === "medium"
        ? t("widget_snapshot.medium", "Medium")
        : undefined;
  return [
    minutes ? formatSnapshotTemplate(t("widget_snapshot.minutes_open", "{minutes}m open"), { minutes }) : undefined,
    priority
  ].filter(Boolean).join(" / ");
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
  settings?: UserSettings,
  t: WidgetSnapshotTranslate = defaultTranslate
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
      ? t("more.smart_morning_time", "7-10 AM")
      : smartSlot === "between_classes"
        ? t("more.smart_between_time", "10 AM-3 PM")
        : smartSlot === "study_time"
          ? t("more.smart_study_time", "3-9 PM")
          : smartSlot === "night_review"
            ? t("more.smart_night_time", "9 PM+")
            : kind === "today"
              ? t("widget_snapshot.today", "Today")
              : t("widget_snapshot.upcoming", "Upcoming"));
  const layout = preset?.layout || "list";
  const densityLabel =
    preset?.size === "small"
      ? t("widget_snapshot.density_calm", "Calm")
      : layout === "compact" || layout === "list"
        ? t("widget_snapshot.density_compact", "Compact")
        : t("widget_snapshot.density_visual", "Visual");

  return {
    accentColor,
    backgroundColor: backgroundColors[background] || defaultBackground,
    styleLabel: `${widgetBackgroundLabel(background, t)} / ${widgetPaletteLabel(palette, t)}`,
    layoutLabel: widgetLayoutLabel(layout, t),
    densityLabel,
    windowLabel,
    courseScopeLabel: preset?.classFocusCourseId
      ? t("widget_snapshot.pinned_class", "Pinned class")
      : t("widget_snapshot.all_classes", "All classes"),
    progressLabel: kind === "today" ? t("widget_snapshot.day_plan", "Day plan") : t("widget_snapshot.due_map", "Due map"),
    progress: 0,
    iconKey: preset?.iconKey || (kind === "today" ? "check" : "calendar"),
    actionLabel: kind === "today" ? t("widget_snapshot.open_today", "Open Today") : t("widget_snapshot.open_upcoming", "Open Upcoming")
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

function widgetBackgroundLabel(background: WidgetBackground, t: WidgetSnapshotTranslate) {
  switch (background) {
    case "solid":
      return t("widget_snapshot.background_solid", "Solid");
    case "gradient":
      return t("widget_snapshot.background_gradient", "Gradient");
    case "dark":
      return t("widget_snapshot.background_dark", "Dark");
    case "glass":
    default:
      return t("widget_snapshot.background_glass", "Glass");
  }
}

function widgetPaletteLabel(palette: WidgetPalette | "custom", t: WidgetSnapshotTranslate) {
  switch (palette) {
    case "sunset":
      return t("more.palette_sunset", "Sunset");
    case "forest":
      return t("more.palette_forest", "Forest");
    case "lavender":
      return t("more.palette_lavender", "Lavender");
    case "midnight":
      return t("more.palette_midnight", "Midnight");
    case "candy":
      return t("more.palette_candy", "Candy");
    case "minimal":
      return t("more.palette_minimal", "Minimal");
    case "graphite":
      return t("more.palette_graphite", "Graphite");
    case "aurora":
      return t("more.palette_aurora", "Aurora");
    case "paper":
      return t("more.palette_paper", "Paper");
    case "custom":
      return t("widget_snapshot.palette_custom", "Custom");
    case "ocean":
    default:
      return t("more.palette_ocean", "Ocean");
  }
}

function widgetLayoutLabel(layout: WidgetPreset["layout"] | undefined, t: WidgetSnapshotTranslate) {
  switch (layout) {
    case "compact":
      return t("widget_snapshot.layout_compact", "Compact");
    case "ring":
      return t("widget_snapshot.layout_ring", "Ring");
    case "calendar":
      return t("widget_snapshot.layout_calendar", "Calendar");
    case "grid":
      return t("widget_snapshot.layout_grid", "Grid");
    case "list":
    default:
      return t("widget_snapshot.layout_list", "List");
  }
}

function labelize(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanTitle(value: string, t: WidgetSnapshotTranslate = defaultTranslate) {
  return value.trim().replace(/\s+/g, " ").slice(0, 72) || t("widget_snapshot.homework", "Homework");
}

function formatDueLabel(
  iso: string,
  now: Date,
  t: WidgetSnapshotTranslate = defaultTranslate,
  locale = "en-US"
) {
  if (!isValidDeadline(iso)) return t("widget_snapshot.review", "Review");

  const days = daysUntil(iso, now);
  if (days < 0) return t("widget_snapshot.overdue", "Overdue");
  if (days === 0) return t("widget_snapshot.today", "Today");
  if (days === 1) return t("widget_snapshot.tomorrow", "Tomorrow");
  if (days <= 6) return weekdayName(iso, locale);
  return shortDate(iso, locale);
}

function formatWidgetValueLabel(
  iso: string,
  now: Date,
  t: WidgetSnapshotTranslate = defaultTranslate,
  locale = "en-US"
) {
  if (!isValidDeadline(iso)) return t("widget_snapshot.review", "Review");

  const days = daysUntil(iso, now);
  if (days < 0) return t("widget_snapshot.late", "Late");
  if (days === 0) return t("widget_snapshot.today", "Today");
  if (days === 1) return t("widget_snapshot.tomorrow_short", "Tmrw");
  if (days <= 6) return weekdayName(iso, locale);
  return shortDate(iso, locale);
}

function weekdayName(iso: string, locale = "en-US") {
  return formatWidgetDate(iso, locale, { weekday: "short" });
}

function shortDate(iso: string, locale = "en-US") {
  return formatWidgetDate(iso, locale, {
    month: "short",
    day: "numeric"
  });
}

function formatWidgetDate(iso: string, locale: string, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(new Date(iso));
  }
}
