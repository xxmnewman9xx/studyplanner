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
expect(iap.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"), "entitlement must be checked against active App Store subscriptions");
expect((iap.match(/displayPrice: "Shown by App Store"/g) || []).length >= 3, "fallback plans must avoid real-looking prices until StoreKit loads localized products");
expect(!iap.includes('displayPrice: "$9.99"'), "weekly fallback must not show a fake App Store price");
expect(!iap.includes('displayPrice: "$19.99"'), "monthly fallback must not show a fake App Store price");
expect(!iap.includes('displayPrice: "$59.99"'), "yearly fallback must not show a fake App Store price");
expect(
  appSource.includes("const selectedPlanHasOneWeekTrial = hasOneWeekFreeTrial(selectedPlan) && eligibleTrialProductIdSet.has(selectedPlan.id)") &&
    appSource.includes("const trialPlan = allPlansHaveOneWeekTrial && selectedPlanHasOneWeekTrial ? selectedPlan : undefined"),
  "active paywall must show a trial only when StoreKit supplies a one-week offer and Apple confirms eligibility",
);
expect(
  appSource.includes('textFor("paywall.legal", "Auto-renewing subscription.') &&
    appSource.includes('textFor("common.terms", "Terms of Use")') &&
    appSource.includes('textFor("common.privacy", "Privacy Policy")'),
  "active paywall must expose renewal terms, Terms of Use, and Privacy Policy",
);
expect(iapManifest.includes('appStoreConnectPriceUsd: "9.99"'), "weekly ASC target price must remain 9.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "19.99"'), "monthly ASC target price must remain 19.99");
expect(iapManifest.includes('appStoreConnectPriceUsd: "59.99"'), "yearly ASC target price must remain 59.99");
expect(iapManifest.includes("Back-to-School 2026 Weekly Plus One-Week Trial"), "weekly back-to-school intro offer must be documented in the IAP manifest");
expect(iapManifest.includes("Back-to-School 2026 Monthly Plus One-Week Trial"), "monthly back-to-school intro offer must be documented in the IAP manifest");
expect(iapManifest.includes("Back-to-School 2026 Yearly Plus One-Week Trial"), "yearly back-to-school intro offer must be documented in the IAP manifest");
expect((iapManifest.match(/availabilityStart: "2026-07-09"/g) || []).length >= 3, "all subscription intro offer start dates must match ASC");
expect((iapManifest.match(/availabilityEnd: "2026-09-30"/g) || []).length >= 3, "all subscription intro offer end dates must match ASC");
expect(storeKit.includes('"displayPrice": "9.99"'), "local StoreKit weekly price must remain 9.99");
expect(storeKit.includes('"displayPrice": "19.99"'), "local StoreKit monthly price must remain 19.99");
expect(storeKit.includes('"displayPrice": "59.99"'), "local StoreKit yearly price must remain 59.99");
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
