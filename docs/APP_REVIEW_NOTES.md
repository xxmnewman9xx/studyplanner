# App Review Notes

StudyPlanner is available through the in-app subscription screen. To test subscription flows, open the app, complete onboarding, choose a StudyPlanner plan, subscribe using Apple's sandbox purchase flow, then use the Scan, reminders, in-app semester plan, and grade planning surfaces. Restore Purchases is available on the paywall.

Purchase entitlement is checked against active subscriptions with native `expo-iap` store APIs. This build does not claim server-side receipt validation.

Weekly, monthly, and yearly Plus products are each configured with a one-week introductory free trial for eligible new subscribers during the active offer period. Because Apple permits one introductory offer per subscription group, the paywall checks StoreKit eligibility before showing trial language. Eligible customers see the localized full renewal price and period (for example, “1 week free, then [price]/[period]”), plus auto-renewal and cancellation terms; ineligible customers see the normal localized plan price without a trial claim.

The app uses Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408

## Supported syllabus import flow for this build

1. Open the Scan tab after access is active.
2. Choose Upload for a text-based PDF/plain-text syllabus from Files, or paste syllabus/handout text directly.
3. Pasted text, readable text-based PDFs, and plain-text files parse on device. The active scanner enables camera/photo OCR only when the iOS native Vision OCR module is present in native iOS builds. Unclear OCR results stay in review instead of applying uncertain data.
4. Review detected courses, deadlines, due times, effort estimates, possible duplicates, and grade categories.
5. Fix any items marked Needs Review. Invalid dates or times cannot be applied to the planner.
6. Apply the parsed plan only after review.

Camera/photo OCR controls are enabled only when the native iOS Vision OCR module is present in the active scanner. If native OCR is unavailable, the app directs students to text-based PDFs or pasted text instead of applying uncertain data. The current runtime does not upload syllabus content to a StudyPlanner parser service.

## Planner trust behavior

StudyPlanner keeps deadline data reviewable before it affects planning or device integrations:

- Manual homework and assignment edits validate real dates and `HH:MM` due times.
- Import review validates complete deadlines and preserves parsed due times when dates are edited.
- Invalid legacy deadlines are routed to Needs Review instead of Today, Due Soon, widgets, week load, or reminders.
- Effort estimates are normalized so planning math stays useful.
- Reminders skip archived items and invalid deadlines.

## WidgetKit behavior

iOS builds include four WidgetKit Home Screen and Lock Screen accessory families backed by the app group `group.com.mattnewman.studyplanner`: StudyPlanner Today (small, medium, inline, circular, rectangular), StudyPlanner Upcoming (small, medium, inline, circular, rectangular), StudyPlanner Week (medium, inline, circular, rectangular), and StudyPlanner Class Progress (small, medium, inline, circular, rectangular). These widgets receive compact timeline snapshots from the app, not the full planner database.

The widget snapshot includes reviewed assignment display fields only: local assignment ID, title, course code/color, due label, priority, assignment type, semester name, widget state, generated time, colors, and display copy. It excludes raw syllabus text, parsed raw text, teacher names, rooms, grades, notes, checklist details, reminder identifiers, calendar event identifiers, purchase state, and student name. Demo coursework and unreviewed or invalid scan results are not written to native widgets.

## Release QA command

Before TestFlight/App Store packaging, run:

```bash
npm run qa:release
```

This runs typecheck, syllabus parser fixtures, planner trust fixtures, IAP/hard-paywall checks, and web export.

Also confirm the production EAS environment does not set the simulator-only capture bypass:

```bash
eas env:list --environment production | grep EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA
```

Expected result: no `EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1` entry in production.
