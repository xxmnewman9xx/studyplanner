declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const defaultAndroidPackageName = "com.studyplanner.syllabusai";
export const expectedMonthlySubscriptionId =
  "com.mattnewman.studyplanner.plus.monthly";
export const expectedYearlySubscriptionId =
  "com.mattnewman.studyplanner.plus.yearly";
export const proposedLifetimeProductId =
  "com.mattnewman.studyplanner.plus.lifetime";
export const appleStandardEulaUrl =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const studyPlannerPrivacyUrl =
  "https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408";
const publicEnv =
  typeof process !== "undefined" && process.env
    ? {
        subscriptionIds:
          process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS ||
          process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_ID,
        lifetimeProductIds:
          process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS ||
          process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_ID,
        termsUrl: process.env.EXPO_PUBLIC_TERMS_URL,
        privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL,
        androidPackageName: process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME
      }
    : {};

export const purchaseConfig = {
  subscriptionIds: readListEnv(publicEnv.subscriptionIds),
  lifetimeProductIds: readListEnv(publicEnv.lifetimeProductIds),
  termsUrl: publicEnv.termsUrl || appleStandardEulaUrl,
  privacyUrl: publicEnv.privacyUrl || studyPlannerPrivacyUrl,
  androidPackageName: publicEnv.androidPackageName || defaultAndroidPackageName
};

export const allPremiumProductIds = unique([
  ...purchaseConfig.subscriptionIds,
  ...purchaseConfig.lifetimeProductIds
]);

export function hasConfiguredPurchases() {
  return allPremiumProductIds.length > 0;
}

function readListEnv(value: string | undefined) {
  return unique(
    (value || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
