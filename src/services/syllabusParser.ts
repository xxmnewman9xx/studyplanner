import { Assignment, SyllabusImportSource, SyllabusParseResult } from "../models";
import * as FileSystem from "expo-file-system/legacy";
import { extractTextFromImage } from "./imageTextRecognition";
import { extractTextFromPdfBase64 } from "./pdfText";
import { parseSyllabusText } from "./syllabusLocalParser";
import { normalizeParseResult } from "./syllabusParseNormalizer";

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
  return true;
}

export async function parseSyllabus(source: SyllabusImportSource): Promise<SyllabusParseResult> {
  if (source.kind === "typed" && source.text?.trim()) {
    return parseSyllabusText(source.text, source.name || "Typed syllabus");
  }

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
  if (source.kind === "typed" && source.text?.trim()) {
    return source.text;
  }

  if (!source.uri) {
    throw new Error("Choose a syllabus file or photo before scanning.");
  }

  if (source.kind === "photo" || source.mimeType?.startsWith("image/")) {
    return extractTextFromImage(source.uri);
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
  if (source.kind === "typed" && source.text) {
    body.append("kind", source.kind);
    body.append("text", source.text);
    return body;
  }

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

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}
