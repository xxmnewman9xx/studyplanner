# Build 51 Hard Paywall Patch Report

## Files Changed

- `App.tsx`
- `app.json`
- `ios/StudyplannerSyllabusAI.xcodeproj/project.pbxproj`
- `package.json`
- `scripts/check-hard-paywall-app-gate.mjs`
- `scripts/check-build51.mjs`
- `scripts/check-iap-config.mjs`
- `scripts/check-widget-lock.mjs`
- `scripts/check-widget-integrity.mjs`
- `scripts/check-build49.ts`

## Fixes Applied

- Added `appAccessLocked(data, entitlementStatus)` as the central locked-access predicate.
- Changed entitlement unlock behavior so onboarding completion is not premium access; only active App Store entitlement plus premium app state unlocks.
- Added `routeTokensFromUrl` and `routeFromUrl` so `studyplanner` scheme text cannot substring-match `plan`.
- Removed substring deep-link routing such as `target.includes("plan")`; `studyplanner://auth` now resolves to no app route.
- Locked deep links now keep fresh users at welcome and onboarded non-entitled users at locked dashboard.
- Added `lockedWidgetData` so locked widget sync sends empty planner data, no coursework, no reminders, no imports, no notes, and no active progress.
- Added `npm run test:hard-paywall`, `test:widgets`, `test:widget-integrity`, `check:iap`, and `check:build51`.

## Diffs Summarized

- Deep links: substring routing replaced with URL token parsing.
- App gate: non-entitled users resolve to locked dashboard for app routes and do not see tabs.
- Widget sync: locked users sync zero/empty snapshots instead of active planner data.
- Build checks: Build 49 lineage check preserved and Build 51 release check added.
- Metadata: version preserved at `1.0.3`; build incremented to `51`.

## Rejected From Wrong Checkout

- No visual redesign.
- No parser rewrite.
- No OCR rewrite.
- No new dashboard cards.
- No demo data or capture fixtures.
- No unrelated app architecture from `/Users/mattnewman/work/StudyPlanner`.
