# TestFlight Upload Receipt

Date: 2026-05-26 00:30 EDT / 2026-05-26 04:30 UTC

## Current Rescue Pass Note

No new TestFlight upload was performed after the 2026-05-26 OCR rescue changes. Build `27` is a historical upload receipt from the earlier parser-release pass and does not include the live backend OCR implementation, `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`, or the fresh native Release build `28` paywall proof.

## Build

- IPA: `builds/StudyPlanner-1.0.2-b27.ipa`
- SHA-256: `0124b7e1f23ad0baa17f5552162cad2a0e7276266e0b71b78bb51e26b518387e`
- Version: `1.0.2`
- Build: `27`
- Display name: `StudyPlanner: Syllabus`
- Bundle: `com.mattnewman.studyplanner`
- Widget extension: `com.mattnewman.studyplanner.widgets`
- Build type: local EAS production build using remote iOS App Store credentials
- EAS build URL: N/A for local EAS build
- Local build log: `qa-screenshots/2026-05-26-parser-release/testflight/eas-local-build-b27.log`

## Production Env Loaded Into Build

The local EAS build log reports production variables loaded from EAS:

- `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED`
- `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`
- `EXPO_PUBLIC_TERMS_URL`

## Upload

- Command: `eas submit --platform ios --profile production --path builds/StudyPlanner-1.0.2-b27.ipa --non-interactive`
- ASC App ID: `6766181202`
- App Store Connect API key ID used by EAS Submit: `HDR783736G`
- EAS submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/e4165054-f821-46fe-bb77-6f6f85a4ba7e`
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- Upload log: `qa-screenshots/2026-05-26-parser-release/testflight/eas-submit-b27.log`

## Result

The upload log reports:

- `Submitted your app to Apple App Store Connect!`
- `Your binary has been successfully uploaded to App Store Connect!`

Apple processing continues server-side after upload. The current uploaded binary is build `27`.

Builds `25` and `26` were also uploaded earlier in the same release cycle. Build `27` supersedes both because it keeps the softened display name from build `26` and also softens native camera/photo permission copy so this release does not imply production OCR/photo parsing.

## Known Build Warning

`expo doctor` reported the existing Metro config warning during the local EAS build, but the build continued and finished successfully. The IPA was signed and exported by Fastlane before submission.
