import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type Check = {
  name: string;
  pass: boolean;
  detail?: string;
};

const APP_SOURCE_PATH = "App.tsx";
const APP_CONFIG_PATH = "app.json";
const WIDGET_RUNTIME_PATH = "src/widgets/StudyPlannerWidgets.tsx";
const MORE_SCREEN_PATH = "src/screens/MoreScreen.tsx";
const IAP_SOURCE_PATH = "src/iap.ts";
const COPY_B_HUMAN_REVIEW_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-human-visual-review-2026-07-09.md";
const AUDIT_PATH = "qa/back-to-school-2026/first-experience-funnel-audit.json";

const failures: string[] = [];
const warnings: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string, fallback: T): T {
  const raw = read(path);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function section(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    failures.push(`Missing section start: ${startMarker}`);
    return "";
  }
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) {
    failures.push(`Missing section end after ${startMarker}: ${endMarker}`);
    return source.slice(start);
  }
  return source.slice(start, end);
}

function quotedArray(source: string, variableName: string) {
  const match = source.match(new RegExp(`const\\s+${variableName}\\s*=\\s*\\[([^\\]]+)\\]`));
  if (!match?.[1]) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function pushCheck(checks: Check[], check: Check) {
  checks.push(check);
  if (!check.pass) failures.push(check.detail ? `${check.name}: ${check.detail}` : check.name);
}

function containsAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

const appSource = read(APP_SOURCE_PATH);
const appConfig = readJson<any>(APP_CONFIG_PATH, {});
const widgetRuntime = read(WIDGET_RUNTIME_PATH);
const moreScreen = read(MORE_SCREEN_PATH);
const iapSource = read(IAP_SOURCE_PATH);
const copyBHumanReview = read(COPY_B_HUMAN_REVIEW_PATH);

const onboarding = section(appSource, "function Onboarding(", "\nfunction ImportOptions(");
const paywall = section(appSource, "function Paywall(", "\nfunction Today(");
const review = section(appSource, "function ReviewImport(", "\nfunction ApplySuccess(");
const scanOptions = quotedArray(onboarding, "scanOptions");
const steps = quotedArray(onboarding, "steps");
const maxClicksToPreviewWithOptionChange = steps.length + 1;
const widgetDefinitions = appConfig?.expo?.plugins?.find?.((plugin: unknown) => {
  return Array.isArray(plugin) && plugin[0] === "expo-widgets";
})?.[1]?.widgets || [];
const widgetsWithColorConfig = Array.isArray(widgetDefinitions)
  ? widgetDefinitions.filter((widget: any) => Boolean(widget?.ios?.configuration?.parameters?.themeColor))
  : [];

const checks: Check[] = [];

pushCheck(checks, {
  name: "onboarding is a concise three-step personalized funnel",
  pass:
    steps.length === 3 &&
    steps[0] === "name" &&
    steps[1] === "priorities" &&
    steps[2] === "build" &&
    onboarding.includes("studentTypeOptions") &&
    onboarding.includes("goalOptions") &&
    onboarding.includes("initialStudentType") &&
    onboarding.includes("initialMainGoal") &&
    onboarding.includes("hasSavedPersonalization") &&
    onboarding.includes('const initialStudentType = !hasSavedPersonalization\n    ? ""') &&
    onboarding.includes('const initialMainGoal = !hasSavedPersonalization') &&
    onboarding.includes(': "Deadlines";') &&
    onboarding.includes('step === "priorities" && !prioritiesComplete') &&
    onboarding.includes("studentType: source.studentType") &&
    onboarding.includes("mainGoal: source.mainGoal") &&
    onboarding.includes("onboarding.build_title_personal") &&
    onboarding.includes("autoFocus"),
  detail: `steps=${JSON.stringify(steps)}`,
});

pushCheck(checks, {
  name: "onboarding is scan-first with fallbacks deferred to Scan",
  pass:
    scanOptions.length === 0 &&
    onboarding.includes('scanIntent: "Scan with camera"') &&
    onboarding.includes('const scanFirstProfile = index === steps.length - 1 ? { ...source, scanIntent: "Scan with camera" } : source') &&
    onboarding.includes('nav.push("paywall", { next: "scan", action: "camera" })') &&
    !onboarding.includes('nav.push("paywall", { next: "paste"') &&
    appSource.includes('textFor("scan.paste_text", "Paste text")') &&
    appSource.includes('textFor("classes.add_manual", "Add class manually")'),
  detail: "Expected onboarding to lead with syllabus scanning and keep Paste/Manual on the Scan screen.",
});

pushCheck(checks, {
  name: "first setup surface has no skip path",
  pass:
    !onboarding.includes('source.scanIntent === "Skip for now"') &&
    !onboarding.includes("Skip for now") &&
    !appSource.includes('completeAnd("lockedDashboard")') &&
    !appSource.includes('[textFor("option.skip", "Skip for now")'),
  detail: "Expected setup to require scan, paste, or manual preview with no visible skip option.",
});

pushCheck(checks, {
  name: "the personalized paywall appears within four taps from the fresh funnel",
  pass: maxClicksToPreviewWithOptionChange <= 4,
  detail: `maxClicksToPreviewWithOptionChange=${maxClicksToPreviewWithOptionChange}`,
});

pushCheck(checks, {
  name: "scan-first onboarding hits paywall before import",
  pass:
    onboarding.includes('nav.push("paywall", { next: "scan", action: "camera" })') &&
    !onboarding.includes('nav.push("cameraScanner"') &&
    !onboarding.includes('nav.push("paste",') &&
    appSource.includes('return { route: "scan", params: { action: "camera" } };'),
  detail: "Expected fresh onboarding and a generic successful unlock to continue to Scan.",
});

pushCheck(checks, {
  name: "paywall is a full screen, not a transient popup",
  pass:
    paywall.includes("return (") &&
    paywall.includes("<View style={{ flex: 1") &&
    paywall.includes("plans.map") &&
    paywall.includes("paywall.legal") &&
    paywall.includes("purchasePlan(productId)") &&
    paywall.includes("restoreStudyPlannerPurchases()") &&
    !paywall.includes("<Modal"),
  detail: "Expected the Paywall component to render a full route with App Store proof, purchase, and restore actions.",
});

pushCheck(checks, {
  name: "paywall presents the seasonal one-week trial only from live StoreKit data",
  pass:
    paywall.includes("loadEligibleIntroOfferProductIds(plans)") &&
    paywall.includes("const selectedPlanHasOneWeekTrial = hasOneWeekFreeTrial(selectedPlan) && eligibleTrialProductIdSet.has(selectedPlan.id)") &&
    paywall.includes("const allPlansHaveOneWeekTrial = plans.length > 0 && plans.every") &&
    paywall.includes("const trialPlan = allPlansHaveOneWeekTrial && selectedPlanHasOneWeekTrial ? selectedPlan : undefined") &&
    paywall.includes('textFor("paywall.seasonal_title", "One week free with any plan")') &&
    paywall.includes('textFor("paywall.trial_cta", "Start one-week free trial")') &&
    paywall.includes("selectedPlanPeriodLabel") &&
    paywall.includes("Auto-renews until canceled.") &&
    paywall.includes("trialPlan ? (") &&
    paywall.includes("selectedPlanHasOneWeekTrial ?") &&
    (paywall.includes("paddingBottom: 180") || paywall.includes("paddingBottom: (accessibilityLayout ? 24 : 180) + insets.bottom")) &&
    paywall.includes("selectedPlanSummary") &&
    iapSource.includes('offer.paymentMode !== "free-trial"') &&
    iapSource.includes('offer.periodUnit === "week" && totalUnits === 1') &&
    iapSource.includes("await isEligibleForIntroOfferIOS(groupId)"),
  detail: "Expected StoreKit introductory-offer data to control the seasonal card, plan badges, and purchase CTA.",
});

pushCheck(checks, {
  name: "actual IAP purchase callback preserves the selected paywall destination",
  pass:
    appSource.includes("function unlockDestinationFromPaywall") &&
    appSource.includes("const paywallDestinationRef = useRef<NavItem | null>(null)") &&
    appSource.includes('if (params.next === "scan") return { route: "scan"') &&
    appSource.includes('if (params.next === "paste") return { route: "paste"') &&
    appSource.includes('return { route: "scan", params: { action: "camera" } };') &&
    appSource.includes('if (route === "paywall") paywallDestinationRef.current = { route, params }') &&
    appSource.includes('activateEntitlement(entitlement.productId, entitlement.checkedAt, { destination: paywallDestinationRef.current })'),
  detail: "Expected real StoreKit purchase updates to route to the selected scan/paste/manual/widget destination after unlock.",
});

pushCheck(checks, {
  name: "review cannot silently discard undated tasks or exams",
  pass:
    review.includes("const requiresResolvedDate = (item: ImportCandidate)") &&
    review.includes("const candidateIsBlocked = (candidate: ImportCandidate)") &&
    review.includes("|| requiresResolvedDate(candidate)") &&
    review.includes('textFor("review.invalid_date", "Enter a valid YYYY-MM-DD date before approving this row.")') &&
    review.includes("accessibilityState={{ checked: effectivelyApproved, disabled: rowBlocked }}") &&
    review.includes("disabled={rowBlocked}"),
  detail: "Expected missing/invalid task and exam dates to block approval and Apply until corrected or explicitly removed.",
});

pushCheck(checks, {
  name: "onboarding has no visible color customization",
  pass:
    onboarding.includes('semesterThemeColorId: data.prefs.semesterThemeColorId || "graphite" as SemesterThemeColorId') &&
    onboarding.includes("resolveSemesterThemeColor(profile.semesterThemeColorId)") &&
    !onboarding.includes('renderOptions("semesterThemeColorId"') &&
    !onboarding.includes('renderOptions("theme"') &&
    !onboarding.includes('pick("semesterThemeColorId"') &&
    !containsAny(onboarding, ["Color picker", "Pick a color", "Choose a color", "themeOptions"]),
  detail: "Expected automatic graphite theme with no user-facing theme/color option picker in onboarding.",
});

pushCheck(checks, {
  name: "widget and settings color customization is not exposed",
  pass:
    widgetsWithColorConfig.length === 0 &&
    !widgetRuntime.includes("configuration.themeColor") &&
    !widgetRuntime.includes("function themeAccent") &&
    !widgetRuntime.includes("function themeTint") &&
    !containsAny(moreScreen, ["Color Studio", "Widget Studio", "Choose palette", "themeColor"]),
  detail: `widgetsWithColorConfig=${widgetsWithColorConfig.length}`,
});

pushCheck(checks, {
  name: "Copy B remains blocked by the independent human review",
  pass:
    copyBHumanReview.includes("Decision: **BLOCKED - DO NOT SUBMIT PPO**") &&
    copyBHumanReview.includes("0/119 assets at 9+/10") &&
    copyBHumanReview.includes("not approved for PPO"),
  detail: "Expected the committed independent review to keep all GPT Image 2.0 Treatment B assets blocked.",
});

const payload = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "ready",
  funnel: {
    steps,
    scanOptions,
    maxClicksToPaywallWithOptionChange: maxClicksToPreviewWithOptionChange,
    personalization: {
      nameStep: onboarding.includes("TextInput autoFocus"),
      personalBuildTitle: onboarding.includes("onboarding.build_title_personal"),
    },
    activeRoutes: {
      primary: 'onboarding -> paywall?next=scan&action=camera -> scan after StoreKit entitlement',
      camera: 'scan -> cameraScanner',
      paste: 'paywall?next=paste&mode=syllabus -> paste after StoreKit entitlement',
      manual: 'paywall?next=paste&mode=manual -> manual setup after StoreKit entitlement',
    },
  },
  colorCustomization: {
    onboardingThemeFixedToGraphite: onboarding.includes('semesterThemeColorId: "graphite" as SemesterThemeColorId'),
    widgetConfigurationColorParameters: widgetsWithColorConfig.length,
    widgetRuntimeReadsThemeColor: widgetRuntime.includes("configuration.themeColor"),
  },
  copyB: {
    status: "blocked_do_not_upload",
    humanReview: COPY_B_HUMAN_REVIEW_PATH,
    uploadAuthorized: false,
  },
  checks,
  failures,
  warnings,
};

mkdirSync(dirname(AUDIT_PATH), { recursive: true });
writeFileSync(AUDIT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("First-experience funnel checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Audit written to ${AUDIT_PATH}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("First-experience funnel warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

console.log(`First-experience funnel checks passed: ${checks.length}/${checks.length}`);
console.log(`Audit written to ${AUDIT_PATH}`);
