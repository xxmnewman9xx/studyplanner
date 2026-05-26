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
  { key: "onboarding", route: { onboardingIndex: 0 }, name: "00-onboarding-scan" },
  { key: "onboarding-review", route: { onboardingIndex: 1 }, name: "01-onboarding-review" },
  { key: "onboarding-calendar", route: { onboardingIndex: 2 }, name: "02-onboarding-calendar" },
  { key: "onboarding-today", route: { onboardingIndex: 3 }, name: "03-onboarding-today" },
  { key: "onboarding-classes", route: { onboardingIndex: 4 }, name: "04-onboarding-classes" },
  { key: "onboarding-focus", route: { onboardingIndex: 5 }, name: "05-onboarding-focus" },
  { key: "onboarding-widgets", route: { onboardingIndex: 6 }, name: "06-onboarding-widgets" },
  { key: "today", route: { tab: "today", themeMode: "light" }, name: "10-today-light" },
  { key: "today-dark", route: { tab: "today", themeMode: "dark" }, name: "11-today-dark" },
  { key: "scan", route: { tab: "import" }, name: "12-scan" },
  { key: "review", route: { tab: "import", screen: "review_edit" }, name: "13-review" },
  { key: "calendar", route: { tab: "plan" }, name: "14-calendar" },
  { key: "calendar-clean", route: { tab: "plan", workloadState: "clean" }, name: "15-calendar-clean" },
  { key: "calendar-urgent", route: { tab: "plan", workloadState: "urgent" }, name: "16-calendar-urgent" },
  { key: "classes", route: { tab: "courses" }, name: "17-classes" },
  { key: "focus", route: { tab: "focus" }, name: "18-focus" },
  { key: "widgets", route: { tab: "more" }, name: "19-widgets-ocean" },
  { key: "widgets-graphite", route: { tab: "more", appTheme: "graphite", widgetPalette: "graphite", widgetBackground: "dark" }, name: "20-widgets-graphite" },
  { key: "widgets-forest", route: { tab: "more", appTheme: "mint", widgetPalette: "forest", widgetBackground: "glass" }, name: "21-widgets-forest" },
  { key: "widgets-week", route: { tab: "more", widgetType: "week", widgetSize: "large", widgetPalette: "graphite", widgetBackground: "glass" }, name: "22-widgets-week" },
  { key: "widgets-progress", route: { tab: "more", widgetType: "streak", widgetSize: "small", widgetPalette: "forest", widgetBackground: "glass" }, name: "23-widgets-progress" },
  { key: "plus", route: { tab: "upgrade" }, name: "24-plus" },
  { key: "grades", route: { tab: "grades" }, name: "25-grades" }
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
