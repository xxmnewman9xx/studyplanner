# Android Build Artifact Manifest - Sprint 004

## Source

- Repo: `C:\FounderWorker\repos\StudyPlanner`
- Branch: `studyplanner-android-sprint-001`
- Verification source commit: `e31b025b4fea79e17cb9aa3c10044a4e06276242`
- Package: `com.mattnewman.studyplanner`
- Version name: `1.0.3`
- Version code: `52`

## Artifacts

### Debug APK

- Path: `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk`
- Size: `170,478,750` bytes
- Signing status: debug-signed
- Upload readiness: install/testing only, not Play upload

### Release AAB

- Path: `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab`
- Size: `64,163,536` bytes
- Signing status: debug-signed release bundle from generated Gradle config
- Upload readiness: build-path proof only, not Play upload-safe

## Build Commands Run

```powershell
cd C:\FounderWorker\repos\StudyPlanner
npm run typecheck
npm run check:iap
npm run check:build52
npx expo-doctor
npx expo prebuild --platform android --no-install

cd C:\FounderWorker\repos\StudyPlanner\android
.\gradlew.bat assembleDebug
$env:NODE_ENV = "production"
.\gradlew.bat :app:bundleRelease
```

## Results

- `npm run typecheck`: PASS
- `npm run check:iap`: PASS
- `npm run check:build52`: PASS
- `npx expo-doctor`: PASS, `21/21`
- `npx expo prebuild --platform android --no-install`: PASS
- `.\gradlew.bat assembleDebug`: PASS
- `.\gradlew.bat :app:bundleRelease`: PASS

## Identity Confirmation

Merged release manifest confirms:

- `package="com.mattnewman.studyplanner"`
- `android:versionCode="52"`
- `android:versionName="1.0.3"`
- `com.android.vending.BILLING` present
- `android.permission.POST_NOTIFICATIONS` present
- `android.permission.RECORD_AUDIO` not present in the final merged release manifest

## Upload Readiness

Current status: not upload-ready.

Reason: release AAB is signed with the generated debug keystore. Use EAS-managed Android credentials or a dedicated upload keystore before Google Play closed testing.
