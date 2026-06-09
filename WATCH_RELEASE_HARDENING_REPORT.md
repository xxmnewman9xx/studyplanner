# Watch Release Hardening Report

Date: 2026-06-01  
Baseline commit: `226c8e9`  
Final commit: recorded in delivery response after commit

## Summary

Result: pass with one documented non-blocking tooling caveat.

StudyPlanner now has a real generated watchOS app target and a real Watch WidgetKit/complication extension target. The iPhone app, iPhone WidgetKit extension, Watch app, and Watch complication extension all build at version `1.0.2` / build `32`. The Watch app was installed and captured on a real watchOS simulator, using a shared snapshot payload with the same Watch snapshot schema used by the app/widget pipeline.

## Scoped Changes

- Added `StudyPlannerWatchWidgets` to `extra.eas.build.experimental.ios.appExtensions` so EAS can truthfully provision/sync the Watch WidgetKit complication extension bundle `com.mattnewman.studyplanner.watchkitapp.widgets`.
- Added capture-only `LogBox.ignoreAllLogs(true)` behind `EXPO_PUBLIC_SIM_QA_CAPTURE=1` so App Store source captures do not show React Native dev overlays. Production/non-capture behavior still uses the existing SafeAreaView-only LogBox suppression.

No parser, IAP, storage, backend, or iPhone redesign changes were made for this pass.

## Target Audit

Targets present in the generated iOS project:

- `StudyPlannerSyllabusAI`
- `ExpoWidgetsTarget`
- `StudyPlannerWatchApp`
- `StudyPlannerWatchWidgets`

Template parity:

- `plugins/studyplanner-watch/ios/StudyPlannerWatchApp` matches generated `ios/StudyPlannerWatchApp`.
- `plugins/studyplanner-watch/ios/StudyPlannerWatchWidgets` matches generated `ios/StudyPlannerWatchWidgets`.
- `plugins/studyplanner-watch/ios/StudyPlannerSyllabusAI/StudyPlannerWatchSyncBridge.swift` matches generated `ios/StudyPlannerSyllabusAI/StudyPlannerWatchSyncBridge.swift`.

Metadata:

| Target | Bundle ID | Version | Build | Platforms | Entitlements |
| --- | --- | ---: | ---: | --- | --- |
| iOS app | `com.mattnewman.studyplanner` | `1.0.2` | `32` | iPhoneOS/iPhoneSimulator | `group.com.mattnewman.studyplanner` |
| iOS widgets | `com.mattnewman.studyplanner.widgets` | `1.0.2` | `32` | iPhoneOS/iPhoneSimulator | `group.com.mattnewman.studyplanner` |
| Watch app | `com.mattnewman.studyplanner.watchkitapp` | `1.0.2` | `32` | watchOS/watchSimulator | `group.com.mattnewman.studyplanner` |
| Watch complications | `com.mattnewman.studyplanner.watchkitapp.widgets` | `1.0.2` | `32` | watchOS/watchSimulator | `group.com.mattnewman.studyplanner` |

Watch display names:

- Watch app `CFBundleDisplayName`: `StudyPlanner`
- Watch complication extension `CFBundleDisplayName`: `StudyPlanner`

Watch icon asset catalog is present and configured as `AppIcon`.

## Data Sharing

The Watch app reads `StudyPlannerWatchSnapshot` through:

- direct app group stored data key `studyplanner.watch.snapshot.v1`
- fallback Expo widget timeline key `__expo_widgets_studyplanner.watch_timeline`
- WatchConnectivity handoff key `studyplannerWatchSnapshot`

Simulator proof used a generated `StudyPlannerWatchSnapshot` payload written into the Watch simulator preferences path for `group.com.mattnewman.studyplanner`, then launched `com.mattnewman.studyplanner.watchkitapp`. The rendered screenshots show the seeded real snapshot values:

- `Organic Chemistry Midterm`
- `7 days`
- `Start tonight`
- `Lab worksheet`
- `Calculus II`
- `Focus Window`

## Complication Truthfulness

The Watch complication extension is real and builds. It contains four WidgetKit `StaticConfiguration` complications:

- Next Due: `.accessoryInline`, `.accessoryRectangular`
- Exam Countdown: `.accessoryCircular`, `.accessoryCorner`
- Focus Window: `.accessoryRectangular`
- Semester Pulse: `.accessoryCircular`

Claim boundary: App Store copy may say Apple Watch app, Watch dashboard, and Watch complications. It should not imply Live Activities, Dynamic Island, StandBy, or Lock Screen widgets.

## App Store Claim Audit

User-facing app/localization search found no claims for:

- Live Activities
- Dynamic Island
- StandBy
- Lock Screen widgets

Allowed claims verified:

- Apple Watch app
- Watch dashboard
- Watch complications
- Home Screen widgets
- personalized widgets

## Watch UX QA

Screenshots:

- `artifacts/watch-release-hardening/2026-06-01/source/watch/01-watch-dashboard.png`
- `artifacts/watch-release-hardening/2026-06-01/source/watch/02-watch-rings.png`
- `artifacts/watch-release-hardening/2026-06-01/source/watch/03-watch-focus-pulse.png`

Scores:

| Area | Score | Notes |
| --- | ---: | --- |
| Glanceability | 9/10 | Hero answer is immediate: item, time, action. |
| Text size | 9/10 | Large typography; no clipped primary text in captured states. |
| Density | 8/10 | One dashboard with scroll; cards remain sparse. |
| Usefulness | 9/10 | Answers next due, next class, focus, and pulse without editing flows. |
| Apple-native feel | 8/10 | Native SwiftUI, rings, compact cards, complication extension. |
| Screenshot quality | 9/10 | Real watchOS simulator captures; no preview-only images. |

## Creative Capture

Source folder:

- `artifacts/watch-release-hardening/2026-06-01/`

iPhone source captures:

- Review Inbox: `source/iphone/13-review.png`
- Semester Organized: `source/iphone/17-classes.png`
- Focus: `source/iphone/18-focus.png`
- Home Screen widget preview: `source/iphone/22-widgets-week.png`
- Widget Studio: `source/iphone/52-studio-widget-customization.png`
- Home: `source/iphone/53-home-after-customization.png`
- Forecast: `source/iphone/54-forecast-after-customization.png`
- Watch support preview: `source/iphone/55-widget-watch-preview-customization.png`
- Paywall: `source/iphone/24-paywall.png`

Widget source captures:

- Current SpringBoard app install: `source/widgets/00-home-screen-current.png`
- Widget preview source: `source/widgets/01-home-widget-preview-week.png`
- Widget Studio source: `source/widgets/02-widget-studio-customization.png`
- Watch support preview source: `source/widgets/03-widget-watch-support-preview.png`

Truth boundary: this pass recaptured installed app and Watch simulator sources. It did not recapture placed SpringBoard Home Screen widgets; native Home Screen widget truth is covered by build/config/tests and earlier placement proof, while the new widget sheet is labeled as source/preview evidence.

Contact sheets:

- `contact-sheets/iphone-source-sheet.png`
- `contact-sheets/widget-source-sheet.png`
- `contact-sheets/watch-source-sheet.png`
- `contact-sheets/combined-creative-sheet.png`

## Localization

Results:

- `npm run check:localization`: passed
- Watch runtime localization key parity: passed, 10 locales / 35 keys
- Watch native `Localizable.strings` parity: passed, 30 keys
- Watch native `Localizable.strings` plist lint: passed

No English leak blocker was found in Watch top-locale strings, except the app/Apple brand names.

## QA Results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run check:localization` | Passed |
| `npm run test:widgets` | Passed |
| `npm run test:widget-integrity` | Passed |
| `npm run check:widget-no-crop` | Passed |
| `npm run check:iap` | Passed |
| iOS app simulator build | Passed |
| iOS WidgetKit extension build | Passed |
| Watch app target build | Passed |
| Watch complication extension target build | Passed |
| Watch simulator install/run/capture | Passed |

Build caveat: Xcode's inferred Watch schemes try to compile the iPhone `ExpoWidgetsTarget` under `watchsimulator` when invoked directly with `-scheme StudyPlannerWatchApp` or `-scheme StudyPlannerWatchWidgets`. The target builds pass, and the iPhone app scheme builds, embeds, and validates the Watch app and Watch complication extension. This is a tooling invocation caveat, not a shipped-product blocker.

## Remaining Blockers

None for App Store-safe Apple Watch support.

Remaining limitation:

- Fresh placed SpringBoard Home Screen widget screenshots were not recaptured in this pass. Do not present the widget source sheet as placed-widget proof.

