#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = path.join(root, "docs/STOREKIT_IAP_HANDOFF_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !jsonMode && !process.argv.includes("--no-write");

const expectedMonthlyId = "com.mattnewman.studyplanner.plus.monthly";
const expectedYearlyId = "com.mattnewman.studyplanner.plus.yearly";
const expectedLifetimeId = "com.mattnewman.studyplanner.plus.lifetime";

const files = {
  appConfig: read("app.json"),
  purchaseConfig: read("src/services/purchaseConfig.ts"),
  subscriptions: read("src/services/subscriptions.tsx"),
  upgrade: read("src/screens/UpgradeScreen.tsx"),
  settings: read("src/screens/SettingsScreen.tsx"),
  appStoreMetadata: read("docs/APP_STORE_METADATA.md"),
  lifetimeSetup: read("docs/LIFETIME_IAP_SETUP.md"),
  handoff: read("docs/APP_STORE_SUBMISSION_HANDOFF.md")
};

const recommendedMetadata = [
  readSection(files.appStoreMetadata, "Recommended Primary Metadata", "Description Draft"),
  readSection(files.appStoreMetadata, "Description Draft", "Safe Claim Bank"),
  readSection(files.appStoreMetadata, "Screenshot Narrative", "Review Notes To Prepare")
].join("\n");

const checks = [
  check(files.appConfig.includes('"expo-iap"'), "Expo IAP plugin is configured", "app.json must include the expo-iap config plugin."),
  checkIncludesAll(
    files.purchaseConfig,
    "Expected IAP IDs are documented in purchaseConfig",
    [expectedMonthlyId, expectedYearlyId, expectedLifetimeId]
  ),
  checkIncludesAll(
    files.purchaseConfig,
    "IAP IDs are environment-driven",
    [
      "process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS",
      "process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS"
    ]
  ),
  checkIncludesAll(
    files.subscriptions,
    "Store APIs are used for products, purchase, restore, and transaction finish",
    [
      "fetchProducts",
      "requestPurchase",
      "restorePurchases",
      "finishTransaction",
      "getActiveSubscriptions",
      "getAvailablePurchases"
    ]
  ),
  checkIncludesAll(
    files.subscriptions,
    "Monthly/yearly subscriptions are loaded as subscriptions",
    [
      "fetchProducts({ skus: purchaseConfig.subscriptionIds, type: \"subs\" })",
      "requestPurchase({\n            type: \"subs\""
    ]
  ),
  checkIncludesAll(
    files.subscriptions,
    "Lifetime product is loaded and purchased as in-app",
    [
      "fetchProducts({ skus: purchaseConfig.lifetimeProductIds, type: \"in-app\" })",
      "requestPurchase({\n            type: \"in-app\""
    ]
  ),
  checkIncludesAll(
    files.subscriptions,
    "Purchases are finished as non-consumable/non-consumable-equivalent",
    ["finishTransaction({ purchase: purchaseResult, isConsumable: false })"]
  ),
  checkIncludesAll(
    files.subscriptions,
    "Restore resolves active subscriptions and Lifetime purchases from the store",
    [
      "await restorePurchases()",
      "getActiveSubscriptions(purchaseConfig.subscriptionIds)",
      "getAvailablePurchases({",
      "purchase.purchaseState === \"purchased\"",
      "purchaseConfig.lifetimeProductIds.includes(purchase.productId)"
    ]
  ),
  checkIncludesAll(
    files.upgrade,
    "Paywall exposes safe restore, terms, privacy, and store-sourced plan copy",
    [
      "Restore Purchases",
      "Terms of Use (EULA)",
      "Privacy Policy",
      "Prices, trials, and renewal periods shown on the paywall come from the store."
    ]
  ),
  checkIncludesAll(
    files.upgrade,
    "Lifetime CTA appears only from a returned product kind",
    ["if (!product) return \"Choose a Plan\"", "if (product.kind === \"lifetime\") return \"Buy Lifetime\""]
  ),
  check(
    files.upgrade.includes("product.hasFreeTrial ? <Badge label=\"Free trial available\"") &&
      files.subscriptions.includes("hasFreeTrial: product.type === \"subs\" ? productHasFreeTrial(product) : false"),
    "Free-trial copy depends on store product data",
    "Free-trial copy must not be hardcoded into metadata or shown without store product data."
  ),
  checkIncludesAll(
    files.settings,
    "Settings exposes restore and support/privacy surfaces",
    ["Restore Purchases", "Privacy Policy", "Support URL is required before final submission."]
  ),
  checkIncludesAll(
    files.lifetimeSetup,
    "Lifetime setup doc describes real non-consumable handling",
    [
      "non-consumable",
      expectedLifetimeId,
      "Do not grant lifetime entitlement locally",
      "Lifetime appears on the paywall only when the store returns the product"
    ]
  ),
  check(
    !/free trial|lifetime deal|guaranteed|never miss/i.test(recommendedMetadata),
    "Recommended App Store metadata avoids unverified trial/Lifetime/outcome claims",
    "Recommended metadata must not mention free trials, Lifetime deals, guaranteed outcomes, or never-miss claims."
  ),
  checkIncludesAll(
    files.handoff,
    "Submission handoff keeps StoreKit proof external",
    [
      "App Store Connect IAP product status and sandbox monthly/yearly/Lifetime/restore proof missing",
      "Products-loaded paywall screenshot is missing"
    ]
  ),
  warn(
    "StoreKit sandbox proof remains external",
    "This source audit cannot prove products-loaded paywall, sandbox monthly/yearly/Lifetime purchases, restore success, App Store Connect product status, or reviewer product attachment."
  )
];

const blockers = checks.filter((item) => item.status === "BLOCKER");
const warnings = checks.filter((item) => item.status === "WARN");
const audit = {
  generatedAt: new Date().toISOString(),
  sources: [
    "app.json",
    "src/services/purchaseConfig.ts",
    "src/services/subscriptions.tsx",
    "src/screens/UpgradeScreen.tsx",
    "src/screens/SettingsScreen.tsx",
    "docs/APP_STORE_METADATA.md",
    "docs/LIFETIME_IAP_SETUP.md",
    "docs/APP_STORE_SUBMISSION_HANDOFF.md"
  ],
  checks,
  blockerCount: blockers.length,
  warningCount: warnings.length,
  passed: blockers.length === 0
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
} else {
  const markdown = renderMarkdown(audit);
  if (writeDoc) {
    fs.writeFileSync(outputPath, markdown);
  }
  for (const item of checks) {
    console.log(`${item.status.padEnd(7)} ${item.label}${item.detail ? ` - ${item.detail}` : ""}`);
  }
  if (writeDoc) {
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}

if (!audit.passed) {
  process.exit(1);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readSection(markdown, heading, nextHeading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return "";
  const contentStart = markdown.indexOf("\n", start) + 1;
  const end = markdown.indexOf(`## ${nextHeading}`, contentStart);
  return markdown.slice(contentStart, end === -1 ? markdown.length : end);
}

function check(condition, label, detail) {
  return {
    status: condition ? "PASS" : "BLOCKER",
    label,
    detail: condition ? undefined : detail
  };
}

function warn(label, detail) {
  return { status: "WARN", label, detail };
}

function checkIncludesAll(source, label, snippets) {
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  return check(
    missing.length === 0,
    label,
    `Missing expected snippets: ${missing.join("; ") || "none"}`
  );
}

function renderMarkdown(audit) {
  return `# StoreKit IAP Handoff Audit

Generated: ${audit.generatedAt}

Sources:
${audit.sources.map((source) => `- \`${source}\``).join("\n")}

This audit verifies local StoreKit/IAP source and handoff readiness. It does **not** prove App Store Connect product attachment, products-loaded paywall screenshots, sandbox purchase success, restore success, subscription renewal state, or Lifetime product approval.

## Result

${audit.passed ? `PASS: no source-level StoreKit handoff blockers found. ${audit.warningCount} warning(s) remain.` : `BLOCKER: ${audit.blockerCount} StoreKit source blocker(s) found.`}

| Check | Status | Detail |
| --- | --- | --- |
${audit.checks.map((item) => `| ${escapeCell(item.label)} | ${item.status} | ${escapeCell(item.detail || "")} |`).join("\n")}

## Remaining External Proof

- Products-loaded paywall screenshot from real StoreKit products.
- Sandbox monthly purchase, yearly purchase, Lifetime purchase, and restore proof.
- App Store Connect product attachment/status for the submitted app version.
- Final App Review notes with exact product availability.
`;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
