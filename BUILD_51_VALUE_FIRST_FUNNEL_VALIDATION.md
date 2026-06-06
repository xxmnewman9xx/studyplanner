# Build 51 Value-First Funnel Validation

## Result

PASS

## Flow

1. Fresh install shows welcome/onboarding when `onboardingComplete` is false.
2. Onboarding asks for name using `Your first name`.
3. After onboarding, import options remain: Upload PDF, Paste manually, Scan with camera, Skip for now.
4. Import paths remain preview-only without entitlement.
5. Parsed review can be seen before purchase via `Preview only.` and `Unlock my semester`.
6. Apply routes to paywall when `data.prefs.premium` is false.
7. Purchase cancel/fail does not call unlock; restore failure reports no subscription and stays locked.
8. Skip uses `completeAnd("lockedDashboard")`.
9. Locked dashboard shows `0 / locked`, no dashboard data, no active schedule, no reminders.
10. Purchase/restore success calls `premiumData`; pending import applies only after entitlement unlock.

Validated by:

- `npm run check:build49`
- `npm run check:build51`
- `npm run test:hard-paywall`
- `npm run typecheck`
