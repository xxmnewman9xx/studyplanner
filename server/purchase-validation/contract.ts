export type PurchaseValidationPlatform = "ios" | "android";
export type PurchaseValidationSource = "purchase" | "restore" | "refresh";

export type PurchaseValidationRequest = {
  platform: PurchaseValidationPlatform;
  productId: string;
  transactionId?: string;
  purchaseToken?: string;
  environment?: "Sandbox" | "Production" | "Local";
  source: PurchaseValidationSource;
};

export type PurchaseValidationResponse = {
  isPremium: boolean;
  productId?: string;
  validatedAt: string;
  environment?: "Sandbox" | "Production";
  expiresAt?: string;
  reason?: string;
  validationSource: "app-store-server-api" | "google-play-developer-api";
};

export type PurchaseValidationContractErrorCode =
  | "UNKNOWN_PRODUCT"
  | "TOKEN_REQUIRED"
  | "INVALID_PLATFORM"
  | "INVALID_SOURCE"
  | "SERVER_VALIDATION_NOT_CONFIGURED";

export class PurchaseValidationContractError extends Error {
  code: PurchaseValidationContractErrorCode;

  constructor(code: PurchaseValidationContractErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function normalizePurchaseValidationRequest(
  value: unknown,
  allowedProductIds: string[]
): PurchaseValidationRequest {
  if (!value || typeof value !== "object") {
    throw new PurchaseValidationContractError("TOKEN_REQUIRED", "Purchase validation requires a request body.");
  }

  const body = value as Partial<PurchaseValidationRequest>;
  if (body.platform !== "ios" && body.platform !== "android") {
    throw new PurchaseValidationContractError("INVALID_PLATFORM", "Purchase validation platform must be ios or android.");
  }

  if (body.source !== "purchase" && body.source !== "restore" && body.source !== "refresh") {
    throw new PurchaseValidationContractError("INVALID_SOURCE", "Purchase validation source must be purchase, restore, or refresh.");
  }

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  if (!allowedProductIds.includes(productId)) {
    throw new PurchaseValidationContractError("UNKNOWN_PRODUCT", "Purchase validation received an unknown product ID.");
  }

  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : undefined;
  const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken.trim() : undefined;
  if (!transactionId && !purchaseToken) {
    throw new PurchaseValidationContractError(
      "TOKEN_REQUIRED",
      "Purchase validation requires an App Store transaction ID/JWS or Google Play purchase token."
    );
  }

  return {
    platform: body.platform,
    productId,
    transactionId,
    purchaseToken,
    environment: body.environment,
    source: body.source
  };
}

export function serverValidationConfigIsPresent(env: Record<string, string | undefined>) {
  return Boolean(
    env.STUDYPLANNER_APPLE_BUNDLE_ID &&
      env.STUDYPLANNER_APPLE_ISSUER_ID &&
      env.STUDYPLANNER_APPLE_KEY_ID &&
      env.STUDYPLANNER_APPLE_PRIVATE_KEY
  );
}
