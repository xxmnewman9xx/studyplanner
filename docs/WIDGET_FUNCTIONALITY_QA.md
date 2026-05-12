# Widget Functionality QA

Date: 2026-05-12
Branch: v1-1-widget-command-center

## Contract

Widgets are backed by `WidgetSnapshotService`, which builds and writes the same snapshot used by app previews and native WidgetKit.

Protected behavior:

- Small surface: `surfaces.small.kind = nextDue`
- Medium surface: `surfaces.medium.kind = thisWeek`
- Empty state: no fake assignments
- Capture mode: deterministic demo snapshot only when `EXPO_PUBLIC_STORE_CAPTURE=1`
- Production mode: no demo seed, no demo widget label
- Style: palette/style snapshot included for native widgets

## QA Matrix

| Case | Result | Notes |
| --- | --- | --- |
| Small widget shows next due | Pass | Covered by `widgetSnapshot.test.ts` |
| Medium widget shows this week | Pass | Covered by `widgetSnapshot.test.ts` |
| Empty widget state | Pass | "No upcoming deadlines" / "Scan a syllabus to start." |
| Theme/palette widget style | Pass | Snapshot includes `widgetStyle`; native Swift reads colors |
| Assignment completion updates snapshot | Pass by service path | `App.tsx` writes snapshot whenever assignments change |
| WidgetCenter reload | Pass by native bridge path | Swift bridge calls `WidgetCenter.shared.reloadAllTimelines()` |
| No clipping/truncation | Partial pass | Existing native proof images are present; final Home Screen placement remains manual |
| Capture data deterministic | Pass | `demo widget snapshot is deterministic` test |
| Production no demo data | Pass by code path | Demo seed only when exact store capture flag is set |

## Remaining Manual Checks

1. Install on `StudyPlanner-Codex-iPhone`.
2. Launch with `EXPO_PUBLIC_STORE_CAPTURE=1`.
3. Add the small and medium Home Screen widgets.
4. Confirm small widget shows Next Due and medium widget shows This Week.
5. Complete an assignment in the app and confirm widgets refresh.
6. Relaunch without capture mode and confirm no demo data appears.

The app-side widget contract is clean, and the capture-mode App Group payload was verified by `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh`. Final release confidence still depends on manually adding the Home Screen widgets in the simulator gallery and confirming the rendered widgets in place.
