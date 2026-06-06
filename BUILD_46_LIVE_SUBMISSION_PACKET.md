# Build 46 Live Submission Packet

## What Changed Since Build 45
- Welcome screen now leads with semester clarity and premium product framing.
- Onboarding now includes fast persona, semester goal, theme, value, and scan-intent steps.
- Primary CTAs now point to the core promise: build the semester from a syllabus.
- Post-import sequence now reads like a polished product moment:
  - Reading syllabus
  - Finding deadlines
  - Building schedule
  - Calculating Semester Health
  - Preparing next move
- Build metadata updated to 46 while preserving version 1.0.3.

## App Review Notes
- The app uses local deterministic semester intelligence.
- No external AI API or chatbot claim is required for review.
- Camera/photo/document access supports syllabus and notes import.
- Notifications are for class, assignment, exam, and study reminders.
- Restore purchase is available.

## Subscription / IAP Notes
- Subscription copy focuses on semester visibility, health, planning, reminders, widgets, and confidence.
- IAP IDs are preserved from prior verified builds.
- Full purchase completion requires App Store sandbox credentials.

## Testing Account Notes
- If App Review requires subscription validation, provide a sandbox Apple ID with access to the configured IAP products.

## Known Limitations
- OCR and PDF extraction degrade gracefully on poor scans or extraction failures by routing users to review/fallback paths.
- Low-confidence imported rows require user review before applying.

## Final QA Status
- Automated release checks: PASS.
- Parser and notes stress tests: PASS.
- Global syllabus and notes tests: PASS.
- Build 46 live check: PASS.
- Simulator screenshot evidence: qa/build46-live/contact-sheet.png.

## Recommended Release Decision
Submit Build 46 to TestFlight. Use it as the live-submission candidate if App Store Connect processing succeeds and TestFlight smoke review does not reveal a device-only issue.
