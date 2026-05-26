# Validation Report

Date: 2026-05-26 02:06 EDT / 2026-05-26 06:06 UTC

## Passed In This Pass

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
- App-side native env inlining fix verified by rebuilding Release simulator JavaScript with the production parser endpoint and image parsing flag.
- Fresh native photo picker proof captured at `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/`.
- Current Arabic native Release simulator build after the Scan/Plus localization expansion succeeded.
- Current Arabic native Release screenshots captured at `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/`.
- `npx gitnexus analyze` completed successfully after implementation; a later retry after the final doc-only status patch intermittently crashed with `Napi::Error`.
- `npx gitnexus detect-changes --repo studyplanner` completed and reported 34 changed files, 156 changed symbols, 128 affected processes, aggregate risk `critical`.

## Native Release Proof

Release build was compiled with:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`

The native paywall screenshot shows:

- `2 plans available`
- Yearly Plus `$24.99`
- Plus Monthly `$3.99`
- Restore Purchases visible
- Terms of Use (EULA) and Privacy Policy visible

The native scanner screenshots show:

- Camera and Photo controls enabled in the Release simulator build.
- Saved photo selected from the native Photos picker.
- Production OCR/parser created `Lab Report` and `Final Exam` review cards.
- Reviewed rows were applied to Today.

## Release Decision

Do not upload a new build from this state. Backend OCR and native Plus product loading are now proven, but release remains blocked until:

- A physical-device/TestFlight camera capture proves camera permission and image capture creates review cards from a real image. Saved-photo import is proven in Release simulator.
- Runtime localization screenshots are freshly reviewed and accepted for `ar`, `de`, `ja`, and `zh-Hans`.
- Arabic RTL risk is accepted or fixed.

Current Arabic runtime screenshots are materially improved and show real products/prices, but release remains blocked because current image-enabled/IAP-configured localized screenshots still need to be repeated for `de`, `ja`, and `zh-Hans`, and StoreKit product titles/descriptions still need App Store Connect localization verification.
