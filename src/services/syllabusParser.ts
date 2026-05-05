import { Assignment, Course, GradeItem, SyllabusImportSource, SyllabusParseResult } from "../models";
import * as FileSystem from "expo-file-system/legacy";
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

  return normalizeParseResult(await response.json(), source);
}

async function parseSyllabusOnDevice(source: SyllabusImportSource) {
  const sourceName = source.name || "Syllabus scan";
  const text = await readSourceText(source);
  return parseSyllabusText(text, sourceName);
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
