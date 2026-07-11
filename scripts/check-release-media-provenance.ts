import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

type JsonRecord = Record<string, unknown>;

type ExpectedAsset = {
  file: string;
  locale: string;
  screenSlot: "APP_IPHONE_65" | "APP_IPAD_PRO_3GEN_129";
  scope: "selected_iphone" | "referenced_ipad";
};

type AssetAudit = ExpectedAsset & {
  status: "READY" | "BLOCKED";
  reasons: string[];
  fileExists: boolean;
  actualOutputSha256?: string;
};

const REPO_ROOT = process.cwd();
const DEFAULT_MANIFEST_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/release-media-provenance.json";
const DEFAULT_OUTPUT_PATH = "qa/back-to-school-2026/release-media-provenance-gate.json";
const STORE_CONFIG_PATH = "store.config.json";
const APP_CONFIG_PATH = "app.json";
const REVIEW_ONLY_MANIFEST_PATH =
  "qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/manifest.json";
const REQUIRED_SCHEMA_REF = "./release-media-provenance.schema.json";
const REQUIRED_MANIFEST_SCHEMA_VERSION = 1;
const EXACT_CAPTURE_ENVIRONMENT = "physical_device_testflight_build80";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GIT_SHA_PATTERN = /^[a-f0-9]{40}$/;
const EAS_BUILD_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const OS_VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+){1,2}$/;

const SELECTED_IPHONE_FILES = [
  "01-start-with-class-material.png",
  "02-approve-every-deadline.png",
  "03-semester-takes-shape.png",
  "04-know-today.png",
  "05-give-deadlines-time.png",
  "06-choose-what-stays-visible.png",
] as const;

const SELECTED_IPHONE_ROOT =
  "qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/screenshots/en-US/APP_IPHONE_65";

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(record: JsonRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}

function recordValue(record: JsonRecord | null, key: string) {
  const value = record?.[key];
  return isRecord(value) ? value : null;
}

function readJson(path: string, failures: string[], required = true): unknown {
  const absolutePath = resolve(REPO_ROOT, path);
  if (!existsSync(absolutePath)) {
    if (required) failures.push(`Missing required JSON file: ${path}`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8")) as unknown;
  } catch (error) {
    failures.push(
      `${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

function safeRepoPath(path: string) {
  if (!path || isAbsolute(path)) return null;
  const absolutePath = resolve(REPO_ROOT, path);
  const fromRoot = relative(REPO_ROOT, absolutePath);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`)) return null;
  return absolutePath;
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function pushReason(reasons: string[], condition: boolean, reason: string) {
  if (!condition) reasons.push(reason);
}

function selectedIphoneAssets(): ExpectedAsset[] {
  return SELECTED_IPHONE_FILES.map((file) => ({
    file: `${SELECTED_IPHONE_ROOT}/${file}`,
    locale: "en-US",
    screenSlot: "APP_IPHONE_65",
    scope: "selected_iphone",
  }));
}

function referencedIpadAssets(storeConfig: unknown, failures: string[]): ExpectedAsset[] {
  if (!isRecord(storeConfig)) return [];
  const apple = recordValue(storeConfig, "apple");
  const info = recordValue(apple, "info");
  if (!info) {
    failures.push(`${STORE_CONFIG_PATH} must contain apple.info`);
    return [];
  }

  const assets: ExpectedAsset[] = [];
  for (const [locale, rawInfo] of Object.entries(info)) {
    if (!isRecord(rawInfo)) continue;
    const screenshots = recordValue(rawInfo, "screenshots");
    const rawPaths = screenshots?.APP_IPAD_PRO_3GEN_129;
    if (rawPaths === undefined) continue;
    if (!Array.isArray(rawPaths) || rawPaths.some((path) => typeof path !== "string")) {
      failures.push(
        `${STORE_CONFIG_PATH} apple.info.${locale}.screenshots.APP_IPAD_PRO_3GEN_129 must be a string array`,
      );
      continue;
    }
    for (const file of rawPaths as string[]) {
      assets.push({
        file,
        locale,
        screenSlot: "APP_IPAD_PRO_3GEN_129",
        scope: "referenced_ipad",
      });
    }
  }

  return assets;
}

function appTarget(appConfig: unknown, failures: string[]) {
  const expo = isRecord(appConfig) ? recordValue(appConfig, "expo") : null;
  const ios = recordValue(expo, "ios");
  const target = {
    platform: "ios",
    appVersion: stringValue(expo, "version"),
    buildNumber: stringValue(ios, "buildNumber"),
    bundleId: stringValue(ios, "bundleIdentifier"),
  };

  if (!target.appVersion || !target.buildNumber || !target.bundleId) {
    failures.push(`${APP_CONFIG_PATH} must define expo.version, expo.ios.buildNumber, and expo.ios.bundleIdentifier`);
  }
  if (target.buildNumber !== "80") {
    failures.push(`Release-media provenance is locked to Build 80; ${APP_CONFIG_PATH} currently declares ${target.buildNumber || "nothing"}`);
  }
  return target;
}

function existingSimulatorSources(reviewOnlyManifest: unknown) {
  const outputToBuild = new Map<string, string>();
  if (!isRecord(reviewOnlyManifest) || !Array.isArray(reviewOnlyManifest.screenshots)) {
    return outputToBuild;
  }
  for (const rawScreenshot of reviewOnlyManifest.screenshots) {
    if (!isRecord(rawScreenshot)) continue;
    const output = stringValue(rawScreenshot, "output");
    const source = recordValue(rawScreenshot, "source");
    const buildNumber = stringValue(source, "buildNumber");
    if (output) outputToBuild.set(output, buildNumber);
  }
  return outputToBuild;
}

function gitCommitExists(gitSha: string) {
  try {
    execFileSync("git", ["cat-file", "-e", `${gitSha}^{commit}`], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function auditExpectedAsset(
  expected: ExpectedAsset,
  matchingEntries: unknown[],
  target: ReturnType<typeof appTarget>,
  existingSourceBuild: string,
) {
  const reasons: string[] = [];
  const outputPath = safeRepoPath(expected.file);
  const fileExists = Boolean(outputPath && existsSync(outputPath) && statSync(outputPath).isFile());
  let actualOutputSha256: string | undefined;
  if (fileExists && outputPath) actualOutputSha256 = sha256(outputPath);
  pushReason(reasons, Boolean(outputPath), "unsafe_output_path");
  pushReason(reasons, fileExists, "output_file_missing");

  if (matchingEntries.length !== 1) {
    reasons.push(matchingEntries.length === 0 ? "manifest_entry_missing" : "duplicate_manifest_entries");
    if (expected.scope === "selected_iphone" && /simulator/i.test(existingSourceBuild)) {
      reasons.push("current_source_is_release_simulator_not_exact_eas_ipa");
    }
    if (expected.scope === "referenced_ipad") {
      reasons.push("current_ipad_asset_is_legacy_or_unproven_for_build80");
    }
    return {
      ...expected,
      status: "BLOCKED" as const,
      reasons,
      fileExists,
      ...(actualOutputSha256 ? { actualOutputSha256 } : {}),
    };
  }

  const rawEntry = matchingEntries[0];
  if (!isRecord(rawEntry)) {
    reasons.push("manifest_entry_must_be_an_object");
    return {
      ...expected,
      status: "BLOCKED" as const,
      reasons,
      fileExists,
      ...(actualOutputSha256 ? { actualOutputSha256 } : {}),
    };
  }

  const release = recordValue(rawEntry, "release");
  const capture = recordValue(rawEntry, "capture");
  const device = recordValue(capture, "device");
  const os = recordValue(capture, "os");
  const source = recordValue(rawEntry, "source");
  const output = recordValue(rawEntry, "output");
  const easBuildId = stringValue(release, "easBuildId");
  const gitSha = stringValue(release, "gitSha");
  const ipaSha256 = stringValue(release, "ipaSha256");
  const sourcePathValue = stringValue(source, "path");
  const sourcePath = safeRepoPath(sourcePathValue);
  const sourceExists = Boolean(sourcePath && existsSync(sourcePath) && statSync(sourcePath).isFile());
  const sourceSha256 = stringValue(source, "sha256");
  const outputSha256 = stringValue(output, "sha256");

  pushReason(reasons, stringValue(rawEntry, "file") === expected.file, "manifest_file_path_mismatch");
  pushReason(reasons, stringValue(rawEntry, "locale") === expected.locale, "manifest_locale_mismatch");
  pushReason(reasons, stringValue(rawEntry, "screenSlot") === expected.screenSlot, "manifest_screen_slot_mismatch");
  pushReason(reasons, stringValue(rawEntry, "status") === "READY_EXACT_BUILD80", "entry_not_marked_ready_exact_build80");
  pushReason(reasons, EAS_BUILD_ID_PATTERN.test(easBuildId), "eas_build_id_missing_or_invalid");
  pushReason(reasons, GIT_SHA_PATTERN.test(gitSha), "git_sha_missing_or_invalid");
  if (GIT_SHA_PATTERN.test(gitSha)) pushReason(reasons, gitCommitExists(gitSha), "git_sha_not_present_in_repository");
  pushReason(reasons, SHA256_PATTERN.test(ipaSha256), "ipa_sha256_missing_or_invalid");
  pushReason(reasons, stringValue(release, "appVersion") === target.appVersion, "app_version_not_exact_target");
  pushReason(reasons, stringValue(release, "buildNumber") === "80", "build_number_not_exact_build80");
  pushReason(reasons, stringValue(release, "bundleId") === target.bundleId, "bundle_id_not_exact_target");
  pushReason(
    reasons,
    stringValue(capture, "environment") === EXACT_CAPTURE_ENVIRONMENT,
    "capture_not_from_physical_device_testflight_build80",
  );
  const deviceModel = stringValue(device, "model");
  pushReason(
    reasons,
    deviceModel.length >= 3 && !/simulator|unknown|todo|tbd/i.test(deviceModel),
    "capture_device_missing_or_simulator",
  );
  pushReason(reasons, ["iOS", "iPadOS"].includes(stringValue(os, "name")), "capture_os_name_missing_or_invalid");
  pushReason(reasons, OS_VERSION_PATTERN.test(stringValue(os, "version")), "capture_os_version_missing_or_invalid");
  const capturedAt = stringValue(capture, "capturedAt");
  pushReason(
    reasons,
    capturedAt.includes("T") && !Number.isNaN(Date.parse(capturedAt)),
    "capture_timestamp_missing_or_invalid",
  );
  pushReason(reasons, Boolean(sourcePath), "unsafe_source_path");
  pushReason(reasons, sourceExists, "source_file_missing");
  pushReason(reasons, SHA256_PATTERN.test(sourceSha256), "source_sha256_missing_or_invalid");
  if (sourceExists && sourcePath && SHA256_PATTERN.test(sourceSha256)) {
    pushReason(reasons, sha256(sourcePath) === sourceSha256, "source_sha256_mismatch");
  }
  pushReason(reasons, SHA256_PATTERN.test(outputSha256), "output_sha256_missing_or_invalid");
  if (actualOutputSha256 && SHA256_PATTERN.test(outputSha256)) {
    pushReason(reasons, actualOutputSha256 === outputSha256, "output_sha256_mismatch");
  }

  return {
    ...expected,
    status: reasons.length === 0 ? ("READY" as const) : ("BLOCKED" as const),
    reasons,
    fileExists,
    ...(actualOutputSha256 ? { actualOutputSha256 } : {}),
  };
}

function parseArgs(args: string[]) {
  let manifestPath = DEFAULT_MANIFEST_PATH;
  let outputPath = DEFAULT_OUTPUT_PATH;
  let requireReady = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--require-ready") {
      requireReady = true;
    } else if (arg === "--manifest" && args[index + 1]) {
      manifestPath = args[++index];
    } else if (arg === "--output" && args[index + 1]) {
      outputPath = args[++index];
    } else if (arg === "--help") {
      console.log(
        "Usage: npx tsx scripts/check-release-media-provenance.ts [--manifest PATH] [--output PATH] [--require-ready]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  return { manifestPath, outputPath, requireReady };
}

function writeAudit(path: string, payload: unknown) {
  const absolutePath = resolve(REPO_ROOT, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  const temporaryPath = `${absolutePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`);
  renameSync(temporaryPath, absolutePath);
}

export function runReleaseMediaProvenanceGate(args = process.argv.slice(2)) {
  const { manifestPath, outputPath, requireReady } = parseArgs(args);
  const failures: string[] = [];
  const schemaPath = resolve(dirname(manifestPath), "release-media-provenance.schema.json");
  const storeConfig = readJson(STORE_CONFIG_PATH, failures);
  const appConfig = readJson(APP_CONFIG_PATH, failures);
  const manifest = readJson(manifestPath, failures);
  const provenanceSchema = readJson(schemaPath, failures);
  const reviewOnlyManifest = readJson(REVIEW_ONLY_MANIFEST_PATH, [], false);
  const target = appTarget(appConfig, failures);
  const expectedAssets = [...selectedIphoneAssets(), ...referencedIpadAssets(storeConfig, failures)];
  const duplicateExpectedFiles = expectedAssets
    .map((asset) => asset.file)
    .filter((file, index, all) => all.indexOf(file) !== index);
  if (duplicateExpectedFiles.length > 0) {
    failures.push(`Duplicate expected screenshot references: ${[...new Set(duplicateExpectedFiles)].join(", ")}`);
  }

  const manifestRecord = isRecord(manifest) ? manifest : null;
  const manifestTarget = recordValue(manifestRecord, "target");
  if (
    !isRecord(provenanceSchema) ||
    stringValue(provenanceSchema, "$schema") !== "https://json-schema.org/draft/2020-12/schema"
  ) {
    failures.push("Release-media provenance schema must be valid JSON Schema draft 2020-12");
  }
  if (stringValue(manifestRecord, "$schema") !== REQUIRED_SCHEMA_REF) {
    failures.push(`Manifest must reference ${REQUIRED_SCHEMA_REF}`);
  }
  if (manifestRecord?.schemaVersion !== REQUIRED_MANIFEST_SCHEMA_VERSION) {
    failures.push(`Manifest schemaVersion must be ${REQUIRED_MANIFEST_SCHEMA_VERSION}`);
  }
  if (stringValue(manifestRecord, "status") !== "READY_EXACT_BUILD80") {
    failures.push("Manifest status is blocked until all exact Build 80 evidence is complete");
  }
  if (stringValue(manifestTarget, "platform") !== target.platform) failures.push("Manifest target platform does not match app.json");
  if (stringValue(manifestTarget, "appVersion") !== target.appVersion) failures.push("Manifest target appVersion does not match app.json");
  if (stringValue(manifestTarget, "buildNumber") !== "80") failures.push("Manifest target must be Build 80");
  if (stringValue(manifestTarget, "bundleId") !== target.bundleId) failures.push("Manifest target bundleId does not match app.json");

  const rawEntries = Array.isArray(manifestRecord?.assets) ? manifestRecord.assets : [];
  if (!Array.isArray(manifestRecord?.assets)) failures.push("Manifest assets must be an array");
  const entriesByFile = new Map<string, unknown[]>();
  for (const entry of rawEntries) {
    const file = isRecord(entry) ? stringValue(entry, "file") : "";
    if (!file) {
      failures.push("Every manifest asset must include a file path");
      continue;
    }
    entriesByFile.set(file, [...(entriesByFile.get(file) || []), entry]);
  }

  const expectedFiles = new Set(expectedAssets.map((asset) => asset.file));
  const extraManifestFiles = [...entriesByFile.keys()].filter((file) => !expectedFiles.has(file)).sort();
  if (extraManifestFiles.length > 0) {
    failures.push(`Manifest contains ${extraManifestFiles.length} out-of-scope file(s)`);
  }

  const simulatorSourceBuilds = existingSimulatorSources(reviewOnlyManifest);
  const assets: AssetAudit[] = expectedAssets.map((expected) =>
    auditExpectedAsset(
      expected,
      entriesByFile.get(expected.file) || [],
      target,
      simulatorSourceBuilds.get(expected.file) || "",
    ),
  );
  const readyAssets = assets.filter((asset) => asset.status === "READY");
  const blockedAssets = assets.filter((asset) => asset.status === "BLOCKED");

  const releaseEvidence = rawEntries
    .filter(isRecord)
    .map((entry) => recordValue(entry, "release"))
    .filter((release): release is JsonRecord => Boolean(release));
  const uniqueEasBuildIds = [...new Set(releaseEvidence.map((release) => stringValue(release, "easBuildId")).filter(Boolean))];
  const uniqueGitShas = [...new Set(releaseEvidence.map((release) => stringValue(release, "gitSha")).filter(Boolean))];
  const uniqueIpaHashes = [...new Set(releaseEvidence.map((release) => stringValue(release, "ipaSha256")).filter(Boolean))];
  if (uniqueEasBuildIds.length > 1) failures.push("Manifest assets do not share one exact EAS Build 80 ID");
  if (uniqueGitShas.length > 1) failures.push("Manifest assets do not share one exact Build 80 git SHA");
  if (uniqueIpaHashes.length > 1) failures.push("Manifest assets do not share one exact Build 80 IPA SHA256");

  const releaseMediaReady =
    failures.length === 0 &&
    expectedAssets.length > 0 &&
    readyAssets.length === expectedAssets.length &&
    rawEntries.length === expectedAssets.length &&
    uniqueEasBuildIds.length === 1 &&
    uniqueGitShas.length === 1 &&
    uniqueIpaHashes.length === 1;

  if (!releaseMediaReady) {
    failures.push(
      `${blockedAssets.length} of ${expectedAssets.length} expected release screenshot(s) lack complete exact Build 80 provenance`,
    );
  }

  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: releaseMediaReady ? "ready_exact_build80" : "blocked_not_release_media_ready",
    releaseMediaReady,
    mode: requireReady ? "require-ready" : "audit",
    inputs: {
      manifest: manifestPath,
      schema: relative(REPO_ROOT, schemaPath),
      storeConfig: STORE_CONFIG_PATH,
      appConfig: APP_CONFIG_PATH,
    },
    target,
    coverage: {
      selectedIphoneExpected: expectedAssets.filter((asset) => asset.scope === "selected_iphone").length,
      referencedIpadExpected: expectedAssets.filter((asset) => asset.scope === "referenced_ipad").length,
      totalExpected: expectedAssets.length,
      filesPresent: assets.filter((asset) => asset.fileExists).length,
      manifestEntries: rawEntries.length,
      ready: readyAssets.length,
      blocked: blockedAssets.length,
    },
    exactBuildEvidence: {
      easBuildIds: uniqueEasBuildIds,
      gitShas: uniqueGitShas,
      ipaSha256s: uniqueIpaHashes,
      oneConsistentBuild:
        uniqueEasBuildIds.length === 1 && uniqueGitShas.length === 1 && uniqueIpaHashes.length === 1,
    },
    failures: [...new Set(failures)],
    warnings: [],
    blockedAssets: blockedAssets.map(({ file, locale, screenSlot, scope, reasons, actualOutputSha256 }) => ({
      file,
      locale,
      screenSlot,
      scope,
      reasons,
      ...(actualOutputSha256 ? { actualOutputSha256 } : {}),
    })),
    extraManifestFiles,
  };

  writeAudit(outputPath, payload);
  console.log(
    `${releaseMediaReady ? "READY" : "BLOCKED"}: ${readyAssets.length}/${expectedAssets.length} release screenshot(s) have exact Build 80 provenance.`,
  );
  console.log(`QA report: ${outputPath}`);
  if (requireReady && !releaseMediaReady) process.exitCode = 1;
  return payload;
}

runReleaseMediaProvenanceGate();
