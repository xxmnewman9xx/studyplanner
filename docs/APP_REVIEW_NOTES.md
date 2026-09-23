# App Review Notes

StudyPlanner is available through the in-app subscription screen. To test subscription flows, open the app, complete onboarding, choose a StudyPlanner plan, subscribe using Apple's sandbox purchase flow, then use the Scan, reminders, in-app semester plan, and grade planning surfaces. Restore Purchases is available on the paywall.

Purchase entitlement is checked against active subscriptions with native `expo-iap` store APIs. This build does not claim server-side receipt validation.

The target U.S. prices are Weekly USD $6.99, Monthly USD $14.99, and Yearly USD $39.99. Weekly (`com.mattnewman.studyplanner.plus.weekly`) is the only product intended to carry a paid introductory offer: eligible new subscribers pay USD $0.99 for the first weekly period, then the localized weekly renewal price until canceled. Monthly and Yearly have no introductory offer. The paywall never hardcodes production prices; it enables checkout only after StoreKit returns a localized product, checks Apple’s subscription-group eligibility before showing the paid first-week offer, and always shows renewal and cancellation terms. Ineligible customers see the normal localized Weekly price without an introductory-offer claim.

Before attaching this build to a review submission, verify the live App Store Connect subscription group matches those target prices and the paid first-week offer is attached to Weekly only. The checked local StoreKit configuration mirrors the target contract but is not evidence of live App Store Connect state.

The app uses Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://studyplanner-ai.xxmnewman9xx.workers.dev/privacy

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
