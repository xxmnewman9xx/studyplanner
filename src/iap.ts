import { Platform } from "react-native";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  initConnection,
  isEligibleForIntroOfferIOS,
  requestPurchase,
  restorePurchases,
} from "expo-iap";
import type { Product, ProductSubscription, Purchase } from "expo-iap";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export const STUDYPLANNER_BUNDLE_ID = "com.mattnewman.studyplanner";
export const STUDYPLANNER_ASC_APP_ID = "6766181202";
export const STUDYPLANNER_APP_GROUP = "group.com.mattnewman.studyplanner";

export const STUDYPLANNER_SUBSCRIPTION_IDS = [
  "com.mattnewman.studyplanner.plus.weekly",
  "com.mattnewman.studyplanner.plus.monthly",
  "com.mattnewman.studyplanner.plus.yearly",
] as const;

export const STUDYPLANNER_LIFETIME_PRODUCT_ID = "com.mattnewman.studyplanner.plus.lifetime";

export const STUDYPLANNER_PRODUCT_IDS = [
  ...STUDYPLANNER_SUBSCRIPTION_IDS,
  STUDYPLANNER_LIFETIME_PRODUCT_ID,
] as const;

let storeConnectionPromise: Promise<boolean> | null = null;

export type PaywallPlan = {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  originalDisplayPrice?: string;
  cadence: "Weekly" | "Monthly" | "Yearly" | "Lifetime";
  kind: "subscription" | "lifetime";
  recommended: boolean;
  bestValue: boolean;
  subscriptionGroupId?: string;
  introductoryOffer?: {
    displayPrice: string;
    paymentMode: "free-trial" | "pay-as-you-go" | "pay-up-front" | "unknown";
    periodUnit: "day" | "week" | "month" | "year" | "unknown";
    periodValue: number;
    periodCount: number;
  };
};

export type EntitlementResult = {
  isPremium: boolean;
  productId?: string;
  checkedAt: string;
};

export function hasOneWeekFreeTrial(plan: PaywallPlan | null | undefined) {
  const offer = plan?.introductoryOffer;
  if (!offer || offer.paymentMode !== "free-trial") return false;
  const totalUnits = offer.periodValue * offer.periodCount;
  return (offer.periodUnit === "week" && totalUnits === 1) || (offer.periodUnit === "day" && totalUnits === 7);
}

export async function loadEligibleIntroOfferProductIds(plans: PaywallPlan[]) {
  const trialPlans = plans.filter(hasOneWeekFreeTrial);
  if (Platform.OS !== "ios") return trialPlans.map((plan) => plan.id);
  const groupIds = [...new Set(trialPlans.map((plan) => plan.subscriptionGroupId).filter((groupId): groupId is string => Boolean(groupId)))];
  if (!groupIds.length) return [];
  const eligibility = new Map<string, boolean>();
  await Promise.all(groupIds.map(async (groupId) => {
    try {
      eligibility.set(groupId, await isEligibleForIntroOfferIOS(groupId));
    } catch {
      eligibility.set(groupId, false);
    }
  }));
  return trialPlans
    .filter((plan) => Boolean(plan.subscriptionGroupId && eligibility.get(plan.subscriptionGroupId)))
    .map((plan) => plan.id);
}

export function fallbackPlans(): PaywallPlan[] {
  return [
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[1],
      title: "StudyPlanner Monthly",
      description: "The sale plan for a full month of StudyPlanner access.",
      displayPrice: "Shown by App Store",
      cadence: "Monthly",
      kind: "subscription",
      recommended: true,
      bestValue: false,
    },
    {
      id: STUDYPLANNER_LIFETIME_PRODUCT_ID,
      title: "StudyPlanner Lifetime",
      description: "Lifetime access with one payment and no renewal.",
      displayPrice: "Shown by App Store",
      cadence: "Lifetime",
      kind: "lifetime",
      recommended: false,
      bestValue: true,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[0],
      title: "StudyPlanner Weekly",
      description: "Short-term access when you need a focused planning push.",
      displayPrice: "Shown by App Store",
      cadence: "Weekly",
      kind: "subscription",
      recommended: false,
      bestValue: false,
    },
  ];
}

function simulatorQaFixturePlans(): PaywallPlan[] | null {
  if (typeof process === "undefined" || process.env?.EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA !== "1") return null;
  return [
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[1],
      title: "StudyPlanner Monthly",
      description: "The sale plan for a full month of StudyPlanner access.",
      displayPrice: "$14.99",
      originalDisplayPrice: "$20.99",
      cadence: "Monthly",
      kind: "subscription",
      recommended: true,
      bestValue: false,
    },
    {
      id: STUDYPLANNER_LIFETIME_PRODUCT_ID,
      title: "StudyPlanner Lifetime",
      description: "Lifetime access with one payment and no renewal.",
      displayPrice: "$59.99",
      cadence: "Lifetime",
      kind: "lifetime",
      recommended: false,
      bestValue: true,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[0],
      title: "StudyPlanner Weekly",
      description: "Short-term access when you need a focused planning push.",
      displayPrice: "$6.99",
      cadence: "Weekly",
      kind: "subscription",
      recommended: false,
      bestValue: false,
    },
  ];
}

export async function initializeStudyPlannerStore() {
  if (Platform.OS === "web") return false;
  if (!storeConnectionPromise) {
    storeConnectionPromise = initConnection().catch((error) => {
      storeConnectionPromise = null;
      throw error;
    });
  }
  return storeConnectionPromise;
}

export async function closeStudyPlannerStore() {
  if (Platform.OS === "web") return;
  try {
    if (storeConnectionPromise) await storeConnectionPromise;
    await endConnection();
  } finally {
    storeConnectionPromise = null;
  }
}

export async function loadStorePlans(): Promise<PaywallPlan[]> {
  const fixturePlans = simulatorQaFixturePlans();
  if (fixturePlans) return fixturePlans;

  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_IAP_FORCE_FALLBACK_PLANS === "1") {
    return fallbackPlans();
  }

  const [subscriptionResult, lifetimeResult] = await Promise.allSettled([
    fetchProducts({ skus: [...STUDYPLANNER_SUBSCRIPTION_IDS], type: "subs" }),
    fetchProducts({ skus: [STUDYPLANNER_LIFETIME_PRODUCT_ID], type: "in-app" }),
  ]);
  const subscriptions = subscriptionResult.status === "fulfilled" ? subscriptionResult.value : [];
  const lifetimeProducts = lifetimeResult.status === "fulfilled" ? lifetimeResult.value : [];
  const mapped = [
    ...(subscriptions || [])
      .filter((product): product is ProductSubscription => product.type === "subs")
      .map(mapSubscriptionProduct)
      .filter((plan) => plan.cadence !== "Yearly"),
    ...(lifetimeProducts || [])
      .filter((product): product is Product => product.type === "in-app")
      .map(mapLifetimeProduct),
  ].sort(sortPrimaryPaywallPlans);
  return mapped.length ? mapped : fallbackPlans();
}

export async function purchasePlan(productId: string): Promise<void> {
  const request = {
    apple: { sku: productId },
    google: { skus: [productId] },
  };
  if (productId === STUDYPLANNER_LIFETIME_PRODUCT_ID) {
    await requestPurchase({ type: "in-app", request });
    return;
  }
  await requestPurchase({ type: "subs", request });
}

export async function restoreStudyPlannerPurchases(): Promise<EntitlementResult> {
  await restorePurchases();
  return checkStudyPlannerEntitlement();
}

export async function finishStudyPlannerPurchase(purchase: Purchase): Promise<EntitlementResult> {
  const validPurchaseUpdate = isKnownProduct(purchase.productId) && purchase.purchaseState === "purchased";
  if (!validPurchaseUpdate) return { isPremium: false, checkedAt: new Date().toISOString() };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    const entitlement = await checkStudyPlannerEntitlement();
    if (!entitlement.isPremium) continue;
    await finishTransaction({ purchase, isConsumable: false });
    return entitlement;
  }
  throw new Error("The purchase arrived, but the active subscription is not visible yet. Restore Purchases to retry.");
}

export async function checkStudyPlannerEntitlement(): Promise<EntitlementResult> {
  if (Platform.OS === "web") return { isPremium: false, checkedAt: new Date().toISOString() };
  const [activeSubscriptions, availablePurchases] = await Promise.all([
    getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS]),
    getAvailablePurchases({ onlyIncludeActiveItemsIOS: true, includeSuspendedAndroid: false }),
  ]);
  const subscription = activeSubscriptions.find(
    (item) => item.isActive && (STUDYPLANNER_SUBSCRIPTION_IDS as readonly string[]).includes(item.productId),
  );
  const lifetimePurchase = availablePurchases.find(
    (item) => item.purchaseState === "purchased" && item.productId === STUDYPLANNER_LIFETIME_PRODUCT_ID,
  );
  const productId = subscription?.productId || lifetimePurchase?.productId;
  return {
    isPremium: Boolean(productId),
    productId,
    checkedAt: new Date().toISOString(),
  };
}

export function isKnownProduct(productId: string | null | undefined) {
  return Boolean(productId && (STUDYPLANNER_PRODUCT_IDS as readonly string[]).includes(productId));
}

function mapSubscriptionProduct(product: ProductSubscription): PaywallPlan {
  const yearly = product.id.includes("year");
  const weekly = product.id.includes("week");
  const standardizedIntro = product.subscriptionOffers?.find((offer) => offer.type === "introductory");
  const legacyIosIntro = product.platform === "ios" && product.introductoryPricePaymentModeIOS !== "empty"
    ? {
        displayPrice: product.introductoryPriceIOS || "",
        paymentMode: product.introductoryPricePaymentModeIOS,
        periodUnit: product.introductoryPriceSubscriptionPeriodIOS === "empty" || !product.introductoryPriceSubscriptionPeriodIOS
          ? "unknown" as const
          : product.introductoryPriceSubscriptionPeriodIOS,
        periodValue: 1,
        periodCount: Math.max(1, Number(product.introductoryPriceNumberOfPeriodsIOS || 1) || 1),
      }
    : undefined;
  const introductoryOffer = standardizedIntro
    ? {
        displayPrice: standardizedIntro.displayPrice,
        paymentMode: standardizedIntro.paymentMode || "unknown",
        periodUnit: standardizedIntro.period?.unit || "unknown",
        periodValue: Math.max(1, standardizedIntro.period?.value || 1),
        periodCount: Math.max(1, standardizedIntro.periodCount || 1),
      }
    : legacyIosIntro;
  return {
    id: product.id,
    title: product.displayName || product.title || (yearly ? "StudyPlanner Yearly" : weekly ? "StudyPlanner Weekly" : "StudyPlanner Monthly"),
    description: product.description || (yearly ? "Full access for the school year." : weekly ? "Full access week to week." : "Full access month to month."),
    displayPrice: product.displayPrice || "Shown by App Store",
    originalDisplayPrice: !yearly && !weekly ? monthlyOriginalDisplayPrice(product) : undefined,
    cadence: yearly ? "Yearly" : weekly ? "Weekly" : "Monthly",
    kind: "subscription",
    recommended: !yearly && !weekly,
    bestValue: false,
    subscriptionGroupId: product.platform === "ios" ? product.subscriptionInfoIOS?.subscriptionGroupId || undefined : undefined,
    introductoryOffer,
  };
}

function mapLifetimeProduct(product: Product): PaywallPlan {
  return {
    id: product.id,
    title: product.displayName || product.title || "StudyPlanner Lifetime",
    description: product.description || "Lifetime access with one payment and no renewal.",
    displayPrice: product.displayPrice || "Shown by App Store",
    cadence: "Lifetime",
    kind: "lifetime",
    recommended: false,
    bestValue: true,
  };
}

function monthlyOriginalDisplayPrice(product: ProductSubscription) {
  if (!product.price || !product.currency) return undefined;
  const decimals = currencyFractionDigits(product.currency);
  const factor = 10 ** decimals;
  const referencePrice = Math.ceil(product.price * 1.4 * factor) / factor;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: product.currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(referencePrice);
  } catch {
    return undefined;
  }
}

function currencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

function sortPrimaryPaywallPlans(a: PaywallPlan, b: PaywallPlan) {
  const rank = (plan: PaywallPlan) => {
    if (plan.cadence === "Monthly") return 0;
    if (plan.cadence === "Lifetime") return 1;
    if (plan.cadence === "Weekly") return 2;
    return 3;
  };
  return rank(a) - rank(b);
}
