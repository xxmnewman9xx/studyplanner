# Post-Goal QA Execution Log

| Command/test | Result | Evidence | Notes |
| --- | --- | --- | --- |
| git fetch origin | Passed | exit 0 | Remote fetched |
| git pull --ff-only origin v1-2-goal-9-2-root-concept-transformation | Failed | remote ref not found | Non-blocking; local v1-2 used |
| npx gitnexus analyze | Passed | 2,495 nodes, 4,690 edges, 72 clusters, 213 flows | Baseline architecture index |
| npx expo install --check | Passed | Dependencies up to date | Baseline |
| npm run typecheck | Passed | exit 0 | Re-run after fixes |
| npm run test | Passed | 32/32 | Added import trust, production config, DST, course-name, side-effect due-date tests |
| npm run check:iap | Passed | IAP and premium gate configuration passed | Static only |
| npm run verify:production | Passed | Production config verification passed | Normal mode |
| STUDYPLANNER_SUBMISSION_VERIFY=1 npm run verify:production | Failed as intended | Missing monthly product ID | Submission guard works; provide env/support URL before submit |
| xcrun simctl launch/openurl/screenshot | Partial | Captured `artifacts/post-goal-aso-submission/06-today-empty.png` | Installed app did not respond to capture deep link; screenshot is real production empty Today state |
| EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE | Passed | App installed and capture deep links responded | Capture-mode build only; not production proof |
| xcrun simctl openurl + xcrun simctl io screenshot | Passed after retry | 22 raw PNGs in `artifacts/post-goal-aso-submission` | First attempt used relative output paths and failed; rerun with absolute paths passed |
| Swift/AppKit contact sheet generation | Passed after retry | `artifacts/post-goal-aso-submission/45-final-contact-sheet.png` | First `mktemp` template failed; rerun with simpler temp filename passed |
| xcrun simctl ui content_size accessibility-extra-extra-large + screenshot | Passed | `artifacts/post-goal-aso-submission/44-accessibility-large-text.png` | Initial capture exposed catastrophic large-text layout; targeted shared component caps fixed the top Today hierarchy; simulator content size restored to `large` |
| npm run typecheck | Passed | exit 0 | Re-run after Dynamic Type component patch |
| npm run test | Passed | 32/32 | Re-run after Dynamic Type component patch |
| npm run typecheck | Passed | exit 0 | Re-run after locale/date patch |
| npm run test | Passed | 34/34 | Added Sunday/Monday/Saturday week-start helpers and Monday-start month grid coverage |
| npm run typecheck | Passed | exit 0 | Re-run after 24-hour locale formatting patch |
| npm run test | Passed | 35/35 | Added `fr-FR` and `en-GB` 24-hour due-date formatting coverage |
| npm run typecheck | Passed | exit 0 | Re-run after visual planner VoiceOver label patch |
| npm run test | Passed | 36/36 | Added `tests/accessibilitySource.test.ts` to guard labels on task rows, WeekStrip, workload bars, calendar mini-days, workload forecasts, class balance rows, and completion cards |
| EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE | Passed | Build succeeded and app wrote a current May 2026 WidgetKit payload | Used to refresh installed widgets after capture seed fix |
| xcrun simctl + Simulator accessibility tree | Passed | Installed native small and medium widgets via Home Screen Add Widget flow | `simctl` has no widget placement command in this Xcode install; Computer Use completed the UI-only step |
| xcrun simctl io screenshot | Passed | Captured `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png`, then refreshed date-sensitive app screenshots | First helper attempt failed because zsh `path` shadowed PATH; rerun used `out` and absolute `/usr/bin/xcrun` |
| npm run typecheck | Passed | exit 0 | Re-run after capture seed patch |
| npm run test | Passed | 37/37 | Added current-date capture seed regression and updated month/widget expectations |
| Swift/AppKit contact sheet generation | Passed | `45-final-contact-sheet.png` regenerated from 25 PNGs at 1090x4302 | Re-run after correcting onboarding widget screenshot and native widget captures |
| git diff --check | Passed | exit 0 | Final whitespace/conflict-marker check before commit |
| sips screenshot dimension check | Passed | Native widget screenshots are 1179x2556; contact sheet is 1090x4302 | Confirms expected raw simulator/contact-sheet dimensions |
| Simulator Complete + App Group payload check | Passed | `widget-refresh-after-completion-snapshot.json` | Completing Lab Report moved nextDue to Reading Reflection, reduced This Week to 4, monthly due to 7, and completed count to 4 |
| xcrun simctl io screenshot | Passed | `46-widget-refresh-after-completion.png` | Installed Home Screen widgets rendered the refreshed snapshot after completing Lab Report |
| Swift/AppKit contact sheet generation | Passed | `45-final-contact-sheet.png` regenerated from 26 PNGs at 1090x4302 | Re-run after widget refresh proof screenshot |

Unrun/blocked: StoreKit sandbox, widget add/edit/day-boundary refresh proof, products-loaded paywall proof, iPad screenshot strategy, localized UI screenshots/string extraction, full simulator VoiceOver/Dynamic Type screen sweep, restore purchases.
