# Build 52 Onboarding Rebuild Report

## Flow

1. Name: “What should StudyPlanner call you?”
2. Student type: “Nice, {name}. What are you managing?”
3. Goal: “What do you want under control?”
4. Real app artifacts: Semester Health, Next Move, Class Pulse, Pressure Forecast, Notes Preparedness, Widget preview.
5. Value action: Upload PDF, Paste syllabus, Scan with camera, Skip for now.

## Conversion Fixes

- Asks for first name immediately.
- Personalizes student type step.
- Removes theme customization.
- Removes demo coursework.
- Uses artifact previews tied to real app surfaces.
- Final choices execute intent: PDF opens PDF import, camera opens camera, paste opens paste, skip opens locked dashboard.
- Paywall follows parsed import proof when the user imports before paying.

## Remaining Risk

The artifact screen is intentionally abstract to avoid fake coursework. Highest conversion proof still comes from `ReviewImport` after a real syllabus import.

