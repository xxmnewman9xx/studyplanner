# Build 52 Onboarding Repair Report

## Repairs

- Name-first onboarding remains the first step.
- Stored first name is preserved even when older data has `prefs.name === "Student"`.
- Student type and goal remain short and tap-driven.
- Artifact preview still avoids fake classes and fake live metrics.
- Final step routes to scan, paste, camera, or locked home.
- Completing onboarding cannot route into unlocked Today/Plan/Classes/Notes.

## Screenshots

- Name: `qa/build52-locked-experience/02-onboarding-name.png`
- Name filled: `qa/build52-locked-experience/03-onboarding-name-filled.png`
- Student type: `qa/build52-locked-experience/04-student-type.png`
- Goal: `qa/build52-locked-experience/05-goal.png`
- Artifacts: `qa/build52-locked-experience/06-artifacts.png`
- Import options: `qa/build52-locked-experience/07-final-import-options.png`

## Outcome

The user moves from identity to value to import. Skip now lands on an intentional locked home, not a fake dashboard.

