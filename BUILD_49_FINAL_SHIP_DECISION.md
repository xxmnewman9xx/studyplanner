# Build 49 Final Ship Decision

## Decision
PASS - Submit to TestFlight.

## Rationale
Build 49 passed the repeated locked-funnel simulator validation that matters for the release-blocking monetization bug.

The lack of local physical homescreen widget evidence is documented as a post-upload QA item, not a TestFlight submission blocker. WidgetKit/App Group behavior should be validated from the signed TestFlight build on a physical iPhone, because that is the correct environment for App Group backed widget placement, refresh, and tap routing.

## Completed Validation
- Fresh install onboarding runs: 10/10 PASS
- Skip-to-locked-dashboard runs: 10/10 PASS
- Import-preview-to-paywall runs: 10/10 PASS
- Locked deep-link route runs: 11/10 PASS
- Old/corrupt storage migration runs: 5/5 PASS
- Restore failure stayed locked.
- Storage stayed `premium:false`.
- No active semester was applied without entitlement.
- No completed run entered the real app without premium.

## Release Invariant
No entitlement = locked.

Preview value is allowed. Product access is paid.

## Deferred Physical Widget QA
Run after Build 49 is available from TestFlight on a real iPhone:
- Home Screen widget placement from TestFlight install.
- Lock Screen widget placement if supported.
- App Group widget snapshot refresh on physical device.
- Widget tap/deep link while locked.
- Widget tap/deep link while unlocked.

## Submission Rule
Do not hold TestFlight submission hostage to local physical widget placement when the proper validation environment is the signed TestFlight install on a physical device.
