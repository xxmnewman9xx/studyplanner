# Build 48 Release Report

## Decision
Do not submit yet.

The app-side rescue passed, but production archive and TestFlight submission are blocked by signing configuration.

## Scorecard
- Crash Stability: 10/10 source and simulator; TestFlight device loop pending
- Onboarding Personalization: 9.6/10
- Onboarding Sex Appeal: 9.4/10
- Conversion Potential: 9.5/10
- Hard Paywall Safety: 10/10 source and simulator
- No Demo Data Confidence: 10/10
- Lean App Feel: 9.2/10
- Premium Feel: 9.4/10
- Apple-Native Feel: 9.2/10
- TestFlight Readiness: 8/10, blocked by signing
- Live Submission Readiness: 7.5/10, pending TestFlight loops

## What Changed
- Build number incremented to 48.
- Version remains 1.0.3.
- Onboarding rebuilt around first name, student type, main goal, workload style, and scan intent.
- Added real-looking static product artifact previews.
- Hardened no-entitlement route locking.
- Hardened empty/corrupt/old storage.
- Hardened imports without demo data.
- Added Build 48 rescue guardrail check.

## Validation
- all requested npm test and check commands passed except production archive/TestFlight path.
- Expo config passed.
- Expo doctor passed through `npx expo-doctor`.
- iOS prebuild passed.
- pod install passed.
- Debug simulator build passed.
- fresh simulator launch showed no crash.

## Blocker
Production archive failed at signing:

- `ExpoWidgetsTarget` missing Development Team.
- `StudyplannerSyllabusAI` missing Development Team.

## Release Gate
Submit only after:

- signing team is configured for both targets.
- Release archive passes.
- TestFlight build uploads.
- repeated real-device onboarding/paywall/reopen loops pass.
- restore/purchase boundaries pass in TestFlight.
