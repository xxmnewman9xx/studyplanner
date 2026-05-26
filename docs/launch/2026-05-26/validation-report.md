# Validation Report

Date: 2026-05-26 04:45 EDT / 2026-05-26 08:45 UTC

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
- `npm run qa:release`
- Railway deploy: `96f1fe35-2f55-4487-8b91-192eea973233`
- Production image OCR smoke: HTTP `200`, parsed `Lab Report` and `Final Exam`
- EAS production env: `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- Fresh native `Release` simulator build `28` launched on `StudyPlanner-QA-iPhone`
- Fresh native paywall product screenshot captured at `docs/launch/2026-05-26/fresh-native-screenshots/release-rescue/02-release-plus-deeplink.png`
- Fresh native saved-photo-to-review proof captured at `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/`
- Current native Release localized Today/Calendar/Classes/Scan/Plus screenshots captured for `ar`, `de`, `ja`, and `zh-Hans` under `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/`

## Latest Patch Validation

After localizing the app-owned Classes launch surface:

- `npm run check:localization` passed.
- `npm run typecheck` passed.
- `npm run qa:release` passed after updating the scenario gate to recognize localized Today action labels while still asserting the real scan/reminder/calendar handlers.
- `npm run build:syllabus-parser` passed.
- Native `Release` simulator builds and screenshot captures completed for `ar`, `de`, `ja`, and `zh-Hans`.
- Current Classes screenshots show localized hero, course hub, class state, course list, shared class card open/completed labels, date formatting, and localized tab labels.
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

The native Today screenshots show:

- `10-today-light.png` and `11-today-dark.png` captured per smoked locale.
- App-owned Today shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Date formatting and short duration labels localized in the next-action card.
- English `BIO 101` assignment text remains fixture/imported planner data, not app-owned runtime UI.

The native Calendar screenshots show:

- `14-calendar.png` captured per smoked locale.
- App-owned Calendar shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Month/selected-day formatting and duration labels localized in the native Release bundle.
- English `BIO 101` assignment text remains fixture/imported planner data, not app-owned runtime UI.

The native Classes screenshots show:

- `17-classes.png` captured per smoked locale.
- App-owned Classes shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Date formatting plus class count/open/completed labels localized in the native Release bundle.
- English course names, teacher names, room names, note titles, and assignment titles remain fixture/imported planner data, not app-owned runtime UI.

## GitNexus

- `npx gitnexus analyze` completed successfully after the Classes patch: 3,066 nodes, 5,550 edges, 100 clusters, 259 flows.
- Before editing `TodayScreen`, GitNexus impact was run for `TodayScreen` and the edited helper/render symbols. `TodayScreen` was LOW risk; `buildLiveBrief`, `CatchUpSprintCard`, `formatDueUrgency`, `buildQuickDuePresets`, `imageActionLabel`, and `MetricPill` reported HIGH risk because they feed the default app flow through `TodayScreen` / `AppContent` / `App`.
- Before editing `PlanScreen`, GitNexus impact was run for `PlanScreen` and the edited helper symbols. `PlanScreen` was LOW risk; `buildPlanState`, `buildSimpleWeekGroups`, `formatSelectedDate`, `formatHoursValue`, `buildSurvivalBlocks`, and `buildWeekLoadSummary` reported HIGH risk because they feed `PlanScreen` / `AppContent` / `App`.
- Before editing `CoursesScreen`, GitNexus impact was run for `CoursesScreen` and the edited helper/shared symbols. `CoursesScreen` and `EmojiBadge` were LOW risk; `buildClassHealth`, `ClassStateTile`, and `ClassIdentityCard` reported HIGH risk, and `AppLogo` reported CRITICAL risk because they feed the app shell through `CoursesScreen` / `AppContent` / `App` or shared loading/onboarding/paywall paths. The shipped changes are text/date localization only.
- `npx gitnexus detect-changes --repo studyplanner` reported 10 changed files, 31 symbols, 6 affected execution flows, aggregate risk `high`. The affected flows are the expected runtime localization paths through `CoursesScreen` / `ClassIdentityCard` into locale resolution.

## Release Decision

Do not upload a new build from this state.

Backend OCR, saved-photo import, and native Plus product loading are now proven in Release-style native builds. Release remains blocked because:

- Physical-device/TestFlight camera permission and live camera capture are still unproven.
- StoreKit product title/description/period metadata is still English in localized paywall screenshots; App Store Connect subscription localizations must be entered/verified.
- Runtime localization is still incomplete outside the smoked Today/Calendar/Classes/Scan/Plus/native shell. Hard-coded app-owned English remains in Focus, Grades, Widgets/settings, detail screens, and alert/error paths.
- Arabic RTL risk remains until accepted or fixed.
