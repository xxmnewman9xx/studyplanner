#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "qa-screenshots/apple-school-product-depth/after";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const devClientUrl = process.env.STUDYPLANNER_DEV_CLIENT_URL || "";
const captureLocale = process.env.STUDYPLANNER_CAPTURE_LOCALE || "";
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
  { key: "capture-type", route: { tab: "import", importSourceMode: "paste" }, name: "12a-capture-type-it-in" },
  { key: "capture-parsing", route: { tab: "import", screen: "processing" }, name: "12b-capture-parsing" },
  { key: "capture-failed", route: { tab: "import", screen: "failed" }, name: "12c-capture-failed-retry" },
  { key: "capture-upload", route: { tab: "import", importSourceMode: "file" }, name: "12d-capture-upload" },
  { key: "review", route: { tab: "import", screen: "review_edit" }, name: "13-review" },
  { key: "calendar", route: { tab: "plan" }, name: "14-calendar" },
  { key: "calendar-clean", route: { tab: "plan", workloadState: "clean" }, name: "15-calendar-clean" },
  { key: "calendar-urgent", route: { tab: "plan", workloadState: "urgent" }, name: "16-calendar-urgent" },
  { key: "classes", route: { tab: "courses" }, name: "17-classes" },
  { key: "focus", route: { tab: "focus" }, name: "18-focus" },
  { key: "widgets", route: { tab: "more" }, name: "19-widgets-ocean" },
  { key: "widgets-graphite", route: { tab: "more", appTheme: "graphite", widgetPalette: "graphite", widgetBackground: "dark" }, name: "20-widgets-graphite" },
  { key: "widgets-forest", route: { tab: "more", appTheme: "mint", widgetPalette: "forest", widgetBackground: "glass" }, name: "21-widgets-forest" },
  { key: "widgets-week", route: { tab: "more", widgetType: "week", widgetSize: "medium", widgetPalette: "graphite", widgetBackground: "dark", widgetDataMode: "this_week" }, name: "22-widgets-week" },
  { key: "widgets-class-progress", route: { tab: "more", widgetType: "class_focus", widgetSize: "small", widgetPalette: "forest", widgetBackground: "glass", widgetDataMode: "single_class" }, name: "23-widgets-class-progress" },
  { key: "widget-studio-pick-widget", route: { tab: "more", widgetType: "due_next", widgetSize: "small", widgetPalette: "paper", widgetBackground: "light", widgetDataMode: "all_classes" }, name: "30-widget-studio-pick-widget" },
  { key: "widget-studio-pick-data", route: { tab: "more", widgetType: "today", widgetSize: "medium", widgetPalette: "ocean", widgetBackground: "glass", widgetDataMode: "urgent_only" }, name: "31-widget-studio-pick-data" },
  { key: "widget-studio-pick-style", route: { tab: "more", widgetType: "week", widgetSize: "medium", widgetPalette: "contrast", widgetBackground: "dark", widgetDataMode: "this_week" }, name: "32-widget-studio-pick-style" },
  { key: "widget-studio-saved", route: { tab: "more", widgetType: "class_focus", widgetSize: "small", widgetPalette: "forest", widgetBackground: "glass", widgetDataMode: "single_class" }, name: "33-widget-studio-saved" },
  { key: "widget-dark-ocean-today", route: { tab: "more", themeMode: "dark", appTheme: "ocean", widgetType: "today", widgetSize: "medium", widgetPalette: "ocean", widgetBackground: "glass", widgetDataMode: "urgent_only" }, name: "34-widget-dark-ocean-today" },
  { key: "widget-dark-graphite-week", route: { tab: "more", themeMode: "dark", appTheme: "graphite", widgetType: "week", widgetSize: "medium", widgetPalette: "graphite", widgetBackground: "dark", widgetDataMode: "this_week" }, name: "35-widget-dark-graphite-week" },
  { key: "widget-dark-forest-class", route: { tab: "more", themeMode: "dark", appTheme: "mint", widgetType: "class_focus", widgetSize: "small", widgetPalette: "forest", widgetBackground: "glass", widgetDataMode: "single_class" }, name: "36-widget-dark-forest-class" },
  { key: "widget-dark-paper-due-next", route: { tab: "more", themeMode: "dark", appTheme: "minimal", widgetType: "due_next", widgetSize: "small", widgetPalette: "paper", widgetBackground: "light", widgetDataMode: "all_classes" }, name: "37-widget-dark-paper-due-next" },
  { key: "paywall", route: { tab: "subscribe" }, name: "24-paywall" },
  { key: "grades", route: { tab: "grades" }, name: "25-grades" }
];
const requestedTargets = (process.env.STUDYPLANNER_SIM_CAPTURE_TABS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const targets = requestedTargets.length
  ? captureTargets.filter((target) => requestedTargets.includes(target.key) || requestedTargets.includes(target.route.tab))
  : captureTargets;
const finalWidgetMode = outDir.includes("final_widgets");
const manifestEntries = [];
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
const gitCommit = gitShortSha();
const timestamp = new Date().toISOString();
for (const { route, name, key } of targets) {
  writeFileSync(
    join(dataRoot, "Documents", "studyplanner-capture-tab.json"),
    JSON.stringify(captureLocale ? { ...route, locale: captureLocale } : route)
  );
  runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
  if (devClientUrl) {
    run("xcrun", ["simctl", "openurl", device, devClientUrl]);
  } else {
    run("xcrun", ["simctl", "launch", device, bundleId]);
  }
  sleep(launchWaitMs);
  const screenshotPath = screenshotPathForTarget(route, name);
  mkdirSync(dirname(screenshotPath), { recursive: true });
  run("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
  const sidecar = buildSidecar({ route, key, name, screenshotPath, gitCommit, timestamp });
  writeFileSync(screenshotPath.replace(/\.png$/, ".json"), JSON.stringify(sidecar, null, 2) + "\n");
  manifestEntries.push(sidecar);
}
writeFileSync(join(outDir, "manifest.json"), JSON.stringify({
  generatedAt: timestamp,
  outputRoot: outDir,
  device,
  bundleId,
  locale: captureLocale || "runtime",
  screenshotCount: manifestEntries.length,
  entries: manifestEntries
}, null, 2) + "\n");
console.log(`Captured ${targets.length} deterministic capture-file screenshots in ${outDir}`);

function screenshotPathForTarget(route, name) {
  if (!finalWidgetMode) return join(outDir, `${name}.png`);
  const locale = sanitizePathPart(captureLocale || route.locale || "en-US");
  const safeDevice = sanitizePathPart(device === "booted" ? "booted-simulator" : device);
  const appearance = sanitizePathPart(route.themeMode || "light");
  const theme = sanitizePathPart(route.appTheme || route.widgetPalette || "default");
  const widgetType = sanitizePathPart(route.widgetType || route.tab || name);
  const size = sanitizePathPart(route.widgetSize || "screen");
  const customization = sanitizePathPart(name);
  return join(outDir, locale, appearance, safeDevice, theme, widgetType, size, `${customization}.png`);
}

function buildSidecar({ route, key, name, screenshotPath, gitCommit, timestamp }) {
  const stats = statSync(screenshotPath);
  return {
    locale: captureLocale || route.locale || "runtime",
    device,
    appearance: route.themeMode || "light",
    theme: route.appTheme || route.widgetPalette || "default",
    widgetType: route.widgetType || route.tab || key,
    size: route.widgetSize || "screen",
    background: route.widgetBackground || "default",
    palette: route.widgetPalette || "default",
    font: route.widgetFont || "system",
    layout: route.widgetLayout || "default",
    classFocus: route.classFocusCourseId || "all",
    dataState: route.workloadState || route.screen || route.widgetDataMode || "normal",
    route,
    source: "actual-app-simulator-preview",
    screenshotPath,
    bytes: stats.size,
    sha256: sha256File(screenshotPath),
    noCropResult: "pending-layout-manifest-validation",
    scoreResult: "pending-scorecard",
    gitCommit,
    timestamp
  };
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function gitShortSha() {
  try {
    return run("git", ["rev-parse", "--short", "HEAD"], { capture: true }).trim();
  } catch {
    return "unknown";
  }
}

function sanitizePathPart(value) {
  return String(value || "unknown").replace(/[^a-z0-9._-]+/gi, "-");
}

function dirname(filePath) {
  const parts = filePath.split("/");
  parts.pop();
  return parts.join("/") || ".";
}
