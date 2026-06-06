import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo;
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const appSource = fs.readFileSync(path.join(root, "App.tsx"), "utf8");
const widgetEngine = fs.readFileSync(path.join(root, "src/widgetEngine.ts"), "utf8");
const widgetSource = fs.readFileSync(path.join(root, "src/widgets/StudyPlannerWidgets.tsx"), "utf8");

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(app.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must stay com.mattnewman.studyplanner");
expect(["41", "42", "44", "45", "46", "47", "48"].includes(app.ios?.buildNumber), "iOS buildNumber must remain in the verified Build 41+ release train");
expect(app.version === "1.0.3", "marketing version must remain 1.0.3");
expect(app.plugins.some((plugin) => plugin === "expo-notifications"), "expo-notifications plugin must be installed");
expect(Boolean(pkg.dependencies?.["expo-notifications"]), "expo-notifications dependency must be present");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "expo-iap dependency must be preserved");
expect(Boolean(pkg.dependencies?.["expo-widgets"]), "expo-widgets dependency must be preserved");
expect(widgetEngine.includes("studyplanner://today"), "native widget snapshots must deep link to Today");
expect(widgetSource.includes("studyplanner://today"), "native widget code must default to Today links");
expect(!appSource.includes("Home Screen preview"), "visible Home Screen preview copy should be removed");
expect(!appSource.includes("Lock Screen preview"), "visible Lock Screen preview copy should be removed");
expect(!appSource.includes("Theme Studio"), "Theme Studio copy should not be present");
expect(!appSource.includes("Widget Studio"), "Widget Studio copy should not be present");
expect(!appSource.includes("iPhone Widgets"), "in-app widget gallery copy should be removed");
expect(appSource.includes("scheduleLocalReminders"), "Reminders screen must call native local notification scheduling");
expect(appSource.includes("buildDashboardSnapshot"), "Today must use shared dashboard intelligence");
expect(appSource.includes("parseNoteInsights"), "Notes must use structured note intelligence");

if (failures.length) {
  console.error("Build 41 hardening checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 41 hardening checks passed");
