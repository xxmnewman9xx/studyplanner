# Localized Screenshot Proof

Date: 2026-05-26

## Status

Partial localized native screenshots are included for four smoke-test locales:

- `ar`
- `de`
- `ja`
- `zh-Hans`

These screenshots are blocker evidence, not release proof. The current uploaded TestFlight build `27` predates the runtime i18n wiring and the native OCR env inlining fix in source. The simulator locale captures also predate the final image-enabled Release proof and were captured without the production IAP product env, so they cannot prove localized product loading or image-enabled scanning.

## Available Evidence

- Current uploaded TestFlight build: build `27`
- Current IPA: `builds/StudyPlanner-1.0.2-b27.ipa`
- Upload receipt: `docs/launch/2026-05-26/testflight-upload-receipt.md`
- Partial locale smoke screenshots:
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/ar/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/de/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/ja/`
  - `docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/zh-Hans/`
- Recent English UI screenshot sets from the current design family:
  - `qa-screenshots/2026-05-25-final-release-cycle/final-current-ui-v2/`
  - `qa-screenshots/2026-05-25-final-release-cycle/onboarding-paywall/`
  - `qa-screenshots/2026-05-25-final-release-cycle/personalization-v2/`

## Observed Blockers

- Scan and paywall screenshots still contain English inner UI strings.
- Arabic RTL direction is only partially exercised; mixed English source/product labels remain.
- Paywall locale screenshots show products unavailable because production subscription IDs were not configured in those locale capture builds.
- The screenshots do not cover all 10 required locales.

## Required Before Valid Localized Screenshots

1. Build and install a native app from the source with `src/i18n.tsx`, the launch-critical catalog, the native OCR env inlining fix, production parser endpoint, image parsing flag, and production IAP product IDs wired.
2. Localize native permission strings, app display name/subtitle metadata, and paywall copy where the platform supports it.
3. Run simulator captures for at least `en-US`, `ar`, `de`, `hi`, `ja`, and `zh-Hans`.
4. Inspect for clipping, bad line breaks, incorrect Arabic RTL behavior, and paywall/subscription ambiguity.

This file is intentionally a blocker record, not fake proof.
