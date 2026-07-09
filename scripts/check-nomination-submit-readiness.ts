import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

type Audit = {
  status?: string;
  failures?: string[];
  warnings?: string[];
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
  bundleZip?: {
    exists?: boolean;
    bundleFiles?: number;
    zipFiles?: number;
    missingEntries?: string[];
    extraEntries?: string[];
    mismatchedEntries?: string[];
  };
  remainingExternalChecks?: string[];
};

const ASC_AUDIT_PATH = "qa/back-to-school-2026/asc-final-upload-gate.json";
const FIRST_EXPERIENCE_AUDIT_PATH = "qa/back-to-school-2026/first-experience-funnel-audit.json";
const COPY_B_QUEUE_AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-manual-queue-audit.json";
const COPY_B_FINAL_AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-final-audit.json";
const OUTPUT_PATH = "qa/back-to-school-2026/nomination-submit-readiness.json";
const FINAL_UPLOAD_ROOT = "docs/launch/back-to-school-2026/app-store-connect-final-upload";
const FINAL_UPLOAD_ZIP = "docs/launch/back-to-school-2026/studyplanner-back-to-school-2026-app-store-connect-upload.zip";
const COPY_A_ROOT = "store/apple/screenshot-pop";
const COPY_B_FINAL_ROOT = "store/apple/screenshot-copy-b-image-2";
const COPY_B_PROVENANCE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json";
const PACKAGE_JSON_PATH = "package.json";
const NOTES_STRESS_REPORT_PATH = "BUILD_42_NOTES_STRESS_TEST_REPORT.md";
const SYLLABUS_STRESS_REPORT_PATH = "BUILD_42_SYLLABUS_STRESS_TEST_REPORT.md";
const WIDGET_QA_PATH = "qa/widgets/back-to-school-2026-widget-qa.json";
const WIDGET_NO_CROP_PATH = "qa/widgets/widget-no-crop-validation.json";

const failures: string[] = [];
const warnings: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message);
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    failures.push(`Missing required audit: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function readText(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function listPngs(root: string) {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile() && entry.name.endsWith(".png")) {
        out.push(path);
      }
    }
  };
  walk(root);
  return out.sort();
}

function auditIsClean(audit: Audit | null, label: string) {
  expect(Boolean(audit), `${label} audit must exist`);
  if (!audit) return false;
  expect(audit.status === "ready", `${label} audit status must be ready, found ${audit.status || "missing"}`);
  expect((audit.failures || []).length === 0, `${label} audit must have zero failures`);
  expect((audit.warnings || []).length === 0, `${label} audit must have zero warnings`);
  return audit.status === "ready" && (audit.failures || []).length === 0 && (audit.warnings || []).length === 0;
}

const ascAudit = readJson<Audit>(ASC_AUDIT_PATH);
const firstExperienceAudit = readJson<Audit>(FIRST_EXPERIENCE_AUDIT_PATH);
const copyBQueueAudit = readJson<Audit>(COPY_B_QUEUE_AUDIT_PATH);
const copyBFinalAudit = existsSync(COPY_B_FINAL_AUDIT_PATH)
  ? readJson<Audit>(COPY_B_FINAL_AUDIT_PATH)
  : null;
const packageJson = readJson<{ scripts?: Record<string, string> }>(PACKAGE_JSON_PATH);
const notesReport = readText(NOTES_STRESS_REPORT_PATH);
const syllabusReport = readText(SYLLABUS_STRESS_REPORT_PATH);
const widgetQa = readJson<{ rendererAssertions?: unknown[]; scenarios?: unknown[] }>(WIDGET_QA_PATH);
const widgetNoCrop = readJson<{ result?: string; localesValidated?: number; coreCasesValidated?: number }>(WIDGET_NO_CROP_PATH);

const copyAPngs = listPngs(COPY_A_ROOT);
const copyAIphonePngs = copyAPngs.filter((path) => path.includes("/APP_IPHONE_65/"));
const copyBFinalPngs = listPngs(COPY_B_FINAL_ROOT);
const copyBFinalReady =
  copyBFinalAudit?.status === "ready" &&
  Number(copyBFinalAudit.actual?.readyPngs || 0) === 119 &&
  copyBFinalPngs.length === 119 &&
  existsSync(COPY_B_PROVENANCE_PATH);
const copyBQueueJobs = Number(copyBQueueAudit?.expected?.jobs || 0);
const copyBImage2Jobs = Number(copyBQueueAudit?.expected?.image2Jobs || 0);
const copyBWidgetSourceJobs = Number(copyBQueueAudit?.expected?.realWidgetSourceJobs || 0);
const copyBManualReady =
  copyBQueueAudit?.status === "ready-for-manual-chatgpt-mac-app-generation" &&
  copyBQueueJobs === 119 &&
  copyBImage2Jobs === 119 &&
  copyBWidgetSourceJobs === 0 &&
  copyBQueueAudit.expected?.dimensions === "1242x2688";
const nominationReadyCommand = packageJson?.scripts?.["check:nomination-ready"] || "";
const requiredCommandFragments = [
  "npm run test:notes-stress",
  "npm run test:syllabus-stress",
  "npm run test:widgets",
  "npm run test:widget-integrity",
  "npm run test:back-to-school-widgets",
  "git diff --check",
];

auditIsClean(ascAudit, "ASC final upload");
auditIsClean(firstExperienceAudit, "first-experience funnel");
expect(copyBManualReady, "Copy B manual queue must be ready with 119 GPT Image 2.0 jobs");
expect(existsSync(FINAL_UPLOAD_ROOT), `final upload root must exist: ${FINAL_UPLOAD_ROOT}`);
expect(existsSync(FINAL_UPLOAD_ZIP), `final upload zip must exist: ${FINAL_UPLOAD_ZIP}`);
expect(copyAPngs.length === 144, `Copy A/control root must contain 144 total ASC PNGs, found ${copyAPngs.length}`);
expect(copyAIphonePngs.length === 119, `Copy A/control root must contain 119 iPhone PNGs, found ${copyAIphonePngs.length}`);
expect(notesReport.includes("Result: PASS"), "notes scanner stress report must pass");
expect(syllabusReport.includes("Result: PASS"), "syllabus scanner stress report must pass");
expect((widgetQa?.rendererAssertions || []).length >= 8, "widget QA must include renderer safeguards");
expect((widgetQa?.scenarios || []).length >= 4, "widget QA must include the four back-to-school widget scenarios");
expect(widgetNoCrop?.result === "pass", "widget no-crop validation must pass");
expect(Number(widgetNoCrop?.localesValidated || 0) >= 13, "widget no-crop validation must cover at least 13 locales");
for (const fragment of requiredCommandFragments) {
  expect(nominationReadyCommand.includes(fragment), `check:nomination-ready must run ${fragment}`);
}

if (ascAudit?.bundleZip) {
  expect(ascAudit.bundleZip.exists === true, "ASC audit must verify final-upload zip exists");
  expect(ascAudit.bundleZip.bundleFiles === ascAudit.bundleZip.zipFiles, "ASC audit zip file count must match final-upload folder file count");
  expect((ascAudit.bundleZip.missingEntries || []).length === 0, "ASC audit zip must have no missing entries");
  expect((ascAudit.bundleZip.extraEntries || []).length === 0, "ASC audit zip must have no stale extra entries");
  expect((ascAudit.bundleZip.mismatchedEntries || []).length === 0, "ASC audit zip must have no stale content entries");
}

warn(copyBFinalReady, "Copy B is not final yet; this is acceptable for nomination, but blocks PPO treatment upload");
warn(
  (ascAudit?.remainingExternalChecks || []).length === 0,
  "Live App Store Connect checks remain manual: build selection, event media crop, deep link, supplemental URL acceptance",
);

const payload = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "ready_for_manual_asc_submission",
  nominationPath: {
    copyAControl: {
      root: COPY_A_ROOT,
      totalPngs: copyAPngs.length,
      iphonePngs: copyAIphonePngs.length,
      readyForNomination: copyAPngs.length === 144 && copyAIphonePngs.length === 119 && ascAudit?.status === "ready",
    },
    finalUploadBundle: {
      root: FINAL_UPLOAD_ROOT,
      zip: FINAL_UPLOAD_ZIP,
      zipBytes: existsSync(FINAL_UPLOAD_ZIP) ? statSync(FINAL_UPLOAD_ZIP).size : 0,
      zipSynced: Boolean(
        ascAudit?.bundleZip?.exists &&
          ascAudit.bundleZip.bundleFiles === ascAudit.bundleZip.zipFiles &&
          (ascAudit.bundleZip.missingEntries || []).length === 0 &&
          (ascAudit.bundleZip.extraEntries || []).length === 0 &&
          (ascAudit.bundleZip.mismatchedEntries || []).length === 0,
      ),
    },
    requiredLocalGates: {
      ascFinalUpload: ascAudit?.status || "missing",
      firstExperience: firstExperienceAudit?.status || "missing",
      copyBManualQueue: copyBQueueAudit?.status || "missing",
      notesStress: notesReport.includes("Result: PASS") ? "pass" : "missing_or_failed",
      syllabusStress: syllabusReport.includes("Result: PASS") ? "pass" : "missing_or_failed",
      widgetLock: nominationReadyCommand.includes("npm run test:widgets") ? "covered_by_check_nomination_ready" : "missing",
      widgetIntegrity: nominationReadyCommand.includes("npm run test:widget-integrity") ? "covered_by_check_nomination_ready" : "missing",
      backToSchoolWidgetQa: widgetQa && (widgetQa.scenarios || []).length >= 4 ? "pass" : "missing_or_failed",
      widgetNoCrop: widgetNoCrop?.result || "missing",
      whitespace: nominationReadyCommand.includes("git diff --check") ? "covered_by_check_nomination_ready" : "missing",
    },
    scannerAndWidgetEvidence: {
      notesStressReport: NOTES_STRESS_REPORT_PATH,
      syllabusStressReport: SYLLABUS_STRESS_REPORT_PATH,
      widgetQa: WIDGET_QA_PATH,
      widgetNoCrop: WIDGET_NO_CROP_PATH,
      widgetQaScenarios: (widgetQa?.scenarios || []).length,
      widgetRendererAssertions: (widgetQa?.rendererAssertions || []).length,
      widgetNoCropLocales: widgetNoCrop?.localesValidated || 0,
      widgetNoCropCoreCases: widgetNoCrop?.coreCasesValidated || 0,
    },
  },
  optionalPpoCopyB: {
    requiredGenerationSurface: "ChatGPT Mac app for all slides, with real localized Home Screen WidgetKit source attached for slide 7",
    requiredModel: "GPT Image 2.0",
    generatedIndividuallyRequired: true,
    image2Jobs: copyBImage2Jobs,
    realWidgetSourceJobs: copyBWidgetSourceJobs,
    finalRoot: COPY_B_FINAL_ROOT,
    finalPngs: copyBFinalPngs.length,
    finalProvenance: COPY_B_PROVENANCE_PATH,
    finalProvenanceExists: existsSync(COPY_B_PROVENANCE_PATH),
    status: copyBFinalReady ? "ready" : "manual_generation_required",
    notNominationBlocking: true,
    queueAudit: COPY_B_QUEUE_AUDIT_PATH,
    finalAudit: existsSync(COPY_B_FINAL_AUDIT_PATH) ? COPY_B_FINAL_AUDIT_PATH : null,
  },
  liveAscChecks: ascAudit?.remainingExternalChecks || [
    "Confirm iOS 2.0.8 build 79 in the live App Store Connect session.",
    "Confirm event media crop in App Store Connect after upload.",
    "Confirm studyplanner://import in the live In-App Event form.",
    "Confirm all five supplemental URLs are accepted in the live nomination form.",
  ],
  warnings,
  failures,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Nomination submit readiness failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Audit written to ${OUTPUT_PATH}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("Nomination submit readiness warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

console.log("Nomination submit readiness passed for Copy A/control and the final ASC packet.");
console.log(`Copy B status: ${payload.optionalPpoCopyB.status}`);
console.log(`Audit written to ${OUTPUT_PATH}`);
