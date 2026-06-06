# Build 44 Device Validation

## Environment
- Repo: `/Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai`
- Simulator: ShiftPay Locale iPhone
- Device UDID: `A990F44E-2F8E-4435-8CD2-4F267BC9AFCE`
- Version: `1.0.3`
- Build: `44`
- Bundle: `com.mattnewman.studyplanner`
- Widget bundle: `com.mattnewman.studyplanner.widgets`

## Commands Run
- `npx expo run:ios --device "ShiftPay Locale iPhone"`
- `xcrun simctl openurl A990F44E-2F8E-4435-8CD2-4F267BC9AFCE studyplanner://today`
- `xcrun simctl io A990F44E-2F8E-4435-8CD2-4F267BC9AFCE screenshot ...`

## Native Build Result
- First simulator build succeeded, but exposed one release blocker: widget extension `CFBundleVersion` remained `42` while the app was `44`.
- Fixed Xcode `CURRENT_PROJECT_VERSION` for app and widget targets.
- Second simulator build result: `0 error(s), 0 warning(s)`.
- WidgetKit extension compiled and embedded.
- StoreKit sandbox warning observed: `SKInternalErrorDomain Code=12`. This is expected without sandbox purchase credentials and did not crash the app.

## Screenshots
- `qa/build44/01-launch.png`
- `qa/build44/02-today-clean-build.png`
- `qa/build44/03-today-deeplink.png`
- `qa/build44/04-classes.png`
- `qa/build44/05-plan.png`
- `qa/build44/06-scan.png`
- `qa/build44/07-profile.png`

## Screen Validation

### Today / Dashboard
- Semester Health hero is dominant.
- Animated ring appears with health score and state label.
- “Why this score?” explains the primary driver.
- Feedback impact card is visible.
- Review CTA appears after a high-impact positive moment.
- Next Move remains directly below the hero.
- `studyplanner://today` deep link opens the Today surface.

### Classes
- Class Pulse is visible and grade-forward.
- Cards show forecast label, confidence mode, due count, exam count, and notes count.
- Remaining issue: class color blocks are still more vibrant than the strict premium monochrome direction. Non-blocking because status readability is good.

### Plan
- Monthly schedule is the main artifact.
- Semester narrative appears in the header.
- Autopilot explains why plan items exist.
- The month view uses subtle dots instead of a dense dashboard.

### Scan
- Syllabus import paths are visible:
  - Camera
  - Photo
  - Paste text
  - PDF
- Notes scan is visible and tied to summaries, terms, flashcards, quizzes, and review tasks.
- Quick capture remains visible.

### Profile
- Account/support surface renders.
- Manage subscription, terms/privacy, support, reminders, and import history are visible.
- Subscription state does not crash.

## Widgets
- WidgetKit extension builds cleanly.
- Widget bundle ID verified in config.
- App Group preserved.
- Deep link target `studyplanner://today` preserved.
- In-app widget studio/gallery UI remains hidden.
- Physical Home Screen/Lock Screen placement was not completed in this simulator pass; this remains non-blocking because WidgetKit build and snapshot/deep-link evidence are valid.

## Notifications
- Existing notification scheduling checks remain covered by Build 42 validation and intelligence tests.
- No notification delivery retest was performed in this Build 44 pass because the cycle did not alter reminder scheduling.

## IAP Boundary
- IAP dependencies and StoreKit path remain present.
- Sandbox purchase completion was not validated due missing sandbox Apple credentials.
- StoreKit warning did not crash the app.

## Result
PASS for simulator/device validation.
