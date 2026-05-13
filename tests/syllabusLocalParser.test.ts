import test from "node:test";
import assert from "node:assert/strict";

import { parseSyllabusText } from "../src/services/syllabusLocalParser";

test("local parser reports when many dated items exceed the review limit", () => {
  const lines = Array.from(
    { length: 80 },
    (_, index) => `Assignment ${index + 1} due Sep ${String((index % 28) + 1).padStart(2, "0")}, 2026`
  );
  const result = parseSyllabusText(
    `BIO 101 - Biology\nFall 2026\n${lines.join("\n")}`,
    "BIO 101 syllabus.txt"
  );

  assert.equal(result.assignments.length, 75);
  assert.ok(result.assignments.every((assignment) => assignment.reviewStatus === "needsReview"));
  assert.ok(result.findings.some((finding) => finding.id === "deadline-review-limit"));
});

test("local parser skips impossible due dates", () => {
  const result = parseSyllabusText(
    "BIO 101 - Biology\nFall 2026\nHomework due Feb 31, 2026\nQuiz due Mar 03, 2026",
    "BIO 101 syllabus.txt"
  );

  assert.equal(result.assignments.length, 1);
  assert.equal(result.assignments[0]?.title, "Quiz");
  assert.equal(result.assignments[0]?.dueAt, "2026-03-03T09:00:00");
});

test("local parser reports possible work with no clear date", () => {
  const result = parseSyllabusText(
    "BIO 101 - Biology\nFall 2026\nLab report due TBD\nQuiz due Mar 03, 2026",
    "BIO 101 syllabus.txt"
  );

  assert.equal(result.assignments.length, 1);
  assert.ok(result.findings.some((finding) => finding.id === "undated-work-found"));
});

test("local parser reports duplicate dated work before review", () => {
  const result = parseSyllabusText(
    [
      "BIO 101 - Biology",
      "Fall 2026",
      "Lab Report due Mar 03, 2026",
      "Lab Report due Mar 03, 2026",
      "Quiz due Mar 05, 2026"
    ].join("\n"),
    "BIO 101 syllabus.txt"
  );

  assert.equal(result.assignments.length, 2);
  assert.ok(result.findings.some((finding) => finding.id === "possible-duplicates-merged"));
});
