# Android Notification Report - Sprint 001

## Existing Build 52 Notification Flow

- Notification library: `expo-notifications`.
- Planner source: `buildSemesterSnapshot(data).notificationPlan`.
- Scheduling entry point: `scheduleLocalReminders(data, options)` in `src/reminders.ts`.
- Existing reminder evidence:
  - assignment reminders
  - exam reminders
  - study reminders
  - class reminders
  - validation reminder path
- Existing handler:
  - shows alert/banner/list
  - sound disabled
  - badge disabled

## Android Implementation

- Added Android notification channel:
  - ID: `studyplanner-reminders`
  - Name: `StudyPlanner reminders`
  - Description: `Assignment, exam, class, and study block reminders.`
  - Importance: `DEFAULT`
  - Sound: none
  - Vibration: enabled pattern
  - Lock screen visibility: private
- `permissionState()` now ensures the Android channel exists before requesting permissions.
- `scheduleLocalReminders()` no longer returns unavailable on Android.
- Web remains unavailable.
- Scheduled notification triggers now include `channelId: "studyplanner-reminders"`.
- Existing quiet-hours and pending-notification evidence logic is preserved.

## Feature Coverage

- Assignment reminders: covered through existing `notificationPlan.items`.
- Exam reminders: covered through existing `notificationPlan.items`.
- Study block reminders: covered through existing study notification plan items and validation path.
- Class reminders: covered through existing notification plan items.

## Preserved Behavior

- No copy rewrite.
- No reminder model changes.
- No notification cadence changes.
- No badge/sound behavior change except Android channel uses no sound to match the existing calm notification posture.

## Remaining Blockers

- Android runtime notification permission and channel behavior must be tested on a device/emulator.
- Android 13+ `POST_NOTIFICATIONS` runtime prompt must be verified.
- Exact alarm behavior was not added; current implementation uses normal scheduled local notifications.
- If Play/device testing shows timing drift, evaluate whether exact alarms are justified. Do not add that permission without a product/policy decision.

## Commands

- `npm run typecheck`: PASS.
- `npm run check:build52`: PASS.
- `npx expo-doctor`: PASS.
- Runtime scheduling test: blocked by missing Android SDK/emulator on this machine.
