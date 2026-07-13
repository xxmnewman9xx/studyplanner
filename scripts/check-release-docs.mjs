import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function section(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert(start >= 0, `Missing section: ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n##? /);
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
}

const metadata = read("docs/APP_STORE_METADATA.md");
const reviewNotes = read("docs/APP_REVIEW_NOTES.md");
const prd = read("docs/PRD.md");
const appSource = read("App.tsx");
const localizedMetadata = read("localized-app-store-metadata.md");
const appJson = JSON.parse(read("app.json"));
const storeConfigText = read("store.config.json");
const storeConfig = JSON.parse(storeConfigText);

function firstContentLine(text) {
  return text.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

const subtitle = firstContentLine(section(metadata, "## Subtitle")).toLowerCase();
const keywords = firstContentLine(section(metadata, "## Keywords")).toLowerCase();
const description = section(metadata, "## Long Description Draft").toLowerCase();
const guardrails = section(metadata, "## Review Notes To Prepare").toLowerCase();

assert(!subtitle.includes("canvas"), "Subtitle must not claim Canvas support before a shipped Canvas workflow exists");
assert(!keywords.includes("canvas"), "Keywords must not include Canvas before a shipped Canvas workflow exists");
assert(description.includes("editable"), "Description should preserve editable/review-before-apply positioning");
assert(metadata.includes("StudyPlanner: Syllabus AI"), "Metadata should preserve the Syllabus AI hook for text/PDF organization.");
assert(guardrails.includes("do not mention canvas"), "Metadata guardrails must explicitly block unsupported Canvas claims");
assert(guardrails.includes("does not claim server-side parsing"), "Metadata guardrails must block unsupported server-side parsing claims");
assert(guardrails.includes("native ios vision ocr") && guardrails.includes("text-based pdfs and pasted text can still parse on device"), "Metadata guardrails must disclose native photo OCR and local text/PDF fallback");

const reviewLower = reviewNotes.toLowerCase();
assert(reviewLower.includes("invalid dates or times cannot be applied"), "App Review notes must preserve invalid-deadline application guardrail");
assert(reviewLower.includes("camera/photo ocr controls are enabled only when the native ios vision ocr module is present"), "App Review notes must disclose the native OCR gate.");
assert(reviewLower.includes("does not upload syllabus content to a studyplanner parser service"), "App Review notes must preserve the on-device import boundary");
assert(reviewLower.includes("instead of applying uncertain data"), "App Review notes must state unclear photo data is not applied");
assert(reviewLower.includes("studyplanner today (medium plus inline, circular, and rectangular accessories)"), "App Review notes must document the medium Today family and accessories");
assert(reviewLower.includes("studyplanner upcoming (small plus accessories)"), "App Review notes must document the small Upcoming family and accessories");
assert(reviewLower.includes("studyplanner week (medium plus accessories)"), "App Review notes must document the medium Week family and accessories");
assert(reviewLower.includes("studyplanner class progress (small plus accessories)"), "App Review notes must document the small Class Progress family and accessories");
assert(reviewLower.includes("lock screen accessory families"), "App Review notes must document supported WidgetKit accessory families");
assert(reviewLower.includes("expo_public_studyplanner_capture_qa"), "App Review notes must include the production capture-bypass env audit");
assert(reviewLower.includes("does not claim server-side receipt validation"), "App Review notes must not overclaim server receipt validation");
assert(process.env.EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA !== "1", "Release QA must run without EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1");

const runtimeAndReleaseText = [
  appSource,
  metadata,
  reviewNotes,
  prd,
  localizedMetadata,
  read("README.md")
].join("\n").toLowerCase();

const oldNoCostPrefix = "fr" + "ee";
const oldSwitchVerb = "up" + "grade";
for (const phrase of [`${oldNoCostPrefix}mium`, `${oldNoCostPrefix} plan`, `${oldSwitchVerb} from ${oldNoCostPrefix}`, `unlimited ${"imports"}`, "syllabus scanner"]) {
  assert(!runtimeAndReleaseText.includes(phrase), `Release/runtime copy must not include unsupported phrase: ${phrase}`);
}
assert(appSource.includes("const imageOcrAvailable = hasNativeImageTextRecognition()") && appSource.includes("const scannerReady = hasNativeImageTextRecognition()"), "Active camera/photo OCR controls must match the native Vision OCR implementation they call.");
assert(appSource.includes("createParsedImportFromCameraAsset") && appSource.includes("extractTextFromImage(result.assets[0].uri)"), "Active camera/photo OCR must create a real reviewed import from native text extraction.");
assert(appSource.includes("const result = await pickAndExtractPdf()") && appSource.includes("result.fallbackNeeded") && appSource.includes('textFor("scan.scan_pages", "Scan pages")'), "Active PDF import must preserve on-device text extraction with camera/paste fallback.");
assert(localizedMetadata.includes("AI-assisted text/PDF syllabus organization only"), "Localized metadata must define the AI truth boundary.");

const prdLower = prd.toLowerCase();
assert(prdLower.includes("direct canvas sync"), "PRD must keep Canvas out of V1 scope");
assert(prdLower.includes("automatic writes from ai without review"), "PRD must keep AI auto-write out of scope");
assert(prdLower.includes("invalid legacy deadlines"), "PRD must document invalid-deadline trust behavior");
assert(prdLower.includes("hard-gated build"), "PRD must document the current subscription-required product shell");
assert(!prdLower.includes(`${oldNoCostPrefix}-limit`), "PRD must not describe a bypass plan for the hard-paywall build.");
assert(prdLower.includes("native ios vision ocr module"), "PRD must describe the native iOS photo OCR gate");
assert(prdLower.includes("supported imports are processed on device"), "PRD must preserve the on-device import boundary");

const infoPlist = appJson?.expo?.ios?.infoPlist ?? {};
assert(
  String(infoPlist.NSCameraUsageDescription ?? "").toLowerCase().includes("syllabus"),
  "Camera permission copy must explain syllabus import purpose"
);
assert(
  String(infoPlist.NSPhotoLibraryUsageDescription ?? "").toLowerCase().includes("syllabus"),
  "Photo library permission copy must explain syllabus import purpose"
);
assert(
  !infoPlist.NSCalendarsFullAccessUsageDescription,
  "Calendar permission must stay absent until device calendar sync ships"
);

const screenshotReferences = Object.values(storeConfig?.apple?.info ?? {}).flatMap((locale) =>
  Object.values(locale?.screenshots ?? {}).flatMap((paths) => Array.isArray(paths) ? paths : [])
);
assert(screenshotReferences.length > 0, "Store configuration must preserve explicit screenshot references");
assert(!screenshotReferences.some((path) => path.includes("screenshot-pop")), "Store configuration must not reference the blocked generated screenshot-pop tree");
assert(screenshotReferences.length === 238, "Build 86 store configuration must contain 238 screenshot references");
assert(screenshotReferences.every((path) => path.startsWith("store/apple/screenshot-build86-creative-production/")), "Every screenshot reference must use the Build 86 Creative Production root");

assert(!storeConfigText.includes("tinyurl.com"), "Store metadata must use the direct hosted privacy-policy URL, never a short link");
for (const [locale, info] of Object.entries(storeConfig?.apple?.info ?? {})) {
  if (!info?.description) continue;
  assert(info.privacyPolicyUrl, `${locale} must declare a direct privacyPolicyUrl`);
  assert(info.description.includes(info.privacyPolicyUrl), `${locale} description must repeat its direct privacyPolicyUrl`);
}
const storeReviewNotes = String(storeConfig?.apple?.review?.notes ?? "").toLowerCase();
assert(storeReviewNotes.includes("uses apple's vision framework on the device"), "Store review notes must explain the on-device photo OCR boundary");
assert(storeReviewNotes.includes("is not uploaded to a remote parser"), "Store review notes must explicitly deny remote syllabus/note parsing");
assert(!storeReviewNotes.includes("expo_public_syllabus"), "Store review notes must not mention retired remote-parser environment flags");

console.log("release documentation guardrails passed");
