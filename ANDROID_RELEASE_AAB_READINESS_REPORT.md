# Android Release AAB Readiness Report - Sprint 003

## Summary

The local release AAB build path works. A release bundle was produced successfully, but it is not Play-ready because the generated Android project currently signs the release variant with the debug keystore.

Local AAB artifact:

`C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab`

AAB size:

`64,163,536` bytes

Build result:

`BUILD SUCCESSFUL`

## Release Identity

- Package name: `com.mattnewman.studyplanner`
- Namespace: `com.mattnewman.studyplanner`
- Version name: `1.0.3`
- Version code: `52`
- App name: `Studyplanner: Syllabus AI`
- Deep link scheme: `studyplanner://`
- minSdk: `24`
- targetSdk: `36`
- compileSdk: `36`

## App Icon And Splash

Configured assets:

- Main icon: `assets/icon.png`
- Splash image: `assets/splash-icon.png`
- Adaptive icon foreground: `assets/android-icon-foreground.png`
- Adaptive icon background: `assets/android-icon-background.png`
- Adaptive icon monochrome: `assets/android-icon-monochrome.png`
- Adaptive icon background color: `#FFFFFF`
- Splash background: `#FFFFFF`
- Dark splash background: `#050507`

Generated Android resources exist under the ignored `android/` native project.

## Commands Run

```powershell
npx expo config --type public
cd android
.\gradlew.bat :app:signingReport
$env:NODE_ENV = "production"
.\gradlew.bat :app:bundleRelease
```

## Signing Findings

`signingReport` shows:

- Debug variant: signed with `android\app\debug.keystore`
- Release variant: also signed with `android\app\debug.keystore`
- Alias: `androiddebugkey`
- Release signing status: DEBUG-SIGNED, NOT PLAY-READY

No production upload keystore was found in the repo scan. No user-level `~\.gradle\gradle.properties` release signing configuration was present.

The generated `android\app\build.gradle` currently contains:

```gradle
release {
    signingConfig signingConfigs.debug
}
```

That is acceptable for local build-path validation only. It must be replaced by EAS-managed Android credentials or an upload keystore before closed testing.

## Release Build Findings

`.\gradlew.bat :app:bundleRelease` passed and created:

`C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab`

Important non-blocking warnings:

- Gradle deprecation warnings before Gradle 10.
- Gradle daemon reported JVM Metaspace pressure after the build and will restart on the next build.
- Expo/React Native native dependency deprecation warnings.
- Manifest merge warnings for remove/replace directives where no other declaration existed.

## Manifest/Permission Findings

Merged release manifest confirms:

- `android:versionCode="52"`
- `android:versionName="1.0.3"`
- `package="com.mattnewman.studyplanner"`
- `com.android.vending.BILLING` present
- `android.permission.POST_NOTIFICATIONS` present
- `android.permission.READ_MEDIA_IMAGES` present
- `android.permission.CAMERA` present
- `android.permission.RECORD_AUDIO` is not present in the final merged release manifest
- `studyplanner` deep link scheme present

Release manifest also includes permissions from Expo/Android dependencies that need Play Console data-safety and policy review, including notification, media/file, network, billing, badge, boot, wake lock, foreground service, and `SYSTEM_ALERT_WINDOW` related declarations. These should be reviewed before closed testing metadata is finalized.

## EAS Readiness

Existing `eas.json` has:

```json
{
  "cli": {
    "version": ">= 20.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "production": {
      "distribution": "store",
      "autoIncrement": false
    }
  }
}
```

This is enough for an EAS Android production build profile to exist through the shared `production` profile. Android-specific credentials still need to be configured in EAS before producing a Play-ready AAB.

## Exact Next Commands For Play-Ready Signed AAB

Recommended EAS path:

```powershell
cd C:\FounderWorker\repos\StudyPlanner
npx eas login
npx eas credentials -p android
npx eas build -p android --profile production
```

Choose Android app credentials for package:

```text
com.mattnewman.studyplanner
```

Use EAS-managed credentials or upload a dedicated Play upload keystore. Do not use `android\app\debug.keystore` for Play.

Local Gradle path, after adding an env-based release signing config in the generated Android project or a config plugin:

```powershell
keytool -genkeypair -v -storetype PKCS12 `
  -keystore "C:\FounderWorker\secrets\studyplanner-upload-key.jks" `
  -alias studyplanner-upload `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

$env:STUDYPLANNER_UPLOAD_STORE_FILE = "C:\FounderWorker\secrets\studyplanner-upload-key.jks"
$env:STUDYPLANNER_UPLOAD_KEY_ALIAS = "studyplanner-upload"
$env:STUDYPLANNER_UPLOAD_STORE_PASSWORD = "<store-password>"
$env:STUDYPLANNER_UPLOAD_KEY_PASSWORD = "<key-password>"

cd C:\FounderWorker\repos\StudyPlanner\android
$env:NODE_ENV = "production"
.\gradlew.bat :app:bundleRelease
```

The local Gradle path requires a follow-up source/config change so `release` reads those environment variables instead of `signingConfigs.debug`.

## Remaining Release Blockers

1. Physical Android device smoke test has not run.
2. Release AAB is debug-signed today and cannot be uploaded to Play.
3. Production Android upload keystore or EAS-managed credentials must be configured.
4. Play Console app and subscription products must be configured for `com.mattnewman.studyplanner`.
5. Google Play Billing must be tested with license testers/internal testing.
6. Data safety and permission declarations need review before closed testing.
7. Android image OCR parity decision remains open.
8. Android widgets remain deferred by design.
