# Feature Acceptance Matrix

Date: 2026-05-12
Branch: v1-1-widget-command-center
Pass: overnight steroids release pass

| Feature | Acceptance criteria | Result | Evidence |
| --- | --- | --- | --- |
| Onboarding | Appears on fresh install, explains the app plainly, previews real features, shows widget customization, persists theme, lands in Today | Pass | Capture screenshot `01-onboarding.png`; copy now states text-based syllabus support and photo OCR setup requirement |
| Import/scan | User can start syllabus import, failure state is clear, extracted/demo items land in Review Inbox, low-confidence items are marked, edit/remove supported | Pass | `ImportScreen`; copy no longer overpromises photo OCR when no parser endpoint is configured |
| Review Inbox | Accept changes status, ignore/delete removes from active plan, edit updates title/date/type/priority, filters work, counts update | Pass | `ImportScreen`; fake-feeling reminder chip removed before import |
| Today | Shows next due item, counts Today/Week/Overdue correctly, complete works, links to Inbox/Week/Calendar, labels are clear | Pass | `planner.test.ts`; capture screenshot `02-today.png` |
| Monthly Calendar | Month grid renders, course dots map to courses, selecting a day updates agenda, busy days are obvious, data matches Today/Week | Pass | `planner.test.ts`; capture screenshot `03-calendar.png` |
| This Week | Week strip is correct, workload chart reflects assignments, due list is grouped, exams visible, screen is reachable | Pass | `WeekPlannerScreen`; capture screenshot `05-this-week.png` |
| Class Hub | Course cards show useful info, progress/counts are correct, colors match calendar/widgets, grade forecast path is reachable | Fixed and pass | `CoursesScreen` now exposes a Grade Forecast action; capture screenshot `06-class-hub.png` |
| Widget Studio | Size/focus/style/color changes update preview and preferences persist safely; empty state exists; native support claims are honest | Fixed and pass | `WidgetShowcaseScreen`; `widgetPreferences.test.ts`; capture screenshots `07` and `08` |
| Native widgets | Small shows next due, medium shows this week, no clipping, labels update at render time, production placeholder has no demo coursework | Fixed and pass | `tests/widgetPlugin.test.ts`; `verify-ios-widgetkit.sh`; screenshots `09` and `10` |
| Paywall | Monthly/yearly visible when returned by store, lifetime visible only when configured/returned, no fake entitlement, restore truthful | Fixed and pass with App Store setup required | `npm run check:iap`; lifetime CTA says `Buy Lifetime`; active lifetime hides subscription management |

## Severity Results

| Severity | Found | Fixed | Remaining |
| --- | ---: | ---: | --- |
| Critical | 3 | 3 | None in local deterministic QA |
| High | 6 | 6 | Lifetime product creation and IAP sandbox purchase require App Store Connect setup |
| Medium | 7 | 4 | Architecture consolidation and native configurable widget intents are deferred |
| Low | 8 | 5 | Cosmetic copy/photo-capture refinements can wait |

## Commands

- `npm run typecheck`: pass
- `npm run test`: pass, 18/18
- `npm run check:iap`: pass
- `npx expo install --check`: pass
- `npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`: pass
- `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh`: pass

Simulator and WidgetKit evidence is summarized in `docs/RELEASE_READINESS_REPORT.md`.
