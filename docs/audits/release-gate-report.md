# Release Gate Report

Agent: QA Gate Agent

## Automated Checks

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run check:localization` | PASS |
| `npm run qa:release` | PASS |
| `npm run check:activation-spine` | PASS |

## Simulator QA

- Device: booted iPhone simulator `ShiftPay Locale iPhone` (`A990F44E-2F8E-4435-8CD2-4F267BC9AFCE`).
- Fresh install reset: `xcrun simctl uninstall ... com.mattnewman.studyplanner`.
- Build/install: `npx expo run:ios -d A990F44E-2F8E-4435-8CD2-4F267BC9AFCE`.
- Result: build succeeded with `0 error(s), and 0 warning(s)` after native build number fix.
- Fresh launch log: `onboarding=false active=onboarding decision=onboarding access=onboarding`.
- Screenshot: `test-results/fresh-onboarding-build55.png`.
- Locked empty-after-onboarding log: `onboarding=true active=lockedDashboard decision=lockedDashboard access=preview_allowed`.
- Screenshot: `test-results/locked-empty-after-onboarding-build55.png`.

## QA Scenarios

| Scenario | Status | Evidence |
|---|---|---|
| A - True fresh install | PASS | Simulator reinstall + launch logs + screenshot |
| B - Fresh install, already premium | PASS automated | `resolveInitialRoute()` test proves premium cannot override onboarding; live StoreKit already-premium sandbox not exercised |
| C - Empty dashboard after onboarding | PASS automated, partial simulator | `buildSemesterSnapshot(defaultData)` returns score/dimensions `0`; locked simulator state shows no fake score; premium empty `Today` requires live entitlement or a test harness |
| D - Pending import after relaunch | PASS automated | Route truth table and Build 52 source gate verify review restoration |
| E - Restore Purchases | PASS code-gated | Restore success alert only after explicit restore action; live restore not exercised |
| F - Real semester loaded | PASS automated | Real class fixture produces health score above `0` |

## Native Build Integrity

- `app.json`: `1.0.3` (`55`).
- Xcode app/widget `CURRENT_PROJECT_VERSION`: `55`.
- Fixed prior simulator warning where widget extension was still `52`.

## Score

- Automated coverage: 9/10
- Manual coverage: 8/10
- Regression risk: 9/10
- Release confidence: 9/10

Release recommendation: release candidate after one manual pass through restore/purchase sandbox and pending-import apply on a physical device or clean simulator account.
