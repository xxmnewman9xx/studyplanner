import test from "node:test";
import assert from "node:assert/strict";

import { createDemoSemesterSeed, storeCaptureNow } from "../src/data/demoSemester";
import { buildWidgetSnapshot } from "../src/logic/widgetSnapshot";

test("widget snapshot selects next due and overdue counts", () => {
  const seed = createDemoSemesterSeed();
  const snapshot = buildWidgetSnapshot(seed, storeCaptureNow);

  assert.equal(snapshot.nextDue?.assignmentId, "lab-report");
  assert.equal(snapshot.nextDue?.urgency, "soon");
  assert.equal(snapshot.overdueCount, 0);
  assert.ok(snapshot.reviewQueueCount > 0);
});

test("widget snapshot prepares this-week surfaces and heavy warning", () => {
  const seed = createDemoSemesterSeed();
  const snapshot = buildWidgetSnapshot(seed, storeCaptureNow);

  assert.equal(snapshot.thisWeek.length, 5);
  assert.equal(snapshot.surfaces.small.kind, "nextDue");
  assert.equal(snapshot.surfaces.medium.items.length, 4);
  assert.equal(snapshot.surfaces.medium.overflowCount, 1);
  assert.equal(snapshot.nextDue?.courseColor, seed.courses.find((course) => course.id === "chem-101")?.color);
  assert.equal(snapshot.surfaces.large.heavyWeekWarning?.isHeavy, true);
  assert.equal(snapshot.surfaces.lockScreen.countdownLabel, "Tomorrow");
  assert.equal(snapshot.surfaces.monthly.dueThisMonth, snapshot.monthly?.dueThisMonth);
  assert.ok(snapshot.surfaces.monthly.dueThisMonth > 0);
  assert.equal(snapshot.surfaces.heavyWeek.workloadByDay[1]?.count, 3);
  assert.ok(snapshot.widgetStyle?.paletteId);
});

test("widget snapshot has a useful empty state", () => {
  const seed = createDemoSemesterSeed();
  const snapshot = buildWidgetSnapshot(
    {
      ...seed,
      assignments: []
    },
    storeCaptureNow
  );

  assert.equal(snapshot.emptyState.isEmpty, true);
  assert.equal(snapshot.surfaces.small.emptyTitle, "No upcoming deadlines");
  assert.equal(snapshot.emptyState.message, "Add school stuff to see what is due next.");
  assert.equal(snapshot.thisWeek.length, 0);
});

test("widget snapshot can scope small and medium surfaces to one class", () => {
  const seed = createDemoSemesterSeed();
  const snapshot = buildWidgetSnapshot(
    {
      ...seed,
      courseFocusId: "chem-101",
      layoutId: "compact"
    },
    storeCaptureNow
  );

  assert.equal(snapshot.scope?.courseFocusId, "chem-101");
  assert.equal(snapshot.scope?.courseName, "Chemistry 101");
  assert.equal(snapshot.scope?.layoutId, "compact");
  assert.ok(snapshot.thisWeek.length > 0);
  assert.ok(snapshot.thisWeek.every((item) => item.courseId === "chem-101"));
  assert.equal(snapshot.surfaces.small.item?.courseId, "chem-101");
  assert.ok(snapshot.surfaces.medium.items.every((item) => item.courseId === "chem-101"));
});

test("demo widget snapshot is deterministic", () => {
  const seed = createDemoSemesterSeed();
  const first = buildWidgetSnapshot(seed, storeCaptureNow);
  const second = buildWidgetSnapshot(seed, storeCaptureNow);

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.demoState, undefined);
});
