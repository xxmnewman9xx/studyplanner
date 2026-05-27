# GitNexus Detect Changes Report

Date: 2026-05-27

## Commands

- `npx gitnexus analyze`
- `npx gitnexus detect-changes --repo studyplanner`

## Final Index

- Nodes: 3,512
- Edges: 6,366
- Clusters: 117
- Flows: 294
- Final refresh after screenshot/localization fixes:
  - Nodes: 3,523
  - Edges: 6,380
  - Clusters: 117
  - Flows: 295

## Detect Changes Result

Final staged `npx gitnexus detect-changes --scope staged --repo studyplanner` reported:

- Changed files: 23
- Changed symbols: 205
- Affected processes: 72
- Risk level: critical

## Reconciliation

The critical result is expected and accepted for this task. The patch intentionally changes shared widget state and render paths:

- Canonical preset model: `src/widgets/widgetPresets.ts`
- Widget Studio editor and preview: `src/screens/MoreScreen.tsx`, `src/components/AppleComponents.tsx`
- Planner persistence: `src/logic/planner.ts`, `App.tsx`, `src/data/defaultPlanner.ts`
- Native snapshot/App Group data: `src/services/widgetSnapshot.ts`
- WidgetKit render source: `src/widgets/StudyPlannerWidgets.tsx`
- Gates: `scripts/check-widget-snapshots.ts`, `scripts/check-widget-integrity.ts`, `scripts/check-scenarios.mjs`
- Reports and proof manifests: `gitnexus-widget-state-map.md`, `real-4-widget-implementation-report.md`, `widget-preset-model-report.md`, `widget-studio-simplicity-report.md`, `home-screen-widget-proof.md`, `subagent-scorecard.md`, `changed-files-list.md`

This scope matches the requirement that every visible Studio customization persist to native-readable widget state, reload WidgetKit, survive app restart, and change the actual Home Screen widget.

## High-Risk Symbols Reviewed

- `buildStudyPlannerWidgetSnapshots`: CRITICAL, affects native sync, Studio previews, onboarding previews, and widget test scripts.
- `filterAssignmentsForPreset`: CRITICAL, affects native sync and preview filtering.
- `getNativeWidgetStyle`: CRITICAL, affects native snapshot styling and sync-disabled placeholders.
- `findNativePreset`: CRITICAL, replaced by canonical preset helpers.
- `ensureCanonicalWidgetPresets`: CRITICAL after final index refresh, affects app boot, save/reset, onboarding, Studio preview, native sync, and widget tests.
- `replaceCanonicalWidgetPreset`: included in final staged `SaveWidgetPreset -> WidgetKindForType` flow.
- `widgetKindForPreset`: included in final staged `SaveWidgetPreset -> WidgetKindForType` flow.
- `buildCanonicalWidgetPreset`: included in final staged `SaveWidgetPreset -> WidgetThemeChoiceFromPreset` and `FinishOnboarding -> WidgetThemeChoiceFromPreset` flows.
- `WidgetPreviewCard`: CRITICAL, affects Studio, onboarding previews, and app-level preview flows.
- `MoreScreen`: LOW graph risk, main user-facing Widget Studio surface.
- `syncStudyPlannerWidgets`: LOW graph risk, native bridge-sensitive App Group write path.
- `saveWidgetPreset` in `src/logic/planner.ts`: LOW graph risk, validated by widget integrity tests.

## Validation Coupled To Scope

- `npm run typecheck`: passed
- `npm run test:widgets`: passed
- `npm run test:widget-integrity`: passed
- `npm run check:localization`: passed
- `npm run check:scenarios`: passed
- `npm run test:planner`: passed
- `npm run test:quick-homework`: passed
- `npm run check:iap`: passed
- Fresh native Release simulator build: passed
