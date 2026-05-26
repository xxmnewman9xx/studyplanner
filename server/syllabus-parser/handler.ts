import { extractTextFromPdfBase64 } from "../../src/services/pdfText";
import { parseSyllabusText } from "../../src/services/syllabusLocalParser";
import type { SyllabusParseResult } from "../../src/models";

declare const require: any;
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
  | "OCR_TEXT_REQUIRED"
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

let ocrWorkerPromise: Promise<any> | null = null;

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

export async function closeSyllabusOcrWorkerForTests() {
  if (!ocrWorkerPromise) return;
  const worker = await ocrWorkerPromise;
  ocrWorkerPromise = null;
  await worker.terminate();
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
    return payloadFromText(await extractTextFromImageFile(file), name);
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

async function extractTextFromImageFile(file: File) {
  const imageBytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSupportedImageSignature(imageBytes)) {
    throw errorResponse(
      "OCR_TEXT_REQUIRED",
      "That image could not be decoded for text recognition. Try a PNG or JPEG photo with readable school material.",
      false,
      422
    );
  }

  const text = normalizeOcrText(await recognizeImageBuffer(imageBytes));
  if (!text.trim()) {
    throw errorResponse(
      "OCR_TEXT_REQUIRED",
      "No readable school material text was found in that image. Try a brighter, flatter photo or paste the text.",
      false,
      422
    );
  }
  return text;
}

async function recognizeImageBuffer(imageBytes: Uint8Array) {
  if (typeof Buffer === "undefined") {
    throw new Error("This server runtime cannot decode uploaded image bytes.");
  }

  try {
    const worker = await getOcrWorker();
    const result = await worker.recognize(Buffer.from(imageBytes));
    return typeof result?.data?.text === "string" ? result.data.text : "";
  } catch {
    throw errorResponse(
      "OCR_TEXT_REQUIRED",
      "The parser could not recognize readable text in that image. Try a brighter, flatter photo or paste the text.",
      false,
      422
    );
  }
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createOcrWorker();
  }
  return ocrWorkerPromise;
}

async function createOcrWorker() {
  const { PSM, createWorker } = require("tesseract.js");
  const englishData = require("@tesseract.js-data/eng");
  const worker = await createWorker("eng", undefined, {
    gzip: englishData.gzip,
    langPath: englishData.langPath,
    cacheMethod: "readOnly"
  });
  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: PSM.AUTO,
    user_defined_dpi: "300"
  });
  return worker;
}

function normalizeOcrText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasSupportedImageSignature(bytes: Uint8Array) {
  if (bytes.length < 4) return false;

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isGif =
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38;
  const isBmp = bytes[0] === 0x42 && bytes[1] === 0x4d;
  const isWebp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || isGif || isBmp || isWebp;
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
