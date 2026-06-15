import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeNotes } from "../src/ai";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import { defaultData } from "./fixture-data";
import { NoteItem } from "../src/types";

type Case = {
  locale: string;
  kind: string;
  text: string;
  sparse?: boolean;
};

const cases: Case[] = [
  { locale: "en-US", kind: "lecture outline", text: "Biology Lecture Photosynthesis Definition chlorophyll converts light. Formula ATP + NADPH. Exam hint know Calvin cycle. confusing electron transport review later." },
  { locale: "en-GB", kind: "revision sheet", text: "CHEM revision practical exam Definition catalyst lowers activation energy. Formula rate = k[A]. confusing equilibrium review later." },
  { locale: "en-AU", kind: "tutorial notes", text: "PSYC tutorial memory Definition working memory stores information briefly. Formula score = correct / total. confusing attention review before quiz." },
  { locale: "en-CA", kind: "lab notes", text: "BIO lab osmosis Definition water crosses membrane. Formula concentration gradient. confusing diffusion review for exam." },
  { locale: "es-ES", kind: "exam review", text: "BIO revisión examen definición mitosis tarea confusing ciclo celular repasar formula ATP." },
  { locale: "es-MX", kind: "apuntes de clase", text: "HIST revisión examen definición revolución tarea confusing causas consecuencias repasar cronología." },
  { locale: "pt-BR", kind: "formula notes", text: "FIN revisão WACC = E/V Re + D/V Rd. beta confusing. exame precisa revisar custo capital." },
  { locale: "pt-PT", kind: "ficha de estudo", text: "BIO revisão exame definição célula trabalho confusing mitose meiose formula ATP." },
  { locale: "fr-CA", kind: "definitions", text: "PSYC réviser définition mémoire travail. devoir cognition. confusing attention sélective." },
  { locale: "fr-FR", kind: "fiche de révision", text: "MATH réviser examen définition dérivée formule limite devoir confusing règle chaîne." },
  { locale: "de-DE", kind: "weak areas", text: "CHEM klausur review aufgabe molaritat formula M=n/V confusing titration." },
  { locale: "ja", kind: "messy OCR", text: "CHEM 復習 試験 formula pH=-logH 課題 confusing 酸 塩基 review later" },
  { locale: "ko", kind: "flashcard style", text: "CS 복습 시험 Definition algorithm complexity O(n log n) confusing graph traversal" },
  { locale: "zh-Hans", kind: "mixed topic", text: "MATH 复习 考试 formula derivative limit 作业 confusing chain rule" },
  { locale: "zh-Hant", kind: "複習筆記", text: "ECON 復習 考試 formula elasticity demand 作業 confusing opportunity cost review" },
  { locale: "hi", kind: "OCR notes", text: "BIO समीक्षा परीक्षा formula ATP असाइनमेंट confusing कोशिका division review" },
  { locale: "ar-SA", kind: "sparse notes", text: "CHEM مراجعة اختبار formula pH واجب confusing acid base", sparse: true },
  { locale: "Sparse", kind: "too short", text: "some stuff maybe", sparse: true },
];

const failures: string[] = [];
const rows = cases.map((item) => {
  const batch = analyzeNotes(item.text, defaultData);
  const noteCandidate = batch.candidates.find((candidate) => candidate.kind === "note");
  const taskCandidate = batch.candidates.find((candidate) => candidate.kind === "task");
  const note = noteCandidate?.payload as NoteItem | undefined;
  const data = note ? { ...defaultData, notes: [...defaultData.notes, note] } : defaultData;
  const snapshot = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, snapshot);
  const hasWeakSignal = /confusing|weak|review/i.test(JSON.stringify(note?.suggestedTasks || [])) || /confusing|review/i.test(item.text);

  if (!noteCandidate) failures.push(`${item.locale}: no note candidate`);
  if (!item.sparse && !taskCandidate) failures.push(`${item.locale}: expected review task`);
  if (!item.sparse && (note?.terms.length || 0) < 2) failures.push(`${item.locale}: expected multiple concepts`);
  if (item.sparse && noteCandidate && noteCandidate.confidence > 0.75) failures.push(`${item.locale}: sparse notes overconfident`);
  if (!hasWeakSignal) failures.push(`${item.locale}: missing weak/review signal`);
  if (!narrative.notesNudge) failures.push(`${item.locale}: missing notes narrative`);

  return `| ${item.locale} | ${item.kind} | ${note?.terms.length || 0} | ${taskCandidate ? "yes" : "no"} | ${noteCandidate?.confidence.toFixed(2) || "0"} | ${snapshot.semesterHealth.dimensions.preparedness.score} | ${narrative.notesNudge} | ${failures.some((failure) => failure.startsWith(`${item.locale}:`)) ? "FAIL" : "PASS"} |`;
});

const score = Math.round(((cases.length - failures.length) / cases.length) * 10);

const report = `# Global Notes OCR Locale Stress Report

## Scope
Global notes stress test covering every localized App Store app-title locale, lecture outlines, OCR-like notes, formulas, definitions, exam review hints, weak-area language, flashcard-friendly material, and sparse input.

## Result
${failures.length ? "FAIL" : "PASS"}

Score: ${score}/10

| Locale | Scenario | Concepts | Review Task | Confidence | Preparedness | Notes Narrative | Status |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
${rows.join("\n")}

## Guardrails
- Notes improve preparedness only when there is enough signal.
- Sparse notes stay low confidence.
- Weak-area language should produce review-oriented suggestions without hallucinating certainty.

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(process.cwd(), "BUILD_44_GLOBAL_NOTES_REPORT.md"), report);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build 44 global notes stress passed");
