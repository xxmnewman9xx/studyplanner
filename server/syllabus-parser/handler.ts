import { extractTextFromPdfBase64 } from "../../src/services/pdfText";
import { parseSyllabusText } from "../../src/services/syllabusLocalParser";
import { SyllabusParseResult } from "../../src/models";

declare const Buffer:
  | {
      from(input: Uint8Array): { toString(encoding: string): string };
    }
  | undefined;
declare const btoa: ((data: string) => string) | undefined;

export type SyllabusParseErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "TEXT_REQUIRED"
  | "PDF_TEXT_REQUIRED"
  | "OCR_NOT_CONFIGURED"
  | "PARSE_FAILED";

export type SyllabusParseErrorResponse = {
  error: {
    code: SyllabusParseErrorCode;
    message: string;
    retryable: boolean;
    fallback: string[];
  };
};

type ParsePayload = {
  text: string;
  sourceName: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

export async function handleSyllabusParseRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse("METHOD_NOT_ALLOWED", "Send syllabus material with POST.", false, 405);
  }

  try {
    const payload = await readPayload(request);
    const result = parseSyllabusText(payload.text, payload.sourceName);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof Response) return error;
    return errorResponse(
      "PARSE_FAILED",
      error instanceof Error ? error.message : "The syllabus parser could not read that material.",
      false,
      422
    );
  }
}

async function readPayload(request: Request): Promise<ParsePayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const value = await request.json();
    return payloadFromJson(value);
  }

  if (contentType.includes("multipart/form-data")) {
    return payloadFromFormData(await request.formData());
  }

  if (contentType.startsWith("text/plain")) {
    return payloadFromText(await request.text(), "Pasted syllabus");
  }

  throw errorResponse(
    "UNSUPPORTED_CONTENT_TYPE",
    "Use JSON, multipart form data, or plain text for syllabus parsing.",
    false,
    415
  );
}

function payloadFromJson(value: unknown): ParsePayload {
  if (!value || typeof value !== "object") {
    throw errorResponse("TEXT_REQUIRED", "JSON parser requests need a text field.", false, 400);
  }

  const body = value as { text?: unknown; sourceName?: unknown; name?: unknown };
  return payloadFromText(
    typeof body.text === "string" ? body.text : "",
    stringValue(body.sourceName) || stringValue(body.name) || "Pasted syllabus"
  );
}

async function payloadFromFormData(form: FormData): Promise<ParsePayload> {
  const kind = stringValue(form.get("kind"));
  const text = stringValue(form.get("text"));
  if (kind === "typed" || text) {
    return payloadFromText(text, "Pasted syllabus");
  }

  const file = form.get("file");
  if (!isFormFile(file)) {
    throw errorResponse("TEXT_REQUIRED", "Attach a text-based syllabus file or send pasted text.", false, 400);
  }

  const name = file.name || "Uploaded syllabus";
  const type = file.type || mimeTypeFromName(name);
  if (type.startsWith("image/")) {
    throw errorResponse(
      "OCR_NOT_CONFIGURED",
      "Image OCR is not configured on this parser endpoint. Upload a text-based PDF or paste syllabus text.",
      false,
      422
    );
  }

  if (type === "application/pdf" || /\.pdf$/i.test(name)) {
    const textFromPdf = extractTextFromPdfBase64(bytesToBase64(new Uint8Array(await file.arrayBuffer())));
    if (!textFromPdf) {
      throw errorResponse(
        "PDF_TEXT_REQUIRED",
        "That PDF does not contain readable embedded text.",
        false,
        422
      );
    }
    return payloadFromText(textFromPdf, name);
  }

  return payloadFromText(await file.text(), name);
}

function payloadFromText(text: string, sourceName: string): ParsePayload {
  if (!text.trim()) {
    throw errorResponse("TEXT_REQUIRED", "Paste syllabus text or upload a readable text file.", false, 400);
  }

  return {
    text,
    sourceName
  };
}

function jsonResponse(value: SyllabusParseResult) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: jsonHeaders
  });
}

function errorResponse(
  code: SyllabusParseErrorCode,
  message: string,
  retryable: boolean,
  status: number
) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        retryable,
        fallback: ["Paste syllabus text", "Upload a text-based PDF", "Upload a plain-text file"]
      }
    } satisfies SyllabusParseErrorResponse),
    {
      status,
      headers: jsonHeaders
    }
  );
}

function stringValue(value: FormDataEntryValue | unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isFormFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "text" in value &&
      "name" in value
  );
}

function mimeTypeFromName(name: string) {
  if (/\.pdf$/i.test(name)) return "application/pdf";
  if (/\.txt$/i.test(name)) return "text/plain";
  if (/\.(jpg|jpeg)$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  return "application/octet-stream";
}

function bytesToBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  if (typeof btoa !== "function") {
    throw new Error("This server runtime cannot encode uploaded PDF bytes.");
  }

  const chunks: string[] = [];
  for (let index = 0; index < bytes.length; index += 8192) {
    chunks.push(String.fromCharCode(...bytes.slice(index, index + 8192)));
  }
  return btoa(chunks.join(""));
}
