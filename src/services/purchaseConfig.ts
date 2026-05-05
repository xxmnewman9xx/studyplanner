declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const defaultAndroidPackageName = "com.studyplanner.syllabusai";

export const purchaseConfig = {
  subscriptionIds: readListEnv("EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS"),
  lifetimeProductIds: readListEnv("EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS"),
  termsUrl: readEnv("EXPO_PUBLIC_TERMS_URL"),
  privacyUrl: readEnv("EXPO_PUBLIC_PRIVACY_URL"),
  androidPackageName: readEnv("EXPO_PUBLIC_ANDROID_PACKAGE_NAME") || defaultAndroidPackageName
};

export const allPremiumProductIds = unique([
  ...purchaseConfig.subscriptionIds,
  ...purchaseConfig.lifetimeProductIds
]);

export function hasConfiguredPurchases() {
  return allPremiumProductIds.length > 0;
}

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function readListEnv(name: string) {
  return unique(
    (readEnv(name) || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
