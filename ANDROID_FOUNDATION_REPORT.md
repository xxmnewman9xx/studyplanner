# Android Foundation Report - Sprint 001

## Baseline

- Baseline tag: `studyplanner-android-source-build-52`
- Baseline commit: `93b15994c78b31efff3a032b51a482e895e579a5`
- Goal: first Android-capable StudyPlanner build without redesigning or removing Build 52 behavior.

## Implemented

- Android application ID/package: `com.mattnewman.studyplanner`.
- Android versioning: `versionCode: 52`, `versionName: 1.0.3`.
- Android native project generated under `android/` with Expo prebuild.
- Android namespace/application ID in Gradle: `com.mattnewman.studyplanner`.
- Android adaptive icon generated from:
  - `assets/android-icon-foreground.png`
  - `assets/android-icon-background.png`
  - `assets/android-icon-monochrome.png`
- Android launcher icons generated under `android/app/src/main/res/mipmap-*`.
- Android splash screen configured through `expo-splash-screen` and generated as `splashscreen_logo.png` density assets.
- Added SDK-matched native dependencies:
  - `expo-splash-screen@~56.0.10`
  - `expo-system-ui@~56.0.5`
- Android permissions configured:
  - `android.permission.CAMERA`
  - `android.permission.READ_MEDIA_IMAGES`
  - `android.permission.POST_NOTIFICATIONS`
  - `com.android.vending.BILLING`
- `android.permission.RECORD_AUDIO` is explicitly blocked and appears in generated manifest with `tools:node="remove"`.
- Deep linking support generated through Expo scheme:
  - `studyplanner://`
  - Single Android VIEW intent filter in `AndroidManifest.xml`.
- Expo Android config now resolves with package/version/icons/permissions.

## Native Output Verified

- `android/app/build.gradle`:
  - `namespace 'com.mattnewman.studyplanner'`
  - `applicationId 'com.mattnewman.studyplanner'`
  - `versionCode 52`
  - `versionName "1.0.3"`
- `android/app/src/main/AndroidManifest.xml`:
  - Has camera, image, notification, billing permissions.
  - Has `RECORD_AUDIO` removal node.
  - Has one `studyplanner` deep-link intent filter.
- `expo-iap` prebuild added OpenIAP Android dependency:
  - `io.github.hyochan.openiap:openiap-google:2.2.1`

## Commands

- `npm install expo-splash-screen@~56.0.10`: PASS.
- `npm install expo-system-ui@~56.0.5`: PASS.
- `npx expo prebuild --platform android --no-install`: PASS.
- `npx expo config --type public`: PASS.
- `npx expo-doctor`: PASS, 21/21 checks.
- `npm run typecheck`: PASS.
- `npm run check:build52`: PASS.

## Remaining Foundation Blockers

- Local Windows machine does not have Android SDK configured, so Gradle cannot assemble yet.
- Generated manifest still includes Expo dev/support permissions such as `SYSTEM_ALERT_WINDOW`; review before release.
- Play release signing is not configured; debug signing only exists.
