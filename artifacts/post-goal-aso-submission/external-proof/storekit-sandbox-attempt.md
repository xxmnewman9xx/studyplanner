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

Additional investigation on 2026-05-12:

1. Checked whether the missing Lifetime plan was caused by the app using the wrong `expo-iap` product type.
   - Source checked: `node_modules/expo-iap/src/index.ts`.
   - Result: `expo-iap` treats `in-app` as the canonical product type and only keeps `inapp` as a deprecated alias.
   - Impact: the app-side `fetchProducts({ skus: purchaseConfig.lifetimeProductIds, type: "in-app" })` path is consistent with the installed package. The missing Lifetime plan is more likely product availability/status, App Store Connect configuration, or local StoreKit attachment, not the product type string.

2. Compared local StoreKit prices with the products-loaded paywall screenshot.
   - Local config: `ios/StudyPlannerProducts.storekit` has Monthly `4.99`, Yearly `29.99`, Lifetime `79.99`.
   - Screenshot: `artifacts/post-goal-aso-submission/37-paywall-products-loaded.png` shows Yearly Plus `$24.99` and Plus Monthly `$3.99`.
   - Inference: the products-loaded screenshot appears to show returned App Store Connect/sandbox products rather than the local `.storekit` file. The screenshot is still useful returned-product proof, but it is not local StoreKit Testing proof and it does not prove Lifetime availability.

3. Tried to exercise `SKTestSession` from a standalone iOS simulator binary.
   - Result: a temporary Swift binary could compile when pointed at the iPhoneOS `StoreKitTest.framework`, but `simctl spawn` aborted with a StoreKit service connection failure to `com.apple.storekitd`.
   - Impact: standalone simulator binaries are not a valid proof path on this machine.

4. Tried to restore the missing Xcode XCTest target long enough to run a local StoreKit proof.
   - Temporary files/target were backed out after the attempt.
   - Result: `xcodebuild test` could see the restored `StudyPlannerSyllabusAITests` target, but linking failed because this Xcode install exposes `StoreKitTest.framework` for iPhoneOS and macOS, not iPhone Simulator. Pointing the simulator test target at the iPhoneOS framework caused the linker to reject an iOS `XCTest.framework` while building for `iOS-simulator`.
   - Failure: `Building for 'iOS-simulator', but linking in dylib ... XCTest.framework/XCTest built for 'iOS'`.
   - Impact: iOS simulator XCTest StoreKit proof is blocked with the currently available framework layout.

5. Tried a temporary macOS SwiftPM XCTest proof harness against the same `.storekit` file.
   - Result: the test bundle built, but `SKTestSession` failed at runtime with `SKInternalErrorDomain Code=3` while saving configuration, clearing overrides, setting `disableDialogs`, and deleting transactions.
   - Impact: macOS XCTest is also not proof on this machine.

Next required action:
Use `docs/STOREKIT_TESTING_RUNBOOK.md` to complete real StoreKit Testing through Xcode's Run action with the StoreKit configuration attached, or complete App Store Connect sandbox transactions with the products attached to the app record. Then create `storekit-sandbox-proof.md` with real monthly, yearly, Lifetime, and restore results. Do not mark the 9.2 goal complete until that proof exists.
