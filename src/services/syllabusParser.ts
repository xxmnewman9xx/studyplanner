import { Assignment, Course, GradeItem, SyllabusImportSource, SyllabusParseResult } from "../models";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const parseEndpoint = readEnv("EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT");

export function isSyllabusParsingConfigured() {
  return Boolean(parseEndpoint);
}

export async function parseSyllabus(source: SyllabusImportSource): Promise<SyllabusParseResult> {
  if (!parseEndpoint) {
    throw new Error(
      "Syllabus scan is temporarily unavailable. You can keep planning manually from Courses."
    );
  }

  if (!source.uri) {
    throw new Error("Choose a syllabus file or photo before scanning.");
  }

  const response = await fetch(parseEndpoint, {
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

  return normalizeParseResult(await response.json(), source);
}

export function updateParsedAssignment(
  parse: SyllabusParseResult,
  assignmentId: string,
  patch: Partial<Assignment>
) {
  return {
    ...parse,
    assignments: parse.assignments.map((assignment) =>
      assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
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
  const courses = ensureArray<Course>(result.courses, "courses");
  const assignments = ensureArray<Assignment>(result.assignments, "assignments");
  const gradeItems = ensureArray<GradeItem>(result.gradeItems, "grade items");

  return {
    sourceName: result.sourceName || source.name || "Syllabus scan",
    semesterName: result.semesterName,
    semesterStartDate: result.semesterStartDate,
    semesterEndDate: result.semesterEndDate,
    courses,
    assignments,
    gradeItems,
    findings: Array.isArray(result.findings) ? result.findings : []
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
