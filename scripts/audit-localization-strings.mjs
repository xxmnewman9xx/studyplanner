#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath = path.join(root, "docs/LOCALIZATION_STRING_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !process.argv.includes("--no-write") && !jsonMode;
const trackedFiles = getTrackedSourceFiles();
const candidates = [];
const jsxTextCandidates = [];
const propCandidates = [];
const ignoredKinds = new Set([
  "ImportDeclaration",
  "ExportDeclaration",
  "LiteralType",
  "TypeReference",
  "ModuleDeclaration"
]);
const technicalValues = new Set([
  "absolute",
  "android",
  "auto",
  "blue",
  "bottom",
  "button",
  "center",
  "checking",
  "column",
  "dark",
  "done",
  "error",
  "flex-end",
  "flex-start",
  "green",
  "header",
  "hidden",
  "idle",
  "ios",
  "landscape",
  "left",
  "light",
  "link",
  "loading",
  "none",
  "portrait",
  "purple",
  "ready",
  "red",
  "restoring",
  "right",
  "row",
  "space-between",
  "success",
  "summary",
  "unavailable",
  "web",
  "wrap"
]);
const localizablePropNames = new Set([
  "accessibilityHint",
  "accessibilityLabel",
  "copy",
  "description",
  "emptyMessage",
  "eyebrow",
  "fallback",
  "helper",
  "label",
  "message",
  "placeholder",
  "subtitle",
  "text",
  "title"
]);

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

const byFile = groupBy(candidates, (candidate) => candidate.file);
const highRiskFiles = Array.from(byFile.entries())
  .map(([file, items]) => ({ file, count: items.length, examples: items.slice(0, 5).map((item) => item.text) }))
  .sort((a, b) => b.count - a.count);
const summary = {
  generatedAt: new Date().toISOString(),
  filesScanned: trackedFiles.length,
  candidateCount: candidates.length,
  jsxTextCount: jsxTextCandidates.length,
  propCandidateCount: propCandidates.length,
  highRiskFiles: highRiskFiles.slice(0, 15),
  sampleCandidates: candidates.slice(0, 60)
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  const markdown = renderMarkdown(summary);
  if (writeDoc) {
    fs.writeFileSync(outputPath, markdown);
  }
  console.log(
    `Localization string audit: ${summary.candidateCount} candidates across ${summary.filesScanned} tracked source files.`
  );
  if (writeDoc) {
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}

function visit(node, sourceFile) {
  if (ts.isJsxText(node)) {
    const text = cleanText(node.getText(sourceFile));
    if (isLocalizableText(text)) {
      const candidate = makeCandidate(sourceFile, node, text, "jsx-text");
      candidates.push(candidate);
      jsxTextCandidates.push(candidate);
    }
  } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const text = cleanText(node.text);
    if (isLocalizableText(text) && !isIgnoredStringNode(node)) {
      const kind = localizablePropName(node) ? "localized-prop" : "string-literal";
      const candidate = makeCandidate(sourceFile, node, text, kind);
      candidates.push(candidate);
      if (kind === "localized-prop") {
        propCandidates.push(candidate);
      }
    }
  }

  ts.forEachChild(node, (child) => visit(child, sourceFile));
}

function makeCandidate(sourceFile, node, text, kind) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: sourceFile.fileName,
    line: position.line + 1,
    kind,
    text
  };
}

function isIgnoredStringNode(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ignoredKinds.has(ts.SyntaxKind[parent.kind])) {
      return true;
    }
  }

  if (ts.isPropertyAccessExpression(node.parent)) return true;
  if (ts.isElementAccessExpression(node.parent)) return true;
  if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return true;
  if (ts.isJsxAttribute(node.parent)) {
    const propName = node.parent.name.getText();
    return !localizablePropNames.has(propName);
  }

  return false;
}

function localizablePropName(node) {
  if (ts.isJsxAttribute(node.parent)) {
    const propName = node.parent.name.getText();
    return localizablePropNames.has(propName) ? propName : undefined;
  }

  if (ts.isPropertyAssignment(node.parent) && ts.isIdentifier(node.parent.name)) {
    const propName = node.parent.name.text;
    return localizablePropNames.has(propName) ? propName : undefined;
  }

  return undefined;
}

function isLocalizableText(text) {
  if (!text) return false;
  if (text.length < 2 || text.length > 180) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^https?:\/\//.test(text)) return false;
  if (/^rgba?\(/i.test(text)) return false;
  if (/^[A-Z0-9_]+$/.test(text)) return false;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(text)) return false;
  if (/^[a-z][A-Za-z0-9_]*$/.test(text) && !["today"].includes(text)) return false;
  if (/^[a-z0-9_.:/-]+$/.test(text) && !/\s/.test(text) && !["Today", "Calendar", "Week", "Classes", "Widgets"].includes(text)) {
    return false;
  }
  if (technicalValues.has(text.toLowerCase())) return false;
  return true;
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getTrackedSourceFiles() {
  const output = execFileSync("git", ["ls-files", "src"], {
    cwd: root,
    encoding: "utf8"
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\.(ts|tsx)$/.test(line))
    .filter((line) => !line.endsWith(".d.ts"))
    .sort();
}

function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyFn(item);
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }
  return grouped;
}

function renderMarkdown(data) {
  const highRiskRows = data.highRiskFiles
    .map((entry) => `| ${entry.file} | ${entry.count} | ${entry.examples.map(escapeCell).join("<br>")} |`)
    .join("\n");
  const sampleRows = data.sampleCandidates
    .map((entry) => `| ${entry.file}:${entry.line} | ${entry.kind} | ${escapeCell(entry.text)} |`)
    .join("\n");

  return `# Localization String Audit

Generated: ${data.generatedAt}

## Summary

This audit scans tracked TypeScript/TSX files under \`src/\` with the TypeScript compiler API and reports likely user-facing English strings. It is an inventory for localization planning, not a translator and not a native-speaker review.

| Metric | Count |
| --- | ---: |
| Tracked source files scanned | ${data.filesScanned} |
| Likely localizable string candidates | ${data.candidateCount} |
| JSX text candidates | ${data.jsxTextCount} |
| Localizable prop candidates | ${data.propCandidateCount} |

## Readiness Verdict

Localized UI submission remains **not ready**. Date formatting and week-start behavior have targeted tests, but the app still contains broad English UI copy across core screens, settings, widgets, paywall, onboarding, import/review, and demo data. English-only submission remains the honest path unless translated UI, native-speaker review, and localized screenshot text-fit proof are completed.

## Highest-Risk Files

| File | Candidates | Examples |
| --- | ---: | --- |
${highRiskRows}

## Sample Candidate Strings

| Location | Kind | Text |
| --- | --- | --- |
${sampleRows}

## Recommended Localization Order

1. App shell and bottom navigation: Today, Calendar, Week, Classes, Check Work, Widgets.
2. Onboarding promise and first-action path.
3. Add School Stuff / Check New Work trust-boundary copy.
4. Today, Week Plan, Calendar, Classes, Assignment Detail.
5. Widget Setup and native widget strings.
6. Paywall, Settings, support/privacy, and App Review-facing copy.
7. Demo/capture seed data and screenshot captions.

## QA Requirements Before Localized Submission

- Replace hardcoded UI strings with a localization resource layer.
- Run this audit and record the remaining candidate count.
- Capture localized screenshots and check text fit for each submitted locale.
- Complete native-speaker review for localized metadata, screenshot captions, and in-app copy.
- Record proof in \`artifacts/post-goal-aso-submission/external-proof/localized-ui-native-review.md\`.
`;
}

function escapeCell(value) {
  return value.replace(/\|/g, "\\|");
}
