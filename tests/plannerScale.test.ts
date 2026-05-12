import test from "node:test";
import assert from "node:assert/strict";

import { buildTodayPlan, buildWeekPlan } from "../src/logic/planner";
import { buildMonthCalendarPlan, buildSemesterInsights } from "../src/logic/semesterInsights";
import { buildWidgetSnapshot } from "../src/logic/widgetSnapshot";
import { Assignment, Course, Semester } from "../src/models";
import { courseColorAt } from "../src/theme";

const now = new Date("2026-09-01T10:00:00");
const semester: Semester = {
  id: "scale-fall-2026",
  name: "Fall 2026",
  startDate: "2026-08-24",
  endDate: "2026-12-11"
};

test("planner surfaces handle 12 classes and 500 assignments", () => {
  const courses = makeCourses(12);
  const assignments = makeAssignments(courses, 500);

  const today = buildTodayPlan(assignments, semester, now);
  const week = buildWeekPlan(assignments, now);
  const month = buildMonthCalendarPlan({ assignments, courses, now });
  const insights = buildSemesterInsights(assignments, courses, now);
  const widget = buildWidgetSnapshot({ semester, courses, assignments }, now);

  assert.equal(today.openCount, 450);
  assert.ok(today.nextAction);
  assert.equal(week.days.length, 7);
  assert.ok(week.itemCount > 0);
  assert.equal(month.days.length, 42);
  assert.ok(month.summary.dueThisMonth > 0);
  assert.equal(insights.courseBalance.length, 12);
  assert.ok(widget.thisWeek.length > 0);
  assert.equal(widget.surfaces.medium.items.length <= 4, true);
});

function makeCourses(count: number): Course[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `course-${index + 1}`,
    code: `CLASS ${index + 1}`,
    name: `Scale Class ${index + 1}`,
    color: courseColorAt(index),
    meetings: [],
    gradeCategories: []
  }));
}

function makeAssignments(courses: Course[], count: number): Assignment[] {
  return Array.from({ length: count }, (_, index) => {
    const course = courses[index % courses.length]!;
    const day = 1 + (index % 60);
    const date = new Date(2026, 8, day, index % 5 === 0 ? 9 : 23, index % 5 === 0 ? 0 : 59);
    const done = index % 10 === 0;

    return {
      id: `scale-${index + 1}`,
      courseId: course.id,
      courseName: course.name,
      title: `Scale assignment ${index + 1}`,
      type: index % 17 === 0 ? "exam" : "assignment",
      kind: index % 17 === 0 ? "exam" : "assignment",
      dueAt: toLocalIso(date),
      sourceText: `Scale assignment ${index + 1}`,
      confidence: 1,
      reviewStatus: "accepted",
      completionStatus: done ? "completed" : "open",
      reminderPreset: index % 17 === 0 ? "week_before" : "day_before",
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      tags: ["scale"],
      priority: index % 17 === 0 ? "high" : "medium",
      estimatedMinutes: index % 17 === 0 ? 150 : 45,
      status: done ? "done" : "not_started",
      source: "manual"
    };
  });
}

function toLocalIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:00`;
}
