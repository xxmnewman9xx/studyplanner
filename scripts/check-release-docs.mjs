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
assert(guardrails.includes("do not mention canvas"), "Metadata guardrails must explicitly block unsupported Canvas claims");
assert(guardrails.includes("expo_public_syllabus_image_parsing_enabled=1"), "Metadata guardrails must gate photo parsing behind the image parsing env flag");
assert(guardrails.includes("no local ocr fallback") && guardrails.includes("text-based pdfs and pasted text can still parse on device"), "Metadata guardrails must disclose real photo parsing and local text/PDF fallback");

const reviewLower = reviewNotes.toLowerCase();
assert(reviewLower.includes("invalid dates or times cannot be applied"), "App Review notes must preserve invalid-deadline application guardrail");
assert(reviewLower.includes("camera scan is active in this build only when the production parser endpoint is configured over https"), "App Review notes must disclose photo parsing endpoint dependency");
assert(reviewLower.includes("expo_public_syllabus_image_parsing_enabled=1"), "App Review notes must disclose the image parsing env flag");
assert(reviewLower.includes("there is no local image ocr fallback"), "App Review notes must disclose missing local image OCR");
assert(reviewLower.includes("instead of applying uncertain data"), "App Review notes must state unclear photo data is not applied");
assert(reviewLower.includes("lock screen accessory families"), "App Review notes must match the configured WidgetKit accessory families");
assert(reviewLower.includes("expo_public_sim_qa_capture"), "App Review notes must include the production capture-bypass env audit");
assert(reviewLower.includes("expo_public_iap_validation_endpoint"), "App Review notes must disclose optional server-side IAP validation endpoint");
assert(reviewLower.includes("does not include production apple server credentials"), "App Review notes must not overclaim server receipt validation");
assert(process.env.EXPO_PUBLIC_SIM_QA_CAPTURE !== "1", "Release QA must run without EXPO_PUBLIC_SIM_QA_CAPTURE=1");

const prdLower = prd.toLowerCase();
assert(prdLower.includes("direct canvas sync"), "PRD must keep Canvas out of V1 scope");
assert(prdLower.includes("automatic writes from ai without review"), "PRD must keep AI auto-write out of scope");
assert(prdLower.includes("invalid legacy deadlines"), "PRD must document invalid-deadline trust behavior");
assert(prdLower.includes("hard-gated build"), "PRD must document the current Plus-required product shell");
assert(prdLower.includes("expo_public_syllabus_image_parsing_enabled=1"), "PRD must gate photo parsing behind the image parsing env flag");

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
