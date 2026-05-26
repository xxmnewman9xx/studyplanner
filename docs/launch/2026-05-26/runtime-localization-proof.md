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

## Missing-Key Check

Command:

```sh
npm run check:localization
```

Expected result:

```text
runtime localization completeness gate passed
```

Actual result:

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

Those screenshots are not accepted release proof. They are blocker evidence:

- Scan screen shell strings localize, but the inner source picker/review hero still contains English strings.
- Arabic reverses several app-level rows, but the scan hero and mixed English product/source terms still need RTL review.
- Paywall locale screenshots were captured without production IAP env, so they show "Plus plans are unavailable" and cannot prove localized paid-product runtime.
- Locale screenshots predate the final native OCR env inlining fix and do not prove the current image-enabled Release bundle.

## RTL Risk

Arabic is marked `direction: "rtl"` and the app shell receives RTL direction. Release still has RTL risk because:

- `I18nManager.allowRTL(true)` does not force a restart-time native RTL flip.
- Some nested row layouts remain manually left-to-right.
- Widgets and some formatted dates still use English-oriented compact labels.

## Release Status

Runtime localization is materially wired, but full launch-critical screen text replacement is not complete. Release remains blocked unless reviewed translations are added for the remaining runtime strings and fresh locale screenshots for `ar`, `de`, `ja`, and `zh-Hans` are captured from the same image-enabled/IAP-configured Release bundle and reviewed with these RTL risks.
