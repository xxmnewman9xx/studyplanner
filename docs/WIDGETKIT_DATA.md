# WidgetKit Data Contract

StudyPlanner widgets use a compact WidgetKit snapshot generated from reviewed planner data. The app never shares the full `PlannerData` object with the widget extension.

## Native Widgets

- `StudyPlannerTodayWidget`: small and medium Home Screen widget, plus circular, rectangular, and inline Lock Screen accessories for work due today.
- `StudyPlannerUpcomingWidget`: small and medium Home Screen widget, plus circular, rectangular, and inline Lock Screen accessories for upcoming reviewed deadlines.
- `StudyPlannerWeekWidget`: small and medium Home Screen widget for workload by day plus the biggest upcoming deadline.
- `StudyPlannerClassProgressWidget`: small and medium Home Screen widget for one selected class, class progress, and the next class task.
- App Group: `group.com.mattnewman.studyplanner`.
- Widget extension bundle id: `com.mattnewman.studyplanner.widgets`.

The native extension ships four widget kinds: Today, Upcoming, Week, and Class Progress. Widget Studio is a preset editor for those shipped iPhone widgets; focus, streak, needs-check, and other legacy in-app template types must not be presented as native widget choices.

## Shared Fields

The app may write only these fields into the widget timeline snapshot:

- Snapshot metadata: version, kind, native gallery name, canonical preset kind, state, generated time, last synced time, semester name, and open URL.
- Preset config: theme, layout, data mode, and selected class id.
- Display copy: headline, value, detail, footnote, signal label, metric label, next label, and timeline label.
- Visual tokens: accent color, background color, style label, layout label, density label, window label, course scope label, icon key, action label, progress label, and numeric progress.
- Assignment display rows: assignment id, title, course code, course color, due label, priority, and assignment kind.
- Week display data: localized weekday labels, weekday workload counts, and biggest deadline label.

## Excluded Fields

Widgets must not receive syllabus raw text, parsed item raw text, teacher names, rooms, class meeting locations, grade scores, checklist details, notes, student name, purchase state, reminder IDs, calendar event IDs, or the full AsyncStorage planner record.

Demo planner coursework is not written into native widget snapshots. Unreviewed, duplicate, or invalid-deadline scan results stay out of native widgets until the student reviews them in the app.

## Refresh And Sync Limits

- Widget snapshots refresh when the app opens or planner/settings state changes.
- Widget timelines are compact one-entry snapshots, not a continuously running planner database.
- Day-boundary urgency can become stale until the next app sync.
- Turning Widget sync off writes a private `sync_disabled` snapshot so old planner data is not left visible on the Home Screen.
- Privacy mode only affects native widgets after the app can write a new snapshot. In native iOS builds, the sync-off path writes a private off-state snapshot; non-iOS builds cannot update WidgetKit.
