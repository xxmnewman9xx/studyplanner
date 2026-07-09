# TestFlight And Build Status

Checked: 2026-07-09 04:45 ET

## Current State

- Apple rejected the previous upload for iOS `2.0.7` build `78`.
- Rejection codes:
  - `ITMS-90186`: the `2.0.7` pre-release train is closed for new build submissions.
  - `ITMS-90062`: `CFBundleShortVersionString` must be higher than the previously approved `2.0.7`.
- Local replacement config now targets iOS `2.0.8` build `79`.
- Local replacement config now targets Android version code `79`.
- EAS created replacement iOS store build `2.0.8` build `79`.
- Finished EAS build ID: `1b391498-68eb-4cfe-af89-d099cebd0418`.
- EAS build URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/builds/1b391498-68eb-4cfe-af89-d099cebd0418`.
- Build artifact: `https://expo.dev/artifacts/eas/Mzm7Ta3kGMCSsX2PiCUnAOTWUS0F9WlfcG7erWh2VFI.ipa`.
- EAS Submit uploaded the replacement binary to App Store Connect.
- Submission ID: `6a4dcc05-79dc-4e24-81b5-88826e7173f8`.
- Submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/6a4dcc05-79dc-4e24-81b5-88826e7173f8`.
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`.
- Apple processing is now the remaining TestFlight wait state.
- SDK package patches have been aligned with Expo SDK 56 expectations:
  - `expo` `~56.0.15`
  - `expo-image-picker` `~56.0.20`
  - `expo-notifications` `~56.0.20`
  - `expo-widgets` `~56.0.22`

## Required Binary

Use iOS `2.0.8` build `79` for the next App Store Connect upload and TestFlight processing pass.

Do not select or submit any `2.0.7` build for this cycle. That train is closed.

## Replacement Build Evidence

- EAS build completed as `FINISHED` for app version `2.0.8`, build number `79`.
- EAS build git commit hash: `5da88811a6e4887869963331a29afc810b65aff7`.
- Downloaded replacement IPA artifact and inspected bundled plists:
  - App bundle: `CFBundleShortVersionString=2.0.8`, `CFBundleVersion=79`.
  - Widget extension: `CFBundleShortVersionString=2.0.8`, `CFBundleVersion=79`.
- EAS Submit output: `Submitted your app to Apple App Store Connect`.

## Previous Build Evidence

- Rejected EAS build ID: `53e057a4-fdf7-457b-a2ca-41a22d7cd016`.
- Rejected EAS build version: `2.0.7` build `78`.
- Rejected EAS submission ID: `3c791f67-7d25-4799-957b-b51a1be7fed3`.
- The rejected IPA itself had matching app/widget plist versions (`2.0.7` / `78`), so the blocking issue is the closed train and not a widget-extension version mismatch.
- The first `eas build --auto-submit` attempt used `--what-to-test`, but EAS Submit rejected that changelog parameter for this account tier. Continue submitting exact build IDs without `--what-to-test`.

## Proof To Capture After Apple Processing

- App Store Connect processing status for build `79`.
- Confirmation that build `79` is selectable for the `2.0.8` App Store version.

## Manual ASC Boundary

App Store submission and In-App Event/featuring nomination final submit remain manual App Store Connect actions unless explicitly performed in the live ASC session. This packet prepares the exact build and metadata, but the final buttons should be pressed only after build `79` is visible/selectable and all supplemental URLs open publicly.
