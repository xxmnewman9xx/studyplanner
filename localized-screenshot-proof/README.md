# Localized Screenshot Proof

Date: 2026-05-26

## Status

Partial localized native screenshots are included for four older smoke-test locales:

- `ar`
- `de`
- `ja`
- `zh-Hans`

Those older screenshots are blocker evidence, not release proof. The current uploaded TestFlight build `27` predates the runtime i18n wiring and the native OCR env inlining fix in source. The older simulator locale captures also predate the final image-enabled Release proof and were captured without the production IAP product env, so they cannot prove localized product loading or image-enabled scanning.

Current Arabic Release simulator screenshots are included and are stronger proof:

- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/12-scan.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/24-paywall.png`

They were captured from an image-enabled, production-parser, production-IAP-ID Release simulator build with `EXPO_PUBLIC_STUDYPLANNER_LOCALE=ar`.

## Available Evidence

- Current uploaded TestFlight build: build `27`
- Current IPA: `builds/StudyPlanner-1.0.2-b27.ipa`
- Upload receipt: `docs/launch/2026-05-26/testflight-upload-receipt.md`
- Partial locale smoke screenshots:
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/ar/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/de/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/ja/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/zh-Hans/`
- Current Arabic Release screenshots:
  - `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/`
- Recent English UI screenshot sets from the current design family:
  - `qa-screenshots/2026-05-25-final-release-cycle/final-current-ui-v2/`
  - `qa-screenshots/2026-05-25-final-release-cycle/onboarding-paywall/`
  - `qa-screenshots/2026-05-25-final-release-cycle/personalization-v2/`

## Observed Blockers

- Current Arabic Scan and paywall shell runtime strings are localized and RTL.
- StoreKit product titles/descriptions in the current Arabic paywall are still English, so App Store Connect subscription localization remains unverified.
- Current image-enabled/IAP-configured screenshots do not yet cover `de`, `ja`, or `zh-Hans`.
- The screenshot set still does not cover all 10 required locales.

## Required Before Valid Localized Screenshots

1. Build and install a native app from the source with `src/i18n.tsx`, the launch-critical catalog, the native OCR env inlining fix, production parser endpoint, image parsing flag, and production IAP product IDs wired.
2. Localize native permission strings, app display name/subtitle metadata, and paywall copy where the platform supports it.
3. Run simulator captures for at least `en-US`, `ar`, `de`, `hi`, `ja`, and `zh-Hans`.
4. Inspect for clipping, bad line breaks, incorrect Arabic RTL behavior, and paywall/subscription ambiguity.

This file is intentionally a blocker record, not fake proof.
