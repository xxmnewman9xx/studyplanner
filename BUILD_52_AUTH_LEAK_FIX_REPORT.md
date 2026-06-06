# Build 52 Auth Leak Fix Report

## Root Cause

The critical leak was the purchase listener path. `finishStudyPlannerPurchase()` previously trusted a purchase update object with a known product ID and `purchaseState === "purchased"` and returned premium directly. A replayed or stale transaction event could therefore activate app access without a fresh active-entitlement query.

## Fix

- `src/iap.ts`: `finishStudyPlannerPurchase()` now finishes a valid purchase update, then calls `checkStudyPlannerEntitlement()` and only returns premium if StoreKit active subscriptions confirm it.
- `App.tsx`: `entitlementUnlocks()` now depends only on active entitlement status, not local premium.
- `App.tsx`: screen props receive sanitized data through `dataForAccessState()`.
- `App.tsx`: persistence scrubs premium unless entitlement is active.
- `App.tsx`: deep links wait while entitlement is loading and preserve allowed preview/paywall routes for locked users.
- `src/storage.ts`: malformed booleans no longer migrate to onboarding completion, stored premium is distrusted, and corrupt payloads are backed up before reset.

## Why Old Tests Missed It

The older checks were mostly static string assertions and did not model a purchase update object when `getActiveSubscriptions()` returns empty. Build 52 checks now assert that purchase updates revalidate active entitlement.

## New Guardrails

- `npm run check:build52`
- `npm run test:hard-paywall`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `npm run check:iap`

