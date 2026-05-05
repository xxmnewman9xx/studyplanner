# App Review Notes

StudyPlanner Plus is available through the in-app subscription screen. To test Syllabus Scan, open the app, complete onboarding, choose Study Planner Plus, subscribe using Apple's sandbox purchase flow, then open Syllabus Scan from the Scan tab. Restore Purchases is available on the paywall.

The app uses Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://github.com/xxmnewman9xx/studyplanner/blob/main/docs/PRIVACY_POLICY.md

Supported syllabus upload flow for this build:

1. Use the Scan tab after Plus is active.
2. Choose File to select a text-based PDF or plain-text syllabus from Files.
3. Review detected courses, deadlines, and grade categories.
4. Apply the parsed plan only after review.

Photo and camera OCR entry points are shown only when a production online parser endpoint is configured. This build keeps the Scan feature available through Files instead of showing an unavailable photo/OCR feature.
