# StudyPlanner Android EAS Build Report

Date: 2026-06-07
Branch: `studyplanner-android-sprint-001`

## EAS Setup Verification

| Check | Result |
| --- | --- |
| Global `eas` on PATH | Not installed on PATH |
| EAS CLI fallback | `npx eas-cli` |
| EAS CLI version | `eas-cli/20.1.0` |
| EAS account | `xxmnewman9xx` |
| EAS email | `xxmnewman9xx@gmail.com` |
| `eas build:configure` | Plain command required an interactive platform prompt; `npx eas-cli build:configure -p android` passed |
| EAS project ID | `69335c75-753e-424e-8a76-c8bd2455a112` |

No EAS login was required. If this needs to be repeated on a fresh machine, run:

```powershell
npx eas-cli login
```

## Android Identity

| Item | Value |
| --- | --- |
| App name | `Studyplanner: Syllabus AI` |
| Android package | `com.mattnewman.studyplanner` |
| Version name | `1.0.3` |
| Version code | `52` |
| EAS build profile | `production` |
| Distribution | `store` |
| Android output type | `app-bundle` |

## Configuration Change

Updated `eas.json` so the production Android build explicitly creates an Android App Bundle:

```json
"android": {
  "buildType": "app-bundle"
}
```

This is configuration only. No credentials or secrets were committed.

## Pre-Build Checks

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run check:iap` | Pass |
| `npm run check:build52` | Pass |

## EAS Build Result

Command:

```powershell
npx eas-cli build --platform android --profile production --non-interactive --wait --json
```

Result:

| Item | Value |
| --- | --- |
| Build status | `FINISHED` |
| Build ID | `e342624f-9f34-44b1-a98f-960f141a4fd2` |
| Build page | `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/builds/e342624f-9f34-44b1-a98f-960f141a4fd2` |
| Artifact URL | `https://expo.dev/artifacts/eas/u4DL4BfXL7se8A2859hkbA.aab` |
| Local downloaded AAB | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` |
| Local AAB size | 64,161,392 bytes |
| Local AAB SHA-256 | `E791908274B0692555D9784BD1AA531C4AE7EDF82278CA95BC493191A1560C03` |
| Build git commit | `ee9d023001a686288c6a949a3cf112bf8eeefba0` |
| Build git message | `Configure EAS Android production bundle` |
| SDK version | `56.0.0` |
| App version | `1.0.3` |
| Build version | `52` |
| Distribution | `STORE` |

EAS credential status from build output:

- `Using remote Android credentials (Expo server)`
- `Created keystore`

No keystore, password, alias, private key, or credential file was printed or committed.

## Artifact Verification

Downloaded artifact:

```text
C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab
```

Verification command:

```powershell
jarsigner -verify C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab
```

Result:

- `jar verified`
- Warnings note a self-signed/untrusted upload-signing certificate chain and no timestamp. This is expected for an Android upload key and does not expose secrets.

## Upload Readiness

The EAS-produced AAB is the upload-safe candidate for Google Play internal testing.

Do not upload the older local Gradle AAB at:

```text
C:\FounderWorker\repos\StudyPlanner\android\app\build\outputs\bundle\release\app-release.aab
```

That local Gradle AAB was previously debug-signed and should remain a local build-path proof only.
