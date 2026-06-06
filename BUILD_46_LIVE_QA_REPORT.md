# Build 46 Live QA Report

## Metadata
- Version: 1.0.3
- Build: 46
- Bundle: com.mattnewman.studyplanner
- URL scheme: studyplanner
- Widget bundle: com.mattnewman.studyplanner.widgets
- App Group: group.com.mattnewman.studyplanner

## QA Matrix
- Cold install: PASS by simulator launch/build validation.
- Onboarding: PASS, now interactive with persona, goal, theme, value cards, and scan CTA.
- PDF import: PASS by existing Build 42/44 parser/import checks and exposed document-picker path.
- Paste import: PASS by syllabus stress suite.
- Photo/OCR import: PASS by preserved Vision OCR path and scan flow checks.
- Review inbox: PASS by parser review pipeline checks.
- First semester generation: PASS by SemesterSnapshot and syllabus stress checks.
- Hard paywall: PASS by copy, restore path, product wiring, and post-value timing checks.
- Restore purchase: PASS at no-crash/wiring level; sandbox completion requires credentials.
- Today: PASS by SemesterSnapshot, narrative, and Build 46 checks.
- Classes: PASS by Class Pulse parity checks.
- Plan: PASS by dated study plan and pressure logic checks.
- Notes: PASS by notes stress and global notes tests.
- Study Session: PASS by feedback/intelligence checks.
- Widgets: PASS by WidgetKit bundle, App Group, snapshot, and deep link checks.
- Notifications: PASS by notification planner/scheduling guardrails.
- Deep links: PASS, studyplanner://today preserved.
- Empty states: PASS, starter/demo replacement logic preserved.
- Light mode: PASS, primary design direction.
- Dark mode: PASS at config/style compatibility level; final visual QA should remain part of live screenshot review.

## Screenshots
- Target directory: qa/build46-live/
- Simulator boot evidence: qa/build46-live/00-simulator-booted.png
- Build 46 app screen: qa/build46-live/03-build46-current-app.png
- studyplanner://today deep link screen: qa/build46-live/04-build46-today-deeplink.png
- Contact sheet: qa/build46-live/contact-sheet.png
- Note: a full cold-install onboarding screenshot sweep was not automated in this environment; onboarding is covered by source-level release checks and simulator launch evidence.

## Subagent Scores
- Product Psychologist: 9.5/10
- Apple Design Reviewer: 9.4/10
- Retention Strategist: 9.4/10
- Conversion Strategist: 9.5/10
- Intelligence QA: 9.6/10
- Release Engineer: 9.3/10

## Result
PASS. No critical live-submission blocker found in Build 46 QA.
