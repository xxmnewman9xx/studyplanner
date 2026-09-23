import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const appSource = readFileSync("App.tsx", "utf8");
const iap = readFileSync("src/iap.ts", "utf8");
const iapManifest = readFileSync("src/config/iap.ts", "utf8");
const localStoreKit = JSON.parse(readFileSync("qa/storekit/StudyPlannerLocal.storekit", "utf8"));
const iosScheme = readFileSync("ios/StudyplannerSyllabusAI.xcodeproj/xcshareddata/xcschemes/StudyplannerSyllabusAI.xcscheme", "utf8");
const upgradeScreen = readFileSync("src/screens/UpgradeScreen.tsx", "utf8");
const seasonalTrialCopy = appSource.slice(
  appSource.indexOf("const SEASONAL_TRIAL_COPY"),
  appSource.indexOf("const SEMESTER_THEME_COPY")
);
const failures = [];
const manifestWeekly = iapManifest.slice(iapManifest.indexOf('productId: "com.mattnewman.studyplanner.plus.weekly"'), iapManifest.indexOf('productId: "com.mattnewman.studyplanner.plus.monthly"'));
const manifestMonthly = iapManifest.slice(iapManifest.indexOf('productId: "com.mattnewman.studyplanner.plus.monthly"'), iapManifest.indexOf('productId: "com.mattnewman.studyplanner.plus.yearly"'));
const manifestYearly = iapManifest.slice(iapManifest.indexOf('productId: "com.mattnewman.studyplanner.plus.yearly"'), iapManifest.indexOf("sandboxTesting:"));
const localSubscriptions = localStoreKit.subscriptionGroups.flatMap((group) => group.subscriptions || []);
const localWeekly = localSubscriptions.find((product) => product.productID === "com.mattnewman.studyplanner.plus.weekly");
const localMonthly = localSubscriptions.find((product) => product.productID === "com.mattnewman.studyplanner.plus.monthly");
const localYearly = localSubscriptions.find((product) => product.productID === "com.mattnewman.studyplanner.plus.yearly");

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
expect(iap.includes('STUDYPLANNER_INTRO_PRODUCT_ID = "com.mattnewman.studyplanner.plus.weekly"'), "weekly must be the only introductory-offer product");
expect(iap.includes("plan?.id !== STUDYPLANNER_INTRO_PRODUCT_ID"), "intro-offer detection must reject monthly and yearly products");
expect(iap.includes('offer.paymentMode !== "pay-as-you-go"'), "intro-offer detection must require a paid pay-as-you-go offer");
expect(iap.includes("offer.price <= 0"), "intro-offer detection must reject a free or invalid price");
expect(iap.includes("getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])"), "entitlement must be checked against active App Store subscriptions");
expect((iap.match(/displayPrice: "Shown by App Store"/g) || []).length >= 3, "fallback plans must avoid real-looking prices until StoreKit loads localized products");
expect(!iap.includes('displayPrice: "$9.99"'), "weekly fallback must not show a fake App Store price");
expect(!iap.includes('displayPrice: "$19.99"'), "monthly fallback must not show a fake App Store price");
expect(!iap.includes('displayPrice: "$59.99"'), "yearly fallback must not show a fake App Store price");
expect(!upgradeScreen.toLowerCase().includes("free trial"), "upgrade UI must not advertise a free trial");
expect(upgradeScreen.includes('t("paywall.terms_feature"'), "upgrade UI must defer price and terms to localized store copy");
expect(manifestWeekly.includes('appStoreConnectPriceUsd: "6.99"'), "weekly ASC target price must be USD 6.99");
expect(manifestWeekly.includes('hasFreeTrial: false') && manifestWeekly.includes('hasIntroOffer: true'), "weekly must carry the paid intro offer without calling it a free trial");
expect(manifestWeekly.includes('paymentMode: "pay_as_you_go"') && manifestWeekly.includes('duration: "P1W"'), "weekly intro offer must be pay-as-you-go for one week");
expect(manifestWeekly.includes("USD 0.99 for the first week"), "weekly target must document the USD 0.99 first week");
expect(manifestMonthly.includes('appStoreConnectPriceUsd: "14.99"'), "monthly ASC target price must be USD 14.99");
expect(manifestMonthly.includes('subscriptionPeriod: "P1M"'), "monthly renewal period must remain one month");
expect(manifestMonthly.includes('hasFreeTrial: false') && manifestMonthly.includes('hasIntroOffer: false') && !manifestMonthly.includes("introductoryOffer:"), "monthly must not carry introductory-offer metadata");
expect(manifestYearly.includes('appStoreConnectPriceUsd: "39.99"'), "yearly ASC target price must be USD 39.99");
expect(manifestYearly.includes('hasFreeTrial: false') && manifestYearly.includes('hasIntroOffer: false') && !manifestYearly.includes("introductoryOffer:"), "yearly must not carry trial metadata");
expect((iapManifest.match(/hasFreeTrial: true/g) || []).length === 0, "no product may advertise a free trial");
expect((iapManifest.match(/hasIntroOffer: true/g) || []).length === 1, "exactly one product must carry an intro offer");
expect((iapManifest.match(/duration: "P1W"/g) || []).length === 1, "the only intro offer must last exactly one week");
expect(!/free trial|week free|free week/i.test(seasonalTrialCopy), "paid introductory-offer copy must never imply a free trial");
expect((seasonalTrialCopy.match(/"paywall\.trial_badge"/g) || []).length === 10, "intro badge copy must cover all 10 runtime locales");
expect((seasonalTrialCopy.match(/"paywall\.seasonal_title"/g) || []).length === 10, "intro headline copy must cover all 10 runtime locales");
expect((seasonalTrialCopy.match(/"paywall\.seasonal_body"/g) || []).length === 10, "intro terms copy must cover all 10 runtime locales");
expect((seasonalTrialCopy.match(/"paywall\.trial_cta"/g) || []).length === 10, "intro CTA copy must cover all 10 runtime locales");
expect((seasonalTrialCopy.match(/"paywall\.trial_summary"/g) || []).length === 10, "intro renewal summary must cover all 10 runtime locales");
expect((seasonalTrialCopy.match(/\{price\}/g) || []).length === 20, "every localized body and summary must preserve the store price placeholder");
expect((seasonalTrialCopy.match(/\{plan\}/g) || []).length === 20, "every localized body and summary must preserve the renewal-plan placeholder");
expect((seasonalTrialCopy.match(/\{intro\}/g) || []).length === 40, "every localized title, badge, CTA, and summary must preserve the localized intro-price placeholder");
expect(["Choose Weekly", "Wähle Wöchentlich", "Elige Semanal", "Choisis Hebdomadaire", "Escolha Semanal", "週間プラン", "주간 요금제", "选择周订阅", "साप्ताहिक प्लान", "الخطة الأسبوعية"].every((fragment) => seasonalTrialCopy.includes(fragment)), "all 10 localized offer bodies must identify Weekly");
expect(appSource.includes("const [storePlansReady, setStorePlansReady] = useState(false)"), "checkout must start disabled until StoreKit returns localized products");
expect(appSource.includes("setStorePlansReady(localizedPlansReady)"), "fallback SKUs must never enable checkout");
expect(appSource.includes("initialPlans.find((plan) => plan.recommended)"), "the annual best-value plan must be preselected");
expect(!/\$0\.99|\$6\.99|\$14\.99|\$39\.99/.test(seasonalTrialCopy), "paywall copy must use StoreKit-localized prices instead of hardcoded USD");
expect(localSubscriptions.length === 3, "local StoreKit config must contain all three subscriptions");
expect(localWeekly?.displayPrice === "6.99" && localWeekly?.recurringSubscriptionPeriod === "P1W", "local Weekly must renew at USD 6.99 per week");
expect(localWeekly?.introductoryOffer?.displayPrice === "0.99" && localWeekly?.introductoryOffer?.paymentMode === "payAsYouGo" && localWeekly?.introductoryOffer?.subscriptionPeriod === "P1W", "local Weekly must carry the USD 0.99 paid first-week offer");
expect(localMonthly?.displayPrice === "14.99" && localMonthly?.recurringSubscriptionPeriod === "P1M" && localMonthly?.introductoryOffer === null, "local Monthly must renew at USD 14.99 with no intro offer");
expect(localYearly?.displayPrice === "39.99" && localYearly?.recurringSubscriptionPeriod === "P1Y", "local Yearly must renew at USD 39.99 per year");
expect(localYearly?.introductoryOffer === null, "local Yearly must not carry an introductory offer");
expect(iosScheme.includes('identifier = "../../../qa/storekit/StudyPlannerLocal.storekit"'), "the iOS debug launch scheme must use the checked local StoreKit configuration");

if (failures.length) {
  console.error("IAP config checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("IAP config checks passed.");
