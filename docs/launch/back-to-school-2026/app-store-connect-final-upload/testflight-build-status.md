# TestFlight And Build Status

Checked: 2026-07-09 07:35 ET

## Current State

- Local app config targets iOS `2.0.7` build `78`.
- EAS latest finished iOS store build is `2.0.7` build `77`.
- Latest finished EAS build ID: `488aef21-f0ba-4dd6-95d8-8b6fd78b90b2`.
- Booted simulator installed app is `2.0.7` build `77`.
- `studyplanner://import` launched the installed app and landed on the localized Scan/import screen.
- Fresh EAS list check found `0` finished iOS builds for `2.0.7` build `78`.

## Blocker

Do not push build `77` to TestFlight as the final nomination binary if App Store Connect and the nomination packet are expecting build `78`.

Build `78` must be created or otherwise verified in App Store Connect before the final TestFlight handoff. Local disk is also below the native-review threshold: `522 MiB` free at the latest check.

## Evidence

- EAS build list: latest finished store build is `2.0.7 (77)`.
- Simulator launch proof: `qa/back-to-school-2026/latest-build-simulator-review/build77-launch-2026-07-09.png`.
- Deep link proof: `qa/back-to-school-2026/latest-build-simulator-review/build77-import-deeplink-2026-07-09.png`.
- Refreshed simulator launch proof: `qa/back-to-school-2026/latest-build-simulator-review/build77-launch-2026-07-09-refresh.png`.
- Refreshed deep link proof: `qa/back-to-school-2026/latest-build-simulator-review/build77-import-deeplink-2026-07-09-refresh.png`.

## Safe Next Step

Free disk to at least the native preflight threshold, create/verify iOS `2.0.7` build `78`, run the release gates, then submit that exact build ID to TestFlight with `eas submit --platform ios --id <build-78-id> --profile production --what-to-test <notes>`.
