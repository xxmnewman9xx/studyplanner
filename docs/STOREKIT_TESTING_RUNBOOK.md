# StoreKit Testing Runbook

Date created: 2026-05-12

Purpose: provide the exact path to clear the remaining products-loaded paywall and StoreKit purchase/restore blockers. This is a runbook, not proof. Do not copy it to `storekit-sandbox-proof.md` unless real products-loaded, purchase, restore, and entitlement behavior has been captured.

Official Apple reference checked:
- [Setting up StoreKit Testing in Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode/)
- [Customizing the build schemes for a project](https://developer.apple.com/documentation/xcode/customizing-the-build-schemes-for-a-project/)

## Current Blocker

`npm run verify:goal92` requires:

- `artifacts/post-goal-aso-submission/37-paywall-products-loaded.png`
- `artifacts/post-goal-aso-submission/external-proof/storekit-sandbox-proof.md`

`npm run verify:submission` also requires these, plus real IAP env values and App Store Connect proof.

## Current Local State

Checks run on 2026-05-12:

| Check | Result | Impact |
| --- | --- | --- |
| `rg --files \| rg -i '\\.storekit$'` | No `.storekit` file found | Local StoreKit Testing is not configured in repo |
| `xcrun storekit --help` | `xcrun` could not find a `storekit` utility | No local StoreKit CLI is available in this Xcode install |
| Shared app scheme inspection | `ios/StudyPlannerSyllabusAI.xcodeproj/xcshareddata/xcschemes/StudyPlannerSyllabusAI.xcscheme` has no StoreKit configuration reference | Launching from this scheme will not load local StoreKit products |
| Source audit | `npm run audit:storekit` passes with one external-proof warning | Code paths are ready, but StoreKit product behavior remains unproven |

## Product IDs

Use the exact IDs already preserved in source and App Store metadata:

| Kind | Product ID |
| --- | --- |
| Monthly auto-renewable subscription | `com.mattnewman.studyplanner.plus.monthly` |
| Yearly auto-renewable subscription | `com.mattnewman.studyplanner.plus.yearly` |
| Lifetime non-consumable | `com.mattnewman.studyplanner.plus.lifetime` |

## Local StoreKit Testing Path

1. In Xcode, create or sync a StoreKit configuration file for the three product IDs above.
2. Include:
   - Monthly auto-renewable subscription.
   - Yearly auto-renewable subscription.
   - Lifetime non-consumable.
   - Localized title/description/price values that match the planned App Store Connect products closely enough for screenshot proof.
3. Attach the `.storekit` file to the app scheme under Run options as the StoreKit Configuration.
4. Launch the app with explicit IAP env IDs:

```sh
EXPO_PUBLIC_STORE_CAPTURE=0 \
EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly \
EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=com.mattnewman.studyplanner.plus.lifetime \
EXPO_PUBLIC_SUPPORT_URL=https://<real-support-url> \
npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE
```

5. Open the paywall:

```sh
xcrun simctl openurl 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE 'studyplanner://capture?tab=paywall'
```

6. Capture products-loaded proof only if real StoreKit products appear:

```sh
xcrun simctl io 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE screenshot artifacts/post-goal-aso-submission/37-paywall-products-loaded.png
```

7. Test monthly, yearly, Lifetime, and Restore Purchases using StoreKit Testing or sandbox/App Store Connect.
8. Record proof in `artifacts/post-goal-aso-submission/external-proof/storekit-sandbox-proof.md`.

## Proof File Requirements

The proof file must include:

- Date checked.
- Device/simulator.
- Whether proof used local StoreKit Testing or App Store Connect sandbox.
- StoreKit configuration file or App Store Connect product status used.
- Products-loaded paywall screenshot path.
- Monthly purchase result.
- Yearly purchase result.
- Lifetime purchase result.
- Restore Purchases result.
- Whether `isConsumable: false` transaction finishing was observed or confirmed from logs/source.
- Remaining issue, if any.

The verifier rejects template/TODO/placeholder language, so keep the proof specific.

## Do Not Claim

- Do not claim App Store Connect products are approved from local StoreKit Testing alone.
- Do not claim Lifetime is purchasable unless the store returns the non-consumable product.
- Do not use `38-paywall-product-load-failure.png` as products-loaded proof.
- Do not fake a successful restore without a real transaction result.
