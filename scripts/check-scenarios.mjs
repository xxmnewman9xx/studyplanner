import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const readIfExists = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
};
const app = read("App.tsx");
const onboarding = read("src/screens/OnboardingScreen.tsx");
const paywall = read("src/screens/UpgradeScreen.tsx");
const more = read("src/screens/MoreScreen.tsx");
const components = read("src/components/AppleComponents.tsx");
const planner = read("src/logic/planner.ts");
const nativeWidgetLayout = read("src/widgets/StudyPlannerWidgets.tsx");
const todayWidgetSwift = readIfExists("ios/ExpoWidgetsTarget/StudyPlannerTodayWidget.swift");
const upcomingWidgetSwift = readIfExists("ios/ExpoWidgetsTarget/StudyPlannerUpcomingWidget.swift");
const weekWidgetSwift = readIfExists("ios/ExpoWidgetsTarget/StudyPlannerWeekWidget.swift");
const classProgressWidgetSwift = readIfExists("ios/ExpoWidgetsTarget/StudyPlannerClassProgressWidget.swift");
const expoWidgetsProvider = read("node_modules/expo-widgets/ios/Widgets/TimelineProvider.swift");
const expoWidgetsEntryView = read("node_modules/expo-widgets/ios/Widgets/EntryView.swift");
const appJson = read("app.json");
const today = read("src/screens/TodayScreen.tsx");
const coreActions = read("src/core/actions.ts");
const coreStorage = read("src/core/storage.ts");
const coreSampleData = read("src/core/sampleData.ts");
const reviewPrompt = read("src/services/reviewPrompt.ts");
const defaultPlanner = read("src/data/defaultPlanner.ts");
const oldNoCostPrefix = "fr" + "ee";

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const requiredScenarioFields = ["id", "app", "persona", "risk", "state", "trigger", "expected", "automation", "evidence"];
const allowedRisks = new Set(["trust", "conversion", "clarity", "retention", "revenue", "shipping"]);
const allowedAutomation = new Set(["static", "unit", "integration", "simulator", "manual"]);
const requiredScenarioIds = [
  "sp-hard-paywall-after-onboarding",
  "sp-hard-paywall-store-state",
  "sp-subscription-tab-surface",
  "sp-first-run-empty",
  "sp-scan-review-handoff",
  "sp-capture-camera-parser-truth",
  "sp-brain-core-loop-truth",
  "sp-no-fake-widgets",
  "sp-review-prompt-value-only",
  "sp-minimal-white-icon"
];

const scenarioPath = path.join(root, "qa-scenarios", "studyplanner.scenarios.json");
const schemaPath = path.join(root, "qa-scenarios", "schema.json");
assert(fs.existsSync(schemaPath), "Golden scenario schema is missing.");
assert(fs.existsSync(scenarioPath), "Golden StudyPlanner scenario file is missing.");

if (fs.existsSync(scenarioPath)) {
  const scenarios = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  const ids = new Set();
  assert(scenarios.length >= 8, "StudyPlanner scenario bible needs at least 8 core customer scenarios.");

  for (const scenario of scenarios) {
    for (const field of requiredScenarioFields) {
      assert(Object.prototype.hasOwnProperty.call(scenario, field), `${scenario.id || "unknown"} missing ${field}.`);
    }
    assert(!ids.has(scenario.id), `Duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    assert(scenario.app === "StudyPlanner", `${scenario.id} must target StudyPlanner.`);
    assert(allowedRisks.has(scenario.risk), `${scenario.id} has unsupported risk: ${scenario.risk}`);
    assert(allowedAutomation.has(scenario.automation), `${scenario.id} has unsupported automation: ${scenario.automation}`);
    assert(Array.isArray(scenario.expected) && scenario.expected.length >= 2, `${scenario.id} needs at least two expected outcomes.`);
    assert(Array.isArray(scenario.evidence) && scenario.evidence.length >= 1, `${scenario.id} needs evidence hooks.`);
  }

  for (const id of requiredScenarioIds) {
    assert(ids.has(id), `Missing required StudyPlanner scenario: ${id}`);
  }
}

assert(!app.includes("starterCourseLimit") && !app.includes("starterAssignmentLimit") && !app.includes("starterImportLimit"), "Runtime source must not keep feature-level starter limit gates.");
assert(!app.includes(`${oldNoCostPrefix}CourseLimit`) && !app.includes(`${oldNoCostPrefix}AssignmentLimit`) && !app.includes(`${oldNoCostPrefix}ImportLimit`), "Runtime source must not keep old bypass-plan identifiers.");
assert(app.includes("requiresPremiumRoute(next)") && app.includes('route === "scanner"') && app.includes('route === "studio"'), "Main app premium routes should be guarded by hard paywall entitlement.");
assert(app.includes('labelKey: "tabs.home"') && app.includes('labelKey: "tabs.schedule"') && app.includes('labelKey: "tabs.tasks"') && app.includes('labelKey: "tabs.notes"') && app.includes("labelForTab(tab.id, t)") && app.includes('["plannerReview", "scanner"'), "Tab bar and quick actions must expose the current Home, Schedule, Tasks, Notes, Scan, and Widgets structure.");
assert(!app.includes("importLimitLocked"), "Import should not keep feature-level paid blockers after the hard paywall.");
assert(app.includes("SubscribeScreen") && app.includes("useSubscription") && app.includes('"subscribe"'), "Onboarding and premium routes must land on a hard subscription paywall after value previews.");
assert(app.includes("SkeletonBar") && app.includes("skeletonStack"), "App loading must use a real skeleton loader, not only a spinner.");
assert(!app.includes("Linking.addEventListener") || app.includes('url.includes("expo-development-client")'), "Dev-client URLs must not trip production deeplink tab routing.");
assert(!paywall.includes(`Continue ${oldNoCostPrefix} to Scan`), "Hard paywall must not expose a planner bypass.");
assert(app.includes('go(nextTask ? "tasks" : focusClass ? "noteEditor" : "scanner")'), "Scan starter CTA should route to scan/import.");
assert(app.includes("Build your semester") && app.includes("Scan a syllabus or add the first class."), "Empty dashboard should teach the first action, not claim the user is caught up.");
assert(app.includes("Due today") && app.includes("Pulse") && app.includes("Catch-up Queue"), "Today should expose the current dashboard jobs without dense legacy cards.");
assert(app.includes("actions.updateClassReminder") && app.includes('accessibilityLabel="Open calendar"'), "Today must preserve reminder and calendar action plumbing in the native shell.");
assert(coreSampleData.includes("parsedImports: []") && coreSampleData.includes("parsedItems: []"), "Normal first-run parser state must be empty.");
assert(coreSampleData.includes("activeParseResult: null") && coreSampleData.includes("noteScanDrafts: []"), "Normal first-run scanner drafts must be empty.");
assert(coreStorage.includes("parsedImports: Array.isArray(parsedImportRecord?.parsedImports) ? parsedImportRecord.parsedImports : fallback.parsedImports"), "Stored parsed imports should not fall back to demo imports.");
assert(!coreStorage.includes("focusSessions") && !coreSampleData.includes("focusSessions"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Your whole") && onboarding.includes("Scan my syllabus") && !onboarding.includes("persona"), "Onboarding must match the locked prototype and avoid old persona/setup packs.");
assert(onboarding.includes("onFinish(\"paywall\"") && onboarding.includes("defaultWidgetStyle: \"glass\""), "Onboarding must hand off to the hard paywall with prototype settings.");
assert(!onboarding.includes("classColorsGenerated") && !onboarding.includes("add_manually"), "Onboarding must not preserve old manual setup packs or generated-class-color setup language.");
assert(paywall.includes("dashboard_ready_subtitle") && paywall.includes("Stay ahead all") && paywall.includes("Unlimited syllabus scans"), "Hard paywall must sell the locked semester dashboard after value.");
assert(paywall.includes("useSubscription") && paywall.includes("subscription.purchase"), "Paywall must still rely on the IAP subscription hook.");
assert(paywall.includes("Cancel anytime") && !paywall.includes("Continue free to Scan"), "Paywall must avoid bypass language while keeping purchase terms visible.");
assert(coreActions.includes("applyParsedSyllabus") && coreActions.includes('scannerState: {') && coreActions.includes('status: "complete"'), "Scan/import should update the active planner after value is created.");
assert(app.includes("actions.upsertParsedImport") && app.includes("actions.upsertParsedItemsForImport"), "Capture parser should persist import sessions and parsed rows before Add All.");
assert(read("src/screens/ImportScreen.tsx").includes("parseCapturedSource") && read("src/screens/ImportScreen.tsx").includes("onUpsertParsedItemsForImport"), "Capture screen should persist parser sessions and parsed rows through the real parser contract.");
assert(read("src/services/parserContract.ts").includes("createParsedImportFromCameraAsset") && read("src/services/parserContract.ts").includes("normalizeParsedItems"), "Capture parser contract should cover camera, document, typed, normalization, and review flags.");
assert(reviewPrompt.includes("assignment_completed") && reviewPrompt.includes("focus_completed") && reviewPrompt.includes("widget_saved"), "Review prompt policy should stay value-gated.");
assert(app.includes("syncCorePlannerWidgets") && app.includes("nativeWidgetStatus"), "Native widget snapshots should refresh from real planner persistence.");
assert(more.includes("WidgetPreview") && more.includes("Exam Countdown") && more.includes("Next Assignment") && more.includes("Semester Pulse"), "Widget surface should be a Home Screen builder with live preview.");
assert(more.includes("more.widget_gallery_add_instructions") && more.includes("Preview-only until the native widget bridge reports synced."), "Widget Studio should be honest about WidgetKit bridge reality.");
assert(!more.includes("stageWallpaper") && !more.includes("Pink Glass") && !more.includes("Minimal Cream") && !more.includes("Widget" + " Studio"), "Recommended Widgets must not expose theme-store/editor complexity.");
assert(!more.includes("top-20") && !more.includes("active in this studio") && !more.includes("3/6 ready") && !more.includes("Studio state"), "Recommended Widgets must not expose internal QA scoring language.");
assert(planner.includes('headline: "Upcoming"') && planner.includes('headline: "Today"') && planner.includes("Class Progress"), "Widget data labels should match student-outcome templates.");
assert(more.includes("Exam countdown") || more.includes("Next Assignment") || more.includes("Semester Pulse"), "Recommended Widgets should use actionable student-outcome labels.");
assert(!more.includes("Deadline Map") && !more.includes("Class Risk") && !more.includes("Focus Block"), "Recommended Widgets should not keep stale decorative widget labels.");
assert(!more.includes("Algebra II - Worksheet") && !more.includes("Week 11") && !more.includes("Wednesday, May 13"), "Widget surface must not show fake sample school data.");
assert(!components.includes("May 13") && !components.includes('"2h"'), "Widget preview components must not hard-code fake dates or fake due times.");
assert(more.includes("Save preview") && more.includes("StudyPlannerWeekWidget") === false, "Widget Studio should save preview configuration without subscription wording in the primary flow.");
assert(defaultPlanner.includes("defaultWidgetPresets"), "Default widget presets may exist for data compatibility, but UI must not imply native support.");
assert(
  todayWidgetSwift
    ? todayWidgetSwift.includes('let name: String = "studyplanner.today"') && todayWidgetSwift.includes(".systemSmall, .systemMedium") && todayWidgetSwift.includes(".accessoryInline")
    : appJson.includes('"kind": "studyplanner.today"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Today native widget should use the stable StudyPlanner Today kind with Home Screen and Lock Screen families."
);
assert(
  upcomingWidgetSwift
    ? upcomingWidgetSwift.includes('let name: String = "studyplanner.upcoming"') && upcomingWidgetSwift.includes(".systemSmall, .systemMedium") && upcomingWidgetSwift.includes(".accessoryInline")
    : appJson.includes('"kind": "studyplanner.upcoming"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Upcoming native widget should use the stable StudyPlanner Upcoming kind with Home Screen and Lock Screen families."
);
assert(
  weekWidgetSwift
    ? weekWidgetSwift.includes('let name: String = "studyplanner.week"') && weekWidgetSwift.includes(".systemMedium") && !weekWidgetSwift.includes(".systemSmall") && weekWidgetSwift.includes(".accessoryInline")
    : appJson.includes('"kind": "studyplanner.week"') && appJson.includes('"systemMedium"'),
  "Week native widget should use the stable StudyPlanner Week kind with medium Home Screen and Lock Screen families."
);
assert(
  classProgressWidgetSwift
    ? classProgressWidgetSwift.includes('let name: String = "studyplanner.classProgress"') && classProgressWidgetSwift.includes(".systemSmall, .systemMedium") && classProgressWidgetSwift.includes(".accessoryInline")
    : appJson.includes('"kind": "studyplanner.classProgress"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Class Progress native widget should use the stable StudyPlanner Class Progress kind with Home Screen and Lock Screen families."
);
assert(expoWidgetsProvider.includes("parseTimeline") && expoWidgetsEntryView.includes("WidgetsStorage.getString"), "Expo widget runtime should read App Group timeline/layout storage.");
assert(nativeWidgetLayout.includes('environment.widgetFamily === "systemMedium"') && nativeWidgetLayout.includes('environment.widgetFamily === "accessoryInline"'), "Native widget layout should render Home Screen widgets and Lock Screen accessory widgets.");
assert(appJson.includes("accessoryCircular") && appJson.includes("accessoryRectangular") && appJson.includes("accessoryInline"), "Widget metadata must truthfully claim supported Lock Screen accessory families.");
assert(appJson.includes('"./plugins/with-widgetkit-kinds"'), "EAS prebuild should patch generated WidgetKit Swift to use stable studyplanner.* kinds.");
assert(fs.existsSync(path.join(root, "assets/app/study-planner-icon.png")), "StudyPlanner icon asset must exist.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
