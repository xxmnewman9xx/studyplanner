import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppData, ClassItem, ImportBatch, ImportCandidate } from "../src/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

async function main() {
// src/storage imports react-native only to select the persistence adapter. A
// tiny Node-side stub lets this regression exercise the pure applyImport path.
const mutableModule = Module as unknown as { _load: (request: string, parent?: unknown, isMain?: boolean) => unknown };
const originalLoad = mutableModule._load;
mutableModule._load = function loadForImportSafety(request, parent, isMain) {
  if (request === "react-native") return { Platform: { OS: "web" } };
  return originalLoad.call(this, request, parent, isMain);
};

const { applyImport } = await import("../src/storage");
const { defaultData } = await import("../src/seed");
mutableModule._load = originalLoad;

function emptyPlanner(classes: ClassItem[] = []): AppData {
  return {
    ...structuredClone(defaultData),
    prefs: { ...structuredClone(defaultData.prefs), premium: true, osLive: false },
    classes,
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    feedbackEvents: [],
  };
}

const realClass: ClassItem = {
  id: "class_real",
  code: "BIO 101",
  name: "Biology",
  professor: "Dr. Rivera",
  room: "Science 201",
  days: "Mon Wed",
  time: "10:00 AM",
  next: "Monday",
  health: 0.8,
  grade: "Not set",
  color: "#0A84FF",
  color2: "#30D158",
  icon: "book-open",
};

function batch(candidates: ImportCandidate[]): ImportBatch {
  return {
    id: `import_${candidates.map((candidate) => candidate.id).join("_")}`,
    sourceName: "Safety regression",
    sourceText: "Reviewed import",
    createdAt: new Date().toISOString(),
    status: "review",
    candidates,
  };
}

function taskCandidate(id: string, classId: string, title = "Lab report", time = "11:59 PM"): ImportCandidate {
  return {
    id,
    kind: "task",
    title,
    meta: "Assignment",
    classId,
    confidence: 0.95,
    approved: true,
    payload: {
      id: `task_${id}`,
      title,
      classId,
      type: "Assignment",
      dueOffset: 2,
      dueDate: "2026-09-18",
      time,
      estimateMinutes: 60,
      done: false,
      urgent: false,
      source: "Safety regression",
      subtasks: [],
    },
  };
}

const orphanResult = applyImport(emptyPlanner(), batch([taskCandidate("orphan", "missing_class")]));
assert.equal(orphanResult.classes.length, 0, "an orphan must never fabricate a fallback class");
assert.equal(orphanResult.tasks.length, 0, "an orphan task must be skipped");
assert.equal(orphanResult.imports[0]?.candidates[0]?.approved, false, "skipped orphan must be truthful in import history");

const classCandidate: ImportCandidate = {
  id: "real_class_candidate",
  kind: "class",
  title: "BIO 101 · Biology",
  meta: "Mon Wed · 10:00 AM",
  classId: realClass.id,
  confidence: 0.98,
  approved: true,
  payload: realClass,
};
const orderedResult = applyImport(emptyPlanner(), batch([
  taskCandidate("before_class", realClass.id),
  classCandidate,
]));
assert.deepEqual(orderedResult.classes.map((item) => item.id), [realClass.id], "approved class should be resolved before dependent rows regardless of order");
assert.equal(orderedResult.tasks[0]?.classId, realClass.id, "task should retain its explicit real owner");

const blankCandidates: ImportCandidate[] = [
  { ...classCandidate, id: "blank_class", title: "   ", payload: { ...realClass, id: "blank_class_id", code: "CHEM 1" } },
  taskCandidate("blank_task", realClass.id, "   "),
  { ...taskCandidate("blank_payload_task", realClass.id, "Visible candidate"), payload: { ...taskCandidate("x", realClass.id).payload, title: " " } },
  {
    id: "blank_exam",
    kind: "exam",
    title: " ",
    meta: "Exam",
    classId: realClass.id,
    confidence: 0.9,
    approved: true,
    payload: { id: "exam_blank", classId: realClass.id, title: " ", dueOffset: 3, dueDate: "2026-09-19", time: "9:00 AM", room: "Science 201", topics: [] },
  },
  {
    id: "blank_note",
    kind: "note",
    title: " ",
    meta: "Note",
    classId: realClass.id,
    confidence: 0.9,
    approved: true,
    payload: { id: "note_blank", classId: realClass.id, title: " ", createdAt: new Date().toISOString(), summary: "Summary", terms: [], suggestedTasks: [], pages: 1, sourceText: "Text" },
  },
];
const blankResult = applyImport(emptyPlanner([realClass]), batch(blankCandidates));
assert.equal(blankResult.classes.length, 1, "blank class title must not apply");
assert.equal(blankResult.tasks.length, 0, "blank task titles must not apply");
assert.equal(blankResult.exams.length, 0, "blank exam title must not apply");
assert.equal(blankResult.notes.length, 0, "blank note title must not apply");

const malformedTimeResult = applyImport(emptyPlanner([realClass]), batch([
  taskCandidate("bad_time", realClass.id, "Bad clock", "25:99"),
]));
assert.equal(malformedTimeResult.tasks.length, 0, "malformed imported time must not reach planner storage");

const appSource = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const appStart = appSource.indexOf("export default function App()");
const appEnd = appSource.indexOf("type ScreenProps", appStart);
const appRuntimeSource = appSource.slice(appStart, appEnd);
assert(appRuntimeSource.includes("pendingImportSaveError") && appRuntimeSource.includes("pendingImportSaveAttempt"), "pending import recovery failures must have visible retry state");
assert(appRuntimeSource.includes("if (active) setPendingImportSaveError(true)"), "pending import recovery write failures must be surfaced");
assert(appRuntimeSource.includes("active = false") && appRuntimeSource.includes("pendingImportSaveAttempt"), "pending import recovery writes must ignore stale completions and support retry");
assert(appRuntimeSource.includes("setPendingImportSaveAttempt((attempt) => attempt + 1)"), "the visible retry control must retry pending import persistence");

const bannerStart = appSource.indexOf("function PendingImportResumeBanner(");
const bannerEnd = appSource.indexOf("function SemesterKickoff(", bannerStart);
const bannerSource = appSource.slice(bannerStart, bannerEnd);
assert(!bannerSource.includes("saved on this device"), "pending import banner must not claim durable storage before a write is confirmed");
assert(bannerSource.includes("Nothing changes your semester until you apply them"), "pending import banner must state the true review boundary");

const reviewStart = appSource.indexOf("function ReviewImport(");
const reviewEnd = appSource.indexOf("function ApplySuccess(", reviewStart);
assert(reviewStart >= 0 && reviewEnd > reviewStart, "ReviewImport source must be discoverable");
const reviewSource = appSource.slice(reviewStart, reviewEnd);
const preserveIndex = reviewSource.indexOf("await savePendingImport(reviewBatch)");
const persistIndex = reviewSource.indexOf("await persistPlannerSnapshot(appliedSnapshot)");
const clearIndex = reviewSource.indexOf("setCurrentImport(null)");
assert(preserveIndex >= 0 && persistIndex > preserveIndex && clearIndex > persistIndex, "recovery must be preserved until the exact applied snapshot persists");
assert(reviewSource.includes('nav.replaceTop("success")'), "success must replace the review route");
assert(reviewSource.includes("requiresResolvedTitle") && reviewSource.includes("requiresResolvedTime") && reviewSource.includes("requiresResolvedOwner"), "review must block blank titles, malformed times, and orphan rows");
assert(reviewSource.includes('textFor("class.days", "Days")'), "Days must have a truthful field/accessibility label");
assert(reviewSource.includes('textFor("class.time", "Time")'), "Time must have a truthful field/accessibility label");
assert(reviewSource.includes('textFor("class.professor", "Professor")'), "Professor must have a truthful field/accessibility label");

const pasteStart = appSource.indexOf("function PasteImport(");
const pasteEnd = appSource.indexOf("function ReviewImport(", pasteStart);
const pasteSource = appSource.slice(pasteStart, pasteEnd);
assert(pasteSource.includes("analysisTimer.current = setTimeout"), "paste analysis timer must be owned by the screen");
assert(pasteSource.includes("clearTimeout(analysisTimer.current)"), "paste analysis timer must be canceled on unmount/back");

const pendingSource = fs.readFileSync(path.join(root, "src/pendingImport.ts"), "utf8");
assert(pendingSource.includes('throw new Error("Pending import is too large to preserve safely.")'), "oversized recovery writes must fail closed");

console.log("Import transaction safety regression passed (recovery ordering, title/time/owner guards, no fallback class, timer cleanup, truthful labels). ");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
