# Back-to-School 2026 Execution Board

Generated: 2026-07-09T09:32:56.696Z
Release: Back to School with AI
Status: blocked_execution_board
Critical lane: native-capture-unlock

This board collapses the current launch, asset, editorial, upload, and submission blockers into ordered owner lanes. It does not mark external proof as done; it makes the remaining execution sequence explicit.

## Lane Summary

| Lane | Owner | Status | Next action |
| --- | --- | --- | --- |
| native-capture-unlock | Native Capture Agent | blocked | Free about 11.5 GiB or run the guarded remote capture fallback for app-side screenshots. |
| app-capture-ingest | App Screenshot Agent | ready | Refresh asset finalization so app screenshot slots are fulfilled. |
| widgetkit-proof | WidgetKit QA Agent | ready | Refresh final assets so WidgetKit proof fills the App Store screenshot slots. |
| app-store-assets | Creative Asset Agent | blocked | Apply final assets only after app-side and WidgetKit capture proof are present. |
| supplemental-urls | Supplemental Materials Agent | waiting | Upload the five supplemental materials and register stable HTTPS URLs. |
| marketing-finalization | Marketing Asset Agent | draft_ready | Replace draft marketing candidates after final native capture and asset finalization. |
| editorial-submission | Release Manager | waiting | Keep the App Store Connect nomination in Save as Draft until all upstream lanes are ready. |

## Subagent Lanes

| Subagent | Owns | Handoff |
| --- | --- | --- |
| native-capture-agent | native-capture-unlock, app-capture-ingest | Native capture manifest and reviewed app-side screenshot files. |
| widgetkit-qa-agent | widgetkit-proof | Widget capture ingest artifact and native WidgetKit screenshot sheet. |
| creative-asset-agent | app-store-assets, marketing-finalization | Applied asset manifest, upload package, and final marketing asset package. |
| supplemental-materials-agent | supplemental-urls | Five registered HTTPS URLs and refreshed upload package. |
| release-manager | editorial-submission | Manual submission after release-cycle and submission gates are ready. |

## Lane Details

### native-capture-unlock

Owner: Native Capture Agent
Status: blocked
Objective: Make a release-build capture path available for Liquid Glass onboarding and app-side screenshots.
Depends on: None
Next action: Free about 11.5 GiB or run the guarded remote capture fallback for app-side screenshots.

Evidence:
- 3.5 GiB free before cleanup
- 11.5 GiB disk gap
- 5/6 native preflight checks ready
- Remote fallback ready: no (back-to-school-sim)

Commands:
- `npm run check:back-to-school-native-disk`
- `npm run clean:back-to-school-native-disk`
- `npm run check:back-to-school-native-preflight`
- `npm run capture:back-to-school-native`

Exit criteria:
- Native preflight reports captureReady: true, or the guarded remote capture path produces reviewed app-side screenshots.
- No app screenshot is accepted unless it comes from release/TestFlight/native simulator evidence.

Blockers:
- Free at least 11.5 GiB before rerunning native capture.
- Project-local auto-safe cleanup is not enough and the measured external candidates do not close the gap; use the remote capture fallback.
- Do not delete real WidgetKit, App Store, or launch evidence without copying it into the release packet first.
- disk: Free local disk before rerunning the native simulator build.
- eas-auth: Authenticate with EAS or set EXPO_TOKEN before remote capture.
- capture-targets: Regenerate the Back-to-School native capture plan.

### app-capture-ingest

Owner: App Screenshot Agent
Status: ready
Objective: Register the app-side screenshots required by the App Store screenshot story.
Depends on: native-capture-unlock
Next action: Refresh asset finalization so app screenshot slots are fulfilled.

Evidence:
- Native capture run status: captured
- 102 planned app capture targets
- ready_to_apply app capture ingest status
- 0 app capture slot(s) missing

Commands:
- `npm run plan:back-to-school-native-capture`
- `npm run capture:back-to-school-native`
- `npm run register:back-to-school-app-captures`
- `npm run finalize:back-to-school-assets`

Exit criteria:
- Every app-side capture ID in the native screenshot runbook has a reviewed PNG/JPEG evidence file.
- Asset finalization can resolve app screenshot slots from qa-screenshots/back-to-school-2026-native/manifest.json.

Blockers:
- None

### widgetkit-proof

Owner: WidgetKit QA Agent
Status: ready
Objective: Capture real Home Screen and Lock Screen WidgetKit proof for the calendar widget story.
Depends on: native-capture-unlock
Next action: Refresh final assets so WidgetKit proof fills the App Store screenshot slots.

Evidence:
- Widget placement status: manual_native_capture_required
- partial_ready widget capture ingest status
- 0 WidgetKit capture slot(s) missing

Commands:
- `npm run plan:back-to-school-widget-captures`
- `npm run register:back-to-school-widget-captures`
- `npm run finalize:back-to-school-assets`

Exit criteria:
- Home Screen/Lock Screen widget screenshots are real native WidgetKit captures, not web composites.
- Dark and tinted/accented widget states are represented where the runbook requires them.

Blockers:
- None

### app-store-assets

Owner: Creative Asset Agent
Status: blocked
Objective: Turn native app and WidgetKit captures into final App Store screenshots and contact sheets.
Depends on: app-capture-ingest, widgetkit-proof
Next action: Apply final assets only after app-side and WidgetKit capture proof are present.

Evidence:
- Asset finalization status: ready_to_apply
- 9/9 screenshot slots fulfilled
- 9/9 upload-package screenshot slots covered

Commands:
- `npm run finalize:back-to-school-assets`
- `npm run apply:back-to-school-assets`
- `npm run check:back-to-school-assets`
- `npm run check:back-to-school-upload-package`

Exit criteria:
- Asset finalization status is applied.
- All nine App Store screenshot slots are fulfilled from native release evidence.
- The screenshot contact sheet is regenerated from final evidence.

Blockers:
- None

### supplemental-urls

Owner: Supplemental Materials Agent
Status: waiting
Objective: Publish all five App Store Connect supplemental materials as stable HTTPS URLs.
Depends on: app-store-assets
Next action: Upload the five supplemental materials and register stable HTTPS URLs.

Evidence:
- 2/5 supplemental material URLs ready
- 1/5 local supplemental candidates ready
- 5/5 URLs registered
- 2/5 upload-package URLs covered

Commands:
- `npm run check:back-to-school-supplementals`
- `npm run check:back-to-school-upload-package`
- `npm run register:back-to-school-supplemental-urls -- --set slot-id=https://...`
- `npm run check:back-to-school-submission-runbook`

Exit criteria:
- All five supplemental slots have stable HTTPS URLs.
- No local file, localhost URL, placeholder, or temporary signed URL is registered.
- Upload package reports packageReady: true.

Blockers:
- screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.
- native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.
- accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.
- accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.
- accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots.

### marketing-finalization

Owner: Marketing Asset Agent
Status: draft_ready
Objective: Replace draft promotional/social assets with final native release screenshots or approved hosted artwork.
Depends on: app-store-assets
Next action: Replace draft marketing candidates after final native capture and asset finalization.

Evidence:
- Marketing package status: draft_ready
- Draft ready: yes
- Final ready: no
- 6 marketing asset slots tracked

Commands:
- `npm run check:back-to-school-marketing-assets`
- `npm run check:back-to-school-launch`

Exit criteria:
- Promotional and social assets use final native screenshots, real WidgetKit captures, or approved hosted artwork.
- Marketing package reports finalReady: true.

Blockers:
- promo-hero: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- promo-widget-sheet: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- social-import: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- social-trust: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- social-widget: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- social-focus: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.

### editorial-submission

Owner: Release Manager
Status: waiting
Objective: Submit the App Enhancements featuring nomination manually when all proof is ready.
Depends on: app-store-assets, supplemental-urls, marketing-finalization
Next action: Keep the App Store Connect nomination in Save as Draft until all upstream lanes are ready.

Evidence:
- Editorial ready: no
- Submission gate ready: no
- Submission runbook status: draft_only
- Recommended mode: Save as Draft only

Commands:
- `npm run check:back-to-school-editorial`
- `npm run check:back-to-school-submission`
- `npm run check:back-to-school-submission-runbook`
- `npm run check:back-to-school-release-cycle`

Exit criteria:
- Editorial board reports submissionReady: true.
- Submission gate reports submissionReady: true.
- Submission runbook reports ready_for_manual_submit.
- App Store Connect nomination is submitted manually, not via CSV import.

Blockers:
- nomination-copy: Nomination copy, type, platform, character limits, or lead time is not ready.
- native-capture-preflight: Free local disk before rerunning the native simulator build.
- remote-capture-fallback: eas-auth: Authenticate with EAS or set EXPO_TOKEN before remote capture.
- remote-capture-fallback: capture-targets: Regenerate the Back-to-School native capture plan.
- app-store-screenshots: Final App Store screenshot manifest has not been applied from native captures.
- widgetkit-proof: Real WidgetKit Home Screen and Lock Screen placement screenshots are missing.
- supplemental-materials: screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.
- supplemental-materials: native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.
- supplemental-materials: accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.
- supplemental-materials: accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.
- supplemental-materials: accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots.
- upload-package: Finalize all nine App Store screenshots from native release captures.
- upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- all-assets-ready: 16/21 assets are marked ready.
- all-assets-ready: 13 assets still depend on native app or WidgetKit capture proof.
- all-assets-ready: Upload or link all five supplemental materials before App Store Connect nomination submission.
- editorial-board: Editorial readiness board still has blocked or planned items.
- launch-audit: Launch readiness audit still records blockers.
- submission: nomination-copy: Nomination copy, type, platform, character limits, or lead time is not ready.
- submission: native-capture-preflight: Free local disk before rerunning the native simulator build.
- submission: remote-capture-fallback: eas-auth: Authenticate with EAS or set EXPO_TOKEN before remote capture.
- submission: remote-capture-fallback: capture-targets: Regenerate the Back-to-School native capture plan.
- submission: app-store-screenshots: Final App Store screenshot manifest has not been applied from native captures.
- submission: widgetkit-proof: Real WidgetKit Home Screen and Lock Screen placement screenshots are missing.
- submission: supplemental-materials: screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.
- submission: supplemental-materials: native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.
- submission: supplemental-materials: accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.
- submission: supplemental-materials: accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.
- submission: supplemental-materials: accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots.
- submission: upload-package: Finalize all nine App Store screenshots from native release captures.
- submission: upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- submission: upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- submission: upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- submission: upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- submission: upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- submission: all-assets-ready: 16/21 assets are marked ready.
- submission: all-assets-ready: 13 assets still depend on native app or WidgetKit capture proof.
- submission: all-assets-ready: Upload or link all five supplemental materials before App Store Connect nomination submission.
- submission: editorial-board: Editorial readiness board still has blocked or planned items.
- submission: launch-audit: Launch readiness audit still records blockers.
- launch: Native iOS build rerun after freeing disk for Xcode DerivedData
- launch: Free local disk before rerunning native build/capture.
- launch: Finalize all nine App Store screenshots from native release captures.
- launch: Capture every required real WidgetKit Home Screen and Lock Screen state.
- launch: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- launch: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- launch: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- launch: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- launch: promo-hero: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: promo-widget-sheet: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-import: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-trust: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-widget: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- launch: social-focus: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- editorial: apple-fields is not ready.
- editorial: native-build is not ready.
- editorial: app-store-screenshots is not ready.
- editorial: widgets is not ready.
- editorial: supplemental-materials is not ready.

