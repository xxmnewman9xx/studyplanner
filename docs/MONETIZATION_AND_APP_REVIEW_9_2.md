# Monetization And App Review 9.2

Current monetization score: 8.2/10. Target: 9.2/10 before submission.

## Product IDs

- Monthly: `com.mattnewman.studyplanner.plus.monthly`
- Yearly: `com.mattnewman.studyplanner.plus.yearly`
- Lifetime: `com.mattnewman.studyplanner.plus.lifetime`

## Verdict

StoreKit code is honest and no fake entitlement path was found. Lifetime is implemented as a real in-app purchase path, not a subscription. Submission remains blocked until real App Store Connect setup and sandbox monthly/yearly/lifetime/restore proof are complete.

| Area | Status | Risk | 9.2 Requirement | Action |
| --- | --- | --- | --- | --- |
| Monthly/yearly | Code IDs preserved | Env IDs may be absent | Configured in production and sandbox-tested | Submission gate |
| Lifetime | Real non-consumable path | App Store Connect proof missing | Configured non-consumable only | Submission gate |
| Restore | Button exists | Sandbox proof missing | Restore after reinstall tested | Manual validation |
| Paywall copy | Mostly safe | Internal wording appears in Widget Setup | User-facing value copy only | Planned cleanup |
| Scanner claims | Photo hidden without endpoint | Marketing may overstate OCR | Text-based PDF/plain text unless endpoint live | Docs/copy cleanup |
