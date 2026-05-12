import test from "node:test";
import assert from "node:assert/strict";

import { buildTrustedParsedPlan } from "../src/logic/importTrust";
import { SyllabusParseResult } from "../src/models";

const parse: SyllabusParseResult = {
  sourceName: "mixed syllabus",
  semesterName: "Fall 2026",
  semesterStartDate: "2026-08-24",
  semesterEndDate: "2026-12-11",
  courses: [
    {
      id: "math",
      code: "MATH 6",
      name: "Math",
      color: "#2563EB",
      meetings: [],
      gradeCategories: []
    },
    {
      id: "science",
      code: "SCI 6",
      name: "Science",
      color: "#10A66A",
      meetings: [],
      gradeCategories: []
    }
  ],
  assignments: [
    {
      id: "accepted-homework",
      courseId: "math",
      courseName: "Math",
      title: "Homework 1",
      type: "assignment",
      kind: "assignment",
      dueAt: "2026-09-02T23:59:00",
      sourceText: "Homework 1 due Sep 2",
      confidence: 0.95,
      reviewStatus: "accepted",
      completionStatus: "open",
      reminderPreset: "day_before",
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      tags: ["syllabus"],
      priority: "medium",
      estimatedMinutes: 45,
      status: "not_started",
      source: "syllabus"
    },
    {
      id: "unchecked-lab",
      courseId: "science",
      courseName: "Science",
      title: "Lab Mystery",
      type: "assignment",
      kind: "assignment",
      dueAt: "2026-09-03T23:59:00",
      sourceText: "Lab date unclear",
      confidence: 0.62,
      reviewStatus: "needsReview",
      completionStatus: "open",
      reminderPreset: "day_before",
      createdAt: "2026-08-24T12:00:00.000Z",
      updatedAt: "2026-08-24T12:00:00.000Z",
      tags: ["syllabus"],
      priority: "medium",
      estimatedMinutes: 45,
      status: "not_started",
      source: "syllabus"
    }
  ],
  gradeItems: [
    { id: "math-grade", courseId: "math", categoryId: "homework", title: "Homework 1", earned: 10, possible: 10 },
    { id: "science-grade", courseId: "science", categoryId: "labs", title: "Lab Mystery", earned: 0, possible: 10 }
  ],
  findings: [{ id: "ambiguous-lab", severity: "needs_review", message: "One lab date needs review." }]
};

test("trusted parsed plan only includes accepted work and its class data", () => {
  const trusted = buildTrustedParsedPlan(parse);

  assert.ok(trusted);
  assert.deepEqual(trusted.assignments.map((assignment) => assignment.id), ["accepted-homework"]);
  assert.deepEqual(trusted.courses.map((course) => course.id), ["math"]);
  assert.deepEqual(trusted.gradeItems, []);
  assert.deepEqual(trusted.syllabusSource.assignmentIds, ["accepted-homework"]);
  assert.deepEqual(trusted.syllabusSource.courseIds, ["math"]);
  assert.equal(trusted.syllabusSource.findings[0]?.id, "ambiguous-lab");
  assert.equal("semesterName" in trusted, false);
  assert.equal("semesterStartDate" in trusted, false);
  assert.equal("semesterEndDate" in trusted, false);
});

test("trusted parsed plan refuses an import with no accepted assignments", () => {
  const untrusted = buildTrustedParsedPlan({
    ...parse,
    assignments: parse.assignments.map((assignment) => ({
      ...assignment,
      reviewStatus: "needsReview" as const
    }))
  });

  assert.equal(untrusted, null);
});
