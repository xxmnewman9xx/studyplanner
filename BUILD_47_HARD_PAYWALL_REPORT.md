# Build 47 Hard Paywall Report

## Gate
Allowed before purchase:
- Welcome
- Onboarding
- Paywall
- Restore purchases
- Terms / Privacy through paywall links

Locked before entitlement:
- Scan/import
- PDF import
- OCR/photo import
- Paste syllabus
- Notes scanner
- Today dashboard
- Classes
- Plan
- Widgets data
- Reminders
- Study sessions
- Deep links into meaningful app routes

## Implementation
- `hardGateActive` now applies to every meaningful route when `premium` is false.
- Onboarding sets `osLive` and routes to paywall.
- Deep links route locked users to welcome or paywall.
- Purchase success and restore set premium entitlement only from StoreKit/active subscription evidence.

## Compliance
- Real IAP IDs preserved.
- Restore Purchases visible.
- Terms and Privacy visible.
- Price is shown from StoreKit when available, otherwise “Shown by App Store.”
- No mock purchase success.

## Validation
- Purchase path reaches StoreKit boundary: PASS by wiring.
- Restore path present/no-crash: PASS by source and prior runtime validation.
- Entitlement persistence: PASS by storage flow.
- Deep links gated: PASS.
- Notification/widget data gated: PASS.

## Limitation
Full sandbox purchase completion still requires sandbox Apple credentials.
