# Android Billing Report - Sprint 001

## Existing Build 52 Billing

- Billing library: `expo-iap`.
- iOS bundle ID: `com.mattnewman.studyplanner`.
- Apple ASC app ID: `6766181202`.
- Existing subscription products:
  - `com.mattnewman.studyplanner.plus.monthly`
  - `com.mattnewman.studyplanner.plus.yearly`
- Purchase listener: `purchaseUpdatedListener` in `App.tsx`.
- Error listener: `purchaseErrorListener` in `App.tsx`.
- Entitlement check: `getActiveSubscriptions(...)`.
- Finish transaction: `finishTransaction({ purchase, isConsumable: false })`.
- Restore equivalent: `restorePurchases()` followed by active entitlement check.

## Implemented for Android

- Added Android package constant:
  - `STUDYPLANNER_ANDROID_PACKAGE_ID = "com.mattnewman.studyplanner"`
- Added Android subscription catalog:
  - `STUDYPLANNER_ANDROID_SUBSCRIPTION_IDS`
  - currently mirrors the Build 52 product IDs to preserve parity.
- Added platform active catalog:
  - Android uses `STUDYPLANNER_ANDROID_SUBSCRIPTION_IDS`.
  - iOS uses `STUDYPLANNER_SUBSCRIPTION_IDS`.
- `loadStorePlans()` now fetches platform subscription IDs.
- `checkStudyPlannerEntitlement()` now checks active platform subscriptions.
- `purchasePlan()` already supplied Google Play SKU request shape and is preserved.
- Paywall copy is platform-aware:
  - Android: Google Play.
  - iOS: App Store.
- Restore copy is platform-aware:
  - Android: Google Play account.
  - iOS: Apple ID.
- Manage subscription URL is platform-aware:
  - Android: `https://play.google.com/store/account/subscriptions`
  - iOS: `https://apps.apple.com/account/subscriptions`
- Prebuild added OpenIAP Google dependency:
  - `io.github.hyochan.openiap:openiap-google:2.2.1`
- Local IAP guard updated to require Android package/subscription constants while preserving Apple IDs.

## What Was Reused

- Existing paywall layout, plan selector, onboarding lock funnel, purchase listener, restore flow, entitlement activation, locked import apply, and Build 52 premium scrubbing model.
- Existing monthly/yearly product model.
- Existing active-subscription entitlement rule.

## What Changed

- Store-facing strings now use `storeDisplayName()` instead of hard-coded App Store copy.
- Product lookup and entitlement checks now use active platform subscription IDs.
- Android manage-subscription URL now opens Google Play subscriptions.
- Local QA script accepts platform entitlement checks instead of Apple-only `getActiveSubscriptions([...STUDYPLANNER_SUBSCRIPTION_IDS])`.

## Remaining Blockers

- Google Play Console products must be created for monthly and yearly subscription parity.
- Product IDs must be confirmed in Play Console before real purchase testing.
- License testers/internal app sharing are required for real Google Play Billing verification.
- Current entitlement verification matches Build 52's local store-active check. A production server receipt-validation backend does not exist in this app.
- Android purchase/restore could not be runtime-tested because no Android SDK/emulator is configured on this machine.

## Commands

- `npm run check:iap`: PASS.
- `npm run check:build52`: PASS.
- `npm run typecheck`: PASS.
- `npx expo prebuild --platform android --no-install`: PASS, OpenIAP Google dependency added.
