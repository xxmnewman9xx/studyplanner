# Build 49 TestFlight Submission

## Status
PASS - Submitted to App Store Connect/TestFlight.

## Release
- App: Studyplanner: Syllabus AI
- Version: `1.0.3`
- Build: `49`
- Bundle: `com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- Apple Team ID: `5JN35MJ3QD`
- URL scheme: `studyplanner`
- ASC App ID: `6766181202`

## Final Verification
All final verification commands passed:

```sh
npm run typecheck
npm run test:intelligence
npm run test:semester
npm run test:narrative
npm run test:syllabus-stress
npm run test:notes-stress
npm run test:global-syllabus
npm run test:global-notes
npm run check:build48
npm run check:build49
npx expo config --type public
npx expo-doctor
npx expo prebuild -p ios --no-install
npx pod-install ios
```

Verification log:

```text
qa/build49-final-verification.log
```

## Build Commands
Cloud EAS was attempted first:

```sh
npx eas-cli@latest build -p ios --profile production --non-interactive --wait
```

Cloud result:

```text
Blocked by iOS build quota on the Free plan. Quota resets on Wed Jul 01 2026.
```

Local EAS production build was then run with remote App Store credentials:

```sh
npx eas-cli@latest build -p ios --profile production --local --non-interactive
```

Local build result:

```text
Build successful
```

Build log:

```text
qa/build49-eas-local-build.log
```

## IPA
- IPA path: `/Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai/build-1780768636822.ipa`
- Size: 15.9 MB
- SHA-256: `1fd50375c6cc4a383118a8232b087904c4cd0cdbd89ec73bd6a2f24c791a81fb`

SHA log:

```text
qa/build49-ipa-sha256.txt
```

## Submission Command
Submitted without `--what-to-test`:

```sh
npx eas-cli@latest submit -p ios --profile production --path build-1780768636822.ipa --non-interactive
```

Submission log:

```text
qa/build49-eas-submit.log
```

## Submission Result
- EAS submission ID: `f8c34f84-d141-47cb-9869-8f44fbc55668`
- Submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/f8c34f84-d141-47cb-9869-8f44fbc55668`
- TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- ASC/TestFlight processing status: Uploaded successfully; Apple processing in progress.

EAS output:

```text
Submitted your app to Apple App Store Connect!
Your binary has been successfully uploaded to App Store Connect.
It is now being processed by Apple.
```

## Warnings And Notes
- Cloud EAS build quota was exhausted, so the signed local EAS fallback was used.
- Initial cloud upload failed once from local disk pressure because generated Xcode build output was present in the project. Generated build caches were excluded/moved and `.easignore` now excludes `ios/build-signed-sim/`.
- EAS warned that `ios.bundleIdentifier` in `app.json` is ignored because the native `ios` directory exists; native bundle IDs matched the expected release IDs.
- Local build used remote App Store credentials for both targets:
  - `com.mattnewman.studyplanner`
  - `com.mattnewman.studyplanner.widgets`
- NPM emitted peer/deprecation/audit warnings during local build dependency install.
- `NODE_ENV` was not specified during local build; Expo proceeded without mode-specific `.env`.
- RNSVG prebuilt xcframework was unavailable; it built from source.
- CocoaPods emitted standard script-phase/deprecation notices.
- Xcode emitted a duplicate library warning for `-lc++`.

No warning blocked the archive, export, or App Store Connect upload.

## Widget QA
Physical homescreen/lockscreen widget QA is deferred to the signed TestFlight install on a real iPhone.

Manual checklist:

```text
BUILD_49_POST_UPLOAD_WIDGET_QA.md
```

## Release Rule
No entitlement = locked.

Preview value is allowed. Product access is paid.
