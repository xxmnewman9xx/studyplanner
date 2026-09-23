# Back-to-School 2026 Release Cycle Gate

Generated: 2026-07-09T09:32:56.990Z
Release: Back to School with AI
Local cycle passed: no
Submission ready: no
Recommended submission mode: Save as Draft only

This gate runs the command set named by the App Store nomination packet and records the current submission state. Passing this gate means the local release cycle is internally consistent; it does not override native capture, WidgetKit, final screenshot, or hosted supplemental URL blockers.

## Commands

| Command | Status | Duration |
| --- | --- | --- |
| npm run typecheck | passed | 1.7s |
| npm run qa:release | passed | 0.6s |
| npm run test:widget-integrity | passed | 0.1s |
| npm run test:back-to-school-widgets | passed | 0.3s |
| npm run check:back-to-school-launch | failed | 4.2s |
| npm run check:back-to-school-assets | passed | 0.2s |
| npm run check:back-to-school-supplementals | passed | 0.2s |
| npm run check:back-to-school-upload-package | passed | 0.3s |
| npm run check:back-to-school-marketing-assets | passed | 0.3s |
| npm run check:back-to-school-remote-capture | passed | 1.8s |
| npm run check:back-to-school-editorial | failed | 0.3s |
| npm run finalize:back-to-school-assets | passed | 0.2s |
| npm run check:back-to-school-submission | passed | 0.2s |
| npm run check:back-to-school-submission-runbook | failed | 0.3s |
| npm run check:back-to-school-execution-board | passed | 0.3s |
| npm run test:hard-paywall | passed | 0.1s |
| npm run check:iap | passed | 0.1s |

## Artifact Status

- Launch ready: no
- Editorial ready: no
- Submission gate ready: no
- Native capture ready: no
- Assets ready: no
- Asset finalization: ready_to_apply
- Upload package ready: no
- Marketing draft ready: yes
- Marketing final ready: no
- Submission runbook: draft_only
- Submission runbook ready: no
- Execution board: blocked_execution_board
- Execution board ready: no
- Execution critical lane: native-capture-unlock

## Blocked Gates

- nomination-copy
- native-capture-preflight
- remote-capture-fallback
- app-store-screenshots
- widgetkit-proof
- supplemental-materials
- upload-package
- all-assets-ready
- editorial-board
- launch-audit

## Current Blockers

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
- assets: 16/21 assets are marked ready.
- assets: 13 assets still depend on native app or WidgetKit capture proof.
- assets: Upload or link all five supplemental materials before App Store Connect nomination submission.
- upload-package: Finalize all nine App Store screenshots from native release captures.
- upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- marketing: promo-hero: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- marketing: promo-widget-sheet: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- marketing: social-import: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- marketing: social-trust: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- marketing: social-widget: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- marketing: social-focus: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: submission: nomination-copy: Nomination copy, type, platform, character limits, or lead time is not ready.
- submission-runbook: submission: native-capture-preflight: Free local disk before rerunning the native simulator build.
- submission-runbook: submission: remote-capture-fallback: eas-auth: Authenticate with EAS or set EXPO_TOKEN before remote capture.
- submission-runbook: submission: remote-capture-fallback: capture-targets: Regenerate the Back-to-School native capture plan.
- submission-runbook: submission: app-store-screenshots: Final App Store screenshot manifest has not been applied from native captures.
- submission-runbook: submission: widgetkit-proof: Real WidgetKit Home Screen and Lock Screen placement screenshots are missing.
- submission-runbook: submission: supplemental-materials: screenshot-contact-sheet: Generate the screenshot contact sheet from native release captures only.
- submission-runbook: submission: supplemental-materials: native-widget-sheet: Capture real Home Screen and Lock Screen WidgetKit states.
- submission-runbook: submission: supplemental-materials: accessibility-localization-summary: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence.
- submission-runbook: submission: supplemental-materials: accessibility-localization-summary: Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization.
- submission-runbook: submission: supplemental-materials: accessibility-localization-summary: Summarize localization and accessibility QA with final native screenshots.
- submission-runbook: submission: upload-package: Finalize all nine App Store screenshots from native release captures.
- submission-runbook: submission: upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- submission-runbook: submission: upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- submission-runbook: submission: upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- submission-runbook: submission: upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- submission-runbook: submission: upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- submission-runbook: submission: all-assets-ready: 16/21 assets are marked ready.
- submission-runbook: submission: all-assets-ready: 13 assets still depend on native app or WidgetKit capture proof.
- submission-runbook: submission: all-assets-ready: Upload or link all five supplemental materials before App Store Connect nomination submission.
- submission-runbook: submission: editorial-board: Editorial readiness board still has blocked or planned items.
- submission-runbook: submission: launch-audit: Launch readiness audit still records blockers.
- submission-runbook: upload-package: Finalize all nine App Store screenshots from native release captures.
- submission-runbook: upload-package: Capture every required real WidgetKit Home Screen and Lock Screen state.
- submission-runbook: upload-package: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- submission-runbook: upload-package: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- submission-runbook: upload-package: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- submission-runbook: upload-package: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- submission-runbook: launch: Native iOS build rerun after freeing disk for Xcode DerivedData
- submission-runbook: launch: Free local disk before rerunning native build/capture.
- submission-runbook: launch: Finalize all nine App Store screenshots from native release captures.
- submission-runbook: launch: Capture every required real WidgetKit Home Screen and Lock Screen state.
- submission-runbook: launch: Upload all five supplemental materials to stable HTTPS URLs and update the asset manifest.
- submission-runbook: launch: screenshot-contact-sheet is not upload-ready: Generate the screenshot contact sheet from native release captures only.
- submission-runbook: launch: native-widget-sheet is not upload-ready: Capture real Home Screen and Lock Screen WidgetKit states.
- submission-runbook: launch: accessibility-localization-summary is not upload-ready: Refresh the accessibility/localization summary with localized white setup, automatic class colors, personal preview, and widget QA evidence. Keep source and Build 77 gate coverage for white onboarding, automatic class colors, accessibility, and localization. Summarize localization and accessibility QA with final native screenshots.
- submission-runbook: launch: promo-hero: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: launch: promo-widget-sheet: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: launch: social-import: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: launch: social-trust: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: launch: social-widget: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: launch: social-focus: Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.
- submission-runbook: editorial: apple-fields is not ready.
- submission-runbook: editorial: native-build is not ready.
- submission-runbook: editorial: app-store-screenshots is not ready.
- submission-runbook: editorial: widgets is not ready.
- submission-runbook: editorial: supplemental-materials is not ready.
- native-preflight: disk: Free local disk before rerunning the native simulator build.
