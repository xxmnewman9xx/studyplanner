# Widget 10/10 Cycle

StudyPlanner widgets should be scored as installed iOS products, not as decorative previews. A 10/10 widget does one thing immediately: it tells a student what matters next using trusted planner data, with enough visual polish that it feels worth keeping on the Home Screen or Lock Screen.

## 10/10 Definition

- Glance utility: the first read answers today, next deadline, urgency, and one action without opening the app.
- Data trust: demo work, invalid deadlines, duplicate scans, and unreviewed imports never enter WidgetKit.
- Visual hierarchy: count/date, task title, class color, and due label are ordered for a one-second read.
- Native parity: Widget Studio previews match the native small, medium, rectangular, circular, and inline layouts closely enough for screenshot review.
- Install truth: the app explains that students add and arrange widgets in iOS, while StudyPlanner supplies the live snapshots.

## Cycle

1. Research: review Apple widget screenshots, WidgetKit family constraints, prior StudyPlanner screenshots, and the current widget data contract.
2. Define: write the target state for Today, Upcoming, empty, review-needed, no-class, and demo states before editing UI.
3. Implement: change real snapshot logic first, then native layout, then in-app preview parity.
4. Screenshot: capture Widget Studio and, when a signed/native build is available, Home Screen and Lock Screen placement.
5. Score: rate each capture 0-2 on utility, trust, hierarchy, polish, and native proof. Ship only when the total is 9+ and no category is 0.

## Current Slice

- Added signal, metric, next, and timeline labels to native snapshots.
- Redesigned native Home and Lock layouts around urgency, next action, class code, and due labels.
- Brought Widget Studio native previews closer to the WidgetKit layout so screenshot review can compare like with like.
