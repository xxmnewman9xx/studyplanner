# Build 42 IAP Final Validation

Date: 2026-06-05

## Result

PASS WITH DOCUMENTED LIMITATION

Sandbox Apple credentials are unavailable in this environment. Purchase completion cannot be fully validated here.

Required statement:

`Purchase completion requires sandbox Apple credentials and cannot be fully validated in this environment.`

## Verified Wiring

Source: `src/iap.ts`

- Bundle ID: `com.mattnewman.studyplanner`
- ASC App ID: `6766181202`
- App Group: `group.com.mattnewman.studyplanner`

Product IDs:

- `com.mattnewman.studyplanner.plus.monthly`
- `com.mattnewman.studyplanner.plus.yearly`

IAP implementation:

- `initializeStudyPlannerStore()` calls `initConnection()`.
- `loadStorePlans()` calls `fetchProducts({ skus, type: "subs" })`.
- `purchasePlan(productId)` calls StoreKit through `requestPurchase`.
- `restoreStudyPlannerPurchases()` calls `restorePurchases()` then entitlement check.
- `finishStudyPlannerPurchase()` finishes StoreKit transaction for known purchased subscription IDs.
- Entitlement check uses `getActiveSubscriptions`.

## Paywall Evidence

App code verifies:

- Hard gate after setup when `prefs.osLive` is true and `prefs.premium` is false.
- Paywall initializes StoreKit and product loading.
- Purchase CTA reaches `purchasePlan(selected)`.
- Restore CTA reaches `restoreStudyPlannerPurchases()`.
- Entitlement persists `premium`, `premiumProductId`, and `premiumCheckedAt`.
- Manage Subscription link opens Apple subscription management.

Observed simulator StoreKit limitation:

`SKInternalErrorDomain Code=12` in Sandbox queue check.

This is consistent with missing sandbox purchase context and is non-blocking under the Build 42 policy unless paywall, purchase, or restore crashes. No crash was observed during this pass.

## Release Risk

Medium operational risk until sandbox credentials validate end-to-end purchase and restore. Code wiring and product IDs are intact.
