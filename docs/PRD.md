# Study Planner: Syllabus AI Product Blueprint

## Product Promise

Turn a messy semester into a clear daily execution plan. Students upload or photograph a syllabus, review the detected plan, and immediately see courses, assignments, exams, reminders, grades, and what to do today.

## Audience

- U.S. high-school students managing classes, tests, homework, and activities.
- College students juggling LMS dates, calendars, notes, email, and syllabi.
- Overwhelmed students who need a trusted planner more than another feed.

## Release Scope

### Included

- Course and semester setup.
- PDF/photo syllabus import with editable parsing results.
- Assignments and exams with due dates, tags, priority, estimates, and status.
- Weekly class schedule.
- Today view with a ranked next action.
- Weighted grade tracker and target-grade calculator.
- Smart local reminders for deadlines and exams.
- Device calendar sync.
- Focus timer tied to a specific assignment.
- Onboarding that explains value quickly and routes into the Plus paywall or planner.

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
4. Student subscribes, restores purchases, or continues with the free planner.
5. App lands on Today with manual planning available and Plus features gated.

### Syllabus Import

1. Capture PDF/photo.
2. OCR and parse on backend.
3. Return structured JSON with confidence and review flags.
4. Show editable fields before applying.
5. Merge into planner objects only after confirmation.

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

This keeps the app planner-first: AI creates structure, but daily execution logic stays deterministic and explainable.

## Monetization Gates

### Free

- One semester.
- Limited course count.
- Manual assignment/exam entry.
- Basic reminders.

### Paid

- Unlimited semesters and courses.
- Syllabus scan.
- Advanced reminders.
- Calendar sync.
- Grade prediction.
- Study-plan suggestions.

The first paid value should appear at a natural save-time moment: scanning a syllabus, syncing a calendar, or calculating risk across remaining grade weight.

## Retention Loop

- Morning agenda.
- Upcoming deadlines.
- Exam countdowns.
- Weekly review.
- Semester progress.
- Grade pressure alerts.

## Launch Risks

- AI date extraction must be reviewable and reversible.
- Calendar sync must store external event IDs before production release to avoid duplicates.
- App Store metadata should not claim Canvas support unless the shipped build actually supports it.
- Syllabus photos may contain student, school, and instructor data, so backend retention and deletion policies need to be explicit.
