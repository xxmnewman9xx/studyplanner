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
| EAS signed release AAB | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v56-eas-signed.aab` | 64,169,485 bytes | `0B6FBF4B78DAEF26FFC6A5A9F347E41CBE652EAA52CF0F28BAEE6E3CF74F9B3B` | Build-56 Play internal testing candidate |
| Previous EAS signed release AAB | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` | 64,161,392 bytes | `E791908274B0692555D9784BD1AA531C4AE7EDF82278CA95BC493191A1560C03` | Stale v52 artifact; do not upload after the build-56 parity merge |

Current EAS build:

- Build ID: `b9b6e6d5-17da-4ebe-b388-9da51909914a`
- Build page: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/builds/b9b6e6d5-17da-4ebe-b388-9da51909914a`
- Artifact URL: `https://expo.dev/artifacts/eas/oW6Z4bEQS7mH9NYjbqkjgC.aab`

## Signing And Upload Readiness

- Signing status: EAS-managed signed AAB exists for versionCode 56. The local Gradle AAB is build proof only and must not be uploaded.
- Play upload readiness: READY for manual internal testing upload. Automated EAS Submit is blocked until a Google Play service-account key is configured.
- Exact file to upload: `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v56-eas-signed.aab`.

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

1. Configure or upload a Google Play service-account JSON key for EAS Submit, or manually upload the v56 AAB in Play Console.
2. Configure Play App Signing and internal testing track.
3. Create Google Play subscription products: `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
4. Complete physical-device smoke from a Play-installed build-56 app.
5. Finish Play Console data safety, privacy policy, store listing, and tester group setup.

## Exact Next Action

Upload `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v56-eas-signed.aab` to the Play Console internal testing track for package `com.mattnewman.studyplanner`, or configure a Google Play service-account key and rerun `eas submit --platform android --profile production --path C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v56-eas-signed.aab --wait`.
