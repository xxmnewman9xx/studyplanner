# VoiceOver Traversal Attempt Log

Date checked: 2026-05-12

Status: traversal proof was completed after these attempts uncovered a working simulator-only VoiceOver toggle path. The proof is recorded in `voiceover-traversal.md`; this file remains the tooling-attempt log.

Simulator:
- `StudyPlanner-Codex-iPhone`
- UDID: `6CBE6A7A-1778-406F-9F5B-3FDAA45310CE`
- State at check time: booted

Attempts:

1. `xcrun simctl help ui`
   - Result: supported options are appearance, increase contrast, and content size.
   - Conclusion: `simctl ui` cannot perform or record VoiceOver traversal.

2. `/Applications/Xcode.app/Contents/Applications/Accessibility Inspector.app/Contents/MacOS/Accessibility Inspector --help`
   - Result: launched the Accessibility Inspector GUI process and `axAuditService`; no usable command-line traversal report was produced.
   - Cleanup: the Inspector and service processes were killed after the check.
   - Conclusion: Accessibility Inspector may still be used manually, but this did not create traversal proof.

3. `xcodebuild test -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme StudyPlannerSyllabusAI -destination 'platform=iOS Simulator,id=6CBE6A7A-1778-406F-9F5B-3FDAA45310CE' -only-testing:StudyPlannerSyllabusAIUITests`
   - Result: failed with “There are no test bundles available to test.”
   - Conclusion: there is no UI test bundle available to automate traversal in the current project.

4. Settings UI search
   - Result: iOS Settings search returned “No Results for ‘VoiceOver’,” and the Accessibility screen exposed Hover Text, Display & Text Size, Motion, Spoken Content, Face ID & Attention, Control Nearby Devices, and Subtitles & Captioning, but no VoiceOver row.
   - Conclusion: normal Settings-based enablement was unavailable on this iOS 26.4 simulator runtime.

5. Temporary simulator SDK toggle
   - Result: a temporary C program compiled outside the repository against the iPhone Simulator SDK called `_AXSVoiceOverTouchSetEnabled(true)` and reported `before=0`, `after=1`.
   - Confirmation: the simulator displayed Apple’s “VoiceOver Gestures” modal, then the app exposed VoiceOver accessibility trees for the required flows.
   - Conclusion: this enabled a real local traversal pass. Results are recorded in `voiceover-traversal.md`.

Current required action:
Repeat the traversal on a physical device or a simulator runtime with visible Settings support before a final App Store submission if the release owner wants device-level confirmation beyond this local simulator pass.
