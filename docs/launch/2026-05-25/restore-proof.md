# Restore Proof

Date: 2026-05-25

## Proven

- `Restore Purchases` is visible on the native paywall screenshot.
- Restore is wired to `restorePurchases()` in `src/services/subscriptions.tsx`.
- `npm run check:iap` verifies the purchase/restore integration points.

## Not Proven

- No live sandbox/TestFlight restore transaction was completed in this pass.
- Restore against a second install/device/account is not locally provable without Apple sandbox/TestFlight state.

## Exact Manual Steps

1. Install TestFlight build `1.0.2` / `24`.
2. Sign in with the same sandbox Apple ID used for a successful purchase.
3. Fresh install or clear local app data.
4. Complete onboarding to the hard paywall.
5. Tap `Restore Purchases`.
6. Capture the restored success message and unlocked StudyPlanner state.
7. Repeat with a non-entitled sandbox Apple ID and verify the app remains locked.
