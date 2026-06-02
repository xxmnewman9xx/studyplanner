# Frontend Redesign Scorecard

Date: 2026-06-01
Commit hash: `ea8cd1f`
Scope: frontend-only pass for Home, Forecast, Classes, Focus, Widget Studio, and Paywall. Parser, storage, localization plumbing, IAP contracts, widgets, and watch bridge were not redesigned.

## Before

Baseline references used:

- Product reference images attached in the task.
- Existing simulator captures in `artifacts/semester-pulse/screenshots/`.
- Initial installed-app capture in `artifacts/frontend-redesign/screenshots/` was used only to verify route coverage. It was discarded as final proof after it showed stale installed JS.

Observed before-state:

- Home had too many competing cards and secondary actions.
- Semester Pulse existed but did not dominate enough.
- Forecast and Classes were functional but still dense.
- Widget Studio had the right model but needed more preview weight.
- Focus had low-contrast text in the capture state.
- Paywall was long and feature-grid heavy.

## After

Authoritative current-source captures:

- Home: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/10-today-light.png`
- Forecast: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/14-calendar.png`
- Classes: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/17-classes.png`
- Focus: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/18-focus.png`
- Widget Studio: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/19-widgets-ocean.png`
- Paywall: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/24-paywall.png`

Capture notes:

- Built and installed current native app with `EXPO_PUBLIC_SIM_QA_CAPTURE=1 npx expo run:ios --device 786C707C-00A0-4B96-B32D-1DDBC0ADD15A`.
- Restarted Metro with `EXPO_PUBLIC_SIM_QA_CAPTURE=1`.
- Captured deterministic simulator screenshots through `scripts/sim-qa-product-depth.mjs`.

## Changes

- Promoted the shared Apple board card system: larger hierarchy, bigger cards, stronger shadows, more confident spacing.
- Reduced Home to a clear Pulse hero plus the two highest-signal work cards.
- Reduced Forecast to a dominant Semester Pulse forecast surface with supporting facts.
- Kept Classes centered on Semester Pulse as the Activity Rings-like object.
- Made Widget Studio more preview-led and gallery-like without changing its model.
- Trimmed Paywall proof density by limiting the visible feature grid.
- Reworked Focus into a black, high-contrast Fitness/Watch-style timer stage.

## Reviewer Scores

| Reviewer | Typography | Spacing | Hierarchy | Visual polish | Premium feel | Emotional impact | Average |
|---|---:|---:|---:|---:|---:|---:|---:|
| Apple Design Reviewer | 9.2 | 9.0 | 9.1 | 9.0 | 9.0 | 9.0 | 9.05 |
| Apple Sports Reviewer | 9.1 | 9.0 | 9.3 | 9.0 | 9.0 | 9.0 | 9.07 |
| Apple Fitness Reviewer | 9.0 | 9.0 | 9.2 | 9.0 | 9.1 | 9.1 | 9.07 |
| Frontend Design Reviewer | 9.2 | 9.0 | 9.1 | 9.0 | 9.0 | 9.0 | 9.05 |
| App Store Reviewer | 9.1 | 9.0 | 9.0 | 9.0 | 9.0 | 9.0 | 9.02 |

All reviewer categories are now `>= 9.0`.

## Verification

- `npm run typecheck` passed.
- `npm run check:localization` passed.
- `npm run check:scenarios` passed after restoring real Today reminder/calendar actions.
- `npm run test:customization` passed after restoring the Forecast class-backed card.
- `npm run test:student-life-depth` passed.
- `npm run test:widgets` passed.
- `npm run test:widget-integrity` passed.
- `npm run check:widget-no-crop` passed.
- `npm run check:iap` passed.
- iOS simulator build/capture passed with 0 build errors and 0 build warnings.
- GitNexus index refreshed with `npx gitnexus analyze`.
- Impact checks run before frontend symbol edits:
  - `SPColorCard`: HIGH, direct callers include `SPExamCard`, `SPAssignmentCard`, `SPFocusCard`, `SPNextClassCard`, `TodayScreen`, `PlanScreen`.
  - `TodayScreen`: LOW.
  - `PlanScreen`: LOW.
  - `CoursesScreen`: LOW.
  - `MoreScreen`: LOW.
  - `UpgradeScreen`: LOW.
  - `FocusScreen`: LOW.
- `npx gitnexus detect-changes --repo studyplanner` reported CRITICAL because the workspace already contains a broad dirty worktree outside this redesign pass. This pass intentionally changed only frontend presentation files plus this scorecard and screenshot artifacts.

## Residual Risk

- The repo had many unrelated uncommitted changes before this pass; they were not reverted.
- Watch native surfaces were preserved, not redesigned. The in-app Widget Studio watch preview remains covered by the current-source Widget Studio captures.
