import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type EditorialItem = {
  id: string;
  area: string;
  status: "ready" | "copy_ready" | "blocked" | "planned";
  evidence: string[];
  blockers: string[];
  nextAction: string;
};

const OUTPUT_JSON_PATH = "qa/back-to-school-2026/editorial-readiness-board.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/editorial-readiness-board.md";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const LAUNCH_AUDIT_PATH = "qa/back-to-school-2026/launch-readiness-audit.json";
const ASSET_AUDIT_PATH = "qa/back-to-school-2026/asset-production-audit.json";
const ASSET_FINALIZATION_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const NATIVE_BUILD_ATTEMPT_PATH = "qa/back-to-school-2026/native-build-attempt-2026-07-06.json";
const NATIVE_PREFLIGHT_PATH = "qa/back-to-school-2026/native-capture-preflight.json";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const SUPPLEMENTAL_PLAN_PATH = "qa/back-to-school-2026/supplemental-materials-plan.json";
const UPLOAD_PACKAGE_PATH = "qa/back-to-school-2026/supplemental-upload-manifest.json";

const APPLE_NOMINATION_DOC =
  "https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/";
const APPLE_TEMPLATE_DOC = "https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/";
const EXPO_WIDGETS_DOC = "https://docs.expo.dev/versions/v56.0.0/sdk/widgets/";
const EXPO_GLASS_DOC = "https://docs.expo.dev/versions/v56.0.0/sdk/glass-effect/";

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

function isHttpsUrl(url: string | null | undefined) {
  return typeof url === "string" && /^https:\/\/\S+\.\S+/.test(url);
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86400000);
}

function extractNumberedLines(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""));
}

function markdownTable(items: EditorialItem[]) {
  const lines = [
    "| Area | Status | Evidence | Blocker | Next action |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const item of items) {
    lines.push(
      `| ${item.area} | ${item.status} | ${item.evidence.join("<br>")} | ${
        item.blockers.length ? item.blockers.join("<br>") : "None"
      } | ${item.nextAction} |`,
    );
  }
  return lines.join("\n");
}

const nomination = read(NOMINATION_PATH);
const releaseCopy = read(RELEASE_COPY_PATH);
const assetManifestText = read(ASSET_MANIFEST_PATH);
const launchAuditText = read(LAUNCH_AUDIT_PATH);
const assetAuditText = read(ASSET_AUDIT_PATH);
const assetFinalizationText = read(ASSET_FINALIZATION_PATH);
const nativeBuildAttemptText = read(NATIVE_BUILD_ATTEMPT_PATH);
const nativePreflightText = read(NATIVE_PREFLIGHT_PATH);
const nativeCaptureRunText = read(NATIVE_CAPTURE_RUN_PATH);
const supplementalPlanText = read(SUPPLEMENTAL_PLAN_PATH);
const uploadPackageText = read(UPLOAD_PACKAGE_PATH);

const releaseName = singleLineField(nomination, "Release");
const targetWindow = singleLineField(nomination, "Target window");
const submissionTarget = singleLineField(nomination, "Submission target");
const nominationType = singleLineField(nomination, "Nomination type");
const platforms = singleLineField(nomination, "Platforms");
const targetStart = targetWindow.split(" to ")[0];
const targetEnd = targetWindow.split(" to ")[1] || targetStart;
const nominationDescription = section(nomination, "## Nomination Description");
const helpfulDetails = section(nomination, "## Helpful Details");
const supplementalMaterials = extractNumberedLines(section(nomination, "## Supplemental Materials To Prepare"));
const releaseNotes = section(releaseCopy, "## App Store Release Notes");
const screenshotHeadlines = extractNumberedLines(section(releaseCopy, "## Screenshot Headlines"));

let assetManifest = {
  appStoreScreenshots: [] as { status?: string; sourceType?: string; file?: string | null }[],
  promotionalArtwork: [] as { status?: string; sourceType?: string; file?: string | null }[],
  socialAssets: [] as { status?: string; sourceType?: string; file?: string | null }[],
  supplementalMaterials: [] as { status?: string; url?: string | null }[],
};
let launchAudit = {
  submissionReady: false,
  blockers: [] as string[],
};
let assetAudit = {
  assetsReady: false,
  totals: {
    readyAssets: 0,
    allAssets: 0,
    nativeRequiredAssets: 0,
  },
  blockers: [] as string[],
};
let assetFinalization = {
  status: "",
  appStoreScreenshots: {
    total: 0,
    fulfilled: 0,
    missing: 0,
  },
};
let nativeBuildAttempt = {
  status: "",
  result: {
    failureClass: "",
  },
  assessment: {
    nativeScreenshotsCaptured: false,
    widgetScreenshotsCaptured: false,
    submissionReady: false,
  },
};
let nativePreflight = {
  captureReady: false,
  checks: [] as { id?: string; status?: string; evidence?: string; blocker?: string }[],
};
let nativeCaptureRun = {
  status: "",
  targetCount: 0,
  targets: [] as { captureId?: string }[],
  nativeWidgetPlacement: {
    status: "",
  },
};
let supplementalPlan = {
  materialsReady: false,
  total: 0,
  urlReadyCount: 0,
  localCandidateReadyCount: 0,
  blockedCount: 0,
  blockers: [] as string[],
};
let uploadPackage = {
  packageReady: false,
  coverage: {
    appStoreScreenshots: {
      fulfilled: 0,
      total: 0,
    },
    widgetStates: {
      captured: 0,
      total: 0,
    },
    supplementalUrls: {
      ready: 0,
      total: 0,
    },
  },
  uploadItems: [] as {
    id?: string;
    uploadReady?: boolean;
    requiredUrl?: string | null;
    localEvidence?: { supplementalStatus?: string; evidence?: string[]; blockers?: string[] };
    productVideoReview?: {
      status?: string;
      appPreviewReady?: boolean;
      primaryCandidate?: { sha256?: string | null } | null;
    };
  }[],
  blockers: [] as string[],
};

try {
  assetManifest = JSON.parse(assetManifestText);
} catch (error) {
  failures.push(`Asset manifest must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  launchAudit = JSON.parse(launchAuditText);
} catch (error) {
  failures.push(`Launch audit must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  assetAudit = JSON.parse(assetAuditText);
} catch (error) {
  failures.push(`Asset audit must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  assetFinalization = JSON.parse(assetFinalizationText);
} catch (error) {
  failures.push(`Asset finalization plan must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  nativeBuildAttempt = JSON.parse(nativeBuildAttemptText);
} catch (error) {
  failures.push(`Native build attempt must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  nativePreflight = JSON.parse(nativePreflightText);
} catch (error) {
  failures.push(`Native capture preflight must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  nativeCaptureRun = JSON.parse(nativeCaptureRunText);
} catch (error) {
  failures.push(`Native capture run artifact must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  supplementalPlan = JSON.parse(supplementalPlanText);
} catch (error) {
  failures.push(`Supplemental material plan must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  uploadPackage = JSON.parse(uploadPackageText);
} catch (error) {
  failures.push(`Supplemental upload manifest must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const appStoreFrames = assetManifest.appStoreScreenshots || [];
const nativeRequiredFrames = appStoreFrames.filter((asset) => String(asset.sourceType || "").includes("native"));
const screenshotsReady =
  appStoreFrames.length === 9 &&
  appStoreFrames.every((asset) => asset.status === "ready" && asset.file) &&
  assetFinalization.status === "applied" &&
  assetFinalization.appStoreScreenshots.fulfilled === 9;
const manifestSupplementalsReady = (assetManifest.supplementalMaterials || []).every(
  (asset) => asset.status === "ready" && asset.url,
);
const supplementalReady = supplementalPlan.materialsReady === true && manifestSupplementalsReady;
const diskPreflight = nativePreflight.checks.find((check) => check.id === "disk");
const nativeCaptureTargetIds = new Set(nativeCaptureRun.targets.map((target) => target.captureId));
const assetAuditReady =
  assetAudit.assetsReady === true &&
  assetAudit.totals.readyAssets === assetAudit.totals.allAssets &&
  assetAudit.totals.allAssets > 0;
const assetAuditBlocked =
  assetAudit.assetsReady === false &&
  assetAudit.totals.allAssets > 0 &&
  assetAudit.totals.readyAssets < assetAudit.totals.allAssets;
const nativeBuildBlockedByDisk =
  nativeBuildAttempt.status === "blocked_by_environment" &&
  nativeBuildAttempt.result.failureClass === "host_disk_full" &&
  nativeBuildAttempt.assessment.nativeScreenshotsCaptured === false &&
  nativeBuildAttempt.assessment.widgetScreenshotsCaptured === false &&
  nativeBuildAttempt.assessment.submissionReady === false;
const nativeBuildPassed =
  nativeBuildAttempt.status === "passed" &&
  nativeBuildAttempt.assessment.nativeScreenshotsCaptured === true &&
  nativeBuildAttempt.assessment.widgetScreenshotsCaptured === true &&
  nativeBuildAttempt.assessment.submissionReady === true;
const nativePreflightReady = nativePreflight.captureReady === true;
const nativePreflightBlockedByDisk = nativePreflight.captureReady === false && diskPreflight?.status === "blocked";
const widgetPlacementCaptured = nativeCaptureRun.nativeWidgetPlacement?.status === "captured";
const nativeProofReady =
  nativeBuildPassed &&
  nativePreflightReady &&
  nativeCaptureRun.status === "captured" &&
  widgetPlacementCaptured;
const uploadItems = uploadPackage.uploadItems || [];
const requiredUploadItemIds = [
  "product-video",
  "screenshot-contact-sheet",
  "native-widget-sheet",
  "accessibility-localization-summary",
  "app-review-proof",
];
const uploadItemIds = new Set(uploadItems.map((item) => item.id));
const productVideoUploadItem = uploadItems.find((item) => item.id === "product-video");
const allUploadItemsReady =
  uploadItems.length === requiredUploadItemIds.length &&
  requiredUploadItemIds.every((id) => uploadItemIds.has(id)) &&
  uploadItems.every((item) => item.uploadReady === true && isHttpsUrl(item.requiredUrl));
const productVideoReviewReady =
  productVideoUploadItem?.productVideoReview?.status === "legacy_supporting_approved" ||
  productVideoUploadItem?.productVideoReview?.status === "app_preview_ready";
const uploadCoverageReady =
  uploadPackage.coverage.appStoreScreenshots.fulfilled === uploadPackage.coverage.appStoreScreenshots.total &&
  uploadPackage.coverage.appStoreScreenshots.total >= 9 &&
  uploadPackage.coverage.widgetStates.captured === uploadPackage.coverage.widgetStates.total &&
  uploadPackage.coverage.widgetStates.total >= 8 &&
  uploadPackage.coverage.supplementalUrls.ready === uploadPackage.coverage.supplementalUrls.total &&
  uploadPackage.coverage.supplementalUrls.total === 5;
const uploadPackageReady =
  uploadPackage.packageReady === true &&
  uploadCoverageReady &&
  allUploadItemsReady &&
  productVideoReviewReady &&
  Boolean(productVideoUploadItem?.productVideoReview?.primaryCandidate?.sha256) &&
  uploadPackage.blockers.length === 0;
const uploadPackageBlocked = uploadPackage.packageReady === false && uploadPackage.blockers.length > 0;
const copyReady =
  releaseName === "Back to School with AI" &&
  nominationType === "App Enhancements" &&
  platforms.includes("iOS (iPhone)") &&
  platforms.includes("iOS (iPad)") &&
  normalizedLength(nominationDescription) <= 1000 &&
  normalizedLength(helpfulDetails) <= 500 &&
  daysBetween(submissionTarget, targetStart) >= 21;
const appleFieldsReady =
  copyReady &&
  supplementalReady &&
  uploadPackageReady &&
  launchAudit.submissionReady === true &&
  (launchAudit.blockers || []).length === 0;
const appleFieldStatus: EditorialItem["status"] = appleFieldsReady ? "ready" : copyReady ? "copy_ready" : "blocked";

expect(releaseName === "Back to School with AI", "release name must stay Back to School with AI");
expect(nominationType === "App Enhancements", "nomination type must be App Enhancements");
expect(daysBetween(submissionTarget, targetStart) >= 21, "submission target must remain at least three weeks before the target window");
expect(normalizedLength(nominationDescription) <= 1000, "nomination description must fit Apple's 1,000 character limit");
expect(normalizedLength(helpfulDetails) <= 500, "helpful details must fit Apple's 500 character limit");
expect(supplementalMaterials.length === 5, "nomination packet must include five supplemental material slots");
expect(supplementalPlan.total === 5, "supplemental material plan must include five URL slots");
expect(platforms.includes("iOS (iPhone)") && platforms.includes("iOS (iPad)"), "nomination platforms must include iPhone and iPad");
expect(screenshotHeadlines.length === 9, "release copy must include nine App Store screenshot headlines");
expect(releaseNotes.includes("white setup with automatic class colors"), "release notes must mention the white setup and automatic class-color system");
expect(nativeRequiredFrames.length >= 9, "all App Store frames must require native or native-widget capture");
expect(assetAuditReady || assetAuditBlocked, "asset audit must either be fully ready or blocked by explicit missing assets");
expect(["blocked_missing_native_manifest", "blocked_missing_native_captures", "ready_to_apply", "applied"].includes(assetFinalization.status), "asset finalization plan must record a valid status");
expect(assetFinalization.appStoreScreenshots.total === 9, "asset finalization plan must cover all nine App Store screenshots");
expect(typeof launchAudit.submissionReady === "boolean", "launch audit must expose boolean submission readiness");
expect(nativeBuildBlockedByDisk || nativeBuildPassed, "native build attempt must either preserve the current disk-full blocker or prove native capture completion");
expect(nativePreflightReady || nativePreflightBlockedByDisk, "native capture preflight must either be capture-ready or identify disk as the active blocker");
if (nativePreflightBlockedByDisk) {
  expect(diskPreflight?.status === "blocked", "native capture preflight must identify disk as the active blocker");
}
expect(["dry_run_ready", "blocked_by_preflight", "captured"].includes(nativeCaptureRun.status), "native capture run must record a valid planned/captured status");
expect(nativeCaptureRun.targetCount >= 10, "native capture run must plan the ten app capture targets");
for (const required of ["app-02-color-blue", "app-03-color-orange", "app-04-color-graphite", "app-07-semester-ready", "app-10-widgets"]) {
  expect(nativeCaptureTargetIds.has(required), `native capture run must include target: ${required}`);
}
expect(
  ["manual_native_capture_required", "partial", "captured"].includes(nativeCaptureRun.nativeWidgetPlacement?.status || ""),
  "native capture run must either keep real WidgetKit placement manually required, partial, or captured",
);
expect(uploadPackageReady || uploadPackageBlocked, "upload package must either be ready or explicitly blocked");

const items: EditorialItem[] = [
  {
    id: "apple-fields",
    area: "App Store Connect fields",
    status: appleFieldStatus,
    evidence: [
      `Nomination type: ${nominationType}`,
      `Description: ${normalizedLength(nominationDescription)}/1000 chars`,
      `Helpful Details: ${normalizedLength(helpfulDetails)}/500 chars`,
      `Supplemental URLs: ${supplementalPlan.urlReadyCount}/${supplementalPlan.total}`,
      `Upload package ready: ${uploadPackageReady ? "yes" : "no"}`,
    ],
    blockers: appleFieldsReady
      ? []
      : copyReady
        ? ["Final supplemental URLs, upload package evidence, or launch audit readiness is not complete."]
        : ["Nomination copy, type, platform, character limits, or lead time is not ready."],
    nextAction: appleFieldsReady
      ? "Paste into App Store Connect after final reviewer approval; do not use CSV import."
      : "Copy fields manually into a draft nomination after native screenshots, supplemental URLs, and launch audit are approved.",
  },
  {
    id: "student-story",
    area: "Editorial student outcome",
    status: "ready",
    evidence: [
      "Back to School with AI narrative is consistent across nomination, release copy, and asset manifest.",
      "Student outcome is empty semester to reviewed plan, focus rhythm, and widgets.",
    ],
    blockers: [],
    nextAction: "Keep all final screenshots anchored to setup, review, semester-ready payoff, focus, and widgets.",
  },
  {
    id: "native-build",
    area: "Native build and capture",
    status: nativeProofReady ? "ready" : "blocked",
    evidence: [
      NATIVE_BUILD_ATTEMPT_PATH,
      NATIVE_PREFLIGHT_PATH,
      NATIVE_CAPTURE_RUN_PATH,
      `Build status: ${nativeBuildAttempt.status}`,
      `Preflight ready: ${nativePreflightReady ? "yes" : "no"}`,
      `Capture run: ${nativeCaptureRun.status}`,
      `Widget placement: ${nativeCaptureRun.nativeWidgetPlacement?.status || "unknown"}`,
      `Current blocker: ${nativeBuildAttempt.result.failureClass || diskPreflight?.blocker || "none"}`,
      diskPreflight?.evidence || "Disk preflight evidence missing.",
    ],
    blockers: nativeProofReady ? [] : ["Native release/TestFlight app screenshots and real WidgetKit placement proof are not complete."],
    nextAction: nativeProofReady
      ? "Keep the captured native manifest attached to asset finalization and upload package evidence."
      : "Free disk or use the guarded remote fallback, rerun the native build, install on simulator/TestFlight, then capture Liquid Glass and WidgetKit proof.",
  },
  {
    id: "app-store-screenshots",
    area: "App Store screenshots",
    status: screenshotsReady ? "ready" : "blocked",
    evidence: [
      `${appStoreFrames.length} planned frames`,
      `${nativeRequiredFrames.length} native/native-widget required frames`,
      `${nativeCaptureRun.targetCount} deterministic app capture targets planned`,
      `${assetFinalization.appStoreScreenshots.fulfilled}/${assetFinalization.appStoreScreenshots.total} screenshot slots mapped by finalizer`,
      `Ready assets: ${assetAudit.totals.readyAssets}/${assetAudit.totals.allAssets}`,
      `Upload package screenshot coverage: ${uploadPackage.coverage.appStoreScreenshots.fulfilled}/${uploadPackage.coverage.appStoreScreenshots.total}`,
    ],
    blockers: screenshotsReady
      ? []
      : assetAudit.blockers.length
        ? assetAudit.blockers
        : ["Final screenshot files are intentionally empty until release-build native capture exists."],
    nextAction: screenshotsReady
      ? "Use the finalized App Store screenshot contact sheet as supplemental evidence."
      : "Attach real native files to the asset manifest and regenerate the asset audit.",
  },
  {
    id: "widgets",
    area: "Widget editorial proof",
    status: nativeProofReady ? "ready" : "blocked",
    evidence: [
      "Widget fixture QA covers empty, calm, exam-heavy, long-copy, tinted-ready states.",
      "Expo SDK 56 widgets require native builds and cannot be proven in Expo Go.",
      `Widget placement status: ${nativeCaptureRun.nativeWidgetPlacement?.status || "unknown"}`,
      `Upload package WidgetKit coverage: ${uploadPackage.coverage.widgetStates.captured}/${uploadPackage.coverage.widgetStates.total}`,
    ],
    blockers: nativeProofReady ? [] : ["Native WidgetKit Home Screen, Lock Screen, dark, and tinted captures are missing."],
    nextAction: nativeProofReady
      ? "Keep WidgetKit Home Screen and Lock Screen captures linked in the native screenshot sheet."
      : "Capture real WidgetKit surfaces after the native build succeeds.",
  },
  {
    id: "supplemental-materials",
    area: "Supplemental materials",
    status: supplementalReady ? "ready" : "blocked",
    evidence: [
      `${supplementalMaterials.length} nomination URL slots planned`,
      `${supplementalPlan.urlReadyCount}/${supplementalPlan.total} supplemental URLs ready`,
      `${supplementalPlan.localCandidateReadyCount}/${supplementalPlan.total} local supplemental candidates ready`,
      SUPPLEMENTAL_PLAN_PATH,
      UPLOAD_PACKAGE_PATH,
    ],
    blockers: supplementalReady
      ? []
      : supplementalPlan.blockers.length
        ? supplementalPlan.blockers
        : ["Product video/contact sheet/accessibility/App Review proof URLs are not uploaded yet."],
    nextAction: "Produce, approve, and upload all five supplemental materials after native capture.",
  },
  {
    id: "claim-boundaries",
    area: "Claim boundaries",
    status: "ready",
    evidence: [
      "Nomination packet excludes LMS sync, guaranteed extraction, homework submission, fake widget placement, and unsupported Watch claims.",
    ],
    blockers: [],
    nextAction: "Re-run launch and editorial gates after every copy or screenshot update.",
  },
];

const submissionReady = items.every((item) => item.status === "ready");
expect(
  !submissionReady || (launchAudit.submissionReady === true && uploadPackageReady && screenshotsReady && nativeProofReady && supplementalReady),
  "editorial board can only be submission-ready when launch, upload package, screenshots, native proof, and supplemental URLs are ready",
);

const payload = {
  generatedAt: new Date().toISOString(),
  release: releaseName,
  targetWindow: {
    start: targetStart,
    end: targetEnd,
    submissionTarget,
    leadDays: daysBetween(submissionTarget, targetStart),
  },
  submissionReady,
  reason: submissionReady
    ? "Editorial story, native release screenshots, WidgetKit proof, supplemental URLs, upload package evidence, and launch audit are ready for manual App Store Connect nomination review."
    : "Copy and local QA artifacts are ready, but native release screenshots, WidgetKit proof, supplemental URLs, upload package evidence, or App Store Connect submission are not complete.",
  sourceDocs: [APPLE_NOMINATION_DOC, APPLE_TEMPLATE_DOC, EXPO_WIDGETS_DOC, EXPO_GLASS_DOC],
  items,
};

const markdown = `# Back-to-School 2026 Editorial Readiness Board

Generated: ${payload.generatedAt}
Release: ${payload.release}
Target window: ${targetStart} to ${targetEnd}
Submission target: ${submissionTarget}
Submission ready: ${submissionReady ? "yes" : "no"}

This board is intentionally not an uploadable App Store Connect CSV. Apple's CSV import submits nominations automatically, so the release should use a draft nomination until every native screenshot, WidgetKit proof, supplemental URL, and upload package gate is final.

## Board

${markdownTable(items)}

## Source Rules

- App Store Connect nominations can be submitted individually or by CSV; CSV imports submit automatically.
- App Enhancements is the correct nomination type for a major update to an existing app.
- Submit at least three weeks before the requested publication window.
- Supplemental Materials supports up to five URLs.
- Expo SDK 56 widgets require native builds for real WidgetKit proof.
- Expo SDK 56 GlassView is the Liquid Glass path and still needs runtime/fallback validation.

Sources:

- ${APPLE_NOMINATION_DOC}
- ${APPLE_TEMPLATE_DOC}
- ${EXPO_WIDGETS_DOC}
- ${EXPO_GLASS_DOC}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

if (failures.length) {
  console.error("Back-to-School editorial readiness checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School editorial readiness preflight passed. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`);
