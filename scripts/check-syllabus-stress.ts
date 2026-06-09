/// <reference types="node" />
import { writeFileSync } from "node:fs";
import { analyzeSyllabus } from "../src/ai";
import { buildSemesterSnapshot } from "../src/intelligence";
import { defaultData } from "./fixture-data";
import { extractPdfTextFromBase64 } from "../src/pdfText";

type Case = {
  name: string;
  text: string;
  minTasks?: number;
  minExams?: number;
  minClasses?: number;
  noPolicyTasks?: boolean;
};

const cases: Case[] = [
  { name: "Standard table syllabus", text: "BIO 210 Human Biology\nWeek | Date | Topic | Assignment | Due\n1 | September 14 | Cells | Lab Report due September 21\n2 | September 28 | Genetics | Quiz 1", minTasks: 1, minClasses: 1 },
  { name: "Bullet list syllabus", text: "BIO 210\n- Jan 18: Read Chapter 2 due\n- Jan 25: Quiz 1", minTasks: 1, minExams: 1 },
  { name: "Paragraph syllabus", text: "ENG 201 Writing Seminar. The first essay is due February 12 and the midterm will be held March 4.", minTasks: 1, minExams: 1, minClasses: 1 },
  { name: "Multiple dates per line", text: "Feb 1: Homework 1 due; Feb 8: Quiz 1; Feb 15: Exam 1", minTasks: 1, minExams: 2 },
  { name: "Date ranges", text: "Mar 3-7: Spring Break, no class\nMar 10: Reflection due", minTasks: 1, noPolicyTasks: true },
  { name: "Ambiguous year", text: "Due 9/14: Problem Set 1\nQuiz 1 on 9/21", minTasks: 1, minExams: 1 },
  { name: "Different date styles", text: "September 14: Lab Report due\nSept. 21: Quiz 1\n09-28: Project Milestone due\n14 Sep: Case memo due\nTuesday, September 29: Discussion Post due", minTasks: 3, minExams: 1 },
  { name: "Exam-heavy syllabus", text: "CHEM 311 Organic Chemistry\nMidterm I on September 30\nMidterm II on October 28\nFinal Exam on December 12", minExams: 3 },
  { name: "Assignment-heavy syllabus", text: "Problem Set 1 due 9/14\nLab Report due 9/21\nDiscussion Post due 9/28\nProject Milestone due 10/5\nReflection due 10/12", minTasks: 5 },
  { name: "College STEM syllabus", text: "PHYS 220 Mechanics\nMWF 10:30-11:20 Richards Hall 201\nProblem Set 2 due September 16\nLab Practical on October 2\nMidterm on October 15", minTasks: 1, minExams: 2 },
  { name: "Humanities syllabus", text: "HIST 180 Modern History\nReading Response due September 14\nEssay 1 due October 3\nPresentation on November 8", minTasks: 3 },
  { name: "Business finance syllabus", text: "FIN 301 Accounting for Managers\nCase Memo due 14 Sep\nGroup Project Milestone due October 10\nMidterm Exam on October 21", minTasks: 2, minExams: 1, minClasses: 1 },
  { name: "Nursing science syllabus", text: "NURS 240 Clinical Foundations\nClinical checkoff on September 18\nLab Practical on September 25\nQuiz 2 on October 2", minTasks: 1, minExams: 2, minClasses: 1 },
  { name: "Online course syllabus", text: "Module 1 discussion post due 9/14 11:59 PM\nModule 2 quiz due 9/21 11:59 PM\nAsynchronous final project due 12/1", minTasks: 3 },
  { name: "Bad OCR text", text: "B10 21O humam bio lab rep0rt due 9/14 quizl on 9/21 pr0blem set due 9 / 28", minTasks: 1 },
  { name: "PDF extraction artifacts", text: "BIO 210 Syllabus Page 1\nLab Re-\nport due September 21\nBIO 210 Syllabus Page 2\nQuiz 1 on September 28\n2", minTasks: 1, minExams: 1 },
  { name: "Time-bearing dates", text: "Essay 2 due Friday 11:59 PM\nFinance Case due September 14 5:00 PM", minTasks: 2 },
  { name: "Grading-weight section", text: "Grading: Midterm 30%, Final 35%, Homework 20%, Participation 15%.\nHomework 1 due September 14\nFinal Exam on December 10", minTasks: 1, minExams: 1, noPolicyTasks: true },
  { name: "Class meeting schedule", text: "MATH 240 Linear Algebra\nMWF 10:30-11:20, Richards Hall 201\nProblem Set 1 due September 14", minTasks: 1, minClasses: 1 },
  { name: "Mixed content", text: "BIO 210 Human Biology\nProfessor Rivera, Science Hall 204. Meets Mon Wed Fri 10:00 AM.\nLate work policy: 10% per day.\nLab Report 1 due June 12, 2026 5:00 PM\nGenetics Problem Set due June 18, 2026 11:59 PM\nMidterm Exam on June 25, 2026 Room Science Hall 204\nOffice hours Tuesday 2:00 PM", minTasks: 2, minExams: 1, minClasses: 1, noPolicyTasks: true },
];

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function pdfFixture(lines: string[]) {
  return `%PDF-1.4
1 0 obj <<>> stream
BT
${lines.map((line) => `(${line}) Tj`).join("\n")}
ET
endstream endobj
%%EOF`;
}

function countedWords(count: number, start = 1) {
  return Array.from({ length: count }, (_, index) => `word${start + index}`).join(" ");
}

const rows = cases.map((item) => {
  const batch = analyzeSyllabus(item.text, defaultData);
  const tasks = batch.candidates.filter((candidate) => candidate.kind === "task" && candidate.title !== "Review imported syllabus");
  const exams = batch.candidates.filter((candidate) => candidate.kind === "exam");
  const classes = batch.candidates.filter((candidate) => candidate.kind === "class");
  const allDated = [...tasks, ...exams].every((candidate) => /^\d{4}-\d{2}-\d{2}$/.test(String((candidate.payload as any).dueDate || "")));
  const keys = new Set([...tasks, ...exams].map((candidate) => `${candidate.kind}-${candidate.title.toLowerCase()}-${(candidate.payload as any).dueDate}`));
  const policies = tasks.filter((candidate) => /policy|participation|attendance|spring break|office hours/i.test(candidate.title));
  const applied = {
    ...defaultData,
    classes: [...defaultData.classes, ...classes.map((candidate) => candidate.payload as any)],
    tasks: [...defaultData.tasks, ...tasks.map((candidate) => candidate.payload as any)],
    exams: [...defaultData.exams, ...exams.map((candidate) => candidate.payload as any)],
    imports: [{ ...batch, status: "applied" as const }],
  };
  const snapshot = buildSemesterSnapshot(applied);
  const pass =
    tasks.length >= (item.minTasks || 0) &&
    exams.length >= (item.minExams || 0) &&
    classes.length >= (item.minClasses || 0) &&
    allDated &&
    keys.size === tasks.length + exams.length &&
    (!item.noPolicyTasks || policies.length === 0) &&
    batch.status === "review" &&
    batch.candidates.every((candidate) => typeof candidate.confidence === "number") &&
    snapshot.semesterHealth.overallScore >= 0;
  return { ...item, pass, tasks: tasks.length, exams: exams.length, classes: classes.length, allDated, duplicateFree: keys.size === tasks.length + exams.length, policies: policies.map((candidate) => candidate.title) };
});

const fakePdf = `%PDF-1.4
1 0 obj <<>> stream
BT
(BIO 210 Human Biology) Tj
(Professor Rivera meets Monday Wednesday Friday in Science Hall 204) Tj
(Required textbook chapters one through ten are listed in the weekly schedule) Tj
(Lab Report due September 21) Tj
(Genetics Problem Set due September 28) Tj
(Midterm Exam on October 15) Tj
(Final Exam on December 12 in Science Hall 204) Tj
(Office hours are Tuesday afternoon and students should ask questions early) Tj
(Late work loses ten percent each day after the deadline) Tj
ET
endstream endobj
%%EOF`;
const pdf = extractPdfTextFromBase64(Buffer.from(fakePdf, "latin1").toString("base64"));
const weakPdf = extractPdfTextFromBase64(Buffer.from("%PDF-1.4\n1 0 obj <<>> stream\nBT\n(Syllabus) Tj\nET\nendstream endobj\n%%EOF", "latin1").toString("base64"));
const fiftyFourWordPdf = extractPdfTextFromBase64(Buffer.from(pdfFixture([countedWords(14, 1), countedWords(14, 15), countedWords(13, 29), countedWords(13, 42)]), "latin1").toString("base64"));
const fiftyFiveWordPdf = extractPdfTextFromBase64(Buffer.from(pdfFixture([countedWords(14, 1), countedWords(14, 15), countedWords(14, 29), countedWords(13, 43)]), "latin1").toString("base64"));

const failed = rows.filter((row) => !row.pass);
const report = [
  "# Build 42 Syllabus Stress Test Report",
  "",
  `Result: ${failed.length ? "FAIL" : "PASS"}`,
  "",
  "| Format | Result | Classes | Tasks | Exams | Notes |",
  "|---|---:|---:|---:|---:|---|",
  ...rows.map((row) => `| ${row.name} | ${row.pass ? "PASS" : "FAIL"} | ${row.classes} | ${row.tasks} | ${row.exams} | ${row.allDated ? "dates normalized" : "date miss"}${row.duplicateFree ? "" : "; duplicates"}${row.policies.length ? `; policy false positives: ${row.policies.join(", ")}` : ""} |`),
  "",
  "## PDF Extraction Fixture",
  "",
  `Words: ${pdf.wordCount}`,
  `Fallback needed: ${pdf.fallbackNeeded}`,
  `Weak fixture fallback needed: ${weakPdf.fallbackNeeded}`,
  "",
  "## Misses",
  "",
  failed.length ? failed.map((row) => `- ${row.name}: tasks=${row.tasks}, exams=${row.exams}, classes=${row.classes}`).join("\n") : "None.",
  "",
].join("\n");

writeFileSync("BUILD_42_SYLLABUS_STRESS_TEST_REPORT.md", report);

assert(!failed.length, `Syllabus stress failed: ${failed.map((row) => row.name).join(", ")}`);
assert(pdf.wordCount >= 55 && !pdf.fallbackNeeded, "PDF text fixture should extract enough words");
assert(weakPdf.fallbackNeeded, "Weak PDF fixture should require camera or paste fallback");
assert(fiftyFourWordPdf.fallbackNeeded, "54-word PDF fixture should require fallback");
assert(!fiftyFiveWordPdf.fallbackNeeded, "55-word PDF fixture should import without fallback");

console.log("Syllabus stress checks passed", { cases: rows.length, pdfWords: pdf.wordCount });
