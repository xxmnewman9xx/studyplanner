# Target Architecture

## Product Loop

StudyPlanner should behave like a student operating system:

1. Onboarding previews the real loop: Scan -> Review -> Today -> Calendar -> Classes -> Focus -> Widgets.
2. Scan imports paper/photo/PDF/text only through supported parser paths.
3. Review blocks invalid, duplicate, or low-confidence rows.
4. Today chooses the next action and provides quick capture.
5. Calendar shows workload by day/week and creates planned focus blocks.
6. Classes organize course identity, source, notes, and upcoming work.
7. Focus logs real study sessions against assignments.
8. Widget Studio turns reviewed planner data into saved widget presets and native snapshots.
9. Paywall gates premium limits truthfully with store pricing, restore, and legal.

## Frontend Structure

- Keep the current Expo single-shell architecture for this pass.
- Keep domain logic in `src/logic/*`.
- Keep parser, IAP, calendar/reminders, storage, and widgets in `src/services/*`.
- Keep screens as orchestration surfaces, not hidden backend layers.
- Use existing `theme.ts`, `AppleComponents`, and `AppButton` rather than installing a new design system.

## Implemented Architecture Moves

- Today owns daily command routing with live Scan/Review/Calendar/Widget tiles.
- Widget Studio owns the Widgets tab first viewport.
- Widget Studio separates widget choice, data source, styling, and placement truth.
- More/Notes/Study/Grades/Settings are secondary destinations below the flagship studio.

## Backend Truth Boundaries

- Local storage is the planner source of truth.
- The parser endpoint is optional and environment-gated.
- Native widgets receive reviewed planner snapshots only.
- IAP is App Store/native through `expo-iap`; there is no server receipt validation in this repo.
- Calendar/reminder sync is local-device integration, not cloud reconciliation.
