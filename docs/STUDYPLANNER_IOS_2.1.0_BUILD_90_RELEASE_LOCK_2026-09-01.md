# Study Planner AI iOS 2.1.0 (90) Release Lock

Date: 2026-09-01

## Result

Build 90 is archived, App Store exported, locally verified, and uploaded to App Store Connect.

## Binary identity

- Main bundle: `com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- Marketing version: `2.1.0`
- Build number: `90` for both bundles
- Signing authority: Apple Distribution, team `5JN35MJ3QD`
- Provisioning: App Store distribution for both bundles; `get-task-allow` is `false`
- IPA: `/Users/mattnewman/work/StudyPlanner/build/release/export/2.1.0-90/StudyplannerSyllabusAI.ipa`
- IPA size: 18,322,373 bytes
- SHA-256: `08dd73a8dca0129fb9a0cae9d872c608b44c81c1eb52e61806d5d33f343c73a6`

## Verification

- Native archive: passed (`ARCHIVE SUCCEEDED`)
- Main app signature: valid on disk and satisfies its designated requirement
- Widget signature: valid on disk and satisfies its designated requirement
- Release access/onboarding/paywall gate: passed (`node scripts/check-build52.mjs`)
- Localized App Store package: 17 complete locales, each with localized text and seven screenshots
- App Store upload: succeeded with no transport errors
- Delivery UUID: `df4d5d36-37fb-4ee9-9bea-cc5617795053`

## Review gate

Do not replace the currently selected build or update the rejected review until build 90 finishes Apple processing and its App Store Connect readback is complete. Final review submission remains an action-time confirmation step.
