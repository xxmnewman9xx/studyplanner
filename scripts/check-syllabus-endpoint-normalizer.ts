import { normalizeParseResult } from "../src/services/syllabusParseNormalizer";
import { Course } from "../src/models";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const course: Course = {
  id: "bio-101",
  code: "BIO 101",
  name: "Biology",
  color: "#22577A",
  meetings: [],
  gradeCategories: []
};

const normalized = normalizeParseResult(
  {
    courses: [course],
    assignments: [
      {
        id: "",
        courseId: "",
        title: "  Lab practical  ",
        kind: "mystery",
        dueAt: "2026-02-31T25:90:00",
        tags: "not-array",
        priority: "urgent",
        estimatedMinutes: 9999,
        status: "queued",
        source: "scan",
        confidence: 2
      },
      {
        id: "exam-1",
        courseId: "bio-101",
        title: "Exam 1",
        kind: "exam",
        dueAt: "2026-10-12T09:00:00",
        tags: ["exam"],
        priority: "high",
        estimatedMinutes: 180,
        status: "not_started",
        source: "syllabus",
        confidence: 0.9
      }
    ],
    gradeItems: [],
    findings: []
  },
  { kind: "photo", name: "biology-photo.jpg", uri: "file://biology-photo.jpg", mimeType: "image/jpeg" }
);

const first = normalized.assignments[0];
assert(first.id === "scanned-assignment-1", "Expected blank endpoint IDs to receive stable fallback IDs");
assert(first.courseId === course.id, "Expected missing course ID to fall back to first parsed course");
assert(first.title === "Lab practical", "Expected titles to be trimmed");
assert(first.kind === "assignment" && first.type === "assignment", "Expected unknown kinds to normalize to assignment");
assert(first.priority === "medium", "Expected unknown priority to normalize to medium");
assert(first.status === "not_started", "Expected unknown status to normalize to not_started");
assert(first.source === "syllabus", "Expected endpoint assignments to normalize to syllabus source");
assert(first.estimatedMinutes === 480, "Expected oversized effort estimate to cap");
assert(first.needsReview, "Expected invalid endpoint deadlines to be review-gated");
assert(first.confidence === 1, "Expected confidence above 1 to clamp");
assert(normalized.findings.some((finding) => finding.id === "endpoint-deadlines-need-review"), "Expected endpoint invalid deadline finding");

const second = normalized.assignments[1];
assert(second.kind === "exam", "Expected valid assignment kind to survive normalization");
assert(!second.needsReview, "Expected valid endpoint deadline to stay schedulable after review import");

const malformedCourseNormalized = normalizeParseResult(
  {
    courses: [
      {
        id: "",
        code: "",
        name: "",
        color: "",
        meetings: "not-array",
        gradeCategories: "not-array"
      }
    ],
    assignments: [
      {
        title: "Research memo",
        kind: "assignment",
        courseId: "ghost-course",
        dueAt: "2026-11-11T23:59:00",
        estimatedMinutes: 90
      }
    ],
    gradeItems: []
  },
  { kind: "pdf", name: "messy-course.pdf", uri: "file://messy-course.pdf", mimeType: "application/pdf" }
);
assert(malformedCourseNormalized.courses[0]?.id === "syl-101", "Expected malformed course IDs to normalize from fallback code");
assert(malformedCourseNormalized.courses[0]?.meetings.length === 0, "Expected malformed meetings to normalize to an empty list");
assert(malformedCourseNormalized.courses[0]?.gradeCategories.length === 3, "Expected malformed grade categories to receive editable defaults");
assert(malformedCourseNormalized.assignments[0]?.courseId === "syl-101", "Expected unknown assignment course IDs to attach to a real normalized course");

const noCourseNormalized = normalizeParseResult(
  {
    courses: [],
    assignments: [
      {
        title: "Essay draft",
        kind: "assignment",
        dueAt: "2026-11-10T23:59:00",
        estimatedMinutes: 90
      }
    ],
    gradeItems: []
  },
  { kind: "pdf", name: "ENG220-syllabus.pdf", uri: "file://eng220.pdf", mimeType: "application/pdf" }
);
assert(noCourseNormalized.courses.length === 1, "Expected missing endpoint courses to receive a fallback course");
assert(noCourseNormalized.courses[0]?.id === "imported-course", "Expected fallback course ID");
assert(noCourseNormalized.assignments[0]?.courseId === "imported-course", "Expected assignments to attach to fallback course");

const gradeNormalized = normalizeParseResult(
  {
    courses: [
      {
        id: "math-120",
        code: "MATH 120",
        name: "Algebra",
        color: "#22577A",
        meetings: [],
        gradeCategories: [{ id: "math-120-homework", name: "Homework", weight: 40 }]
      }
    ],
    assignments: [],
    gradeItems: [
      {
        id: "",
        courseId: "ghost-course",
        categoryId: "ghost-category",
        title: "  Homework 1  ",
        earned: -5,
        possible: 10
      },
      {
        title: "Broken score",
        courseId: "math-120",
        categoryId: "math-120-homework",
        earned: 5,
        possible: 0
      }
    ],
    findings: []
  },
  { kind: "pdf", name: "math120.pdf", uri: "file://math120.pdf", mimeType: "application/pdf" }
);
assert(gradeNormalized.gradeItems.length === 1, "Expected invalid grade items to be dropped");
assert(gradeNormalized.gradeItems[0]?.id === "scanned-grade-1", "Expected blank grade item IDs to receive fallback IDs");
assert(gradeNormalized.gradeItems[0]?.courseId === "math-120", "Expected ghost grade course IDs to attach to a real course");
assert(gradeNormalized.gradeItems[0]?.categoryId === "math-120-homework", "Expected ghost grade categories to attach to a real category");
assert(gradeNormalized.gradeItems[0]?.earned === 0, "Expected negative earned points to clamp to zero");

console.log("syllabus endpoint normalizer fixtures passed");
