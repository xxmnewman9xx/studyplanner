import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type CheckStatus = "ready" | "blocked";

type ReadinessCheck = {
  id: string;
  status: CheckStatus;
  evidence: string[];
  blocker?: string;
};

type CaptureTarget = {
  captureId: string;
  filename: string;
  requiredProof: string;
  config: Record<string, unknown>;
};

const OUTPUT_PATH = "qa/back-to-school-2026/remote-capture-readiness.json";
const RUNBOOK_PATH = "docs/launch/back-to-school-2026/remote-native-capture-runbook.md";
const APP_CONFIG_PATH = "app.json";
const EAS_CONFIG_PATH = "eas.json";
const PACKAGE_JSON_PATH = "package.json";
const GITIGNORE_PATH = ".gitignore";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const REMOTE_RUNNER_PATH = "scripts/run-back-to-school-remote-capture.ts";
const REMOTE_RUN_AUDIT_PATH = "qa/back-to-school-2026/remote-capture-run.json";
const PROFILE = "back-to-school-sim";
const BUNDLE_ID = "com.mattnewman.studyplanner";
const SCHEME = "studyplanner";
const EAS_CLI = ["npx", "--yes", "eas-cli@latest"];

const failures: string[] = [];

function command(commandName: string, args: string[], timeout = 30000) {
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

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function parseJson<T>(path: string, fallback: T): T {
  const raw = read(path);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function status(condition: boolean): CheckStatus {
  return condition ? "ready" : "blocked";
}

function shell(args: string[]) {
  return args.map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function captureUrl(config: Record<string, unknown>) {
  return `${SCHEME}://capture?config=${encodeURIComponent(JSON.stringify(config))}`;
}

function buildReadiness(condition: boolean, id: string, evidence: string[], blocker: string): ReadinessCheck {
  return {
    id,
    status: status(condition),
    evidence,
    blocker: condition ? undefined : blocker,
  };
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function commandPlan(targets: CaptureTarget[]) {
  return {
    rules: [
      "Build first, start the EAS Simulator session only after a simulator artifact URL exists.",
      "Stop the EAS Simulator session on every exit path because it can bill while running.",
      "Do not open the webPreviewUrl inside the simulator; it is only for a human browser preview.",
      "Use a fresh build for current source unless a finished build is explicitly fingerprint-matched.",
    ],
    commands: {
      buildSimulatorArtifact: shell([...EAS_CLI, "build", "--platform", "ios", "--profile", PROFILE, "--non-interactive"]),
      dryRunRemoteRunner: "npm run plan:back-to-school-remote-capture",
      runRemoteRunner: "npm run capture:back-to-school-remote -- --artifact-url \"$ARTIFACT_URL\"",
      resetSimulatorEnv: "printf '# managed by eas-cli\\n' > .env.eas-simulator",
      startSimulator: shell([...EAS_CLI, "simulator:start", "--platform", "ios", "--type", "agent-device", "--non-interactive"]),
      pollSimulator:
        "for i in $(seq 1 64); do S=$(npx --yes eas-cli@latest simulator:get --json --non-interactive 2>/dev/null); " +
        "echo \"$S\" | grep -q '\"status\": *\"IN_PROGRESS\"' && echo \"$S\" | grep -q remoteConfig && { echo live; break; }; " +
        "echo \"$S\" | grep -qE '\"status\": *\"(STOPPED|ERRORED)\"' && { echo boot failed; break; }; sleep 15; done",
      installArtifact: "npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest install-from-source \"$ARTIFACT_URL\" --platform ios",
      openApp: `npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest open ${BUNDLE_ID} --platform ios`,
      stopSimulator: shell([...EAS_CLI, "simulator:stop"]),
      clearSimulatorEnv: "printf '# managed by eas-cli\\n' > .env.eas-simulator",
    },
    targets: targets.map((target) => {
      const url = captureUrl(target.config);
      return {
        captureId: target.captureId,
        filename: target.filename,
        requiredProof: target.requiredProof,
        config: target.config,
        deepLink: url,
        deepLinkLength: url.length,
        openCommand: `npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest open ${JSON.stringify(url)} --platform ios`,
        screenshotCommand: `npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest screenshot qa-screenshots/back-to-school-2026-native/${target.filename}`,
      };
    }),
  };
}

function markdown(checks: ReadinessCheck[], plan: ReturnType<typeof commandPlan>) {
  const checkRows = checks.map((check) => {
    const blocker = check.blocker || "None";
    return `| ${markdownCell(check.id)} | ${check.status} | ${markdownCell(check.evidence.join("<br>"))} | ${markdownCell(blocker)} |`;
  });
  const targetRows = plan.targets.map((target) => {
    return `| ${markdownCell(target.captureId)} | ${markdownCell(target.filename)} | ${target.deepLinkLength} chars | ${markdownCell(target.requiredProof)} |`;
  });
  return `# Back-to-School 2026 Remote Native Capture Runbook

Generated: ${new Date().toISOString()}
Release: Back to School with AI
Purpose: bypass the local Xcode disk bottleneck with a simulator-targeted EAS build and EAS Simulator session.

This runbook does not start a paid EAS Simulator session. It prepares the exact static simulator build and agent-device workflow for capture once the operator is ready to run it.

## Readiness

| Check | Status | Evidence | Blocker |
| --- | --- | --- | --- |
${checkRows.join("\n")}

## Command Order

1. Confirm the guarded runner without starting a session:
   \`${plan.commands.dryRunRemoteRunner}\`
2. Build simulator artifact:
   \`${plan.commands.buildSimulatorArtifact}\`
3. Set \`ARTIFACT_URL\` to the EAS artifact URL and run the capture pipeline:
   \`${plan.commands.runRemoteRunner}\`

The runner resets the simulator session file, starts EAS Simulator, polls until live, installs the artifact, opens each deep link below, captures screenshots, writes \`${REMOTE_RUN_AUDIT_PATH}\`, writes \`qa-screenshots/back-to-school-2026-native/manifest.json\`, stops the simulator, and clears \`.env.eas-simulator\` on exit.

## Manual Command Reference

1. Reset simulator session file:
   \`${plan.commands.resetSimulatorEnv}\`
2. Start remote simulator:
   \`${plan.commands.startSimulator}\`
3. Poll until live:
   \`${plan.commands.pollSimulator}\`
4. Set \`ARTIFACT_URL\` to the EAS artifact URL and install:
   \`${plan.commands.installArtifact}\`
5. Open each capture deep link below, wait for the UI to settle, and run its screenshot command.
6. Stop the simulator and clear \`.env.eas-simulator\`:
   \`${plan.commands.stopSimulator}\`
   \`${plan.commands.clearSimulatorEnv}\`

## Capture Targets

| Capture ID | File | Deep link length | Required proof |
| --- | --- | --- | --- |
${targetRows.join("\n")}

## Rules

- Use only the \`${PROFILE}\` profile for this capture path; it is the profile that enables the guarded release capture hook.
- The capture hook is disabled in normal production because it requires \`EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1\`.
- Do not use Expo Go for WidgetKit proof.
- Do not composite Home Screen widget screenshots.
- Stop the EAS Simulator session on every exit path.
`;
}

const appConfig = parseJson<{
  expo?: {
    slug?: string;
    scheme?: string;
    owner?: string;
    ios?: { bundleIdentifier?: string };
    extra?: { eas?: { projectId?: string } };
  };
}>(APP_CONFIG_PATH, {});
const easConfig = parseJson<{
  build?: Record<string, {
    distribution?: string;
    developmentClient?: boolean;
    env?: Record<string, string>;
    ios?: { simulator?: boolean; resourceClass?: string };
  }>;
}>(EAS_CONFIG_PATH, {});
const packageJson = parseJson<{
  scripts?: Record<string, string>;
}>(PACKAGE_JSON_PATH, {});
const gitignore = read(GITIGNORE_PATH);
const nativeCaptureRun = parseJson<{
  targetCount?: number;
  targets?: CaptureTarget[];
}>(NATIVE_CAPTURE_RUN_PATH, { targets: [] });

const easVersion = command(EAS_CLI[0], [...EAS_CLI.slice(1), "--version"]);
const easWhoami = command(EAS_CLI[0], [...EAS_CLI.slice(1), "whoami", "--non-interactive"]);
const profile = easConfig.build?.[PROFILE];
const targets = nativeCaptureRun.targets || [];
const plan = commandPlan(targets);
const deepLinksFit = plan.targets.every((target) => target.deepLinkLength < 3500);
const remoteRunnerReady =
  existsSync(REMOTE_RUNNER_PATH) &&
  packageJson.scripts?.["plan:back-to-school-remote-capture"] === "tsx scripts/run-back-to-school-remote-capture.ts" &&
  packageJson.scripts?.["capture:back-to-school-remote"] === "tsx scripts/run-back-to-school-remote-capture.ts --run";

const checks: ReadinessCheck[] = [
  buildReadiness(
    easVersion.includes("eas-cli/"),
    "eas-cli",
    [easVersion || "No EAS CLI version output."],
    "Install or run a recent EAS CLI through npx.",
  ),
  buildReadiness(
    easWhoami.length > 0 && !/not logged in|unauthenticated|error/i.test(easWhoami),
    "eas-auth",
    [easWhoami || "No EAS account detected."],
    "Authenticate with EAS or set EXPO_TOKEN before remote capture.",
  ),
  buildReadiness(
    Boolean(appConfig.expo?.extra?.eas?.projectId && appConfig.expo?.owner),
    "eas-project",
    [`projectId=${appConfig.expo?.extra?.eas?.projectId || "missing"}`, `owner=${appConfig.expo?.owner || "missing"}`],
    "Configure Expo projectId and owner before remote capture.",
  ),
  buildReadiness(
    appConfig.expo?.ios?.bundleIdentifier === BUNDLE_ID && appConfig.expo?.scheme === SCHEME,
    "app-identity",
    [`bundleIdentifier=${appConfig.expo?.ios?.bundleIdentifier || "missing"}`, `scheme=${appConfig.expo?.scheme || "missing"}`],
    "Bundle identifier or scheme does not match the remote capture command plan.",
  ),
  buildReadiness(
    Boolean(profile?.ios?.simulator && profile?.env?.EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA === "1"),
    "simulator-build-profile",
    [
      `profile=${PROFILE}`,
      `ios.simulator=${String(Boolean(profile?.ios?.simulator))}`,
      `captureEnv=${profile?.env?.EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA || "missing"}`,
    ],
    "Add a simulator EAS build profile with EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1.",
  ),
  buildReadiness(
    gitignore.split("\n").some((line) => line.trim() === ".env.eas-simulator"),
    "simulator-env-ignore",
    [".env.eas-simulator is ignored by git."],
    "Add .env.eas-simulator to .gitignore before starting a session.",
  ),
  buildReadiness(
    remoteRunnerReady,
    "remote-capture-runner",
    [
      `${REMOTE_RUNNER_PATH} exists`,
      "plan:back-to-school-remote-capture is wired",
      "capture:back-to-school-remote is wired",
      REMOTE_RUN_AUDIT_PATH,
    ],
    "Add the guarded remote capture runner and npm scripts before relying on the EAS Simulator fallback.",
  ),
  buildReadiness(
    nativeCaptureRun.targetCount === 10 && targets.length === 10,
    "capture-targets",
    [`${targets.length}/${nativeCaptureRun.targetCount || 0} app capture targets available.`],
    "Regenerate the Back-to-School native capture plan.",
  ),
  buildReadiness(
    deepLinksFit,
    "capture-deeplinks",
    [`${plan.targets.length} deep links generated`, `Longest deep link: ${Math.max(0, ...plan.targets.map((target) => target.deepLinkLength))} chars`],
    "A capture deep link is too long for reliable remote simulator routing.",
  ),
];

const remotePlanReady = checks.every((check) => check.status === "ready");
const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  remotePlanReady,
  startsPaidSession: false,
  profile: PROFILE,
  bundleId: BUNDLE_ID,
  scheme: SCHEME,
  checks,
  runner: {
    script: REMOTE_RUNNER_PATH,
    auditPath: REMOTE_RUN_AUDIT_PATH,
    planScript: "npm run plan:back-to-school-remote-capture",
    captureScript: "npm run capture:back-to-school-remote -- --artifact-url \"$ARTIFACT_URL\"",
  },
  plan,
  blockers: checks.flatMap((check) => check.blocker ? [`${check.id}: ${check.blocker}`] : []),
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
mkdirSync(dirname(RUNBOOK_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(RUNBOOK_PATH, markdown(checks, plan));

if (failures.length) {
  console.error("Back-to-School remote capture readiness failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School remote capture plan ${remotePlanReady ? "ready" : "blocked"}. Wrote ${OUTPUT_PATH} and ${RUNBOOK_PATH}.`);
