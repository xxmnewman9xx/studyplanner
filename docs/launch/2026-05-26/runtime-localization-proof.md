# Runtime Localization Proof

Date: 2026-05-26 02:06 EDT / 2026-05-26 06:06 UTC

## Current Runtime Wiring

- `App.tsx` wraps the app in `I18nProvider`.
- Runtime locale can be forced with `EXPO_PUBLIC_STUDYPLANNER_LOCALE`.
- The launch catalog contains all 10 required locales:
  - `ar`
  - `de`
  - `en-US`
  - `es`
  - `fr`
  - `hi`
  - `ja`
  - `ko`
  - `pt-BR`
  - `zh-Hans`
- Navigation, onboarding headline/copy, scan headline/copy, photo-disabled errors, paywall headline/copy/features/legal links, and widget sync fallback are wired through runtime keys.
- `scripts/check-localization-completeness.mjs` now also scans static `t("...")` calls and verifies those keys exist in every locale.
- The reviewed runtime catalog currently contains 64 keys per locale.
- The scan/paywall copy for image-capable imports now reuses the reviewed `import.subtitle_images` translation in each locale instead of the older text/PDF-only scan copy.
- The high-visibility Scan and Plus runtime strings are now keyed instead of hard-coded in `ImportScreen` and `UpgradeScreen`.
- `npm run check:localization` now also rejects non-English catalog values that are silently identical to `en-US`, except intentional product/platform terms.

## Missing-Key Check

Command:

```sh
npm run check:localization
```

Expected result:

```text
runtime localization completeness gate passed
```

Actual result after the Scan/Plus i18n expansion:

```text
runtime localization completeness gate passed
```

## Coverage Gap

The reviewed translation source does not contain enough keys to fully localize every deep launch-critical UI string in Today, Calendar, Classes, Focus, Widgets, Settings, and all alert/error paths. Adding machine-generated strings here would fake localization. The current runtime gate proves that existing static `t("...")` calls have all 10 translations; it does not prove that every English runtime string in the app has been replaced.

## Locale Screenshot Smoke

Deterministic native simulator screenshots exist for `ar`, `de`, `ja`, and `zh-Hans` under:

```text
docs/launch/2026-05-26/fresh-native-screenshots/qa-capture/locales/
```

Older screenshots under `qa-capture/locales/` are not accepted release proof. They are blocker evidence:

- Scan screen shell strings localize, but the inner source picker/review hero still contains English strings.
- Arabic reverses several app-level rows, but the scan hero and mixed English product/source terms still need RTL review.
- Paywall locale screenshots were captured without production IAP env, so they show "Plus plans are unavailable" and cannot prove localized paid-product runtime.
- Locale screenshots predate the final native OCR env inlining fix and do not prove the current image-enabled Release bundle.

Current Arabic Release simulator proof exists under:

```text
docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/
```

That current Arabic build was compiled with:

- `EXPO_PUBLIC_STUDYPLANNER_LOCALE=ar`
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- production parser endpoint
- production Plus subscription IDs

Observed:

- `12-scan.png` shows RTL Arabic Scan copy, localized source picker labels, Camera/Photo enabled, and the image-enabled import copy.
- `24-plus.png` shows RTL Arabic paywall shell copy, real products loaded, yearly `$24.99`, monthly `$3.99`, restore/legal links visible.

Remaining localized runtime proof gap:

- Current image-enabled/IAP-configured Release screenshots still need to be repeated for `de`, `ja`, and `zh-Hans`.
- App Store product titles/descriptions in the Arabic paywall screenshot still come from StoreKit in English; App Store Connect subscription localizations must be entered/verified for localized product text.

## RTL Risk

Arabic is marked `direction: "rtl"` and the app shell receives RTL direction. Release still has RTL risk because:

- `I18nManager.allowRTL(true)` does not force a restart-time native RTL flip.
- Some nested row layouts remain manually left-to-right.
- Widgets and some formatted dates still use English-oriented compact labels.

## Release Status

Runtime localization is substantially more complete and the high-visibility Scan/Plus runtime gate passes for all 10 locales. Release remains blocked until current image-enabled/IAP-configured Release screenshots for `de`, `ja`, and `zh-Hans` are captured and reviewed, Arabic RTL risks are accepted or fixed, and App Store Connect product localization is verified so StoreKit product text is not English-only in localized storefronts.
