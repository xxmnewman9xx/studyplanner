#!/usr/bin/env node

import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
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
const canonicalBaseTargetKeys = APPEARANCE_MATRIX_SPEC.targets
  .filter((target) => !target.scrollPlan)
  .map((target) => target.key);
const MANIFEST_IDENTITY_KEYS = [
  "provenanceClass",
  "auditKind",
  "visualQualityAssessment",
  "viewportPositionObservation",
  "localeResolutionObservation",
  "captureAcknowledgementSchemaVersion",
  "readinessEvidence",
  "sweepStrategy",
  "scrollObservationConvention",
  "sourceOriginEvidence",
  "deepCapturePositionSource",
  "maximumStrideFraction",
  "plannedStrideFraction",
  "minimumOverlapFraction",
  "scrollTolerancePx",
  "releaseEligible",
  "warning",
  "sweepSpecId",
  "sweepSpecSchemaVersion",
  "matrixSpecId",
  "matrixSpecSha256",
  "matrixSpecSchemaVersion",
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

const cliArgs = process.argv.slice(2);
if (cliArgs.includes("--help")) {
  console.log("Usage: node scripts/audit-scroll-sweep.mjs [sweep-root] [--dry-run|--self-test]");
  console.log("Independently verifies evidence integrity and complete vertical coverage; it does not assess visual quality.");
  process.exit(0);
}
const knownOptions = ["--dry-run", "--self-test"];
const unknownOptions = cliArgs.filter((argument) => argument.startsWith("--") && !knownOptions.includes(argument));
if (unknownOptions.length) throw new Error(`unknown option(s): ${unknownOptions.join(", ")}`);
const positionalArgs = cliArgs.filter((argument) => !argument.startsWith("--"));
if (positionalArgs.length > 1) throw new Error("provide at most one sweep root");
if (cliArgs.includes("--dry-run") && cliArgs.includes("--self-test")) {
  throw new Error("use either --dry-run or --self-test, not both");
}
if (cliArgs.includes("--self-test")) {
  runSelfTests();
  process.exit(0);
}
if (cliArgs.includes("--dry-run")) {
  console.log(JSON.stringify({
    sweepSpecId: SWEEP_SPEC_ID,
    sweepSpecSchemaVersion: SWEEP_SPEC_SCHEMA_VERSION,
    matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
    matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
    provenanceClass: PROVENANCE_CLASS,
    releaseEligible: false,
    readinessEvidence: "nonce-bound-app-acknowledgement",
    captureAcknowledgementSchemaVersion: CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION,
    sweepStrategy: "top-dynamic-even-stride-exact-end",
    maximumStrideFraction: MAXIMUM_STRIDE_FRACTION,
    plannedStrideFraction: PLANNED_STRIDE_FRACTION,
    minimumOverlapFraction: MINIMUM_OVERLAP_FRACTION,
    canonicalBaseTargetCount: canonicalBaseTargetKeys.length,
    canonicalBaseTargetKeys,
    environmentFiltersAreAssertions: true,
  }, null, 2));
  process.exit(0);
}

const sweepRoot = resolve(positionalArgs[0] || "/tmp/studyplanner-scroll-sweep");
const manifestPath = join(sweepRoot, "manifest.json");
const reportPath = join(sweepRoot, "audit-report.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const failures = [];
const warnings = [];
const seenCaptureNonces = new Set();
const seenEntryIdentities = new Set();
const screenshotHashes = new Map();
let minimumEntropy = Number.POSITIVE_INFINITY;
let retriedBlankCaptures = 0;
let maximumObservedStrideFraction = 0;
let minimumObservedOverlapFraction = 1;

const fail = (message) => failures.push(message);
const expect = (condition, message) => {
  if (!condition) fail(message);
};

const appearances = validatedStringArray(manifest.appearances, "manifest appearances");
const contentSizes = validatedStringArray(manifest.contentSizes, "manifest content sizes");
const locales = validatedStringArray(manifest.locales, "manifest locales");
const selectedTargetKeys = validatedStringArray(manifest.selectedTargetKeys, "manifest selected target keys");
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const sweepGroups = Array.isArray(manifest.sweepGroups) ? manifest.sweepGroups : [];
if (!Array.isArray(manifest.entries)) fail("manifest entries must be an array");
if (!Array.isArray(manifest.sweepGroups)) fail("manifest sweepGroups must be an array");

validateUniqueAllowed("manifest appearances", appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances);
validateUniqueAllowed("manifest content sizes", contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes);
validateUniqueAllowed("manifest locales", locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);
validateBaseTargetSelection(selectedTargetKeys);
for (const locale of locales) {
  expect(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(locale), `manifest locale is invalid: ${locale}`);
}

assertEnvironmentFilter("STUDYPLANNER_SWEEP_TARGETS", selectedTargetKeys, canonicalBaseTargetKeys, true);
assertEnvironmentFilter("STUDYPLANNER_SWEEP_APPEARANCES", appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances);
assertEnvironmentFilter("STUDYPLANNER_SWEEP_CONTENT_SIZES", contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes);
assertEnvironmentFilter("STUDYPLANNER_SWEEP_LOCALES", locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales);

const computedCoverageMode = hasExactMembers(selectedTargetKeys, canonicalBaseTargetKeys)
  && hasExactMembers(appearances, APPEARANCE_MATRIX_SPEC.fullCoverage.appearances)
  && hasExactMembers(contentSizes, APPEARANCE_MATRIX_SPEC.fullCoverage.contentSizes)
  && hasExactMembers(locales, APPEARANCE_MATRIX_SPEC.fullCoverage.locales)
  ? "full-base-inventory"
  : "partial-base-inventory";
if (computedCoverageMode !== "full-base-inventory") {
  warnings.push("partial canonical base-target sweep: selected tuples may pass integrity, but full base inventory is not claimed");
}

expect(manifest.provenanceClass === PROVENANCE_CLASS, "manifest must be marked do-not-upload");
expect(manifest.auditKind === "integrity-and-scroll-coverage-only", "manifest audit kind mismatch");
expect(manifest.visualQualityAssessment === "not_performed", "manifest must state that visual quality was not assessed");
expect(manifest.viewportPositionObservation === "app_acknowledgement_v5", "manifest viewport evidence mismatch");
expect(manifest.localeResolutionObservation === "app_acknowledgement_v5", "manifest locale evidence mismatch");
expect(manifest.captureAcknowledgementSchemaVersion === CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION, "manifest acknowledgement schema mismatch");
expect(manifest.readinessEvidence === "nonce-bound-app-acknowledgement", "manifest readiness evidence mismatch");
expect(manifest.sweepStrategy === "top-dynamic-even-stride-exact-end", "manifest sweep strategy mismatch");
expect(manifest.scrollObservationConvention === "raw-minus-top-origin", "manifest scroll convention mismatch");
expect(manifest.sourceOriginEvidence === "matching-top-app-acknowledgement-v5", "manifest source-origin evidence mismatch");
expect(manifest.deepCapturePositionSource === "native-scroll-event", "manifest deep position source mismatch");
expect(manifest.maximumStrideFraction === MAXIMUM_STRIDE_FRACTION, "manifest maximum stride mismatch");
expect(manifest.plannedStrideFraction === PLANNED_STRIDE_FRACTION, "manifest planned stride mismatch");
expect(manifest.minimumOverlapFraction === MINIMUM_OVERLAP_FRACTION, "manifest minimum overlap mismatch");
expect(manifest.scrollTolerancePx === SCROLL_TOLERANCE_PX, "manifest scroll tolerance mismatch");
expect(manifest.releaseEligible === false, "simulator sweep must never be release eligible");
expect(Boolean(manifest.warning?.includes("Never use")), "manifest must carry an explicit upload warning");
expect(manifest.sweepSpecId === SWEEP_SPEC_ID, "sweep spec id mismatch");
expect(manifest.sweepSpecSchemaVersion === SWEEP_SPEC_SCHEMA_VERSION, "sweep spec schema mismatch");
expect(manifest.matrixSpecId === APPEARANCE_MATRIX_SPEC.id, "matrix spec id mismatch");
expect(manifest.matrixSpecSha256 === APPEARANCE_MATRIX_SPEC_SHA256, "matrix spec hash mismatch");
expect(manifest.matrixSpecSchemaVersion === APPEARANCE_MATRIX_SPEC.schemaVersion, "matrix spec schema mismatch");
expect(manifest.coverageMode === computedCoverageMode, `manifest coverage mode ${manifest.coverageMode} != computed ${computedCoverageMode}`);
expect(isDeepStrictEqual(manifest.canonicalBaseTargetKeys, canonicalBaseTargetKeys), "canonical base-target inventory mismatch");
expect(manifest.outputRoot === sweepRoot, `manifest output root ${manifest.outputRoot} != audited root ${sweepRoot}`);

validateProvenanceIdentity(manifest);
verifyFileIdentity({
  label: "candidate bundle",
  pathValue: manifest.candidateBundlePath,
  expectedSha256: manifest.candidateBundleSha256,
  expectedBytes: manifest.candidateBundleBytes,
});
const appConfigBytes = verifyFileIdentity({
  label: "app config",
  pathValue: manifest.appConfigPath,
  expectedSha256: manifest.appConfigSha256,
});
if (appConfigBytes) {
  try {
    const expo = JSON.parse(appConfigBytes.toString("utf8")).expo;
    expect(expo?.version === manifest.candidateAppVersion, "app config candidate version mismatch");
    expect(expo?.ios?.buildNumber === manifest.candidateBuildNumber, "app config candidate build mismatch");
    expect(expo?.ios?.bundleIdentifier === manifest.bundleId, "app config bundle identifier mismatch");
  } catch (error) {
    fail(`app config is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const expectedGroups = new Map();
for (const contentSize of contentSizes) {
  for (const appearance of appearances) {
    for (const locale of locales) {
      for (const targetKey of selectedTargetKeys) {
        const target = APPEARANCE_MATRIX_TARGETS_BY_KEY.get(targetKey);
        if (!target) continue;
        const groupKey = `${contentSize}/${appearance}/${locale}/${targetKey}`;
        expectedGroups.set(groupKey, { contentSize, appearance, locale, target });
      }
    }
  }
}

expect(selectedTargetKeys.length > 0, "sweep must select at least one canonical base target");
expect(appearances.length > 0, "sweep must select at least one canonical appearance");
expect(contentSizes.length > 0, "sweep must select at least one canonical content size");
expect(locales.length > 0, "sweep must select at least one canonical locale");
expect(manifest.expectedSweepGroupCount === expectedGroups.size, `manifest expected group count ${manifest.expectedSweepGroupCount} != canonical ${expectedGroups.size}`);
expect(manifest.sweepGroupCount === expectedGroups.size, `manifest group count ${manifest.sweepGroupCount} != canonical ${expectedGroups.size}`);
expect(sweepGroups.length === expectedGroups.size, `sweepGroups length ${sweepGroups.length} != canonical ${expectedGroups.size}`);
expect(manifest.screenshotCount === entries.length, "manifest screenshot count does not match entries");

const summariesByGroup = new Map();
for (const summary of sweepGroups) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    fail("manifest contains a non-object sweep summary");
    continue;
  }
  expect(!summariesByGroup.has(summary.groupKey), `duplicate sweep summary: ${summary.groupKey}`);
  summariesByGroup.set(summary.groupKey, summary);
  expect(expectedGroups.has(summary.groupKey), `unexpected sweep summary: ${summary.groupKey}`);
}

for (const [groupKey, expectedGroup] of expectedGroups) {
  const targetEntries = entries
    .filter((entry) => entry?.groupKey === groupKey)
    .sort((left, right) => Number(left.sweepIndex) - Number(right.sweepIndex));
  const summary = summariesByGroup.get(groupKey);
  expect(Boolean(summary), `${groupKey}: missing sweep summary`);
  if (!targetEntries.length) {
    fail(`${groupKey}: no captures`);
    continue;
  }
  const topEntry = targetEntries[0];
  const topAcknowledgement = topEntry.captureAcknowledgement;
  const sourceOriginRawY = Number(topAcknowledgement?.rawContentOffsetY);
  const semanticMaxScrollY = Number(topAcknowledgement?.maxScrollY);
  const viewportHeight = Number(topAcknowledgement?.viewportHeight);
  const expectedOffsets = safePlannedOffsets(groupKey, semanticMaxScrollY, viewportHeight);
  const expectedMountedRoute = expectedMountedRouteForTarget(expectedGroup.target);
  const groupScreenshotHashes = new Set();
  const observedOffsets = [];
  const widths = new Set();
  const heights = new Set();

  expect(Number.isFinite(sourceOriginRawY), `${groupKey}: top source origin must be finite`);
  expect(Number.isFinite(semanticMaxScrollY) && semanticMaxScrollY >= 0, `${groupKey}: semantic maximum must be non-negative and finite`);
  expect(Number.isFinite(viewportHeight) && viewportHeight > 0, `${groupKey}: viewport height must be positive and finite`);
  expect(semanticMaxScrollY <= MAXIMUM_APP_CAPTURE_SCROLL_Y, `${groupKey}: semantic range exceeds app capture contract`);
  expect(targetEntries.length === expectedOffsets.length, `${groupKey}: capture count ${targetEntries.length} != independently planned ${expectedOffsets.length}`);

  for (let index = 0; index < targetEntries.length; index += 1) {
    const entry = targetEntries[index];
    const expectedOffset = expectedOffsets[index];
    const previous = targetEntries[index - 1] || null;
    const expectedPositionKind = expectedOffsets.length === 1
      ? "top-and-end"
      : index === 0 ? "top" : index === expectedOffsets.length - 1 ? "end" : "intermediate";
    const expectedCaptureTarget = canonicalCaptureTarget(expectedGroup.target.key, index, expectedOffset);
    const expectedRouteConfig = {
      ...canonicalRouteConfig(expectedGroup.target, {
        locale: expectedGroup.locale,
        appearance: expectedGroup.appearance,
      }),
      ...(expectedOffset > 0 ? { captureScrollY: expectedOffset } : {}),
      ...(index > 0 ? { captureOriginRawY: sourceOriginRawY } : {}),
      captureNonce: entry.captureNonce,
      captureTarget: expectedCaptureTarget,
    };
    const entryIdentity = `${groupKey}/${entry.sweepIndex}`;
    expect(!seenEntryIdentities.has(entryIdentity), `${groupKey}: duplicate sweep index ${entry.sweepIndex}`);
    seenEntryIdentities.add(entryIdentity);
    expect(entry.sweepIndex === index, `${groupKey}: sweep indices must be contiguous from zero`);
    expect(entry.target === expectedGroup.target.key, `${entryIdentity}: target mismatch`);
    expect(isDeepStrictEqual(entry.targetConfig, expectedGroup.target.config), `${entryIdentity}: target config mismatch`);
    expect(entry.targetAppearancePolicy === expectedGroup.target.appearancePolicy, `${entryIdentity}: appearance policy mismatch`);
    expect(entry.contentSize === expectedGroup.contentSize, `${entryIdentity}: content size mismatch`);
    expect(entry.requestedAppearance === expectedGroup.appearance, `${entryIdentity}: requested appearance mismatch`);
    expect(entry.locale === expectedGroup.locale, `${entryIdentity}: locale mismatch`);
    expect(entry.expectedMountedRoute === expectedMountedRoute, `${entryIdentity}: mounted-route expectation mismatch`);
    expect(typeof entry.captureNonce === "string" && isUuidV4(entry.captureNonce), `${entryIdentity}: capture nonce is not a cryptographic UUID`);
    expect(!seenCaptureNonces.has(entry.captureNonce), `${entryIdentity}: capture nonce is reused`);
    seenCaptureNonces.add(entry.captureNonce);
    expect(entry.captureTarget === expectedCaptureTarget, `${entryIdentity}: capture target is not canonical`);
    expect(isDeepStrictEqual(entry.routeConfig, expectedRouteConfig), `${entryIdentity}: route config is not canonical`);
    expect(entry.sweepCaptureCount === expectedOffsets.length, `${entryIdentity}: sweep capture count mismatch`);
    expect(entry.sweepPositionKind === expectedPositionKind, `${entryIdentity}: sweep position kind mismatch`);
    expect(entry.requestedNormalizedOffsetY === expectedOffset, `${entryIdentity}: requested normalized offset is not exact`);
    expect(entry.normalizedOffsetEvidence === "app-acknowledgement-v5-raw-minus-top-origin", `${entryIdentity}: normalized offset evidence mismatch`);
    expect(entry.sourceTopCaptureNonce === topEntry.captureNonce, `${entryIdentity}: source top nonce mismatch`);
    expect(isDeepStrictEqual(entry.sourceTopAcknowledgement, topAcknowledgement), `${entryIdentity}: source top acknowledgement mismatch`);
    expect(entry.sourceOriginRawY === sourceOriginRawY, `${entryIdentity}: source origin mismatch`);
    expect(entry.semanticMaxScrollY === semanticMaxScrollY, `${entryIdentity}: semantic maximum mismatch`);
    expect(isDeepStrictEqual(entry.plannedNormalizedOffsetsY, expectedOffsets), `${entryIdentity}: planned offsets mismatch`);
    expect(entry.captureOriginRawY === (index > 0 ? sourceOriginRawY : null), `${entryIdentity}: configured capture origin mismatch`);
    expect(entry.launchStartedAt && Number.isFinite(Date.parse(entry.launchStartedAt)), `${entryIdentity}: launch timestamp is invalid`);
    validateCaptureAcknowledgement(entry.captureAcknowledgement, {
      entryIdentity,
      captureNonce: entry.captureNonce,
      captureTarget: expectedCaptureTarget,
      expectedMountedRoute,
      requestedAppearance: expectedGroup.appearance,
      requestedLocale: expectedGroup.locale,
      requestedScrollY: expectedOffset,
      expectedContentOriginRawY: index > 0 ? sourceOriginRawY : null,
      launchStartedAt: entry.launchStartedAt,
      capturedAt: entry.capturedAt,
    });
    validateEntryAcknowledgementProjection(entry, entryIdentity);
    if (index > 0) validateMatchingSweepGeometry(entry.captureAcknowledgement, topAcknowledgement, entryIdentity);

    const observedOffset = Number(entry.captureAcknowledgement?.observedScrollY);
    observedOffsets.push(observedOffset);
    expect(entry.observedNormalizedOffsetY === observedOffset, `${entryIdentity}: observed normalized offset projection mismatch`);
    const requestedStride = previous ? expectedOffset - expectedOffsets[index - 1] : 0;
    const observedStride = previous ? observedOffset - observedOffsets[index - 1] : 0;
    const overlap = previous ? Math.max(0, 1 - observedStride / viewportHeight) : 1;
    expect(closeEnough(entry.requestedStrideFromPreviousY, requestedStride, 1e-9), `${entryIdentity}: requested stride projection mismatch`);
    expect(closeEnough(entry.observedStrideFromPreviousY, observedStride, 1e-9), `${entryIdentity}: observed stride projection mismatch`);
    expect(closeEnough(entry.observedOverlapFraction, overlap, 1e-9), `${entryIdentity}: overlap projection mismatch`);

    if (previous) {
      const strideFraction = observedStride / viewportHeight;
      maximumObservedStrideFraction = Math.max(maximumObservedStrideFraction, strideFraction);
      minimumObservedOverlapFraction = Math.min(minimumObservedOverlapFraction, overlap);
      expect(observedStride > 0.01, `${entryIdentity}: observed normalized position is not unique/increasing`);
      expect(strideFraction <= MAXIMUM_STRIDE_FRACTION, `${entryIdentity}: observed stride ${(strideFraction * 100).toFixed(2)}% exceeds 72% viewport`);
      expect(overlap >= MINIMUM_OVERLAP_FRACTION, `${entryIdentity}: observed overlap ${(overlap * 100).toFixed(2)}% is below 28%`);
    }

    for (const key of MANIFEST_IDENTITY_KEYS) {
      expect(isDeepStrictEqual(entry[key], manifest[key]), `${entryIdentity}: ${key} differs from manifest`);
    }
    expect(Number.isFinite(Date.parse(entry.capturedAt)), `${entryIdentity}: capture timestamp is invalid`);
    expect(Date.parse(entry.capturedAt) >= Date.parse(entry.captureAcknowledgement?.acknowledgedAt), `${entryIdentity}: screenshot predates acknowledgement`);

    const expectedScreenshotPath = join(
      sweepRoot,
      expectedGroup.contentSize,
      expectedGroup.appearance,
      expectedGroup.locale,
      expectedGroup.target.key,
      `${String(index).padStart(3, "0")}.png`,
    );
    const expectedSidecarPath = expectedScreenshotPath.replace(/\.png$/i, ".json");
    expect(entry.screenshotPath === expectedScreenshotPath, `${entryIdentity}: screenshot path is not canonical`);
    expect(entry.sidecarPath === expectedSidecarPath, `${entryIdentity}: sidecar path is not canonical`);
    verifyScreenshotAndSidecar(entry, entryIdentity, expectedScreenshotPath, expectedSidecarPath);
    if (isSha256(entry.screenshotSha256)) {
      groupScreenshotHashes.add(entry.screenshotSha256);
      const hashGroup = screenshotHashes.get(entry.screenshotSha256) || [];
      hashGroup.push(entryIdentity);
      screenshotHashes.set(entry.screenshotSha256, hashGroup);
    }
    widths.add(entry.width);
    heights.add(entry.height);
  }

  expect(targetEntries[0].requestedNormalizedOffsetY === 0, `${groupKey}: first capture must request exact top`);
  expect(Number(targetEntries[0].captureAcknowledgement?.observedScrollY) <= SCROLL_TOLERANCE_PX, `${groupKey}: first capture is not observed at top`);
  if (semanticMaxScrollY <= SCROLL_TOLERANCE_PX) {
    expect(targetEntries.length === 1, `${groupKey}: tolerance-only range should use one top-and-end capture`);
    expect(targetEntries[0].sweepPositionKind === "top-and-end", `${groupKey}: single capture must be top-and-end`);
  } else {
    const lastEntry = targetEntries.at(-1);
    expect(lastEntry.requestedNormalizedOffsetY === semanticMaxScrollY, `${groupKey}: final capture does not request exact semantic end`);
    expect(Math.abs(Number(lastEntry.captureAcknowledgement?.observedScrollY) - semanticMaxScrollY) <= SCROLL_TOLERANCE_PX, `${groupKey}: final capture is not observed at semantic end`);
    expect(groupScreenshotHashes.size === targetEntries.length, `${groupKey}: vertically distinct positions must have unique screenshot hashes`);
  }
  expect(widths.size === 1 && !widths.has(0), `${groupKey}: screenshot widths differ or are invalid`);
  expect(heights.size === 1 && !heights.has(0), `${groupKey}: screenshot heights differ or are invalid`);

  const coverageIssues = coverageProblems({
    offsets: observedOffsets,
    viewportHeight,
    semanticMaxScrollY,
    hashes: targetEntries.map((entry) => entry.screenshotSha256),
  });
  for (const issue of coverageIssues) fail(`${groupKey}: ${issue}`);

  if (summary) {
    const expectedSummary = {
      groupKey,
      target: expectedGroup.target.key,
      requestedAppearance: expectedGroup.appearance,
      contentSize: expectedGroup.contentSize,
      locale: expectedGroup.locale,
      expectedMountedRoute,
      sourceTopCaptureNonce: topEntry.captureNonce,
      sourceOriginRawY,
      contentHeight: topAcknowledgement.contentHeight,
      viewportHeight,
      rawMaxScrollY: topAcknowledgement.rawMaxScrollY,
      semanticMaxScrollY,
      captureCount: targetEntries.length,
      plannedNormalizedOffsetsY: expectedOffsets,
      observedNormalizedOffsetsY: observedOffsets,
      screenshotSha256s: targetEntries.map((entry) => entry.screenshotSha256),
    };
    expect(isDeepStrictEqual(summary, expectedSummary), `${groupKey}: sweep summary does not exactly match independently derived evidence`);
  }
}

for (const summaryKey of summariesByGroup.keys()) expect(expectedGroups.has(summaryKey), `unexpected summary group ${summaryKey}`);
for (const entry of entries) {
  expect(entry && typeof entry === "object" && !Array.isArray(entry), "manifest contains a non-object entry");
  if (entry?.groupKey) expect(expectedGroups.has(entry.groupKey), `unexpected entry group ${entry.groupKey}`);
}
expect(seenEntryIdentities.size === entries.length, `audited entry count ${seenEntryIdentities.size} != manifest entries ${entries.length}`);

if (retriedBlankCaptures > 0) warnings.push(`${retriedBlankCaptures} blank first-frame capture(s) recovered on retry`);
const integrityPassed = failures.length === 0;
const result = integrityPassed
  ? computedCoverageMode === "full-base-inventory" ? "SCROLL_SWEEP_INTEGRITY_PASS_FULL_BASE" : "SCROLL_SWEEP_INTEGRITY_PASS_PARTIAL"
  : "SCROLL_SWEEP_INTEGRITY_FAIL";
const report = {
  generatedAt: new Date().toISOString(),
  auditKind: "integrity-and-scroll-coverage-only",
  visualQualityAssessment: "not_performed",
  provenanceClass: manifest.provenanceClass,
  releaseEligible: false,
  sweepRoot,
  sweepSpecId: SWEEP_SPEC_ID,
  sweepSpecSchemaVersion: SWEEP_SPEC_SCHEMA_VERSION,
  matrixSpecId: APPEARANCE_MATRIX_SPEC.id,
  matrixSpecSha256: APPEARANCE_MATRIX_SPEC_SHA256,
  coverageMode: computedCoverageMode,
  readinessEvidence: "nonce-bound-app-acknowledgement",
  captureAcknowledgementSchemaVersion: CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION,
  sweepStrategy: "top-dynamic-even-stride-exact-end",
  maximumStrideFraction: MAXIMUM_STRIDE_FRACTION,
  minimumOverlapFraction: MINIMUM_OVERLAP_FRACTION,
  selectedTargetKeys,
  appearances,
  contentSizes,
  locales,
  expectedSweepGroupCount: expectedGroups.size,
  checkedSweepGroupCount: seenGroupCount(),
  checkedScreenshotCount: seenEntryIdentities.size,
  uniqueScreenshotHashes: screenshotHashes.size,
  minimumEntropy: Number.isFinite(minimumEntropy) ? Number(minimumEntropy.toFixed(6)) : null,
  maximumObservedStrideFraction: Number(maximumObservedStrideFraction.toFixed(6)),
  minimumObservedOverlapFraction: Number(minimumObservedOverlapFraction.toFixed(6)),
  retriedBlankCaptures,
  candidateAppVersion: manifest.candidateAppVersion,
  candidateBuildNumber: manifest.candidateBuildNumber,
  sourceCommit: manifest.sourceCommit,
  sourceDiffSha256: manifest.sourceDiffSha256,
  injectedBundleSha256: manifest.injectedBundleSha256,
  warnings,
  failures,
  result,
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!integrityPassed) {
  console.error(`Scroll-sweep integrity audit failed (${failures.length} issue(s)).`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Scroll sweep ${result}: ${report.checkedScreenshotCount} captures across ${report.checkedSweepGroupCount} route tuples.`);
console.log(`Maximum observed stride ${(report.maximumObservedStrideFraction * 100).toFixed(2)}%; minimum overlap ${(report.minimumObservedOverlapFraction * 100).toFixed(2)}%.`);
console.log("Visual quality was not assessed; this simulator evidence is not release eligible.");
if (warnings.length) console.log(`Warning: ${warnings.join("; ")}`);
console.log(`Report: ${reportPath}`);

function validateProvenanceIdentity(value) {
  expect(value.injectedBundleVerified === true, "manifest must record candidate/installed bundle verification");
  expect(value.candidateBundleSha256 === value.injectedBundleSha256, "candidate and installed bundle hashes must match");
  expect(value.candidateBundleBytes === value.injectedBundleBytes, "candidate and installed bundle byte counts must match");
  expect(isSha256(value.candidateBundleSha256), "candidate bundle hash is invalid");
  expect(isSha256(value.installedNativeExecutableSha256), "native executable hash is invalid");
  expect(isSha256(value.appConfigSha256), "app config hash is invalid");
  expect(isSha256(value.sourceDiffSha256), "source state hash is invalid");
  expect(typeof value.sourceCommit === "string" && /^[0-9a-f]{40}$/i.test(value.sourceCommit), "source commit is invalid");
  expect(typeof value.entropyToolVersion === "string" && value.entropyToolVersion.length > 0, "entropy tool identity is missing");
  expect(typeof value.candidateAppVersion === "string" && value.candidateAppVersion.length > 0, "candidate app version is missing");
  expect((typeof value.candidateBuildNumber === "string" || typeof value.candidateBuildNumber === "number") && String(value.candidateBuildNumber).length > 0, "candidate build number is missing");
  expect(typeof value.bundleId === "string" && value.bundleId.length > 0, "requested bundle id is missing");
  expect(typeof value.requestedDevice === "string" && value.requestedDevice.length > 0, "requested simulator selector is missing");
  expect(value.installedNativeShellBundleId === value.bundleId, "installed/requested bundle id mismatch");
  expect(value.device === value.deviceIdentity?.udid, "manifest device must be the resolved simulator UDID");
  expect(value.deviceIdentity?.state === "Booted", "captured simulator must be recorded as booted");
  expect(Boolean(value.deviceIdentity?.name), "simulator name is missing");
  expect(Boolean(value.deviceIdentity?.deviceTypeIdentifier), "simulator device type is missing");
  expect(Boolean(value.deviceIdentity?.runtimeIdentifier), "simulator runtime identifier is missing");
  expect(Boolean(value.deviceIdentity?.runtimeVersion), "simulator runtime version is missing");
  expect(Boolean(value.deviceIdentity?.runtimeBuild), "simulator runtime build is missing");
  expect(value.deviceIdentity?.runtimePlatform === "iOS", "simulator runtime platform must be iOS");
  expect(Boolean(value.deviceIdentity?.productFamily), "simulator product family is missing");
  expect(Boolean(value.installedNativeShellVersion), "installed native-shell version is missing");
  expect(Boolean(value.installedNativeShellBuild), "installed native-shell build is missing");
  expect(Boolean(value.installedNativeExecutableName), "installed native executable name is missing");
  expect(value.warning?.includes(`${value.installedNativeShellVersion} (${value.installedNativeShellBuild})`), "warning must identify the native shell");
  expect(value.warning?.includes(`${value.candidateAppVersion} (${value.candidateBuildNumber})`), "warning must identify the candidate config");
}

function validateEntryAcknowledgementProjection(entry, identity) {
  const acknowledgement = entry.captureAcknowledgement || {};
  const projections = [
    ["scrollPositionSource", "scrollPositionSource"],
    ["rawContentOffsetY", "rawContentOffsetY"],
    ["contentInsetTop", "contentInsetTop"],
    ["contentOriginRawY", "contentOriginRawY"],
    ["contentHeight", "contentHeight"],
    ["viewportHeight", "viewportHeight"],
    ["rawMaxScrollY", "rawMaxScrollY"],
    ["maxScrollY", "maxScrollY"],
    ["observedScrollYConvention", "observedScrollYConvention"],
  ];
  for (const [entryKey, acknowledgementKey] of projections) {
    expect(entry[entryKey] === acknowledgement[acknowledgementKey], `${identity}: ${entryKey} acknowledgement projection mismatch`);
  }
  expect(entry.observedScrollYEvidence === "app-acknowledgement-v5", `${identity}: observed scroll evidence mismatch`);
  expect(entry.observedSystemAppearance === entry.requestedAppearance, `${identity}: simulator appearance mismatch`);
  expect(entry.observedContentSize === entry.contentSize, `${identity}: simulator content size mismatch`);
  expect(entry.resolvedAppAppearance === acknowledgement.resolvedAppearance, `${identity}: resolved app appearance projection mismatch`);
  expect(entry.resolvedAppAppearanceEvidence === "app-acknowledgement-v5", `${identity}: app appearance evidence mismatch`);
  expect(entry.resolvedLocale === acknowledgement.resolvedLocale, `${identity}: resolved locale projection mismatch`);
  expect(entry.resolvedLocaleEvidence === "app-acknowledgement-v5", `${identity}: locale evidence mismatch`);
  expect(entry.resolvedRtl === acknowledgement.rtl, `${identity}: RTL projection mismatch`);
  expect(entry.resolvedRtlEvidence === "app-acknowledgement-v5", `${identity}: RTL evidence mismatch`);
  expect(entry.rtlExpected === (entry.locale === "ar"), `${identity}: RTL expectation mismatch`);
}

function validateCaptureAcknowledgement(acknowledgement, expected) {
  const prefix = `${expected.entryIdentity}: acknowledgement`;
  if (!acknowledgement || typeof acknowledgement !== "object" || Array.isArray(acknowledgement)) {
    fail(`${prefix} must be an object`);
    return;
  }
  expect(acknowledgement.schemaVersion === CAPTURE_ACKNOWLEDGEMENT_SCHEMA_VERSION, `${prefix} schema mismatch`);
  expect(acknowledgement.captureNonce === expected.captureNonce, `${prefix} nonce mismatch`);
  expect(acknowledgement.captureTarget === expected.captureTarget, `${prefix} target mismatch`);
  expect(acknowledgement.mountedRoute === expected.expectedMountedRoute, `${prefix} mounted route mismatch`);
  expect(acknowledgement.resolvedAppearance === expected.requestedAppearance, `${prefix} app appearance mismatch`);
  expect(acknowledgement.resolvedSystemAppearance === expected.requestedAppearance, `${prefix} system appearance mismatch`);
  expect(acknowledgement.requestedLocale === expected.requestedLocale, `${prefix} requested locale mismatch`);
  expect(acknowledgement.resolvedLocale === expected.requestedLocale, `${prefix} resolved locale mismatch`);
  expect(acknowledgement.rtl === (expected.requestedLocale === "ar"), `${prefix} RTL mismatch`);
  expect(acknowledgement.requestedScrollY === expected.requestedScrollY, `${prefix} requested normalized offset mismatch`);
  expect(acknowledgement.observedScrollYConvention === "raw-minus-top-origin", `${prefix} scroll convention mismatch`);
  const isDeepCapture = expected.expectedContentOriginRawY != null;
  expect(acknowledgement.scrollPositionSource === "native-scroll-event" || acknowledgement.scrollPositionSource === "implicit-zero-content-offset", `${prefix} scroll source is invalid`);
  if (isDeepCapture) expect(acknowledgement.scrollPositionSource === "native-scroll-event", `${prefix} deep capture must use a native scroll event`);

  const rawContentOffsetY = Number(acknowledgement.rawContentOffsetY);
  const contentInsetTop = Number(acknowledgement.contentInsetTop);
  const contentOriginRawY = Number(acknowledgement.contentOriginRawY);
  const observedScrollY = Number(acknowledgement.observedScrollY);
  const contentHeight = Number(acknowledgement.contentHeight);
  const viewportHeight = Number(acknowledgement.viewportHeight);
  const rawMaxScrollY = Number(acknowledgement.rawMaxScrollY);
  const maxScrollY = Number(acknowledgement.maxScrollY);
  expect([rawContentOffsetY, contentInsetTop, contentOriginRawY, observedScrollY, contentHeight, viewportHeight, rawMaxScrollY, maxScrollY].every(Number.isFinite), `${prefix} geometry must be finite`);
  expect(contentInsetTop >= 0 && contentHeight > 0 && viewportHeight > 0 && rawMaxScrollY >= 0 && maxScrollY >= 0 && observedScrollY >= 0, `${prefix} geometry is invalid`);
  expect(acknowledgement.scrollViewRegistered === true, `${prefix} scroll view was not registered`);
  if (acknowledgement.scrollPositionSource === "implicit-zero-content-offset") {
    expect(!isDeepCapture && acknowledgement.requestedScrollY === 0, `${prefix} implicit zero source is only valid for exact top`);
    expect(rawContentOffsetY === 0 && contentOriginRawY === 0 && observedScrollY === 0, `${prefix} implicit zero geometry must be exact zero`);
  }
  if (!isDeepCapture) {
    expect(Math.abs(contentOriginRawY - rawContentOffsetY) <= 0.01, `${prefix} top origin is not its raw offset`);
  } else {
    expect(Math.abs(contentOriginRawY - expected.expectedContentOriginRawY) <= 0.01, `${prefix} source origin mismatch`);
    expect(Number(acknowledgement.scrollApplyAttemptCount) > 0, `${prefix} deep capture has no scroll application attempt`);
    expect(Math.abs(Number(acknowledgement.lastAttemptedScrollY) - expected.requestedScrollY) <= 0.01, `${prefix} last attempted scroll is not the exact request`);
  }
  expect(Math.abs(observedScrollY - Math.max(0, rawContentOffsetY - contentOriginRawY)) <= 0.01, `${prefix} normalized offset is not raw minus source origin`);
  expect(Math.abs(rawMaxScrollY - Math.max(0, contentHeight - viewportHeight)) <= SCROLL_TOLERANCE_PX, `${prefix} raw maximum does not match content geometry`);
  expect(Math.abs(maxScrollY - Math.max(0, rawMaxScrollY - contentOriginRawY)) <= SCROLL_TOLERANCE_PX, `${prefix} semantic maximum does not match raw maximum minus origin`);
  expect(rawContentOffsetY <= rawMaxScrollY + SCROLL_TOLERANCE_PX, `${prefix} raw offset exceeds raw maximum`);
  expect(observedScrollY <= maxScrollY + SCROLL_TOLERANCE_PX, `${prefix} normalized offset exceeds semantic maximum`);
  expect(acknowledgement.scrollApplied === true, `${prefix} scrollApplied must be true`);
  if (!isDeepCapture) {
    expect(expected.requestedScrollY === 0 && observedScrollY <= SCROLL_TOLERANCE_PX, `${prefix} top is not exact within tolerance`);
  } else {
    expect(maxScrollY >= expected.requestedScrollY - SCROLL_TOLERANCE_PX, `${prefix} requested offset exceeds semantic maximum`);
    expect(Math.abs(observedScrollY - expected.requestedScrollY) <= SCROLL_TOLERANCE_PX, `${prefix} observed offset does not match exact request`);
  }
  const launchTime = Date.parse(expected.launchStartedAt);
  const acknowledgementTime = Date.parse(acknowledgement.acknowledgedAt);
  const captureTime = Date.parse(expected.capturedAt);
  expect(Number.isFinite(acknowledgementTime), `${prefix} timestamp is invalid`);
  expect(Number.isFinite(launchTime) && acknowledgementTime >= launchTime - 1_000, `${prefix} predates launch`);
  expect(Number.isFinite(captureTime) && acknowledgementTime <= captureTime, `${prefix} postdates screenshot`);
}

function validateMatchingSweepGeometry(acknowledgement, topAcknowledgement, identity) {
  for (const field of ["contentHeight", "viewportHeight", "rawMaxScrollY", "maxScrollY"]) {
    expect(Math.abs(Number(acknowledgement?.[field]) - Number(topAcknowledgement?.[field])) <= SCROLL_TOLERANCE_PX, `${identity}: deep/top ${field} mismatch`);
  }
}

function verifyScreenshotAndSidecar(entry, identity, screenshotPath, sidecarPath) {
  if (!existsSync(screenshotPath)) {
    fail(`${identity}: missing screenshot ${screenshotPath}`);
    return;
  }
  const bytes = readFileSync(screenshotPath);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  const dimensions = pngDimensions(bytes);
  expect(actualSha256 === entry.screenshotSha256, `${identity}: screenshot hash mismatch`);
  expect(statSync(screenshotPath).size === entry.screenshotBytes, `${identity}: screenshot byte count mismatch`);
  expect(dimensions.width === entry.width && dimensions.height === entry.height, `${identity}: PNG dimensions mismatch`);
  expect(entry.width > 0 && entry.height > 0, `${identity}: invalid screenshot dimensions`);
  expect(Number.isFinite(entry.imageEntropy) && entry.imageEntropy >= 0.05, `${identity}: blank-frame entropy ${entry.imageEntropy}`);
  minimumEntropy = Math.min(minimumEntropy, entry.imageEntropy);
  if (entry.retriedBlankCapture) retriedBlankCaptures += 1;
  if (!existsSync(sidecarPath)) {
    fail(`${identity}: missing JSON sidecar`);
    return;
  }
  try {
    const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    expect(isDeepStrictEqual(sidecar, entry), `${identity}: sidecar does not exactly match manifest entry`);
  } catch (error) {
    fail(`${identity}: sidecar is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function coverageProblems({ offsets, viewportHeight, semanticMaxScrollY, hashes }) {
  const problems = [];
  if (!Array.isArray(offsets) || !offsets.length) return ["coverage has no offsets"];
  if (Math.abs(Number(offsets[0])) > SCROLL_TOLERANCE_PX) problems.push("coverage does not begin at top");
  if (semanticMaxScrollY > SCROLL_TOLERANCE_PX && Math.abs(Number(offsets.at(-1)) - semanticMaxScrollY) > SCROLL_TOLERANCE_PX) {
    problems.push("coverage does not reach exact semantic end within tolerance");
  }
  for (let index = 1; index < offsets.length; index += 1) {
    const gap = Number(offsets[index]) - Number(offsets[index - 1]);
    const strideFraction = gap / viewportHeight;
    const overlap = 1 - strideFraction;
    if (!(gap > 0.01)) problems.push(`positions ${index - 1}/${index} are not unique and increasing`);
    if (strideFraction > MAXIMUM_STRIDE_FRACTION) problems.push(`positions ${index - 1}/${index} leave a vertical coverage gap`);
    if (overlap < MINIMUM_OVERLAP_FRACTION) problems.push(`positions ${index - 1}/${index} overlap by less than 28%`);
  }
  if (semanticMaxScrollY > SCROLL_TOLERANCE_PX && new Set(hashes).size !== hashes.length) {
    problems.push("distinct vertical positions do not have unique screenshot hashes");
  }
  return problems;
}

function plannedSweepOffsets(maxScrollY, viewportHeight) {
  if (!Number.isFinite(maxScrollY) || !Number.isFinite(viewportHeight) || maxScrollY < 0 || viewportHeight <= 0) {
    throw new Error("invalid sweep geometry");
  }
  if (maxScrollY <= SCROLL_TOLERANCE_PX) return [0];
  const segmentCount = Math.max(1, Math.ceil(maxScrollY / (viewportHeight * PLANNED_STRIDE_FRACTION)));
  return Array.from({ length: segmentCount + 1 }, (_unused, index) => (
    index === segmentCount ? maxScrollY : maxScrollY * index / segmentCount
  ));
}

function safePlannedOffsets(groupKey, maxScrollY, viewportHeight) {
  try {
    return plannedSweepOffsets(maxScrollY, viewportHeight);
  } catch (error) {
    fail(`${groupKey}: cannot independently plan offsets: ${error instanceof Error ? error.message : String(error)}`);
    return [0];
  }
}

function canonicalCaptureTarget(targetKey, sweepIndex, requestedNormalizedOffsetY) {
  return `scroll-sweep:${targetKey}:${String(sweepIndex).padStart(3, "0")}:${offsetToken(requestedNormalizedOffsetY)}`;
}

function offsetToken(value) {
  const normalized = Number(Number(value).toFixed(6));
  return String(Object.is(normalized, -0) ? 0 : normalized);
}

function validatedStringArray(value, label) {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== "string" || !item)) {
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

function validateBaseTargetSelection(values) {
  const unknown = values.filter((value) => !APPEARANCE_MATRIX_TARGETS_BY_KEY.has(value));
  if (unknown.length) fail(`manifest selected target keys contains unknown target(s): ${unknown.join(", ")}`);
  const deep = values.filter((value) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(value)?.scrollPlan);
  if (deep.length) fail(`manifest selected target keys must be base-only; deep target(s): ${deep.join(", ")}`);
  validateUniqueAllowed("manifest selected target keys", values, canonicalBaseTargetKeys);
}

function assertEnvironmentFilter(name, manifestValues, allowedValues, baseOnly = false) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) return;
  const requested = splitList(process.env[name], name);
  const unknown = requested.filter((value) => !allowedValues.includes(value));
  if (unknown.length) fail(`${name} contains unsupported value(s): ${unknown.join(", ")}`);
  if (baseOnly) {
    const deep = requested.filter((value) => APPEARANCE_MATRIX_TARGETS_BY_KEY.get(value)?.scrollPlan);
    if (deep.length) fail(`${name} must not include deep target(s): ${deep.join(", ")}`);
  }
  expect(hasExactMembers(manifestValues, requested), `${name} does not exactly match the manifest selection`);
}

function splitList(value, name) {
  const items = String(value || "").split(",").map((item) => item.trim());
  if (!items.length || items.some((item) => !item)) {
    fail(`${name} must be a non-empty comma-separated list without empty items`);
    return [];
  }
  const duplicates = items.filter((item, index) => items.indexOf(item) !== index);
  if (duplicates.length) fail(`${name} contains duplicate value(s): ${[...new Set(duplicates)].join(", ")}`);
  return items;
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

function isUuidV4(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

function closeEnough(left, right, tolerance) {
  return Number.isFinite(Number(left)) && Math.abs(Number(left) - Number(right)) <= tolerance;
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.subarray(12, 16).toString("ascii") !== "IHDR") {
    return { width: 0, height: 0 };
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function seenGroupCount() {
  return [...expectedGroups.keys()].filter((key) => entries.some((entry) => entry?.groupKey === key)).length;
}

function runSelfTests() {
  const offsets = plannedSweepOffsets(1800, 800);
  assert.equal(offsets[0], 0);
  assert.equal(offsets.at(-1), 1800);
  assert.deepEqual(coverageProblems({
    offsets,
    viewportHeight: 800,
    semanticMaxScrollY: 1800,
    hashes: offsets.map((_offset, index) => `hash-${index}`),
  }), []);
  const gapProblems = coverageProblems({
    offsets: [0, 600, 1000],
    viewportHeight: 800,
    semanticMaxScrollY: 1000,
    hashes: ["a", "b", "c"],
  });
  assert(gapProblems.some((problem) => problem.includes("coverage gap")));
  assert(gapProblems.some((problem) => problem.includes("less than 28%")));
  const duplicateProblems = coverageProblems({
    offsets: [0, 500, 1000],
    viewportHeight: 800,
    semanticMaxScrollY: 1000,
    hashes: ["a", "b", "b"],
  });
  assert(duplicateProblems.some((problem) => problem.includes("unique screenshot hashes")));
  assert.deepEqual(plannedSweepOffsets(2, 800), [0]);
  console.log(`Scroll-sweep auditor self-test passed (${offsets.length} complete-coverage positions; gap and duplicate rejection verified).`);
}
