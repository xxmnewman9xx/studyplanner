import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const appSource = readFileSync("App.tsx", "utf8");
const widgetSource = readFileSync("src/widgetEngine.ts", "utf8");
const widgetViewSource = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(JSON.stringify(app).includes("com.mattnewman.studyplanner.widgets"), "widget bundle id must remain configured");
expect(JSON.stringify(app).includes("group.com.mattnewman.studyplanner"), "widget App Group must remain configured");
expect(["studyplanner.today", "studyplanner.upcoming", "studyplanner.week", "studyplanner.classProgress"].every((kind) => JSON.stringify(app).includes(kind)), "all widget kinds must remain configured");
expect(["StudyPlannerTodayWidget", "StudyPlannerUpcomingWidget", "StudyPlannerWeekWidget", "StudyPlannerClassProgressWidget"].every((name) => widgetViewSource.includes(name) && widgetSource.includes(name)), "all native widget exports must remain wired");
expect(widgetSource.includes("updateSnapshot(snapshots.today)") && widgetSource.includes("getTimeline()"), "widget sync must update snapshots and confirm timelines");
expect(widgetSource.includes("weekCounts: [0, 0, 0, 0, 0, 0, 0]"), "locked week widget must expose empty week counts");

const forbiddenWidgetCopy = [
  ["loop", "score", "ready"].join(" "),
  ["Loop", "Wert"].join("-"),
  ["loop", "listo"].join(" "),
  ["Score", "de", "boucle"].join(" "),
  ["Pontuação", "de", "loop"].join(" "),
  ["ループ", "スコア"].join(""),
  ["루프", "점수"].join(" "),
  ["循环", "分数"].join(""),
  ["लूप", "स्कोर"].join(" "),
  ["درجة", "الحلقة"].join(" ")
];
for (const phrase of forbiddenWidgetCopy) {
  expect(!appSource.includes(phrase), `widget copy must not use generic filler phrase: ${phrase}`);
}

const forbiddenSampleWidgetData = ["Midterm 1", "CS 188", "Essay · Jun 6", "Jun 6", "pulse={78}", "pulse = 78", "days={2}"];
const previewStart = appSource.indexOf("function NativeHomeWidgetPreview");
const screenStart = appSource.indexOf("function WidgetsScreen");
const screenEnd = appSource.indexOf("function Profile", screenStart);
const previewSource = previewStart >= 0 && screenStart > previewStart ? appSource.slice(previewStart, screenStart) : "";
const widgetsScreenSource = screenStart >= 0 && screenEnd > screenStart ? appSource.slice(screenStart, screenEnd) : "";
for (const phrase of forbiddenSampleWidgetData) {
  expect(!previewSource.includes(phrase), `active widget preview must not default to fake coursework: ${phrase}`);
  expect(!widgetsScreenSource.includes(phrase), `active widget screen must not pass fake coursework into previews: ${phrase}`);
}

expect(
  previewSource.includes("const nominalWidth = isMedium ? 338 : 158") &&
    previewSource.includes("const previewScale = Math.min(1, availableWidth / nominalWidth)") &&
    previewSource.includes("transform: [{ scale: previewScale }]") ,
  "in-app widget preview must preserve native Home Screen widths while scaling proportionally to fit"
);
expect(previewSource.includes("const nominalHeight = 158") && previewSource.includes("height: nominalHeight"), "in-app widget preview must preserve the native Home Screen widget height");
expect(previewSource.includes("snapshot.items.slice(0, isMedium ? 2 : 1)"), "in-app widget preview must match native row limits");
expect(
  previewSource.includes("const actionLabel = snapshot.actionLabel") &&
    previewSource.includes("snapshot.lastInteractionLabel || updatedLabel") &&
    previewSource.includes("maxWidth: 116") &&
    previewSource.includes("numberOfLines={1}") &&
    !previewSource.includes("minimumFontScale={0.72}"),
  "in-app widget preview must mirror the compact root-link action hint"
);
expect(
  previewSource.includes("const examDays = snapshot.examDays || []") &&
    previewSource.includes('const todayIndex = typeof snapshot.todayIndex === "number" ? snapshot.todayIndex : -1') &&
    previewSource.includes("const calendarHeadline = snapshot.calendarHeadline") &&
    previewSource.includes("examDays.includes(index)") &&
    previewSource.includes('const countText = count > 9 ? "9+" : String(count)') &&
    previewSource.includes('snapshot.kind === "week" ? null') &&
    previewSource.includes("height: isMedium ? 35 : 20") &&
    previewSource.includes('`${snapshot.value} ${snapshot.detail}`') &&
    previewSource.includes("peakDayLabel"),
  "in-app week preview must mirror the compact native calendar hierarchy"
);
expect(!previewSource.includes("const percent") && !previewSource.includes("ProgressBar"), "in-app widget preview must not add preview-only progress UI");
expect(widgetViewSource.includes("isSimplified ? 0 : Math.min(items.length, isMedium ? 2 : 1)"), "native widget renderer must reduce rows in simplified mode and otherwise mirror preview limits");
expect(widgetViewSource.includes("frame({ maxWidth: isMedium ? 338 : 158, maxHeight: 158 })"), "native widget renderer must keep the same Home Screen frame as the in-app preview");
expect(
  widgetViewSource.includes('widgetURL(props.openURL || "studyplanner://today")') &&
    widgetViewSource.includes("return text(actionLabel") &&
    !widgetViewSource.includes("Link({") &&
    widgetViewSource.includes("environment.levelOfDetail") &&
    widgetViewSource.includes("environment.isLuminanceReduced"),
  "native widget renderer must use its full surface as the deep-link action and keep iOS 26 environment guards"
);
expect(!widgetSource.includes("value: String(loop.score)") && !widgetSource.includes('detail: "Semester Health"'), "native widget snapshots must be action-first, not score-first filler");
expect(
    widgetSource.includes("const todayHeadline = todayCount ? t(\"widget.native.due_today_headline\"") &&
    widgetSource.includes('const weekValue = busyDays ? String(busyDays) : "0"') &&
    widgetSource.includes("const weekDetail = busyDays === 1 ? t(\"widget.native.busy_day\"") &&
    widgetSource.includes('openURL: "studyplanner://plan"') &&
    widgetSource.includes('openURL: "studyplanner://classes"'),
  "native widget snapshots must expose real localized deadline logic and truthful destinations"
);

if (failures.length) {
  console.error("Widget integrity checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Widget integrity checks passed.");
