import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defaultData } from "../src/seed";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const appSource = read("App.tsx");
const seedSource = read("src/seed.ts");
const storageSource = read("src/storage.ts");
const widgetSource = read("src/widgetEngine.ts");
const iapSource = read("src/iap.ts");
const pkg = JSON.parse(read("package.json"));
const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

expect(appJson.version === "1.0.3", "version must remain 1.0.3");
expect(["47", "48"].includes(appJson.ios?.buildNumber), "iOS build number must be 47 or 48");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain com.mattnewman.studyplanner");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");
expect(JSON.stringify(appJson).includes("com.mattnewman.studyplanner.widgets"), "widget bundle id must remain configured");
expect(JSON.stringify(appJson).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");

expect(seedSource.includes("classes: []"), "production default classes must be empty");
expect(seedSource.includes("tasks: []"), "production default tasks must be empty");
expect(seedSource.includes("exams: []"), "production default exams must be empty");
expect(seedSource.includes("notes: []"), "production default notes must be empty");
expect(!seedSource.includes("Maya Chen"), "production seed must not include fake student name");
expect(!seedSource.includes("BIO 101"), "production seed must not include fake coursework");
expect(!storageSource.includes("defaultData.classes") && !storageSource.includes("defaultData.tasks"), "storage must not repopulate starter coursework");

expect(appSource.includes("What are you organizing?"), "onboarding must be universal");
expect(appSource.includes("What's your name") || appSource.includes("Your first name"), "onboarding must ask for name");
expect(appSource.includes("What do you need most?"), "onboarding must capture goal");
expect(appSource.includes("MiniSemesterHealth") && appSource.includes("MiniWidgetPreview"), "onboarding must explain value with product artifacts");
expect(appSource.includes("Build my semester"), "onboarding must hand off to hard paywall");
expect(!appSource.includes("Choose the feel.") && !appSource.includes("Premium Light") && !appSource.includes("Graphite"), "theme customization must be removed from visible onboarding");
expect(!appSource.includes("Scan syllabus now"), "pre-paywall scan shortcut must be removed");
expect(!appSource.includes("Biology major") && !appSource.includes("14-day streak") && !appSource.includes("Week 6 of 15"), "visible profile must not contain fake student progress");
expect(appSource.includes("!data.prefs.premium && !PRE_PURCHASE_ROUTES.includes(active)"), "meaningful app routes must be hard gated before entitlement");
expect(appSource.includes("setStack([{ route: data.prefs.osLive ? \"paywall\" : \"welcome\" }]"), "deep links must respect hard gate");
expect(appSource.includes("Know your semester.") || appSource.includes("build your live semester"), "paywall must sell semester visibility");
expect(appSource.includes("Restore Purchases"), "restore purchases must remain visible");
expect(appSource.includes("Terms of Use") && appSource.includes("Privacy Policy"), "paywall must expose terms and privacy");

expect(iapSource.includes("com.mattnewman.studyplanner.plus.monthly"), "monthly IAP ID must remain intact");
expect(iapSource.includes("com.mattnewman.studyplanner.plus.yearly"), "yearly IAP ID must remain intact");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "IAP dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-notifications"]), "notifications dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-widgets"]), "WidgetKit dependency must remain present");

expect(widgetSource.includes('value = locked ? "Unlock" : "Start"') || widgetSource.includes('value: locked ? "Unlock" : "Start"'), "locked widget snapshot must not expose app data");
expect(widgetSource.includes("Subscribe to build your plan."), "locked widget snapshot must route user to paid access");
expect(widgetSource.includes('headline = locked ? "Know your semester" : "Scan syllabus"') || widgetSource.includes('headline: locked ? "Know your semester" : "Scan syllabus"'), "empty paid widget snapshot must point to syllabus import");
expect(widgetSource.includes("locked || empty"), "widgets must explicitly handle locked and empty states");
expect(widgetSource.includes("studyplanner://today"), "widget deep link must remain studyplanner://today");
expect(!widgetSource.includes("item.courseColor || accent"), "widgets should not depend on loud class colors");

mkdirSync(join(root, "qa", "build47"), { recursive: true });
const report = `# Build 47 Test Report

## Result
${failures.length ? "FAIL" : "PASS"}

## Checks
- Metadata: ${appJson.version} (${appJson.ios?.buildNumber})
- Hard paywall gate: ${appSource.includes("!data.prefs.premium && !PRE_PURCHASE_ROUTES.includes(active)") ? "PASS" : "FAIL"}
- Theme customization removed: ${!appSource.includes("Choose the feel.") ? "PASS" : "FAIL"}
- Production seed empty: ${defaultData.classes.length === 0 && defaultData.tasks.length === 0 && defaultData.exams.length === 0 && defaultData.notes.length === 0 ? "PASS" : "FAIL"}
- IAP IDs intact: ${iapSource.includes("com.mattnewman.studyplanner.plus.monthly") && iapSource.includes("com.mattnewman.studyplanner.plus.yearly") ? "PASS" : "FAIL"}
- Locked widget: ${widgetSource.includes("Unlock") ? "PASS" : "FAIL"}
- Empty widget: ${widgetSource.includes("Scan syllabus") ? "PASS" : "FAIL"}
- Deep links gated: ${appSource.includes("setStack([{ route: data.prefs.osLive ? \"paywall\" : \"welcome\" }]") ? "PASS" : "FAIL"}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_47_TEST_REPORT.md"), report);

if (failures.length) {
  console.error("Build 47 commercial checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 47 commercial checks passed");
