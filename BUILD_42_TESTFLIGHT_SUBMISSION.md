# Build 42 TestFlight Submission

Date: 2026-06-05

## Result

PASS

Build 42 was uploaded to App Store Connect for TestFlight processing.

## Build Metadata

- App: Studyplanner: Syllabus AI
- Version: 1.0.3
- Build: 42
- Bundle ID: `com.mattnewman.studyplanner`
- Widget bundle ID: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- URL scheme: `studyplanner`
- ASC App ID: `6766181202`
- EAS Project ID: `69335c75-753e-424e-8a76-c8bd2455a112`

## Commands Run

Release gate:

```sh
npm run typecheck
npm run test:intelligence
npm run test:semester
npm run check:build42
npm run test:syllabus-stress
npm run test:notes-stress
npx expo config --type public
npx expo prebuild -p ios --no-install
npx pod-install ios
```

Cloud EAS build attempt:

```sh
npx eas-cli@latest build -p ios --profile production --non-interactive --json
```

Cloud EAS build result:

- Failed before build start because the Expo account has used its free-plan iOS builds for the month.
- Error reset window: July 1, 2026.
- No cloud EAS build ID was produced.

Local EAS build fallback:

```sh
mkdir -p qa/build42-final-gate/eas-local
EAS_LOCAL_BUILD_ARTIFACTS_DIR=qa/build42-final-gate/eas-local npx eas-cli@latest build -p ios --profile production --local --non-interactive
```

Submit:

```sh
npx eas-cli@latest submit -p ios --profile production --path qa/build42-final-gate/eas-local/build-1780711784418.ipa --non-interactive
```

## Build Artifact

- IPA path: `qa/build42-final-gate/eas-local/build-1780711784418.ipa`
- IPA size: 15.8 MB
- dSYMs exported and compressed by local EAS/fastlane.
- EAS build ID: none, local build fallback used.
- IPA URL: local artifact path above; no cloud artifact URL was created because cloud build quota blocked remote build.

## Submission

- EAS submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/9a07b24f-e94a-4e3b-8d7b-6a555605f3ac`
- EAS submission ID: `9a07b24f-e94a-4e3b-8d7b-6a555605f3ac`
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- App Store Connect status: uploaded successfully; Apple processing pending.

## Warnings / Notes

- `expo doctor` reported patch-level package mismatches during local build:
  - `expo` expected `~56.0.9`, found `56.0.8`
  - `expo-image-picker` expected `~56.0.16`, found `56.0.15`
  - `expo-notifications` expected `~56.0.16`, found `56.0.15`
  - `expo-widgets` expected `~56.0.17`, found `56.0.16`
- Local build continued and succeeded despite the doctor warning.
- Xcode archive warning: duplicate library `-lc++`; archive/export still succeeded.
- Sandbox IAP purchase completion remains unvalidated because sandbox Apple credentials are unavailable.
- Physical widget placement remains unvalidated; WidgetKit build/snapshot/deep-link evidence is documented separately.

## Final Status

PASS - Build 42 uploaded to App Store Connect and is processing for TestFlight.
