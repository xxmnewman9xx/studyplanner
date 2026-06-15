#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "test-results/build57-final-sweep/raw-screenshots";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const waitMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 5000);
const captureFile = "studyplanner-capture-tab.json";

const shots = [
  ["01-onboarding-hero", { emptyPlanner: true, route: "onboarding" }, "Fresh onboarding hero."],
  ["02-onboarding-syllabus-scan-promise", { emptyPlanner: true, route: "importOptions" }, "Onboarding-to-import handoff showing syllabus preview value."],
  ["03-add-syllabus-scanner-entry", { emptyPlanner: true, tab: "import" }, "Add syllabus entry point with upload, camera, photo, and paste."],
  ["04-camera-scanner-entry", { emptyPlanner: true, tab: "import", screen: "camera" }, "Simulator cannot provide live camera feed; this captures the real camera entry point."],
  ["05-pdf-paste-import-options", { emptyPlanner: true, tab: "import", screen: "pdfPaste" }, "PDF and paste import options visible in the real scanner UI."],
  ["06-import-review-editable-rows", { qaState: "build57", screen: "review_edit" }, "Review rows before apply."],
  ["07-reconciliation-state", { qaState: "build57", screen: "review_edit" }, "Likely existing rows and update/duplicate choices."],
  ["08-dashboard-today", { qaState: "build57", route: "today" }, "Active semester dashboard."],
  ["09-manage-semester", { qaState: "build57", tab: "courses" }, "Manage Semester overview."],
  ["10-class-detail", { qaState: "build57", screen: "classDetail" }, "Class ownership detail."],
  ["11-assignment-detail", { qaState: "build57", screen: "taskDetail" }, "Assignment ownership detail."],
  ["12-assessment-detail", { qaState: "build57", screen: "assessmentDetail" }, "Assessment ownership detail."],
  ["13-recurrence-scope-prompt", { qaState: "build57", prompt: "recurrenceScope" }, "Recurring work scope prompt."],
  ["14-widget-studio-preview", { qaState: "build57", tab: "more" }, "Widget preview surface."],
  ["15-paywall-restore-legal-support", { emptyPlanner: true, route: "paywall" }, "Paywall with restore, terms, privacy, support visible."],
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
const notes = [];

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
  notes.push(`- ${name}: ${note}`);
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify({
  generatedAt,
  outputRoot: outDir,
  bundleId,
  device,
  screenshotCount: manifest.length,
  entries: manifest,
}, null, 2) + "\n");

writeFileSync(join(outDir, "screenshot-notes.md"), `# Build 57 Final Sweep Screenshot Notes\n\n${notes.join("\n")}\n\n## Rejected Screenshots\n\nNone. Camera capture is represented by the real in-app camera entry point because iPhone Simulator does not provide a live physical camera feed.\n`);

console.log(`Captured ${manifest.length} Build 57 final sweep screenshots in ${outDir}`);
