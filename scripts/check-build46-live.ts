import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const appSource = read("App.tsx");
const pkg = JSON.parse(read("package.json"));
const widgetSource = read("src/widgetEngine.ts");
const iapSource = read("src/iap.ts");
const remindersSource = read("src/reminders.ts");

const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

expect(appJson.version === "1.0.3", "version must remain 1.0.3");
expect(["46", "47", "48"].includes(appJson.ios?.buildNumber), "iOS build number must be in the verified Build 46+ live release train");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain com.mattnewman.studyplanner");
expect(JSON.stringify(appJson).includes("com.mattnewman.studyplanner.widgets"), "widget bundle id must remain configured");
expect(JSON.stringify(appJson).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");

expect(appSource.includes("Know exactly where you stand."), "welcome must feel premium and outcome-led");
expect(appSource.includes("What are you organizing?"), "onboarding must include universal student context");
expect(appSource.includes("What do you need most?"), "onboarding must include semester goal");
expect(!appSource.includes("Choose the feel."), "onboarding must remove visual theme friction");
expect(appSource.includes("your semester will feel live") && appSource.includes("MiniSemesterHealth"), "onboarding must explain value through cards");
expect(appSource.includes("Build my semester"), "onboarding must lead to hard paywall");
expect(appSource.includes("Reading syllabus") && appSource.includes("Finding deadlines"), "post-scan sequence must use syllabus-specific magic copy");
expect(appSource.includes("Built from your syllabus."), "post-scan success must state the source/value");
expect(appSource.includes("build your live semester") || appSource.includes("Know your semester."), "paywall must sell confidence/visibility");
expect(!appSource.includes("AI hype"), "must not include AI hype language");
expect(!appSource.includes("Widget Studio") && !appSource.includes("Theme Studio"), "studio UI copy must remain removed");

expect(Boolean(pkg.dependencies?.["expo-iap"]), "IAP dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-notifications"]), "notifications dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-widgets"]), "WidgetKit dependency must remain present");
expect(iapSource.includes("restoreStudyPlannerPurchases"), "restore purchase path must remain wired");
expect(remindersSource.includes("scheduleNotificationAsync") || remindersSource.includes("scheduleLocalReminders"), "local notification scheduling must remain wired");
expect(widgetSource.includes("studyplanner://today"), "widgets must preserve Today deep link");

mkdirSync(join(root, "qa", "build46-live"), { recursive: true });
const report = `# Build 46 Live Check

## Result
${failures.length ? "FAIL" : "PASS"}

## Checks
- Metadata: ${appJson.version} (${appJson.ios?.buildNumber})
- Premium welcome: ${appSource.includes("Know exactly where you stand.") ? "PASS" : "FAIL"}
- Persona selection: ${appSource.includes("What are you organizing?") ? "PASS" : "FAIL"}
- Goal selection: ${appSource.includes("What do you need most?") ? "PASS" : "FAIL"}
- Theme removed: ${!appSource.includes("Choose the feel.") ? "PASS" : "FAIL"}
- Hard paywall handoff: ${appSource.includes("Build my semester") ? "PASS" : "FAIL"}
- Post-scan magic copy: ${appSource.includes("Reading syllabus") && appSource.includes("Finding deadlines") ? "PASS" : "FAIL"}
- Paywall value copy: ${appSource.includes("build your live semester") || appSource.includes("Know your semester.") ? "PASS" : "FAIL"}
- IAP/restore wired: ${iapSource.includes("restoreStudyPlannerPurchases") ? "PASS" : "FAIL"}
- Widget deep links: ${widgetSource.includes("studyplanner://today") ? "PASS" : "FAIL"}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_46_LIVE_CHECK.md"), report);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build 46 live checks passed");
