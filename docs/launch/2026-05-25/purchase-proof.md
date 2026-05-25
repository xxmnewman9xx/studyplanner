# Purchase Proof

Date: 2026-05-25

## Proven

- `npm run check:iap` passes locally.
- The paywall loads store-backed products in the native simulator proof: `AppStore/MaxImpactQualityPass-2026-05-25/fresh-native/onboarding/04-hard-paywall.png`.
- Production EAS project env includes:
  - `EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS=com.mattnewman.studyplanner.plus.monthly,com.mattnewman.studyplanner.plus.yearly`
  - `EXPO_PUBLIC_PRIVACY_URL`
  - `EXPO_PUBLIC_TERMS_URL`
- Production EAS project and account env listings did not show `EXPO_PUBLIC_SIM_QA_CAPTURE`.
- `expo-iap` is configured in `app.json`; purchase and restore are wired through `src/services/subscriptions.tsx`.

## Not Proven

- No live App Store/TestFlight sandbox purchase transaction was completed in this pass.
- App Store Connect product pricing, localization, cleared-for-sale state, subscription group, and review state are not locally provable.

## Blocker

Purchase proof requires an Apple sandbox/TestFlight account and a processed TestFlight build. Build 24 is uploaded for the stabilized release state; Apple-side processing and sandbox transaction state are external.

## Exact Manual Steps

1. Open App Store Connect app `6766181202`.
2. Confirm product IDs exactly match `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`.
3. Confirm pricing, localization, subscription group, cleared-for-sale, and review state.
4. Install TestFlight build `1.0.2` / `24`.
5. Complete onboarding, choose a plan, and purchase with a sandbox tester.
6. Capture the Apple purchase dialog, success state, and unlocked StudyPlanner Plus state.
