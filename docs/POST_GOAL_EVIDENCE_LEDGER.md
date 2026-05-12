# Post-Goal Evidence Ledger

Date started: 2026-05-12  
Branch: `v1-3-post-goal-aso-submission-master`  
Starting commit: `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e`

## Validated Evidence So Far

| ID | Evidence type | Source | Result | Used for | Status |
| --- | --- | --- | --- | --- | --- |
| EV-001 | Git | `git status --short --branch` | Branch created; tracked tree clean; unrelated untracked folders/docs present | Branch safety | Verified |
| EV-002 | Git | `git pull --ff-only origin v1-2-goal-9-2-root-concept-transformation` | Failed because remote ref does not exist | Remote/base status | Verified, non-blocking |
| EV-003 | Git | `git rev-parse HEAD` | `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e` | Starting commit | Verified |
| EV-004 | GitNexus | `npx gitnexus analyze` | 2,495 nodes, 4,690 edges, 72 clusters, 213 flows | Architecture map baseline | Verified |
| EV-005 | Dependency check | `npx expo install --check` | Dependencies up to date | Build health | Passed |
| EV-006 | Typecheck | `npm run typecheck` | `tsc --noEmit` exit 0 | Code health | Passed |
| EV-007 | Tests | `npm run test` | 26 tests passed | Functionality baseline | Passed |
| EV-008 | IAP static check | `npm run check:iap` | IAP and premium gate configuration passed | Monetization safety baseline | Passed with sandbox gap |
| EV-009 | Production check | `npm run verify:production` | Production config verification passed | No capture/demo guard | Passed |
| EV-010 | Previous audit | `docs/COMPLETION_AUDIT_9_2.md` | v1-2 scored 8.76/10 and did not meet 9.2 | Starting assumption | Verified |
| EV-011 | App config | `app.json` | Bundle ID `com.mattnewman.studyplanner`; version `1.0.0`; build `10`; supported iOS widget plugin configured | Submission handoff | Verified |
| EV-012 | IAP IDs | `src/services/purchaseConfig.ts` | Expected monthly/yearly/lifetime IDs are documented; env IDs drive actual products | IAP handoff | Verified with App Store Connect gap |
| EV-013 | Capture mode | `src/config/storeCapture.ts`, `scripts/check-iap-config.mjs` | Capture mode requires exact `EXPO_PUBLIC_STORE_CAPTURE=1`; production check rejects it | Demo leakage risk | Verified |
| EV-014 | Official Apple policy | `docs/APPLE_ASO_AND_SUBMISSION_RESEARCH.md` | App Review, screenshots, localization, PPO, custom pages, IAP, subscriptions, sandbox, privacy/support researched | ASO/submission constraints | Verified |
| EV-015 | Widget scope | `src/services/widgetPreferences.ts`, `WidgetShowcaseScreen.tsx`, `ios/StudyPlannerWidgetExtension/StudyPlannerWidget.swift` | Supported user-facing native scope is small and medium Home Screen widgets | Widget claims | Verified |
| EV-016 | Required optional scripts | `package.json` scripts | Only `android`, `ios`, `start`, `web`, `export:web`, `typecheck`, `test`, `check:iap`, `verify:production` exist | QA plan | Verified |
| EV-017 | Code fix | `src/logic/importTrust.ts`, `App.tsx`, `tests/importTrust.test.ts` | Parser semester name/start/end dates no longer apply to planner state after accepting assignments | Data trust boundary | Fixed and tested |
| EV-018 | Code fix | `src/logic/dateUtils.ts`, `tests/dateUtils.test.ts` | Date-key day counts are stable across daylight saving boundaries | Calendar/widget due labels | Fixed and tested |
| EV-019 | Code fix | `src/logic/assignmentModel.ts`, `tests/assignmentModel.test.ts` | Assignment course names refresh from selected class when course changes | Widget/class label freshness | Fixed and tested |
| EV-020 | QA guard | `scripts/verify-production-config.mjs`, `tests/productionConfig.test.ts` | `STUDYPLANNER_SUBMISSION_VERIFY=1` requires explicit monthly/yearly/lifetime product IDs and HTTPS support URL | Submission no-submit guard | Fixed and tested |
| EV-021 | Tests | `npm run test` | 32/32 tests passing after fixes | Regression | Passed |
| EV-022 | Screenshot | `artifacts/post-goal-aso-submission/06-today-empty.png` | Real simulator production empty Today screenshot, 1179x2556 PNG | Screenshot inventory | Captured; not App Store-size exported |
| EV-023 | Code fix | `src/logic/importTrust.ts`, `tests/importTrust.test.ts` | Parser grade items no longer enter planner without a review surface | Data trust boundary | Fixed and tested |
| EV-024 | Code fix | `src/logic/assignmentSideEffects.ts`, `src/services/reminders.ts`, `src/services/calendarSync.ts`, `tests/assignmentSideEffects.test.ts` | Reminder/calendar side effects skip invalid legacy due dates | Side-effect safety | Fixed and tested |
| EV-025 | Capture build | `EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE` | Capture-mode iOS build installed and responded to `studyplanner://capture` deep links | Screenshot proof | Passed |
| EV-026 | Screenshots | `xcrun simctl openurl` + `xcrun simctl io screenshot` | 22 raw simulator PNGs captured in `artifacts/post-goal-aso-submission` | Screenshot inventory and visual proof | Partial; not App Store-size exported |
| EV-027 | Screenshot | `artifacts/post-goal-aso-submission/38-paywall-product-load-failure.png` | Paywall showed "Purchases are unavailable"; product-loaded paywall proof remains missing | StoreKit/App Review risk | Captured failure state honestly |
| EV-028 | Contact sheet | `artifacts/post-goal-aso-submission/45-final-contact-sheet.png` | Contact sheet generated from current 35 raw PNGs, 1248x5994 | Screenshot proof | Captured |
| EV-029 | Screenshot gap | `docs/SCREENSHOT_ASSET_INVENTORY.md` | Superseded by EV-034 through EV-039: native small/medium Home Screen widget screenshots are captured, and completion/edit/add refresh are proven; remaining widget gap is day-boundary proof | Widget claims and App Store screenshots | Superseded |
| EV-030 | Accessibility fix | `src/components/PremiumUI.tsx`, `artifacts/post-goal-aso-submission/44-accessibility-large-text.png` | Premium header, command hero, metrics, warnings, progress ring, and dock labels remain readable at `accessibility-extra-extra-large` after targeted font-scale caps | Dynamic Type proof | Partial accessibility improvement |
| EV-031 | Localization/date fix | `src/logic/dateUtils.ts`, `src/logic/semesterInsights.ts`, `tests/dateUtils.test.ts`, `tests/planner.test.ts` | Month calendar grids use locale week starts and local-day increments; tests cover Sunday, Monday, and Saturday-start locales | Localization/date proof | Partial implementation improvement |
| EV-032 | Localization/date fix | `src/logic/dateUtils.ts`, `src/logic/planner.ts`, `src/logic/semesterInsights.ts`, `src/screens/WeekPlannerScreen.tsx`, `tests/dateUtils.test.ts` | Due-date labels, month labels, compact ranges, and Week Plan ranges use preferred locale; tests cover 24-hour `fr-FR` and `en-GB` due-date labels | Localization/date proof | Partial implementation improvement |
| EV-033 | Accessibility fix | `src/components/PremiumUI.tsx`, `src/components/InsightCards.tsx`, `tests/accessibilitySource.test.ts` | Task rows, completion buttons, WeekStrip days, workload bars, calendar mini-days, workload forecasts, class balance rows, and completion cards expose VoiceOver labels; source-regression remains in the current test suite | Visual planner accessibility | Partial accessibility improvement |
| EV-034 | Widget proof | `artifacts/post-goal-aso-submission/30-small-widget-home-screen.png`, `artifacts/post-goal-aso-submission/31-medium-widget-home-screen.png` | Installed WidgetKit small and medium Home Screen widgets captured on the simulator with current May 2026 due labels | Widget claims and screenshot inventory | Fixed screenshot blocker; refresh proof still partial |
| EV-035 | Capture data fix | `src/data/demoSemester.ts`, `tests/demoSemester.test.ts`, `tests/widgetSnapshot.test.ts`, `artifacts/post-goal-aso-submission/45-final-contact-sheet.png` | Capture/demo assignments now roll relative to the capture day; test suite passed 37/37; contact sheet regenerated from 25 PNGs | Screenshot truth and widget due-label trust | Fixed stale demo-date bug |
| EV-036 | Widget refresh proof | Simulator Today Complete button, App Group plist extraction, `artifacts/post-goal-aso-submission/widget-refresh-after-completion-snapshot.json`, `artifacts/post-goal-aso-submission/46-widget-refresh-after-completion.png` | Completing Lab Report updated the native App Group snapshot: nextDue changed to Reading Reflection, This Week dropped from 5 to 4, monthly due dropped from 8 to 7, completed rose to 4, and the installed Home Screen widgets rendered the refreshed state | Widget refresh after planner changes | Completion refresh proven |
| EV-037 | App icon proof | `artifacts/post-goal-aso-submission/40-app-icon-home-screen.png` | Real simulator Home Screen screenshot includes installed StudyPlanner app icons alongside supported widgets | App icon / screenshot inventory | Captured; not App Store-size exported |
| EV-038 | Widget edit refresh proof | Assignment Detail title edit, App Group plist extraction, `artifacts/post-goal-aso-submission/widget-refresh-after-edit-snapshot.json`, `artifacts/post-goal-aso-submission/47-widget-refresh-after-edit.png` | Editing Reading Reflection to Reflection Draft updated native nextDue and medium widget rows, and the installed Home Screen widgets rendered the edited title | Widget refresh after planner edits | Edit refresh proven |
| EV-039 | Widget add refresh proof | Normal-mode manual class/work add, App Group plist extraction, `artifacts/post-goal-aso-submission/widget-refresh-after-add-snapshot.json`, `artifacts/post-goal-aso-submission/48-widget-refresh-after-add.png` | Adding Field Notes to Science Lab updated native nextDue, This Week, and monthly due counts, and the installed Home Screen widgets rendered the added assignment | Widget refresh after planner adds | Add refresh proven |
| EV-040 | Widget day-boundary code/build proof | `plugins/withStudyPlannerWidget.js`, `tests/widgetPlugin.test.ts`, `npm run test`, `EXPO_PUBLIC_STORE_CAPTURE=0 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE --no-bundler` | WidgetKit now recomputes due labels and urgency color from `dueAt` at render time and schedules timeline refresh for the earlier of 30 minutes or 00:01 local time; tests passed 38/38 and the extension built/installed cleanly | Widget freshness across day boundary | Code/build proven; overnight screenshot not captured |
| EV-041 | Accessibility fix/proof | `src/components/AppButton.tsx`, `src/screens/ImportScreen.tsx`, `src/screens/AssignmentDetailScreen.tsx`, `src/screens/WidgetShowcaseScreen.tsx`, `src/screens/UpgradeScreen.tsx`, `tests/accessibilitySource.test.ts`, `artifacts/post-goal-aso-submission/49-accessibility-check-work-large-text.png` through `52-accessibility-paywall-large-text.png` | Core action screens now expose stronger labels/hints and bounded text scaling; real simulator large-text screenshots cover Check Work, Assignment Detail, Widget Setup, and Paywall; tests passed 39/39 | Core accessibility proof | Partial accessibility improvement |
| EV-042 | Screenshot state proof | `App.tsx`, `src/screens/ImportScreen.tsx`, `src/screens/CoursesScreen.tsx`, `tests/accessibilitySource.test.ts`, `artifacts/post-goal-aso-submission/13-manual-add.png`, `artifacts/post-goal-aso-submission/17-check-new-work-edit-item.png` | Capture-only states now expose a real Manual Add form and expanded Check Work edit panel; screenshots are real simulator UI; tests passed 40/40 | Screenshot inventory and workflow proof | Captured |

## Open Evidence Gaps

| Gap | Why it matters | Current blocker status | Needed proof |
| --- | --- | --- | --- |
| Widget overnight visual rollover | Day-boundary behavior is code/build proven, but no overnight Home Screen screenshot captures the 00:01 visual rollover | Optional final validation; non-submit only if marketing claims depend on overnight screenshot proof | Leave simulator overnight with a due-tomorrow item, then capture widgets after 00:01 local time |
| StoreKit sandbox monthly/yearly/Lifetime/restore | Static checks do not prove App Store Connect products work | Blocker for submit recommendation | Sandbox or StoreKit Testing logs/screenshots |
| Support URL | Apple requires support URL and classroom apps need reachable contact info | Blocker for final handoff | Real support URL and in-app/App Store metadata entry |
| VoiceOver/full accessibility proof | Today, Check Work, Assignment Detail, Widget Setup, and Paywall large-text screenshots are captured and visual planner labels are source-tested, but full simulator VoiceOver traversal and contrast proof are still incomplete | Non-blocker for English submit if documented; blocker for 9.4 claim | VoiceOver traversal, contrast pass, and any remaining localized/accessibility screenshots |
| Localized UI proof | ASO packs can be drafted and month grid week-start logic is tested, but UI localization appears limited | Blocker for localized submission, non-blocker for English-only | Locale/date screenshots and hardcoded string audit |
| Accepted-size App Store screenshots | Raw simulator screenshots may not match required 6.9/6.5 sizes | Blocker for upload-ready assets | Export plan or final resized PNGs |
| App Store Connect product status | Code preserves product IDs, but ASC status is external | Blocker for submit recommendation | ASC checklist screenshots or manual confirmation |
| Full e2e matrix | Unit tests cover logic, not all user flows | Non-blocker if documented; blocker for 9.4 claim if untested flows remain high-risk | Simulator use-case log and screenshots |
| Remaining raw screenshots | 35 PNGs are captured, but upload/file/photo/parser/success/restore/localized states are still missing | Partial blocker for final asset package | Capture remaining supported states or document exclusions |

## Evidence Rules For This Branch

- Do not count unreviewed parsed syllabus work as confirmed planner data.
- Do not count capture/demo state as production behavior.
- Do not claim IAP readiness from code alone.
- Do not claim screenshot readiness until real PNGs exist in `artifacts/post-goal-aso-submission`.
- Do not claim localized readiness without noting native-speaker review and UI string limitations.
- Do not claim unsupported widget families.
