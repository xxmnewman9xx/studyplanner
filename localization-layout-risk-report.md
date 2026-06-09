# Localization Layout Risk Report

Date: 2026-05-26

## Executive Status

Localization copy is drafted and reviewed for claim safety, and the current source now includes a lightweight runtime i18n provider for launch-critical screens. The uploaded TestFlight binary is still build `27`; localized screenshot QA must be repeated after the next native build.

## Highest-Risk Areas

- Arabic RTL: high risk until `I18nManager` behavior, navigation direction, tab order, icon mirroring, numeric/date formatting, and mixed English product names are tested on-device.
- German, Spanish, French, and Portuguese expansion: high risk in compact buttons, tab labels, onboarding headlines, import states, widget preview labels, and paywall feature rows.
- Hindi: medium-high risk for line height, glyph fallback, mixed English feature names, and dense paywall/legal copy.
- Japanese, Korean, and Simplified Chinese: medium risk for line breaks and mixed English labels such as Today, Calendar, Focus, Grades, and Plus.
- Widgets: high risk because widget labels, counters, due-date summaries, and small-size layouts have strict space constraints.
- Paywall and subscriptions: high risk because long localized descriptions must stay legible and clear about auto-renewal without implying fake pricing, trials, or unlimited usage.
- Import/scanner copy: high compliance risk. Production backend OCR is now live and saved-photo import has Release simulator proof, but copy still must avoid implying guaranteed extraction, automatic import, Canvas/LMS sync, or unproven physical-camera behavior until TestFlight device capture passes.

## Claim-Safety Findings

- Production parser smoke tests prove text, text-based PDF, multipart text, and readable image OCR parsing over HTTPS.
- Image OCR production smoke returned HTTP `200` and parsed `Lab Report` plus `Final Exam`; `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1` is now set in EAS production.
- Fresh native Release simulator photo-picker proof created review cards from a saved syllabus image. Physical camera capture remains unproven until TestFlight/device QA.
- Metadata and app strings avoid unsupported Canvas/LMS sync, school-account access, guaranteed extraction, fake automation, fake prices, and automatic homework submission.
- Source now uses the display name `StudyPlanner: Syllabus AI` with the truth boundary limited to reviewed AI-assisted syllabus organization. Camera/photo purpose strings remain gated on image import support.

## Current Artifacts

- Reviewed app-string starter catalog: `localized-app-strings/core-launch-strings.json`
- Catalog integration note: `localized-app-strings/README.md`
- App Store metadata: `localized-app-store-metadata.md`
- Subscription copy table: `subscription-localization-table.md`
- Screenshot status/blocker record: `localized-screenshot-proof/README.md`

## Required Engineering Follow-Up

1. Keep expanding runtime keys beyond launch-critical surfaces after TestFlight validation.
2. Keep code keys, enum IDs, product IDs, parser field names, storage keys, and API contracts unlocalized.
3. Add Arabic RTL simulator runs and visual review.
4. Add deterministic capture routes for `ar`, `de`, `hi`, `ja`, and `zh-Hans`.
5. Fix clipping or ambiguous paywall copy before calling the app fully localized.

## Screenshot Smoke Result

Localized native screenshot smoke is still required for the next build. Existing English screenshots remain useful for baseline layout comparison, but they cannot prove localized layouts.
