# Widget Persistence Proof

Date: 2026-05-26

## Persistent State

Saved widget presets remain part of `PlannerData.widgetPresets` and are written through the existing `study-planner-data-v3` planner save path.

The new `npm run test:widget-integrity` gate verifies:

- Saved native preset palette/background survive JSON serialization and reload.
- Reloaded snapshots use the saved preset.
- Stale demo rows are filtered after reload when `demoMode` is false.
- Widget payload keys are limited to the native snapshot contract.
- Widget row keys are limited to safe display fields.
- Payload values are property-list safe for App Group storage.
- `updateSnapshot` writes a timeline entry.
- Native `WidgetObject.updateTimeline` writes App Group storage and calls `WidgetCenter.shared.reloadTimelines`.

## Completion Proof

The integrity gate creates two due-today assignments and verifies:

- Before completion: two rows, Today progress `0`.
- After completing one assignment: completed row is absent, one row remains, Today progress `0.5`, metric `1 of 2 complete`.
- After completing both: Today state is `no_due_today`, progress is `1`, metric is `2 of 2 complete`.

## Native App Group Proof

Release simulator app wrote these App Group keys after launch:

- `__expo_widgets_StudyPlannerTodayWidget_layout`
- `__expo_widgets_StudyPlannerTodayWidget_timeline`
- `__expo_widgets_StudyPlannerUpcomingWidget_layout`
- `__expo_widgets_StudyPlannerUpcomingWidget_timeline`

Observed timeline payloads include real assignment rows, completion metrics, generated timestamps, widget style fields, and `studyplanner://widgets` deep links.

Observed placed-widget payload values after relaunch include:

- `BIO 101`
- `Lab Report: Enzyme Simulation`
- `0 of 1 complete`
- `accentColor` `#2F80ED`
- `backgroundColor` `#101723`

The Home Screen remained populated with the small and medium widgets after app terminate/relaunch.
