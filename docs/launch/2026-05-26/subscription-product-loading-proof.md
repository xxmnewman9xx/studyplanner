# Subscription Product Loading Proof

Date: 2026-05-26 01:58 EDT / 2026-05-26 05:58 UTC

## Product ID Mapping

| Product | Code / EAS ID | Native price shown |
| --- | --- | --- |
| Monthly subscription | `com.mattnewman.studyplanner.plus.monthly` | `$3.99` |
| Yearly subscription | `com.mattnewman.studyplanner.plus.yearly` | `$24.99` |

## Proven In Fresh Native Release Build

- `npm run check:iap` passes.
- Production EAS env contains the two expected subscription product IDs.
- The native app code path uses `expo-iap` `fetchProducts` for subscriptions and renders store `displayPrice`.
- Fresh `Release` iphonesimulator build `28` was installed and launched on `StudyPlanner-QA-iPhone`.
- Screenshot: `docs/launch/2026-05-26/fresh-native-screenshots/release-rescue/02-release-paywall-deeplink.png`.
- Localized Release screenshot proof also exists at:
  - `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/24-paywall.png`
  - `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/de/24-paywall.png`
  - `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ja/24-paywall.png`
  - `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/zh-Hans/24-paywall.png`

Observed in the screenshot:

- `2 plans available`
- Yearly subscription price: `$24.99`
- Monthly subscription price: `$3.99`
- Restore Purchases button visible
- Terms of Use (EULA) link visible
- Privacy Policy link visible

## Remaining TestFlight Caveat

This is a fresh native `Release` simulator proof, not a processed physical-device TestFlight purchase pass. It proves the app-side product loading path no longer shows "plans unavailable" in the native release build.

StoreKit product title, subscription period, and description still render in English in localized screenshots. That is an App Store Connect subscription metadata localization blocker, not an app-owned runtime string. Before release, manually confirm both product IDs have localized product metadata in App Store Connect app `6766181202`, then verify in TestFlight/native sandbox.
