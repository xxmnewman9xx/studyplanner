import { inflate } from "pako";

declare const atob: ((data: string) => string) | undefined;

export function extractTextFromPdfBase64(base64: string) {
  const bytes = base64ToBytes(base64);
  const pdf = bytesToLatin1(bytes);
  const textChunks: string[] = [];

  for (const { dictionary, start, end } of findPdfStreams(pdf)) {
    const streamBytes = trimStreamBytes(bytes.slice(start, end));
    const decoded = /FlateDecode/.test(dictionary)
      ? safeInflate(streamBytes)
      : bytesToLatin1(streamBytes);

    if (decoded) {
      textChunks.push(extractTextFromContentStream(decoded));
    }
  }

  const fallback = extractTextFromContentStream(pdf);
  if (fallback) {
    textChunks.push(fallback);
  }

  return cleanExtractedText(textChunks.join("\n"));
}

function base64ToBytes(base64: string) {
  if (typeof atob !== "function") {
    throw new Error("This device could not read the selected PDF.");
  }

  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToLatin1(bytes: Uint8Array) {
  const chunks: string[] = [];
  const chunkSize = 8192;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }

  return chunks.join("");
}

function* findPdfStreams(pdf: string) {
  const streamMarker = "stream";
  let cursor = 0;

  while (cursor < pdf.length) {
    const streamIndex = pdf.indexOf(streamMarker, cursor);
    if (streamIndex === -1) return;

    const dictionaryStart = pdf.lastIndexOf("<<", streamIndex);
    const dictionaryEnd = pdf.lastIndexOf(">>", streamIndex);
    const endIndex = pdf.indexOf("endstream", streamIndex);

    if (dictionaryStart !== -1 && dictionaryEnd !== -1 && dictionaryEnd > dictionaryStart && endIndex !== -1) {
      let start = streamIndex + streamMarker.length;
      if (pdf[start] === "\r" && pdf[start + 1] === "\n") {
        start += 2;
      } else if (pdf[start] === "\n" || pdf[start] === "\r") {
        start += 1;
      }

      yield {
        dictionary: pdf.slice(dictionaryStart, dictionaryEnd + 2),
        start,
        end: endIndex
      };
      cursor = endIndex + "endstream".length;
    } else {
      cursor = streamIndex + streamMarker.length;
    }
  }
}

function trimStreamBytes(bytes: Uint8Array) {
  let end = bytes.length;
  while (end > 0 && (bytes[end - 1] === 10 || bytes[end - 1] === 13)) {
    end -= 1;
  }
  return bytes.slice(0, end);
}

function safeInflate(bytes: Uint8Array) {
  try {
    return bytesToLatin1(inflate(bytes));
  } catch {
    return "";
  }
}

function extractTextFromContentStream(content: string) {
  const blocks = content.match(/BT[\s\S]*?ET/g) || [];
  return blocks.map(extractStringsFromTextBlock).filter(Boolean).join("\n");
}

function extractStringsFromTextBlock(block: string) {
  const tokens: string[] = [];
  let index = 0;

  while (index < block.length) {
    const char = block[index];
    if (char === "(") {
      const literal = readLiteralString(block, index);
      tokens.push(literal.value);
      index = literal.nextIndex;
      continue;
    }

    if (char === "<" && block[index + 1] !== "<") {
      const hex = readHexString(block, index);
      if (hex.value) {
        tokens.push(hex.value);
      }
      index = hex.nextIndex;
      continue;
    }

    index += 1;
  }

  return tokens.join(" ");
}

function readLiteralString(source: string, start: number) {
  let depth = 0;
  let escaped = false;
  let value = "";
  let index = start;

  while (index < source.length) {
    const char = source[index] || "";

    if (escaped) {
      value += decodeEscapedPdfChar(char, source, index);
      escaped = false;
      index += isOctalEscapeStart(char) ? countOctalEscapeChars(source, index) : 1;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      index += 1;
      continue;
    }

    if (char === "(") {
      if (depth > 0) value += char;
      depth += 1;
      index += 1;
      continue;
    }

    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return { value, nextIndex: index + 1 };
      }
      value += char;
      index += 1;
      continue;
    }

    value += char;
    index += 1;
  }

  return { value, nextIndex: source.length };
}

function decodeEscapedPdfChar(char: string, source: string, index: number) {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "\n":
    case "\r":
      return "";
    default:
      if (isOctalEscapeStart(char)) {
        const octal = source.slice(index, index + countOctalEscapeChars(source, index));
        return String.fromCharCode(Number.parseInt(octal, 8));
      }
      return char;
  }
}

function isOctalEscapeStart(char: string) {
  return /^[0-7]$/.test(char);
}

function countOctalEscapeChars(source: string, index: number) {
  let count = 0;
  while (count < 3 && /^[0-7]$/.test(source[index + count] || "")) {
    count += 1;
  }
  return count || 1;
}

function readHexString(source: string, start: number) {
  const end = source.indexOf(">", start + 1);
  if (end === -1) {
    return { value: "", nextIndex: source.length };
  }

  const hex = source.slice(start + 1, end).replace(/\s/g, "");
  return {
    value: decodeHexText(hex),
    nextIndex: end + 1
  };
}

function decodeHexText(hex: string) {
  const bytes: number[] = [];
  for (let index = 0; index < hex.length; index += 2) {
    bytes.push(Number.parseInt(hex.slice(index, index + 2).padEnd(2, "0"), 16));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let value = "";
    for (let index = 2; index < bytes.length; index += 2) {
      value += String.fromCharCode(((bytes[index] || 0) << 8) + (bytes[index + 1] || 0));
    }
    return value;
  }

  if (bytes.filter((byte) => byte === 0).length > bytes.length / 4) {
    let value = "";
    for (let index = 0; index < bytes.length; index += 2) {
      value += String.fromCharCode(((bytes[index] || 0) << 8) + (bytes[index + 1] || 0));
    }
    return value;
  }

  return String.fromCharCode(...bytes);
}

function cleanExtractedText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
