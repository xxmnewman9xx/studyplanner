# UI Implementation Notes

## Scope

This pass moves the real StudyPlanner app closer to the provided premium UI reference without replacing screens with static images or changing the product contracts underneath them.

Completed on Windows:

- shared premium visual components
- Today command center visual upgrade
- Review Inbox visual upgrade
- This Week Planner visual upgrade inside Today
- Class Hub visual upgrade
- in-app widget showcase powered by `WidgetSnapshotService`
- capture-mode polish for screenshot readiness
- documentation for the remaining Mac/native visual validation

Not completed on Windows:

- native iOS WidgetKit simulator verification
- Home Screen widget screenshot capture
- Lock Screen widget screenshot capture

## Shared Visual System

New shared component file:

- `src/components/PremiumUI.tsx`

Reusable pieces added:

- `PremiumCard`
- `ScreenHeader`
- `StatChip`
- `PillFilter`
- `StatusBadge`
- `WarningCard`
- `TaskRow`
- `DateStrip`
- `WorkloadBars`
- `CourseSummaryCard`
- `WidgetPreviewSection`
- `ScanCallout`

Theme changes:

- primary accent now leans purple/blue instead of teal
- added soft purple, blue, red, warning, and widget surface tokens
- primary buttons now use the premium purple brand accent
- badges and card shadows are softer and more consistent

## Today Dashboard

Reference alignment:

- compact greeting/header
- light Next Due hero card instead of a dark semester block
- three stat chips for due today, due this week, and review queue
- heavy-week warning card with action
- compact task rows with course color blocks and quick complete
- polished scan/upload CTA
- This Week date strip and workload bars
- widget preview module for small, medium, and Lock Screen concept surfaces

Preserved behavior:

- next due calculation
- due today/week counts
- overdue/heavy-week logic
- quick complete
- reminder and calendar sync callbacks
- scan/upload navigation
- assignment detail opening

## Review Inbox

Reference alignment:

- title/subtitle and extracted count
- confidence filter chips: All, High, Medium, Low
- compact extracted item cards
- type, class, due date, confidence, and review status labels
- accept, edit, and ignore/delete actions
- Accept High Confidence CTA
- secondary Select All / Restore Ignored / Edit actions
- polished empty state

Preserved behavior:

- parser/scanner entry points
- PDF/photo/camera import
- local parser output
- accepted/ignored review transitions
- inline editing
- apply parsed plan flow

## This Week Planner

Reference alignment:

- seven-day strip
- grouped day sections
- compact assignment rows
- exam/quiz urgency labels through task status badges
- completed state dimming and strike-through
- compact workload bars
- heavy-week warning

Preserved behavior:

- existing `buildWeekPlan` source of truth
- assignment detail opening
- quick complete
- Week Planner remains attached to Today rather than becoming a separate route

## Class Hub

Reference alignment:

- course cards with icon/color tile
- due-this-week count per course
- progress indicator
- selected class detail card
- class metrics for open work, exams, and meetings
- reminder defaults and syllabus source summary
- polished empty state

Preserved behavior:

- semester metadata editing
- course add/edit
- quick assignment add
- weekly schedule view
- assignment detail opening

## Widget Showcase

Reference alignment:

- small Next Due widget preview
- medium This Week widget preview
- Lock Screen concept preview
- dark navy/purple widget styling
- real snapshot data via `WidgetSnapshotService.build`

Safety notes:

- This is an in-app education/showcase surface.
- It does not claim native WidgetKit verification on Windows.
- The native bridge and snapshot schema were not changed.
- WidgetKit visual correctness still requires Mac simulator validation.

## Capture Mode

Capture mode remains gated by:

```text
EXPO_PUBLIC_STORE_CAPTURE=1
```

Capture-mode polish:

- deterministic demo data fills upgraded screens
- theme toggle is hidden in capture mode to match the reference phone framing
- top spacing is reduced for screenshot-ready composition
- no debug labels were added
- no fake purchase execution was added

Production safety:

- demo seed still loads only when `EXPO_PUBLIC_STORE_CAPTURE=1`
- persisted planner data is not overwritten by capture seed
- IAP product IDs are unchanged
- paywall/purchase execution was not touched

## Remaining Visual Gaps

- React Native cannot fully verify exact iOS font rendering on Windows.
- Native Home Screen widget and Lock Screen widget captures still need Mac Simulator.
- Some older non-upgraded screens, such as Grades, Focus, Upgrade, and Assignment Detail, still use the prior visual language.
- The in-app widget showcase is reference-quality for capture, but native WidgetKit surfaces must be compared separately on Mac.

## Capture Steps

1. On Mac, pull `v1-1-widget-command-center`.
2. Run the app with `EXPO_PUBLIC_STORE_CAPTURE=1`.
3. Verify Today, Scan/Review Inbox, Courses/Class Hub, and in-app widget showcase are populated.
4. Build/run the native iOS app and WidgetKit extension.
5. Capture app screens from the real app.
6. Capture Home Screen and Lock Screen widget surfaces from the simulator.
7. Confirm production mode with the env flag off does not show demo data.
