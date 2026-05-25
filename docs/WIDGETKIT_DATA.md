# WidgetKit Data Contract

StudyPlanner widgets use a compact WidgetKit snapshot generated from reviewed planner data. The app never shares the full `PlannerData` object with the widget extension.

## Native Widgets

- `StudyPlannerTodayWidget`: small and medium Home Screen widget, plus circular, rectangular, and inline Lock Screen accessories for work due today.
- `StudyPlannerUpcomingWidget`: small and medium Home Screen widget, plus circular, rectangular, and inline Lock Screen accessories for upcoming reviewed deadlines.
- App Group: `group.com.mattnewman.studyplanner`.
- Widget extension bundle id: `com.mattnewman.studyplanner.widgets`.

The native extension supports only Today and Upcoming. Larger dashboard, focus, week, streak, needs-check, and class-focus templates remain in-app customization presets unless a future native widget kind is added.

## Shared Fields

The app may write only these fields into the widget timeline snapshot:

- Snapshot metadata: version, kind, state, generated time, semester name, open URL.
- Display copy: headline, value, detail, footnote, signal label, metric label, next label, and timeline label.
- Visual tokens: accent color and background color.
- Assignment display rows: assignment id, title, course code, course color, due label, priority, and assignment kind.

## Excluded Fields

Widgets must not receive syllabus raw text, parsed item raw text, teacher names, rooms, class meeting locations, grade scores, checklist details, notes, student name, purchase state, reminder IDs, calendar event IDs, or the full AsyncStorage planner record.

Demo planner coursework is not written into native widget snapshots. Unreviewed, duplicate, or invalid-deadline scan results stay out of Today and Upcoming widgets until the student reviews them in the app.

## Refresh And Sync Limits

- Widget snapshots refresh when the app opens or planner/settings state changes.
- Widget timelines are compact one-entry snapshots, not a continuously running planner database.
- Day-boundary urgency can become stale until the next app sync.
- Turning Widget sync off writes a private `sync_disabled` snapshot so old planner data is not left visible on the Home Screen.
- Privacy mode only affects native widgets after the app can write a new snapshot. In native iOS builds, the sync-off path writes a private off-state snapshot; non-iOS builds cannot update WidgetKit.
