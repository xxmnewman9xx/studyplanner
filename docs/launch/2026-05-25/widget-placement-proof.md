# Widget Placement Proof

Date: 2026-05-25

## Proven

- Fresh current SpringBoard capture: `AppStore/OperationalLaunch-2026-05-25/widget-springboard-current.png`
  - Shows a placed StudyPlanner Home Screen widget and the StudyPlanner app icon.
- Prior real Home Screen placement proof copied into this pass: `AppStore/OperationalLaunch-2026-05-25/widget-home-screen-small-medium-prior-proof.png`
  - Shows StudyPlanner Today and Upcoming medium widgets alongside a small Today widget on SpringBoard.
- Native config registers `StudyPlannerTodayWidget` and `StudyPlannerUpcomingWidget` for `systemSmall`, `systemMedium`, `accessoryCircular`, `accessoryRectangular`, and `accessoryInline`.
- `npm run test:widgets` passes.

## Not Proven

- No new widget-gallery add flow recording was completed in this pass.
- No real Lock Screen accessory placement screenshot was captured.
- No `systemLarge` widget is claimed; the build does not register `systemLarge`.

## Exact Manual Steps For Remaining Proof

1. Long-press SpringBoard.
2. Add `StudyPlanner Today` and `StudyPlanner Upcoming` from the widget gallery.
3. Capture small and medium Home Screen placements after add.
4. Customize the Lock Screen and add StudyPlanner accessory widgets.
5. Capture Lock Screen accessory placement only if the widgets appear there.
