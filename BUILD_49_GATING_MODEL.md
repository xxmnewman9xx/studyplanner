# Build 49 Gating Model

## States
1. `onboarding`
2. `prePaywallImport`
3. `lockedDashboard`
4. `paywall`
5. `unlockedApp`

## Rules
- Onboarding incomplete: show `welcome` / `onboarding`.
- Onboarding complete and no entitlement: allow `importOptions`, `scan`, `paste`, `review`, `lockedDashboard`, and `paywall`.
- Entitlement active: unlock the normal app.
- Entitlement loading: stored premium is ignored; user sees welcome or locked shell, never real dashboard.
- Entitlement error: default locked.

## Implementation
- `lockUnvalidatedPremium(data)` strips stale local premium at startup.
- `premiumData(data)` is the only shared unlock transition.
- `gatedRoute(active, data, entitlementStatus)` blocks all non-preview routes to `lockedDashboard`.
- `PRE_PURCHASE_ROUTES` explicitly lists the allowed no-entitlement funnel routes.

