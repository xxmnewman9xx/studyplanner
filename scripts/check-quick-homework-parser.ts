import { Course } from "../src/models";
import { parseQuickHomeworkInput } from "../src/services/quickHomeworkParser";

const courses: Course[] = [
  {
    id: "bio",
    code: "BIO",
    name: "Biology",
    instructor: "Dr. Green",
    color: "#34C759",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "hist",
    code: "HIST",
    name: "History",
    instructor: "Dr. Stone",
    color: "#0A84FF",
    meetings: [],
    gradeCategories: []
  }
];

const fallbackCourse = courses[0];
const reference = new Date("2026-05-11T12:00:00.000Z"); // Monday

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

const friday = parseQuickHomeworkInput("Bio worksheet due Friday", courses, fallbackCourse, "2026-05-11", reference);
assertEqual(friday.course?.id, "bio", "course prefix maps to Biology");
assertEqual(friday.title, "worksheet", "weekday due text is stripped from title");
assertEqual(friday.dueDate, "2026-05-15", "Friday date inferred from reference Monday");

const tomorrow = parseQuickHomeworkInput("HIST: chapter 4 notes tomorrow", courses, fallbackCourse, "2026-05-11", reference);
assertEqual(tomorrow.course?.id, "hist", "colon course prefix maps to History");
assertEqual(tomorrow.title, "chapter 4 notes", "tomorrow text is stripped");
assertEqual(tomorrow.dueDate, "2026-05-12", "tomorrow date inferred");

const iso = parseQuickHomeworkInput("lab report due 2026-05-20", courses, fallbackCourse, "2026-05-11", reference);
assertEqual(iso.course?.id, "bio", "fallback course used without prefix");
assertEqual(iso.title, "lab report", "ISO date due text is stripped");
assertEqual(iso.dueDate, "2026-05-20", "ISO due date kept");

const nextMonday = parseQuickHomeworkInput("Biology reading due next Monday", courses, fallbackCourse, "2026-05-11", reference);
assertEqual(nextMonday.title, "reading", "next weekday text is stripped");
assertEqual(nextMonday.dueDate, "2026-05-18", "next Monday jumps a week");

console.log("quick homework parser fixtures passed");
