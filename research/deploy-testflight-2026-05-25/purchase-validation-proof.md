# Purchase Validation Proof

Date: 2026-05-25
Current commit: `8e567d8dd75eb002cf01d25b3492cd1f68286539`

## Server Validation Status

Not deployed and not proven.

The repo contains a validation contract at `server/purchase-validation/contract.ts`, but it does not contain a production route that calls Apple App Store Server API or Google Play Developer API. The app-side client correctly treats `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` as optional and disabled when absent.

## Exact Missing Server Secrets

For iOS/TestFlight server validation, the backend must have:

- `STUDYPLANNER_APPLE_BUNDLE_ID`
- `STUDYPLANNER_APPLE_ISSUER_ID`
- `STUDYPLANNER_APPLE_KEY_ID`
- `STUDYPLANNER_APPLE_PRIVATE_KEY`

These were not present in the local environment by name, and no deployed backend secret store was available through an authenticated hosting target.

## App Env Status

Production EAS env does not contain:

- `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT`

That is the correct fail-safe state until a real validation server is deployed and smoke-tested.

## Proof Blocker

Server validation cannot be claimed until a deployed HTTPS route receives an actual purchase/restore request and verifies it with Apple using App Store Server API credentials.

## Required Proof After Implementation

1. Deploy `POST /api/purchases/validate`.
2. Configure the Apple App Store Server API secrets above on the backend.
3. Set `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` in production EAS env to the deployed HTTPS route.
4. Install the new TestFlight build.
5. Complete a sandbox purchase.
6. Confirm backend logs show the transaction request and Apple validation result.
7. Confirm the app unlocks only after the server returns `isPremium: true`.
