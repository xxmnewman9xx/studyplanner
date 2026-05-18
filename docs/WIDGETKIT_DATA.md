# WidgetKit Data Contract

StudyPlanner widgets use a compact WidgetKit snapshot generated from reviewed planner data. The app never shares the full `PlannerData` object with the widget extension.

## Native Widgets

- `StudyPlannerTodayWidget`: small and medium Home Screen widget for work due today.
- `StudyPlannerUpcomingWidget`: small and medium Home Screen widget for upcoming reviewed deadlines.
- App Group: `group.com.mattnewman.studyplanner`.
- Widget extension bundle id: `com.mattnewman.studyplanner.widgets`.

## Shared Fields

The app may write only these fields into the widget timeline snapshot:

- Snapshot metadata: version, kind, state, generated time, semester name, open URL.
- Display copy: headline, value, detail, footnote.
- Visual tokens: accent color and background color.
- Assignment display rows: assignment id, title, course code, course color, due label, priority, and assignment kind.

## Excluded Fields

Widgets must not receive syllabus raw text, parsed item raw text, teacher names, rooms, class meeting locations, grade scores, checklist details, notes, student name, purchase state, reminder IDs, calendar event IDs, or the full AsyncStorage planner record.

Demo planner coursework is not written into native widget snapshots. Unreviewed, duplicate, or invalid-deadline scan results stay out of Today and Upcoming widgets until the student reviews them in the app.
