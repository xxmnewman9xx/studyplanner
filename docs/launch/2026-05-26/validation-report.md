# Validation Report

Date: 2026-05-26 10:46 EDT / 2026-05-26 14:46 UTC

## Final Blocker Closure Pass

This pass made no runtime code changes and no TestFlight upload. It added final release-blocking proof documents for the three remaining blockers:

- `docs/launch/2026-05-26/physical-camera-proof.md`
- `docs/launch/2026-05-26/storekit-localization-proof.md`
- `docs/launch/2026-05-26/rtl-release-decision.md`
- `docs/launch/2026-05-26/final-release-blocker-scorecard.md`

Scoped validation after those docs:

- `npm run check:release-docs` passed.
- `npm run check:localization` passed.
- `npm run check:iap` passed.

Final release recommendation remains no release. Build `28` was later built locally and uploaded to EAS Submit after explicit owner direction, but the latest observed EAS submission state is `IN_QUEUE`. Physical TestFlight camera proof is still unavailable from the current machine, App Store Connect subscription metadata localization was not configured/proven, and Arabic RTL requires either a dedicated hardening recapture or explicit owner acceptance.

Additional upload validation:

- `npm run qa:release` passed before building build `28`.
- Local production IPA `builds/StudyPlanner-1.0.2-b28.ipa` was created successfully after clearing generated build/cache artifacts.
- IPA SHA-256: `b1756fbdc6b8e947e0149502570e9611c309f143b9b6a6f2628a628743295a0a`.
- EAS submission `86285642-118c-49cb-957d-3ff727e19095` was scheduled and last observed as `IN_QUEUE`.

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
- Fresh native paywall product screenshot captured at `docs/launch/2026-05-26/fresh-native-screenshots/release-rescue/02-release-paywall-deeplink.png`
- Fresh native saved-photo-to-review proof captured at `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/`
- Current native Release localized Today/Calendar/Classes/Focus/Grades/Widgets/Scan/Review/subscription screenshots captured for `ar`, `de`, `ja`, and `zh-Hans` under `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/`
- Fresh native Release Arabic onboarding screenshots captured after the final onboarding localization patch at `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/00-onboarding-scan.png` through `06-onboarding-widgets.png`

## Latest Patch Validation

After localizing the app-owned onboarding preview mockups and theme choices:

- `npm run check:localization` passed.
- `npm run typecheck` passed.
- `npm run qa:release` passed.
- Fresh Arabic native `Release` iphonesimulator build succeeded with image parsing enabled, Railway parser endpoint configured, IAP product IDs configured, and `EXPO_PUBLIC_STUDYPLANNER_LOCALE=ar`.
- Fresh Arabic onboarding screenshots `00-onboarding-scan.png` through `06-onboarding-widgets.png` were captured from the rebuilt native bundle.
- Onboarding preview mockups now route method chips, review labels, weekday labels, due-date fallback, duration labels, focus/widget labels, and theme choices through runtime keys.
- The localization gate now rejects the old hard-coded onboarding preview strings.

## Native Release Proof

Release builds were compiled with:

- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`

The native paywall screenshots show:

- `2 plans available` or localized equivalent
- Yearly subscription `$24.99`
- Monthly subscription `$3.99`
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
- Date formatting and class count/open/completed labels localized in the native Release bundle.
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

The native Onboarding screenshots show:

- `00-onboarding-scan.png` through `06-onboarding-widgets.png` captured for `ar` after the final onboarding localization patch and a fresh native Release simulator rebuild.
- App-owned onboarding preview titles, method chips, sample labels, review labels, weekday labels, stats, focus labels, widget labels, and theme choice copy are localized in the native Release bundle.
- Assignment titles, course codes, and file names remain English because they are fixture/imported planner data, not app-owned runtime UI.

## GitNexus

- `npx gitnexus analyze` completed successfully before the App system-preview patch: 3,161 nodes, 5,760 edges, 102 clusters, 265 flows.
- Before editing `TodayScreen`, GitNexus impact was run for `TodayScreen` and the edited helper/render symbols. `TodayScreen` was LOW risk; `buildLiveBrief`, `CatchUpSprintCard`, `formatDueUrgency`, `buildQuickDuePresets`, `imageActionLabel`, and `MetricPill` reported HIGH risk because they feed the default app flow through `TodayScreen` / `AppContent` / `App`.
- Before editing `PlanScreen`, GitNexus impact was run for `PlanScreen` and the edited helper symbols. `PlanScreen` was LOW risk; `buildPlanState`, `buildSimpleWeekGroups`, `formatSelectedDate`, `formatHoursValue`, `buildSurvivalBlocks`, and `buildWeekLoadSummary` reported HIGH risk because they feed `PlanScreen` / `AppContent` / `App`.
- Before editing `CoursesScreen`, GitNexus impact was run for `CoursesScreen` and the edited helper/shared symbols. `CoursesScreen` and `EmojiBadge` were LOW risk; `buildClassHealth`, `ClassStateTile`, and `ClassIdentityCard` reported HIGH risk, and `AppLogo` reported CRITICAL risk because they feed the app shell through `CoursesScreen` / `AppContent` / `App` or shared loading/onboarding/paywall paths. The shipped changes are text/date localization only.
- Before editing `FocusScreen`, GitNexus impact was run for `FocusScreen` and the edited helper/render symbols. `FocusScreen`, `CockpitStat`, `formatFocusDate`, `formatDueLabel`, and `labelizeStatus` were LOW risk, feeding `FocusScreen` / `AppContent` / `App`. The shipped changes are text/date localization only.
- Before editing `GradesScreen`, GitNexus impact was run for `GradesScreen` and `formatSignedPercent`. Both reported LOW risk, feeding `GradesScreen` / `AppContent` / `App`. The shipped changes are text localization and deterministic screenshot capture only.
- Before editing `MoreScreen`, GitNexus impact was run for `MoreScreen`, `labelForWidgetType`, `widgetItemMetaForStudio`, and `sizeMentalModel`. `MoreScreen` was LOW risk through `AppContent` / `App`; the helper symbols reported HIGH risk because they feed `MoreScreen` and then the app shell. The shipped changes localize call-site values without changing those HIGH-risk helper bodies.
- Before editing the native widget snapshot flow, GitNexus impact was run for `buildStudyPlannerWidgetSnapshots`, `syncStudyPlannerWidgets`, `buildSyncDisabledWidgetSnapshots`, `WidgetPreviewCard`, `widgetStatusText`, `widgetItemCourse`, `toWidgetItem`, `assignmentSignal`, `assignmentDisplayTitle`, `effortMetricLabel`, `getNativeWidgetStyle`, `formatDueLabel`, `formatWidgetValueLabel`, `weekdayName`, `shortDate`, `cleanTitle`, `AppContent`, `MoreScreen`, and `OnboardingScreen`. The snapshot builder/helpers and preview component reported HIGH or CRITICAL risk because they feed app startup widget sync, More/Widget Studio, onboarding, and widget QA scripts. The shipped changes are additive translation/locale parameters with English fallbacks.
- Before editing `ImportScreen`, GitNexus impact was run for `ImportScreen`, `reviewGateMessage`, `formatReviewDate`, `buildDraftFromRecentImport`, and `Function:src/screens/ImportScreen.tsx:labelize`. `ImportScreen` was LOW risk through `AppContent` / `App`; the helper symbols reported HIGH risk because they feed the Scan/import review flow. The shipped changes are text localization and source/status label localization only.
- Before editing `AssignmentDetailScreen`, GitNexus impact was run for `AssignmentDetailScreen`, `buildAssignmentTrustState`, and `Function:src/screens/AssignmentDetailScreen.tsx:labelize`. All reported LOW risk, flowing through `AppContent` / `App`. The shipped change is text/date/source-label localization only.
- Before editing `NotesScreen`, GitNexus impact was run for `NotesScreen`, `NoteRow`, and `Function:src/screens/NotesScreen.tsx:formatShortDate`. `NotesScreen` was LOW risk; `NoteRow` and `formatShortDate` reported HIGH risk because they feed `NotesScreen` / `AppContent` / `App`. The shipped change is text/date/template localization only.
- Before editing `PremiumGate` and the App alert handlers, GitNexus impact was run for `PremiumGate`, `AppContent`, `applyParsedPlan`, `addQuickAssignment`, `addCourse`, `handleScheduleReminders`, `handleCalendarSync`, and `messageFromError`. All reported LOW risk. The shipped change is alert/gate text localization only.
- Before editing App system-preview copy, GitNexus impact was run for `buildAppSystemState` and `StudySystemHeader`. Both reported LOW risk. The shipped change is system-preview text localization only.
- Before editing onboarding preview copy, GitNexus impact was run for `OnboardingScreen`, `ScanPreview`, `ReviewPreview`, `TodayPreview`, `CalendarPreview`, `ClassesPreview`, `FocusPreview`, `WidgetsPreview`, `PreviewStat`, `ReviewRow`, `dueShort`, `formatHours`, and `themeChoices`. `OnboardingScreen` and `themeChoices` were LOW risk; the preview helpers reported HIGH risk because they feed the first-run app flow through `OnboardingScreen` / `AppContent` / `App`. The shipped change is text/date localization only.
- `npx gitnexus detect-changes --repo studyplanner` reported 7 indexed text files, 39 symbols, 6 affected execution flows, aggregate risk `high`. The high aggregate is expected because the onboarding preview helpers feed first-run flows into locale resolution. No scanner, parser, OCR, IAP product-loading, planner, or widget behavior was intentionally changed.

## Release Decision

Do not upload a new build from this state.

Backend OCR, saved-photo import, and native subscription product loading are now proven in Release-style native builds. Release remains blocked because:

- Physical-device/TestFlight camera permission and live camera capture are still unproven.
- StoreKit product title/description/period metadata is still English in localized paywall screenshots; App Store Connect subscription localizations must be entered/verified.
- App-owned launch-critical runtime localization is wired and gated, but StoreKit product metadata localization still requires App Store Connect/TestFlight verification.
- Arabic RTL risk remains until accepted or fixed.
