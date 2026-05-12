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
