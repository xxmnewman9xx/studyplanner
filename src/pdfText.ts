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
  return bytes;
}

function bytesToLatin1(bytes: number[]) {
  let out = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    out += String.fromCharCode(...bytes.slice(index, index + 8192));
  }
  return out;
}

function decodePdfString(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_match, escape) => {
      if (escape === "n" || escape === "r") return "\n";
      if (escape === "t") return " ";
      if (escape === "b" || escape === "f") return "";
      return escape;
    })
    .replace(/\\(\d{1,3})/g, (_match, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\\r?\n/g, "")
    .replace(/\\./g, "");
}

function decodeHexPdfString(value: string) {
  const clean = value.replace(/[^0-9a-f]/gi, "");
  const chars: string[] = [];
  for (let index = 0; index < clean.length - 1; index += 2) {
    const code = parseInt(clean.slice(index, index + 2), 16);
    if (code >= 32 && code <= 126) chars.push(String.fromCharCode(code));
  }
  return chars.join("");
}

function cleanExtractedText(raw: string) {
  const seen = new Map<string, number>();
  return raw
    .replace(/\r/g, "\n")
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/[ \t]+/g, " ")
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

export function extractPdfTextFromBase64(base64: string): PdfTextExtraction {
  const pdf = bytesToLatin1(decodeBase64(base64));
  const chunks: string[] = [];
  const textOpPattern = /\((?:\\.|[^\\)]){2,}\)\s*Tj|\[(?:.|\n|\r){0,1200}?\]\s*TJ|<([0-9A-Fa-f\s]{6,})>\s*Tj/g;
  let match: RegExpExecArray | null;

  while ((match = textOpPattern.exec(pdf))) {
    const token = match[0];
    const literalMatches = token.match(/\((?:\\.|[^\\)]){2,}\)/g) || [];
    literalMatches.forEach((literal) => chunks.push(decodePdfString(literal.slice(1, -1))));
    const hexMatches = token.match(/<([0-9A-Fa-f\s]{6,})>/g) || [];
    hexMatches.forEach((hex) => chunks.push(decodeHexPdfString(hex.slice(1, -1))));
  }

  if (chunks.length < 4) {
    const fallbackMatches = pdf.match(/\((?:\\.|[^\\)]){3,}\)/g) || [];
    fallbackMatches.slice(0, 800).forEach((literal) => chunks.push(decodePdfString(literal.slice(1, -1))));
  }

  const text = cleanExtractedText(chunks.join("\n"));
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return {
    text,
    wordCount,
    confidence: wordCount >= 180 ? 0.82 : wordCount >= 60 ? 0.66 : 0.35,
    fallbackNeeded: wordCount < 20,
  };
}
