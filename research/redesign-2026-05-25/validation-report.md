# Validation Report

Date: 2026-05-25

## Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run check:iap` | Pass |
| `npm run test:widgets` | Pass |
| `npm run check:scenarios` | Pass |
| `npm run test:planner` | Pass |
| `npm run test:parser` | Pass |
| `npm run test:parser-endpoint` | Pass |
| `npm run test:quick-homework` | Pass |
| `EXPO_PUBLIC_SIM_QA_CAPTURE=1 npx expo run:ios --configuration Release --device "StudyPlanner-QA-iPhone"` | Pass: Release build succeeded with 0 errors, 2 simulator signing/stripping warnings |
| `STUDYPLANNER_SIM_CAPTURE_WAIT_MS=4500 node scripts/sim-qa-product-depth.mjs research/redesign-2026-05-25/after-screenshots` | Pass: 22 deterministic native screenshots captured |
| `npx gitnexus detect-changes --repo studyplanner --scope staged` | Pass with expected CRITICAL aggregate risk: 28 staged indexed files, 58 changed symbols, 54 affected flows |

## Screenshot Artifacts

- Before: `research/redesign-2026-05-25/before-screenshots/`
- After: `research/redesign-2026-05-25/after-screenshots/`
- Native contact sheet: `research/redesign-2026-05-25/native-contact-sheet.png`
- Before contact sheet: `research/redesign-2026-05-25/before-contact-sheet.png`

## Important QA Notes

The first Release rebuild was made without `EXPO_PUBLIC_SIM_QA_CAPTURE=1`, so deterministic routing opened the hard paywall for every target. The app was rebuilt with the capture flag enabled and the after screenshots were replaced. The final `native-contact-sheet.png` shows the expected onboarding, Today, Scan, Review, Calendar, Classes, Focus, Widgets, and Plus routes.

The final Release rebuild happened after the Plus action ordering patch. The `24-plus` screenshot confirms Restore/legal/actions stay visible when products are unavailable.

## GitNexus Risk Note

GitNexus marks the staged redesign as CRITICAL at aggregate scope because it touches app routing, Today, scan/review, calendar, widgets, parser truth, and widget snapshot flows. Individual pre-edit impact checks for the edited screens were LOW; the shared widget snapshot functions were HIGH/CRITICAL and were limited to truthful label changes rather than structural data rewrites.
