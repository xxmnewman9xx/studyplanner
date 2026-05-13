import { Assignment, SyllabusParseResult } from "../models";

export function foundWorkNeedsReviewCount(draft: SyllabusParseResult | null | undefined) {
  return (
    draft?.assignments.filter((assignment) => assignment.reviewStatus === "needsReview").length || 0
  );
}

export function foundWorkActiveCount(draft: SyllabusParseResult | null | undefined) {
  return (
    draft?.assignments.filter((assignment) => assignment.reviewStatus !== "ignored").length || 0
  );
}

export function removePromotedFoundWork(
  draft: SyllabusParseResult | null | undefined,
  promotedAssignments: Assignment[]
): SyllabusParseResult | null {
  if (!draft) return null;

  const promotedIds = new Set(promotedAssignments.map((assignment) => assignment.id));
  const remainingAssignments = draft.assignments.filter(
    (assignment) => !promotedIds.has(assignment.id)
  );
  const hasActiveRemaining = remainingAssignments.some(
    (assignment) => assignment.reviewStatus !== "ignored"
  );

  if (!hasActiveRemaining) return null;

  const remainingCourseIds = new Set(
    remainingAssignments
      .filter((assignment) => assignment.reviewStatus !== "ignored")
      .map((assignment) => assignment.courseId)
  );

  return {
    ...draft,
    assignments: remainingAssignments,
    courses: draft.courses.filter((course) => remainingCourseIds.has(course.id)),
    gradeItems: draft.gradeItems.filter((item) => remainingCourseIds.has(item.courseId)),
    syllabusSource: draft.syllabusSource
      ? {
          ...draft.syllabusSource,
          courseIds: Array.from(remainingCourseIds),
          assignmentIds: remainingAssignments.map((assignment) => assignment.id)
        }
      : draft.syllabusSource
  };
}
