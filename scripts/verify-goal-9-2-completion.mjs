#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const goalArtifactRoot = path.join(root, "artifacts/goal-9-2-transformation");
const postGoalArtifactRoot = path.join(root, "artifacts/post-goal-aso-submission");
const proofRoot = path.join(postGoalArtifactRoot, "external-proof");
const outputPath = path.join(root, "docs/GOAL_9_2_COMPLETION_GATE.md");
const jsonMode = process.argv.includes("--json");
const writeDoc = !jsonMode && !process.argv.includes("--no-write");
const checks = [];

const requiredDocs = [
  "docs/GOAL_9_2_SCORECARD.md",
  "docs/ROOT_CONCEPT_AUDIT.md",
  "docs/SUBAGENT_GOAL_REVIEWS.md",
  "docs/USE_CASE_SWARM_500.md",
  "docs/TOP_ROOT_CONCEPT_PROBLEMS.md",
  "docs/FEATURE_9_2_SPEC.md",
  "docs/DESIGN_SYSTEM_9_2_REVAMP.md",
  "docs/ONBOARDING_CONVERSION_9_2.md",
  "docs/WIDGET_9_2_RETENTION_SPEC.md",
  "docs/FUNCTIONALITY_TEST_MATRIX_9_2.md",
  "docs/DATA_FLOW_AND_STATE_INTEGRITY_9_2.md",
  "docs/CUSTOMIZATION_AND_THEMES_9_2.md",
  "docs/APPLE_NATIVE_VISUAL_AUDIT_9_2.md",
  "docs/MONETIZATION_AND_APP_REVIEW_9_2.md",
  "docs/ACCESSIBILITY_LOCALIZATION_PERFORMANCE_9_2.md",
  "docs/SCREENSHOT_PROOF_9_2.md",
  "docs/QA_EXECUTION_LOG_9_2.md",
  "docs/FINAL_9_2_READINESS_REPORT.md",
  "docs/COMPLETION_AUDIT_9_2.md"
];

const requiredGoalScreenshots = [
  "00-before-contact-sheet.png",
  "01-onboarding-before.png",
  "02-onboarding-after.png",
  "03-today-before.png",
  "04-today-after.png",
  "05-add-school-stuff-after.png",
  "06-check-new-work-after.png",
  "07-calendar-after.png",
  "08-calendar-day-detail-after.png",
  "09-week-plan-after.png",
  "10-classes-after.png",
  "11-class-detail-after.png",
  "12-assignment-detail-after.png",
  "13-widget-setup-after.png",
  "14-small-widget-after.png",
  "15-medium-widget-after.png",
  "16-busy-week-after.png",
  "17-theme-customization-after.png",
  "18-paywall-after.png",
  "19-app-icon-after.png",
  "20-final-contact-sheet.png"
];

const successorProofScreenshots = [
  "13-manual-add.png",
  "17-check-new-work-edit-item.png",
  "23-calendar-filtered-class.png",
  "28-reminders.png",
  "30-small-widget-home-screen.png",
  "31-medium-widget-home-screen.png",
  "32-widget-empty-state.png",
  "33-widget-needs-check-state.png",
  "36-settings.png",
  "39-restore-purchases.png",
  "43-localized-ui-example.png",
  "44-accessibility-large-text.png",
  "46-widget-refresh-after-completion.png",
  "47-widget-refresh-after-edit.png",
  "48-widget-refresh-after-add.png",
  "49-accessibility-check-work-large-text.png",
  "50-accessibility-assignment-detail-large-text.png",
  "51-accessibility-widget-setup-large-text.png",
  "52-accessibility-paywall-large-text.png"
];

const sourceEvidenceFiles = [
  "src/logic/importTrust.ts",
  "src/logic/dateUtils.ts",
  "src/screens/TodayScreen.tsx",
  "src/screens/ImportScreen.tsx",
  "src/screens/OnboardingScreen.tsx",
  "src/screens/WidgetShowcaseScreen.tsx",
  "src/screens/CoursesScreen.tsx",
  "src/screens/SettingsScreen.tsx",
  "tests/importTrust.test.ts",
  "tests/dateUtils.test.ts",
  "tests/plannerScale.test.ts",
  "tests/accessibilitySource.test.ts",
  "tests/themeContrast.test.ts",
  "tests/widgetPlugin.test.ts",
  "tests/storekitHandoff.test.ts",
  "tests/submissionReadiness.test.ts"
];

check(
  requiredDocs.every((file) => fileExists(file)),
  "All required 9.2 docs exist",
  missingList(requiredDocs)
);

const useCaseRows = countRows("docs/USE_CASE_SWARM_500.md", /^\| UC-/gm);
check(
  useCaseRows >= 500,
  "500-use-case swarm exists",
  `Expected at least 500 use cases; found ${useCaseRows}.`
);

const functionalityRows = countRows("docs/FUNCTIONALITY_TEST_MATRIX_9_2.md", /^\| FT-/gm);
check(
  functionalityRows >= 400,
  "Functionality matrix covers the requested feature groups",
  `Expected at least 400 functionality rows; found ${functionalityRows}.`
);

check(
  requiredGoalScreenshots.every((file) => fileExists(path.join("artifacts/goal-9-2-transformation", file))),
  "Required 9.2 screenshot set exists",
  missingList(requiredGoalScreenshots.map((file) => path.join("artifacts/goal-9-2-transformation", file)))
);

check(
  successorProofScreenshots.every((file) => fileExists(path.join("artifacts/post-goal-aso-submission", file))),
  "Successor proof screenshots cover known 9.2 gaps",
  missingList(successorProofScreenshots.map((file) => path.join("artifacts/post-goal-aso-submission", file)))
);

check(
  sourceEvidenceFiles.every((file) => fileExists(file)),
  "Implementation and regression-test evidence files exist",
  missingList(sourceEvidenceFiles)
);

checkScorecard();
checkFinalReadiness();
checkCompletionAudit();
checkVoiceOverSourceAudit();
checkStoreKitHandoff();
checkRunbook(
  "StoreKit testing runbook and attempt log exist",
  "docs/STOREKIT_TESTING_RUNBOOK.md",
  path.join(proofRoot, "storekit-sandbox-attempt.md"),
  "StoreKit testing handoff must explain how to capture products-loaded paywall and purchase/restore proof."
);
checkRunbook(
  "VoiceOver traversal runbook and attempt log exist",
  "docs/VOICEOVER_TRAVERSAL_RUNBOOK.md",
  path.join(proofRoot, "voiceover-traversal-attempt.md"),
  "VoiceOver handoff must explain how to capture real traversal proof."
);
checkSubmissionGateHasExpectedBlockers();

checkFile(
  "Products-loaded paywall proof exists",
  path.join(postGoalArtifactRoot, "37-paywall-products-loaded.png"),
  "Missing products-loaded StoreKit paywall screenshot. Use docs/STOREKIT_TESTING_RUNBOOK.md; tooling/setup attempts are recorded in storekit-sandbox-attempt.md."
);
checkProof({
  label: "StoreKit sandbox purchase/restore proof exists",
  fileName: "storekit-sandbox-proof.md",
  requiredTerms: ["monthly", "yearly", "lifetime", "restore", "sandbox"],
  detail:
    "StoreKit monthly/yearly/Lifetime purchase and restore proof must be recorded before the 9.2 goal can be closed. Use docs/STOREKIT_TESTING_RUNBOOK.md; setup attempts are recorded in storekit-sandbox-attempt.md."
});
checkProof({
  label: "Full VoiceOver traversal proof exists",
  fileName: "voiceover-traversal.md",
  requiredTerms: ["today", "check", "assignment", "widget", "paywall"],
  detail:
    "Source-level VoiceOver coverage is not a substitute for simulator/device traversal proof. Use docs/VOICEOVER_TRAVERSAL_RUNBOOK.md; tooling attempts are recorded in voiceover-traversal-attempt.md."
});
checkLocalizedUiDisposition();

const blockers = checks.filter((item) => item.status === "BLOCKER");
const warnings = checks.filter((item) => item.status === "WARN");
const audit = {
  generatedAt: new Date().toISOString(),
  branchContext:
    "The v1-2 goal branch is an ancestor of the current v1-3 ASO/submission branch.",
  useCaseRows,
  functionalityRows,
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
  console.log("Goal 9.2 completion verification");
  console.log(`Use cases: ${useCaseRows}`);
  console.log(`Functionality rows: ${functionalityRows}`);
  console.log("");
  for (const item of checks) {
    console.log(`${item.status.padEnd(7)} ${item.label}`);
    if (item.detail) {
      console.log(`        ${item.detail}`);
    }
  }
  if (writeDoc) {
    console.log("");
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}

if (!audit.passed) {
  if (!jsonMode) {
    console.error("");
    console.error(`GOAL-OPEN: ${blockers.length} blocker(s), ${warnings.length} warning(s).`);
  }
  process.exit(1);
}

if (!jsonMode) {
  console.log("");
  console.log(`GOAL-COMPLETE-CANDIDATE: 0 blockers, ${warnings.length} warning(s).`);
}

function checkScorecard() {
  const scorecard = read("docs/GOAL_9_2_SCORECARD.md");
  const score = extractScore(scorecard);
  check(
    typeof score === "number" && score >= 9.2,
    "Scorecard records a numeric score at or above 9.2",
    `Expected score >= 9.2 in docs/GOAL_9_2_SCORECARD.md; found ${score ?? "none"}.`
  );
}

function checkFinalReadiness() {
  const report = read("docs/FINAL_9_2_READINESS_REPORT.md");
  check(
    /Final implementation score:\s*\*\*9\.[2-9]\d*\/10\*\*/.test(report),
    "Final readiness report records a 9.2+ implementation score",
    "docs/FINAL_9_2_READINESS_REPORT.md does not record a 9.2+ implementation score."
  );
  check(
    /9\.2 reached:\s*\*\*Yes\*\*/i.test(report),
    "Final readiness report marks 9.2 reached",
    "docs/FINAL_9_2_READINESS_REPORT.md still says 9.2 reached: No."
  );
}

function checkCompletionAudit() {
  const audit = read("docs/COMPLETION_AUDIT_9_2.md");
  check(
    /Current Prompt-To-Artifact Checklist/.test(audit) &&
      /Current Verification Commands/.test(audit) &&
      /Current Missing Or Weakly Verified Requirements/.test(audit),
    "Completion audit contains prompt-to-artifact checklist and current verification",
    "docs/COMPLETION_AUDIT_9_2.md is missing the current-state audit sections."
  );
  check(
    /Goal completion\s*\|[^|\n]*\|[^|\n]*Not complete/i.test(audit) === false,
    "Completion audit no longer marks goal incomplete",
    "docs/COMPLETION_AUDIT_9_2.md still marks goal completion as not complete."
  );
}

function checkVoiceOverSourceAudit() {
  runJsonAudit({
    script: "scripts/audit-voiceover-readiness.mjs",
    label: "VoiceOver source audit has no local blockers",
    predicate: (audit) =>
      audit.filesScanned >= 20 &&
      audit.interactiveCount >= 100 &&
      audit.missingExplicitLabelCount === 0 &&
      audit.missingRoleCount === 0 &&
      audit.missingHintCount === 0
  });
}

function checkStoreKitHandoff() {
  runJsonAudit({
    script: "scripts/audit-storekit-handoff.mjs",
    label: "StoreKit source handoff audit has no local blockers",
    predicate: (audit) => audit.passed === true && audit.blockerCount === 0
  });
}

function checkSubmissionGateHasExpectedBlockers() {
  const scriptPath = path.join(root, "scripts/verify-submission-readiness.mjs");
  const result = runProcess(scriptPath);
  const output = `${result.stdout}\n${result.stderr}`;
  check(
    result.status !== 0 &&
      output.includes("NO-SUBMIT") &&
      output.includes("StoreKit/IAP source handoff has no local blockers") &&
      output.includes("VoiceOver source audit is clean"),
    "Submission gate blocks only after local source audits pass",
    "Expected verify:submission to fail honestly after passing StoreKit and VoiceOver source audits."
  );
}

function checkProof({ label, fileName, requiredTerms, detail }) {
  const filePath = path.join(proofRoot, fileName);
  if (!fs.existsSync(filePath)) {
    check(false, label, `${detail} Missing: ${path.relative(root, filePath)}.`);
    return;
  }

  const source = fs.readFileSync(filePath, "utf8").toLowerCase();
  const missingTerms = requiredTerms.filter((term) => !source.includes(term));
  const placeholderTerm = ["template", "todo", "placeholder", "replace before submit", "sample only"].find((term) =>
    source.includes(term)
  );
  check(
    source.trim().length >= 120 && missingTerms.length === 0 && !placeholderTerm,
    label,
    `${detail} Missing terms: ${missingTerms.join(", ") || "none"}. Placeholder term: ${placeholderTerm || "none"}.`
  );
}

function checkRunbook(label, docPath, attemptPath, detail) {
  const docExists = fileExists(docPath);
  const attemptExists = fs.existsSync(attemptPath) && fs.statSync(attemptPath).size > 0;
  check(
    docExists && attemptExists,
    label,
    `${detail} Missing: ${[
      docExists ? null : docPath,
      attemptExists ? null : path.relative(root, attemptPath)
    ].filter(Boolean).join(", ") || "none"}.`
  );
}

function checkLocalizedUiDisposition() {
  const filePath = path.join(proofRoot, "localized-ui-native-review.md");
  const label = "Localized UI/native review proof exists or is explicitly deferred";
  const detail =
    "The current app still has English UI string debt; localized UI/native review must be supplied or explicitly deferred by a release gate.";
  if (!fs.existsSync(filePath)) {
    check(false, label, `${detail} Missing: ${path.relative(root, filePath)}.`);
    return;
  }

  const source = fs.readFileSync(filePath, "utf8").toLowerCase();
  const requiredTerms = ["native", "locale", "screenshot", "review"];
  const missingTerms = requiredTerms.filter((term) => !source.includes(term));
  const placeholderTerm = ["template", "todo", "placeholder", "replace before submit", "sample only"].find((term) =>
    source.includes(term)
  );
  const isRealReview =
    source.includes("native reviewer") &&
    source.includes("approved") &&
    source.includes("screenshot text-fit");
  const isExplicitDeferral =
    source.includes("explicitly deferred") &&
    source.includes("english-only") &&
    source.includes("not submitted") &&
    source.includes("localization implementation deferred");

  check(
    source.trim().length >= 120 &&
      missingTerms.length === 0 &&
      !placeholderTerm &&
      (isRealReview || isExplicitDeferral),
    label,
    `${detail} Missing terms: ${missingTerms.join(", ") || "none"}. Placeholder term: ${placeholderTerm || "none"}. Disposition must be either a real native review or an English-only explicit deferral.`
  );
}

function runJsonAudit({ script, label, predicate }) {
  try {
    const output = execFileSync(process.execPath, [path.join(root, script), "--json"], {
      cwd: root,
      encoding: "utf8"
    });
    const audit = JSON.parse(output);
    check(predicate(audit), label, `${script} returned JSON but did not satisfy the completion predicate.`);
  } catch (error) {
    check(false, label, `${script} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function runProcess(scriptPath) {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        EXPO_PUBLIC_STORE_CAPTURE: "0",
        EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS: "",
        EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS: "",
        EXPO_PUBLIC_SUPPORT_URL: "",
        STUDYPLANNER_SUBMIT_LOCALIZATIONS: "0"
      }
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      status: typeof error.status === "number" ? error.status : 1,
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || error.message || ""
    };
  }
}

function checkFile(label, filePath, detail) {
  check(fs.existsSync(filePath) && fs.statSync(filePath).size > 0, label, detail);
}

function check(condition, label, detail) {
  checks.push({
    status: condition ? "PASS" : "BLOCKER",
    label,
    detail: condition ? undefined : detail
  });
}

function fileExists(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0;
}

function missingList(files) {
  const missing = files.filter((file) => !fileExists(file));
  return `Missing or empty files: ${missing.join(", ") || "none"}.`;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function countRows(relativePath, pattern) {
  const source = read(relativePath);
  return source.match(pattern)?.length || 0;
}

function extractScore(source) {
  const matches = [...source.matchAll(/\*\*(\d+(?:\.\d+)?)\/10\*\*/g)];
  const scores = matches.map((match) => Number(match[1])).filter((score) => Number.isFinite(score));
  return scores.length > 0 ? Math.max(...scores) : undefined;
}

function renderMarkdown(audit) {
  return `# Goal 9.2 Completion Gate

Generated: ${audit.generatedAt}

${audit.branchContext}

Result: ${audit.passed ? `GOAL-COMPLETE-CANDIDATE: 0 blockers, ${audit.warningCount} warning(s).` : `GOAL-OPEN: ${audit.blockerCount} blocker(s), ${audit.warningCount} warning(s).`}

Use-case rows inspected: ${audit.useCaseRows}
Functionality matrix rows inspected: ${audit.functionalityRows}

| Check | Status | Detail |
| --- | --- | --- |
${audit.checks.map((item) => `| ${escapeCell(item.label)} | ${item.status} | ${escapeCell(item.detail || "")} |`).join("\n")}

## Interpretation

This gate is intentionally stricter than a source test suite. It verifies the original 9.2 transformation artifacts and then refuses to close the goal while manual/external proof gaps remain. Passing source tests, screenshot manifests, or local audits does not by itself prove the active goal is complete.
`;
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}
