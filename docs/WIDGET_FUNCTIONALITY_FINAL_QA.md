# Widget Functionality Final QA

Date: 2026-05-12
Simulator: StudyPlanner-Codex-iPhone `6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`

## Verdict

Pass for release-candidate local QA. Remaining widget work is App Store/manual setup only: place the widgets on a Home Screen in a final signed build and verify them after App Store/TestFlight installation.

## Fixed In This Pass

| Issue | Severity | Fix |
| --- | --- | --- |
| Native WidgetKit placeholder shipped preview coursework that could appear before real data synced. | Critical | Replaced Swift placeholder with neutral empty state and no demo assignments. |
| Widget due labels could go stale after midnight because Swift trusted precomputed labels. | Critical | Swift now computes `Today`, `Tomorrow`, and overdue labels from `entry.date` at render time. |
| Medium widget said `Scan a syllabus to start` even when work existed outside the next seven days. | High | Empty medium state now distinguishes a clear week from a missing planner. |
| Widget Studio implied more native widgets than are implemented. | High | Copy now says iOS Home Screen widgets currently install as Small Next Due and Medium This Week. |
| Store-capture screenshots showed the dev warning pill. | High | Capture mode suppresses LogBox only when `EXPO_PUBLIC_STORE_CAPTURE=1`. |

## Acceptance Matrix

| Case | Result | Evidence |
| --- | --- | --- |
| Small widget shows next due item | Pass | `09-small-native-widget.png`; `verify-ios-widgetkit.sh` |
| Medium widget shows this week | Pass | `10-medium-native-widget.png`; `verify-ios-widgetkit.sh` |
| Widget labels refresh by date | Pass | `tests/widgetPlugin.test.ts` |
| Production placeholder has no demo leak | Pass | `tests/widgetPlugin.test.ts`; source grep check |
| App Group snapshot writes in capture mode | Pass | `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` |
| Widget Studio preferences persist | Pass | `tests/widgetPreferences.test.ts` |
| Widget Studio preview controls visibly change preview | Pass | Screenshots `07-widget-studio.png`, `08-widget-customization.png` |

## Deferred

- Native configurable widget intents for user-selected focus/style.
- Automated Xcode UI test that places widgets on the simulator Home Screen.
- Shared generated schema test between TypeScript snapshot and Swift decoder.
