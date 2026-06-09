# Localization Audit

Baseline: build `1.0.2 (32)` source and fresh English b32 simulator screenshots.

Supported locales in catalog:

- `en-US`
- `es`
- `fr`
- `de`
- `pt-BR`
- `ja`
- `ko`
- `zh-Hans`
- `ar`
- `hi`

Automated catalog coverage is not enough for release: the current runtime still contains visible hardcoded English and App Store metadata strings.

## Issues

| Severity | ID | Area | Issue | Required fix |
|---|---|---|---|---|
| critical | L-001 | Build 32 native config | `app.json` is build `32`, but source `ios/StudyPlannerSyllabusAI/Info.plist` is still `29`. This can create mismatched localized widget/app metadata. | Sync native version/build values before archive. |
| critical | L-002 | Widget Studio | Fresh b32 Widget Studio shows English strings such as "Customize", "Class Colors", "Accent", "Customize your iPhone widgets". | Move all Widget Studio text through i18n. |
| critical | L-003 | Watch | Watch-style source copy is hardcoded English: "EXAM IN 7 DAYS", "DUE FRIDAY", "45 min", "+2 more", "TUE 13". | Localize or remove Watch marketing until real localized Watch UI exists. |
| critical | L-004 | App Store screenshots | No fresh localized screenshot set exists for build `32`; only `en-US` was freshly captured. | Recapture every locale after runtime strings are fixed. |
| major | L-005 | Home | Hardcoded English remains in current Home source, including greeting/supporting labels and workload copy. | Localize Home strings and date formatting. |
| major | L-006 | Forecast | Current Forecast source has hardcoded English labels/fixture text and `en-US` date formatting. | Localize labels, fixture text, and date formatting. |
| major | L-007 | Classes | Current Classes source has hardcoded labels such as "Days left", "Tasks left", "High workload", "Assignments", "Exams". | Localize all class summary and section text. |
| major | L-008 | WidgetKit metadata | `app.json` widget gallery names/descriptions are English-only. | Provide localized WidgetKit display names/descriptions or avoid claiming localized widget gallery polish. |
| major | L-009 | Native widget runtime | Widget fallback strings include English such as "Biggest:", "Today", "Next", and task pluralization. | Localize widget snapshot/fallback strings. |
| major | L-010 | Paywall | "APP STORE - STORE PLANS" is understandable English but too internal for non-English storefronts. | Localize and make storefront trust copy consumer-facing. |
| major | L-011 | Arabic/Hindi/CJK | English fixture course names and fixed-width chips can create mixed-language UI and truncation risk. | Use localized or neutral fixture data for captures. |
| minor | L-012 | Tab labels | Some Latin locales leave brand/category terms identical to English. | Accept only for brand terms; review all generic labels. |

## Locale Notes

| Locale | Status | Notes |
|---|---|---|
| English | major | Copy is generally clear. Paywall and native build config need cleanup. |
| Spanish | major | Catalog exists, but runtime hardcoded English will leak on Home, Forecast, Classes, and Widget Studio. |
| French | major | Same runtime leak risk; longer labels need screenshot recapture. |
| German | major | High truncation risk on Widget Studio controls and Paywall product cards. |
| Portuguese | major | Requires recapture with `pt-BR` data and long plan labels. |
| Japanese | major | English fixture names and hardcoded widget/watch strings will stand out. |
| Korean | major | Same as Japanese; verify segmented controls and chips. |
| Chinese | major | `zh-Hans` needs fresh screenshots; avoid mixed English course data. |
| Arabic | critical | RTL screenshots must be recaptured from b32; current evidence is English-only. |
| Hindi | major | Long strings and mixed English data need real screenshot QA. |

## Localization Release Gate

Pass only when:

1. Hardcoded visible strings above are moved to the localization catalog.
2. WidgetKit metadata is localized or claims are narrowed.
3. Fresh b32 screenshots exist for all 10 locales.
4. Arabic RTL and German/French/Portuguese truncation are visually inspected.
