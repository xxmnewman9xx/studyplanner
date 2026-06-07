# Android Widget Parity Report - Sprint 001

## Scope

Widgets were intentionally not implemented in this sprint. This report inventories Build 52 WidgetKit behavior and maps Android equivalents.

## Current WidgetKit Inventory

Source files:

- `src/widgetEngine.ts`
- `src/widgets/StudyPlannerWidgets.tsx`
- `app.json` `expo-widgets` plugin config
- `plugins/with-widgetkit-kinds.js`

Configured iOS widget bundle:

- `com.mattnewman.studyplanner.widgets`

App group:

- `group.com.mattnewman.studyplanner`

Widget kinds:

- `studyplanner.today`
- `studyplanner.upcoming`
- `studyplanner.week`
- `studyplanner.classProgress`

Widget exports:

- `StudyPlannerTodayWidget`
- `StudyPlannerUpcomingWidget`
- `StudyPlannerWeekWidget`
- `StudyPlannerClassProgressWidget`

Supported families:

- Home Screen small.
- Home Screen medium.
- Lock Screen inline.
- Lock Screen circular.
- Lock Screen rectangular.

Widget data model:

- `NativeWidgetSnapshot`
- shared semester health snapshot
- locked state snapshot
- `studyplanner://today` deep link
- progress, items, week counts, class forecast, next action, and narrative copy.

## Android Equivalents

- Home Screen widgets:
  - Android App Widgets using native Kotlin/Java RemoteViews or Glance.
- Lock Screen widgets:
  - No direct modern Android equivalent to iOS Lock Screen WidgetKit families.
- Widget data storage:
  - Android SharedPreferences, DataStore, SQLite, or a generated JSON bridge from React Native.
- Widget refresh:
  - AppWidgetManager updates, WorkManager for background refresh where appropriate.
- Deep links:
  - `studyplanner://today` can map to MainActivity through existing scheme.
- Locked state:
  - Can reuse the same locked snapshot concept.

## Estimated Implementation Effort

- Minimal Android Home Screen widget parity for one Today widget: 2-4 days after Android build runs.
- Full four-widget Home Screen parity: 1-2 weeks.
- Data bridge and refresh hardening: 2-4 days.
- Pixel/visual parity pass across widget sizes: 2-4 days.
- Lock Screen parity: not directly portable; requires product decision.

## Recommended Android Widget Roadmap

1. Ship Android app without widgets for first internal beta unless widgets are a release requirement.
2. Implement one small/medium Today widget first.
3. Reuse `buildNativeWidgetSnapshots(data)` as the semantic contract.
4. Add native Android widget host code only after the base Android app builds and launches.
5. Treat Lock Screen WidgetKit families as iOS-only unless an Android-specific surface is approved.

## Blockers

- No Android runtime build yet due missing SDK.
- No native Android widget module exists.
- Need decide whether Android widgets are required for closed testing or can be post-beta.
