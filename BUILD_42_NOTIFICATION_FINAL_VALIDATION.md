# Build 42 Notification Final Validation

Date: 2026-06-05

## Result

PASS

## Root Cause Fixed

The scheduling path previously built reminders through `buildSemesterSnapshot(data)` without passing the real current date. That snapshot defaulted to the fixed project seed date, so some notification triggers were valid relative to seed data but invalid relative to the simulator clock. iOS rejected those triggers with:

`NSInternalInconsistencyException Code=0 NSAssertFile=UNNotificationTrigger.m`

The fix updates `src/reminders.ts` to:

- Build notification plans with `buildNotificationPlan(data, new Date())`.
- Skip any trigger that is no longer safely in the future.
- Return permission status, scheduled count, and pending notification evidence.
- Add a hidden validation-only deep link path that schedules one near-term coach notification without exposing debug UI.

## Validation Evidence

Simulator: `ShiftPay Locale iPhone`

Commands / steps:

- Installed current app with `npx expo run:ios --device "ShiftPay Locale iPhone"`.
- Triggered validation path with `xcrun simctl openurl booted "studyplanner://reminders?validation=1"`.
- Captured screenshot: `qa/build42-final-gate/notification-validation-after-relaunch.png`.
- Waited beyond the validation trigger and captured: `qa/build42-final-gate/notification-validation-after-70s.png`.
- Extracted persisted app data: `qa/build42-final-gate/app-data-after-notification.json`.

In-app scheduling evidence:

- Status displayed: `13 reminders scheduled. Pending: 13. Quiet hours are 22:00-7:00.`
- Validation notification copy: `Stay ahead.` / `One block keeps you on track.`
- Scheduled IDs persisted in SQLite: 13.
- First persisted notification ID: `validation:build42:1780711204306`.
- Other persisted IDs include class, assignment, exam, and study reminder IDs.

SQLite evidence summary:

```json
{
  "reminders": 17,
  "scheduled": 13,
  "first": {
    "id": "r_validation:build42:1780711204306",
    "title": "Stay ahead.",
    "ids": ["validation:build42:1780711204306"],
    "lead": "One block keeps you on track."
  }
}
```

## Delivery Evidence

No visible simulator banner was captured after the 60-second validation trigger. This is not claimed as delivered.

Release pass criteria are still met because the granted path produced:

- Successful schedule call.
- Returned notification identifiers.
- Pending notification count.
- Persisted notification IDs.
- Safe resync path with no crash.
- Short semester-coach notification copy.

## Denied Permission Path

The denied path remains unchanged and safe:

`Notifications are off. Turn them on in iPhone Settings to receive reminders.`

## Release Risk

Low. The fix is isolated to reminder scheduling and validation evidence. It does not alter SemesterSnapshot calculations, parser flow, WidgetKit, IAP, imports, or app identifiers.
