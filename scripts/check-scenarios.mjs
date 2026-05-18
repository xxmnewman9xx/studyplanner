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
  "sp-pro-tab-surface",
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

assert(app.includes("const freeCourseLimit = 1"), "Free tier must stay intentionally tiny: one class.");
assert(app.includes("const freeAssignmentLimit = 2"), "Free tier must stay intentionally tiny: two homework items.");
assert(app.includes('premiumTabs = new Set<NavTab>(["import", "plan", "focus", "grades", "more"])'), "Premium tab gate must include Scan, Plan, Focus, Grades, and Widgets.");
assert(app.includes("const showInitialPaywall =") && app.includes("!paywallSeen") && app.includes("!subscription.isPremium"), "After onboarding, non-Pro users should hit the paywall.");
assert(app.includes("const freeTabs") && app.includes('{ id: "upgrade", label: "Pro"'), "Free users should see a small nav with a clear Pro destination.");
assert(app.includes("const freeTabs") && !app.match(/freeTabs[\s\S]*id: "import"/)?.[0]?.includes("];"), "Free tabs must not expose Scan.");
assert(app.includes("visibleTabs = marketingCaptureEnabled || subscription.isPremium ? proTabs : freeTabs"), "Navigation should switch by entitlement.");
assert(today.includes("premiumAutomationLocked ? onOpenPaywall : onOpenScan"), "Free Scan command tile should route to Pro upsell.");
assert(today.includes("premiumAutomationLocked ? onOpenPaywall : onOpenPlan"), "Free weekly plan command tile should route to Pro upsell.");
assert(today.includes("premiumAutomationLocked ? onOpenPaywall : () => onOpenFocus"), "Free focus command tile should route to Pro upsell.");
assert(!today.includes("onOpenWidgets") && !today.includes("Edit widgets"), "Today must not route users to fake widget controls.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureCourses : []"), "Normal first-run courses must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureAssignments : []"), "Normal first-run assignments must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureGradeItems : []"), "Normal first-run grade items must be empty.");
assert(app.includes("setParsedImports(stored.parsedImports || [])"), "Stored parsed imports should not fall back to demo imports.");
assert(app.includes("setFocusSessions(stored.focusSessions || [])"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Scan → review → Today → focus → done"), "Onboarding must teach the core loop verbatim.");
assert(upgrade.includes("Free is only a tiny preview") || upgrade.includes("Free is just a tiny preview"), "Paywall must explicitly position Free as a tiny preview.");
assert(upgrade.includes("scan → review → today → focus → finish") || upgrade.includes("scan → review → today → focus → done") || upgrade.includes("scan your syllabus, review the plan"), "Paywall should sell the full workflow loop.");
assert(upgrade.includes('"1 class"') && upgrade.includes('"2 homework items"') && upgrade.includes('"Basic Today list only"'), "Paywall free feature list must match the minimum free tier.");
assert(app.includes("setImportHandoff") && app.includes("openTab(\"today\")") && app.includes('recordReviewEvent("import_applied")'), "Scan/import should hand off into Today after value is created.");
assert(reviewPrompt.includes("assignment_completed") && reviewPrompt.includes("focus_completed") && reviewPrompt.includes("widget_saved"), "Review prompt policy should stay value-gated.");
assert(more.includes("These are previews only"), "Widget surface must be honest until native widgets are live.");
assert(more.includes("Widgetsmith-style templates") && more.includes("pick template → add widget → open homework"), "Widget surface should define the real native widget loop, not generic settings.");
assert(more.includes("Daily widget stack") && more.includes("Morning: Today Plan") && more.includes("Free can preview it; Pro should own the real widgets"), "Widget surface should borrow Widgetsmith's daily-stack/value model without faking native widgets.");
assert(more.includes("Next Homework") && more.includes("Today Plan") && more.includes("Focus Block") && more.includes("Class Risk"), "Widget templates should be student-outcome first.");
assert(planner.includes("Next Homework") && planner.includes("Today Plan") && planner.includes("Focus Block") && planner.includes("Class Risk"), "Widget data labels should match student-outcome templates.");
assert(!more.includes("Algebra II - Worksheet") && !more.includes("Week 11") && !more.includes("Wednesday, May 13"), "Widget surface must not show fake sample school data.");
assert(!components.includes("May 13") && !components.includes('"2h"'), "Widget preview components must not hard-code fake dates or fake due times.");
assert(!more.includes("Save widget") && !more.includes("Save current design"), "Widget surface must not expose fake save/configuration controls.");
assert(defaultPlanner.includes("defaultWidgetPresets"), "Default widget presets may exist for data compatibility, but UI must not imply native support.");
assert(fs.existsSync(path.join(root, "assets/app/study-planner-icon.png")), "StudyPlanner icon asset must exist.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
