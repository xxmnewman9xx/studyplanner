# StudyPlanner Android Release Control

Generated: 2026-06-07

## Current State

| Field | Value |
| --- | --- |
| App name | Studyplanner: Syllabus AI |
| Branch | `studyplanner-android-sprint-001` |
| Audited commit | `78d120932f5eeea6a9e71934ca0eed8a9eabd43a` |
| Release-control tag | `studyplanner-android-release-control` |
| Previous Android tag at local HEAD | `studyplanner-android-signed-aab-ready` |
| Package name | `com.mattnewman.studyplanner` |
| Version code | `52` |
| Version name | `1.0.3` |

Remote note: `origin/studyplanner-android-sprint-001` matches the audited commit. The local `studyplanner-android-signed-aab-ready` tag points at the audited commit, but the remote tag with that name currently resolves to an earlier object. Do not force-move that tag; use the release-control tag for this checkpoint.

## Artifacts

| Artifact | Path | Size | SHA-256 | Status |
| --- | --- | ---: | --- | --- |
| Debug APK | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk` | 170,478,750 bytes | `3644D5743E388517087CEB68F6B6165089A7E48BEDC29D796C1D7A2428B9564B` | Local device/emulator testing only |
| Local Gradle release AAB | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab` | 64,163,536 bytes | `A4DB603F16ADCAB076770F461707A6657A337C8571B876A697691B9685CC61B7` | Debug-signed build proof only; do not upload |
| EAS signed release AAB | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` | 64,161,392 bytes | `E791908274B0692555D9784BD1AA531C4AE7EDF82278CA95BC493191A1560C03` | Play internal testing upload candidate |

EAS artifact URL from the signed-AAB sprint:

`https://expo.dev/artifacts/eas/u4DL4BfXL7se8A2859hkbA.aab`

## Signing And Upload Readiness

- Signing status: EAS-managed signed AAB exists and verifies with `jarsigner`. The local Gradle AAB is still debug-signed and must not be uploaded.
- Play upload readiness: READY for internal testing using the EAS signed AAB above, pending Play Console app setup and product configuration.
- Exact file to upload: `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab`.

## Physical Device Smoke

Physical-device smoke is blocked because no authorized Android device was connected during the prior sprint. `adb` is installed and working, but `adb devices -l` returned no device rows. Runtime checks remain required before widening testing.

## Lightweight Verification

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run check:iap` | PASS |
| `npm run check:build52` | PASS |

## Remaining Blockers

1. Create/open the Play Console app for `com.mattnewman.studyplanner`.
2. Configure Play App Signing and internal testing track.
3. Create Google Play subscription products: `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
4. Complete physical-device smoke from the debug APK.
5. Finish Play Console data safety, privacy policy, store listing, and tester group setup.

## Exact Next Action

Upload `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` to the Play Console internal testing track for package `com.mattnewman.studyplanner`, then run the tester install flow on a Play Store-enabled Android device.
