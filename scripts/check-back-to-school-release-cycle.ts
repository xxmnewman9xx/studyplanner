import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type CommandResult = {
  script: string;
  status: "passed" | "failed" | "missing";
  durationMs: number;
  outputTail: string;
  error: string | null;
};

const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const OUTPUT_JSON_PATH = "qa/back-to-school-2026/release-cycle-gate.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/release-cycle-gate.md";
const PACKAGE_JSON_PATH = "package.json";

const requiredScripts = [
  "typecheck",
  "qa:release",
  "test:widget-integrity",
  "test:back-to-school-widgets",
  "check:back-to-school-launch",
  "check:back-to-school-assets",
  "check:back-to-school-supplementals",
  "check:back-to-school-upload-package",
  "check:back-to-school-marketing-assets",
  "check:back-to-school-remote-capture",
  "check:back-to-school-editorial",
  "finalize:back-to-school-assets",
  "check:back-to-school-submission",
  "check:back-to-school-submission-runbook",
  "check:back-to-school-execution-board",
  "test:hard-paywall",
  "check:iap",
];

const artifactPaths = {
  launch: "qa/back-to-school-2026/launch-readiness-audit.json",
  editorial: "qa/back-to-school-2026/editorial-readiness-board.json",
  submission: "qa/back-to-school-2026/submission-gate.json",
  assets: "qa/back-to-school-2026/asset-production-audit.json",
  finalization: "qa/back-to-school-2026/asset-finalization-plan.json",
  uploadPackage: "qa/back-to-school-2026/supplemental-upload-manifest.json",
  marketingPackage: "qa/back-to-school-2026/marketing-asset-package-manifest.json",
  submissionRunbook: "qa/back-to-school-2026/app-store-connect-submission-runbook.json",
  executionBoard: "qa/back-to-school-2026/execution-board.json",
  nativePreflight: "qa/back-to-school-2026/native-capture-preflight.json",
};

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string, fallback: T): T {
  const raw = read(path);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function tail(text: string, maxLines = 20) {
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.slice(Math.max(0, lines.length - maxLines)).join("\n");
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function tableRow(cells: string[]) {
  return `| ${cells.map(markdownCell).join(" | ")} |`;
}

function runScript(script: string): CommandResult {
  const startedAt = Date.now();
  try {
    const output = execFileSync("npm", ["run", script], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000,
      maxBuffer: 1024 * 1024 * 20,
    });
    return {
      script,
      status: "passed",
      durationMs: Date.now() - startedAt,
      outputTail: tail(output),
      error: null,
    };
  } catch (error) {
    const stdout = error && typeof error === "object" && "stdout" in error ? String(error.stdout || "") : "";
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : "";
    return {
      script,
      status: "failed",
      durationMs: Date.now() - startedAt,
      outputTail: tail(`${stdout}\n${stderr}`),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const nomination = read(NOMINATION_PATH);
const packageJson = readJson<{ scripts?: Record<string, string> }>(PACKAGE_JSON_PATH, { scripts: {} });
const packageScripts = packageJson.scripts || {};

for (const script of requiredScripts) {
  if (!packageScripts[script]) failures.push(`Missing package script: ${script}`);
}

const missingFromNomination = requiredScripts.filter((script) => !nomination.includes(`npm run ${script}`));
for (const script of missingFromNomination) {
  failures.push(`Nomination readiness gate must mention npm run ${script}`);
}

const commandResults = requiredScripts.map((script) => {
  if (!packageScripts[script]) {
    return {
      script,
      status: "missing" as const,
      durationMs: 0,
      outputTail: "",
      error: "Package script is missing.",
    };
  }
  return runScript(script);
});

for (const result of commandResults) {
  if (result.status !== "passed") failures.push(`Release-cycle command failed: ${result.script}`);
}

const launch = readJson<{ submissionReady?: boolean; blockers?: string[] }>(artifactPaths.launch, {});
const editorial = readJson<{ submissionReady?: boolean; items?: { id?: string; status?: string }[] }>(artifactPaths.editorial, {});
const submission = readJson<{ submissionReady?: boolean; recommendedSubmissionMode?: string; blockers?: string[]; gates?: { id?: string; status?: string }[] }>(
  artifactPaths.submission,
  {},
);
const assets = readJson<{ assetsReady?: boolean; blockers?: string[] }>(artifactPaths.assets, {});
const finalization = readJson<{ status?: string; blockers?: string[] }>(artifactPaths.finalization, {});
const uploadPackage = readJson<{ packageReady?: boolean; blockers?: string[] }>(artifactPaths.uploadPackage, {});
const marketingPackage = readJson<{ draftReady?: boolean; finalReady?: boolean; blockers?: string[] }>(artifactPaths.marketingPackage, {});
const submissionRunbook = readJson<{ manualSubmissionReady?: boolean; status?: string; blockers?: string[] }>(
  artifactPaths.submissionRunbook,
  {},
);
const executionBoard = readJson<{ localExecutionReady?: boolean; status?: string; summary?: { criticalLane?: string | null }; lanes?: unknown[] }>(
  artifactPaths.executionBoard,
  {},
);
const nativePreflight = readJson<{ captureReady?: boolean; blockers?: string[] }>(artifactPaths.nativePreflight, {});

const commandsPassed = commandResults.every((result) => result.status === "passed");
const blockedGates = (submission.gates || []).filter((gate) => gate.status !== "ready").map((gate) => gate.id || "unknown");
const localCyclePassed = commandsPassed && failures.length === 0;
const submissionReady = submission.submissionReady === true;

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  localCyclePassed,
  submissionReady,
  recommendedSubmissionMode: submission.recommendedSubmissionMode || "Save as Draft only",
  commandCount: requiredScripts.length,
  commandsPassed,
  commandResults,
  artifactStatus: {
    launchSubmissionReady: launch.submissionReady === true,
    editorialSubmissionReady: editorial.submissionReady === true,
    submissionGateReady: submissionReady,
    nativeCaptureReady: nativePreflight.captureReady === true,
    assetsReady: assets.assetsReady === true,
    assetFinalizationStatus: finalization.status || "unknown",
    uploadPackageReady: uploadPackage.packageReady === true,
    marketingDraftReady: marketingPackage.draftReady === true,
    marketingFinalReady: marketingPackage.finalReady === true,
    submissionRunbookStatus: submissionRunbook.status || "unknown",
    submissionRunbookReady: submissionRunbook.manualSubmissionReady === true,
    executionBoardStatus: executionBoard.status || "unknown",
    executionBoardReady: executionBoard.localExecutionReady === true,
    executionCriticalLane: executionBoard.summary?.criticalLane || "none",
  },
  blockers: [
    ...(launch.blockers || []).map((blocker) => `launch: ${blocker}`),
    ...(submission.blockers || []).map((blocker) => `submission: ${blocker}`),
    ...(assets.blockers || []).map((blocker) => `assets: ${blocker}`),
    ...(finalization.blockers || []).map((blocker) => `finalization: ${blocker}`),
    ...(uploadPackage.blockers || []).map((blocker) => `upload-package: ${blocker}`),
    ...(marketingPackage.blockers || []).map((blocker) => `marketing: ${blocker}`),
    ...(submissionRunbook.blockers || []).map((blocker) => `submission-runbook: ${blocker}`),
    ...(nativePreflight.blockers || []).map((blocker) => `native-preflight: ${blocker}`),
  ],
  blockedGates,
  failures,
};

const commandRows = [
  "| Command | Status | Duration |",
  "| --- | --- | --- |",
  ...commandResults.map((result) => tableRow([`npm run ${result.script}`, result.status, `${(result.durationMs / 1000).toFixed(1)}s`])),
];

const markdown = `# Back-to-School 2026 Release Cycle Gate

Generated: ${payload.generatedAt}
Release: ${payload.release}
Local cycle passed: ${localCyclePassed ? "yes" : "no"}
Submission ready: ${submissionReady ? "yes" : "no"}
Recommended submission mode: ${payload.recommendedSubmissionMode}

This gate runs the command set named by the App Store nomination packet and records the current submission state. Passing this gate means the local release cycle is internally consistent; it does not override native capture, WidgetKit, final screenshot, or hosted supplemental URL blockers.

## Commands

${commandRows.join("\n")}

## Artifact Status

- Launch ready: ${payload.artifactStatus.launchSubmissionReady ? "yes" : "no"}
- Editorial ready: ${payload.artifactStatus.editorialSubmissionReady ? "yes" : "no"}
- Submission gate ready: ${payload.artifactStatus.submissionGateReady ? "yes" : "no"}
- Native capture ready: ${payload.artifactStatus.nativeCaptureReady ? "yes" : "no"}
- Assets ready: ${payload.artifactStatus.assetsReady ? "yes" : "no"}
- Asset finalization: ${payload.artifactStatus.assetFinalizationStatus}
- Upload package ready: ${payload.artifactStatus.uploadPackageReady ? "yes" : "no"}
- Marketing draft ready: ${payload.artifactStatus.marketingDraftReady ? "yes" : "no"}
- Marketing final ready: ${payload.artifactStatus.marketingFinalReady ? "yes" : "no"}
- Submission runbook: ${payload.artifactStatus.submissionRunbookStatus}
- Submission runbook ready: ${payload.artifactStatus.submissionRunbookReady ? "yes" : "no"}
- Execution board: ${payload.artifactStatus.executionBoardStatus}
- Execution board ready: ${payload.artifactStatus.executionBoardReady ? "yes" : "no"}
- Execution critical lane: ${payload.artifactStatus.executionCriticalLane}

## Blocked Gates

${blockedGates.length ? blockedGates.map((gate) => `- ${gate}`).join("\n") : "- None"}

## Current Blockers

${payload.blockers.length ? payload.blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None"}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

if (!localCyclePassed) {
  console.error("Back-to-School release cycle gate failed:");
  payload.failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Back-to-School release cycle gate passed locally. Submission ready: ${submissionReady ? "yes" : "no"}. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`,
);
