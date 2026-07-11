#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { strict as assert } from "node:assert";
import {
  APPEARANCE_MATRIX_SPEC,
  APPEARANCE_MATRIX_SPEC_SHA256,
  APPEARANCE_MATRIX_TARGETS_BY_KEY,
  canonicalRouteConfig,
  expectedMountedRouteForTarget,
  hasExactMembers,
} from "./appearance-matrix-spec.mjs";

const SWEEP_SPEC_ID = `${APPEARANCE_MATRIX_SPEC.id}-dynamic-scroll-sweep-v1`;
const SWEEP_SPEC_SCHEMA_VERSION = 1;
const CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION = 5;
const MAXIMUM_STRIDE_FRACTION = 0.72;
const PLANNED_STRIDE_FRACTION = 0.70;
const MINIMUM_OVERLAP_FRACTION = 0.28;
const SCROLL_TOLERANCE_PX = 2;
const MAXIMUM_APP_CAPTURE_SCROLL_Y = 20_000;
const PROVENANCE_CLASS = "simulator-ui-qa-surrogate-do-not-upload";
const canonicalBaseTargets = APPEARANCE_MATRIX_SPEC.targets.filter((target) => !target.scrollPlan);
const canonicalBaseTargetKeys = canonicalBaseTargets.map((target) => target.key);

const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help")) {
  console.log("Usage: node scripts/sim-qa-scroll-sweep.mjs [output-root] [--dry-run|--self-test]");
  console.log("Dynamically captures complete vertical sweeps of selected canonical base targets.");
  console.log("Filters: STUDYPLANNER_SWEEP_TARGETS, STUDYPLANNER_SWEEP_APPEARANCES, STUDYPLANNER_SWEEP_CONTENT_SIZES, STUDYPLANNER_SWEEP_LOCALES.");
  process.exit(0);
}
const knownOptions = ["--dry-run", "--self-test"];
const unknownOptions = cliArgs.filter((argument) => argument.startsWith("--") && !knownOptions.includes(argument));
if (unknownOptions.length) throw new Error(`unknown option(s): ${unknownOptions.join(", ")}`);
const positionalArgs = cliArgs.filter((argument) => !argument.startsWith("--"));
if (positionalArgs.length > 1) throw new Error("provide at most one output root");
if (cliArgs.includes("--dry-run") && cliArgs.includes("--self-test")) {
  throw new Error("use either --dry-run or --self-test, not both");
}
if (cliArgs.includes("--self-test")) {
  runSelfTests();
  process.exit(0);
}

const outputRoot = resolve(positionalArgs[0] || "/tmp/studyplanner-scroll-sweep");
const requestedDevice = process.env.STUDYPLANNER_SIMULATOR || "booted";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const appearances = listFilter(
  "STUDYPLANNER_SWEEP_APPEARANCES",
  APPEARANCE_MATRIX_SPEC.fullCoverage.appearances,
);
const contentSizes = listFilter(
  "STUDYPLANNER_SWEEP_CONTENT_SIZES",
  APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes,
);
const locales = listFilter(
  "STUDYPLANNER_SWEEP_LOCALES",
  APPEARANCE_MATRIX_SPEC.fullCoverage.locales,
);
const selectedTargetKeys = listFilter("STUDYPLANNER_SWEEP_TARGETS", canonicalBaseTargetKeys);

validateAllowedValues("STUDYPLANNER_SWEEP_APPEARANCES", appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances);
validateAllowedValues("STUDYPLANNER_SWEEP_CONTENT_SIZES", contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes);
validateAllowedValues("STUDYPLANNER_SWEEP_LOCALES", locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
validateBaseTargetSelection(selectedTargetKeys);
for (const locale of locales) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(locale)) {
    throw new Error(`sweep locale is not a safe locale identifier: ${locale}`);
  }
}
const targets = selectedTargetKeys.map((key) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(key));
const coverageMode = hasExactMembers(selectedTargetKeys, canonicalBaseTargetKeys)
  && hasExactMembers(appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances)
  && hasExactMembers(contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes)
  && hasExactMembers(locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales)
  ? "full-base-inventory"
  : "partial-base-inventory";
const expectedSweepGroupCount = targets.length * appearances.length * contentSizes.length * locales.length;

if (cliArgs.includes("--dry-run")) {
  console.log(JSON.stringify({
    sweepSpecId: SWEEP_SPEC_ID,
    sweepSpecSchemaVersion: SWEEP_SPEC_SCHEMA_VERSION,
    matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
    matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
    coverageMode,
    provenanceClass: PROVENANCE_CLASS,
    releaseEligible: false,
    readinessEvidence: "nonce-bound-app-acknowledgement",
    captureAcknowledgementSchemaVersion: CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION,
    sweepStrategy: "top-dynamic-even-stride-exact-end",
    scrollObservationConvention: "raw-minus-top-origin",
    maximumStrideFraction: MAXIMUM_STRIDE_FRACTION,
    plannedStrideFraction: PLANNED_STRIDE_FRACTION,
    minimumOverlapFraction: MINIMUM_OVERLAP_FRACTION,
    canonicalBaseTargetCount: canonicalBaseTargetKeys.length,
    selectedTargetKeys,
    appearances,
    contentSizes,
    locales,
    expectedSweepGroupCount,
    expectedScreenshotCount: "dynamic-after-top-acknowledgement",
  }, null, 2));
  process.exit(0);
}

const waitMs = numericEnvironmentValue("STUDYPLANNER_SIM_CAPTURE_WAIT_MS", 1800, { minimum: 0 });
const readyTimeoutMs = numericEnvironmentValue("STUDYPLANNER_SIM_CAPTURE_READY_TIMEOUT_MS", 20_000, { exclusiveMinimum: 0 });
const candidateBundlePath = process.env.STUDYPLANNER_CANDIDATE_BUNDLE
  ? resolve(process.env.STUDYPLANNER_CANDIDATE_BUNDLE)
  : null;
if (!candidateBundlePath) {
  throw new Error("STUDYPLANNER_CANDIDATE_BUNDLE must identify the exact candidate main.jsbundle installed in the simulator");
}

const appConfigPath = resolve("app.json");
const appConfigSha256 = sha256File(appConfigPath);
const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8")).expo;
if (!appConfig?.version || appConfig.ios?.buildNumber == null || !appConfig.ios?.bundleIdentifier) {
  throw new Error("app.json must define expo.version, expo.ios.buildNumber, and expo.ios.bundleIdentifier");
}
if (appConfig.ios.bundleIdentifier !== bundleId) {
  throw new Error(`app.json bundle identifier ${appConfig.ios.bundleIdentifier} does not match requested ${bundleId}`);
}

const simulatorIdentity = resolveSimulatorIdentity(requestedDevice);
const device = simulatorIdentity.udid;
const dataRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "data"]).trim();
const appRoot = run("xcrun", ["simctl", "get_app_container", device, bundleId, "app"]).trim();
const captureFile = join(dataRoot, "Documents", "studyplanner-capture-tab.json");
const captureAckFile = join(dataRoot, "Documents", "studyplanner-capture-ready.json");
const infoPlistPath = join(appRoot, "Info.plist");
const executableName = plistValue(infoPlistPath, "CFBundleExecutable");
const installedAppVersion = plistValue(infoPlistPath, "CFBundleShortVersionString");
const installedBuild = plistValue(infoPlistPath, "CFBundleVersion");
const installedBundleId = plistValue(infoPlistPath, "CFBundleIdentifier");
if (installedBundleId !== bundleId) {
  throw new Error(`installed bundle identifier ${installedBundleId} does not match requested ${bundleId}`);
}
const installedBundlePath = join(appRoot, "main.jsbundle");
const installedExecutablePath = join(appRoot, executableName);
const injectedBundleSha256 = sha256File(installedBundlePath);
const candidateBundleSha256 = sha256File(candidateBundlePath);
if (injectedBundleSha256 !== candidateBundleSha256) {
  throw new Error(`installed main.jsbundle ${injectedBundleSha256} does not match candidate ${candidateBundleSha256}`);
}
const injectedBundleBytes = statSync(installedBundlePath).size;
const candidateBundleBytes = statSync(candidateBundlePath).size;
if (injectedBundleBytes !== candidateBundleBytes) {
  throw new Error(`installed main.jsbundle byte count ${injectedBundleBytes} does not match candidate ${candidateBundleBytes}`);
}
const installedNativeExecutableSha256 = sha256File(installedExecutablePath);
const sourceCommit = run("git", ["rev-parse", "HEAD"]).trim();
const sourceDiffSha256 = sourceStateSha256();
const entropyToolVersion = run("magick", ["-version"]).split("\n")[0].trim();
const originalAppearance = run("xcrun", ["simctl", "ui", device, "appearance"]).trim();
const originalContentSize = run("xcrun", ["simctl", "ui", device, "content_size"]).trim();
const warning = `Simulator UI QA surrogate using installed native shell ${installedAppVersion} (${installedBuild}) with an injected JavaScript candidate for config ${appConfig.version} (${appConfig.ios?.buildNumber}). Native configuration and module behavior are not candidate-build provenance. Never use these images as App Store release provenance.`;
const evidenceIdentity = {
  provenanceClass: PROVENANCE_CLASS,
  auditKind: "integrity-and-scroll-coverage-only",
  visualQualityAssessment: "not_performed",
  viewportPositionObservation: "app_acknowledgement_v5",
  localeResolutionObservation: "app_acknowledgement_v5",
  captureAcknowledgementSchemaVersion: CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION,
  readinessEvidence: "nonce-bound-app-acknowledgement",
  sweepStrategy: "top-dynamic-even-stride-exact-end",
  scrollObservationConvention: "raw-minus-top-origin",
  sourceOriginEvidence: "matching-top-app-acknowledgement-v5",
  deepCapturePositionSource: "native-scroll-event",
  maximumStrideFraction: MAXIMUM_STRIDE_FRACTION,
  plannedStrideFraction: PLANNED_STRIDE_FRACTION,
  minimumOverlapFraction: MINIMUM_OVERLAP_FRACTION,
  scrollTolerancePx: SCROLL_TOLERANCE_PX,
  releaseEligible: false,
  warning,
  sweepSpecId: SWEEP_SPEC_ID,
  sweepSpecSchemaVersion: SWEEP_SPEC_SCHEMA_VERSION,
  matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
  matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
  matrixSpecSchemaVersion: APPEARANCE_MATRIX_SPEC.schemaVersion,
  coverageMode,
  device,
  requestedDevice,
  deviceIdentity: simulatorIdentity,
  bundleId,
  installedNativeShellVersion: installedAppVersion,
  installedNativeShellBuild: installedBuild,
  installedNativeShellBundleId: installedBundleId,
  installedNativeExecutableName: executableName,
  installedNativeExecutableSha256,
  candidateAppVersion: appConfig.version,
  candidateBuildNumber: appConfig.ios.buildNumber,
  appConfigPath,
  appConfigSha256,
  injectedBundleSha256,
  injectedBundleBytes,
  candidateBundleSha256,
  candidateBundleBytes,
  candidateBundlePath,
  injectedBundleVerified: true,
  sourceCommit,
  sourceDiffSha256,
  entropyToolVersion,
};
const entries = [];
const sweepGroups = [];
const usedCaptureNonces = new Set();
const usedCaptureTargets = new Set();

mkdirSync(outputRoot, { recursive: true });

try {
  for (const contentSize of contentSizes) {
    runInherited("xcrun", ["simctl", "ui", device, "content_size", contentSize]);
    const observedContentSize = run("xcrun", ["simctl", "ui", device, "content_size"]).trim();
    if (observedContentSize !== contentSize) {
      throw new Error(`simulator content size ${observedContentSize} does not match requested ${contentSize}`);
    }
    for (const appearance of appearances) {
      runInherited("xcrun", ["simctl", "ui", device, "appearance", appearance]);
      const observedSystemAppearance = run("xcrun", ["simctl", "ui", device, "appearance"]).trim();
      if (observedSystemAppearance !== appearance) {
        throw new Error(`simulator appearance ${observedSystemAppearance} does not match requested ${appearance}`);
      }
      for (const locale of locales) {
        for (const target of targets) {
          const groupKey = `${contentSize}/${appearance}/${locale}/${target.key}`;
          const groupEntries = [];
          const topEntry = capturePosition({
            target,
            contentSize,
            observedContentSize,
            appearance,
            observedSystemAppearance,
            locale,
            groupKey,
            sweepIndex: 0,
            requestedNormalizedOffsetY: 0,
            sourceTopAcknowledgement: null,
          });
          groupEntries.push(topEntry);

          const sourceTopAcknowledgement = topEntry.captureAcknowledgement;
          const sourceOriginRawY = finiteNumber(sourceTopAcknowledgement.rawContentOffsetY, `${groupKey}: top raw content origin`);
          const semanticMaxScrollY = finiteNumber(sourceTopAcknowledgement.maxScrollY, `${groupKey}: semantic maximum scroll`);
          const viewportHeight = finiteNumber(sourceTopAcknowledgement.viewportHeight, `${groupKey}: viewport height`);
          if (semanticMaxScrollY > MAXIMUM_APP_CAPTURE_SCROLL_Y) {
            throw new Error(`${groupKey}: semantic range ${semanticMaxScrollY} exceeds the app capture contract limit ${MAXIMUM_APP_CAPTURE_SCROLL_Y}`);
          }
          const plannedNormalizedOffsetsY = plannedSweepOffsets(semanticMaxScrollY, viewportHeight);
          for (let index = 1; index < plannedNormalizedOffsetsY.length; index += 1) {
            groupEntries.push(capturePosition({
              target,
              contentSize,
              observedContentSize,
              appearance,
              observedSystemAppearance,
              locale,
              groupKey,
              sweepIndex: index,
              requestedNormalizedOffsetY: plannedNormalizedOffsetsY[index],
              sourceTopAcknowledgement,
            }));
          }

          const finalizedEntries = groupEntries.map((entry, index) => {
            const previous = groupEntries[index - 1] || null;
            const requestedStrideY = previous
              ? entry.requestedNormalizedOffsetY - previous.requestedNormalizedOffsetY
              : 0;
            const observedStrideY = previous
              ? entry.observedNormalizedOffsetY - previous.observedNormalizedOffsetY
              : 0;
            const observedOverlapFraction = previous
              ? Math.max(0, 1 - observedStrideY / viewportHeight)
              : 1;
            const positionKind = plannedNormalizedOffsetsY.length === 1
              ? "top-and-end"
              : index === 0 ? "top" : index === plannedNormalizedOffsetsY.length - 1 ? "end" : "intermediate";
            return {
              ...entry,
              sweepCaptureCount: plannedNormalizedOffsetsY.length,
              sweepPositionKind: positionKind,
              requestedStrideFromPreviousY: requestedStrideY,
              observedStrideFromPreviousY: observedStrideY,
              observedOverlapFraction,
              sourceTopCaptureNonce: topEntry.captureNonce,
              sourceTopAcknowledgement,
              sourceOriginRawY,
              semanticMaxScrollY,
              plannedNormalizedOffsetsY,
            };
          });

          for (const entry of finalizedEntries) {
            writeFileSync(entry.sidecarPath, `${JSON.stringify(entry, null, 2)}\n`);
            entries.push(entry);
          }
          const observedNormalizedOffsetsY = finalizedEntries.map((entry) => entry.observedNormalizedOffsetY);
          sweepGroups.push({
            groupKey,
            target: target.key,
            requestedAppearance: appearance,
            contentSize,
            locale,
            expectedMountedRoute: expectedMountedRouteForTarget(target),
            sourceTopCaptureNonce: topEntry.captureNonce,
            sourceOriginRawY,
            contentHeight: sourceTopAcknowledgement.contentHeight,
            viewportHeight,
            rawMaxScrollY: sourceTopAcknowledgement.rawMaxScrollY,
            semanticMaxScrollY,
            captureCount: finalizedEntries.length,
            plannedNormalizedOffsetsY,
            observedNormalizedOffsetsY,
            screenshotSha256s: finalizedEntries.map((entry) => entry.screenshotSha256),
          });
          process.stdout.write(`swept ${sweepGroups.length}/${expectedSweepGroupCount} ${groupKey} (${finalizedEntries.length} captures)\n`);
        }
      }
    }
  }
} finally {
  runOptional("xcrun", ["simctl", "ui", device, "appearance", originalAppearance]);
  runOptional("xcrun", ["simctl", "ui", device, "content_size", originalContentSize]);
}

assertUnchanged("source commit", sourceCommit, run("git", ["rev-parse", "HEAD"]).trim());
assertUnchanged("source state", sourceDiffSha256, sourceStateSha256());
assertUnchanged("app config", appConfigSha256, sha256File(appConfigPath));
assertUnchanged("candidate bundle", candidateBundleSha256, sha256File(candidateBundlePath));
assertUnchanged("installed bundle", injectedBundleSha256, sha256File(installedBundlePath));
assertUnchanged("installed native executable", installedNativeExecutableSha256, sha256File(installedExecutablePath));

const manifest = {
  generatedAt: new Date().toISOString(),
  ...evidenceIdentity,
  outputRoot,
  canonicalBaseTargetKeys,
  selectedTargetKeys,
  appearances,
  contentSizes,
  locales,
  expectedSweepGroupCount,
  sweepGroupCount: sweepGroups.length,
  screenshotCount: entries.length,
  sweepGroups,
  entries,
};
writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Dynamic scroll sweep complete: ${entries.length} surrogate screenshots across ${sweepGroups.length} route tuples in ${outputRoot}`);

function capturePosition({
  target,
  contentSize,
  observedContentSize,
  appearance,
  observedSystemAppearance,
  locale,
  groupKey,
  sweepIndex,
  requestedNormalizedOffsetY,
  sourceTopAcknowledgement,
}) {
  const captureNonce = randomUUID();
  if (usedCaptureNonces.has(captureNonce)) throw new Error(`${groupKey}: duplicate generated capture nonce`);
  usedCaptureNonces.add(captureNonce);
  const captureTarget = canonicalCaptureTarget(target.key, sweepIndex, requestedNormalizedOffsetY);
  if (usedCaptureTargets.has(`${groupKey}/${captureTarget}`)) throw new Error(`${groupKey}: duplicate generated capture target ${captureTarget}`);
  usedCaptureTargets.add(`${groupKey}/${captureTarget}`);
  const expectedMountedRoute = expectedMountedRouteForTarget(target);
  const sourceOriginRawY = sourceTopAcknowledgement == null
    ? null
    : finiteNumber(sourceTopAcknowledgement.rawContentOffsetY, `${groupKey}: source top raw content origin`);
  const config = {
    ...canonicalRouteConfig(target, { locale, appearance }),
    ...(requestedNormalizedOffsetY > 0 ? { captureScrollY: requestedNormalizedOffsetY } : {}),
    ...(sourceOriginRawY != null ? { captureOriginRawY: sourceOriginRawY } : {}),
    captureNonce,
    captureTarget,
  };
  rmSync(captureAckFile, { force: true });
  writeFileSync(captureFile, `${JSON.stringify(config)}\n`);
  runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
  const launchStartedAt = Date.now();
  runInherited("xcrun", ["simctl", "launch", device, bundleId]);
  const captureAcknowledgement = waitForCaptureAcknowledgement({
    path: captureAckFile,
    captureNonce,
    captureTarget,
    expectedMountedRoute,
    requestedAppearance: appearance,
    requestedLocale: locale,
    requestedScrollY: requestedNormalizedOffsetY,
    expectedContentOriginRawY: sourceOriginRawY,
    launchStartedAt,
    timeoutMs: readyTimeoutMs,
  });
  if (sourceTopAcknowledgement) assertMatchingSweepGeometry(groupKey, captureAcknowledgement, sourceTopAcknowledgement);
  sleep(target.config.prompt ? Math.max(waitMs, 4200) : waitMs);

  const screenshotPath = join(
    outputRoot,
    contentSize,
    appearance,
    locale,
    target.key,
    `${String(sweepIndex).padStart(3, "0")}.png`,
  );
  mkdirSync(dirname(screenshotPath), { recursive: true });
  runInherited("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
  let retriedBlankCapture = false;
  let measuredEntropy = imageEntropy(screenshotPath);
  if (measuredEntropy < 0.05) {
    retriedBlankCapture = true;
    sleep(Math.max(3500, waitMs));
    runInherited("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
    measuredEntropy = imageEntropy(screenshotPath);
  }
  const dimensions = imageDimensions(screenshotPath);
  const sidecarPath = screenshotPath.replace(/\.png$/i, ".json");
  return {
    ...evidenceIdentity,
    groupKey,
    target: target.key,
    targetConfig: target.config,
    targetAppearancePolicy: target.appearancePolicy,
    sweepIndex,
    captureNonce,
    captureTarget,
    expectedMountedRoute,
    routeConfig: config,
    launchStartedAt: new Date(launchStartedAt).toISOString(),
    captureAcknowledgement,
    requestedNormalizedOffsetY,
    observedNormalizedOffsetY: captureAcknowledgement.observedScrollY,
    normalizedOffsetEvidence: "app-acknowledgement-v5-raw-minus-top-origin",
    scrollPositionSource: captureAcknowledgement.scrollPositionSource,
    captureOriginRawY: config.captureOriginRawY ?? null,
    rawContentOffsetY: captureAcknowledgement.rawContentOffsetY,
    contentInsetTop: captureAcknowledgement.contentInsetTop,
    contentOriginRawY: captureAcknowledgement.contentOriginRawY,
    contentHeight: captureAcknowledgement.contentHeight,
    viewportHeight: captureAcknowledgement.viewportHeight,
    rawMaxScrollY: captureAcknowledgement.rawMaxScrollY,
    maxScrollY: captureAcknowledgement.maxScrollY,
    observedScrollYConvention: captureAcknowledgement.observedScrollYConvention,
    observedScrollYEvidence: "app-acknowledgement-v5",
    requestedAppearance: appearance,
    observedSystemAppearance,
    resolvedAppAppearance: captureAcknowledgement.resolvedAppearance,
    resolvedAppAppearanceEvidence: "app-acknowledgement-v5",
    contentSize,
    observedContentSize,
    locale,
    resolvedLocale: captureAcknowledgement.resolvedLocale,
    resolvedLocaleEvidence: "app-acknowledgement-v5",
    resolvedRtl: captureAcknowledgement.rtl,
    resolvedRtlEvidence: "app-acknowledgement-v5",
    rtlExpected: locale === "ar",
    screenshotPath,
    sidecarPath,
    screenshotSha256: sha256File(screenshotPath),
    screenshotBytes: statSync(screenshotPath).size,
    retriedBlankCapture,
    imageEntropy: measuredEntropy,
    width: dimensions.width,
    height: dimensions.height,
    capturedAt: new Date().toISOString(),
  };
}

function plannedSweepOffsets(maxScrollY, viewportHeight) {
  const maximum = finiteNumber(maxScrollY, "semantic maximum scroll");
  const viewport = finiteNumber(viewportHeight, "viewport height");
  if (maximum < 0 || viewport <= 0) throw new Error("sweep geometry must have a non-negative maximum and positive viewport");
  if (maximum <= SCROLL_TOLERANCE_PX) return [0];
  const plannedStride = viewport * PLANNED_STRIDE_FRACTION;
  if (!(plannedStride > 0)) throw new Error("planned sweep stride must be positive");
  const segmentCount = Math.max(1, Math.ceil(maximum / plannedStride));
  return Array.from({ length: segmentCount + 1 }, (_unused, index) => (
    index === segmentCount ? maximum : maximum * index / segmentCount
  ));
}

function canonicalCaptureTarget(targetKey, sweepIndex, requestedNormalizedOffsetY) {
  return `scroll-sweep:${targetKey}:${String(sweepIndex).padStart(3, "0")}:${offsetToken(requestedNormalizedOffsetY)}`;
}

function offsetToken(value) {
  const normalized = Number(value.toFixed(6));
  return String(Object.is(normalized, -0) ? 0 : normalized);
}

function assertMatchingSweepGeometry(groupKey, acknowledgement, sourceTopAcknowledgement) {
  for (const field of ["contentHeight", "viewportHeight", "rawMaxScrollY", "maxScrollY"]) {
    if (Math.abs(Number(acknowledgement[field]) - Number(sourceTopAcknowledgement[field])) > SCROLL_TOLERANCE_PX) {
      throw new Error(`${groupKey}: deep and top acknowledgements disagree on ${field}`);
    }
  }
}

function validateBaseTargetSelection(values) {
  const unknown = values.filter((value) => !APPEARANCE_MATRIX_TARGETS_BY_KEY.has(value));
  if (unknown.length) {
    throw new Error(`STUDYPLANNER_SWEEP_TARGETS contains unknown target(s): ${unknown.join(", ")}`);
  }
  const deep = values.filter((value) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(value)?.scrollPlan);
  if (deep.length) {
    throw new Error(`STUDYPLANNER_SWEEP_TARGETS accepts base targets only; reject deep target(s): ${deep.join(", ")}`);
  }
  validateAllowedValues("STUDYPLANNER_SWEEP_TARGETS", values, canonicalBaseTargetKeys);
}

function listFilter(name, defaultValues) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) return [...defaultValues];
  const rawItems = String(process.env[name] || "").split(",");
  const items = rawItems.map((item) => item.trim());
  if (!items.length || items.some((item) => !item)) {
    throw new Error(`${name} must be a non-empty comma-separated list without empty items`);
  }
  const duplicates = items.filter((item, index) => items.indexOf(item) !== index);
  if (duplicates.length) {
    throw new Error(`${name} contains duplicate value(s): ${[...new Set(duplicates)].join(", ")}`);
  }
  return items;
}

function validateAllowedValues(name, values, allowedValues) {
  const unknown = values.filter((value) => !allowedValues.includes(value));
  if (unknown.length) throw new Error(`${name} contains unsupported value(s): ${unknown.join(", ")}`);
}

function numericEnvironmentValue(name, defaultValue, limits) {
  const value = Object.prototype.hasOwnProperty.call(process.env, name)
    ? Number(process.env[name])
    : defaultValue;
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  if (limits.minimum != null && value < limits.minimum) throw new Error(`${name} must be at least ${limits.minimum}`);
  if (limits.exclusiveMinimum != null && value <= limits.exclusiveMinimum) throw new Error(`${name} must be greater than ${limits.exclusiveMinimum}`);
  return value;
}

function plistValue(path, key) {
  return run("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, path]).trim();
}

function resolveSimulatorIdentity(requested) {
  const devicesByRuntime = JSON.parse(run("xcrun", ["simctl", "list", "devices", "--json"])).devices;
  const matches = [];
  for (const [runtimeIdentifier, devices] of Object.entries(devicesByRuntime || {})) {
    for (const candidate of devices) {
      const matchesRequest = requested === "booted"
        ? candidate.state === "Booted"
        : candidate.udid === requested || candidate.name === requested;
      if (matchesRequest) matches.push({ runtimeIdentifier, candidate });
    }
  }
  if (matches.length !== 1) {
    throw new Error(`simulator selector ${requested} resolved to ${matches.length} devices; provide one booted simulator UDID`);
  }
  const { runtimeIdentifier, candidate } = matches[0];
  if (candidate.state !== "Booted" || candidate.isAvailable === false) {
    throw new Error(`simulator ${candidate.udid} must be booted and available`);
  }
  const runtime = JSON.parse(run("xcrun", ["simctl", "list", "runtimes", "--json"])).runtimes
    .find((item) => item.identifier === runtimeIdentifier);
  if (!runtime) throw new Error(`runtime metadata not found for ${runtimeIdentifier}`);
  const deviceType = runtime.supportedDeviceTypes?.find((item) => item.identifier === candidate.deviceTypeIdentifier);
  return {
    udid: candidate.udid,
    name: candidate.name,
    state: candidate.state,
    deviceTypeIdentifier: candidate.deviceTypeIdentifier,
    deviceTypeName: deviceType?.name || null,
    productFamily: deviceType?.productFamily || null,
    runtimeIdentifier,
    runtimeName: runtime.name,
    runtimeVersion: runtime.version,
    runtimeBuild: runtime.buildversion,
    runtimePlatform: runtime.platform,
  };
}

function waitForCaptureAcknowledgement(expected) {
  const deadline = Date.now() + expected.timeoutMs;
  let lastProblem = "acknowledgement file was not created";
  while (Date.now() <= deadline) {
    if (existsSync(expected.path)) {
      try {
        const acknowledgement = JSON.parse(readFileSync(expected.path, "utf8"));
        const problem = captureAcknowledgementProblem(acknowledgement, expected);
        if (!problem) return acknowledgement;
        lastProblem = problem;
      } catch (error) {
        lastProblem = `acknowledgement JSON was not readable: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    sleep(100);
  }
  throw new Error(`${expected.captureTarget}: capture-ready acknowledgement timed out after ${expected.timeoutMs}ms (${lastProblem})`);
}

function captureAcknowledgementProblem(acknowledgement, expected) {
  if (!acknowledgement || typeof acknowledgement !== "object" || Array.isArray(acknowledgement)) return "acknowledgement must be an object";
  if (acknowledgement.schemaVersion !== CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION) return `schemaVersion ${acknowledgement.schemaVersion} is not ${CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION}`;
  if (acknowledgement.captureNonce !== expected.captureNonce) return "capture nonce does not match";
  if (acknowledgement.captureTarget !== expected.captureTarget) return "capture target does not match";
  if (acknowledgement.mountedRoute !== expected.expectedMountedRoute) return `mounted route ${acknowledgement.mountedRoute} does not match ${expected.expectedMountedRoute}`;
  if (acknowledgement.resolvedAppearance !== expected.requestedAppearance) return "resolved app appearance does not match";
  if (acknowledgement.resolvedSystemAppearance !== expected.requestedAppearance) return "resolved system appearance does not match";
  if (acknowledgement.requestedLocale !== expected.requestedLocale || acknowledgement.resolvedLocale !== expected.requestedLocale) return "requested/resolved locale does not match";
  if (acknowledgement.rtl !== (expected.requestedLocale === "ar")) return "resolved RTL state does not match locale";
  if (acknowledgement.requestedScrollY !== expected.requestedScrollY) return "requested normalized scroll offset does not match";
  if (acknowledgement.observedScrollYConvention !== "raw-minus-top-origin") return "observed scroll convention does not match schema v5";
  const isDeepCapture = expected.expectedContentOriginRawY != null;
  const scrollPositionSource = acknowledgement.scrollPositionSource;
  if (scrollPositionSource !== "native-scroll-event" && scrollPositionSource !== "implicit-zero-content-offset") return "scroll position source is invalid";
  if (isDeepCapture && scrollPositionSource !== "native-scroll-event") return "deep acknowledgement must be backed by a native scroll event";
  const numbers = acknowledgementGeometry(acknowledgement);
  if (!Object.values(numbers).every(Number.isFinite)) return "scroll geometry must be finite";
  const { rawContentOffsetY, contentOriginRawY, observedScrollY, contentHeight, viewportHeight, rawMaxScrollY, maxScrollY } = numbers;
  if (contentHeight <= 0 || viewportHeight <= 0 || rawMaxScrollY < 0 || maxScrollY < 0 || observedScrollY < 0) return "scroll geometry must be positive";
  if (acknowledgement.scrollViewRegistered !== true) return "capture scroll view is not registered";
  if (scrollPositionSource === "implicit-zero-content-offset") {
    if (acknowledgement.requestedScrollY !== 0) return "implicit zero offset is only valid for an exact zero request";
    if (rawContentOffsetY !== 0 || contentOriginRawY !== 0 || observedScrollY !== 0) return "implicit zero offset must report exact zero raw, origin, and observed offsets";
  }
  if (!isDeepCapture) {
    if (Math.abs(contentOriginRawY - rawContentOffsetY) > 0.01) return "top acknowledgement origin does not equal its raw offset";
  } else if (Math.abs(contentOriginRawY - expected.expectedContentOriginRawY) > 0.01) {
    return "deep acknowledgement origin does not equal the source top raw offset";
  }
  if (Math.abs(observedScrollY - Math.max(0, rawContentOffsetY - contentOriginRawY)) > 0.01) return "normalized offset is not raw offset minus source origin";
  if (Math.abs(rawMaxScrollY - Math.max(0, contentHeight - viewportHeight)) > SCROLL_TOLERANCE_PX) return "raw maximum does not match geometry";
  if (Math.abs(maxScrollY - Math.max(0, rawMaxScrollY - contentOriginRawY)) > SCROLL_TOLERANCE_PX) return "semantic maximum does not match raw maximum minus source origin";
  if (rawContentOffsetY > rawMaxScrollY + SCROLL_TOLERANCE_PX) return "raw content offset exceeds raw maximum";
  if (observedScrollY > maxScrollY + SCROLL_TOLERANCE_PX) return "normalized offset exceeds semantic maximum";
  if (acknowledgement.scrollApplied !== true) return "app did not confirm the requested normalized offset";
  if (!isDeepCapture) {
    if (expected.requestedScrollY !== 0 || observedScrollY > SCROLL_TOLERANCE_PX) return "top capture is not at the top";
  } else {
    if (maxScrollY < expected.requestedScrollY - SCROLL_TOLERANCE_PX) return "requested deep offset exceeds the semantic range";
    if (Math.abs(observedScrollY - expected.requestedScrollY) > SCROLL_TOLERANCE_PX) return "observed normalized offset does not match the request";
  }
  const acknowledgedAt = Date.parse(acknowledgement.acknowledgedAt);
  if (!Number.isFinite(acknowledgedAt)) return "acknowledgement timestamp is invalid";
  if (acknowledgedAt < expected.launchStartedAt - 1_000 || acknowledgedAt > Date.now() + 5_000) return "acknowledgement timestamp is outside the launch window";
  return null;
}

function acknowledgementGeometry(acknowledgement) {
  return {
    rawContentOffsetY: Number(acknowledgement.rawContentOffsetY),
    contentInsetTop: Number(acknowledgement.contentInsetTop),
    contentOriginRawY: Number(acknowledgement.contentOriginRawY),
    observedScrollY: Number(acknowledgement.observedScrollY),
    contentHeight: Number(acknowledgement.contentHeight),
    viewportHeight: Number(acknowledgement.viewportHeight),
    rawMaxScrollY: Number(acknowledgement.rawMaxScrollY),
    maxScrollY: Number(acknowledgement.maxScrollY),
  };
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be finite`);
  return number;
}

function assertUnchanged(label, before, after) {
  if (before !== after) throw new Error(`${label} changed during capture (${before} -> ${after}); discard this sweep`);
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function runInherited(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function runOptional(command, args) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
  } catch {
    // Cleanup and already-terminated states are intentionally idempotent.
  }
}

function sleep(milliseconds) {
  if (milliseconds > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sourceStateSha256() {
  const hash = createHash("sha256");
  hash.update(run("git", ["diff", "HEAD", "--binary", "--no-ext-diff", "--no-textconv", "--"]));
  const untracked = run("git", ["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .sort();
  for (const path of untracked) {
    hash.update(`\0${path}\0`);
    hash.update(readFileSync(path));
  }
  return hash.digest("hex");
}

function imageDimensions(path) {
  const output = run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path]);
  return {
    width: Number(output.match(/pixelWidth:\s*(\d+)/)?.[1] || 0),
    height: Number(output.match(/pixelHeight:\s*(\d+)/)?.[1] || 0),
  };
}

function imageEntropy(path) {
  const value = Number(run("magick", ["identify", "-format", "%[entropy]", path]).trim());
  if (!Number.isFinite(value)) throw new Error(`entropy measurement failed for ${path}`);
  return value;
}

function runSelfTests() {
  const noScroll = plannedSweepOffsets(0, 800);
  assert.deepEqual(noScroll, [0]);
  const toleranceOnly = plannedSweepOffsets(SCROLL_TOLERANCE_PX, 800);
  assert.deepEqual(toleranceOnly, [0]);
  const offsets = plannedSweepOffsets(1900, 800);
  assert.equal(offsets[0], 0);
  assert.equal(offsets.at(-1), 1900);
  assert(offsets.length > 2);
  for (let index = 1; index < offsets.length; index += 1) {
    const gap = offsets[index] - offsets[index - 1];
    assert(gap > 0);
    assert(gap / 800 <= PLANNED_STRIDE_FRACTION + Number.EPSILON);
    assert(1 - gap / 800 >= MINIMUM_OVERLAP_FRACTION);
  }
  assert.equal(canonicalCaptureTarget("today", 2, 123.4567894), "scroll-sweep:today:002:123.456789");
  assert.throws(() => validateBaseTargetSelection(["today-deep-1"]), /base targets only/);
  assert.throws(() => validateBaseTargetSelection(["not-a-target"]), /unknown target/);
  console.log(`Scroll-sweep capture self-test passed (${offsets.length} planned positions, ${Math.round((1 - (offsets[1] - offsets[0]) / 800) * 100)}% overlap).`);
}
