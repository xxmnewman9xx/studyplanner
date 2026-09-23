import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";

type ScreenshotAsset = {
  id: string;
  headline: string;
  captureId: string;
  alternateCaptureIds?: string[];
  sourceType: string;
  file: string | null;
  purpose: string;
};

type SupplementalMaterial = {
  id: string;
  title: string;
  status?: string;
  url?: string | null;
};

type AssetManifest = {
  release: string;
  targetWindow: string;
  appStoreScreenshots: ScreenshotAsset[];
  supplementalMaterials: SupplementalMaterial[];
};

type NativeCaptureEntry = {
  captureId: string;
  filename?: string;
  path?: string;
  status?: string;
  device?: string;
  buildNumber?: string;
  appearance?: string;
  locale?: string;
  bytes?: number;
  sha256?: string;
};

type NativeCaptureManifest = {
  release?: string;
  entries?: NativeCaptureEntry[];
};

type FinalizedScreenshot = {
  id: string;
  captureId: string;
  alternateCaptureIds?: string[];
  sourceType: string;
  fulfilled: boolean;
  file: string | null;
  missingReason: string | null;
};

type AssetFinalizationPlan = {
  status?: string;
  appStoreScreenshots?: {
    total?: number;
    fulfilled?: number;
    missing?: number;
    items?: FinalizedScreenshot[];
  };
};

type SupplementalPlan = {
  materialsReady?: boolean;
  total?: number;
  urlReadyCount?: number;
  localCandidateReadyCount?: number;
  blockedCount?: number;
  blockers?: string[];
  items?: {
    id?: string;
    status?: string;
    evidence?: string[];
    blockers?: string[];
    nextAction?: string;
  }[];
};

type SupplementalUrlRegistry = {
  slots?: { id?: string; url?: string | null; status?: string }[];
};

type ProductVideoReview = {
  status?: string;
  appPreviewReady?: boolean;
  primaryCandidate?: {
    id?: string;
    path?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    fps?: number;
    codec?: string;
    sha256?: string;
    supplementalReady?: boolean;
    appPreviewReady?: boolean;
  };
  warnings?: string[];
  blockers?: string[];
  sourceDocs?: string[];
};

type RunbookRow = {
  id: string;
  state: string;
  appearance: string;
  requiredProof: string;
};

const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md";
const FINALIZATION_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const SUPPLEMENTAL_PLAN_PATH = "qa/back-to-school-2026/supplemental-materials-plan.json";
const NATIVE_MANIFEST_PATH = "qa-screenshots/back-to-school-2026-native/manifest.json";
const URL_REGISTRY_PATH = "qa/back-to-school-2026/supplemental-url-registry.json";

const CONTACT_SHEET_PATH = "docs/launch/back-to-school-2026/app-store-screenshot-contact-sheet.md";
const WIDGET_SHEET_PATH = "docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md";
const DRAFT_PAYLOAD_PATH = "docs/launch/back-to-school-2026/app-store-connect-draft-payload.json";
const UPLOAD_MANIFEST_PATH = "qa/back-to-school-2026/supplemental-upload-manifest.json";
const PRODUCT_VIDEO_REVIEW_PATH = "qa/back-to-school-2026/product-video-review.json";
const DRAFT_UPLOAD_PACKAGE_DIR = "docs/launch/back-to-school-2026/draft-upload-package";
const DRAFT_UPLOAD_PACKAGE_README_PATH = `${DRAFT_UPLOAD_PACKAGE_DIR}/README.md`;
const DRAFT_UPLOAD_PACKAGE_MANIFEST_PATH = "qa/back-to-school-2026/draft-upload-package-manifest.json";

const APPLE_NOMINATION_DOC =
  "https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/";
const APPLE_TEMPLATE_DOC = "https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/";
const APPLE_IN_APP_EVENTS_DOC = "https://developer.apple.com/help/app-store-connect/offer-in-app-events/offer-in-app-events/";
const APPLE_IN_APP_EVENT_BADGES_DOC =
  "https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-badges";

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function singleLineField(markdown: string, label: string) {
  const line = markdown.split("\n").find((candidate) => candidate.startsWith(`${label}:`));
  if (!line) {
    failures.push(`Missing field: ${label}`);
    return "";
  }
  return line.slice(label.length + 1).trim();
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

function sectionField(sectionText: string, label: string) {
  const line = sectionText.split("\n").find((candidate) => candidate.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : "";
}

function normalizedLength(text: string) {
  return text.replace(/\s+/g, " ").trim().length;
}

function capturePath(entry: NativeCaptureEntry | undefined) {
  return entry?.path || (entry?.filename ? `qa-screenshots/back-to-school-2026-native/${entry.filename}` : null);
}

function fileState(path: string | null | undefined) {
  if (!path || !existsSync(path)) return null;
  return {
    path,
    bytes: statSync(path).size,
  };
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function linkOrMissing(path: string | null | undefined) {
  if (!path) return "Missing";
  return existsSync(path) ? `[${path}](${path})` : `${path} (missing)`;
}

function tableRow(cells: string[]) {
  return `| ${cells.map(markdownCell).join(" | ")} |`;
}

function parseRunbookTable(markdown: string, heading: string): RunbookRow[] {
  const text = section(markdown, heading);
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| ") && !line.includes("---") && !line.startsWith("| ID "))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && /^(widget|ax|app)-/.test(cells[0]))
    .map((cells) => ({
      id: cells[0],
      state: cells[1],
      appearance: cells[2],
      requiredProof: cells[3],
    }));
}

function screenshotReadinessMap(finalization: AssetFinalizationPlan) {
  const map = new Map<string, FinalizedScreenshot>();
  for (const item of finalization.appStoreScreenshots?.items || []) {
    map.set(item.id, item);
  }
  return map;
}

function nativeEntryMap(nativeManifest: NativeCaptureManifest) {
  const map = new Map<string, NativeCaptureEntry>();
  for (const entry of nativeManifest.entries || []) {
    if (entry.captureId) map.set(entry.captureId, entry);
  }
  return map;
}

function isHttpsUrl(url: string | null | undefined) {
  return typeof url === "string" && /^https:\/\/\S+\.\S+/.test(url);
}

function applyRegisteredUrls(manifest: AssetManifest, registry: SupplementalUrlRegistry): AssetManifest {
  const registered = new Map(
    (registry.slots || [])
      .filter((slot) => slot.id && slot.status === "registered" && isHttpsUrl(slot.url))
      .map((slot) => [slot.id as string, slot.url as string]),
  );
  return {
    ...manifest,
    supplementalMaterials: manifest.supplementalMaterials.map((item) => ({
      ...item,
      url: registered.get(item.id) || item.url || null,
    })),
  };
}

function writeScreenshotContactSheet(
  manifest: AssetManifest,
  finalization: AssetFinalizationPlan,
  nativeManifest: NativeCaptureManifest,
) {
  const readiness = screenshotReadinessMap(finalization);
  const nativeEntries = nativeEntryMap(nativeManifest);
  const rows = [
    "| Frame | Headline | Capture ID | Status | File | Purpose |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const asset of manifest.appStoreScreenshots) {
    const item = readiness.get(asset.id);
    const entry = nativeEntries.get(asset.captureId);
    const path = item?.file || asset.file || capturePath(entry);
    rows.push(
      tableRow([
        asset.id,
        asset.headline,
        [asset.captureId, ...(asset.alternateCaptureIds || [])].join(", "),
        item?.fulfilled ? "captured" : item?.missingReason || "missing",
        linkOrMissing(path),
        asset.purpose,
      ]),
    );
  }

  const markdown = `# Back-to-School 2026 App Store Screenshot Contact Sheet

Generated: ${new Date().toISOString()}
Release: ${manifest.release}
Finalization status: ${finalization.status || "unknown"}
Screenshots fulfilled: ${finalization.appStoreScreenshots?.fulfilled || 0}/${finalization.appStoreScreenshots?.total || manifest.appStoreScreenshots.length}

This contact sheet is generated from the App Store asset manifest and native capture manifest. It is not App Store-ready until every file path points to a real native release/TestFlight capture.

## Frames

${rows.join("\n")}

## Rules

- Do not use web smoke screenshots as final App Store creative.
- Do not composite Home Screen widget placements.
- Widget frames must come from real WidgetKit surfaces.
- Regenerate this file after every native capture or asset-finalization pass.
`;

  mkdirSync(dirname(CONTACT_SHEET_PATH), { recursive: true });
  writeFileSync(CONTACT_SHEET_PATH, markdown);
}

function writeWidgetSheet(runbook: string, nativeManifest: NativeCaptureManifest) {
  const widgetRows = parseRunbookTable(runbook, "## Native Widget Capture Matrix");
  const entries = nativeEntryMap(nativeManifest);
  const rows = [
    "| Widget State | Appearance | Capture ID | Status | File | Required proof |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of widgetRows) {
    const entry = entries.get(row.id);
    const path = capturePath(entry);
    const state = fileState(path);
    rows.push(
      tableRow([
        row.state,
        row.appearance,
        row.id,
        state ? "captured" : "missing",
        linkOrMissing(path),
        row.requiredProof,
      ]),
    );
  }

  const captured = widgetRows.filter((row) => fileState(capturePath(entries.get(row.id)))).length;
  const markdown = `# Back-to-School 2026 Native WidgetKit Screenshot Sheet

Generated: ${new Date().toISOString()}
Release: Back to School with AI
Widget states captured: ${captured}/${widgetRows.length}

This sheet is reserved for real WidgetKit placements. It must not be filled with in-app previews, Expo Go surfaces, or composited Home Screen artwork.

## Widget States

${rows.join("\n")}

## Required Coverage

- Empty, normal, exam-heavy, overdue, dark, and tinted/accented Home Screen states.
- Lock Screen rectangular and circular states.
- Real WidgetKit rendering, including iOS accented/tinted behavior.
`;

  mkdirSync(dirname(WIDGET_SHEET_PATH), { recursive: true });
  writeFileSync(WIDGET_SHEET_PATH, markdown);

  return {
    captured,
    total: widgetRows.length,
  };
}

function writeDraftPayload(nomination: string, manifest: AssetManifest) {
  const nominationDescription = section(nomination, "## Nomination Description");
  const helpfulDetails = section(nomination, "## Helpful Details");
  const inAppEvent = singleLineField(nomination, "In-App Event");
  const inAppEventDraft = section(nomination, "## In-App Event Draft");
  const payload = {
    generatedAt: new Date().toISOString(),
    release: singleLineField(nomination, "Release"),
    campaign: singleLineField(nomination, "Campaign"),
    nominationName: section(nomination, "## Nomination Name"),
    nominationType: singleLineField(nomination, "Nomination type"),
    platforms: singleLineField(nomination, "Platforms"),
    targetWindow: singleLineField(nomination, "Target window"),
    submissionTarget: singleLineField(nomination, "Submission target"),
    relevantCountriesOrRegions: singleLineField(nomination, "Relevant countries or regions"),
    inAppEvent: {
      intendsToSubmit: inAppEvent.startsWith("Yes"),
      nominationField: inAppEvent,
      referenceName: sectionField(inAppEventDraft, "Reference name"),
      eventName: sectionField(inAppEventDraft, "Event name"),
      badge: sectionField(inAppEventDraft, "Badge"),
      shortDescription: sectionField(inAppEventDraft, "Short description"),
      longDescription: sectionField(inAppEventDraft, "Long description"),
      start: sectionField(inAppEventDraft, "Start"),
      end: sectionField(inAppEventDraft, "End"),
      publishStart: sectionField(inAppEventDraft, "Publish start"),
      deepLinkCandidate: sectionField(inAppEventDraft, "Deep link candidate"),
      mediaRule: sectionField(inAppEventDraft, "Media rule"),
      attachmentRule: sectionField(inAppEventDraft, "Attachment rule"),
    },
    description: nominationDescription,
    helpfulDetails,
    characterCounts: {
      description: normalizedLength(nominationDescription),
      helpfulDetails: normalizedLength(helpfulDetails),
    },
    supplementalMaterials: manifest.supplementalMaterials.map((material) => ({
      id: material.id,
      title: material.title,
      url: material.url || null,
    })),
    csvAllowed: false,
    csvReason: "Do not generate/import a CSV until every gate is ready because App Store Connect CSV imports submit nominations automatically.",
    sourceDocs: [APPLE_NOMINATION_DOC, APPLE_TEMPLATE_DOC, APPLE_IN_APP_EVENTS_DOC, APPLE_IN_APP_EVENT_BADGES_DOC],
  };

  mkdirSync(dirname(DRAFT_PAYLOAD_PATH), { recursive: true });
  writeFileSync(DRAFT_PAYLOAD_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

function packageMarkdownTable(
  rows: { uploadItemId: string; relativePath: string; bytes: number; sha256: string; purpose: string }[],
) {
  return [
    "| Upload item | Package file | Bytes | SHA-256 | Purpose |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) =>
      tableRow([row.uploadItemId, row.relativePath, String(row.bytes), row.sha256, row.purpose]),
    ),
  ].join("\n");
}

function writeDraftUploadPackage(params: {
  release: string;
  packageReady: boolean;
  uploadItems: {
    id: string;
    uploadReady: boolean;
    requiredUrl: string | null;
    localFiles: { path: string; bytes: number }[];
    localEvidence: { supplementalStatus: string; blockers: string[] };
  }[];
  coverage: {
    appStoreScreenshots: { status: string; fulfilled: number; total: number };
    widgetStates: { captured: number; total: number };
    supplementalUrls: { ready: number; total: number };
  };
  blockers: string[];
}) {
  rmSync(DRAFT_UPLOAD_PACKAGE_DIR, { recursive: true, force: true });
  mkdirSync(DRAFT_UPLOAD_PACKAGE_DIR, { recursive: true });
  mkdirSync(dirname(DRAFT_UPLOAD_PACKAGE_MANIFEST_PATH), { recursive: true });

  const copiedSources = new Set<string>();
  const copied: {
    uploadItemId: string;
    sourcePath: string;
    packagePath: string;
    relativePath: string;
    bytes: number;
    sha256: string;
    purpose: string;
  }[] = [];

  function copyIntoPackage(uploadItemId: string, sourcePath: string | null | undefined, relativePath: string, purpose: string) {
    if (!sourcePath || !existsSync(sourcePath) || copiedSources.has(sourcePath)) return;
    const packagePath = `${DRAFT_UPLOAD_PACKAGE_DIR}/${relativePath}`;
    mkdirSync(dirname(packagePath), { recursive: true });
    cpSync(sourcePath, packagePath);
    copiedSources.add(sourcePath);
    copied.push({
      uploadItemId,
      sourcePath,
      packagePath,
      relativePath,
      bytes: statSync(packagePath).size,
      sha256: sha256(packagePath),
      purpose,
    });
  }

  copyIntoPackage("app-store-connect-draft", DRAFT_PAYLOAD_PATH, "app-store-connect-draft-payload.json", "Paste-ready nomination fields; do not CSV import.");
  copyIntoPackage("screenshot-contact-sheet", CONTACT_SHEET_PATH, "supplemental/screenshot-contact-sheet/app-store-screenshot-contact-sheet.md", "Current screenshot contact sheet candidate.");
  copyIntoPackage("native-widget-sheet", WIDGET_SHEET_PATH, "supplemental/native-widget-sheet/native-widgetkit-screenshot-sheet.md", "Current native WidgetKit sheet candidate.");
  copyIntoPackage(
    "accessibility-localization-summary",
    "docs/launch/back-to-school-2026/accessibility-localization-summary.md",
    "supplemental/accessibility-localization-summary/accessibility-localization-summary.md",
    "Accessibility and localization evidence candidate.",
  );
  copyIntoPackage(
    "app-review-proof",
    "docs/launch/back-to-school-2026/app-review-proof.md",
    "supplemental/app-review-proof/app-review-proof.md",
    "App Review and purchase-flow proof candidate.",
  );
  copyIntoPackage("product-video", PRODUCT_VIDEO_REVIEW_PATH, "supplemental/product-video/product-video-review.json", "Product video review and approval evidence.");

  for (const item of params.uploadItems) {
    for (const localFile of item.localFiles || []) {
      copyIntoPackage(
        item.id,
        localFile.path,
        `supplemental/${item.id}/${basename(localFile.path)}`,
        `${item.id} local upload candidate.`,
      );
    }
  }

  const totalBytes = copied.reduce((total, item) => total + item.bytes, 0);
  const status = params.packageReady ? "ready_for_final_upload" : "draft_incomplete";
  const uploadSummary = params.uploadItems.map((item) => ({
    id: item.id,
    uploadReady: item.uploadReady,
    requiredUrl: item.requiredUrl,
    localStatus: item.localEvidence.supplementalStatus,
    blockerCount: item.localEvidence.blockers.length,
  }));
  const manifest = {
    generatedAt: new Date().toISOString(),
    release: params.release,
    status,
    packageReady: params.packageReady,
    packageDir: DRAFT_UPLOAD_PACKAGE_DIR,
    readmePath: DRAFT_UPLOAD_PACKAGE_README_PATH,
    manifestPath: DRAFT_UPLOAD_PACKAGE_MANIFEST_PATH,
    fileCount: copied.length,
    totalBytes,
    coverage: params.coverage,
    uploadItems: uploadSummary,
    blockers: params.blockers,
    files: copied,
    rules: [
      "This folder is a draft reviewer handoff, not proof of App Store Connect readiness.",
      "Do not submit a CSV import; App Store Connect CSV imports submit nominations automatically.",
      "Replace screenshot and WidgetKit sheets after native capture finalization.",
      "Upload final files to stable HTTPS URLs, then register URLs with npm run register:back-to-school-supplemental-urls.",
    ],
  };

  const readme = `# Back-to-School 2026 Draft Upload Package

Generated: ${manifest.generatedAt}
Release: ${params.release}
Status: ${status}
Package ready: ${params.packageReady ? "yes" : "no"}
Files: ${copied.length}
Bytes: ${totalBytes}

This package gathers the current local nomination and supplemental candidates into one review folder. It is intentionally marked \`${status}\` until native release screenshots, real WidgetKit captures, and stable HTTPS supplemental URLs are complete.

## Files

${packageMarkdownTable(copied)}

## Current Blockers

${params.blockers.length ? params.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None"}

## Upload Order

1. Finish native app screenshots and real WidgetKit captures.
2. Run \`npm run finalize:back-to-school-assets\` and \`npm run apply:back-to-school-assets\` after every capture exists.
3. Run \`npm run check:back-to-school-upload-package\` to refresh this folder.
4. Upload final supplemental materials to stable HTTPS URLs.
5. Run \`npm run register:back-to-school-supplemental-urls -- --set slot-id=https://...\`.
6. Run \`npm run check:back-to-school-submission\` and submit manually only when it reports \`submissionReady: true\`.
`;

  writeFileSync(DRAFT_UPLOAD_PACKAGE_README_PATH, readme);
  writeFileSync(DRAFT_UPLOAD_PACKAGE_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    status,
    path: DRAFT_UPLOAD_PACKAGE_DIR,
    readmePath: DRAFT_UPLOAD_PACKAGE_README_PATH,
    manifestPath: DRAFT_UPLOAD_PACKAGE_MANIFEST_PATH,
    fileCount: copied.length,
    bytes: totalBytes,
  };
}

function writeUploadManifest(params: {
  manifest: AssetManifest;
  finalization: AssetFinalizationPlan;
  supplementalPlan: SupplementalPlan;
  draftPayload: unknown;
  widgetCoverage: { captured: number; total: number };
}) {
  const contactSheet = fileState(CONTACT_SHEET_PATH);
  const widgetSheet = fileState(WIDGET_SHEET_PATH);
  const accessibilitySummary = fileState("docs/launch/back-to-school-2026/accessibility-localization-summary.md");
  const appReviewProof = fileState("docs/launch/back-to-school-2026/app-review-proof.md");
  const draftPayload = fileState(DRAFT_PAYLOAD_PATH);
  const productVideoReviewFile = fileState(PRODUCT_VIDEO_REVIEW_PATH);
  const productVideoReview = readJson<ProductVideoReview>(PRODUCT_VIDEO_REVIEW_PATH, {});
  const supplementalItemMap = new Map(
    (params.supplementalPlan.items || [])
      .filter((item) => item.id)
      .map((item) => [item.id as string, item]),
  );
  const manifestMaterial = (id: string) => params.manifest.supplementalMaterials.find((item) => item.id === id);
  const planItem = (id: string) => supplementalItemMap.get(id);
  const requiredUrl = (id: string) => manifestMaterial(id)?.url || null;
  const isUrlReady = (id: string) => planItem(id)?.status === "url_ready" && isHttpsUrl(requiredUrl(id));
  const evidenceFor = (id: string) => ({
    supplementalStatus: planItem(id)?.status || "missing",
    evidence: planItem(id)?.evidence || [],
    blockers: planItem(id)?.blockers || [],
    nextAction: planItem(id)?.nextAction || null,
  });
  const productVideo = [
    "marketing/social-launch-video/final/studyplanner-scanner-demo-app-preview-1080x1920.mp4",
    "marketing/social-launch-video/build66-final/build66-studyplanner-app-preview-1080x1920.mp4",
    "marketing/social-launch-video/build66-produced/studyplanner-build66-produced-app-store-1080x1920.mp4",
  ]
    .map((path) => fileState(path))
    .filter((item): item is { path: string; bytes: number } => Boolean(item));

  const screenshotReady =
    params.finalization.status === "applied" &&
    params.finalization.appStoreScreenshots?.fulfilled === params.finalization.appStoreScreenshots?.total &&
    (params.finalization.appStoreScreenshots?.total || 0) >= 9;
  const widgetReady = params.widgetCoverage.total > 0 && params.widgetCoverage.captured === params.widgetCoverage.total;
  const supplementalUrlsReady = params.supplementalPlan.materialsReady === true;
  const productVideoReviewApproved =
    productVideoReview.status === "legacy_supporting_approved" || productVideoReview.status === "app_preview_ready";
  const productVideoEvidence = {
    reviewFile: productVideoReviewFile,
    status: productVideoReview.status || "missing",
    appPreviewReady: productVideoReview.appPreviewReady === true,
    primaryCandidate: productVideoReview.primaryCandidate
      ? {
          id: productVideoReview.primaryCandidate.id || null,
          path: productVideoReview.primaryCandidate.path || null,
          width: productVideoReview.primaryCandidate.width || 0,
          height: productVideoReview.primaryCandidate.height || 0,
          durationSeconds: productVideoReview.primaryCandidate.durationSeconds || 0,
          fps: productVideoReview.primaryCandidate.fps || 0,
          codec: productVideoReview.primaryCandidate.codec || "unknown",
          sha256: productVideoReview.primaryCandidate.sha256 || null,
          supplementalReady: productVideoReview.primaryCandidate.supplementalReady === true,
          appPreviewReady: productVideoReview.primaryCandidate.appPreviewReady === true,
        }
      : null,
    warnings: productVideoReview.warnings || [],
    blockers: productVideoReview.blockers || [],
    sourceDocs: productVideoReview.sourceDocs || [],
  };

  const uploadItems = [
    {
      id: "product-video",
      localFiles: productVideo,
      uploadReady: productVideo.length > 0 && productVideoReviewApproved && isUrlReady("product-video"),
      requiredUrl: requiredUrl("product-video"),
      localEvidence: evidenceFor("product-video"),
      productVideoReview: productVideoEvidence,
    },
    {
      id: "screenshot-contact-sheet",
      localFiles: contactSheet ? [contactSheet] : [],
      uploadReady: screenshotReady && isUrlReady("screenshot-contact-sheet"),
      requiredUrl: requiredUrl("screenshot-contact-sheet"),
      localEvidence: evidenceFor("screenshot-contact-sheet"),
    },
    {
      id: "native-widget-sheet",
      localFiles: widgetSheet ? [widgetSheet] : [],
      uploadReady: widgetReady && isUrlReady("native-widget-sheet"),
      requiredUrl: requiredUrl("native-widget-sheet"),
      localEvidence: evidenceFor("native-widget-sheet"),
    },
    {
      id: "accessibility-localization-summary",
      localFiles: accessibilitySummary ? [accessibilitySummary] : [],
      uploadReady: Boolean(accessibilitySummary) && isUrlReady("accessibility-localization-summary"),
      requiredUrl: requiredUrl("accessibility-localization-summary"),
      localEvidence: evidenceFor("accessibility-localization-summary"),
    },
    {
      id: "app-review-proof",
      localFiles: appReviewProof ? [appReviewProof] : [],
      uploadReady: Boolean(appReviewProof) && isUrlReady("app-review-proof"),
      requiredUrl: requiredUrl("app-review-proof"),
      localEvidence: evidenceFor("app-review-proof"),
    },
  ];
  const packageReady = screenshotReady && widgetReady && supplementalUrlsReady && uploadItems.every((item) => item.uploadReady);
  const coverage = {
    appStoreScreenshots: {
      status: params.finalization.status || "unknown",
      fulfilled: params.finalization.appStoreScreenshots?.fulfilled || 0,
      total: params.finalization.appStoreScreenshots?.total || params.manifest.appStoreScreenshots.length,
    },
    widgetStates: params.widgetCoverage,
    supplementalUrls: {
      ready: params.supplementalPlan.urlReadyCount || 0,
      total: params.supplementalPlan.total || params.manifest.supplementalMaterials.length,
    },
  };
  const blockers = [
    ...(screenshotReady ? [] : ["Finalize all nine App Store screenshots from native release captures."]),
    ...(widgetReady ? [] : ["Capture every required real WidgetKit Home Screen and Lock Screen state."]),
    ...(supplementalUrlsReady ? [] : ["Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest."]),
    ...(productVideoReviewApproved ? [] : ["Approve the product video review before it can be used as a supplemental material."]),
    ...uploadItems.flatMap((item) =>
      item.uploadReady
        ? []
        : [
            `${item.id} is not upload-ready: ${
              item.localEvidence.blockers.length ? item.localEvidence.blockers.join(" ") : "stable HTTPS URL or local evidence is missing."
            }`,
          ],
    ),
  ];
  const draftUploadPackage = writeDraftUploadPackage({
    release: params.manifest.release,
    packageReady,
    uploadItems,
    coverage,
    blockers,
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    release: params.manifest.release,
    packageReady,
    recommendedSubmissionMode: packageReady ? "Manual App Store Connect nomination submission" : "Draft only",
    generatedFiles: {
      contactSheet,
      widgetSheet,
      draftPayload,
      accessibilitySummary,
      appReviewProof,
      productVideoReview: productVideoReviewFile,
      draftUploadPackage,
    },
    coverage,
    uploadItems,
    blockers,
    appStoreConnectDraftPayload: params.draftPayload,
  };

  mkdirSync(dirname(UPLOAD_MANIFEST_PATH), { recursive: true });
  writeFileSync(UPLOAD_MANIFEST_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

const rawAssetManifest = readJson<AssetManifest>(ASSET_MANIFEST_PATH, {
  release: "",
  targetWindow: "",
  appStoreScreenshots: [],
  supplementalMaterials: [],
});
const urlRegistry = readJson<SupplementalUrlRegistry>(URL_REGISTRY_PATH, {});
const assetManifest = applyRegisteredUrls(rawAssetManifest, urlRegistry);
const finalization = readJson<AssetFinalizationPlan>(FINALIZATION_PATH, {});
const supplementalPlan = readJson<SupplementalPlan>(SUPPLEMENTAL_PLAN_PATH, {});
const nativeManifest = readJson<NativeCaptureManifest>(NATIVE_MANIFEST_PATH, {
  entries: [],
});
const nomination = read(NOMINATION_PATH);
const runbook = read(RUNBOOK_PATH);

if (assetManifest.release !== "Back to School with AI") {
  failures.push("Asset manifest release must be Back to School with AI.");
}
if (assetManifest.appStoreScreenshots.length !== 9) {
  failures.push(`Asset manifest must contain nine App Store screenshot frames, found ${assetManifest.appStoreScreenshots.length}.`);
}
if (assetManifest.supplementalMaterials.length !== 5) {
  failures.push(`Asset manifest must contain five supplemental material URL slots, found ${assetManifest.supplementalMaterials.length}.`);
}

writeScreenshotContactSheet(assetManifest, finalization, nativeManifest);
const widgetCoverage = writeWidgetSheet(runbook, nativeManifest);
const draftPayload = writeDraftPayload(nomination, assetManifest);
const uploadManifest = writeUploadManifest({
  manifest: assetManifest,
  finalization,
  supplementalPlan,
  draftPayload,
  widgetCoverage,
});

if (failures.length) {
  console.error("Back-to-School upload package failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Back-to-School upload package ${uploadManifest.packageReady ? "ready" : "blocked"}. Wrote ${CONTACT_SHEET_PATH}, ${WIDGET_SHEET_PATH}, ${DRAFT_PAYLOAD_PATH}, and ${UPLOAD_MANIFEST_PATH}.`,
);
