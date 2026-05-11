# Mac WidgetKit Handoff

## Important Boundary

Windows work completed the app-side widget data contract, snapshot generator, snapshot write trigger, deterministic demo data, and tests.

Windows did not verify native iOS WidgetKit behavior. Do not describe WidgetKit build, simulator rendering, Home Screen behavior, Lock Screen behavior, App Group sharing, or timeline reload behavior as verified until the Mac phase completes them.

## Start Here On Mac

Read these files first:

- `docs/STUDYPLANNER_WIDGET_CORE_REPO_MAP.md`
- `docs/WIDGET_CORE_ARCHITECTURE.md`
- `docs/MAC_WIDGETKIT_HANDOFF.md`
- `src/models.ts`
- `src/logic/widgetSnapshot.ts`
- `src/services/widgetSnapshotService.ts`
- `tests/widgetSnapshot.test.ts`

Run:

```bash
npm ci
npm run typecheck
npm run test
npm run check:iap
```

Then run the iOS project generation/build flow appropriate for this Expo app.

## Native Implementation Tasks

1. Pull branch `v1-1-widget-command-center`.
2. Add or generate the iOS native project on Mac.
3. Add an iOS WidgetKit extension target.
4. Add App Group entitlement to the app target and widget target.
5. Mirror `study-planner-widget-snapshot-v1` JSON into App Group shared storage.
6. Decode the JSON in the widget timeline provider.
7. Render:
   - Small: Next Due
   - Medium: This Week
8. Add reload behavior after app-side snapshot writes:

   ```swift
   WidgetCenter.shared.reloadAllTimelines()
   ```

9. Verify updates after:
   - accepting parsed assignments
   - editing due dates
   - completing assignments
   - ignoring/deleting assignments
   - scheduling reminders
   - loading `EXPO_PUBLIC_STORE_CAPTURE=1`

## App Group Plan

Recommended group identifier:

```text
group.com.mattnewman.studyplanner
```

Recommended shared key:

```text
study-planner-widget-snapshot-v1
```

The native bridge can use either:

- `UserDefaults(suiteName:)` with the snapshot JSON string
- an App Group file containing the snapshot JSON

Keep the JSON contract stable. If native code needs a smaller view model, derive it inside the widget extension after decoding.

## Small Widget Layout

Purpose: Next Due.

Use:

- `semesterName`
- `nextDue.title`
- `nextDue.courseName`
- `nextDue.dueLabel`
- `nextDue.urgencyLabel`
- `overdueCount`
- `emptyState`

States:

- Normal next due
- Overdue next due
- Empty plan
- Demo state badge when `demoState.enabled` is true

## Medium Widget Layout

Purpose: This Week.

Use:

- `surfaces.medium.items`
- `surfaces.medium.overflowCount`
- `heavyWeekWarning`
- `reviewQueueCount`
- `emptyState`

States:

- 1 to 4 this-week items
- overflow count
- heavy week warning
- no upcoming work
- demo state badge when `demoState.enabled` is true

## Future Large Widget

Purpose: Weekly workload.

Use:

- `surfaces.large.items`
- `surfaces.large.heavyWeekWarning`
- item urgency labels
- exam markers

Do not block v1.1 on the large widget unless schedule allows.

## Future Lock Screen Widget

Purpose: Countdown / due soon.

Use:

- `surfaces.lockScreen.item`
- `surfaces.lockScreen.countdownLabel`
- urgency labels

Keep text compact and avoid relying on color alone.

## Simulator QA Checklist

Verify on at least one current iPhone simulator:

- App launches without capture mode and no demo data appears.
- App launches with `EXPO_PUBLIC_STORE_CAPTURE=1` and deterministic demo data appears.
- Small widget shows next due.
- Medium widget shows this week.
- Empty widget state renders after clearing planner data.
- Completing an assignment updates the widget after timeline reload.
- Accepting parsed assignments updates the widget after timeline reload.
- Ignored/deleted assignments disappear from widget data.
- Overdue labels render correctly.
- Heavy week warning renders correctly.
- Paywall product IDs remain environment-driven.
- No fake purchase execution is introduced.

## Exact Mac Continuation Prompt

```text
You are now on Mac. Pull branch v1-1-widget-command-center for StudyPlanner. Read docs/STUDYPLANNER_WIDGET_CORE_REPO_MAP.md, docs/WIDGET_CORE_ARCHITECTURE.md, docs/MAC_WIDGETKIT_HANDOFF.md, and docs/APP_STORE_PREVIEW_STORYBOARD.md first. Implement native iOS WidgetKit support using the app-side WidgetSnapshotService contract. Add App Group/shared storage safely. Build small Next Due and medium This Week widgets. Verify in iPhone Simulator that widget data updates after accepting/completing assignments and in EXPO_PUBLIC_STORE_CAPTURE=1 mode. Do not alter IAP product IDs or fake purchase flows. Run iOS build/simulator checks. Commit if clean. Final response: changed files, commit hash, simulator used, build results, widget verification results, and remaining risks.
```
