# Build 49 Physical Validation

## Result
FAIL for submission readiness.

The core value-first locked funnel passed repeated simulator validation, but TestFlight submission was not attempted because real homescreen widget validation could not be completed in this environment.

## Environment
- Date: 2026-06-06
- Physical device: not available. `xcrun devicectl list devices` returned no devices.
- Simulator: `ShiftPay Locale iPhone`, iOS 26.5, UDID `A990F44E-2F8E-4435-8CD2-4F267BC9AFCE`
- Build installed for validation: `ios/build/Build/Products/Release-iphonesimulator/StudyplannerSyllabusAI.app`
- Installed app metadata: version `1.0.3`, build `49`, bundle `com.mattnewman.studyplanner`

## Core Funnel Findings
- Welcome/onboarding launches cleanly from fresh install.
- Onboarding asks for name.
- Completing onboarding lands on import options:
  - Upload PDF
  - Paste manually
  - Scan with camera
  - Skip for now
- Skip routes to locked dashboard.
- Locked dashboard shows locked state, `0 / locked`, no active schedule, no dashboard data, and scan/unlock CTAs.
- Paste/manual import runs in preview mode.
- Preview shows parsed value: 1 class, 2 assignments, 2 exams, moderate pressure preview, and first recommended action.
- `Unlock my semester` opens the hard paywall.
- Entering paywall does not apply parsed data.
- Restore without an active Apple subscription shows failure/no active subscription and keeps the app locked.
- Deep links did not bypass the lock.

## Storage Assertions
Representative post-paywall and post-restore-cancel storage state:

```json
{
  "premium": false,
  "onboardingComplete": true,
  "classes": 0,
  "tasks": 0,
  "exams": 0,
  "notes": 0
}
```

## Repeated Runs Completed
- Fresh install onboarding: 10/10 PASS
- Skip to locked dashboard: 10/10 PASS
- Import preview to paywall: 10/10 PASS
- Locked deep links: 11/10 PASS
- Old/corrupt storage migration: 5/5 PASS

## Screenshots And Logs
- Welcome: `qa/build49-launch.png`
- Name onboarding: `qa/build49-after-welcome-tap.png`
- Import options: `qa/build49-import-options.png`
- Locked dashboard: `qa/build49-locked-dashboard.png`
- Scan preview route: `qa/build49-scan-preview.png`
- Paste import: `qa/build49-paste-filled-syllabus.png`
- Review preview: `qa/build49-review-after-multitap.png`
- Paywall from preview: `qa/build49-paywall-from-preview2.png`
- Restore failure/cancel: `qa/build49-restore-failure.png`, `qa/build49-restore-cancelled.png`
- Stress log: `qa/build49-stress-loop-results.log`

## Widget Validation Blocker
The simulator app bundle contains `PlugIns/ExpoWidgetsTarget.appex`, and app/widget entitlement files contain `group.com.mattnewman.studyplanner`.

However, the installed simulator build was produced with `CODE_SIGNING_ALLOWED=NO`, and `xcrun simctl appinfo booted com.mattnewman.studyplanner` reported:

```text
GroupContainers = { };
```

That means the installed simulator build could not validate the real App Group backed homescreen widget data path.

Attempted mitigation:

```sh
xcodebuild -workspace ios/StudyplannerSyllabusAI.xcworkspace \
  -scheme StudyplannerSyllabusAI \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'id=A990F44E-2F8E-4435-8CD2-4F267BC9AFCE' \
  -derivedDataPath ios/build-signed-sim build
```

Result: failed with exit code 65 before an installable signed simulator app was produced. The failing build phase was:

```text
PhaseScriptExecution [CP-User] [RNCore] Replace React Native Core for the right configuration, if needed
```

Because no physical device was available and no signed simulator app with active App Groups could be installed, real homescreen widget validation remains incomplete.

## Other Limitations
- Purchase success/restore success was not available on the simulator because no active sandbox Apple subscription was available.
- PDF/photo picker paths were visible in the pre-paywall import UI, but repeatable physical selection was not completed in the simulator run.
- Competitive R&D/visual redesign was not performed because the requested validation phase explicitly said not to change product behavior or redesign unless a blocker was found.

## Final Decision
FAIL for TestFlight submission readiness.

No entitlement = locked was preserved in all completed runs. Submission was not attempted because real homescreen widget validation is incomplete.
