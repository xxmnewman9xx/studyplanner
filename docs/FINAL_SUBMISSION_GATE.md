# Final Submission Gate

Date: 2026-05-12
Branch: `v1-1-widget-command-center`
Baseline commit: `92f4cefbd0f82ca4d06050bd3ad34438d7cbface`

## Summary

This validation pass found and fixed one submission-scope issue: the app still exposed Lock Screen widget preview controls even though native Lock Screen widgets are out of scope. The UI and widget preferences now expose only the supported small and medium native widget sizes.

## Commands

| Command | Result |
| --- | --- |
| `git fetch origin v1-1-widget-command-center` | Passed. |
| `git rev-parse HEAD` | Started at known good commit `92f4cefbd0f82ca4d06050bd3ad34438d7cbface`. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 npx expo install --check` | Passed. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 npm run typecheck` | Passed. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 npm run test` | Passed, 20/20. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=com.mattnewman.studyplanner.plus.lifetime npm run check:iap` | Passed. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=com.mattnewman.studyplanner.plus.lifetime npm run verify:production` | Passed. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 ... npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE` | Passed build/install/launch. StoreKit logged simulator remote proxy error code 12, so real purchase was not validated locally. |
| `EXPO_PUBLIC_STORE_CAPTURE=0 ... ./scripts/verify-ios-widgetkit.sh` | Passed. App Group snapshot had no `demoState`, no demo assignments, small/medium empty surfaces, and `reviewQueueCount: 0`. |

## IAP Results

- Monthly sandbox purchase: not run locally; requires App Store Connect product availability and sandbox account interaction.
- Yearly sandbox purchase: not run locally; requires App Store Connect product availability and sandbox account interaction.
- Lifetime sandbox purchase: not run locally; must be a real non-consumable before submission.
- Restore purchases: not run locally; requires a sandbox account with prior purchase history.
- Product-load failure: pass for local failure behavior; paywall shows honest unavailable state and does not fake entitlement.

## Widget Results

- Small widget automated production snapshot: pass.
- Medium widget automated production snapshot: pass.
- No production demo data: pass.
- Manual Home Screen placement/freshness after add/complete: still required on a simulator/device with widgets placed.
- Day-boundary freshness: not manually validated; keep as manual pre-submit check.
- Large widget scope: out of scope and unsupported.
- Lock Screen widget scope: out of scope and unsupported; removed from user-facing setup UI in this validation pass.

## Icon And Screenshots

- App icon: pass. Production build generated the refreshed icon, and `artifacts/master-review-and-reimplementation/20-app-icon-home-screen.png` was refreshed.
- Screenshots: pass with scope. `01-onboarding.png`, `12-widget-studio.png`, `18-theme-customization.png`, `20-app-icon-home-screen.png`, and `21-contact-sheet.png` were refreshed after removing unsupported lock-widget UI.
- Contact sheet: `artifacts/master-review-and-reimplementation/21-contact-sheet.png`

## App Review Packet

Prepared in `docs/APP_REVIEW_NOTES.md`. It includes plain-language app purpose, IAP product IDs, restore location, supported syllabus import path, parser honesty, safe-data guidance, and supported widget families.

## Remaining Blockers

- Confirm App Store Connect monthly, yearly, and Lifetime products exist with complete metadata.
- Run real sandbox monthly, yearly, Lifetime, and restore tests.
- Manually place small and medium widgets and observe freshness after assignment add/complete.
- Manually observe day-boundary behavior or document it as a known limitation.

## Submission Recommendation

Do not submit yet if IAP is part of the binary submission. The code/build/widget/icon/screenshot gates pass, but real StoreKit sandbox purchase and restore evidence is still required.
