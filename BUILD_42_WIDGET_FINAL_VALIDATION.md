# Build 42 Widget Final Validation

Date: 2026-06-05

## Result

PASS WITH DOCUMENTED LIMITATION

Physical Home Screen / Lock Screen placement was not completed in this environment. Per the Build 42 release policy, this is non-blocking because WidgetKit build, App Group, snapshot data, and deep-link evidence are documented.

## Verified

- WidgetKit extension target builds during `npx expo run:ios`.
- Widget bundle ID: `com.mattnewman.studyplanner.widgets`.
- App bundle ID: `com.mattnewman.studyplanner`.
- App Group: `group.com.mattnewman.studyplanner`.
- URL scheme: `studyplanner`.
- Deep link: `studyplanner://today`.
- In-app widget studio/gallery remains hidden.

## Entitlement Evidence

App entitlements:

- `ios/StudyplannerSyllabusAI/StudyplannerSyllabusAI.entitlements`
- `group.com.mattnewman.studyplanner`

Widget entitlements:

- `ios/ExpoWidgetsTarget/ExpoWidgetsTarget.entitlements`
- `group.com.mattnewman.studyplanner`

Info.plist:

- `ExpoWidgetsAppGroupIdentifier`: `group.com.mattnewman.studyplanner`
- `CFBundleURLSchemes`: `studyplanner`, `com.mattnewman.studyplanner`

## Snapshot Evidence

Simulator App Group metadata confirms:

- `MCMMetadataIdentifier`: `group.com.mattnewman.studyplanner`

Shared App Group plist contains widget timeline keys:

- `__expo_widgets_studyplanner.today_timeline`
- `__expo_widgets_studyplanner.upcoming_timeline`
- `__expo_widgets_studyplanner.week_timeline`
- `__expo_widgets_studyplanner.classProgress_timeline`

Snapshot data includes:

- `styleLabel`: `Liquid Status`
- `openURL`: `studyplanner://today`
- `headline`: `Next`, `Due`, `Health`
- `generatedAt`: `2026-06-06T01:59:04.374Z`
- Short coach copy such as `BIO 210 exam mode`
- Class and deadline data such as `Lab Report 1`, `Genetics Problem Set`, `BIO 210`

## Deep Link Evidence

Command:

`xcrun simctl openurl booted "studyplanner://today"`

Screenshot:

`qa/build42-final-gate/widget-deeplink-today.png`

## Release Risk

Low, provided TestFlight processing accepts the extension. The extension target builds and the app writes real SemesterSnapshot-derived widget timeline data to the shared App Group.
