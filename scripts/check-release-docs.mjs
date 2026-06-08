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
const importSource = read("src/screens/ImportScreen.tsx");
const paywallSource = read("src/screens/UpgradeScreen.tsx");
const moreSource = read("src/screens/MoreScreen.tsx");
const localizedMetadata = read("localized-app-store-metadata.md");
const appJson = JSON.parse(read("app.json"));

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
assert(guardrails.includes("expo_public_syllabus_image_parsing_enabled=1"), "Metadata guardrails must disclose the optional backend image parsing env flag");
assert(guardrails.includes("native ios vision ocr") && guardrails.includes("text-based pdfs and pasted text can still parse on device"), "Metadata guardrails must disclose native photo OCR and local text/PDF fallback");

const reviewLower = reviewNotes.toLowerCase();
assert(reviewLower.includes("invalid dates or times cannot be applied"), "App Review notes must preserve invalid-deadline application guardrail");
assert(reviewLower.includes("camera/photo ocr controls are enabled only when the native ios vision ocr module is present"), "App Review notes must disclose the native OCR gate.");
assert(reviewLower.includes("production parser endpoint is configured over https"), "App Review notes must disclose photo parsing endpoint dependency");
assert(reviewLower.includes("expo_public_syllabus_image_parsing_enabled=1"), "App Review notes must disclose the image parsing env flag");
assert(reviewLower.includes("instead of applying uncertain data"), "App Review notes must state unclear photo data is not applied");
assert(reviewLower.includes("studyplanner today (small, medium, inline, circular, rectangular)"), "App Review notes must document the StudyPlanner Today widget families");
assert(reviewLower.includes("studyplanner upcoming (small, medium, inline, circular, rectangular)"), "App Review notes must document the StudyPlanner Upcoming widget families");
assert(reviewLower.includes("studyplanner week (medium, inline, circular, rectangular)"), "App Review notes must document the StudyPlanner Week widget families");
assert(reviewLower.includes("studyplanner class progress (small, medium, inline, circular, rectangular)"), "App Review notes must document the StudyPlanner Class Progress widget families");
assert(reviewLower.includes("lock screen accessory families"), "App Review notes must document supported WidgetKit accessory families");
assert(reviewLower.includes("expo_public_sim_qa_capture"), "App Review notes must include the production capture-bypass env audit");
assert(reviewLower.includes("expo_public_iap_validation_endpoint"), "App Review notes must disclose optional server-side IAP validation endpoint");
assert(reviewLower.includes("does not include production apple server credentials"), "App Review notes must not overclaim server receipt validation");
assert(process.env.EXPO_PUBLIC_SIM_QA_CAPTURE !== "1", "Release QA must run without EXPO_PUBLIC_SIM_QA_CAPTURE=1");

const runtimeAndReleaseText = [
  appSource,
  importSource,
  paywallSource,
  moreSource,
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
assert(appSource.includes("hasNativeImageTextRecognition() || supportsSyllabusImageParsing()"), "Camera/photo OCR controls must be gated behind native Vision OCR or configured backend image parsing.");
assert(appSource.includes("createParsedImportFromCameraAsset") && importSource.includes("createParsedImportFromCameraAsset"), "Camera/photo OCR must create real photo parsed imports.");
assert(importSource.includes('type: ["application/pdf", "text/plain"]') && importSource.includes('Upload ${"PDF or text"}'), "Import copy must preserve supported PDF/text upload.");
assert(localizedMetadata.includes("AI-assisted text/PDF syllabus organization only"), "Localized metadata must define the AI truth boundary.");

const prdLower = prd.toLowerCase();
assert(prdLower.includes("direct canvas sync"), "PRD must keep Canvas out of V1 scope");
assert(prdLower.includes("automatic writes from ai without review"), "PRD must keep AI auto-write out of scope");
assert(prdLower.includes("invalid legacy deadlines"), "PRD must document invalid-deadline trust behavior");
assert(prdLower.includes("hard-gated build"), "PRD must document the current subscription-required product shell");
assert(!prdLower.includes(`${oldNoCostPrefix}-limit`), "PRD must not describe a bypass plan for the hard-paywall build.");
assert(prdLower.includes("expo_public_syllabus_image_parsing_enabled=1"), "PRD must gate photo parsing behind the image parsing env flag");
assert(prdLower.includes("photo import can save a review source"), "PRD must describe the honest photo source fallback.");

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
  /assignment|deadline|exam/.test(String(infoPlist.NSCalendarsFullAccessUsageDescription ?? "").toLowerCase()),
  "Calendar permission copy must explain assignment/deadline purpose"
);

console.log("release documentation guardrails passed");
