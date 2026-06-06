import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeSyllabus, normalizeGlobalAcademicText } from "../src/ai";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import { defaultData } from "./fixture-data";
import { AppData, ExamItem, TaskItem } from "../src/types";

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
  { locale: "English", type: "STEM", text: "BIO 101 Biology MWF 10:30 Richards 201\nSept 14: Problem Set 1 due\nSept 21: Quiz 1\nOct 5: Midterm Exam", minTasks: 1, minExams: 2 },
  { locale: "Spanish", type: "Humanities", text: "HIST 210 Historia TR 9:00 Room 12\n14 de septiembre: ensayo due\n21 de septiembre: examen parcial", minTasks: 1, minExams: 1, expectDate: "September 14" },
  { locale: "Portuguese", type: "Business", text: "FIN 250 Financas MW 11:00 Business 204\n14 de setembro: trabalho due\n21 de setembro: exame", minTasks: 1, minExams: 1 },
  { locale: "French", type: "Medicine", text: "NURS 320 Soins TR 8:00 Lab 4\n14 septembre: devoir due\n28 septembre: examen clinique", minTasks: 1, minExams: 1 },
  { locale: "German", type: "Engineering", text: "ENGR 220 Mechanik MWF 13:00 Hall 3\n14. September: aufgabe due\n5. Oktober: klausur", minTasks: 1, minExams: 1 },
  { locale: "Japanese", type: "Online learning", text: "CHEM 311 Chemistry TR 10:00 Science 8\n9月14日: 課題 due\n10月5日: 試験", minTasks: 1, minExams: 1 },
  { locale: "Korean", type: "Graduate course", text: "CS 214 Algorithms MW 14:00 Online\n9월14일: 과제 due\n10월5일: 시험", minTasks: 1, minExams: 1 },
  { locale: "Chinese Simplified", type: "High school", text: "MATH 240 Algebra MWF 9:00 Room 9\n9月14日: 作业 due\n10月5日: 考试", minTasks: 1, minExams: 1 },
  { locale: "Hindi", type: "Community college", text: "PSYC 210 Psychology TR 12:00 Room 5\n१४ सितंबर: असाइनमेंट due\n५ अक्टूबर: परीक्षा", minTasks: 1, minExams: 1 },
  { locale: "Arabic", type: "International university", text: "ECON 201 Economics MW 10:00 Room 7\n14 سبتمبر: واجب due\n5 أكتوبر: اختبار", minTasks: 1, minExams: 1 },
  { locale: "Mixed OCR", type: "Messy scan", text: "BIO 101 Biology\nWEEK 1  14/09   problem set due\nPage 2 BIO 101\n21/09 quiz\nWatermark Draft\n05/10 final exam", minTasks: 1, minExams: 2 },
  { locale: "Mixed language", type: "Columns", text: "FIN 250 Finance | 2026-09-14 | projeto due | 2026-10-05 | examen", minTasks: 1, minExams: 1 },
];

const failures: string[] = [];
const rows = cases.map((item) => {
  const batch = analyzeSyllabus(item.text, emptyData());
  const tasks = batch.candidates.filter((candidate) => candidate.kind === "task");
  const exams = batch.candidates.filter((candidate) => candidate.kind === "exam");
  const classes = batch.candidates.filter((candidate) => candidate.kind === "class");
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
  if (item.expectDate && !normalized.includes(item.expectDate)) failures.push(`${item.locale}: expected normalized text to include ${item.expectDate}`);
  if (!batch.candidates.every((candidate) => candidate.confidence >= 0 && candidate.confidence <= 1)) failures.push(`${item.locale}: confidence outside range`);
  if (snapshot.semesterHealth.overallScore < 0 || snapshot.semesterHealth.overallScore > 100) failures.push(`${item.locale}: invalid health score`);
  if (!narrative.widgetLabel) failures.push(`${item.locale}: missing narrative`);

  return `| ${item.locale} | ${item.type} | ${classes.length} | ${tasks.length} | ${exams.length} | ${lowConfidence.length} | ${narrative.widgetLabel} | ${failures.some((failure) => failure.startsWith(`${item.locale}:`)) ? "FAIL" : "PASS"} |`;
});

const report = `# Build 44 Global Syllabus Report

## Scope
Global syllabus stress test covering multilingual dates, international academic keywords, mixed OCR, tables, repeated headers, and date-order ambiguity.

## Result
${failures.length ? "FAIL" : "PASS"}

| Locale | Scenario | Classes | Assignments | Exams | Review Rows | Narrative | Status |
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
