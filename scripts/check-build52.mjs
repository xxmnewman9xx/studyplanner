import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const appSource = read("App.tsx");
const iapSource = read("src/iap.ts");
const storageSource = read("src/storage.ts");
const pendingImportSource = read("src/pendingImport.ts");
const pdfTextSource = read("src/pdfText.ts");
const pdfImportSource = read("src/pdfImport.ts");
const imageTextSource = read("src/imageTextRecognition.ts");
const remindersSource = read("src/reminders.ts");
const packageSource = read("package.json");
const appJson = JSON.parse(read("app.json")).expo;
const xcodeProject = read("ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj");

function expect(pass, message) {
  if (!pass) failures.push(message);
}

const failures = [];

expect(appSource.includes('type AccessState = "loading" | "onboarding" | "preview_allowed" | "locked" | "paywall" | "unlocked"'), "single AccessState union must exist");
expect(appJson.version === "1.0.3" && appJson.ios?.buildNumber === "55", "release metadata must remain 1.0.3 (55)");
expect(!xcodeProject.includes("CURRENT_PROJECT_VERSION = 52;") && (xcodeProject.match(/CURRENT_PROJECT_VERSION = 55;/g) || []).length >= 4, "native app and widget project versions must remain 55");
expect(/function entitlementUnlocks[\s\S]{0,160}return entitlementStatus === "active";/.test(appSource), "only active StoreKit entitlement may unlock");
expect(!/function entitlementUnlocks[\s\S]{0,220}data\.prefs\.premium/.test(appSource), "local premium flag must not participate in entitlementUnlocks");
expect(appSource.includes("function dataForAccessState") && appSource.includes("return lockedWidgetData(lockUnvalidatedPremium(data))"), "screen data must be fully scrubbed unless entitlement is active");
expect(appSource.includes("const props = { data: screenData"), "screens must receive access-sanitized data");
expect(appSource.includes("const persistedSnapshot = entitlementUnlocks(snapshot, entitlementStatus) ? snapshot : lockUnvalidatedPremium(snapshot)"), "persistence must scrub stale local premium");
expect(appSource.includes("allowValidatedPremium") && appSource.includes("lockUnvalidatedPremium(next)"), "mutations must scrub premium unless validation path allows it");
expect(appSource.includes("[Build52Access]") && appSource.includes("entitlementTraceSource"), "QA entitlement trace logs must identify source and route decision");
expect(appSource.includes('"terms"') && appSource.includes('"privacy"') && appSource.includes('displayRoute === "privacy"'), "terms and privacy must be in-app locked-safe routes");
expect(!appSource.includes("PRIVACY_URL") && !appSource.includes("https://www.apple.com/legal/privacy/"), "privacy policy must not point to Apple's generic privacy page");
expect(appSource.includes("storePlansReady") && appSource.includes("Loading App Store price") && appSource.includes("busy || !storePlansReady ? undefined : purchase"), "purchase CTA must be disabled until localized App Store pricing is loaded");
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
expect(appSource.includes("storedFirstName") && appSource.includes('data.prefs.firstName && data.prefs.firstName !== "Student"'), "onboarding must preserve a collected first name even if legacy full name is Student");
expect(appSource.includes("{firstName}, build your semester."), "locked home must personalize with the onboarding name");
expect(appSource.includes("Upload a syllabus to preview what StudyPlanner finds."), "locked home must motivate syllabus import before unlock");
expect(appSource.includes("Turn your syllabus into a live plan."), "locked home must explain the value path");
expect(appSource.includes("Upload syllabus") && appSource.includes("Review deadlines") && appSource.includes("Unlock your semester"), "locked home must show the three-step import path");
expect(appSource.includes("Locked preview") && appSource.includes("Your score appears after your syllabus is reviewed and applied."), "Semester Health must be a locked preview without a real score");
expect(["Workload", "Grades", "Preparedness", "Consistency"].every((label) => appSource.includes(label)), "locked health preview must show dimension names only");
expect(!appSource.includes("0 / locked"), "locked health must not show a zero score as a fake metric");
expect(!appSource.includes("No active schedule") && !appSource.includes("No dashboard data") && !appSource.includes("No reminders"), "locked home must not look like a half-active dashboard");
expect(appSource.includes('const showTabs = entitlementUnlocks(data, entitlementStatus)'), "normal tab bar must be entitlement-gated");
expect(appSource.includes('displayRoute === "today" ? <Today') && appSource.includes('setStack([{ route: "lockedDashboard" }])'), "deep links to real app routes must resolve to locked home before entitlement");

expect(appSource.includes('if (source.scanIntent === "Paste syllabus") nav.push("paste", { mode: "syllabus" })'), "paste onboarding choice must route to preview paste");
expect(appSource.includes('else if (source.scanIntent === "Skip for now") nav.tab("lockedDashboard")'), "skip onboarding choice must route to locked dashboard");
expect(appSource.includes('else if (source.scanIntent === "Scan with camera") nav.push("scan", { action: "camera" })') && appSource.includes('else nav.push("scan", { action: "pdf" })'), "upload/camera onboarding choices must execute selected scan action");
expect(appSource.includes('params.action === "pdf"') && appSource.includes("runPdfImport()") && appSource.includes('params.action === "camera"') && appSource.includes('runImageOcr("camera", "syllabus")'), "scan screen must auto-run selected onboarding action");
expect(appSource.includes("if (!data.prefs.premium)") && appSource.includes('nav.push("paywall")'), "import apply must route to paywall without premium");
expect(appSource.includes("Preview only.") && appSource.includes("Unlock to apply this semester to the real app."), "non-premium import review must be clearly preview-only");
expect(appSource.includes("This preview has not populated the dashboard, widgets, reminders, or active semester."), "locked preview summary must state nothing has been applied");
expect(appSource.includes("Unlock to apply") && appSource.includes("READY TO APPLY"), "pending import preview must become the primary paywall incentive");
expect(appSource.includes("PRE_PURCHASE_ROUTES") && appSource.includes('"lockedDashboard"') && appSource.includes('"review"'), "locked funnel routes must remain whitelisted previews only");
expect(appSource.includes("loadPendingImport()") && appSource.includes("resolveInitialRouteForData(safeStored, pendingImport)") && appSource.includes('initialRoute === "reviewPendingImport"'), "pending import drafts must restore into review after relaunch");
expect(appSource.includes("savePendingImport(currentImport)") && appSource.includes("clearPendingImport().catch"), "pending import drafts must persist while waiting and clear after apply/unlock");
expect(appSource.includes("applyPendingImport") && appSource.includes("{ applyPendingImport: !pendingImport }"), "restored pending imports must review before applying for already-premium users");
expect(pendingImportSource.includes("PENDING_IMPORT_FILE") && pendingImportSource.includes("MAX_PENDING_IMPORT_BYTES") && pendingImportSource.includes("MAX_PENDING_IMPORT_AGE_DAYS") && pendingImportSource.includes('batch.status === "review"'), "pending import storage must validate, cap, and expire review drafts only");
expect(pdfTextSource.includes("wordCount < 55") && pdfTextSource.includes("hasEnoughStructure"), "PDF extraction must reject low-signal text");
expect(pdfImportSource.includes("MAX_PDF_IMPORT_BYTES") && pdfImportSource.includes("asset.size ?? file.size") && !pdfImportSource.includes("readAsStringAsync") && pdfImportSource.includes("file.base64()"), "PDF import must guard oversized reads and use Expo 56 File API");
expect(imageTextSource.includes("wordCount < 8") && imageTextSource.includes("Retake it closer"), "camera OCR must reject low-signal captures");
expect(appSource.includes('displayRoute === "widgets" ? <WidgetsScreen') && appSource.includes('["Week Load", "Pressure by week", "bar-chart-3"'), "widgets route must render a real widgets screen");
expect(!/Semester Health[\s\S]{0,120}(81|78|62|82|100)/.test(appSource), "locked/no-semester UX must not contain fake health or dimension numbers");
expect(appSource.includes('accessibilityState={{ disabled }}') && appSource.includes("disabled={disabled}"), "shared button must expose disabled semantics");
expect(!/shadow(Color|Opacity|Radius|Offset)/.test(appSource), "legacy React Native shadow props must not trigger dev warnings");
expect(appSource.includes("No notes loaded") && appSource.includes('nav.push("paste", { mode: "notes" })'), "notes screen must expose empty-state scan and paste actions");
expect(appSource.includes("cancelReminderNotificationIds") && remindersSource.includes("cancelReminderNotificationIds"), "reminder toggles must cancel native notification ids");
expect(appSource.includes("finally") && appSource.includes("setScheduling(false)"), "reminder scheduling must reset UI state with finally");
expect(appSource.includes('nav.push("tasks")') && !appSource.includes('nav.tab("tasks")'), "tasks must open as a stack route instead of an unrepresented tab");

const pkg = JSON.parse(packageSource);
expect(pkg.scripts?.["check:build52"] === "node scripts/check-build52.mjs", "package.json must expose check:build52");

if (failures.length) {
  console.error("Build 52 checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 52 access, onboarding, and locked funnel checks passed.");
