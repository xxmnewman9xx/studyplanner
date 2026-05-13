# StoreKit IAP Handoff Audit

Generated: 2026-05-13T00:16:45.774Z

Sources:
- `app.json`
- `src/services/purchaseConfig.ts`
- `src/services/subscriptions.tsx`
- `src/screens/UpgradeScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `ios/StudyPlannerProducts.storekit`
- `ios/StudyPlannerSyllabusAI.xcodeproj/xcshareddata/xcschemes/StudyPlannerSyllabusAI.xcscheme`
- `docs/APP_STORE_METADATA.md`
- `docs/LIFETIME_IAP_SETUP.md`
- `docs/APP_STORE_SUBMISSION_HANDOFF.md`

This audit verifies local StoreKit/IAP source and handoff readiness. It does **not** prove App Store Connect product attachment, sandbox purchase success, restore success, subscription renewal state, Lifetime transaction availability, or Lifetime product approval.

## Result

PASS: no source-level StoreKit handoff blockers found. 1 warning(s) remain.

| Check | Status | Detail |
| --- | --- | --- |
| Expo IAP plugin is configured | PASS |  |
| Expected IAP IDs are documented in purchaseConfig | PASS |  |
| IAP IDs are environment-driven | PASS |  |
| Store APIs are used for products, purchase, restore, and transaction finish | PASS |  |
| Monthly/yearly subscriptions are loaded as subscriptions | PASS |  |
| Lifetime product is loaded and purchased as in-app | PASS |  |
| Purchases are finished as non-consumable/non-consumable-equivalent | PASS |  |
| Restore resolves active subscriptions and Lifetime purchases from the store | PASS |  |
| Paywall exposes safe restore, terms, privacy, and store-sourced plan copy | PASS |  |
| Lifetime CTA appears only from a returned product kind | PASS |  |
| Free-trial copy depends on store product data | PASS |  |
| Settings exposes restore and support/privacy surfaces | PASS |  |
| Local StoreKit configuration is valid JSON | PASS |  |
| Local StoreKit configuration includes the exact StudyPlanner product set | PASS |  |
| Debug scheme selects the local StoreKit configuration | PASS |  |
| Lifetime setup doc describes real non-consumable handling | PASS |  |
| Recommended App Store metadata avoids unverified trial/Lifetime/outcome claims | PASS |  |
| Submission handoff keeps StoreKit transaction proof external | PASS |  |
| StoreKit sandbox proof remains external | WARN | This source audit cannot prove sandbox monthly/yearly/Lifetime purchases, restore success, App Store Connect product status, reviewer product attachment, or Lifetime transaction availability. |

## Remaining External Proof

- Sandbox monthly purchase, yearly purchase, Lifetime purchase, and restore proof.
- App Store Connect product attachment/status for the submitted app version.
- Final App Review notes with exact product availability.
