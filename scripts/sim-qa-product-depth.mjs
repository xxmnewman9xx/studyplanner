#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || "qa-screenshots/apple-school-product-depth/after";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const device = process.env.STUDYPLANNER_SIMULATOR || "booted";
const tabs = ["today", "notes", "courses", "import", "more", "upgrade"];
const names = ["01-today", "02-notes", "03-classes", "04-scan", "05-widgets", "06-paywall"];
function run(cmd, args, opts = {}) { return execFileSync(cmd, args, { stdio: opts.capture ? "pipe" : "inherit", encoding: "utf8" }); }
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
mkdirSync(outDir, { recursive: true });
const dataRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "data"], { capture: true }).trim();
for (let i = 0; i < tabs.length; i += 1) {
  writeFileSync(join(dataRoot, "Documents", "studyplanner-capture-tab.json"), JSON.stringify({ tab: tabs[i] }));
  run("xcrun", ["simctl", "terminate", device, bundleId], { capture: true });
  run("xcrun", ["simctl", "launch", device, bundleId]);
  sleep(1600);
  run("xcrun", ["simctl", "io", device, "screenshot", join(outDir, `${names[i]}.png`)]);
}
console.log(`Captured ${tabs.length} deterministic capture-file screenshots in ${outDir}`);
