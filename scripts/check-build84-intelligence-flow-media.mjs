import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const STORE_CONFIG = "store.config.json";
const APP_CONFIG = "app.json";
const PREVIEW_ROOT = "outputs/imagegen/generative-polish/build84-intelligence-flow";
const LEDGER = `${PREVIEW_ROOT}/provenance-ledger.json`;
const MACHINE_QA = `${PREVIEW_ROOT}/machine-qa.json`;
const OUTPUT = "qa/back-to-school-2026/build84-intelligence-flow-media-gate.json";
const EXPECTED_LOCALES = [
  "ar-SA", "de-DE", "en-AU", "en-CA", "en-GB", "en-US", "es-ES", "es-MX",
  "fr-CA", "fr-FR", "hi", "ja", "ko", "pt-BR", "pt-PT", "zh-Hans", "zh-Hant",
];
const SLOT_SPECS = {
  APP_IPHONE_65: { width: 1242, height: 2688 },
  APP_IPAD_PRO_3GEN_129: { width: 2048, height: 2732 },
};
const SLIDES = [
  "01-scan-material.png",
  "02-add-your-way.png",
  "03-approve-deadlines.png",
  "04-make-time.png",
  "05-next-move.png",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngInfo(bytes) {
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

function writeJsonAtomic(path, value) {
  const absolute = resolve(path);
  mkdirSync(dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, absolute);
}

const requireReady = process.argv.includes("--require-ready");
const failures = [];
const submissionBlockers = [];
const app = readJson(APP_CONFIG).expo;
const store = readJson(STORE_CONFIG);
const ledger = readJson(LEDGER);
const machineQa = readJson(MACHINE_QA);

if (app.version !== "2.0.8" || app.ios?.buildNumber !== "84") {
  failures.push("app.json must identify version 2.0.8 / Build 84");
}

const locales = Object.keys(store.apple?.info || {}).sort();
if (JSON.stringify(locales) !== JSON.stringify(EXPECTED_LOCALES)) {
  failures.push(`store.config.json locales differ from the required 17-locale set`);
}

const expectedAssets = [];
for (const locale of EXPECTED_LOCALES) {
  const screenshots = store.apple?.info?.[locale]?.screenshots;
  for (const [slot, spec] of Object.entries(SLOT_SPECS)) {
    const paths = screenshots?.[slot];
    if (!Array.isArray(paths) || paths.length !== 5) {
      failures.push(`${locale}/${slot} must contain exactly five screenshots`);
      continue;
    }
    const expectedNames = paths.map((path) => path.split("/").at(-1));
    if (JSON.stringify(expectedNames) !== JSON.stringify(SLIDES)) {
      failures.push(`${locale}/${slot} has an invalid slide order`);
    }
    for (const path of paths) expectedAssets.push({ locale, slot, spec, path });
  }
}

const jobsByOutput = new Map(ledger.jobs.map((job) => [job.downloadPath, job]));
const fileHashes = new Set();
const pixelSignatures = new Set();
const promptHashes = new Set();
const jobIds = new Set();
const auditedAssets = [];
for (const asset of expectedAssets) {
  const reasons = [];
  if (!existsSync(asset.path)) {
    reasons.push("file_missing");
  } else {
    const bytes = readFileSync(asset.path);
    const info = pngInfo(bytes);
    if (!info) reasons.push("not_png");
    if (info && (info.width !== asset.spec.width || info.height !== asset.spec.height)) reasons.push("wrong_dimensions");
    if (info && info.bitDepth !== 8) reasons.push("not_8_bit");
    if (info && info.colorType !== 2) reasons.push("not_opaque_rgb");
    const fileHash = sha256(bytes);
    if (fileHashes.has(fileHash)) reasons.push("duplicate_file_hash");
    fileHashes.add(fileHash);
    const job = jobsByOutput.get(asset.path);
    if (!job) {
      reasons.push("ledger_entry_missing");
    } else {
      if (job.finalSha256 !== fileHash) reasons.push("final_hash_mismatch");
      if (job.status !== "accepted_machine_qa") reasons.push("machine_qa_not_accepted");
      if (job.locale !== asset.locale || job.screenSlot !== asset.slot) reasons.push("ledger_identity_mismatch");
      if (promptHashes.has(job.promptSha256)) reasons.push("duplicate_prompt_hash");
      if (pixelSignatures.has(job.pixelSignature)) reasons.push("duplicate_pixel_signature");
      if (jobIds.has(job.jobId)) reasons.push("duplicate_job_id");
      promptHashes.add(job.promptSha256);
      pixelSignatures.add(job.pixelSignature);
      jobIds.add(job.jobId);
    }
  }
  if (reasons.length) failures.push(`${asset.path}: ${reasons.join(", ")}`);
  auditedAssets.push({ ...asset, pass: reasons.length === 0, reasons });
}

if (expectedAssets.length !== 170 || ledger.jobs.length !== 170) failures.push("asset and ledger counts must both equal 170");
if (machineQa.assetCount !== 170 || machineQa.passCount !== 170 || machineQa.hardFailureCount !== 0) {
  failures.push("machine QA must report 170/170 passing with zero hard failures");
}

const nativeCopyReviewed = ledger.copyStatus === "native_language_review_complete";
const chatTraceComplete = ledger.jobs.every((job) =>
  job.classicConversationUrl && job.classicMessageId && job.rendererConversationUrl && job.rendererMessageId,
);
if (!nativeCopyReviewed) submissionBlockers.push("native-language review is not complete for all 17 locales");
if (!chatTraceComplete) submissionBlockers.push("Classic/renderer conversation URL and message provenance is incomplete");

const releasePrepared = failures.length === 0;
const submissionReady = releasePrepared && submissionBlockers.length === 0;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: submissionReady ? "ready_for_submission" : releasePrepared ? "prepared_submission_blocked" : "failed",
  releasePrepared,
  submissionReady,
  target: { appVersion: app.version, buildNumber: app.ios?.buildNumber, bundleId: app.ios?.bundleIdentifier },
  coverage: {
    locales: locales.length,
    localeDeviceGroups: locales.length * Object.keys(SLOT_SPECS).length,
    expectedAssets: expectedAssets.length,
    passedAssets: auditedAssets.filter((asset) => asset.pass).length,
    uniqueFiles: fileHashes.size,
    uniquePrompts: promptHashes.size,
    uniquePixels: pixelSignatures.size,
  },
  failures,
  submissionBlockers,
};
writeJsonAtomic(OUTPUT, report);
console.log(`${releasePrepared ? "PREPARED" : "FAILED"}: ${report.coverage.passedAssets}/${expectedAssets.length} Build 84 screenshots passed.`);
console.log(`Submission ready: ${submissionReady ? "yes" : "no"}`);
console.log(`QA report: ${OUTPUT}`);
if (!releasePrepared || (requireReady && !submissionReady)) process.exitCode = 1;
