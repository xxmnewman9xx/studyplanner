# Build 46 App Review Checklist

## App Identity
- Bundle ID: com.mattnewman.studyplanner
- Version: 1.0.3
- Build: 46
- URL scheme: studyplanner
- Widget bundle: com.mattnewman.studyplanner.widgets
- App Group: group.com.mattnewman.studyplanner

## Subscription / IAP
- IAP product IDs preserved.
- Paywall appears after value is shown.
- Restore purchase path remains available.
- Terms, Privacy, Support, and subscription management links remain part of the account/paywall support surface.
- Copy sells semester visibility and confidence, not unsupported AI claims.
- Sandbox purchase completion requires Apple sandbox credentials.

## Permissions
- Notifications are requested when reminders are enabled, not during onboarding.
- Camera/photo/document use is tied to syllabus or notes import.
- Denied notification states are handled safely.

## Claims / Copy
- No misleading AI dependency claims.
- No chatbot claim.
- No unsupported academic outcome guarantee.
- Coach copy is deterministic and concise.

## Widgets / Deep Links
- WidgetKit extension preserved.
- App Group preserved.
- studyplanner://today deep link preserved.
- In-app Widget Studio/gallery remains hidden from user-facing flows.

## App Review Risk
- Low: IAP completion cannot be fully validated without sandbox credentials in this environment.
- Low: physical widget placement may require device-side review, but WidgetKit build/snapshot/deep-link evidence is preserved.

## Decision
PASS for TestFlight and live-submission preparation.
