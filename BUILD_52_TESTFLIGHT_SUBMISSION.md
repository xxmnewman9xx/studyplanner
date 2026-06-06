# Build 52 TestFlight Submission

## Status

PASS - Build 52 was submitted to App Store Connect/TestFlight.

## Artifact

- IPA path: `/Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai/build-52-artifacts/studyplanner-build52.ipa`
- SHA-256: `a64e228cfd2c430e4bf94cc1df6eb2fcc99474ce503b36220e907c8c1cb429fe`
- App version: `1.0.3`
- iOS build number: `52`
- App bundle: `com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- Apple Team: `5JN35MJ3QD`
- ASC App ID: `6766181202`

## Build

Cloud EAS build was attempted first:

```sh
npx eas-cli@latest build -p ios --profile production --non-interactive --wait
```

Result: blocked by Free-plan iOS build quota.

Local EAS production build was then run with remote App Store credentials:

```sh
mkdir -p build-52-artifacts && npx eas-cli@latest build -p ios --profile production --local --non-interactive --output "$PWD/build-52-artifacts/studyplanner-build52.ipa"
```

Result: PASS. IPA exported to `build-52-artifacts/studyplanner-build52.ipa`.

Build warnings:

- Duplicate library warning for `-lc++`.
- `NODE_ENV` was not specified; EAS continued without mode-specific `.env` loading.
- `react-dom@19.2.7` peer override warning against React `19.2.3`.
- `uuid@3.4.0` deprecation warning from dependency tree.
- `npm audit` reported 10 moderate findings.
- RNSVG prebuilt package was unavailable and built from source.
- CocoaPods/Xcode script phase notices were emitted.

No warning blocked archive, signing, or IPA export.

## Submission

Submission command:

```sh
npx eas-cli@latest submit -p ios --profile production --path build-52-artifacts/studyplanner-build52.ipa --non-interactive
```

Result: PASS.

- EAS build ID: not applicable; local EAS build was used after cloud quota block.
- EAS submission ID: `d4aeef5f-9181-46f7-909e-86b360b500a4`
- Submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/d4aeef5f-9181-46f7-909e-86b360b500a4`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- ASC/TestFlight status: uploaded successfully to App Store Connect; Apple processing pending/completing asynchronously.

Submission warnings:

- `ios.bundleIdentifier` in `app.json` was ignored because the native `ios` directory is present; EAS used the native bundle identifier.

No `--what-to-test` flag was used.

