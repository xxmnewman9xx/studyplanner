#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "qa-screenshots/apple-school-product-depth/after";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const devClientUrl = process.env.STUDYPLANNER_DEV_CLIENT_URL || "";
const launchWaitMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 14000);
const captureTargets = [
  { key: "onboarding", route: { onboardingIndex: 0 }, name: "00-onboarding" },
  { key: "today", route: { tab: "today" }, name: "01-today" },
  { key: "scan", route: { tab: "import" }, name: "02-scan" },
  { key: "review", route: { tab: "import", screen: "review_edit" }, name: "03-review" },
  { key: "plan", route: { tab: "plan" }, name: "04-plan" },
  { key: "widgets", route: { tab: "more" }, name: "05-widgets" },
  { key: "plus", route: { tab: "upgrade" }, name: "06-plus" }
];
const requestedTargets = (process.env.STUDYPLANNER_SIM_CAPTURE_TABS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const targets = requestedTargets.length
  ? captureTargets.filter((target) => requestedTargets.includes(target.key) || requestedTargets.includes(target.route.tab))
  : captureTargets;
function run(cmd, args, opts = {}) { return execFileSync(cmd, args, { stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" }); }
function runOptional(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8" });
  } catch {
    // The app may already be closed between deterministic screenshot launches.
  }
}
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
mkdirSync(outDir, { recursive: true });
const dataRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "data"], { capture: true }).trim();
for (const { route, name } of targets) {
  writeFileSync(join(dataRoot, "Documents", "studyplanner-capture-tab.json"), JSON.stringify(route));
  runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
  if (devClientUrl) {
    run("xcrun", ["simctl", "openurl", device, devClientUrl]);
  } else {
    run("xcrun", ["simctl", "launch", device, bundleId]);
  }
  sleep(launchWaitMs);
  run("xcrun", ["simctl", "io", device, "screenshot", join(outDir, `${name}.png`)]);
}
console.log(`Captured ${targets.length} deterministic capture-file screenshots in ${outDir}`);
