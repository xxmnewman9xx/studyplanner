import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const pkg = JSON.parse(read("package.json"));
const appSource = read("App.tsx");
const seedSource = read("src/seed.ts");
const widgetSource = read("src/widgetEngine.ts");
const iapSource = read("src/iap.ts");
const xcodeProject = read("ios/StudyplannerSyllabusAI.xcodeproj/project.pbxproj");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(appJson.version === "1.0.3", "version must be 1.0.3");
expect(["51", "52"].includes(appJson.ios?.buildNumber), "iOS build number must be 51 or 52");
expect(((xcodeProject.match(/CURRENT_PROJECT_VERSION = 51;/g) || []).length >= 4) || ((xcodeProject.match(/CURRENT_PROJECT_VERSION = 52;/g) || []).length >= 4), "native app and widget build settings must be 51 or 52");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app bundle id must remain intact");
expect(JSON.stringify(appJson).includes("com.mattnewman.studyplanner.widgets"), "widget bundle id must remain intact");
expect(JSON.stringify(appJson).includes("group.com.mattnewman.studyplanner"), "App Group must remain intact");
expect(appJson.ios?.appleTeamId === "5JN35MJ3QD", "Apple Team must remain 5JN35MJ3QD");

expect(appSource.includes("Let's build your semester.") && appSource.includes("Your first name"), "onboarding must ask for name");
expect(appSource.includes("Build your semester.") && appSource.includes("Preview what StudyPlanner finds before you unlock."), "Build 49 value-first funnel must remain");
expect(["Upload PDF", "Scan with camera", "Skip for now"].every((copy) => appSource.includes(copy)) && (appSource.includes("Paste manually") || appSource.includes("Paste syllabus")), "import options must remain");
expect(appSource.includes("const previewOnly = !data.prefs.premium"), "import scan must remain preview-only pre-paywall");
expect(appSource.includes("Preview only.") && appSource.includes("Unlock my semester"), "review must show preview-only state");
expect(appSource.includes("if (!data.prefs.premium)") && appSource.includes('nav.push("paywall")'), "apply must require paywall");
expect(appSource.includes('completeAnd("lockedDashboard")') || appSource.includes('nav.tab("lockedDashboard")') || appSource.includes('route === "lockedDashboard"'), "skip must route locked");
expect(appSource.includes("Semester locked") && appSource.includes("0 / locked") && appSource.includes("No dashboard data"), "locked dashboard must show 0/no data");
expect(appSource.includes("function routeTokensFromUrl") && !appSource.includes('target.includes("plan")'), "deep links must be token gated");
expect(appSource.includes("function appAccessLocked") && appSource.includes('setStack([{ route: "lockedDashboard" }]'), "deep links must route locked users to locked state");
expect(appSource.includes("function lockedWidgetData") && widgetSource.includes("items: []") && widgetSource.includes("progress: 0"), "widget data must be locked");
expect(seedSource.includes("classes: []") && seedSource.includes("tasks: []") && seedSource.includes("exams: []") && seedSource.includes("notes: []"), "seed data must remain empty");
expect(!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101"), "demo data must not return");
expect(iapSource.includes("com.mattnewman.studyplanner.plus.monthly") && iapSource.includes("com.mattnewman.studyplanner.plus.yearly"), "IAP IDs must remain intact");
expect(Boolean(pkg.scripts?.["test:hard-paywall"]), "hard paywall test script must exist");
expect(appSource.includes("routeFromUrl") && !/studyplanner:\/\/auth[\s\S]{0,100}plan/.test(appSource), "studyplanner://auth must not match plan");

mkdirSync(join(root, "qa", "build51"), { recursive: true });
const report = `# Build 51 Check

## Result
${failures.length ? "FAIL" : "PASS"}

## Checks
- Metadata: ${appJson.version} (${appJson.ios?.buildNumber})
- Value-first funnel: ${appSource.includes("Build your semester.") ? "PASS" : "FAIL"}
- Onboarding asks name: ${appSource.includes("Your first name") ? "PASS" : "FAIL"}
- Import options: ${["Upload PDF", "Scan with camera", "Skip for now"].every((copy) => appSource.includes(copy)) && (appSource.includes("Paste manually") || appSource.includes("Paste syllabus")) ? "PASS" : "FAIL"}
- Preview-only import: ${appSource.includes("const previewOnly = !data.prefs.premium") ? "PASS" : "FAIL"}
- Apply requires paywall: ${appSource.includes("if (!data.prefs.premium)") && appSource.includes('nav.push("paywall")') ? "PASS" : "FAIL"}
- Locked dashboard: ${appSource.includes("Semester locked") && appSource.includes("0 / locked") ? "PASS" : "FAIL"}
- Deep links gated: ${appSource.includes("function routeTokensFromUrl") && appSource.includes('setStack([{ route: "lockedDashboard" }]') ? "PASS" : "FAIL"}
- Widget data locked: ${appSource.includes("function lockedWidgetData") && widgetSource.includes("progress: 0") ? "PASS" : "FAIL"}
- No demo data: ${!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101") ? "PASS" : "FAIL"}
- IAP IDs intact: ${iapSource.includes("com.mattnewman.studyplanner.plus.monthly") && iapSource.includes("com.mattnewman.studyplanner.plus.yearly") ? "PASS" : "FAIL"}
- studyplanner://auth does not match plan: ${!appSource.includes('target.includes("plan")') ? "PASS" : "FAIL"}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_51_CHECK_REPORT.md"), report);

if (failures.length) {
  console.error("Build 51 checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 51 checks passed.");
