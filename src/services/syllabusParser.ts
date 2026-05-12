import {
  Assignment,
  AssignmentType,
  Course,
  GradeItem,
  ParserFinding,
  SyllabusImportSource,
  SyllabusParseResult
} from "../models";
import * as FileSystem from "expo-file-system/legacy";
import {
  createSyllabusSourceFromParse,
  normalizeAssignments,
  withAssignmentPatch
} from "../logic/assignmentModel";
import { normalizeDueAt } from "../logic/dateUtils";
import { courseColorAt } from "../theme";
import { extractTextFromPdfBase64 } from "./pdfText";
import { parseSyllabusText } from "./syllabusLocalParser";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const parseEndpoint = readEnv("EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT");

export function isSyllabusParsingConfigured() {
  return true;
}

export function supportsSyllabusImageParsing() {
  return Boolean(parseEndpoint);
}

export async function parseSyllabus(source: SyllabusImportSource): Promise<SyllabusParseResult> {
  if (!source.uri) {
    throw new Error("Choose a syllabus file or photo before scanning.");
  }

  if (!parseEndpoint) {
    return parseSyllabusOnDevice(source);
  }

  try {
    return await parseSyllabusWithEndpoint(source, parseEndpoint);
  } catch (endpointError) {
    try {
      const localResult = await parseSyllabusOnDevice(source);
      return {
        ...localResult,
        findings: [
          {
            id: "device-parser-used",
            severity: "info",
            message: "Scanned on device because the online parser did not finish."
          },
          ...localResult.findings
        ]
      };
    } catch {
      throw endpointError;
    }
  }
}

async function parseSyllabusWithEndpoint(source: SyllabusImportSource, endpoint: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    body: buildUploadBody(source)
  });

  if (!response.ok) {
    throw new Error(
      response.status >= 500
        ? "The scan service is having trouble right now. Try again in a little while."
        : "This syllabus could not be scanned. Check the file and try again."
    );
  }

  const result = normalizeParseResult(await response.json(), source);
  return {
    ...result,
    syllabusSource: result.syllabusSource || createSyllabusSourceFromParse(result, "endpoint")
  };
}

async function parseSyllabusOnDevice(source: SyllabusImportSource) {
  const sourceName = source.name || "Syllabus scan";
  const text = await readSourceText(source);
  const result = parseSyllabusText(text, sourceName);
  return {
    ...result,
    syllabusSource: result.syllabusSource || createSyllabusSourceFromParse(result, "device")
  };
}

async function readSourceText(source: SyllabusImportSource) {
  if (!source.uri) {
    throw new Error("Choose a syllabus file or photo before scanning.");
  }

  if (source.kind === "photo" || source.mimeType?.startsWith("image/")) {
    throw new Error(
      "The photo was selected, but text could not be read on this device. Choose a text-based PDF or plain-text syllabus from Files and try again."
    );
  }

  const isPdf = source.mimeType === "application/pdf" || /\.pdf$/i.test(source.name || "");
  if (isPdf) {
    const base64 = await FileSystem.readAsStringAsync(source.uri, {
      encoding: FileSystem.EncodingType.Base64
    });
    const text = extractTextFromPdfBase64(base64);
    if (text) return text;
    throw new Error(
      "That PDF did not include readable text. Choose a text-based PDF or plain-text syllabus and try again."
    );
  }

  return FileSystem.readAsStringAsync(source.uri, {
    encoding: FileSystem.EncodingType.UTF8
  });
}

export function updateParsedAssignment(
  parse: SyllabusParseResult,
  assignmentId: string,
  patch: Partial<Assignment>
) {
  return {
    ...parse,
    assignments: parse.assignments.map((assignment) =>
      assignment.id === assignmentId
        ? withAssignmentPatch(assignment, patch, parse.courses)
        : assignment
    )
  };
}

function buildUploadBody(source: SyllabusImportSource) {
  const body = new FormData();
  const name = source.name || (source.kind === "pdf" ? "syllabus.pdf" : "syllabus-photo.jpg");
  const type = source.mimeType || (source.kind === "pdf" ? "application/pdf" : "image/jpeg");

  body.append("kind", source.kind);
  body.append("file", {
    uri: source.uri,
    name,
    type
  } as unknown as Blob);

  return body;
}

function normalizeParseResult(value: unknown, source: SyllabusImportSource): SyllabusParseResult {
  if (!value || typeof value !== "object") {
    throw new Error("The scan service returned an unreadable result.");
  }

  const result = value as Partial<SyllabusParseResult>;
  const findings: ParserFinding[] = Array.isArray(result.findings)
    ? result.findings.filter(isParserFinding)
    : [];
  const courses = sanitizeCourses(ensureArray<Partial<Course>>(result.courses, "courses"));
  const { assignments, findings: assignmentFindings } = sanitizeAssignments(
    ensureArray<Partial<Assignment>>(result.assignments, "assignments"),
    courses
  );
  const gradeItems = sanitizeGradeItems(ensureArray<Partial<GradeItem>>(result.gradeItems, "grade items"), courses);

  return {
    sourceName: result.sourceName || source.name || "Syllabus scan",
    semesterName: result.semesterName,
    semesterStartDate: result.semesterStartDate,
    semesterEndDate: result.semesterEndDate,
    courses,
    assignments: normalizeAssignments(
      assignments.map((assignment) => ({
        ...assignment,
        source: "syllabus" as const,
        reviewStatus: "needsReview" as const
      })),
      courses
    ),
    gradeItems,
    findings: [...findings, ...assignmentFindings],
    syllabusSource: result.syllabusSource
  };
}

function ensureArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`The scan service did not return ${label}.`);
  }

  return value as T[];
}

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function sanitizeCourses(rawCourses: Partial<Course>[]) {
  return rawCourses
    .filter((course) => typeof course === "object" && course !== null)
    .map((course, index): Course => {
      const code = safeText(course.code) || `CLASS ${index + 1}`;
      const name = safeText(course.name) || code;
      const id = safeText(course.id) || slugify(code) || `class-${index + 1}`;

      return {
        id,
        code,
        name,
        instructor: safeText(course.instructor) || undefined,
        color: safeText(course.color) || courseColorAt(index),
        meetings: Array.isArray(course.meetings) ? course.meetings : [],
        gradeCategories: Array.isArray(course.gradeCategories) ? course.gradeCategories : []
      };
    });
}

function sanitizeAssignments(rawAssignments: Partial<Assignment>[], courses: Course[]) {
  const findings: ParserFinding[] = [];
  const fallbackCourse = courses[0];
  const assignments = rawAssignments.flatMap((assignment, index) => {
    const title = safeText(assignment.title);
    const courseId = safeText(assignment.courseId) || fallbackCourse?.id;
    const course = courses.find((item) => item.id === courseId) || fallbackCourse;
    const dueAt = normalizeDueAt(assignment.dueAt);

    if (!title || !course || !dueAt) {
      findings.push({
        id: `endpoint-skipped-assignment-${index + 1}`,
        severity: "needs_review",
        message: "One scanned item was left out because its title, class, or date was not clear."
      });
      return [];
    }

    const type = normalizeAssignmentType(assignment.type || assignment.kind);
    return [
      {
        ...assignment,
        id: safeText(assignment.id) || `${course.id}-${slugify(title)}-${dueAt.slice(0, 10)}`,
        courseId: course.id,
        courseName: course.name,
        title,
        type,
        kind: type,
        dueAt,
        sourceText: safeText(assignment.sourceText) || title,
        source: "syllabus" as const,
        reviewStatus: "needsReview" as const
      }
    ];
  });

  return { assignments, findings };
}

function sanitizeGradeItems(rawGradeItems: Partial<GradeItem>[], courses: Course[]) {
  const courseIds = new Set(courses.map((course) => course.id));
  return rawGradeItems
    .filter((item) => item.courseId && courseIds.has(item.courseId))
    .filter((item) => safeText(item.title))
    .map((item, index): GradeItem => ({
      id: safeText(item.id) || `${item.courseId}-grade-${index + 1}`,
      courseId: item.courseId!,
      categoryId: safeText(item.categoryId) || "imported",
      title: safeText(item.title),
      earned: numberOrZero(item.earned),
      possible: Math.max(numberOrZero(item.possible), 1)
    }));
}

function normalizeAssignmentType(value: unknown): AssignmentType {
  return value === "exam" ||
    value === "quiz" ||
    value === "project" ||
    value === "reading" ||
    value === "other"
    ? value
    : "assignment";
}

function isParserFinding(value: unknown): value is ParserFinding {
  if (!value || typeof value !== "object") return false;
  const finding = value as Partial<ParserFinding>;
  return (
    typeof finding.id === "string" &&
    typeof finding.message === "string" &&
    (finding.severity === "info" || finding.severity === "needs_review")
  );
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
