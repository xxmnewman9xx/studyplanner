#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const STORE_TO_RUNTIME_LOCALE = Object.freeze({
  "ar-SA": "ar",
  "de-DE": "de",
  "en-AU": "en-US",
  "en-CA": "en-US",
  "en-GB": "en-US",
  "en-US": "en-US",
  "es-ES": "es",
  "es-MX": "es",
  "fr-CA": "fr",
  "fr-FR": "fr",
  hi: "hi",
  ja: "ja",
  ko: "ko",
  "pt-BR": "pt-BR",
  "pt-PT": "pt-PT",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hant",
});

const SLIDES = Object.freeze([
  { id: "01-class-material", target: "scan-light", intent: "Show real class material entering a calm, reviewable workflow." },
  { id: "02-approve-deadlines", target: "review-light", intent: "Show that the student reviews and approves every deadline before save." },
  { id: "03-today-next-move", target: "today-light", intent: "Show the trusted outcome: one clear next move today." },
  { id: "04-plan-the-week", target: "plan-dark", intent: "Show the real weekly plan in black mode with white app chrome and preserved course colors." },
  { id: "05-any-light", target: "profile-light", intent: "Show the real System, Light, and Dark appearance control; pair it with the dark-mode proof already established in slide four." },
]);

const DEVICES = Object.freeze({
  iphone: Object.freeze({ slot: "APP_IPHONE_65", width: 1242, height: 2688, family: "iPhone" }),
  ipad: Object.freeze({ slot: "APP_IPAD_PRO_3GEN_129", width: 2048, height: 2732, family: "iPad" }),
});

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log("Usage: node scripts/create-build83-chatgpt-preview-queue.mjs --iphone-root DIR --ipad-root DIR --reference-one PNG --reference-two PNG [--out JSON]");
  process.exit(0);
}

const roots = {
  iphone: requiredPath("--iphone-root"),
  ipad: requiredPath("--ipad-root"),
};
const references = [requiredPath("--reference-one"), requiredPath("--reference-two")];
const outputPath = resolve(valueArg("--out") || "qa/back-to-school-2026/build83-chatgpt-image2-preview-queue.json");
const copyPath = resolve("docs/launch/back-to-school-2026/build83-five-slide-copy.json");
const copy = JSON.parse(readFileSync(copyPath, "utf8"));
const manifests = {
  iphone: readManifest(roots.iphone, DEVICES.iphone),
  ipad: readManifest(roots.ipad, DEVICES.ipad),
};
validateInputs(copy, manifests, references);

const items = [];
for (const [storeLocale, localizedSlides] of Object.entries(copy.localizations)) {
  const runtimeLocale = STORE_TO_RUNTIME_LOCALE[storeLocale];
  for (const [deviceKey, device] of Object.entries(DEVICES)) {
    for (const [index, slide] of SLIDES.entries()) {
      const localized = localizedSlides.find(({ id }) => id === slide.id);
      const raw = findRaw(manifests[deviceKey], runtimeLocale, slide.target);
      const id = `${storeLocale}-${deviceKey}-${String(index + 1).padStart(2, "0")}`;
      const outputPathRecommended = join(
        "store/apple/build83-chatgpt-image2",
        storeLocale,
        device.slot,
        `${slide.id}.png`,
      );
      items.push({
        id,
        locale: storeLocale,
        runtimeLocale,
        device: deviceKey,
        screenSlot: device.slot,
        slideIndex: index + 1,
        slideId: slide.id,
        sourcePath: raw.screenshotPath,
        sourcePaths: [raw.screenshotPath, ...references],
        sourceScreenshotSha256: raw.screenshotSha256,
        sourceSidecarPath: raw.screenshotPath.replace(/\.png$/, ".json"),
        sourceCandidateBundleSha256: raw.candidateBundleSha256,
        requiredOutputSize: { width: device.width, height: device.height },
        outputPathRecommended,
        generationSurface: "ChatGPT Mac app",
        model: "GPT Image 2.0",
        uploadAuthorized: false,
        prompt: promptFor({
          device,
          slide,
          localized,
          storeLocale,
          sourceSha256: raw.screenshotSha256,
        }),
      });
    }
  }
}

if (items.length !== 170) throw new Error(`expected 170 prompt items, got ${items.length}`);
const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: copy.status === "native_language_review_complete"
    ? "ready_for_chatgpt_mac_image2_generation"
    : "ready_for_chatgpt_mac_image2_generation_human_copy_review_pending",
  generationSurface: "ChatGPT Mac app",
  model: "GPT Image 2.0",
  release: {
    appVersion: "2.0.8",
    buildNumber: "83",
    runtimeSourceCommit: copy.sourceCommit,
    candidateBundleSha256: manifests.iphone.candidateBundleSha256,
  },
  referencePreviews: references.map((path) => ({ path, sha256: sha256File(path) })),
  localeCount: Object.keys(copy.localizations).length,
  deviceCount: Object.keys(DEVICES).length,
  slideCount: SLIDES.length,
  itemCount: items.length,
  uploadAuthorized: false,
  items,
};
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${items.length} ChatGPT Mac / GPT Image 2.0 prompt jobs to ${outputPath}`);

function promptFor({ device, slide, localized, storeLocale, sourceSha256 }) {
  const darkDirection = slide.target.endsWith("dark")
    ? "Use a black marketing canvas with white headline treatment so it feels continuous with the attached real dark UI."
    : "Use a mainly white marketing canvas with black headline treatment and restrained course-color accents.";
  return `GPT Image 2.0 in the ChatGPT Mac app: create exactly one final App Store screenshot PNG at exactly ${device.width}x${device.height} pixels.

Attachment order:
1. The first attached image is immutable real StudyPlanner Build 83 ${device.family} UI for locale ${storeLocale}. Its SHA-256 is ${sourceSha256}.
2. The second and third attached images are layout and art-direction references only.

Product-truth requirement:
- Preserve every pixel, word, icon, status bar element, class color, spacing relationship, and control inside the first attached real UI. Do not redraw, rewrite, translate, recolor, blur, crop, replace, or invent any app UI.
- The app's visual system is mainly white with black controls in Light mode and black with white controls in Dark mode. Course colors remain distinct. Do not introduce a blue or purple global app accent.
- Improve only presentation outside the real UI: premium white space, soft natural depth, restrained edge shapes, and a clean Apple-native product-page rhythm inspired by attachments two and three.
- No fake widgets, fake notifications, fake app screens, fake phone UI, school logos, awards, ratings, prices, App Store badges, watermarks, or unsupported claims.

Slide intent: ${slide.intent}
${darkDirection}

Render this external marketing copy exactly for ${storeLocale}, with no English fallback and no extra text:
Headline: ${localized.headline}
Subhead: ${localized.subhead}

Keep the headline and subhead in the top 20-25% safe area. Make the real UI the dominant proof. Return one opaque sRGB PNG whose actual retrievable file dimensions are exactly ${device.width}x${device.height}. If faithful preservation is impossible, keep the real UI unchanged rather than inventing a replacement.`;
}

function readManifest(root, device) {
  const path = join(root, "manifest.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  if (manifest.appVersion !== "2.0.8" || manifest.buildNumber !== "83") throw new Error(`${path}: expected Build 83`);
  if (!String(manifest.device?.name || "").includes(device.family)) throw new Error(`${path}: expected ${device.family}`);
  if (manifest.screenshotCount !== 72 || manifest.entries?.length !== 72) throw new Error(`${path}: expected 72 raw captures`);
  if (!manifest.installedBundleVerified || manifest.releaseEligible !== false || manifest.uploadAuthorized !== false) throw new Error(`${path}: unsafe raw provenance`);
  return manifest;
}

function validateInputs(copy, manifests, references) {
  if (!["native_language_review_complete", "draft_requires_native_language_review"].includes(copy.status)) throw new Error(`unsupported copy review state: ${copy.status}`);
  if (copy.productUiPolicy !== "exact_build_pixels_only") throw new Error("copy must require exact build pixels");
  if (Object.keys(copy.localizations || {}).length !== 17) throw new Error("copy must contain 17 storefront locales");
  if (manifests.iphone.sourceCommit !== manifests.ipad.sourceCommit) throw new Error("raw manifests disagree on source commit");
  if (manifests.iphone.candidateBundleSha256 !== manifests.ipad.candidateBundleSha256) throw new Error("raw manifests disagree on candidate bundle");
  for (const path of references) if (!existsSync(path)) throw new Error(`missing reference preview: ${path}`);
}

function findRaw(manifest, locale, target) {
  const matches = manifest.entries.filter((entry) => entry.locale === locale && entry.target === target);
  if (matches.length !== 1) throw new Error(`expected one ${locale}/${target} capture, got ${matches.length}`);
  const raw = matches[0];
  if (!existsSync(raw.screenshotPath) || sha256File(raw.screenshotPath) !== raw.screenshotSha256) throw new Error(`${raw.screenshotPath}: hash mismatch`);
  return raw;
}

function valueArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function requiredPath(name) {
  const value = valueArg(name);
  if (!value) throw new Error(`${name} is required`);
  return resolve(value);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
