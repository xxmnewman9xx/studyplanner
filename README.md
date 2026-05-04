# Study Planner: Syllabus AI

An Expo + React Native MVP starter for a calm student planner that turns a syllabus into courses, deadlines, grades, reminders, and a daily execution plan.

## Run Locally

```bash
npm install
npm run typecheck
npx expo start
```

## What Is Included

- Fast onboarding that reaches a first generated plan in under 3 minutes.
- Editable syllabus import flow for PDF, photo, or sample AI parse output.
- Course and semester setup with weekly class schedule.
- Assignment and exam objects with due dates, tags, priority, estimates, and status.
- Today screen with "what should I do next?" planning logic.
- Weighted grade tracker and final target calculator.
- Smart reminder starter using `expo-notifications`.
- Device calendar sync starter using `expo-calendar`.
- Focus session timer tied to a selected assignment.
- Free and paid tier boundary screen.

## Production Notes

The scanner currently uses `parseSyllabusStub()` so the app can run without credentials. Replace it with a backend that does OCR, returns the JSON contract in [docs/AI_PARSE_CONTRACT.md](docs/AI_PARSE_CONTRACT.md), and requires user review before applying changes.

Canvas is intentionally not a live MVP integration. The docs include a milestone path, but the first release should avoid claiming Canvas sync until OAuth, school-domain handling, and update reconciliation are implemented.
