# Android Emulator Smoke Report - Sprint 002

## Summary

The Android debug APK builds successfully, but emulator smoke testing could not complete because the Windows emulator could not boot a usable device in this session.

Result:

- APK install: BLOCKED
- App launch: BLOCKED
- Runtime smoke checklist: BLOCKED
- Root cause: external Windows emulator/hypervisor execution issue, not an app compile issue

## AVD Created

- Name: `StudyPlanner_API_36_Play`
- Path: `C:\Users\xxmne\.android\avd\StudyPlanner_API_36_Play.avd`
- Target: Google Play API 36
- ABI: `x86_64`
- Device: Pixel 6
- System image: `system-images;android-36;google_apis_playstore;x86_64`

## Emulator Commands Attempted

Hardware-accelerated headless launch:

```powershell
emulator -avd StudyPlanner_API_36_Play -no-window -no-audio -no-boot-anim -no-snapshot-load -no-snapshot-save -gpu swiftshader_indirect -ports 5554,5555 -verbose
```

Software-acceleration fallback:

```powershell
emulator -avd StudyPlanner_API_36_Play -no-window -no-audio -no-boot-anim -no-snapshot-load -no-snapshot-save -gpu swiftshader_indirect -accel off -ports 5554,5555 -verbose
```

## Findings

`emulator -accel-check` reports:

```text
WHPX(10.0.26200) is installed and usable.
```

The hardware-accelerated emulator launch failed with:

```text
WHPX: Failed to setup partition, hr=80070005
failed to initialize WHPX: Invalid argument
```

The software fallback launched emulator/qemu processes, but adb stayed:

```text
emulator-5554 offline
```

The device remained offline for the full bounded wait and never reached:

```text
sys.boot_completed=1
```

The stalled emulator/qemu processes were stopped after the test.

## Smoke Checklist

- App opens without crash: BLOCKED, no booted emulator/device
- Onboarding loads: BLOCKED
- Paywall loads: BLOCKED
- Restore/manage copy is Android-aware: BLOCKED at runtime; source/build checks pass
- Import screen opens: BLOCKED
- Camera/photo import path does not crash: BLOCKED
- Manual paste fallback works: BLOCKED
- Notification permission/channel does not crash: BLOCKED
- Today/dashboard path loads after demo/test state: BLOCKED

## Exact Next Smoke Commands After Host Fix

```powershell
$sdk = "C:\Users\xxmne\AppData\Local\Android\Sdk"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$sdk\platform-tools;$sdk\emulator;$sdk\cmdline-tools\latest\bin;$env:Path"

emulator -accel-check
emulator -avd StudyPlanner_API_36_Play -no-snapshot-load
adb wait-for-device
adb shell getprop sys.boot_completed

adb install -r "C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\apk\debug\app-debug.apk"
adb shell monkey -p com.mattnewman.studyplanner 1
adb logcat -d | Select-String -Pattern "FATAL EXCEPTION|AndroidRuntime|com.mattnewman.studyplanner"
```

## Host Remediation

Run as Administrator, then reboot:

```powershell
dism /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart
dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
bcdedit /set hypervisorlaunchtype auto
shutdown /r /t 0
```

Also verify:

- Hardware virtualization is enabled in BIOS/UEFI.
- If Windows is running inside a VM, nested virtualization is enabled by the host.
- Security policy is not blocking WHPX partition creation for the user session.

## Runtime Risk After Emulator Fix

The most likely first runtime issue is not compilation; it is whether the debug APK expects a Metro server or contains a usable embedded bundle for direct launch. If launch shows a Metro/dev-server screen, run `npx expo start` or `npx expo run:android` for interactive debug validation.
