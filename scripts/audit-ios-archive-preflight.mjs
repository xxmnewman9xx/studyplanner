#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const appEntitlementsPath = path.join(root, "ios/StudyPlannerSyllabusAI/StudyPlannerSyllabusAI.entitlements");
const widgetEntitlementsPath = path.join(root, "ios/StudyPlannerWidgetExtension/StudyPlannerWidgetExtension.entitlements");
const appInfoPath = path.join(root, "ios/StudyPlannerSyllabusAI/Info.plist");
const widgetInfoPath = path.join(root, "ios/StudyPlannerWidgetExtension/StudyPlannerWidgetExtension-Info.plist");
const privacyManifestPath = path.join(root, "ios/StudyPlannerSyllabusAI/PrivacyInfo.xcprivacy");
const projectPath = path.join(root, "ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj");
const outputPath = path.join(root, "docs/IOS_ARCHIVE_PREFLIGHT_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !jsonMode && !process.argv.includes("--no-write");

const appEntitlements = fs.readFileSync(appEntitlementsPath, "utf8");
const widgetEntitlements = fs.readFileSync(widgetEntitlementsPath, "utf8");
const appInfo = fs.readFileSync(appInfoPath, "utf8");
const widgetInfo = fs.readFileSync(widgetInfoPath, "utf8");
const project = fs.readFileSync(projectPath, "utf8");
const expectedAppGroup = "group.com.mattnewman.studyplanner";
const expectedAppBundleId = "com.mattnewman.studyplanner";
const expectedWidgetBundleId = "com.mattnewman.studyplanner.widget";

const checks = [
  checkIncludes(project, "App target entitlements are wired", "CODE_SIGN_ENTITLEMENTS = StudyPlannerSyllabusAI/StudyPlannerSyllabusAI.entitlements"),
  checkIncludes(project, "Widget target entitlements are wired", "CODE_SIGN_ENTITLEMENTS = StudyPlannerWidgetExtension/StudyPlannerWidgetExtension.entitlements"),
  checkIncludes(project, "App bundle ID is configured", `PRODUCT_BUNDLE_IDENTIFIER = ${expectedAppBundleId}`),
  checkIncludes(project, "Widget bundle ID is configured", `PRODUCT_BUNDLE_IDENTIFIER = ${expectedWidgetBundleId}`),
  checkArrayContains(appEntitlements, "App App Group entitlement", "com.apple.security.application-groups", expectedAppGroup),
  checkArrayContains(widgetEntitlements, "Widget App Group entitlement", "com.apple.security.application-groups", expectedAppGroup),
  checkValue(appEntitlements, "APNs entitlement exists in app source", "aps-environment", ["development", "production"]),
  warnUnless(
    valueForKey(appEntitlements, "aps-environment") === "production",
    "APNs source entitlement is production",
    `Current source value is ${valueForKey(appEntitlements, "aps-environment") || "missing"}; final App Store archive must prove signed production entitlement.`
  ),
  checkIncludes(widgetInfo, "Widget extension point is WidgetKit", "com.apple.widgetkit-extension"),
  checkIncludes(appInfo, "Notification usage description exists", "NSUserNotificationsUsageDescription"),
  checkIncludes(appInfo, "Calendar usage description exists", "NSCalendarsFullAccessUsageDescription"),
  checkIncludes(appInfo, "Reminders usage description exists", "NSRemindersFullAccessUsageDescription"),
  checkIncludes(appInfo, "Transport security blocks arbitrary loads", "<false/>"),
  check(fs.existsSync(privacyManifestPath), "Privacy manifest exists", `Missing ${path.relative(root, privacyManifestPath)}`),
  checkIncludes(project, "Privacy manifest is included in project", "PrivacyInfo.xcprivacy"),
  checkIncludes(project, "Widget extension is embedded in app target", "StudyPlannerWidgetExtension.appex in Copy Files")
];

const blockers = checks.filter((item) => item.status === "BLOCKER");
const warnings = checks.filter((item) => item.status === "WARN");
const audit = {
  generatedAt: new Date().toISOString(),
  sources: [
    path.relative(root, appEntitlementsPath),
    path.relative(root, widgetEntitlementsPath),
    path.relative(root, appInfoPath),
    path.relative(root, widgetInfoPath),
    path.relative(root, privacyManifestPath),
    path.relative(root, projectPath)
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

function check(condition, label, detail) {
  return {
    status: condition ? "PASS" : "BLOCKER",
    label,
    detail: condition ? undefined : detail
  };
}

function warnUnless(condition, label, detail) {
  return {
    status: condition ? "PASS" : "WARN",
    label,
    detail: condition ? undefined : detail
  };
}

function checkIncludes(source, label, snippet) {
  return check(source.includes(snippet), label, `Missing expected project/plist snippet: ${snippet}`);
}

function checkArrayContains(source, label, key, expectedValue) {
  const values = arrayForKey(source, key);
  return check(
    values.includes(expectedValue),
    label,
    `Expected ${key} to contain ${expectedValue}; found ${values.join(", ") || "none"}.`
  );
}

function checkValue(source, label, key, allowedValues) {
  const value = valueForKey(source, key);
  return check(
    allowedValues.includes(value),
    label,
    `Expected ${key} to be one of ${allowedValues.join(", ")}; found ${value || "missing"}.`
  );
}

function valueForKey(plistSource, key) {
  const escaped = escapeRegex(key);
  const match = plistSource.match(new RegExp(`<key>${escaped}</key>\\s*<string>([^<]+)</string>`));
  return match?.[1]?.trim() || "";
}

function arrayForKey(plistSource, key) {
  const escaped = escapeRegex(key);
  const match = plistSource.match(new RegExp(`<key>${escaped}</key>\\s*<array>([\\s\\S]*?)</array>`));
  if (!match) return [];
  return [...match[1].matchAll(/<string>([^<]+)<\/string>/g)].map((item) => item[1].trim());
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderMarkdown(audit) {
  return `# iOS Archive Preflight Audit

Generated: ${audit.generatedAt}

Sources:
${audit.sources.map((source) => `- \`${source}\``).join("\n")}

This audit checks native iOS project wiring that can be validated before App Store signing. It does **not** prove a signed App Store archive, production provisioning profile, App Store Connect processing, push-notification entitlement in the final archive, or WidgetKit behavior on device.

## Result

${audit.passed ? `PASS: no source-level iOS archive blockers found. ${audit.warningCount} warning(s) remain.` : `BLOCKER: ${audit.blockerCount} source-level iOS archive blocker(s) found.`}

| Check | Status | Detail |
| --- | --- | --- |
${audit.checks.map((item) => `| ${escapeCell(item.label)} | ${item.status} | ${escapeCell(item.detail || "")} |`).join("\n")}

## Remaining External Proof

- A signed App Store archive must still be produced and inspected for production entitlements.
- The \`aps-environment\` entitlement must be verified from the signed archive, not inferred from source.
- App Store Connect must still process the build and widgets.
- StoreKit products and restore behavior still need sandbox/App Store Connect proof.
`;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
