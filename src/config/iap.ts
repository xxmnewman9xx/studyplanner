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
    packageName: "com.studyplanner.syllabusai"
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
    appStoreConnectIdentifier: null,
    verificationStatus: "App Store Connect group identifier is not locally exported; confirm in ASC before release."
  },
  products: [
    {
      productId: "com.mattnewman.studyplanner.plus.monthly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner Monthly",
      description: "Full access to StudyPlanner while the monthly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1M",
      hasFreeTrial: false,
      hasIntroOffer: false,
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config; do not use this value as a bundle identifier."
    },
    {
      productId: "com.mattnewman.studyplanner.plus.yearly",
      type: "auto_renewable_subscription" as IapProductType,
      displayName: "StudyPlanner Yearly",
      description: "Full access to StudyPlanner while the yearly plan is active.",
      entitlementUnlocked: "studyplanner_pro",
      subscriptionPeriod: "P1Y",
      hasFreeTrial: false,
      hasIntroOffer: false,
      sandboxNotes: "Use an App Store sandbox tester or local StoreKit config; do not use this value as a bundle identifier."
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
    "Confirm both product IDs exist in App Store Connect for app 6766181202.",
    "Confirm subscription group membership, pricing, localization, cleared-for-sale, and review state.",
    "Confirm any trial or introductory offer flags in App Store Connect before claiming them in UI."
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
