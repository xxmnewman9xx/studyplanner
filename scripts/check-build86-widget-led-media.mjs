import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const APP_CONFIG = "app.json";
const STORE_CONFIG = "store.config.json";
const COPY_MANIFEST = "docs/launch/back-to-school-2026/build86-widget-led-headlines.json";
const LEDGER = "outputs/imagegen/generative-polish/build86-widget-led-conversion/provenance-ledger.json";
const CANARY = "outputs/imagegen/generative-polish/build86-widget-led-conversion/canary-review.json";
const OUTPUT = "qa/back-to-school-2026/build86-widget-led-media-gate.json";
const ROOT = "store/apple/screenshot-build86-creative-production";
const LOCALES = [
  "ar-SA", "de-DE", "en-AU", "en-CA", "en-GB", "en-US", "es-ES", "es-MX",
  "fr-CA", "fr-FR", "hi", "ja", "ko", "pt-BR", "pt-PT", "zh-Hans", "zh-Hant",
];
const DEVICES = {
  APP_IPHONE_65: { width: 1242, height: 2688 },
  APP_IPAD_PRO_3GEN_129: { width: 2048, height: 2732 },
};
const SLIDES = [
  "01-syllabus-to-plan.png",
  "02-needs-you-today.png",
  "03-before-you-open.png",
  "04-heavy-weeks.png",
  "05-deadlines-to-focus.png",
  "06-every-class-moving.png",
  "07-review-uncertain-dates.png",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function optionalJson(path) {
  return existsSync(path) ? readJson(path) : null;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngInfo(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
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
const blockers = [];
const app = readJson(APP_CONFIG).expo;
const store = readJson(STORE_CONFIG);
const copy = optionalJson(COPY_MANIFEST);
const ledger = optionalJson(LEDGER);
const canary = optionalJson(CANARY);

if (app.version !== "2.0.9" || app.ios?.buildNumber !== "86") failures.push("app.json must identify version 2.0.9 / Build 86");
if (store.apple?.version !== "2.0.9") failures.push("store.config.json must identify version 2.0.9");
const locales = Object.keys(store.apple?.info || {}).sort();
if (JSON.stringify(locales) !== JSON.stringify([...LOCALES].sort())) failures.push("store.config.json must contain the exact 17-locale set");

if (!copy) blockers.push("localized headline manifest is missing");
if (copy && copy.approvalStatus !== "native_language_approved_all_17") blockers.push("native-language approval is incomplete for one or more headline sets");
if (copy && (copy.locales?.length !== 17 || copy.locales?.some((entry) => entry.headlines?.length !== 7))) failures.push("headline manifest must contain 17 locales × 7 deterministic headlines");

const expectedAssets = [];
for (const locale of LOCALES) {
  for (const [device, dimensions] of Object.entries(DEVICES)) {
    const expectedPaths = SLIDES.map((file) => `${ROOT}/${locale}/${device}/${file}`);
    expectedAssets.push(...expectedPaths.map((path, slideIndex) => ({ locale, device, dimensions, path, slideIndex })));
    const configured = store.apple?.info?.[locale]?.screenshots?.[device];
    if (!Array.isArray(configured) || JSON.stringify(configured) !== JSON.stringify(expectedPaths)) {
      blockers.push(`${locale}/${device} is not configured with the Build 86 seven-slide order`);
    }
  }
}

if (expectedAssets.length !== 238) failures.push("expected matrix must equal 238 assets");
if (!canary) blockers.push("14-image iPhone/iPad canary review is missing");
if (canary && (canary.status !== "approved" || canary.assets?.length !== 14)) blockers.push("canary must be approved with all 14 device/slide combinations");
if (canary) {
  const canaryPairs = new Set((canary.assets || []).map((asset) => `${asset.device}:${asset.slideIndex}`));
  if (canaryPairs.size !== 14) failures.push("canary does not cover all seven slides on both devices exactly once");
}

if (!ledger) blockers.push("Build 86 Creative Production provenance ledger is missing");
const jobs = Array.isArray(ledger?.jobs) ? ledger.jobs : [];
if (ledger && jobs.length !== 238) blockers.push("provenance ledger must contain 238 completed assets");
if (ledger && ledger.workflow !== "claude_creative_production_generative_polish") failures.push("ledger must identify the authorized Creative Production workflow");
if (ledger && ledger.sourceBinary?.version !== "2.0.9") failures.push("ledger source binary version must be 2.0.9");
if (ledger && ledger.sourceBinary?.buildNumber !== "86") failures.push("ledger source binary build number must be 86");
if (ledger && !/^[a-f0-9]{64}$/.test(ledger.sourceBinary?.ipaSha256 || "")) blockers.push("ledger must bind every screenshot to the verified Build 86 IPA SHA-256");
if (ledger && ledger.contactSheetApproval !== "approved_all_34_locale_device_sheets") blockers.push("locale/device contact-sheet approval is incomplete");

const jobsByPath = new Map(jobs.map((job) => [job.path, job]));
const hashes = new Set();
let passingAssets = 0;
for (const asset of expectedAssets) {
  const job = jobsByPath.get(asset.path);
  if (!existsSync(asset.path)) continue;
  const bytes = readFileSync(asset.path);
  const info = pngInfo(bytes);
  const hash = sha256(bytes);
  const reasons = [];
  if (!info) reasons.push("not_png");
  if (info && (info.width !== asset.dimensions.width || info.height !== asset.dimensions.height)) reasons.push("wrong_dimensions");
  if (hashes.has(hash)) reasons.push("duplicate_sha256");
  hashes.add(hash);
  if (!job) reasons.push("ledger_entry_missing");
  if (job) {
    if (job.sha256 !== hash) reasons.push("hash_mismatch");
    if (!/^[a-f0-9]{64}$/.test(job.sourceHash || "")) reasons.push("source_hash_missing");
    if (!job.prompt || !job.generationMetadata) reasons.push("generation_metadata_missing");
    if (job.uiTreatment !== "immutable_build86_pixels") reasons.push("live_ui_pixels_not_locked");
    if (job.textTreatment !== "deterministic_localized_typography") reasons.push("headline_not_deterministic");
    if (job.ocrStatus !== "verified_exact_text") reasons.push("ocr_not_verified");
    if (job.safeZoneStatus !== "passed") reasons.push("safe_zone_not_verified");
    if (job.truthStatus !== "truthful_build86_feature") reasons.push("feature_truth_not_verified");
  }
  if (reasons.length === 0) passingAssets += 1;
}

if (hashes.size !== 238) blockers.push("all 238 final files must exist with unique SHA-256 hashes");
if (passingAssets !== 238) blockers.push(`${passingAssets}/238 assets currently pass dimension, provenance, OCR, safe-zone, and truth checks`);

const ready = failures.length === 0 && blockers.length === 0;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: ready ? "ready_for_review" : failures.length ? "failed" : "blocked",
  ready,
  target: { version: app.version, buildNumber: app.ios?.buildNumber, assets: 238, locales: 17, devices: 2, slides: 7 },
  coverage: { expectedAssets: expectedAssets.length, existingUniqueFiles: hashes.size, passingAssets },
  failures,
  blockers: [...new Set(blockers)],
};
writeJsonAtomic(OUTPUT, report);
console.log(`${ready ? "READY" : failures.length ? "FAILED" : "BLOCKED"}: ${passingAssets}/238 Build 86 assets pass.`);
console.log(`QA report: ${OUTPUT}`);
if (failures.length || (requireReady && !ready)) process.exitCode = 1;
