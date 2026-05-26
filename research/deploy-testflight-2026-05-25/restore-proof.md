# Restore Proof

Date: 2026-05-25

## Result

Blocked. No live restore proof was produced in this pass.

## Exact Blockers

- No prior sandbox purchase was completed in this pass.
- No new TestFlight build was uploaded after endpoint deployment because backend deployment was blocked.
- No purchase validation endpoint is deployed.
- No `EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT` is configured in production EAS env.

## Required Proof

1. Complete a sandbox purchase on a processed TestFlight build.
2. Fresh install or clear local app data.
3. Sign in with the same sandbox Apple ID.
4. Tap `Restore Purchases`.
5. Confirm the app unlocks only after the store entitlement is found and, if configured, the server validation endpoint returns `isPremium: true`.
6. Capture screenshots and backend validation logs.
