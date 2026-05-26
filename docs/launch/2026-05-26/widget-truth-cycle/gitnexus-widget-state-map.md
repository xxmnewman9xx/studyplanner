# GitNexus Widget State Map

Date: 2026-05-26

## Index

`npx gitnexus analyze` reported the StudyPlanner index was already up to date at commit `41d3148`.

GitNexus query coverage:

- `widget state persistence Widget Studio App Group WidgetKit render`
- `progress computation today class week focus assignments saved state`

## Impact Results

- `buildTodayPlan`: LOW risk, direct test caller only.
- `getClassAssignmentCounts`: LOW risk, direct test caller only.
- `getWidgetData`: LOW risk, direct test/script callers.
- `syncStudyPlannerWidgets`: LOW risk, direct app caller.
- `MoreScreen`: LOW graph risk, primary widget studio surface.
- `FocusScreen`: LOW graph risk, primary focus surface.
- `TodayScreen`: LOW graph risk, primary Today surface.
- `buildStudyPlannerWidgetSnapshots`: CRITICAL graph risk because it feeds App native sync, Widget Studio preview, Onboarding preview, and widget snapshot scripts.
- `WidgetPreviewCard`: CRITICAL graph risk because it feeds Widget Studio and Onboarding widget previews.
- `AssignmentRow`: CRITICAL graph risk; not changed in this cycle.
- Plan local helper functions: HIGH graph risk; not changed in this cycle.

## Flow

Widget Studio save path:

`MoreScreen.previewPreset -> onSaveWidgetPreset -> saveWidgetPreset -> widgetPresets state -> PlannerData save -> syncStudyPlannerWidgets -> buildStudyPlannerWidgetSnapshots -> createWidget.updateSnapshot -> App Group timeline -> WidgetKit reload`.

Progress path:

`assignments/focusSessions -> planner completion helpers -> Today/Plan/Courses/Widget Studio/widget snapshot data -> persisted PlannerData -> App Group native snapshot`.

## Risk Handling

The CRITICAL widget snapshot change was kept narrow:

- No schema rename.
- No WidgetKit target rename.
- No native family removal.
- No app navigation redesign.
- Added tests for payload contract, persisted presets, completion transitions, stale demo filtering, and reload bridge.
