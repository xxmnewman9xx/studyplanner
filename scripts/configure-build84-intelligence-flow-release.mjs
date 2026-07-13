import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const artifactRoot =
  "/Users/mattnewman/work/StudyPlanner-release-artifacts/build84/intelligence-flow";
const previewRoot =
  "outputs/imagegen/generative-polish/build84-intelligence-flow";
const storeRoot = "store/apple/screenshot-intelligence-flow";
const storeConfigPath = "store.config.json";
const ledgerPath = join(previewRoot, "provenance-ledger.json");
const machineQaPath = join(previewRoot, "machine-qa.json");
const slideFiles = [
  "01-scan-material.png",
  "02-add-your-way.png",
  "03-approve-deadlines.png",
  "04-make-time.png",
  "05-next-move.png",
];
const slots = ["APP_IPHONE_65", "APP_IPAD_PRO_3GEN_129"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

const storeConfig = readJson(storeConfigPath);
const locales = Object.keys(storeConfig.apple.info).sort();
if (locales.length !== 17) throw new Error(`Expected 17 locales, found ${locales.length}`);

for (const locale of locales) {
  const screenshots = {};
  for (const slot of slots) {
    screenshots[slot] = slideFiles.map((file) => join(storeRoot, locale, slot, file));
    for (const path of screenshots[slot]) {
      if (!existsSync(path)) throw new Error(`Missing release screenshot: ${path}`);
    }
  }
  storeConfig.apple.info[locale].screenshots = screenshots;
}
writeJson(storeConfigPath, storeConfig);

const ledger = readJson(ledgerPath);
const machineQa = readJson(machineQaPath);
const passingJobs = new Set(
  machineQa.findings.filter((finding) => finding.pass).map((finding) => finding.jobId),
);
if (ledger.jobs.length !== 170 || passingJobs.size !== 170) {
  throw new Error("Expected 170 ledger jobs and 170 passing machine-QA findings");
}

const pathReplacements = [
  [
    "/private/tmp/StudyPlanner-build84-media-raw",
    `${artifactRoot}/raw-ui/verified-existing`,
  ],
  [
    "/private/tmp/StudyPlanner-build84-media-missing-accepted",
    `${artifactRoot}/raw-ui/import-manual`,
  ],
  [
    "/private/tmp/StudyPlanner-build84-media-widgets-accepted",
    `${artifactRoot}/raw-ui/widgets`,
  ],
  [
    "/tmp/StudyPlanner-intelligence-flow/outputs/imagegen/generative-polish/build84-intelligence-flow/atlases",
    `${artifactRoot}/atlases`,
  ],
];

function archivedPath(path) {
  if (typeof path !== "string") return path;
  for (const [from, to] of pathReplacements) {
    if (path.startsWith(from)) return path.replace(from, to);
  }
  return path;
}

function archiveJsonPaths(value) {
  if (Array.isArray(value)) return value.map(archiveJsonPaths);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, archiveJsonPaths(item)]));
  }
  return archivedPath(value);
}

for (const job of ledger.jobs) {
  job.atlasPath = archivedPath(job.atlasPath);
  for (const panel of job.referencedPanels) panel.sourcePath = archivedPath(panel.sourcePath);
  for (const placement of job.placedUi) placement.sourcePath = archivedPath(placement.sourcePath);
  const attempt = job.attempt || 1;
  job.backgroundPath = `${artifactRoot}/backgrounds/${job.jobId}-a${attempt}.png`;
  job.downloadPath = join(storeRoot, job.locale, job.screenSlot, `${job.slide.id}.png`);
  job.status = passingJobs.has(job.jobId) ? "accepted_machine_qa" : "rejected_machine_qa";
}
ledger.copyStatus = "draft_requires_native_language_review";
writeJson(ledgerPath, ledger);

for (const artifact of ["atlas-manifest.json", "intelligence-flow-job-queue.json"]) {
  const path = join(previewRoot, artifact);
  writeJson(path, archiveJsonPaths(readJson(path)));
}

console.log(`Configured ${locales.length * slots.length * slideFiles.length} Build 84 screenshots.`);
