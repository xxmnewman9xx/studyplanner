# Build 46 TestFlight Submission

## Result
PASS. Build 46 was uploaded to App Store Connect for TestFlight processing.

## Build Metadata
- App: Studyplanner: Syllabus AI
- Version: 1.0.3
- Build: 46
- Bundle ID: com.mattnewman.studyplanner
- Widget bundle ID: com.mattnewman.studyplanner.widgets
- App Group: group.com.mattnewman.studyplanner
- URL scheme: studyplanner
- ASC App ID: 6766181202

## Commands Run
```bash
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
npx expo config --type public
npx expo-doctor
npx expo prebuild -p ios --no-install
npx pod-install ios
npx eas-cli@latest build -p ios --profile production --non-interactive
npx eas-cli@latest build -p ios --profile production --local --non-interactive
npx eas-cli@latest submit -p ios --profile production --path build-1780755855454.ipa --non-interactive
```

## Build Path
- Cloud EAS build: blocked by account iOS build quota.
- Local EAS production IPA: build-1780755855454.ipa
- IPA size reported by EAS local build: 15.9 MB

## Submission
- EAS submission ID: 7508fe7d-9153-43b3-96ef-2b8574bbdae2
- EAS submission URL: https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/7508fe7d-9153-43b3-96ef-2b8574bbdae2
- App Store Connect TestFlight URL: https://appstoreconnect.apple.com/apps/6766181202/testflight/ios
- App Store Connect status: uploaded successfully; Apple processing pending.

## Warnings
- EAS cloud iOS build quota is exhausted and resets July 1, 2026, so local EAS production build was used.
- `npm ci` reported a React peer dependency warning from transitive `expo-widgets` dependencies.
- `npm audit` reported 10 moderate vulnerabilities in dependency tree.
- Xcode reported duplicate `-lc++` library warning.
- CocoaPods emitted standard React Native deprecation/script phase notices.

## Decision
Build 46 is submitted to TestFlight processing and is the current live-submission candidate.
