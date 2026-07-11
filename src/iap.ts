import { Platform } from "react-native";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  initConnection,
  isEligibleForIntroOfferIOS,
  requestPurchase,
  restorePurchases,
} from "expo-iap";
import type { ProductSubscription, Purchase } from "expo-iap";

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

let storeConnectionPromise: Promise<boolean> | null = null;

export type PaywallPlan = {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  cadence: "Weekly" | "Monthly" | "Yearly";
  recommended: boolean;
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
      description: "Flexible access for the current term.",
      displayPrice: "Shown by App Store",
      cadence: "Monthly",
      recommended: false,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[2],
      title: "StudyPlanner Yearly",
      description: "Best value for the full school year.",
      displayPrice: "Shown by App Store",
      cadence: "Yearly",
      recommended: true,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[0],
      title: "StudyPlanner Weekly",
      description: "Short-term access when you need a focused planning push.",
      displayPrice: "Shown by App Store",
      cadence: "Weekly",
      recommended: false,
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
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_IAP_FORCE_FALLBACK_PLANS === "1") {
    return fallbackPlans();
  }

  const products = await fetchProducts({ skus: [...STUDYPLANNER_SUBSCRIPTION_IDS], type: "subs" });
  const mapped = (products || [])
    .filter((product): product is ProductSubscription => product.type === "subs")
    .map(mapProduct)
    .sort((a, b) => (a.recommended === b.recommended ? 0 : a.recommended ? -1 : 1));
  return mapped.length ? mapped : fallbackPlans();
}

export async function purchasePlan(productId: string): Promise<void> {
  await requestPurchase({
    type: "subs",
    request: {
      apple: { sku: productId },
      google: { skus: [productId] },
    },
  });
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
  const active = await getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS]);
  const subscription = active.find((item) => item.isActive && isKnownProduct(item.productId));
  return {
    isPremium: Boolean(subscription),
    productId: subscription?.productId,
    checkedAt: new Date().toISOString(),
  };
}

export function isKnownProduct(productId: string | null | undefined) {
  return Boolean(productId && (STUDYPLANNER_SUBSCRIPTION_IDS as readonly string[]).includes(productId));
}

function mapProduct(product: ProductSubscription): PaywallPlan {
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
    cadence: yearly ? "Yearly" : weekly ? "Weekly" : "Monthly",
    recommended: yearly,
    subscriptionGroupId: product.platform === "ios" ? product.subscriptionInfoIOS?.subscriptionGroupId || undefined : undefined,
    introductoryOffer,
  };
}
