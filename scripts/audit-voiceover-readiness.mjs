#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = path.join(root, "docs/VOICEOVER_READINESS_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !process.argv.includes("--no-write") && !jsonMode;
const touchableTags = new Set([
  "Pressable",
  "TouchableHighlight",
  "TouchableOpacity",
  "TouchableWithoutFeedback"
]);
const trackedFiles = getTrackedUiFiles();
const interactive = [];
const summarySurfaces = [];

for (const filePath of trackedFiles) {
  const absolutePath = path.join(root, filePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  visit(sourceFile, sourceFile);
}

const missingExplicitLabel = interactive.filter((item) => !item.hasExplicitLabel);
const missingRole = interactive.filter((item) => item.needsRole && !item.hasRole);
const missingHint = interactive.filter((item) => item.recommendsHint && !item.hasHint);
const summary = {
  generatedAt: new Date().toISOString(),
  filesScanned: trackedFiles.length,
  interactiveCount: interactive.length,
  appButtonCount: interactive.filter((item) => item.tagName === "AppButton").length,
  touchableCount: interactive.filter((item) => touchableTags.has(item.tagName)).length,
  textInputCount: interactive.filter((item) => item.tagName === "TextInput").length,
  explicitLabelCount: interactive.filter((item) => item.hasExplicitLabel).length,
  roleCount: interactive.filter((item) => item.hasRole).length,
  hintCount: interactive.filter((item) => item.hasHint).length,
  summarySurfaceCount: summarySurfaces.length,
  missingExplicitLabelCount: missingExplicitLabel.length,
  missingRoleCount: missingRole.length,
  missingHintCount: missingHint.length,
  missingExplicitLabel: missingExplicitLabel.slice(0, 80),
  missingRole: missingRole.slice(0, 80),
  missingHint: missingHint.slice(0, 80),
  topRiskFiles: summarizeByFile([...missingExplicitLabel, ...missingRole, ...missingHint]).slice(0, 12)
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  const markdown = renderMarkdown(summary);
  if (writeDoc) {
    fs.writeFileSync(outputPath, markdown);
  }
  console.log(
    `VoiceOver readiness audit: ${summary.interactiveCount} interactive elements across ${summary.filesScanned} UI files.`
  );
  console.log(
    `Needs review: ${summary.missingExplicitLabelCount} missing explicit labels, ${summary.missingRoleCount} missing roles, ${summary.missingHintCount} missing hints.`
  );
  if (writeDoc) {
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}

function visit(node, sourceFile) {
  const jsxElement = getJsxElement(node);
  if (jsxElement) {
    inspectJsxElement(jsxElement, sourceFile);
  }

  ts.forEachChild(node, (child) => visit(child, sourceFile));
}

function getJsxElement(node) {
  if (ts.isJsxSelfClosingElement(node)) return node;
  if (ts.isJsxOpeningElement(node)) return node;
  return undefined;
}

function inspectJsxElement(node, sourceFile) {
  const tagName = node.tagName.getText(sourceFile);
  const attrs = readAttributes(node, sourceFile);
  const isTouchable = touchableTags.has(tagName) && (attrs.has("onPress") || attrs.has("onLongPress"));
  const isTextInput = tagName === "TextInput";
  const isAppButton = tagName === "AppButton";
  const isInteractive = isTouchable || isTextInput || isAppButton;
  const hasSummaryRole = attrs.get("accessibilityRole")?.includes("summary");

  if (hasSummaryRole) {
    summarySurfaces.push(makeItem(sourceFile, node, tagName, attrs));
  }

  if (!isInteractive) return;

  const item = makeItem(sourceFile, node, tagName, attrs);
  const visibleText = cleanText(readVisibleText(node.parent, sourceFile));
  item.visibleText = visibleText;
  item.hasExplicitLabel =
    attrs.has("accessibilityLabel") ||
    (isAppButton && attrs.has("label")) ||
    (isTextInput && (attrs.has("accessibilityLabel") || attrs.has("placeholder")));
  item.hasRole = attrs.has("accessibilityRole") || isAppButton || isTextInput;
  item.hasHint = attrs.has("accessibilityHint");
  item.needsRole = isTouchable;
  item.recommendsHint =
    attrs.has("onLongPress") ||
    visibleText.toLowerCase().includes("restore") ||
    visibleText.toLowerCase().includes("purchase") ||
    visibleText.toLowerCase().includes("sync") ||
    visibleText.toLowerCase().includes("calendar") ||
    visibleText.toLowerCase().includes("plus") ||
    tagName === "TextInput";
  interactive.push(item);
}

function makeItem(sourceFile, node, tagName, attrs) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: sourceFile.fileName,
    line: position.line + 1,
    tagName,
    hasExplicitLabel: false,
    hasRole: attrs.has("accessibilityRole"),
    hasHint: attrs.has("accessibilityHint"),
    needsRole: false,
    recommendsHint: false,
    visibleText: ""
  };
}

function readAttributes(node, sourceFile) {
  const attrs = new Map();
  for (const property of node.attributes.properties) {
    if (!ts.isJsxAttribute(property)) continue;
    const name = property.name.getText(sourceFile);
    attrs.set(name, property.initializer ? property.initializer.getText(sourceFile) : "true");
  }
  return attrs;
}

function readVisibleText(node, sourceFile) {
  if (!node || !("children" in node)) return "";
  return node.children
    .map((child) => {
      if (ts.isJsxText(child)) return child.getText(sourceFile);
      if (ts.isJsxExpression(child)) return "";
      if (ts.isJsxElement(child)) return readVisibleText(child, sourceFile);
      if (ts.isJsxSelfClosingElement(child)) return "";
      return "";
    })
    .join(" ");
}

function getTrackedUiFiles() {
  const output = execFileSync("git", ["ls-files", "src/components", "src/screens"], {
    cwd: root,
    encoding: "utf8"
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".tsx"))
    .sort();
}

function summarizeByFile(items) {
  const byFile = new Map();
  for (const item of items) {
    const current = byFile.get(item.file) || {
      file: item.file,
      missingLabel: 0,
      missingRole: 0,
      missingHint: 0
    };
    if (!item.hasExplicitLabel) current.missingLabel += 1;
    if (item.needsRole && !item.hasRole) current.missingRole += 1;
    if (item.recommendsHint && !item.hasHint) current.missingHint += 1;
    byFile.set(item.file, current);
  }

  return Array.from(byFile.values()).sort(
    (a, b) =>
      b.missingLabel + b.missingRole + b.missingHint -
      (a.missingLabel + a.missingRole + a.missingHint)
  );
}

function renderMarkdown(data) {
  const sourceVerdict =
    data.missingExplicitLabelCount === 0 && data.missingRoleCount === 0 && data.missingHintCount === 0
      ? "VoiceOver source readiness is **strong** for the scanned controls: this audit found no missing explicit labels, roles, or recommended hints. Full submission readiness still requires a real VoiceOver traversal recorded in `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`."
      : "VoiceOver readiness is **partial**. Core shared controls have strong label and role coverage, but this audit still found controls that need recommended hint review before a final submission claim. Full submission readiness still requires a real VoiceOver traversal recorded in `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`.";

  return `# VoiceOver Readiness Audit

Generated: ${data.generatedAt}

## Summary

This source audit scans tracked UI files in \`src/components\` and \`src/screens\` for interactive React Native elements. It is not a replacement for a real VoiceOver traversal. It exists to make the manual traversal sharper by identifying controls likely to need explicit labels, roles, or hints.

| Metric | Count |
| --- | ---: |
| UI files scanned | ${data.filesScanned} |
| Interactive elements found | ${data.interactiveCount} |
| AppButton elements | ${data.appButtonCount} |
| Touchable elements | ${data.touchableCount} |
| TextInput elements | ${data.textInputCount} |
| Elements with explicit labels | ${data.explicitLabelCount} |
| Elements with accessibility roles | ${data.roleCount} |
| Elements with accessibility hints | ${data.hintCount} |
| Summary surfaces | ${data.summarySurfaceCount} |
| Missing explicit labels | ${data.missingExplicitLabelCount} |
| Missing roles | ${data.missingRoleCount} |
| Missing recommended hints | ${data.missingHintCount} |

## Readiness Verdict

${sourceVerdict}

## Highest-Risk Files

| File | Missing labels | Missing roles | Missing hints |
| --- | ---: | ---: | ---: |
${renderRiskRows(data.topRiskFiles)}

## Missing Explicit Labels: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
${renderItemRows(data.missingExplicitLabel.slice(0, 30))}

## Missing Recommended Hints: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
${renderItemRows(data.missingHint.slice(0, 30))}

## Manual Traversal Route

1. Today: hero next-due card, Complete/Start actions, Busy Week, Check New Work, Reminders.
2. Check New Work: scan/upload/manual actions, filter chips, edit first item, mark shown items, duplicate state.
3. Assignment Detail: title, date, time, course, priority/type/status chips, save/complete/delete.
4. Calendar and Week Plan: month navigation, day cells, filtered class, week workload bars.
5. Classes: add work, add class, edit class fields, color picker, class detail.
6. Widget Setup: size, focus, style, theme, preview, Plus plans path.
7. Settings and Paywall: restore, support/privacy links, product-load failure, plan selection if StoreKit loads.

## QA Requirements Before Final Claim

- Fix or intentionally accept each high-risk source finding.
- Run this audit again and record the remaining counts.
- Run real VoiceOver traversal on simulator/device.
- Record traversal proof in \`artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md\`.
`;
}

function renderRiskRows(rows) {
  if (rows.length === 0) return "| None | 0 | 0 | 0 |";
  return rows
    .map((row) => `| ${row.file} | ${row.missingLabel} | ${row.missingRole} | ${row.missingHint} |`)
    .join("\n");
}

function renderItemRows(rows) {
  if (rows.length === 0) return "| None | - | - |";
  return rows
    .map((item) => `| ${item.file}:${item.line} | ${item.tagName} | ${escapeCell(item.visibleText || "-")} |`)
    .join("\n");
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function escapeCell(value) {
  return value.replace(/\|/g, "\\|");
}
