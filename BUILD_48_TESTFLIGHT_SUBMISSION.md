# Build 48 TestFlight Submission

## Status
PASS: submitted to App Store Connect/TestFlight.

Apple accepted the binary upload. Current ASC state is Apple processing.

## Exact Commands Run
```sh
npm run typecheck -- --pretty false
npm run check:build48
npx expo config --type public
npx expo-doctor
npx expo prebuild -p ios --no-install
npx pod-install ios
xcodebuild -workspace ios/StudyplannerSyllabusAI.xcworkspace -scheme StudyplannerSyllabusAI -configuration Release -destination 'generic/platform=iOS' -archivePath "$PWD/work/Build48/StudyplannerSyllabusAI.xcarchive" archive
npx eas-cli@latest build -p ios --profile production --non-interactive --wait --message "Build 48 signing fix"
npx eas-cli@latest build -p ios --profile production --local --non-interactive --output "$PWD/work/Build48/studyplanner-build48.ipa"
npx eas-cli@latest submit -p ios --profile production --path "$PWD/work/Build48/studyplanner-build48.ipa" --non-interactive --wait
```

No `--what-to-test` flag was used.

## IPA
- path: `work/Build48/studyplanner-build48.ipa`
- size: 16 MB
- SHA-256: `7da802584a7f8fe3a10b71fc69efe05715f5e39df1cfce250b6769e16d15740b`

## EAS Build
- Cloud EAS build ID: none; cloud build was quota-blocked before build start.
- Local EAS build: PASS
- Local EAS output: `work/Build48/studyplanner-build48.ipa`

## EAS Submission
- submission ID: `7214a48b-172e-4084-915a-527487f3797a`
- submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/7214a48b-172e-4084-915a-527487f3797a`
- ASC app ID: `6766181202`
- App Store Connect/TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`

## ASC Processing Status
EAS Submit completed with:

> Submitted your app to Apple App Store Connect.

Apple status at handoff: uploaded and processing. Apple usually completes processing asynchronously after upload.

## Warnings / Notes
- Cloud EAS build was not used because free-plan iOS monthly quota is exhausted until July 1, 2026.
- Local EAS production build used remote App Store credentials for both targets.
- EAS Submit used the configured App Store Connect API key `HDR783736G`.
- No product code changes were made in this signing pass.
