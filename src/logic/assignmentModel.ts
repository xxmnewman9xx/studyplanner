import {
  Assignment,
  AssignmentKind,
  AssignmentStatus,
  AssignmentType,
  CompletionStatus,
  Course,
  ReminderPreset,
  ReviewStatus,
  SyllabusParseResult,
  SyllabusSource
} from "../models";

export type AssignmentSeed = Partial<Assignment> &
  Pick<Assignment, "id" | "courseId" | "title" | "dueAt">;

export function normalizeAssignment(
  input: AssignmentSeed,
  courses: Course[] = [],
  now = new Date()
): Assignment {
  const nowIso = now.toISOString();
  const course = courses.find((item) => item.id === input.courseId);
  const type = normalizeAssignmentType(input.type || input.kind);
  const kind = normalizeAssignmentKind(input.kind || type);
  const status = normalizeAssignmentStatus(input.status);
  const completionStatus = input.completionStatus || completionStatusFromStatus(status);
  const reviewStatus = normalizeReviewStatus(input.reviewStatus, input.source);
  const createdAt = input.createdAt || nowIso;
  const source = input.source || "manual";

  return {
    ...input,
    id: input.id,
    courseId: input.courseId,
    courseName: input.courseName || course?.name || course?.code || "Course",
    title: input.title,
    type,
    kind,
    dueAt: input.dueAt,
    sourceText: input.sourceText || input.title,
    confidence: clampConfidence(input.confidence ?? defaultConfidence(source, reviewStatus)),
    reviewStatus,
    completionStatus,
    reminderPreset: normalizeReminderPreset(input.reminderPreset, type),
    createdAt,
    updatedAt: input.updatedAt || createdAt,
    tags: input.tags && input.tags.length > 0 ? input.tags : defaultTags(type, source),
    priority: input.priority || defaultPriority(type),
    estimatedMinutes: input.estimatedMinutes || defaultEstimate(type),
    status: input.status || statusFromCompletionStatus(completionStatus),
    source
  };
}

export function normalizeAssignments(
  assignments: AssignmentSeed[],
  courses: Course[] = [],
  now = new Date()
) {
  return assignments.map((assignment) => normalizeAssignment(assignment, courses, now));
}

export function withAssignmentPatch(
  assignment: Assignment,
  patch: Partial<Assignment>,
  courses: Course[] = [],
  now = new Date()
) {
  const next: AssignmentSeed = {
    ...assignment,
    ...patch,
    updatedAt: now.toISOString()
  };

  if (patch.status && !patch.completionStatus) {
    next.completionStatus = completionStatusFromStatus(patch.status);
  }

  if (patch.completionStatus && !patch.status) {
    next.status = statusFromCompletionStatus(patch.completionStatus, assignment.status);
  }

  if (patch.kind && !patch.type) {
    next.type = normalizeAssignmentType(patch.kind);
  }

  if (patch.type && !patch.kind) {
    next.kind = normalizeAssignmentKind(patch.type);
  }

  return normalizeAssignment(next, courses, now);
}

export function isAssignmentArchived(assignment: Pick<Assignment, "status" | "reviewStatus">) {
  return assignment.status === "archived" || assignment.reviewStatus === "ignored";
}

export function isAssignmentConfirmed(assignment: Pick<Assignment, "reviewStatus">) {
  return assignment.reviewStatus === "accepted";
}

export function isAssignmentNeedsReview(
  assignment: Pick<Assignment, "status" | "reviewStatus">
) {
  return assignment.reviewStatus === "needsReview" && !isAssignmentArchived(assignment);
}

export function isAssignmentCompleted(
  assignment: Pick<Assignment, "status" | "completionStatus">
) {
  return assignment.completionStatus === "completed" || assignment.status === "done";
}

export function isAssignmentOpen(
  assignment: Pick<Assignment, "status" | "completionStatus" | "reviewStatus">
) {
  return (
    isAssignmentConfirmed(assignment) &&
    !isAssignmentArchived(assignment) &&
    !isAssignmentCompleted(assignment)
  );
}

export function completionStatusFromStatus(status: AssignmentStatus): CompletionStatus {
  return status === "done" ? "completed" : "open";
}

export function statusFromCompletionStatus(
  completionStatus: CompletionStatus,
  fallback: AssignmentStatus = "not_started"
): AssignmentStatus {
  if (completionStatus === "completed") return "done";
  return fallback === "done" || fallback === "archived" ? "not_started" : fallback;
}

export function createSyllabusSourceFromParse(
  parse: SyllabusParseResult,
  parser: SyllabusSource["parser"],
  now = new Date()
): SyllabusSource {
  const importedAt = now.toISOString();

  return {
    id: `syllabus-${slugify(parse.sourceName)}-${importedAt.slice(0, 10)}`,
    kind: parser === "demo" ? "demo" : "text",
    sourceName: parse.sourceName,
    importedAt,
    parser,
    courseIds: parse.courses.map((course) => course.id),
    assignmentIds: parse.assignments.map((assignment) => assignment.id),
    findings: parse.findings
  };
}

function normalizeAssignmentType(value: AssignmentType | AssignmentKind | undefined): AssignmentType {
  switch (value) {
    case "exam":
    case "quiz":
    case "project":
    case "reading":
    case "other":
      return value;
    case "assignment":
    default:
      return "assignment";
  }
}

function normalizeAssignmentKind(value: AssignmentKind | AssignmentType | undefined): AssignmentKind {
  return normalizeAssignmentType(value);
}

function normalizeAssignmentStatus(value: AssignmentStatus | undefined): AssignmentStatus {
  switch (value) {
    case "in_progress":
    case "done":
    case "archived":
      return value;
    case "not_started":
    default:
      return "not_started";
  }
}

function normalizeReviewStatus(
  value: ReviewStatus | undefined,
  source: Assignment["source"] | undefined
): ReviewStatus {
  if (value === "accepted" || value === "ignored" || value === "needsReview") {
    return value;
  }

  return source === "syllabus" ? "needsReview" : "accepted";
}

function normalizeReminderPreset(
  value: ReminderPreset | undefined,
  type: AssignmentType
): ReminderPreset {
  if (
    value === "none" ||
    value === "same_day" ||
    value === "day_before" ||
    value === "two_days_before" ||
    value === "week_before" ||
    value === "custom"
  ) {
    return value;
  }

  return type === "exam" ? "week_before" : "day_before";
}

function defaultConfidence(source: Assignment["source"], reviewStatus: ReviewStatus) {
  if (reviewStatus === "accepted") return 1;
  if (source === "syllabus") return 0.72;
  return 0.9;
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function defaultTags(type: AssignmentType, source: Assignment["source"]) {
  if (type === "exam") return ["exam", "study"];
  if (type === "quiz") return ["quiz"];
  if (type === "project") return ["project"];
  if (type === "reading") return ["reading"];
  return source === "syllabus" ? ["syllabus"] : ["homework"];
}

function defaultPriority(type: AssignmentType) {
  return type === "exam" || type === "project" ? "high" : "medium";
}

function defaultEstimate(type: AssignmentType) {
  if (type === "exam") return 180;
  if (type === "project") return 150;
  if (type === "quiz") return 75;
  if (type === "reading") return 45;
  return 60;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
