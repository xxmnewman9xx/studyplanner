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
expect(widgetSource.includes('const headline = locked ? "Build semester" : "Scan syllabus"'), "locked widgets must invite build/import instead of implying live app data");
expect(widgetSource.includes('const value = locked ? "Build" : "Start"'), "locked widgets must use compact build copy instead of fake score data");
expect(widgetSource.includes('t("widget.native.preview_badge", "Preview")'), "locked widgets must expose a preview badge");
expect(widgetSource.includes('t("widget.native.preview_unlock_plan", "Preview only. Unlock plan from app.")'), "locked widget copy must point to unlock/apply without repeated lines");
expect(widgetSource.includes('actionLabel: locked ? t("widget.native.unlock_plan", "Unlock plan")'), "locked widgets must expose an unlock action");
expect(widgetSource.includes('openURL: locked ? "studyplanner://paywall" : "studyplanner://scan"'), "locked and empty widget actions must open their exact gated destination");
expect(widgetViewSource.includes('widgetURL(props.openURL || "studyplanner://today")'), "widget views must use gated URL");
expect(widgetViewSource.includes("Link({") && widgetViewSource.includes("destination: props.openURL"), "widget action labels must use real deep links");

if (failures.length) {
  console.error("Widget lock checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Widget lock checks passed.");
