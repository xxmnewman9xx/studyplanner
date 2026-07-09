import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

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

const BUNDLE_ROOT = "docs/launch/back-to-school-2026/app-store-connect-final-upload";
const BUNDLE_PARENT = "docs/launch/back-to-school-2026";
const BUNDLE_ZIP_PATH = `${BUNDLE_PARENT}/studyplanner-back-to-school-2026-app-store-connect-upload.zip`;
const OUTPUT_PATH = "qa/back-to-school-2026/asc-final-upload-gate.json";
const APP_CONFIG_PATH = "app.json";
const APP_SOURCE_PATH = "App.tsx";
const STORE_CONFIG_PATH = "store.config.json";
const EVENT_MEDIA_MANIFEST_PATH = `${BUNDLE_ROOT}/reference/event-media-manifest.json`;
const SUPPLEMENTAL_REGISTRY_PATH = `${BUNDLE_ROOT}/reference/supplemental-url-registry.json`;
const NOMINATION_FIELDS_PATH = `${BUNDLE_ROOT}/nomination-fields.md`;
const README_PATH = `${BUNDLE_ROOT}/README.md`;
const DECISION_MEMO_PATH = `${BUNDLE_ROOT}/submission-decision-memo.md`;
const SUPPLEMENTAL_MD_PATH = `${BUNDLE_ROOT}/supplemental-url-registry.md`;
const DEEPLINK_PATH = `${BUNDLE_ROOT}/deeplink-validation.md`;
const LIVE_SESSION_PATH = `${BUNDLE_ROOT}/app-store-connect-live-session.md`;
const COPY_B_PROMPT_PATH = `${BUNDLE_ROOT}/outcome-copy-b-image-2-mac-prompts.md`;
const WIDGET_RUNTIME_PATH = "src/widgets/StudyPlannerWidgets.tsx";

const EXPECTED_VERSION = "2.0.8";
const EXPECTED_BUILD_NUMBER = "79";
const EXPECTED_SCREENSHOT_REFS = 144;
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
const warnings: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message);
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

function daysBetween(start: string, end: string) {
  return Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86400000);
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

function listBundleFiles(root: string) {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile()) {
        files.push(relative(BUNDLE_PARENT, path));
      }
    }
  };
  walk(root);
  return files.sort();
}

function listZipFiles(path: string) {
  if (!existsSync(path)) return [];
  try {
    return execFileSync("unzip", ["-Z1", path], { encoding: "utf8" })
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry && !entry.endsWith("/"))
      .sort();
  } catch (error) {
    failures.push(`Unable to inspect final upload zip ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fileSha256(path: string) {
  return sha256(readFileSync(path));
}

function zipEntrySha256(zipPath: string, entry: string) {
  try {
    const buffer = execFileSync("unzip", ["-p", zipPath, entry], { maxBuffer: 100 * 1024 * 1024 });
    return sha256(buffer);
  } catch (error) {
    failures.push(`Unable to hash ${entry} inside ${zipPath}: ${error instanceof Error ? error.message : String(error)}`);
    return "";
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
      widgetStatesCaptured: body.includes("Widget states captured: 5/8"),
      buildVisible: body.includes("2.0.8") && body.includes("79"),
      claimBoundariesVisible: body.includes("claim boundaries") || body.includes("Claim Boundaries") || body.includes("Canvas"),
    },
  };
}

async function main() {
  const readme = read(README_PATH);
  const decisionMemo = read(DECISION_MEMO_PATH);
  const nominationFields = read(NOMINATION_FIELDS_PATH);
  const supplementalMd = read(SUPPLEMENTAL_MD_PATH);
  const deeplink = read(DEEPLINK_PATH);
  const liveSession = read(LIVE_SESSION_PATH);
  const copyBPrompt = read(COPY_B_PROMPT_PATH);
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
  const bundleFiles = listBundleFiles(BUNDLE_ROOT);
  const zipFiles = listZipFiles(BUNDLE_ZIP_PATH);
  const zipFileSet = new Set(zipFiles);
  const bundleFileSet = new Set(bundleFiles);
  const missingZipEntries = bundleFiles.filter((path) => !zipFileSet.has(path));
  const extraZipEntries = zipFiles.filter((path) => !bundleFileSet.has(path));
  const mismatchedZipEntries = bundleFiles.filter((path) => {
    if (!zipFileSet.has(path)) return false;
    return fileSha256(join(BUNDLE_PARENT, path)) !== zipEntrySha256(BUNDLE_ZIP_PATH, path);
  });

  expect(readme.includes("Use this folder for the manual App Store Connect session."), "final upload README must identify this folder as the manual ASC bundle");
  expect(decisionMemo.includes("Submit the In-App Event and featuring nomination now"), "decision memo must explicitly recommend submit-now workflow");
  expect(decisionMemo.includes("Do not wait for the three remaining extended WidgetKit proof states"), "decision memo must distinguish optional extended WidgetKit proof states");
  expect(readme.includes("Do not block the In-App Event or featuring nomination on new previews"), "README must keep Copy B out of the nomination critical path");
  expect(copyBPrompt.includes("ChatGPT Mac app") && copyBPrompt.includes("GPT Image 2.0"), "Copy B prompt pack must preserve Mac app GPT Image 2.0 rule");
  expect(existsSync(BUNDLE_ZIP_PATH), `final upload zip must exist: ${BUNDLE_ZIP_PATH}`);
  expect(missingZipEntries.length === 0, `final upload zip is missing ${missingZipEntries.length} files from ${BUNDLE_ROOT}`);
  expect(extraZipEntries.length === 0, `final upload zip contains ${extraZipEntries.length} stale extra files`);
  expect(mismatchedZipEntries.length === 0, `final upload zip contains ${mismatchedZipEntries.length} files whose contents differ from ${BUNDLE_ROOT}`);

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
  expect(daysBetween("2026-07-24", publishStart) >= 21, "absolute latest submit date must leave at least 21 days before publish start");

  expect(deeplink.includes(EXPECTED_DEEP_LINK), "deeplink validation must mention studyplanner://import");
  expect(liveSession.includes("2.0.8") && liveSession.includes("79"), "live ASC checklist must mention iOS 2.0.8 build 79");
  expect(liveSession.includes(EXPECTED_DEEP_LINK), "live ASC checklist must mention studyplanner://import");
  expect(appConfig.expo?.scheme === EXPECTED_SCHEME, `app.json scheme must be ${EXPECTED_SCHEME}`);
  expect(appConfig.expo?.version === EXPECTED_VERSION, `app.json version must be ${EXPECTED_VERSION}`);
  expect(appConfig.expo?.ios?.buildNumber === EXPECTED_BUILD_NUMBER, `app.json iOS buildNumber must be ${EXPECTED_BUILD_NUMBER}`);
  expect(appConfig.expo?.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app.json iOS bundle identifier must match the submitted app");
  expect(appSource.includes('if (routeTokens.has("scan") || routeTokens.has("import")) return "scan";'), "App.tsx must route import deep links to the scan/import surface");
  expect(appSource.includes("Linking.getInitialURL()") && appSource.includes('Linking.addEventListener("url"'), "App.tsx must handle initial and runtime deep links");
  const widgets = widgetDefinitions(appConfig);
  const colorConfigWidgets = widgets.filter(widgetConfigHasThemeColor);
  expect(widgets.length >= 4, "app.json must keep the expected WidgetKit widget definitions");
  expect(colorConfigWidgets.length === 0, "app.json WidgetKit configuration must not expose themeColor/color customization parameters");
  expect(!widgetRuntime.includes("configuration.themeColor"), "WidgetKit runtime must not read stale themeColor color customization");
  expect(!widgetRuntime.includes("function themeAccent") && !widgetRuntime.includes("function themeTint"), "WidgetKit runtime must not keep color-picker theme mapping helpers");

  const screenshotRefs = collectScreenshotRefs(storeConfig);
  const missingScreenshotRefs = screenshotRefs.filter((path) => !existsSync(path));
  const nonPopScreenshotRefs = screenshotRefs.filter((path) => !path.startsWith("store/apple/screenshot-pop/"));
  const screenshotDimensionMismatches = screenshotRefs
    .filter((path) => existsSync(path))
    .map(screenshotDimensionMismatch)
    .filter((mismatch): mismatch is ScreenshotDimensionMismatch => Boolean(mismatch));
  expect(storeConfig.apple?.version === EXPECTED_VERSION, `store config Apple version must be ${EXPECTED_VERSION}`);
  expect(storeConfig.apple?.release?.automaticRelease === true, "store config should keep automatic release enabled");
  expect(screenshotRefs.length === EXPECTED_SCREENSHOT_REFS, `store config must reference ${EXPECTED_SCREENSHOT_REFS} screenshots`);
  expect(missingScreenshotRefs.length === 0, `store config has ${missingScreenshotRefs.length} missing screenshot refs`);
  expect(nonPopScreenshotRefs.length === 0, "store config screenshots must use store/apple/screenshot-pop A/control assets");
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
  expect(supplementalHero?.approvedForEventMedia === false, "supplemental hero must not be approved for event media");

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
    if (result.id === "native-widget-sheet") expect(result.checks?.widgetStatesCaptured === true, "native widget sheet must say Widget states captured: 5/8");
    if (result.id === "accessibility-localization-summary") expect(result.checks?.buildVisible === true, "accessibility/localization summary must show build 2.0.8 / 79");
    if (result.id === "app-review-proof") {
      expect(result.checks?.buildVisible === true, "app review proof must show build 2.0.8 / 79");
      expect(result.checks?.claimBoundariesVisible === true, "app review proof must show claim boundaries");
    }
    if (result.id === "product-video") warn((result.bytes || 0) > 0, "product video response did not include content-length; manual playback check may still be needed");
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    status: failures.length ? "blocked" : "ready",
    networkChecked: checkNetwork,
    bundleRoot: BUNDLE_ROOT,
    bundleZip: {
      path: BUNDLE_ZIP_PATH,
      exists: existsSync(BUNDLE_ZIP_PATH),
      bundleFiles: bundleFiles.length,
      zipFiles: zipFiles.length,
      missingEntries: missingZipEntries,
      extraEntries: extraZipEntries,
      mismatchedEntries: mismatchedZipEntries,
    },
    appConfig: {
      scheme: appConfig.expo?.scheme || null,
      version: appConfig.expo?.version || null,
      iosBuildNumber: appConfig.expo?.ios?.buildNumber || null,
      iosBundleIdentifier: appConfig.expo?.ios?.bundleIdentifier || null,
      androidVersionCode: appConfig.expo?.android?.versionCode || null,
      widgetDefinitions: widgets.length,
      widgetsWithColorConfiguration: colorConfigWidgets.length,
      importDeepLinkRoutesToScan: appSource.includes('if (routeTokens.has("scan") || routeTokens.has("import")) return "scan";'),
      runtimeReadsThemeColor: widgetRuntime.includes("configuration.themeColor"),
    },
    storeConfig: {
      version: storeConfig.apple?.version || null,
      automaticRelease: storeConfig.apple?.release?.automaticRelease === true,
      screenshotRefs: screenshotRefs.length,
      missingScreenshotRefs,
      nonPopScreenshotRefs,
      screenshotDimensionMismatches,
    },
    nomination: {
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
    eventMedia: mediaFiles.map((file) => ({
      id: file.id,
      path: file.path,
      width: file.width,
      height: file.height,
      approvedForEventMedia: file.approvedForEventMedia === true,
      bytes: file.path && existsSync(file.path) ? statSync(file.path).size : 0,
    })),
    supplementalUrls: {
      status: supplementalRegistry.status,
      requiredCount: supplementalRegistry.requiredCount,
      registeredCount: supplementalRegistry.registeredCount,
      slots: supplementalSlots.map((slot) => ({ id: slot.id, url: slot.url, status: slot.status })),
      networkResults,
    },
    failures,
    warnings,
    remainingExternalChecks: [
      "Confirm iOS 2.0.8 build 79 in the live App Store Connect session.",
      "Confirm event media crop in App Store Connect after upload.",
      "Confirm studyplanner://import in the live In-App Event form.",
      "Confirm all five supplemental URLs are accepted in the live nomination form.",
    ],
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  if (failures.length) {
    console.error("ASC final upload bundle checks failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(`Audit written to ${OUTPUT_PATH}`);
    process.exit(1);
  }

  if (warnings.length) {
    console.warn("ASC final upload bundle warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  console.log(`ASC final upload bundle checks passed${checkNetwork ? " with network verification" : ""}.`);
  console.log(`Audit written to ${OUTPUT_PATH}`);
}

void main();
