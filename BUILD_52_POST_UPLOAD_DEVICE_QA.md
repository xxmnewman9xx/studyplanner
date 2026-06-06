# Build 52 Post-Upload Device QA

## Scope

Run this checklist on the signed TestFlight Build 52 binary after App Store Connect processing completes.

## A. Fresh Locked User

1. Delete the app.
2. Install Build 52 from TestFlight.
3. Complete onboarding with name.
4. Confirm no automatic unlock.
5. Confirm paywall appears.
6. Cancel paywall.
7. Confirm locked state remains.

Expected result: onboarding completion without a validated active entitlement never grants app access.

## B. Preview Funnel

1. Upload or paste a syllabus.
2. Confirm preview works.
3. Tap apply/build.
4. Confirm paywall appears.
5. Cancel.
6. Confirm no active semester applied.

Expected result: preview value is visible, but applying planner data requires a validated active entitlement.

## C. Purchase/Restore

1. Use sandbox/test purchase if available.
2. Confirm entitlement validates after transaction.
3. Confirm app unlocks only after validation.
4. Relaunch app.
5. Confirm entitlement persists.

Expected result: app access is granted only after StoreKit transaction completion and active entitlement validation.

## D. Deep Links

1. Test `studyplanner://today`.
2. Test `studyplanner://plan`.
3. Test `studyplanner://notes`.
4. Test `studyplanner://auth`.
5. Confirm no entitlement stays locked for every route.

Expected result: deep links cannot bypass the access gate.

## E. Widgets

1. Add widget while locked.
2. Confirm no planner data.
3. Purchase or restore.
4. Confirm widget updates with real `SemesterSnapshot`.
5. Tap widget.
6. Confirm routing respects entitlement.

Expected result: locked widgets expose no planner data, and widget taps cannot bypass the access gate.

## F. Notifications

1. Locked user: confirm no premium notification scheduling.
2. Premium user: confirm reminders schedule normally.

Expected result: notification behavior follows validated entitlement state.

No entitlement can access the app.

