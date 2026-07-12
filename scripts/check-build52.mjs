import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const appSource = read("App.tsx");
const iapSource = read("src/iap.ts");
const storageSource = read("src/storage.ts");
const seedSource = read("src/seed.ts");
const pendingImportSource = read("src/pendingImport.ts");
const pdfTextSource = read("src/pdfText.ts");
const pdfImportSource = read("src/pdfImport.ts");
const imageTextSource = read("src/imageTextRecognition.ts");
const remindersSource = read("src/reminders.ts");
const reviewPromptSource = read("src/services/reviewPrompt.ts");
const packageSource = read("package.json");
const appJson = JSON.parse(read("app.json")).expo;
const xcodeProject = read("ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj");
const appInfoPlist = read("ios/StudyPlannerSyllabusAI/Info.plist");
const widgetInfoPlist = read("ios/ExpoWidgetsTarget/Info.plist");

function expect(pass, message) {
  if (!pass) failures.push(message);
}

const failures = [];
const finishPurchaseStart = iapSource.indexOf("export async function finishStudyPlannerPurchase");
const finishPurchaseEnd = iapSource.indexOf("export async function checkStudyPlannerEntitlement", finishPurchaseStart);
const finishPurchaseSource = finishPurchaseStart >= 0 && finishPurchaseEnd > finishPurchaseStart
  ? iapSource.slice(finishPurchaseStart, finishPurchaseEnd)
  : "";

expect(appSource.includes('type AccessState = "loading" | "onboarding" | "preview_allowed" | "locked" | "paywall" | "unlocked"'), "single AccessState union must exist");
expect(appJson.version === "2.0.8" && appJson.ios?.buildNumber === "84" && appJson.android?.versionCode === 79, "release metadata must be iOS 2.0.8 (84) with Android remaining at 79");
expect(appJson.android?.package === "com.mattnewman.studyplanner", "Android package must match the Play app");
expect((xcodeProject.match(/CURRENT_PROJECT_VERSION = 84;/g) || []).length >= 4, "native iOS app and widget project versions must be 84");
expect((xcodeProject.match(/MARKETING_VERSION = 2\.0\.8;/g) || []).length >= 4, "native app and widget marketing versions must be 2.0.8");
expect([appInfoPlist, widgetInfoPlist].every((plist) => {
  const inheritsBuildSettings = plist.includes("<string>$(MARKETING_VERSION)</string>") && plist.includes("<string>$(CURRENT_PROJECT_VERSION)</string>");
  const matchesGeneratedRelease = plist.includes("<string>2.0.8</string>") && plist.includes("<string>84</string>");
  return inheritsBuildSettings || matchesGeneratedRelease;
}), "native Info.plist files must inherit or exactly match Xcode marketing/build versions");
expect(/function entitlementUnlocks[\s\S]{0,160}return entitlementStatus === "active";/.test(appSource), "only active StoreKit entitlement may unlock");
expect(!/function entitlementUnlocks[\s\S]{0,220}data\.prefs\.premium/.test(appSource), "local premium flag must not participate in entitlementUnlocks");
expect(appSource.includes("function dataForAccessState") && appSource.includes("return lockedWidgetData(lockUnvalidatedPremium(data))"), "screen data must be fully scrubbed unless entitlement is active");
expect(appSource.includes("const props = { data: screenData"), "screens must receive access-sanitized data");
expect(appSource.includes("const persistedSnapshot = entitlementUnlocks(snapshot, entitlementStatus) ? snapshot : lockUnvalidatedPremium(snapshot)"), "persistence must scrub stale local premium");
expect(appSource.includes("allowValidatedPremium") && appSource.includes("lockUnvalidatedPremium(next)"), "mutations must scrub premium unless validation path allows it");
expect(appSource.includes("[Build52Access]") && appSource.includes("entitlementTraceSource"), "QA entitlement trace logs must identify source and route decision");
expect(appSource.includes('"terms"') && appSource.includes('"privacy"') && appSource.includes('displayRoute === "privacy"'), "terms and privacy must be in-app locked-safe routes");
expect(
  appSource.includes('const PRIVACY_URL = "https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408"') &&
    appSource.includes("openExternal(PRIVACY_URL)") &&
    !appSource.includes("https://www.apple.com/legal/privacy/"),
  "privacy screen must open StudyPlanner's hosted policy, never Apple's generic privacy page",
);
expect(appSource.includes("purchasablePlansReady") && appSource.includes("paywall.message_store_sheet") && appSource.includes("await purchasePlan(productId)") && appSource.includes("busy || !storePlansReady ? undefined : purchase") && !appSource.includes("Loading App Store price"), "purchase CTA must stay tappable with fallback product IDs instead of waiting for localized price text");
expect(
  iapSource.includes("let storeConnectionPromise: Promise<boolean> | null = null") &&
    iapSource.includes("storeConnectionPromise = initConnection().catch") &&
    iapSource.includes("storeConnectionPromise = null"),
  "StoreKit initialization must be shared and retryable instead of racing duplicate connections",
);
expect(
  finishPurchaseSource.includes("await checkStudyPlannerEntitlement()") &&
    finishPurchaseSource.includes("await finishTransaction") &&
    finishPurchaseSource.indexOf("await checkStudyPlannerEntitlement()") < finishPurchaseSource.indexOf("await finishTransaction") &&
    finishPurchaseSource.includes("for (let attempt = 0; attempt < 3; attempt += 1)") &&
    finishPurchaseSource.includes("throw new Error"),
  "purchase updates must prove an active entitlement before acknowledging StoreKit and remain retryable while propagation is delayed",
);
expect(
  appSource.includes('AppState.addEventListener("change"') &&
    appSource.includes("initializeStudyPlannerStore()") &&
    appSource.includes("setLoadAttempt((attempt) => attempt + 1)"),
  "foreground entitlement refresh and recoverable planner-load retry must remain wired",
);
expect(
  appSource.includes("setSaveError(textFor") &&
    appSource.includes("setSaveAttempt((attempt) => attempt + 1)") &&
    appSource.includes("[data, entitlementStatus, loaded, saveAttempt]"),
  "planner write failures must surface a recoverable retry without replacing in-memory data",
);
expect(
  appSource.includes('BackHandler.addEventListener("hardwareBackPress"') &&
    appSource.includes('nav.tab("today")'),
  "Android hardware back must close nested routes before leaving the dashboard",
);
expect(
  appSource.includes("function destinationFromNotificationData") &&
    appSource.includes("Notifications.getLastNotificationResponse()") &&
    appSource.includes("Notifications.addNotificationResponseReceivedListener") &&
    appSource.includes('nav.push("paywall", { next: destination.route, id: destination.params?.id || "" })') &&
    appSource.includes('["classDetail", "taskDetail", "assessmentDetail", "studySession"]'),
  "notification taps must resolve to the correct detail and survive a lapsed-entitlement paywall",
);
expect(appSource.includes('if (entitlementStatus === "loading") return;') && appSource.indexOf('if (entitlementStatus === "loading") return;') < appSource.indexOf("if (initial) initialUrlHandled.current = true"), "initial links must not be consumed while entitlement is loading");
expect(storageSource.includes("(incomingPrefs as any).osLive === true") && storageSource.includes("premium: false") && storageSource.includes("CORRUPT_BACKUP_PREFIX"), "storage migration must use strict booleans, distrust premium, and back up corrupt payloads");
expect(seedSource.includes('scanIntent: "Scan with camera"') && storageSource.includes('defaultData.prefs.scanIntent || "Scan with camera"'), "new and migrated planner defaults must preserve camera-first onboarding");

expect(appSource.includes("What should StudyPlanner call you?") && appSource.includes("Your first name"), "onboarding must ask for name first");
expect(appSource.includes('"onboarding.nice": "Nice, {name}."') && appSource.includes('textFor("onboarding.nice", "Nice, {name}.", { name: firstName })'), "onboarding must personalize the setup");
expect(appSource.includes('const steps = ["name", "priorities", "build"]'), "onboarding must stay concise while collecting name, context, priority, and build action");
expect(appSource.includes('scanIntent: "Scan with camera"') && appSource.includes('const scanFirstProfile = index === steps.length - 1 ? { ...source, scanIntent: "Scan with camera" } : source'), "camera scan must be the single default onboarding intent");
expect(["Paste syllabus", "Add manually", "Scan with camera"].every((label) => appSource.includes(label)), "simplified action step must expose camera, paste, and manual fallback");
expect(appSource.includes('studentType: source.studentType') && appSource.includes('mainGoal: source.mainGoal') && appSource.includes('renderChoiceGrid("studentType", studentTypeOptions)') && appSource.includes('renderChoiceGrid("mainGoal", goalOptions)'), "onboarding must persist the student context and priority that shape the live planner");
expect(!appSource.includes('step === "studentType"') && !appSource.includes('step === "mainGoal"') && !appSource.includes('step === "artifacts"'), "personalization must stay consolidated instead of restoring legacy option-heavy setup screens");
expect(appSource.includes('textFor("onboarding.camera_gate_title", "Unlock the camera scan.")') && appSource.includes('textFor("onboarding.camera_gate_body_simple", "Unlock first, then scan the syllabus on this iPhone.'), "onboarding must emphasize the paid camera scanner before import");
expect(!appSource.includes(">Math<") && !appSource.includes("1 deadline · 2 blocks"), "onboarding previews must not show fake coursework");
expect(!appSource.includes("74%") && !appSource.includes("45 min tonight"), "onboarding previews must not show synthetic live-looking metrics");
expect(appSource.includes("storedFirstName") && appSource.includes('data.prefs.firstName && data.prefs.firstName !== "Student"'), "onboarding must preserve a collected first name even if legacy full name is Student");
expect(appSource.includes('"locked.title": "{name}, build your semester."') && appSource.includes('textFor("locked.title", "{name}, build your semester.", { name: firstName })'), "locked home must personalize with the onboarding name");
expect(appSource.includes("The camera scan, PDF import, paste, and manual setup are locked until App Store unlock. You review every row before anything saves."), "locked home must state the unlock-first review-before-save path");
expect(appSource.includes("Unlock the scanner. Build the semester."), "locked home must explain the camera-first value path");
expect(appSource.includes("Unlock StudyPlanner") && appSource.includes("Scan with camera, PDF, paste, or manual setup") && appSource.includes("Review every extracted row before save"), "locked home must show the unlock-first three-step import path");
expect(appSource.includes('textFor("success.theme_kicker", "SYSTEM APPLIED")') && appSource.includes('textFor("success.theme_title", "App appearance, adaptive widgets")') && appSource.includes("success-loop"), "semester-ready payoff must prove the selected app appearance and adaptive widgets are applied");
expect(appSource.includes("Dashboard, focus blocks, and classes follow your app appearance. Widgets adapt separately to the Home and Lock Screen."), "semester-ready payoff must separate app appearance from the widget system environment");
expect(appSource.includes("const APPEARANCE_COPY") && appSource.includes('"appearance.system": "System"') && appSource.includes('"appearance.system": "Sistema"'), "System, Light, and Dark appearance labels must be localized instead of fallback-only");
expect(!appSource.includes('onPress={() => pickThemeColor') && !appSource.includes("semesterThemeColors.map"), "visible semester color picker must be removed from onboarding");
expect(appSource.includes('textFor("onboarding.theme_ready", "Ready to build")') && appSource.includes("const loopFeedback = ["), "compact setup proof must show the applied automatic semester system without exposing color choices");
const oldUnlockPhrase = ["before", "you", "unlock"].join(" ");
const staleFillerCopy = [
  [["Preview", "a", "scan,", "paste,", "or", "manual", "class", "first."].join(" "), ["Unlock", "only", "when", "you", "are", "ready", "to", "apply", "the", "plan."].join(" ")].join(" "),
  [["Preview", "what", "StudyPlanner", "finds"].join(" "), `${oldUnlockPhrase}.`].join(" "),
  ["Preview", oldUnlockPhrase].join(" "),
  ["Preview.", "Then", "unlock."].join(" "),
  ["89", "loop", "score", "ready"].join(" "),
  ["loop", "score", "ready"].join(" "),
];
expect(staleFillerCopy.every((phrase) => !appSource.includes(phrase)), "app source must not contain preview-before-unlock or loop-score filler copy");
expect(appSource.includes("Locked preview") && appSource.includes("Your score appears after your syllabus is reviewed and applied."), "Semester Health must be a locked preview without a real score");
expect(["Workload", "Grades", "Preparedness", "Consistency"].every((label) => appSource.includes(label)), "locked health preview must show dimension names only");
expect(!appSource.includes("0 / locked"), "locked health must not show a zero score as a fake metric");
expect(!appSource.includes("No active schedule") && !appSource.includes("No dashboard data") && !appSource.includes("No reminders"), "locked home must not look like a half-active dashboard");
expect(appSource.includes('const showTabs = entitlementUnlocks(data, entitlementStatus)'), "normal tab bar must be entitlement-gated");
expect(appSource.includes('displayRoute === "today" ? <Today') && appSource.includes('setStack([{ route: "lockedDashboard" }])'), "deep links to real app routes must resolve to locked home before entitlement");

expect(appSource.includes('textFor("scan.paste_text", "Paste text")') && appSource.includes('textFor("classes.add_manual", "Add class manually")'), "Scan must keep paste and manual entry as visible fallback paths");
expect(!appSource.includes('source.scanIntent === "Skip for now"') && !appSource.includes('completeAnd("lockedDashboard")'), "skip setup path must stay removed from onboarding and import options");
expect(appSource.includes('nav.push("paywall", { next: "scan", action: "camera" })'), "scan-first onboarding must carry camera intent into paywall continuation");
expect(appSource.includes('const cameraIntent = !currentImport && explicitDestination === "scan" && params.action !== "pdf"'), "locked/paywall funnel must preserve camera intent");
expect(appSource.includes('onPress={(step === "name" && !cleanProfileName) || (step === "priorities" && !prioritiesComplete) ? undefined : next}') && appSource.includes('textFor("onboarding.unlock_to_scan", "Unlock to scan")') && !appSource.includes('setTimeout(() => next(nextProfile)'), "onboarding must require a name and personalization choices, then use an explicit scan-first sticky CTA instead of auto-routing");
expect(appSource.includes("function PasteImport") && appSource.includes('params.mode === "manual"') && appSource.includes("Preview manual plan"), "manual class fallback must create a previewable import artifact");
expect(appSource.includes('params.action === "pdf"') && appSource.includes("runPdfImport()") && appSource.includes('params.action === "camera"') && appSource.includes('runImageOcr("camera", "syllabus")'), "scan screen must auto-run selected onboarding action");
expect(appSource.includes("if (!data.prefs.premium)") && appSource.includes('nav.push("paywall")'), "import apply must route to paywall without premium");
expect(appSource.includes("Preview only.") && appSource.includes("Unlock to apply this semester to the real app."), "non-premium import review must be clearly preview-only");
expect(appSource.includes('"review.guard_preview_body": "Unlock to apply this semester to the real app."') && appSource.includes('"paywall.sub_import": "Your preview is ready. Unlock, return to Review, then approve it for the live dashboard, reminders, and widgets."'), "locked preview summary must state review-after-unlock before anything applies");
expect(appSource.includes('if (currentImport) nav.replaceTop("review")') && !appSource.includes("return currentImport ? applyImport(unlocked, currentImport) : unlocked"), "pending import unlock must return to review instead of applying automatically");
expect(appSource.includes('const PRE_PURCHASE_ROUTES: Route[] = ["welcome", "onboarding", "importOptions", "semesterKickoff", "lockedDashboard", "paywall", "terms", "privacy"]'), "locked funnel must expose only onboarding, the truthful event hub, legal, and purchase-safe routes before purchase");
expect(appSource.includes("loadPendingImport()") && appSource.includes("resolveInitialRouteForData(safeStored, pendingImport)") && appSource.includes('initialRoute === "reviewPendingImport"'), "pending import drafts must restore into review after relaunch");
expect(appSource.includes("savePendingImport(currentImport)") && appSource.includes("clearPendingImport().catch"), "pending import drafts must persist while waiting and clear after apply/unlock");
expect(appSource.includes("applyPendingImport") && appSource.includes("{ applyPendingImport: !pendingImport }"), "restored pending imports must review before applying for already-premium users");
expect(pendingImportSource.includes("PENDING_IMPORT_FILE") && pendingImportSource.includes("MAX_PENDING_IMPORT_BYTES") && pendingImportSource.includes("MAX_PENDING_IMPORT_AGE_DAYS") && pendingImportSource.includes('batch.status === "review"'), "pending import storage must validate, cap, and expire review drafts only");
expect(pdfTextSource.includes("wordCount < 55") && pdfTextSource.includes("hasEnoughStructure"), "PDF extraction must reject low-signal text");
expect(pdfImportSource.includes("MAX_PDF_IMPORT_BYTES") && pdfImportSource.includes("asset.size ?? file.size") && !pdfImportSource.includes("readAsStringAsync") && pdfImportSource.includes("file.base64()"), "PDF import must guard oversized reads and use Expo 56 File API");
expect(imageTextSource.includes("wordCount < 8") && imageTextSource.includes("Retake it closer"), "camera OCR must reject low-signal captures");
expect(appSource.includes('displayRoute === "widgets" ? <WidgetsScreen') && appSource.includes('textFor("widgets.row_week", "Week Load")') && appSource.includes('textFor("widgets.row_week_body", "Pressure by week")'), "widgets route must render a real widgets screen");
expect(!/Semester Health[\s\S]{0,120}(81|78|62|82|100)/.test(appSource), "locked/no-semester UX must not contain fake health or dimension numbers");
expect(appSource.includes('accessibilityState={{ disabled }}') && appSource.includes("disabled={disabled}"), "shared button must expose disabled semantics");
expect(!/shadow(Color|Opacity|Radius|Offset)/.test(appSource), "legacy React Native shadow props must not trigger dev warnings");
expect(appSource.includes("No notes loaded") && appSource.includes('nav.push("paste", { mode: "notes" })'), "notes screen must expose empty-state scan and paste actions");
expect(appSource.includes("cancelReminderNotificationIds") && remindersSource.includes("cancelReminderNotificationIds"), "reminder toggles must cancel native notification ids");
expect(remindersSource.includes("hasConfiguredReminders") && remindersSource.includes("!configured.enabled") && remindersSource.includes("preservedConfiguredReminders"), "reminder refresh must preserve disabled rows and schedule only explicitly enabled configured reminders");
expect(remindersSource.includes("newlyScheduledNotificationIds") && remindersSource.includes("await cancelReminderNotificationIds(newlyScheduledNotificationIds)") && remindersSource.includes("mergeRemainingScheduledEvidence") && appSource.includes("if (result.reminders)"), "partial reminder failures must aggregate rollback results and retain only native scheduling evidence that could not be removed");
expect(appSource.includes("finally") && appSource.includes("setScheduling(false)"), "reminder scheduling must reset UI state with finally");
expect(appSource.includes('nav.push("tasks")') && !appSource.includes('nav.tab("tasks")'), "tasks must open as a stack route instead of an unrepresented tab");
expect(reviewPromptSource.includes("StoreReview.requestReview()") && reviewPromptSource.includes("StoreReview.isAvailableAsync()"), "value-gated review moments must use the standardized native review request");
expect(!appSource.includes("reviewRoutingCopy") && !appSource.includes("APP_STORE_REVIEW_URL") && !reviewPromptSource.includes("routeReviewRating") && !reviewPromptSource.includes("feedbackUrlForRating"), "review solicitation must not use a custom star prompt, rating filter, or direct review-link button");

const pkg = JSON.parse(packageSource);
expect(pkg.scripts?.["check:build52"] === "node scripts/check-build52.mjs", "package.json must expose check:build52");

if (failures.length) {
  console.error("Build 84 checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 84 access, onboarding, appearance, and locked funnel checks passed.");
