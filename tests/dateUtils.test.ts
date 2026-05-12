import test from "node:test";
import assert from "node:assert/strict";

import { buildTodayPlan, formatShortDate } from "../src/logic/planner";
import {
  daysBetweenDateKeys,
  formatDateOnlySafe,
  formatShortDateSafe,
  getWeekStartsOn,
  isValidDateKey,
  makeDueAt,
  normalizeDueAt,
  weekOffsetFromStart
} from "../src/logic/dateUtils";
import { defaultSemester } from "../src/data/defaultPlanner";
import { Assignment } from "../src/models";

test("date utilities reject impossible calendar dates", () => {
  assert.equal(isValidDateKey("2026-02-29"), false);
  assert.equal(isValidDateKey("2028-02-29"), true);
  assert.equal(makeDueAt("tomorrow"), undefined);
  assert.equal(normalizeDueAt("2026-02-31T23:59:00"), undefined);
});

test("planner ignores invalid due dates instead of crashing", () => {
  const assignment: Assignment = {
    id: "bad-date",
    courseId: "math",
    courseName: "Math",
    title: "Bad manual date",
    type: "assignment",
    kind: "assignment",
    dueAt: "tomorrowT23:59:00",
    sourceText: "Bad manual date",
    confidence: 1,
    reviewStatus: "accepted",
    completionStatus: "open",
    reminderPreset: "day_before",
    createdAt: "2026-05-12T12:00:00.000Z",
    updatedAt: "2026-05-12T12:00:00.000Z",
    tags: ["homework"],
    priority: "medium",
    estimatedMinutes: 30,
    status: "not_started",
    source: "manual"
  };

  const plan = buildTodayPlan([assignment], defaultSemester, new Date("2026-05-12T12:00:00"));
  assert.equal(plan.openCount, 0);
  assert.equal(formatShortDate(assignment.dueAt), "Date needs check");
});

test("date-key day counts are stable across daylight saving boundaries", () => {
  const fallBackNow = new Date("2026-11-01T09:00:00-05:00");
  const springForwardNow = new Date("2026-03-08T09:00:00-04:00");

  assert.equal(daysBetweenDateKeys("2026-11-02", fallBackNow), 1);
  assert.equal(daysBetweenDateKeys("2026-03-09", springForwardNow), 1);
  assert.equal(daysBetweenDateKeys("2026-11-01", fallBackNow), 0);
});

test("week-start helpers support Sunday, Monday, and Saturday locales", () => {
  assert.equal(getWeekStartsOn("en-US"), 0);
  assert.equal(getWeekStartsOn("en-GB"), 1);
  assert.equal(getWeekStartsOn("de-DE"), 1);
  assert.equal(getWeekStartsOn("ar-EG"), 6);

  assert.equal(weekOffsetFromStart(new Date("2025-06-01T12:00:00"), 0), 0);
  assert.equal(weekOffsetFromStart(new Date("2025-06-01T12:00:00"), 1), 6);
});

test("date formatters respect 24-hour locales", () => {
  const french = formatShortDateSafe("2026-09-18T15:30:00", "Date needs check", "fr-FR");
  const british = formatShortDateSafe("2026-09-18T15:30:00", "Date needs check", "en-GB");
  const dateOnly = formatDateOnlySafe("2026-09-18", "Date needs check", "de-DE");

  assert.match(french, /15:30/);
  assert.match(british, /15:30/);
  assert.doesNotMatch(french, /AM|PM/i);
  assert.doesNotMatch(british, /AM|PM/i);
  assert.match(dateOnly, /2026/);
});
