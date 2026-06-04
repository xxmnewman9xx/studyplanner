# App Store Metadata Direction

## Title

StudyPlanner: Syllabus AI

## Subtitle

Homework, Exams, Class Schedule

This is safer than `Homework, Exams, Canvas` for the current release because Canvas sync is not implemented. Apple warns against metadata that uses trademarked, popular app, or irrelevant terms to game discovery, and App Store product-page guidance calls out improper keyword use as a rejection risk.

Sources:

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Product Page Guidance](https://developer.apple.com/app-store/product-page/)

## Keywords

study planner, school planner, student planner, homework tracker, assignment tracker, exam planner, grade tracker, class schedule, timetable, syllabus ai, college planner

Hold `canvas planner` until a shipped Canvas-compatible workflow exists.

## Short Description

Import a syllabus with AI assistance, review every class and deadline, then start each day with a calm plan.

## Long Description Draft

StudyPlanner: Syllabus AI helps high-school and college students turn syllabi, assignments, exams, class schedules, and grades into one daily plan.

Scan a syllabus photo, upload a text-based syllabus PDF, or paste class material, review the detected courses, deadlines, due times, and grade categories, then see what matters today. Track weighted grades, calculate what you need on remaining work, start a focus session for one assignment, and set reminders before exams and due dates.

StudyPlanner keeps you in control: imported work is editable before it touches your planner, uncertain items are flagged for review, and invalid deadlines are kept out of Today, widgets, reminders, and calendar sync until fixed.

Built for students who want less clutter, less typing, and fewer missed deadlines.

Terms of Use:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408

## Screenshot Narrative

1. Import syllabus chaos.
2. Review every detected deadline.
3. Know what to do today.
4. Track grades and final targets.
5. Sync reminders and calendar events.

## Review Notes To Prepare

- Explain that AI/parser results are editable before application.
- StudyPlanner is available through the in-app subscription screen. To test subscription flows, complete onboarding, choose a StudyPlanner plan, subscribe using Apple's sandbox purchase flow, then use Scan, reminders, calendar sync, and grade planning surfaces.
- Supported import paths for App Review: text-based PDF/plain-text file, pasted syllabus text, and camera/photo OCR in native iOS builds through the on-device Vision OCR module. Camera/photo OCR can also use the configured HTTPS parser endpoint when `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`.
- Photo/image parsing uses native iOS Vision OCR on device when available. If the native OCR module and configured image parser endpoint are both unavailable, photo imports show a clear fallback message instead of applying uncertain data; text-based PDFs and pasted text can still parse on device.
- The app uses Apple's standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- Do not mention Canvas in metadata unless the app supports a clear Canvas-related feature.
- Document notification, calendar, camera, and photo usage with concrete purpose strings.
- Avoid screenshots that imply unsupported LMS integrations.
