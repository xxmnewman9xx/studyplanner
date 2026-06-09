# Build 52 Locked Experience TestFlight Submission

## Status

PASS - The Build 52 locked onboarding/paywall repair was built and uploaded to App Store Connect/TestFlight.

## Artifact

- IPA path: `/Users/mattnewman/work/StudyPlanner/builds/studyplanner-1.0.3-55.ipa`
- SHA-256: `17b44a5d977d51d782fa23f03de31d0f919dcc5fc96c523ca607d3933ccee001`
- App version: `1.0.3`
- iOS build number: `55`
- App bundle: `com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- Apple Team: `5JN35MJ3QD`
- ASC App ID: `6766181202`

The signed IPA was inspected after export. The parent app and widget extension both report `CFBundleShortVersionString=1.0.3` and `CFBundleVersion=55`.

## Build

Cloud EAS build was not used because the available route was the local production build with remote App Store credentials.

Command:

```sh
EAS_NO_VCS=1 npx eas-cli@latest build -p ios --profile production --local --non-interactive --output ./builds/studyplanner-1.0.3-54.ipa
```

Result: PASS.

EAS produced the signed IPA and the artifact was renamed to match the signed bundle metadata:

```sh
mv builds/studyplanner-1.0.3-54.ipa builds/studyplanner-1.0.3-55.ipa
```

Build warnings:

- Duplicate library warning for `-lc++`.
- CocoaPods/Xcode script phase notices were emitted.
- During archive, Xcode emitted a transient widget extension build-number warning, but the exported IPA was inspected and both the app and widget extension are signed as build `55`.

No warning blocked archive, signing, export, or submission.

## Submission

Submission command:

```sh
EAS_NO_VCS=1 npx eas-cli@latest submit -p ios --profile production --path ./builds/studyplanner-1.0.3-55.ipa --non-interactive
```

Result: PASS.

- EAS build ID: not applicable; local EAS build was used.
- EAS submission ID: `d2a636a3-1667-4825-bbe0-4c38834ac02f`
- Submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/d2a636a3-1667-4825-bbe0-4c38834ac02f`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- ASC/TestFlight status: uploaded successfully to App Store Connect; Apple processing is pending/completing asynchronously.

Submission warning:

- `ios.bundleIdentifier` in `app.json` was ignored because the native `ios` directory is present; EAS used the native bundle identifier.

No `--what-to-test` flag was used.
