import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const pkg = JSON.parse(read("package.json"));
const appSource = read("App.tsx");
const seedSource = read("src/seed.ts");
const storageSource = read("src/storage.ts");
const iapSource = read("src/iap.ts");
const widgetSource = read("src/widgetEngine.ts");
const reminderSource = read("src/reminders.ts");
const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

expect(appJson.version === "1.0.3", "marketing version must remain 1.0.3");
expect(["49", "51"].includes(appJson.ios?.buildNumber), "iOS build number must remain Build 49 lineage or Build 51 release");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain intact");

expect(appSource.includes("type EntitlementStatus"), "Build 49 must model entitlement loading/active/inactive/error");
expect(appSource.includes("lockUnvalidatedPremium") && appSource.includes("premium: false"), "stored premium must be locked until validation");
expect(appSource.includes("onboardingComplete") && appSource.includes("premiumData"), "onboarding completion must be separate from premium unlock");
expect(appSource.includes("PRE_PURCHASE_ROUTES") && appSource.includes("\"lockedDashboard\"") && appSource.includes("\"importOptions\""), "pre-purchase routes must include import options and locked dashboard");
expect(appSource.includes("gatedRoute") && appSource.includes("return \"lockedDashboard\""), "non-premium routes must resolve to locked dashboard");
expect(appSource.includes("function routeTokensFromUrl") && appSource.includes("setStack([{ route: \"lockedDashboard\" }]"), "deep links must be tokenized and gated");

expect(appSource.includes("Build your semester.") && appSource.includes("Preview what StudyPlanner finds before you unlock."), "onboarding end must be value-first import options");
expect(["Upload PDF", "Paste manually", "Scan with camera", "Skip for now"].every((copy) => appSource.includes(copy)), "onboarding end must offer PDF, paste, scan, and skip");

expect(appSource.includes("Preview only.") && appSource.includes("Unlock my semester"), "import review must show preview-only state and premium CTA");
expect(appSource.includes("if (!data.prefs.premium)") && appSource.includes("nav.push(\"paywall\")"), "review apply must require paywall before persistence");
expect(appSource.includes("applyImport(unlocked, currentImport)") && appSource.includes("applyImport(unlocked, pending)"), "pending import must apply only after purchase/restore");
expect(appSource.includes("const previewOnly = !data.prefs.premium"), "scan route must have pre-paywall preview-only mode");

expect(appSource.includes("Semester locked") && appSource.includes("0 / locked") && appSource.includes("No syllabus yet."), "locked dashboard must show locked health zero state");
expect(["Today", "Plan", "Classes", "Notes", "Widgets", "Reminders"].every((copy) => appSource.includes(copy)), "locked dashboard must show locked feature previews");
expect(appSource.includes("Scan syllabus") && appSource.includes("Unlock StudyPlanner"), "locked dashboard CTAs must route to scan and paywall");

expect(seedSource.includes("classes: []") && seedSource.includes("tasks: []") && seedSource.includes("exams: []") && seedSource.includes("notes: []"), "production seed must remain empty");
expect(!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101"), "demo coursework must not return");
expect(storageSource.includes("onboardingComplete") && storageSource.includes("Boolean((incomingPrefs as any).osLive)"), "old Build 47/48 osLive storage must migrate to onboardingComplete without premium unlock");

expect(widgetSource.includes("const locked = !data.prefs.premium") && widgetSource.includes("progress: 0") && widgetSource.includes("studyplanner://today"), "widgets must render locked zero snapshots and link through gated Today");
expect((appSource.includes("snapshot.prefs.osLive && snapshot.prefs.premium") || appSource.includes("const widgetSyncData = appAccessLocked")) && appSource.includes("syncNativeWidgets"), "native widget sync must require premium or send locked empty data");
expect(reminderSource.includes("if (!data.prefs.premium)") || appSource.includes("displayRoute === \"reminders\" ? <Reminders"), "notifications/reminders must be behind route gate or explicit premium guard");

expect(iapSource.includes("com.mattnewman.studyplanner.plus.monthly") && iapSource.includes("com.mattnewman.studyplanner.plus.yearly"), "IAP product IDs must remain intact");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "expo-iap dependency must remain present");

mkdirSync(join(root, "qa", "build49"), { recursive: true });
const report = `# Build 49 Check

## Result
${failures.length ? "FAIL" : "PASS"}

## Checks
- Metadata: ${appJson.version} (${appJson.ios?.buildNumber})
- Explicit gate model: ${appSource.includes("gatedRoute") ? "PASS" : "FAIL"}
- Onboarding separate from premium: ${appSource.includes("onboardingComplete") && appSource.includes("lockUnvalidatedPremium") ? "PASS" : "FAIL"}
- Import options: ${["Upload PDF", "Paste manually", "Scan with camera", "Skip for now"].every((copy) => appSource.includes(copy)) ? "PASS" : "FAIL"}
- Preview-only review: ${appSource.includes("Preview only.") && appSource.includes("Unlock my semester") ? "PASS" : "FAIL"}
- Paywall-before-apply: ${appSource.includes("if (!data.prefs.premium)") && appSource.includes("nav.push(\"paywall\")") ? "PASS" : "FAIL"}
- Locked dashboard: ${appSource.includes("Semester locked") && appSource.includes("0 / locked") ? "PASS" : "FAIL"}
- Deep links gated: ${appSource.includes("function routeTokensFromUrl") && appSource.includes("setStack([{ route: \"lockedDashboard\" }]") ? "PASS" : "FAIL"}
- Widgets gated: ${widgetSource.includes("const locked = !data.prefs.premium") && (appSource.includes("snapshot.prefs.osLive && snapshot.prefs.premium") || appSource.includes("const widgetSyncData = appAccessLocked")) ? "PASS" : "FAIL"}
- Demo-free seed: ${!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101") ? "PASS" : "FAIL"}
- IAP IDs intact: ${iapSource.includes("com.mattnewman.studyplanner.plus.monthly") && iapSource.includes("com.mattnewman.studyplanner.plus.yearly") ? "PASS" : "FAIL"}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_49_CHECK_REPORT.md"), report);

if (failures.length) {
  console.error("Build 49 checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 49 checks passed");
