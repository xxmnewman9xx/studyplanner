import test from "node:test";
import assert from "node:assert/strict";

import { createDemoSemesterSeed, storeCaptureNow } from "../src/data/demoSemester";
import { buildTodayPlan, buildWeekPlan } from "../src/logic/planner";

test("today plan separates overdue and this-week work", () => {
  const seed = createDemoSemesterSeed();
  const today = buildTodayPlan(seed.assignments, seed.semester, storeCaptureNow);

  assert.equal(today.overdue.length, 2);
  assert.equal(today.dueThisWeek.length, 5);
  assert.equal(today.dueToday.length, 1);
});

test("week plan groups demo capture work and flags heavy weeks", () => {
  const seed = createDemoSemesterSeed();
  const week = buildWeekPlan(seed.assignments, storeCaptureNow);

  assert.equal(week.itemCount, 5);
  assert.equal(week.examCount, 1);
  assert.equal(Boolean(week.heavyWorkloadWarning), true);
  assert.equal(week.days[0]?.label, "Today");
  assert.equal(week.days[4]?.exams[0]?.id, "bio-midterm-cells");
});
