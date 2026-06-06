import { readFileSync } from "node:fs";

const appSource = readFileSync("App.tsx", "utf8");
const widgetSource = readFileSync("src/widgetEngine.ts", "utf8");
const widgetViewSource = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(appSource.includes("function lockedWidgetData"), "app must define locked widget payload");
expect(appSource.includes("classes: []") && appSource.includes("tasks: []") && appSource.includes("exams: []"), "locked widget payload must remove coursework");
expect(appSource.includes("const widgetSyncData = appAccessLocked"), "widget sync must branch on appAccessLocked");
expect(widgetSource.includes("const locked = !data.prefs.premium"), "widget snapshots must detect non-premium state");
expect(widgetSource.includes("items: [] as NativeWidgetItem[]"), "locked widgets must expose no items");
expect(widgetSource.includes("progress: 0"), "locked widgets must expose zero progress");
expect(widgetSource.includes('openURL: "studyplanner://today"'), "widget taps must use gated Today route");
expect(widgetViewSource.includes('widgetURL(props.openURL || "studyplanner://today")'), "widget views must use gated URL");

if (failures.length) {
  console.error("Widget lock checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Widget lock checks passed.");
