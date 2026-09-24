// Syllabus → Semester orchestrator (F2). The Build 90 heuristic parser always
// runs first and is the result whenever the model is absent or fails.

import { analyzeSyllabus } from "../ai";
import { dateKey } from "../intelligence";
import { AppData, ImportBatch, ImportCandidate } from "../types";
import { chunkSyllabusText } from "./context";
import { countDisagreements, mergeSyllabusCandidates } from "./merge";
import { AIErrorCode, AIResult, ModelRunner } from "./types";
import { validateSyllabusChunk } from "./validators";

export type SmartSyllabusProgress = { chunk: number; total: number; found: number };

export type SmartSyllabusOptions = {
  contextSize: number;
  signal?: AbortSignal;
  onProgress?: (progress: SmartSyllabusProgress) => void;
  /** Per-call timeout passed to the runner. */
  timeoutMs?: number;
};

export type SmartSyllabusResult = { batch: ImportBatch; usedModel: boolean; disagreements: number };

function datedCount(batch: ImportBatch) {
  return batch.candidates.filter((candidate) => candidate.kind === "task" || candidate.kind === "exam").length;
}

function splitInTwo(chunk: string): [string, string] | null {
  const lines = chunk.split("\n");
  if (lines.length < 2) {
    if (chunk.length < 40) return null;
    const middle = chunk.lastIndexOf(" ", Math.floor(chunk.length / 2));
    const cut = middle > 0 ? middle : Math.floor(chunk.length / 2);
    return [chunk.slice(0, cut), chunk.slice(cut).trim()];
  }
  const middle = Math.ceil(lines.length / 2);
  // One line of overlap, like the chunker.
  return [lines.slice(0, middle).join("\n"), lines.slice(Math.max(0, middle - 1)).join("\n")];
}

async function runChunk(runner: ModelRunner, chunk: string, meta: Record<string, unknown>, options: SmartSyllabusOptions): Promise<AIResult<unknown>> {
  try {
    const result = await runner("syllabusExtract", { text: chunk, ...meta }, { signal: options.signal, timeoutMs: options.timeoutMs });
    if (!result || typeof result !== "object" || typeof (result as { ok?: unknown }).ok !== "boolean") return { ok: false, code: "decoding" };
    return result;
  } catch {
    return { ok: false, code: options.signal?.aborted ? "cancelled" : "unavailable" };
  }
}

function safeProgress(options: SmartSyllabusOptions, progress: SmartSyllabusProgress) {
  try {
    options.onProgress?.(progress);
  } catch {
    // Progress UI must never break an import.
  }
}

export async function analyzeSyllabusSmart(
  text: string,
  data: AppData,
  now: Date,
  runner: ModelRunner | null,
  options: SmartSyllabusOptions
): Promise<SmartSyllabusResult> {
  const heuristic = analyzeSyllabus(text, data, now);
  if (!runner) return { batch: heuristic, usedModel: false, disagreements: 0 };

  const chunks = chunkSyllabusText(text, options.contextSize);
  if (!chunks.length) return { batch: heuristic, usedModel: false, disagreements: 0 };

  const validated: ImportCandidate[] = [];
  let usedModel = false;
  let preceding = "";
  const total = chunks.length;
  safeProgress(options, { chunk: 0, total, found: datedCount(heuristic) });

  for (let index = 0; index < chunks.length; index += 1) {
    if (options.signal?.aborted) return { batch: heuristic, usedModel: false, disagreements: 0 };
    const chunk = chunks[index];
    const meta = { chunkIndex: index, chunkCount: total, today: dateKey(now) };
    const validationOptions = { documentText: text, precedingText: preceding };
    const result = await runChunk(runner, chunk, meta, options);
    if (result.ok) {
      usedModel = true;
      validated.push(...validateSyllabusChunk(result.value, chunk, data, now, validationOptions));
    } else if (result.code === "contextOverflow") {
      const halves = splitInTwo(chunk);
      if (halves) {
        let halfPreceding = preceding;
        for (const half of halves) {
          if (options.signal?.aborted) break;
          const retry = await runChunk(runner, half, { ...meta, split: true }, options);
          if (retry.ok) {
            usedModel = true;
            validated.push(...validateSyllabusChunk(retry.value, half, data, now, { documentText: text, precedingText: halfPreceding }));
          }
          halfPreceding = `${halfPreceding}\n${half}`;
        }
      }
    } else if ((["cancelled", "background"] as AIErrorCode[]).includes(result.code)) {
      return { batch: heuristic, usedModel: false, disagreements: 0 };
    }
    // Every other error code: the heuristic result already covers this chunk.
    preceding = `${preceding}\n${chunk}`;
    const partial = mergeSyllabusCandidates(heuristic, validated);
    safeProgress(options, { chunk: index + 1, total, found: datedCount(partial) });
  }

  if (!usedModel || !validated.length) return { batch: heuristic, usedModel, disagreements: 0 };
  const batch = mergeSyllabusCandidates(heuristic, validated);
  return { batch, usedModel, disagreements: countDisagreements(batch) };
}
