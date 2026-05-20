# App Review Notes

StudyPlanner Plus is available through the in-app subscription screen. To test premium flows, open the app, complete onboarding, choose StudyPlanner Plus, subscribe using Apple's sandbox purchase flow, then use the Scan, calendar sync, reminders, and grade planning surfaces. Restore Purchases is available on the paywall.

The app uses Apple's standard EULA:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408

## Supported syllabus import flow for this build

1. Open the Scan tab after Plus is active.
2. Choose Take Photo for a syllabus page, Upload for a text-based PDF/plain-text syllabus from Files, or Paste syllabus/handout text directly.
3. The app reads camera/photo text on device when possible, uses the configured parser endpoint when available, then creates an editable draft.
4. Review detected courses, deadlines, due times, effort estimates, possible duplicates, and grade categories.
5. Fix any items marked Needs Review. Invalid dates or times cannot be applied to the planner.
6. Apply the parsed plan only after review.

Camera scan is active in this build. If the online parser endpoint is unavailable, the app attempts on-device photo text recognition first. If a photo cannot be read clearly, the app shows a clear retry/fallback message instead of applying uncertain data.

## Planner trust behavior

StudyPlanner keeps deadline data reviewable before it affects planning or device integrations:

- Manual homework and assignment edits validate real dates and `HH:MM` due times.
- Import review validates complete deadlines and preserves parsed due times when dates are edited.
- Invalid legacy deadlines are routed to Needs Review instead of Today, Due Soon, widgets, week load, reminders, or calendar sync.
- Effort estimates are normalized so planning math stays useful.
- Calendar sync and reminders skip archived items and invalid deadlines.

## WidgetKit behavior

iOS builds include small and medium WidgetKit Home Screen widgets for StudyPlanner Today and StudyPlanner Upcoming. The widgets are backed by the app group `group.com.mattnewman.studyplanner` and receive compact timeline snapshots from the app, not the full planner database.

The widget snapshot includes reviewed assignment display fields only: local assignment ID, title, course code/color, due label, priority, assignment type, semester name, widget state, generated time, colors, and display copy. It excludes raw syllabus text, parsed raw text, teacher names, rooms, grades, notes, checklist details, reminder identifiers, calendar event identifiers, purchase state, and student name. Demo coursework and unreviewed or invalid scan results are not written to native widgets.

## Release QA command

Before TestFlight/App Store packaging, run:

```bash
npm run qa:release
```

This runs typecheck, syllabus parser fixtures, planner trust fixtures, IAP/premium gate checks, and web export.
