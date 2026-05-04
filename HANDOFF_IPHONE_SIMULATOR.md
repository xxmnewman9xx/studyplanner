# iPhone Simulator Handoff

## Project

Study Planner: Syllabus AI

Local project path:

```bash
C:\Users\xxmne\Studyapp
```

## Current App Status

The app is an Expo + React Native MVP with:

- Onboarding, Today, Scan, Courses, Grades, Focus, and Plus screens.
- Light and dark mode.
- Local planner persistence for web preview.
- Editable assignment detail flow.
- Editable semester and course setup.
- Editable grade tracking and target-grade calculator.
- Syllabus parse review flow backed by `parseSyllabusStub()`.

## Important Simulator Note

Apple's iPhone Simulator only runs on macOS with Xcode installed. It cannot run locally on Windows.

From Windows, the fastest device test path is Expo Go on a physical iPhone using the QR code from `npx expo start`. For true iPhone Simulator testing, use a Mac.

## Test On iPhone Simulator From A Mac

1. Clone or copy the project onto a Mac.

2. Install prerequisites:

```bash
node --version
npm --version
xcodebuild -version
```

3. Install dependencies:

```bash
cd Studyapp
npm install
```

4. Verify the project:

```bash
npm run typecheck
npx expo install --check
```

5. Start the iPhone Simulator build:

```bash
npx expo start --ios
```

If Expo asks to install simulator tooling, accept the prompt. If multiple simulators are available, choose a recent iPhone target such as iPhone 15 or iPhone 16.

## Test On Physical iPhone From Windows

1. Install Expo Go on the iPhone.

2. Start Expo:

```bash
cd C:\Users\xxmne\Studyapp
npx expo start
```

3. Scan the QR code with Expo Go.

The phone and Windows machine must be on the same network unless using tunnel mode:

```bash
npx expo start --tunnel
```

## Smoke Test Checklist

1. Launch app.
2. Toggle dark mode, refresh/reopen, confirm mode persists.
3. Tap `Start with planner`, refresh/reopen, confirm onboarding stays complete.
4. Today screen: tap assignment `Edit`, update estimate/tags/status, save.
5. Courses screen: edit semester dates, edit a course, add a course.
6. Scan screen: run sample parse, edit parsed title/date/kind/priority, apply plan.
7. Grades screen: change target grade, add a score, edit score values.
8. Focus screen: start, pause, and reset timer.
9. Plus screen: verify free/paid boundary copy.

## Known Production Gaps

- Syllabus import still uses `parseSyllabusStub()` instead of a real OCR/AI backend.
- No account/cloud sync yet.
- No App Store in-app purchase integration yet.
- No Canvas OAuth integration yet.
- Native persistent storage should be upgraded before App Store submission.
- Calendar/reminder integrations are starter implementations and need deeper native-device QA.

## Useful Commands

```bash
npm run typecheck
npx expo install --check
npx expo start --web
npx expo start --ios
```
