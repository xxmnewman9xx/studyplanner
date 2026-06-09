# Apple Student Board Parity Report

Baseline: `147788e`

## Blunt Findings

- Home was close, but too web-card heavy: oversized framed icon chips, extra utility rows, and a one-line exam title missed the board rhythm.
- Forecast was the cleanest screen, but the white "Looking ahead" row still read as a custom dashboard card.
- Semester matched the board structure, but the visible "Classes" heading under the primary rows added clutter the reference does not show.
- Widgets was the weakest: the 3x2 grid felt like a dashboard, repeated labels were noisy, and the watch preview was too large and clipped by the tab bar.
- Bottom tabs were too solid and heavy. They now use adaptive Liquid Glass/blur with lighter active state spacing.

## Cleanup Applied

- Added `expo-glass-effect` with `expo-blur` fallback for Liquid Glass surfaces.
- Applied adaptive glass to white cards, widget tiles, and bottom tab chrome.
- Simplified Home to the board stack only: exam, assignment, focus, next class, heavy week.
- Tightened Forecast and converted "Looking ahead" to the shared Apple board white card.
- Removed the stray first-viewport Classes list from Semester.
- Replaced the widget grid with a horizontal board-style widget row and smaller watch preview.

## Scores

- Apple-native feel: 8.2/10
- Reference parity: 8.0/10
- Simplicity: 8.6/10
- App Store screenshot quality: 8.3/10
- Implementation realism: 8.7/10

## Remaining Gaps

- Widget row is horizontally scrollable on phone, so not all six widgets are visible at once.
- Avatar remains an initial, not a photo like the board.
- Watch preview is an in-app preview surface, not a real watch target.
