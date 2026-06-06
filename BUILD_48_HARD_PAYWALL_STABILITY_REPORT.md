# Build 48 Hard Paywall Stability Report

## Status
PASS for code-level gate coverage and simulator launch.

## Allowed Before Entitlement
- onboarding
- paywall
- restore
- terms
- privacy
- support

## Locked Before Entitlement
- dashboard / today
- scan
- PDF import
- paste import
- OCR/photo import
- notes
- plan
- classes
- study sessions
- widget data surfaces
- notification-driven app surfaces

## Fixes
- Added a pre-purchase route allowlist.
- Redirected locked routes to paywall after onboarding.
- Redirected locked routes to onboarding before onboarding is complete.
- Removed the onboarding bypass CTA.
- Made deep link handling wait for loaded storage state.
- Made deep links respect entitlement and onboarding state.
- Added stale-route recovery screens instead of blank or crashing details.

## Guardrails
`npm run check:build48` verifies:

- hard paywall route gate exists.
- locked routes cannot be reached through the old Build 47 gate.
- restore, privacy, terms, and support remain reachable.
- empty storage and missing class state do not crash route rendering.

## Validation Evidence
- `npm run check:build48`: PASS
- `npm run check:build47`: PASS after Build 48-compatible hard-paywall expectations
- fresh simulator install/launch: no crash captured
- Debug simulator build: PASS

## Known Boundary
StoreKit production restore and purchase flows still need real-device/TestFlight verification after signing is configured. The app-side no-entitlement boundary is guarded.
