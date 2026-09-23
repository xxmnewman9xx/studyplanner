import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type CheckStatus = "ready" | "blocked";

type PreflightCheck = {
  id: string;
  status: CheckStatus;
  evidence: string;
  blocker?: string;
};

const OUTPUT_PATH = "qa/back-to-school-2026/native-capture-preflight.json";
const WORKSPACE_PATH = "ios/StudyPlannerSyllabusAI.xcworkspace";
const SCHEME = "StudyPlannerSyllabusAI";
const WIDGET_TARGET = "ExpoWidgetsTarget";
const MIN_FREE_GIB = 15;

function command(commandName: string, args: string[]) {
  try {
    return execFileSync(commandName, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr || "") : "";
    const stdout = error && typeof error === "object" && "stdout" in error ? String(error.stdout || "") : "";
    return `${stdout}\n${stderr}`.trim();
  }
}

function dfFreeGib() {
  const output = command("df", ["-k", "."]);
  const [, dataLine = ""] = output.split("\n");
  const columns = dataLine.trim().split(/\s+/);
  const availableKilobytes = Number(columns[3] || 0);
  return {
    output,
    freeGib: availableKilobytes / 1024 / 1024,
  };
}

function status(condition: boolean): CheckStatus {
  return condition ? "ready" : "blocked";
}

function findBootedIos26Simulator(simulatorOutput: string) {
  let currentRuntime = "";
  for (const rawLine of simulatorOutput.split("\n")) {
    const line = rawLine.trim();
    const runtimeMatch = line.match(/^--\s+(.+?)\s+--$/);
    if (runtimeMatch) {
      currentRuntime = runtimeMatch[1] || "";
      continue;
    }
    if (currentRuntime.startsWith("iOS 26") && line.includes("(Booted)")) {
      return `${currentRuntime}: ${line}`;
    }
  }
  return "";
}

const disk = dfFreeGib();
const xcodeVersion = command("xcodebuild", ["-version"]);
const workspaceExists = existsSync(WORKSPACE_PATH);
const xcodeList = workspaceExists ? command("xcodebuild", ["-list", "-workspace", WORKSPACE_PATH]) : "";
const simulatorList = command("xcrun", ["simctl", "list", "devices", "available"]);

const hasXcode = xcodeVersion.includes("Xcode");
const hasScheme = xcodeList.includes(SCHEME);
const hasWidgetTarget = xcodeList.includes(WIDGET_TARGET);
const bootedIos26Simulator = findBootedIos26Simulator(simulatorList);
const hasBootedSimulator = Boolean(bootedIos26Simulator);
const hasEnoughDisk = disk.freeGib >= MIN_FREE_GIB;

const checks: PreflightCheck[] = [
  {
    id: "disk",
    status: status(hasEnoughDisk),
    evidence: `${disk.freeGib.toFixed(1)} GiB free; minimum ${MIN_FREE_GIB} GiB recommended before Xcode build/capture.`,
    blocker: hasEnoughDisk ? undefined : "Free local disk before rerunning the native simulator build.",
  },
  {
    id: "xcode",
    status: status(hasXcode),
    evidence: xcodeVersion || "xcodebuild -version produced no output.",
    blocker: hasXcode ? undefined : "Install or select Xcode before native capture.",
  },
  {
    id: "workspace",
    status: status(workspaceExists),
    evidence: workspaceExists ? WORKSPACE_PATH : `${WORKSPACE_PATH} is missing.`,
    blocker: workspaceExists ? undefined : "Regenerate or restore the iOS workspace.",
  },
  {
    id: "scheme",
    status: status(hasScheme),
    evidence: hasScheme ? `Scheme found: ${SCHEME}` : `Scheme not found in ${WORKSPACE_PATH}.`,
    blocker: hasScheme ? undefined : "Fix the Xcode workspace/scheme before native capture.",
  },
  {
    id: "widget-target",
    status: status(hasWidgetTarget),
    evidence: hasWidgetTarget ? `Widget target found: ${WIDGET_TARGET}` : `Widget target not found: ${WIDGET_TARGET}.`,
    blocker: hasWidgetTarget ? undefined : "Fix the widget target before WidgetKit screenshot capture.",
  },
  {
    id: "simulator",
    status: status(hasBootedSimulator),
    evidence: bootedIos26Simulator || "No booted iOS 26 simulator found.",
    blocker: hasBootedSimulator ? undefined : "Boot an iOS 26 simulator before validating Liquid Glass and WidgetKit captures.",
  },
];

const captureReady = checks.every((check) => check.status === "ready");
const blockers = checks
  .filter((check) => check.status === "blocked")
  .map((check) => `${check.id}: ${check.blocker || check.evidence}`);
const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status: captureReady ? "ready" : "blocked",
  captureReady,
  minFreeDiskGib: MIN_FREE_GIB,
  checks,
  blockers,
  nextCommandWhenReady:
    `xcodebuild -workspace ${WORKSPACE_PATH} -scheme ${SCHEME} -configuration Debug ` +
    "-destination 'platform=iOS Simulator,name=Reflex QA iPhone 17' " +
    "-derivedDataPath ios/build/BackToSchoolDerivedData build",
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (captureReady) {
  console.log(`Back-to-School native capture preflight ready. Wrote ${OUTPUT_PATH}.`);
} else {
  console.log(`Back-to-School native capture preflight blocked. Wrote ${OUTPUT_PATH}.`);
  for (const check of checks.filter((item) => item.status === "blocked")) {
    console.log(`- ${check.id}: ${check.blocker}`);
  }
}
