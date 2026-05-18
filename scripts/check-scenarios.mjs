import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const onboarding = fs.readFileSync(path.join(root, "src/screens/OnboardingScreen.tsx"), "utf8");
const upgrade = fs.readFileSync(path.join(root, "src/screens/UpgradeScreen.tsx"), "utf8");
const more = fs.readFileSync(path.join(root, "src/screens/MoreScreen.tsx"), "utf8");
const defaultPlanner = fs.readFileSync(path.join(root, "src/data/defaultPlanner.ts"), "utf8");

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const scenarioPath = path.join(root, "qa-scenarios", "studyplanner.scenarios.json");
assert(fs.existsSync(scenarioPath), "Golden StudyPlanner scenario file is missing.");
if (fs.existsSync(scenarioPath)) {
  const scenarios = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  assert(scenarios.length >= 3, "StudyPlanner scenario bible needs at least the core free/paywall/widget scenarios.");
}

assert(app.includes("const freeCourseLimit = 1"), "Free tier must stay intentionally tiny: one class.");
assert(app.includes("const freeAssignmentLimit = 2"), "Free tier must stay intentionally tiny: two homework items.");
assert(app.includes('premiumTabs = new Set<NavTab>(["import", "plan", "focus", "grades", "more"])'), "Premium tab gate must include Scan, Plan, Focus, Grades, and Widgets.");
assert(app.includes("const showInitialPaywall =") && app.includes("!paywallSeen") && app.includes("!subscription.isPremium"), "After onboarding, non-Pro users should hit the paywall.");
assert(app.includes("const freeTabs") && app.includes('{ id: "upgrade", label: "Pro"'), "Free users should see a small nav with a clear Pro destination.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureCourses : []"), "Normal first-run courses must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureAssignments : []"), "Normal first-run assignments must be empty.");
assert(app.includes("marketingCaptureEnabled ? marketingCaptureGradeItems : []"), "Normal first-run grade items must be empty.");
assert(app.includes("setParsedImports(stored.parsedImports || [])"), "Stored parsed imports should not fall back to demo imports.");
assert(app.includes("setFocusSessions(stored.focusSessions || [])"), "Stored focus sessions should not fall back to demo focus sessions.");
assert(onboarding.includes("Scan → review → Today → focus → done"), "Onboarding must teach the core loop verbatim.");
assert(upgrade.includes("Free is only a tiny preview") || upgrade.includes("Free is just a tiny preview"), "Paywall must explicitly position Free as a tiny preview.");
assert(upgrade.includes("scan → review → today → focus → finish") || upgrade.includes("scan → review → today → focus → done") || upgrade.includes("scan your syllabus, review the plan"), "Paywall should sell the full workflow loop.");
assert(upgrade.includes('"1 class"') && upgrade.includes('"2 homework items"') && upgrade.includes('"Basic Today list only"'), "Paywall free feature list must match the minimum free tier.");
assert(more.includes("These are previews only"), "Widget surface must be honest until native widgets are live.");
assert(!more.includes("Algebra II - Worksheet") && !more.includes("Week 11") && !more.includes("Wednesday, May 13"), "Widget surface must not show fake sample school data.");
assert(!more.includes("Save widget") && !more.includes("Save current design"), "Widget surface must not expose fake save/configuration controls.");
assert(defaultPlanner.includes("defaultWidgetPresets"), "Default widget presets may exist for data compatibility, but UI must not imply native support.");

if (failures.length) {
  console.error("Scenario gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner golden scenario gates passed");
