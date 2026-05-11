# UI Reference Comparison Checklist

## Now Matches

- Today, Review Inbox, This Week, Class Hub, and Widget Showcase use the new premium component system instead of the old plain list/cards.
- Capture mode uses deterministic Spring/March demo data with Biology 101, Calculus II, English 201, and Psychology 201.
- Capture mode hides theme toggle and form-heavy setup/edit surfaces.
- Bottom navigation is a five-item floating dock: Today, This Week, Classes, Inbox, Widgets.
- Widget previews are driven by `WidgetSnapshotService.build`.
- IAP/product code remains in the existing subscription and purchase configuration paths.

## Still Differs From PNG

- The app renders real React Native UI, not a full App Store poster board with four hardware-framed phones at once.
- iPhone hardware bezel, dynamic island, and marketing side rails are not implemented inside the app.
- Background aurora is approximated with light app-surface washes and dark widget surfaces; exact PNG gradients need Mac screenshot QA.
- Native font rendering and shadow softness may differ by simulator/device.
- Widget lock screen uses a React Native approximation of the reference glow.

## Screenshots To Capture On Mac

- `EXPO_PUBLIC_STORE_CAPTURE=1` Today tab on iPhone 15 Pro simulator.
- Review Inbox tab after launch in capture mode.
- This Week tab in capture mode.
- Classes tab in capture mode.
- Widgets tab in capture mode.
- Optional web export screenshot for quick layout regression.

## Visual QA Criteria

- Phone app surface reads white/off-white, not old dark utility UI.
- Header, hero card, metrics, task cards, week strip, and bottom dock match the reference hierarchy.
- Review Inbox shows confidence filters, item cards, and high-confidence CTA without upload plumbing in capture mode.
- Week view shows a date strip, workload map, warning, and grouped day cards.
- Class Hub starts with premium course cards, not semester setup inputs.
- Widget cards are dark, rounded, dense, and use real deadline data.
- Text does not clip inside task cards, metric pills, widgets, or dock labels.
- No placeholder labels appear in capture mode.
- Native widget bridge and snapshot writing still pass tests.
