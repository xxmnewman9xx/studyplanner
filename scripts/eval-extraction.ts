/// <reference types="node" />
// Syllabus extraction eval against hand-labeled gold (tools/fm-eval/fixtures).
//
//   tsx scripts/eval-extraction.ts --baseline
//       Scores the Build 90 heuristic (analyzeSyllabus) and writes tools/fm-eval/BASELINE.md.
//   tsx scripts/eval-extraction.ts --dump-chunks <dir> [--context 4096]
//       Writes <id>.chunks.json (the exact chunk strings the app would send) for the Mac harness.
//   tsx scripts/eval-extraction.ts --model <dir> [--context 4096]
//       Scores raw model output (<dir>/<id>.json, one RawSyllabusChunk per chunk) AFTER
//       validateSyllabusChunk + mergeSyllabusCandidates, i.e. the gated pipeline the app ships.
//
// Exits non-zero only for code errors, never for low scores.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeSyllabus, normalizeGlobalAcademicText } from "../src/ai";
import { chunkSyllabusText } from "../src/appleIntelligence/context";
import { addDaysKey, dateKey, weekdayOfKey } from "../src/appleIntelligence/dateKeys";
import { mergeSyllabusCandidates } from "../src/appleIntelligence/merge";
import { titleSimilarity } from "../src/appleIntelligence/text";
import { scanGroundedDates, validateSyllabusChunk } from "../src/appleIntelligence/validators";
import { AppData, ImportBatch, ImportCandidate } from "../src/types";
import { defaultData } from "./fixture-data";

export type GoldItem = { title: string; kind: "task" | "exam"; date: string; courseCode?: string; aliases?: string[] };
export type EvalFixture = { id: string; name: string; source: string; locale: string; now: string; text: string; gold: GoldItem[]; notes?: string };
type Prediction = { title: string; kind: "task" | "exam"; date: string; origin?: string };
type Score = { id: string; gold: number; predicted: number; matched: number; invented: number; inventedDates: string[]; missed: string[]; extra: string[] };

const ROOT = join(__dirname, "..", "tools", "fm-eval");
const FIXTURE_DIR = join(ROOT, "fixtures");
export const TITLE_MATCH_THRESHOLD = 0.5;
const SAFETY_TASK = "Review imported syllabus";

export function loadFixtures(): EvalFixture[] {
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const fixture = JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8")) as EvalFixture;
      if (!fixture.id || typeof fixture.text !== "string" || !Array.isArray(fixture.gold)) throw new Error(`Malformed fixture ${name}`);
      return fixture;
    });
}

export function emptyEvalData(): AppData {
  return { ...JSON.parse(JSON.stringify(defaultData)), classes: [], tasks: [], exams: [], notes: [], studyBlocks: [], reminders: [], imports: [] };
}

export function fixtureNow(fixture: EvalFixture) {
  const [y, m, d] = fixture.now.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function predictionsFrom(batch: ImportBatch): Prediction[] {
  return batch.candidates
    .filter((candidate: ImportCandidate) => (candidate.kind === "task" || candidate.kind === "exam") && !(candidate.kind === "task" && candidate.title === SAFETY_TASK && /^Safety task/.test(candidate.meta)))
    .map((candidate) => ({ title: candidate.title, kind: candidate.kind as "task" | "exam", date: String((candidate.payload as { dueDate?: unknown }).dueDate || ""), origin: candidate.origin }));
}

const WEEKDAY_TOKENS: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/** Dates a reader could derive from the text: every absolute date token, plus weekday/today/tomorrow resolved from `now`. */
export function derivableDates(text: string, now: Date) {
  const dates = new Set(scanGroundedDates(text, now));
  const today = dateKey(now);
  const lower = normalizeGlobalAcademicText(text).toLowerCase();
  if (/\btoday\b/.test(lower)) dates.add(today);
  if (/\btomorrow\b/.test(lower)) dates.add(addDaysKey(today, 1));
  for (const [name, day] of Object.entries(WEEKDAY_TOKENS)) {
    if (!new RegExp(`\\b${name.slice(0, 3)}`).test(lower)) continue;
    const delta = (day - weekdayOfKey(today) + 7) % 7 || 7;
    dates.add(addDaysKey(today, delta));
    dates.add(addDaysKey(today, delta + 7));
  }
  return dates;
}

export function scoreFixture(fixture: EvalFixture, predictions: Prediction[]): Score {
  const now = fixtureNow(fixture);
  const used = new Set<number>();
  const missed: string[] = [];
  fixture.gold.forEach((gold) => {
    const titles = [gold.title, ...(gold.aliases || [])];
    const index = predictions.findIndex((prediction, i) =>
      !used.has(i) && prediction.date === gold.date && prediction.kind === gold.kind && titles.some((title) => titleSimilarity(prediction.title, title) >= TITLE_MATCH_THRESHOLD)
    );
    if (index >= 0) used.add(index);
    else missed.push(`${gold.kind} "${gold.title}" ${gold.date}`);
  });
  const goldDates = new Set(fixture.gold.map((gold) => gold.date));
  const derivable = derivableDates(fixture.text, now);
  const inventedDates = predictions.filter((prediction) => !goldDates.has(prediction.date) && !derivable.has(prediction.date)).map((prediction) => `${prediction.date} "${prediction.title}"`);
  return {
    id: fixture.id,
    gold: fixture.gold.length,
    predicted: predictions.length,
    matched: used.size,
    invented: inventedDates.length,
    inventedDates,
    missed,
    extra: predictions.filter((_, i) => !used.has(i)).map((prediction) => `${prediction.kind} "${prediction.title}" ${prediction.date}`),
  };
}

function ratio(numerator: number, denominator: number) {
  return denominator ? numerator / denominator : 1;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

/** Percentage, or "n/a" when the denominator is 0. */
function rate(numerator: number, denominator: number) {
  return denominator ? pct(numerator / denominator) : "n/a";
}

export function totals(scores: Score[]) {
  const gold = scores.reduce((sum, score) => sum + score.gold, 0);
  const predicted = scores.reduce((sum, score) => sum + score.predicted, 0);
  const matched = scores.reduce((sum, score) => sum + score.matched, 0);
  const invented = scores.reduce((sum, score) => sum + score.invented, 0);
  return { gold, predicted, matched, invented, precision: ratio(matched, predicted), recall: ratio(matched, gold) };
}

function table(scores: Score[]) {
  return [
    "| Fixture | Gold | Predicted | Matched | Precision | Recall | Invented dates |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...scores.map((score) => `| ${score.id} | ${score.gold} | ${score.predicted} | ${score.matched} | ${rate(score.matched, score.predicted)} | ${rate(score.matched, score.gold)} | ${score.invented} |`),
  ].join("\n");
}

function details(scores: Score[]) {
  return scores
    .filter((score) => score.missed.length || score.extra.length || score.inventedDates.length)
    .map((score) => [
      `### ${score.id}`,
      score.missed.length ? `- Missed: ${score.missed.join("; ")}` : "",
      score.extra.length ? `- Unmatched predictions: ${score.extra.join("; ")}` : "",
      score.inventedDates.length ? `- Invented dates: ${score.inventedDates.join("; ")}` : "",
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}

function runBaseline(fixtures: EvalFixture[]) {
  const scores = fixtures.map((fixture) => scoreFixture(fixture, predictionsFrom(analyzeSyllabus(fixture.text, emptyEvalData(), fixtureNow(fixture)))));
  const total = totals(scores);
  const stress = totals(scores.filter((score) => score.id.startsWith("stress-")));
  const hand = totals(scores.filter((score) => score.id.startsWith("hand-")));
  const report = [
    "# Syllabus extraction baseline (Build 90 heuristic)",
    "",
    "Generated by `tsx scripts/eval-extraction.ts --baseline`. Do not edit by hand.",
    "",
    "Match rule: same ISO date, same kind class (exam vs task), and title token overlap ≥ 0.5 (shared tokens over the shorter title, against the gold title or an alias). The heuristic's placeholder \"Review imported syllabus\" safety task is not scored. An invented date is a predicted date that is neither a gold date nor derivable from any date token in the text (weekday names resolve from the fixture's `now`).",
    "",
    "## Totals",
    "",
    "| Set | Fixtures | Gold | Predicted | Matched | Precision | Recall | Invented dates |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    `| All | ${scores.length} | ${total.gold} | ${total.predicted} | ${total.matched} | ${pct(total.precision)} | ${pct(total.recall)} | ${total.invented} |`,
    `| Stress (21 inline cases) | ${scores.filter((score) => score.id.startsWith("stress-")).length} | ${stress.gold} | ${stress.predicted} | ${stress.matched} | ${pct(stress.precision)} | ${pct(stress.recall)} | ${stress.invented} |`,
    `| Handwritten multi-page | ${scores.filter((score) => score.id.startsWith("hand-")).length} | ${hand.gold} | ${hand.predicted} | ${hand.matched} | ${pct(hand.precision)} | ${pct(hand.recall)} | ${hand.invented} |`,
    "",
    "Model gate (MASTER_PLAN §C8), measured on the validated pipeline: 0 invented dates, precision ≥ 0.95, recall ≥ " + pct(total.recall + 0.1) + " (baseline + 10 pts).",
    "",
    "## Per fixture",
    "",
    table(scores),
    "",
    "## Details",
    "",
    details(scores) || "None.",
    "",
  ].join("\n");
  mkdirSync(ROOT, { recursive: true });
  writeFileSync(join(ROOT, "BASELINE.md"), report);
  console.log(`Baseline: fixtures=${scores.length} gold=${total.gold} predicted=${total.predicted} matched=${total.matched} precision=${pct(total.precision)} recall=${pct(total.recall)} invented=${total.invented}`);
  return total;
}

function argValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function contextSize() {
  const raw = Number(argValue("--context") || 4096);
  return Number.isFinite(raw) && raw > 0 ? raw : 4096;
}

function runDumpChunks(fixtures: EvalFixture[], dir: string) {
  mkdirSync(dir, { recursive: true });
  const size = contextSize();
  fixtures.forEach((fixture) => {
    writeFileSync(join(dir, `${fixture.id}.chunks.json`), `${JSON.stringify({ id: fixture.id, now: fixture.now, contextSize: size, chunks: chunkSyllabusText(fixture.text, size) }, null, 2)}\n`);
  });
  console.log(`Wrote ${fixtures.length} chunk files to ${dir}`);
}

function runModel(fixtures: EvalFixture[], dir: string) {
  const size = contextSize();
  const baseline = totals(fixtures.map((fixture) => scoreFixture(fixture, predictionsFrom(analyzeSyllabus(fixture.text, emptyEvalData(), fixtureNow(fixture))))));
  const scores: Score[] = [];
  const modelOnly: Score[] = [];
  const approvedOnly: Score[] = [];
  const missing: string[] = [];
  fixtures.forEach((fixture) => {
    const file = join(dir, `${fixture.id}.json`);
    if (!existsSync(file)) {
      missing.push(fixture.id);
      return;
    }
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
    const rawChunks = Array.isArray(raw) ? raw : [raw];
    const now = fixtureNow(fixture);
    const data = emptyEvalData();
    const chunks = chunkSyllabusText(fixture.text, size);
    const validated: ImportCandidate[] = [];
    let preceding = "";
    rawChunks.forEach((chunkOutput, index) => {
      const chunkText = chunks[index] ?? fixture.text;
      validated.push(...validateSyllabusChunk(chunkOutput, chunkText, data, now, { documentText: fixture.text, precedingText: preceding }));
      preceding = `${preceding}\n${chunkText}`;
    });
    const heuristic = analyzeSyllabus(fixture.text, data, now);
    const merged = mergeSyllabusCandidates(heuristic, validated);
    scores.push(scoreFixture(fixture, predictionsFrom(merged)));
    modelOnly.push(scoreFixture(fixture, predictionsFrom({ ...heuristic, candidates: validated })));
    // What "Approve trusted" applies in one tap (trust by agreement).
    approvedOnly.push(scoreFixture(fixture, predictionsFrom({ ...merged, candidates: merged.candidates.filter((candidate) => candidate.approved && candidate.confidence >= 0.85) })));
  });
  const total = totals(scores);
  const validatedOnly = totals(modelOnly);
  const trusted = totals(approvedOnly);
  // Precision is gated on the one-tap trusted set; the full review (which
  // also lists regex-only rows for the student to check) carries recall.
  const gates = {
    invented: total.invented === 0,
    precision: trusted.precision >= 0.95,
    recall: total.recall >= baseline.recall + 0.1,
  };
  const report = [
    "# Syllabus extraction: validated on-device pipeline",
    "",
    `Generated by \`tsx scripts/eval-extraction.ts --model ${dir}\` (context ${size}).`,
    "",
    "| Set | Gold | Predicted | Matched | Precision | Recall | Invented dates |",
    "|---|---:|---:|---:|---:|---:|---:|",
    `| Merged (heuristic + validated model) | ${total.gold} | ${total.predicted} | ${total.matched} | ${pct(total.precision)} | ${pct(total.recall)} | ${total.invented} |`,
    `| One-tap trusted set (both engines agree) | ${trusted.gold} | ${trusted.predicted} | ${trusted.matched} | ${pct(trusted.precision)} | ${pct(trusted.recall)} | ${trusted.invented} |`,
    `| Validated model items only | ${validatedOnly.gold} | ${validatedOnly.predicted} | ${validatedOnly.matched} | ${rate(validatedOnly.matched, validatedOnly.predicted)} | ${rate(validatedOnly.matched, validatedOnly.gold)} | ${validatedOnly.invented} |`,
    `| Heuristic baseline (all fixtures) | ${baseline.gold} | ${baseline.predicted} | ${baseline.matched} | ${pct(baseline.precision)} | ${pct(baseline.recall)} | ${baseline.invented} |`,
    "",
    `Gates: invented=0 ${gates.invented ? "PASS" : "FAIL"} · trusted-set precision≥95% ${gates.precision ? "PASS" : "FAIL"} · recall≥baseline+10pts (${pct(baseline.recall + 0.1)}) ${gates.recall ? "PASS" : "FAIL"}`,
    missing.length ? `\nMissing model output for: ${missing.join(", ")}` : "",
    "",
    table(scores),
    "",
    details(scores) || "",
    "",
  ].join("\n");
  writeFileSync(join(ROOT, "MODEL_RESULTS.md"), report);
  console.log(`Model (validated+merged): precision=${pct(total.precision)} recall=${pct(total.recall)} invented=${total.invented}; gates ${Object.values(gates).every(Boolean) ? "PASS" : "FAIL"}${missing.length ? `; missing ${missing.length}` : ""}`);
}

function main() {
  const fixtures = loadFixtures();
  if (process.argv.includes("--baseline")) runBaseline(fixtures);
  const dumpDir = argValue("--dump-chunks");
  if (dumpDir) runDumpChunks(fixtures, dumpDir);
  const modelDir = argValue("--model");
  if (modelDir) runModel(fixtures, modelDir);
  if (!process.argv.includes("--baseline") && !dumpDir && !modelDir) {
    console.log("Usage: tsx scripts/eval-extraction.ts --baseline | --dump-chunks <dir> | --model <dir> [--context 4096]");
  }
}

if (require.main === module) main();
