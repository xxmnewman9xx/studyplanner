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
expect(widgetSource.includes('t("widget.native.locked_headline", "Your next move—on your Home Screen")'), "locked widgets must state the Home Screen promise without implying live data");
expect(widgetSource.includes('t("widget.native.locked_metric", "NEXT MOVE")'), "locked widgets must keep one dominant structural metric");
expect(widgetSource.includes('signalLabel: locked ? t("widget.native.locked", "Locked")'), "locked widgets must expose a locked label");
expect(widgetSource.includes('t("widget.native.private_locked", "Private by default")'), "locked widget copy must explain the privacy-safe state");
expect(widgetSource.includes('t("widget.native.unlock_studyplanner", "Unlock StudyPlanner")'), "locked widgets must expose the required unlock action");
expect(widgetSource.includes('openURL: locked ? "studyplanner://paywall" : "studyplanner://scan"'), "locked and empty widget actions must open their exact gated destination");
expect(widgetViewSource.includes("widgetURL(openURL)"), "widget views must use the display model's gated URL");
expect(widgetViewSource.includes("text(action") && !widgetViewSource.includes("Link({"), "widget action labels must remain compact while the full widget provides the deep-link target");

if (failures.length) {
  console.error("Widget lock checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Widget lock checks passed.");
