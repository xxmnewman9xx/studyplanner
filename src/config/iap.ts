export type IapReadiness =
  | "ready"
  | "ready-with-placeholders"
  | "blocked-missing-App-Store-Connect-IDs";

export type IapProductType = "auto_renewable_subscription" | "non_consumable";

export const studyPlannerIapManifest = {
  readiness: "ready-with-placeholders" as IapReadiness,
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
    verificationStatus: "Target configuration: one subscription group with Weekly, Monthly, and Yearly. Only Weekly may carry the paid first-week introductory offer; the app displays it only when StoreKit confirms the offer and account eligibility."
  },
  products: [
    {
      productId: "com.mattnewman.studyplanner.plus.weekly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Weekly",
      description: "Full access to StudyPlanner: Syllabus AI while the weekly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1W",
      appStoreConnectPriceUsd: "6.99",
      hasFreeTrial: false,
      hasIntroOffer: true,
      introductoryOffer: {
        referenceName: "Weekly First Week USD 0.99",
        paymentMode: "pay_as_you_go",
        duration: "P1W",
        numberOfPeriods: 1,
        appStoreConnectTarget: "Eligible customers pay USD 0.99 for the first week, then USD 6.99 per week until canceled. Re-verify the live App Store Connect record before release."
      },
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config. The paid first-week offer belongs to Weekly only; production UI must use StoreKit's localized prices and eligibility result."
    },
    {
      productId: "com.mattnewman.studyplanner.plus.monthly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Monthly",
      description: "Full access to StudyPlanner: Syllabus AI while the monthly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1M",
      appStoreConnectPriceUsd: "14.99",
      hasFreeTrial: false,
      hasIntroOffer: false,
      sandboxNotes: "Monthly renews at the localized monthly price with no introductory offer."
    },
    {
      productId: "com.mattnewman.studyplanner.plus.yearly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner: Syllabus AI Yearly",
      description: "Full access to StudyPlanner: Syllabus AI while the yearly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1Y",
      appStoreConnectPriceUsd: "39.99",
      hasFreeTrial: false,
      hasIntroOffer: false,
      sandboxNotes: "Yearly remains a paid renewal option. Do not attach or advertise an introductory trial on this product."
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
    "Confirm the paid first-week introductory offer is active on Weekly only and removed from Monthly and Yearly before release.",
    "Confirm US storefront targets are USD 0.99 for the eligible first Weekly period, then USD 6.99/week, USD 14.99/month, and USD 39.99/year; localized StoreKit pricing must be shown elsewhere."
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
