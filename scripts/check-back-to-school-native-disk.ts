import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type CandidateKind = "auto_safe" | "manual_review" | "external_review";

type CleanupCandidate = {
  id: string;
  path: string;
  exists: boolean;
  bytes: number;
  gib: number;
  kind: CandidateKind;
  reason: string;
  applied: boolean;
};

const OUTPUT_PATH = "qa/back-to-school-2026/native-disk-readiness.json";
const RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-disk-cleanup-runbook.md";
const MIN_FREE_GIB = 15;
const APPLY_SAFE = process.argv.includes("--apply-safe");

function command(commandName: string, args: string[], timeout = 15000) {
  try {
    return execFileSync(commandName, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout,
    }).trim();
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : "";
    const stdout = error && typeof error === "object" && "stdout" in error ? String(error.stdout || "") : "";
    return `${stdout}\n${stderr}`.trim();
  }
}

function dfFreeGib(path = ".") {
  const output = command("df", ["-k", path]);
  const [, dataLine = ""] = output.split("\n");
  const columns = dataLine.trim().split(/\s+/);
  const availableKilobytes = Number(columns[3] || 0);
  return {
    output,
    freeGib: availableKilobytes / 1024 / 1024,
  };
}

function duBytes(path: string) {
  if (!existsSync(path)) return 0;
  const output = command("du", ["-sk", path], 10000);
  const [kilobytes = "0"] = output.split(/\s+/);
  const parsed = Number(kilobytes || 0);
  return Number.isFinite(parsed) ? parsed * 1024 : 0;
}

function gib(bytes: number) {
  return bytes / 1024 / 1024 / 1024;
}

function fmtGib(value: number) {
  return `${value.toFixed(2)} GiB`;
}

function candidate(id: string, path: string, kind: CandidateKind, reason: string): CleanupCandidate {
  const bytes = duBytes(path);
  return {
    id,
    path,
    exists: existsSync(path),
    bytes,
    gib: gib(bytes),
    kind,
    reason,
    applied: false,
  };
}

function safeRemove(item: CleanupCandidate) {
  if (!APPLY_SAFE || item.kind !== "auto_safe" || !item.exists) return item;
  const absolute = resolve(item.path);
  const allowed = [
    resolve("ios/build/BackToSchoolDerivedData"),
    resolve(".expo/web/cache"),
    resolve("node_modules/.cache"),
  ];
  if (!allowed.includes(absolute)) return item;
  rmSync(absolute, { recursive: true, force: true });
  return {
    ...item,
    applied: true,
  };
}

const before = dfFreeGib(".");
const projectCandidates = [
  candidate(
    "back-to-school-derived-data",
    "ios/build/BackToSchoolDerivedData",
    "auto_safe",
    "Generated only by the Back-to-School native capture command and safe to remove between attempts.",
  ),
  candidate(".expo-web-cache", ".expo/web/cache", "auto_safe", "Expo web cache; safe to regenerate."),
  candidate("node-modules-cache", "node_modules/.cache", "auto_safe", "Package/tool cache under node_modules; safe to regenerate."),
  candidate(
    "marketing-simulator-build",
    "marketing/social-launch-video/simulator-build",
    "manual_review",
    "Old marketing simulator app bundle. Review before deleting because it may support prior launch-video evidence.",
  ),
  candidate(
    "marketing-simulator-debug-build",
    "marketing/social-launch-video/simulator-debug-build",
    "manual_review",
    "Old marketing simulator debug app bundle. Review before deleting because it may support prior launch-video evidence.",
  ),
  candidate(".gitnexus-index", ".gitnexus", "manual_review", "GitNexus index can be regenerated, but removing it slows code intelligence."),
];

const appliedProjectCandidates = projectCandidates.map(safeRemove);
const afterAutoSafe = APPLY_SAFE ? dfFreeGib(".") : before;

const home = process.env.HOME || "";
const externalCandidates = [
  candidate("xcode-derived-data", `${home}/Library/Developer/Xcode/DerivedData`, "external_review", "Xcode build cache outside the repo."),
  candidate("xcode-archives", `${home}/Library/Developer/Xcode/Archives`, "external_review", "Xcode archives outside the repo."),
  candidate("core-simulator-devices", `${home}/Library/Developer/CoreSimulator/Devices`, "external_review", "Installed simulator device data outside the repo."),
  candidate("downloads", `${home}/Downloads`, "external_review", "User downloads outside the repo."),
  candidate("trash", `${home}/.Trash`, "external_review", "User trash outside the repo."),
  candidate("npm-cache", `${home}/.npm`, "external_review", "npm cache outside the repo."),
  candidate("home-cache", `${home}/Library/Caches`, "external_review", "User cache directory outside the repo."),
];

const autoSafeBytes = appliedProjectCandidates
  .filter((item) => item.kind === "auto_safe")
  .reduce((total, item) => total + item.bytes, 0);
const manualReviewBytes = appliedProjectCandidates
  .filter((item) => item.kind === "manual_review")
  .reduce((total, item) => total + item.bytes, 0);
const externalReviewBytes = externalCandidates.reduce((total, item) => total + item.bytes, 0);
const currentFreeGib = afterAutoSafe.freeGib;
const gapGib = Math.max(0, MIN_FREE_GIB - currentFreeGib);
const autoSafeRecoverableGib = gib(autoSafeBytes);
const rankedExternalCandidates = externalCandidates
  .filter((item) => item.exists && item.gib > 0)
  .sort((a, b) => b.gib - a.gib);
const rankedManualCandidates = appliedProjectCandidates
  .filter((item) => item.kind === "manual_review" && item.exists && item.gib > 0)
  .sort((a, b) => b.gib - a.gib);
let cumulativeReviewGib = 0;
const cleanupPlan = rankedExternalCandidates.map((item, index) => {
  cumulativeReviewGib += item.gib;
  return {
    order: index + 1,
    id: item.id,
    path: item.path,
    gib: item.gib,
    cumulativeGib: cumulativeReviewGib,
    closesGap: cumulativeReviewGib >= gapGib,
    reason: item.reason,
    deleteAutomatically: false,
  };
});
const closesGapWithExternalReview = cleanupPlan.some((item) => item.closesGap);
const topExternal = cleanupPlan[0];
const readyForNativeCapture = currentFreeGib >= MIN_FREE_GIB;
const recommendedActions = readyForNativeCapture
  ? ["Disk is above the native capture threshold. Run npm run check:back-to-school-native-preflight."]
  : [
      `Free at least ${gapGib.toFixed(1)} GiB before rerunning native capture.`,
      autoSafeRecoverableGib >= gapGib
        ? "Run npm run clean:back-to-school-native-disk to remove only generated project caches."
        : closesGapWithExternalReview
          ? `Project-local auto-safe cleanup is not enough; review the ordered cleanup plan. Largest candidate: ${topExternal?.id || "external-review"} (${fmtGib(topExternal?.gib || 0)}).`
          : "Project-local auto-safe cleanup is not enough and the measured external candidates do not close the gap; use the remote capture fallback.",
      "Do not delete real WidgetKit, App Store, or launch evidence without copying it into the release packet first.",
    ];
const blockers = readyForNativeCapture ? [] : recommendedActions;
const runbookLines = [
  "# Back-to-School 2026 Native Disk Cleanup Runbook",
  "",
  `Generated: ${new Date().toISOString()}`,
  "Release: Back to School with AI",
  `Safe cleanup applied: ${APPLY_SAFE ? "yes" : "no"}`,
  `Native capture threshold: ${fmtGib(MIN_FREE_GIB)}`,
  `Current free disk: ${fmtGib(currentFreeGib)}`,
  `Gap to close: ${fmtGib(gapGib)}`,
  "",
  "This runbook is intentionally non-destructive for user and system folders. The script only deletes scoped generated project caches when `--apply-safe` is used.",
  "",
  "## Auto-Safe Project Cleanup",
  "",
  "| Candidate | Exists | Size | Applied | Reason |",
  "| --- | --- | --- | --- | --- |",
  ...appliedProjectCandidates
    .filter((item) => item.kind === "auto_safe")
    .map((item) => `| ${item.id} | ${item.exists ? "yes" : "no"} | ${fmtGib(item.gib)} | ${item.applied ? "yes" : "no"} | ${item.reason} |`),
  "",
  "## Manual Review Candidates",
  "",
  "| Candidate | Size | Path | Reason |",
  "| --- | --- | --- | --- |",
  ...rankedManualCandidates.map((item) => `| ${item.id} | ${fmtGib(item.gib)} | \`${item.path}\` | ${item.reason} |`),
  ...(rankedManualCandidates.length ? [] : ["| None | 0.00 GiB |  | No repo-local manual-review candidates are currently present. |"]),
  "",
  "## External Review Plan",
  "",
  "| Order | Candidate | Size | Cumulative | Closes gap | Path | Reason |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...cleanupPlan.map(
    (item) =>
      `| ${item.order} | ${item.id} | ${fmtGib(item.gib)} | ${fmtGib(item.cumulativeGib)} | ${item.closesGap ? "yes" : "no"} | \`${item.path}\` | ${item.reason} |`,
  ),
  ...(cleanupPlan.length ? [] : ["|  | None | 0.00 GiB | 0.00 GiB | no |  | No external-review candidates were found. |"]),
  "",
  "## Commands",
  "",
  "- Audit only: `npm run check:back-to-school-native-disk`",
  "- Apply scoped project-cache cleanup only: `npm run clean:back-to-school-native-disk`",
  "- Re-check native preflight after cleanup: `npm run check:back-to-school-native-preflight`",
  "- Capture native screenshots after preflight: `npm run capture:back-to-school-native`",
  "",
  "## Guardrails",
  "",
  "- Do not delete real WidgetKit, App Store, or launch evidence without copying it into the release packet first.",
  "- The script does not remove external candidates automatically.",
  "- Review simulator devices, downloads, caches, and Xcode folders in Finder/Xcode before deleting anything outside the repo.",
  "- If local cleanup cannot close the gap, use the guarded EAS simulator remote-capture path instead.",
  "",
].join("\n");

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status: readyForNativeCapture ? "ready" : "blocked",
  applySafeRequested: APPLY_SAFE,
  minFreeDiskGib: MIN_FREE_GIB,
  before: {
    freeGib: before.freeGib,
    df: before.output,
  },
  afterAutoSafe: {
    freeGib: currentFreeGib,
    df: afterAutoSafe.output,
  },
  readyForNativeCapture,
  gapGib,
  recoverable: {
    autoSafeGib: autoSafeRecoverableGib,
    manualReviewGib: gib(manualReviewBytes),
    externalReviewGib: gib(externalReviewBytes),
  },
  cleanupPlan: {
    runbookPath: RUNBOOK_PATH,
    autoSafeUseful: autoSafeRecoverableGib >= gapGib,
    externalReviewCanCloseGap: closesGapWithExternalReview,
    topExternalCandidate: topExternal
      ? {
          id: topExternal.id,
          path: topExternal.path,
          gib: topExternal.gib,
        }
      : null,
    orderedExternalCandidates: cleanupPlan,
    orderedManualCandidates: rankedManualCandidates.map((item, index) => ({
      order: index + 1,
      id: item.id,
      path: item.path,
      gib: item.gib,
      reason: item.reason,
      deleteAutomatically: false,
    })),
  },
  candidates: [...appliedProjectCandidates, ...externalCandidates],
  blockers,
  recommendedActions,
  commands: {
    audit: "npm run check:back-to-school-native-disk",
    applySafeCleanup: "npm run clean:back-to-school-native-disk",
    nativePreflight: "npm run check:back-to-school-native-preflight",
    nativeCapture: "npm run capture:back-to-school-native",
  },
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
mkdirSync(dirname(RUNBOOK_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(RUNBOOK_PATH, runbookLines);

console.log(
  `Back-to-School native disk readiness ${payload.readyForNativeCapture ? "ready" : "blocked"}. ` +
    `${currentFreeGib.toFixed(1)} GiB free, ${gapGib.toFixed(1)} GiB gap. Wrote ${OUTPUT_PATH}.`,
);
