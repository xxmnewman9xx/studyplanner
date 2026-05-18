# Golden Scenario Suite

Purpose: stress-test StudyPlanner and ShiftPay against real customer stories, not feature checklists.

Rules:
- Every scenario must state the customer, starting state, trigger, expected behavior, and monetization/trust assertion.
- A scenario passes only if the app either works, upsells honestly at the point of pain, or clearly says the feature is not live.
- Fake controls fail. Demo data in normal first-run fails. Abstract utility copy fails.
- Automate logic and gate assertions first; reserve simulator/screenshot QA for flows that can only be judged visually.

Run today:
- StudyPlanner: `npm run check:scenarios` or full `npm run qa:release`
- ShiftPay: `xcodebuild test -project ShiftPayCalendar.xcodeproj -scheme ShiftPayCalendar -destination 'id=<available simulator id>'`

Top 50 requested changes captured by these scenarios:
1. StudyPlanner must be understandable in 5 seconds.
2. StudyPlanner normal first-run must not seed fake/example courses.
3. StudyPlanner normal first-run must not seed fake assignments.
4. StudyPlanner normal first-run must not seed fake imports/items.
5. StudyPlanner normal first-run must not seed fake grades.
6. StudyPlanner normal first-run must not seed fake focus sessions.
7. StudyPlanner marketing/demo capture can preserve demo state separately.
8. StudyPlanner onboarding must show the core loop clearly.
9. StudyPlanner loop: scan/type -> review -> Today -> focus -> done.
10. StudyPlanner should start with a Pro upsell after onboarding.
11. StudyPlanner free version should be intentionally tiny.
12. StudyPlanner free limit: about one class.
13. StudyPlanner free limit: about two homework items.
14. StudyPlanner free should be basic Today only.
15. StudyPlanner Pro should unlock syllabus scanning.
16. StudyPlanner Pro should unlock weekly plan.
17. StudyPlanner Pro should unlock focus sessions.
18. StudyPlanner Pro should unlock grades.
19. StudyPlanner Pro should unlock widgets only when honest/real.
20. StudyPlanner Pro should unlock reminders and calendar sync.
21. StudyPlanner paywall copy should say Free is just a preview.
22. StudyPlanner paywall should sell the complete workflow, not vague features.
23. StudyPlanner should trigger review prompt only after value moments.
24. StudyPlanner Widget Studio should not contain fake controls.
25. StudyPlanner Widget Studio should not show fake Algebra/Week examples.
26. StudyPlanner widgets should be removed/hidden or labeled preview-only until native support exists.
27. StudyPlanner tab bar should not overexpose premium/fake tabs to free users.
28. StudyPlanner app icon should be minimalist and mainly white.
29. StudyPlanner UI should avoid crayon/emoji visual artifacts.
30. StudyPlanner copy should be short and not wrap aggressively.
31. StudyPlanner should preserve IAP/release guardrails.
32. ShiftPay users must be able to add manual/picked-up shifts.
33. ShiftPay users must be able to edit manual shifts.
34. ShiftPay users must be able to delete manual shifts.
35. ShiftPay users must be able to delete generated schedule occurrences.
36. ShiftPay deleting generated shifts must not mutate the whole rotation.
37. ShiftPay deleted shifts must disappear from pay estimates.
38. ShiftPay actual time editing must support actual start and actual end.
39. ShiftPay Pro entitlement should persist across relaunch/offline grace.
40. ShiftPay Home should support a useful current-shift clock.
41. ShiftPay Pay/Home should emphasize paycheck progress.
42. ShiftPay Pay/Home should avoid abstract “what changed before payday” framing.
43. ShiftPay Pay should show picked-up/manual shifts in ledger/work included.
44. ShiftPay Pay should include a zoomed-out graph like stock chart timeframes.
45. ShiftPay graph timeframes: Paycheck, Month, 3M, Year.
46. ShiftPay should support irregular schedule workers, not just perfect rotations.
47. ShiftPay should make pay math trustworthy and auditable.
48. ShiftPay should surface proof/log style evidence for estimates.
49. ShiftPay should keep tab/content spacing safe.
50. Both apps should be validated by scenario tests before shipping.
