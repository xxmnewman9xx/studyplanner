import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type EventMediaFile = {
  id?: string;
  path?: string;
  width?: number;
  height?: number;
  approvedForEventMedia?: boolean;
};

type EventMediaManifest = {
  release?: string;
  eventName?: string;
  files?: EventMediaFile[];
};

type SupplementalRegistry = {
  status?: string;
  requiredCount?: number;
  registeredCount?: number;
  invalidCount?: number;
  missingCount?: number;
  slots?: {
    id?: string;
    title?: string;
    url?: string;
    status?: string;
  }[];
};

type ScreenshotDimensionMismatch = {
  path: string;
  device: string;
  expected: string;
  actual: string;
};

type ScreenshotAssetEvidence = {
  path?: string;
  sha256?: string;
  sourceIpaSha256?: string;
  exactBinarySource?: boolean;
};

type ScreenshotPlatformEvidence = {
  captureSource?: string;
  sourceIpaSha256?: string;
  assets?: ScreenshotAssetEvidence[];
};

type Build80ReleaseEvidence = {
  status?: string;
  version?: string;
  buildNumber?: string;
  bundleIdentifier?: string;
  easBuild?: {
    id?: string;
    status?: string;
    platform?: string;
    profile?: string;
    artifactUrl?: string;
    appVersion?: string;
    buildNumber?: string;
    sourceCommit?: string;
    completedAt?: string;
  };
  ipa?: {
    localPath?: string;
    sha256?: string;
    bytes?: number;
    version?: string;
    buildNumber?: string;
    bundleIdentifier?: string;
    inspectedAt?: string;
  };
  appStoreConnect?: {
    appAppleId?: string;
    version?: string;
    buildNumber?: string;
    uploaded?: boolean;
    processed?: boolean;
    selectedForVersion?: boolean;
    verifiedAt?: string;
  };
  screenshots?: {
    iphone?: ScreenshotPlatformEvidence;
    ipad?: ScreenshotPlatformEvidence;
  };
  appPreview?: {
    decision?: string;
    optional?: boolean;
    uploadApproved?: boolean;
    path?: string;
    sha256?: string;
    sourceIpaSha256?: string;
    exactBinarySource?: boolean;
    reviewPath?: string;
  };
  humanUploadAuthorization?: {
    authorized?: boolean;
    authorizedBy?: string;
    authorizedAt?: string;
    scope?: string;
    version?: string;
    buildNumber?: string;
    ipaSha256?: string;
    screenshotPaths?: string[];
    appPreviewDecision?: string;
    treatmentBUploadAuthorized?: boolean;
    creativeProductionFinalsAuthorized?: boolean;
  };
};

type ProductVideoReview = {
  status?: string;
  appPreviewReady?: boolean;
  appStoreConnectSlot?: { uploadApproved?: boolean };
};

const BUNDLE_ROOT = "docs/launch/back-to-school-2026/app-store-connect-final-upload";
const OUTPUT_PATH = "qa/back-to-school-2026/asc-final-upload-gate.json";
const BUILD80_RELEASE_EVIDENCE_PATH = "qa/back-to-school-2026/build86-app-version-media-evidence.json";
const APP_PREVIEW_REVIEW_PATH = "qa/back-to-school-2026/product-video-review.json";
const APP_CONFIG_PATH = "app.json";
const APP_SOURCE_PATH = "App.tsx";
const STORE_CONFIG_PATH = "store.config.json";
const EVENT_MEDIA_MANIFEST_PATH = `${BUNDLE_ROOT}/reference/event-media-manifest.json`;
const SUPPLEMENTAL_REGISTRY_PATH = `${BUNDLE_ROOT}/reference/supplemental-url-registry.json`;
const NOMINATION_FIELDS_PATH = `${BUNDLE_ROOT}/nomination-fields.md`;
const README_PATH = `${BUNDLE_ROOT}/README.md`;
const SUPPLEMENTAL_MD_PATH = `${BUNDLE_ROOT}/supplemental-url-registry.md`;
const DEEPLINK_PATH = `${BUNDLE_ROOT}/deeplink-validation.md`;
const WIDGET_RUNTIME_PATH = "src/widgets/StudyPlannerWidgets.tsx";

const EXPECTED_VERSION = "2.0.9";
const EXPECTED_BUILD_NUMBER = "86";
const EXPECTED_SCREENSHOT_REFS = 238;
const EXPECTED_IPHONE_SCREENSHOT_REFS = 119;
const EXPECTED_IPAD_SCREENSHOT_REFS = 119;
const CANONICAL_SCREENSHOT_ROOT = "store/apple/screenshot-build86-creative-production/";
const EXPECTED_ASC_APP_ID = "6766181202";
const EXPECTED_DEEP_LINK = "studyplanner://import";
const EXPECTED_SCHEME = "studyplanner";
const EXPECTED_EVENT_CARD = { width: 1920, height: 1080 };
const EXPECTED_EVENT_DETAILS = { width: 1080, height: 1920 };
const SCREENSHOT_DIMENSION_RULES = {
  APP_IPHONE_65: {
    expected: "1242x2688",
    allowed: [{ width: 1242, height: 2688 }],
  },
  APP_IPAD_PRO_3GEN_129: {
    expected: "2048x2732 or 2732x2048",
    allowed: [
      { width: 2048, height: 2732 },
      { width: 2732, height: 2048 },
    ],
  },
} as const;
const checkNetwork = process.argv.includes("--check-network");

const failures: string[] = [];
const readinessBlockers: string[] = [];
const warnings: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message);
}

function requireReadiness(condition: boolean, message: string) {
  if (!condition) readinessBlockers.push(message);
}

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string, fallback: T): T {
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

function field(markdown: string, label: string) {
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

function isPng(buffer: Buffer) {
  return buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function pngDimensions(path: string) {
  const buffer = readFileSync(path);
  if (!isPng(buffer)) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function isHttpsUrl(value: unknown) {
  return typeof value === "string" && /^https:\/\/\S+\.\S+/.test(value);
}

function collectScreenshotRefs(storeConfig: {
  apple?: {
    version?: string;
    release?: { automaticRelease?: boolean };
    info?: Record<string, { screenshots?: Record<string, string[]> }>;
  };
}) {
  const refs: string[] = [];
  for (const localeInfo of Object.values(storeConfig.apple?.info || {})) {
    for (const list of Object.values(localeInfo.screenshots || {})) {
      refs.push(...list);
    }
  }
  return refs;
}

function screenshotDevice(path: string) {
  const device = Object.keys(SCREENSHOT_DIMENSION_RULES).find((candidate) => path.includes(`/${candidate}/`));
  return device as keyof typeof SCREENSHOT_DIMENSION_RULES | undefined;
}

function screenshotDimensionMismatch(path: string): ScreenshotDimensionMismatch | null {
  const device = screenshotDevice(path);
  const dimensions = pngDimensions(path);
  if (!device) {
    return {
      path,
      device: "unknown",
      expected: Object.keys(SCREENSHOT_DIMENSION_RULES).join(" or "),
      actual: dimensions ? `${dimensions.width}x${dimensions.height}` : "not_png",
    };
  }

  const rule = SCREENSHOT_DIMENSION_RULES[device];
  const matches = Boolean(dimensions && rule.allowed.some((allowed) => (
    allowed.width === dimensions.width && allowed.height === dimensions.height
  )));
  if (matches) return null;

  return {
    path,
    device,
    expected: rule.expected,
    actual: dimensions ? `${dimensions.width}x${dimensions.height}` : "not_png",
  };
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fileSha256(path: string) {
  return sha256(readFileSync(path));
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

function isRecordedAt(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function validateScreenshotPlatformEvidence(
  label: "iPhone" | "iPad",
  configuredRefs: string[],
  evidence: ScreenshotPlatformEvidence | undefined,
  expectedIpaSha256: string,
) {
  const assets = evidence?.assets || [];
  const assetPaths = assets.flatMap((asset) => (asset.path ? [asset.path] : []));

  requireReadiness(
    evidence?.captureSource === "exact_build86_binary",
    `${label} screenshot provenance must declare captureSource=exact_build86_binary`,
  );
  requireReadiness(
    isSha256(evidence?.sourceIpaSha256) && evidence?.sourceIpaSha256 === expectedIpaSha256,
    `${label} screenshot provenance must link to the verified Build 86 IPA SHA-256`,
  );
  requireReadiness(
    sameStringSet(assetPaths, configuredRefs),
    `${label} screenshot provenance must cover every configured ${label} asset exactly once (${configuredRefs.length} expected)`,
  );

  for (const ref of configuredRefs) {
    const asset = assets.find((candidate) => candidate.path === ref);
    requireReadiness(Boolean(asset), `${label} screenshot provenance is missing ${ref}`);
    if (!asset) continue;
    requireReadiness(asset.exactBinarySource === true, `${ref} must be marked as sourced from the exact Build 86 binary`);
    requireReadiness(
      isSha256(asset.sourceIpaSha256) && asset.sourceIpaSha256 === expectedIpaSha256,
      `${ref} must carry the verified Build 86 IPA SHA-256`,
    );
    requireReadiness(isSha256(asset.sha256), `${ref} must have a valid screenshot SHA-256`);
    if (existsSync(ref) && isSha256(asset.sha256)) {
      requireReadiness(fileSha256(ref) === asset.sha256, `${ref} no longer matches its authorized screenshot SHA-256`);
    }
  }
}

function widgetDefinitions(appConfig: {
  expo?: {
    plugins?: unknown[];
  };
}) {
  const plugins = appConfig.expo?.plugins || [];
  const widgetsPlugin = plugins.find((plugin): plugin is [string, { widgets?: unknown[] }] => (
    Array.isArray(plugin) && plugin[0] === "expo-widgets"
  ));
  return widgetsPlugin?.[1]?.widgets || [];
}

function widgetConfigHasThemeColor(widget: unknown) {
  if (!widget || typeof widget !== "object") return false;
  const ios = (widget as { ios?: { configuration?: { parameters?: Record<string, unknown> } } }).ios;
  return Boolean(ios?.configuration?.parameters?.themeColor);
}

async function verifyUrl(slot: { id?: string; url?: string }) {
  if (!slot.url) return { id: slot.id || "unknown", status: "missing-url" };
  const response = await fetch(slot.url, { redirect: "follow" });
  const contentType = response.headers.get("content-type") || "";
  const bytes = Number(response.headers.get("content-length") || 0);
  const body = contentType.includes("text") || contentType.includes("json") || slot.url.includes("gist.githubusercontent.com")
    ? await response.text()
    : "";
  return {
    id: slot.id || "unknown",
    url: slot.url,
    status: response.status,
    ok: response.ok,
    contentType,
    bytes,
    checks: {
      screenshotsFulfilled: body.includes("Screenshots fulfilled: 9/9"),
      widgetProofCaptured: body.includes("Widget proof captured: 5 real WidgetKit states"),
      claimBoundariesVisible: body.includes("claim boundaries") || body.includes("Claim Boundaries") || body.includes("Canvas"),
    },
  };
}

async function main() {
  const readme = read(README_PATH);
  const nominationFields = read(NOMINATION_FIELDS_PATH);
  const supplementalMd = read(SUPPLEMENTAL_MD_PATH);
  const deeplink = read(DEEPLINK_PATH);
  const appSource = read(APP_SOURCE_PATH);
  const widgetRuntime = read(WIDGET_RUNTIME_PATH);
  const appConfig = readJson<{
    expo?: {
      scheme?: string;
      version?: string;
      ios?: { buildNumber?: string; bundleIdentifier?: string };
      android?: { versionCode?: number };
      plugins?: unknown[];
    };
  }>(APP_CONFIG_PATH, {});
  const storeConfig = readJson<{
    apple?: {
      version?: string;
      release?: { automaticRelease?: boolean };
      info?: Record<string, { screenshots?: Record<string, string[]> }>;
    };
  }>(STORE_CONFIG_PATH, {});
  const eventMedia = readJson<EventMediaManifest>(EVENT_MEDIA_MANIFEST_PATH, {});
  const supplementalRegistry = readJson<SupplementalRegistry>(SUPPLEMENTAL_REGISTRY_PATH, {});
  const productVideoReview = readJson<ProductVideoReview>(APP_PREVIEW_REVIEW_PATH, {});
  const build80EvidenceExists = existsSync(BUILD80_RELEASE_EVIDENCE_PATH);
  const build80Evidence = build80EvidenceExists
    ? readJson<Build80ReleaseEvidence>(BUILD80_RELEASE_EVIDENCE_PATH, {})
    : {};

  const historicalEventSubmitted =
    readme.includes("In-App Event `Semester Kickoff Week` is submitted") &&
    readme.includes("Waiting for Review");
  const historicalNominationSubmitted =
    readme.includes("Featuring nomination `8255bf6c-6cbf-45bd-b88c-1afc3074ca41` was submitted on 2026-07-09");
  expect(historicalEventSubmitted, "historical archive must record the July 9 In-App Event submission separately from current app-version readiness");
  expect(historicalNominationSubmitted, "historical archive must record the July 9 featuring nomination submission separately from current app-version readiness");

  const nominationName = field(nominationFields, "Nomination name");
  const nominationType = field(nominationFields, "Nomination type");
  const publishStart = field(nominationFields, "Publish Date Start");
  const publishEnd = field(nominationFields, "Publish Date End");
  const platforms = field(nominationFields, "Platforms");
  const relatedEventIntent = field(nominationFields, "Do you intend to submit a new In-App Event");
  const eventName = field(nominationFields, "Event name");
  const deepLinkField = field(nominationFields, "Deep link");
  const nominationDescription = section(nominationFields, "## Nomination Description").replace(/\nCharacters:.*$/s, "").trim();
  const helpfulDetails = section(nominationFields, "## Helpful Details").replace(/\nCharacters:.*$/s, "").trim();

  expect(nominationName === "Back-to-School Semester Kickoff", "nomination name must match final upload packet");
  expect(nominationType === "App Enhancements", "nomination type must be App Enhancements");
  expect(publishStart === "2026-08-24", "publish start must be 2026-08-24");
  expect(publishEnd === "2026-08-31", "publish end must be 2026-08-31");
  expect(platforms.includes("iOS (iPhone)") && platforms.includes("iOS (iPad)"), "platforms must include iPhone and iPad");
  expect(relatedEventIntent === "Yes", "nomination must indicate a related In-App Event will be submitted");
  expect(eventName === "Semester Kickoff Week", "event name must be Semester Kickoff Week");
  expect(deepLinkField === EXPECTED_DEEP_LINK, `event deep link must be ${EXPECTED_DEEP_LINK}`);
  expect(normalizedLength(nominationDescription) <= 1000, "nomination description exceeds 1000 characters");
  expect(normalizedLength(helpfulDetails) <= 500, "helpful details exceeds 500 characters");
  expect(deeplink.includes(EXPECTED_DEEP_LINK), "deeplink validation must mention studyplanner://import");
  expect(appConfig.expo?.scheme === EXPECTED_SCHEME, `app.json scheme must be ${EXPECTED_SCHEME}`);
  expect(appConfig.expo?.version === EXPECTED_VERSION, `app.json version must be ${EXPECTED_VERSION}`);
  expect(appConfig.expo?.ios?.buildNumber === EXPECTED_BUILD_NUMBER, `app.json iOS buildNumber must be ${EXPECTED_BUILD_NUMBER}`);
  expect(appConfig.expo?.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app.json iOS bundle identifier must match the submitted app");
  expect(
    appSource.includes('if (routeTokens.has("import")) return "semesterKickoff";'),
    "App.tsx must route import deep links to the semester-kickoff import surface",
  );
  expect(appSource.includes("Linking.getInitialURL()") && appSource.includes('Linking.addEventListener("url"'), "App.tsx must handle initial and runtime deep links");
  const widgets = widgetDefinitions(appConfig);
  const colorConfigWidgets = widgets.filter(widgetConfigHasThemeColor);
  expect(widgets.length >= 4, "app.json must keep the expected WidgetKit widget definitions");
  expect(colorConfigWidgets.length === 0, "app.json WidgetKit configuration must not expose themeColor/color customization parameters");
  expect(!widgetRuntime.includes("configuration.themeColor"), "WidgetKit runtime must not read stale themeColor color customization");
  expect(!widgetRuntime.includes("function themeAccent") && !widgetRuntime.includes("function themeTint"), "WidgetKit runtime must not keep color-picker theme mapping helpers");

  const screenshotRefs = collectScreenshotRefs(storeConfig);
  const missingScreenshotRefs = screenshotRefs.filter((path) => !existsSync(path));
  const nonCanonicalScreenshotRefs = screenshotRefs.filter((path) => !path.startsWith(CANONICAL_SCREENSHOT_ROOT));
  const legacyScreenshotRefs = screenshotRefs.filter((path) => path.startsWith("store/apple/screenshot-pop/"));
  const iphoneScreenshotRefs = screenshotRefs.filter((path) => path.includes("/APP_IPHONE_65/"));
  const ipadScreenshotRefs = screenshotRefs.filter((path) => path.includes("/APP_IPAD_PRO_3GEN_129/"));
  const unknownDeviceScreenshotRefs = screenshotRefs.filter(
    (path) => !path.includes("/APP_IPHONE_65/") && !path.includes("/APP_IPAD_PRO_3GEN_129/"),
  );
  const screenshotDimensionMismatches = screenshotRefs
    .filter((path) => existsSync(path))
    .map(screenshotDimensionMismatch)
    .filter((mismatch): mismatch is ScreenshotDimensionMismatch => Boolean(mismatch));
  expect(storeConfig.apple?.version === EXPECTED_VERSION, `store config Apple version must be ${EXPECTED_VERSION}`);
  expect(storeConfig.apple?.release?.automaticRelease === true, "store config should keep automatic release enabled");
  expect(screenshotRefs.length === EXPECTED_SCREENSHOT_REFS, `store config must reference ${EXPECTED_SCREENSHOT_REFS} screenshots`);
  expect(new Set(screenshotRefs).size === screenshotRefs.length, "store config screenshot references must be unique");
  expect(
    iphoneScreenshotRefs.length === EXPECTED_IPHONE_SCREENSHOT_REFS,
    `store config must reference ${EXPECTED_IPHONE_SCREENSHOT_REFS} iPhone screenshots`,
  );
  expect(
    ipadScreenshotRefs.length === EXPECTED_IPAD_SCREENSHOT_REFS,
    `store config must reference ${EXPECTED_IPAD_SCREENSHOT_REFS} iPad screenshots`,
  );
  expect(missingScreenshotRefs.length === 0, `store config has ${missingScreenshotRefs.length} missing screenshot refs`);
  expect(nonCanonicalScreenshotRefs.length === 0, `store config screenshots must use canonical ${CANONICAL_SCREENSHOT_ROOT} assets`);
  expect(legacyScreenshotRefs.length === 0, "store config must not reference retired store/apple/screenshot-pop assets");
  expect(unknownDeviceScreenshotRefs.length === 0, "store config contains screenshot references for an unsupported device slot");
  expect(
    screenshotDimensionMismatches.length === 0,
    `store config has ${screenshotDimensionMismatches.length} screenshot refs with invalid dimensions`,
  );

  const mediaFiles = eventMedia.files || [];
  const eventCard = mediaFiles.find((file) => file.id === "event-card");
  const eventDetails = mediaFiles.find((file) => file.id === "event-details");
  const supplementalHero = mediaFiles.find((file) => file.id === "supplemental-hero-branded");
  expect(eventMedia.release === "Back-to-School Semester Kickoff", "event media manifest release must match final upload packet");
  expect(eventMedia.eventName === "Semester Kickoff Week", "event media manifest event name must match final upload packet");
  expect(Boolean(eventCard?.approvedForEventMedia), "event card must be approved for event media");
  expect(Boolean(eventDetails?.approvedForEventMedia), "event details image must be approved for event media");
  expect(
    !supplementalHero || supplementalHero.approvedForEventMedia === false,
    "optional supplemental hero must not be approved for event media",
  );

  for (const file of mediaFiles) {
    expect(Boolean(file.path && existsSync(file.path)), `event media file is missing: ${file.path || file.id || "unknown"}`);
    if (!file.path || !existsSync(file.path)) continue;
    const dimensions = pngDimensions(file.path);
    expect(Boolean(dimensions), `${file.path} must be a PNG`);
    expect(dimensions?.width === file.width && dimensions?.height === file.height, `${file.path} dimensions must match event media manifest`);
  }
  expect(eventCard?.width === EXPECTED_EVENT_CARD.width && eventCard.height === EXPECTED_EVENT_CARD.height, "event card dimensions must be 1920x1080");
  expect(eventDetails?.width === EXPECTED_EVENT_DETAILS.width && eventDetails.height === EXPECTED_EVENT_DETAILS.height, "event details dimensions must be 1080x1920");

  const supplementalSlots = supplementalRegistry.slots || [];
  expect(supplementalRegistry.status === "all_urls_registered", "supplemental registry must have all URLs registered");
  expect(supplementalRegistry.requiredCount === 5 && supplementalRegistry.registeredCount === 5, "supplemental registry must contain five registered URLs");
  expect(supplementalRegistry.invalidCount === 0 && supplementalRegistry.missingCount === 0, "supplemental registry must have zero invalid or missing URLs");
  expect(supplementalSlots.length === 5, "supplemental registry must expose five URL slots");
  for (const slot of supplementalSlots) {
    expect(slot.status === "registered", `${slot.id || "unknown"} supplemental URL must be registered`);
    expect(isHttpsUrl(slot.url), `${slot.id || "unknown"} supplemental URL must be stable HTTPS`);
    expect(supplementalMd.includes(slot.url || "__missing__"), `${slot.id || "unknown"} URL must be mirrored in supplemental-url-registry.md`);
  }
  expect(supplementalMd.includes("HTTP 200"), "supplemental URL markdown must include public readback status");

  const networkResults = checkNetwork ? await Promise.all(supplementalSlots.map(verifyUrl)) : [];
  for (const result of networkResults) {
    expect(result.ok === true, `${result.id} public URL returned non-OK status: ${result.status}`);
    if (result.id === "screenshot-contact-sheet") expect(result.checks?.screenshotsFulfilled === true, "screenshot contact sheet must say Screenshots fulfilled: 9/9");
    if (result.id === "native-widget-sheet") expect(result.checks?.widgetProofCaptured === true, "native widget sheet must say Widget proof captured: 5 real WidgetKit states");
    if (result.id === "app-review-proof") {
      expect(result.checks?.claimBoundariesVisible === true, "app review proof must show claim boundaries");
    }
    if (result.id === "product-video") warn((result.bytes || 0) > 0, "product video response did not include content-length; manual playback check may still be needed");
  }

  const evidenceIpaSha256 = build80Evidence.ipa?.sha256 || "";
  const evidenceIpaPath = build80Evidence.ipa?.localPath || "";
  const easBuild = build80Evidence.easBuild;
  const ascBuild = build80Evidence.appStoreConnect;

  requireReadiness(build80EvidenceExists, `missing Build 86 release evidence: ${BUILD80_RELEASE_EVIDENCE_PATH}`);
  if (build80EvidenceExists) {
    requireReadiness(build80Evidence.status === "verified", "Build 86 release evidence status must be verified");
    requireReadiness(
      build80Evidence.version === EXPECTED_VERSION && build80Evidence.buildNumber === EXPECTED_BUILD_NUMBER,
      `Build 86 release evidence must identify iOS ${EXPECTED_VERSION} (${EXPECTED_BUILD_NUMBER})`,
    );
    requireReadiness(
      build80Evidence.bundleIdentifier === "com.mattnewman.studyplanner",
      "Build 86 release evidence bundle identifier must be com.mattnewman.studyplanner",
    );
    requireReadiness(isUuid(easBuild?.id), "Build 86 evidence must include a real EAS build UUID");
    requireReadiness(easBuild?.status === "finished", "Build 86 EAS build must be finished");
    requireReadiness(easBuild?.platform === "ios" && easBuild.profile === "production", "Build 86 EAS identity must be an iOS production build");
    requireReadiness(isHttpsUrl(easBuild?.artifactUrl), "Build 86 EAS evidence must include its HTTPS IPA artifact URL");
    requireReadiness(
      easBuild?.appVersion === EXPECTED_VERSION && easBuild.buildNumber === EXPECTED_BUILD_NUMBER,
      "Build 86 EAS identity must match the configured app version and build number",
    );
    requireReadiness(
      typeof easBuild?.sourceCommit === "string" && /^[a-f0-9]{40}$/i.test(easBuild.sourceCommit),
      "Build 86 EAS evidence must include the 40-character source commit",
    );
    requireReadiness(isRecordedAt(easBuild?.completedAt), "Build 86 EAS evidence must include its completion timestamp");

    requireReadiness(Boolean(evidenceIpaPath && existsSync(evidenceIpaPath)), "Build 86 IPA must be downloaded locally for identity and hash verification");
    requireReadiness(isSha256(evidenceIpaSha256), "Build 86 IPA evidence must include a valid SHA-256");
    if (evidenceIpaPath && existsSync(evidenceIpaPath) && isSha256(evidenceIpaSha256)) {
      const actualBytes = statSync(evidenceIpaPath).size;
      requireReadiness(actualBytes > 0, "Build 86 IPA must not be empty");
      requireReadiness(fileSha256(evidenceIpaPath) === evidenceIpaSha256, "downloaded Build 86 IPA SHA-256 does not match its evidence record");
      requireReadiness(build80Evidence.ipa?.bytes === actualBytes, "Build 86 IPA byte count does not match its evidence record");
    }
    requireReadiness(
      build80Evidence.ipa?.version === EXPECTED_VERSION &&
        build80Evidence.ipa?.buildNumber === EXPECTED_BUILD_NUMBER &&
        build80Evidence.ipa?.bundleIdentifier === "com.mattnewman.studyplanner",
      "inspected IPA identity must match iOS 2.0.9 (86) and com.mattnewman.studyplanner",
    );
    requireReadiness(isRecordedAt(build80Evidence.ipa?.inspectedAt), "Build 86 IPA evidence must include its inspection timestamp");

    requireReadiness(ascBuild?.appAppleId === EXPECTED_ASC_APP_ID, `App Store Connect identity must use app Apple ID ${EXPECTED_ASC_APP_ID}`);
    requireReadiness(
      ascBuild?.version === EXPECTED_VERSION && ascBuild.buildNumber === EXPECTED_BUILD_NUMBER,
      "App Store Connect must show iOS 2.0.9 build 86",
    );
    requireReadiness(
      ascBuild?.uploaded === true && ascBuild.processed === true && ascBuild.selectedForVersion === true,
      "App Store Connect must show Build 86 uploaded, processed, and selected for app version 2.0.9",
    );
    requireReadiness(isRecordedAt(ascBuild?.verifiedAt), "Build 86 App Store Connect evidence must include its verification timestamp");

    if (isSha256(evidenceIpaSha256)) {
      validateScreenshotPlatformEvidence("iPhone", iphoneScreenshotRefs, build80Evidence.screenshots?.iphone, evidenceIpaSha256);
      validateScreenshotPlatformEvidence("iPad", ipadScreenshotRefs, build80Evidence.screenshots?.ipad, evidenceIpaSha256);
    } else {
      requireReadiness(false, "iPhone exact-binary screenshot provenance cannot be verified without the Build 86 IPA SHA-256");
      requireReadiness(false, "iPad exact-binary screenshot provenance cannot be verified without the Build 86 IPA SHA-256");
    }

    const appPreview = build80Evidence.appPreview;
    if (appPreview?.decision === "no_upload") {
      requireReadiness(appPreview.optional === true, "no-upload App Preview decision must explicitly mark App Preview as optional");
      requireReadiness(appPreview.uploadApproved === false, "no-upload App Preview decision must not authorize a video upload");
      requireReadiness(
        appPreview.reviewPath === APP_PREVIEW_REVIEW_PATH && productVideoReview.appPreviewReady === false,
        "no-upload App Preview decision must cite the current review showing existing videos are not App Preview-ready",
      );
    } else if (appPreview?.decision === "upload") {
      requireReadiness(productVideoReview.appPreviewReady === true, "App Preview upload requires a current review marked App Preview-ready");
      requireReadiness(appPreview.uploadApproved === true, "App Preview upload decision must explicitly approve the reviewed video");
      requireReadiness(Boolean(appPreview.path && existsSync(appPreview.path)), "approved App Preview file must exist");
      requireReadiness(isSha256(appPreview.sha256), "approved App Preview must have a valid SHA-256");
      if (appPreview.path && existsSync(appPreview.path) && isSha256(appPreview.sha256)) {
        requireReadiness(fileSha256(appPreview.path) === appPreview.sha256, "approved App Preview no longer matches its SHA-256");
      }
      requireReadiness(
        appPreview.exactBinarySource === true && appPreview.sourceIpaSha256 === evidenceIpaSha256,
        "approved App Preview must be sourced from the exact verified Build 86 binary",
      );
    } else {
      requireReadiness(false, "App Preview must have an explicit decision: upload a valid reviewed preview or no_upload because previews are optional");
    }

    const authorization = build80Evidence.humanUploadAuthorization;
    requireReadiness(authorization?.authorized === true, "a human must explicitly authorize the Build 86 app-version media upload");
    requireReadiness(
      Boolean(authorization?.authorizedBy?.trim()) && isRecordedAt(authorization?.authorizedAt),
      "human upload authorization must record who authorized it and when",
    );
    requireReadiness(authorization?.scope === "app_version_media", "human upload authorization scope must be app_version_media");
    requireReadiness(
      authorization?.version === EXPECTED_VERSION && authorization.buildNumber === EXPECTED_BUILD_NUMBER,
      "human upload authorization must identify iOS 2.0.9 build 86",
    );
    requireReadiness(
      isSha256(authorization?.ipaSha256) && authorization?.ipaSha256 === evidenceIpaSha256,
      "human upload authorization must bind to the verified Build 86 IPA SHA-256",
    );
    requireReadiness(
      sameStringSet(authorization?.screenshotPaths || [], screenshotRefs),
      "human upload authorization must cover the exact configured iPhone and iPad screenshot paths",
    );
    requireReadiness(
      authorization?.appPreviewDecision === appPreview?.decision,
      "human upload authorization must cover the exact App Preview upload/no-upload decision",
    );
    requireReadiness(
      authorization?.creativeProductionFinalsAuthorized === true,
      "human upload authorization must explicitly approve the final 238 Creative Production assets",
    );
  } else {
    requireReadiness(false, "real Build 86 EAS, IPA, and App Store Connect identity has not been recorded");
    requireReadiness(false, "exact-binary iPhone screenshot provenance has not been recorded");
    requireReadiness(false, "exact-binary iPad screenshot provenance has not been recorded");
    requireReadiness(false, "App Preview upload/no-upload decision has not been bound to Build 86");
    requireReadiness(false, "human Build 86 media upload authorization has not been recorded");
  }

  warn(
    productVideoReview.appPreviewReady === false && productVideoReview.appStoreConnectSlot?.uploadApproved === false,
    "existing videos are not approved App Previews; use an explicit no-upload decision unless a new valid exact-binary preview is reviewed",
  );

  const allFailures = [...failures, ...readinessBlockers];
  const payload = {
    generatedAt: new Date().toISOString(),
    status: allFailures.length ? "blocked_not_app_version_media_ready" : "ready_for_app_version_review_submission",
    appVersionMediaReady: allFailures.length === 0,
    humanUploadAuthorized: build80Evidence.humanUploadAuthorization?.authorized === true && allFailures.length === 0,
    networkChecked: checkNetwork,
    historicalJuly9Submission: {
      status: historicalEventSubmitted && historicalNominationSubmitted ? "submitted_historical_record" : "historical_record_incomplete",
      verifiedDate: "2026-07-09",
      inAppEvent: {
        name: "Semester Kickoff Week",
        submitted: historicalEventSubmitted,
        recordedStatus: historicalEventSubmitted ? "waiting_for_review" : "unknown",
      },
      featuringNomination: {
        id: "8255bf6c-6cbf-45bd-b88c-1afc3074ca41",
        submitted: historicalNominationSubmitted,
      },
      source: README_PATH,
      authorizesCurrentAppVersionMedia: false,
    },
    currentAppVersionMedia: {
      target: {
        version: EXPECTED_VERSION,
        buildNumber: EXPECTED_BUILD_NUMBER,
        bundleIdentifier: "com.mattnewman.studyplanner",
      },
      evidencePath: BUILD80_RELEASE_EVIDENCE_PATH,
      evidenceExists: build80EvidenceExists,
      evidenceStatus: build80Evidence.status || "missing",
      easBuild: easBuild || null,
      ipa: build80Evidence.ipa || null,
      appStoreConnect: ascBuild || null,
      exactBinaryScreenshotProvenance: {
        iphone: build80Evidence.screenshots?.iphone || null,
        ipad: build80Evidence.screenshots?.ipad || null,
      },
      appPreview: build80Evidence.appPreview || {
        decision: "missing",
        currentReview: APP_PREVIEW_REVIEW_PATH,
        existingCandidatesAppPreviewReady: productVideoReview.appPreviewReady === true,
      },
      humanUploadAuthorization: build80Evidence.humanUploadAuthorization || null,
    },
    appConfig: {
      scheme: appConfig.expo?.scheme || null,
      version: appConfig.expo?.version || null,
      iosBuildNumber: appConfig.expo?.ios?.buildNumber || null,
      iosBundleIdentifier: appConfig.expo?.ios?.bundleIdentifier || null,
      androidVersionCode: appConfig.expo?.android?.versionCode || null,
      widgetDefinitions: widgets.length,
      widgetsWithColorConfiguration: colorConfigWidgets.length,
      importDeepLinkRoutesToSemesterKickoff: appSource.includes('if (routeTokens.has("import")) return "semesterKickoff";'),
      runtimeReadsThemeColor: widgetRuntime.includes("configuration.themeColor"),
    },
    storeConfig: {
      version: storeConfig.apple?.version || null,
      automaticRelease: storeConfig.apple?.release?.automaticRelease === true,
      canonicalScreenshotRoot: CANONICAL_SCREENSHOT_ROOT,
      screenshotRefs: screenshotRefs.length,
      iphoneScreenshotRefs: iphoneScreenshotRefs.length,
      ipadScreenshotRefs: ipadScreenshotRefs.length,
      missingScreenshotRefs,
      nonCanonicalScreenshotRefs,
      legacyScreenshotRefs,
      unknownDeviceScreenshotRefs,
      screenshotDimensionMismatches,
    },
    historicalNominationPacket: {
      role: "submitted July 9 record; not current app-version media authorization",
      root: BUNDLE_ROOT,
      name: nominationName,
      type: nominationType,
      publishStart,
      publishEnd,
      platforms,
      descriptionCharacters: normalizedLength(nominationDescription),
      helpfulDetailsCharacters: normalizedLength(helpfulDetails),
      relatedEventIntent,
      eventName,
      deepLink: deepLinkField,
    },
    historicalEventMedia: mediaFiles.map((file) => ({
      id: file.id,
      path: file.path,
      width: file.width,
      height: file.height,
      approvedForEventMedia: file.approvedForEventMedia === true,
      bytes: file.path && existsSync(file.path) ? statSync(file.path).size : 0,
    })),
    historicalSupplementalUrls: {
      status: supplementalRegistry.status,
      requiredCount: supplementalRegistry.requiredCount,
      registeredCount: supplementalRegistry.registeredCount,
      slots: supplementalSlots.map((slot) => ({ id: slot.id, url: slot.url, status: slot.status })),
      networkResults,
    },
    requiredEvidenceSchema: {
      path: BUILD80_RELEASE_EVIDENCE_PATH,
      requirements: [
        "Finished iOS production EAS Build 86 UUID, artifact URL, source commit, and completion timestamp.",
        "Downloaded IPA path, bytes, SHA-256, and inspected 2.0.9/86/bundle identity.",
        "Live App Store Connect app 6766181202 readback showing Build 86 uploaded, processed, and selected.",
        "Per-file iPhone and iPad screenshot hashes linked to the exact Build 86 IPA SHA-256.",
        "Either a valid exact-binary App Preview upload decision or an explicit optional no_upload decision.",
        "Named, timestamped human authorization covering the exact IPA, all 238 Creative Production screenshots, and the preview decision.",
      ],
    },
    controlPlaneFailures: failures,
    readinessBlockers,
    failures: allFailures,
    warnings,
    remainingExternalChecks: [
      `Record a finished production EAS build and downloaded IPA identity for iOS ${EXPECTED_VERSION} build ${EXPECTED_BUILD_NUMBER}.`,
      `Confirm Build ${EXPECTED_BUILD_NUMBER} is uploaded, processed, and selected in live App Store Connect app ${EXPECTED_ASC_APP_ID}.`,
      "Capture and hash-link all configured iPhone and iPad screenshots to that exact IPA.",
      "Record either a valid exact-binary App Preview or an explicit optional no-upload decision.",
      "Obtain named, timestamped human authorization for the exact app-version media set.",
    ],
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  if (allFailures.length) {
    console.error("ASC app-version media readiness is blocked:");
    for (const failure of allFailures) console.error(`- ${failure}`);
    console.error(`Audit written to ${OUTPUT_PATH}`);
    process.exit(1);
  }

  if (warnings.length) {
    console.warn("ASC final upload bundle warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  console.log(`ASC app-version media readiness passed${checkNetwork ? " with network verification" : ""}.`);
  console.log(`Audit written to ${OUTPUT_PATH}`);
}

void main();
