import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type ScreenshotAudit = {
  path: string;
  width: number;
  height: number;
  bytes: number;
};

const OUTPUT_PATH = "qa/back-to-school-2026/launch-readiness-audit.json";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const EVIDENCE_PATH = "docs/launch/back-to-school-2026/implementation-evidence.md";
const NATIVE_RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md";
const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const WIDGET_QA_PATH = "qa/widgets/back-to-school-2026-widget-qa.json";
const NATIVE_BUILD_ATTEMPT_PATH = "qa/back-to-school-2026/native-build-attempt-2026-07-06.json";
const NATIVE_DISK_PATH = "qa/back-to-school-2026/native-disk-readiness.json";
const NATIVE_DISK_RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-disk-cleanup-runbook.md";
const SUPPLEMENTAL_PLAN_PATH = "qa/back-to-school-2026/supplemental-materials-plan.json";
const UPLOAD_PACKAGE_PATH = "qa/back-to-school-2026/supplemental-upload-manifest.json";
const MARKETING_PACKAGE_PATH = "qa/back-to-school-2026/marketing-asset-package-manifest.json";
const REMOTE_CAPTURE_PATH = "qa/back-to-school-2026/remote-capture-readiness.json";

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
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

function extractNumberedLines(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""));
}

function extractBulletedPaths(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- `"))
    .map((line) => line.replace(/^- `/, "").replace(/`$/, ""));
}

function jpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return { width: 0, height: 0 };
}

function imageDimensions(path: string): ScreenshotAudit {
  const buffer = readFileSync(path);
  const isPng = buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.length > 10 && buffer[0] === 0xff && buffer[1] === 0xd8;
  const jpeg = isJpeg ? jpegDimensions(buffer) : { width: 0, height: 0 };
  const width = isPng ? buffer.readUInt32BE(16) : jpeg.width;
  const height = isPng ? buffer.readUInt32BE(20) : jpeg.height;
  expect(isPng || isJpeg, `${path} must be a PNG or JPEG`);
  expect((isPng && path.endsWith(".png")) || (isJpeg && path.endsWith(".jpg")), `${path} extension must match its image encoding`);
  return {
    path,
    width,
    height,
    bytes: buffer.length,
  };
}

function assertMarketingClaims(text: string, label: string) {
  const lower = text.toLowerCase();
  const banned = [
    "canvas sync",
    "lms sync",
    "guaranteed extraction",
    "automatic homework submission",
    "watch app",
    "live activity",
  ];
  for (const phrase of banned) {
    expect(!lower.includes(phrase), `${label} must not claim unsupported ${phrase}`);
  }
}

const nomination = read(NOMINATION_PATH);
const releaseCopy = read(RELEASE_COPY_PATH);
const evidence = read(EVIDENCE_PATH);
const nativeRunbook = read(NATIVE_RUNBOOK_PATH);
const assetManifest = read(ASSET_MANIFEST_PATH);
const widgetQa = read(WIDGET_QA_PATH);
const nativeBuildAttempt = read(NATIVE_BUILD_ATTEMPT_PATH);
const nativeDiskText = read(NATIVE_DISK_PATH);
const nativeDiskRunbook = read(NATIVE_DISK_RUNBOOK_PATH);
const supplementalPlanText = read(SUPPLEMENTAL_PLAN_PATH);
const uploadPackageText = read(UPLOAD_PACKAGE_PATH);
const marketingPackageText = read(MARKETING_PACKAGE_PATH);
const remoteCaptureText = read(REMOTE_CAPTURE_PATH);

const targetWindow = singleLineField(nomination, "Target window");
const submissionTarget = singleLineField(nomination, "Submission target");
const targetStart = targetWindow.split(" to ")[0];
const nominationDescription = section(nomination, "## Nomination Description");
const helpfulDetails = section(nomination, "## Helpful Details");
const supplementalMaterials = extractNumberedLines(section(nomination, "## Supplemental Materials To Prepare"));
const releaseNotes = section(releaseCopy, "## App Store Release Notes");
const screenshotHeadlines = extractNumberedLines(section(releaseCopy, "## Screenshot Headlines"));
const launchBlog = section(releaseCopy, "## Launch Blog Draft");
const socialCutdowns = section(releaseCopy, "## Social Cutdowns");
const webScreenshotPaths = extractBulletedPaths(section(evidence, "## Web Smoke Screenshots"));

expect(singleLineField(nomination, "Release") === "Back to School with AI", "nomination release name must stay Back to School with AI");
expect(singleLineField(nomination, "Nomination type") === "App Enhancements", "nomination type must be App Enhancements");
expect(daysBetween(submissionTarget, targetStart) >= 21, "nomination submission target must be at least three weeks before target start");
expect(normalizedLength(nominationDescription) <= 1000, "nomination description must be 1,000 characters or fewer");
expect(normalizedLength(helpfulDetails) <= 500, "helpful details must be 500 characters or fewer");
expect(nomination.includes("developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/"), "nomination packet must cite Apple featuring nomination docs");
expect(nomination.includes("developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/"), "nomination packet must cite Apple nomination template docs");
expect(supplementalMaterials.length === 5, "supplemental materials list must contain five URL-ready asset slots");

expect(releaseNotes.includes("guided semester setup"), "release notes must lead with guided semester setup");
expect(releaseNotes.includes("white setup with automatic class colors"), "release notes must include the white setup and automatic class-color system");
expect(releaseNotes.includes("Semester Calendar widget"), "release notes must include the calendar widget story");
expect(screenshotHeadlines.length === 9, "screenshot headline set must contain nine frames");
for (const required of ["Your semester, cleanly set up", "Import your syllabus", "Review every deadline", "semester plan", "Home Screen"]) {
  expect(screenshotHeadlines.some((headline) => headline.toLowerCase().includes(required.toLowerCase())), `screenshot headlines must cover: ${required}`);
}

assertMarketingClaims(nominationDescription, "nomination description");
assertMarketingClaims(helpfulDetails, "helpful details");
assertMarketingClaims(releaseNotes, "release notes");
assertMarketingClaims(launchBlog, "launch blog");
assertMarketingClaims(socialCutdowns, "social cutdowns");

expect(evidence.includes("This is not a substitute for native iOS Home Screen placement proof."), "evidence must keep widget fixture/native proof boundary");
expect(evidence.includes("Run native iOS build or TestFlight verification"), "evidence must keep native/TestFlight widget verification as still required");
expect(evidence.includes("No fake Home Screen widget placement screenshots."), "evidence must block fake widget placement screenshots");
expect(evidence.includes(NATIVE_BUILD_ATTEMPT_PATH), "evidence must link the latest native build attempt artifact");
expect(webScreenshotPaths.length >= 6, "web smoke screenshot manifest must list at least six captures");

for (const required of ["App Capture Matrix", "Native Widget Capture Matrix", "Accessibility Capture Matrix", "Do not composite Home Screen widget placements", "qa-screenshots/back-to-school-2026-native/manifest.json"]) {
  expect(nativeRunbook.includes(required), `native screenshot QA runbook must include: ${required}`);
}
expect(nativeRunbook.includes(NATIVE_BUILD_ATTEMPT_PATH), "native screenshot QA runbook must link the latest native build attempt artifact");
for (const required of ["app-02-color-blue", "app-03-color-orange", "app-04-color-graphite", "app-07-semester-ready", "widget-03-exam-heavy-medium", "widget-06-tinted-medium", "ax-02-reduce-transparency", "ax-03-rtl"]) {
  expect(nativeRunbook.includes(required), `native screenshot QA runbook must include capture ID: ${required}`);
}

expect(assetManifest.includes('"appStoreScreenshots"'), "asset manifest must define App Store screenshots");
expect(assetManifest.includes('"store-05-ready"') && assetManifest.includes('"app-07-semester-ready"'), "asset manifest must map semester-ready frame to native capture");
expect(assetManifest.includes('"store-07-heavy-week"') && assetManifest.includes('"widget-03-exam-heavy-medium"'), "asset manifest must map heavy-week frame to native WidgetKit capture");
expect(assetManifest.includes('"store-09-home-screen"') && assetManifest.includes('"widget-06-tinted-medium"'), "asset manifest must keep tinted widget proof in final creative plan");
expect(assetManifest.includes("Web smoke screenshots are implementation evidence only"), "asset manifest must reject web screenshots for App Store creative");

const screenshotAudits: ScreenshotAudit[] = [];
for (const path of webScreenshotPaths) {
  expect(existsSync(path), `web smoke screenshot must exist: ${path}`);
  if (existsSync(path)) {
    const audit = imageDimensions(path);
    screenshotAudits.push(audit);
    expect(audit.width === 390 && audit.height === 844, `${path} must be captured at the documented 390x844 viewport`);
    expect(audit.bytes > 5000, `${path} must be a non-empty screenshot artifact`);
  }
}

let widgetAudit: unknown = null;
try {
  widgetAudit = JSON.parse(widgetQa);
  const audit = widgetAudit as {
    scope?: string;
    rendererAssertions?: string[];
    scenarios?: { name: string }[];
  };
  const scenarioNames = (audit.scenarios || []).map((scenario) => scenario.name);
  expect(String(audit.scope || "").includes("Native iOS Home Screen placement still requires"), "widget QA artifact must state native placement boundary");
  expect((audit.rendererAssertions || []).some((item) => item.includes("tinted")), "widget QA artifact must cover tinted/accented renderer behavior");
  for (const required of ["empty-graphite-onboarding", "calm-green-semester", "exam-heavy-purple-semester", "long-copy-pink-detailed"]) {
    expect(scenarioNames.includes(required), `widget QA artifact must include scenario: ${required}`);
  }
} catch (error) {
  failures.push(`Widget QA artifact must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let nativeBuildAttemptAudit: unknown = null;
let nativeBuildReady = false;
let nativeBuildBlockers = ["Native iOS build rerun after freeing disk for Xcode DerivedData"];
try {
  nativeBuildAttemptAudit = JSON.parse(nativeBuildAttempt);
  const audit = nativeBuildAttemptAudit as {
    status?: string;
    result?: {
      exitCode?: number;
      failureClass?: string;
      primaryError?: string;
    };
    assessment?: {
      nativeScreenshotsCaptured?: boolean;
      widgetScreenshotsCaptured?: boolean;
      submissionReady?: boolean;
    };
  };
  const blockedByDisk =
    audit.status === "blocked_by_environment" &&
    audit.result?.exitCode === 65 &&
    audit.result?.failureClass === "host_disk_full" &&
    audit.result?.primaryError === "No space left on device" &&
    audit.assessment?.nativeScreenshotsCaptured === false &&
    audit.assessment?.widgetScreenshotsCaptured === false &&
    audit.assessment?.submissionReady === false;
  const passedWithNativeProof =
    audit.status === "passed" &&
    audit.assessment?.nativeScreenshotsCaptured === true &&
    audit.assessment?.widgetScreenshotsCaptured === true &&
    audit.assessment?.submissionReady === true;
  expect(blockedByDisk || passedWithNativeProof, "native build attempt must either preserve the current disk blocker or prove native screenshot/widget capture completion");
  nativeBuildReady = passedWithNativeProof;
  nativeBuildBlockers = nativeBuildReady ? [] : ["Native iOS build rerun after freeing disk for Xcode DerivedData"];
} catch (error) {
  failures.push(`Native build attempt artifact must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let nativeDiskAudit: unknown = null;
let nativeDiskReady = false;
let nativeDiskBlockers = ["Free local disk before rerunning native build/capture."];
try {
  nativeDiskAudit = JSON.parse(nativeDiskText);
  const audit = nativeDiskAudit as {
    readyForNativeCapture?: boolean;
    gapGib?: number;
    minFreeDiskGib?: number;
    recoverable?: { autoSafeGib?: number; externalReviewGib?: number };
    cleanupPlan?: {
      runbookPath?: string;
      autoSafeUseful?: boolean;
      externalReviewCanCloseGap?: boolean;
      orderedExternalCandidates?: { id?: string; cumulativeGib?: number; closesGap?: boolean; deleteAutomatically?: boolean }[];
      orderedManualCandidates?: { id?: string; deleteAutomatically?: boolean }[];
    };
    recommendedActions?: string[];
  };
  const diskReady = audit.readyForNativeCapture === true && (audit.gapGib || 0) <= 0;
  const diskBlocked = audit.readyForNativeCapture === false && (audit.gapGib || 0) > 0;
  expect(diskReady || diskBlocked, "native disk readiness must either be ready with no gap or blocked with a measured free-space gap");
  expect(audit.minFreeDiskGib === 15, "native disk readiness must use the 15 GiB capture threshold");
  if (diskBlocked) {
    expect((audit.recoverable?.autoSafeGib || 0) < (audit.gapGib || 0), "native disk readiness must show project-local auto-safe cleanup is insufficient while blocked");
    expect((audit.recommendedActions || []).some((action) => action.includes("Free at least")), "native disk readiness must include an actionable cleanup recommendation while blocked");
    expect(audit.cleanupPlan?.runbookPath === NATIVE_DISK_RUNBOOK_PATH, "native disk readiness must link the cleanup runbook while blocked");
    expect(audit.cleanupPlan?.autoSafeUseful === false, "native disk readiness must state auto-safe cleanup cannot close the current gap");
    expect(audit.cleanupPlan?.externalReviewCanCloseGap === true, "native disk readiness must identify external-review candidates that can close the current gap");
    expect((audit.cleanupPlan?.orderedExternalCandidates || []).some((candidate) => candidate.closesGap === true), "native disk readiness must rank at least one external candidate set that closes the gap");
    expect((audit.cleanupPlan?.orderedExternalCandidates || []).every((candidate) => candidate.deleteAutomatically === false), "native disk readiness must not mark external candidates for automatic deletion");
    expect(nativeDiskRunbook.includes("External Review Plan"), "native disk cleanup runbook must include an external review plan");
    expect(nativeDiskRunbook.includes("The script does not remove external candidates automatically."), "native disk cleanup runbook must state external folders are not removed automatically");
    expect(nativeDiskRunbook.includes("Do not delete real WidgetKit, App Store, or launch evidence"), "native disk cleanup runbook must preserve launch evidence guardrails");
  }
  nativeDiskReady = diskReady;
  nativeDiskBlockers = diskReady ? [] : ["Free local disk before rerunning native build/capture."];
} catch (error) {
  failures.push(`Native disk readiness artifact must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let supplementalPlan: unknown = null;
let supplementalMaterialsReady = false;
let supplementalMaterialBlockers = ["Upload all five supplemental materials to stable HTTPS URLs."];
try {
  supplementalPlan = JSON.parse(supplementalPlanText);
	  const audit = supplementalPlan as {
	    materialsReady?: boolean;
	    total?: number;
	    urlReadyCount?: number;
	    localCandidateReadyCount?: number;
	    blockers?: string[];
	    items?: {
	      localCandidates?: { exists?: boolean }[];
	    }[];
	  };
	  const urlsReady = audit.materialsReady === true && audit.total === 5 && audit.urlReadyCount === 5 && (audit.blockers || []).length === 0;
	  const urlsBlocked = audit.materialsReady === false && (audit.blockers || []).length > 0;
	  const hasLocalSupportingCandidate =
	    (audit.localCandidateReadyCount || 0) >= 1 ||
	    (audit.items || []).some((item) => (item.localCandidates || []).some((candidate) => candidate.exists === true));
	  expect(audit.total === 5, "supplemental material plan must cover all five App Store Connect URL slots");
	  expect(urlsReady || urlsBlocked, "supplemental material plan must either have all five URLs ready or list current upload blockers");
	  expect(hasLocalSupportingCandidate, "supplemental material plan must find at least one local supporting candidate");
  supplementalMaterialsReady = urlsReady;
  supplementalMaterialBlockers = urlsReady ? [] : audit.blockers || ["Upload all five supplemental materials to stable HTTPS URLs."];
} catch (error) {
  failures.push(`Supplemental material plan must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let uploadPackage: unknown = null;
let uploadPackageReady = false;
let uploadPackageBlockers = ["App Store Connect draft payload, contact sheet, widget sheet, or upload manifest is not ready."];
try {
  uploadPackage = JSON.parse(uploadPackageText);
  const audit = uploadPackage as {
    packageReady?: boolean;
    generatedFiles?: {
      contactSheet?: { path?: string; bytes?: number };
      widgetSheet?: { path?: string; bytes?: number };
      draftPayload?: { path?: string; bytes?: number };
      accessibilitySummary?: { path?: string; bytes?: number };
      appReviewProof?: { path?: string; bytes?: number };
      productVideoReview?: { path?: string; bytes?: number };
      draftUploadPackage?: { status?: string; path?: string; readmePath?: string; manifestPath?: string; fileCount?: number; bytes?: number };
    };
    coverage?: {
      appStoreScreenshots?: { fulfilled?: number; total?: number };
      widgetStates?: { captured?: number; total?: number };
      supplementalUrls?: { ready?: number; total?: number };
    };
    uploadItems?: {
      id?: string;
      uploadReady?: boolean;
      requiredUrl?: string | null;
      localEvidence?: { supplementalStatus?: string; evidence?: string[]; blockers?: string[] };
      productVideoReview?: { status?: string; appPreviewReady?: boolean; primaryCandidate?: { path?: string; sha256?: string } | null };
    }[];
    blockers?: string[];
  };
  const uploadItems = audit.uploadItems || [];
  const uploadItemIds = new Set(uploadItems.map((item) => item.id));
  const productVideoItem = uploadItems.find((item) => item.id === "product-video");
  const requiredUploadItems = [
    "product-video",
    "screenshot-contact-sheet",
    "native-widget-sheet",
    "accessibility-localization-summary",
    "app-review-proof",
  ];
  const allRequiredItemsPresent = requiredUploadItems.every((id) => uploadItemIds.has(id));
  const allUploadItemsReady =
    uploadItems.length === requiredUploadItems.length &&
    uploadItems.every((item) => item.uploadReady === true && isHttpsUrl(item.requiredUrl));
  const productVideoReviewReady =
    productVideoItem?.productVideoReview?.status === "legacy_supporting_approved" ||
    productVideoItem?.productVideoReview?.status === "app_preview_ready";
  const coverageReady =
    (audit.coverage?.appStoreScreenshots?.fulfilled || 0) >= 9 &&
    audit.coverage?.appStoreScreenshots?.fulfilled === audit.coverage?.appStoreScreenshots?.total &&
    (audit.coverage?.widgetStates?.captured || 0) > 0 &&
    audit.coverage?.widgetStates?.captured === audit.coverage?.widgetStates?.total &&
    audit.coverage?.supplementalUrls?.ready === 5 &&
    audit.coverage?.supplementalUrls?.ready === audit.coverage?.supplementalUrls?.total;
  const packageReady =
    audit.packageReady === true &&
    coverageReady &&
    allRequiredItemsPresent &&
    allUploadItemsReady &&
    productVideoReviewReady &&
    Boolean(productVideoItem?.productVideoReview?.primaryCandidate?.sha256) &&
    (audit.blockers || []).length === 0;
  const packageBlocked = audit.packageReady === false && (audit.blockers || []).length > 0;
  expect(packageReady || packageBlocked, "upload package must either be fully ready or blocked with explicit reasons");
  expect(Boolean(audit.generatedFiles?.contactSheet?.path), "upload package must generate a screenshot contact sheet");
  expect(Boolean(audit.generatedFiles?.widgetSheet?.path), "upload package must generate a native WidgetKit sheet");
  expect(Boolean(audit.generatedFiles?.draftPayload?.path), "upload package must generate a draft App Store Connect payload");
  expect(Boolean(audit.generatedFiles?.accessibilitySummary?.path), "upload package must include accessibility/localization summary");
  expect(Boolean(audit.generatedFiles?.appReviewProof?.path), "upload package must include App Review proof");
  expect(Boolean(audit.generatedFiles?.productVideoReview?.path), "upload package must include the product-video review artifact");
  expect(Boolean(audit.generatedFiles?.draftUploadPackage?.readmePath), "upload package must generate a draft upload package README");
  expect(Boolean(audit.generatedFiles?.draftUploadPackage?.manifestPath), "upload package must generate a draft upload package manifest");
  expect((audit.generatedFiles?.draftUploadPackage?.fileCount || 0) >= 6, "draft upload package must include the draft payload and supplemental local candidates");
  if (audit.generatedFiles?.draftUploadPackage?.readmePath) {
    expect(existsSync(audit.generatedFiles.draftUploadPackage.readmePath), "draft upload package README must exist");
  }
  if (audit.generatedFiles?.draftUploadPackage?.manifestPath) {
    expect(existsSync(audit.generatedFiles.draftUploadPackage.manifestPath), "draft upload package manifest must exist");
  }
  expect(allRequiredItemsPresent, "upload package must track all five supplemental upload items");
  expect(uploadItems.every((item) => typeof item.uploadReady === "boolean"), "upload package items must expose uploadReady booleans");
  expect(uploadItems.every((item) => Boolean(item.localEvidence?.supplementalStatus)), "upload package items must embed supplemental-plan evidence status");
  expect(productVideoReviewReady, "upload package must embed the approved product-video review status");
  expect(Boolean(productVideoItem?.productVideoReview?.primaryCandidate?.sha256), "upload package product-video evidence must include the primary candidate hash");
  expect(audit.coverage?.appStoreScreenshots?.total === 9, "upload package must track all nine App Store screenshots");
  expect(audit.coverage?.widgetStates?.total === 8, "upload package must track all eight native WidgetKit states");
  expect(audit.coverage?.supplementalUrls?.total === 5, "upload package must track all five supplemental URLs");
  uploadPackageReady = packageReady;
  uploadPackageBlockers = packageReady ? [] : audit.blockers || ["App Store Connect draft payload, contact sheet, widget sheet, or upload manifest is not ready."];
} catch (error) {
  failures.push(`Upload package manifest must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let marketingPackage: unknown = null;
let marketingPackageFinalReady = false;
let marketingPackageBlockers = ["Promotional and social marketing asset package is not ready."];
try {
  marketingPackage = JSON.parse(marketingPackageText);
  const audit = marketingPackage as {
    release?: string;
    status?: string;
    draftReady?: boolean;
    finalReady?: boolean;
    readmePath?: string;
    fileCount?: number;
    totalBytes?: number;
    coverage?: {
      promotionalArtwork?: { total?: number; draftCandidates?: number };
      socialAssets?: { total?: number; draftCandidates?: number };
    };
    blockers?: string[];
  };
  expect(audit.release === "Back to School with AI", "marketing package release must be Back to School with AI");
  expect(audit.draftReady === true, "marketing package must have draft local candidates for review");
  expect(Boolean(audit.readmePath), "marketing package must generate a README");
  if (audit.readmePath) expect(existsSync(audit.readmePath), "marketing package README must exist");
  expect((audit.fileCount || 0) >= 5, "marketing package must include at least five local candidate files");
  expect((audit.totalBytes || 0) > 10000, "marketing package must contain non-empty candidate files");
  expect(audit.coverage?.promotionalArtwork?.total === 2, "marketing package must track two promotional artwork slots");
  expect(audit.coverage?.socialAssets?.total === 4, "marketing package must track four social assets");
  expect((audit.coverage?.promotionalArtwork?.draftCandidates || 0) >= 2, "marketing package must include draft candidates for promotional artwork");
  expect((audit.coverage?.socialAssets?.draftCandidates || 0) >= 4, "marketing package must include draft candidates for social assets");
  marketingPackageFinalReady = audit.finalReady === true && (audit.blockers || []).length === 0;
  marketingPackageBlockers = marketingPackageFinalReady ? [] : audit.blockers || ["Finalize promotional and social assets from native release capture proof."];
} catch (error) {
  failures.push(`Marketing asset package manifest must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let remoteCapture: unknown = null;
try {
  remoteCapture = JSON.parse(remoteCaptureText);
  const audit = remoteCapture as {
    remotePlanReady?: boolean;
    startsPaidSession?: boolean;
    profile?: string;
    checks?: { id?: string; status?: string }[];
    runner?: { script?: string; auditPath?: string; planScript?: string; captureScript?: string };
    plan?: { targets?: { captureId?: string; deepLinkLength?: number }[] };
  };
  const readyChecks = (audit.checks || []).filter((check) => check.status === "ready").length;
  expect(audit.remotePlanReady === true, "remote capture fallback plan must be ready while local disk is blocked");
  expect(audit.startsPaidSession === false, "remote capture readiness check must not start a paid simulator session");
  expect(audit.profile === "back-to-school-sim", "remote capture must use the guarded simulator profile");
  expect(readyChecks === 9, "remote capture plan must pass all nine readiness checks");
  expect(audit.runner?.script === "scripts/run-back-to-school-remote-capture.ts", "remote capture plan must point to the guarded runner script");
  expect(audit.runner?.auditPath === "qa/back-to-school-2026/remote-capture-run.json", "remote capture plan must define the runner audit output");
  expect(Boolean(audit.runner?.captureScript?.includes("--artifact-url")), "remote capture runner must require an artifact URL before capture");
  expect((audit.plan?.targets || []).length === 10, "remote capture plan must include all ten app capture deep links");
  expect((audit.plan?.targets || []).every((target) => (target.deepLinkLength || 0) < 3500), "remote capture deep links must stay short enough for simulator routing");
} catch (error) {
  failures.push(`Remote capture readiness artifact must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const nativeEnvironmentReady = nativeBuildReady || nativeDiskReady;
const launchBlockers = [
  ...nativeBuildBlockers,
  ...(nativeEnvironmentReady ? [] : nativeDiskBlockers),
  ...(uploadPackageReady ? [] : uploadPackageBlockers),
  ...(marketingPackageFinalReady ? [] : marketingPackageBlockers),
  ...(uploadPackageReady ? supplementalMaterialBlockers : []),
];
const submissionReady = nativeBuildReady && nativeEnvironmentReady && supplementalMaterialsReady && uploadPackageReady;

const payload = {
  generatedAt: new Date().toISOString(),
  submissionReady,
  reason: submissionReady
    ? "Local launch packet, native capture proof, supplemental URLs, and upload package evidence are ready for manual App Store Connect nomination submission."
    : "Local launch packet and fixture evidence are internally consistent, but native/TestFlight capture, WidgetKit proof, final screenshots, or supplemental URLs remain blockers.",
  charCounts: {
    nominationDescription: normalizedLength(nominationDescription),
    helpfulDetails: normalizedLength(helpfulDetails),
  },
  timeline: {
    submissionTarget,
    targetStart,
    leadDays: daysBetween(submissionTarget, targetStart),
  },
  screenshotAudits,
  nativeBuildAttempt: {
    path: NATIVE_BUILD_ATTEMPT_PATH,
    audit: nativeBuildAttemptAudit,
  },
  nativeDiskReadiness: {
    path: NATIVE_DISK_PATH,
    runbookPath: NATIVE_DISK_RUNBOOK_PATH,
    audit: nativeDiskAudit,
  },
  nativeRunbook: NATIVE_RUNBOOK_PATH,
  assetManifest: ASSET_MANIFEST_PATH,
  supplementalMaterials,
  supplementalPlan: {
    path: SUPPLEMENTAL_PLAN_PATH,
    audit: supplementalPlan,
  },
  uploadPackage: {
    path: UPLOAD_PACKAGE_PATH,
    audit: uploadPackage,
  },
  marketingPackage: {
    path: MARKETING_PACKAGE_PATH,
    audit: marketingPackage,
  },
  remoteCapture: {
    path: REMOTE_CAPTURE_PATH,
    audit: remoteCapture,
  },
  blockers: launchBlockers,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Back-to-School launch readiness checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School launch readiness ${submissionReady ? "ready" : "preflight passed"}. Wrote ${OUTPUT_PATH}.`);
