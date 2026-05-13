import test from "node:test";
import assert from "node:assert/strict";

import { createDemoSyllabusParseResult } from "../src/data/demoSemester";
import {
  foundWorkActiveCount,
  foundWorkNeedsReviewCount,
  removePromotedFoundWork
} from "../src/logic/foundWorkInbox";

test("found work inbox counts only unignored review work", () => {
  const draft = createDemoSyllabusParseResult();

  assert.equal(
    foundWorkNeedsReviewCount(draft),
    draft.assignments.filter((assignment) => assignment.reviewStatus === "needsReview").length
  );
  assert.equal(foundWorkActiveCount(draft), draft.assignments.length);
});

test("promoted found work leaves only remaining active rows in the inbox", () => {
  const draft = createDemoSyllabusParseResult();
  const promotedAssignment = { ...draft.assignments[0]!, reviewStatus: "accepted" as const };
  const promoted = [promotedAssignment];
  const next = removePromotedFoundWork(draft, promoted);

  assert.ok(next);
  assert.ok(!next.assignments.some((assignment) => assignment.id === promotedAssignment.id));
  assert.equal(next.assignments.length, draft.assignments.length - 1);
});

test("promoting the only active rows clears the inbox", () => {
  const draft = createDemoSyllabusParseResult();
  const promoted = draft.assignments;

  assert.equal(removePromotedFoundWork(draft, promoted), null);
});
