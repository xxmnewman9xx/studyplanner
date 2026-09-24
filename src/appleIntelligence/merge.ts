// Merge of heuristic (Build 90 regex) and validated on-device candidates
// (MASTER_PLAN §C5.7). Agreement raises confidence; model-only items stay
// unapproved so the student must opt in; heuristic items are never dropped
// unless the 80-candidate cap (savePendingImport's limit) forces it.

import { ImportBatch, ImportCandidate } from "../types";
import { candidateDueDate, normalizeCode } from "./payloads";
import { titleSimilarity } from "./text";

export const MERGE_CAP = 80;
export const AGREEMENT_TITLE_THRESHOLD = 0.5;

function classCode(candidate: ImportCandidate) {
  const code = (candidate.payload as { code?: unknown }).code;
  return normalizeCode(typeof code === "string" ? code : candidate.title.split("·")[0] || "");
}

function agrees(a: ImportCandidate, b: ImportCandidate) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "class") return classCode(a) !== "" && classCode(a) === classCode(b);
  const dueA = candidateDueDate(a);
  return Boolean(dueA) && dueA === candidateDueDate(b) && titleSimilarity(a.title, b.title) >= AGREEMENT_TITLE_THRESHOLD;
}

function withWeightFrom(target: ImportCandidate, source: ImportCandidate): ImportCandidate {
  const targetWeight = (target.payload as { weight?: unknown }).weight;
  const sourceWeight = (source.payload as { weight?: unknown }).weight;
  if (typeof targetWeight === "number" || typeof sourceWeight !== "number") return target;
  return { ...target, payload: { ...target.payload, weight: sourceWeight } };
}

const PRIORITY: Record<string, number> = { class: 0, both: 1, heuristic: 2, onDevice: 3 };

function priorityOf(candidate: ImportCandidate) {
  if (candidate.kind === "class") return PRIORITY.class;
  return PRIORITY[candidate.origin || "heuristic"] ?? PRIORITY.heuristic;
}

export function mergeSyllabusCandidates(heuristic: ImportBatch, model: ImportCandidate[]): ImportBatch {
  if (!Array.isArray(model) || model.length === 0) return heuristic;

  const merged: ImportCandidate[] = heuristic.candidates.map((candidate) => ({ ...candidate, origin: candidate.origin || "heuristic" }));
  const matchedHeuristic = new Set<number>();
  const heuristicCount = merged.length;

  for (const incoming of model) {
    if (!incoming || (incoming.kind !== "class" && incoming.kind !== "task" && incoming.kind !== "exam")) continue;
    let matchIndex = -1;
    for (let i = 0; i < heuristicCount; i += 1) {
      if (!matchedHeuristic.has(i) && agrees(merged[i], incoming)) {
        matchIndex = i;
        break;
      }
    }
    if (matchIndex < 0 && incoming.kind === "class") {
      // A class both sides found twice (e.g. across chunks) is still one agreement.
      matchIndex = merged.findIndex((candidate, index) => index < heuristicCount && agrees(candidate, incoming));
    }
    if (matchIndex >= 0) {
      matchedHeuristic.add(matchIndex);
      const current = merged[matchIndex];
      if (current.origin !== "both") {
        merged[matchIndex] = withWeightFrom({ ...current, origin: "both", confidence: Math.min(0.99, Math.round((current.confidence + 0.1) * 100) / 100) }, incoming);
      }
      continue;
    }
    if (merged.some((candidate, index) => index >= heuristicCount && agrees(candidate, incoming))) continue;
    merged.push({ ...incoming, origin: "onDevice", approved: false });
  }

  const indexed = merged.map((candidate, index) => ({ candidate, index }));
  const kept = indexed
    .slice()
    .sort((a, b) => priorityOf(a.candidate) - priorityOf(b.candidate) || a.index - b.index)
    .slice(0, MERGE_CAP);
  kept.sort((a, b) => {
    const classA = a.candidate.kind === "class" ? 0 : 1;
    const classB = b.candidate.kind === "class" ? 0 : 1;
    if (classA !== classB) return classA - classB;
    const dueA = candidateDueDate(a.candidate) || "9999-12-31";
    const dueB = candidateDueDate(b.candidate) || "9999-12-31";
    return dueA.localeCompare(dueB) || a.index - b.index;
  });

  return { ...heuristic, candidates: kept.map((entry) => entry.candidate) };
}

/** Model-only candidates in a merged batch: the ones the student must verify. */
export function countDisagreements(batch: ImportBatch) {
  return batch.candidates.filter((candidate) => candidate.origin === "onDevice").length;
}
