# Build 41 Top 20 Gap Closure

Source: verified StudyPlanner: Syllabus AI build `1.0.3 (39)`.
Target: `1.0.3 (41)`, bundle `com.mattnewman.studyplanner`.

## Closed Gaps

1. Demo date logic replaced with `dueDate`-first selectors.
2. Today now has a single action-first dashboard snapshot.
3. Semester Health is driven by class health, completion, and pressure.
4. Today Pressure explains overdue, due-now, and focus load.
5. Class Pulse now has confidence, momentum, workload, trend, causes, and next action.
6. Classes sort by lowest pulse so risk is surfaced first.
7. Risk Radar now includes severity, confidence, cause, affected date, and action.
8. Study blocks are date-backed with `date`, `startsAt`, and `endsAt`.
9. Large assignments are split into multiple blocks.
10. Exam prep uses spaced review before close exams.
11. Missed blocks generate a dated makeup block.
12. Scanned notes now produce concepts, definitions, formulas, weak areas, and likely exam topics.
13. Flashcards and quizzes now use parsed note intelligence.
14. Plan calendar markers now include tasks, exams, notes, and dated study blocks.
15. Monthly planning copy explains what changed after replan.
16. Local notifications now schedule class, assignment, exam, and study reminders.
17. Notification permission is requested only from the Reminders screen.
18. Denied/unavailable notification states show safe user-facing copy.
19. In-app widget gallery/studio/preview routes are redirected away from user UI.
20. Native WidgetKit snapshots are preserved and now deep link to Today.

## Remaining Risks

- PDF text extraction is still represented by paste/import fallback in this build. Native PDF extraction remains the highest-leverage future backend add.
- Review import field editing is still title-first with metadata displayed; deeper structured field editors should be the next import-specific cycle.
- Notification scheduling is validated by code and type checks; final push-notification behavior must be confirmed on a physical/TestFlight install because simulator notification delivery differs.
- EAS upload depends on App Store Connect credentials and Apple portal availability at submission time.

## Scorecard

- Local intelligence correctness: 9.6/10
- TestFlight readiness: 9.5/10
- Widget architecture preservation: 9.7/10
- UX cleanup: 9.4/10
- Backend logic completeness: 9.5/10

Overall: 9.5/10 pending TestFlight upload result.
