# App Review Notes

StudyPlanner helps students turn school materials into a planner they can check before trusting. Found coursework stays in Check New Work until the user reviews it; accepted work powers Today, Calendar, Week, Classes, reminders, and the native widgets.

StudyPlanner Plus is available through the in-app subscription screen. To test syllabus import, open the app, complete onboarding, open Widget Setup, choose View Plus Plans, subscribe using Apple's sandbox purchase flow, then open Check New Work from the bottom dock. Restore Purchases is available on the paywall.

IAP product IDs:

- Monthly: `com.mattnewman.studyplanner.plus.monthly`
- Yearly: `com.mattnewman.studyplanner.plus.yearly`
- Lifetime one-time purchase, if submitted: `com.mattnewman.studyplanner.plus.lifetime`

The app uses Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408

Supported syllabus upload flow for this build:

1. Use Check New Work after Plus is active.
2. Choose File to select a text-based PDF or plain-text syllabus from Files.
3. Review detected courses, deadlines, and grade categories.
4. Apply the parsed plan only after review.

Photo and camera OCR entry points are shown only when a production online parser endpoint is configured. This build keeps the Scan feature available through Files instead of showing an unavailable photo/OCR feature.

Widgets supported for this submission: native iOS small and medium Home Screen widgets. Large and Lock Screen widgets are not part of this submission.

Use only safe synthetic data for review or screenshots. No private student data is required to test the app.
