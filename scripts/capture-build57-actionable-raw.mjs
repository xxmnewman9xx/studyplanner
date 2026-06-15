#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "test-results/build57-actionable-raw/raw-screenshots";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const waitMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 5000);
const captureFile = "studyplanner-capture-tab.json";

const shots = [
  ["01-matt-dashboard-grade-forecast", { qaState: "build57", route: "today" }, "Matt dashboard with forecast and next actions."],
  ["02-matt-mock-syllabus-review", { qaState: "build57", screen: "review_edit" }, "Mock syllabus import review with editable/reconcilable rows."],
  ["03-matt-scan-notes-entry", { qaState: "build57", tab: "import" }, "Scan notes and syllabus capture entry points."],
  ["04-matt-notes-list", { qaState: "build57", route: "notes" }, "Notes activity from mock syllabus classes."],
  ["05-matt-note-detail", { qaState: "build57", screen: "noteDetail" }, "Detailed note with concepts and suggested tasks."],
  ["06-matt-assignment-edit", { qaState: "build57", screen: "taskEdit" }, "Edit assignment with date, class, priority, and recurrence ownership."],
  ["07-matt-assignment-detail", { qaState: "build57", screen: "taskDetail" }, "Assignment detail with next move and recurrence context."],
  ["08-matt-assessment-edit", { qaState: "build57", screen: "assessmentEdit" }, "Assessment edit parity for date, class, effort, notes, and priority."],
  ["09-matt-class-detail", { qaState: "build57", screen: "classDetail" }, "Class detail with schedule, notes, assignments, assessments, and recent notes."],
  ["10-matt-manage-semester", { qaState: "build57", tab: "courses" }, "Manage Semester overview for Matt's classes."],
  ["11-matt-recurrence-scope", { qaState: "build57", prompt: "recurrenceScope" }, "Recurring assignment scope prompt."],
  ["12-matt-widget-preview", { qaState: "build57", tab: "more" }, "Widget preview using Matt's semester data."],
];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" });
}

function runOptional(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8" });
  } catch {
    // The app may already be closed between deterministic launches.
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

mkdirSync(outDir, { recursive: true });
runOptional("xcrun", ["simctl", "status_bar", device, "override", "--time", "9:41", "--wifiBars", "3", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100"]);
const dataRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "data"], { capture: true }).trim();
const documentsDir = join(dataRoot, "Documents");
mkdirSync(documentsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const manifest = [];

for (const [name, config, note] of shots) {
  writeFileSync(join(documentsDir, captureFile), JSON.stringify(config, null, 2));
  runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
  run("xcrun", ["simctl", "launch", device, bundleId]);
  sleep(waitMs);
  const screenshotPath = join(outDir, `${name}.png`);
  run("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
  const entry = {
    name,
    note,
    config,
    screenshotPath,
    bytes: statSync(screenshotPath).size,
    sha256: sha256File(screenshotPath),
    bundleId,
    device,
    source: "actual-iphone-simulator-app",
    generatedAt,
  };
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(entry, null, 2) + "\n");
  manifest.push(entry);
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify({
  generatedAt,
  outputRoot: outDir,
  bundleId,
  device,
  screenshotCount: manifest.length,
  entries: manifest,
}, null, 2) + "\n");

console.log(`Captured ${manifest.length} actionable Build 57 screenshots in ${outDir}`);
