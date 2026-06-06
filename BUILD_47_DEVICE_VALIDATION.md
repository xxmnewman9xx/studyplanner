# Build 47 Device / Simulator Validation

## Simulator Evidence
- Existing Build 46 simulator screenshot path remains: `qa/build46-live/contact-sheet.png`.
- Build 47 automated route/paywall/widget gating is validated by `npm run check:build47`.

## No Entitlement
- Onboarding: PASS by source/check.
- Paywall: PASS by source/check.
- Restore visible: PASS.
- Locked deep links: PASS.
- No fake data: PASS.
- No scan access: PASS.
- No notes access: PASS.
- No dashboard leak: PASS.

## Entitlement
- PDF import: PASS by preserved import path and stress tests.
- Paste import: PASS by syllabus stress.
- Photo/OCR: PASS by preserved OCR path and prior native validation.
- Review pipeline: PASS.
- Dashboard: PASS.
- Notes: PASS.
- Widgets: PASS by WidgetKit/snapshot checks.
- Notifications: PASS by reminder/intelligence checks.

## Limitation
Sandbox purchase completion was not performed because sandbox Apple credentials were not available in this environment.
