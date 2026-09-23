# Native Screenshot QA Runbook

Release: Back to School with AI
Purpose: produce final App Store and featuring-nomination evidence from real release UI.

## Rules

- Use a release, development, or TestFlight iOS build that includes the widget extension.
- Do not use Expo Go for WidgetKit screenshots.
- Do not composite Home Screen widget placements.
- Do not use web screenshots for App Store creative.
- Keep every capture tied to a reproducible state listed below.
- Store raw captures under `qa-screenshots/back-to-school-2026-native/`.

## Native Build Preflight

- Confirm the host has enough free disk for Xcode DerivedData before building. The 2026-07-06 simulator build attempt failed with `No space left on device` after generating 2.7 GB under `ios/build/BackToSchoolDerivedData`.
- Run `npm run check:back-to-school-native-disk` to write `qa/back-to-school-2026/native-disk-readiness.json` before native capture. It audits the current free-space gap, project-local safe cleanup candidates, and external review candidates without deleting anything.
- Use `npm run clean:back-to-school-native-disk` only for scoped generated project caches. It does not delete broad user folders, simulator device data, archives, Downloads, or prior release evidence.
- Use the existing workspace and scheme: `ios/StudyPlannerSyllabusAI.xcworkspace`, `StudyPlannerSyllabusAI`.
- Prefer an iOS 26 simulator or TestFlight device when validating Liquid Glass. The first attempted target was `Reflex QA iPhone 17` on iOS 26.5.
- Keep `qa/back-to-school-2026/native-build-attempt-2026-07-06.json` updated with the next successful build or blocker before producing final screenshot assets.
- Run `npm run check:back-to-school-native-preflight` before any native build attempt.
- Run `npm run plan:back-to-school-native-capture` to regenerate the deterministic app capture plan without launching Xcode.
- Once preflight is ready, run `npm run capture:back-to-school-native` to build, install, launch, and capture the app-side matrix into `qa-screenshots/back-to-school-2026-native/manifest.json`.
- If local disk remains blocked, run `npm run check:back-to-school-remote-capture` and follow `docs/launch/back-to-school-2026/remote-native-capture-runbook.md`. This uses an EAS simulator build profile with a guarded capture hook and does not start a paid EAS Simulator session during readiness checks.
- Run `npm run plan:back-to-school-app-captures` before and after any manual, TestFlight, local simulator, or EAS app screenshot capture. It scans for real app screenshots named with the app capture IDs below and writes `qa/back-to-school-2026/app-capture-ingest.json` without changing the native manifest.
- After reviewing real native app screenshots, run `npm run register:back-to-school-app-captures -- --source /path/to/native/app/screenshots`. This copies valid app captures into `qa-screenshots/back-to-school-2026-native/`, merges app entries into `qa-screenshots/back-to-school-2026-native/manifest.json`, and updates the app-side native capture run status only for real native app screenshots.
- The native capture runner covers app screenshots only. Home Screen and Lock Screen WidgetKit placements remain real-device/simulator placement captures and must not be composited.
- Run `npm run plan:back-to-school-widget-captures` before and after WidgetKit capture. It scans for real widget screenshots named with the capture IDs below and writes `qa/back-to-school-2026/widget-capture-ingest.json` without changing the native manifest.
- After reviewing real WidgetKit placement screenshots, run `npm run register:back-to-school-widget-captures -- --source /path/to/widget/screenshots`. This copies valid captures into `qa-screenshots/back-to-school-2026-native/`, merges widget entries into `qa-screenshots/back-to-school-2026-native/manifest.json`, and updates `nativeWidgetPlacement` only for real WidgetKit screenshots.
- After registering widget captures, run `npm run check:back-to-school-upload-package`, `npm run finalize:back-to-school-assets`, and `npm run check:back-to-school-submission`.

## App Capture Matrix

| ID | State | Theme | Required Proof |
| --- | --- | --- | --- |
| app-01-name | First launch onboarding name step | White default | First screen starts the semester setup story. |
| app-02-color-blue | Build action proof | White default | Minimal build step is immersive, readable, and has no color picker. |
| app-03-color-orange | Build action detail | White default | Setup stays personal without theme choices or student-type branching. |
| app-04-color-graphite | System proof | White default | White Apple-style system with automatic class colors is polished and accessible. |
| app-05-import-choice | Setup action step | White default | Camera, paste, and manual options are visible and paywall-first. |
| app-06-review | Import review | White default | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | Post-apply payoff | White default | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | Today dashboard | White default | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | Focus block | White default | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | Widget gallery/recommendation | White default | Semester Calendar is presented as the recommended Home Screen surface. |

## Native Widget Capture Matrix

| ID | State | Appearance | Required Proof |
| --- | --- | --- | --- |
| widget-01-empty-small | Empty semester | Light | Empty setup widget uses the quiet default system and zero-load calendar state. |
| widget-02-normal-medium | Calm semester | Light | Normal widgets inherit the quiet default system. |
| widget-03-exam-heavy-medium | Exam-heavy semester | Light | Calendar shows busy days, exam markers, and orange urgency. |
| widget-04-overdue-small | Overdue semester | Light | Today/Upcoming use red urgency, not the theme accent. |
| widget-05-dark-medium | Normal semester | Dark | Text, glass, and calendar cells remain readable. |
| widget-06-tinted-medium | Normal semester | Tinted/accented | Widget respects iOS accented/tinted rendering mode. |
| widget-07-lock-rectangular | Locked preview | Lock Screen rectangular | Accessory widget copy is concise and truthful. |
| widget-08-lock-circular | Locked preview | Lock Screen circular | Circular accessory avoids clipped text. |

## Accessibility Capture Matrix

| ID | State | Setting | Required Proof |
| --- | --- | --- | --- |
| ax-01-dynamic-type | Personal preview | Large text | No overlapping labels or clipped actions. |
| ax-02-reduce-transparency | Personal preview and widget gallery | Reduce Transparency | Liquid Glass fallback remains legible. |
| ax-03-rtl | Onboarding and review | RTL locale | Layout order, alignment, and dates remain usable. |
| ax-04-long-copy | Review and widget preview | Long localized copy | Copy tightens or wraps without hiding actions. |

## Acceptance Gates

- Every App Store screenshot candidate is captured from native release UI.
- Widget screenshots are captured from real WidgetKit surfaces.
- The white onboarding system is represented with automatic class colors and no visible color customization.
- Empty, normal, exam-heavy, dark, and tinted/accented widget states are represented.
- Claim boundaries remain visible in App Review notes and launch copy.
- `npm run typecheck`, `npm run qa:release`, `npm run test:widget-integrity`, `npm run test:back-to-school-widgets`, `npm run check:back-to-school-launch`, `npm run check:back-to-school-assets`, `npm run test:hard-paywall`, and `npm run check:iap` pass after captures are added.

## Output Manifest

After native capture, create `qa-screenshots/back-to-school-2026-native/manifest.json` with:

- filename,
- capture ID,
- device,
- build number,
- appearance,
- locale,
- accessibility settings,
- source state fixture,
- reviewer notes,
- pass/fail status.

App capture registration appends app-side entries to this same manifest. It writes `qa/back-to-school-2026/app-capture-ingest.json` with the source file, output path, dimensions, bytes, and hash for each required app state.

Widget capture registration appends WidgetKit entries to this same manifest. It also writes `qa/back-to-school-2026/widget-capture-ingest.json` with the source file, output path, dimensions, bytes, and hash for each required WidgetKit state.
