# TestFlight And Build Status

Checked: 2026-07-09 13:55 ET

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
- EAS GraphQL status recheck on 2026-07-09: `6a4dcc05-79dc-4e24-81b5-88826e7173f8` is `FINISHED` for ASC app `6766181202`.
- Ignore later duplicate attempt `e873a70f-cee9-41de-94e6-4e0faff92e77`; EAS reports it as `ERRORED`.
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`.
- App Store Connect now shows build `79` attached to iOS app version `2.0.8`; Save is disabled and Add for Review is enabled.
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
  - Local artifact: `builds/studyplanner-2.0.8-79.ipa`.
  - SHA-256: `f31a0bec714e1473cd0506ea47c01472a979f804f6ee5d03c819b27f7b51ce2c`.
  - App bundle: `com.mattnewman.studyplanner`, `CFBundleShortVersionString=2.0.8`, `CFBundleVersion=79`.
  - App bundle URL schemes: `studyplanner`, `com.mattnewman.studyplanner`.
  - Widget extension: `com.mattnewman.studyplanner.widgets`, `CFBundleShortVersionString=2.0.8`, `CFBundleVersion=79`, `NSExtensionPointIdentifier=com.apple.widgetkit-extension`.
- EAS Submit output: `Submitted your app to Apple App Store Connect`.

## Previous Build Evidence

- Rejected EAS build ID: `53e057a4-fdf7-457b-a2ca-41a22d7cd016`.
- Rejected EAS build version: `2.0.7` build `78`.
- Rejected EAS submission ID: `3c791f67-7d25-4799-957b-b51a1be7fed3`.
- The rejected IPA itself had matching app/widget plist versions (`2.0.7` / `78`), so the blocking issue is the closed train and not a widget-extension version mismatch.
- The first `eas build --auto-submit` attempt used `--what-to-test`, but EAS Submit rejected that changelog parameter for this account tier. Continue submitting exact build IDs without `--what-to-test`.

## App Store Connect Attachment Proof

- Build section readback: `BUILD 79`, `VERSION 2.0.8`, `HAS APP CLIP NO`.
- The app-version draft has no remaining build-selection blocker.

## Manual ASC Boundary

App Store submission and In-App Event/featuring nomination final submit remain manual App Store Connect actions unless explicitly performed in the live ASC session. Build `79` is now visible/selectable and attached, the seasonal Yearly Plus trial is live, and all supplemental URLs have public readback evidence. The remaining manual boundary is pressing Add for Review / Submit Nomination after final human review.
