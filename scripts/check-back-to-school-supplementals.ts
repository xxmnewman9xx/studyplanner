import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative } from "node:path";

type ManifestSupplemental = {
  id: string;
  title: string;
  status?: string;
  url?: string | null;
};

type SupplementalStatus = "url_ready" | "local_candidate_ready" | "blocked";

type LocalCandidate = {
  path: string;
  exists: boolean;
  bytes?: number;
};

type SupplementalItem = {
  id: string;
  title: string;
  manifestStatus: string;
  url: string | null;
  status: SupplementalStatus;
  localCandidates: LocalCandidate[];
  evidence: string[];
  blockers: string[];
  nextAction: string;
};

type SupplementalUrlRegistry = {
  status?: string;
  slots?: { id?: string; url?: string | null; status?: string; reason?: string }[];
};

type ProductVideoReview = {
  status?: string;
  appPreviewReady?: boolean;
  primaryCandidate?: {
    path?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    fps?: number;
    codec?: string;
    sha256?: string;
    supplementalReady?: boolean;
  };
  blockers?: string[];
  warnings?: string[];
};

const OUTPUT_JSON_PATH = "qa/back-to-school-2026/supplemental-materials-plan.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/supplemental-materials-packet.md";
const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const IMPLEMENTATION_EVIDENCE_PATH = "docs/launch/back-to-school-2026/implementation-evidence.md";
const ASSET_FINALIZATION_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const NATIVE_PREFLIGHT_PATH = "qa/back-to-school-2026/native-capture-preflight.json";
const URL_REGISTRY_PATH = "qa/back-to-school-2026/supplemental-url-registry.json";
const PRODUCT_VIDEO_REVIEW_PATH = "qa/back-to-school-2026/product-video-review.json";

const APPLE_NOMINATION_DOC =
  "https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/";
const APPLE_TEMPLATE_DOC = "https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/";
const APPLE_APP_PREVIEW_SPEC_DOC =
  "https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/";
const EXPO_WIDGETS_DOC = "https://docs.expo.dev/versions/v56.0.0/sdk/widgets/";
const EXPO_GLASS_DOC = "https://docs.expo.dev/versions/v56.0.0/sdk/glass-effect/";

const expectedIds = [
  "product-video",
  "screenshot-contact-sheet",
  "native-widget-sheet",
  "accessibility-localization-summary",
  "app-review-proof",
];

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

function readOptionalJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function isHttpsUrl(url: string | null | undefined) {
  return typeof url === "string" && /^https:\/\/\S+\.\S+/.test(url);
}

function localCandidate(path: string): LocalCandidate {
  const exists = existsSync(path);
  return {
    path,
    exists,
    bytes: exists ? statSync(path).size : undefined,
  };
}

function displayPath(path: string) {
  return isAbsolute(path) ? relative(process.cwd(), path) : path;
}

function firstExisting(candidates: LocalCandidate[]) {
  return candidates.find((candidate) => candidate.exists);
}

function formatCandidate(candidate: LocalCandidate) {
  const suffix = candidate.exists ? ` (${candidate.bytes || 0} bytes)` : " (missing)";
  return `${displayPath(candidate.path)}${suffix}`;
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function readManifestSupplemental(id: string, items: ManifestSupplemental[]) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) {
    failures.push(`Asset manifest must define supplemental material: ${id}`);
    return {
      id,
      title: id,
      status: "missing",
      url: null,
    };
  }
  return item;
}

function applyRegisteredUrls(items: ManifestSupplemental[], registry: SupplementalUrlRegistry) {
  const registered = new Map(
    (registry.slots || [])
      .filter((slot) => slot.id && slot.status === "registered" && isHttpsUrl(slot.url))
      .map((slot) => [slot.id as string, slot.url as string]),
  );
  return items.map((item) => ({
    ...item,
    url: registered.get(item.id) || item.url || null,
  }));
}

function materialStatus(urlReady: boolean, localReady: boolean, blockers: string[]): SupplementalStatus {
  if (urlReady && blockers.length === 0) return "url_ready";
  return localReady ? "local_candidate_ready" : "blocked";
}

function buildProductVideo(item: ManifestSupplemental, nativeCaptureStatus: string): SupplementalItem {
  const candidates = [
    localCandidate("marketing/social-launch-video/final/studyplanner-scanner-demo-app-preview-1080x1920.mp4"),
    localCandidate("marketing/social-launch-video/build66-final/build66-studyplanner-app-preview-1080x1920.mp4"),
    localCandidate("marketing/social-launch-video/build66-produced/studyplanner-build66-produced-app-store-1080x1920.mp4"),
    localCandidate("docs/launch/back-to-school-2026/product-video-review.md"),
    localCandidate(PRODUCT_VIDEO_REVIEW_PATH),
  ];
  const existing = firstExisting(candidates);
  const review = readOptionalJson<ProductVideoReview>(PRODUCT_VIDEO_REVIEW_PATH, {});
  const reviewApproved = review.status === "legacy_supporting_approved" || review.status === "app_preview_ready";
  const primary = review.primaryCandidate;
  const urlReady = isHttpsUrl(item.url);
  const blockers = [];
  if (!urlReady) blockers.push("Upload an approved final product video or App Preview to a stable HTTPS URL.");
  if (!reviewApproved) {
    blockers.push("Run or refresh product-video review before using the local video as a supplemental material.");
  }
  if (nativeCaptureStatus !== "captured" && !reviewApproved) {
    blockers.push("Approve the existing scanner video as legacy supporting footage or replace it after Back-to-School native capture.");
  }
  const status = materialStatus(urlReady, Boolean(existing) && reviewApproved, blockers);
  return {
    id: item.id,
    title: item.title,
    manifestStatus: item.status || "unknown",
    url: item.url || null,
    status,
    localCandidates: candidates,
    evidence: [
      existing ? `Local candidate exists: ${formatCandidate(existing)}` : "No local product-video candidate exists.",
      `Product video review status: ${review.status || "missing"}`,
      primary
        ? `Primary video: ${primary.width || 0}x${primary.height || 0}, ${Number(primary.durationSeconds || 0).toFixed(2)}s, ${Number(primary.fps || 0).toFixed(2)}fps, ${primary.codec || "unknown"}`
        : "Primary video metadata missing.",
      `App Preview ready: ${review.appPreviewReady === true ? "yes" : "no"}`,
      `Native capture run status: ${nativeCaptureStatus || "unknown"}`,
    ],
    blockers,
    nextAction: urlReady
      ? "Keep the linked video aligned with final screenshots."
      : reviewApproved
        ? "Upload the approved supplemental product-video candidate to a stable HTTPS URL; replace with native 30fps footage only if using App Store App Preview upload."
        : "Run product-video review, then upload or replace the final video after native capture approval.",
  };
}

function buildScreenshotContactSheet(item: ManifestSupplemental, finalization: {
  status?: string;
  appStoreScreenshots?: { fulfilled?: number; total?: number };
}): SupplementalItem {
  const candidates = [
    localCandidate("docs/launch/back-to-school-2026/app-store-screenshot-contact-sheet.pdf"),
    localCandidate("docs/launch/back-to-school-2026/app-store-screenshot-contact-sheet.md"),
  ];
  const existing = firstExisting(candidates);
  const screenshotsApplied =
    finalization.status === "applied" &&
    finalization.appStoreScreenshots?.fulfilled === finalization.appStoreScreenshots?.total &&
    (finalization.appStoreScreenshots?.total || 0) >= 9;
  const localReady = Boolean(existing) && screenshotsApplied;
  const urlReady = isHttpsUrl(item.url);
  const blockers = [];
  if (!screenshotsApplied || !existing) blockers.push("Generate the screenshot contact sheet from native release captures only.");
  if (!urlReady) blockers.push("Upload the final contact sheet to a stable HTTPS URL.");
  return {
    id: item.id,
    title: item.title,
    manifestStatus: item.status || "unknown",
    url: item.url || null,
    status: materialStatus(urlReady, localReady, blockers),
    localCandidates: candidates,
    evidence: [
      `Asset finalization status: ${finalization.status || "unknown"}`,
      `${finalization.appStoreScreenshots?.fulfilled || 0}/${finalization.appStoreScreenshots?.total || 0} App Store screenshot slots fulfilled`,
      existing ? `Local contact sheet exists: ${formatCandidate(existing)}` : "No local contact sheet exists yet.",
    ],
    blockers,
    nextAction: urlReady ? "Verify the URL after any screenshot refresh." : "Generate contact sheet after asset finalization reaches applied.",
  };
}

function buildWidgetSheet(item: ManifestSupplemental, nativeCaptureRun: {
  nativeWidgetPlacement?: { status?: string };
}): SupplementalItem {
  const candidates = [
    localCandidate("docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.pdf"),
    localCandidate("docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md"),
  ];
  const existing = firstExisting(candidates);
  const widgetCaptured = nativeCaptureRun.nativeWidgetPlacement?.status === "captured";
  const localReady = Boolean(existing) && widgetCaptured;
  const urlReady = isHttpsUrl(item.url);
  const blockers = [];
  if (!widgetCaptured || !existing) blockers.push("Capture real Home Screen and Lock Screen WidgetKit states.");
  if (!urlReady) blockers.push("Upload the widget sheet to a stable HTTPS URL.");
  return {
    id: item.id,
    title: item.title,
    manifestStatus: item.status || "unknown",
    url: item.url || null,
    status: materialStatus(urlReady, localReady, blockers),
    localCandidates: candidates,
    evidence: [
      `Native WidgetKit placement status: ${nativeCaptureRun.nativeWidgetPlacement?.status || "unknown"}`,
      existing ? `Local widget sheet exists: ${formatCandidate(existing)}` : "No local WidgetKit sheet exists yet.",
      "Expo SDK 56 widgets require native WidgetKit proof, not Expo Go or web smoke screenshots.",
    ],
    blockers,
    nextAction: urlReady ? "Keep widget URL aligned with final WidgetKit captures." : "Capture WidgetKit states after native build succeeds.",
  };
}

function buildAccessibilitySummary(item: ManifestSupplemental, nativePreflight: {
  captureReady?: boolean;
}): SupplementalItem {
  const summaryPath = "docs/launch/back-to-school-2026/accessibility-localization-summary.md";
  const candidates = [
    localCandidate(summaryPath),
    localCandidate("localized-screenshot-coverage-report.md"),
    localCandidate("LOCALIZATION_AUDIT.md"),
    localCandidate("runtime-localization-proof.md"),
    localCandidate("widgetkit-localization-proof.md"),
    localCandidate("docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md"),
    localCandidate("qa/widgets/back-to-school-2026-widget-qa.json"),
    localCandidate(IMPLEMENTATION_EVIDENCE_PATH),
  ];
  const existing = candidates.filter((candidate) => candidate.exists);
  const summaryText = existsSync(summaryPath) ? readFileSync(summaryPath, "utf8") : "";
  const appSource = read("App.tsx");
  const buildGateSource = read("scripts/check-build52.mjs");
  const summaryCurrent = [
    "localized white system and automatic class-color labels",
    "personal preview",
    "white setup with automatic class colors",
    "npm run check:build52",
    "npm run test:back-to-school-widgets",
    "Dynamic Type",
    "Reduce Transparency",
  ].every((phrase) => summaryText.includes(phrase));
  const visualSystemSourceReady =
    appSource.includes("const SEMESTER_THEME_COPY") &&
    appSource.includes('const steps = ["name", "preview", "build"]') &&
    appSource.includes('textFor("onboarding.theme_locked_title", "White by default")') &&
    appSource.includes("Course colors appear automatically for classes and widgets.") &&
    !appSource.includes("semesterThemeColors.map");
  const buildGateReady =
    buildGateSource.includes("white system/class-color labels and payoff copy must be localized") &&
    buildGateSource.includes("visible semester color picker must be removed from onboarding") &&
    buildGateSource.includes("personal preview must explain the applied white system with automatic class colors");
  const urlReady = isHttpsUrl(item.url);
  const localReady = existing.length >= 5 && summaryCurrent && visualSystemSourceReady && buildGateReady && nativePreflight.captureReady === true;
  const blockers = [];
  if (!summaryCurrent) blockers.push("Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.");
  if (!visualSystemSourceReady || !buildGateReady) blockers.push("Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.");
  if (!localReady) blockers.push("Summarize localization and accessibility QA with final native screenshots.");
  if (!urlReady) blockers.push("Upload the summary to a stable HTTPS URL.");
  return {
    id: item.id,
    title: item.title,
    manifestStatus: item.status || "unknown",
    url: item.url || null,
    status: materialStatus(urlReady, existing.length >= 3, blockers),
    localCandidates: candidates,
    evidence: [
      `${existing.length}/${candidates.length} local accessibility/localization source files exist`,
      `White setup/class-color accessibility/localization source coverage: ${visualSystemSourceReady ? "yes" : "no"}`,
      `Build metadata white setup/class-color gate coverage: ${buildGateReady ? "yes" : "no"}`,
      `Summary content current: ${summaryCurrent ? "yes" : "no"}`,
      `Native capture preflight ready: ${nativePreflight.captureReady === true ? "yes" : "no"}`,
      "Native runbook includes Dynamic Type, Reduce Transparency, and RTL capture slots.",
    ],
    blockers,
    nextAction: urlReady ? "Re-check URL after native accessibility screenshots change." : "Publish summary after native accessibility capture pass.",
  };
}

function buildAppReviewProof(item: ManifestSupplemental, nomination: string, releaseCopy: string, evidence: string): SupplementalItem {
  const proofPath = "docs/launch/back-to-school-2026/app-review-proof.md";
  const candidates = [
    localCandidate(proofPath),
    localCandidate("docs/launch/2026-05-26/storekit-localization-proof.md"),
    localCandidate("store/apple/localized-upload-qa.txt"),
    localCandidate("scripts/check-hard-paywall-app-gate.mjs"),
    localCandidate("scripts/check-iap-config.mjs"),
    localCandidate("qa/storekit/StudyPlannerLocal.storekit"),
  ];
  const existing = candidates.filter((candidate) => candidate.exists);
  const proofText = existsSync(proofPath) ? readFileSync(proofPath, "utf8") : "";
  const appSource = read("App.tsx");
  const iapSource = read("src/iap.ts");
  const hardPaywallGate = read("scripts/check-hard-paywall-app-gate.mjs");
  const iapGate = read("scripts/check-iap-config.mjs");
  const packageSource = read("package.json");
  const claimBoundaryReady =
    nomination.includes("Do not claim Canvas") &&
    nomination.includes("Do not claim guaranteed syllabus extraction") &&
    nomination.includes("Do not claim automatic homework submission") &&
    evidence.includes("No fake Home Screen widget placement screenshots.") &&
    releaseCopy.includes("white setup with automatic class colors");
  const proofCurrent = [
    "active App Store entitlement",
    "review before anything saves",
    "return to Review",
    "No fake Home Screen widget placement screenshots",
    "npm run test:hard-paywall",
    "npm run check:iap",
    "Shown by App Store",
    "Restore Purchases",
  ].every((phrase) => proofText.includes(phrase));
  const purchaseSourceReady =
    appSource.includes('if (currentImport) nav.replaceTop("review")') &&
    appSource.includes('type EntitlementStatus = "loading" | "active" | "inactive"') &&
    appSource.includes("return entitlementStatus === \"active\";") &&
    appSource.includes("busy || !storePlansReady ? undefined : purchase") &&
    iapSource.includes("storeConnectionPromise = initConnection().catch") &&
    iapSource.includes("const entitlement = await checkStudyPlannerEntitlement()") &&
    iapSource.indexOf("const entitlement = await checkStudyPlannerEntitlement()") < iapSource.indexOf("await finishTransaction") &&
    iapSource.includes("The purchase arrived, but the active subscription is not visible yet") &&
    iapSource.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])") &&
    iapSource.includes('displayPrice: "Shown by App Store"');
  const commandGateReady =
    packageSource.includes('"test:hard-paywall": "node scripts/check-hard-paywall-app-gate.mjs"') &&
    packageSource.includes('"check:iap": "node scripts/check-iap-config.mjs"') &&
    hardPaywallGate.includes("local premium cache cannot unlock without store validation") &&
    hardPaywallGate.includes("camera scan entrypoints remain paywall-first") &&
    iapGate.includes("fallback plans must avoid real-looking prices until StoreKit loads localized products") &&
    iapGate.includes("entitlement must be checked against active App Store subscriptions");
  const urlReady = isHttpsUrl(item.url);
  const localReady = claimBoundaryReady && proofCurrent && purchaseSourceReady && commandGateReady && existing.length >= 5;
  const blockers = [];
  if (!claimBoundaryReady) blockers.push("Refresh App Review claim boundaries before publishing proof.");
  if (!proofCurrent) blockers.push("Refresh the App Review proof packet with entitlement, StoreKit price, review-before-save, and no-fake-widget evidence.");
  if (!purchaseSourceReady || !commandGateReady) blockers.push("Keep source and command gate coverage for hard paywall, active entitlement, StoreKit pricing, restore, and review-return behavior.");
  if (!urlReady) blockers.push("Upload the proof packet to a stable HTTPS URL.");
  return {
    id: item.id,
    title: item.title,
    manifestStatus: item.status || "unknown",
    url: item.url || null,
    status: materialStatus(urlReady, localReady, blockers),
    localCandidates: candidates,
    evidence: [
      `Claim boundaries ready: ${claimBoundaryReady ? "yes" : "no"}`,
      `Proof content current: ${proofCurrent ? "yes" : "no"}`,
      `Purchase/review source coverage: ${purchaseSourceReady ? "yes" : "no"}`,
      `Hard-paywall and IAP command gates: ${commandGateReady ? "yes" : "no"}`,
      `${existing.length}/${candidates.length} local review-proof source files exist`,
    ],
    blockers,
    nextAction: urlReady ? "Verify review notes still match the linked proof." : "Publish review proof after final hard-paywall and IAP gates pass.",
  };
}

function markdownTable(items: SupplementalItem[]) {
  const lines = [
    "| Material | Status | URL | Local evidence | Blockers | Next action |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const item of items) {
    lines.push(
      `| ${markdownCell(item.title)} | ${item.status} | ${markdownCell(item.url || "Missing")} | ${markdownCell(item.evidence.join("<br>"))} | ${
        item.blockers.length ? markdownCell(item.blockers.join("<br>")) : "None"
      } | ${markdownCell(item.nextAction)} |`,
    );
  }
  return lines.join("\n");
}

const manifest = parseJson<{
  supplementalMaterials?: ManifestSupplemental[];
}>(ASSET_MANIFEST_PATH, {});
const urlRegistry = readOptionalJson<SupplementalUrlRegistry>(URL_REGISTRY_PATH, {});
const finalization = parseJson<{
  status?: string;
  appStoreScreenshots?: { fulfilled?: number; total?: number };
}>(ASSET_FINALIZATION_PATH, {});
const nativeCaptureRun = parseJson<{
  status?: string;
  nativeWidgetPlacement?: { status?: string };
}>(NATIVE_CAPTURE_RUN_PATH, {});
const nativePreflight = parseJson<{
  captureReady?: boolean;
}>(NATIVE_PREFLIGHT_PATH, {});
const nomination = read(NOMINATION_PATH);
const releaseCopy = read(RELEASE_COPY_PATH);
const evidence = read(IMPLEMENTATION_EVIDENCE_PATH);
const supplementalItems = applyRegisteredUrls(manifest.supplementalMaterials || [], urlRegistry);

if (supplementalItems.length !== 5) {
  failures.push(`Asset manifest must include exactly five supplemental material slots, found ${supplementalItems.length}.`);
}

for (const id of expectedIds) {
  readManifestSupplemental(id, supplementalItems);
}

const items = [
  buildProductVideo(readManifestSupplemental("product-video", supplementalItems), nativeCaptureRun.status || ""),
  buildScreenshotContactSheet(readManifestSupplemental("screenshot-contact-sheet", supplementalItems), finalization),
  buildWidgetSheet(readManifestSupplemental("native-widget-sheet", supplementalItems), nativeCaptureRun),
  buildAccessibilitySummary(readManifestSupplemental("accessibility-localization-summary", supplementalItems), nativePreflight),
  buildAppReviewProof(readManifestSupplemental("app-review-proof", supplementalItems), nomination, releaseCopy, evidence),
];

const urlReadyCount = items.filter((item) => item.status === "url_ready").length;
const localCandidateReadyCount = items.filter((item) => item.status === "local_candidate_ready").length;
const blockedCount = items.filter((item) => item.status === "blocked").length;
const materialsReady = items.length === 5 && urlReadyCount === 5;

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  materialsReady,
  total: items.length,
  urlReadyCount,
  localCandidateReadyCount,
  blockedCount,
  recommendedSubmissionMode: materialsReady ? "Supplemental URLs can be pasted into App Store Connect" : "Keep nomination as draft until all five URLs are stable",
  sourceDocs: [APPLE_NOMINATION_DOC, APPLE_TEMPLATE_DOC, APPLE_APP_PREVIEW_SPEC_DOC, EXPO_WIDGETS_DOC, EXPO_GLASS_DOC],
  urlRegistry: {
    path: URL_REGISTRY_PATH,
    status: urlRegistry.status || "missing",
    registeredCount: (urlRegistry.slots || []).filter((slot) => slot.status === "registered").length,
  },
  items,
  blockers: items.flatMap((item) => item.blockers.map((blocker) => `${item.id}: ${blocker}`)),
};

const markdown = `# Back-to-School 2026 Supplemental Materials Packet

Generated: ${payload.generatedAt}
Release: ${payload.release}
Supplemental URLs ready: ${urlReadyCount}/${items.length}
Local candidates ready: ${localCandidateReadyCount}/${items.length}
Submission ready: ${materialsReady ? "yes" : "no"}

Apple supplemental materials are URL fields, so local files are only candidates until they are uploaded to stable HTTPS URLs. Keep this packet in draft status until every row is \`url_ready\`.

URL registry: \`${URL_REGISTRY_PATH}\`

## Materials

${markdownTable(items)}

## URL Slots

1. Product video or App Preview: import, review, semester-ready payoff, Home, focus, widgets.
2. Screenshot contact sheet from the release build.
3. Native WidgetKit screenshot sheet: light, dark, tinted/accented, empty, normal, exam-heavy.
4. Accessibility/localization QA summary.
5. App Review notes with claim boundaries and purchase/review flow proof.

## Source Rules

- Apple supports up to five supplemental material URLs for a featuring nomination.
- CSV nomination import is unsafe before final proof because imported rows submit immediately.
- Product video candidates must be approved against the Back-to-School story before upload.
- App Store screenshot and widget sheets must come from native release/TestFlight captures.
- Expo SDK 56 widgets require native WidgetKit proof; Expo Go and web smoke screenshots are not enough.
- Expo SDK 56 GlassView is the Liquid Glass path and still requires native runtime validation.
- Run \`npm run register:back-to-school-supplemental-urls -- --set slot-id=https://...\` after uploading final materials, then refresh this packet.

Sources:

- ${APPLE_NOMINATION_DOC}
- ${APPLE_TEMPLATE_DOC}
- ${APPLE_APP_PREVIEW_SPEC_DOC}
- ${EXPO_WIDGETS_DOC}
- ${EXPO_GLASS_DOC}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

if (failures.length) {
  console.error("Back-to-School supplemental material checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School supplemental materials ${materialsReady ? "ready" : "blocked"}. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`);
