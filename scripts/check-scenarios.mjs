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
assert(app.includes("const visibleTabs = proTabs"), "Main app navigation should be available only after hard paywall entitlement/capture conditions.");
assert(app.includes('labelKey: "tabs.home"') && app.includes('labelKey: "tabs.scan"') && app.includes('labelKey: "tabs.plan"') && app.includes('labelKey: "tabs.classes"') && app.includes('labelKey: "tabs.widgets"') && app.includes("labelForTab(tab.id, t)"), "Tab bar must use the prototype Home, Scan, Plan, Classes, and Widgets structure.");
assert(!app.includes("importLimitLocked"), "Import should not keep feature-level paid blockers after the hard paywall.");
assert(app.includes("setPaywallSeen(false);") && app.includes("<UpgradeScreen hardMode />"), "Onboarding must route to a hard subscription paywall after value previews.");
assert(app.includes("SkeletonBar") && app.includes("skeletonStack"), "App loading must use a real skeleton loader, not only a spinner.");
assert(app.includes('url.includes("expo-development-client")'), "Dev-client URLs must not trip production deeplink tab routing.");
assert(!paywall.includes(`Continue ${oldNoCostPrefix} to Scan`), "Hard paywall must not expose a planner bypass.");
assert(today.includes('action={t("today.scan_syllabus", "Scan syllabus")}') && today.includes("onAction={onOpenScan}"), "Scan starter CTA should route to scan/import.");
assert(today.includes("No schoolwork added yet") && today.includes("Scan a syllabus to build your living semester dashboard"), "Empty Today should teach the first action, not claim the user is caught up.");
assert(today.includes("Next important thing") && today.includes("Semester Pulse") && today.includes("Focus suggestion"), "Today should expose the prototype dashboard jobs without dense legacy cards.");
assert(today.includes("onScheduleReminders") && today.includes("onCalendarSync"), "Today must preserve reminder and calendar action plumbing even when the prototype keeps them off the primary screen.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureCourses : []"), "Normal first-run courses must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureAssignments : []"), "Normal first-run assignments must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureGradeItems : []"), "Normal first-run grade items must be empty.");
assert(app.includes("setParsedImports(stored.parsedImports || [])"), "Stored parsed imports should not fall back to demo imports.");
assert(app.includes("setFocusSessions(stored.focusSessions || [])"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Your whole") && onboarding.includes("Scan my syllabus") && !onboarding.includes("persona"), "Onboarding must match the locked prototype and avoid old persona/setup packs.");
assert(onboarding.includes("onFinish(\"paywall\"") && onboarding.includes("defaultWidgetStyle: \"glass\""), "Onboarding must hand off to the hard paywall with prototype settings.");
assert(!onboarding.includes("classColorsGenerated") && !onboarding.includes("add_manually"), "Onboarding must not preserve old manual setup packs or generated-class-color setup language.");
assert(paywall.includes("dashboard_ready_subtitle") && paywall.includes("Stay ahead all") && paywall.includes("Unlimited syllabus scans"), "Hard paywall must sell the locked semester dashboard after value.");
assert(paywall.includes("useSubscription") && paywall.includes("subscription.purchase"), "Paywall must still rely on the IAP subscription hook.");
assert(paywall.includes("Cancel anytime") && !paywall.includes("Continue free to Scan"), "Paywall must avoid bypass language while keeping purchase terms visible.");
assert(app.includes("setImportHandoff") && app.includes("openTab(\"today\")") && app.includes('recordReviewEvent("import_applied")'), "Scan/import should hand off into Today after value is created.");
assert(app.includes("onUpsertParsedImport") && app.includes("onUpsertParsedItemsForImport"), "Capture parser should persist import sessions and parsed rows before Add All.");
assert(read("src/screens/ImportScreen.tsx").includes("parseCapturedSource") && read("src/screens/ImportScreen.tsx").includes("onUpsertParsedItemsForImport"), "Capture screen should persist parser sessions and parsed rows through the real parser contract.");
assert(read("src/services/parserContract.ts").includes("createParsedImportFromCameraAsset") && read("src/services/parserContract.ts").includes("normalizeParsedItems"), "Capture parser contract should cover camera, document, typed, normalization, and review flags.");
assert(reviewPrompt.includes("assignment_completed") && reviewPrompt.includes("focus_completed") && reviewPrompt.includes("widget_saved"), "Review prompt policy should stay value-gated.");
assert(app.includes("syncStudyPlannerWidgets") && app.includes("nativeWidgetStatus"), "Native widget snapshots should refresh from real planner persistence.");
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
    ? todayWidgetSwift.includes('let name: String = "studyplanner.today"') && todayWidgetSwift.includes(".systemSmall, .systemMedium") && !todayWidgetSwift.includes(".accessory")
    : appJson.includes('"kind": "studyplanner.today"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Today native widget should use the stable StudyPlanner Today kind and Home Screen families only."
);
assert(
  upcomingWidgetSwift
    ? upcomingWidgetSwift.includes('let name: String = "studyplanner.upcoming"') && upcomingWidgetSwift.includes(".systemSmall, .systemMedium") && !upcomingWidgetSwift.includes(".accessory")
    : appJson.includes('"kind": "studyplanner.upcoming"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Upcoming native widget should use the stable StudyPlanner Upcoming kind and Home Screen families only."
);
assert(
  weekWidgetSwift
    ? weekWidgetSwift.includes('let name: String = "studyplanner.week"') && weekWidgetSwift.includes(".systemMedium") && !weekWidgetSwift.includes(".systemSmall") && !weekWidgetSwift.includes(".accessory")
    : appJson.includes('"kind": "studyplanner.week"') && appJson.includes('"systemMedium"'),
  "Week native widget should use the stable StudyPlanner Week kind and medium Home Screen family only."
);
assert(
  classProgressWidgetSwift
    ? classProgressWidgetSwift.includes('let name: String = "studyplanner.classProgress"') && classProgressWidgetSwift.includes(".systemSmall, .systemMedium") && !classProgressWidgetSwift.includes(".accessory")
    : appJson.includes('"kind": "studyplanner.classProgress"') && appJson.includes('"systemSmall"') && appJson.includes('"systemMedium"'),
  "Class Progress native widget should use the stable StudyPlanner Class Progress kind and Home Screen families only."
);
assert(expoWidgetsProvider.includes("parseTimeline") && expoWidgetsEntryView.includes("WidgetsStorage.getString"), "Expo widget runtime should read App Group timeline/layout storage.");
assert(nativeWidgetLayout.includes('environment.widgetFamily === "systemMedium"'), "Native widget layout should render medium Home Screen widgets and default to compact small widgets.");
assert(!appJson.includes("accessoryCircular") && !appJson.includes("accessoryRectangular") && !appJson.includes("accessoryInline"), "Widget metadata must not claim unsupported Lock Screen accessory families.");
assert(appJson.includes('"./plugins/with-widgetkit-kinds"'), "EAS prebuild should patch generated WidgetKit Swift to use stable studyplanner.* kinds.");
assert(fs.existsSync(path.join(root, "assets/app/study-planner-icon.png")), "StudyPlanner icon asset must exist.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
