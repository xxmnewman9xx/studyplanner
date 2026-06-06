# Build 47 TestFlight Submission

Generated: 2026-06-06 11:07:12 EDT

## Result

PASS - Build 47 was built locally and uploaded to App Store Connect/TestFlight.

Apple accepted the binary upload. App Store Connect processing is pending and should appear under TestFlight after Apple finishes processing.

## Build Metadata

- App: Study Planner: Syllabus AI
- Bundle ID: `com.mattnewman.studyplanner`
- Widget bundle ID: `com.mattnewman.studyplanner.widgets`
- Version: `1.0.3`
- Build: `47`
- URL scheme: `studyplanner`
- Deep link preserved: `studyplanner://today`
- App Store Connect App ID: `6766181202`
- EAS project ID: `69335c75-753e-424e-8a76-c8bd2455a112`

## Artifact

- IPA path: `/Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai/build-1780758278542.ipa`
- IPA size: 16 MB
- Cloud EAS build ID: none; cloud iOS quota was exhausted, so a local production build was used.

## Commands Run

```sh
npm run typecheck
npm run test:intelligence
npm run test:semester
npm run test:narrative
npm run test:syllabus-stress
npm run test:notes-stress
npm run test:global-syllabus
npm run test:global-notes
npm run check:build42
npm run check:build42-6
npm run check:build44
npm run check:build44-max
npm run check:build45
npm run check:build46
npm run check:build47
npx expo config --type public
npx expo-doctor
npx expo prebuild -p ios --no-install
npx pod-install ios
npx eas-cli@latest build -p ios --profile production --non-interactive
npx eas-cli@latest build -p ios --profile production --local --non-interactive
npx eas-cli@latest submit -p ios --profile production --path build-1780758278542.ipa --non-interactive
```

## Submission

- EAS submission ID: `30455986-a993-4f8a-922f-1b84034d892b`
- EAS submission URL: https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/30455986-a993-4f8a-922f-1b84034d892b
- TestFlight URL: https://appstoreconnect.apple.com/apps/6766181202/testflight/ios
- App Store Connect status: uploaded successfully; Apple processing pending.

## Warnings / Notes

- Cloud EAS iOS build was not available because the account's free iOS build quota is exhausted until 2026-07-01. Local production build was used successfully.
- Native build emitted the existing duplicate library warning: `ignoring duplicate libraries: '-lc++'`.
- Native bundling emitted an existing warning: `TransformStream was not declared in anonymous function`.
- `npm ci` during local build reported existing moderate dependency audit findings and deprecation/peer warnings. These did not block the build.
- Purchase completion still requires sandbox Apple credentials for full end-to-end IAP validation. Product IDs, hard gate, restore path, and StoreKit boundary were covered by Build 47 verification.

## Final Status

PASS - Build 47 is submitted to App Store Connect/TestFlight and awaiting Apple processing.
