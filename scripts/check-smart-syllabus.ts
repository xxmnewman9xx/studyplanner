/// <reference types="node" />
// analyzeSyllabusSmart checks:
// 1. null runner == analyzeSyllabus byte-for-byte on every stress fixture (Build 90 parity),
// 2. hallucinating runners change nothing,
// 3. a grounded runner merges with correct origins and lifts recall,
// 4. every error code falls back to the heuristic; contextOverflow splits once.

import assert from "node:assert/strict";
import { analyzeSyllabus } from "../src/ai";
import { chunkSyllabusText } from "../src/appleIntelligence/context";
import { analyzeSyllabusSmart, SmartSyllabusProgress } from "../src/appleIntelligence/smartSyllabus";
import { titleSimilarity } from "../src/appleIntelligence/text";
import { AIErrorCode, ModelRunner, RawSyllabusItem } from "../src/appleIntelligence/types";
import { parseSyllabusDateText } from "../src/appleIntelligence/validators";
import { AppData, ImportBatch } from "../src/types";
import { loadGlobalSyllabusStressCases, loadSyllabusStressCases, loadSyllabusStressPdfText } from "./ai-fixture-cases";
import { EvalFixture, fixtureNow, loadFixtures, predictionsFrom, scoreFixture, totals } from "./eval-extraction";
import { defaultData } from "./fixture-data";

let checks = 0;
const asyncChecks: Array<[string, () => Promise<void>]> = [];
function checkAsync(name: string, fn: () => Promise<void>) {
  asyncChecks.push([name, fn]);
}

// Deterministic ids: analyzeSyllabus/makeOwnershipId use Date.now + Math.random.
const realRandom = Math.random;
const realNow = Date.now;
function seeded(seed: number) {
  let state = seed;
  Math.random = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  Date.now = () => 1788000000000;
}
function unseed() {
  Math.random = realRandom;
  Date.now = realNow;
}
function stable(batch: ImportBatch) {
  return JSON.stringify({ ...batch, createdAt: "<createdAt>" });
}

function emptyData(): AppData {
  return { ...JSON.parse(JSON.stringify(defaultData)), classes: [], tasks: [], exams: [], notes: [], studyBlocks: [], reminders: [], imports: [] };
}

const NOW = new Date(2026, 7, 20, 12, 0, 0);
const stressTexts = [
  ...loadSyllabusStressCases().map((item) => ({ name: `stress: ${item.name}`, text: item.text })),
  { name: "stress: fakePdf", text: loadSyllabusStressPdfText() },
  ...loadGlobalSyllabusStressCases().map((item) => ({ name: `global: ${item.name}`, text: item.text })),
];
assert.equal(stressTexts.length, 41, "20 stress + 1 PDF + 20 global cases");

const fixtures = loadFixtures();
const allTexts = [...stressTexts, ...fixtures.filter((fixture) => fixture.id.startsWith("hand-")).map((fixture) => ({ name: `eval: ${fixture.id}`, text: fixture.text }))];

checkAsync("null runner is byte-identical to analyzeSyllabus on every fixture", async () => {
  for (const [index, item] of allTexts.entries()) {
    for (const [label, data] of [["fixture data", defaultData], ["empty data", emptyData()]] as const) {
      seeded(index + 1);
      const expected = stable(analyzeSyllabus(item.text, data, NOW));
      seeded(index + 1);
      const result = await analyzeSyllabusSmart(item.text, data, NOW, null, { contextSize: 4096 });
      unseed();
      assert.equal(stable(result.batch), expected, `${item.name} (${label})`);
      assert.equal(result.usedModel, false);
      assert.equal(result.disagreements, 0);
    }
  }
});

function linesWithDates(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

checkAsync("hallucinating runners are fully rejected (output identical to the heuristic)", async () => {
  for (const [index, item] of allTexts.entries()) {
    const lines = linesWithDates(item.text);
    const runner: ModelRunner = async (_feature, input) => {
      const chunk = String(input.text || "");
      const chunkLines = linesWithDates(chunk);
      const first = chunkLines[0] || "x";
      const last = chunkLines[chunkLines.length - 1] || "x";
      const items: Array<Partial<RawSyllabusItem> & Record<string, unknown>> = [
        { kind: "final", title: "Final Exam", dateText: "March 3", sourceSpan: "Final Exam on March 3 in Room 9" }, // invented span
        { kind: "exam", title: first.slice(0, 40), dateText: "December 31", sourceSpan: first }, // date not in span
        { kind: "quiz", title: "Quiz 9", dateText: "2031-01-01", sourceSpan: `Quiz 9 on 2031-01-01` }, // invented, far future
        { kind: "assignment", title: last.slice(0, 40), dateText: "", sourceSpan: last }, // empty date
        { kind: "assignment", title: "Homework", dateText: "tomorrow", sourceSpan: `${first} tomorrow` }, // relative + altered span
        { kind: "lab", title: 7, dateText: "Sep 14", sourceSpan: first } as unknown as RawSyllabusItem, // bad type
      ];
      return { ok: true, cached: false, value: { courses: [{ code: "ZZZ 999", sourceSpan: "ZZZ 999 Invented Course" }], items } };
    };
    seeded(index + 7);
    const expected = stable(analyzeSyllabus(item.text, emptyData(), NOW));
    seeded(index + 7);
    const result = await analyzeSyllabusSmart(item.text, emptyData(), NOW, runner, { contextSize: 4096 });
    unseed();
    assert.equal(stable(result.batch), expected, `${item.name}: nothing hallucinated survives`);
    assert.equal(result.disagreements, 0);
    assert.ok(lines.length >= 1);
  }
});

// A grounded "oracle" model built from the gold labels: it quotes the exact
// source line and verbatim date token, like a well-behaved extractor would.
const DATE_TOKENS = [
  /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?/g,
  /\d{1,2}\s*月\s*\d{1,2}\s*日/g,
  /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
  /\b\d{1,2}\.\d{1,2}\.(?:\d{2,4})?/g,
  /\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g,
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?\b/gi,
  /\b\d{1,2}\s+(?:de\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+\d{4})?\b/gi,
];

function oracleItems(fixture: EvalFixture, chunk: string, now: Date): RawSyllabusItem[] {
  const items: RawSyllabusItem[] = [];
  const lines = chunk.split("\n");
  for (const gold of fixture.gold) {
    let found: RawSyllabusItem | null = null;
    for (const line of lines) {
      if (titleSimilarity(gold.title, line) < 0.5) continue;
      for (const pattern of DATE_TOKENS) {
        for (const match of line.matchAll(pattern)) {
          if (parseSyllabusDateText(match[0], now) === gold.date) {
            found = { kind: gold.kind === "exam" ? (/quiz|小テスト/i.test(gold.title) ? "quiz" : "exam") : "assignment", title: gold.title, dateText: match[0], sourceSpan: line.trim(), ...(gold.courseCode ? { courseCode: gold.courseCode } : {}) };
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) items.push(found);
  }
  return items;
}

checkAsync("grounded model output merges with origins and lifts recall without inventing dates", async () => {
  const baselineScores = [];
  const mergedScores = [];
  const modelOnlyScores = [];
  let oracleItemCount = 0;
  for (const fixture of fixtures) {
    const now = fixtureNow(fixture);
    const runner: ModelRunner = async (_feature, input) => {
      const items = oracleItems(fixture, String(input.text || ""), now);
      oracleItemCount += items.length;
      return { ok: true, cached: false, value: { courses: [], items } };
    };
    const heuristic = analyzeSyllabus(fixture.text, emptyData(), now);
    const result = await analyzeSyllabusSmart(fixture.text, emptyData(), now, runner, { contextSize: 4096 });
    const heuristicIds = new Set(heuristic.candidates.map((candidate) => candidate.title + (candidate.payload as any).dueDate));
    heuristic.candidates.forEach((candidate) => {
      assert.ok(result.batch.candidates.some((item) => item.title === candidate.title && (item.payload as any).dueDate === (candidate.payload as any).dueDate && item.kind === candidate.kind), `${fixture.id}: heuristic item kept`);
    });
    if (result.batch !== heuristic) {
      result.batch.candidates.forEach((candidate) => {
        assert.ok(candidate.origin === "heuristic" || candidate.origin === "both" || candidate.origin === "onDevice");
        if (candidate.origin === "onDevice") {
          assert.equal(candidate.approved, false);
          assert.ok(!heuristicIds.has(candidate.title + (candidate.payload as any).dueDate));
        }
      });
      assert.equal(result.disagreements, result.batch.candidates.filter((candidate) => candidate.origin === "onDevice").length);
    }
    baselineScores.push(scoreFixture(fixture, predictionsFrom(heuristic)));
    mergedScores.push(scoreFixture(fixture, predictionsFrom(result.batch)));
    modelOnlyScores.push(scoreFixture(fixture, predictionsFrom({ ...result.batch, candidates: result.batch.candidates.filter((candidate) => candidate.origin !== "heuristic") })));
  }
  const baseline = totals(baselineScores);
  const merged = totals(mergedScores);
  const modelOnly = totals(modelOnlyScores);
  assert.ok(oracleItemCount > 100, `oracle produced ${oracleItemCount} grounded items`);
  assert.ok(merged.recall >= baseline.recall + 0.1, `recall ${merged.recall.toFixed(3)} ≥ baseline ${baseline.recall.toFixed(3)} + 0.10`);
  assert.equal(merged.invented, baseline.invented, "validated model items add no invented dates");
  assert.ok(modelOnly.precision >= 0.95, `validated model/agreed items precision ${modelOnly.precision.toFixed(3)}`);
  console.log(`  oracle pipeline: baseline recall ${(baseline.recall * 100).toFixed(1)}% → merged ${(merged.recall * 100).toFixed(1)}%; validated-item precision ${(modelOnly.precision * 100).toFixed(1)}%`);
});

checkAsync("multi-chunk documents link items to the course named in an earlier chunk", async () => {
  const fixture = fixtures.find((item) => item.id === "hand-05-math-iso-dates-pages")!;
  const now = fixtureNow(fixture);
  const chunks = chunkSyllabusText(fixture.text, 1800);
  assert.ok(chunks.length >= 2, `split into ${chunks.length} chunks`);
  const progress: SmartSyllabusProgress[] = [];
  const runner: ModelRunner = async (_feature, input) => ({ ok: true, cached: false, value: { courses: [], items: oracleItems(fixture, String(input.text || ""), now).map(({ courseCode, ...rest }) => rest) } });
  const result = await analyzeSyllabusSmart(fixture.text, emptyData(), now, runner, { contextSize: 1800, onProgress: (p) => progress.push(p) });
  assert.equal(result.usedModel, true);
  assert.deepEqual(progress.map((p) => p.chunk), Array.from({ length: chunks.length + 1 }, (_, i) => i));
  assert.ok(progress.every((p) => p.total === chunks.length));
  assert.ok(progress[progress.length - 1].found >= progress[0].found);
  const modelItems = result.batch.candidates.filter((candidate) => candidate.origin === "onDevice" || candidate.origin === "both");
  assert.ok(modelItems.length > 0);
  modelItems.filter((candidate) => candidate.kind !== "class").forEach((candidate) => assert.equal(candidate.classId, "math221"));
  const throwingProgress = await analyzeSyllabusSmart(fixture.text, emptyData(), now, runner, { contextSize: 1800, onProgress: () => { throw new Error("UI crashed"); } });
  assert.equal(throwingProgress.usedModel, true, "a throwing progress callback does not break the import");
});

checkAsync("every error code falls back to the heuristic; contextOverflow splits once", async () => {
  const text = fixtures.find((item) => item.id === "hand-06-multi-course-packet")!.text;
  const codes: AIErrorCode[] = ["contextOverflow", "guardrail", "refusal", "unsupportedLocale", "rateLimited", "busy", "decoding", "assetsUnavailable", "timeout", "cancelled", "background", "unavailable"];
  for (const code of codes) {
    let calls = 0;
    const runner: ModelRunner = async () => {
      calls += 1;
      return { ok: false, code };
    };
    seeded(99);
    const expected = stable(analyzeSyllabus(text, emptyData(), NOW));
    seeded(99);
    const result = await analyzeSyllabusSmart(text, emptyData(), NOW, runner, { contextSize: 4096 });
    unseed();
    assert.equal(stable(result.batch), expected, `${code} → heuristic`);
    assert.equal(result.usedModel, false);
    assert.equal(calls, code === "contextOverflow" ? 3 : 1, `${code} call count`);
  }
  let overflowCalls = 0;
  const splitRunner: ModelRunner = async (_feature, input) => {
    overflowCalls += 1;
    if (!input.split) return { ok: false, code: "contextOverflow" };
    return { ok: true, cached: false, value: { courses: [], items: [{ kind: "assignment", title: "Final paper", dateText: "December 8", sourceSpan: "- Final paper due December 8", courseCode: "HIST 110" }] } };
  };
  const split = await analyzeSyllabusSmart(text, emptyData(), NOW, splitRunner, { contextSize: 4096 });
  assert.equal(overflowCalls, 3);
  assert.equal(split.usedModel, true);
  assert.ok(split.batch.candidates.some((candidate) => candidate.title === "Final paper" && candidate.origin === "both"));

  for (const bad of [async () => { throw new Error("native crash"); }, async () => "garbage", async () => null, async () => ({ ok: true, cached: false, value: "not json" })] as unknown as ModelRunner[]) {
    const result = await analyzeSyllabusSmart(text, emptyData(), NOW, bad, { contextSize: 4096 });
    assert.equal(result.disagreements, 0);
    assert.ok(result.batch.candidates.every((candidate) => candidate.origin !== "onDevice"));
  }
  const controller = new AbortController();
  controller.abort();
  let abortedCalls = 0;
  const aborted = await analyzeSyllabusSmart(text, emptyData(), NOW, async () => { abortedCalls += 1; return { ok: true, cached: false, value: {} }; }, { contextSize: 4096, signal: controller.signal });
  assert.equal(abortedCalls, 0);
  assert.equal(aborted.usedModel, false);
});

(async () => {
  for (const [name, fn] of asyncChecks) {
    try {
      await fn();
      checks += 1;
    } catch (error) {
      unseed();
      console.error(`FAIL: ${name}`);
      throw error;
    }
  }
  console.log(`Smart syllabus checks passed (${checks})`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
