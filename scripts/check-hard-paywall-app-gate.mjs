import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const appSource = read("App.tsx");
const widgetSource = read("src/widgetEngine.ts");
const iapSource = read("src/iap.ts");
const onboardingSource = appSource.slice(appSource.indexOf("function Onboarding("), appSource.indexOf("\nfunction ImportOptions("));
const cameraScannerSource = appSource.slice(appSource.indexOf("function CameraScanner("), appSource.indexOf("\nfunction GuidedScannerDemoSurface("));
const pasteImportSource = appSource.slice(appSource.indexOf("function PasteImport("), appSource.indexOf("\nfunction ReviewImport("));

const checks = [
  {
    name: "fresh deep links cannot complete onboarding",
    pass:
      appSource.includes("if (!onboardingComplete(data))") &&
      (appSource.includes('setStack([{ route: "welcome" }]') || appSource.includes('setStack([{ route: "onboarding" }]')) &&
      !/routeUrl[\s\S]{0,900}onboardingComplete:\s*true/.test(appSource),
  },
  {
    name: "route matching tokenizes URLs instead of substring-matching studyplanner",
    pass:
      appSource.includes("function routeTokensFromUrl") &&
      appSource.includes("const routeTokens = routeTokensFromUrl(rawUrl)") &&
      appSource.includes("function routeFromUrl") &&
      !appSource.includes('target.includes("plan")') &&
      !appSource.includes('url.includes("calendar") || url.includes("plan")'),
  },
  {
    name: "centralized app access lock separates onboarding from premium",
    pass:
      appSource.includes("function appAccessLocked") &&
      appSource.includes("onboardingComplete(data) && !entitlementUnlocks(data, entitlementStatus)") &&
      appSource.includes('return "lockedDashboard"') &&
      appSource.includes("lockUnvalidatedPremium"),
  },
  {
    name: "no entitlement means no persisted planner routes",
    pass:
      appSource.includes("if (!entitlementUnlocks(data, entitlementStatus))") &&
      appSource.includes('setStack([{ route: "lockedDashboard" }]') &&
      appSource.includes('const PRE_PURCHASE_ROUTES: Route[] = ["welcome", "onboarding", "importOptions", "semesterKickoff", "lockedDashboard", "paywall", "terms", "privacy"]') &&
      appSource.includes('return "lockedDashboard"') &&
      appSource.includes('const showTabs = entitlementUnlocks(data, entitlementStatus)'),
  },
  {
    name: "scan-first onboarding routes to paywall before scanner or import",
    pass:
      onboardingSource.includes('scanIntent: "Scan with camera"') &&
      onboardingSource.includes('const scanFirstProfile = index === steps.length - 1 ? { ...source, scanIntent: "Scan with camera" } : source') &&
      onboardingSource.includes('nav.push("paywall", { next: "scan", action: "camera" })') &&
      !onboardingSource.includes('nav.push("paywall", { next: "paste"') &&
      !onboardingSource.includes('nav.push("cameraScanner"') &&
      !onboardingSource.includes('nav.push("paste",'),
  },
  {
    name: "scanner and import routes keep defensive premium guards",
    pass:
      cameraScannerSource.includes("if (!data.prefs.premium)") &&
      cameraScannerSource.includes('nav.push("paywall", { next: "scan", action: "camera" })') &&
      pasteImportSource.includes("const previewOnly = !data.prefs.premium") &&
      pasteImportSource.includes('const openPasteUnlock = () => nav.push("paywall", { next: "paste", mode: requestedMode })') &&
      pasteImportSource.includes("if (previewOnly)") &&
      appSource.includes("const requirePremium = (paywallParams: Record<string, string>)") &&
      appSource.includes("if (requirePremium({ next: \"scan\", action: \"pdf\" })) return") &&
      appSource.includes('previewOnly ? requirePremium({ next: "paste", mode: "syllabus" })'),
  },
  {
    name: "seasonal one-week trial is sourced from StoreKit and shown conditionally",
    pass:
      iapSource.includes("product.subscriptionOffers?.find((offer) => offer.type === \"introductory\")") &&
      iapSource.includes('offer.paymentMode !== "free-trial"') &&
      iapSource.includes('offer.periodUnit === "week" && totalUnits === 1') &&
      iapSource.includes('offer.periodUnit === "day" && totalUnits === 7') &&
      iapSource.includes("await isEligibleForIntroOfferIOS(groupId)") &&
      iapSource.includes("eligibility.set(groupId, false)") &&
      appSource.includes("loadEligibleIntroOfferProductIds(plans)") &&
      appSource.includes("const selectedPlanHasOneWeekTrial = hasOneWeekFreeTrial(selectedPlan) && eligibleTrialProductIdSet.has(selectedPlan.id)") &&
      appSource.includes("const allPlansHaveOneWeekTrial = plans.length > 0 && plans.every") &&
      appSource.includes("const trialPlan = allPlansHaveOneWeekTrial && selectedPlanHasOneWeekTrial ? selectedPlan : undefined") &&
      appSource.includes('textFor("paywall.seasonal_title", "One week free with any plan")') &&
      appSource.includes('textFor("paywall.trial_cta", "Start one-week free trial")') &&
      appSource.includes('Auto-renews until canceled.') &&
      appSource.includes("selectedPlanSummary") &&
      !iapSource.match(/fallbackPlans[\s\S]{0,1600}introductoryOffer/),
  },
  {
    name: "actual IAP purchase callback preserves paywall destination",
    pass:
      appSource.includes("function unlockDestinationFromPaywall") &&
      appSource.includes("const paywallDestinationRef = useRef<NavItem | null>(null)") &&
      appSource.includes('if (params.next === "scan") return { route: "scan"') &&
      appSource.includes('if (params.next === "paste") return { route: "paste"') &&
      appSource.includes('return { route: "scan", params: { action: "camera" } };') &&
      appSource.includes('if (route === "paywall") paywallDestinationRef.current = { route, params }') &&
      appSource.includes('activateEntitlement(entitlement.productId, entitlement.checkedAt, { destination: paywallDestinationRef.current })'),
  },
  {
    name: "locked widget sync sends empty planner data",
    pass:
      appSource.includes("function lockedWidgetData") &&
      appSource.includes("classes: []") &&
      appSource.includes("tasks: []") &&
      appSource.includes("exams: []") &&
      appSource.includes("notes: []") &&
      appSource.includes("const widgetSyncData = appAccessLocked") &&
      widgetSource.includes("const locked = !data.prefs.premium") &&
      widgetSource.includes("progress: 0"),
  },
  {
    name: "local premium cache cannot unlock without store validation",
    pass:
      appSource.includes("lockUnvalidatedPremium(stored)") &&
      appSource.includes('setEntitlementStatus("active")') &&
      iapSource.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"),
  },
  {
    name: "Google Play review access stays explicit and Android build gated",
    pass:
      appSource.includes('GOOGLE_PLAY_REVIEW_ACCESS_CODE = "STUDYPLANNER-REVIEW-2026"') &&
      appSource.includes('GOOGLE_PLAY_REVIEW_PRODUCT_ID = "google-play-review-access"') &&
      appSource.includes("function googlePlayReviewAccessEnabled") &&
      appSource.includes('Platform.OS === "android"') &&
      appSource.includes('EXPO_PUBLIC_GOOGLE_PLAY_REVIEW_ACCESS === "1"') &&
      appSource.includes("googlePlayReviewAccessCodeMatches(reviewAccessCode)") &&
      appSource.includes("unlock(GOOGLE_PLAY_REVIEW_PRODUCT_ID"),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length) {
  console.error("Hard-paywall checks failed:");
  failed.forEach((check) => console.error(`- ${check.name}`));
  process.exit(1);
}

console.log("Hard-paywall checks passed.");
