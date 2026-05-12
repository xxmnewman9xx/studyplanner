# VoiceOver Traversal Proof

Date checked: 2026-05-12

Reviewer: Codex local simulator pass

Device:
- Simulator: StudyPlanner-Codex-iPhone
- UDID: 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE
- Runtime shown by Simulator window: iOS 26.4

Method:
- The iOS 26.4 simulator Settings app did not expose a VoiceOver row under Accessibility, and Settings search returned no results for "VoiceOver".
- VoiceOver was enabled with a temporary simulator-only binary compiled outside the repository against the iPhone Simulator SDK Accessibility symbols.
- Toggle result: `before=0`, `after=1`.
- The simulator displayed Apple's "VoiceOver Gestures" modal after enabling VoiceOver, confirming the runtime assistive mode was active.
- Traversal used hardware VoiceOver next-item commands through the Simulator and Computer Use accessibility-tree observation. Screenshots were captured with `xcrun simctl io ... screenshot`.

Traversal settings:
- Content size: default at traversal start.
- Contrast: default at traversal start.
- Store/capture mode: existing capture build with safe synthetic planner data.
- No private student data was shown.

## Flow Results

| Flow | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Today | Pass | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/01-today-voiceover-active.png` | VoiceOver tree exposed the semester heading, next due card, `Open Lab Report`, `Start Lab Report`, `Mark Lab Report complete`, stats, `Open Week`, `Check Work`, week strip, workload forecast, widget preview, work-by-class summary, up-next task rows, and bottom navigation labels. |
| Check New Work | Pass | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/02-check-new-work-voiceover-active.png` | VoiceOver tree exposed `Check New Work`, parser-trust copy, `File`, `3 waiting for approval`, `Found 15 items`, `Looks Good`, `Check Date`, `Needs Check`, and the explanation that the user chooses what gets added. |
| Assignment Detail | Pass | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/03-assignment-detail-voiceover-active.png` | Opened from Today with VoiceOver active. Labels and roles were present for close, title field, due date field, due time field, course options, type, priority, status, estimated minutes, source note, labels field, disabled Save, Remove, and bottom navigation. |
| Widget Setup | Pass | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/04-widget-setup-voiceover-active.png` | VoiceOver tree exposed supported small/medium sizes, Next Due and This Week focus choices, widget styles, app color themes, live widget preview summary, and supported-widget scope copy. |
| Paywall | Pass with copy caveat | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/05-paywall-voiceover-active.png` | VoiceOver tree exposed Plus promise, included features, yearly/monthly products with prices, Subscribe, Restore Purchases, Continue with Free Planner, EULA, and Privacy Policy. The screen still showed the previous canceled-purchase banner from sandbox testing; it was accessible but should not be used as final marketing proof. |
| Settings and Restore | Pass with copy caveat | `artifacts/post-goal-aso-submission/external-proof/voiceover-screenshots/06-settings-restore-voiceover-active.png` | VoiceOver tree exposed semester status, theme controls, purchase status, View Plus, Restore Purchases, supported-widget scope, Privacy Policy, Support, and bottom navigation. The previous canceled-purchase banner was still visible and accessible. |

## Accessibility Tree Highlights

- Today primary action: `Open Lab Report, due May 13 at 5:00 PM`, hint `Opens assignment details.`
- Today completion action: `Mark Lab Report complete`, hint `Marks this assignment done and refreshes planner surfaces.`
- Trust boundary action: `Check Work`, hint `3 found items need your check before they show as due dates.`
- Assignment detail editable fields: `Assignment title`, `Due date`, `Due time`, `Estimated minutes`, and `Labels` all exposed settable values and practical hints.
- Widget setup controls: `Use Small widget size`, `Use Medium widget size`, `Show Next Due on widget`, `Show This Week on widget`, and style/theme options were reachable.
- Purchase controls: `Yearly Plus, Yearly, $24.99`, `Plus Monthly, Monthly, $3.99`, `Subscribe`, and `Restore Purchases` were reachable.

## Issues Found

- VoiceOver itself is hidden from the iOS 26.4 simulator Settings UI in this runtime, so this pass used a simulator-only SDK toggle. That method is acceptable for local proof but should be repeated on a physical device or a simulator runtime where the VoiceOver UI is visible before final App Store submission.
- Paywall and Settings retained the previous sandbox message `Purchase was cancelled.` after a canceled purchase attempt. This did not block VoiceOver traversal, but final paywall screenshots should be captured from a clean state.
- This pass validates the six requested app flows. It does not prove App Store purchase success, restore success, Lifetime entitlement, App Store Connect screenshot upload acceptance, or native-speaker localization review.

Final verdict: Pass for the requested Today, Check New Work, Assignment Detail, Widget Setup, Paywall, and Settings/Restore VoiceOver traversal on the local simulator.
