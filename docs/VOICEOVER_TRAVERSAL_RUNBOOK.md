# VoiceOver Traversal Runbook

Date created: 2026-05-12

Purpose: provide the exact manual/device path needed to clear the remaining VoiceOver traversal blocker. This is a runbook, not proof. Do not rename or copy it to `voiceover-traversal.md` unless the traversal has actually been performed.

## Current Blocker

`npm run verify:goal92` and `npm run verify:submission` both require real traversal evidence at:

`artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`

The source audit is already clean, but it is not a substitute for a VoiceOver pass. The proof file must cover Today, Check New Work, Assignment Detail, Widget Setup, Paywall, and Settings/Restore.

## Tooling Attempts

These local checks were run on 2026-05-12:

| Attempt | Result | Impact |
| --- | --- | --- |
| `xcrun simctl help ui` | Only appearance, increase contrast, and content size are supported | `simctl` cannot perform VoiceOver traversal |
| `/Applications/Xcode.app/Contents/Applications/Accessibility Inspector.app/Contents/MacOS/Accessibility Inspector --help` | Launches the GUI app and `axAuditService`; no useful CLI traversal output | Accessibility Inspector remains a manual GUI tool for this pass |
| `xcodebuild test -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme StudyPlannerSyllabusAI -destination 'platform=iOS Simulator,id=6CBE6A7A-1778-406F-9F5B-3FDAA45310CE' -only-testing:StudyPlannerSyllabusAIUITests` | Failed with “There are no test bundles available to test.” | The project has no UI test bundle to automate traversal today |

## Prerequisites

1. Boot `StudyPlanner-Codex-iPhone` (`6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`).
2. Install a current build with capture data available:
   `EXPO_PUBLIC_STORE_CAPTURE=1 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`
3. Enable VoiceOver on the simulator or use Accessibility Inspector against the simulator.
4. Keep `docs/VOICEOVER_READINESS_AUDIT.md` open as the source-level checklist. It currently reports no missing explicit labels, roles, or recommended hints.

## Traversal Routes

Open each route with `xcrun simctl openurl 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE '<url>'`, then traverse with VoiceOver.

| Flow | Deep link | Must verify |
| --- | --- | --- |
| Today | `studyplanner://capture?tab=today` | Hero assignment, Past Due/Today groups, Check Work warning, reminders summary, bottom dock |
| Check New Work | `studyplanner://capture?tab=import&state=edit-found-work` | Found work list, Looks Good action, edit action, source note, no confusing unlabeled controls |
| Assignment Detail | `studyplanner://capture?tab=today&assignment=assignment-lab-report` | Close, title, due date/time, class selector, labels, status/priority/type controls, save/complete actions |
| Widget Setup | `studyplanner://capture?tab=upgrade` | Size selector, focus selector, style selector, theme selector, live preview summary, Plus gate copy |
| Paywall | `studyplanner://capture?tab=paywall` | Close, product-load failure state, restore, legal links, plan CTA if products load |
| Settings/Restore | `studyplanner://capture?tab=settings&scroll=330` | Planner status, Restore Purchases, Privacy Policy, Support fallback, widget scope |

## Proof File Requirements

Create `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md` only after traversal. Include:

- Date checked.
- Simulator/device UDID and iOS runtime.
- Whether VoiceOver was enabled on device or tested via Accessibility Inspector.
- Content size and contrast settings.
- Pass/fail result for Today, Check New Work, Assignment Detail, Widget Setup, Paywall, and Settings/Restore.
- Labels or controls that were confusing, skipped, duplicated, or unreachable.
- Screenshot paths or notes for any failures.
- Reviewer name.
- Remaining issues and whether they block the 9.2 goal.

The verifier rejects placeholder/template language, so keep the proof specific and concrete.
