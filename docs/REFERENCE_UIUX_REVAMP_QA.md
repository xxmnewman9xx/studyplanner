# Reference UI/UX Revamp QA

Date: 2026-05-13
Branch: v1-4-reference-one-to-one-uiux-revamp
Starting commit: 12a560c54436117ef6d021cbf4aa1d23a0402d7c
Reference image: /Users/mattnewman/Documents/studyplanner_ui_reference.png
Screenshot root: artifacts/reference-one-to-one-revamp

## Commands Run

Setup:
- `git status`
- `git fetch origin`
- `git checkout v1-3-post-goal-aso-submission-master`
- `git pull --ff-only origin v1-3-post-goal-aso-submission-master`
- `git checkout -b v1-4-reference-one-to-one-uiux-revamp`

Baseline:
- `npm run typecheck` - passed
- `npm run test` - passed
- `npm run verify:production` - passed

Final:
- `npm run typecheck` - passed
- `npm run test` - passed, 57/57 tests
- `npm run check:iap` - passed
- `npm run verify:production` - passed
- `npm run audit:storekit` - passed source audit with expected external sandbox-proof warning
- `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` - passed build/install/launch and shared widget payload inspection
- `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` - passed build/install/launch and shared widget payload inspection
- `find artifacts/reference-one-to-one-revamp -iname '*.png' | sort`
- `find artifacts/reference-one-to-one-revamp -iname '*.png' | wc -l` - 34

Capture:
- `EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`
- `xcrun simctl openurl ... studyplanner://capture?...`
- `xcrun simctl io ... screenshot ...`

## Screenshot Paths

Core:
- artifacts/reference-one-to-one-revamp/01-onboarding-reference.png
- artifacts/reference-one-to-one-revamp/02-today-reference.png
- artifacts/reference-one-to-one-revamp/03-scan-reference.png
- artifacts/reference-one-to-one-revamp/04-found-work-reference.png
- artifacts/reference-one-to-one-revamp/05-calendar-reference.png
- artifacts/reference-one-to-one-revamp/06-week-plan-reference.png
- artifacts/reference-one-to-one-revamp/07-classes-reference.png
- artifacts/reference-one-to-one-revamp/08-class-detail-reference.png
- artifacts/reference-one-to-one-revamp/09-assignment-detail-reference.png
- artifacts/reference-one-to-one-revamp/10-widget-studio-reference.png
- artifacts/reference-one-to-one-revamp/11-theme-customization-reference.png
- artifacts/reference-one-to-one-revamp/12-paywall-reference.png

Widgets and themes:
- artifacts/reference-one-to-one-revamp/13-widget-due-next.png
- artifacts/reference-one-to-one-revamp/14-widget-today.png
- artifacts/reference-one-to-one-revamp/15-widget-needs-check.png
- artifacts/reference-one-to-one-revamp/16-widget-week.png
- artifacts/reference-one-to-one-revamp/17-widget-class-focus.png
- artifacts/reference-one-to-one-revamp/18-widget-empty.png
- artifacts/reference-one-to-one-revamp/19-theme-sunset.png
- artifacts/reference-one-to-one-revamp/20-theme-ocean.png
- artifacts/reference-one-to-one-revamp/21-theme-forest.png
- artifacts/reference-one-to-one-revamp/22-theme-lavender.png
- artifacts/reference-one-to-one-revamp/23-theme-midnight.png
- artifacts/reference-one-to-one-revamp/24-theme-candy.png
- artifacts/reference-one-to-one-revamp/25-theme-minimal.png
- artifacts/reference-one-to-one-revamp/26-theme-create-your-own.png

Dark mode and iPad:
- artifacts/reference-one-to-one-revamp/27-dark-today.png
- artifacts/reference-one-to-one-revamp/28-dark-scan.png
- artifacts/reference-one-to-one-revamp/29-dark-calendar.png
- artifacts/reference-one-to-one-revamp/30-dark-widget-studio.png
- artifacts/reference-one-to-one-revamp/31-dark-widget-today.png
- artifacts/reference-one-to-one-revamp/32-ipad-today.png
- artifacts/reference-one-to-one-revamp/33-ipad-calendar.png
- artifacts/reference-one-to-one-revamp/34-ipad-widget-studio.png

Manifest:
- artifacts/reference-one-to-one-revamp/manifest.json

## QA Notes

Production mode status: passed `npm run verify:production`; capture-only deep link/theme/widget controls stay gated by `EXPO_PUBLIC_STORE_CAPTURE=1`.

IAP status: `npm run check:iap` and `npm run audit:storekit` passed. StoreKit sandbox transaction proof remains an external/manual proof item and was not faked.

Widget status: supported small and medium widget previews were captured. WidgetKit build/install checks passed in capture and production modes. Native Home Screen placement was not manually captured in this pass, so the final screenshot set labels widget images as Widget Studio previews.

Parser status: duplicate and no-date parser tests were added. Long syllabus copy is honest, and possible work still requires review before import. True page-by-page chunk provenance for an 80-page syllabus remains future hardening.

Visual status: major screens are now much closer to the reference: bright cards, simple loop language, preview-first Widget Studio, stronger theme naming, better dark-mode surfaces, and readable widget due/icon text. The output is raw app screenshots, not a reference comparison composite.

Remaining visual issues: iPad is improved and intentionally scoped, but it is not a full multi-panel redesign of every iPad surface. Bottom navigation remains visible in raw captures because these are real simulator screens.

Remaining functional issues: native widget refresh timing still depends on iOS, and manual Home Screen widget placement is still recommended before App Store submission.

Missing/skipped screenshots:
- `35-reference-comparison-notes.png` skipped to keep output raw-only.
- Native Home Screen widget placement screenshots skipped; Widget Studio previews and WidgetKit verification used instead.
- Unsupported large and lock-screen widget screenshots intentionally excluded.

