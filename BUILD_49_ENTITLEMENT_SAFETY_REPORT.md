# Build 49 Entitlement Safety Report

## Result
PASS by static verification and TypeScript.

## Unlock Sources Allowed
- App Store entitlement check returning an active known subscription.
- Purchase update for a known StudyPlanner subscription product.
- Restore purchases returning an active known subscription.

## Unlock Sources Blocked
- Onboarding completion.
- Old `osLive` local state.
- Old local `premium` storage before validation.
- Pending import preview.
- Widget snapshot state.
- Deep links.
- Notification taps.
- Scan/import preview.

## Migration
Old Build 47/48 `osLive` is migrated only to `onboardingComplete`. It does not migrate to premium. Old `premium` is cleared on startup until validation succeeds.

## Product IDs
- `com.mattnewman.studyplanner.plus.monthly`
- `com.mattnewman.studyplanner.plus.yearly`

