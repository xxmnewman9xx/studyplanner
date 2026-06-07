# StudyPlanner Android Play Internal Testing Checklist

Date: 2026-06-07
Branch: `studyplanner-android-sprint-001`
Current commit verified during prep: `4d4368ecd7f155e29b7b5ae3533dc010ba3b3b89`
Current pushed tag: `studyplanner-android-sprint-001-buildable`

## Verified Local Android State

| Item | Status |
| --- | --- |
| Package name | `com.mattnewman.studyplanner` |
| Version name | `1.0.3` |
| Version code | `52` |
| Debug APK | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk` |
| Release AAB | `C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab` |
| Local debug build | Pass, `.\gradlew.bat assembleDebug` |
| Local release bundle build | Pass, `.\gradlew.bat :app:bundleRelease` |
| Local signing report | Pass |

## Signing Status

Current local Gradle release signing is not Play-upload-ready.

`android/app/build.gradle` signs the `release` build type with `signingConfigs.debug`, so the current local release AAB is signed with:

- Store: `C:\FounderWorker\repos\StudyPlanner\android\app\debug.keystore`
- Alias: `androiddebugkey`
- Purpose: local/debug proof only

Do not upload the current local AAB to Google Play.

## Recommended Credential-Safe Signing Plan

Use EAS-managed Android credentials for the first Play internal testing AAB.

Readiness:

- `eas.json` exists.
- EAS project ID exists in `app.json`: `69335c75-753e-424e-8a76-c8bd2455a112`.
- Production EAS profile has `distribution: "store"` and `autoIncrement: false`.
- No `credentials.json` is present in the repo, which is appropriate for managed credentials.

Credential-safe commands:

```powershell
cd C:\FounderWorker\repos\StudyPlanner
npx eas whoami
npx eas credentials -p android
npx eas build -p android --profile production
```

When prompted, choose EAS-managed Android credentials unless intentionally migrating an existing upload key. Do not commit any generated credential files or keystores.

Official references:

- Google Play internal testing: https://support.google.com/googleplay/android-developer/answer/9845334
- Expo managed credentials: https://docs.expo.dev/app-signing/managed-credentials/
- Expo app credentials: https://docs.expo.dev/app-signing/app-credentials/

## Google Play App Creation Steps

1. Open Google Play Console.
2. Create a new app.
3. Use app name: `Studyplanner: Syllabus AI`.
4. Set default language and app/game choice.
5. Choose free/paid according to the product strategy.
6. Confirm package name from the first uploaded AAB is `com.mattnewman.studyplanner`.
7. Enable Play App Signing.
8. Complete required dashboard tasks before internal testing review:
   - Main store listing
   - App content declarations
   - Privacy policy
   - Data safety
   - Content rating
   - Target audience
   - Ads declaration
   - Financial features/subscriptions declarations where prompted

## Internal Testing Track Steps

1. Go to `Testing > Internal testing`.
2. Create a release.
3. Upload the EAS-produced Android App Bundle.
4. Recommended release name: `StudyPlanner Android internal 52`.
5. Add release notes:
   - `Android internal testing build for StudyPlanner AI versionCode 52. Validates onboarding, imports/OCR, reminders, paywall, restore/manage purchases, and Today dashboard parity.`
6. Save, review, and roll out to internal testing only.
7. Do not promote to closed, open, or production tracks during this prep.

## Tester Email Group Instructions

1. In Play Console, open `Testing > Internal testing > Testers`.
2. Create an email list or choose a Google Group.
3. Add only approved tester Google accounts.
4. Save changes.
5. Copy the internal testing opt-in link.
6. Send testers:
   - The opt-in link
   - Required Google account to use
   - Smoke-test checklist
   - Feedback channel

Tester install steps:

1. Open the opt-in link on the Android device.
2. Sign in with the same Google account that is on the tester list.
3. Accept the test.
4. Install from Google Play.
5. Launch from the app icon.

## Local APK Testing Steps

Use only for local smoke testing, not Play validation:

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
adb devices
adb install -r C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk
adb shell monkey -p com.mattnewman.studyplanner 1
adb logcat
```

Smoke-test areas:

- App launches without crash.
- Onboarding loads.
- Paywall loads.
- Restore/manage copy is Android-aware.
- PDF/photo/camera import paths open or fail gracefully.
- Manual paste fallback works.
- Notification permission path does not crash.
- Today/dashboard path loads.
- App survives close/reopen.

## Play Billing Setup Notes

Current Android billing code expects Google Play subscription products through `expo-iap` / OpenIAP.

Subscription product IDs that must exist in Play Console before meaningful billing tests:

- `com.mattnewman.studyplanner.plus.monthly`
- `com.mattnewman.studyplanner.plus.yearly`

Required Play Console setup:

1. Go to `Monetize > Products > Subscriptions`.
2. Create the product IDs exactly as above.
3. Add active base plans and pricing.
4. Activate the products.
5. Add licensed testers if using Play Billing test flows.
6. Confirm app is installed from Play internal testing before testing real purchase flows.

## Blockers Before Upload

1. Current local release AAB is debug-signed and should not be uploaded.
2. EAS Android credentials need to be confirmed or created through EAS.
3. Google Play app must be created with package `com.mattnewman.studyplanner`.
4. Play App Signing must be enabled.
5. Subscription products and base plans must exist before billing QA.
6. Privacy, data safety, content rating, and store listing tasks must be completed for internal testing review.
7. Internal tester list and opt-in link must be configured.
