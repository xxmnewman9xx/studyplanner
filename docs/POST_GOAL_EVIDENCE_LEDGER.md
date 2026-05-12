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

## Open Evidence Gaps

| Gap | Why it matters | Current blocker status | Needed proof |
| --- | --- | --- | --- |
| Native Home Screen widget screenshots | User requested raw small/medium widget PNGs; App Store claims need visual proof | Blocker for final screenshot inventory | Install widgets on simulator and capture Home Screen |
| StoreKit sandbox monthly/yearly/Lifetime/restore | Static checks do not prove App Store Connect products work | Blocker for submit recommendation | Sandbox or StoreKit Testing logs/screenshots |
| Support URL | Apple requires support URL and classroom apps need reachable contact info | Blocker for final handoff | Real support URL and in-app/App Store metadata entry |
| Localized UI proof | ASO packs can be drafted, but UI localization appears limited | Blocker for localized submission, non-blocker for English-only | Locale/date screenshots and hardcoded string audit |
| Accepted-size App Store screenshots | Raw simulator screenshots may not match required 6.9/6.5 sizes | Blocker for upload-ready assets | Export plan or final resized PNGs |
| App Store Connect product status | Code preserves product IDs, but ASC status is external | Blocker for submit recommendation | ASC checklist screenshots or manual confirmation |
| Full e2e matrix | Unit tests cover logic, not all user flows | Non-blocker if documented; blocker for 9.4 claim if untested flows remain high-risk | Simulator use-case log and screenshots |
| Capture build screenshots | Installed simulator app did not respond to capture deep link because it is not the capture build | Blocker for onboarding/populated screenshot set | Rebuild/install with `EXPO_PUBLIC_STORE_CAPTURE=1` and recapture |

## Evidence Rules For This Branch

- Do not count unreviewed parsed syllabus work as confirmed planner data.
- Do not count capture/demo state as production behavior.
- Do not claim IAP readiness from code alone.
- Do not claim screenshot readiness until real PNGs exist in `artifacts/post-goal-aso-submission`.
- Do not claim localized readiness without noting native-speaker review and UI string limitations.
- Do not claim unsupported widget families.
