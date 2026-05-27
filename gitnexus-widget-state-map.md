# GitNexus Widget State Map

Date: 2026-05-26
Repo: `/Users/mattnewman/work/StudyPlanner`
GitNexus repo label: `studyplanner`

## GitNexus Coverage

- Ran `npx gitnexus analyze` before edits.
- Result: 3,415 nodes, 6,116 edges, 116 clusters, 286 flows.
- `npx gitnexus status` reports the index is up to date at commit `7061ac5`.
- Ran `npx gitnexus analyze` again after implementation so the newly added canonical preset module was indexed.
- Final indexed graph: 3,523 nodes, 6,380 edges, 117 clusters, 295 flows.

## Current Widget Graph

- Widget Studio React UI: `src/screens/MoreScreen.tsx`
  - Main screen symbol: `MoreScreen`
  - Preview state is assembled into `previewPreset`.
  - Native preview calls `buildStudyPlannerWidgetSnapshots`.
  - Current UI exposes four visible template tiles, but still carries legacy internal widget types and some invalid data choices.

- App state and persistence: `App.tsx`
  - Main stored planner key: `study-planner-data-v3`
  - `widgetPresets` is persisted in `PlannerData` via `saveJson`.
  - `saveWidgetPreset` delegates to `src/logic/planner.ts:saveWidgetPreset`.
  - App save/sync effect runs when assignments, courses, settings, focus sessions, notes, parsed data, semester, and widget presets change.

- Preset reducer: `src/logic/planner.ts`
  - `saveWidgetPreset` currently replaces by preset id only.
  - Existing model stores generic widget fields: type, size, background, palette, dataMode, classFocusCourseId, layout, iconKey.
  - It does not yet explicitly replace one canonical preset per native widget kind.

- Snapshot generation and native sync: `src/services/widgetSnapshot.ts`
  - `buildStudyPlannerWidgetSnapshots` produces snapshots for Today, Upcoming, Week, and Class Progress.
  - `syncStudyPlannerWidgets` calls Expo Widgets `updateSnapshot` for all four native widget modules.
  - Expo Widgets writes timeline data into App Group storage and calls WidgetKit reload through its native module.
  - Current native snapshot props include the rendered state but not an explicit canonical preset config block or `lastSyncedAt`.

- Expo widget JS bridge: `src/widgets/StudyPlannerWidgets.tsx`
  - Exports real Expo widget modules:
    - `StudyPlannerTodayWidget`
    - `StudyPlannerUpcomingWidget`
    - `StudyPlannerWeekWidget`
    - `StudyPlannerClassProgressWidget`
  - One layout source is shared across all four widgets and reads snapshot props.

- Native WidgetKit registration:
  - Bundle: `ios/ExpoWidgetsTarget/index.swift`
  - Registered widgets:
    - `StudyPlannerTodayWidget()`
    - `StudyPlannerUpcomingWidget()`
    - `StudyPlannerWeekWidget()`
    - `StudyPlannerClassProgressWidget()`
  - `app.json` also declares all four widgets under `expo-widgets`.
  - App Group configured in app and widget entitlements: `group.com.mattnewman.studyplanner`.

## Shipped Widgets Visible To iOS

- `StudyPlanner Today`
  - Swift file: `ios/ExpoWidgetsTarget/StudyPlannerTodayWidget.swift`
  - Kind: `StudyPlannerTodayWidget`
  - Families: system small, system medium, accessory circular, accessory rectangular, accessory inline

- `StudyPlanner Upcoming`
  - Swift file: `ios/ExpoWidgetsTarget/StudyPlannerUpcomingWidget.swift`
  - Kind: `StudyPlannerUpcomingWidget`
  - Families: system small, system medium, accessory circular, accessory rectangular, accessory inline

- `StudyPlanner Week`
  - Swift file: `ios/ExpoWidgetsTarget/StudyPlannerWeekWidget.swift`
  - Kind: `StudyPlannerWeekWidget`
  - Families: system small, system medium

- `StudyPlanner Class Progress`
  - Swift file: `ios/ExpoWidgetsTarget/StudyPlannerClassProgressWidget.swift`
  - Kind: `StudyPlannerClassProgressWidget`
  - Families: system small, system medium

## Gaps Found Before Editing

- Canonical preset model gap:
  - UI, reducer, snapshot lookup, and native props infer native kind from legacy `WidgetType` values.
  - Upcoming is represented as `due_next`; Class Progress is represented as `class_focus`.
  - Presets are not explicitly keyed by `today`, `upcoming`, `week`, and `classProgress`.

- Persistence gap:
  - Normal app persistence exists through `PlannerData.widgetPresets`.
  - Native-readable App Group persistence exists through Expo Widgets snapshots.
  - The native snapshot does not yet include explicit persisted config fields for kind, layout, data mode, class id, theme, and last synced timestamp.

- Widget Studio control truth gaps:
  - Data mode choices are global instead of per widget.
  - Class Progress can fall back to the first course instead of requiring an explicit class selection.
  - Required target data modes `next_up` and `next3` are missing.
  - Required target layouts `progress`, `timeline`, `strip`, `summary`, and `next_task` are missing.
  - Step copy still says `Widget Studio` instead of `Customize your iPhone widgets`.
  - iOS gallery instructions mention only Today or Upcoming.

- Preview/native mismatch risk:
  - Preview generation uses the same snapshot builder for native widgets, which is good.
  - Legacy non-native types can still exist in stored presets and saved preset rows.
  - Snapshot lookup chooses latest native-compatible type rather than an explicit one-preset-per-kind canonical record.

- Student usefulness risks:
  - Small widgets already prefer a real next action when rows exist, but accessory circular output can still degrade to a compact value/label.
  - Week and Class Progress are real native widgets, but their Studio controls need stricter per-kind data/layout rules.

## GitNexus Impact Results

- `src/logic/planner.ts:saveWidgetPreset`
  - Risk: LOW
  - Direct affected: `scripts/check-widget-integrity.ts`

- `App.tsx:saveWidgetPreset`
  - Risk: LOW
  - Direct affected: none reported

- `src/screens/MoreScreen.tsx:MoreScreen`
  - Risk: LOW
  - Direct affected: `AppContent`, then `App`

- `src/screens/MoreScreen.tsx:dataModeForWidget`
  - Risk: HIGH
  - Direct affected: `MoreScreen`, `applyTemplate`
  - Affected processes: App, MoreScreen, AppContent

- `src/services/widgetSnapshot.ts:buildStudyPlannerWidgetSnapshots`
  - Risk: CRITICAL
  - Direct affected: `syncStudyPlannerWidgets`, `nativeSnapshots`, `widgetSnapshots`, widget fixture rendering, widget tests, widget integrity tests
  - Affected processes: App, AppContent, SyncStudyPlannerWidgets, MoreScreen native snapshots, Onboarding snapshots

- `src/services/widgetSnapshot.ts:filterAssignmentsForPreset`
  - Risk: CRITICAL
  - Direct affected: `buildStudyPlannerWidgetSnapshots`
  - Same native sync, preview, onboarding, and script/test blast radius as snapshot generation

- `src/services/widgetSnapshot.ts:getNativeWidgetStyle`
  - Risk: CRITICAL
  - Direct affected: `buildStudyPlannerWidgetSnapshots`, `buildSyncDisabledWidgetSnapshots`
  - Same native sync, preview, onboarding, and script/test blast radius as snapshot generation

- `src/services/widgetSnapshot.ts:findNativePreset`
  - Risk: CRITICAL
  - Direct affected: `buildStudyPlannerWidgetSnapshots`, `buildSyncDisabledWidgetSnapshots`
  - Same native sync, preview, onboarding, and script/test blast radius as snapshot generation

- `src/services/widgetSnapshot.ts:widgetLayoutLabel`
  - Risk: HIGH
  - Direct affected: `getNativeWidgetStyle`
  - Affected processes: SyncStudyPlannerWidgets, MoreScreen native snapshots, Onboarding snapshots, widget tests

## Planned Scoped Changes

- Add a canonical shipped-widget preset helper shared by Studio, snapshot generation, reducer, defaults, and tests.
- Extend the preset model for native kind, target layouts/data modes, and last sync metadata while preserving existing stored presets.
- Save one canonical preset per shipped widget kind.
- Include canonical preset config fields in native snapshot props so App Group state is native-readable.
- Restrict Studio choices to valid widget-specific data modes and layouts.
- Require an explicit class for Class Progress.
- Keep all four Swift widgets registered and visible.
- Update tests to assert four-widget persistence, native config keys, and widget registration.

## Final Detect-Changes Scope

- `npx gitnexus detect-changes --repo studyplanner` reports critical risk.
- Final staged detect result: 23 changed files, 205 changed symbols, 72 affected processes.
- The critical scope is expected because the implementation deliberately touches the shared canonical widget preset path, native snapshot generation, Widget Studio preview, App Group sync, and widget integrity tests.
- Changed execution flows include native/widget snapshot generation, Widget Studio preview, `MoreScreen`, `AppContent`, and validation scripts.
- The final reconciliation is recorded in `gitnexus-detect-changes-report.md`.
