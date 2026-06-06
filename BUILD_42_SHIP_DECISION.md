# Build 42 Ship Decision

Date: 2026-06-05  
Version: 1.0.3  
Build: 42  
Bundle: com.mattnewman.studyplanner  
Decision: FAIL - do not submit to TestFlight yet.

## Scores

| Category | Score | Pass Threshold | Result |
|---|---:|---:|---|
| Semester Coach Feel | 9.1 | 9.0 | Pass |
| Semester Cockpit Feel | 9.0 | 9.0 | Pass |
| Intelligence Feel | 9.3 | 9.0 | Pass |
| Premium Feel | 9.0 | 9.0 | Pass |
| Apple-Native Feel | 8.8 | 9.0 | Fail |
| TestFlight Readiness | 8.2 | 9.0 | Fail |

## Decision Rationale

Build 42 is strong as an app experience and the core code checks pass. It should not be submitted yet because the final user-environment gate did not fully pass.

Blocking issues:

1. PDF import is not real in this build. The UI points users to “Upload PDF / Paste extracted text,” but there is no actual PDF picker/extraction workflow exposed.
2. IAP purchase completion could not be validated. The paywall loaded real products and opened Apple Account sign-in, but no sandbox credentials were available to complete a transaction.
3. Actual widget placement was not completed. WidgetKit extension, App Group, snapshots, timelines, and deep links are present, but Home Screen/Lock Screen placement was not proven.
4. Notification delivery was not proven. Permission prompt and grant were validated; delivery/pending request evidence was not captured.

## Strengths

- Build metadata is correct: `1.0.3`, build `42`, `com.mattnewman.studyplanner`.
- IAP product IDs are wired: `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
- Syllabus paste import produced real coursework and a real semester state.
- Import review protects the user before creating coursework.
- Semester Health, Class Pulse, Today, and Plan now use the living semester model.
- Plan tab successfully presents the monthly semester artifact and autopilot reasons.
- WidgetKit App Group sync is writing timelines.
- Native deep links now work through `studyplanner://today` and `studyplanner://reminders`.
- TypeScript, intelligence tests, semester tests, and Build 42 checks pass.
- Prebuild and pods pass.

## Commands Passed

```sh
npm run typecheck
npm run test:intelligence
npm run test:semester
npm run check:build42
npx expo config --type public
npx expo prebuild -p ios --no-install
npx pod-install ios
```

## Required Before TestFlight

1. Add or restore a real PDF picker/extraction path, or remove the PDF claim from the release candidate.
2. Validate IAP completion with a sandbox Apple account or TestFlight sandbox transaction.
3. Place small/medium/large widgets on the simulator or a real device and capture screenshots.
4. Validate notification delivery or inspect pending local notification requests after permission grant.

## Final Recommendation

Do not submit Build 42 to TestFlight in this state.

Recommended next action: close the four release blockers above, rerun the same gate, then submit Build 42 without changing versioning.

