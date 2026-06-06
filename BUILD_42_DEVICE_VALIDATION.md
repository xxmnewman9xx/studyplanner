# Build 42 Device Validation

Date: 2026-06-05  
Build under test: 1.0.3 (42)  
Bundle: com.mattnewman.studyplanner  
Environment: iOS simulator, `ShiftPay Locale iPhone`; no physical iPhone was attached.

## Scope

This validation used the most realistic simulator workflow available. It covered first launch, onboarding, paywall, syllabus import by paste, import review, semester generation, Today, Classes, Plan, Profile, reminders, WidgetKit snapshot sync, and deep links.

## Screenshots

Evidence is stored in `qa/build42-final-device/`.

- First launch: `05-first-launch-fresh.png`
- Paywall: `19-paywall-after-onboarding.png`
- IAP purchase attempt: `20-iap-purchase-attempt.png`
- Unlocked Today with simulator entitlement: `25-validation-unlocked-today.png`
- Scan screen: `26b-scan-screen.png`
- Photo permission denied state: `28b-photo-permission-denied.png`
- Paste import: `29-paste-import-screen.png`
- Pasted syllabus fixture: `30b-paste-fixture-entered.png`
- Import review: `31-import-review.png`
- Semester generation success: `32b-after-import-semester-generated.png`
- Dashboard after import: `33c-dashboard-after-import.png`
- Classes after import: `34d-classes-after-import.png`
- Plan after import: `35d-plan-after-import.png`
- Profile after import: `36d-profile-after-import.png`
- Deep link to Today after scheme fix: `39-deeplink-today-after-scheme-fix.png`
- Deep link to Reminders after scheme fix: `40-deeplink-reminders-after-scheme-fix.png`
- Notification permission prompt: `41b-notification-permission-or-scheduled.png`
- Notification prompt dismissed with Allow: `45-notification-allowed-scaled-click.png`
- Plan focus-block surface: `46-study-session-attempt.png`

## Results

| Area | Result | Notes |
|---|---:|---|
| First launch | Pass | Fresh install launched into onboarding cleanly. |
| Onboarding | Pass | Theme/personality flow completed and reached paywall. |
| Theme selection | Pass | Theme selection screen rendered and advanced. |
| Paywall products | Pass | App Store sandbox products loaded: yearly $24.99, monthly $3.99. |
| IAP purchase completion | Blocked | Purchase opened Apple Account sign-in. No sandbox credentials were available to complete the transaction. |
| Post-purchase validation | Partial | Used a simulator-only local entitlement in SQLite to validate app flows after unlock. No repo code was changed for this bypass. |
| Paste syllabus import | Pass | Fixture parsed into 2 classes, 3 tasks, and 2 exams. |
| Import review | Pass | Review screen showed editable/approvable detected coursework and applied 7 items. |
| PDF syllabus import | Fail | Current build labels this as “Upload PDF / Paste extracted text,” but no real PDF picker or local extraction path is exposed. |
| Photo/OCR import | Partial | Photo permission request/denied state validated. OCR extraction was not completed with an image fixture in this pass. |
| Semester generation | Pass | Import success produced Semester Health and populated dashboard state. |
| Semester Health | Pass | Health created from imported data; displayed score 83 and dimensions. |
| Today dashboard | Pass | Shows semester health, impact feedback, next action, next class, deadline, and focus block. |
| Classes | Pass | Shows imported classes with forecasts and counts. |
| Plan | Pass | Shows June monthly artifact, planner signals, pressure markers, and autopilot rationale. |
| Notes | Partial | Notes route exists, but the imported fixture created no notes and no note import was completed in this device pass. |
| Study Sessions | Partial | Study-session route is wired from Today/Plan in code; simulator tap hit Plan because bottom navigation overlapped the action. Plan focus-block surface was captured. |
| Notifications | Partial | Permission prompt displayed with correct App Store-safe purpose copy; prompt was accepted. Delivery/pending local notification evidence was not captured. |
| WidgetKit extension | Pass | Extension target, entitlements, and App Group are present. |
| Widget snapshots | Pass | App Group preferences contain widget layouts/timelines for Today, Upcoming, Week, and Class Progress with `studyplanner://today` links. |
| Actual widget placement | Blocked | Simulator Home Screen widget placement was not completed through automation. |
| Deep links | Pass after fix | `studyplanner://today` and `studyplanner://reminders` opened correctly after adding the `studyplanner` scheme. |

## Critical Fix Applied

Widget snapshots used `studyplanner://today`, but the native app previously registered only the bundle-ID URL scheme. Added `scheme: "studyplanner"` in `app.json` and regenerated iOS config. Verified `Info.plist` now includes:

- `studyplanner`
- `com.mattnewman.studyplanner`

This preserves build number 42.

## Commands Run

```sh
npx expo run:ios --device "ShiftPay Locale iPhone"
npx expo prebuild -p ios --no-install
npm run typecheck
npm run test:intelligence
npm run test:semester
npm run check:build42
npx expo config --type public
npx expo prebuild -p ios --no-install
npx pod-install ios
```

## Verification Summary

Passing repo checks:

- TypeScript: pass
- Intelligence tests: pass
- Semester snapshot tests: pass
- Build 42 check: pass
- Expo public config: pass
- iOS prebuild: pass
- Pods: pass

Release-gate blockers:

1. Real PDF import is not available in this build.
2. IAP purchase completion was not validated because sandbox Apple credentials were unavailable.
3. Actual Home Screen/Lock Screen widget placement was not completed.
4. Notification delivery was not captured after permission grant.

