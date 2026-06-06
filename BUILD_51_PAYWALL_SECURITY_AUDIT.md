# Build 51 Paywall Security Audit

## Result

PASS

## Allowed Without Entitlement

- Onboarding and welcome.
- Import preview routes from the value-first funnel.
- Paywall and restore.
- Terms, privacy, support external links.
- Locked dashboard.

## Blocked Without Entitlement

- Today.
- Plan.
- Classes.
- Notes.
- Study Sessions.
- Reminders.
- Real dashboard data.
- Applied semester data.
- Active widget data.

## Enforcement

- `appAccessLocked` centralizes lock state.
- `gatedRoute` routes non-entitled app surfaces to locked dashboard.
- `showTabs` requires `entitlementUnlocks`.
- `lockUnvalidatedPremium` clears stored local premium before App Store entitlement validation.
- `lockedWidgetData` removes planner data before locked widget sync.

No entitlement can access the app.
