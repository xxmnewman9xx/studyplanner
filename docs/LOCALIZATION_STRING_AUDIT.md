# Localization String Audit

Generated: 2026-05-12T21:39:36.362Z

## Summary

This audit scans tracked TypeScript/TSX files under `src/` with the TypeScript compiler API and reports likely user-facing English strings. It is an inventory for localization planning, not a translator and not a native-speaker review.

| Metric | Count |
| --- | ---: |
| Tracked source files scanned | 46 |
| Likely localizable string candidates | 737 |
| JSX text candidates | 166 |
| Localizable prop candidates | 230 |

## Readiness Verdict

Localized UI submission remains **not ready**. Date formatting and week-start behavior have targeted tests, but the app still contains broad English UI copy across core screens, settings, widgets, paywall, onboarding, import/review, and demo data. English-only submission remains the honest path unless translated UI, native-speaker review, and localized screenshot text-fit proof are completed.

## Highest-Risk Files

| File | Candidates | Examples |
| --- | ---: | --- |
| src/screens/OnboardingScreen.tsx | 88 | Semester Preview<br>Chemistry 101<br>Lab Chemistry<br>Calculus II<br>Differential Calculus |
| src/screens/ImportScreen.tsx | 82 | All<br>Looks good<br>Check date<br>Needs check<br>Upload a text-based PDF, text file, or photo syllabus. |
| src/data/demoSemester.ts | 64 | Current Semester Preview<br>Messy current-semester syllabus packet.txt<br>Mixed confidence dates were detected from a messy syllabus packet.<br>Messy current-semester syllabus packet.txt<br>Calculus II |
| src/screens/CoursesScreen.tsx | 56 | Field Notes<br>Add Work<br>Exam<br>Assignment<br>Exam |
| src/screens/UpgradeScreen.tsx | 45 | Scan a syllabus into courses and deadlines<br>Sync assignments and exams to your calendar<br>Queue smart reminders before due dates<br>Forecast grades from weighted categories<br>Manual courses and assignments |
| src/components/PremiumUI.tsx | 36 | StudyPlanner<br>SYLLABUS AI<br>NEXT DUE<br>Your plan is clear<br>Course |
| src/screens/SettingsScreen.tsx | 33 | Settings<br>StudyPlanner<br>Keep your plan honest, personal, and easy to trust.<br>classes ·<br>checked due dates |
| src/screens/AssignmentDetailScreen.tsx | 32 | Use a real date like 2026-09-18 and a 24-hour time like 15:30.<br>Assignment detail<br>Course<br>Close assignment detail<br>Title |
| src/screens/MonthlyCalendarScreen.tsx | 32 | Calendar<br>Tap any day to see its assignments and exams.<br>Previous month<br>Next month<br>Month view |
| src/screens/TodayScreen.tsx | 30 | Preview<br>Good morning, Alex<br>Today<br>Let's make it a productive day.<br>See what is due and what to do next. |
| src/screens/WidgetShowcaseScreen.tsx | 30 | Next Due<br>Answers what is due next without opening the app.<br>This Week<br>Shows the next several deadlines and overflow count.<br>Preview |
| src/services/subscriptions.tsx | 30 | useSubscription must be used inside SubscriptionProvider.<br>Open the iOS or Android app to subscribe.<br>Plus purchases are not available on this device right now.<br>Open the iOS or Android app to restore purchases.<br>Purchases are not available on this device right now. |
| src/screens/GradesScreen.tsx | 26 | High<br>Watch<br>Manageable<br>Grade tracker<br>Know the target before finals week. |
| src/theme.ts | 25 | Ocean Blue<br>Ocean<br>Violet Glow<br>Violet<br>Emerald Focus |
| src/components/InsightCards.tsx | 17 | Monthly Calendar<br>due -<br>busy days<br>, today<br>, busy day |

## Sample Candidate Strings

| Location | Kind | Text |
| --- | --- | --- |
| src/components/AssignmentCard.tsx:35 | string-literal | Mark not done |
| src/components/AssignmentCard.tsx:35 | string-literal | Mark done |
| src/components/AssignmentCard.tsx:47 | string-literal | Course |
| src/components/AssignmentCard.tsx:60 | string-literal | Exam |
| src/components/AssignmentCard.tsx:69 | jsx-text | Due |
| src/components/InsightCards.tsx:32 | jsx-text | Monthly Calendar |
| src/components/InsightCards.tsx:35 | jsx-text | due - |
| src/components/InsightCards.tsx:35 | jsx-text | busy days |
| src/components/InsightCards.tsx:49 | string-literal | , today |
| src/components/InsightCards.tsx:50 | string-literal | , busy day |
| src/components/InsightCards.tsx:75 | localized-prop | Opens the full calendar |
| src/components/InsightCards.tsx:88 | string-literal | Workload Forecast |
| src/components/InsightCards.tsx:89 | string-literal | Open deadlines across the next seven days |
| src/components/InsightCards.tsx:115 | jsx-text | Due by day |
| src/components/InsightCards.tsx:119 | localized-prop | Busy week |
| src/components/InsightCards.tsx:154 | string-literal | No deadline pressure yet |
| src/components/InsightCards.tsx:164 | string-literal | Work by class |
| src/components/InsightCards.tsx:190 | jsx-text | Classes |
| src/components/InsightCards.tsx:192 | jsx-text | open assignments and exams |
| src/components/InsightCards.tsx:250 | jsx-text | Progress |
| src/components/InsightCards.tsx:251 | jsx-text | % complete |
| src/components/InsightCards.tsx:253 | jsx-text | done - |
| src/components/ModeToggle.tsx:15 | localized-prop | Toggle dark mode |
| src/components/PremiumGate.tsx:22 | jsx-text | Plus feature |
| src/components/PremiumGate.tsx:31 | jsx-text | Unlock with Study Planner Plus |
| src/components/PremiumGate.tsx:33 | jsx-text | These tools open after Plus is active on your store account. |
| src/components/PremiumGate.tsx:35 | localized-prop | View Plus |
| src/components/PremiumUI.tsx:97 | jsx-text | StudyPlanner |
| src/components/PremiumUI.tsx:99 | jsx-text | SYLLABUS AI |
| src/components/PremiumUI.tsx:201 | jsx-text | NEXT DUE |
| src/components/PremiumUI.tsx:203 | string-literal | Your plan is clear |
| src/components/PremiumUI.tsx:219 | string-literal | Course |
| src/components/PremiumUI.tsx:219 | jsx-text | - Due |
| src/components/PremiumUI.tsx:224 | string-literal | Class |
| src/components/PremiumUI.tsx:228 | jsx-text | Start |
| src/components/PremiumUI.tsx:231 | jsx-text | Complete |
| src/components/PremiumUI.tsx:238 | jsx-text | No next deadline. |
| src/components/PremiumUI.tsx:240 | jsx-text | Scan a syllabus or add coursework to build your plan. |
| src/components/PremiumUI.tsx:338 | string-literal | Course |
| src/components/PremiumUI.tsx:338 | string-literal | not done |
| src/components/PremiumUI.tsx:339 | string-literal | Opens assignment details |
| src/components/PremiumUI.tsx:357 | string-literal | Course |
| src/components/PremiumUI.tsx:363 | jsx-text | Due |
| src/components/PremiumUI.tsx:447 | jsx-text | assignments due this week |
| src/components/PremiumUI.tsx:448 | jsx-text | Next: |
| src/components/PremiumUI.tsx:507 | jsx-text | Next Due |
| src/components/PremiumUI.tsx:508 | string-literal | Clear |
| src/components/PremiumUI.tsx:519 | string-literal | All set |
| src/components/PremiumUI.tsx:542 | jsx-text | This Week |
| src/components/PremiumUI.tsx:595 | jsx-text | Monthly Calendar |
| src/components/PremiumUI.tsx:620 | jsx-text | busy days - |
| src/components/PremiumUI.tsx:643 | jsx-text | Busy Week |
| src/components/PremiumUI.tsx:647 | string-literal | Workload is steady |
| src/components/PremiumUI.tsx:684 | jsx-text | Work by Class |
| src/components/PremiumUI.tsx:715 | jsx-text | Home Screen Widgets |
| src/components/PremiumUI.tsx:716 | jsx-text | Deadlines stay visible before the app opens. |
| src/components/PremiumUI.tsx:890 | string-literal | High |
| src/components/PremiumUI.tsx:892 | string-literal | Overdue |
| src/components/PremiumUI.tsx:893 | string-literal | Today |
| src/components/PremiumUI.tsx:894 | string-literal | Tomorrow |

## Recommended Localization Order

1. App shell and bottom navigation: Today, Calendar, Week, Classes, Check Work, Widgets.
2. Onboarding promise and first-action path.
3. Add School Stuff / Check New Work trust-boundary copy.
4. Today, Week Plan, Calendar, Classes, Assignment Detail.
5. Widget Setup and native widget strings.
6. Paywall, Settings, support/privacy, and App Review-facing copy.
7. Demo/capture seed data and screenshot captions.

## QA Requirements Before Localized Submission

- Replace hardcoded UI strings with a localization resource layer.
- Run this audit and record the remaining candidate count.
- Capture localized screenshots and check text fit for each submitted locale.
- Complete native-speaker review for localized metadata, screenshot captions, and in-app copy.
- Record proof in `artifacts/post-goal-aso-submission/external-proof/localized-ui-native-review.md`.
