import {
  Assignment,
  Course,
  Semester,
  WidgetSnapshot,
  WidgetSnapshotItem,
  WidgetUrgency
} from "../models";
import { createWidgetStyleSnapshot, defaultThemePaletteId } from "../theme";
import { isAssignmentArchived, isAssignmentOpen } from "./assignmentModel";
import { parseValidDate } from "./dateUtils";
import { buildWeekPlan, daysUntil } from "./planner";
import { buildSemesterInsights, buildWidgetMonthlySnapshot } from "./semesterInsights";

export type WidgetSnapshotInput = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  paletteId?: string;
  widgetStyleId?: string;
  courseFocusId?: string;
  layoutId?: string;
  reviewQueueCount?: number;
  demoState?: WidgetSnapshot["demoState"];
};

export function buildWidgetSnapshot(
  input: WidgetSnapshotInput,
  now = new Date()
): WidgetSnapshot {
  const scopedCourse =
    input.courseFocusId && input.courseFocusId !== "all"
      ? input.courses.find((course) => course.id === input.courseFocusId)
      : undefined;
  const scopedAssignments = scopedCourse
    ? input.assignments.filter((assignment) => assignment.courseId === scopedCourse.id)
    : input.assignments;
  const openAssignments = scopedAssignments
    .filter((assignment) => isAssignmentOpen(assignment))
    .filter((assignment) => parseValidDate(assignment.dueAt))
    .sort((a, b) => parseValidDate(a.dueAt)!.getTime() - parseValidDate(b.dueAt)!.getTime());
  const weekPlan = buildWeekPlan(scopedAssignments, now);
  const thisWeek = weekPlan.days.flatMap((day) => day.items).map((assignment) =>
    toWidgetItem(assignment, input.courses, now)
  );
  const overdueCount = openAssignments.filter((assignment) => daysUntil(assignment.dueAt, now) < 0)
    .length;
  const scopedReviewQueueCount = scopedAssignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview" && !isAssignmentArchived(assignment)
  ).length;
  const reviewQueueCount = scopedCourse ? scopedReviewQueueCount : input.reviewQueueCount ?? scopedReviewQueueCount;
  const nextDue = openAssignments[0]
    ? toWidgetItem(openAssignments[0], input.courses, now)
    : undefined;
  const heavyWeekWarning = weekPlan.heavyWorkloadWarning
    ? {
        isHeavy: true,
        label: weekPlan.heavyWorkloadWarning,
        itemCount: weekPlan.itemCount,
        examCount: weekPlan.examCount
      }
    : undefined;
  const emptyState = {
    isEmpty: openAssignments.length === 0,
    title: scopedCourse ? `No ${scopedCourse.code} deadlines` : "No upcoming deadlines",
    message:
      scopedAssignments.length === 0
        ? "Add school stuff to see what is due next."
        : "Everything due is complete."
  };
  const generatedAt = now.toISOString();
  const insights = buildSemesterInsights(scopedAssignments, input.courses, now);
  const monthly = buildWidgetMonthlySnapshot(scopedAssignments, input.courses, now);
  const widgetStyle = createWidgetStyleSnapshot(
    input.paletteId || defaultThemePaletteId,
    input.widgetStyleId
  );

  return {
    version: 1,
    generatedAt,
    lastUpdated: generatedAt,
    semesterId: input.semester.id,
    semesterName: input.semester.name,
    scope: {
      courseFocusId: scopedCourse?.id || "all",
      courseName: scopedCourse?.code || scopedCourse?.name,
      layoutId: input.layoutId || "standard"
    },
    nextDue,
    thisWeek,
    overdueCount,
    reviewQueueCount,
    heavyWeekWarning,
    emptyState,
    widgetStyle,
    monthly,
    insights,
    demoState: input.demoState,
    surfaces: {
      small: {
        kind: "nextDue",
        item: nextDue,
        emptyTitle: nextDue ? undefined : emptyState.title
      },
      medium: {
        kind: "thisWeek",
        items: thisWeek.slice(0, 4),
        overflowCount: Math.max(0, thisWeek.length - 4)
      },
      large: {
        kind: "weeklyWorkload",
        items: thisWeek,
        heavyWeekWarning
      },
      lockScreen: {
        kind: "countdown",
        item: nextDue,
        countdownLabel: nextDue ? nextDue.dueLabel : undefined
      },
      monthly: {
        kind: "monthlyCalendar",
        monthLabel: monthly.monthLabel,
        dueThisMonth: monthly.dueThisMonth,
        examCount: monthly.examCount,
        heavyDayCount: monthly.heavyDayCount
      },
      heavyWeek: {
        kind: "heavyWeek",
        warning: heavyWeekWarning,
        workloadByDay: insights.workloadByDay
      },
      courseFocus: {
        kind: "courseFocus",
        courses: insights.courseBalance.slice(0, 3)
      }
    }
  };
}

function toWidgetItem(
  assignment: Assignment,
  courses: Course[],
  now: Date
): WidgetSnapshotItem {
  const course = courses.find((item) => item.id === assignment.courseId);
  const days = daysUntil(assignment.dueAt, now);
  const urgency = urgencyFromDays(days);

  return {
    assignmentId: assignment.id,
    title: assignment.title,
    courseId: assignment.courseId,
    courseName: assignment.courseName || course?.name || course?.code || "Course",
    courseColor: course?.color,
    dueAt: assignment.dueAt,
    type: assignment.type,
    dueLabel: dueLabel(days),
    urgency,
    urgencyLabel: urgencyLabelFromUrgency(urgency),
    reviewStatus: assignment.reviewStatus,
    completionStatus: assignment.completionStatus
  };
}

function urgencyFromDays(days: number): WidgetUrgency {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  return "upcoming";
}

function urgencyLabelFromUrgency(urgency: WidgetUrgency) {
  switch (urgency) {
    case "overdue":
      return "Overdue";
    case "today":
      return "Due today";
    case "soon":
      return "Due soon";
    case "upcoming":
      return "Upcoming";
    case "empty":
    default:
      return "No work";
  }
}

function dueLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}
