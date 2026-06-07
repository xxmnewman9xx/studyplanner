# Android Play Credential Readiness Report - Sprint 004

## Summary

Recommended signing path: EAS-managed Android credentials.

Reason: this repo is Expo-managed with `eas.json` already present, the generated `android/` directory is intentionally ignored, and EAS credentials avoid committing keystore files or passwords into the repository. Manual upload keystore remains a viable fallback, but it requires more local secret handling.

No keystore was generated during this sprint. No secrets were printed, committed, or stored in reports.

## Current Signing Status

- Current debug APK: debug-signed.
- Current local release AAB: debug-signed build-path proof only.
- Current AAB upload-safe for Google Play: NO.
- Generated release signing config: `signingConfigs.debug`.
- Production/upload keystore in repo: not found.
- User-level Gradle signing properties: not found.

Current local AAB:

`C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab`

This file proves the release bundle build path works, but it must not be submitted to Google Play because it is signed with the generated debug keystore.

## Recommended Option A - EAS-Managed Credentials

Use this path for closed testing.

Commands:

```powershell
cd C:\FounderWorker\repos\StudyPlanner
npx eas login
npx eas credentials -p android
npx eas build -p android --profile production
```

When prompted:

- Platform: Android
- Application ID/package: `com.mattnewman.studyplanner`
- Credentials: EAS-managed Android credentials, unless a Play upload key already exists
- Build profile: `production`

Expected output:

- A Play-ready signed AAB produced by EAS.
- Credentials stored in Expo/EAS, not committed to this repo.

## Manual Option B - Upload Keystore

Use this only if EAS-managed credentials are not desired.

Placeholder-only keystore creation command:

```powershell
keytool -genkeypair -v -storetype PKCS12 `
  -keystore "C:\FounderWorker\secrets\studyplanner-upload-key.jks" `
  -alias "<UPLOAD_KEY_ALIAS>" `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Required secret values:

```powershell
$env:STUDYPLANNER_UPLOAD_STORE_FILE = "C:\FounderWorker\secrets\studyplanner-upload-key.jks"
$env:STUDYPLANNER_UPLOAD_KEY_ALIAS = "<UPLOAD_KEY_ALIAS>"
$env:STUDYPLANNER_UPLOAD_STORE_PASSWORD = "<UPLOAD_STORE_PASSWORD>"
$env:STUDYPLANNER_UPLOAD_KEY_PASSWORD = "<UPLOAD_KEY_PASSWORD>"
```

The generated Gradle project does not yet read these variables for `release`; a future config/plugin change would be needed before using local manual signing safely. Do not hardcode these values.

## Files That Must Never Be Committed

Do not commit:

- `*.jks`
- `*.keystore`
- `*.p12`
- `*.p8`
- `*.key`
- `*.pem`
- `.env`
- `.env.local`
- `.env*.local`
- Play service account JSON files
- Google Play upload credential exports
- Any file containing keystore passwords, aliases, or service account private keys

The current `.gitignore` already ignores common keystore and local env patterns, including `*.jks`, `*.p12`, `*.key`, `*.pem`, `.env*.local`, and `/android`.

## Play Console Setup Steps

1. Create or open the Play Console app for package `com.mattnewman.studyplanner`.
2. Configure app name: `Studyplanner: Syllabus AI`.
3. Set default language and app/category metadata.
4. Enroll in Play App Signing if not already done.
5. Use EAS-managed upload key or register the manual upload key.
6. Configure closed testing track and tester group.
7. Configure subscription products:
   - `com.mattnewman.studyplanner.plus.monthly`
   - `com.mattnewman.studyplanner.plus.yearly`
8. Add license testers for billing QA.
9. Complete data safety and privacy declarations.
10. Upload only a Play-ready signed AAB.
11. Do not submit for review until physical-device smoke and billing tests pass.

## Required Verification Before Upload

- Physical device smoke test passes.
- Paywall loads without crash.
- Restore/manage path is Android-aware.
- Google Play Billing works with tester account.
- Notification permission path does not crash.
- Import and paste fallback paths work on Android.
- `versionCode` remains `52` unless an intentional release versioning step changes it.
- Package remains `com.mattnewman.studyplanner`.

## Current Recommendation

Proceed with EAS-managed Android credentials for closed testing. Keep the current local AAB as a build-path proof only, not an upload candidate.
