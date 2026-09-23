#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DEVICE = process.env.STUDYPLANNER_SIMULATOR || "booted";
const BUNDLE_ID = "com.mattnewman.studyplanner";
const APP_PATH = resolve(
  process.env.STUDYPLANNER_CAPTURE_APP ||
    "/tmp/StudyPlannerCaptureSim/Build/Products/Release-iphonesimulator/StudyplannerSyllabusAI.app",
);
const OUTPUT_PATH = resolve(
  process.env.STUDYPLANNER_RUNTIME_AUDIT ||
    "qa/back-to-school-2026/top-down-runtime-100x-audit.json",
);
const SCREENSHOT_PATH = "/tmp/studyplanner-top-down-runtime.png";
const WAIT_MS = Number(process.env.STUDYPLANNER_RUNTIME_WAIT_MS || 900);
const RENDER_TIMEOUT_MS = Number(process.env.STUDYPLANNER_RUNTIME_RENDER_TIMEOUT_MS || 6000);
const RENDER_POLL_MS = Number(process.env.STUDYPLANNER_RUNTIME_RENDER_POLL_MS || 250);
const CAPTURE_ROOT = process.env.STUDYPLANNER_RUNTIME_CAPTURE_ROOT
  ? resolve(process.env.STUDYPLANNER_RUNTIME_CAPTURE_ROOT)
  : null;
const CAPTURE_FIXTURES = new Set(
  (process.env.STUDYPLANNER_RUNTIME_CAPTURE_FIXTURES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const PYTHON =
  "/Users/mattnewman/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const routeCases = [
  { label: "onboarding", config: { route: "onboarding", onboardingIndex: 0 } },
  { label: "lockedDashboard", config: { route: "lockedDashboard" } },
  { label: "paywall", config: { route: "paywall" } },
  { label: "terms", config: { route: "terms" } },
  { label: "privacy", config: { route: "privacy" } },
  { label: "today", config: { route: "today" } },
  { label: "classes", config: { route: "classes" } },
  { label: "scan", config: { route: "scan" } },
  { label: "cameraScanner", config: { screen: "scannerReady" } },
  { label: "plan", config: { route: "plan" } },
  { label: "tasks", config: { route: "tasks" } },
  { label: "notes", config: { route: "notes" } },
  { label: "profile", config: { route: "profile" } },
  { label: "classDetail", config: { screen: "classDetail" } },
  { label: "taskDetail", config: { screen: "taskDetail" } },
  { label: "assessmentDetail", config: { screen: "assessmentDetail" } },
  { label: "noteDetail", config: { screen: "noteDetail" } },
  { label: "paste", config: { route: "paste" } },
  { label: "review", config: { route: "review" } },
  { label: "success", config: { route: "success" } },
  { label: "widgets", config: { route: "widgets" } },
  { label: "reminders", config: { route: "reminders" } },
  { label: "studySession", config: { route: "studySession" } },
  { label: "homePreview", config: { route: "homePreview" } },
  { label: "semesterKickoff", config: { route: "semesterKickoff" } },
];

const fixtureStates = [
  { label: "empty-locked", config: { emptyPlanner: true } },
  { label: "build57-active", config: { qaState: "build57" } },
  { label: "build66-active", config: { qaState: "build66" } },
  { label: "exam-heavy-active", config: { qaState: "examHeavy" } },
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function screenshotStats(path) {
  const source = `from PIL import Image, ImageFilter, ImageStat
import json, sys
image = Image.open(sys.argv[1]).convert("RGB")
original_width, original_height = image.size
image = image.crop((int(original_width * 0.04), int(original_height * 0.07), int(original_width * 0.96), int(original_height * 0.93)))
image.thumbnail((96, 192))
stat = ImageStat.Stat(image)
pixels = list(image.get_flattened_data())
nonwhite = sum(1 for pixel in pixels if min(pixel) < 248) / max(1, len(pixels))
gray = image.convert("L")
edges = gray.filter(ImageFilter.FIND_EDGES)
edge_pixels = edges.load()
inner_width = max(1, edges.width - 2)
bands = []
for band in range(8):
    y0 = max(1, band * edges.height // 8)
    y1 = min(edges.height - 1, (band + 1) * edges.height // 8)
    count = max(1, (y1 - y0) * inner_width)
    bands.append(sum(edge_pixels[x, y] > 30 for y in range(y0, y1) for x in range(1, edges.width - 1)) / count)
inner_edge_ratio = sum(bands) / len(bands)
print(json.dumps({"width": original_width, "height": original_height, "variance": sum(stat.var) / 3, "nonwhiteRatio": nonwhite, "contentEntropy": gray.entropy(), "contentEdgeRatio": inner_edge_ratio, "activeVerticalBands": sum(value > 0.01 for value in bands)}))`;
  return JSON.parse(run(PYTHON, ["-c", source, path]));
}

function processAlive(pid) {
  const result = spawnSync("ps", ["-p", String(pid), "-o", "state="], { encoding: "utf8" });
  return result.status === 0 && Boolean(result.stdout.trim());
}

function launchCase(device, configPath, config) {
  writeFileSync(configPath, `${JSON.stringify({ ...config, locale: "en-US" })}\n`);
  const launched = run("xcrun", [
    "simctl",
    "launch",
    "--terminate-running-process",
    device,
    BUNDLE_ID,
  ]);
  const pid = Number(launched.match(/:\s*(\d+)$/)?.[1]);
  sleep(WAIT_MS);
  const renderStartedAt = Date.now();
  let attempts = 0;
  let pixels;
  let rendered = false;
  do {
    attempts += 1;
    run("xcrun", ["simctl", "io", device, "screenshot", SCREENSHOT_PATH]);
    pixels = screenshotStats(SCREENSHOT_PATH);
    rendered =
      pixels.variance > 12 &&
      pixels.nonwhiteRatio > 0.01 &&
      pixels.contentEntropy > 1.5 &&
      pixels.contentEdgeRatio > 0.03 &&
      pixels.activeVerticalBands >= 3;
    if (!rendered && Date.now() - renderStartedAt < RENDER_TIMEOUT_MS) sleep(RENDER_POLL_MS);
  } while (!rendered && Date.now() - renderStartedAt < RENDER_TIMEOUT_MS);
  const alive = Number.isFinite(pid) && processAlive(pid);
  return { pid, alive, rendered, pixels, renderWaitMs: Date.now() - renderStartedAt, attempts };
}

function main() {
  if (routeCases.length * fixtureStates.length !== 100) {
    throw new Error(`Runtime matrix must contain exactly 100 cases; found ${routeCases.length * fixtureStates.length}.`);
  }

  spawnSync("xcrun", ["simctl", "uninstall", DEVICE, BUNDLE_ID], { encoding: "utf8" });
  run("xcrun", ["simctl", "install", DEVICE, APP_PATH]);
  const dataContainer = run("xcrun", ["simctl", "get_app_container", DEVICE, BUNDLE_ID, "data"]);
  const configPath = join(dataContainer, "Documents", "studyplanner-capture-tab.json");
  const cases = [];

  for (const fixture of fixtureStates) {
    for (const route of routeCases) {
      const startedAt = Date.now();
      const failures = [];
      let result = null;
      try {
        result = launchCase(DEVICE, configPath, { ...fixture.config, ...route.config });
        if (!result.alive) failures.push("app process exited before verification");
        if (!result.rendered) failures.push("screen did not produce a nonblank render");
        if (CAPTURE_ROOT && (!CAPTURE_FIXTURES.size || CAPTURE_FIXTURES.has(fixture.label))) {
          mkdirSync(CAPTURE_ROOT, { recursive: true });
          const capturePath = join(
            CAPTURE_ROOT,
            `${String(cases.length + 1).padStart(3, "0")}-${fixture.label}-${route.label}.png`,
          );
          copyFileSync(SCREENSHOT_PATH, capturePath);
          result.capturePath = capturePath;
        }
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
      cases.push({
        cycle: cases.length + 1,
        route: route.label,
        fixture: fixture.label,
        durationMs: Date.now() - startedAt,
        status: failures.length ? "failed" : "passed",
        failures,
        result,
      });
    }
  }

  const failures = cases.filter((item) => item.status === "failed");
  const payload = {
    generatedAt: new Date().toISOString(),
    status: failures.length ? "failed" : "ready",
    build: { version: "2.0.8", number: "80", configuration: "Release", captureQa: true },
    matrix: {
      requestedCycles: 100,
      completedCycles: cases.length,
      passedCycles: cases.length - failures.length,
      failedCycles: failures.length,
      routeCount: routeCases.length,
      fixtureCount: fixtureStates.length,
      routes: routeCases.map((item) => item.label),
      fixtures: fixtureStates.map((item) => item.label),
    },
    cases,
    failures,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Top-down runtime stress ${failures.length ? "failed" : "passed"}: ${cases.length - failures.length}/${cases.length} cycles across ${routeCases.length} routes and ${fixtureStates.length} fixture states.`,
  );
  console.log(`Audit written to ${OUTPUT_PATH}`);
  if (failures.length) process.exitCode = 1;
}

main();
