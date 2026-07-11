# Study Planner: Syllabus AI Product Blueprint

## Product Promise

Turn a messy semester into a clear daily execution plan. Students upload a text-based syllabus, paste class material, or scan a syllabus photo on iOS, review the detected plan, and immediately see courses, assignments, exams, reminders, grades, and what to do today. Supported imports are processed on device in this release.

## Audience

- U.S. high-school students managing classes, tests, homework, and activities.
- College students juggling LMS dates, calendars, notes, email, and syllabi.
- Overwhelmed students who need a trusted planner more than another feed.

## Release Scope

### Included

- Course and semester setup.
- Text-based PDF and pasted-text syllabus import with editable parsing results.
- Real photo syllabus parsing through the camera/photo library when the native iOS Vision OCR module is present; without native OCR, the app directs students to paste text or use a readable text-based PDF.
- Assignments and exams with due dates, tags, priority, estimates, and status.
- Weekly class schedule.
- Today view with a ranked next action.
- Weighted grade tracker and target-grade calculator.
- Smart local reminders for deadlines and exams.
- Focus timer tied to a specific assignment.
- Onboarding that explains value quickly, previews customization, and routes into the Plus paywall.

### Not Included In V1

- Direct Canvas sync.
- Direct Google Classroom, Blackboard, D2L, or Schoology sync.
- Social feeds, streaks, ads, public profiles, or competitive gamification.
- Automatic writes from AI without review.

## Core UX Flows

### Fast Onboarding

1. Student sees the product promise and trust cues.
2. Student completes onboarding.
3. App presents Plus value and store-backed purchase options.
4. Student subscribes or restores purchases.
5. App lands on the selected Scan, demo, or manual setup destination after Plus is active.

### Syllabus Import

1. Upload a text-based PDF, paste syllabus text, or scan a syllabus photo with native iOS Vision OCR.
2. Parse pasted text and readable text-based PDFs on device. Process camera/photo text on device when native Vision OCR is available.
3. Return structured JSON with confidence and review flags.
4. Show editable title, kind, priority, due date, due time, and effort fields before applying.
5. Block invalid deadlines from application and route uncertain work into Needs Review.
6. Merge into planner objects only after confirmation.

### Daily Use Loop

- Morning: open Today.
- Midday: check class schedule and upcoming deadlines.
- Study block: start focus timer tied to one assignment.
- Evening: update status and grade items.
- Weekly: review semester progress, exam countdowns, and grade pressure.

## Data Model

- `Semester`: name, start/end dates, target GPA.
- `Course`: code, name, instructor, color, meetings, grade categories.
- `ClassMeeting`: day, start/end time, location.
- `Assignment`: course, title, kind, due date, tags, priority, estimated minutes, status, source.
- `GradeCategory`: course-level category with weight.
- `GradeItem`: earned/possible points inside a grade category.
- `SyllabusParseResult`: source, semester dates, courses, assignments, grade items, review findings.

## Prioritization Logic

The Today view ranks open work using:

- Days until due.
- Exam vs assignment.
- Priority.
- Estimated work time.
- Whether the task has already been started.
- Review/duplicate/confidence flags.

This keeps the app planner-first: AI creates structure, but daily execution logic stays deterministic and explainable. Invalid legacy deadlines are treated as review work instead of schedulable work, so Today, widgets, reminders, and week load stay trustworthy.

## Monetization Gates

### Hard-Gated Build

This release routes students through Plus after onboarding. The current product shell requires a valid Plus entitlement after onboarding unless simulator capture is active; any fallback limits are internal safeguards, not a marketed plan.

### Paid

- Expanded course, assignment, and import limits.
- Syllabus scan.
- Advanced reminders.
- Home Screen and Lock Screen widgets.
- Grade prediction.
- Study-plan suggestions.

The first paid value should appear at a natural save-time moment: scanning a syllabus, applying a reviewed semester, or calculating risk across remaining grade weight.

## Retention Loop

- Morning agenda.
- Upcoming deadlines.
- Exam countdowns.
- Weekly review.
- Semester progress.
- Grade pressure alerts.

## Launch Risks

- AI date extraction must be reviewable and reversible.
- Deadline validation must prevent impossible dates/times from entering schedulable surfaces.
- App Store metadata should not claim Canvas support unless the shipped build actually supports it.
- Syllabus photos may contain student, school, and instructor data, so the on-device processing boundary must stay explicit in privacy and review copy.
