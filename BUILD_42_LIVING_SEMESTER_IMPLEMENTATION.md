# Build 42 Living Semester Implementation

## Objective

Glue StudyPlanner into one deterministic semester cockpit. Build 42 keeps the verified Build 41 Expo/iOS, IAP, OCR, notification, and WidgetKit architecture, then makes Today, Plan, Classes, Notes, Reminders, and native widgets read from one local intelligence layer.

## Implementation Map

- `src/types.ts`
  - Added multi-dimensional semester health, grade forecasts, V2 class pulse, pressure forecast, recommended actions, study recommendations, feedback events, and `SemesterSnapshot`.
  - Added low-risk optional data fields for grade entries, weights, scores, missed study blocks, reviewed concepts, and feedback event storage.

- `src/intelligence.ts`
  - Added `buildSemesterSnapshot`.
  - Added health dimensions: workload, grades, preparedness, consistency.
  - Added known, estimated, and unknown grade forecast modes.
  - Added Class Pulse V2, pressure forecast, deterministic recommended actions, study recommendations, and feedback event deltas.
  - Preserved Build 41 dashboard helpers for compatibility.

- `src/storage.ts`
  - Preserves `feedbackEvents` during migration/normalization.
  - Import application now records a visible feedback event for syllabus or notes imports.

- `src/reminders.ts`
  - Schedules local notifications from `SemesterSnapshot.notificationPlan`.
  - Preserves the Build 41 permission behavior: permission is requested only when scheduling.

- `src/widgetEngine.ts`
  - Native widgets now use `buildSemesterSnapshot`.
  - Preserves widget kinds, WidgetKit sync, and `studyplanner://today` deep links.
  - Widgets now surface semester health, next action, pressure, and grade forecast values.

- `App.tsx`
  - Today now uses Semester Health dimensions, Class Pulse V2, Grade Forecast, Pressure Forecast, feedback copy, and next-action coaching.
  - Classes and Class Detail now lead with grade forecast and explainable class-specific nudges.
  - Plan now reads as Semester Autopilot with pressure map, recovery copy, feedback events, and missed-block repair.
  - Notes now explain how note insights affect preparedness and class pulse.
  - Reminders now show deterministic coach copy from the same snapshot.
  - Task completion, study completion, missed study blocks, quick capture, import, note review, and replanning now record feedback events.

- `app.json`, `ios/*`
  - Build number updated to `42`.
  - Marketing version remains `1.0.3`.
  - Bundle id remains `com.mattnewman.studyplanner`.
  - Widget extension build number updated to `42`.

- `scripts/check-semester-snapshot.ts`
  - Validates health dimensions, grade forecast modes, pressure clusters, feedback deltas, notification plan, and widget snapshots.

- `scripts/check-build42-living-semester.mjs`
  - Validates build metadata, bundle ids, preserved dependencies, hidden widget/theme studio copy, deep links, and Build 42 source wiring.

## Subagent Review Lanes

- Product Strategist: Build 42 strengthens the semester cockpit model because every visible surface now answers standing, slipping, and next action.
- Intelligence Architect: The shared `SemesterSnapshot` is reusable and deterministic; legacy helpers remain isolated for compatibility.
- UX / Visual Reviewer: The pass keeps the existing white/black direction and uses semantic color only for state, pressure, class, and forecast accents.
- QA Engineer: New tests cover deterministic outputs instead of screenshots alone: health, grade mode, pressure, feedback, notifications, and widgets.
- Release Risk Reviewer: No new external API, no new native module, no bundle id change, no widget kind change, no IAP product change.

## Remaining Risks

- Grade forecasting is pragmatic local logic, not a full LMS-gradebook model. It improves with manual grade entries and weights.
- Image OCR fixtures are not expanded in this cycle; Build 41 OCR paths are preserved.
- Simulator screenshot validation was not part of this local implementation pass unless separately run with an installed iOS build.
- Build 41 script intentionally still asserts build number `41`; use `check:build42` for this cycle.

## Acceptance Criteria

- TypeScript passes.
- Build 41 intelligence tests still pass.
- Build 42 SemesterSnapshot tests pass.
- Build 42 metadata/source checks pass.
- Native widgets still deep link to `studyplanner://today`.
- In-app widget gallery/studio/theme studio copy remains hidden.
- Bundle id and IAP dependencies remain intact.
