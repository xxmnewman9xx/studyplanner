# iPhone Simulator Review Cycle — 2026-05-20

## Objective
Run StudyPlanner like a product review board would: inspect the highest-value screens in iPhone Simulator, score them against a 10/10 bar, implement the top 20 leverage improvements, rerun release QA, then capture and score screenshots.

## Screens in the review cycle
1. Today command center — first impression, next action clarity, premium glass polish.
2. Widget Studio — Widgetsmith-inspired customization, Smart Stack schedule, live preview, Plus clarity.
3. Focus Mode — retention loop, notes capture, study-session value.
4. Import/Scan — acquisition hook and trust loop.
5. Upgrade — monetization clarity without pre-value punishment.

## Scoring rubric
- **Immediate clarity**: user understands what to do in 5 seconds.
- **Premium feel**: materials, hierarchy, spacing, typography, and dark/light contrast feel app-store-grade.
- **Retention leverage**: screen creates a reason to return tomorrow.
- **Monetization honesty**: Free is useful; Plus clearly unlocks leverage/identity/automation.
- **Data trust**: no fake widget claims, no fake native behavior, no unexplained AI magic.
- **Engineering safety**: TypeScript and full release QA pass.

## Top 20 improvements implemented this cycle
1. Added Studio Readiness score so Widget Studio self-audits setup quality.
2. Added visible readiness pills: real homework, classes, native sync, Smart Stack.
3. Added preview data-source label so users know what powers the widget.
4. Added install loop card: save preset → add widget → check daily.
5. Added three-step install mental model for first-time widget users.
6. Added active-state highlighting for selected Smart Stack slot.
7. Added tap-to-load schedule slots into the editor.
8. Added saved Smart Stack metadata to presets.
9. Added schedule label to saved preset rows.
10. Added one-tap theme pack active state.
11. Added locked visual treatment for Plus theme packs.
12. Added Plus lock notice explaining exactly what is gated.
13. Save-current-preset now carries schedule/theme-pack metadata.
14. Theme packs now remember selected pack locally while editing.
15. Smart Stack save uses selected theme pack metadata.
16. Added explicit install copy that avoids false native auto-rotation claims.
17. Added “preview source” text to reinforce real planner data.
18. Added selected preset/moment label in readiness card.
19. Added smoother premium boundary copy: Free native widgets, Plus advanced systems.
20. Added this repeatable simulator review cycle document for future QA.

## 10/10 acceptance bar
A pass requires release QA green and screenshots saved under `qa-screenshots/review-cycle-2026-05-20/`. If simulator automation cannot navigate deterministically to every tab, document that gap and still capture a clean iPhone screenshot of the running app.
