# Build 48 Signing Fix Report

## Status
PASS

The signing blocker was fixed for both native targets and a production App Store IPA was created.

## Files Changed
- `app.json`
- generated iOS project output after `npx expo prebuild -p ios --no-install`

## Signing Fix
Added:

```json
"appleTeamId": "5JN35MJ3QD"
```

under `expo.ios` in `app.json`.

After prebuild, `ios/StudyplannerSyllabusAI.xcodeproj/project.pbxproj` generated:

- `StudyplannerSyllabusAI` Debug: `DEVELOPMENT_TEAM = 5JN35MJ3QD`
- `StudyplannerSyllabusAI` Release: `DEVELOPMENT_TEAM = 5JN35MJ3QD`
- `ExpoWidgetsTarget` Debug: `DEVELOPMENT_TEAM = 5JN35MJ3QD`
- `ExpoWidgetsTarget` Release: `DEVELOPMENT_TEAM = 5JN35MJ3QD`

## Verified Metadata
- app bundle: `com.mattnewman.studyplanner`
- widget bundle: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- URL scheme: `studyplanner`
- build number: `48`
- version: `1.0.3`

## Commands Run
- `npm run typecheck -- --pretty false`
- `npm run check:build48`
- `npx expo config --type public`
- `npx expo-doctor`
- `npx expo prebuild -p ios --no-install`
- `npx pod-install ios`
- `xcodebuild -workspace ios/StudyplannerSyllabusAI.xcworkspace -scheme StudyplannerSyllabusAI -configuration Release -destination 'generic/platform=iOS' -archivePath "$PWD/work/Build48/StudyplannerSyllabusAI.xcarchive" archive`
- `npx eas-cli@latest build -p ios --profile production --non-interactive --wait --message "Build 48 signing fix"`
- `npx eas-cli@latest build -p ios --profile production --local --non-interactive --output "$PWD/work/Build48/studyplanner-build48.ipa"`

## Validation Results
- typecheck: PASS
- Build 48 guardrail check: PASS
- Expo config: PASS
- Expo doctor: PASS, 21/21 checks
- Expo prebuild: PASS
- pod install: PASS, 97 pods
- local Xcode Release archive: PASS
- EAS cloud build: BLOCKED by free-plan iOS monthly quota before build start
- EAS local production build: PASS

## Credential Evidence
EAS confirmed remote App Store credentials for both targets:

- `StudyplannerSyllabusAI`
  - bundle: `com.mattnewman.studyplanner`
  - distribution certificate serial: `35AAAA8BECDA41D7F6A22412737F297E`
  - Apple Team: `5JN35MJ3QD`
  - provisioning profile Developer Portal ID: `NBXUU7R36N`
  - profile status: active

- `ExpoWidgetsTarget`
  - bundle: `com.mattnewman.studyplanner.widgets`
  - distribution certificate serial: `35AAAA8BECDA41D7F6A22412737F297E`
  - Apple Team: `5JN35MJ3QD`
  - provisioning profile Developer Portal ID: `Z9J8X9Q3B8`
  - profile status: active

Local EAS assigned App Store profiles:

- app profile: `*[expo] com.mattnewman.studyplanner AppStore 2026-06-04T20:27:48.447Z`
- widget profile: `*[expo] com.mattnewman.studyplanner.widgets AppStore 2026-05-19T16:21:18.805Z`

## IPA
- path: `work/Build48/studyplanner-build48.ipa`
- size: 16 MB
- SHA-256: `7da802584a7f8fe3a10b71fc69efe05715f5e39df1cfce250b6769e16d15740b`

## Warnings
- EAS cloud build could not start because the account has used its free-plan iOS monthly builds.
- Local EAS build reported existing dependency warnings and CocoaPods script phase notices; no signing or archive failure.
- Xcode warned about duplicate `-lc++`; archive/export still succeeded.

## Result
Build 48 signing is fixed and production IPA export succeeded.
