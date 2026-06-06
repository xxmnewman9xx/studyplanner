import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const appSource = read("App.tsx");
const storageSource = read("src/storage.ts");
const seedSource = read("src/seed.ts");
const iapSource = read("src/iap.ts");
const pkg = JSON.parse(read("package.json"));
const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

const appClassIndexUses = appSource.match(/data\.classes\[0\]/g) || [];
const unsafeNameInitials = appSource.match(/data\.prefs\.name\[0\]/g) || [];

expect(appJson.version === "1.0.3", "marketing version must remain 1.0.3");
expect(Number(appJson.ios?.buildNumber) >= 48, "iOS build number must remain on the Build 48+ rescue train");
expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain com.mattnewman.studyplanner");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");

expect(seedSource.includes("classes: []") && seedSource.includes("tasks: []") && seedSource.includes("exams: []") && seedSource.includes("notes: []"), "production seed must remain empty");
expect(!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101"), "production seed must not include demo student or coursework");

expect(appSource.includes("Your first name"), "onboarding must ask for the user's name");
expect(appSource.includes("Perfect,") && appSource.includes("Let's get your semester under control"), "onboarding must immediately personalize by name");
expect(appSource.includes("What are you organizing?"), "onboarding must ask student type");
expect(appSource.includes("What do you need most?"), "onboarding must ask main goal");
expect(appSource.includes("workloadStyle") && appSource.includes("scanIntent"), "onboarding must store workload style and scan intent");
expect(["MiniSemesterHealth", "MiniPressureForecast", "MiniClassPulse", "MiniNotesPreparedness", "MiniWidgetPreview", "MiniNextMove"].every((name) => appSource.includes(name)), "onboarding must include all mini in-app artifact previews");
expect(appSource.includes("Build my semester"), "onboarding must end with Build my semester CTA");

expect(appSource.includes("PRE_PURCHASE_ROUTES") && appSource.includes("hardGateActive"), "hard paywall route gate must remain centralized");
expect(appSource.includes("!data.prefs.premium") && appSource.includes("paywall"), "locked routes must resolve to paywall/welcome");
expect(appSource.includes("Restore Purchases"), "restore purchases must remain available");
expect(appSource.includes("Terms of Use") && appSource.includes("Privacy Policy"), "terms and privacy must remain available pre-purchase");
expect(iapSource.includes("restoreStudyPlannerPurchases") && iapSource.includes("checkStudyPlannerEntitlement"), "IAP restore and entitlement checks must remain wired");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "expo-iap dependency must remain present");

expect(appSource.includes("safeClassFor") && appSource.includes("FALLBACK_CLASS"), "empty-class fallback guard must exist");
expect(appSource.includes("RecoveryScreen"), "stale detail routes must have a recovery screen");
expect(appClassIndexUses.length === 1, "App.tsx must only access data.classes[0] inside safeClassFor");
expect(unsafeNameInitials.length === 0, "App.tsx must not dereference data.prefs.name[0]");
expect(storageSource.includes("normalizeTask") && storageSource.includes("normalizeNote"), "storage must repair corrupted task/note shapes");
expect(storageSource.includes("ensureClassId"), "applyImport must repair orphan task/exam/note class references");
expect(!appSource.includes("No semester loaded.") && !appSource.includes("Keep your semester visible."), "paywall/onboarding must not rely on weak Build 47 empty-state copy");
expect(!appSource.includes("See plans"), "welcome must not bypass personalized onboarding into paywall");

mkdirSync(join(root, "qa", "build48"), { recursive: true });
const report = `# Build 48 Rescue Check

## Result
${failures.length ? "FAIL" : "PASS"}

## Checks
- Metadata: ${appJson.version} (${appJson.ios?.buildNumber})
- Name-first onboarding: ${appSource.includes("Your first name") ? "PASS" : "FAIL"}
- Personalized copy: ${appSource.includes("Perfect,") ? "PASS" : "FAIL"}
- Artifact previews: ${["MiniSemesterHealth", "MiniPressureForecast", "MiniClassPulse", "MiniNotesPreparedness", "MiniWidgetPreview", "MiniNextMove"].every((name) => appSource.includes(name)) ? "PASS" : "FAIL"}
- Hard paywall gate: ${appSource.includes("PRE_PURCHASE_ROUTES") && appSource.includes("hardGateActive") ? "PASS" : "FAIL"}
- Empty-class crash guard: ${appSource.includes("safeClassFor") && appClassIndexUses.length === 1 ? "PASS" : "FAIL"}
- Stale-route recovery: ${appSource.includes("RecoveryScreen") ? "PASS" : "FAIL"}
- Corrupt storage guard: ${storageSource.includes("normalizeTask") && storageSource.includes("normalizeNote") ? "PASS" : "FAIL"}
- Orphan import repair: ${storageSource.includes("ensureClassId") ? "PASS" : "FAIL"}
- Demo-free seed: ${!seedSource.includes("Maya Chen") && !seedSource.includes("BIO 101") ? "PASS" : "FAIL"}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(root, "BUILD_48_TEST_REPORT.md"), report);

if (failures.length) {
  console.error("Build 48 rescue checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 48 rescue checks passed");
