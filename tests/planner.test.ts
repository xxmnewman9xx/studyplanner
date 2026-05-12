import test from "node:test";
import assert from "node:assert/strict";

import { createDemoSemesterSeed, storeCaptureNow } from "../src/data/demoSemester";
import { buildTodayPlan, buildWeekPlan } from "../src/logic/planner";
import { buildMonthCalendarPlan, buildSemesterInsights } from "../src/logic/semesterInsights";

test("today plan separates overdue and this-week work", () => {
  const seed = createDemoSemesterSeed();
  const today = buildTodayPlan(seed.assignments, seed.semester, storeCaptureNow);

  assert.equal(today.overdue.length, 0);
  assert.equal(today.dueThisWeek.length, 5);
  assert.equal(today.dueToday.length, 0);
});

test("week plan groups demo capture work and flags heavy weeks", () => {
  const seed = createDemoSemesterSeed();
  const week = buildWeekPlan(seed.assignments, storeCaptureNow);

  assert.equal(week.itemCount, 5);
  assert.equal(week.examCount, 0);
  assert.equal(Boolean(week.heavyWorkloadWarning), true);
  assert.equal(week.days[0]?.label, "Today");
  assert.equal(week.days[1]?.items[0]?.id, "lab-report");
});

test("monthly calendar marks heavy days and month summary from real work", () => {
  const seed = createDemoSemesterSeed();
  const month = buildMonthCalendarPlan({
    assignments: seed.assignments,
    courses: seed.courses,
    now: storeCaptureNow,
    locale: "en-US"
  });

  const today = month.days.find((day) => day.date === "2025-04-22");
  const heavyDay = month.days.find((day) => day.date === "2025-04-23");

  assert.equal(month.monthLabel, "April 2025");
  assert.equal(month.summary.dueThisMonth, 6);
  assert.equal(month.summary.examCount, 1);
  assert.equal(month.summary.completedCount, 3);
  assert.equal(today?.isToday, true);
  assert.equal(today?.openItems.length, 0);
  assert.equal(heavyDay?.isHeavy, true);
  assert.equal(heavyDay?.openItems.length, 3);
});

test("monthly calendar respects Monday-start locales without changing assignment counts", () => {
  const seed = createDemoSemesterSeed();
  const sundayStart = buildMonthCalendarPlan({
    assignments: seed.assignments,
    courses: seed.courses,
    now: storeCaptureNow,
    locale: "en-US"
  });
  const mondayStart = buildMonthCalendarPlan({
    assignments: seed.assignments,
    courses: seed.courses,
    now: storeCaptureNow,
    locale: "en-GB"
  });

  assert.equal(sundayStart.weeks[0]?.[0]?.date, "2025-03-30");
  assert.equal(mondayStart.weeks[0]?.[0]?.date, "2025-03-31");
  assert.equal(mondayStart.summary.dueThisMonth, sundayStart.summary.dueThisMonth);
  assert.equal(mondayStart.days.find((day) => day.date === "2025-04-23")?.openItems.length, 3);
});

test("semester insights connect workload, courses, and completion", () => {
  const seed = createDemoSemesterSeed();
  const insights = buildSemesterInsights(seed.assignments, seed.courses, storeCaptureNow);

  assert.equal(insights.workloadByDay[0]?.count, 0);
  assert.equal(insights.weekItemCount, 5);
  assert.ok(insights.courseBalance[0]?.openCount);
  assert.equal(insights.completionPercent, 25);
});
