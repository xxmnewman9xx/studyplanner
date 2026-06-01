# Final TestFlight Candidate Report

Baseline: `bc3bb32e550ab405c5b7349162345c5f0d1bb217`

Final commit: recorded in the delivery response after this report is committed.

Status: Ready for TestFlight. No release blockers remain after the copy-only blocker fixes below.

## Scope

- Loading now uses the new StudyPlanner mark and ghost skeleton planner surfaces instead of the spinner-first legacy load.
- Tracked splash/adaptive icon background is aligned to the new white-first logo asset.
- Paywall store-source copy no longer exposes internal "release manifest" language.
- Widget Studio preview headline no longer uses internal product-strategy wording.
- No parser, IAP, storage, backend, or architecture changes were made.

## Changed Files

- `App.tsx`
- `app.json`
- `src/screens/UpgradeScreen.tsx`
- `src/screens/MoreScreen.tsx`
- `localized-app-strings/core-launch-strings.json`
- `artifacts/final-testflight-candidate/contact-sheet.png`
- `artifacts/final-testflight-candidate/screenshots/*.png`

## Logo And Loading

- New logo/mark source remains `assets/app/study-planner-icon.png`.
- In-app loading uses `AppLogo` plus skeleton ghost preview cards.
- Native splash/app icon references in tracked config use `./assets/app/study-planner-icon.png`.
- Note: the ignored generated iOS asset is still named `SplashScreenLegacy`, but its visual content is the new document/check logo.

## Onboarding Audit

Onboarding is long and personalized: seven steps cover scan, review, calendar, today, classes, focus, and widgets. It uses real in-app marketing capture assets from reviewed planner data and widget snapshots. Animation is implemented through the app's native `MotionFadeUpView`/React Native `Animated` path; no `framer-motion` package was added because this is an iOS native TestFlight target, not a web runtime.

## QA Results

| Command | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run check:localization` | Passed |
| `npm run check:scenarios` | Passed |
| `npm run test:customization` | Passed |
| `npm run test:student-life-depth` | Passed |
| `npm run test:planner` | Passed |
| `npm run test:widgets` | Passed |
| `npm run test:widget-integrity` | Passed |
| `npm run check:widget-no-crop` | Passed: 130 cases, 16 local raw PNGs indexed |
| `npm run test:parser` | Passed |
| `npm run test:capture-parser` | Passed |
| `npm run test:backend-platform` | Passed |
| `npm run check:iap` | Passed: IAP readiness ready, hard-paywall configuration passed |
| iOS Release simulator build | Passed: `** BUILD SUCCEEDED **` |

## Simulator Smoke

Fresh install passed on simulator `77573299-A148-49D7-95B6-DB5855B9305A`.

Captured surfaces:

- Onboarding 1-7
- Home
- Scan / Import
- Review Inbox
- Forecast
- Classes
- Focus
- Notes
- Widget Studio
- Paywall
- Empty Today

Screenshot sheet: `artifacts/final-testflight-candidate/contact-sheet.png`

## Brand Audit

Runtime/localized app-surface grep passed for:

- `Student Life OS`
- `Life Studio`
- `seance`
- `séance`
- visible standalone `Student`
- `Release manifest`
- `The preview is the product`

Remaining matches for old terms are limited to docs/scripts or internal type names, not visible runtime UI.

Visible product name remains `StudyPlanner: Syllabus AI`.

## Widget Audit

- Widget previews and native widget snapshots are backed by the same `buildStudyPlannerWidgetSnapshots` data path.
- `npm run test:customization` passed, including class-color propagation checks.
- `npm run test:widgets` and `npm run test:widget-integrity` passed.
- `npm run check:widget-no-crop` passed across 130 cases.
- Widget Studio and paywall screenshots were refreshed after the final copy fixes.

## Reviewer Scorecards

Apple Design Director / App Store Editorial / Frontend Craft:

| Surface | RC blocker score |
|---|---:|
| Onboarding 1-7 | 10/10 |
| Home | 10/10 |
| Scan / Import | 10/10 |
| Review Inbox | 9/10 |
| Forecast | 10/10 |
| Classes | 10/10 |
| Focus | 10/10 |
| Notes | 9/10 |
| Widget Studio | 9/10 after copy fix |
| Paywall | 9/10 after copy fix |
| Empty Today | 10/10 |

Apple Sports / Apple Watch / Product Consistency:

| Area | RC blocker score |
|---|---:|
| Brand consistency | 10/10 |
| Widget preview/data consistency | 10/10 |
| Watch preview plausibility | 9/10 |
| Class-color propagation | 10/10 |
| Cross-screen product consistency | 10/10 |

Subagent notes: reviewers still see App Store-editorial polish opportunities in paywall density, Review Inbox hierarchy, Widget Studio composition, Notes depth, and watch-preview realism. Those are not TestFlight blockers and were intentionally not redesigned in this pass.

## Known Risks

- Simulator smoke cannot fully validate a real App Store restore transaction; `check:iap` confirms restore and hard-paywall configuration, and the paywall fails closed when products are unavailable.
- The native generated `ios/` project is ignored by git; tracked source of truth is `app.json` plus `assets/app/study-planner-icon.png`.
- Framer Motion was not added to the native app; onboarding uses the existing native animation abstraction.
- Existing unrelated dirty/untracked workspace files were left untouched.

## Release Blockers

None found.

Ready for TestFlight.
