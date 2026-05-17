import {
  Assignment,
  AssignmentKind,
  AssignmentStatus,
  Course,
  GradeCategory,
  GradeItem,
  Priority,
  SyllabusImportSource,
  SyllabusParseResult
} from "../models";
import { isValidDeadline, normalizeEstimatedMinutes } from "../logic/planner";

export function normalizeParseResult(value: unknown, source: SyllabusImportSource): SyllabusParseResult {
  if (!value || typeof value !== "object") {
    throw new Error("The scan service returned an unreadable result.");
  }

  const result = value as Partial<SyllabusParseResult>;
  const sourceName = result.sourceName || source.name || "Syllabus scan";
  const courses = normalizeEndpointCourses(ensureArray<Course>(result.courses, "courses"), sourceName);
  const knownCourseIds = new Set(courses.map((course) => course.id));
  const rawAssignments = ensureArray<Assignment>(result.assignments, "assignments");
  const assignments = rawAssignments.map((assignment, index) => normalizeEndpointAssignment(assignment, courses, knownCourseIds, index));
  const invalidDeadlineCount = assignments.filter((assignment) => !isValidDeadline(assignment.dueAt)).length;
  const gradeItems = normalizeEndpointGradeItems(ensureArray<GradeItem>(result.gradeItems, "grade items"), courses);
  const findings = Array.isArray(result.findings) ? result.findings : [];

  return {
    sourceName,
    semesterName: result.semesterName,
    semesterStartDate: result.semesterStartDate,
    semesterEndDate: result.semesterEndDate,
    courses,
    assignments,
    gradeItems,
    findings: [
      ...findings,
      ...(invalidDeadlineCount > 0
        ? [
            {
              id: "endpoint-deadlines-need-review",
              severity: "needs_review" as const,
              message: `${invalidDeadlineCount} scanned deadline${invalidDeadlineCount === 1 ? "" : "s"} need review before applying.`
            }
          ]
        : [])
    ]
  };
}

function normalizeEndpointCourses(courses: Course[], sourceName: string): Course[] {
  const normalized = courses.map((course, index) => normalizeEndpointCourse(course, sourceName, index));
  return normalized.length > 0 ? normalized : [fallbackCourse(sourceName)];
}

function normalizeEndpointCourse(course: Course, sourceName: string, index: number): Course {
  const fallback = fallbackCourse(sourceName);
  const code = typeof course.code === "string" && course.code.trim() ? course.code.trim() : fallback.code;
  const name = typeof course.name === "string" && course.name.trim() ? course.name.trim() : fallback.name;
  const id = typeof course.id === "string" && course.id.trim() ? course.id.trim() : slugifyCourseId(code, index);

  return {
    ...course,
    id,
    code,
    name,
    color: typeof course.color === "string" && course.color.trim() ? course.color : fallback.color,
    meetings: Array.isArray(course.meetings) ? course.meetings : [],
    gradeCategories: normalizeEndpointGradeCategories(course.gradeCategories, id)
  };
}

function fallbackCourse(sourceName: string): Course {
  return {
    id: "imported-course",
    code: "SYL 101",
    name: sourceName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Syllabus",
    color: "#22577A",
    meetings: [],
    gradeCategories: defaultGradeCategories("imported-course")
  };
}

function normalizeEndpointGradeCategories(value: unknown, courseId: string): GradeCategory[] {
  if (!Array.isArray(value) || value.length === 0) return defaultGradeCategories(courseId);

  const categories = value
    .map((category, index) => {
      const raw = category as Partial<GradeCategory>;
      const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : `Category ${index + 1}`;
      const weight = Number(raw.weight);
      return {
        id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `${courseId}-${slugifyCourseId(name, index)}`,
        name,
        weight: Number.isFinite(weight) && weight > 0 && weight <= 100 ? weight : 0
      };
    })
    .filter((category) => category.weight > 0);

  return categories.length > 0 ? categories : defaultGradeCategories(courseId);
}

function defaultGradeCategories(courseId: string): GradeCategory[] {
  return [
    { id: `${courseId}-assignments`, name: "Assignments", weight: 40 },
    { id: `${courseId}-exams`, name: "Exams", weight: 40 },
    { id: `${courseId}-participation`, name: "Participation", weight: 20 }
  ];
}

function normalizeEndpointGradeItems(gradeItems: GradeItem[], courses: Course[]): GradeItem[] {
  const fallbackCourse = courses[0];
  const knownCourseIds = new Set(courses.map((course) => course.id));
  const categoriesByCourse = new Map(courses.map((course) => [course.id, course.gradeCategories]));

  return gradeItems
    .map((item, index) => {
      const courseId = typeof item.courseId === "string" && knownCourseIds.has(item.courseId)
        ? item.courseId
        : fallbackCourse?.id;
      if (!courseId) return undefined;

      const categories = categoriesByCourse.get(courseId) || [];
      const categoryId = typeof item.categoryId === "string" && categories.some((category) => category.id === item.categoryId)
        ? item.categoryId
        : categories[0]?.id;
      if (!categoryId) return undefined;

      const earned = Number(item.earned);
      const possible = Number(item.possible);
      if (!Number.isFinite(possible) || possible <= 0) return undefined;

      return {
        id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `scanned-grade-${index + 1}`,
        courseId,
        categoryId,
        title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Scanned grade",
        earned: Number.isFinite(earned) ? Math.max(0, earned) : 0,
        possible
      };
    })
    .filter((item): item is GradeItem => Boolean(item));
}

function normalizeEndpointAssignment(assignment: Assignment, courses: Course[], knownCourseIds: Set<string>, index: number): Assignment {
  const kind = normalizeKind(assignment.kind || assignment.type);
  const priority = normalizePriority(assignment.priority);
  const status = normalizeStatus(assignment.status);
  const dueAt = typeof assignment.dueAt === "string" ? assignment.dueAt : "";
  const validDeadline = isValidDeadline(dueAt);
  const title = typeof assignment.title === "string" && assignment.title.trim() ? assignment.title.trim() : "Scanned assignment";
  const fallbackCourseId = courses[0]?.id || "imported-course";
  const courseId = typeof assignment.courseId === "string" && knownCourseIds.has(assignment.courseId)
    ? assignment.courseId
    : fallbackCourseId;

  return {
    ...assignment,
    id: typeof assignment.id === "string" && assignment.id.trim() ? assignment.id : `scanned-assignment-${index + 1}`,
    courseId,
    title,
    kind,
    type: kind,
    dueAt,
    tags: Array.isArray(assignment.tags) ? assignment.tags : ["syllabus"],
    priority,
    estimatedMinutes: normalizeEstimatedMinutes(assignment.estimatedMinutes, kind === "exam" ? 180 : 60),
    status,
    source: "syllabus",
    needsReview: Boolean(assignment.needsReview) || !validDeadline,
    confidence: normalizeConfidence(assignment.confidence, validDeadline ? 0.75 : 0.4)
  };
}

function slugifyCourseId(value: string, index: number) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || `imported-course-${index + 1}`;
}

function normalizeKind(value: unknown): AssignmentKind {
  return ["assignment", "exam", "project", "reading", "worksheet"].includes(String(value))
    ? (value as AssignmentKind)
    : "assignment";
}

function normalizePriority(value: unknown): Priority {
  return ["low", "medium", "high"].includes(String(value)) ? (value as Priority) : "medium";
}

function normalizeStatus(value: unknown): AssignmentStatus {
  return ["not_started", "in_progress", "done", "archived"].includes(String(value))
    ? (value as AssignmentStatus)
    : "not_started";
}

function normalizeConfidence(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(1, Math.max(0, numeric));
}

function ensureArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`The scan service did not return ${label}.`);
  }

  return value as T[];
}
