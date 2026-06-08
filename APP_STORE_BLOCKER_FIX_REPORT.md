# App Store Blocker Fix Report

Date: 2026-06-01  
Build under review: StudyPlanner: Syllabus AI 1.0.2 (32)  
Evidence source: `AppStore/Build32ReadinessCapture-2026-06-01/` plus fresh blocker-fix captures from the rebuilt Release simulator install.

## Verdict

Ready to submit for the blocker list in this pass.

All listed submission blockers were fixed and re-verified against a fresh Release simulator build/install of Build 32. No remaining blockers are known from the requested scope.

## Blockers Fixed

| Blocker | Result | Evidence |
| --- | --- | --- |
| Build/version mismatch | Fixed | `app.json`, native app plist, project build settings, installed app, and installed widget extension all report `1.0.2 (32)`. |
| Unsupported Watch/Lock Screen/StandBy/Live Activities/Dynamic Island claims | Fixed | Visible wording was softened to real Home Screen widget/previews and local adaptation. Final unsupported-claim scan returned no matches for the blocker phrases. |
| Runtime English localization leaks | Fixed for blocker surfaces | Home, Forecast, Classes, Focus, Notes, Widget Studio, and Paywall now render localized UI copy instead of raw internal student-life recommendations across supported locales. |
| Paywall clipping | Fixed/verified | Fresh English, German, and Arabic Paywall scroll captures show actions and plan content without the prior blocked capture clipping. |
| Focus capture clipping | Fixed/verified | Fresh English, German, and Arabic Focus scroll captures show the timer/action area and notes block without the prior clipped capture state. |

## Version / Build Verification

Source:

- `app.json`: `1.0.2`, build `32`
- `ios/StudyPlannerSyllabusAI/Info.plist`: `CFBundleShortVersionString = 1.0.2`, `CFBundleVersion = 32`
- `ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj`: app and widget targets use `MARKETING_VERSION = 1.0.2`, `CURRENT_PROJECT_VERSION = 32`

Installed Release simulator artifact:

- App bundle `com.mattnewman.studyplanner`: `1.0.2 (32)`
- Widget extension `com.mattnewman.studyplanner.widgets`: `1.0.2 (32)`
- Device: `StudyPlanner QA Vertical`, iOS Simulator 26.5

## Fresh Screenshots

Updated contact sheet:

- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/contact-sheet.png`

Manifest:

- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/manifest.json`

Captured real Release UI:

- `en-US`: Home, Classes, Forecast, Widget Studio, Focus top, Focus scroll, Paywall top, Paywall scroll
- `de`: Widget Studio, Focus scroll, Paywall scroll
- `ar`: Widget Studio, Focus scroll, Paywall scroll

## QA Results

| Gate | Result |
| --- | --- |
| `npm run check:localization` | Pass: runtime localization completeness gate passed |
| `npm run typecheck` | Pass |
| `npm run check:scenarios` | Pass: StudyPlanner golden scenario gates passed |
| `npm run check:iap` | Pass: IAP readiness ready; hard-paywall configuration passed |
| `npm run test:widgets` | Pass: widget snapshot gates passed |
| `npm run test:widget-integrity` | Pass: widget persistence and integrity gates passed |
| `npm run check:widget-no-crop` | Pass: 130 cases, 16 local raw PNGs indexed |
| Unsupported claim scan | Pass: no blocker phrases found |
| iOS Release simulator build | Pass: workspace Release build succeeded |
| iOS Release simulator install | Pass |

## Exact Changed Files

Source/native metadata and UI:

- `ios/StudyPlannerSyllabusAI/Info.plist`
- `ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj`
- `App.tsx`
- `localized-app-strings/core-launch-strings.json`
- `src/components/StudyPlannerAppleBoard.tsx`
- `src/customization.ts`
- `src/logic/studentLifeDepth.ts`
- `src/logic/studentLifeCopy.ts`
- `src/screens/CoursesScreen.tsx`
- `src/screens/FocusScreen.tsx`
- `src/screens/MoreScreen.tsx`
- `src/screens/NotesScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `src/screens/UpgradeScreen.tsx`

Fresh blocker evidence:

- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/contact-sheet.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/manifest.json`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/10-home-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/11-classes-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/14-forecast-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/15-widget-studio-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/17-focus-top-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/17-focus-scroll-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/19-paywall-top-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/en-US/19-paywall-scroll-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/de/15-widget-studio-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/de/17-focus-scroll-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/de/19-paywall-scroll-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/ar/15-widget-studio-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/ar/17-focus-scroll-proof.png`
- `AppStore/Build32ReadinessCapture-2026-06-01/blocker-fix/screenshots/ar/19-paywall-scroll-proof.png`

QA artifacts regenerated by the widget gates:

- `qa/scorecards/final-widget-review.json`
- `qa/scorecards/final-widget-scorecards.json`
- `qa/scorecards/widget-repair-scorecards.json`
- `qa/screenshots/final-widget-screenshot-manifest.json`
- `qa/screenshots/screenshot-manifest.json`
- `qa/screenshots/widget-repair-screenshot-manifest.json`
- `qa/widgets/widget-data-truth.json`
- `qa/widgets/widget-layout-matrix.json`
- `qa/widgets/widget-no-crop-validation.json`
- `qa/widgets/widget-truth-map.json`

## Remaining Blockers

None in the requested blocker scope.

Non-blocking follow-up: confirm App Store Connect subscription product display names/prices are localized in App Store Connect before broad localized marketing, because simulator StoreKit product titles still include the StudyPlanner product name as configured store metadata.
