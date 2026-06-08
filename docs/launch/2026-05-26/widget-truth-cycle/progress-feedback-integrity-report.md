# Progress Feedback Integrity Report

Date: 2026-05-26

## Progress Sources

- Today progress: completed vs total reviewed assignments due today. Overdue catch-up rows can still lead the Today widget, but they no longer inflate the Today progress metric.
- Class progress: completed vs total saved assignments in the selected class.
- Week progress: completed vs total reviewed assignments in the visible week range.
- Focus progress: completed focus sessions from saved `FocusSession` records; active starts are persisted as transient running sessions and replaced by paused/completed/stopped records.

## Fixes

- Added shared assignment completion helpers in planner logic.
- `buildTodayPlan` now exposes `todayDoneCount`, `todayTotalCount`, and `todayProgress`.
- Today hero completion percent now uses due-today saved state, not all planner rows.
- `getWidgetData` now returns real progress/progress labels for Today, Upcoming, Week, Class Progress, Focus Next, and Progress widgets.
- Widget snapshots now use real Today/week ratios instead of inverse open-item counts.
- Completed due-today work leaves widget rows and updates progress; completing all due-today work moves Today to `no_due_today` with `2 of 2 complete`.
- Advanced widget previews no longer hard-code `25`, `7`, or fake bar heights.

## Demo/Invalid Data

- Native widgets still filter demo leftovers when `demoMode` is false.
- Unreviewed, duplicate, invalid, archived, and completed rows stay out of active Today/Upcoming widget rows.
- Widget payload tests assert no private fields or stale demo rows enter native snapshots.

## Validation

Passed:

- `npm run typecheck`
- `npm run test:planner`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `npm run test:quick-homework`
- `npm run check:scenarios`
- `npm run check:iap`

Native:

- Release simulator build succeeded.
- Release app installed and launched on `StudyPlanner-QA-iPhone`.
- App Group widget layout/timeline writes observed for both Today and Upcoming.
