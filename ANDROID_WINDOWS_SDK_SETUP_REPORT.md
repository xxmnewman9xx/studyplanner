# Android Windows SDK Setup Report - Sprint 002

## Environment

- Repo: `C:\FounderWorker\repos\StudyPlanner`
- Branch: `studyplanner-android-sprint-001`
- Baseline commit at start: `4d039f70f6a41d654ddcc9f99d5e6d3dbaa23aff`
- Windows SDK target path: `C:\Users\xxmne\AppData\Local\Android\Sdk`
- Java: Microsoft OpenJDK `17.0.19`
- Node: `v24.14.0`
- npm: `11.9.0`

## Initial Detection

- Android Studio: not found in the standard Program Files locations or registry checks used during intake.
- Existing Android SDK: not found before setup.
- `ANDROID_HOME`: empty before setup.
- `ANDROID_SDK_ROOT`: empty before setup.
- `adb`: not found before setup.
- `emulator`: not found before setup.
- `sdkmanager`: not found before setup.
- `avdmanager`: not found before setup.
- Gradle CLI: no global Gradle found; project uses the generated Gradle wrapper.

## Installed SDK Components

Installed through Android command-line tools into:

`C:\Users\xxmne\AppData\Local\Android\Sdk`

Installed packages:

- `cmdline-tools;latest` version `20.0`
- `platform-tools` version `37.0.0`
- `emulator` version `36.6.11`
- `platforms;android-36`
- `build-tools;36.0.0`
- `build-tools;35.0.0` auto-installed by Gradle during debug build
- `ndk;27.1.12297006` auto-installed by Gradle during `clean`
- `cmake;3.22.1` auto-installed by Gradle during `assembleDebug`
- `system-images;android-36;google_apis;x86_64`
- `system-images;android-36;google_apis_playstore;x86_64`

The command-line tools zip initially produced a duplicate `cmdline-tools\latest-2` metadata location. The duplicate was inspected, confirmed to be the same `20.0` revision, normalized into `cmdline-tools\latest`, and the SDK now reports `cmdline-tools;latest` at the standard path with no location warning.

## Current Tool Versions

- `adb`: Android Debug Bridge `1.0.41`, version `37.0.0-14910828`
- `emulator`: Android Emulator `36.6.11.0`
- `sdkmanager`: `20.0`
- Java runtime/compiler: Microsoft OpenJDK `17.0.19`
- Gradle wrapper: Gradle `9.3.1` from generated Android project

Gradle compatibility is acceptable for this Sprint 002 debug build. Gradle reports deprecation warnings that will matter before Gradle 10, but they are not build blockers today.

## Local Environment Used For Commands

The current shell commands were run with:

```powershell
$env:ANDROID_HOME = "C:\Users\xxmne\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\xxmne\AppData\Local\Android\Sdk"
$env:Path = "C:\Users\xxmne\AppData\Local\Android\Sdk\platform-tools;C:\Users\xxmne\AppData\Local\Android\Sdk\emulator;C:\Users\xxmne\AppData\Local\Android\Sdk\cmdline-tools\latest\bin;$env:Path"
```

## Permanent Setup Steps

Run these in a normal PowerShell session, then open a new terminal:

```powershell
$sdk = "C:\Users\xxmne\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdk, "User")

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$entries = @(
  "$sdk\platform-tools",
  "$sdk\emulator",
  "$sdk\cmdline-tools\latest\bin"
)
foreach ($entry in $entries) {
  if ($userPath -notlike "*$entry*") {
    $userPath = "$entry;$userPath"
  }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")
```

Then verify:

```powershell
adb version
emulator -version
sdkmanager --list_installed
```

## Emulator Setup

Created AVD:

- Name: `StudyPlanner_API_36_Play`
- Path: `C:\Users\xxmne\.android\avd\StudyPlanner_API_36_Play.avd`
- Target: Google Play API 36
- ABI: `x86_64`
- Device profile: `pixel_6`

## Remaining SDK/Host Issue

The SDK is installed and the debug APK builds. Emulator execution is blocked by Windows hypervisor access:

```text
WHPX: Failed to setup partition, hr=80070005
failed to initialize WHPX: Invalid argument
```

`emulator -accel-check` reports WHPX is installed and usable, but QEMU cannot initialize the accelerated partition from this session. A software fallback launch with `-accel off` started the emulator process but the device stayed `offline` for the full bounded wait.

Recommended host fix before the next emulator run:

```powershell
# Run as Administrator, then reboot.
dism /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart
dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
bcdedit /set hypervisorlaunchtype auto
shutdown /r /t 0
```

Also confirm hardware virtualization is enabled in BIOS/UEFI. If this Windows install is itself inside a VM, nested virtualization must be enabled by the host.
