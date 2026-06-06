# Build 49 Paywall Repro Report

## Result
Reproduced by code-path audit: Build 48 could trust local app state before a fresh entitlement validation and conflated onboarding/live setup with product access.

## Root Cause
- `osLive` was used as the post-onboarding/live-app marker.
- Startup routed `osLive && !premium` to paywall, but `premium` was loaded from local storage before entitlement validation.
- Import review could call `applyImport` directly from the review screen.
- Pre-purchase routes were too narrow for the intended value-first preview funnel.

## Fixed
- Added `prefs.onboardingComplete`.
- Startup now calls `lockUnvalidatedPremium`, forcing local premium false until a real App Store entitlement, purchase, or restore path marks it active.
- Onboarding completion routes to `importOptions`, not the real app.
- Review apply now opens paywall when `!data.prefs.premium`.
- Pending import preview is applied only in `premiumData` purchase/restore flows.

## Hard Rule
`onboardingComplete !== premium`

Onboarding completion never unlocks Today, Plan, Classes, Notes, Study Sessions, reminders, or widgets.

