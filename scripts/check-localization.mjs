import { readFileSync } from "node:fs";
import * as ts from "typescript";

const appSource = readFileSync("App.tsx", "utf8");
const failures = [];

function expect(pass, message) {
  if (!pass) failures.push(message);
}

function unwrapExpression(expression) {
  let current = expression;
  while (ts.isSatisfiesExpression(current) || ts.isAsExpression(current) || ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  return current;
}

function objectLiteralForConst(sourceFile, name) {
  let result;
  const visit = (node) => {
    if (result) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) {
      const initializer = unwrapExpression(node.initializer);
      if (ts.isObjectLiteralExpression(initializer)) result = initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}

function propertyName(property) {
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)) return property.name.text;
  return undefined;
}

function literalObject(node) {
  const value = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = propertyName(property);
    const initializer = unwrapExpression(property.initializer);
    if (!name) continue;
    if (ts.isObjectLiteralExpression(initializer)) value[name] = literalObject(initializer);
    else if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) value[name] = initializer.text;
  }
  return value;
}

function placeholders(value) {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]).sort();
}

[
  "StudyPlanner unlocked",
  "Your subscription is active.",
  "Add Syllabus",
  "No semester loaded.",
  "Start here",
  "Scan syllabus",
  "Build your semester first.",
  "Paste text",
  "Upload PDF",
  "Restore Purchases",
  "Terms of Use",
  "Privacy Policy",
].forEach((copy) => expect(appSource.includes(copy), `Missing required copy: ${copy}`));

expect(!appSource.includes("score 81"), "localized surfaces must not mention fake score 81");
expect(!appSource.includes("No dashboard data"), "empty dashboard must not use broken placeholder copy");
expect(!appSource.includes("0 / locked"), "locked or empty dashboard must not expose prototype numeric shorthand");
expect(!appSource.includes("Studyplanner: Syllabus AI"), "loading copy must use product casing");
expect(appSource.includes('"review.guard_active": "Approve first."'), "English save-gate copy must stay compact");
expect(!appSource.includes('"review.guard_active": "Nothing saves until you approve."'), "English save-gate copy must not regress to the wrapped phrase");
expect(appSource.includes('textFor("scan.rail_review", "Review")} label={textFor("scan.metric_gate", "Save gate")}'), "Scan save-gate metric must use the compact Review value");

const sourceFile = ts.createSourceFile("App.tsx", appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const runtimeCopyNode = objectLiteralForConst(sourceFile, "SCAN_REVIEW_RUNTIME_COPY");
expect(Boolean(runtimeCopyNode), "Missing typed SCAN_REVIEW_RUNTIME_COPY table");

if (runtimeCopyNode) {
  const runtimeCopy = literalObject(runtimeCopyNode);
  const locales = ["en-US", "de", "es", "fr", "pt-BR", "ja", "ko", "zh-Hans", "hi", "ar"];
  const requiredKeys = [
    "review.guard_active_body",
    "review.approve",
    "review.manual",
    "scan.more_assignment",
    "scan.more_assignment_body",
    "scan.more_exam",
    "scan.more_exam_body",
    "scan.more_upload_body",
    "review.pressure_preview",
    "review.first_action",
    "review.high",
    "review.good",
    "review.needs_review",
    "review.needs_review_body",
    "review.items_found",
    "review.reconcile_hint",
    "review.keep_existing",
    "review.update_existing",
    "review.create_duplicate",
    "review.date_change_connector",
    "review.date_change_accessibility",
    "task.due",
    "class.effort",
    "assessment.room",
    "review.title_required",
    "review.time_required",
    "review.owner_required",
    "review.invalid_date",
    "review.accessibility_approve",
    "review.accessibility_unapprove",
    "review.accessibility_remove",
    "review.reconciliation_action_accessibility",
    "review.assign_to_class_accessibility",
    "import.status_applied",
    "import.status_review",
    "scan.history_row_summary",
  ];
  const expectedPlaceholders = {
    "review.items_found": ["kind"],
    "review.date_change_accessibility": ["newDate", "oldDate"],
    "review.title_required": ["kind"],
    "review.accessibility_approve": ["title"],
    "review.accessibility_unapprove": ["title"],
    "review.accessibility_remove": ["title"],
    "review.reconciliation_action_accessibility": ["action", "title"],
    "review.assign_to_class_accessibility": ["classCode", "title"],
    "scan.history_row_summary": ["count", "status"],
  };

  expect(Object.keys(runtimeCopy).sort().join("|") === [...locales].sort().join("|"), "Scan/Review runtime table must cover exactly every SupportedLocale");
  for (const locale of locales) {
    const copy = runtimeCopy[locale] || {};
    expect(requiredKeys.every((key) => typeof copy[key] === "string" && copy[key].trim().length > 0), `${locale} is missing required Scan/Review runtime copy`);
    expect(requiredKeys.every((key) => Object.hasOwn(copy, key)), `${locale} Scan/Review runtime copy must not rely on category fallback`);

    const reconciliationActions = [copy["review.keep_existing"], copy["review.update_existing"], copy["review.create_duplicate"]];
    expect(new Set(reconciliationActions).size === reconciliationActions.length, `${locale} reconciliation actions must be pairwise distinct`);
    expect(copy["import.status_applied"] !== copy["import.status_review"], `${locale} import statuses must be distinct`);

    for (const [key, expected] of Object.entries(expectedPlaceholders)) {
      expect(placeholders(copy[key] || "").join("|") === expected.join("|"), `${locale} ${key} placeholder parity failed`);
    }
  }

  expect(runtimeCopy.ar?.["review.date_change_accessibility"]?.includes("\u2068") && runtimeCopy.ar?.["review.date_change_accessibility"]?.includes("\u2069"), "Arabic spoken date change must isolate LTR date values");
  expect(runtimeCopy.ar?.["scan.history_row_summary"]?.includes("\u2068") && runtimeCopy.ar?.["scan.history_row_summary"]?.includes("\u2069"), "Arabic history summary must isolate dynamic values");
  expect(runtimeCopy["en-US"]?.["review.invalid_date"] === "Enter a valid date in YYYY-MM-DD format.", "Shared invalid-date guidance must stay context-neutral");
  expect(runtimeCopy.ar?.["review.invalid_date"]?.includes("\u2068") && runtimeCopy.ar?.["review.invalid_date"]?.includes("\u2069"), "Arabic invalid-date guidance must isolate the LTR date format");
  expect(
    ["review.accessibility_approve", "review.accessibility_unapprove", "review.accessibility_remove", "review.reconciliation_action_accessibility", "review.assign_to_class_accessibility"]
      .every((key) => runtimeCopy.ar?.[key]?.includes("\u2068") && runtimeCopy.ar?.[key]?.includes("\u2069")),
    "Arabic Review actions must isolate interpolated values",
  );
}

expect(appSource.includes('Object.assign(APP_COPY[locale], SCAN_REVIEW_RUNTIME_COPY[locale]);'), "Scan/Review runtime copy must be applied to APP_COPY");
expect(appSource.lastIndexOf("SCAN_REVIEW_RUNTIME_COPY[locale]") > appSource.lastIndexOf("EDITORIAL_POLISH_COPY[locale]"), "Scan/Review runtime copy must be the final locale overlay");
expect(!appSource.includes("{imp.status} -"), "Import history must not render a raw internal status");
expect(!/>to<\/Text>/.test(appSource), "Review date changes must not hard-code an English connector");
expect(!appSource.includes('textFor("class.assignment", "Type")'), "Review type fields must use the assessment.type localization key");
expect(!appSource.includes("accessibilityLabel={`Assign ${"), "Review class assignment labels must be localized templates");
expect(!appSource.includes("edit, remove") && !appSource.includes("भरोसेमंद approve") && !appSource.includes("मैन्युअल setup"), "Hindi Review copy must not mix untranslated English controls");

const reviewSource = appSource.slice(appSource.indexOf("function ReviewImport"), appSource.indexOf("function ApplySuccess"));
for (const key of ["review.title_required", "review.time_required", "review.owner_required", "review.invalid_date", "review.accessibility_approve", "review.accessibility_unapprove", "review.accessibility_remove", "review.reconciliation_action_accessibility", "review.assign_to_class_accessibility"]) {
  expect(reviewSource.includes(`textFor("${key}"`), `ReviewImport must use localized ${key}`);
}
expect(reviewSource.includes('accessibilityRole="radiogroup"') && reviewSource.includes('accessibilityRole="radio"'), "Review reconciliation choices must expose radio-group semantics");

if (failures.length) {
  console.error("Localization checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Localization checks passed.");
