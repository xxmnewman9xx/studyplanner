# Android Physical Device Smoke Report - Sprint 003

## Summary

Physical-device smoke testing could not run in this sprint because no authorized Android device was connected to adb.

Result:

- `adb` installed: PASS
- `adb` on command path used for sprint commands: PASS
- Device connected: FAIL
- Authorized device visible in `adb devices -l`: FAIL
- APK install: BLOCKED
- Runtime smoke: BLOCKED
- `adb logcat`: BLOCKED, no device available

This is an external device setup blocker. The debug APK still exists from Sprint 002:

`C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk`

## Commands Run

```powershell
$sdk = "C:\Users\xxmne\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$sdk\platform-tools;$sdk\emulator;$sdk\cmdline-tools\latest\bin;$env:Path"

adb version
adb devices -l
adb logcat -d -t 100
```

## Results

`adb version`:

```text
Android Debug Bridge version 1.0.41
Version 37.0.0-14910828
Installed as C:\Users\xxmne\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

`adb devices -l`:

```text
List of devices attached
```

No device rows were returned.

`adb logcat -d -t 100`:

Timed out because no Android device was connected.

## Required User Device Setup

On the Android phone:

1. Open `Settings`.
2. Open `About phone`.
3. Tap `Build number` seven times until Developer Options are enabled.
4. Go back to `Settings`.
5. Open `System` or search for `Developer options`.
6. Enable `USB debugging`.
7. Connect the phone with a data-capable USB cable.
8. If prompted, choose file transfer or data mode instead of charge-only mode.
9. Accept the `Allow USB debugging?` RSA prompt on the phone.

Then run:

```powershell
$sdk = "C:\Users\xxmne\AppData\Local\Android\Sdk"
$env:Path = "$sdk\platform-tools;$env:Path"
adb kill-server
adb start-server
adb devices -l
```

Expected result:

```text
List of devices attached
<serial>    device ...
```

If the device says `unauthorized`, unlock the phone and accept the RSA prompt. If no prompt appears, revoke USB debugging authorizations from Developer Options, reconnect the cable, and run `adb devices -l` again.

## Install Command For Next Run

After `adb devices -l` shows a device in `device` state:

```powershell
adb install -r "C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk"
adb shell monkey -p com.mattnewman.studyplanner 1
adb logcat -c
```

Then perform the manual smoke checklist and capture logs:

```powershell
adb logcat -d > "C:\FounderWorker\repos\StudyPlanner\android-device-smoke-logcat.txt"
```

## Smoke Checklist Status

- App launches: BLOCKED, no device
- Onboarding loads: BLOCKED
- Locked funnel behaves correctly: BLOCKED
- Paywall loads: BLOCKED
- Android-aware restore/manage copy appears: BLOCKED
- Import screen opens: BLOCKED
- Photo/camera path opens or fails gracefully: BLOCKED
- Paste fallback works: BLOCKED
- Notification permission path does not crash: BLOCKED
- Today/dashboard path loads: BLOCKED
- Logout/reset/demo/test path if available: BLOCKED
- App survives close/reopen: BLOCKED

## Likely First Runtime Checks

Once a device is available, check these before changing source:

- If the app opens to a Metro/dev-server screen, run `npx expo start` or build a release/internal distribution artifact for standalone testing.
- If install fails with `INSTALL_FAILED_VERSION_DOWNGRADE`, uninstall the existing app or increment `versionCode` only in a later intentional release versioning sprint.
- If install fails with signature mismatch, uninstall the prior debug build from the phone first.
- If billing APIs show unavailable, use a Play Store-enabled device account and Play Console license testing/internal testing later.
