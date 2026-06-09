# Widget Preset Model Report

## Canonical model

The canonical shipped-widget preset model is defined in `src/widgets/widgetPresets.ts` and extends `WidgetPreset` with native-oriented fields:

- `widgetKind`: `today`, `upcoming`, `week`, or `classProgress`
- `theme`: `light`, `dark`, `ocean`, `graphite`, `forest`, or `high_contrast`
- `layout`: constrained per widget kind
- `dataMode`: constrained per widget kind
- `classFocusCourseId`: required for Class Progress
- `lastSyncedAt`: stamped when presets are saved

## Persistence path

- `saveWidgetPreset` canonicalizes each saved preset and keeps exactly one preset per shipped widget kind.
- `ensureCanonicalWidgetPresets` fills missing native presets without exposing fake widget types.
- The app stores presets in the normal planner state and `syncStudyPlannerWidgets` writes computed WidgetKit timeline entries to the App Group preferences file.
- Native timeline entries include both display data and config data, so visible Studio choices are readable by WidgetKit without React.

## Matrix coverage

`npm run test:widget-integrity` validates this save/reload matrix:

- Today: `light` / `list` / `today`
- Upcoming: `ocean` / `timeline` / `this_week`
- Week: `graphite` / `strip` / `this_week`
- Class Progress: `forest` / `progress` / `single_class` with a selected class id

The same gate verifies native-readable weekday counts, selected class persistence, theme persistence, and WidgetKit reload bridge coverage.
