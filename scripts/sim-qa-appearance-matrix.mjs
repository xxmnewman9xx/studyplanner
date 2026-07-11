#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  APPEARANCE_MATRIX_SPEC,
  APPEARANCE_MATRIX_SPEC_SHA256,
  APPEARANCE_MATRIX_TARGETS_BY_KEY,
  captureScrollYForTarget,
  canonicalRouteConfig,
  conditionalDeepCaptureSkipReason,
  expectedMountedRouteForTarget,
  isFullCoverageSelection,
} from "./appearance-matrix-spec.mjs";

const deepScrollStrategy = "matching-top-ack-capture-when-meaningful-else-evidenced-skip";

const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help")) {
  console.log("Usage: node scripts/sim-qa-appearance-matrix.mjs [output-root] [--dry-run]");
  console.log("Use --dry-run to validate filters and print canonical coverage without launching a simulator.");
  console.log("Filter locales with STUDYPLANNER_CAPTURE_LOCALES; legacy STUDYPLANNER_CAPTURE_LOCALE is accepted alone.");
  process.exit(0);
}
const unknownOptions = cliArgs.filter((argument) => argument.startsWith("--") && argument !== "--dry-run");
if (unknownOptions.length) throw new Error(`unknown option(s): ${unknownOptions.join(", ")}`);
const positionalArgs = cliArgs.filter((argument) => !argument.startsWith("--"));
if (positionalArgs.length > 1) throw new Error("provide at most one output root");
const dryRun = cliArgs.includes("--dry-run");
const outputRoot = resolve(positionalArgs[0] || "/tmp/studyplanner-appearance-matrix");
const requestedDevice = process.env.STUDYPLANNER_SIMULATOR || "booted";
const bundleId = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const locales = localeListFilter();
validateAllowedValues("capture locales", locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
const waitMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 1800);
if (!Number.isFinite(waitMs) || waitMs < 0) {
  throw new Error("STUDYPLANNER_SIM_CAPTURE_WAIT_MS must be a non-negative finite number");
}
const readyTimeoutMs = Number(process.env.STUDYPLANNER_SIM_CAPTURE_READY_TIMEOUT_MS || 20_000);
if (!Number.isFinite(readyTimeoutMs) || readyTimeoutMs <= 0) {
  throw new Error("STUDYPLANNER_SIM_CAPTURE_READY_TIMEOUT_MS must be a positive finite number");
}
for (const locale of locales) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(locale)) {
    throw new Error(`capture locale is not a safe locale identifier: ${locale}`);
  }
}
const appearances = listFilter(
  "STUDYPLANNER_CAPTURE_APPEARANCES",
  APPEARANCE_MATRIX_SPEC.fullCoverage.appearances,
);
validateAllowedValues("STUDYPLANNER_CAPTURE_APPEARANCES", appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances);
const contentSizes = listFilter(
  "STUDYPLANNER_CAPTURE_CONTENT_SIZES",
  APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes,
);
validateAllowedValues("STUDYPLANNER_CAPTURE_CONTENT_SIZES", contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes);
const canonicalTargetKeys = APPEARANCE_MATRIX_SPEC.targets.map((target) => target.key);
const selectedTargetKeys = listFilter("STUDYPLANNER_CAPTURE_TARGETS", canonicalTargetKeys);
validateAllowedValues("STUDYPLANNER_CAPTURE_TARGETS", selectedTargetKeys, canonicalTargetKeys);
const targets = selectedTargetKeys.map((key) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(key));
if (!targets.length || targets.some((target) => !target)) {
  throw new Error("The appearance matrix must select at least one known target");
}
for (const target of targets) {
  if (!target.scrollPlan) continue;
  const sourceIndex = selectedTargetKeys.indexOf(target.scrollPlan.sourceTarget);
  const targetIndex = selectedTargetKeys.indexOf(target.key);
  if (sourceIndex < 0 || sourceIndex >= targetIndex) {
    throw new Error(`${target.key} requires earlier source target ${target.scrollPlan.sourceTarget}`);
  }
}
const coverageMode = isFullCoverageSelection({
  targetKeys: selectedTargetKeys,
  appearances,
  contentSizes,
  locales,
}) ? "full" : "partial";
const canonicalTupleCount = selectedTargetKeys.length * appearances.length * contentSizes.length * locales.length;
if (dryRun) {
  console.log(JSON.stringify({
    matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
    matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
    coverageMode,
    readinessEvidence: "nonce-bound-app-acknowledgement",
    deepScrollStrategy,
    conditionalDeepCapturePolicy: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy,
    scrollObservationConvention: "raw-minus-top-origin",
    locales,
    appearances,
    contentSizes,
    targetCount: selectedTargetKeys.length,
    deepTargetCount: targets.filter((target) => target.scrollPlan).length,
    selectedTargetKeys,
    canonicalTupleCount,
    maximumScreenshotCount: canonicalTupleCount,
  }, null, 2));
  process.exit(0);
}
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
const bundleSha256 = sha256File(installedBundlePath);
const candidateBundleSha256 = sha256File(candidateBundlePath);
if (bundleSha256 !== candidateBundleSha256) {
  throw new Error(`installed main.jsbundle ${bundleSha256} does not match candidate ${candidateBundleSha256}`);
}
const installedBundleBytes = statSync(installedBundlePath).size;
const candidateBundleBytes = statSync(candidateBundlePath).size;
if (installedBundleBytes !== candidateBundleBytes) {
  throw new Error(`installed main.jsbundle byte count ${installedBundleBytes} does not match candidate ${candidateBundleBytes}`);
}
const nativeExecutableSha256 = sha256File(installedExecutablePath);
const sourceCommit = run("git", ["rev-parse", "HEAD"]).trim();
const sourceDiffSha256 = sourceStateSha256();
const entropyToolVersion = run("magick", ["-version"]).split("\n")[0].trim();
const originalAppearance = run("xcrun", ["simctl", "ui", device, "appearance"]).trim();
const originalContentSize = run("xcrun", ["simctl", "ui", device, "content_size"]).trim();
const entries = [];
const conditionalDeepSkips = [];

mkdirSync(outputRoot, { recursive: true });

try {
  for (const contentSize of contentSizes) {
    runInherited("xcrun", ["simctl", "ui", device, "content_size", contentSize]);
    const observedContentSize = run("xcrun", ["simctl", "ui", device, "content_size"]).trim();
    if (observedContentSize !== contentSize) {
      throw new Error(`simulator content size ${observedContentSize} does not match requested ${contentSize}`);
    }
    for (const appearanceMode of appearances) {
      runInherited("xcrun", ["simctl", "ui", device, "appearance", appearanceMode]);
      const observedSystemAppearance = run("xcrun", ["simctl", "ui", device, "appearance"]).trim();
      if (observedSystemAppearance !== appearanceMode) {
        throw new Error(`simulator appearance ${observedSystemAppearance} does not match requested ${appearanceMode}`);
      }
      for (const locale of locales) {
        const acknowledgementsByTarget = new Map();
        const entriesByTarget = new Map();
        for (const target of targets) {
          const expectedMountedRoute = expectedMountedRouteForTarget(target);
          const scrollSourceAcknowledgement = target.scrollPlan
            ? acknowledgementsByTarget.get(target.scrollPlan.sourceTarget)
            : null;
          const scrollSourceEntry = target.scrollPlan
            ? entriesByTarget.get(target.scrollPlan.sourceTarget)
            : null;
          if (target.scrollPlan && !scrollSourceAcknowledgement) {
            throw new Error(`${target.key}: missing top-route acknowledgement for ${target.scrollPlan.sourceTarget}`);
          }
          if (target.scrollPlan && !scrollSourceEntry) {
            throw new Error(`${target.key}: missing top-route screenshot evidence for ${target.scrollPlan.sourceTarget}`);
          }
          const canonicalConfig = canonicalRouteConfig(target, { locale, appearance: appearanceMode });
          const screenshotPath = join(outputRoot, contentSize, appearanceMode, locale, `${target.key}.png`);
          const sidecarPath = screenshotPath.replace(/\.png$/, ".json");
          const skipSidecarPath = screenshotPath.replace(/\.png$/, ".skip.json");
          const skipReason = target.scrollPlan
            ? conditionalDeepCaptureSkipReason(target, scrollSourceAcknowledgement)
            : null;
          if (skipReason) {
            mkdirSync(dirname(skipSidecarPath), { recursive: true });
            rmSync(screenshotPath, { force: true });
            rmSync(sidecarPath, { force: true });
            const skipRecord = {
              recordType: "conditional-deep-skip",
              provenanceClass: "simulator-ui-qa-surrogate-do-not-upload",
              auditKind: "integrity-only",
              visualQualityAssessment: "not_performed",
              viewportPositionObservation: "app_acknowledgement_v5",
              localeResolutionObservation: "app_acknowledgement_v5",
              captureAcknowledgementSchemaVersion: 5,
              readinessEvidence: "nonce-bound-app-acknowledgement",
              scrollObservationConvention: "raw-minus-top-origin",
              releaseEligible: false,
              matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
              matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
              matrixSpecSchemaVersion: APPEARANCE_MATRIX_SPEC.schemaVersion,
              coverageMode,
              deepScrollStrategy,
              conditionalDeepCapturePolicy: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy,
              target: target.key,
              targetAppearancePolicy: target.appearancePolicy,
              targetScrollPlan: target.scrollPlan,
              canonicalRouteConfig: canonicalConfig,
              expectedMountedRoute,
              contentSize,
              observedContentSize,
              requestedAppearance: appearanceMode,
              observedSystemAppearance,
              locale,
              sourceTarget: target.scrollPlan.sourceTarget,
              sourceTuple: `${contentSize}/${appearanceMode}/${locale}/${target.scrollPlan.sourceTarget}`,
              sourceCaptureNonce: scrollSourceEntry.captureNonce,
              sourceScreenshotSha256: scrollSourceEntry.screenshotSha256,
              scrollSourceAcknowledgement,
              skipReason,
              meaningfulScrollRangeThresholdPx: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY,
              measuredMaxScrollY: Number(scrollSourceAcknowledgement.maxScrollY),
              scrollViewRegistered: scrollSourceAcknowledgement.scrollViewRegistered === true,
              appCaptureAttempted: false,
              screenshotProduced: false,
              device,
              requestedDevice,
              deviceIdentity: simulatorIdentity,
              bundleId,
              installedNativeShellVersion: installedAppVersion,
              installedNativeShellBuild: installedBuild,
              installedNativeShellBundleId: installedBundleId,
              installedNativeExecutableName: executableName,
              installedNativeExecutableSha256: nativeExecutableSha256,
              candidateAppVersion: appConfig.version,
              candidateBuildNumber: appConfig.ios?.buildNumber,
              appConfigPath,
              appConfigSha256,
              injectedBundleSha256: bundleSha256,
              injectedBundleBytes: installedBundleBytes,
              candidateBundleSha256,
              candidateBundleBytes,
              candidateBundlePath,
              injectedBundleVerified: true,
              sourceCommit,
              sourceDiffSha256,
              entropyToolVersion,
              skipSidecarPath,
              recordedAt: new Date().toISOString(),
            };
            writeFileSync(skipSidecarPath, `${JSON.stringify(skipRecord, null, 2)}\n`);
            conditionalDeepSkips.push(skipRecord);
            process.stdout.write(`skipped ${entries.length + conditionalDeepSkips.length}/${canonicalTupleCount} ${contentSize}/${appearanceMode}/${locale}/${target.key} (${skipReason})\n`);
            continue;
          }
          rmSync(skipSidecarPath, { force: true });
          const captureNonce = randomUUID();
          const requestedScrollY = captureScrollYForTarget(target, scrollSourceAcknowledgement);
          const captureOriginRawY = scrollSourceAcknowledgement
            ? Number(scrollSourceAcknowledgement.rawContentOffsetY)
            : null;
          if (scrollSourceAcknowledgement && !Number.isFinite(captureOriginRawY)) {
            throw new Error(`${target.key}: top acknowledgement raw origin is invalid`);
          }
          const config = {
            ...canonicalConfig,
            ...(requestedScrollY > 0 ? { captureScrollY: requestedScrollY } : {}),
            ...(captureOriginRawY != null ? { captureOriginRawY } : {}),
            captureNonce,
            captureTarget: target.key,
          };
          rmSync(captureAckFile, { force: true });
          writeFileSync(captureFile, `${JSON.stringify(config)}\n`);
          runOptional("xcrun", ["simctl", "terminate", device, bundleId]);
          const launchStartedAt = Date.now();
          runInherited("xcrun", ["simctl", "launch", device, bundleId]);
          const captureAcknowledgement = waitForCaptureAcknowledgement({
            path: captureAckFile,
            captureNonce,
            captureTarget: target.key,
            expectedMountedRoute,
            requestedAppearance: appearanceMode,
            requestedLocale: locale,
            requestedScrollY,
            expectedContentOriginRawY: captureOriginRawY,
            launchStartedAt,
            timeoutMs: readyTimeoutMs,
            stabilityMs: waitMs,
          });
          if (scrollSourceAcknowledgement) {
            for (const field of ["contentHeight", "viewportHeight", "rawMaxScrollY", "maxScrollY"]) {
              if (Math.abs(Number(captureAcknowledgement[field]) - Number(scrollSourceAcknowledgement[field])) > 2) {
                throw new Error(`${target.key}: deep and top acknowledgements disagree on ${field}`);
              }
            }
          }
          acknowledgementsByTarget.set(target.key, captureAcknowledgement);
          if (target.config.prompt) sleep(Math.max(waitMs, 4200));
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
          const sidecar = {
            provenanceClass: "simulator-ui-qa-surrogate-do-not-upload",
            auditKind: "integrity-only",
            visualQualityAssessment: "not_performed",
            viewportPositionObservation: "app_acknowledgement_v5",
            localeResolutionObservation: "app_acknowledgement_v5",
            releaseEligible: false,
            matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
            matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
            coverageMode,
            target: target.key,
            targetAppearancePolicy: target.appearancePolicy,
            targetScrollPlan: target.scrollPlan,
            scrollSourceAcknowledgement,
            captureNonce,
            expectedMountedRoute,
            captureAcknowledgementSchemaVersion: 5,
            readinessEvidence: "nonce-bound-app-acknowledgement",
            deepScrollStrategy,
            conditionalDeepCapturePolicy: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy,
            meaningfulScrollRangeThresholdPx: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY,
            scrollObservationConvention: "raw-minus-top-origin",
            captureAcknowledgement,
            routeConfig: config,
            requestedScrollY: captureAcknowledgement.requestedScrollY,
            scrollPositionSource: captureAcknowledgement.scrollPositionSource,
            captureOriginRawY: config.captureOriginRawY ?? null,
            rawContentOffsetY: captureAcknowledgement.rawContentOffsetY,
            contentInsetTop: captureAcknowledgement.contentInsetTop,
            contentOriginRawY: captureAcknowledgement.contentOriginRawY,
            rawMaxScrollY: captureAcknowledgement.rawMaxScrollY,
            maxScrollY: captureAcknowledgement.maxScrollY,
            observedScrollY: captureAcknowledgement.observedScrollY,
            observedScrollYConvention: captureAcknowledgement.observedScrollYConvention,
            observedScrollYEvidence: "app-acknowledgement-v5",
            requestedAppearance: appearanceMode,
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
            rtlExpected: locale.toLowerCase().startsWith("ar"),
            device,
            requestedDevice,
            deviceIdentity: simulatorIdentity,
            bundleId,
            installedNativeShellVersion: installedAppVersion,
            installedNativeShellBuild: installedBuild,
            installedNativeShellBundleId: installedBundleId,
            candidateAppVersion: appConfig.version,
            candidateBuildNumber: appConfig.ios?.buildNumber,
            appConfigPath,
            appConfigSha256,
            injectedBundleSha256: bundleSha256,
            injectedBundleBytes: installedBundleBytes,
            candidateBundleSha256,
            candidateBundleBytes,
            candidateBundlePath,
            injectedBundleVerified: true,
            installedNativeExecutableSha256: nativeExecutableSha256,
            installedNativeExecutableName: executableName,
            sourceCommit,
            sourceDiffSha256,
            screenshotPath,
            screenshotSha256: sha256File(screenshotPath),
            screenshotBytes: statSync(screenshotPath).size,
            retriedBlankCapture,
            imageEntropy: measuredEntropy,
            entropyToolVersion,
            width: dimensions.width,
            height: dimensions.height,
            capturedAt: new Date().toISOString(),
          };
          writeFileSync(sidecarPath, `${JSON.stringify(sidecar, null, 2)}\n`);
          entries.push(sidecar);
          entriesByTarget.set(target.key, sidecar);
          process.stdout.write(`captured ${entries.length + conditionalDeepSkips.length}/${canonicalTupleCount} ${contentSize}/${appearanceMode}/${locale}/${target.key}\n`);
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
assertUnchanged("installed bundle", bundleSha256, sha256File(installedBundlePath));
assertUnchanged("installed native executable", nativeExecutableSha256, sha256File(installedExecutablePath));

const warning = `Simulator UI QA surrogate using installed native shell ${installedAppVersion} (${installedBuild}) with an injected JavaScript candidate for config ${appConfig.version} (${appConfig.ios?.buildNumber}). Native configuration and module behavior are not candidate-build provenance. Never use these images as App Store release provenance.`;
const manifest = {
  generatedAt: new Date().toISOString(),
  provenanceClass: "simulator-ui-qa-surrogate-do-not-upload",
  auditKind: "integrity-only",
  visualQualityAssessment: "not_performed",
  viewportPositionObservation: "app_acknowledgement_v5",
  localeResolutionObservation: "app_acknowledgement_v5",
  captureAcknowledgementSchemaVersion: 5,
  readinessEvidence: "nonce-bound-app-acknowledgement",
  deepScrollStrategy,
  conditionalDeepCapturePolicy: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy,
  meaningfulScrollRangeThresholdPx: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY,
  scrollObservationConvention: "raw-minus-top-origin",
  releaseEligible: false,
  warning,
  matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
  matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
  matrixSpecSchemaVersion: APPEARANCE_MATRIX_SPEC.schemaVersion,
  coverageMode,
  fullCoverageRequirements: APPEARANCE_MATRIX_SPEC.fullCoverage,
  deepCoverageRequirements: APPEARANCE_MATRIX_SPEC.deepCoverageRequirements,
  canonicalTargetKeys,
  selectedTargetKeys,
  outputRoot,
  device,
  requestedDevice,
  deviceIdentity: simulatorIdentity,
  bundleId,
  installedNativeShellVersion: installedAppVersion,
  installedNativeShellBuild: installedBuild,
  installedNativeShellBundleId: installedBundleId,
  installedNativeExecutableName: executableName,
  installedNativeExecutableSha256: nativeExecutableSha256,
  candidateAppVersion: appConfig.version,
  candidateBuildNumber: appConfig.ios?.buildNumber,
  appConfigPath,
  appConfigSha256,
  injectedBundleSha256: bundleSha256,
  injectedBundleBytes: installedBundleBytes,
  candidateBundleSha256,
  candidateBundleBytes,
  candidateBundlePath,
  injectedBundleVerified: true,
  sourceCommit,
  sourceDiffSha256,
  entropyToolVersion,
  locales,
  contentSizes,
  appearances,
  targetCount: targets.length,
  deepTargetCount: targets.filter((target) => target.scrollPlan).length,
  canonicalTupleCount,
  expectedScreenshotCount: canonicalTupleCount - conditionalDeepSkips.length,
  screenshotCount: entries.length,
  conditionalDeepSkipCount: conditionalDeepSkips.length,
  evidenceRecordCount: entries.length + conditionalDeepSkips.length,
  conditionalDeepSkips,
  entries,
};
writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Appearance matrix complete: ${entries.length} surrogate screenshots and ${conditionalDeepSkips.length} evidenced deep skips in ${outputRoot}`);

function localeListFilter() {
  const hasPlural = Object.prototype.hasOwnProperty.call(process.env, "STUDYPLANNER_CAPTURE_LOCALES");
  const hasSingular = Object.prototype.hasOwnProperty.call(process.env, "STUDYPLANNER_CAPTURE_LOCALE");
  if (hasPlural && hasSingular) {
    throw new Error("Use either STUDYPLANNER_CAPTURE_LOCALES or legacy STUDYPLANNER_CAPTURE_LOCALE, never both");
  }
  if (hasPlural) return listFilter("STUDYPLANNER_CAPTURE_LOCALES", APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
  if (hasSingular) return [requiredScalarFilter("STUDYPLANNER_CAPTURE_LOCALE", "")];
  return [...APPEARANCE_MATRIX_SPEC.fullCoverage.locales];
}

function requiredScalarFilter(name, defaultValue) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) return defaultValue;
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} was provided but is empty`);
  return value;
}

function listFilter(name, defaultValues) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) return [...defaultValues];
  return splitList(process.env[name], name);
}

function splitList(value, name) {
  const rawItems = String(value || "").split(",");
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
  if (unknown.length) {
    throw new Error(`${name} contains unsupported value(s): ${unknown.join(", ")}`);
  }
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
  const deviceType = runtime.supportedDeviceTypes?.find(
    (item) => item.identifier === candidate.deviceTypeIdentifier,
  );
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

function assertUnchanged(label, before, after) {
  if (before !== after) {
    throw new Error(`${label} changed during capture (${before} -> ${after}); discard this matrix`);
  }
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
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForCaptureAcknowledgement({ path, captureNonce, captureTarget, expectedMountedRoute, requestedAppearance, requestedLocale, requestedScrollY, expectedContentOriginRawY, launchStartedAt, timeoutMs, stabilityMs }) {
  const deadline = Date.now() + timeoutMs;
  let lastProblem = "acknowledgement file was not created";
  let stableFingerprint = "";
  let stableSince = 0;
  while (Date.now() <= deadline) {
    if (existsSync(path)) {
      try {
        const acknowledgement = JSON.parse(readFileSync(path, "utf8"));
        const problem = captureAcknowledgementProblem(acknowledgement, {
          captureNonce,
          captureTarget,
          expectedMountedRoute,
          requestedAppearance,
          requestedLocale,
          requestedScrollY,
          expectedContentOriginRawY,
          launchStartedAt,
        });
        if (!problem) {
          const fingerprint = JSON.stringify({
            scrollPositionSource: acknowledgement.scrollPositionSource,
            rawContentOffsetY: acknowledgement.rawContentOffsetY,
            contentOriginRawY: acknowledgement.contentOriginRawY,
            observedScrollY: acknowledgement.observedScrollY,
            contentHeight: acknowledgement.contentHeight,
            viewportHeight: acknowledgement.viewportHeight,
            rawMaxScrollY: acknowledgement.rawMaxScrollY,
            maxScrollY: acknowledgement.maxScrollY,
            scrollApplied: acknowledgement.scrollApplied,
          });
          if (fingerprint !== stableFingerprint) {
            stableFingerprint = fingerprint;
            stableSince = Date.now();
          }
          if (Date.now() - stableSince >= stabilityMs) return acknowledgement;
          lastProblem = `valid acknowledgement geometry has not remained stable for ${stabilityMs}ms`;
        } else {
          stableFingerprint = "";
          stableSince = 0;
          lastProblem = problem;
        }
      } catch (error) {
        stableFingerprint = "";
        stableSince = 0;
        lastProblem = `acknowledgement JSON was not readable: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    sleep(100);
  }
  throw new Error(`${captureTarget}: capture-ready acknowledgement timed out after ${timeoutMs}ms (${lastProblem})`);
}

function captureAcknowledgementProblem(acknowledgement, expected) {
  if (!acknowledgement || typeof acknowledgement !== "object" || Array.isArray(acknowledgement)) return "acknowledgement must be an object";
  if (acknowledgement.schemaVersion !== 5) return `schemaVersion ${acknowledgement.schemaVersion} is not 5`;
  if (acknowledgement.captureNonce !== expected.captureNonce) return "capture nonce does not match";
  if (acknowledgement.captureTarget !== expected.captureTarget) return "capture target does not match";
  if (acknowledgement.mountedRoute !== expected.expectedMountedRoute) return `mounted route ${acknowledgement.mountedRoute} does not match ${expected.expectedMountedRoute}`;
  if (acknowledgement.resolvedAppearance !== expected.requestedAppearance) return "resolved app appearance does not match";
  if (acknowledgement.resolvedSystemAppearance !== expected.requestedAppearance) return "resolved system appearance does not match";
  if (acknowledgement.requestedLocale !== expected.requestedLocale || acknowledgement.resolvedLocale !== expected.requestedLocale) return "requested/resolved locale does not match";
  if (acknowledgement.rtl !== (expected.requestedLocale === "ar")) return "resolved RTL state does not match locale";
  if (acknowledgement.requestedScrollY !== expected.requestedScrollY) return "requested scroll offset does not match";
  if (acknowledgement.observedScrollYConvention !== "raw-minus-top-origin") return "observed scroll convention does not match schema v5";
  const isDeepCapture = expected.expectedContentOriginRawY != null;
  const scrollPositionSource = acknowledgement.scrollPositionSource;
  if (scrollPositionSource !== "native-scroll-event" && scrollPositionSource !== "implicit-zero-content-offset") {
    return "scroll position source is not an allowed schema v5 source";
  }
  if (isDeepCapture && scrollPositionSource !== "native-scroll-event") {
    return "deep acknowledgement must be backed by a native scroll event";
  }
  const rawContentOffsetY = Number(acknowledgement.rawContentOffsetY);
  const contentInsetTop = Number(acknowledgement.contentInsetTop);
  const contentOriginRawY = Number(acknowledgement.contentOriginRawY);
  const observedScrollY = Number(acknowledgement.observedScrollY);
  const contentHeight = Number(acknowledgement.contentHeight);
  const viewportHeight = Number(acknowledgement.viewportHeight);
  const rawMaxScrollY = Number(acknowledgement.rawMaxScrollY);
  const maxScrollY = Number(acknowledgement.maxScrollY);
  if (![rawContentOffsetY, contentInsetTop, contentOriginRawY, observedScrollY, contentHeight, viewportHeight, rawMaxScrollY, maxScrollY].every(Number.isFinite)) return "scroll geometry must be finite";
  if (contentHeight <= 0 || viewportHeight <= 0 || rawMaxScrollY < 0 || maxScrollY < 0 || observedScrollY < 0) return "scroll geometry must be positive";
  if (scrollPositionSource === "implicit-zero-content-offset") {
    if (acknowledgement.requestedScrollY !== 0) return "implicit zero offset is only valid for an exact zero request";
    if (rawContentOffsetY !== 0 || contentOriginRawY !== 0 || observedScrollY !== 0) {
      return "implicit zero offset must report exact zero raw, origin, and observed offsets";
    }
  }
  if (!isDeepCapture) {
    if (Math.abs(contentOriginRawY - rawContentOffsetY) > 0.01) return "top acknowledgement origin does not equal its raw offset";
  } else if (Math.abs(contentOriginRawY - expected.expectedContentOriginRawY) > 0.01) {
    return "deep acknowledgement origin does not equal the source top raw offset";
  }
  const normalizedObservedScrollY = Math.max(0, rawContentOffsetY - contentOriginRawY);
  if (Math.abs(observedScrollY - normalizedObservedScrollY) > 0.01) return "observedScrollY does not equal rawContentOffsetY minus contentOriginRawY";
  const calculatedRawMaxScrollY = Math.max(0, contentHeight - viewportHeight);
  if (Math.abs(rawMaxScrollY - calculatedRawMaxScrollY) > 2) return "rawMaxScrollY does not match content and viewport geometry";
  const calculatedMaxScrollY = Math.max(0, rawMaxScrollY - contentOriginRawY);
  if (Math.abs(maxScrollY - calculatedMaxScrollY) > 2) return "maxScrollY does not match raw maximum minus content origin";
  if (rawContentOffsetY > rawMaxScrollY + 2) return "raw content offset exceeds raw maximum";
  if (observedScrollY > maxScrollY + 2) return "observed scroll offset exceeds maximum";
  if (acknowledgement.scrollApplied !== true) return "app did not confirm the requested scroll offset";
  if (expected.requestedScrollY <= 1) {
    if (observedScrollY > 2) return "top capture is not at the top";
  } else {
    if (maxScrollY < expected.requestedScrollY - 2) return "requested deep offset exceeds the available scroll range";
    if (Math.abs(observedScrollY - expected.requestedScrollY) > 2) return "observed deep offset does not match the requested position";
  }
  const acknowledgedAt = Date.parse(acknowledgement.acknowledgedAt);
  if (!Number.isFinite(acknowledgedAt)) return "acknowledgement timestamp is invalid";
  if (acknowledgedAt < expected.launchStartedAt - 1_000 || acknowledgedAt > Date.now() + 5_000) return "acknowledgement timestamp is outside the launch window";
  return null;
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
