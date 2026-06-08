# Watch App Implementation Report

Date: 2026-06-01

## Targets Added

- `StudyPlannerWatchApp`: native watchOS SwiftUI app target.
- `StudyPlannerWatchWidgets`: WidgetKit watchOS complication extension.
- `StudyPlannerWatchSyncBridge`: iPhone-side WatchConnectivity bridge.
- `plugins/with-studyplanner-watch.js`: tracked Expo config plugin that recreates the watchOS targets/sources during iOS prebuild because `/ios` is ignored in this repo.

## Data Sharing Approach

- Reused the existing widget snapshot pipeline in `src/services/widgetSnapshot.ts`.
- Added `buildStudyPlannerWatchSnapshot()` as a watch-specific summary on top of the existing widget snapshots without changing the widget snapshot contract.
- Added a hidden Expo widget bridge kind, `studyplanner.watch`, so the same App Group storage path can carry watch summary state.
- Added iPhone-to-Watch sync with WatchConnectivity. The iPhone bridge reads the App Group widget snapshot and sends the latest watch snapshot to watchOS application context.
- The Watch app also reads App Group data directly as a fallback through `StudyPlannerWatchSnapshotStore`.

## Watch UX

- One dashboard screen only.
- Hero answers “What matters next?”
- Rings: Semester, Focus, Today.
- Cards: Next Due, Next Class, Focus Window.
- Native watchOS SwiftUI, large text, minimal cards, no editing/settings/dense lists.
- UI strings are localized through Swift `Localizable.strings` plus runtime snapshot localization; app name remains `StudyPlanner`.

## Screenshots

- Watch dashboard: `artifacts/watch-app/watch-dashboard.png`
- Watch next due: `artifacts/watch-app/watch-next-due.png`
- Watch focus card: `artifacts/watch-app/watch-focus-semester-pulse.png`
- Watch semester/focus/today rings: `artifacts/watch-app/watch-semester-pulse-rings.png`
- iPhone Widget Studio showing Apple Watch saved widgets: `artifacts/watch-app/iphone-widget-studio-watch-support.png`

All Watch screenshots were captured from `ShiftPay Locale Watch` watchOS 26.5 simulator after installing and launching `StudyPlannerWatchApp.app`. They are not SwiftUI previews.

## QA Results

- `npm run typecheck`: passed.
- `npm run check:localization`: passed.
- `npm run test:widgets`: passed.
- `npm run test:widget-integrity`: passed.
- `npm run check:widget-no-crop`: passed.
- `npm run check:iap`: passed.
- `xcodebuild -project ios/StudyPlannerSyllabusAI.xcodeproj -target StudyPlannerWatchApp -configuration Debug -sdk watchsimulator build`: passed.
- `xcodebuild -project ios/StudyPlannerSyllabusAI.xcodeproj -target StudyPlannerWatchWidgets -configuration Debug -sdk watchsimulator build`: passed.
- `xcodebuild -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme StudyPlannerSyllabusAI -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build/DerivedData-iOS CODE_SIGNING_ALLOWED=NO build`: passed.
- `xcodebuild -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme ExpoWidgetsTarget -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build/DerivedData-Widget CODE_SIGNING_ALLOWED=NO build`: passed.

## Simulator Proof

- Installed watch app:
  - Device: `ShiftPay Locale Watch` (`846758BF-5FA8-4EB2-90EB-592A1409E923`)
  - Bundle: `com.mattnewman.studyplanner.watchkitapp`
- Captured screenshots with `xcrun simctl io ... screenshot`.
- Seeded the simulator App Group with the same JSON snapshot schema the app receives from the iPhone bridge so the Watch UI rendered real shared-summary data rather than static preview content.
- Captured iPhone Widget Studio on `StudyPlanner QA Vertical` (`77573299-A148-49D7-95B6-DB5855B9305A`) using the repo’s deterministic capture route plus a real simulator screenshot.

## Limitations

- The Watch app screen and WidgetKit complication extension build successfully. I did not capture a Watch face complication gallery screenshot in this pass.
- Real device provisioning/App Store Connect validation still needs a signed archive pass with the Watch app bundle ID and Watch complication extension bundle ID.
- The local `/ios` project was updated and build-verified, but the durable source of truth is the tracked Expo config plugin because `/ios` is intentionally ignored.

## App Store Metadata Implications

- It is now accurate to mention a real Apple Watch app after this target ships.
- It is accurate to mention built Watch complications only if release metadata is paired with real complication screenshots or clearly scopes the claim to included complication support.
- Do not reuse old “preview-only” Watch copy. Widget Studio can say Apple Watch once the real Watch target is present.
