import { Platform } from "react-native";

import {
  Assignment,
  Course,
  ParsedImport,
  Semester
} from "../models";
import {
  daysUntil,
  getDueToday,
  getNeedsReview,
  getSchedulableAssignments,
  isValidDeadline
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
  openURL: string;
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
  demoMode: boolean;
  now?: Date;
};

type NativeWidgetModule = typeof import("../widgets/StudyPlannerWidgets");
declare const require: (path: string) => NativeWidgetModule;

const defaultAccent = "#2F80ED";
const defaultBackground = "#FFFDF4";

export function buildStudyPlannerWidgetSnapshots(input: WidgetSnapshotInput) {
  const now = input.now || new Date();
  const generatedAt = now.toISOString();
  const hasClasses = input.courses.length > 0;
  const reviewedAssignments = getReviewedAssignments(input.assignments);
  const reviewCount = getNeedsReview(input.assignments).length;
  const hasReviewedSyllabus = getHasReviewedSyllabus(input.assignments, input.parsedImports);
  const upcoming = getUpcomingAssignments(reviewedAssignments, now);
  const dueToday = getDueToday(reviewedAssignments, now);
  const base = {
    version: 1 as const,
    generatedAt,
    semesterName: input.semester.name,
    backgroundColor: defaultBackground,
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
        accentColor: "#8B5CF6"
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "demo",
        headline: "Upcoming",
        value: "Import",
        detail: "Widgets wait for real planner data",
        footnote: "Demo coursework is never shared",
        accentColor: "#8B5CF6"
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
        accentColor: defaultAccent
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state: "no_classes",
        headline: "Upcoming",
        value: "Class",
        detail: "Add a class first",
        footnote: "Then add or scan homework",
        accentColor: defaultAccent
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
        accentColor: defaultAccent
      }),
      upcoming: emptySnapshot({
        ...base,
        kind: "upcoming",
        state,
        headline: "Upcoming",
        value: hasReviewedSyllabus ? "Add" : "Review",
        detail,
        footnote,
        accentColor: defaultAccent
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
        accentColor: "#F59E0B"
      })
    };
  }

  const nextUpcoming = upcoming[0];
  const todayAccent = colorForAssignment(dueToday[0] || nextUpcoming, input.courses);
  const upcomingAccent = colorForAssignment(nextUpcoming, input.courses);

  return {
    today:
      dueToday.length > 0
        ? {
            ...base,
            kind: "today" as const,
            state: "ready" as const,
            headline: "Today",
            value: String(dueToday.length),
            detail: dueToday.length === 1 ? "task due today" : "tasks due today",
            footnote: nextUpcoming ? `Next: ${cleanTitle(nextUpcoming.title)}` : "Keep the day light",
            accentColor: todayAccent,
            items: dueToday.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now))
          }
        : emptySnapshot({
            ...base,
            kind: "today",
            state: "no_due_today",
            headline: "Today",
            value: "Clear",
            detail: "Nothing due today",
            footnote: nextUpcoming ? `Next: ${formatDueLabel(nextUpcoming.dueAt, now)}` : "No deadlines queued",
            accentColor: todayAccent
          }),
    upcoming:
      upcoming.length > 0 && nextUpcoming
        ? {
            ...base,
            kind: "upcoming" as const,
            state: "ready" as const,
            headline: "Upcoming",
            value: formatDueLabel(nextUpcoming.dueAt, now),
            detail: cleanTitle(nextUpcoming.title),
            footnote: `${upcoming.length} open deadline${upcoming.length === 1 ? "" : "s"}`,
            accentColor: upcomingAccent,
            items: upcoming.slice(0, 3).map((assignment) => toWidgetItem(assignment, input.courses, now))
          }
        : emptySnapshot({
            ...base,
            kind: "upcoming",
            state: "no_upcoming",
            headline: "Upcoming",
            value: "Clear",
            detail: "No upcoming deadlines",
            footnote: reviewCount > 0 ? "Review scanned items when ready" : "Add homework when it appears",
            accentColor: defaultAccent
          })
  };
}

export async function syncStudyPlannerWidgets(input: WidgetSnapshotInput): Promise<WidgetSyncStatus> {
  if (Platform.OS !== "ios") {
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
        message: "Install a native iOS build with the WidgetKit extension to add widgets."
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
      message: "Install a native iOS build with the WidgetKit extension to add widgets."
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

function emptySnapshot(
  value: Omit<StudyPlannerNativeWidgetProps, "items">
): StudyPlannerNativeWidgetProps {
  return {
    ...value,
    items: []
  };
}

function getReviewedAssignments(assignments: Assignment[]) {
  return getSchedulableAssignments(assignments)
    .filter((assignment) => !assignment.needsReview && !assignment.duplicateOf)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

function getUpcomingAssignments(assignments: Assignment[], now: Date) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return assignments
    .filter((assignment) => new Date(assignment.dueAt).getTime() >= startOfToday)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
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
  now: Date
): StudyPlannerNativeWidgetItem {
  const course = courses.find((item) => item.id === assignment.courseId);
  return {
    id: assignment.id,
    title: cleanTitle(assignment.title),
    courseCode: course?.code || "Class",
    courseColor: course?.color || defaultAccent,
    dueLabel: formatDueLabel(assignment.dueAt, now),
    priority: assignment.priority,
    kind: assignment.kind
  };
}

function colorForAssignment(assignment: Assignment | undefined, courses: Course[]) {
  if (!assignment) return defaultAccent;
  return courses.find((course) => course.id === assignment.courseId)?.color || defaultAccent;
}

function cleanTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 72) || "Homework";
}

function formatDueLabel(iso: string, now: Date) {
  if (!isValidDeadline(iso)) return "Review";

  const days = daysUntil(iso, now);
  if (days < 0) return "Overdue";
  if (days === 0) return `Today ${formatTime(iso)}`;
  if (days === 1) return `Tomorrow ${formatTime(iso)}`;
  if (days <= 6) return `${weekdayName(iso)} ${formatTime(iso)}`;
  return shortDate(iso);
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
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
