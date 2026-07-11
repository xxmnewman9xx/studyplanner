#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  APPEARANCE_MATRIX_SPEC,
  APPEARANCE_MATRIX_SPEC_SHA256,
  APPEARANCE_MATRIX_TARGETS_BY_KEY,
  captureScrollYForTarget,
  canonicalRouteConfig,
  conditionalDeepCaptureSkipReason,
  expectedMountedRouteForTarget,
  hasExactMembers,
  isFullCoverageSelection,
} from "./appearance-matrix-spec.mjs";

const deepScrollStrategy = "matching-top-ack-capture-when-meaningful-else-evidenced-skip";

const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help")) {
  console.log("Usage: node scripts/audit-appearance-matrix.mjs [matrix-root] [--require-full] [--dry-run]");
  console.log("Performs integrity and canonical-coverage checks only; it does not assess visual quality.");
  process.exit(0);
}
const unknownOptions = cliArgs.filter((argument) => argument.startsWith("--") && !["--require-full", "--dry-run"].includes(argument));
if (unknownOptions.length) throw new Error(`unknown option(s): ${unknownOptions.join(", ")}`);
const positionalArgs = cliArgs.filter((argument) => !argument.startsWith("--"));
if (positionalArgs.length > 1) throw new Error("provide at most one matrix root");
if (cliArgs.includes("--dry-run")) {
  const targetCount = APPEARANCE_MATRIX_SPEC.targets.length;
  const { appearances, contentSizes, locales } = APPEARANCE_MATRIX_SPEC.fullCoverage;
  console.log(JSON.stringify({
    matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
    matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
    coverageMode: "full",
    readinessEvidence: "nonce-bound-app-acknowledgement",
    deepScrollStrategy,
    conditionalDeepCapturePolicy: APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy,
    scrollObservationConvention: "raw-minus-top-origin",
    targetCount,
    deepTargetCount: APPEARANCE_MATRIX_SPEC.targets.filter((target) => target.scrollPlan).length,
    locales,
    appearances,
    contentSizes,
    canonicalTupleCount: targetCount * locales.length * appearances.length * contentSizes.length,
    maximumScreenshotCount: targetCount * locales.length * appearances.length * contentSizes.length,
  }, null, 2));
  process.exit(0);
}
const requireFull = cliArgs.includes("--require-full") || process.env.STUDYPLANNER_REQUIRE_FULL_MATRIX === "1";
const matrixRoot = resolve(positionalArgs[0] || "/tmp/studyplanner-appearance-matrix");
const manifestPath = join(matrixRoot, "manifest.json");
const reportPath = join(matrixRoot, "audit-report.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const failures = [];
const warnings = [];
const tuples = new Set();
const screenshotHashes = new Map();
let retriedBlankCaptures = 0;
let minimumEntropy = Number.POSITIVE_INFINITY;

const fail = (message) => failures.push(message);
const expect = (condition, message) => {
  if (!condition) fail(message);
};

const canonicalTargetKeys = APPEARANCE_MATRIX_SPEC.targets.map((target) => target.key);
const appearances = validatedStringArray(manifest.appearances, "manifest appearances");
const contentSizes = validatedStringArray(manifest.contentSizes, "manifest content sizes");
const locales = validatedStringArray(manifest.locales, "manifest locales");
const selectedTargetKeys = validatedStringArray(manifest.selectedTargetKeys, "manifest selected target keys");
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const conditionalDeepSkips = Array.isArray(manifest.conditionalDeepSkips) ? manifest.conditionalDeepSkips : [];
if (!Array.isArray(manifest.entries)) fail("manifest entries must be an array");
if (!Array.isArray(manifest.conditionalDeepSkips)) fail("manifest conditional deep skips must be an array");

expect(manifest.provenanceClass === "simulator-ui-qa-surrogate-do-not-upload", "manifest must be marked do-not-upload");
expect(manifest.auditKind === "integrity-only", "manifest audit kind must be integrity-only");
expect(manifest.visualQualityAssessment === "not_performed", "manifest must state that visual quality was not assessed");
expect(manifest.viewportPositionObservation === "app_acknowledgement_v5", "manifest must bind viewport position to the app acknowledgement");
expect(manifest.localeResolutionObservation === "app_acknowledgement_v5", "manifest must bind locale resolution to the app acknowledgement");
expect(manifest.captureAcknowledgementSchemaVersion === 5, "manifest capture acknowledgement schema must be 5");
expect(manifest.readinessEvidence === "nonce-bound-app-acknowledgement", "manifest readiness evidence is missing");
expect(manifest.deepScrollStrategy === deepScrollStrategy, "manifest deep-scroll strategy mismatch");
expect(isDeepStrictEqual(manifest.conditionalDeepCapturePolicy, APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy), "conditional deep-capture policy mismatch");
expect(manifest.meaningfulScrollRangeThresholdPx === APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY, "meaningful-scroll threshold mismatch");
expect(manifest.scrollObservationConvention === "raw-minus-top-origin", "manifest scroll-observation convention mismatch");
expect(manifest.releaseEligible === false, "simulator matrix must never be marked release eligible");
expect(Boolean(manifest.warning?.includes("Never use")), "manifest must carry an explicit upload warning");
expect(manifest.matrixSpecId === APPEARANCE_MATRIX_SPEC.id, "matrix spec id mismatch");
expect(manifest.matrixSpecSha256 === APPEARANCE_MATRIX_SPEC_SHA256, "matrix spec hash mismatch");
expect(manifest.matrixSpecSchemaVersion === APPEARANCE_MATRIX_SPEC.schemaVersion, "matrix spec schema mismatch");
expect(isDeepStrictEqual(manifest.fullCoverageRequirements, APPEARANCE_MATRIX_SPEC.fullCoverage), "full-coverage requirements mismatch");
expect(isDeepStrictEqual(manifest.deepCoverageRequirements, APPEARANCE_MATRIX_SPEC.deepCoverageRequirements), "deep-coverage requirements mismatch");
expect(isDeepStrictEqual(manifest.canonicalTargetKeys, canonicalTargetKeys), "canonical target inventory mismatch");

for (const target of APPEARANCE_MATRIX_SPEC.targets) {
  if (!target.scrollPlan) continue;
  expect(target.key.includes("-deep"), `${target.key}: scrolled target key must be explicitly marked deep`);
  const sourceTarget = APPEARANCE_MATRIX_TARGETS_BY_KEY.get(target.scrollPlan.sourceTarget);
  expect(Boolean(sourceTarget), `${target.key}: scroll-plan source target is missing`);
  expect(!sourceTarget?.scrollPlan, `${target.key}: scroll-plan source must be a top target`);
  expect(sourceTarget ? isDeepStrictEqual(sourceTarget.config, target.config) : false, `${target.key}: scroll-plan source must use the same route config`);
  expect(sourceTarget ? expectedMountedRouteForTarget(sourceTarget) === expectedMountedRouteForTarget(target) : false, `${target.key}: scroll-plan source must mount the same route`);
  expect(target.scrollPlan.anchor === "end" || target.scrollPlan.anchor === "fraction", `${target.key}: scroll-plan anchor is invalid`);
  if (target.scrollPlan.anchor === "fraction") {
    expect(Number.isFinite(target.scrollPlan.fraction) && target.scrollPlan.fraction > 0 && target.scrollPlan.fraction < 1, `${target.key}: scroll-plan fraction must be between zero and one`);
  }
}
for (const requirement of APPEARANCE_MATRIX_SPEC.deepCoverageRequirements) {
  const plans = APPEARANCE_MATRIX_SPEC.targets
    .filter((target) => Object.entries(requirement.match).every(([key, value]) => target.config[key] === value))
    .map((target) => target.scrollPlan)
    .filter(Boolean);
  expect(plans.length >= requirement.minimumDepths, `${requirement.surface}: requires at least ${requirement.minimumDepths} deep-scroll target(s)`);
  expect(new Set(plans.map((plan) => JSON.stringify(plan))).size === plans.length, `${requirement.surface}: deep-scroll plans must be distinct`);
}

validateUniqueAllowed("manifest appearances", appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances);
validateUniqueAllowed("manifest content sizes", contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes);
validateUniqueAllowed("manifest locales", locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
validateUniqueAllowed("manifest selected target keys", selectedTargetKeys, canonicalTargetKeys);
for (const targetKey of selectedTargetKeys) {
  const target = APPEARANCE_MATRIX_TARGETS_BY_KEY.get(targetKey);
  if (!target?.scrollPlan) continue;
  const sourceIndex = selectedTargetKeys.indexOf(target.scrollPlan.sourceTarget);
  expect(sourceIndex >= 0 && sourceIndex < selectedTargetKeys.indexOf(targetKey), `${targetKey}: selected targets must include its top-route source first`);
}
for (const locale of locales) {
  expect(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(locale), `manifest locale is invalid: ${locale}`);
}

const computedCoverageMode = isFullCoverageSelection({
  targetKeys: selectedTargetKeys,
  appearances,
  contentSizes,
  locales,
}) ? "full" : "partial";
expect(manifest.coverageMode === computedCoverageMode, `manifest coverage mode ${manifest.coverageMode} != computed ${computedCoverageMode}`);
if (computedCoverageMode === "full") {
  expect(hasExactMembers(selectedTargetKeys, canonicalTargetKeys), "full matrix must contain all canonical targets");
} else if (requireFull) {
  fail("partial matrix cannot satisfy --require-full");
} else {
  warnings.push("partial canonical matrix: integrity may pass, but full coverage is not claimed");
}

const expectedTuples = new Map();
for (const contentSize of contentSizes) {
  for (const appearance of appearances) {
    for (const locale of locales) {
      for (const targetKey of selectedTargetKeys) {
        const target = APPEARANCE_MATRIX_TARGETS_BY_KEY.get(targetKey);
        if (!target) continue;
        const tuple = `${contentSize}/${appearance}/${locale}/${targetKey}`;
        expectedTuples.set(tuple, {
          target,
          routeConfig: canonicalRouteConfig(target, { locale, appearance }),
        });
      }
    }
  }
}
const skippedTuples = new Set();
for (const skip of conditionalDeepSkips) {
  if (!skip || typeof skip !== "object" || Array.isArray(skip)) {
    fail("manifest contains a non-object conditional deep skip");
    continue;
  }
  const tuple = `${skip.contentSize}/${skip.requestedAppearance}/${skip.locale}/${skip.target}`;
  expect(!skippedTuples.has(tuple), `duplicate conditional deep skip: ${tuple}`);
  skippedTuples.add(tuple);
  const expected = expectedTuples.get(tuple);
  expect(Boolean(expected), `unexpected conditional deep skip: ${tuple}`);
  if (!expected) continue;
  expect(Boolean(expected.target.scrollPlan), `${tuple}: only deep targets may be conditionally skipped`);
  if (!expected.target.scrollPlan) continue;
  const sourceTuple = `${skip.contentSize}/${skip.requestedAppearance}/${skip.locale}/${expected.target.scrollPlan.sourceTarget}`;
  const sourceEntries = entries.filter((entry) => entry
    && `${entry.contentSize}/${entry.requestedAppearance}/${entry.locale}/${entry.target}` === sourceTuple);
  expect(sourceEntries.length === 1, `${tuple}: conditional skip must bind exactly one captured top source`);
  const sourceEntry = sourceEntries[0];
  if (!sourceEntry) continue;
  let independentlyDerivedReason = null;
  try {
    independentlyDerivedReason = conditionalDeepCaptureSkipReason(expected.target, sourceEntry.captureAcknowledgement);
  } catch (error) {
    fail(`${tuple}: source geometry is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  expect(Boolean(independentlyDerivedReason), `${tuple}: source has a meaningful scroll range and must be captured`);
  expect(skip.recordType === "conditional-deep-skip", `${tuple}: skip record type mismatch`);
  expect(skip.skipReason === independentlyDerivedReason, `${tuple}: skip reason does not match source geometry`);
  expect(skip.targetAppearancePolicy === expected.target.appearancePolicy, `${tuple}: skip appearance policy mismatch`);
  expect(isDeepStrictEqual(skip.targetScrollPlan, expected.target.scrollPlan), `${tuple}: skip scroll plan mismatch`);
  expect(isDeepStrictEqual(skip.canonicalRouteConfig, expected.routeConfig), `${tuple}: skip canonical route config mismatch`);
  expect(skip.expectedMountedRoute === expectedMountedRouteForTarget(expected.target), `${tuple}: skip mounted route mismatch`);
  expect(skip.sourceTarget === expected.target.scrollPlan.sourceTarget, `${tuple}: skip source target mismatch`);
  expect(skip.sourceTuple === sourceTuple, `${tuple}: skip source tuple mismatch`);
  expect(skip.sourceCaptureNonce === sourceEntry.captureNonce, `${tuple}: skip source nonce mismatch`);
  expect(skip.sourceScreenshotSha256 === sourceEntry.screenshotSha256, `${tuple}: skip source screenshot hash mismatch`);
  expect(isDeepStrictEqual(skip.scrollSourceAcknowledgement, sourceEntry.captureAcknowledgement), `${tuple}: skip source acknowledgement mismatch`);
  expect(skip.meaningfulScrollRangeThresholdPx === APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy.maximumSourceMaxScrollY, `${tuple}: skip threshold mismatch`);
  expect(skip.measuredMaxScrollY === Number(sourceEntry.captureAcknowledgement?.maxScrollY), `${tuple}: skip measured maximum mismatch`);
  expect(skip.scrollViewRegistered === true && sourceEntry.captureAcknowledgement?.scrollViewRegistered === true, `${tuple}: skip source scroll view was not registered`);
  expect(skip.appCaptureAttempted === false, `${tuple}: skipped app capture must not be attempted`);
  expect(skip.screenshotProduced === false, `${tuple}: skipped screenshot must not be produced`);
  expect(isDeepStrictEqual(skip.conditionalDeepCapturePolicy, APPEARANCE_MATRIX_SPEC.conditionalDeepCapturePolicy), `${tuple}: skip policy mismatch`);
  expect(skip.deepScrollStrategy === deepScrollStrategy, `${tuple}: skip strategy mismatch`);
  expect(Number.isFinite(Date.parse(skip.recordedAt)), `${tuple}: skip timestamp is invalid`);
  const expectedScreenshotPath = join(matrixRoot, skip.contentSize, skip.requestedAppearance, skip.locale, `${skip.target}.png`);
  const expectedSidecarPath = expectedScreenshotPath.replace(/\.png$/, ".json");
  const expectedSkipSidecarPath = expectedScreenshotPath.replace(/\.png$/, ".skip.json");
  expect(skip.skipSidecarPath === expectedSkipSidecarPath, `${tuple}: skip sidecar path is not canonical`);
  expect(!existsSync(expectedScreenshotPath), `${tuple}: conditionally skipped screenshot must not exist`);
  expect(!existsSync(expectedSidecarPath), `${tuple}: conditionally skipped screenshot sidecar must not exist`);
  if (!existsSync(expectedSkipSidecarPath)) {
    fail(`${tuple}: missing conditional skip sidecar`);
  } else {
    try {
      const sidecar = JSON.parse(readFileSync(expectedSkipSidecarPath, "utf8"));
      expect(isDeepStrictEqual(sidecar, skip), `${tuple}: conditional skip sidecar does not exactly match manifest record`);
    } catch (error) {
      fail(`${tuple}: conditional skip sidecar is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  expect(!entries.some((entry) => entry && `${entry.contentSize}/${entry.requestedAppearance}/${entry.locale}/${entry.target}` === tuple), `${tuple}: tuple cannot be both captured and skipped`);
}
const canonicalTupleCount = expectedTuples.size;
const expectedCount = canonicalTupleCount - skippedTuples.size;
expect(selectedTargetKeys.length > 0, "matrix must select at least one canonical target");
expect(appearances.length > 0, "matrix must select at least one canonical appearance");
expect(contentSizes.length > 0, "matrix must select at least one canonical content size");
expect(locales.length > 0, "matrix must select at least one canonical locale");
expect(manifest.targetCount === selectedTargetKeys.length, `manifest target count ${manifest.targetCount} != selected ${selectedTargetKeys.length}`);
expect(manifest.deepTargetCount === selectedTargetKeys.filter((key) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(key)?.scrollPlan).length, "manifest deep-target count mismatch");
expect(manifest.canonicalTupleCount === canonicalTupleCount, `manifest canonical tuple count ${manifest.canonicalTupleCount} != ${canonicalTupleCount}`);
expect(manifest.expectedScreenshotCount === expectedCount, `manifest expected count ${manifest.expectedScreenshotCount} != canonical ${expectedCount}`);
expect(manifest.screenshotCount === expectedCount, `manifest count ${manifest.screenshotCount} != canonical ${expectedCount}`);
expect(entries.length === expectedCount, `entry count ${entries.length} != canonical ${expectedCount}`);
expect(manifest.conditionalDeepSkipCount === skippedTuples.size, `manifest conditional skip count ${manifest.conditionalDeepSkipCount} != ${skippedTuples.size}`);
expect(manifest.evidenceRecordCount === canonicalTupleCount, `manifest evidence record count ${manifest.evidenceRecordCount} != ${canonicalTupleCount}`);
expect(entries.length + conditionalDeepSkips.length === canonicalTupleCount, "captures and conditional skips must partition the canonical tuple inventory");

expect(manifest.outputRoot === matrixRoot, `manifest output root ${manifest.outputRoot} != audited root ${matrixRoot}`);
expect(manifest.injectedBundleVerified === true, "manifest must record candidate/installed bundle verification");
expect(manifest.candidateBundleSha256 === manifest.injectedBundleSha256, "candidate and installed bundle hashes must match");
expect(manifest.candidateBundleBytes === manifest.injectedBundleBytes, "candidate and installed bundle byte counts must match");
expect(isSha256(manifest.candidateBundleSha256), "candidate bundle hash is invalid");
expect(isSha256(manifest.installedNativeExecutableSha256), "native executable hash is invalid");
expect(isSha256(manifest.appConfigSha256), "app config hash is invalid");
expect(isSha256(manifest.sourceDiffSha256), "source state hash is invalid");
expect(typeof manifest.sourceCommit === "string" && /^[0-9a-f]{40}$/i.test(manifest.sourceCommit), "source commit is invalid");
expect(typeof manifest.entropyToolVersion === "string" && manifest.entropyToolVersion.length > 0, "entropy tool identity is missing");
expect(typeof manifest.candidateAppVersion === "string" && manifest.candidateAppVersion.length > 0, "candidate app version is missing");
expect((typeof manifest.candidateBuildNumber === "string" || typeof manifest.candidateBuildNumber === "number") && String(manifest.candidateBuildNumber).length > 0, "candidate build number is missing");
expect(typeof manifest.bundleId === "string" && manifest.bundleId.length > 0, "requested bundle id is missing");
expect(typeof manifest.requestedDevice === "string" && manifest.requestedDevice.length > 0, "requested simulator selector is missing");
expect(manifest.installedNativeShellBundleId === manifest.bundleId, "installed/requested bundle id mismatch");
expect(manifest.device === manifest.deviceIdentity?.udid, "manifest device must be the resolved simulator UDID");
expect(manifest.deviceIdentity?.state === "Booted", "captured simulator must be recorded as booted");
expect(Boolean(manifest.deviceIdentity?.name), "simulator name is missing");
expect(Boolean(manifest.deviceIdentity?.deviceTypeIdentifier), "simulator device type is missing");
expect(Boolean(manifest.deviceIdentity?.runtimeIdentifier), "simulator runtime identifier is missing");
expect(Boolean(manifest.deviceIdentity?.runtimeVersion), "simulator runtime version is missing");
expect(Boolean(manifest.deviceIdentity?.runtimeBuild), "simulator runtime build is missing");
expect(manifest.deviceIdentity?.runtimePlatform === "iOS", "simulator runtime platform must be iOS");
expect(Boolean(manifest.deviceIdentity?.productFamily), "simulator product family is missing");
expect(Boolean(manifest.installedNativeShellVersion), "installed native-shell version is missing");
expect(Boolean(manifest.installedNativeShellBuild), "installed native-shell build is missing");
expect(Boolean(manifest.installedNativeExecutableName), "installed native executable name is missing");
expect(manifest.warning?.includes(`${manifest.installedNativeShellVersion} (${manifest.installedNativeShellBuild})`), "warning must identify the actual native shell");
expect(manifest.warning?.includes(`${manifest.candidateAppVersion} (${manifest.candidateBuildNumber})`), "warning must identify the candidate app config");

verifyFileIdentity({
  label: "candidate bundle",
  pathValue: manifest.candidateBundlePath,
  expectedSha256: manifest.candidateBundleSha256,
  expectedBytes: manifest.candidateBundleBytes,
});
const appConfig = verifyFileIdentity({
  label: "app config",
  pathValue: manifest.appConfigPath,
  expectedSha256: manifest.appConfigSha256,
});
if (appConfig) {
  try {
    const expo = JSON.parse(appConfig.toString("utf8")).expo;
    expect(expo?.version === manifest.candidateAppVersion, "app config candidate version mismatch");
    expect(expo?.ios?.buildNumber === manifest.candidateBuildNumber, "app config candidate build mismatch");
    expect(expo?.ios?.bundleIdentifier === manifest.bundleId, "app config bundle identifier mismatch");
  } catch (error) {
    fail(`app config is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const manifestIdentityKeys = [
  "provenanceClass",
  "auditKind",
  "visualQualityAssessment",
  "viewportPositionObservation",
  "localeResolutionObservation",
  "captureAcknowledgementSchemaVersion",
  "readinessEvidence",
  "deepScrollStrategy",
  "conditionalDeepCapturePolicy",
  "meaningfulScrollRangeThresholdPx",
  "scrollObservationConvention",
  "releaseEligible",
  "matrixSpecId",
  "matrixSpecSha256",
  "coverageMode",
  "device",
  "requestedDevice",
  "deviceIdentity",
  "bundleId",
  "installedNativeShellVersion",
  "installedNativeShellBuild",
  "installedNativeShellBundleId",
  "installedNativeExecutableName",
  "installedNativeExecutableSha256",
  "candidateAppVersion",
  "candidateBuildNumber",
  "appConfigPath",
  "appConfigSha256",
  "injectedBundleSha256",
  "injectedBundleBytes",
  "candidateBundleSha256",
  "candidateBundleBytes",
  "candidateBundlePath",
  "injectedBundleVerified",
  "sourceCommit",
  "sourceDiffSha256",
  "entropyToolVersion",
];

for (const skip of conditionalDeepSkips) {
  if (!skip || typeof skip !== "object" || Array.isArray(skip)) continue;
  const tuple = `${skip.contentSize}/${skip.requestedAppearance}/${skip.locale}/${skip.target}`;
  for (const key of manifestIdentityKeys) {
    expect(isDeepStrictEqual(skip[key], manifest[key]), `${tuple}: conditional skip ${key} differs from manifest`);
  }
}

for (const entry of entries) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    fail("manifest contains a non-object entry");
    continue;
  }
  const tuple = `${entry.contentSize}/${entry.requestedAppearance}/${entry.locale}/${entry.target}`;
  expect(!tuples.has(tuple), `duplicate matrix tuple: ${tuple}`);
  tuples.add(tuple);
  const expected = expectedTuples.get(tuple);
  expect(Boolean(expected), `unexpected canonical tuple: ${tuple}`);
  if (!expected) continue;

  const sourceEntry = expected.target.scrollPlan
    ? entries.find((candidate) => candidate
      && candidate.contentSize === entry.contentSize
      && candidate.requestedAppearance === entry.requestedAppearance
      && candidate.locale === entry.locale
      && candidate.target === expected.target.scrollPlan.sourceTarget)
    : null;
  if (expected.target.scrollPlan) expect(Boolean(sourceEntry), `${tuple}: matching top-route acknowledgement is missing`);
  const expectedContentOriginRawY = sourceEntry
    ? Number(sourceEntry.captureAcknowledgement?.rawContentOffsetY)
    : null;
  if (sourceEntry) {
    expect(Number.isFinite(expectedContentOriginRawY), `${tuple}: matching top-route raw content offset is not finite`);
  }
  let expectedScrollY = 0;
  try {
    expectedScrollY = captureScrollYForTarget(expected.target, sourceEntry?.captureAcknowledgement);
  } catch (error) {
    fail(`${tuple}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const expectedRouteConfig = {
    ...expected.routeConfig,
    ...(expectedScrollY > 0 ? { captureScrollY: expectedScrollY } : {}),
    ...(sourceEntry ? { captureOriginRawY: expectedContentOriginRawY } : {}),
    captureNonce: entry.captureNonce,
    captureTarget: entry.target,
  };
  const expectedMountedRoute = expectedMountedRouteForTarget(expected.target);
  expect(entry.targetAppearancePolicy === expected.target.appearancePolicy, `${tuple}: appearance policy mismatch`);
  expect(isDeepStrictEqual(entry.targetScrollPlan, expected.target.scrollPlan), `${tuple}: scroll plan mismatch`);
  expect(isDeepStrictEqual(entry.scrollSourceAcknowledgement, sourceEntry?.captureAcknowledgement || null), `${tuple}: top-route acknowledgement mismatch`);
  expect(typeof entry.captureNonce === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.captureNonce), `${tuple}: capture nonce is not a cryptographic UUID`);
  expect(entry.expectedMountedRoute === expectedMountedRoute, `${tuple}: expected mounted route mismatch`);
  expect(entry.captureAcknowledgementSchemaVersion === 5, `${tuple}: acknowledgement schema mismatch`);
  expect(entry.readinessEvidence === "nonce-bound-app-acknowledgement", `${tuple}: readiness evidence mismatch`);
  expect(isDeepStrictEqual(entry.routeConfig, expectedRouteConfig), `${tuple}: route config is not canonical`);
  validateCaptureAcknowledgement(entry.captureAcknowledgement, {
    tuple,
    captureNonce: entry.captureNonce,
    captureTarget: entry.target,
    expectedMountedRoute,
    requestedAppearance: entry.requestedAppearance,
    requestedLocale: entry.locale,
    requestedScrollY: expectedScrollY,
    expectedContentOriginRawY,
  });
  if (sourceEntry) {
    expect(Math.abs(Number(entry.captureAcknowledgement?.contentHeight) - Number(sourceEntry.captureAcknowledgement?.contentHeight)) <= 2, `${tuple}: deep/top content heights differ`);
    expect(Math.abs(Number(entry.captureAcknowledgement?.viewportHeight) - Number(sourceEntry.captureAcknowledgement?.viewportHeight)) <= 2, `${tuple}: deep/top viewport heights differ`);
    expect(Math.abs(Number(entry.captureAcknowledgement?.rawMaxScrollY) - Number(sourceEntry.captureAcknowledgement?.rawMaxScrollY)) <= 2, `${tuple}: deep/top raw scroll ranges differ`);
    expect(Math.abs(Number(entry.captureAcknowledgement?.maxScrollY) - Number(sourceEntry.captureAcknowledgement?.maxScrollY)) <= 2, `${tuple}: deep/top scroll ranges differ`);
  }
  expect(entry.requestedScrollY === expectedScrollY, `${tuple}: requested scroll offset mismatch`);
  expect(entry.scrollPositionSource === entry.captureAcknowledgement?.scrollPositionSource, `${tuple}: scroll-position source evidence mismatch`);
  expect(entry.captureOriginRawY === expectedContentOriginRawY, `${tuple}: configured capture origin evidence mismatch`);
  expect(entry.rawContentOffsetY === entry.captureAcknowledgement?.rawContentOffsetY, `${tuple}: raw content offset evidence mismatch`);
  expect(entry.contentInsetTop === entry.captureAcknowledgement?.contentInsetTop, `${tuple}: content inset evidence mismatch`);
  expect(entry.contentOriginRawY === entry.captureAcknowledgement?.contentOriginRawY, `${tuple}: content origin evidence mismatch`);
  expect(entry.rawMaxScrollY === entry.captureAcknowledgement?.rawMaxScrollY, `${tuple}: raw maximum scroll evidence mismatch`);
  expect(entry.maxScrollY === entry.captureAcknowledgement?.maxScrollY, `${tuple}: semantic maximum scroll evidence mismatch`);
  expect(entry.observedScrollYConvention === "raw-minus-top-origin" && entry.observedScrollYConvention === entry.captureAcknowledgement?.observedScrollYConvention, `${tuple}: observed scroll convention mismatch`);
  expect(entry.observedScrollY === entry.captureAcknowledgement?.observedScrollY && entry.observedScrollYEvidence === "app-acknowledgement-v5", `${tuple}: observed scroll evidence mismatch`);
  expect(entry.observedSystemAppearance === entry.requestedAppearance, `${tuple}: requested/observed system appearance mismatch`);
  expect(entry.observedContentSize === entry.contentSize, `${tuple}: requested/observed content size mismatch`);
  expect(entry.resolvedAppAppearance === entry.captureAcknowledgement?.resolvedAppearance && entry.resolvedAppAppearanceEvidence === "app-acknowledgement-v5", `${tuple}: app-appearance evidence mismatch`);
  expect(entry.resolvedLocale === entry.captureAcknowledgement?.resolvedLocale && entry.resolvedLocaleEvidence === "app-acknowledgement-v5", `${tuple}: resolved locale evidence mismatch`);
  expect(entry.resolvedRtl === entry.captureAcknowledgement?.rtl && entry.resolvedRtlEvidence === "app-acknowledgement-v5", `${tuple}: resolved RTL evidence mismatch`);
  expect(entry.rtlExpected === (entry.locale === "ar"), `${tuple}: RTL expectation mismatch`);
  for (const key of manifestIdentityKeys) {
    expect(isDeepStrictEqual(entry[key], manifest[key]), `${tuple}: ${key} differs from manifest`);
  }
  expect(Number.isFinite(Date.parse(entry.capturedAt)), `${tuple}: capture timestamp is invalid`);
  expect(Date.parse(entry.capturedAt) >= Date.parse(entry.captureAcknowledgement?.acknowledgedAt), `${tuple}: screenshot timestamp predates acknowledgement`);

  const expectedScreenshotPath = join(
    matrixRoot,
    entry.contentSize,
    entry.requestedAppearance,
    entry.locale,
    `${entry.target}.png`,
  );
  expect(entry.screenshotPath === expectedScreenshotPath, `${tuple}: screenshot path is not canonical`);
  const screenshotPath = expectedScreenshotPath;
  if (!existsSync(screenshotPath)) {
    fail(`${tuple}: missing screenshot ${screenshotPath}`);
    continue;
  }

  const bytes = readFileSync(screenshotPath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  const dimensions = pngDimensions(bytes);
  expect(actualSha256 === entry.screenshotSha256, `${tuple}: screenshot hash mismatch`);
  expect(statSync(screenshotPath).size === entry.screenshotBytes, `${tuple}: screenshot byte count mismatch`);
  expect(dimensions.width === entry.width && dimensions.height === entry.height, `${tuple}: PNG dimensions mismatch`);
  expect(entry.width > 0 && entry.height > 0, `${tuple}: invalid dimensions`);
  expect(Number.isFinite(entry.imageEntropy) && entry.imageEntropy >= 0.05, `${tuple}: blank-frame entropy ${entry.imageEntropy}`);

  minimumEntropy = Math.min(minimumEntropy, entry.imageEntropy);
  if (entry.retriedBlankCapture) retriedBlankCaptures += 1;
  const duplicateGroup = screenshotHashes.get(actualSha256) || [];
  duplicateGroup.push({ tuple, entry });
  screenshotHashes.set(actualSha256, duplicateGroup);

  const sidecarPath = screenshotPath.replace(/\.png$/i, ".json");
  if (!existsSync(sidecarPath)) {
    fail(`${tuple}: missing JSON sidecar`);
  } else {
    try {
      const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
      expect(isDeepStrictEqual(sidecar, entry), `${tuple}: sidecar does not exactly match manifest entry`);
    } catch (error) {
      fail(`${tuple}: sidecar is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

for (const tuple of expectedTuples.keys()) {
  if (skippedTuples.has(tuple)) expect(!tuples.has(tuple), `conditionally skipped tuple was also captured: ${tuple}`);
  else expect(tuples.has(tuple), `missing canonical tuple: ${tuple}`);
}

for (const [hash, group] of screenshotHashes) {
  if (group.length < 2) continue;
  if (!isAllowedAlwaysDarkDuplicate(group)) {
    fail(`pixel-identical screenshot ${hash} is reused by ${group.map((item) => item.tuple).join(", ")}`);
  }
}

if (retriedBlankCaptures > 0) {
  warnings.push(`${retriedBlankCaptures} blank first-frame capture(s) recovered on retry`);
}
if (conditionalDeepSkips.length > 0) {
  warnings.push(`${conditionalDeepSkips.length} deep tuple(s) were evidenced as not applicable because the matching top capture had no meaningful scroll range`);
}

const integrityPassed = failures.length === 0;
const result = integrityPassed
  ? computedCoverageMode === "full" ? "INTEGRITY_PASS_FULL" : "INTEGRITY_PASS_PARTIAL"
  : "INTEGRITY_FAIL";
const report = {
  generatedAt: new Date().toISOString(),
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
  matrixRoot,
  provenanceClass: manifest.provenanceClass,
  matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
  matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
  coverageMode: computedCoverageMode,
  fullCoverageRequired: requireFull,
  locales,
  contentSizes,
  appearances,
  deepTargetCount: selectedTargetKeys.filter((key) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(key)?.scrollPlan).length,
  canonicalTupleCount,
  conditionalDeepSkipCount: conditionalDeepSkips.length,
  evidenceRecordCount: entries.length + conditionalDeepSkips.length,
  candidateAppVersion: manifest.candidateAppVersion,
  candidateBuildNumber: manifest.candidateBuildNumber,
  sourceCommit: manifest.sourceCommit,
  sourceDiffSha256: manifest.sourceDiffSha256,
  injectedBundleSha256: manifest.injectedBundleSha256,
  expectedCount,
  checkedCount: entries.length,
  uniqueScreenshotHashes: screenshotHashes.size,
  minimumEntropy: Number.isFinite(minimumEntropy) ? Number(minimumEntropy.toFixed(6)) : null,
  retriedBlankCaptures,
  warnings,
  failures,
  result,
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!integrityPassed) {
  console.error(`Appearance matrix integrity audit failed (${failures.length} issue(s)).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Appearance matrix ${result}: ${report.checkedCount} captures, ${report.conditionalDeepSkipCount} evidenced deep skips, ${report.uniqueScreenshotHashes} unique hashes, minimum entropy ${report.minimumEntropy}.`,
);
console.log("Visual quality was not assessed; this simulator matrix is not release eligible.");
if (warnings.length) console.log(`Warning: ${warnings.join("; ")}`);
console.log(`Report: ${reportPath}`);

function validatedStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    fail(`${label} must be a non-empty string array`);
    return [];
  }
  return value;
}

function validateUniqueAllowed(label, values, allowedValues) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) fail(`${label} contains duplicate value(s): ${[...new Set(duplicates)].join(", ")}`);
  const unknown = values.filter((value) => !allowedValues.includes(value));
  if (unknown.length) fail(`${label} contains unsupported value(s): ${unknown.join(", ")}`);
}

function verifyFileIdentity({ label, pathValue, expectedSha256, expectedBytes }) {
  if (typeof pathValue !== "string" || !pathValue) {
    fail(`${label} path is missing`);
    return null;
  }
  if (resolve(pathValue) !== pathValue) {
    fail(`${label} path must be absolute`);
    return null;
  }
  if (!existsSync(pathValue) || !statSync(pathValue).isFile()) {
    fail(`${label} artifact is missing: ${pathValue}`);
    return null;
  }
  const bytes = readFileSync(pathValue);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  expect(actualSha256 === expectedSha256, `${label} artifact hash mismatch`);
  if (expectedBytes != null) expect(bytes.length === expectedBytes, `${label} artifact byte count mismatch`);
  return bytes;
}

function validateCaptureAcknowledgement(acknowledgement, expected) {
  const prefix = `${expected.tuple}: acknowledgement`;
  if (!acknowledgement || typeof acknowledgement !== "object" || Array.isArray(acknowledgement)) {
    fail(`${prefix} must be an object`);
    return;
  }
  expect(acknowledgement.schemaVersion === 5, `${prefix} schema must be 5`);
  expect(acknowledgement.captureNonce === expected.captureNonce, `${prefix} nonce mismatch`);
  expect(acknowledgement.captureTarget === expected.captureTarget, `${prefix} target mismatch`);
  expect(acknowledgement.mountedRoute === expected.expectedMountedRoute, `${prefix} mounted-route mismatch`);
  expect(acknowledgement.resolvedAppearance === expected.requestedAppearance, `${prefix} app-appearance mismatch`);
  expect(acknowledgement.resolvedSystemAppearance === expected.requestedAppearance, `${prefix} system-appearance mismatch`);
  expect(acknowledgement.requestedLocale === expected.requestedLocale, `${prefix} requested-locale mismatch`);
  expect(acknowledgement.resolvedLocale === expected.requestedLocale, `${prefix} resolved-locale mismatch`);
  expect(acknowledgement.rtl === (expected.requestedLocale === "ar"), `${prefix} RTL mismatch`);
  expect(acknowledgement.requestedScrollY === expected.requestedScrollY, `${prefix} requested-scroll mismatch`);
  expect(acknowledgement.observedScrollYConvention === "raw-minus-top-origin", `${prefix} observed-scroll convention mismatch`);
  const isDeepCapture = expected.expectedContentOriginRawY != null;
  const scrollPositionSource = acknowledgement.scrollPositionSource;
  expect(scrollPositionSource === "native-scroll-event" || scrollPositionSource === "implicit-zero-content-offset", `${prefix} scroll-position source is invalid`);
  if (isDeepCapture) {
    expect(scrollPositionSource === "native-scroll-event", `${prefix} deep capture must use a native scroll event`);
  }
  const rawContentOffsetY = Number(acknowledgement.rawContentOffsetY);
  const contentInsetTop = Number(acknowledgement.contentInsetTop);
  const contentOriginRawY = Number(acknowledgement.contentOriginRawY);
  const observedScrollY = Number(acknowledgement.observedScrollY);
  const contentHeight = Number(acknowledgement.contentHeight);
  const viewportHeight = Number(acknowledgement.viewportHeight);
  const rawMaxScrollY = Number(acknowledgement.rawMaxScrollY);
  const maxScrollY = Number(acknowledgement.maxScrollY);
  expect([rawContentOffsetY, contentInsetTop, contentOriginRawY, observedScrollY, contentHeight, viewportHeight, rawMaxScrollY, maxScrollY].every(Number.isFinite), `${prefix} geometry must be finite`);
  expect(contentHeight > 0 && viewportHeight > 0 && rawMaxScrollY >= 0 && maxScrollY >= 0 && observedScrollY >= 0, `${prefix} geometry must be positive`);
  if (scrollPositionSource === "implicit-zero-content-offset") {
    expect(acknowledgement.requestedScrollY === 0, `${prefix} implicit zero offset requires an exact zero request`);
    expect(rawContentOffsetY === 0 && contentOriginRawY === 0 && observedScrollY === 0, `${prefix} implicit zero offset must report exact zero raw, origin, and observed offsets`);
  }
  if (!isDeepCapture) {
    expect(Math.abs(contentOriginRawY - rawContentOffsetY) <= 0.01, `${prefix} top origin does not equal its raw offset`);
  } else {
    expect(Math.abs(contentOriginRawY - expected.expectedContentOriginRawY) <= 0.01, `${prefix} deep origin does not equal source top raw offset`);
  }
  expect(Math.abs(observedScrollY - Math.max(0, rawContentOffsetY - contentOriginRawY)) <= 0.01, `${prefix} observed scroll is not raw offset minus content origin`);
  expect(Math.abs(rawMaxScrollY - Math.max(0, contentHeight - viewportHeight)) <= 2, `${prefix} rawMaxScrollY does not match geometry`);
  expect(Math.abs(maxScrollY - Math.max(0, rawMaxScrollY - contentOriginRawY)) <= 2, `${prefix} maxScrollY does not match raw maximum minus content origin`);
  expect(rawContentOffsetY <= rawMaxScrollY + 2, `${prefix} raw content offset exceeds raw maximum`);
  expect(observedScrollY <= maxScrollY + 2, `${prefix} observed scroll exceeds maximum`);
  expect(acknowledgement.scrollApplied === true, `${prefix} scrollApplied must be true`);
  if (expected.requestedScrollY <= 1) {
    expect(observedScrollY <= 2, `${prefix} top capture is not at the top`);
  } else {
    expect(maxScrollY >= expected.requestedScrollY - 2, `${prefix} requested scroll exceeds maximum`);
    expect(Math.abs(observedScrollY - expected.requestedScrollY) <= 2, `${prefix} observed scroll does not match request`);
  }
  expect(Number.isFinite(Date.parse(acknowledgement.acknowledgedAt)), `${prefix} timestamp is invalid`);
}

function isAllowedAlwaysDarkDuplicate(group) {
  if (group.length !== 2) return false;
  const [first, second] = group.map((item) => item.entry);
  if (first.target !== second.target || first.contentSize !== second.contentSize || first.locale !== second.locale) return false;
  if (!hasExactMembers(group.map((item) => item.entry.requestedAppearance), ["light", "dark"])) return false;
  return APPEARANCE_MATRIX_TARGETS_BY_KEY.get(first.target)?.appearancePolicy === "always-dark";
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.subarray(12, 16).toString("ascii") !== "IHDR") {
    return { width: 0, height: 0 };
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
