# App Review And IAP Audit

## Verdict

App Review and IAP configuration are safer than baseline, with one external blocker remaining: real sandbox purchase/restore validation against App Store configured products.

## Product IDs

- Monthly subscription preserved: `com.mattnewman.studyplanner.plus.monthly`
- Yearly subscription preserved: `com.mattnewman.studyplanner.plus.yearly`
- Lifetime prepared only as a real non-consumable ID: `com.mattnewman.studyplanner.plus.lifetime`

## Fixes Completed

- `src/services/purchaseConfig.ts` documents expected monthly, yearly, and lifetime IDs without changing the env-driven runtime config.
- `scripts/check-iap-config.mjs` verifies documented IDs and optional env IDs.
- `scripts/verify-production-config.mjs` prevents shipping with `EXPO_PUBLIC_STORE_CAPTURE=1`.
- `src/services/subscriptions.tsx` no longer leaves the paywall in a permanent loading state after product-load failure.
- Store-backed purchase and restore paths remain in place; no fake Lifetime entitlement or fake premium grant was added.
- App Review notes and metadata were updated away from overclaiming scan/OCR perfection.

## QA Evidence

- `npm run check:iap` passed.
- `npm run verify:production` passed.
- Paywall screenshot `19-paywall-monthly-yearly-lifetime.png` honestly shows the product-load failure state in the local simulator environment.

## Remaining Risk

- Sandbox purchase, restore, subscription renewal/expiry, and Lifetime non-consumable purchase must be tested with real App Store Connect products before final submission.
