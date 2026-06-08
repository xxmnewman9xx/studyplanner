# Final Release Blocker Scorecard

Date: 2026-05-26 10:46 EDT

## Recommendation

No release.

Build `28` was uploaded to EAS Submit as a TestFlight proof candidate after explicit owner direction, but final release criteria are still not met. The core simulator/backend proof is strong, but physical camera proof and App Store Connect subscription metadata localization are externally unproven, and Arabic RTL is not explicitly accepted as release-safe.

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

Build `28` was built locally and uploaded to EAS Submit.

- IPA: `builds/StudyPlanner-1.0.2-b28.ipa`
- SHA-256: `b1756fbdc6b8e947e0149502570e9611c309f143b9b6a6f2628a628743295a0a`
- EAS submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/86285642-118c-49cb-957d-3ff727e19095`
- Latest observed EAS submission state: `IN_QUEUE`

Apple/App Store Connect completion is not yet proven. This upload does not close the physical camera proof blocker until build `28` is processed, installed through TestFlight on a physical iPhone, and used to create review cards from live camera capture.

## Final Gate

Release can move forward only after all of the following are true:

1. Physical iPhone/TestFlight camera capture creates review cards and applies rows into Today, with screenshots or screen recording.
2. App Store Connect subscription display names/descriptions are localized for both products in all 10 locales and verified through StoreKit/TestFlight propagation.
3. Arabic RTL is either hardened and recaptured or explicitly accepted by the release owner as a scoped 1.0.2 risk.
