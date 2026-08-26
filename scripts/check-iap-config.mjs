import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const appSource = readFileSync("App.tsx", "utf8");
const iap = readFileSync("src/iap.ts", "utf8");
const iapManifest = readFileSync("src/config/iap.ts", "utf8");
const storeKit = readFileSync("qa/storekit/StudyPlannerLocal.storekit", "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

expect(app.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "app bundle id must remain com.mattnewman.studyplanner");
expect(app.ios?.appleTeamId === "5JN35MJ3QD", "Apple Team must remain 5JN35MJ3QD");
expect(JSON.stringify(app).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");
expect(iap.includes('STUDYPLANNER_BUNDLE_ID = "com.mattnewman.studyplanner"'), "IAP bundle constant must remain intact");
expect(iap.includes('STUDYPLANNER_ASC_APP_ID = "6766181202"'), "ASC app id must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.weekly"), "weekly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.monthly"), "monthly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.yearly"), "yearly IAP product ID must remain intact");
expect(iap.includes("com.mattnewman.studyplanner.plus.lifetime"), "lifetime IAP product ID must be configured");
expect(iap.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"), "entitlement must be checked against active App Store subscriptions");
expect(iap.includes("getAvailablePurchases({ onlyIncludeActiveItemsIOS: true"), "entitlement must be checked against restored lifetime purchases");
const fallbackSection = iap.slice(iap.indexOf("export function fallbackPlans"), iap.indexOf("function simulatorQaFixturePlans"));
expect((fallbackSection.match(/displayPrice: "Shown by App Store"/g) || []).length >= 3, "fallback plans must avoid real-looking prices until StoreKit loads localized products");
expect(!fallbackSection.includes('displayPrice: "$6.99"'), "weekly fallback must not show a fake App Store charge");
expect(!fallbackSection.includes('displayPrice: "$14.99"'), "monthly fallback must not show a fake App Store charge");
expect(!fallbackSection.includes('displayPrice: "$59.99"'), "lifetime fallback must not show a fake App Store charge");
expect(iap.includes("function simulatorQaFixturePlans") && iap.includes('EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA !== "1"'), "deterministic capture prices must be gated behind simulator QA env");
expect(
  appSource.includes("const selectedPlanHasOneWeekTrial = hasOneWeekFreeTrial(selectedPlan) && eligibleTrialProductIdSet.has(selectedPlan.id)") &&
    appSource.includes("const trialPlan = allSubscriptionsHaveOneWeekTrial && selectedPlanHasOneWeekTrial ? selectedPlan : undefined"),
  "active paywall must show a trial only when StoreKit supplies a one-week offer and Apple confirms eligibility",
);
expect(
  appSource.includes('textFor("paywall.legal_mixed", "Subscriptions auto-renew until canceled.') &&
    appSource.includes('textFor("common.terms", "Terms of Use")') &&
    appSource.includes('textFor("common.privacy", "Privacy Policy")'),
  "active paywall must distinguish subscription and lifetime terms while exposing Terms of Use and Privacy Policy",
);
expect(appSource.includes('textFor("paywall.sale_title", "40% off monthly")'), "active paywall must advertise the monthly sale prominently");
expect(appSource.includes('textDecorationLine: "line-through"'), "active paywall must strike through the monthly reference price");
expect(appSource.includes('plan.bestValue ? <Pill'), "active paywall must mark lifetime as best value");
expect(iapManifest.includes('appStoreConnectPriceUsd: "6.99"'), "weekly ASC target price must be 6.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "14.99"'), "monthly ASC sale price must be 14.99");
expect(iapManifest.includes('originalPriceUsd: "24.99"'), "monthly reference price must be 24.99");
expect(iapManifest.includes('discountPercent: 40'), "monthly discount must be documented as 40 percent");
expect(iapManifest.includes('productId: "com.mattnewman.studyplanner.plus.lifetime"'), "lifetime product must be present in the release manifest");
expect(iapManifest.includes('type: "non_consumable" as IapProductType'), "lifetime product must be non-consumable");
expect(iapManifest.includes('primaryPaywallVisible: false'), "yearly must remain cataloged but hidden from the primary paywall");
expect(iapManifest.includes("Back-to-School 2026 Weekly Plus One-Week Trial"), "weekly back-to-school intro offer must be documented in the IAP manifest");
expect(iapManifest.includes("Back-to-School 2026 Monthly Plus One-Week Trial"), "monthly back-to-school intro offer must be documented in the IAP manifest");
expect(iapManifest.includes("Back-to-School 2026 Yearly Plus One-Week Trial"), "yearly back-to-school intro offer must be documented in the IAP manifest");
expect((iapManifest.match(/availabilityStart: "2026-07-09"/g) || []).length >= 3, "all subscription intro offer start dates must match ASC");
expect((iapManifest.match(/availabilityEnd: "2026-09-30"/g) || []).length >= 3, "all subscription intro offer end dates must match ASC");
expect(storeKit.includes('"displayPrice": "6.99"'), "local StoreKit weekly price must be 6.99");
expect(storeKit.includes('"displayPrice": "14.99"'), "local StoreKit monthly sale price must be 14.99");
expect((storeKit.match(/"displayPrice": "59.99"/g) || []).length >= 2, "local StoreKit yearly compatibility and lifetime prices must be 59.99");
expect(storeKit.includes('"productID": "com.mattnewman.studyplanner.plus.lifetime"'), "local StoreKit must include lifetime product");
expect(storeKit.includes('"type": "NonConsumable"'), "local StoreKit lifetime product must be non-consumable");
expect(storeKit.includes('"internalID": "weekly_intro_back_to_school_2026"'), "local StoreKit weekly intro offer must remain configured");
expect(storeKit.includes('"internalID": "monthly_intro_back_to_school_2026"'), "local StoreKit monthly intro offer must remain configured");
expect(storeKit.includes('"internalID": "yearly_intro_back_to_school_2026"'), "local StoreKit yearly intro offer must remain configured");
expect((storeKit.match(/"paymentMode": "free"/g) || []).length >= 3, "local StoreKit intro offers must be free");
expect((storeKit.match(/"subscriptionPeriod": "P1W"/g) || []).length >= 3, "local StoreKit intro offers must last one week");

if (failures.length) {
  console.error("IAP config checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IAP config checks passed.");
