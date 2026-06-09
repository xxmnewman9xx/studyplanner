# StudyPlanner Android Release Control

Generated: 2026-06-09

## Current State

| Field | Value |
| --- | --- |
| App name | Studyplanner: Syllabus AI |
| Branch | `studyplanner-android-sprint-001` |
| Audited commit | merge of `origin/main` build 56 into `studyplanner-android-sprint-001` |
| Release-control tag | `studyplanner-android-release-control` |
| Previous Android tag at local HEAD | `studyplanner-android-signed-aab-ready` |
| Package name | `com.mattnewman.studyplanner` |
| Version code | `56` |
| Version name | `1.0.3` |

Remote note: `origin/main` has been merged into the Android sprint worktree so the Android runtime uses the latest build-56 iPhone app surface plus Android package, permissions, billing, and release-control fixes.

## Artifacts

| Artifact | Path | Size | SHA-256 | Status |
| --- | --- | ---: | --- | --- |
| Debug APK | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk` | 170,478,750 bytes | `3644D5743E388517087CEB68F6B6165089A7E48BEDC29D796C1D7A2428B9564B` | Local device/emulator testing only |
| Local Gradle release AAB | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab` | 64,163,536 bytes | `A4DB603F16ADCAB076770F461707A6657A337C8571B876A697691B9685CC61B7` | Debug-signed build proof only; do not upload |
| EAS signed release AAB | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` | 64,161,392 bytes | `E791908274B0692555D9784BD1AA531C4AE7EDF82278CA95BC493191A1560C03` | Stale v52 artifact; do not upload after the build-56 parity merge |

Historical EAS artifact URL from the signed-AAB sprint:

`https://expo.dev/artifacts/eas/u4DL4BfXL7se8A2859hkbA.aab`

## Signing And Upload Readiness

- Signing status: the prior EAS-managed signed AAB verifies with `jarsigner`, but it is versionCode 52 and is now stale. The local Gradle AAB is build proof only and must not be uploaded.
- Play upload readiness: NOT READY until a fresh EAS-managed signed AAB is produced from this build-56 Android parity merge.
- Exact file to upload: none yet. Build a new signed AAB for versionCode 56, then upload that artifact to the internal testing track.

## Physical Device Smoke

Physical-device smoke is blocked because no authorized Android device was connected during the prior sprint. `adb` is installed and working, but `adb devices -l` returned no device rows. Runtime checks remain required before widening testing.

## Lightweight Verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run check:iap` | PASS |
| `npm run check:build52` | PASS |
| `npm run check:android-release` | PASS |

## Remaining Blockers

1. Generate a fresh EAS-managed signed AAB from this build-56 merge. The previous v52 signed AAB must not be uploaded.
2. Create/open the Play Console app for `com.mattnewman.studyplanner`.
3. Configure Play App Signing and internal testing track.
4. Create Google Play subscription products: `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
5. Complete physical-device smoke from a build-56 install.
6. Finish Play Console data safety, privacy policy, store listing, and tester group setup.

## Exact Next Action

Run `eas build --platform android --profile production` from this merged build-56 branch, download the signed AAB, then upload that new artifact to the Play Console internal testing track for package `com.mattnewman.studyplanner`.
