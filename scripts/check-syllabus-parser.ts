import { parseSyllabusText } from "../src/services/syllabusLocalParser";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAssignment(titles: string[], needle: string) {
  return titles.some((title) => title.toLowerCase().includes(needle.toLowerCase()));
}

const datedMessySyllabus = `
BIO 101 - Biology Foundations
Fall 2026
Assignments 35%
Exams 40%
Participation 25%
Mon Wed 9:00 AM - 10:15 AM Room 204
Aug 30 Homework 1 due
September 14 Lab report due
10/03 Midterm Exam
Final Project due Dec 7, 2026 by 11:59 PM
`;

const dated = parseSyllabusText(datedMessySyllabus, "BIO101-syllabus.pdf");
const datedTitles = dated.assignments.map((item) => item.title);
assert(dated.courses[0]?.code === "BIO 101", "Expected BIO 101 course code");
assert(dated.assignments.length >= 4, `Expected at least 4 assignments, got ${dated.assignments.length}`);
assert(includesAssignment(datedTitles, "Homework 1"), "Expected Homework 1 assignment");
assert(includesAssignment(datedTitles, "Lab report"), "Expected Lab report assignment");
assert(dated.assignments.some((item) => item.kind === "exam"), "Expected an exam assignment");
assert(
  dated.assignments.some((item) => item.title === "Final Project" && item.dueAt === "2026-12-07T23:59:00"),
  "Expected explicit due times to parse without polluting assignment titles"
);
assert(dated.courses[0]?.gradeCategories.length === 3, "Expected grade categories to parse");
assert(
  dated.courses[0]?.meetings.map((meeting) => `${meeting.day} ${meeting.startTime}-${meeting.endTime}`).join(",") ===
    "Mon 09:00-10:15,Wed 09:00-10:15",
  "Expected class meeting days and times to parse without corrupting weekday labels"
);

const invalidDueTime = parseSyllabusText(
  `BIO 101 - Biology Foundations\nFall 2026\nProblem set due Sep 20 by 13:90 PM`,
  "bio101-invalid-time.txt"
);
assert(
  invalidDueTime.assignments.some((item) => item.title === "Problem set" && item.dueAt === "2026-09-20T23:59:00"),
  "Expected invalid explicit due times to fall back safely without polluting assignment titles"
);

const undatedSyllabus = `
ENG 220 - Modern Literature
Spring 2027
Major Assignments
Essay 1: close reading response
Group presentation on assigned novel
Final paper proposal
Final paper due May 9
Weekly reading journals
`;

const undated = parseSyllabusText(undatedSyllabus, "ENG220-syllabus.pdf");
assert(undated.assignments.length >= 1, "Expected dated final paper to parse");
assert(
  undated.findings.some((finding) => finding.id === "possible-undated-work"),
  "Expected possible-undated-work finding for likely assignments without dates"
);
assert(
  undated.findings.some((finding) => finding.message.toLowerCase().includes("possible assignments")),
  "Expected student-facing possible assignments warning"
);

const weekdayHomework = parseSyllabusText(
  `MATH 120 - Algebra\nHomework 7 due Friday\nQuiz next Monday`,
  "math120-homework-note.txt"
);
assert(weekdayHomework.assignments.length === 2, "Expected weekday homework lines to parse");
assert(
  weekdayHomework.assignments.every((item) => item.needsReview && item.confidence === 0.7),
  "Expected weekday-derived dates to stay review-gated"
);
assert(
  weekdayHomework.findings.some((finding) => finding.id === "relative-dates-need-review"),
  "Expected review finding for weekday-derived dates"
);
assert(includesAssignment(weekdayHomework.assignments.map((item) => item.title), "Homework 7"), "Expected Homework 7 from weekday line");

const relativeHomework = parseSyllabusText(
  `SCI 210 - Earth Science\nLab reflection due tomorrow\nReading check due today`,
  "science-homework-note.txt"
);
assert(relativeHomework.assignments.length === 2, "Expected relative homework lines to parse");
assert(
  relativeHomework.assignments.every((item) => item.needsReview && item.confidence === 0.7),
  "Expected relative-date assignments to stay review-gated"
);
assert(
  relativeHomework.findings.some((finding) => finding.id === "relative-dates-need-review"),
  "Expected review finding for relative dates"
);
assert(includesAssignment(relativeHomework.assignments.map((item) => item.title), "Lab reflection"), "Expected Lab reflection from relative date line");

const invalidCalendarDates = parseSyllabusText(
  `CHEM 150 - Chemistry\nSpring 2027\nQuiz due 2/31\nLab report due April 31`,
  "chem150.txt"
);
assert(invalidCalendarDates.assignments.length === 0, "Expected impossible calendar dates to stay out of the plan");
assert(
  invalidCalendarDates.findings.some((finding) => finding.id === "possible-undated-work"),
  "Expected impossible dated work to remain review-visible as possible undated work"
);

const noGradeWeights = parseSyllabusText(
  `HIST 101 - World History\nFall 2027\nEssay due October 12\nFinal exam due December 4`,
  "hist101.txt"
);
assert(noGradeWeights.courses[0]?.gradeCategories.length === 3, "Expected editable fallback grade categories");
assert(
  noGradeWeights.findings.some((finding) => finding.id === "grade-weights-missing"),
  "Expected review finding when grade weights are missing"
);

const noDeadlines = parseSyllabusText(
  `MATH 120 - Algebra\nFall 2026\nHomework is assigned weekly in class. Quizzes happen throughout the term.`,
  "math120.txt"
);
assert(noDeadlines.assignments.length === 0, "Expected no dated assignments");
assert(noDeadlines.findings.some((finding) => finding.id === "no-deadlines-found"), "Expected no-deadlines finding");
assert(noDeadlines.findings.some((finding) => finding.id === "possible-undated-work"), "Expected undated work finding");

console.log("syllabus parser fixtures passed");
