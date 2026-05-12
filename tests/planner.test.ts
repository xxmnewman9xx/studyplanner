import test from "node:test";
import assert from "node:assert/strict";

import { createDemoSemesterSeed, storeCaptureNow } from "../src/data/demoSemester";
import { buildTodayPlan, buildWeekPlan } from "../src/logic/planner";
import { buildMonthCalendarPlan, buildSemesterInsights } from "../src/logic/semesterInsights";

test("today plan separates overdue and this-week work", () => {
  const seed = createDemoSemesterSeed();
  const today = buildTodayPlan(seed.assignments, seed.semester, storeCaptureNow);

  assert.equal(today.overdue.length, 0);
  assert.equal(today.dueThisWeek.length, 6);
  assert.equal(today.dueToday.length, 3);
});

test("week plan groups demo capture work and flags heavy weeks", () => {
  const seed = createDemoSemesterSeed();
  const week = buildWeekPlan(seed.assignments, storeCaptureNow);

  assert.equal(week.itemCount, 6);
  assert.equal(week.examCount, 0);
  assert.equal(Boolean(week.heavyWorkloadWarning), true);
  assert.equal(week.days[0]?.label, "Today");
  assert.equal(week.days[4]?.items[0]?.id, "weekly-quiz-5");
});

test("monthly calendar marks heavy days and month summary from real work", () => {
  const seed = createDemoSemesterSeed();
  const month = buildMonthCalendarPlan({
    assignments: seed.assignments,
    courses: seed.courses,
    now: storeCaptureNow
  });

  const today = month.days.find((day) => day.date === "2025-03-10");

  assert.equal(month.monthLabel, "March 2025");
  assert.equal(month.summary.dueThisMonth, 9);
  assert.equal(month.summary.examCount, 1);
  assert.equal(month.summary.completedCount, 2);
  assert.equal(today?.isHeavy, true);
  assert.equal(today?.openItems.length, 3);
});

test("semester insights connect workload, courses, and completion", () => {
  const seed = createDemoSemesterSeed();
  const insights = buildSemesterInsights(seed.assignments, seed.courses, storeCaptureNow);

  assert.equal(insights.workloadByDay[0]?.count, 3);
  assert.equal(insights.weekItemCount, 6);
  assert.ok(insights.courseBalance[0]?.openCount);
  assert.equal(insights.completionPercent, 14);
});
