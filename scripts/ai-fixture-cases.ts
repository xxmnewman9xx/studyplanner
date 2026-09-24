/// <reference types="node" />
// Reads the inline syllabus cases out of the existing stress scripts without
// executing them (those scripts write report files and exit on import).
// Used by check-smart-syllabus.ts and eval-extraction.ts so the AI tests
// always cover exactly the fixtures the Build 90 suites cover.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractPdfTextFromBase64 } from "../src/pdfText";

export type InlineSyllabusCase = { name: string; text: string; locale?: string; type?: string };

function literalAfter(source: string, marker: string) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Marker not found: ${marker}`);
  const open = source.indexOf("[", start + marker.length - 1);
  let depth = 0;
  let inString: string | null = null;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (char === "\\") i += 1;
      else if (char === inString) inString = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") inString = char;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`Unterminated literal after ${marker}`);
}

function evaluateLiteral<T>(literal: string): T {
  // The literals are plain object/array/string data written in this repo.
  return new Function(`return ${literal};`)() as T;
}

function scriptSource(name: string) {
  return readFileSync(join(__dirname, name), "utf8");
}

export function loadSyllabusStressCases(): InlineSyllabusCase[] {
  return evaluateLiteral<InlineSyllabusCase[]>(literalAfter(scriptSource("check-syllabus-stress.ts"), "const cases: Case[] = ["));
}

export function loadGlobalSyllabusStressCases(): InlineSyllabusCase[] {
  const cases = evaluateLiteral<Array<{ locale: string; type: string; text: string }>>(literalAfter(scriptSource("check-global-syllabus-stress.ts"), "const cases: Case[] = ["));
  return cases.map((item) => ({ name: `${item.locale} ${item.type}`, text: item.text, locale: item.locale, type: item.type }));
}

/** The fake PDF fixture in check-syllabus-stress.ts, run through the real PDF text extractor. */
export function loadSyllabusStressPdfText(): string {
  const source = scriptSource("check-syllabus-stress.ts");
  const start = source.indexOf("const fakePdf = `");
  const end = source.indexOf("`;", start + 17);
  if (start < 0 || end < 0) throw new Error("fakePdf fixture not found");
  const pdf = source.slice(start + "const fakePdf = `".length, end);
  return extractPdfTextFromBase64(Buffer.from(pdf, "latin1").toString("base64")).text;
}
