# Build 52 Auth Leak Repro

## Scope

This pass was performed in the local checkout only. I could not honestly complete physical fresh simulator installs, TestFlight installs, StoreKit cache resets, sandbox account swaps, or old-build upgrade installs from this shell without a running device/TestFlight session.

## Repro Matrix

| Run | Install type | Storage state | Entitlement state | Restore state | Route after onboarding | Paywall | App access | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | Static fresh install model | Empty default data | inactive/error/loading | none | onboarding -> scan/paste/locked preview | appears before apply | no | `npm run test:hard-paywall`, `npm run check:build52` |
| 2 | Static stale local premium model | stored `premium:true` | inactive/error | none | locked/preview only | appears before apply | no | `lockUnvalidatedPremium`, `dataForAccessState`, scrubbed persistence |
| 3 | Static corrupt storage model | invalid/malformed prefs | inactive/error | none | default onboarding or locked preview | appears before apply | no | strict boolean migration, corrupt backup path |
| 4 | Static purchase replay model | any | purchase update only, no active subscription | none | remains locked | no unlock | no | `finishStudyPlannerPurchase()` re-runs `checkStudyPlannerEntitlement()` |
| 5 | Static active entitlement model | any | active StoreKit subscription | active | unlocked app | not required | yes, legitimate | only `entitlementStatus === "active"` unlocks |

## Findings

Root cause found in code review: purchase update events could previously unlock from `known product + purchaseState === "purchased"` without rechecking active subscription state. That is now fixed.

Secondary issues fixed:

- Initial deep links are no longer consumed while entitlement is `loading`.
- Locked users can still reach allowed preview/paywall routes, but not product routes.
- Stored `premium`, malformed `osLive`, and corrupt SQLite rows cannot unlock.

## Physical Runs Not Completed

- Fresh simulator install: not run.
- Fresh TestFlight install: not run.
- Deleted app + reinstall: not run.
- Cleared AsyncStorage: not applicable; app uses SQLite.
- Cleared Keychain/SecureStore: no SecureStore usage found in app code.
- Cleared StoreKit purchase cache: not run.
- No sandbox purchase account: not run.
- Sandbox account with prior purchase: not run.
- Old build upgraded to new build: not run.

Submission remains blocked until those physical runs prove the same result.

