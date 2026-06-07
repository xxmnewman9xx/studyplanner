# Android Port Progress Report - Sprint 003

## Current Readiness Score

84/100

StudyPlanner now has a proven debug APK build and a proven local release AAB build path. The release artifact is not Play-ready yet because it is debug-signed, and physical-device runtime smoke is still blocked because no authorized Android device is connected.

## Completed

- Android SDK remains installed at `C:\Users\xxmne\AppData\Local\Android\Sdk`.
- `adb` is installed and working.
- Debug APK exists:
  `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk`
- `adb devices -l` was checked.
- No physical device was connected or authorized.
- `.\gradlew.bat :app:signingReport`: PASS.
- `.\gradlew.bat :app:bundleRelease`: PASS.
- Local release AAB created:
  `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab`
- Package identity confirmed: `com.mattnewman.studyplanner`.
- Version confirmed: `1.0.3` / versionCode `52`.
- App name, icon, adaptive icon, splash, billing permission, notification permission, and deep link scheme confirmed.
- Merged release manifest confirms `RECORD_AUDIO` is not present after the removal directive is applied.

## Physical Device Status

BLOCKED.

`adb devices -l` returned no connected devices:

```text
List of devices attached
```

APK install and runtime smoke were not attempted because there was no target device.

Next required setup:

1. Enable Developer Options on the Android phone.
2. Enable USB Debugging.
3. Connect with a data-capable USB cable.
4. Accept the RSA debugging prompt.
5. Run `adb devices -l` until the device state is `device`.

Then install:

```powershell
adb install -r "C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk"
adb shell monkey -p com.mattnewman.studyplanner 1
```

## Release AAB Readiness

PARTIAL PASS.

The AAB build path works:

```text
C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab
```

The artifact is not Play-ready because the generated `release` build type currently uses `signingConfigs.debug`.

Recommended Play-ready path:

```powershell
cd C:\FounderWorker\repos\StudyPlanner
npx eas login
npx eas credentials -p android
npx eas build -p android --profile production
```

Use package:

```text
com.mattnewman.studyplanner
```

## Remaining Blockers

1. Connect and authorize a physical Android device.
2. Install and launch the debug APK on device.
3. Complete runtime smoke: onboarding, locked funnel, paywall, restore/manage copy, imports, paste fallback, notification permission, Today/dashboard, close/reopen.
4. Configure Play-ready Android signing through EAS credentials or a production upload keystore.
5. Generate a signed Play-ready AAB.
6. Configure Play Console app and subscription products.
7. Test Google Play Billing with license testers/internal testing.
8. Review release permissions and data-safety declarations.
9. Decide Android image OCR parity scope.
10. Keep Android widgets deferred unless product requirements change.

## Estimated Effort

### Internal Android Beta

Estimated: 1 focused day after physical device access is available.

Required:

- Install APK on device.
- Run smoke checklist.
- Fix any first-launch/runtime blocker.
- Decide whether debug-signed local build is enough for owner testing or whether EAS internal distribution should be used immediately.

### Play Store Closed Testing

Estimated: 3-6 business days after device smoke passes.

Required:

- Configure Android signing credentials.
- Produce signed AAB.
- Create Play Console app/package.
- Configure subscriptions.
- Add license testers/internal track.
- Complete data safety and listing basics.
- Upload AAB to closed testing.

### Production Release

Estimated: 2-3 weeks depending on OCR, billing QA, and closed-test results.

Required:

- Stable closed-test pass on physical Android hardware.
- Google Play Billing purchase/restore validated.
- Data safety/policy review complete.
- Android OCR parity decision resolved.
- Crash-free release candidate.

## Recommended Next Sprint

```text
StudyPlanner Android Sprint 004 - Physical Device Runtime QA

Repo: C:\FounderWorker\repos\StudyPlanner
Branch: studyplanner-android-sprint-001
Latest local commit: <current Sprint 003 commit>

Goal: With a real Android device connected and authorized, install the debug APK, run full runtime smoke, capture screenshots/logcat, and fix only narrow Android runtime blockers.

Commands:
- adb devices -l
- adb install -r android\app\build\outputs\apk\debug\app-debug.apk
- adb shell monkey -p com.mattnewman.studyplanner 1
- adb logcat -c
- adb logcat -d > android-device-smoke-logcat.txt

Smoke:
- launch/no crash
- onboarding
- locked funnel
- paywall
- restore/manage Android copy
- import screen
- camera/photo path
- paste fallback
- notification permission/channel
- Today/dashboard
- close/reopen

Do not push, merge, submit to Play, or redesign.
```
