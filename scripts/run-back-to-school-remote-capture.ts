import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type RemoteCaptureTarget = {
  captureId: string;
  filename: string;
  requiredProof?: string;
  config?: Record<string, unknown>;
  deepLink?: string;
  deepLinkLength?: number;
};

type RemoteCaptureReadiness = {
  remotePlanReady?: boolean;
  startsPaidSession?: boolean;
  profile?: string;
  bundleId?: string;
  scheme?: string;
  checks?: { id?: string; status?: string; blocker?: string }[];
  plan?: {
    targets?: RemoteCaptureTarget[];
  };
  blockers?: string[];
};

type SimulatorStatus = {
  status?: string;
  webPreviewUrl?: string;
  jobRunUrl?: string;
  remoteConfig?: unknown;
};

const READINESS_PATH = "qa/back-to-school-2026/remote-capture-readiness.json";
const RUN_AUDIT_PATH = "qa/back-to-school-2026/remote-capture-run.json";
const OUTPUT_ROOT = "qa-screenshots/back-to-school-2026-native";
const BUNDLE_ID = "com.mattnewman.studyplanner";
const EAS_CLI = ["npx", "--yes", "eas-cli@latest"];
const AGENT_DEVICE = ["npx", "--yes", "agent-device@latest"];

const args = process.argv.slice(2);
const runRequested = args.includes("--run");
const artifactUrl = valueArg("--artifact-url") || process.env.STUDYPLANNER_EAS_SIM_ARTIFACT_URL || process.env.ARTIFACT_URL || "";
const outputRoot = valueArg("--out") || process.env.STUDYPLANNER_REMOTE_CAPTURE_OUT || OUTPUT_ROOT;
const waitMs = Number(valueArg("--wait-ms") || process.env.STUDYPLANNER_EAS_SIM_CAPTURE_WAIT_MS || 7000);
const maxDurationMinutes = valueArg("--max-duration-minutes") || process.env.STUDYPLANNER_EAS_SIM_MAX_DURATION_MINUTES || "";

function valueArg(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || "" : "";
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function shell(parts: string[]) {
  return parts.map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function resetSimulatorEnv() {
  writeFileSync(".env.eas-simulator", "# managed by eas-cli\n");
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath: string) {
  return sha256(readFileSync(filePath));
}

function parseJsonFromOutput<T>(output: string): T | null {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(output.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function run(commandName: string, commandArgs: string[], options: { capture?: boolean; timeout?: number } = {}) {
  const result = spawnSync(commandName, commandArgs, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    timeout: options.timeout || 120000,
  });
  if (result.status !== 0) {
    const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    throw new Error(`${shell([commandName, ...commandArgs])} failed with exit ${result.status}${output ? `\n${output}` : ""}`);
  }
  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

function simulatorExec(commandArgs: string[], timeout = 120000) {
  return run(EAS_CLI[0], [...EAS_CLI.slice(1), "simulator:exec", ...commandArgs], { timeout });
}

function agentDevice(commandArgs: string[], timeout = 120000) {
  return simulatorExec([...AGENT_DEVICE, ...commandArgs], timeout);
}

function getSimulatorStatus() {
  const output = execFileSync(EAS_CLI[0], [...EAS_CLI.slice(1), "simulator:get", "--json", "--non-interactive"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30000,
  });
  return parseJsonFromOutput<SimulatorStatus>(output) || {};
}

function waitForSimulator() {
  for (let attempt = 1; attempt <= 64; attempt += 1) {
    const status = getSimulatorStatus();
    if (status.status === "IN_PROGRESS" && status.remoteConfig) return status;
    if (status.status === "STOPPED" || status.status === "ERRORED") {
      throw new Error(`EAS Simulator stopped before capture: ${status.status}`);
    }
    sleep(15000);
  }
  throw new Error("Timed out waiting for EAS Simulator to become ready.");
}

function artifactEvidence(url: string) {
  if (!url) return { supplied: false };
  try {
    const parsed = new URL(url);
    return {
      supplied: true,
      host: parsed.host,
      sha256: sha256(url),
    };
  } catch {
    return {
      supplied: true,
      host: "invalid-url",
      sha256: sha256(url),
    };
  }
}

function commandPlan(readiness: RemoteCaptureReadiness, targets: RemoteCaptureTarget[]) {
  const startCommand = [...EAS_CLI, "simulator:start", "--platform", "ios", "--type", "agent-device", "--non-interactive"];
  if (maxDurationMinutes) startCommand.push("--max-duration-minutes", maxDurationMinutes);
  return {
    startsPaidSession: runRequested,
    profile: readiness.profile || "back-to-school-sim",
    commands: {
      buildSimulatorArtifact: shell([...EAS_CLI, "build", "--platform", "ios", "--profile", readiness.profile || "back-to-school-sim", "--non-interactive"]),
      dryRun: "npm run plan:back-to-school-remote-capture",
      runWithArtifact: "npm run capture:back-to-school-remote -- --artifact-url \"$ARTIFACT_URL\"",
      resetSimulatorEnv: "printf '# managed by eas-cli\\n' > .env.eas-simulator",
      startSimulator: shell(startCommand),
      installArtifact: "npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest install-from-source \"$ARTIFACT_URL\" --platform ios",
      stopSimulator: shell([...EAS_CLI, "simulator:stop"]),
    },
    targets: targets.map((target) => ({
      captureId: target.captureId,
      filename: target.filename,
      requiredProof: target.requiredProof || "",
      deepLink: target.deepLink || "",
      deepLinkLength: target.deepLinkLength || target.deepLink?.length || 0,
      screenshotPath: join(outputRoot, target.filename),
    })),
  };
}

function writeAudit(status: string, readiness: RemoteCaptureReadiness, extra: Record<string, unknown> = {}) {
  const targets = readiness.plan?.targets || [];
  const payload = {
    generatedAt: new Date().toISOString(),
    release: "Back to School with AI",
    status,
    runRequested,
    startsPaidSession: runRequested,
    outputRoot,
    bundleId: readiness.bundleId || BUNDLE_ID,
    waitMs,
    artifact: artifactEvidence(artifactUrl),
    remotePlanReady: readiness.remotePlanReady === true,
    targetCount: targets.length,
    plan: commandPlan(readiness, targets),
    ...extra,
  };
  mkdirSync(dirname(RUN_AUDIT_PATH), { recursive: true });
  writeFileSync(RUN_AUDIT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function validateReadiness(readiness: RemoteCaptureReadiness) {
  const targets = readiness.plan?.targets || [];
  if (readiness.remotePlanReady !== true) {
    return ["Remote capture readiness has not passed.", ...(readiness.blockers || [])];
  }
  if (readiness.startsPaidSession !== false) {
    return ["Readiness check must not start a paid simulator session."];
  }
  if (targets.length !== 10) {
    return [`Expected 10 remote capture targets; found ${targets.length}.`];
  }
  const missingDeepLinks = targets.filter((target) => !target.deepLink);
  if (missingDeepLinks.length > 0) {
    return [`Missing deep links for: ${missingDeepLinks.map((target) => target.captureId).join(", ")}`];
  }
  return [];
}

function capture(readiness: RemoteCaptureReadiness) {
  const targets = readiness.plan?.targets || [];
  const startCommand = [...EAS_CLI.slice(1), "simulator:start", "--platform", "ios", "--type", "agent-device", "--non-interactive"];
  if (maxDurationMinutes) startCommand.push("--max-duration-minutes", maxDurationMinutes);

  let sessionStarted = false;
  let simulatorStatus: SimulatorStatus = {};
  try {
    resetSimulatorEnv();
    run(EAS_CLI[0], startCommand, { timeout: 300000 });
    sessionStarted = true;
    simulatorStatus = waitForSimulator();

    agentDevice(["install-from-source", artifactUrl, "--platform", "ios"], 600000);
    agentDevice(["open", readiness.bundleId || BUNDLE_ID, "--platform", "ios"]);
    sleep(3000);

    mkdirSync(outputRoot, { recursive: true });
    const entries = [];
    const generatedAt = new Date().toISOString();
    for (const target of targets) {
      if (!target.deepLink) throw new Error(`Missing deep link for ${target.captureId}`);
      agentDevice(["open", target.deepLink, "--platform", "ios"]);
      sleep(waitMs);
      const screenshotPath = join(outputRoot, target.filename);
      mkdirSync(dirname(screenshotPath), { recursive: true });
      agentDevice(["screenshot", screenshotPath], 120000);
      const entry = {
        filename: target.filename,
        captureId: target.captureId,
        device: "eas-simulator",
        buildNumber: "eas-simulator-artifact",
        source: "remote-eas-simulator",
        requiredProof: target.requiredProof || "",
        status: "captured",
        bytes: statSync(screenshotPath).size,
        sha256: sha256File(screenshotPath),
        path: screenshotPath,
        config: target.config || {},
        generatedAt,
      };
      writeFileSync(join(outputRoot, `${target.captureId}.json`), `${JSON.stringify(entry, null, 2)}\n`);
      entries.push(entry);
    }

    const manifest = {
      generatedAt,
      release: "Back to School with AI",
      outputRoot,
      bundleId: readiness.bundleId || BUNDLE_ID,
      device: "eas-simulator",
      source: "remote-eas-simulator",
      artifact: artifactEvidence(artifactUrl),
      screenshotCount: entries.length,
      nativeWidgetPlacement: {
        status: "manual_native_capture_required",
        note: "Home Screen and Lock Screen WidgetKit placements are still captured outside this in-app route runner.",
      },
      entries,
    };
    writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    writeAudit("captured", readiness, {
      manifest: join(outputRoot, "manifest.json"),
      screenshotCount: entries.length,
      simulator: {
        status: simulatorStatus.status,
        webPreviewUrlPresent: Boolean(simulatorStatus.webPreviewUrl),
        jobRunUrlPresent: Boolean(simulatorStatus.jobRunUrl),
      },
    });
    console.log(`Captured ${entries.length} Back-to-School remote simulator screenshots in ${outputRoot}.`);
  } catch (error) {
    writeAudit("failed", readiness, {
      error: error instanceof Error ? error.message : String(error),
      simulator: {
        status: simulatorStatus.status,
        webPreviewUrlPresent: Boolean(simulatorStatus.webPreviewUrl),
        jobRunUrlPresent: Boolean(simulatorStatus.jobRunUrl),
      },
    });
    throw error;
  } finally {
    if (sessionStarted) {
      try {
        run(EAS_CLI[0], [...EAS_CLI.slice(1), "simulator:stop"], { timeout: 120000 });
      } finally {
        resetSimulatorEnv();
      }
    }
  }
}

function main() {
  const readiness = readJson<RemoteCaptureReadiness>(READINESS_PATH, {});
  const blockers = validateReadiness(readiness);
  if (blockers.length > 0) {
    writeAudit("blocked_by_readiness", readiness, { blockers });
    console.error("Back-to-School remote capture blocked:");
    blockers.forEach((blocker) => console.error(`- ${blocker}`));
    process.exit(1);
  }

  if (!runRequested) {
    writeAudit("dry_run_ready", readiness, {
      note: "Dry run only. Add --run and --artifact-url, or set STUDYPLANNER_EAS_SIM_ARTIFACT_URL, to start EAS Simulator.",
    });
    console.log(`Back-to-School remote capture dry run wrote ${RUN_AUDIT_PATH}.`);
    return;
  }

  if (!/^https?:\/\//.test(artifactUrl)) {
    writeAudit("blocked_missing_artifact_url", readiness, {
      blocker: "Provide a simulator build artifact URL with --artifact-url or STUDYPLANNER_EAS_SIM_ARTIFACT_URL before starting EAS Simulator.",
    });
    console.error("Back-to-School remote capture blocked: missing simulator artifact URL.");
    process.exit(1);
  }

  capture(readiness);
}

main();
