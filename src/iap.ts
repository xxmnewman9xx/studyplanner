import { Platform } from "react-native";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  initConnection,
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

export type PaywallPlan = {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  cadence: "Weekly" | "Monthly" | "Yearly";
  recommended: boolean;
};

export type EntitlementResult = {
  isPremium: boolean;
  productId?: string;
  checkedAt: string;
};

export function fallbackPlans(): PaywallPlan[] {
  return [
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[1],
      title: "StudyPlanner Monthly",
      description: "Flexible access for the current term.",
      displayPrice: "$14.99",
      cadence: "Monthly",
      recommended: false,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[2],
      title: "StudyPlanner Yearly",
      description: "Best value for the full school year.",
      displayPrice: "$59.99",
      cadence: "Yearly",
      recommended: true,
    },
    {
      id: STUDYPLANNER_SUBSCRIPTION_IDS[0],
      title: "StudyPlanner Weekly",
      description: "Short-term access when you need a focused planning push.",
      displayPrice: "$5.99",
      cadence: "Weekly",
      recommended: false,
    },
  ];
}

export async function initializeStudyPlannerStore() {
  if (Platform.OS === "web") return false;
  return initConnection();
}

export async function closeStudyPlannerStore() {
  if (Platform.OS === "web") return;
  await endConnection();
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
  if (validPurchaseUpdate) {
    await finishTransaction({ purchase, isConsumable: false });
  }
  if (!validPurchaseUpdate) return { isPremium: false, checkedAt: new Date().toISOString() };
  return checkStudyPlannerEntitlement();
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
  return {
    id: product.id,
    title: product.displayName || product.title || (yearly ? "StudyPlanner Yearly" : weekly ? "StudyPlanner Weekly" : "StudyPlanner Monthly"),
    description: product.description || (yearly ? "Full access for the school year." : weekly ? "Full access week to week." : "Full access month to month."),
    displayPrice: product.displayPrice || "Shown by App Store",
    cadence: yearly ? "Yearly" : weekly ? "Weekly" : "Monthly",
    recommended: yearly,
  };
}
