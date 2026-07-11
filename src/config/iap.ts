export type IapReadiness =
  | "ready"
  | "ready-with-placeholders"
  | "blocked-missing-App-Store-Connect-IDs";

export type IapProductType = "auto_renewable_subscription" | "non_consumable";

export const studyPlannerIapManifest = {
  readiness: "ready" as IapReadiness,
  app: {
    bundleIdentifier: "com.mattnewman.studyplanner",
    appStoreConnectAppId: "6766181202",
    entitlementUnlocked: "studyplanner_pro"
  },
  android: {
    packageName: "com.mattnewman.studyplanner"
  },
  appGroupIdentifier: "group.com.mattnewman.studyplanner",
  widgetExtensions: [
    {
      targetName: "ExpoWidgetsTarget",
      bundleIdentifier: "com.mattnewman.studyplanner.widgets",
      appGroupIdentifier: "group.com.mattnewman.studyplanner"
    }
  ],
  subscriptionGroup: {
    referenceName: "StudyPlanner",
    appStoreConnectIdentifier: "22066553",
    verificationStatus: "ASC verified: Study Planner Plus subscription group contains weekly, monthly, and yearly Plus products."
  },
  products: [
    {
      productId: "com.mattnewman.studyplanner.plus.weekly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Weekly",
      description: "Full access to StudyPlanner: Syllabus AI while the weekly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1W",
      appStoreConnectPriceUsd: "9.99",
      hasFreeTrial: true,
      hasIntroOffer: true,
      introductoryOffer: {
        referenceName: "Back-to-School 2026 Weekly Plus One-Week Trial",
        paymentMode: "free_trial",
        duration: "P1W",
        availabilityStart: "2026-07-09",
        availabilityEnd: "2026-09-30",
        countriesOrRegions: 175,
        appStoreConnectReadback: "Jul 9, 2026 to Sep 30, 2026; 175 Countries or Regions; Free for the first week"
      },
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config. ASC verified a worldwide one-week introductory offer for July 9-Sept. 30, 2026; do not use this value as a bundle identifier."
    },
    {
      productId: "com.mattnewman.studyplanner.plus.monthly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Monthly",
      description: "Full access to StudyPlanner: Syllabus AI while the monthly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1M",
      appStoreConnectPriceUsd: "19.99",
      hasFreeTrial: true,
      hasIntroOffer: true,
      introductoryOffer: {
        referenceName: "Back-to-School 2026 Monthly Plus One-Week Trial",
        paymentMode: "free_trial",
        duration: "P1W",
        availabilityStart: "2026-07-09",
        availabilityEnd: "2026-09-30",
        countriesOrRegions: 175,
        appStoreConnectReadback: "Jul 9, 2026 to Sep 30, 2026; 175 Countries or Regions; Free for the first week"
      },
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config. ASC verified a worldwide one-week introductory offer for July 9-Sept. 30, 2026; do not use this value as a bundle identifier."
    },
    {
      productId: "com.mattnewman.studyplanner.plus.yearly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Yearly",
      description: "Full access to StudyPlanner: Syllabus AI while the yearly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1Y",
      appStoreConnectPriceUsd: "59.99",
      hasFreeTrial: true,
      hasIntroOffer: true,
      introductoryOffer: {
        referenceName: "Back-to-School 2026 Yearly Plus One-Week Trial",
        paymentMode: "free_trial",
        duration: "P1W",
        availabilityStart: "2026-07-09",
        availabilityEnd: "2026-09-30",
        countriesOrRegions: 175,
        appStoreConnectReadback: "Jul 9, 2026 to Sep 30, 2026; 175 Countries or Regions; Free for the first week"
      },
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config. ASC verified a worldwide one-week introductory offer for July 9-Sept. 30, 2026; do not use this value as a bundle identifier."
    }
  ],
  sandboxTesting: {
    localStoreKitConfig: "qa/storekit/StudyPlannerLocal.storekit",
    notes: [
      "Product IDs are StoreKit product identifiers, not bundle identifiers.",
      "Bundle IDs belong to the app and widget extension only.",
      "Local StoreKit is for simulator checkout smoke tests; App Store Connect state still requires manual verification."
    ]
  },
  externalVerificationRequired: [
    "Confirm all three subscription product IDs exist in App Store Connect for app 6766181202.",
    "Confirm subscription group membership, pricing, localization, cleared-for-sale, and review state.",
    "Confirm introductory offer eligibility copy follows Apple's one-intro-offer-per-subscription-group rule before claiming a universal trial in UI."
  ]
} as const;

export const studyPlannerSubscriptionProductIds = studyPlannerIapManifest.products
  .filter((product) => product.type === "auto_renewable_subscription")
  .map((product) => product.productId);

export const studyPlannerLifetimeProductIds = studyPlannerIapManifest.products
  .filter((product) => product.type === "non_consumable")
  .map((product) => product.productId);

export const studyPlannerProductIds = studyPlannerIapManifest.products.map(
  (product) => product.productId
);

export function isKnownStudyPlannerProductId(productId: string) {
  return (studyPlannerProductIds as readonly string[]).includes(productId);
}
