# Home Screen Widget Proof

Date: 2026-05-26

## Native Configuration

Validated in generated native project `/tmp/studyplanner-native-qa.MIlPZI`:

- App bundle id: `com.mattnewman.studyplanner`
- Widget extension bundle id: `com.mattnewman.studyplanner.widgets`
- App Group on app target: `group.com.mattnewman.studyplanner`
- App Group on widget target: `group.com.mattnewman.studyplanner`
- Generated Today widget exists.
- Generated Upcoming widget exists.
- Extension is embedded in `StudyPlannerSyllabusAI.app/PlugIns/ExpoWidgetsTarget.appex`.
- Release simulator build validates embedded binary successfully.
- PluginKit registration on the booted simulator lists `com.mattnewman.studyplanner.widgets(1.0.2)`.

Supported families:

- `systemSmall`
- `systemMedium`
- `accessoryCircular`
- `accessoryRectangular`
- `accessoryInline`

## Simulator Proof

Validated on simulator `StudyPlanner-QA-iPhone`:

- Release build installed.
- App launched.
- Home Screen shows installed StudyPlanner app icon.
- App Group shared container exists.
- Widget layout/timeline keys exist after app launch.
- `simctl listapps` exposes the App Group container for `com.mattnewman.studyplanner`.

Screenshots:

- `screenshots/native-release-launch.png`
- `screenshots/native-home-screen-after-install.png`

## Placement Limitation

`simctl` has no public command to add a WidgetKit widget to the Home Screen or open the iOS widget gallery at a selected app result. I validated the native configuration, built extension, embedded appex, App Group storage, and WidgetKit timeline writes. Actual drag/add placement through SpringBoard remains a manual UI step unless a separate UI automation harness drives long-press/widget-gallery gestures.

No native configuration root cause remains for widget gallery visibility. The earlier failing repo gate was caused by `scripts/check-scenarios.mjs` reading generated `ios/ExpoWidgetsTarget/*.swift` in a repo where `ios/` is not checked in.
