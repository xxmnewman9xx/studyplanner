import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as ts from "typescript";
import { analyzeNotes, analyzeSyllabus, buildStudyPlan } from "../src/ai";
import { buildDashboardSnapshot, buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import type { AppData, ClassItem, ExamItem, NoteItem, TaskItem } from "../src/types";
import { defaultData } from "./fixture-data";

const APP_PATH = "App.tsx";
const AUDIT_PATH = "qa/back-to-school-2026/top-down-100x-audit.json";
const appSource = readFileSync(APP_PATH, "utf8");
const sourceFile = ts.createSourceFile(APP_PATH, appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const failures: string[] = [];

function functionSection(name: string, nextName?: string) {
  const start = appSource.indexOf(`function ${name}(`);
  const end = nextName ? appSource.indexOf(`\nfunction ${nextName}(`, start) : appSource.length;
  return start >= 0 && end > start ? appSource.slice(start, end) : "";
}

const actionComponents = new Set([
  "Button",
  "Pressable",
  "ScannerActionButton",
  "ScannerCompactButton",
  "ScannerCaptureTile",
]);

type ControlRecord = {
  component: string;
  owner: string;
  line: number;
  label: string;
  hasOnPress: boolean;
};

const controls: ControlRecord[] = [];
const screenFunctions = new Set<string>();
const routes: string[] = [];

function attribute(node: ts.JsxAttributes, name: string) {
  return node.properties.find((property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === name);
}

function attributeText(node: ts.JsxAttributes, name: string) {
  const value = attribute(node, name)?.initializer;
  if (!value) return "";
  if (ts.isStringLiteral(value)) return value.text;
  return value.getText(sourceFile).replace(/\s+/g, " ").slice(0, 180);
}

function visit(node: ts.Node, owner = "module") {
  let currentOwner = owner;
  if (ts.isFunctionDeclaration(node) && node.name) {
    currentOwner = node.name.text;
    if (/^[A-Z]/.test(currentOwner)) screenFunctions.add(currentOwner);
  }
  if (ts.isTypeAliasDeclaration(node) && node.name.text === "Route" && ts.isUnionTypeNode(node.type)) {
    for (const type of node.type.types) {
      if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) routes.push(type.literal.text);
    }
  }
  if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
    const component = node.tagName.getText(sourceFile);
    if (actionComponents.has(component)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      controls.push({
        component,
        owner: currentOwner,
        line: position.line + 1,
        label: attributeText(node.attributes, "label") || attributeText(node.attributes, "accessibilityLabel"),
        hasOnPress: Boolean(attribute(node.attributes, "onPress")),
      });
    }
  }
  ts.forEachChild(node, (child) => visit(child, currentOwner));
}

visit(sourceFile);

const handlerlessControls = controls.filter((control) => !control.hasOnPress);
if (handlerlessControls.length) {
  failures.push(`${handlerlessControls.length} actionable JSX controls have no onPress prop`);
}
if (routes.length < 20) failures.push(`route inventory unexpectedly small: ${routes.length}`);
if (screenFunctions.size < 25) failures.push(`screen/component inventory unexpectedly small: ${screenFunctions.size}`);
if (controls.length < 100) failures.push(`action control inventory unexpectedly small: ${controls.length}`);

const pushOnlyScreens = [
  ["Tasks", "TaskDetail"],
  ["Notes", "NoteDetail"],
  ["WidgetsScreen", "Profile"],
  ["HomePreview", "LockPreview"],
  ["LockPreview", undefined],
] as const;
for (const [screen, nextScreen] of pushOnlyScreens) {
  if (!functionSection(screen, nextScreen).includes("<BackHeader")) failures.push(`${screen} has no explicit stack escape`);
}
if (!functionSection("ReviewImport", "ApplySuccess").includes('nav.tab("scan")')) failures.push("Review empty state does not escape to the Scan tab");
if (!appSource.includes("const showPendingImportBanner = entitlementUnlocks(data, entitlementStatus)")) failures.push("pending-import resume control can appear while locked");

function emptyPremiumData(): AppData {
  return {
    ...JSON.parse(JSON.stringify(defaultData)) as AppData,
    prefs: {
      ...defaultData.prefs,
      name: "Stress Student",
      firstName: "Stress",
      onboardingComplete: true,
      premium: true,
      osLive: true,
      premiumProductId: "stress.test",
      premiumCheckedAt: new Date().toISOString(),
    },
    classes: [],
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    feedbackEvents: [],
  };
}

const cycles = Array.from({ length: 100 }, (_, index) => {
  const cycle = index + 1;
  const classNumber = 100 + index;
  const taskDay = String((index % 27) + 1).padStart(2, "0");
  const examDay = String((index % 24) + 1).padStart(2, "0");
  const syllabus = [
    `BIO ${classNumber} Applied Biology meets Monday and Wednesday at 10:00 AM in Science ${200 + index}.`,
    `Lab report ${cycle} due 2026-09-${taskDay} at 11:59 PM.`,
    `Midterm exam ${cycle} on 2026-10-${examDay} at 9:00 AM.`,
    "Students must review every extracted deadline before it is added to the semester plan.",
  ].join(" ");
  const batch = analyzeSyllabus(syllabus, emptyPremiumData());
  const kinds = new Set(batch.candidates.filter((candidate) => candidate.approved).map((candidate) => candidate.kind));
  const classes = batch.candidates.filter((candidate) => candidate.approved && candidate.kind === "class").map((candidate) => candidate.payload as ClassItem);
  const tasks = batch.candidates.filter((candidate) => candidate.approved && candidate.kind === "task").map((candidate) => candidate.payload as TaskItem);
  const exams = batch.candidates.filter((candidate) => candidate.approved && candidate.kind === "exam").map((candidate) => candidate.payload as ExamItem);
  const dataWithoutPlan = { ...emptyPremiumData(), classes, tasks, exams };
  const data = { ...dataWithoutPlan, studyBlocks: buildStudyPlan(dataWithoutPlan) };
  const notesBatch = analyzeNotes(
    `BIO ${classNumber} lecture notes. Photosynthesis converts light energy into chemical energy. Key terms include chlorophyll, thylakoid, ATP, and the Calvin cycle. Review the diagram before midterm ${cycle}.`,
    data,
  );
  const notes = notesBatch.candidates.filter((candidate) => candidate.approved && candidate.kind === "note").map((candidate) => candidate.payload as NoteItem);
  const withNotes = { ...data, notes };
  const dashboard = buildDashboardSnapshot(withNotes);
  const semester = buildSemesterSnapshot(withNotes);
  const narrative = buildSemesterNarrative(withNotes, semester);
  const cycleFailures: string[] = [];

  if (!["class", "task", "exam"].every((kind) => kinds.has(kind as "class" | "task" | "exam"))) cycleFailures.push("missing syllabus candidate kind");
  if (!notes.length) cycleFailures.push("notes extraction produced no note");
  if (!Number.isFinite(semester.semesterHealth.overallScore) || semester.semesterHealth.overallScore < 0 || semester.semesterHealth.overallScore > 100) cycleFailures.push("invalid semester health");
  if (!dashboard.greeting || !narrative.primaryDriver || !narrative.nextMoveLabel) cycleFailures.push("missing dashboard or narrative output");
  if (!data.studyBlocks.length) cycleFailures.push("study plan produced no blocks");
  if (cycleFailures.length) failures.push(`cycle ${cycle}: ${cycleFailures.join(", ")}`);

  return {
    cycle,
    candidates: batch.candidates.length,
    classes: classes.length,
    tasks: tasks.length,
    exams: exams.length,
    notes: notes.length,
    studyBlocks: data.studyBlocks.length,
    health: semester.semesterHealth.overallScore,
    status: cycleFailures.length ? "failed" : "passed",
    failures: cycleFailures,
  };
});

const audit = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "ready",
  stress: {
    requestedCycles: 100,
    completedCycles: cycles.length,
    passedCycles: cycles.filter((cycle) => cycle.status === "passed").length,
    failedCycles: cycles.filter((cycle) => cycle.status === "failed").length,
    pipeline: "syllabus parse -> review candidates -> study plan -> notes parse -> dashboard -> semester health -> narrative",
    cycles,
  },
  uiInventory: {
    routes,
    routeCount: routes.length,
    screenAndComponentCount: screenFunctions.size,
    screenAndComponents: [...screenFunctions].sort(),
    actionableControlCount: controls.length,
    handlerlessControlCount: handlerlessControls.length,
    handlerlessControls,
    controls,
  },
  failures,
};

mkdirSync(dirname(AUDIT_PATH), { recursive: true });
writeFileSync(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);

if (failures.length) {
  console.error(`Top-down 100x stress failed (${failures.length} findings).`);
  failures.slice(0, 30).forEach((failure) => console.error(`- ${failure}`));
  console.error(`Audit written to ${AUDIT_PATH}`);
  process.exit(1);
}

console.log(`Top-down 100x stress passed: ${cycles.length}/100 cycles, ${routes.length} routes, ${controls.length} controls inventoried.`);
console.log(`Audit written to ${AUDIT_PATH}`);
