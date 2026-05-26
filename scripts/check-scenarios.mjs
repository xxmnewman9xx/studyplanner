import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const app = read("App.tsx");
const onboarding = read("src/screens/OnboardingScreen.tsx");
const upgrade = read("src/screens/UpgradeScreen.tsx");
const more = read("src/screens/MoreScreen.tsx");
const components = read("src/components/AppleComponents.tsx");
const planner = read("src/logic/planner.ts");
const nativeWidgetLayout = read("src/widgets/StudyPlannerWidgets.tsx");
const todayWidgetSwift = read("ios/ExpoWidgetsTarget/StudyPlannerTodayWidget.swift");
const upcomingWidgetSwift = read("ios/ExpoWidgetsTarget/StudyPlannerUpcomingWidget.swift");
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
  "sp-plus-tab-surface",
  "sp-first-run-empty",
  "sp-scan-review-handoff",
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

assert(app.includes("const starterCourseLimit = 2"), "Starter course limit constant should stay named without trial-plan language.");
assert(app.includes("const starterAssignmentLimit = 12"), "Starter assignment limit constant should stay named without trial-plan language.");
assert(app.includes("const starterImportLimit = 1"), "Starter import limit constant should stay named without trial-plan language.");
assert(!app.includes(`${oldNoCostPrefix}CourseLimit`) && !app.includes(`${oldNoCostPrefix}AssignmentLimit`) && !app.includes(`${oldNoCostPrefix}ImportLimit`), "Runtime source must not keep old bypass-plan identifiers.");
assert(app.includes('premiumTabs = new Set<NavTab>(["focus", "grades"])'), "Premium tab gate should focus on advanced Focus and Grades surfaces.");
assert(app.includes("const visibleTabs = proTabs"), "Main app navigation should be available only after hard paywall entitlement/capture conditions.");
assert(app.includes('labelKey: "tabs.scan"') && app.includes('labelKey: "tabs.calendar"') && app.includes('labelKey: "tabs.classes"') && app.includes('labelKey: "tabs.widgets"') && app.includes("t(tab.labelKey)"), "Tab bar must use runtime localized Scan, Calendar, Classes, and Widgets labels.");
assert(app.includes("importLimitLocked") && app.includes("starterImportLimit"), "Import monetization should stay bounded by paid entitlement logic.");
assert(app.includes("setPaywallSeen(false);") && app.includes("<UpgradeScreen hardMode />"), "Onboarding must route to a hard Plus paywall after value previews.");
assert(app.includes("SkeletonBar") && app.includes("skeletonStack"), "App loading must use a real skeleton loader, not only a spinner.");
assert(app.includes('url.includes("expo-development-client")'), "Dev-client URLs must not trip production deeplink tab routing.");
assert(!upgrade.includes(`Continue ${oldNoCostPrefix} to Scan`), "Hard paywall must not expose a planner bypass.");
assert(today.includes('label="Scan syllabus"') && today.includes("onPress={onOpenScan}"), "Scan starter CTA should route to scan/import.");
assert(today.includes("No schoolwork added yet") && today.includes("Scan a syllabus or add one class"), "Empty Today should teach the first action, not claim the user is caught up.");
assert(today.includes("onTryDemo") && today.includes("demoMode"), "Today should support a truthful demo path and demo banner.");
assert(today.includes('label="Set reminders"') && today.includes('label="Sync calendar"') && today.includes("premiumAutomationLocked ? onOpenPaywall : onScheduleReminders") && today.includes("premiumAutomationLocked ? onOpenPaywall : onCalendarSync"), "Today must expose real reminder and calendar actions.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureCourses : []"), "Normal first-run courses must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureAssignments : []"), "Normal first-run assignments must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureGradeItems : []"), "Normal first-run grade items must be empty.");
assert(app.includes("setParsedImports(stored.parsedImports || [])"), "Stored parsed imports should not fall back to demo imports.");
assert(app.includes("setFocusSessions(stored.focusSessions || [])"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Turn a syllabus into a draft.") && onboarding.includes("Approve work before it touches your plan."), "Onboarding must be short, value-first, and review-first.");
assert(onboarding.includes('id: "scan"') && onboarding.includes('id: "review"') && onboarding.includes('id: "calendar"') && onboarding.includes('id: "classes"') && onboarding.includes('id: "focus"') && onboarding.includes('id: "widgets"'), "Onboarding must preview the current Scan, Review, Calendar, Classes, Focus, and Widgets loop.");
assert(onboarding.includes("Continue to Plus") && onboarding.includes("themeChoices") && onboarding.includes("WidgetPreviewCard"), "Onboarding must include customization before the hard paywall.");
assert(upgrade.includes("StudyPlanner Plus") && upgrade.includes("paywall.hard_subtitle"), "Hard paywall must clearly require Plus before main app access.");
assert(upgrade.includes("paywall.feature_scans") && upgrade.includes("paywall.feature_focus") && upgrade.includes("paywall.feature_widgets") && upgrade.includes("paywall.feature_calendar"), "Paywall should sell Plus leverage through localized real product surfaces.");
assert(upgrade.includes("Prices, trials, and renewal periods come from the store before checkout.") && upgrade.includes("Restore Purchases"), "Paywall must rely on store-loaded plans and keep restore visible.");
assert(app.includes("setImportHandoff") && app.includes("openTab(\"today\")") && app.includes('recordReviewEvent("import_applied")'), "Scan/import should hand off into Today after value is created.");
assert(reviewPrompt.includes("assignment_completed") && reviewPrompt.includes("focus_completed") && reviewPrompt.includes("widget_saved"), "Review prompt policy should stay value-gated.");
assert(app.includes("syncStudyPlannerWidgets") && app.includes("nativeWidgetStatus"), "Native widget snapshots should refresh from real planner persistence.");
assert(more.includes("Choose widget, data, and style.") && more.includes("Ready for Home Screen"), "Widget surface should lead with an organized native widget workbench.");
assert(more.includes("Today") && more.includes("Upcoming") && more.includes("Week workload"), "Widget templates should be student-outcome first.");
assert(more.includes('"lock_rect"') && more.includes('"lock_round"') && more.includes('"lock_inline"'), "Widget Studio should expose lock-screen size intent for customization QA.");
assert(more.includes("One fact in small widgets") && more.includes("Agenda rows in medium widgets"), "Widget Studio first viewport should expose research-backed widget rules.");
assert(!more.includes("top-20") && !more.includes("active in this studio") && !more.includes("3/6 ready") && !more.includes("Studio state"), "Widget Studio must not expose internal QA scoring language.");
assert(planner.includes('headline: "Upcoming"') && planner.includes('headline: "Today"') && planner.includes("Focus Block") && planner.includes("Class Risk"), "Widget data labels should match student-outcome templates.");
assert(!more.includes("Algebra II - Worksheet") && !more.includes("Week 11") && !more.includes("Wednesday, May 13"), "Widget surface must not show fake sample school data.");
assert(!components.includes("May 13") && !components.includes('"2h"'), "Widget preview components must not hard-code fake dates or fake due times.");
assert(more.includes("Save Today preset") && more.includes("Unlock this preset"), "Widget surface may save native presets while gating advanced widgets.");
assert(defaultPlanner.includes("defaultWidgetPresets"), "Default widget presets may exist for data compatibility, but UI must not imply native support.");
assert(appJson.includes('"accessoryCircular"') && appJson.includes('"accessoryRectangular"') && appJson.includes('"accessoryInline"'), "Expo widget config should include Lock Screen accessory families.");
assert(todayWidgetSwift.includes(".accessoryCircular") && todayWidgetSwift.includes(".accessoryRectangular") && todayWidgetSwift.includes(".accessoryInline"), "Today native widget should support Lock Screen families.");
assert(upcomingWidgetSwift.includes(".accessoryCircular") && upcomingWidgetSwift.includes(".accessoryRectangular") && upcomingWidgetSwift.includes(".accessoryInline"), "Upcoming native widget should support Lock Screen families.");
assert(nativeWidgetLayout.includes('environment.widgetFamily === "accessoryCircular"') && nativeWidgetLayout.includes('environment.widgetFamily === "accessoryRectangular"') && nativeWidgetLayout.includes('environment.widgetFamily === "accessoryInline"'), "Native widget layout should render dedicated Lock Screen variants.");
assert(fs.existsSync(path.join(root, "assets/app/study-planner-icon.png")), "StudyPlanner icon asset must exist.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
