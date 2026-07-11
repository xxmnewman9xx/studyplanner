import { inflate } from "pako";

export type PdfTextExtraction = {
  text: string;
  wordCount: number;
  confidence: number;
  fallbackNeeded: boolean;
};

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64(base64: string) {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    if (char === "=") break;
    const value = BASE64_ALPHABET.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

function bytesToLatin1(bytes: Uint8Array | number[]) {
  let out = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    out += String.fromCharCode(...Array.from(bytes.slice(index, index + 8192)));
  }
  return out;
}

function decodeTextBytes(bytes: number[]) {
  if (!bytes.length) return "";

  if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeUtf16(bytes.slice(2), "be");
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return decodeUtf16(bytes.slice(2), "le");

  const evenZeros = bytes.filter((byte, index) => index % 2 === 0 && byte === 0).length;
  const oddZeros = bytes.filter((byte, index) => index % 2 === 1 && byte === 0).length;
  if (evenZeros + oddZeros > bytes.length / 4) {
    return decodeUtf16(bytes, evenZeros > oddZeros ? "be" : "le");
  }

  if (typeof TextDecoder !== "undefined") {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    } catch {
      // Fall through to PDFDocEncoding/Latin-1 compatible decoding.
    }
  }

  return String.fromCharCode(...bytes);
}

function decodeUtf16(bytes: number[], endian: "be" | "le") {
  let value = "";
  for (let index = 0; index < bytes.length - 1; index += 2) {
    const code = endian === "be"
      ? ((bytes[index] || 0) << 8) + (bytes[index + 1] || 0)
      : ((bytes[index + 1] || 0) << 8) + (bytes[index] || 0);
    if (code) value += String.fromCharCode(code);
  }
  return value;
}

function readLiteralString(source: string, start: number) {
  let depth = 0;
  let index = start;
  const bytes: number[] = [];

  while (index < source.length) {
    const char = source[index] || "";

    if (char === "\\") {
      const next = source[index + 1] || "";
      if (next === "\r" || next === "\n") {
        index += next === "\r" && source[index + 2] === "\n" ? 3 : 2;
        continue;
      }
      if (/^[0-7]$/.test(next)) {
        const octal = source.slice(index + 1, index + 4).match(/^[0-7]{1,3}/)?.[0] || "";
        bytes.push(parseInt(octal, 8) & 0xff);
        index += 1 + octal.length;
        continue;
      }
      const escaped = next === "n" ? 10
        : next === "r" ? 13
          : next === "t" ? 9
            : next === "b" ? 8
              : next === "f" ? 12
                : next.charCodeAt(0);
      bytes.push(escaped & 0xff);
      index += 2;
      continue;
    }

    if (char === "(") {
      if (depth > 0) bytes.push(char.charCodeAt(0));
      depth += 1;
      index += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) return { value: decodeTextBytes(bytes), nextIndex: index + 1 };
      bytes.push(char.charCodeAt(0));
      index += 1;
      continue;
    }

    bytes.push(char.charCodeAt(0) & 0xff);
    index += 1;
  }

  return { value: decodeTextBytes(bytes), nextIndex: source.length };
}

function readHexString(source: string, start: number) {
  const end = source.indexOf(">", start + 1);
  if (end === -1) return { value: "", nextIndex: source.length };
  const clean = source.slice(start + 1, end).replace(/[^0-9a-f]/gi, "");
  const bytes: number[] = [];
  for (let index = 0; index < clean.length; index += 2) {
    bytes.push(parseInt(clean.slice(index, index + 2).padEnd(2, "0"), 16));
  }
  return { value: decodeTextBytes(bytes), nextIndex: end + 1 };
}

function extractStringsFromTextBlock(block: string) {
  const tokens: string[] = [];
  let index = 0;
  while (index < block.length) {
    const char = block[index];
    if (char === "(") {
      const literal = readLiteralString(block, index);
      if (literal.value) tokens.push(literal.value);
      index = literal.nextIndex;
      continue;
    }
    if (char === "<" && block[index + 1] !== "<") {
      const hex = readHexString(block, index);
      if (hex.value) tokens.push(hex.value);
      index = hex.nextIndex;
      continue;
    }
    index += 1;
  }
  return tokens.join(" ");
}

function extractTextFromContentStream(content: string) {
  const blocks = content.match(/BT[\s\S]*?ET/g) || [];
  const sourceBlocks = blocks.length ? blocks : [content];
  return sourceBlocks.map(extractStringsFromTextBlock).filter(Boolean).join("\n");
}

function* findPdfStreams(pdf: string) {
  let cursor = 0;
  while (cursor < pdf.length) {
    const streamIndex = pdf.indexOf("stream", cursor);
    if (streamIndex === -1) return;

    const dictionaryStart = pdf.lastIndexOf("<<", streamIndex);
    const dictionaryEnd = pdf.lastIndexOf(">>", streamIndex);
    const endIndex = pdf.indexOf("endstream", streamIndex);
    if (dictionaryStart !== -1 && dictionaryEnd > dictionaryStart && endIndex !== -1) {
      let start = streamIndex + "stream".length;
      if (pdf[start] === "\r" && pdf[start + 1] === "\n") start += 2;
      else if (pdf[start] === "\n" || pdf[start] === "\r") start += 1;
      yield {
        dictionary: pdf.slice(dictionaryStart, dictionaryEnd + 2),
        start,
        end: endIndex,
      };
      cursor = endIndex + "endstream".length;
    } else {
      cursor = streamIndex + "stream".length;
    }
  }
}

function trimStreamBytes(bytes: Uint8Array) {
  let end = bytes.length;
  while (end > 0 && (bytes[end - 1] === 10 || bytes[end - 1] === 13)) end -= 1;
  return bytes.slice(0, end);
}

function safeDecodeStream(dictionary: string, bytes: Uint8Array) {
  try {
    const streamBytes = trimStreamBytes(bytes);
    return /FlateDecode/.test(dictionary) ? bytesToLatin1(inflate(streamBytes)) : bytesToLatin1(streamBytes);
  } catch {
    return "";
  }
}

function cleanExtractedText(raw: string) {
  const seen = new Map<string, number>();
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/-\n(?=\p{Ll})/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && !/^page\s+\d+$/i.test(line))
    .filter((line) => {
      const key = line.toLowerCase();
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);
      return count < 2;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readableUnitCount(text: string) {
  const wordLike = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || [];
  const compactScriptChars = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || [];
  return Math.max(wordLike.length, Math.floor(compactScriptChars.length / 2));
}

function looksCorrupted(text: string) {
  if (!text.trim()) return true;
  const badMarkers = text.match(/[�□]|Ã.|Â.|â[€\u0080-\u00bf]|ã[€\u0080-\u00bf]/g) || [];
  const controls = text.match(/[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g) || [];
  const letters = text.match(/\p{L}/gu) || [];
  if (badMarkers.length > 0) return true;
  if (controls.length > Math.max(2, text.length * 0.01)) return true;
  return letters.length < Math.min(12, Math.floor(text.length * 0.08));
}

function hasStrongSyllabusSignals(text: string) {
  const academicTerms = text.match(/\b(?:syllabus|course|class|assignment|homework|exam|midterm|final|quiz|lecture|reading|discussion|lab|project|paper|grade|grading|credits|instructor|professor|office hours|schedule|deadline|due|lehrplan|kurs|aufgabe|prüfung|programm|clase|tarea|examen|entrega|fecha|cours|devoir|échéance|plano|prova|trabalho)\b|(?:シラバス|講義|授業|課題|試験|締切|강의계획서|수업|과제|시험|마감|课程|大纲|作业|考试|截止|सिलेबस|कक्षा|असाइनमेंट|परीक्षा|منهج|مادة|واجب|اختبار)/giu) || [];
  const dateSignal = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/iu.test(text);
  const structureSignal = /\b(?:week|unit|module|chapter|lecture|topic|grading|points?|percent|%|rubric|office hours|meeting|room|due)\b/iu.test(text);
  return academicTerms.length >= 2 && (dateSignal || structureSignal);
}

export function extractPdfTextFromBase64(base64: string): PdfTextExtraction {
  const bytes = decodeBase64(base64);
  const pdf = bytesToLatin1(bytes);
  const chunks: string[] = [];
  const streamChunks: string[] = [];

  for (const stream of findPdfStreams(pdf)) {
    const decoded = safeDecodeStream(stream.dictionary, bytes.slice(stream.start, stream.end));
    const extracted = decoded ? extractTextFromContentStream(decoded) : "";
    if (extracted) streamChunks.push(extracted);
  }

  if (streamChunks.length) chunks.push(...streamChunks);
  else chunks.push(extractTextFromContentStream(pdf));

  if (!streamChunks.length && chunks.length < 4) {
    const fallbackMatches = pdf.match(/\((?:\\.|[^\\)]){3,}\)/g) || [];
    fallbackMatches.slice(0, 800).forEach((literal) => chunks.push(readLiteralString(literal, 0).value));
  }

  const text = cleanExtractedText(chunks.join("\n"));
  const wordCount = readableUnitCount(text);
  const hasReadableText = chunks.some((chunk) => chunk.trim().length > 0);
  const hasStrongShortSyllabus = hasReadableText && wordCount >= 18 && wordCount < 55 && hasStrongSyllabusSignals(text);
  const hasEnoughStructure = hasReadableText && (wordCount >= 55 || hasStrongShortSyllabus);
  const corrupted = looksCorrupted(text);
  const fallbackNeeded = (wordCount < 55 && !hasStrongShortSyllabus) || !hasEnoughStructure || corrupted;
  return {
    text,
    wordCount,
    confidence: corrupted ? 0.18 : wordCount >= 180 ? 0.82 : wordCount >= 80 ? 0.66 : hasStrongShortSyllabus ? 0.58 : hasEnoughStructure ? 0.52 : 0.28,
    fallbackNeeded,
  };
}
