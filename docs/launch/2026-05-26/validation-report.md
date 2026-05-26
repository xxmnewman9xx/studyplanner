# Validation Report

Date: 2026-05-26 03:00 EDT / 2026-05-26 07:00 UTC

## Passed In This Rescue Cycle

- `npm run typecheck`
- `npm run check:iap`
- `npm run test:widgets`
- `npm run check:scenarios`
- `npm run test:parser`
- `npm run test:parser-endpoint`
- `npm run test:backend-platform`
- `npm run check:release-docs`
- `npm run check:localization`
- `npm run test:photo-ocr`
- `npm run test:planner`
- `npm run test:quick-homework`
- `npm run build:syllabus-parser`
- Railway deploy: `96f1fe35-2f55-4487-8b91-192eea973233`
- Production image OCR smoke: HTTP `200`, parsed `Lab Report` and `Final Exam`
- EAS production env: `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- Fresh native `Release` simulator build `28` launched on `StudyPlanner-QA-iPhone`
- Fresh native paywall product screenshot captured at `docs/launch/2026-05-26/fresh-native-screenshots/release-rescue/02-release-plus-deeplink.png`
- Fresh native saved-photo-to-review proof captured at `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/`
- Current native Release localized Scan/Plus screenshots captured for `ar`, `de`, `ja`, and `zh-Hans` under `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/`

## Latest Patch Validation

After localizing the app-owned theme toggle:

- `npm run check:localization` passed.
- `npm run typecheck` passed.
- Native `Release` simulator builds and screenshot captures completed for `ar`, `de`, `ja`, and `zh-Hans`.
- Current screenshots show localized theme labels instead of app-owned `Light` / `Dark` text.
- Current Plus screenshots still show two real store products and prices.

## Native Release Proof

Release builds were compiled with:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`

The native paywall screenshots show:

- `2 plans available` or localized equivalent
- Yearly Plus `$24.99`
- Plus Monthly `$3.99`
- Restore button visible
- Terms/EULA and Privacy visible

The native scanner screenshots show:

- Camera and Photo controls enabled in the Release simulator build.
- Saved photo selected from the native Photos picker in the `photo-rescue` proof.
- Production OCR/parser created `Lab Report` and `Final Exam` review cards.
- Reviewed rows were applied to Today.

## GitNexus

- `npx gitnexus analyze` completed successfully after the latest patch: 3,027 nodes, 5,459 edges, 99 clusters, 258 flows.
- `npx gitnexus impact --repo studyplanner --direction upstream ModeToggle` reported HIGH risk before the theme toggle edit: 3 direct callers and 4 affected processes (`App`, `AppContent`, `MoreScreen`, `OnboardingScreen`).
- `npx gitnexus detect-changes --repo studyplanner` reported 7 changed files, 23 symbols, 3 affected processes, aggregate risk `medium`.

## Release Decision

Do not upload a new build from this state.

Backend OCR, saved-photo import, and native Plus product loading are now proven in Release-style native builds. Release remains blocked because:

- Physical-device/TestFlight camera permission and live camera capture are still unproven.
- StoreKit product title/description/period metadata is still English in localized paywall screenshots; App Store Connect subscription localizations must be entered/verified.
- Runtime localization is still incomplete outside the smoked Scan/Plus/native shell. Hard-coded app-owned English remains in Today, Calendar, Classes, Focus, Grades, Widgets/settings, detail screens, and alert/error paths.
- Arabic RTL risk remains until accepted or fixed.
