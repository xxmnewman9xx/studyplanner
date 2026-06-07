import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const appSource = read("App.tsx");
const iapSource = read("src/iap.ts");
const storageSource = read("src/storage.ts");
const packageSource = read("package.json");

function expect(pass, message) {
  if (!pass) failures.push(message);
}

const failures = [];

expect(appSource.includes('type AccessState = "loading" | "onboarding" | "preview_allowed" | "locked" | "paywall" | "unlocked"'), "single AccessState union must exist");
expect(/function entitlementUnlocks[\s\S]{0,160}return entitlementStatus === "active";/.test(appSource), "only active StoreKit entitlement may unlock");
expect(!/function entitlementUnlocks[\s\S]{0,220}data\.prefs\.premium/.test(appSource), "local premium flag must not participate in entitlementUnlocks");
expect(appSource.includes("function dataForAccessState") && appSource.includes("return lockUnvalidatedPremium(data)"), "screen data must be scrubbed unless entitlement is active");
expect(appSource.includes("const props = { data: screenData"), "screens must receive access-sanitized data");
expect(appSource.includes("const persistedSnapshot = entitlementUnlocks(snapshot, entitlementStatus) ? snapshot : lockUnvalidatedPremium(snapshot)"), "persistence must scrub stale local premium");
expect(appSource.includes("allowValidatedPremium") && appSource.includes("lockUnvalidatedPremium(next)"), "mutations must scrub premium unless validation path allows it");
expect(appSource.includes("[Build52Access]") && appSource.includes("entitlementTraceSource"), "QA entitlement trace logs must identify source and route decision");
expect(appSource.includes('"terms"') && appSource.includes('"privacy"') && appSource.includes('displayRoute === "privacy"'), "terms and privacy must be in-app locked-safe routes");
expect(!appSource.includes("PRIVACY_URL") && !appSource.includes("https://www.apple.com/legal/privacy/"), "privacy policy must not point to Apple's generic privacy page");
expect(appSource.includes("storePlansReady") && appSource.includes("Loading ${storeName} price") && appSource.includes("busy || !storePlansReady ? undefined : purchase"), "purchase CTA must be disabled until localized store pricing is loaded");
expect(iapSource.includes("return checkStudyPlannerEntitlement()") && !/finishStudyPlannerPurchase[\s\S]{0,420}isPremium,\s*productId/.test(iapSource), "purchase updates must revalidate active entitlement before unlock");
expect(appSource.includes('if (entitlementStatus === "loading") return;') && appSource.indexOf('if (entitlementStatus === "loading") return;') < appSource.indexOf("if (initial) initialUrlHandled.current = true"), "initial links must not be consumed while entitlement is loading");
expect(storageSource.includes("(incomingPrefs as any).osLive === true") && storageSource.includes("premium: false") && storageSource.includes("CORRUPT_BACKUP_PREFIX"), "storage migration must use strict booleans, distrust premium, and back up corrupt payloads");

expect(appSource.includes("What should StudyPlanner call you?") && appSource.includes("Your first name"), "onboarding must ask for name first");
expect(appSource.includes("Nice, {firstName}. What are you managing?") || (appSource.includes("What are you managing?") && appSource.includes("NICE, {firstName.toUpperCase()}")), "onboarding must personalize student type step");
expect(appSource.includes("What do you want under control?"), "onboarding must ask for goal");
expect(appSource.includes("StudyPlanner turns your schoolwork into a live plan."), "onboarding must show value artifact step");
expect(["Semester Health", "Next Move", "Class Pulse", "Pressure Forecast", "Notes Preparedness", "Widget"].every((label) => appSource.toLowerCase().includes(label.toLowerCase())), "artifact previews must cover core app surfaces");
expect(["Upload PDF", "Paste syllabus", "Scan with camera", "Skip for now"].every((label) => appSource.includes(label)), "value-first action must expose all requested choices");
expect(!appSource.includes(">Math<") && !appSource.includes("1 deadline · 2 blocks"), "onboarding previews must not show fake coursework");
expect(!appSource.includes("74%") && !appSource.includes("45 min tonight"), "onboarding previews must not show synthetic live-looking metrics");

expect(appSource.includes('if (source.scanIntent === "Paste syllabus") nav.push("paste", { mode: "syllabus" })'), "paste onboarding choice must route to preview paste");
expect(appSource.includes('else if (source.scanIntent === "Skip for now") nav.tab("lockedDashboard")'), "skip onboarding choice must route to locked dashboard");
expect(appSource.includes('else if (source.scanIntent === "Scan with camera") nav.push("scan", { action: "camera" })') && appSource.includes('else nav.push("scan", { action: "pdf" })'), "upload/camera onboarding choices must execute selected scan action");
expect(appSource.includes('params.action === "pdf"') && appSource.includes("runPdfImport()") && appSource.includes('params.action === "camera"') && appSource.includes('runImageOcr("camera", "syllabus")'), "scan screen must auto-run selected onboarding action");
expect(appSource.includes("if (!data.prefs.premium)") && appSource.includes('nav.push("paywall")'), "import apply must route to paywall without premium");
expect(appSource.includes("PRE_PURCHASE_ROUTES") && appSource.includes('"lockedDashboard"') && appSource.includes('"review"'), "locked funnel routes must remain whitelisted previews only");

const pkg = JSON.parse(packageSource);
expect(pkg.scripts?.["check:build52"] === "node scripts/check-build52.mjs", "package.json must expose check:build52");

if (failures.length) {
  console.error("Build 52 checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 52 access, onboarding, and locked funnel checks passed.");
