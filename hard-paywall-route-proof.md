# Hard Paywall Route Proof

Date: 2026-05-26

Result: pass.

The app now routes paywall traffic through the `subscribe` tab and uses hard-gate copy centered on unlocking StudyPlanner. The active tab model no longer exposes the legacy paid-tier tab, and the subscription gate copy describes product access rather than feature tiers.

Implementation points:
- `src/models.ts`: `NavTab` uses `subscribe`.
- `App.tsx`: post-onboarding paywall route and capture route parsing use `subscribe`.
- `src/screens/UpgradeScreen.tsx`: display copy and restore/purchase actions use the hard-gate product model.
- `src/components/PremiumGate.tsx`: entitlement copy is neutral and points to unlocking StudyPlanner.
- `scripts/check-iap-config.mjs`: validates the hard-gate configuration.

Validation:

```sh
npm run check:iap
```

Result: `IAP and hard-paywall configuration passed.`

Native screenshots:
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/locales/en-US/24-paywall.png`
- `AppStore/RawScreenshots-FinalWidgetLocalization-NoFree-2026-05-26/locales/ar/24-paywall.png`
- All ten locale folders include `24-paywall.png`.
