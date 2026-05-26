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

Final current-worktree native rebuild also passed in `/tmp/studyplanner-native-final-qa.jsqQSY`:

- `npx expo prebuild --platform ios --no-install` generated the widget target.
- `pod install` completed.
- `xcodebuild` Release simulator build succeeded.
- Xcode embedded `StudyPlannerSyllabusAI.app/PlugIns/ExpoWidgetsTarget.appex`.
- Generated widget entitlements include `group.com.mattnewman.studyplanner`.

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
- iOS widget gallery opened from SpringBoard edit mode.
- Widget gallery search found `StudyPlanner: Syllabus AI`.
- `StudyPlanner Today` small preview rendered real native data.
- `StudyPlanner Today` medium preview rendered real native data.
- Small and medium StudyPlanner widgets were placed on the Home Screen.
- Home Screen widgets remained visible after terminating and relaunching the app.

Screenshots:

- `screenshots/native-release-launch.png`
- `screenshots/native-home-screen-after-install.png`
- `screenshots/native-widget-gallery-open.png`
- `screenshots/native-widget-gallery-studyplanner-search.png`
- `screenshots/native-widget-gallery-studyplanner-detail.png`
- `screenshots/native-widget-gallery-medium-preview.png`
- `screenshots/native-home-screen-small-widget-placed.png`
- `screenshots/native-home-screen-small-medium-widgets-final.png`
- `screenshots/native-release-relaunch-widget-state.png`
- `screenshots/native-home-screen-after-relaunch-small-medium-widgets.png`

## App Group Payload

The placed widgets read the App Group timeline. The observed App Group plist contains:

- `accentColor` = `#2F80ED`
- `backgroundColor` = `#101723`
- `courseCode` = `BIO 101`
- `title` = `Lab Report: Enzyme Simulation`
- `metricLabel` = `0 of 1 complete`
- `layoutLabel` = `List` for Today
- `layoutLabel` = `Compact` for Upcoming

No native configuration root cause remains for widget gallery visibility. The earlier failing repo gate was caused by `scripts/check-scenarios.mjs` reading generated `ios/ExpoWidgetsTarget/*.swift` in a repo where `ios/` is not checked in.
