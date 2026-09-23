# App Store Metadata Direction

## Title

Study Planner AI

## Subtitle

Syllabus, Homework & Exams

This is safer than `Homework, Exams, Canvas` for the current release because Canvas sync is not implemented. Apple warns against metadata that uses trademarked, popular app, or irrelevant terms to game discovery, and App Store product-page guidance calls out improper keyword use as a rejection risk.

Sources:

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Product Page Guidance](https://developer.apple.com/app-store/product-page/)

## Keywords

`school,college,deadline,assignment,class,calendar,notes,focus,semester,lecture,GPA,timetable,todo`

The field is 97 characters and avoids repeating words already indexed from the title and subtitle.

Hold `canvas planner` until a shipped Canvas-compatible workflow exists.

## Short Description

Turn one syllabus into a reviewed semester plan—classes, deadlines, exams, reminders, and the next study move.

## Long Description Draft

Study Planner AI helps high-school and college students turn one syllabus into a reviewed semester plan.

Scan a syllabus photo, upload a text-based syllabus PDF, or paste class material, review the detected courses, deadlines, due times, and grade categories, then see what matters today. Track weighted grades, calculate what you need on remaining work, start a focus session for one assignment, and set reminders before exams and due dates.

StudyPlanner keeps you in control: imported work is editable before it touches your planner, uncertain items are flagged for review, and invalid deadlines are kept out of Today, widgets, reminders, and the semester plan until fixed.

Built for students who want less clutter, less typing, and fewer missed deadlines.

Terms of Use:
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:
https://studyplanner-ai.xxmnewman9xx.workers.dev/privacy

## Screenshot Narrative

1. Import syllabus chaos.
2. Review every detected deadline.
3. Know what to do today.
4. Track grades and final targets.
5. Keep the semester visible with reminders and widgets.

## Review Notes To Prepare

- Explain that AI/parser results are editable before application.
- StudyPlanner is available through the in-app subscription screen. To test subscription flows, complete onboarding, choose a StudyPlanner plan, subscribe using Apple's sandbox purchase flow, then use Scan, reminders, the in-app semester plan, and grade planning surfaces.
- Supported import paths for App Review: text-based PDF/plain-text file, pasted syllabus text, and camera/photo OCR in native iOS builds through the on-device Vision OCR module.
- The active in-app scanner only enables camera/photo capture when the native iOS Vision OCR module is present. If OCR is unavailable, photo imports show a clear fallback message instead of applying uncertain data; text-based PDFs and pasted text can still parse on device.
- The current release runtime processes supported syllabus imports on device and does not claim server-side parsing.
- The app uses Apple's standard EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
- Do not mention Canvas in metadata unless the app supports a clear Canvas-related feature.
- Document notification, camera, and photo usage with concrete purpose strings.
- Avoid screenshots that imply unsupported LMS integrations.
