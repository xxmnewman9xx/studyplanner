#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const metadataPath = path.join(root, "docs/APP_STORE_METADATA.md");
const outputPath = path.join(root, "docs/ASO_COPY_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !jsonMode && !process.argv.includes("--no-write");

const source = fs.readFileSync(metadataPath, "utf8");
const metadata = readMetadata(source);
const description = readSection(source, "Description Draft", "Safe Claim Bank").trim();
const safeClaims = readListSection(source, "Safe Claim Bank", "Claims To Avoid");
const claimsToAvoid = readListSection(source, "Claims To Avoid", "Screenshot Narrative");

const surfaces = {
  appName: metadata["App name"],
  fallbackName: metadata["Safer fallback name"],
  subtitle: metadata.Subtitle,
  keywords: metadata.Keywords,
  promotionalText: metadata["Promotional text"],
  whatsNew: metadata["What's New"],
  description
};

const checks = [
  limit("App name", surfaces.appName, 30, "characters"),
  limit("Safer fallback name", surfaces.fallbackName, 30, "characters"),
  limit("Subtitle", surfaces.subtitle, 30, "characters"),
  limit("Promotional text", surfaces.promotionalText, 170, "characters"),
  limit("Description", surfaces.description, 4000, "characters"),
  keywordLimit(surfaces.keywords),
  safeClaimCheck(surfaces, claimsToAvoid)
];

const audit = {
  generatedAt: new Date().toISOString(),
  source: path.relative(root, metadataPath),
  checks,
  safeClaims,
  claimsToAvoid,
  passed: checks.every((check) => check.status === "PASS")
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
} else {
  const markdown = renderMarkdown(audit, surfaces);
  if (writeDoc) {
    fs.writeFileSync(outputPath, markdown);
  }
  for (const check of checks) {
    console.log(`${check.status.padEnd(7)} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
  }
  if (writeDoc) {
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}

if (!audit.passed) {
  process.exit(1);
}

function readMetadata(markdown) {
  const table = readSection(markdown, "Recommended Primary Metadata", "Description Draft");
  const rows = table
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Field |"));
  const result = {};
  for (const row of rows) {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => stripMarkdown(cell.trim()));
    if (cells.length >= 2) {
      result[cells[0]] = cells[1];
    }
  }
  return result;
}

function readSection(markdown, heading, nextHeading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return "";
  const contentStart = markdown.indexOf("\n", start) + 1;
  const end = markdown.indexOf(`## ${nextHeading}`, contentStart);
  return markdown.slice(contentStart, end === -1 ? markdown.length : end);
}

function readListSection(markdown, heading, nextHeading) {
  return readSection(markdown, heading, nextHeading)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => stripMarkdown(line.slice(2).trim()))
    .filter(Boolean);
}

function stripMarkdown(value) {
  return value.replace(/^`|`$/g, "").replace(/\\\|/g, "|").trim();
}

function limit(label, value, max, unit) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      label,
      status: "BLOCKER",
      detail: "Missing value"
    };
  }
  const count = value.length;
  return {
    label,
    status: count <= max ? "PASS" : "BLOCKER",
    detail: `${count}/${max} ${unit}`
  };
}

function keywordLimit(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      label: "Keywords",
      status: "BLOCKER",
      detail: "Missing value"
    };
  }
  const bytes = Buffer.byteLength(value, "utf8");
  const hasEmptyToken = value.split(",").some((token) => token.trim().length === 0);
  return {
    label: "Keywords",
    status: bytes <= 100 && !hasEmptyToken ? "PASS" : "BLOCKER",
    detail: `${bytes}/100 bytes${hasEmptyToken ? "; contains empty keyword" : ""}`
  };
}

function safeClaimCheck(values, blockedClaims) {
  const scanned = Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")
    .toLowerCase();
  const found = blockedClaims.filter((claim) => scanned.includes(claim.toLowerCase()));
  return {
    label: "Unsafe claims absent from recommended metadata",
    status: found.length === 0 ? "PASS" : "BLOCKER",
    detail: found.length === 0 ? "No avoided claims found" : `Found: ${found.join(", ")}`
  };
}

function renderMarkdown(audit, values) {
  return `# ASO Copy Audit

Generated: ${audit.generatedAt}

Source: \`${audit.source}\`

This audit checks the English App Store metadata draft against current Apple field limits already researched in \`docs/APPLE_ASO_AND_SUBMISSION_RESEARCH.md\`. It is not native-speaker localization review and does not prove App Store Connect acceptance.

## Result

${audit.passed ? "PASS: English metadata is length-safe and claim-safe." : "BLOCKER: Fix metadata before submission."}

| Check | Status | Detail |
| --- | --- | --- |
${audit.checks.map((check) => `| ${check.label} | ${check.status} | ${escapeCell(check.detail)} |`).join("\n")}

## Recommended English Metadata

| Field | Value |
| --- | --- |
| App name | ${escapeCell(values.appName)} |
| Safer fallback name | ${escapeCell(values.fallbackName)} |
| Subtitle | ${escapeCell(values.subtitle)} |
| Keywords | ${escapeCell(values.keywords)} |
| Promotional text | ${escapeCell(values.promotionalText)} |
| What's New | ${escapeCell(values.whatsNew)} |

## Remaining ASO Gaps

- Localized metadata packs still require native-speaker review.
- Localized screenshots still require text-fit checks.
- App Store Connect keyword acceptance and search performance are unproven until upload/testing.
- Support URL remains a submission blocker outside this metadata copy audit.
`;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
