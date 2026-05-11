# Widget Core Architecture

## Windows Completed

StudyPlanner now has an app-side widget core that treats the widget as a first-class product surface.

Implemented files:

- `src/models.ts`
- `src/logic/widgetSnapshot.ts`
- `src/services/widgetSnapshotService.ts`
- `tests/widgetSnapshot.test.ts`

The app generates a stable JSON snapshot whenever planner state changes. On Windows this is written through the existing app storage abstraction under:

```text
study-planner-widget-snapshot-v1
```

This is the shared contract for native widgets. It is not a verified iOS WidgetKit storage bridge yet.

## Snapshot Schema

The snapshot type is `WidgetSnapshot`.

Core fields:

- `version`
- `generatedAt`
- `lastUpdated`
- `semesterId`
- `semesterName`
- `nextDue`
- `thisWeek`
- `overdueCount`
- `reviewQueueCount`
- `heavyWeekWarning`
- `emptyState`
- `demoState`
- `surfaces`

Item fields:

- `assignmentId`
- `title`
- `courseId`
- `courseName`
- `dueAt`
- `type`
- `dueLabel`
- `urgency`
- `urgencyLabel`
- `reviewStatus`
- `completionStatus`

Supported surfaces:

- Small: `surfaces.small.kind = "nextDue"`
- Medium: `surfaces.medium.kind = "thisWeek"`
- Large/future: `surfaces.large.kind = "weeklyWorkload"`
- Lock Screen/future: `surfaces.lockScreen.kind = "countdown"`

## Generation Rules

`buildWidgetSnapshot` receives:

- `semester`
- `courses`
- `assignments`
- optional `demoState`

It calculates:

- next due open item, including overdue items
- this-week open items for the next seven days
- overdue count
- review queue count
- heavy-week warning when the next seven days contain five or more deadlines or two or more exams
- empty widget state when there are no open deadlines
- deterministic demo snapshot when called with deterministic demo seed and time

## Write Triggers

`App.tsx` writes snapshots from a dedicated effect after hydration whenever these change:

- assignments
- courses
- semester
- store capture flag

That covers:

- accepted parsed assignments
- edited assignments
- completed assignments
- ignored/archived assignments
- manual assignment adds
- reminder ID changes after reminder scheduling
- calendar event ID changes after sync
- demo seed load in `EXPO_PUBLIC_STORE_CAPTURE=1`

Planner data is not persisted in capture mode, but the snapshot is still generated so preview/native capture work can inspect the widget contract.

## Native Storage Plan

The current Windows implementation writes through app storage only. Native iOS widgets cannot be assumed to read that storage directly.

Mac implementation should add an App Group storage bridge:

1. Keep `WidgetSnapshot` JSON shape unchanged.
2. Add an iOS App Group identifier, for example:

   ```text
   group.com.mattnewman.studyplanner
   ```

3. Mirror the snapshot JSON into shared `UserDefaults(suiteName:)` or an App Group file.
4. Have the WidgetKit timeline provider decode the same JSON.
5. Call `WidgetCenter.shared.reloadAllTimelines()` after snapshot writes on iOS.

Do not claim native WidgetKit behavior is verified until this is built and tested on Mac.

## Tests

Windows tests cover:

- next due item
- this-week items
- overdue items
- empty state
- heavy week warning
- deterministic demo snapshot

Command:

```bash
npm run test
```
