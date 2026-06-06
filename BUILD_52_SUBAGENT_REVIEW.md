# Build 52 Subagent Review

## 1. Auth / Entitlement Engineer

- Root cause hypothesis: purchase update events could unlock from a known product and `purchaseState === "purchased"` without revalidating active subscriptions.
- Evidence: `src/iap.ts` purchase finish path; `App.tsx` purchase listener activates entitlement from its result.
- Fix: `finishStudyPlannerPurchase()` now finishes the transaction and re-runs `checkStudyPlannerEntitlement()` before returning premium.
- Failure mode to test: known purchased update with `getActiveSubscriptions()` returning empty must stay locked.

## 2. Routing Engineer

- Root cause hypothesis: external routes were consumed while entitlement was loading and locked users were forced to locked dashboard even for preview/paywall links.
- Evidence: initial URL handling in `App.tsx` route effect.
- Fix: initial routes return while `entitlementStatus === "loading"` before marking handled; locked users can route to `scan`, `paste`, and `paywall`, but product routes still lock.
- Failure mode to test: cold starts from `studyplanner://scan`, `studyplanner://paste`, `studyplanner://paywall`, `studyplanner://today`, `studyplanner://plan`.

## 3. Storage Migration Engineer

- Root cause hypothesis: malformed storage could hang app startup or migrate string `"false"` into completed onboarding.
- Evidence: `loadData()` had init/query outside catch; `normalizeData()` used `Boolean(osLive)`.
- Fix: `loadData()` catches DB/JSON failures, backs up corrupt payloads, and returns default data; `normalizeData()` uses strict booleans and never trusts stored premium.
- Failure mode to test: corrupt SQLite row, invalid JSON, old `osLive:true/premium:true`, malformed `osLive:"false"/premium:"true"`.

## 4. IAP Engineer

- Root cause hypothesis: a real prior sandbox purchase can legitimately unlock; transaction replay was the lower-probability bug path.
- Evidence: bundle and IAP IDs are unchanged; active subscriptions are queried through StoreKit.
- Fix: transaction updates no longer unlock without active-subscription confirmation.
- Failure mode to test: fresh sandbox ID restore must not unlock; sandbox ID with active prior purchase should unlock until expiration.

## 5. QA Engineer

- Root cause hypothesis: static checks were strong but not a substitute for fresh-install/runtime race tests.
- Evidence: `check:build52` is source/assertion-based.
- Fix: strengthened static checks for purchase revalidation, initial URL loading, storage strictness, direct onboarding actions, and App Review pricing/legal gates.
- Failure mode to test: upgrade + stale premium + initial URL + delayed entitlement + widget sync.

## 6. Conversion Designer

- Root cause hypothesis: conversion risk was proof/intent mismatch, especially “Upload PDF” landing on camera-first scan.
- Evidence: final onboarding choice previously routed to scan instead of launching selected import action.
- Fix: final onboarding actions now execute selected intent: PDF, paste, camera, or locked dashboard.
- Failure mode to test: choose Upload PDF on fresh install and verify PDF picker path starts.

## 7. App Review Risk Reviewer

- Root cause hypothesis: generic Apple privacy URL, purchasable fallback plans without localized price, and synthetic-looking onboarding metrics could trigger review risk.
- Evidence: `PRIVACY_URL` pointed to Apple privacy; fallback plans displayed “Shown by App Store”; artifact cards included fixed metrics.
- Fix: added in-app Terms/Privacy routes, disabled purchase until localized StoreKit pricing loads, removed fixed numeric preview metrics.
- Failure mode to test: product load failure must keep purchase disabled; reviewer can open Privacy Policy and Terms of Use while locked.

## Overall Decision

Code-level root cause was found and fixed. Physical fresh-install/TestFlight proof remains incomplete, so TestFlight submission was not attempted.

