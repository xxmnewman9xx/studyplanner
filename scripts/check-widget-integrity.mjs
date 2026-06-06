import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
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

if (failures.length) {
  console.error("Widget integrity checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Widget integrity checks passed.");
