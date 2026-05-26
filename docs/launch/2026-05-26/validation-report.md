# Validation Report

Date: 2026-05-26 07:51 EDT / 2026-05-26 11:51 UTC

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
- Current native Release localized Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus screenshots captured for `ar`, `de`, `ja`, and `zh-Hans` under `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/`

## Latest Patch Validation

After localizing the app-owned Scan review/edit controls, generated review findings, and import alert/fallback copy:

- `npm run check:localization` passed.
- `npm run typecheck` passed.
- `npm run test:photo-ocr`, `npm run test:parser-endpoint`, `npm run check:scenarios`, and `npm run check:release-docs` passed.
- `npm run qa:release` passed after the final import-created semester fallback was localized.
- Native `Release` simulator builds, explicit installs, build-product cleans, and review screenshot captures completed for `ja` and `zh-Hans` after the final catalog cleanup. The earlier `ar` and `de` review captures from the same Scan review patch remain current.
- Current Review screenshots show localized Scan review hero, review gate, review stats, trust-check copy, confidence chips, checklist notes, tab labels, and add-to-Today controls.
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
- `13-review.png` now captured per smoked locale.
- App-owned Scan review gate, review stats, trust-check copy, confidence chips, checklist notes, and add-to-Today controls are localized for `ar`, `de`, `ja`, and `zh-Hans`.

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

The native Focus screenshots show:

- `18-focus.png` captured per smoked locale.
- App-owned Focus timer shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Timer status/stat labels, duration chips, date formatting, and note instruction copy localized in the native Release bundle.
- English assignment title and course code remain fixture/imported planner data, not app-owned runtime UI.

The native Grades screenshots show:

- `25-grades.png` captured per smoked locale.
- App-owned Grades shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Metric labels, target calculator copy, target pace copy, and what-if math localized in the native Release bundle.
- English course codes and letter grades remain fixture/imported planner data, not app-owned runtime UI.

The native Widgets screenshots show:

- `19-widgets-ocean.png` captured per smoked locale after explicit `simctl install`.
- App-owned More/Widget Studio shell strings localized for `ar`, `de`, `ja`, and `zh-Hans`.
- Step rail labels, status chips, size/palette labels, theme labels, tab labels, native widget headline/status/date labels, next-deadline callouts, week rails, metric labels, and open-deadline counts are localized in the native Release bundle.
- Assignment titles and `BIO 101` remain English because they are fixture/imported planner data, not app-owned runtime UI.

## GitNexus

- `npx gitnexus analyze` completed successfully before the Scan review patch: 3,143 nodes, 5,693 edges, 104 clusters, 264 flows.
- Before editing `TodayScreen`, GitNexus impact was run for `TodayScreen` and the edited helper/render symbols. `TodayScreen` was LOW risk; `buildLiveBrief`, `CatchUpSprintCard`, `formatDueUrgency`, `buildQuickDuePresets`, `imageActionLabel`, and `MetricPill` reported HIGH risk because they feed the default app flow through `TodayScreen` / `AppContent` / `App`.
- Before editing `PlanScreen`, GitNexus impact was run for `PlanScreen` and the edited helper symbols. `PlanScreen` was LOW risk; `buildPlanState`, `buildSimpleWeekGroups`, `formatSelectedDate`, `formatHoursValue`, `buildSurvivalBlocks`, and `buildWeekLoadSummary` reported HIGH risk because they feed `PlanScreen` / `AppContent` / `App`.
- Before editing `CoursesScreen`, GitNexus impact was run for `CoursesScreen` and the edited helper/shared symbols. `CoursesScreen` and `EmojiBadge` were LOW risk; `buildClassHealth`, `ClassStateTile`, and `ClassIdentityCard` reported HIGH risk, and `AppLogo` reported CRITICAL risk because they feed the app shell through `CoursesScreen` / `AppContent` / `App` or shared loading/onboarding/paywall paths. The shipped changes are text/date localization only.
- Before editing `FocusScreen`, GitNexus impact was run for `FocusScreen` and the edited helper/render symbols. `FocusScreen`, `CockpitStat`, `formatFocusDate`, `formatDueLabel`, and `labelizeStatus` were LOW risk, feeding `FocusScreen` / `AppContent` / `App`. The shipped changes are text/date localization only.
- Before editing `GradesScreen`, GitNexus impact was run for `GradesScreen` and `formatSignedPercent`. Both reported LOW risk, feeding `GradesScreen` / `AppContent` / `App`. The shipped changes are text localization and deterministic screenshot capture only.
- Before editing `MoreScreen`, GitNexus impact was run for `MoreScreen`, `labelForWidgetType`, `widgetItemMetaForStudio`, and `sizeMentalModel`. `MoreScreen` was LOW risk through `AppContent` / `App`; the helper symbols reported HIGH risk because they feed `MoreScreen` and then the app shell. The shipped changes localize call-site values without changing those HIGH-risk helper bodies.
- Before editing the native widget snapshot flow, GitNexus impact was run for `buildStudyPlannerWidgetSnapshots`, `syncStudyPlannerWidgets`, `buildSyncDisabledWidgetSnapshots`, `WidgetPreviewCard`, `widgetStatusText`, `widgetItemCourse`, `toWidgetItem`, `assignmentSignal`, `assignmentDisplayTitle`, `effortMetricLabel`, `getNativeWidgetStyle`, `formatDueLabel`, `formatWidgetValueLabel`, `weekdayName`, `shortDate`, `cleanTitle`, `AppContent`, `MoreScreen`, and `OnboardingScreen`. The snapshot builder/helpers and preview component reported HIGH or CRITICAL risk because they feed app startup widget sync, More/Widget Studio, onboarding, and widget QA scripts. The shipped changes are additive translation/locale parameters with English fallbacks.
- Before editing `ImportScreen`, GitNexus impact was run for `ImportScreen`, `reviewGateMessage`, `formatReviewDate`, `buildDraftFromRecentImport`, and `Function:src/screens/ImportScreen.tsx:labelize`. `ImportScreen` was LOW risk through `AppContent` / `App`; the helper symbols reported HIGH risk because they feed the Scan/import review flow. The shipped changes are text localization and source/status label localization only.
- `npx gitnexus detect-changes --repo studyplanner` reported 7 changed files, 41 symbols, 44 affected execution flows, aggregate risk `critical`. The affected flows are expected scanner/import paths including `PickPhoto`, `CapturePhoto`, `PickPdf`, and `TypeItIn` through `runParse`, `Base64ToBytes`, and image/text parsing helpers; the shipped code change is limited to localization of Scan review text, alerts, source/status labels, and review finding text.

## Release Decision

Do not upload a new build from this state.

Backend OCR, saved-photo import, and native Plus product loading are now proven in Release-style native builds. Release remains blocked because:

- Physical-device/TestFlight camera permission and live camera capture are still unproven.
- StoreKit product title/description/period metadata is still English in localized paywall screenshots; App Store Connect subscription localizations must be entered/verified.
- Runtime localization is still incomplete outside the smoked Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/Plus/native shell. Hard-coded app-owned English remains in onboarding preview mockups, detail screens, notes, premium gates, and alert/error paths.
- Arabic RTL risk remains until accepted or fixed.
