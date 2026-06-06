import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = JSON.parse(read("app.json")).expo;
const pkg = JSON.parse(read("package.json"));
const appSource = read("App.tsx");
const intelligence = read("src/intelligence.ts");
const storage = read("src/storage.ts");
const reminders = read("src/reminders.ts");
const widgetEngine = read("src/widgetEngine.ts");
const widgetSource = read("src/widgets/StudyPlannerWidgets.tsx");

const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(app.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must stay com.mattnewman.studyplanner");
expect(["42", "44", "45", "46", "47", "48"].includes(app.ios?.buildNumber), "iOS buildNumber must remain a verified Build 42+ release train build");
expect(app.version === "1.0.3", "marketing version must remain 1.0.3");
expect(Boolean(pkg.dependencies?.["expo-notifications"]), "expo-notifications dependency must be present");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "expo-iap dependency must be preserved");
expect(Boolean(pkg.dependencies?.["expo-widgets"]), "expo-widgets dependency must be preserved");
expect(intelligence.includes("buildSemesterSnapshot"), "SemesterSnapshot engine must exist");
expect(intelligence.includes("buildGradeForecasts"), "grade forecast engine must exist");
expect(intelligence.includes("buildPressureForecast"), "pressure forecast engine must exist");
expect(intelligence.includes("appendFeedbackEvent"), "feedback loop engine must exist");
expect(storage.includes("feedbackEvents"), "storage must preserve feedback events");
expect(storage.includes("appendFeedbackEvent"), "imports must create feedback events");
expect(
  reminders.includes("buildSemesterSnapshot(data).notificationPlan") ||
    reminders.includes("buildSemesterSnapshot(data, now).notificationPlan"),
  "reminders must use shared semester snapshot"
);
expect(widgetEngine.includes("buildSemesterSnapshot"), "native widgets must use shared semester snapshot");
expect(widgetEngine.includes("studyplanner://today"), "native widget snapshots must deep link to Today");
expect(widgetSource.includes("studyplanner://today"), "native widget code must default to Today links");
expect(appSource.includes("Semester Health") || appSource.includes("SEMESTER HEALTH"), "Today must surface semester health");
expect(appSource.includes("Pressure Forecast"), "Today must surface pressure forecast");
expect(appSource.includes("Semester autopilot") || appSource.includes("Autopilot"), "Plan must surface autopilot language");
expect(!appSource.includes("Home Screen preview"), "visible Home Screen preview copy should stay removed");
expect(!appSource.includes("Lock Screen preview"), "visible Lock Screen preview copy should stay removed");
expect(!appSource.includes("Theme Studio"), "Theme Studio copy should not be present");
expect(!appSource.includes("Widget Studio"), "Widget Studio copy should not be present");
expect(!appSource.includes("iPhone Widgets"), "in-app widget gallery copy should stay removed");

if (failures.length) {
  console.error("Build 42 living semester checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 42 living semester checks passed");
