import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type Gate = {
  id: string;
  status: "ready" | "blocked";
  evidence: string[];
  blockers: string[];
};

const OUTPUT_PATH = "qa/back-to-school-2026/submission-gate.json";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const LAUNCH_AUDIT_PATH = "qa/back-to-school-2026/launch-readiness-audit.json";
const EDITORIAL_BOARD_PATH = "qa/back-to-school-2026/editorial-readiness-board.json";
const ASSET_AUDIT_PATH = "qa/back-to-school-2026/asset-production-audit.json";
const ASSET_FINALIZATION_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const NATIVE_DISK_PATH = "qa/back-to-school-2026/native-disk-readiness.json";
const NATIVE_PREFLIGHT_PATH = "qa/back-to-school-2026/native-capture-preflight.json";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const WIDGET_QA_PATH = "qa/widgets/back-to-school-2026-widget-qa.json";
const SUPPLEMENTAL_PLAN_PATH = "qa/back-to-school-2026/supplemental-materials-plan.json";
const UPLOAD_PACKAGE_PATH = "qa/back-to-school-2026/supplemental-upload-manifest.json";
const REMOTE_CAPTURE_PATH = "qa/back-to-school-2026/remote-capture-readiness.json";

const APPLE_NOMINATION_DOC =
  "https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/";
const APPLE_TEMPLATE_DOC = "https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/";

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function parseJson<T>(path: string, fallback: T): T {
  const raw = read(path);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function section(markdown: string, heading: string) {
  const start = markdown.indexOf(heading);
  if (start < 0) {
    failures.push(`Missing section: ${heading}`);
    return "";
  }
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  return (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
}

function singleLineField(markdown: string, label: string) {
  const line = markdown.split("\n").find((candidate) => candidate.startsWith(`${label}:`));
  if (!line) {
    failures.push(`Missing field: ${label}`);
    return "";
  }
  return line.slice(label.length + 1).trim();
}

function normalizedLength(text: string) {
  return text.replace(/\s+/g, " ").trim().length;
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86400000);
}

function isHttpsUrl(url: string | null | undefined) {
  return typeof url === "string" && /^https:\/\/\S+\.\S+/.test(url);
}

function readiness(condition: boolean, id: string, evidence: string[], blockers: string[]): Gate {
  return {
    id,
    status: condition ? "ready" : "blocked",
    evidence,
    blockers: condition ? [] : blockers,
  };
}

const nomination = read(NOMINATION_PATH);
const launchAudit = parseJson<{
  submissionReady?: boolean;
  timeline?: { submissionTarget?: string; targetStart?: string; leadDays?: number };
  blockers?: string[];
}>(LAUNCH_AUDIT_PATH, {});
const editorialBoard = parseJson<{
  submissionReady?: boolean;
  items?: { id?: string; status?: string; blockers?: string[] }[];
}>(EDITORIAL_BOARD_PATH, {});
const assetAudit = parseJson<{
  assetsReady?: boolean;
  totals?: { allAssets?: number; readyAssets?: number };
  blockers?: string[];
}>(ASSET_AUDIT_PATH, {});
const assetFinalization = parseJson<{
  status?: string;
  appStoreScreenshots?: { total?: number; fulfilled?: number; missing?: number };
}>(ASSET_FINALIZATION_PATH, {});
const nativeDisk = parseJson<{
  readyForNativeCapture?: boolean;
  gapGib?: number;
  recoverable?: { autoSafeGib?: number; externalReviewGib?: number };
}>(NATIVE_DISK_PATH, {});
const nativePreflight = parseJson<{
  captureReady?: boolean;
  checks?: { id?: string; status?: string; evidence?: string; blocker?: string }[];
}>(NATIVE_PREFLIGHT_PATH, {});
const nativeCaptureRun = parseJson<{
  status?: string;
  targetCount?: number;
  nativeWidgetPlacement?: { status?: string };
}>(NATIVE_CAPTURE_RUN_PATH, {});
const widgetQa = parseJson<{
  scenarios?: unknown[];
  scope?: string;
}>(WIDGET_QA_PATH, {});
const supplementalPlan = parseJson<{
  materialsReady?: boolean;
  total?: number;
  urlReadyCount?: number;
  localCandidateReadyCount?: number;
  blockedCount?: number;
  blockers?: string[];
}>(SUPPLEMENTAL_PLAN_PATH, {});
const uploadPackage = parseJson<{
  packageReady?: boolean;
  generatedFiles?: Record<string, { path?: string; bytes?: number } | null>;
  coverage?: {
    appStoreScreenshots?: { fulfilled?: number; total?: number };
    widgetStates?: { captured?: number; total?: number };
    supplementalUrls?: { ready?: number; total?: number };
  };
  uploadItems?: {
    id?: string;
    uploadReady?: boolean;
    requiredUrl?: string | null;
    localFiles?: { path?: string; bytes?: number }[];
    localEvidence?: {
      supplementalStatus?: string;
      evidence?: string[];
      blockers?: string[];
      nextAction?: string | null;
    };
    productVideoReview?: {
      status?: string;
      appPreviewReady?: boolean;
      primaryCandidate?: {
        path?: string | null;
        sha256?: string | null;
        supplementalReady?: boolean;
        appPreviewReady?: boolean;
      } | null;
    };
  }[];
  blockers?: string[];
}>(UPLOAD_PACKAGE_PATH, {});
const remoteCapture = parseJson<{
  remotePlanReady?: boolean;
  startsPaidSession?: boolean;
  profile?: string;
  checks?: { id?: string; status?: string }[];
  plan?: { targets?: unknown[] };
  blockers?: string[];
}>(REMOTE_CAPTURE_PATH, {});

const releaseName = singleLineField(nomination, "Release");
const nominationType = singleLineField(nomination, "Nomination type");
const platforms = singleLineField(nomination, "Platforms");
const targetWindow = singleLineField(nomination, "Target window");
const submissionTarget = singleLineField(nomination, "Submission target");
const targetStart = targetWindow.split(" to ")[0] || "";
const nominationDescription = section(nomination, "## Nomination Description");
const helpfulDetails = section(nomination, "## Helpful Details");
const claimBoundaries = section(nomination, "## App Review Claim Boundaries");
const diskCheck = (nativePreflight.checks || []).find((check) => check.id === "disk");
const editorialBlockedItems = (editorialBoard.items || []).filter((item) => item.status !== "ready");
const requiredUploadItemIds = [
  "product-video",
  "screenshot-contact-sheet",
  "native-widget-sheet",
  "accessibility-localization-summary",
  "app-review-proof",
];
const uploadItems = uploadPackage.uploadItems || [];
const uploadItemIds = new Set(uploadItems.map((item) => item.id));
const productVideoUploadItem = uploadItems.find((item) => item.id === "product-video");
const uploadEvidenceContractReady =
  requiredUploadItemIds.every((id) => uploadItemIds.has(id)) &&
  uploadItems.length === requiredUploadItemIds.length &&
  uploadItems.every((item) => item.uploadReady === true && isHttpsUrl(item.requiredUrl)) &&
  uploadItems.every((item) => Boolean(item.localEvidence?.supplementalStatus) && (item.localEvidence?.evidence || []).length > 0) &&
  (productVideoUploadItem?.productVideoReview?.status === "legacy_supporting_approved" ||
    productVideoUploadItem?.productVideoReview?.status === "app_preview_ready") &&
  Boolean(productVideoUploadItem?.productVideoReview?.primaryCandidate?.sha256);
const uploadEvidenceBlockers = [
  ...requiredUploadItemIds.flatMap((id) => (uploadItemIds.has(id) ? [] : [`Upload package missing supplemental slot: ${id}`])),
  ...uploadItems.flatMap((item) => {
    const itemBlockers = [];
    if (!item.localEvidence?.supplementalStatus) itemBlockers.push(`${item.id || "unknown"} is missing supplemental-plan status evidence.`);
    if (!(item.localEvidence?.evidence || []).length) itemBlockers.push(`${item.id || "unknown"} is missing local evidence details.`);
    return itemBlockers;
  }),
  ...(["legacy_supporting_approved", "app_preview_ready"].includes(productVideoUploadItem?.productVideoReview?.status || "")
    ? []
    : ["Product video upload item is missing approved review status."]),
  ...(productVideoUploadItem?.productVideoReview?.primaryCandidate?.sha256
    ? []
    : ["Product video upload item is missing the primary candidate hash."]),
];

const copyReady =
  releaseName === "Back to School with AI" &&
  nominationType === "App Enhancements" &&
  platforms.includes("iOS (iPhone)") &&
  platforms.includes("iOS (iPad)") &&
  normalizedLength(nominationDescription) <= 1000 &&
  normalizedLength(helpfulDetails) <= 500 &&
  daysBetween(submissionTarget, targetStart) >= 21;

const noUnsupportedClaims =
  claimBoundaries.includes("Canvas") &&
  claimBoundaries.includes("guaranteed syllabus extraction") &&
  claimBoundaries.includes("automatic homework submission") &&
  claimBoundaries.includes("fake Home Screen widget placement");

const gates: Gate[] = [
  readiness(copyReady, "nomination-copy", [
    `Description ${normalizedLength(nominationDescription)}/1000 characters`,
    `Helpful Details ${normalizedLength(helpfulDetails)}/500 characters`,
    `Lead time ${daysBetween(submissionTarget, targetStart)} days`,
    `Type ${nominationType}`,
  ], [
    "Nomination copy, type, platform, character limits, or lead time is not ready.",
  ]),
  readiness(noUnsupportedClaims, "claim-boundaries", [
    "Nomination packet includes claim boundary bullets.",
  ], [
    "Claim boundaries are missing or incomplete.",
  ]),
  readiness(nativePreflight.captureReady === true, "native-capture-preflight", [
    diskCheck?.evidence || "Disk preflight evidence missing.",
    `Disk gap: ${(nativeDisk.gapGib || 0).toFixed(1)} GiB`,
    `Auto-safe cleanup available: ${(nativeDisk.recoverable?.autoSafeGib || 0).toFixed(3)} GiB`,
    NATIVE_DISK_PATH,
  ], [
    diskCheck?.blocker || "Native capture preflight is not ready.",
  ]),
  readiness(remoteCapture.remotePlanReady === true && remoteCapture.startsPaidSession === false, "remote-capture-fallback", [
    `Remote profile: ${remoteCapture.profile || "unknown"}`,
    `${remoteCapture.checks?.filter((check) => check.status === "ready").length || 0}/${remoteCapture.checks?.length || 0} remote readiness checks ready`,
    `${remoteCapture.plan?.targets?.length || 0} remote capture deep links planned`,
    REMOTE_CAPTURE_PATH,
  ], remoteCapture.blockers?.length ? remoteCapture.blockers : [
    "Remote EAS simulator capture fallback is not ready.",
  ]),
  readiness(nativeCaptureRun.status === "captured", "native-app-captures", [
    `Native capture run status: ${nativeCaptureRun.status || "unknown"}`,
    `${nativeCaptureRun.targetCount || 0} deterministic app targets planned`,
  ], [
    "Native app screenshots have not been captured from the release build.",
  ]),
  readiness(assetFinalization.status === "applied" && assetFinalization.appStoreScreenshots?.fulfilled === 9, "app-store-screenshots", [
    `Finalization status: ${assetFinalization.status || "unknown"}`,
    `${assetFinalization.appStoreScreenshots?.fulfilled || 0}/${assetFinalization.appStoreScreenshots?.total || 0} screenshot slots fulfilled`,
  ], [
    "Final App Store screenshot manifest has not been applied from native captures.",
  ]),
  readiness(nativeCaptureRun.nativeWidgetPlacement?.status === "captured", "widgetkit-proof", [
    `Widget placement status: ${nativeCaptureRun.nativeWidgetPlacement?.status || "unknown"}`,
    `${widgetQa.scenarios?.length || 0} fixture scenarios covered`,
  ], [
    "Real WidgetKit Home Screen and Lock Screen placement screenshots are missing.",
  ]),
  readiness(supplementalPlan.materialsReady === true, "supplemental-materials", [
    `${supplementalPlan.urlReadyCount || 0}/${supplementalPlan.total || 0} supplemental URLs ready`,
    `${supplementalPlan.localCandidateReadyCount || 0}/${supplementalPlan.total || 0} local supplemental candidates ready`,
    `${supplementalPlan.blockedCount || 0} supplemental materials blocked`,
    SUPPLEMENTAL_PLAN_PATH,
  ], supplementalPlan.blockers?.length ? supplementalPlan.blockers : [
    "Supplemental product video, contact sheet, widget sheet, accessibility/localization summary, or App Review proof URLs are not ready.",
  ]),
  readiness(uploadPackage.packageReady === true && uploadEvidenceContractReady, "upload-package", [
    `App Store screenshots ${uploadPackage.coverage?.appStoreScreenshots?.fulfilled || 0}/${uploadPackage.coverage?.appStoreScreenshots?.total || 0}`,
    `WidgetKit states ${uploadPackage.coverage?.widgetStates?.captured || 0}/${uploadPackage.coverage?.widgetStates?.total || 0}`,
    `Supplemental URLs ${uploadPackage.coverage?.supplementalUrls?.ready || 0}/${uploadPackage.coverage?.supplementalUrls?.total || 0}`,
    `${uploadItems.filter((item) => item.uploadReady === true).length}/${requiredUploadItemIds.length} supplemental upload items ready`,
    `Product video review status: ${productVideoUploadItem?.productVideoReview?.status || "missing"}`,
    `Product video hash present: ${productVideoUploadItem?.productVideoReview?.primaryCandidate?.sha256 ? "yes" : "no"}`,
    UPLOAD_PACKAGE_PATH,
  ], [
    ...(uploadPackage.blockers?.length ? uploadPackage.blockers : ["App Store Connect draft payload, contact sheet, widget sheet, or upload manifest is not ready."]),
    ...uploadEvidenceBlockers,
  ]),
  readiness(assetAudit.assetsReady === true && assetAudit.totals?.readyAssets === assetAudit.totals?.allAssets, "all-assets-ready", [
    `${assetAudit.totals?.readyAssets || 0}/${assetAudit.totals?.allAssets || 0} assets ready`,
  ], assetAudit.blockers?.length ? assetAudit.blockers : [
    "App Store screenshots, promotional artwork, social assets, supplemental URLs, or optional artifacts are not fully ready.",
  ]),
  readiness(editorialBoard.submissionReady === true && editorialBlockedItems.length === 0, "editorial-board", [
    `${editorialBlockedItems.length} editorial board items blocked`,
  ], [
    "Editorial readiness board still has blocked or planned items.",
  ]),
  readiness(launchAudit.submissionReady === true && (launchAudit.blockers || []).length === 0, "launch-audit", [
    `${(launchAudit.blockers || []).length} launch blockers`,
  ], [
    "Launch readiness audit still records blockers.",
  ]),
];

const submissionReady = gates.every((gate) => gate.status === "ready");
const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  submissionReady,
  recommendedSubmissionMode: submissionReady ? "App Store Connect draft review then manual Submit Nomination" : "Save as Draft only",
  csvAllowed: false,
  csvReason: "Apple says CSV imports are automatically submitted, so this package should not generate an import CSV until every gate is ready.",
  sourceDocs: [APPLE_NOMINATION_DOC, APPLE_TEMPLATE_DOC],
  gates,
  blockers: gates.flatMap((gate) => gate.blockers.map((blocker) => `${gate.id}: ${blocker}`)),
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Back-to-School submission gate failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School submission gate ${submissionReady ? "ready" : "blocked"}. Wrote ${OUTPUT_PATH}.`);
