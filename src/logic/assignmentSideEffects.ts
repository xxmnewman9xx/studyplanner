import { Assignment } from "../models";
import { isAssignmentOpen } from "./assignmentModel";
import { parseValidDate } from "./dateUtils";

export type AssignmentWithValidDueDate = {
  assignment: Assignment;
  dueDate: Date;
};

export function openAssignmentsWithValidDueDates(
  assignments: Assignment[]
): AssignmentWithValidDueDate[] {
  return assignments.flatMap((assignment) => {
    if (!isAssignmentOpen(assignment)) return [];
    const dueDate = parseValidDate(assignment.dueAt);
    return dueDate ? [{ assignment, dueDate }] : [];
  });
}

export function assignmentPatchInvalidatesSideEffects(patch: Partial<Assignment>) {
  return Boolean(
    patch.status === "archived" ||
      patch.reviewStatus === "ignored" ||
      patch.status === "done" ||
      patch.completionStatus === "completed" ||
      typeof patch.title === "string" ||
      typeof patch.dueAt === "string" ||
      typeof patch.courseId === "string" ||
      typeof patch.courseName === "string" ||
      typeof patch.kind === "string" ||
      typeof patch.type === "string" ||
      typeof patch.priority === "string"
  );
}

export function sideEffectClearingPatch(patch: Partial<Assignment>): Partial<Assignment> {
  if (!assignmentPatchInvalidatesSideEffects(patch)) return patch;
  return {
    ...patch,
    reminderIds: [],
    externalCalendarEventId: undefined
  };
}
