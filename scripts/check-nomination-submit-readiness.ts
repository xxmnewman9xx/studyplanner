import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type Audit = {
  status?: string;
  failures?: string[];
  warnings?: string[];
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
  appVersionMediaReady?: boolean;
  humanUploadAuthorized?: boolean;
  historicalJuly9Submission?: {
    status?: string;
    inAppEvent?: { submitted?: boolean; recordedStatus?: string };
    featuringNomination?: { id?: string; submitted?: boolean };
    authorizesCurrentAppVersionMedia?: boolean;
  };
  currentAppVersionMedia?: {
    target?: { version?: string; buildNumber?: string; bundleIdentifier?: string };
    evidencePath?: string;
    evidenceExists?: boolean;
    evidenceStatus?: string;
    easBuild?: Record<string, unknown> | null;
    ipa?: Record<string, unknown> | null;
    appStoreConnect?: Record<string, unknown> | null;
    exactBinaryScreenshotProvenance?: { iphone?: unknown; ipad?: unknown };
    appPreview?: { decision?: string; [key: string]: unknown };
    humanUploadAuthorization?: Record<string, unknown> | null;
  };
  storeConfig?: {
    canonicalScreenshotRoot?: string;
    screenshotRefs?: number;
    iphoneScreenshotRefs?: number;
    ipadScreenshotRefs?: number;
    missingScreenshotRefs?: string[];
    nonCanonicalScreenshotRefs?: string[];
    legacyScreenshotRefs?: string[];
    screenshotDimensionMismatches?: unknown[];
  };
  controlPlaneFailures?: string[];
  readinessBlockers?: string[];
  remainingExternalChecks?: string[];
};

const ASC_AUDIT_PATH = "qa/back-to-school-2026/asc-final-upload-gate.json";
const FIRST_EXPERIENCE_AUDIT_PATH = "qa/back-to-school-2026/first-experience-funnel-audit.json";
const COPY_B_QUEUE_AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-manual-queue-audit.json";
const COPY_B_FINAL_AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-final-audit.json";
const OUTPUT_PATH = "qa/back-to-school-2026/nomination-submit-readiness.json";
const CANONICAL_SCREENSHOT_ROOT = "store/apple/screenshot";
const COPY_B_FINAL_ROOT = "store/apple/screenshot-copy-b-image-2";
const COPY_B_PROVENANCE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json";
const COPY_B_HUMAN_REVIEW_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-human-visual-review-2026-07-09.md";
const DETERMINISTIC_NOMINATION_ROOT =
  "qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/screenshots/en-US/APP_IPHONE_65";
const DETERMINISTIC_NOMINATION_FILES = [
  "01-start-with-class-material.png",
  "02-approve-every-deadline.png",
  "03-semester-takes-shape.png",
  "04-know-today.png",
  "05-give-deadlines-time.png",
  "06-choose-what-stays-visible.png",
] as const;
const PACKAGE_JSON_PATH = "package.json";
const NOTES_STRESS_REPORT_PATH = "BUILD_42_NOTES_STRESS_TEST_REPORT.md";
const SYLLABUS_STRESS_REPORT_PATH = "BUILD_42_SYLLABUS_STRESS_TEST_REPORT.md";
const WIDGET_QA_PATH = "qa/widgets/back-to-school-2026-widget-qa.json";
const WIDGET_NO_CROP_PATH = "qa/widgets/widget-no-crop-validation.json";

const failures: string[] = [];
const readinessBlockers: string[] = [];
const warnings: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message);
}

function block(condition: boolean, message: string) {
  if (!condition) readinessBlockers.push(message);
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

const canonicalPngs = listPngs(CANONICAL_SCREENSHOT_ROOT);
const canonicalIphonePngs = canonicalPngs.filter((path) => path.includes("/APP_IPHONE_65/"));
const canonicalIpadPngs = canonicalPngs.filter((path) => path.includes("/APP_IPAD_PRO_3GEN_129/"));
const copyBFinalPngs = listPngs(COPY_B_FINAL_ROOT);
const copyBFinalMechanicallyComplete =
  copyBFinalAudit?.status === "mechanically_complete_do_not_upload" &&
  Number(copyBFinalAudit.actual?.mechanicallyConformingPngs || 0) === 119 &&
  copyBFinalPngs.length === 119 &&
  existsSync(COPY_B_PROVENANCE_PATH);
const deterministicNominationFiles = DETERMINISTIC_NOMINATION_FILES.map(
  (file) => `${DETERMINISTIC_NOMINATION_ROOT}/${file}`,
);
const deterministicNominationFilesPresent = deterministicNominationFiles.every((path) => existsSync(path));
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

auditIsClean(firstExperienceAudit, "first-experience funnel");
expect(Boolean(ascAudit), "ASC app-version media audit must exist");
expect(
  (ascAudit?.controlPlaneFailures || []).length === 0,
  "ASC readiness control plane must have no structural/configuration failures",
);
expect(
  ascAudit?.historicalJuly9Submission?.inAppEvent?.submitted === true &&
    ascAudit?.historicalJuly9Submission?.featuringNomination?.submitted === true &&
    ascAudit?.historicalJuly9Submission?.authorizesCurrentAppVersionMedia === false,
  "ASC audit must distinguish the submitted July 9 event/nomination from current app-version media authorization",
);
expect(
  ascAudit?.storeConfig?.canonicalScreenshotRoot === `${CANONICAL_SCREENSHOT_ROOT}/`,
  `ASC audit must use canonical ${CANONICAL_SCREENSHOT_ROOT}/ screenshot assets`,
);
expect(ascAudit?.storeConfig?.screenshotRefs === 144, "ASC audit must report 144 configured screenshot references");
expect(ascAudit?.storeConfig?.iphoneScreenshotRefs === 119, "ASC audit must report 119 configured iPhone screenshot references");
expect(ascAudit?.storeConfig?.ipadScreenshotRefs === 25, "ASC audit must report 25 configured iPad screenshot references");
expect((ascAudit?.storeConfig?.missingScreenshotRefs || []).length === 0, "configured screenshot references must all exist");
expect((ascAudit?.storeConfig?.nonCanonicalScreenshotRefs || []).length === 0, "configured screenshots must all use the canonical root");
expect((ascAudit?.storeConfig?.legacyScreenshotRefs || []).length === 0, "configured screenshots must not use screenshot-pop");
expect((ascAudit?.storeConfig?.screenshotDimensionMismatches || []).length === 0, "configured screenshots must pass Apple dimension checks");
expect(canonicalPngs.length >= 144, `canonical screenshot root must contain at least the 144 configured PNGs, found ${canonicalPngs.length}`);
expect(canonicalIphonePngs.length >= 119, `canonical screenshot root must contain at least 119 iPhone PNGs, found ${canonicalIphonePngs.length}`);
expect(canonicalIpadPngs.length >= 25, `canonical screenshot root must contain at least 25 iPad PNGs, found ${canonicalIpadPngs.length}`);
expect(
  readText(COPY_B_HUMAN_REVIEW_PATH).includes("BLOCKED - DO NOT SUBMIT PPO"),
  "GPT Image 2.0 Treatment B must remain explicitly blocked by the independent human review",
);
expect(notesReport.includes("Result: PASS"), "notes scanner stress report must pass");
expect(syllabusReport.includes("Result: PASS"), "syllabus scanner stress report must pass");
expect((widgetQa?.rendererAssertions || []).length >= 8, "widget QA must include renderer safeguards");
expect((widgetQa?.scenarios || []).length >= 4, "widget QA must include the four back-to-school widget scenarios");
expect(widgetNoCrop?.result === "pass", "widget no-crop validation must pass");
expect(Number(widgetNoCrop?.localesValidated || 0) >= 13, "widget no-crop validation must cover at least 13 locales");
for (const fragment of requiredCommandFragments) {
  expect(nominationReadyCommand.includes(fragment), `check:nomination-ready must run ${fragment}`);
}

for (const blocker of ascAudit?.readinessBlockers || []) {
  readinessBlockers.push(`ASC app-version media: ${blocker}`);
}
block(
  ascAudit?.currentAppVersionMedia?.target?.version === "2.0.8" &&
    ascAudit?.currentAppVersionMedia?.target?.buildNumber === "80" &&
    ascAudit?.currentAppVersionMedia?.target?.bundleIdentifier === "com.mattnewman.studyplanner",
  "current release identity must be iOS 2.0.8 build 80 / com.mattnewman.studyplanner",
);
if ((ascAudit?.readinessBlockers || []).length === 0) {
  block(ascAudit?.appVersionMediaReady === true, "ASC app-version media gate must pass before the app version can be submitted for review");
  block(ascAudit?.humanUploadAuthorized === true, "a named human must authorize the exact Build 80 app-version media set");
}

warn(
  copyBFinalMechanicallyComplete,
  "GPT Image 2.0 Treatment B mechanical evidence is incomplete; the treatment remains blocked regardless",
);
warn(
  deterministicNominationFilesPresent,
  "one or more July 9 internal nomination-media candidates is missing; these candidates are historical and never upload-authorized",
);
warn(
  copyBManualReady,
  "the historical Treatment B generation queue is incomplete; this does not change the Treatment B blocked verdict",
);

const allFailures = [...failures, ...readinessBlockers];
const payload = {
  generatedAt: new Date().toISOString(),
  status: allFailures.length
    ? "historical_nomination_submitted_current_app_version_media_blocked"
    : "historical_nomination_submitted_app_version_media_authorized",
  nominationAlreadySubmitted: ascAudit?.historicalJuly9Submission?.featuringNomination?.submitted === true,
  inAppEventAlreadySubmitted: ascAudit?.historicalJuly9Submission?.inAppEvent?.submitted === true,
  currentAppVersionMediaReady: allFailures.length === 0,
  submissionReady: allFailures.length === 0,
  decision:
    "The July 9 In-App Event and featuring nomination are historical submitted state. They do not authorize the current iOS 2.0.8 Build 80 app-version media, which remains blocked until exact-binary provenance and human authorization pass.",
  historicalJuly9Submission: ascAudit?.historicalJuly9Submission || null,
  currentAppVersionMedia: {
    target: ascAudit?.currentAppVersionMedia?.target || {
      version: "2.0.8",
      buildNumber: "80",
      bundleIdentifier: "com.mattnewman.studyplanner",
    },
    evidencePath: ascAudit?.currentAppVersionMedia?.evidencePath || null,
    evidenceExists: ascAudit?.currentAppVersionMedia?.evidenceExists === true,
    evidenceStatus: ascAudit?.currentAppVersionMedia?.evidenceStatus || "missing",
    easBuild: ascAudit?.currentAppVersionMedia?.easBuild || null,
    ipa: ascAudit?.currentAppVersionMedia?.ipa || null,
    appStoreConnect: ascAudit?.currentAppVersionMedia?.appStoreConnect || null,
    exactBinaryScreenshotProvenance:
      ascAudit?.currentAppVersionMedia?.exactBinaryScreenshotProvenance || { iphone: null, ipad: null },
    appPreview: ascAudit?.currentAppVersionMedia?.appPreview || { decision: "missing" },
    humanUploadAuthorization: ascAudit?.currentAppVersionMedia?.humanUploadAuthorization || null,
  },
  standardAppVersionScreenshots: {
    status: ascAudit?.appVersionMediaReady ? "exact_binary_authorized" : "configured_but_not_exact_binary_authorized",
    root: CANONICAL_SCREENSHOT_ROOT,
    rootPngs: canonicalPngs.length,
    rootIphonePngs: canonicalIphonePngs.length,
    rootIpadPngs: canonicalIpadPngs.length,
    configuredRefs: ascAudit?.storeConfig?.screenshotRefs || 0,
    configuredIphoneRefs: ascAudit?.storeConfig?.iphoneScreenshotRefs || 0,
    configuredIpadRefs: ascAudit?.storeConfig?.ipadScreenshotRefs || 0,
    uploadApproved: ascAudit?.humanUploadAuthorized === true && ascAudit?.appVersionMediaReady === true,
  },
  historicalInternalCandidates: {
    deterministicJuly9EnUs: {
      status: deterministicNominationFilesPresent ? "present_not_upload_authorized" : "historical_files_incomplete",
      root: DETERMINISTIC_NOMINATION_ROOT,
      locale: "en-US",
      device: "APP_IPHONE_65",
      selectedCount: deterministicNominationFiles.filter((path) => existsSync(path)).length,
      selectedFiles: deterministicNominationFiles,
      uploadApproved: false,
      sourceManifest:
        "qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/manifest.json",
      exactBinaryProvenance: false,
      role: "historical internal review only; not the configured standard upload set",
    },
  },
  localQualityGates: {
    requiredLocalGates: {
      ascAppVersionMedia: ascAudit?.status || "missing",
      firstExperience: firstExperienceAudit?.status || "missing",
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
    status: "BLOCKED_DO_NOT_UPLOAD",
    uploadApproved: false,
    allTreatmentBAssetsBlocked: true,
    mechanicalFileMatrixComplete: copyBFinalMechanicallyComplete,
    humanReview: COPY_B_HUMAN_REVIEW_PATH,
    blockers: [
      "Independent review found product-UI drift, localization errors, visible seams, and contradictory or incomplete provenance.",
      "All raw, resized, upscaled, finalized, or otherwise derived GPT Image 2.0 Treatment B assets are evidence only.",
    ],
    notNominationBlocking: true,
    queueAudit: COPY_B_QUEUE_AUDIT_PATH,
    finalAudit: existsSync(COPY_B_FINAL_AUDIT_PATH) ? COPY_B_FINAL_AUDIT_PATH : null,
  },
  currentReleaseActions: ascAudit?.remainingExternalChecks || [],
  warnings: [
    ...warnings,
    "The July 9 event and nomination are already submitted; do not treat their historical packet as current app-version media approval.",
    "Current Build 80 app-version media remains blocked until the ASC app-version media gate passes.",
    "Do not upload any GPT Image 2.0 Treatment B asset to App Store Connect.",
    "Do not upload a widget/Home Screen slide without exact submitted-binary provenance and human review.",
  ],
  controlPlaneFailures: failures,
  readinessBlockers,
  failures: allFailures,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (allFailures.length) {
  console.error("Nomination submit readiness failed:");
  for (const failure of allFailures) console.error(`- ${failure}`);
  console.error(`Audit written to ${OUTPUT_PATH}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("Nomination submit readiness warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

console.log("Historical nomination state and current app-version media evidence refreshed.");
console.log(`Canonical configured screenshots: ${ascAudit?.storeConfig?.screenshotRefs || 0}`);
console.log(`GPT Image 2.0 Treatment B status: ${payload.optionalPpoCopyB.status}`);
console.log(`Audit written to ${OUTPUT_PATH}`);
