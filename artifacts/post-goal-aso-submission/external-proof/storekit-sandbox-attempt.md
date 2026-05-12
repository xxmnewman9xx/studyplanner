# StoreKit Sandbox Attempt Log

Date checked: 2026-05-12

Status: products-loaded paywall and purchase/restore proof are still missing. This file records tooling/setup checks only. It is intentionally not named `storekit-sandbox-proof.md` and must not be treated as proof.

Current local findings:

1. No StoreKit configuration file exists in the repository.
   - Command: `rg --files | rg -i '\\.storekit$'`
   - Result: no files returned.

2. No `xcrun storekit` utility is available in the current Xcode command-line toolchain.
   - Command: `xcrun storekit --help`
   - Result: `xcrun: error: unable to find utility "storekit", not a developer tool or in PATH`.

3. The shared app scheme is not currently configured with a StoreKit configuration file.
   - File checked: `ios/StudyPlannerSyllabusAI.xcodeproj/xcshareddata/xcschemes/StudyPlannerSyllabusAI.xcscheme`
   - Result: no StoreKit configuration reference is present in the LaunchAction.

4. Source-level StoreKit handoff remains clean.
   - Command: `npm run audit:storekit`
   - Result: local StoreKit/IAP source paths have no blockers, but the audit warns that products-loaded paywall, monthly/yearly/Lifetime purchases, restore success, App Store Connect product status, and reviewer product attachment remain external proof.

Next required action:
Use `docs/STOREKIT_TESTING_RUNBOOK.md` to set up local StoreKit Testing or App Store Connect sandbox, capture `37-paywall-products-loaded.png`, and then create `storekit-sandbox-proof.md` with real monthly, yearly, Lifetime, and restore results.
