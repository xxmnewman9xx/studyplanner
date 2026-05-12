# Lifetime IAP Setup

Date: 2026-05-12
Status: supported by configuration, not granted by code

## Product ID

Use this proposed non-consumable product ID in App Store Connect if Lifetime Plus is approved for launch:

```text
com.mattnewman.studyplanner.plus.lifetime
```

## Required App Store Connect Setup

1. Create a non-consumable in-app purchase with the product ID above.
2. Set localized name, description, price, tax, and availability.
3. Submit screenshots/review notes for the lifetime product.
4. Add the product ID to the build environment:

```bash
EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS=com.mattnewman.studyplanner.plus.lifetime
```

## Safety Rules

- Do not hardcode the lifetime product in source unless App Store Connect setup is complete.
- Do not grant lifetime entitlement locally.
- Lifetime appears on the paywall only when the store returns the product.
- Lifetime unlocks Plus only when `getAvailablePurchases` returns a purchased product ID that matches `EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS`.
- Restore Purchases must be tested before submission.

## Current App Behavior

- Monthly and yearly IDs remain `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
- Lifetime uses only the proposed ID `com.mattnewman.studyplanner.plus.lifetime`.
- The lifetime button label is `Buy Lifetime`, not `Subscribe`.
- If a lifetime purchase is restored by the store, the paywall says `Lifetime Plus is active`.
- `Manage Subscription` is hidden for lifetime entitlement because a non-consumable is not managed like an auto-renewing subscription.
- No fake lifetime success path or local entitlement grant was added.

## Current Verdict

Safe for code review. Release still requires the App Store Connect non-consumable product, localized metadata, pricing, review notes, and sandbox purchase/restore validation.
