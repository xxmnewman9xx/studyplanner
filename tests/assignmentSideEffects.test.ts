import test from "node:test";
import assert from "node:assert/strict";

import {
  assignmentPatchInvalidatesSideEffects,
  openAssignmentsWithValidDueDates,
  sideEffectClearingPatch
} from "../src/logic/assignmentSideEffects";
import { Assignment } from "../src/models";

const baseAssignment: Assignment = {
  id: "assignment",
  courseId: "math",
  courseName: "Math",
  title: "Homework",
  type: "assignment",
  kind: "assignment",
  dueAt: "2026-09-14T23:59:00",
  sourceText: "Homework",
  confidence: 1,
  reviewStatus: "accepted",
  completionStatus: "open",
  reminderPreset: "day_before",
  createdAt: "2026-08-24T12:00:00.000Z",
  updatedAt: "2026-08-24T12:00:00.000Z",
  tags: ["homework"],
  priority: "medium",
  estimatedMinutes: 30,
  status: "not_started",
  source: "manual"
};

test("side-effect assignment selection skips invalid legacy due dates", () => {
  const selected = openAssignmentsWithValidDueDates([
    baseAssignment,
    {
      ...baseAssignment,
      id: "bad-date",
      dueAt: "tomorrowT23:59:00"
    },
    {
      ...baseAssignment,
      id: "needs-review",
      reviewStatus: "needsReview"
    }
  ]);

  assert.deepEqual(
    selected.map(({ assignment }) => assignment.id),
    ["assignment"]
  );
  assert.equal(Number.isNaN(selected[0]?.dueDate.getTime()), false);
});

test("assignment side effects stay attached for harmless patches", () => {
  assert.equal(assignmentPatchInvalidatesSideEffects({ estimatedMinutes: 45 }), false);
  assert.deepEqual(sideEffectClearingPatch({ estimatedMinutes: 45 }), { estimatedMinutes: 45 });
});

test("assignment side effects clear when schedule-critical fields change", () => {
  const patch = sideEffectClearingPatch({ dueAt: "2026-09-18T23:59:00" });

  assert.deepEqual(patch, {
    dueAt: "2026-09-18T23:59:00",
    reminderIds: [],
    externalCalendarEventId: undefined
  });
});

test("assignment side effects clear when work is completed or archived", () => {
  assert.equal(assignmentPatchInvalidatesSideEffects({ status: "done" }), true);
  assert.equal(assignmentPatchInvalidatesSideEffects({ status: "archived" }), true);
  assert.equal(assignmentPatchInvalidatesSideEffects({ reviewStatus: "ignored" }), true);
});
