# TestFlight Upload Receipt

Date: 2026-05-26 10:46 EDT / 2026-05-26 14:46 UTC

## Current Status

Build `28` has been built as a local production IPA and uploaded to EAS Submit. EAS scheduled the iOS submission, but the submission is currently still queued on EAS and has not yet returned Apple/App Store Connect completion proof.

This is a TestFlight proof candidate, not a release recommendation. The final release blockers remain documented in `docs/launch/2026-05-26/final-release-blocker-scorecard.md`.

## Build

- IPA: `builds/StudyPlanner-1.0.2-b28.ipa`
- SHA-256: `b1756fbdc6b8e947e0149502570e9611c309f143b9b6a6f2628a628743295a0a`
- Version: `1.0.2`
- Build: `28`
- Display name: `StudyPlanner: Syllabus AI`
- Bundle: `com.mattnewman.studyplanner`
- Widget extension: `com.mattnewman.studyplanner.widgets`
- Source commit: `0c30ab007ae1665a87e065df333c6b2680735511`
- Build type: local EAS production build using remote iOS App Store credentials
- EAS build URL: N/A for local EAS build

## Production Env Loaded Into Build

The local EAS production build reported these production variables loaded from EAS:

- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`
- `EXPO_PUBLIC_TERMS_URL`

## Pre-Upload Validation

Command:

```sh
npm run qa:release
```

Result: passed.

Included gates:

- typecheck
- quick homework parser
- syllabus parser
- parser endpoint normalizer
- backend platform contracts
- photo OCR fixture
- planner trust fixtures
- widget snapshot gates
- golden scenarios
- runtime localization completeness
- IAP/premium gate configuration
- release documentation guardrails
- web export

## Build Attempts

1. Local build initially failed during CocoaPods because the machine had roughly 2 GB free and Hermes extraction hit `No space left on device`.
2. EAS cloud build with auto-submit was attempted, but the Expo account had used its monthly free iOS builds. Reset is reported for 2026-06-01.
3. Generated local build/cache artifacts were cleared, bringing free space to roughly 26 GB.
4. Local production build was retried and succeeded:

```sh
eas build --platform ios --profile production --local --output builds/StudyPlanner-1.0.2-b28.ipa --non-interactive --build-logger-level warn
```

## Submit Attempts

The first submit attempt included `--what-to-test`, but EAS rejected scheduling because the changelog parameter is Enterprise-only on this account.

The successful scheduling command was:

```sh
eas submit --platform ios --profile production --path builds/StudyPlanner-1.0.2-b28.ipa --non-interactive --wait
```

EAS Submit details:

- ASC App ID: `6766181202`
- App Store Connect API key ID used by EAS Submit: `HDR783736G`
- EAS submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/86285642-118c-49cb-957d-3ff727e19095`
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`

## Latest Observed Submission State

Queried from EAS GraphQL at 2026-05-26 10:46 EDT:

```json
{
  "id": "86285642-118c-49cb-957d-3ff727e19095",
  "status": "IN_QUEUE",
  "platform": "IOS",
  "ascAppIdentifier": "6766181202",
  "error": null,
  "logFiles": []
}
```

The local `--wait` process was detached after the queue remained unchanged for an extended wait. The server-side EAS submission remains queued.

## Remaining Required Proof

Before this can be treated as TestFlight proof rather than only a queued upload receipt:

1. Confirm EAS submission `86285642-118c-49cb-957d-3ff727e19095` reaches `FINISHED`.
2. Confirm App Store Connect receives build `28`.
3. Wait for Apple processing to complete.
4. Install build `28` on physical iPhone through TestFlight.
5. Capture physical camera permission, live camera scan, OCR/parser response, review cards, and applied-to-Today proof.
