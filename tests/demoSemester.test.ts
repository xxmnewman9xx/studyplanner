import test from "node:test";
import assert from "node:assert/strict";

import { isStoreCaptureEnabled } from "../src/config/storeCapture";
import { createDemoSemesterSeed, storeCaptureNow } from "../src/data/demoSemester";
import { addDaysLocal, startOfLocalDay, toDateKey } from "../src/logic/dateUtils";
import { daysUntil } from "../src/logic/planner";

test("demo semester seed is deterministic and shaped for store capture", () => {
  const first = createDemoSemesterSeed();
  const second = createDemoSemesterSeed();

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.courses.length, 5);
  assert.equal(first.assignments.length, 15);
  assert.equal(first.assignments.filter((assignment) => assignment.type !== "exam").length, 13);
  assert.equal(first.assignments.filter((assignment) => assignment.type === "exam").length, 2);
  assert.equal(first.syllabusSources.length, 1);
  assert.equal(first.onboarded, true);
  assert.equal(first.paywallSeen, true);
});

test("demo semester includes overdue, this-week, and mixed-review states", () => {
  const seed = createDemoSemesterSeed();
  const now = storeCaptureNow.getTime();
  const weekStart = startOfLocalDay(storeCaptureNow).getTime();
  const weekEnd = addDaysLocal(startOfLocalDay(storeCaptureNow), 6).getTime() + 86_399_999;
  const open = seed.assignments.filter((assignment) => assignment.completionStatus === "open");
  const overdue = open.filter((assignment) => new Date(assignment.dueAt).getTime() < now);
  const dueThisWeek = open.filter((assignment) => {
    const due = new Date(assignment.dueAt).getTime();
    return due >= weekStart && due <= weekEnd;
  });
  const needsReview = seed.assignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview"
  );

  assert.equal(overdue.length, 0);
  assert.equal(dueThisWeek.length, 8);
  assert.ok(needsReview.some((assignment) => assignment.confidence < 0.7));
  assert.ok(needsReview.some((assignment) => assignment.confidence >= 0.8));
});

test("demo widget dates stay near the capture date", () => {
  const fixedNow = new Date("2026-05-12T09:41:00-04:00");
  const seed = createDemoSemesterSeed(fixedNow);
  const labReport = seed.assignments.find((assignment) => assignment.id === "lab-report");
  const problemSet = seed.assignments.find((assignment) => assignment.id === "problem-set-4");

  assert.equal(toDateKey(storeCaptureNow).length, 10);
  assert.equal(labReport && daysUntil(labReport.dueAt, fixedNow), 1);
  assert.equal(problemSet && daysUntil(problemSet.dueAt, fixedNow), 0);
});

test("store capture mode only enables on the exact public preview flag", () => {
  const original = process.env.EXPO_PUBLIC_STORE_CAPTURE;
  try {
    delete process.env.EXPO_PUBLIC_STORE_CAPTURE;
    assert.equal(isStoreCaptureEnabled(), false);

    process.env.EXPO_PUBLIC_STORE_CAPTURE = "0";
    assert.equal(isStoreCaptureEnabled(), false);

    process.env.EXPO_PUBLIC_STORE_CAPTURE = "true";
    assert.equal(isStoreCaptureEnabled(), false);

    process.env.EXPO_PUBLIC_STORE_CAPTURE = "1";
    assert.equal(isStoreCaptureEnabled(), true);
  } finally {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_STORE_CAPTURE;
    } else {
      process.env.EXPO_PUBLIC_STORE_CAPTURE = original;
    }
  }
});
