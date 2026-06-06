# Build 45 TestFlight Submission

## Result
PASS — Build 45 was uploaded to App Store Connect for TestFlight processing.

## Build Metadata
- App: Studyplanner: Syllabus AI
- Version: `1.0.3`
- Build: `45`
- Bundle ID: `com.mattnewman.studyplanner`
- Widget bundle ID: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- URL scheme: `studyplanner`
- Deep link: `studyplanner://today`
- ASC App ID: `6766181202`
- EAS Project ID: `69335c75-753e-424e-8a76-c8bd2455a112`

## Commands Run
- `npm run typecheck`
- `npm run test:intelligence`
- `npm run test:semester`
- `npm run test:narrative`
- `npm run test:syllabus-stress`
- `npm run test:notes-stress`
- `npm run test:global-syllabus`
- `npm run test:global-notes`
- `npm run check:build42`
- `npm run check:build42-6`
- `npm run check:build44`
- `npm run check:build44-max`
- `npm run check:build45`
- `npx expo config --type public`
- `npx expo-doctor`
- `npx expo prebuild -p ios --no-install`
- `npx pod-install ios`
- `npx eas-cli@latest build -p ios --profile production --non-interactive`
- `npx eas-cli@latest build -p ios --profile production --local --non-interactive`
- `npx eas-cli@latest submit -p ios --profile production --path build-1780754256561.ipa --non-interactive`

## Build Path
- Cloud EAS build: blocked by free monthly iOS build quota.
- Local EAS production build: completed.
- IPA path: `build-1780754256561.ipa`
- IPA size reported by local EAS build: `15.9 MB`

## EAS Submission
- Submission ID: `acebdfcb-a205-4b32-bd0b-f0c8b0f1e27f`
- Submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/acebdfcb-a205-4b32-bd0b-f0c8b0f1e27f`

## App Store Connect
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- Status: Uploaded successfully; Apple processing pending.
- EAS submit output: “Submitted your app to Apple App Store Connect. Your binary has been successfully uploaded to App Store Connect.”

## Warnings / Notes
- Cloud EAS build quota remains unavailable until the monthly reset.
- Local build emitted the existing Xcode duplicate library warning for `-lc++`; archive/export succeeded.
- Local build emitted the existing JavaScript bundle warning for `TransformStream`; archive/export succeeded.
- `npm ci` during local EAS build reported moderate npm audit items; Expo Doctor passed and no release blocker was raised.

## Final Status
PASS — Build 45 is submitted and awaiting Apple TestFlight processing.
