/// <reference types="node" />
import { writeFileSync } from "node:fs";
import { analyzeNotes } from "../src/ai";
import { buildSemesterSnapshot, generateStudyAssets, parseNoteInsights } from "../src/intelligence";
import { scanStudyNoteText } from "../src/services/noteScanner";
import { defaultData } from "./fixture-data";
import type { NoteItem } from "../src/types";

type Case = {
  name: string;
  text: string;
  expectFormula?: boolean;
  expectWeak?: boolean;
  sparse?: boolean;
};

const cases: Case[] = [
  { name: "Clean lecture outline", text: "BIO lecture: Mitosis. Prophase condenses chromosomes. Metaphase aligns chromosomes. Anaphase separates chromatids. Know this for exam." },
  { name: "Handwritten OCR-like notes", text: "chem kinetcs rxn rate confusng need review later catalys lowers activatn energy exam hint" , expectWeak: true },
  { name: "Formula-heavy notes", text: "Finance formulas. ROI = gain minus cost divided by cost. NPV = cash flow / discount rate. PV = FV / (1+r)^n. Practice examples.", expectFormula: true },
  { name: "Definition-heavy notes", text: "Osmosis: water movement across membrane. Diffusion: movement from high to low concentration. Homeostasis: stable internal condition." },
  { name: "Exam review notes", text: "Professor said know this: glycolysis steps, Krebs cycle, ATP yield. On exam: compare aerobic and anaerobic respiration." },
  { name: "Weak-area notes", text: "I don't understand stoichiometry. Confusing limiting reagent problems. Review later before quiz.", expectWeak: true },
  { name: "Flashcard-friendly notes", text: "Q: What is marginal cost? A: Added cost from one more unit. Q: What is elasticity? A: Responsiveness to price change." },
  { name: "Quiz-generation notes", text: "Photosynthesis has light reactions and Calvin cycle. Example: chlorophyll captures photons. Explain inputs and outputs." },
  { name: "Mixed class notes", text: "BIO 210 genetics Punnett squares. Finance note: NPV = sum of discounted cash flows. Focus on confusing probability terms.", expectFormula: true, expectWeak: true },
  { name: "Sparse notes", text: "Chapter 4 maybe important", sparse: true },
];

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const rows = cases.map((item) => {
  const batch = analyzeNotes(item.text, defaultData);
  const note = batch.candidates.find((candidate) => candidate.kind === "note")?.payload as NoteItem | undefined;
  assert(note, `${item.name}: note candidate missing`);
  const insight = parseNoteInsights(note!, defaultData);
  const assets = generateStudyAssets(note!, defaultData);
  const applied = {
    ...defaultData,
    notes: [note!, ...defaultData.notes],
    imports: [{ ...batch, status: "applied" as const }],
  };
  const snapshot = buildSemesterSnapshot(applied);
  const pass =
    insight.concepts.length > 0 &&
    insight.likelyExamTopics.length > 0 &&
    assets.flashcards.length > 0 &&
    assets.quiz.length > 0 &&
    snapshot.semesterHealth.dimensions.preparedness.score >= 0 &&
    (!item.expectFormula || insight.formulas.length > 0) &&
    (!item.expectWeak || insight.weakAreas.length > 0) &&
    (!item.sparse || insight.confidence < 0.7);
  return {
    ...item,
    pass,
    concepts: insight.concepts.length,
    formulas: insight.formulas.length,
    weakAreas: insight.weakAreas.length,
    flashcards: assets.flashcards.length,
    quiz: assets.quiz.length,
    confidence: Math.round(insight.confidence * 100),
    preparedness: snapshot.semesterHealth.dimensions.preparedness.score,
  };
});

const failed = rows.filter((row) => !row.pass);
const dueOnlyScan = scanStudyNoteText("Due: tomorrow\nAsk professor about lab rubric", "OCR note");
assert(
  dueOnlyScan.taskCandidates.every((task) => !/^Note task \d+$/i.test(task.title) && !/scanned note/i.test(task.title)),
  "Notes scanner must not emit numbered or scanner-generic filler task titles"
);
assert(
  dueOnlyScan.taskCandidates.some((task) => /tomorrow|rubric|question|class/i.test(task.title)),
  "Notes scanner should turn bare due/ask lines into actionable task titles"
);
const report = [
  "# Build 42 Notes Stress Test Report",
  "",
  `Result: ${failed.length ? "FAIL" : "PASS"}`,
  "",
  "| Format | Result | Concepts | Formulas | Weak Areas | Cards | Quiz | Confidence | Preparedness |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...rows.map((row) => `| ${row.name} | ${row.pass ? "PASS" : "FAIL"} | ${row.concepts} | ${row.formulas} | ${row.weakAreas} | ${row.flashcards} | ${row.quiz} | ${row.confidence}% | ${row.preparedness} |`),
  "",
  "## Misses",
  "",
  failed.length ? failed.map((row) => `- ${row.name}`).join("\n") : "None.",
  "",
].join("\n");

writeFileSync("BUILD_42_NOTES_STRESS_TEST_REPORT.md", report);

assert(!failed.length, `Notes stress failed: ${failed.map((row) => row.name).join(", ")}`);

console.log("Notes stress checks passed", { cases: rows.length });
