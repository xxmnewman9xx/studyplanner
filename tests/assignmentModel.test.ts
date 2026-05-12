import test from "node:test";
import assert from "node:assert/strict";

import {
  completionStatusFromStatus,
  isAssignmentCompleted,
  isAssignmentConfirmed,
  isAssignmentOpen,
  normalizeAssignment,
  withAssignmentPatch
} from "../src/logic/assignmentModel";
import { Course } from "../src/models";

const course: Course = {
  id: "bio-101",
  code: "BIO 101",
  name: "Intro Biology",
  color: "#22577A",
  meetings: [],
  gradeCategories: []
};

test("normalizes legacy syllabus assignments into the v1.1 contract", () => {
  const assignment = normalizeAssignment(
    {
      id: "bio-exam-1",
      courseId: course.id,
      title: "Exam 1",
      kind: "exam",
      dueAt: "2026-09-18T09:00:00",
      status: "not_started",
      source: "syllabus"
    },
    [course],
    new Date("2026-08-24T12:00:00Z")
  );

  assert.equal(assignment.courseName, "Intro Biology");
  assert.equal(assignment.type, "exam");
  assert.equal(assignment.kind, "exam");
  assert.equal(assignment.reviewStatus, "needsReview");
  assert.equal(assignment.completionStatus, "open");
  assert.equal(assignment.reminderPreset, "week_before");
  assert.equal(assignment.createdAt, "2026-08-24T12:00:00.000Z");
});

test("unreviewed syllabus work is not a confirmed open assignment", () => {
  const assignment = normalizeAssignment(
    {
      id: "bio-reading",
      courseId: course.id,
      title: "Chapter 2 reading",
      dueAt: "2026-09-20T23:59:00",
      source: "syllabus"
    },
    [course],
    new Date("2026-08-24T12:00:00Z")
  );

  assert.equal(assignment.reviewStatus, "needsReview");
  assert.equal(isAssignmentConfirmed(assignment), false);
  assert.equal(isAssignmentOpen(assignment), false);

  const accepted = withAssignmentPatch(assignment, { reviewStatus: "accepted" }, [course]);
  assert.equal(isAssignmentConfirmed(accepted), true);
  assert.equal(isAssignmentOpen(accepted), true);
});

test("completion status transitions stay compatible with legacy status", () => {
  const assignment = normalizeAssignment(
    {
      id: "bio-lab",
      courseId: course.id,
      title: "Lab report",
      dueAt: "2026-09-14T23:59:00",
      status: "not_started",
      source: "manual"
    },
    [course],
    new Date("2026-08-24T12:00:00Z")
  );

  const completed = withAssignmentPatch(
    assignment,
    { status: "done" },
    [course],
    new Date("2026-09-01T12:00:00Z")
  );

  assert.equal(completionStatusFromStatus("done"), "completed");
  assert.equal(completed.status, "done");
  assert.equal(completed.completionStatus, "completed");
  assert.equal(completed.updatedAt, "2026-09-01T12:00:00.000Z");
  assert.equal(isAssignmentCompleted(completed), true);
  assert.equal(isAssignmentOpen(completed), false);
});
