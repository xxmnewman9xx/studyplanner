# Widget Studio Live Pass Audit

## Current Path

- Widget Studio lives in `src/screens/MoreScreen.tsx`, inside the Life/Widgets tab.
- `App.tsx` owns `widgetPresets` state, persists it through planner storage, passes it into `MoreScreen`, and calls `saveWidgetPreset` / `resetWidgetPresets`.
- `MoreScreen` creates a draft `previewPreset` from selected widget type, size, data mode, layout, palette, font, and class focus.
- `MoreScreen` builds `previewWidgetPresets`, then calls `buildStudyPlannerWidgetSnapshots` so the preview can use the same snapshot payload as native widgets.
- Native widget snapshot generation lives in `src/services/widgetSnapshot.ts`.
- Canonical native widget types are defined in `src/widgets/widgetPresets.ts`: Today, Upcoming, Week, Class Progress.
- In-app visual rendering uses `WidgetPreviewCard` and `LiquidGlassWidgetPreview`.
- Life Studio personalization state lives on `UserSettings`: `studentDNA`, `osBehavior`, `frictionPoints`, `widgetDNA`, `watchDNA`.

## What Is Real

- Preview data is connected to real `assignments`, `courses`, `semester`, `parsedImports`, `settings`, and `widgetPresets`.
- Native snapshot payloads filter unreviewed/demo data and respect sync/privacy rules.
- Saved widget presets persist through existing planner storage.
- Draft preview presets already update immediately in React state when the user changes type, size, data mode, class focus, layout, palette, or font.
- Class focus is real when a course exists.

## What Was Static Or Too Shallow

- Template recommendations were fixed and not meaningfully ranked by `OSBehavior`, `WidgetDNA`, `WatchDNA`, or `FrictionPoint`.
- Widget snapshot style did not visibly respond enough to Life Studio behavior when no explicit preset changed it.
- Widget Studio copy said "Widget DNA" but did not explain why the recommended widget was right for this student.
- Apple Watch, Lock Screen, StandBy, and Dynamic Island were not structured as first-class Widget Studio sections.
- Premium value felt mostly like a configurable preview, not an adaptive OS setup.

## Risk

- `MoreScreen` is low-risk UI scope.
- `buildStudyPlannerWidgetSnapshots` and `getNativeWidgetStyle` are high/critical risk because they feed native widget sync, Widget Studio preview, tests, and proof-packet tooling.
- The live pass should keep snapshot contracts stable and only change output values/style/copy based on existing `settings`.

## Implementation Direction

- Keep existing `WidgetPreset` persistence.
- Add behavior/friction/DNA-driven recommendation logic inside Widget Studio.
- Use real snapshots for native-capable widgets and clearly label sample/empty states when real data is missing.
- Make snapshot output visibly change by `OSBehavior` and selected `WidgetDNA`.
- Add a focused widget test proving personalization changes snapshot output.

