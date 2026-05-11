import {
  Assignment,
  Course,
  Semester,
  WidgetSnapshot,
  WidgetSnapshotItem,
  WidgetUrgency
} from "../models";
import { isAssignmentArchived, isAssignmentOpen } from "./assignmentModel";
import { buildWeekPlan, daysUntil } from "./planner";

export type WidgetSnapshotInput = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  demoState?: WidgetSnapshot["demoState"];
};

export function buildWidgetSnapshot(
  input: WidgetSnapshotInput,
  now = new Date()
): WidgetSnapshot {
  const openAssignments = input.assignments
    .filter((assignment) => isAssignmentOpen(assignment))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const weekPlan = buildWeekPlan(input.assignments, now);
  const thisWeek = weekPlan.days.flatMap((day) => day.items).map((assignment) =>
    toWidgetItem(assignment, input.courses, now)
  );
  const overdueCount = openAssignments.filter((assignment) => daysUntil(assignment.dueAt, now) < 0)
    .length;
  const reviewQueueCount = input.assignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview" && !isAssignmentArchived(assignment)
  ).length;
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
    title: input.assignments.length === 0 ? "No plan yet" : "All clear",
    message:
      input.assignments.length === 0
        ? "Scan a syllabus or add coursework to fill your widget."
        : "No open deadlines are waiting right now."
  };
  const generatedAt = now.toISOString();

  return {
    version: 1,
    generatedAt,
    lastUpdated: generatedAt,
    semesterId: input.semester.id,
    semesterName: input.semester.name,
    nextDue,
    thisWeek,
    overdueCount,
    reviewQueueCount,
    heavyWeekWarning,
    emptyState,
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
