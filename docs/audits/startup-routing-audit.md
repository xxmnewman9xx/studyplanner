# Startup Routing Audit

Agent: Startup Routing Auditor

## Root Causes

- `premiumData()` wrote `prefs.onboardingComplete: true`, so an active entitlement could mark a fresh install as onboarded.
- `accessStateFor()` checked entitlement before onboarding, so already-premium state could render unlocked routes before onboarding.
- Launch routing used an inline stack ternary instead of a named contract, making pending import and onboarding priority easy to regress.

## Changes

- Added `src/activation.ts` with `InitialRoute` and `resolveInitialRoute()`.
- Wired launch hydration through `resolveInitialRouteForData()`.
- Changed `accessStateFor()` so onboarding always outranks premium entitlement.
- Removed onboarding mutation from `premiumData()` and `dataForAccessState()`.
- Changed onboarding-gated deep links to force `onboarding`, not `welcome`.

## Route Truth Table

| Onboarding | Pending Import | Premium | Initial Route | App Route |
|---|---:|---:|---|---|
| false | no | false | `onboarding` | `onboarding` |
| false | no | true | `onboarding` | `onboarding` |
| false | yes | true/false | `onboarding` | `onboarding` |
| true | yes | false | `reviewPendingImport` | `review` |
| true | yes | true | `reviewPendingImport` | `review` |
| true | no | false | `dashboard` | `lockedDashboard` |
| true | no | true | `dashboard` | `today` after entitlement activation clears the stack |

## GitNexus Impact

- `premiumData`: HIGH risk. Direct callers: `activateEntitlement`, `Paywall.unlock`; affected processes include `App`, `Paywall`, purchase update flow.
- `accessStateFor`: LOW risk. Direct callers: `gatedRoute`, `App`.
- `gatedRoute`: LOW risk. Direct caller: `App`.
- `App`: LOW upstream risk.

## Verification

- `npm run check:activation-spine`: PASS.
- Fresh iPhone simulator reinstall: PASS. Logs showed `onboarding=false active=onboarding decision=onboarding access=onboarding`.
- Screenshot: `test-results/fresh-onboarding-build55.png`.

## Score

- Fresh install correctness: 10/10
- Premium user correctness: 10/10
- Pending import correctness: 9/10
- No race conditions: 9/10

Remaining risk: pending import behavior is covered by deterministic route tests and source gates, but full UI review-apply flow still needs manual import-content QA.
