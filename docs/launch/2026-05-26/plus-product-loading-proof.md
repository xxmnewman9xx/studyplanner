# Plus Product Loading Proof

Date: 2026-05-26 01:58 EDT / 2026-05-26 05:58 UTC

## Product ID Mapping

| Product | Code / EAS ID | Native price shown |
| --- | --- | --- |
| Monthly Plus | `com.mattnewman.studyplanner.plus.monthly` | `$3.99` |
| Yearly Plus | `com.mattnewman.studyplanner.plus.yearly` | `$24.99` |

## Proven In Fresh Native Release Build

- `npm run check:iap` passes.
- Production EAS env contains the two expected subscription product IDs.
- The native app code path uses `expo-iap` `fetchProducts` for subscriptions and renders store `displayPrice`.
- Fresh `Release` iphonesimulator build `28` was installed and launched on `StudyPlanner-QA-iPhone`.
- Screenshot: `docs/launch/2026-05-26/fresh-native-screenshots/release-rescue/02-release-plus-deeplink.png`.

Observed in the screenshot:

- `2 plans available`
- Yearly Plus price: `$24.99`
- Plus Monthly price: `$3.99`
- Restore Purchases button visible
- Terms of Use (EULA) link visible
- Privacy Policy link visible

## Remaining TestFlight Caveat

This is a fresh native `Release` simulator proof, not a processed physical-device TestFlight purchase pass. It proves the app-side product loading path no longer shows "Plus unavailable" in the native release build. A final TestFlight upload still needs physical-device confirmation before release, especially if App Store Connect product state changes.
