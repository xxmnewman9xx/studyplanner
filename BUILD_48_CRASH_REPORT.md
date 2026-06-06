# Build 48 Crash Report

## Status
PASS for source guardrails, unit/stress suites, simulator Debug build, and fresh simulator launch.

Production archive and TestFlight submission are blocked by Apple signing configuration, not by an app runtime or compile crash.

## Crash Cause
Build 47 could reach post-onboarding app routes with empty or partial production storage. Several paths assumed seeded coursework existed:

- `data.classes[0]` was used as the implicit class fallback.
- `ClassGlyph` expected a concrete class object.
- import review could create orphan tasks, exams, or notes when no class existed.
- stale detail routes could render after storage migration or import cleanup.
- corrupted or old storage could hydrate directly into the app without full shape normalization.

The highest-probability crash after onboarding was a null/undefined class access once onboarding completed and navigation moved toward a locked or dashboard route with no demo data.

## Stack Trace / Crash Signature
The crash was isolated at source level to unsafe empty-storage dereferences rather than a native module failure:

- `Today` / dashboard family: `data.classes[0]` -> `ClassGlyph` with `undefined`.
- import review: approved work items without a valid `classId`.
- detail routes: stale `selectedClassId`, `selectedTaskId`, or `selectedNoteId` after missing/corrupt storage.

After the fix, a clean simulator install and launch produced no native crash signal in `simctl log stream`; Metro loaded `index.ts` successfully.

## Files Changed
- `App.tsx`
- `src/storage.ts`
- `src/ai.ts`
- `src/intelligence.ts`
- `src/seed.ts`
- `src/types.ts`
- `scripts/check-build48-rescue.ts`
- `package.json`
- `app.json`
- legacy build check scripts for Build 48 compatibility

## Fix
- Added `safeClassFor`, `FALLBACK_CLASS`, and nullable-safe class rendering.
- Added `RecoveryScreen` for stale class/task/note detail routes.
- Hardened the hard paywall route gate so locked routes safely show paywall.
- Rebuilt storage hydration through `normalizeData`.
- Repaired import application so approved orphan items receive a safe import class.
- Added empty/corrupt/missing-profile guards for preferences, tasks, notes, exams, reminders, and study blocks.
- Removed the onboarding-to-dashboard bypass path.

## Regression Test
Added `npm run check:build48`, backed by `scripts/check-build48-rescue.ts`.

It verifies:

- Build number 48.
- no seeded demo coursework.
- name-first personalized onboarding.
- hard paywall route gate.
- empty-class crash guard.
- stale-route recovery.
- corrupt storage normalization.
- orphan import repair.
- no weak Build 47 onboarding copy or paywall bypass.

## Validation Evidence
- `npm run typecheck -- --pretty false`: PASS
- `npm run check:build48`: PASS
- `npm run test:intelligence`: PASS
- `npm run test:semester`: PASS
- `npm run test:narrative`: PASS
- `npm run test:syllabus-stress`: PASS
- `npm run test:notes-stress`: PASS
- `npm run test:global-syllabus`: PASS
- `npm run test:global-notes`: PASS
- `xcodebuild ... Debug ... generic/platform=iOS Simulator build`: PASS
- fresh simulator uninstall/install/launch through Expo dev client: no crash captured

## Remaining Blocker
`xcodebuild ... Release ... archive` failed because both app targets require a Development Team:

- `Signing for "ExpoWidgetsTarget" requires a development team.`
- `Signing for "StudyplannerSyllabusAI" requires a development team.`

No TestFlight submission was performed.
