# Arabic RTL Release Decision

Date: 2026-05-26 08:55 EDT

## Decision

Release status: blocked unless the release owner explicitly accepts the scoped Arabic RTL risk.

I am not marking Arabic RTL release-safe from the current evidence. The Arabic runtime localization is real and launch-critical strings are wired, but the current screenshots still show enough layout risk that this should be accepted explicitly or fixed and recaptured before release.

## Reviewed Arabic Proof

Current Arabic native Release simulator screenshots:

- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/00-onboarding-scan.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/01-onboarding-review.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/02-onboarding-calendar.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/03-onboarding-today.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/04-onboarding-classes.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/05-onboarding-focus.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/06-onboarding-widgets.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/10-today-light.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/11-today-dark.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/12-scan.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/13-review.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/14-calendar.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/17-classes.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/18-focus.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/19-widgets-ocean.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/24-paywall.png`
- `docs/launch/2026-05-26/fresh-native-screenshots/current-locales/ar/25-grades.png`

## What Is Good Enough

- App-owned Arabic strings are present on the smoked launch surfaces.
- Today, Scan, Review, Calendar, Classes, Focus, Grades, Widgets, and subscription shells render Arabic text.
- Mixed Latin assignment/course fixture text remains acceptable where it represents user/imported data.
- Paywall products and prices load in Arabic runtime smoke, though StoreKit metadata is still English.

## Remaining RTL Risks

- Onboarding is localized, but it is not wrapped by the same top-level RTL app shell used after onboarding.
- Some nested rows remain manually `flexDirection: "row"` and may not mirror consistently under runtime RTL.
- `I18nManager.allowRTL(true)` does not force a native restart-time RTL flip.
- Mixed Latin demo/import data remains left-to-right inside Arabic cards, which is acceptable only if scoped as imported data.
- StoreKit metadata remains English until App Store Connect subscription localization is configured and propagated.
- No fresh Arabic screenshot recapture was produced after a dedicated RTL hardening patch in this pass.

## Acceptance Criteria To Clear This Blocker

Either:

1. Implement narrow RTL hardening for onboarding/root nested rows, rebuild native Release with `EXPO_PUBLIC_STUDYPLANNER_LOCALE=ar`, and recapture the Arabic screenshot set.

Or:

2. The release owner explicitly accepts the scoped risk that Arabic app-owned strings are localized, but some row ordering and mixed-direction layout details may remain imperfect in 1.0.2.

## Recommendation

Do not mark Arabic RTL release-safe without one of the two acceptance paths above.
