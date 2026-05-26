# Final Release Blocker Scorecard

Date: 2026-05-26 08:55 EDT

## Recommendation

No release. Do not upload a new build from this state.

The core simulator/backend proof is strong, but the final release criteria are not met because physical camera proof and App Store Connect subscription metadata localization are externally unproven, and Arabic RTL is not explicitly accepted as release-safe.

## Scorecard

| Blocker | Status | Evidence |
| --- | --- | --- |
| Physical/TestFlight camera proof | blocked | No physical iPhone appears in `xcrun xctrace list devices`; no permission prompt, live camera capture, or physical photo-to-review proof captured. |
| App Store Connect subscription metadata localization | blocked | Source strings are ready in `subscription-localization-table.md`, but ASC metadata was not entered/proven and localized screenshots still show English StoreKit metadata. |
| Arabic RTL hardening/acceptance | blocked unless explicitly accepted | Arabic runtime screenshots exist, but onboarding/root RTL and nested-row risks remain without a dedicated hardening recapture or owner acceptance. |

## What Is Already Proven

- Railway OCR backend is live.
- Saved-photo import works in native Release simulator.
- Production OCR/parser creates reviewable work cards.
- Reviewed photo-derived rows can apply into Today.
- Native Release simulator paywall loads two products:
  - yearly `$24.99`
  - monthly `$3.99`
- Restore, Terms/EULA, and Privacy are visible.
- Runtime localization is wired for all 10 launch locales with 1094 flattened entries per locale.
- Native Release locale smoke screenshots exist for `ar`, `de`, `ja`, and `zh-Hans`.

## New Deliverables In This Closure Pass

- `docs/launch/2026-05-26/physical-camera-proof.md`
- `docs/launch/2026-05-26/storekit-localization-proof.md`
- `docs/launch/2026-05-26/rtl-release-decision.md`
- `docs/launch/2026-05-26/final-release-blocker-scorecard.md`

## TestFlight Upload

No new TestFlight upload was performed.

The latest EAS remote store build returned by `eas build:list` is an older `1.0.0` build `11` from 2026-05-06. The existing build `27` receipt is historical and already documented as not including the current OCR rescue state. Current source config is `1.0.2` build `28`, but final release blockers are not closed, so uploading would violate the release criteria.

## Final Gate

Release can move forward only after all of the following are true:

1. Physical iPhone/TestFlight camera capture creates review cards and applies rows into Today, with screenshots or screen recording.
2. App Store Connect subscription display names/descriptions are localized for both products in all 10 locales and verified through StoreKit/TestFlight propagation.
3. Arabic RTL is either hardened and recaptured or explicitly accepted by the release owner as a scoped 1.0.2 risk.
