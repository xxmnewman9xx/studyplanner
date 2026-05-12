# StoreKit Sandbox Attempt Log

Date checked: 2026-05-12

Status: products-loaded paywall screenshot is now captured; purchase/restore proof is still missing. This file records tooling/setup checks and a cancelled transaction-shaped attempt only. It is intentionally not named `storekit-sandbox-proof.md` and must not be treated as proof.

Current local findings:

1. Initial check found no StoreKit configuration file in the repository.
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

Follow-up local setup on 2026-05-12:

1. Added a local StoreKit Testing configuration.
   - File: `ios/StudyPlannerProducts.storekit`
   - Product IDs included: monthly, yearly, and Lifetime.
   - Validation: JSON parsed successfully with Node.

2. Attached the local StoreKit configuration to the shared Debug Run scheme.
   - File: `ios/StudyPlannerSyllabusAI.xcodeproj/xcshareddata/xcschemes/StudyPlannerSyllabusAI.xcscheme`
   - Reference: `../StudyPlannerProducts.storekit`
   - Validation: `xcodebuild -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme StudyPlannerSyllabusAI -showBuildSettings -json` succeeded.

3. Re-ran the StoreKit source handoff audit.
   - Command: `npm run audit:storekit`
   - Result: passed with one external-proof warning. The audit now verifies the local StoreKit config and scheme reference.

4. Built and launched the app with real IAP env IDs plus capture mode.
   - Command: `EXPO_PUBLIC_STORE_CAPTURE=1 EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=com.mattnewman.studyplanner.plus.lifetime EXPO_PUBLIC_SUPPORT_URL=https://studyplanner.app/support npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`
   - Result: build succeeded with 0 errors and 0 warnings.

5. Captured products-loaded paywall proof.
   - Path: `artifacts/post-goal-aso-submission/37-paywall-products-loaded.png`
   - Dimensions: 1179x2556.
   - Observed visible returned products: Yearly Plus at `$24.99` and Plus Monthly at `$3.99`.
   - Caveat: this screenshot proves returned subscription products on the paywall. It does not prove Lifetime transaction availability, a successful purchase, a successful restore, App Store Connect approval, or product attachment for submission.

6. Restore and purchase-flow attempts did not produce proof.
   - Restore Purchases displayed an Apple Account sign-in prompt, then after cancel reported: `No active Plus purchase was found for this store account.`
   - A transaction-shaped flow was accidentally opened during a drag/click attempt and was cancelled at the Apple Account prompt. The app reported: `Purchase was cancelled.`
   - No credentials were entered. No purchase was completed. No restore success was proven.

Next required action:
Use `docs/STOREKIT_TESTING_RUNBOOK.md` to complete real StoreKit Testing or App Store Connect sandbox transactions, then create `storekit-sandbox-proof.md` with real monthly, yearly, Lifetime, and restore results. Do not mark the 9.2 goal complete until that proof exists.
