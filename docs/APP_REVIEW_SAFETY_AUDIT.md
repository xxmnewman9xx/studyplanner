# App Review Safety Audit

Date: 2026-05-12
Branch: v1-1-widget-command-center

## Verdict

App Review safety is good for a release candidate, with external setup still required for store products and final sandbox validation.

## IAP Safety

| Check | Result |
| --- | --- |
| No fake purchase success | Pass |
| No hardcoded `isPremium: true` | Pass |
| Monthly/yearly IDs preserved as env-driven products | Pass |
| Lifetime entitlement not granted unless store returns purchase | Pass |
| Restore Purchases visible | Pass |
| Terms of Use and Privacy Policy visible | Pass |
| Paywall fails closed when products are unavailable | Pass |

Expected product IDs for App Store Connect:

- `com.mattnewman.studyplanner.plus.monthly`
- `com.mattnewman.studyplanner.plus.yearly`
- Proposed lifetime non-consumable: `com.mattnewman.studyplanner.plus.lifetime`

The lifetime plan is supported only through `EXPO_PUBLIC_IAP_LIFETIME_PRODUCT_IDS`. It does not appear unless App Store Connect returns that product, and it does not grant access unless the store reports a purchased lifetime product.

## Demo And Capture Safety

| Check | Result |
| --- | --- |
| Demo seed hidden in production | Pass |
| Capture mode exact flag only | Pass: `EXPO_PUBLIC_STORE_CAPTURE=1` |
| Capture mode skips normal persistence | Pass |
| Widget demo label only in capture snapshot | Pass |
| Scanner/parser protected | Pass |

## Claims And Privacy

- No Canvas sync claim is made.
- AI scan is described as extraction/review, not guaranteed correctness.
- Review Inbox requires user approval before adding extracted work.
- Privacy and EULA links remain available from the paywall.
- Manual planner remains available without purchase.

## Remaining App Review Blockers

1. Create/verify App Store Connect products for monthly/yearly and optional lifetime.
2. Attach products to the app version and complete pricing/availability.
3. Run sandbox purchase, cancel, pending, and restore flows on a real/simulator store environment.
4. Confirm support/privacy URLs are correct in App Store Connect metadata.
