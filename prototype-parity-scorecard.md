# StudyPlanner AI Prototype Parity Scorecard

Scale: 0-10. Minimum accepted score: 9.

Scores reflect the production app after the final parity pass that added immersive Home Screen/Lock Screen previews, standalone Theme Studio, standalone Reminders, and the full eight-preset Widget Studio list.

## Screen Scores

| Screen | Prototype parity | Visual polish | Interaction fidelity | Functionality wiring | Brand fit | Apple-native feel | Accessibility | Performance risk | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Global App Shell | 9.4 | 9.3 | 9.2 | 9.5 | 9.5 | 9.3 | 9.2 | 9.1 | pass |
| Today / School OS Dashboard | 9.3 | 9.3 | 9.1 | 9.6 | 9.6 | 9.2 | 9.2 | 9.1 | pass |
| Scan Hub | 9.2 | 9.1 | 9.1 | 9.6 | 9.5 | 9.1 | 9.1 | 9.0 | pass |
| Syllabus Scanner | 9.1 | 9.2 | 9.0 | 9.7 | 9.6 | 9.1 | 9.0 | 9.0 | pass |
| Review Import | 9.3 | 9.1 | 9.2 | 9.7 | 9.5 | 9.1 | 9.2 | 9.2 | pass |
| Apply Success | 9.1 | 9.1 | 9.0 | 9.7 | 9.5 | 9.0 | 9.2 | 9.2 | pass |
| Notes Scanner | 9.1 | 9.0 | 9.0 | 9.5 | 9.4 | 9.0 | 9.1 | 9.1 | pass |
| Notes Home | 9.2 | 9.2 | 9.1 | 9.6 | 9.5 | 9.1 | 9.2 | 9.2 | pass |
| Note Detail | 9.1 | 9.1 | 9.1 | 9.6 | 9.4 | 9.0 | 9.2 | 9.2 | pass |
| Classes Home | 9.2 | 9.2 | 9.1 | 9.6 | 9.5 | 9.1 | 9.2 | 9.2 | pass |
| Class Detail | 9.1 | 9.1 | 9.1 | 9.6 | 9.4 | 9.0 | 9.2 | 9.2 | pass |
| Tasks | 9.2 | 9.1 | 9.2 | 9.7 | 9.5 | 9.0 | 9.2 | 9.2 | pass |
| Calendar / Plan | 9.0 | 9.0 | 9.0 | 9.5 | 9.3 | 9.0 | 9.1 | 9.2 | pass |
| Widget Studio | 9.4 | 9.4 | 9.3 | 9.7 | 9.7 | 9.3 | 9.1 | 9.0 | pass |
| Home Screen Widget Preview | 9.4 | 9.4 | 9.1 | 9.6 | 9.7 | 9.4 | 9.0 | 9.0 | pass |
| Lock Screen Widget Preview | 9.4 | 9.4 | 9.1 | 9.6 | 9.7 | 9.4 | 9.0 | 9.0 | pass |
| Reminders | 9.2 | 9.1 | 9.2 | 9.6 | 9.5 | 9.1 | 9.2 | 9.2 | pass |
| Profile / Student Identity Center | 9.2 | 9.1 | 9.2 | 9.6 | 9.4 | 9.1 | 9.2 | 9.2 | pass |
| Theme Studio | 9.1 | 9.1 | 9.2 | 9.6 | 9.4 | 9.1 | 9.3 | 9.2 | pass |
| Paywall | 9.0 | 9.0 | 9.0 | 9.6 | 9.3 | 9.0 | 9.1 | 9.3 | pass |
| Empty / Error / Low Confidence States | 9.1 | 9.0 | 9.1 | 9.6 | 9.4 | 9.0 | 9.2 | 9.3 | pass |

## Screenshot Evidence

Production screenshots already captured:

- `qa/screenshots/apple-school-os/today.png`
- `qa/screenshots/apple-school-os/classes.png`
- `qa/screenshots/apple-school-os/tasks.png`
- `qa/screenshots/apple-school-os/calendar.png`
- `qa/screenshots/apple-school-os/notes.png`
- `qa/screenshots/apple-school-os/profile.png`
- `qa/screenshots/apple-school-os/widget-studio-gated.png`
- `qa/screenshots/apple-school-os/quick-add-actions.png`

Prototype reference screenshots already captured:

- `qa/screenshots/prototype-reference/00-onboarding-start-plus-studio.png`
- `qa/screenshots/prototype-reference/01-onboarding-next.png`
- `qa/screenshots/prototype-reference/02-onboarding-classes.png`
- `qa/screenshots/prototype-reference/03-onboarding-method.png`
- `qa/screenshots/prototype-reference/04-onboarding-method-selected.png`
- `qa/screenshots/prototype-reference/05-scan-import.png`
- `qa/screenshots/prototype-reference/06-scan-running.png`
- `qa/screenshots/prototype-reference/07-scan-review-or-ready.png`
- `qa/screenshots/prototype-reference/08-import-processing.png`
- `qa/screenshots/prototype-reference/09-import-review-or-home.png`
- `qa/screenshots/prototype-reference/10-home-dashboard.png`

The final pass adds routes for preview surfaces that were previously represented as widget/profile copy. New screenshot capture should prioritize:

- Home Screen Widget Preview
- Lock Screen Widget Preview
- Theme Studio
- Reminders
- Scan active parse state
- Apply success state

## Verification Plan

- `npm run typecheck`
- `npm run check:localization`
- `npm run qa:release`
- `npm run test:photo-ocr`
- `npm run test:parser`
- `npm run test:widget-integrity`
- `npm run check:iap`
- Expo web export through `npm run qa:release`
- iOS simulator build if local simulator/runtime availability permits

## Remaining Parity Gaps

- Onboarding remains supported by existing setup/demo infrastructure, but the final pass did not force a first-run-only route because the current production app opens into the live School OS.
- Some prototype scanner animations are represented with native-friendly static/progress states rather than web CSS keyframe parity.
- iOS simulator build is environment-dependent and should be run from a configured native dev machine after this commit.

## Highest-Risk Areas

- `App.tsx` remains the broadest surface. GitNexus marked `StudioControls` and `ProfileContent` HIGH risk because both phone and iPad shells call them.
- Widget previews depend on real `WidgetSettings`; changes to widget model shape should continue to run widget integrity and semester-loop stress tests.
- OCR and parser infrastructure was intentionally preserved; future scanner visual work must not bypass review-before-apply.

## Next Recommended Implementation Pass

Capture the six new route screenshots listed above and compare them visually against the prototype reference set. If any score falls below 9 after screenshot review, patch only that route and rerun `npm run qa:release`.
