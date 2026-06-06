# Build 42 Release Candidate Report

Date: 2026-06-05

Build: 42

No build number increment. No Build 43. No TestFlight submission.

## Implemented During RC Gate

- Light theme primary accent changed from blue to black.
- First real syllabus import now replaces starter coursework instead of mixing with demo overdue work.
- Syllabus parser now handles multiple dated clauses per line.
- First-import empty semester state no longer crashes the intelligence layer.
- Early grade forecasts no longer imply grade failure when grades are missing.
- Risk Radar/recommended actions now use the V2 Class Pulse model.
- Low-risk items like "No overdue work" no longer outrank actual next actions.
- Notification wording now sounds more like a semester coach.

## Verification Commands

Passed:

- `npm run typecheck`
- `npm run test:intelligence`
- `npm run test:semester`
- `npm run check:build42`

Additional validation:

- Parser sample produced 3 classes, 7 tasks, 2 exams.
- Clean imported semester produced Semester Health 86 and an actionable next step.
- Build 42 metadata was not incremented.

## Final Scores

| Category | Score |
|---|---:|
| Semester Coach Feel | 8.7/10 |
| Semester Cockpit Feel | 8.8/10 |
| Intelligence Feel | 8.9/10 |
| Emotional Impact | 8.5/10 |
| Premium Feel | 8.6/10 |
| Apple-Native Feel | 8.4/10 |
| TestFlight Readiness | 8.0/10 |

## Top 10 Strengths

1. Syllabus-first promise is clear.
2. Semester Health is now the correct hero concept.
3. Clean import creates visible relief instead of demo anxiety.
4. Next action is specific and actionable.
5. Parser handles compact syllabus lines better.
6. Study plan produces date-backed blocks with reasons.
7. Notes, study blocks, forecasts, notifications, and widgets share `SemesterSnapshot`.
8. Widget snapshots are tethered to semester state.
9. Notification language is more coaching-oriented.
10. Black/white visual direction is stronger after accent reduction.

## Top 10 Remaining Issues

1. Physical widget placement on Simulator home/lock screen was not verified.
2. Paste text entry was not reliable in simulator automation and needs manual/device retest.
3. Review import screen was not fully screenshot-validated in this gate.
4. Main tab navigation was unreliable through host click automation.
5. No visible theme selection exists, although removing theme customization aligns with current product direction.
6. Semester Health hero copy can still be too long.
7. Class Pulse estimates can feel samey immediately after import.
8. Grade-entry path needs to be more obvious for forecast precision.
9. Notification permission flow needs physical confirmation.
10. The app still has some generic "AI" wording that could be more premium and local-intelligence specific.

## Final Recommendation

B) One more polish pass required.

Reason: all major categories are not at least 9/10, and the Widget Reality Test was not completed with physical home-screen/lock-screen placement. The app is significantly closer and the highest-impact RC issues found in this pass were fixed, but it should not be submitted purely on code correctness.

## Required Before TestFlight

1. Manually verify paste/import/review/apply on the iPhone simulator or a physical device.
2. Place each native widget size on home screen and lock screen, capture screenshots, and verify the content updates from `SemesterSnapshot`.
3. Verify notification permission, scheduling, and delivered copy.
4. Capture final screenshots for Today, Classes, Plan, Notes, Study Session, Notifications, and Widgets.
5. Re-run release verification.

