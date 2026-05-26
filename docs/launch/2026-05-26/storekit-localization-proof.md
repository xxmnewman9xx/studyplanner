# StoreKit Subscription Localization Proof

Date: 2026-05-26 08:55 EDT

## Result

Release status: blocked.

App-owned paywall strings are localized, and native Release simulator proof shows products and prices load. App Store Connect subscription product metadata localization was not configured or proven in this pass.

## Product Mapping

| Product | Product ID | Proven price in native Release simulator |
| --- | --- | --- |
| StudyPlanner Plus Monthly | `com.mattnewman.studyplanner.plus.monthly` | `$3.99` |
| StudyPlanner Plus Yearly | `com.mattnewman.studyplanner.plus.yearly` | `$24.99` |

Existing mapping proof: `docs/launch/2026-05-26/iap-product-mapping.md`.

## Current Native Paywall Proof

Existing proof shows:

- two products load in native Release simulator
- yearly product displays `$24.99`
- monthly product displays `$3.99`
- Restore is visible
- Terms/EULA and Privacy are visible

Existing proof file: `docs/launch/2026-05-26/plus-product-loading-proof.md`.

## Metadata Blocker

Localized paywall screenshots still show StoreKit-returned product metadata in English:

- `Yearly Plus`
- `Plus Monthly`
- `Yearly`
- `Monthly`
- `Study Planner Plus Annual Subscription`
- `Study Planner Plus Monthly Subscription`

These strings are returned by StoreKit from App Store Connect product metadata. They are not controlled by the runtime localization catalog.

## Source Strings Ready For App Store Connect

Use `subscription-localization-table.md` as the source for display names and descriptions.

Required locales:

| Locale | Monthly metadata | Yearly metadata | ASC status |
| --- | --- | --- | --- |
| `ar` | ready in source table | ready in source table | not configured/proven |
| `de` | ready in source table | ready in source table | not configured/proven |
| `en-US` | ready in source table | ready in source table | not re-verified |
| `es` | ready in source table | ready in source table | not configured/proven |
| `fr` | ready in source table | ready in source table | not configured/proven |
| `hi` | ready in source table | ready in source table | not configured/proven |
| `ja` | ready in source table | ready in source table | not configured/proven |
| `ko` | ready in source table | ready in source table | not configured/proven |
| `pt-BR` | ready in source table | ready in source table | not configured/proven |
| `zh-Hans` | ready in source table | ready in source table | not configured/proven |

## Automation/Access Check

- `eas whoami` is authenticated as `xxmnewman9xx`.
- EAS submit has previously uploaded a binary using remote App Store credentials.
- No local Fastlane `Appfile`, `Fastfile`, `Deliverfile`, or App Store Connect metadata automation was found in the repo.
- The available local tools do not provide authenticated non-interactive App Store Connect subscription metadata editing.

Because subscription metadata lives in App Store Connect, this pass cannot honestly claim the localized display names/descriptions were entered or propagated.

## Manual ASC Checklist

For ASC app `6766181202`:

1. Open App Store Connect.
2. Open Subscriptions for `com.mattnewman.studyplanner`.
3. Confirm both product IDs exactly match:
   - `com.mattnewman.studyplanner.plus.monthly`
   - `com.mattnewman.studyplanner.plus.yearly`
4. For both products, enter localized display name and description for all 10 locales from `subscription-localization-table.md`.
5. Verify subscription group localization if App Store Connect exposes group-level localized name/description.
6. Confirm each subscription is in the intended availability/review state and cleared for sale or ready for review as appropriate.
7. Wait for StoreKit metadata propagation if changes do not appear immediately.
8. Re-run native/TestFlight paywall smoke for at least `ar`, `de`, `ja`, and `zh-Hans`.
9. Capture paywall screenshots proving StoreKit returns localized product title, period, and description.

## Recommendation

Do not ship or upload a new build from this state. Plus product availability is proven, but subscription metadata localization remains externally blocked until App Store Connect is updated and verified.
