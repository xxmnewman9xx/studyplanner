#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const STORE_RUNTIME_LOCALES = Object.freeze([
  "ar",
  "de",
  "en-US",
  "es",
  "fr",
  "hi",
  "ja",
  "ko",
  "pt-BR",
  "pt-PT",
  "zh-Hans",
  "zh-Hant",
]);

const TARGETS = Object.freeze([
  { key: "scan-light", route: "scan", appearance: "light" },
  { key: "review-light", route: "review", appearance: "light" },
  { key: "today-light", route: "today", appearance: "light" },
  { key: "plan-dark", route: "plan", appearance: "dark" },
  { key: "profile-light", route: "profile", appearance: "light" },
  { key: "profile-dark", route: "profile", appearance: "dark" },
]);

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Usage: node scripts/capture-build82-store-media.mjs [output-root] [--dry-run]");
  console.log("Set STUDYPLANNER_CANDIDATE_BUNDLE to the exact installed candidate main.jsbundle.");
  process.exit(0);
}
const unknownOptions = args.filter((argument) => argument.startsWith("--") && argument !== "--dry-run");
if (unknownOptions.length) throw new Error(`unknown option(s): ${unknownOptions.join(", ")}`);
const positionalArgs = args.filter((argument) => !argument.startsWith("--"));
if (positionalArgs.length > 1) throw new Error("provide at most one output root");

const dryRun = args.includes("--dry-run");
const outputRoot = resolve(positionalArgs[0] || "/tmp/studyplanner-build82-store-media-raw");
const requestedDevice = process.env.STUDYPLANNER_SIMULATOR || "booted";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const waitMs = positiveNumber("STUDYPLANNER_SIM_CAPTURE_WAIT_MS", 650, true);
const timeoutMs = positiveNumber("STUDYPLANNER_SIM_CAPTURE_READY_TIMEOUT_MS", 20_000, false);
const locales = listFilter("STUDYPLANNER_CAPTURE_LOCALES", STORE_RUNTIME_LOCALES);
const targetKeys = listFilter("STUDYPLANNER_CAPTURE_TARGETS", TARGETS.map(({ key }) => key));
validateAllowed("locales", locales, STORE_RUNTIME_LOCALES);
validateAllowed("targets", targetKeys, TARGETS.map(({ key }) => key));
const targets = targetKeys.map((key) => TARGETS.find((target) => target.key === key));
if (!locales.length || !targets.length) throw new Error("capture requires at least one locale and target");

const plan = {
  schemaVersion: 1,
  provenanceClass: "simulator-composition-input-do-not-upload",
  releaseEligible: false,
  requestedDevice,
  locales,
  targets,
  tupleCount: locales.length * targets.length,
  outputRoot,
};
if (dryRun) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

const candidateBundlePath = process.env.STUDYPLANNER_CANDIDATE_BUNDLE
  ? resolve(process.env.STUDYPLANNER_CANDIDATE_BUNDLE)
  : null;
if (!candidateBundlePath || !existsSync(candidateBundlePath)) {
  throw new Error("STUDYPLANNER_CANDIDATE_BUNDLE must identify the exact installed candidate main.jsbundle");
}

const appConfigPath = resolve("app.json");
const appConfigSha256 = sha256File(appConfigPath);
const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8")).expo;
if (appConfig?.version !== "2.0.8" || String(appConfig?.ios?.buildNumber) !== "82") {
  throw new Error("store media capture is locked to StudyPlanner 2.0.8 (82)");
}
if (appConfig.ios.bundleIdentifier !== bundleId) {
  throw new Error(`app.json bundle identifier ${appConfig.ios.bundleIdentifier} does not match ${bundleId}`);
}

const sourceCommit = run("git", ["rev-parse", "HEAD"]).trim();
const sourceStateSha256 = sha256Text(run("git", ["status", "--porcelain=v1", "--untracked-files=all"]));
const deviceIdentity = resolveSimulatorIdentity(requestedDevice);
const device = deviceIdentity.udid;
const dataRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "data"]).trim();
const appRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "app"]).trim();
const captureFile = join(dataRoot, "Documents", "studyplanner-capture-tab.json");
const acknowledgementFile = join(dataRoot, "Documents", "studyplanner-capture-ready.json");
const installedBundlePath = join(appRoot, "main.jsbundle");
const installedInfoPlist = join(appRoot, "Info.plist");
const installedBundleSha256 = sha256File(installedBundlePath);
const candidateBundleSha256 = sha256File(candidateBundlePath);
if (installedBundleSha256 !== candidateBundleSha256) {
  throw new Error(`installed bundle ${installedBundleSha256} does not match candidate ${candidateBundleSha256}`);
}

const installedVersion = plistValue(installedInfoPlist, "CFBundleShortVersionString");
const installedBuild = plistValue(installedInfoPlist, "CFBundleVersion");
const installedBundleId = plistValue(installedInfoPlist, "CFBundleIdentifier");
if (installedVersion !== appConfig.version || installedBuild !== String(appConfig.ios.buildNumber) || installedBundleId !== bundleId) {
  throw new Error(`installed app ${installedBundleId} ${installedVersion} (${installedBuild}) does not match app.json`);
}

mkdirSync(outputRoot, { recursive: true });
runOptional("xcrun", ["simctl", "status_bar", device, "override", "--time", "9:41", "--wifiBars", "3", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100"]);
runOptional("xcrun", ["simctl", "ui", device, "content_size", "large"]);

const entries = [];
for (const locale of locales) {
  for (const target of targets) {
    run("xcrun", ["simctl", "ui", device, "appearance", target.appearance]);
    const captureNonce = randomUUID();
    const routeConfig = {
      route: target.route,
      qaState: "build57",
      locale,
      appearanceMode: target.appearance,
      captureNonce,
      captureTarget: target.key,
    };
    rmSync(acknowledgementFile, { force: true });
    writeFileSync(captureFile, `${JSON.stringify(routeConfig)}\n`);
    runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
    const launchStartedAt = Date.now();
    run("xcrun", ["simctl", "launch", device, bundleId]);
    const acknowledgement = waitForAcknowledgement({
      path: acknowledgementFile,
      captureNonce,
      target,
      locale,
      launchStartedAt,
      timeoutMs,
      stabilityMs: waitMs,
    });
    const screenshotPath = join(outputRoot, locale, `${target.key}.png`);
    mkdirSync(dirname(screenshotPath), { recursive: true });
    run("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
    const dimensions = imageDimensions(screenshotPath);
    const sidecar = {
      schemaVersion: 1,
      provenanceClass: "simulator-composition-input-do-not-upload",
      releaseEligible: false,
      uploadAuthorized: false,
      sourceCommit,
      sourceStateSha256,
      appConfigSha256,
      appVersion: appConfig.version,
      buildNumber: String(appConfig.ios.buildNumber),
      bundleId,
      candidateBundlePath,
      candidateBundleSha256,
      installedBundleSha256,
      installedBundleVerified: true,
      installedNativeShellVersion: installedVersion,
      installedNativeShellBuild: installedBuild,
      device: deviceIdentity,
      locale,
      resolvedLocale: acknowledgement.resolvedLocale,
      rtl: acknowledgement.rtl,
      target: target.key,
      routeConfig,
      requestedAppearance: target.appearance,
      resolvedAppearance: acknowledgement.resolvedAppearance,
      readinessEvidence: "nonce-bound-app-acknowledgement-v5",
      captureAcknowledgement: acknowledgement,
      screenshotPath,
      screenshotSha256: sha256File(screenshotPath),
      screenshotBytes: statSync(screenshotPath).size,
      width: dimensions.width,
      height: dimensions.height,
      capturedAt: new Date().toISOString(),
    };
    writeFileSync(screenshotPath.replace(/\.png$/, ".json"), `${JSON.stringify(sidecar, null, 2)}\n`);
    entries.push(sidecar);
    console.log(`captured ${entries.length}/${locales.length * targets.length} ${locale}/${target.key}`);
  }
}

assertUnchanged("source commit", sourceCommit, run("git", ["rev-parse", "HEAD"]).trim());
assertUnchanged("source state", sourceStateSha256, sha256Text(run("git", ["status", "--porcelain=v1", "--untracked-files=all"])));
assertUnchanged("app config", appConfigSha256, sha256File(appConfigPath));
assertUnchanged("candidate bundle", candidateBundleSha256, sha256File(candidateBundlePath));
assertUnchanged("installed bundle", installedBundleSha256, sha256File(installedBundlePath));

const manifest = {
  ...plan,
  generatedAt: new Date().toISOString(),
  sourceCommit,
  sourceStateSha256,
  appVersion: appConfig.version,
  buildNumber: String(appConfig.ios.buildNumber),
  bundleId,
  candidateBundlePath,
  candidateBundleSha256,
  installedBundleSha256,
  installedBundleVerified: true,
  device: deviceIdentity,
  screenshotCount: entries.length,
  uploadAuthorized: false,
  entries,
};
writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`captured ${entries.length} exact-source simulator composition inputs in ${outputRoot}`);

function listFilter(name, fallback) {
  const raw = process.env[name];
  if (!raw) return [...fallback];
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function validateAllowed(label, requested, allowed) {
  const invalid = requested.filter((value) => !allowed.includes(value));
  if (invalid.length) throw new Error(`unsupported ${label}: ${invalid.join(", ")}`);
}

function positiveNumber(name, fallback, allowZero) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < (allowZero ? 0 : Number.EPSILON)) {
    throw new Error(`${name} must be ${allowZero ? "non-negative" : "positive"}`);
  }
  return value;
}

function waitForAcknowledgement({ path, captureNonce, target, locale, launchStartedAt, timeoutMs, stabilityMs }) {
  const deadline = Date.now() + timeoutMs;
  let stableSince = null;
  let lastProblem = "acknowledgement file was not created";
  while (Date.now() <= deadline) {
    if (existsSync(path)) {
      try {
        const acknowledgement = JSON.parse(readFileSync(path, "utf8"));
        lastProblem = acknowledgementProblem(acknowledgement, { captureNonce, target, locale, launchStartedAt });
        if (!lastProblem) {
          stableSince ??= Date.now();
          if (Date.now() - stableSince >= stabilityMs) return acknowledgement;
        } else {
          stableSince = null;
        }
      } catch (error) {
        stableSince = null;
        lastProblem = `acknowledgement JSON was not readable: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    sleep(100);
  }
  throw new Error(`${target.key}: capture-ready acknowledgement timed out (${lastProblem})`);
}

function acknowledgementProblem(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "acknowledgement must be an object";
  if (value.schemaVersion !== 5) return `schemaVersion ${value.schemaVersion} is not 5`;
  if (value.captureNonce !== expected.captureNonce) return "capture nonce does not match";
  if (value.captureTarget !== expected.target.key) return "capture target does not match";
  if (value.mountedRoute !== expected.target.route) return `mounted route ${value.mountedRoute} does not match ${expected.target.route}`;
  if (value.resolvedAppearance !== expected.target.appearance) return "resolved app appearance does not match";
  if (value.resolvedSystemAppearance !== expected.target.appearance) return "resolved system appearance does not match";
  if (value.requestedLocale !== expected.locale || value.resolvedLocale !== expected.locale) return "requested/resolved locale does not match";
  if (value.rtl !== expected.locale.startsWith("ar")) return "resolved RTL state does not match";
  if (value.requestedScrollY !== 0 || value.scrollApplied !== true) return "top route was not acknowledged at zero scroll";
  const acknowledgedAt = Date.parse(value.acknowledgedAt);
  if (!Number.isFinite(acknowledgedAt) || acknowledgedAt < expected.launchStartedAt - 1_000 || acknowledgedAt > Date.now() + 5_000) {
    return "acknowledgement timestamp is outside the launch window";
  }
  return "";
}

function resolveSimulatorIdentity(requested) {
  const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "-j"]));
  const devices = Object.entries(payload.devices || {}).flatMap(([runtime, values]) =>
    values.map((device) => ({ ...device, runtime })),
  );
  const selected = requested === "booted"
    ? devices.find((device) => device.state === "Booted")
    : devices.find((device) => device.udid === requested);
  if (!selected) throw new Error(`simulator ${requested} is not available`);
  return { udid: selected.udid, name: selected.name, runtime: selected.runtime, state: selected.state };
}

function imageDimensions(path) {
  const output = run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path]);
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!width || !height) throw new Error(`unable to read dimensions for ${path}`);
  return { width, height };
}

function plistValue(path, key) {
  return run("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, path]).trim();
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function run(command, commandArgs) {
  return execFileSync(command, commandArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function runOptional(command, commandArgs) {
  try {
    run(command, commandArgs);
  } catch {
    // Simulator state may already match the requested value.
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function assertUnchanged(label, expected, actual) {
  if (expected !== actual) throw new Error(`${label} changed during capture`);
}
