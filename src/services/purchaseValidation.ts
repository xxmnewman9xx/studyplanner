declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export type StoreEntitlementCandidate = {
  productId: string;
  transactionId?: string | null;
  purchaseToken?: string | null;
  platform?: string | null;
  store?: string | null;
};

export type ServerEntitlementResult = {
  isPremium: boolean;
  productId?: string;
  checkedAt: string;
};

type ValidationSource = "purchase" | "restore" | "refresh";

const validationEndpoint = readEndpointEnv("EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT");

export function isPurchaseServerValidationConfigured() {
  return Boolean(validationEndpoint);
}

export async function validateEntitlementWithServer(
  candidates: StoreEntitlementCandidate[],
  source: ValidationSource,
  allowedProductIds: string[]
): Promise<ServerEntitlementResult | undefined> {
  if (!validationEndpoint) return undefined;

  const eligible = candidates.filter(
    (candidate) =>
      allowedProductIds.includes(candidate.productId) &&
      Boolean(candidate.transactionId || candidate.purchaseToken)
  );

  if (eligible.length === 0) {
    return {
      isPremium: false,
      checkedAt: new Date().toISOString()
    };
  }

  for (const candidate of eligible) {
    const response = await fetch(validationEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        platform: platformForCandidate(candidate),
        productId: candidate.productId,
        transactionId: candidate.transactionId,
        purchaseToken: candidate.purchaseToken,
        source
      })
    });

    if (!response.ok) {
      throw new Error("Plus validation could not be completed. Try again in a moment.");
    }

    const result = await response.json();
    if (result?.isPremium === true && allowedProductIds.includes(result.productId || candidate.productId)) {
      return {
        isPremium: result.isPremium === true,
        productId: result.productId || candidate.productId,
        checkedAt: new Date().toISOString()
      };
    }
  }

  return {
    isPremium: false,
    checkedAt: new Date().toISOString()
  };
}

function platformForCandidate(candidate: StoreEntitlementCandidate) {
  const raw = `${candidate.platform || ""} ${candidate.store || ""}`.toLowerCase();
  return raw.includes("android") || raw.includes("play") ? "android" : "ios";
}

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function readEndpointEnv(name: string) {
  const value = readEnv(name)?.trim();
  if (!value) return undefined;
  return isTrustedEndpoint(value) ? value : undefined;
}

function isTrustedEndpoint(value: string) {
  if (value.startsWith("https://")) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(value);
}
