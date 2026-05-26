# IAP Product Mapping

Date: 2026-05-26 01:39 EDT / 2026-05-26 05:39 UTC

| Product | Product ID | Source |
| --- | --- | --- |
| StudyPlanner Monthly subscription | `com.mattnewman.studyplanner.plus.monthly` | `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS` |
| StudyPlanner Yearly | `com.mattnewman.studyplanner.plus.yearly` | `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS` |

No lifetime product ID is configured in production EAS env.

## Production EAS Proof

`eas env:list production --format long --include-sensitive` reports:

```text
EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly
```

## App Code Path

- `src/services/purchaseConfig.ts` reads `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS`.
- `src/services/subscriptions.tsx` calls `fetchProducts({ skus, type: "subs" })`.
- `src/screens/UpgradeScreen.tsx` renders `displayPrice` returned by the store and keeps Restore, Terms, and Privacy visible.

## External Check Still Required

App Store Connect product state is not fully provable from this local workspace. Before upload/release, manually confirm in App Store Connect app `6766181202` that both product IDs exactly match, are in the intended subscription group, have pricing/localization, and are cleared for sale or otherwise in the correct App Review/TestFlight state.
