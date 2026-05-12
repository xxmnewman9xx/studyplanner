# Final Release Readiness

## Verdict

Internal release candidate, not final App Store submission yet. Core trust, widget data safety, icon polish, production no-demo proof, and IAP config checks are in materially better shape. Final external blockers are StoreKit sandbox validation and manual device/widget freshness validation.

## What Changed

- Added a central confirmed-assignment boundary and applied it to planner, insights, classes, reminders, calendar sync, and widget-facing data.
- Forced parser/API rows into Needs Check until the user accepts them.
- Preserved unreviewed rows for Check New Work while preventing them from becoming trusted due dates.
- Raised the local parser review limit and added a visible finding instead of silently dropping many assignments.
- Improved plain-language labels: Today, Add School Stuff, Check New Work, Widget Setup, Needs Check, Looks Good.
- Fixed paywall product-load recovery and added production/IAP config verification.
- Refreshed and synced the app icon.
- Captured supported simulator screenshots and a contact sheet.

## QA Summary

- `npx expo install --check`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 20/20.
- `npm run check:iap`: passed.
- `npm run verify:production`: passed.
- `npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`: passed.
- Capture WidgetKit verify: passed.
- Production WidgetKit verify: passed.

## Verdicts

- Widget verdict: pass for native small/medium; large and lock-screen are unsupported and not faked.
- IAP verdict: config/code pass; real sandbox purchase and restore still required.
- App Review verdict: safer, with external StoreKit proof still blocking final submission.
- Production no-demo-data verdict: pass from production WidgetKit payload and production config script.
- Capture-mode verdict: pass, preview data is labeled and gated by exact env flag.
- Screenshot verdict: partial pass, 18 real screenshots captured; unsupported widget sizes documented.
- App icon verdict: pass, refreshed and verified on simulator home screen.

## Docs Updated

All required docs exist and were updated for this pass: GitNexus index, evidence ledger, product truth, subagent reviews, use-case swarm, top weaknesses, feature matrix, data flow, widget review, Apple-native polish, app icon, App Review/IAP, screenshot plan, QA log, and this final readiness note.

## Remaining Release Blockers

- Validate monthly, yearly, restore, subscription expiry, and Lifetime purchase with real App Store Connect sandbox products.
- Manually place and observe the native small/medium widgets on device/simulator across refresh boundaries.
- Decide whether to implement true large/lock-screen native widgets or remove those expectations from release materials.
- Defer broad performance virtualization, date/time localization, and external calendar/reminder update reconciliation until after the trust release unless App Review testing exposes them.

## Recommended Final Build Prompt

Build a clean production archive with `EXPO_PUBLIC_STORE_CAPTURE=0`, configured App Store Connect IAP product IDs, no demo data, and the refreshed icon. Run sandbox purchase/restore tests for monthly, yearly, and Lifetime before submitting.
