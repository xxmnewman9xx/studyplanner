#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const planPath = path.join(root, "docs/ASO_LOCALIZATION_MASTER_PLAN.md");
const metadataPath = path.join(root, "docs/ASO_LOCALIZED_METADATA_PACKS.md");
const captionsPath = path.join(root, "docs/ASO_SCREENSHOT_CAPTION_PACKS.md");
const appStoreMetadataPath = path.join(root, "docs/APP_STORE_METADATA.md");
const outputPath = path.join(root, "docs/ASO_LOCALIZATION_AUDIT.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !jsonMode && !process.argv.includes("--no-write");

const tier1Locales = [
  "en-US",
  "en-GB",
  "es-US",
  "es-ES",
  "fr-FR",
  "de-DE",
  "pt-BR",
  "ja-JP",
  "ko-KR",
  "zh-Hans"
];
const tier2Locales = [
  "it-IT",
  "nl-NL",
  "sv-SE",
  "da-DK",
  "fi-FI",
  "nb-NO",
  "pl-PL",
  "tr-TR",
  "ar-SA",
  "zh-Hant"
];
const requiredLocales = [...tier1Locales, ...tier2Locales];
const placeholderTerms = [
  "localized equivalent",
  "tbd",
  "todo",
  "placeholder",
  "lorem ipsum",
  "replace before submit"
];

const planSource = fs.readFileSync(planPath, "utf8");
const metadataSource = fs.readFileSync(metadataPath, "utf8");
const captionsSource = fs.readFileSync(captionsPath, "utf8");
const appStoreMetadataSource = fs.readFileSync(appStoreMetadataPath, "utf8");

const metadataRows = readTableRows(metadataSource, "Draft Locale Matrix");
const captionRows = readTableRows(captionsSource, "Localized Caption QA Queue");
const claimsToAvoid = readListSection(appStoreMetadataSource, "Claims To Avoid", "Screenshot Narrative");

const checks = [
  localesPresent("Localization master plan", planSource, requiredLocales),
  localeRowsPresent("Localized metadata table", metadataRows, requiredLocales),
  localeRowsPresent("Localized caption QA queue", captionRows, requiredLocales),
  noPlaceholderText("Localized metadata packs", metadataSource),
  noPlaceholderText("Localized caption packs", captionsSource),
  fieldLengthCheck(metadataRows, "Localized app name", 30),
  fieldLengthCheck(metadataRows, "Localized subtitle", 30),
  keywordThemesCheck(metadataRows),
  reviewCaveatCheck(metadataRows),
  captionReviewCaveatCheck(captionRows),
  unsafeClaimCheck(metadataRows, captionRows, claimsToAvoid)
];

const audit = {
  generatedAt: new Date().toISOString(),
  sources: [
    path.relative(root, planPath),
    path.relative(root, metadataPath),
    path.relative(root, captionsPath),
    path.relative(root, appStoreMetadataPath)
  ],
  localeCount: requiredLocales.length,
  metadataRowCount: metadataRows.length,
  captionRowCount: captionRows.length,
  checks,
  passed: checks.every((check) => check.status === "PASS")
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`);
} else {
  const markdown = renderMarkdown(audit);
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

function readTableRows(markdown, heading) {
  const section = readSection(markdown, heading);
  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !line.includes("---"));
  if (lines.length < 2) return [];

  const headers = splitRow(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitRow(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] || "";
    });
    return row;
  });
}

function readSection(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return "";
  const contentStart = markdown.indexOf("\n", start) + 1;
  const next = markdown.indexOf("\n## ", contentStart);
  return markdown.slice(contentStart, next === -1 ? markdown.length : next);
}

function readListSection(markdown, heading, nextHeading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start === -1) return [];
  const contentStart = markdown.indexOf("\n", start) + 1;
  const end = markdown.indexOf(`## ${nextHeading}`, contentStart);
  return markdown
    .slice(contentStart, end === -1 ? markdown.length : end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => stripMarkdown(line.slice(2).trim()))
    .filter(Boolean);
}

function splitRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => stripMarkdown(cell.trim()));
}

function stripMarkdown(value) {
  return value
    .replace(/^`|`$/g, "")
    .replace(/\\\|/g, "|")
    .replace(/<br>/g, " ")
    .trim();
}

function localesPresent(label, source, locales) {
  const missing = locales.filter((locale) => !source.includes(locale));
  return {
    label,
    status: missing.length === 0 ? "PASS" : "BLOCKER",
    detail: missing.length === 0 ? `${locales.length} required locales listed` : `Missing: ${missing.join(", ")}`
  };
}

function localeRowsPresent(label, rows, locales) {
  const seen = new Set(rows.map((row) => row.Locale).filter(Boolean));
  const missing = locales.filter((locale) => !seen.has(locale));
  const extras = [...seen].filter((locale) => !locales.includes(locale));
  const duplicates = rows
    .map((row) => row.Locale)
    .filter((locale, index, all) => locale && all.indexOf(locale) !== index);
  const passed = rows.length === locales.length && missing.length === 0 && extras.length === 0 && duplicates.length === 0;
  return {
    label,
    status: passed ? "PASS" : "BLOCKER",
    detail: passed
      ? `${rows.length}/${locales.length} locale rows`
      : `Rows=${rows.length}; missing=${missing.join(", ") || "none"}; extras=${extras.join(", ") || "none"}; duplicates=${[...new Set(duplicates)].join(", ") || "none"}`
  };
}

function noPlaceholderText(label, source) {
  const lower = source.toLowerCase();
  const found = placeholderTerms.filter((term) => lower.includes(term));
  return {
    label,
    status: found.length === 0 ? "PASS" : "BLOCKER",
    detail: found.length === 0 ? "No placeholder terms found" : `Found: ${found.join(", ")}`
  };
}

function fieldLengthCheck(rows, field, max) {
  const badRows = rows
    .map((row) => ({
      locale: row.Locale,
      value: row[field] || "",
      count: Array.from(row[field] || "").length
    }))
    .filter((row) => row.value.trim().length === 0 || row.count > max);
  return {
    label: `${field} length <= ${max}`,
    status: badRows.length === 0 ? "PASS" : "BLOCKER",
    detail:
      badRows.length === 0
        ? `${rows.length} rows within limit`
        : badRows.map((row) => `${row.locale || "unknown"} ${row.count}/${max}`).join(", ")
  };
}

function keywordThemesCheck(rows) {
  const badRows = rows.filter((row) => {
    const themes = (row["Keyword themes"] || "")
      .split(";")
      .map((theme) => theme.trim())
      .filter(Boolean);
    return themes.length < 4 || themes.some((theme) => theme.length < 2);
  });
  return {
    label: "Keyword themes are structured",
    status: badRows.length === 0 ? "PASS" : "BLOCKER",
    detail:
      badRows.length === 0
        ? `${rows.length} rows have at least four keyword themes`
        : `Weak rows: ${badRows.map((row) => row.Locale || "unknown").join(", ")}`
  };
}

function reviewCaveatCheck(rows) {
  const badRows = rows.filter((row) => {
    const review = (row["Review notes"] || "").toLowerCase();
    const hasNativeReview = review.includes("native-speaker");
    const hasFitReview =
      review.includes("text-fit") ||
      review.includes("cjk") ||
      review.includes("rtl") ||
      review.includes("arabic typography");
    return !hasNativeReview || !hasFitReview;
  });
  return {
    label: "Metadata rows keep native-review and text-fit caveats",
    status: badRows.length === 0 ? "PASS" : "BLOCKER",
    detail:
      badRows.length === 0
        ? `${rows.length} rows include review caveats`
        : `Missing caveats: ${badRows.map((row) => row.Locale || "unknown").join(", ")}`
  };
}

function captionReviewCaveatCheck(rows) {
  const badRows = rows.filter((row) => {
    const requirement = (row["Review requirement"] || "").toLowerCase();
    return !requirement.includes("native-speaker") && !row.Locale?.startsWith("en-");
  });
  const textFitRows = rows.filter((row) => {
    const combined = `${row["Review requirement"] || ""} ${row["Text-fit risk"] || ""}`.toLowerCase();
    return !combined.includes("text-fit") && !combined.includes("line-break") && !combined.includes("rtl") && !combined.includes("typography") && !row.Locale?.startsWith("en-");
  });
  const bad = [...new Set([...badRows, ...textFitRows].map((row) => row.Locale || "unknown"))];
  return {
    label: "Caption queue keeps native-review and layout caveats",
    status: bad.length === 0 ? "PASS" : "BLOCKER",
    detail: bad.length === 0 ? `${rows.length} caption rows reviewed` : `Missing caveats: ${bad.join(", ")}`
  };
}

function unsafeClaimCheck(metadataRows, captionRows, blockedClaims) {
  const userFacingText = [
    ...metadataRows.map((row) => `${row["Localized app name"]} ${row["Localized subtitle"]} ${row["Keyword themes"]}`),
    ...captionRows.map((row) => `${row["Caption status"] || ""}`)
  ]
    .join("\n")
    .toLowerCase();
  const found = blockedClaims.filter((claim) => userFacingText.includes(claim.toLowerCase()));
  return {
    label: "Unsafe App Store claims absent from localized user-facing drafts",
    status: found.length === 0 ? "PASS" : "BLOCKER",
    detail: found.length === 0 ? "No avoided claims found" : `Found: ${found.join(", ")}`
  };
}

function renderMarkdown(audit) {
  return `# ASO Localization Audit

Generated: ${audit.generatedAt}

Sources:
${audit.sources.map((source) => `- \`${source}\``).join("\n")}

This audit checks that the localized ASO drafts are structurally complete, conservative, and free of placeholder copy. It does **not** prove native-speaker approval, localized UI implementation, App Store Connect acceptance, or screenshot text-fit success.

## Result

${audit.passed ? "PASS: localized ASO drafts are structurally ready for native review." : "BLOCKER: localized ASO drafts need cleanup before review."}

| Check | Status | Detail |
| --- | --- | --- |
${audit.checks.map((check) => `| ${escapeCell(check.label)} | ${check.status} | ${escapeCell(check.detail)} |`).join("\n")}

## Remaining Localization Gaps

- Native-speaker keyword review is still required before uploading non-English metadata.
- Screenshot captions still need target-language text-fit checks.
- The app UI is still primarily English; localized metadata does not equal localized product readiness.
- App Store Connect acceptance, search performance, and product-page conversion are still external proof gaps.
`;
}

function escapeCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
