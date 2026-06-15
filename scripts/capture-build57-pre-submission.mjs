#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "test-results/build57-pre-submission";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const waitMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 5000);
const captureFile = "studyplanner-capture-tab.json";

const shots = [
  ["01-fresh-onboarding-start", { emptyPlanner: true, route: "onboarding" }],
  ["02-dashboard-active-semester", { qaState: "build57", route: "today" }],
  ["03-add-syllabus-entry-point", { emptyPlanner: true, tab: "import" }],
  ["04-import-review-reconciliation", { qaState: "build57", screen: "review_edit" }],
  ["05-manage-semester", { qaState: "build57", tab: "courses" }],
  ["06-class-detail-edit-state", { qaState: "build57", screen: "classEdit" }],
  ["07-assignment-detail-edit-state", { qaState: "build57", screen: "taskEdit" }],
  ["08-assessment-detail-edit-state", { qaState: "build57", screen: "assessmentEdit" }],
  ["09-recurrence-scope-prompt", { qaState: "build57", prompt: "recurrenceScope" }],
  ["10-archive-confirmation", { qaState: "build57", prompt: "archiveClass" }],
  ["11-widget-preview-surface", { qaState: "build57", tab: "more" }],
  ["12-paywall-restore-terms-privacy-support", { emptyPlanner: true, route: "paywall" }],
];

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" });
}

function runOptional(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8" });
  } catch {
    // App may not be running between screenshots.
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
const manifest = [];
const generatedAt = new Date().toISOString();

for (const [name, config] of shots) {
  writeFileSync(join(documentsDir, captureFile), JSON.stringify(config, null, 2));
  runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
  run("xcrun", ["simctl", "launch", device, bundleId]);
  sleep(waitMs);
  const screenshotPath = join(outDir, `${name}.png`);
  run("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
  const entry = {
    name,
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

console.log(`Captured ${manifest.length} Build 57 pre-submission screenshots in ${outDir}`);
