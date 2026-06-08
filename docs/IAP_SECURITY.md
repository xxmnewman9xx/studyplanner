# IAP Security And Receipt Validation

StudyPlanner uses native `expo-iap` store APIs for purchase, restore, product loading, and local entitlement refresh.

## Current App Behavior

- Product IDs come from `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS` and `EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS`.
- The app unlocks StudyPlanner from active store subscriptions or active non-consumable purchases.
- A recently verified local entitlement can be used for a 24-hour offline grace window.
- Unknown product IDs, pending purchases, failed restores, and unavailable stores do not unlock StudyPlanner.

## Optional Server Validation Path

If `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` is configured, the app posts purchase/restore/refresh candidates to that endpoint before treating access as active. The endpoint must verify transactions with App Store Server API or Google Play Developer API and return the contract in `server/purchase-validation/README.md`.

If server validation is configured and fails during purchase or restore, the app does not silently fall back to local unlock for that validation request. During passive refresh, a previously verified local entitlement may still be used inside the 24-hour grace window with an in-app warning.

## Not Yet Production-Proven In This Repo

- No Apple private key or issuer credentials are stored in the repo.
- No deployed validation service URL is committed.
- No App Store Server Notification V2 webhook is implemented.
- No Google Play Developer API validation implementation is included.

Do not claim server-side receipt validation in App Review materials until the server endpoint is deployed, configured, and sandbox/TestFlight proof is captured.
