import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  requestPurchase,
  restorePurchases,
  useIAP
} from "expo-iap";
import type { ActiveSubscription, Product, ProductSubscription, Purchase } from "expo-iap";

import { loadJson, removeJson, saveJson } from "./storage";
import { allPremiumProductIds, hasConfiguredPurchases, purchaseConfig } from "./purchaseConfig";

const subscriptionStorageKey = "study-planner-premium-entitlement-v1";

type ProductKind = "subscription" | "lifetime";
type PurchaseStatus = "checking" | "ready" | "unavailable" | "error";
type PurchaseFlowState = "idle" | "loading" | "purchasing" | "restoring" | "success" | "error";

export type PaywallProduct = {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  kind: ProductKind;
  periodLabel: string;
  hasFreeTrial: boolean;
  androidOfferToken?: string;
};

type EntitlementRecord = {
  isPremium: boolean;
  productId?: string;
  checkedAt: string;
};

type SubscriptionContextValue = {
  status: PurchaseStatus;
  flowState: PurchaseFlowState;
  isPremium: boolean;
  products: PaywallProduct[];
  selectedProductId?: string;
  message?: string;
  errorMessage?: string;
  hasConfiguredProducts: boolean;
  purchase: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
  manageSubscriptions: () => Promise<void>;
  setSelectedProductId: (productId: string) => void;
  clearMessage: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web" || !hasConfiguredPurchases()) {
    return <UnavailableSubscriptionProvider>{children}</UnavailableSubscriptionProvider>;
  }

  return <NativeSubscriptionProvider>{children}</NativeSubscriptionProvider>;
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) {
    throw new Error("useSubscription must be used inside SubscriptionProvider.");
  }

  return value;
}

function UnavailableSubscriptionProvider({ children }: { children: React.ReactNode }) {
  const hasProducts = hasConfiguredPurchases();
  const [message, setMessage] = useState<string | undefined>();
  const subscribeUnavailableMessage =
    Platform.OS === "web" && hasProducts
      ? "Open the iOS or Android app to subscribe."
      : "Plus purchases are not available on this device right now.";
  const restoreUnavailableMessage =
    Platform.OS === "web" && hasProducts
      ? "Open the iOS or Android app to restore purchases."
      : "Purchases are not available on this device right now.";

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status: "unavailable",
      flowState: "idle",
      isPremium: false,
      products: [],
      hasConfiguredProducts: hasProducts,
      message,
      errorMessage: subscribeUnavailableMessage,
      purchase: async () => {
        setMessage(subscribeUnavailableMessage);
      },
      restore: async () => {
        setMessage(restoreUnavailableMessage);
      },
      refresh: async () => undefined,
      manageSubscriptions: async () => undefined,
      setSelectedProductId: () => undefined,
      clearMessage: () => setMessage(undefined)
    }),
    [hasProducts, message, restoreUnavailableMessage, subscribeUnavailableMessage]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

function NativeSubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PurchaseStatus>("checking");
  const [flowState, setFlowState] = useState<PurchaseFlowState>("idle");
  const [isPremium, setIsPremium] = useState(false);
  const [products, setProducts] = useState<PaywallProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const purchaseApiRef = useRef<ReturnType<typeof useIAP> | null>(null);

  const refreshEntitlement = useCallback(async () => {
    try {
      setStatus("checking");
      const activeSubscriptions = await loadActiveSubscriptions();
      const availablePurchases = await loadAvailablePurchases();
      const entitlement = resolveEntitlement(activeSubscriptions, availablePurchases);

      setIsPremium(entitlement.isPremium);
      setStatus("ready");

      if (entitlement.isPremium) {
        await saveJson<EntitlementRecord>(subscriptionStorageKey, entitlement);
      } else {
        await removeJson(subscriptionStorageKey);
      }
    } catch (error) {
      setIsPremium(false);
      setStatus("error");
      setErrorMessage(userMessageFromError(error));
    }
  }, []);

  const handlePurchaseSuccess = useCallback(
    async (purchaseResult: Purchase) => {
      try {
        setFlowState("purchasing");
        const knownProduct = allPremiumProductIds.includes(purchaseResult.productId);
        const entitlement = await refreshEntitlementAfterPurchase();
        setIsPremium(entitlement.isPremium);
        setStatus("ready");

        if (knownProduct && entitlement.isPremium) {
          await finishTransaction({ purchase: purchaseResult, isConsumable: false });
          setMessage("Plus is active. Premium features are unlocked.");
          setFlowState("success");
        } else if (purchaseResult.purchaseState === "pending") {
          setMessage("Your purchase is pending. Plus will unlock as soon as the store confirms it.");
          setFlowState("idle");
        } else {
          setErrorMessage(
            "The store completed a purchase, but Plus is not active yet. Try Restore Purchases."
          );
          setFlowState("error");
        }
      } catch (error) {
        setErrorMessage(userMessageFromError(error));
        setFlowState("error");
      }
    },
    []
  );

  const iap = useIAP({
    onPurchaseSuccess: handlePurchaseSuccess,
    onPurchaseError: (error) => {
      if (error.code === "user-cancelled") {
        setFlowState("idle");
        return;
      }

      setErrorMessage(userMessageFromError(error));
      setFlowState("error");
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(userMessageFromError(error));
    }
  });

  useEffect(() => {
    purchaseApiRef.current = iap;
  }, [iap]);

  useEffect(() => {
    loadJson<EntitlementRecord>(subscriptionStorageKey).then((stored) => {
      if (stored?.isPremium) {
        setMessage("Checking your Plus access with the store.");
      }
    });
  }, []);

  const loadProducts = useCallback(async () => {
    setFlowState("loading");
    setErrorMessage(undefined);

    const [subscriptions, lifetimeProducts] = await Promise.all([
      purchaseConfig.subscriptionIds.length
        ? fetchProducts({ skus: purchaseConfig.subscriptionIds, type: "subs" })
        : Promise.resolve([]),
      purchaseConfig.lifetimeProductIds.length
        ? fetchProducts({ skus: purchaseConfig.lifetimeProductIds, type: "in-app" })
        : Promise.resolve([])
    ]);

    const mapped = [...(subscriptions ?? []), ...(lifetimeProducts ?? [])]
      .map(mapStoreProduct)
      .sort(sortProducts);
    setProducts(mapped);
    setSelectedProductId((current) => current || mapped[0]?.id);
    setFlowState("idle");

    if (mapped.length === 0) {
      setErrorMessage("The store did not return any available Plus plans.");
    }
  }, []);

  useEffect(() => {
    if (!iap.connected) return;

    let mounted = true;
    setStatus("checking");

    Promise.allSettled([loadProducts(), refreshEntitlement()]).then(() => {
      if (mounted) {
        setStatus((current) => (current === "checking" ? "ready" : current));
      }
    });

    return () => {
      mounted = false;
    };
  }, [iap.connected, loadProducts, refreshEntitlement]);

  const purchaseProduct = useCallback(
    async (productId: string) => {
      const selected = products.find((product) => product.id === productId);
      if (!selected) {
        setErrorMessage("Choose a Plus plan before continuing.");
        return;
      }

      setMessage(undefined);
      setErrorMessage(undefined);
      setFlowState("purchasing");

      const api = purchaseApiRef.current;
      if (!api?.connected) {
        const reconnected = await api?.reconnect();
        if (!reconnected) {
          setFlowState("error");
          setErrorMessage("The store is not available right now. Try again in a moment.");
          return;
        }
      }

      try {
        if (selected.kind === "subscription") {
          await requestPurchase({
            type: "subs",
            request: {
              apple: { sku: selected.id },
              google: {
                skus: [selected.id],
                subscriptionOffers: selected.androidOfferToken
                  ? [{ sku: selected.id, offerToken: selected.androidOfferToken }]
                  : undefined
              }
            }
          });
        } else {
          await requestPurchase({
            type: "in-app",
            request: {
              apple: { sku: selected.id },
              google: { skus: [selected.id] }
            }
          });
        }
      } catch (error) {
        setFlowState("error");
        setErrorMessage(userMessageFromError(error));
      }
    },
    [products]
  );

  const restore = useCallback(async () => {
    try {
      setFlowState("restoring");
      setMessage(undefined);
      setErrorMessage(undefined);
      await restorePurchases();
      const entitlement = await refreshEntitlementAfterPurchase();
      setIsPremium(entitlement.isPremium);
      setStatus("ready");

      if (entitlement.isPremium) {
        setMessage("Purchases restored. Plus is active.");
        setFlowState("success");
      } else {
        setErrorMessage("No active Plus purchase was found for this store account.");
        setFlowState("error");
      }
    } catch (error) {
      setErrorMessage(userMessageFromError(error));
      setFlowState("error");
    }
  }, []);

  const manageSubscriptions = useCallback(async () => {
    try {
      await deepLinkToSubscriptions({
        skuAndroid: selectedProductId || products[0]?.id,
        packageNameAndroid: purchaseConfig.androidPackageName
      });
    } catch (error) {
      setErrorMessage(userMessageFromError(error));
    }
  }, [products, selectedProductId]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status,
      flowState,
      isPremium,
      products,
      selectedProductId,
      message,
      errorMessage,
      hasConfiguredProducts: true,
      purchase: purchaseProduct,
      restore,
      refresh: refreshEntitlement,
      manageSubscriptions,
      setSelectedProductId,
      clearMessage: () => {
        setMessage(undefined);
        setErrorMessage(undefined);
      }
    }),
    [
      errorMessage,
      flowState,
      isPremium,
      manageSubscriptions,
      message,
      products,
      purchaseProduct,
      refreshEntitlement,
      restore,
      selectedProductId,
      status
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

async function refreshEntitlementAfterPurchase() {
  const activeSubscriptions = await loadActiveSubscriptions();
  const availablePurchases = await loadAvailablePurchases();
  const entitlement = resolveEntitlement(activeSubscriptions, availablePurchases);

  if (entitlement.isPremium) {
    await saveJson<EntitlementRecord>(subscriptionStorageKey, entitlement);
  } else {
    await removeJson(subscriptionStorageKey);
  }

  return entitlement;
}

async function loadActiveSubscriptions() {
  if (purchaseConfig.subscriptionIds.length === 0) return [];
  return getActiveSubscriptions(purchaseConfig.subscriptionIds);
}

async function loadAvailablePurchases() {
  if (purchaseConfig.lifetimeProductIds.length === 0) return [];
  return getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true,
    includeSuspendedAndroid: false
  });
}

function resolveEntitlement(activeSubscriptions: ActiveSubscription[], purchases: Purchase[]) {
  const activeSubscription = activeSubscriptions.find(
    (subscription) =>
      subscription.isActive && purchaseConfig.subscriptionIds.includes(subscription.productId)
  );
  const lifetimePurchase = purchases.find(
    (purchase) =>
      purchase.purchaseState === "purchased" &&
      purchaseConfig.lifetimeProductIds.includes(purchase.productId)
  );
  const productId = activeSubscription?.productId || lifetimePurchase?.productId;

  return {
    isPremium: Boolean(productId),
    productId,
    checkedAt: new Date().toISOString()
  };
}

function mapStoreProduct(product: Product | ProductSubscription): PaywallProduct {
  const kind = product.type === "subs" ? "subscription" : "lifetime";

  return {
    id: product.id,
    title: product.displayName || cleanupProductTitle(product.title),
    description: product.description || defaultProductDescription(kind),
    displayPrice: product.displayPrice,
    kind,
    periodLabel: product.type === "subs" ? subscriptionPeriodLabel(product) : "Lifetime",
    hasFreeTrial: product.type === "subs" ? productHasFreeTrial(product) : false,
    androidOfferToken: product.type === "subs" ? androidOfferToken(product) : undefined
  };
}

function cleanupProductTitle(title: string) {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim() || "StudyPlanner Plus";
}

function defaultProductDescription(kind: ProductKind) {
  return kind === "subscription"
    ? "Full access to Plus features while your plan is active."
    : "Full access to Plus features with a one-time purchase.";
}

function subscriptionPeriodLabel(product: ProductSubscription) {
  if (product.platform === "ios" && product.subscriptionPeriodUnitIOS) {
    return periodUnitLabel(product.subscriptionPeriodUnitIOS);
  }

  const offer = product.subscriptionOffers?.[0];
  if (offer?.period) {
    return periodUnitLabel(offer.period.unit);
  }

  if (/year/i.test(product.id)) return "Yearly";
  if (/month/i.test(product.id)) return "Monthly";
  return "Subscription";
}

function periodUnitLabel(unit: string) {
  switch (unit) {
    case "day":
      return "Daily";
    case "week":
      return "Weekly";
    case "month":
      return "Monthly";
    case "year":
      return "Yearly";
    default:
      return "Subscription";
  }
}

function productHasFreeTrial(product: ProductSubscription) {
  if (product.platform === "ios" && product.introductoryPricePaymentModeIOS === "free-trial") {
    return true;
  }

  return Boolean(
    product.subscriptionOffers?.some(
      (offer) =>
        offer.paymentMode === "free-trial" ||
        offer.pricingPhasesAndroid?.pricingPhaseList.some(
          (phase) => Number.parseInt(phase.priceAmountMicros, 10) === 0
        )
    )
  );
}

function androidOfferToken(product: ProductSubscription) {
  if (product.platform !== "android") return undefined;

  return (
    product.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid ||
    product.subscriptionOfferDetailsAndroid?.[0]?.offerToken
  );
}

function sortProducts(a: PaywallProduct, b: PaywallProduct) {
  const rank = (product: PaywallProduct) => {
    if (product.periodLabel === "Yearly") return 0;
    if (product.periodLabel === "Monthly") return 1;
    if (product.kind === "lifetime") return 2;
    return 3;
  };

  return rank(a) - rank(b);
}

function userMessageFromError(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === "user-cancelled") {
    return "Purchase was cancelled.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "The store could not complete that request. Try again in a moment.";
}
