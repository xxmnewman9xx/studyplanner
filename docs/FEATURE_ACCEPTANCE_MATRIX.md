# Feature Acceptance Matrix

Date: 2026-05-12
Branch: v1-1-widget-command-center

| Feature | Acceptance criteria | Result | Evidence |
| --- | --- | --- | --- |
| Onboarding | Appears on fresh install, explains the app plainly, previews real features, shows widget customization, persists theme, lands in Today | Pass | `OnboardingScreen`, `themeContext`, typecheck |
| Import/scan | User can start syllabus import, failure state is clear, extracted/demo items land in Review Inbox, low-confidence items are marked, edit/remove supported | Fixed and pass | Added Remove action and clearer confidence labels in `ImportScreen` |
| Review Inbox | Accept changes status, remove excludes from plan, edit updates title/date/type/priority, filters work, counts update | Fixed and pass | `ImportScreen` draft state filters ignored items and applies accepted only |
| Today | Shows next due item, counts Today/Week/Overdue correctly, complete works, links to Inbox/Week/Calendar, labels are clear | Fixed and pass | `planner.test.ts`; visible Scan/Remind/Sync labels |
| Monthly Calendar | Month grid renders, course dots map to courses, selecting a day updates agenda, busy days are obvious, data matches Today/Week | Pass | `planner.test.ts`; `MonthlyCalendarScreen` |
| This Week | Week strip is correct, workload chart reflects assignments, due list is grouped, exams visible, screen is reachable | Fixed and pass | Added `week` nav tab and `WeekPlannerScreen` route |
| Class Hub | Course cards show useful info, progress/counts are correct, cards open detail, colors match, add-class path works | Fixed and pass | Wired header `+` to top add-class form in `CoursesScreen` |
| Widget Studio | Size/focus/style/color changes update preview and preferences persist safely; empty state exists | Pass | `widgetPreferences.test.ts`; `WidgetShowcaseScreen` |
| Native widgets | Small shows next due, medium shows this week, no demo data outside capture, snapshot updates after planner changes | Pass for snapshot/App Group; manual Home Screen placement remains | `widgetSnapshot.test.ts`; `WidgetSnapshotService`; `verify-ios-widgetkit.sh` |
| Paywall | Monthly/yearly visible when returned by store, lifetime visible only when configured/returned, no fake entitlement, restore truthful | Pass with App Store setup required | `npm run check:iap`; `subscriptions.tsx`; `UpgradeScreen` |

## Severity Results

| Severity | Found | Fixed | Remaining |
| --- | ---: | ---: | --- |
| Critical | 0 | 0 | None found in local deterministic QA |
| High | 5 | 5 | Native widget placement and IAP sandbox need simulator/App Store setup |
| Medium | 6 | 4 | Final screenshot polish and 30-item manual stress pass remain |
| Low | 8 | 5 | Cosmetic copy/photo-capture refinements can wait |

## Commands

- `npm run typecheck`: pass
- `npm run test`: pass, 15/15
- `npm run check:iap`: pass
- `npx expo install --check`: pass

Simulator and WidgetKit commands passed and are tracked in `docs/OVERNIGHT_SELF_IMPROVEMENT_REPORT.md`.
