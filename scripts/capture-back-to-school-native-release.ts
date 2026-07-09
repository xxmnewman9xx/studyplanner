import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type CaptureConfig = {
  route?: string;
  tab?: string;
  screen?: string;
  onboardingIndex?: number;
  emptyPlanner?: boolean;
  qaState?: "build57" | "build66";
  semesterThemeColorId?: "blue" | "green" | "orange" | "purple" | "pink" | "graphite";
  themeMode?: "light" | "dark";
  widgetType?: string;
  widgetSize?: string;
  widgetDataMode?: string;
  locale?: string;
};

type CaptureTarget = {
  captureId: string;
  filename: string;
  requiredProof: string;
  appearance: string;
  locale: string;
  accessibilitySettings: string;
  sourceStateFixture: string;
  reviewerNotes: string;
  config: CaptureConfig;
};

const OUTPUT_ROOT = "qa-screenshots/back-to-school-2026-native";
const RUN_AUDIT_PATH = "qa/back-to-school-2026/native-capture-run.json";
const WORKSPACE_PATH = "ios/StudyPlannerSyllabusAI.xcworkspace";
const SCHEME = "StudyPlannerSyllabusAI";
const BUILD_CONFIGURATION = process.env.STUDYPLANNER_NATIVE_BUILD_CONFIGURATION || "Release";
const DERIVED_DATA_PATH = "ios/build/BackToSchoolDerivedData";
const BUNDLE_ID = process.env.STUDYPLANNER_BUNDLE_ID || "com.mattnewman.studyplanner";
const CAPTURE_FILE = "studyplanner-capture-tab.json";
const MIN_FREE_GIB = 15;
const ALL_LOCALES = [
  "en-US",
  "en-CA",
  "en-GB",
  "en-AU",
  "de-DE",
  "es-ES",
  "es-MX",
  "fr-FR",
  "fr-CA",
  "pt-BR",
  "pt-PT",
  "ar-SA",
  "hi",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
];

const targets: CaptureTarget[] = [
  {
    captureId: "app-00-scan-current",
    filename: "app-00-scan-current.png",
    requiredProof: "Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 active semester scan route fixture",
    reviewerNotes: "Latest Scan route, not the older onboarding build-step screen.",
    config: { qaState: "build57", tab: "import", semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-01-name",
    filename: "app-01-name.png",
    requiredProof: "First screen starts the semester setup story.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "empty planner onboarding name step",
    reviewerNotes: "Default white system with automatic class colors, first launch.",
    config: { route: "onboarding", emptyPlanner: true, onboardingIndex: 0, semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-02-color-blue",
    filename: "app-02-color-blue.png",
    requiredProof: "Personal white semester preview with automatic class colors is immersive and readable.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "empty planner onboarding personal preview step",
    reviewerNotes: "White system with automatic class colors applied by default.",
    config: { route: "onboarding", emptyPlanner: true, onboardingIndex: 1, semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-03-color-orange",
    filename: "app-03-color-orange.png",
    requiredProof: "Personal preview stays minimal without a color customization control.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "empty planner onboarding personal preview step",
    reviewerNotes: "White system and automatic class colors remain stable.",
    config: { route: "onboarding", emptyPlanner: true, onboardingIndex: 1, semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-04-color-graphite",
    filename: "app-04-color-graphite.png",
    requiredProof: "White Apple-style system with automatic class colors is polished and accessible.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "empty planner onboarding personal preview step",
    reviewerNotes: "Graphite system is the only visible setup style.",
    config: { route: "onboarding", emptyPlanner: true, onboardingIndex: 1, semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-05-import-choice",
    filename: "app-05-import-choice.png",
    requiredProof: "Camera, paste, and manual setup options are visible.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "empty planner onboarding build step",
    reviewerNotes: "Simple build step after personal preview.",
    config: { route: "onboarding", emptyPlanner: true, onboardingIndex: 2, semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-06-review",
    filename: "app-06-review.png",
    requiredProof: "Student reviews detected courses, deadlines, exams, and uncertain dates before save.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 reviewed import fixture",
    reviewerNotes: "Review-before-save proof.",
    config: { qaState: "build57", screen: "review_edit", semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-07-semester-ready",
    filename: "app-07-semester-ready.png",
    requiredProof: "Semester Pulse, next move, first focus block, and widget recommendation are visible.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 import success fixture",
    reviewerNotes: "Post-apply payoff.",
    config: { qaState: "build57", route: "success", semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-08-today",
    filename: "app-08-today.png",
    requiredProof: "Dashboard feels semester-ready, not like a generic task list.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 today fixture",
    reviewerNotes: "Active semester Home/Today state.",
    config: { qaState: "build57", route: "today", semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-09-focus",
    filename: "app-09-focus.png",
    requiredProof: "The first study block is actionable and not cramming-oriented.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 focus fixture",
    reviewerNotes: "Focus route.",
    config: { qaState: "build57", tab: "focus", semesterThemeColorId: "graphite" },
  },
  {
    captureId: "app-10-widgets",
    filename: "app-10-widgets.png",
    requiredProof: "Semester Calendar is presented as the recommended Home Screen surface.",
    appearance: "light",
    locale: "en-US",
    accessibilitySettings: "default",
    sourceStateFixture: "build57 widget recommendation fixture",
    reviewerNotes: "In-app widget recommendation; real WidgetKit placement remains separate.",
    config: { qaState: "build57", tab: "more", semesterThemeColorId: "graphite", widgetType: "week", widgetSize: "medium", widgetDataMode: "this_week" },
  },
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipBuild = args.has("--skip-build");
const device = valueArg("--device") || process.env.STUDYPLANNER_SIMULATOR || "booted";
const outputRoot = valueArg("--out") || OUTPUT_ROOT;
const waitMs = Number(valueArg("--wait-ms") || process.env.STUDYPLANNER_SIM_CAPTURE_WAIT_MS || 7000);
const selectedLocales = parseListArg("--locales", ["en-US"]);
const selectedIds = parseListArg("--ids", []);
const nestedLocaleOutput = selectedLocales.length > 1 || Boolean(valueArg("--locales"));

function valueArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function parseListArg(name: string, fallback: string[]) {
  const value = valueArg(name);
  if (!value) return fallback;
  if (value === "all") return ALL_LOCALES;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function selectedTargets() {
  const idSet = new Set(selectedIds);
  const baseTargets = selectedIds.length ? targets.filter((target) => idSet.has(target.captureId)) : targets;
  return selectedLocales.flatMap((locale) =>
    baseTargets.map((target) => ({
      ...target,
      locale,
      filename: nestedLocaleOutput ? join(locale, target.filename) : target.filename,
      config: { ...target.config, locale },
    })),
  );
}

function run(commandName: string, commandArgs: string[], options: { capture?: boolean; optional?: boolean } = {}) {
  try {
    const output = execFileSync(commandName, commandArgs, {
      encoding: "utf8",
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    return typeof output === "string" ? output.trim() : "";
  } catch (error) {
    if (options.optional) return "";
    throw error;
  }
}

function runBuild(commandArgs: string[]) {
  const result = spawnSync(commandArgs[0], commandArgs.slice(1), {
    stdio: "inherit",
    encoding: "utf8",
    env: {
      ...process.env,
      EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA: process.env.EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA || "1",
    },
  });
  if (result.status !== 0) {
    throw new Error(`${commandArgs[0]} exited ${result.status}`);
  }
}

function freeDiskGib() {
  const output = execFileSync("df", ["-k", "."], { encoding: "utf8" });
  const [, dataLine = ""] = output.split("\n");
  const columns = dataLine.trim().split(/\s+/);
  return Number(columns[3] || 0) / 1024 / 1024;
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function sha256File(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function findApp(root: string): string {
  const entries = readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(root, entry.name);
    if (entry.isDirectory() && entry.name.endsWith(".app")) return child;
    if (entry.isDirectory()) {
      const nested = findApp(child);
      if (nested) return nested;
    }
  }
  return "";
}

function writeRunAudit(payload: unknown) {
  mkdirSync(dirname(RUN_AUDIT_PATH), { recursive: true });
  writeFileSync(RUN_AUDIT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function capturePlanPayload(status: string, extra: Record<string, unknown> = {}) {
  const plannedTargets = selectedTargets();
  return {
    generatedAt: new Date().toISOString(),
    release: "Back to School with AI",
    status,
    dryRun,
    skipBuild,
    device,
    bundleId: BUNDLE_ID,
    outputRoot,
    waitMs,
    buildConfiguration: BUILD_CONFIGURATION,
    localeCount: selectedLocales.length,
    selectedLocales,
    selectedIds,
    targetCount: plannedTargets.length,
    targets: plannedTargets.map(({ captureId, filename, locale, requiredProof, config }) => ({ captureId, filename, locale, requiredProof, config })),
    nativeWidgetPlacement: {
      status: "manual_native_capture_required",
      note: "This runner captures deterministic in-app release UI. Home Screen and Lock Screen WidgetKit placements still require native placement screenshots.",
    },
    ...extra,
  };
}

function main() {
  const freeGib = freeDiskGib();
  if (dryRun) {
    writeRunAudit(capturePlanPayload("dry_run_ready", { freeDiskGib: Number(freeGib.toFixed(1)) }));
    console.log(`Back-to-School native capture dry run wrote ${RUN_AUDIT_PATH}.`);
    return;
  }

  if (!skipBuild && freeGib < MIN_FREE_GIB) {
    writeRunAudit(capturePlanPayload("blocked_by_preflight", {
      blocker: `Only ${freeGib.toFixed(1)} GiB free; ${MIN_FREE_GIB} GiB is required before Xcode build/capture.`,
    }));
    console.log(`Back-to-School native capture blocked by disk. Wrote ${RUN_AUDIT_PATH}.`);
    return;
  }

  if (!skipBuild) {
    runBuild([
      "xcodebuild",
      "-workspace",
      WORKSPACE_PATH,
      "-scheme",
      SCHEME,
      "-configuration",
      BUILD_CONFIGURATION,
      "-destination",
      device === "booted" ? "generic/platform=iOS Simulator" : `id=${device}`,
      "-derivedDataPath",
      DERIVED_DATA_PATH,
      "build",
    ]);
    const productsPath = join(DERIVED_DATA_PATH, "Build", "Products", `${BUILD_CONFIGURATION}-iphonesimulator`);
    const appPath = findApp(productsPath);
    if (!appPath || !existsSync(appPath)) throw new Error(`Built .app not found under ${productsPath}`);
    run("xcrun", ["simctl", "install", device, appPath]);
  }

  mkdirSync(outputRoot, { recursive: true });
  run("xcrun", ["simctl", "status_bar", device, "override", "--time", "9:41", "--wifiBars", "3", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100"], { optional: true });
  const dataRoot = run("xcrun", ["simctl", "get_app_container", device, BUNDLE_ID, "data"], { capture: true });
  const documentsDir = join(dataRoot, "Documents");
  mkdirSync(documentsDir, { recursive: true });

  const captureTargets = selectedTargets();
  const entries = [];
  const generatedAt = new Date().toISOString();
  for (const target of captureTargets) {
    writeFileSync(join(documentsDir, CAPTURE_FILE), `${JSON.stringify(target.config, null, 2)}\n`);
    run("xcrun", ["simctl", "terminate", device, BUNDLE_ID], { optional: true });
    run("xcrun", ["simctl", "launch", device, BUNDLE_ID]);
    sleep(waitMs);
    const screenshotPath = join(outputRoot, target.filename);
    mkdirSync(dirname(screenshotPath), { recursive: true });
    run("xcrun", ["simctl", "io", device, "screenshot", screenshotPath]);
    const entry = {
      filename: target.filename,
      captureId: target.captureId,
      device,
      buildNumber: `${BUILD_CONFIGURATION.toLowerCase()}-simulator`,
      buildConfiguration: BUILD_CONFIGURATION,
      appearance: target.appearance,
      locale: target.locale,
      accessibilitySettings: target.accessibilitySettings,
      sourceStateFixture: target.sourceStateFixture,
      reviewerNotes: target.reviewerNotes,
      requiredProof: target.requiredProof,
      status: "captured",
      bytes: statSync(screenshotPath).size,
      sha256: sha256File(screenshotPath),
      path: screenshotPath,
      config: target.config,
      generatedAt,
    };
    const entryPath = nestedLocaleOutput ? join(outputRoot, target.locale, `${target.captureId}.json`) : join(outputRoot, `${target.captureId}.json`);
    mkdirSync(dirname(entryPath), { recursive: true });
    writeFileSync(entryPath, `${JSON.stringify(entry, null, 2)}\n`);
    entries.push(entry);
  }

  const manifest = {
    generatedAt,
    release: "Back to School with AI",
    outputRoot,
    bundleId: BUNDLE_ID,
    device,
    screenshotCount: entries.length,
    localeCount: selectedLocales.length,
    nativeWidgetPlacement: {
      status: "manual_native_capture_required",
      note: "Home Screen and Lock Screen WidgetKit placements are still captured outside this in-app route runner.",
    },
    entries,
  };
  writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeRunAudit(capturePlanPayload("captured", { manifest: join(outputRoot, "manifest.json"), screenshotCount: entries.length }));
  console.log(`Captured ${entries.length} Back-to-School native app screenshots in ${outputRoot}.`);
}

main();
