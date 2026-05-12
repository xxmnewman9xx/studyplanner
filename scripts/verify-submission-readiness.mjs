#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const artifactsRoot = path.join(root, "artifacts/post-goal-aso-submission");
const proofRoot =
  process.env.STUDYPLANNER_SUBMISSION_PROOF_DIR ||
  path.join(artifactsRoot, "external-proof");
const expectedMonthlyId = "com.mattnewman.studyplanner.plus.monthly";
const expectedYearlyId = "com.mattnewman.studyplanner.plus.yearly";
const expectedLifetimeId = "com.mattnewman.studyplanner.plus.lifetime";
const submitLocalizations = process.env.STUDYPLANNER_SUBMIT_LOCALIZATIONS === "1";
const checks = [];

check(
  process.env.EXPO_PUBLIC_STORE_CAPTURE !== "1",
  "Store capture mode is off",
  "EXPO_PUBLIC_STORE_CAPTURE=1 enables screenshot/demo mode and cannot be used for submission."
);

const subscriptionIds = readList(process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS || "");
const lifetimeIds = readList(process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS || "");
check(
  subscriptionIds.includes(expectedMonthlyId) && subscriptionIds.includes(expectedYearlyId),
  "Monthly and yearly IAP IDs are configured",
  `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS must include ${expectedMonthlyId} and ${expectedYearlyId}.`
);
check(
  lifetimeIds.includes(expectedLifetimeId),
  "Lifetime IAP ID is configured",
  `EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS must include ${expectedLifetimeId}.`
);
check(
  isHttpsUrl(process.env.EXPO_PUBLIC_SUPPORT_URL),
  "Support URL is configured",
  "EXPO_PUBLIC_SUPPORT_URL must be a real public https URL before submission."
);

checkFile("Primary contact sheet exists", "45-final-contact-sheet.png");
checkFile("Production no-data Today proof exists", "06-today-empty.png");
checkFile("Small native Home Screen widget proof exists", "30-small-widget-home-screen.png");
checkFile("Medium native Home Screen widget proof exists", "31-medium-widget-home-screen.png");
checkFile("Paywall failure proof exists and is honest", "38-paywall-product-load-failure.png");

checkPngSet({
  label: "iPhone 6.9-inch export has 10 accepted-size PNGs",
  directory: "app-store-export/iphone-6-9",
  expectedCount: 10,
  expectedWidth: 1290,
  expectedHeight: 2796
});
checkPngSet({
  label: "iPad 13-inch export has 10 accepted-size PNGs",
  directory: "app-store-export/ipad-13",
  expectedCount: 10,
  expectedWidth: 2064,
  expectedHeight: 2752
});
checkManifest();

checkFile(
  "Products-loaded paywall screenshot exists",
  "37-paywall-products-loaded.png",
  "A products-loaded paywall screenshot must be captured from real StoreKit products before submit."
);

checkProof({
  label: "StoreKit monthly/yearly/Lifetime/restore proof is recorded",
  fileName: "storekit-sandbox-proof.md",
  requiredTerms: ["monthly", "yearly", "lifetime", "restore", "sandbox"],
  blockerMessage:
    "Add StoreKit sandbox/App Store Connect evidence for monthly, yearly, Lifetime, and restore flows."
});
checkProof({
  label: "App Store Connect screenshot upload acceptance is recorded",
  fileName: "app-store-connect-screenshot-upload.md",
  requiredTerms: ["accepted", "iphone", "ipad"],
  blockerMessage:
    "Upload the exported screenshot sets in App Store Connect and record accepted status for iPhone and iPad."
});
checkProof({
  label: "Signed archive entitlements are recorded",
  fileName: "signed-archive-entitlements.md",
  requiredTerms: ["aps-environment", "production"],
  blockerMessage:
    "Archive/sign the App Store build and record production notification entitlements."
});
checkProof({
  label: "VoiceOver traversal is recorded",
  fileName: "voiceover-traversal.md",
  requiredTerms: ["today", "check", "assignment", "widget", "paywall"],
  blockerMessage:
    "Run full simulator/device VoiceOver traversal for core flows and record the result."
});

if (submitLocalizations) {
  checkProof({
    label: "Localized UI/native-speaker review is recorded",
    fileName: "localized-ui-native-review.md",
    requiredTerms: ["native", "locale", "screenshot", "review"],
    blockerMessage:
      "Localized submission requires translated UI review, native-speaker approval, and screenshot text-fit proof."
  });
} else {
  warn(
    "Localized UI/native-speaker review not required for English-only submission",
    "Set STUDYPLANNER_SUBMIT_LOCALIZATIONS=1 to make localized UI/native review a blocker."
  );
}

const blockers = checks.filter((item) => item.status === "BLOCKER");
const warnings = checks.filter((item) => item.status === "WARN");

console.log("Submission readiness verification");
console.log(`Artifacts: ${path.relative(root, artifactsRoot)}`);
console.log(`External proof folder: ${path.relative(root, proofRoot)}`);
console.log("");
for (const item of checks) {
  console.log(`${item.status.padEnd(7)} ${item.label}`);
  if (item.detail) {
    console.log(`        ${item.detail}`);
  }
}

if (blockers.length > 0) {
  console.error("");
  console.error(`NO-SUBMIT: ${blockers.length} blocker(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log("");
console.log(`SUBMIT CANDIDATE: 0 blockers, ${warnings.length} warning(s).`);

function check(condition, label, detail) {
  checks.push({
    status: condition ? "PASS" : "BLOCKER",
    label,
    detail: condition ? undefined : detail
  });
}

function warn(label, detail) {
  checks.push({ status: "WARN", label, detail });
}

function checkFile(label, relativePath, blockerMessage) {
  const filePath = path.join(artifactsRoot, relativePath);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
  check(exists, label, blockerMessage || `Missing or empty file: ${path.relative(root, filePath)}`);
}

function checkPngSet({ label, directory, expectedCount, expectedWidth, expectedHeight }) {
  const fullDirectory = path.join(artifactsRoot, directory);
  if (!fs.existsSync(fullDirectory)) {
    check(false, label, `Missing export directory: ${path.relative(root, fullDirectory)}`);
    return;
  }

  const files = fs.readdirSync(fullDirectory).filter((file) => file.endsWith(".png"));
  const badFiles = files.filter((file) => {
    const dimensions = readPngDimensions(path.join(fullDirectory, file));
    return dimensions.width !== expectedWidth || dimensions.height !== expectedHeight;
  });
  const passed = files.length === expectedCount && badFiles.length === 0;
  check(
    passed,
    label,
    `Expected ${expectedCount} PNGs at ${expectedWidth}x${expectedHeight}; found ${files.length}, bad dimensions: ${badFiles.join(", ") || "none"}.`
  );
}

function checkManifest() {
  const manifestPath = path.join(artifactsRoot, "app-store-export/manifest.json");
  if (!fs.existsSync(manifestPath)) {
    check(false, "Screenshot export manifest exists", `Missing file: ${path.relative(root, manifestPath)}`);
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const passed =
      manifest.iphone?.acceptedPortraitSize?.width === 1290 &&
      manifest.iphone?.acceptedPortraitSize?.height === 2796 &&
      manifest.iphone?.screenshots?.length === 10 &&
      manifest.ipad?.acceptedPortraitSize?.width === 2064 &&
      manifest.ipad?.acceptedPortraitSize?.height === 2752 &&
      manifest.ipad?.screenshots?.length === 10 &&
      typeof manifest.appleScreenshotSpecUrl === "string";
    check(passed, "Screenshot export manifest matches expected upload sets", "Manifest is missing expected dimensions, screenshot counts, or Apple spec URL.");
  } catch (error) {
    check(false, "Screenshot export manifest matches expected upload sets", `Manifest parse failed: ${error}`);
  }
}

function checkProof({ label, fileName, requiredTerms, blockerMessage }) {
  const filePath = path.join(proofRoot, fileName);
  if (!fs.existsSync(filePath)) {
    check(false, label, `${blockerMessage} Missing: ${path.relative(root, filePath)}`);
    return;
  }

  const source = fs.readFileSync(filePath, "utf8").toLowerCase();
  const missingTerms = requiredTerms.filter((term) => !source.includes(term));
  const placeholderTerms = ["template", "todo", "placeholder", "replace before submit", "sample only"];
  const placeholderTerm = placeholderTerms.find((term) => source.includes(term));
  const passed = source.trim().length >= 120 && missingTerms.length === 0 && !placeholderTerm;
  check(
    passed,
    label,
    `${blockerMessage} Proof file is too thin, contains placeholder language, or is missing terms. Missing terms: ${missingTerms.join(", ") || "none"}. Placeholder term: ${placeholderTerm || "none"}.`
  );
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    return { width: 0, height: 0 };
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function readList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isHttpsUrl(value) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
