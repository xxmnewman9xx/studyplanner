import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeSyllabus, normalizeGlobalAcademicText } from "../src/ai";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import { defaultData } from "./fixture-data";
import { AppData, ExamItem, TaskItem } from "../src/types";
import { parseSyllabusText } from "../src/services/syllabusLocalParser";

type Case = {
  locale: string;
  type: string;
  text: string;
  minTasks: number;
  minExams: number;
  expectDate?: string;
};

function emptyData(): AppData {
  return { ...JSON.parse(JSON.stringify(defaultData)), classes: [], tasks: [], exams: [], notes: [], studyBlocks: [] };
}

const cases: Case[] = [
  { locale: "en-US", type: "STEM syllabus", text: "BIO 101 Biology MWF 10:30 Richards 201\nSept 14: Problem Set 1 due\nSept 21: Quiz 1\nOct 5: Midterm Exam", minTasks: 1, minExams: 2 },
  { locale: "en-GB", type: "Module handbook", text: "HIST 210 Modern History TR 9:00 Room 12\n14 September: essay due\n21 September: seminar presentation\n5 October: final exam", minTasks: 2, minExams: 1, expectDate: "September 14" },
  { locale: "en-AU", type: "Tutorial outline", text: "PSYC 208 Psychology Tue Thu 12:00 Room 5\n14/09: lab report due\n21/09: quiz\n05/10: final exam", minTasks: 1, minExams: 2 },
  { locale: "en-CA", type: "Course schedule", text: "CHEM 122 Chemistry MW 11:00 Science 4\n2026-09-14: lab report due\n2026-10-05: midterm exam", minTasks: 1, minExams: 1 },
  { locale: "es-ES", type: "Guía docente", text: "HIST 210 Historia TR 9:00 Aula 12\n14 de septiembre: ensayo\n21 de septiembre: examen parcial", minTasks: 1, minExams: 1, expectDate: "September 14" },
  { locale: "es-MX", type: "Plan de materias", text: "MATH 240 Álgebra MWF 9:00 Salón 9\nEntrega del proyecto: 14 de septiembre\nExamen parcial 5 de octubre", minTasks: 1, minExams: 1 },
  { locale: "pt-BR", type: "Ementa universitária", text: "FIN 250 Finanças MW 11:00 Business 204\n14 de setembro: trabalho\n21 de setembro: exame", minTasks: 1, minExams: 1 },
  { locale: "pt-PT", type: "Programa da unidade", text: "BIO 220 Biologia TR 10:00 Laboratório 2\n14 de setembro: relatório de laboratório\n5 de outubro: exame final", minTasks: 1, minExams: 1 },
  { locale: "fr-CA", type: "Plan de cours", text: "NURS 320 Soins TR 8:00 Lab 4\n14 septembre: devoir\n28 septembre: examen clinique", minTasks: 1, minExams: 1 },
  { locale: "fr-FR", type: "Syllabus de TD", text: "LIT 205 Littérature MW 14:00 Salle 3\nPrésentation le 14 septembre\nExamen final le 5 octobre", minTasks: 1, minExams: 1 },
  { locale: "de-DE", type: "Seminarplan", text: "ENGR 220 Mechanik MWF 13:00 Hall 3\n14. September: Aufgabe\n5. Oktober: Klausur", minTasks: 1, minExams: 1 },
  { locale: "ja", type: "シラバス", text: "CHEM 311 Chemistry TR 10:00 Science 8\n9月14日: 課題\n10月5日: 試験", minTasks: 1, minExams: 1 },
  { locale: "ko", type: "강의계획서", text: "CS 214 Algorithms MW 14:00 Online\n9월14일: 과제\n10월5일: 시험", minTasks: 1, minExams: 1 },
  { locale: "zh-Hans", type: "课程大纲", text: "MATH 240 Algebra MWF 9:00 Room 9\n9月14日: 作业\n10月5日: 考试", minTasks: 1, minExams: 1 },
  { locale: "zh-Hant", type: "課程大綱", text: "ECON 201 Economics MW 10:00 Room 7\n9月14日: 作業\n10月5日: 考試", minTasks: 1, minExams: 1 },
  { locale: "hi", type: "सिलेबस", text: "PSYC 210 Psychology TR 12:00 Room 5\n१४ सितंबर: असाइनमेंट\n५ अक्टूबर: परीक्षा", minTasks: 1, minExams: 1 },
  { locale: "ar-SA", type: "خطة مقرر", text: "ECON 201 Economics MW 10:00 Room 7\n14 سبتمبر: واجب\n5 أكتوبر: اختبار", minTasks: 1, minExams: 1 },
  { locale: "Mixed OCR", type: "Messy scan", text: "BIO 101 Biology\nWEEK 1  14/09   problem set due\nPage 2 BIO 101\n21/09 quiz\nWatermark Draft\n05/10 final exam", minTasks: 1, minExams: 2 },
  { locale: "Mixed language", type: "Columns", text: "FIN 250 Finance | 2026-09-14 | projeto due | 2026-10-05 | examen", minTasks: 1, minExams: 1 },
  { locale: "OCR cleanup", type: "Line breaks and spaced dates", text: "BIO 101 Biology\nLab Re-\nport due 9 / 14\nFinal Exam 10 / 5", minTasks: 1, minExams: 1 },
];

const failures: string[] = [];
const rows = cases.map((item) => {
  const batch = analyzeSyllabus(item.text, emptyData());
  const serviceParse = parseSyllabusText(item.text, `${item.locale}-${item.type}.txt`);
  const tasks = batch.candidates.filter((candidate) => candidate.kind === "task");
  const exams = batch.candidates.filter((candidate) => candidate.kind === "exam");
  const classes = batch.candidates.filter((candidate) => candidate.kind === "class");
  const serviceTasks = serviceParse.assignments.filter((assignment) => assignment.kind !== "exam");
  const serviceExams = serviceParse.assignments.filter((assignment) => assignment.kind === "exam");
  const lowConfidence = batch.candidates.filter((candidate) => candidate.confidence < 0.75);
  const normalized = normalizeGlobalAcademicText(item.text);
  const data = {
    ...defaultData,
    classes: classes.length ? classes.map((candidate) => candidate.payload as any) : defaultData.classes,
    tasks: tasks.map((candidate) => candidate.payload as TaskItem),
    exams: exams.map((candidate) => candidate.payload as ExamItem),
    notes: [],
    studyBlocks: [],
  };
  const snapshot = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, snapshot);

  if (tasks.length < item.minTasks) failures.push(`${item.locale}: expected ${item.minTasks} tasks, got ${tasks.length}`);
  if (exams.length < item.minExams) failures.push(`${item.locale}: expected ${item.minExams} exams, got ${exams.length}`);
  if (serviceTasks.length < item.minTasks) failures.push(`${item.locale}: service parser expected ${item.minTasks} tasks, got ${serviceTasks.length}`);
  if (serviceExams.length < item.minExams) failures.push(`${item.locale}: service parser expected ${item.minExams} exams, got ${serviceExams.length}`);
  if (item.expectDate && !normalized.includes(item.expectDate)) failures.push(`${item.locale}: expected normalized text to include ${item.expectDate}`);
  if (!batch.candidates.every((candidate) => candidate.confidence >= 0 && candidate.confidence <= 1)) failures.push(`${item.locale}: confidence outside range`);
  if (snapshot.semesterHealth.overallScore < 0 || snapshot.semesterHealth.overallScore > 100) failures.push(`${item.locale}: invalid health score`);
  if (!narrative.widgetLabel) failures.push(`${item.locale}: missing narrative`);

  return `| ${item.locale} | ${item.type} | ${classes.length} | ${tasks.length}/${serviceTasks.length} | ${exams.length}/${serviceExams.length} | ${lowConfidence.length} | ${narrative.widgetLabel} | ${failures.some((failure) => failure.startsWith(`${item.locale}:`)) ? "FAIL" : "PASS"} |`;
});

const score = Math.round(((cases.length - failures.length) / cases.length) * 10);

const report = `# Global Syllabus OCR Locale Stress Report

## Scope
Global syllabus stress test covering every localized App Store app-title locale, multilingual dates, international academic keywords, mixed OCR, tables, repeated headers, and date-order ambiguity.

## Result
${failures.length ? "FAIL" : "PASS"}

Score: ${score}/10

| Locale | Scenario | Classes | Assignments app/service | Exams app/service | Review Rows | Narrative | Status |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${rows.join("\n")}

## Guardrails
- Global terms are normalized into the existing deterministic parser.
- Ambiguous rows keep confidence metadata for review.
- Sparse or messy inputs must degrade to review instead of silently creating high-certainty coursework.

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(process.cwd(), "BUILD_44_GLOBAL_SYLLABUS_REPORT.md"), report);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build 44 global syllabus stress passed");
