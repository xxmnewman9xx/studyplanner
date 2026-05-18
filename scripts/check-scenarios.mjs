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
const today = read("src/screens/TodayScreen.tsx");
const reviewPrompt = read("src/services/reviewPrompt.ts");
const defaultPlanner = read("src/data/defaultPlanner.ts");

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const requiredScenarioFields = ["id", "app", "persona", "risk", "state", "trigger", "expected", "automation", "evidence"];
const allowedRisks = new Set(["trust", "conversion", "clarity", "retention", "revenue", "shipping"]);
const allowedAutomation = new Set(["static", "unit", "integration", "simulator", "manual"]);
const requiredScenarioIds = [
  "sp-free-after-onboarding",
  "sp-free-limit",
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

assert(app.includes("const freeCourseLimit = 2"), "Free tier should allow two useful classes.");
assert(app.includes("const freeAssignmentLimit = 12"), "Free tier should allow enough homework to prove value.");
assert(app.includes("const freeImportLimit = 1"), "Free tier should include one reviewed syllabus import.");
assert(app.includes('premiumTabs = new Set<NavTab>(["focus", "grades"])'), "Premium tab gate should focus on advanced Focus and Grades surfaces.");
assert(!app.includes("const showInitialPaywall ="), "Non-Plus users should not hit a forced paywall before value.");
assert(app.includes("const freeTabs: typeof proTabs = proTabs"), "Free users should see the core Scan, Plan, Classes, and Widgets navigation.");
assert(app.includes('{ id: "import", label: "Scan"') && app.includes('{ id: "plan", label: "Plan"') && app.includes('{ id: "more", label: "Widgets"'), "Free tab bar must expose Scan, Plan, and Widget Studio.");
assert(app.includes("importLimitLocked") && app.includes("freeImportLimit"), "Import monetization should be bounded by usage, not pre-value navigation.");
assert(today.includes('title="Add from syllabus"') && today.includes("onPress={onOpenScan}"), "Free Scan command tile should route to scan/import.");
assert(today.includes('title="Open weekly plan"') && today.includes("onPress={onOpenPlan}"), "Free weekly plan command tile should open the planner.");
assert(today.includes("premiumAutomationLocked ? onOpenPaywall : () => onOpenFocus"), "Free focus command tile should route to Plus upsell.");
assert(today.includes("onTryDemo") && today.includes("demoMode"), "Today should support a truthful demo path and demo banner.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureCourses : []"), "Normal first-run courses must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureAssignments : []"), "Normal first-run assignments must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureGradeItems : []"), "Normal first-run grade items must be empty.");
assert(app.includes("setParsedImports(stored.parsedImports || [])"), "Stored parsed imports should not fall back to demo imports.");
assert(app.includes("setFocusSessions(stored.focusSessions || [])"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Turn any syllabus into a semester plan") && onboarding.includes("Review before it touches your planner"), "Onboarding must be short, value-first, and review-first.");
assert(onboarding.includes("Try demo planner") && onboarding.includes("Scan or upload syllabus"), "Onboarding must offer scan/import and demo paths immediately.");
assert(upgrade.includes("Free lets you try the planner with real utility"), "Paywall must position Free as useful but bounded.");
assert(upgrade.includes("Plus expands scans, automation, widgets, and semester controls"), "Paywall should sell Plus as leverage, not punishment.");
assert(upgrade.includes('"1 active semester"') && upgrade.includes('"2 classes and 12 homework items"') && upgrade.includes('"1 reviewed syllabus import"'), "Paywall free feature list must match the useful bounded free tier.");
assert(app.includes("setImportHandoff") && app.includes("openTab(\"today\")") && app.includes('recordReviewEvent("import_applied")'), "Scan/import should hand off into Today after value is created.");
assert(reviewPrompt.includes("assignment_completed") && reviewPrompt.includes("focus_completed") && reviewPrompt.includes("widget_saved"), "Review prompt policy should stay value-gated.");
assert(app.includes("syncStudyPlannerWidgets") && app.includes("nativeWidgetStatus"), "WidgetKit snapshots should refresh from real planner persistence.");
assert(more.includes("Real widgets, real planner data") && more.includes("Add StudyPlanner Today or StudyPlanner Upcoming"), "Widget surface should describe the real native widget loop.");
assert(more.includes("Daily widget stack") && more.includes("Morning: Today") && more.includes("Free includes basic Today and Upcoming widgets"), "Widget surface should explain the free native widget value without faking advanced widgets.");
assert(more.includes("Upcoming") && more.includes("Today") && more.includes("Focus Block") && more.includes("Class Risk"), "Widget templates should be student-outcome first.");
assert(planner.includes('headline: "Upcoming"') && planner.includes('headline: "Today"') && planner.includes("Focus Block") && planner.includes("Class Risk"), "Widget data labels should match student-outcome templates.");
assert(!more.includes("Algebra II - Worksheet") && !more.includes("Week 11") && !more.includes("Wednesday, May 13"), "Widget surface must not show fake sample school data.");
assert(!components.includes("May 13") && !components.includes('"2h"'), "Widget preview components must not hard-code fake dates or fake due times.");
assert(more.includes("Save widget preset") && more.includes("Unlock advanced widget"), "Widget surface may save basic presets while gating advanced widgets.");
assert(defaultPlanner.includes("defaultWidgetPresets"), "Default widget presets may exist for data compatibility, but UI must not imply native support.");
assert(fs.existsSync(path.join(root, "assets/app/study-planner-icon.png")), "StudyPlanner icon asset must exist.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
