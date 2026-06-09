# Experience Spine R&D

## Product Thesis

StudyPlanner should stop feeling like a bundle of school-planner surfaces and become one high-converting experience:

1. Guided personalized onboarding
2. Student profile builder
3. Scan syllabus or add manually
4. Hard paywall
5. Personalized dashboard

Core promise:

**StudyPlanner: Syllabus AI turns your syllabus and student profile into a personalized school dashboard.**

The dashboard is the paid payoff. Before payment, the app may show a tight profile summary and explain what will be generated, but it should not give dashboard access, dashboard browsing, or module-level utility.

## Spine Rules

- The first session is linear.
- No dashboard access before the hard paywall.
- The app sells a personalized school dashboard, not generic planning tools.
- Syllabus scan is the hero input. Manual input is the fallback, not an equal maze.
- Widget Studio becomes Recommended Widgets.
- Customization means class colors plus dashboard style.
- Widgets and customization are Plus benefits.
- Watch is absent unless the shipped app has real, demonstrable Watch behavior.
- Every feature either strengthens the spine or moves behind value.

## Reference Translation

- **Cal AI onboarding simplicity:** scan/input should feel fast, obvious, and outcome-first. Avoid parser settings, feature education, and chat-style AI.
- **Duolingo personalization flow:** questions should be short, choice-based, and visibly build a profile. The student should feel progress after every tap.
- **Apple Sports dashboard clarity:** Home should be a school scoreboard: one state, one next action, today's essentials, and risk.
- **Apple Fitness progress loops:** Semester Pulse should create a repeatable loop: check state, take action, see progress, recover from heavy weeks.

## Feature R&D

### Onboarding

**1. What job does this feature do?**

Onboarding earns attention, frames the promise, captures the minimum personalization signals, and moves the student toward scan/manual input without making the app feel like homework.

**2. Why would a student care?**

They do not want to configure another planner. They want the app to understand their school life quickly and tell them what matters.

**3. What is the 100x version?**

A Cal AI-simple, Duolingo-clear flow where each tap visibly builds a student profile. In under three minutes, the app knows school level, goal, struggle, schedule style, and input preference, then says exactly what dashboard it will generate.

**4. What should be cut?**

Feature tours, carousel education, broad claims, Watch mentions, theme previews, widget editing, calendar lectures, and any screen that explains a tab before the student has created value.

**5. What should be hidden until after value?**

Dashboard modules, Forecast details, Focus history, Notes, Review Inbox, Recommended Widgets, customization controls, reminders, calendar sync, and settings depth.

**6. What should be paywalled?**

Dashboard access, Syllabus AI output application, risk forecast, focus suggestions, recommended widgets, class color personalization, dashboard style, review helpers, reminder intelligence, and ongoing profile adaptation.

**7. What data does it need from onboarding?**

School level, goal, struggle, schedule style, input choice, optional semester timing, and consent/trust expectations around syllabus parsing.

**8. How does it appear on the dashboard?**

Onboarding disappears as a screen and becomes the dashboard's ranking logic: headline copy, Next important thing, risk language, focus suggestion, default module order, and recommended widgets.

### Profile Builder

**1. What job does this feature do?**

Profile builder turns generic planning into personalized decisioning. It translates student context into dashboard defaults.

**2. Why would a student care?**

A college student working nights, a high school student with activities, and a grad student with readings do not need the same dashboard.

**3. What is the 100x version?**

The profile builder feels like the app is learning the student, not collecting settings. It creates a live summary: "College, less stress, exam anxiety, work-heavy. We'll prioritize risk and focus blocks."

**4. What should be cut?**

Long profile forms, demographic curiosity, personality quizzes, complex notification preferences, theme selection, and anything not used by Home ranking.

**5. What should be hidden until after value?**

Advanced class setup, detailed grade targets, focus timer tuning, widget choices, dashboard style controls, and account/settings fields.

**6. What should be paywalled?**

Profile-driven dashboard personalization, saved class colors, dashboard style, adaptive focus recommendations, and profile-based widget recommendations.

**7. What data does it need from onboarding?**

School level, goal, struggle, schedule style, input choice, and generated class color palette rules.

**8. How does it appear on the dashboard?**

It controls module emphasis. Forgetting deadlines pushes Today and Upcoming risk higher. Exam anxiety emphasizes Semester Pulse and Focus suggestion. Activities-heavy schedules emphasize time conflicts and lighter focus windows.

### Scan Syllabus

**1. What job does this feature do?**

Scan syllabus creates the core data asset: classes, assignments, exams, dates, review flags, and semester structure.

**2. Why would a student care?**

It replaces the worst setup chore. The student does not want to copy every date from a PDF, paper handout, or LMS page.

**3. What is the 100x version?**

Scan feels like Cal AI for school: capture or upload, see a clear extraction summary, confirm uncertain items, then unlock a personalized dashboard built from the student's actual semester.

**4. What should be cut?**

Chat-style AI, vague "processing magic," unsupported source claims, fake OCR promises, multi-step parser settings, and scan modes that do not improve extraction.

**5. What should be hidden until after value?**

Review Inbox depth, calendar sync, reminders, widgets, Forecast, class dashboards, and customization.

**6. What should be paywalled?**

Applying parsed syllabus output to the dashboard, repeated scans, advanced parsing, review helpers, risk analysis from parsed dates, and widget recommendations from scan results.

**7. What data does it need from onboarding?**

School level to tune class/assignment expectations, goal to tune dashboard promise, struggle to tune review emphasis, schedule style to tune risk warnings, and input choice to route the flow.

**8. How does it appear on the dashboard?**

It powers every core module: Next important thing, Today list, Semester Pulse, Upcoming risk, Focus suggestion, Classes, Plan, and Recommended Widgets.

### Manual Input

**1. What job does this feature do?**

Manual input saves users when scanning is unavailable, unsupported, or untrusted. It also supports students without a clean syllabus.

**2. Why would a student care?**

Some students get assignments verbally, from LMS posts, from a teacher board, or from scattered notes. They still need a dashboard.

**3. What is the 100x version?**

Manual input is fast and structured: add class names and 3-5 key dates, then StudyPlanner generates the same dashboard skeleton. It should feel like a fallback express lane, not a spreadsheet.

**4. What should be cut?**

Full course database setup, grade category setup, recurring timetable complexity, color picking, notes setup, and detailed assignment metadata before the dashboard exists.

**5. What should be hidden until after value?**

Grades, reminders, notes, widgets, review workflows, detailed class hubs, and dashboard style.

**6. What should be paywalled?**

Saving the generated dashboard, expanding beyond the initial manual setup, risk forecast, focus suggestions, recommended widgets, and customization.

**7. What data does it need from onboarding?**

School level, goal, struggle, schedule style, class count estimate, class names, key dates, and optional exam/assignment type.

**8. How does it appear on the dashboard?**

Manual entries become the same objects as scan entries. The dashboard should not care where the data came from, except lower-confidence or sparse input should create softer risk language.

### Paywall

**1. What job does this feature do?**

The paywall converts after intent has been built but before the paid dashboard is accessed.

**2. Why would a student care?**

They care if the paywall clearly says what they will get: their classes, deadlines, risks, focus plan, and recommended widgets in one dashboard.

**3. What is the 100x version?**

The paywall is the locked door to a personalized outcome, not a feature menu. It says: "Your school dashboard is ready." It shows the student's profile summary and the modules Plus will generate.

**4. What should be cut?**

Generic premium lists, Watch claims, vague AI copy, feature overload, theme-store upsells, multiple competing CTAs, and free-dashboard teasers.

**5. What should be hidden until after value?**

Interactive Home, real forecast details, class hubs, widgets, dashboard customization, focus timer flows, and review inbox contents.

**6. What should be paywalled?**

Everything beyond onboarding and input choice: dashboard access, scan/manual output use, personalized modules, risk forecast, focus suggestion, recommended widgets, customization, and review helpers.

**7. What data does it need from onboarding?**

Profile summary, input choice, class/source readiness, generated class color preview, and the student's selected goal/struggle for personalized paywall copy.

**8. How does it appear on the dashboard?**

It does not appear after purchase except as Plus status in More. If entitlement fails, it blocks dashboard access and offers restore/purchase.

### Dashboard / Home

**1. What job does this feature do?**

Home is the paid payoff. It answers: what matters next, how today looks, how the semester is trending, what risk is forming, and what to do now.

**2. Why would a student care?**

Students open the app because they are worried, busy, or unsure what to do. Home should lower cognitive load in under three seconds.

**3. What is the 100x version?**

Apple Sports clarity for school: a scoreboard for the semester. One state, one next action, today's work, risk, focus, and widgets, all personalized from profile plus syllabus.

**4. What should be cut?**

Generic feeds, decorative cards, duplicate metrics, tabs embedded inside Home, watch previews, theme promos, and anything that does not change the next decision.

**5. What should be hidden until after value?**

Deep analytics, old completed work, notes history, widget setup details, manual customization, and advanced settings.

**6. What should be paywalled?**

Home itself. No dashboard access before Plus.

**7. What data does it need from onboarding?**

School level, goal, struggle, schedule style, input source, classes, due dates, exams, color palette, and source confidence.

**8. How does it appear on the dashboard?**

As the dashboard. Required modules: Next important thing, Today, Semester Pulse, Upcoming risk, Focus suggestion, Recommended Widgets.

### Forecast

**1. What job does this feature do?**

Forecast predicts pressure before it becomes panic. It turns dates, workload, exams, and schedule style into a simple risk state.

**2. Why would a student care?**

Students do not just need due dates. They need to know that Thursday is overloaded or next week is a peak week.

**3. What is the 100x version?**

Apple Weather for school: Calm, Building, Heavy, Peak, Recovery. One peak, one reason, one action.

**4. What should be cut?**

Dense charts, speculative grade prediction, overconfident AI explanations, long trend histories, and hidden formulas.

**5. What should be hidden until after value?**

Detailed Plan screen, advanced forecast explanations, calendar sync, and recurring focus optimization.

**6. What should be paywalled?**

Forecast state, upcoming risk, peak week/day, focus recommendation, and risk-driven reminders.

**7. What data does it need from onboarding?**

School level, goal, struggle, schedule style, assignments, exams, class meetings, and input confidence.

**8. How does it appear on the dashboard?**

As Semester Pulse plus Upcoming risk. The Plan tab can expand it, but Home gets the simplest version.

### Classes

**1. What job does this feature do?**

Classes explains the dashboard by course. It shows what each class needs, which class is risky, and what color belongs to each course.

**2. Why would a student care?**

Students think in classes: Biology test, English essay, Calc homework. Class hubs make the dashboard feel real.

**3. What is the 100x version?**

Each class is a clean hub: color, next deadline, risk, upcoming exams, notes, and recommended focus action.

**4. What should be cut?**

Grade-manager depth before launch, instructor/contact clutter, deep attendance tracking, decorative class pages, and color pickers before Plus.

**5. What should be hidden until after value?**

Detailed grade setup, class-level customization, notes history, completed archive, and manual color editing.

**6. What should be paywalled?**

Class dashboards, class risk, auto-generated class colors, color editing, and class-based recommendations.

**7. What data does it need from onboarding?**

School level, input source, class names, schedule style, assignments, exams, and generated color palette.

**8. How does it appear on the dashboard?**

Classes feed the Today module, risk rankings, color-coded tasks, Focus suggestion, and Recommended Widgets.

### Focus

**1. What job does this feature do?**

Focus turns the next important thing into a doable study session.

**2. Why would a student care?**

When students are stressed, "study" is too vague. They need a small, specific block tied to a real class or deadline.

**3. What is the 100x version?**

The app says: "Do 25 minutes of Chemistry tonight because Thursday is overloaded." Completing it visibly improves the dashboard state.

**4. What should be cut?**

Standalone timer complexity, Pomodoro culture, streak pressure, custom soundscapes, deep session analytics, and focus features not tied to syllabus work.

**5. What should be hidden until after value?**

Focus history, notes during focus, custom durations, achievements, and advanced recommendations.

**6. What should be paywalled?**

Personalized focus suggestion, assignment-linked focus sessions, adaptive duration, and Focus impact on Pulse.

**7. What data does it need from onboarding?**

Goal, struggle, schedule style, school level, deadlines, exams, workload, and later focus completion history.

**8. How does it appear on the dashboard?**

As one Focus suggestion module: task, class, duration, reason, and start action.

### Notes

**1. What job does this feature do?**

Notes capture context around assignments and classes so the dashboard can stay connected to actual study material.

**2. Why would a student care?**

Students need to remember what the teacher said, what to review, or what changed after the syllabus was imported.

**3. What is the 100x version?**

Notes are lightweight attachments to classes, assignments, and focus sessions. They appear when relevant, not as a separate writing app.

**4. What should be cut?**

Full note-taking app ambitions, rich text depth, notebooks, tags, templates, AI summaries, and a primary Notes tab.

**5. What should be hidden until after value?**

Notes tab, note history, rich note actions, pinned notes, and focus-note linking.

**6. What should be paywalled?**

Class/assignment-linked notes, notes surfaced in dashboard context, and focus-session notes.

**7. What data does it need from onboarding?**

Classes, assignments, school level, and struggle. For procrastination, notes can be minimized; for exam anxiety, notes can surface near tests.

**8. How does it appear on the dashboard?**

Only as context attached to Next important thing or Focus suggestion. It should not be a core Home module.

### Widgets

**1. What job does this feature do?**

Widgets extend the dashboard to the Home Screen only if real widget behavior exists. In-app, the feature recommends which widget would help.

**2. Why would a student care?**

Students want to glance at the next deadline or risk without opening the app.

**3. What is the 100x version?**

The app recommends one or two widgets based on profile and semester: "Add Due Next because you forget deadlines" or "Add Week Risk because Thursday is heavy."

**4. What should be cut?**

Widget Studio, complex editors, watch/widget ecosystems, style marketplaces, multi-pack configuration, unproven live claims, and fake external-surface promises.

**5. What should be hidden until after value?**

Widget recommendations, previews, add instructions, and any editing.

**6. What should be paywalled?**

Recommended Widgets, widget personalization, widget style, and class-specific widget recommendations.

**7. What data does it need from onboarding?**

Struggle, goal, schedule style, class colors, deadlines, risk state, and whether real widget support is available.

**8. How does it appear on the dashboard?**

As Recommended Widgets: a small module with preview, reason, and add instructions. Claim real behavior only when proven.

### Customization

**1. What job does this feature do?**

Customization makes the dashboard feel personal without distracting from school decisions.

**2. Why would a student care?**

Class colors help students recognize work quickly. A dashboard style preference can make the app feel like theirs.

**3. What is the 100x version?**

The app automatically generates class colors from the profile and classes, then Plus lets students adjust class colors and choose a dashboard style.

**4. What should be cut?**

Theme store, palettes as a main feature, elaborate widget styling, Watch styles, decorative seasonal themes, and any customization not tied to comprehension.

**5. What should be hidden until after value?**

Class color editing, dashboard style switcher, widget style settings, and visual preference controls.

**6. What should be paywalled?**

Class color editing, saved dashboard style, personalized widget appearance, and generated color refinement.

**7. What data does it need from onboarding?**

School level, class list, schedule style, and auto-generated class colors.

**8. How does it appear on the dashboard?**

As color-coded classes, tasks, risk signals, and a coherent dashboard style. It is not a tab-level destination.

### Review Inbox

**1. What job does this feature do?**

Review Inbox protects trust. It catches uncertain dates, duplicates, low-confidence items, and impossible deadlines before they power the dashboard.

**2. Why would a student care?**

Wrong school data is worse than no data. Students need to trust that the app will not invent deadlines.

**3. What is the 100x version?**

Review is a small trust checkpoint: "3 items need confirmation." It explains why each item is flagged and lets the student fix it fast.

**4. What should be cut?**

Separate review tab, large inbox metaphor, excessive confidence detail, parser debugging, and review workflows unrelated to dashboard trust.

**5. What should be hidden until after value?**

Review Inbox module, detailed flags, duplicate management, and source history.

**6. What should be paywalled?**

Review helpers, applying reviewed work to the dashboard, resolving uncertain scan output, and source trust history.

**7. What data does it need from onboarding?**

Input source, school level, classes, assignments, dates, source confidence, and the student's tolerance for manual review implied by input choice.

**8. How does it appear on the dashboard?**

As a trust alert only when needed: "Review 3 items before they affect Today." It should not be a permanent dashboard module.

### Empty States

**1. What job does this feature do?**

Empty states route the student back to the spine instead of showing dead screens.

**2. Why would a student care?**

Blank planner screens feel like failure. Good empty states tell the student the next setup action.

**3. What is the 100x version?**

Every empty state is one sentence and one action: "Scan a syllabus to build your dashboard" or "Add 3 key dates to see your week."

**4. What should be cut?**

Illustration-heavy empties, multi-option empties, inspirational copy, feature education, and empty states for hidden tabs.

**5. What should be hidden until after value?**

Empty states for Forecast, Widgets, Notes, Focus history, and customization. They should not appear before Plus/dashboard access.

**6. What should be paywalled?**

Dashboard empty states after Plus. Before Plus, no dashboard empty state exists because dashboard is locked.

**7. What data does it need from onboarding?**

Input choice, class count, whether syllabus data exists, whether scan failed, and whether manual input is incomplete.

**8. How does it appear on the dashboard?**

Only after Plus when a module lacks data. It should always point to Scan, Manual add, or Review.

## Major Product Decisions

- Hard paywall after onboarding and input choice.
- No dashboard access before paywall.
- Widgets and customization are Plus benefits.
- Watch is not visible unless real.
- Widget Studio becomes Recommended Widgets.
- Customization means class colors plus dashboard style, not a theme store.
- Notes, Focus, Review, and Widgets become supporting loops, not first-session destinations.
- The app should convert on one promise: a personalized school dashboard from syllabus plus profile.
