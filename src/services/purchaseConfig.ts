declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

import {
  studyPlannerIapManifest,
  studyPlannerLifetimeProductIds,
  studyPlannerProductIds,
  studyPlannerSubscriptionProductIds
} from "../config/iap";

const defaultAndroidPackageName = studyPlannerIapManifest.android.packageName;
export const appleStandardEulaUrl =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const studyPlannerPrivacyUrl =
  "https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408";
const publicEnv =
  typeof process !== "undefined" && process.env
    ? {
        subscriptionIds: process.env.EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS,
        lifetimeProductIds: process.env.EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS,
        termsUrl: process.env.EXPO_PUBLIC_TERMS_URL,
        privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL,
        supportUrl: process.env.EXPO_PUBLIC_SUPPORT_URL,
        iapValidationEndpoint: process.env.EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT,
        androidPackageName: process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME
      }
    : {};

const configuredSubscriptionIds = readListEnv(publicEnv.subscriptionIds);
const configuredLifetimeProductIds = readListEnv(publicEnv.lifetimeProductIds);
const hasEnvProductIds =
  configuredSubscriptionIds.length > 0 || configuredLifetimeProductIds.length > 0;

export const purchaseConfig = {
  appBundleIdentifier: studyPlannerIapManifest.app.bundleIdentifier,
  widgetExtensionBundleIdentifiers: studyPlannerIapManifest.widgetExtensions.map(
    (extension) => extension.bundleIdentifier
  ),
  entitlementUnlocked: studyPlannerIapManifest.app.entitlementUnlocked,
  subscriptionGroup: studyPlannerIapManifest.subscriptionGroup,
  productManifest: studyPlannerIapManifest.products,
  productIdSource: hasEnvProductIds ? "environment" : "release-manifest",
  usesManifestProductFallback: !hasEnvProductIds,
  iapReadiness: studyPlannerIapManifest.readiness,
  subscriptionIds: configuredSubscriptionIds.length
    ? configuredSubscriptionIds
    : [...studyPlannerSubscriptionProductIds],
  lifetimeProductIds: configuredLifetimeProductIds.length
    ? configuredLifetimeProductIds
    : [...studyPlannerLifetimeProductIds],
  termsUrl: publicEnv.termsUrl || appleStandardEulaUrl,
  privacyUrl: publicEnv.privacyUrl || studyPlannerPrivacyUrl,
  supportUrl: publicEnv.supportUrl || studyPlannerPrivacyUrl,
  iapValidationEndpoint: publicEnv.iapValidationEndpoint,
  androidPackageName: publicEnv.androidPackageName || defaultAndroidPackageName
};

export const allPremiumProductIds = unique([
  ...purchaseConfig.subscriptionIds,
  ...purchaseConfig.lifetimeProductIds
]);

export const manifestPremiumProductIds = [...studyPlannerProductIds];

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
