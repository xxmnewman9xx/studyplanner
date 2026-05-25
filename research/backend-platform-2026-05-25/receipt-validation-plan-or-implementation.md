# Receipt Validation Plan Or Implementation

Implemented client path:

- `src/services/purchaseValidation.ts`
- `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT`
- `server/purchase-validation/contract.ts`

If the endpoint is absent, the app keeps existing native `expo-iap` store-query entitlement behavior and does not claim server validation.

If the endpoint is present, purchase/restore/refresh candidates are posted to the server validation endpoint before Plus is treated as active. Purchase/restore validation failures do not silently fall back to local unlock. Passive refresh can still use the existing 24-hour previously verified local entitlement grace window with an in-app warning.

Server requirements before claiming production receipt validation:

- Deploy HTTPS route matching `server/purchase-validation/README.md`.
- Configure Apple App Store Server API credentials on the server.
- Verify product IDs against the committed app product IDs.
- Capture sandbox/TestFlight purchase and restore proof.
- Add App Store Server Notifications V2 only when entitlement revocation/renewal events need push-based updates.

Not implemented here:

- Apple private key storage.
- App Store Server API client.
- Google Play Developer API client.
- Webhook processing.
