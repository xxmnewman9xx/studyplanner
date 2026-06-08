# StudyPlanner Student Life Depth Plan

Date: 2026-05-31

## Purpose

StudyPlanner is visually cleaner, but visual polish is no longer the bottleneck.

The product still behaves like a planner: it shows tasks, dates, timers, notes, and widgets. A personalized operating system does more. It learns the student's semester, predicts pressure before it hits, remembers what helped, and turns every surface into a live answer.

New product rule:

> Every feature must answer: what gets better the longer I use the app?

If the answer is nothing, redesign the feature before changing UI.

## Current Source Audit

Audited implementation:

- Home: `src/screens/TodayScreen.tsx`
- Forecast: `src/screens/PlanScreen.tsx`, `src/logic/planner.ts`, `src/screens/GradesScreen.tsx`
- Classes: `src/screens/CoursesScreen.tsx`
- Focus: `src/screens/FocusScreen.tsx`, `src/logic/planner.ts`
- Notes: `src/screens/NotesScreen.tsx`, `src/logic/planner.ts`
- Widget Studio: `src/screens/MoreScreen.tsx`, `src/widgets/*`, `src/services/widgetSnapshot.ts`
- Watch: `src/components/StudyPlannerAppleBoard.tsx`, `src/screens/MoreScreen.tsx`, native widget targets in `ios/ExpoWidgetsTarget`
- Existing product contracts: `docs/STUDENT_LIFE_OS_FEATURE_CONTRACT.md`, `docs/STUDENT_LIFE_OS_INFORMATION_ARCHITECTURE.md`

Current reality:

- The app already has useful primitives: imported planner data, review trust, ranked work, week load, focus sessions, notes, grade math, widget snapshots, and basic personalization settings.
- The app does not yet make those primitives compound into a personal operating system.
- Several screens still use fixed or demo-shaped assumptions where the OS should infer and adapt.
- Widget and Watch surfaces are mostly previews and mirrors, not generated personal systems.

## Depth System

Every major surface must have four compounding assets:

- Memory: what the app remembers about the student over time.
- Prediction: what the app can infer before the student asks.
- Action: what the student can do immediately from the surface.
- Feedback: what the app learns after the student acts or ignores it.

Retention equation:

`student input -> trusted memory -> prediction -> recommended action -> feedback -> better future recommendation`

The product should get better through:

- More reviewed assignments and deadlines.
- More completed or ignored recommendations.
- More focus sessions and session outcomes.
- More note-to-task conversions and saved context.
- More grade items and target changes.
- More widget/watch placements and interactions.
- More recurring class, activity, work, and recovery patterns.

## Screen Audit And Redesign

### Home

Target feel: Apple Sports, personalized by life.

Why would a student open this?

- To know the one thing that matters right now.
- To check today's school, life, and risk state without reading a planner.
- To act: start, capture, mark done, review, snooze, or open the exact detail.

Why would they return tomorrow?

- The answer changes every day based on deadlines, classes, focus history, notes, grade risk, and life constraints.
- It should feel like "my day is being watched over," not "my list is waiting."

What becomes more valuable after 30 days?

- The app knows which classes slip, which task sizes get delayed, when the student actually studies, what reminders are ignored, and which recurring moments create overload.
- Home becomes a personal scoreboard for the next 24 hours, not a generic dashboard.

How does it become uniquely theirs?

- Ranking changes by goal, friction, behavior, calendar/life constraints, course risk, study history, and preferred action style.
- The language and defaults should reflect the student's identity: athlete, high GPA, less stress, working student, exam-anxious, forgetful, high-achievement, etc.

Missing depth:

- The current Home uses the planner brain, but the visible cards are mostly fixed examples: exam, assignment, focus, next class, heavy week.
- It does not explain why this card is first or what changed since yesterday.
- It does not learn from completion, deferral, ignored reminders, or focus outcomes.

Missing personalization:

- Student name appears, but the system does not visibly adapt to the student's goal, friction, schedule style, or history.
- The app does not yet show "because you usually start late on lab reports" or "because practice blocks your usual study window."

Missing utility:

- The screen needs one dominant next action with reason, consequence, and fastest action.
- Quick capture should be available without becoming a form.
- Notes, grade impact, and focus should appear only when they change today's decision.

Missing retention loop:

- Completing or ignoring a Home recommendation should improve tomorrow's recommendation.
- Home should remember: acted, delayed, snoozed, completed, started focus, created note, converted note, fixed review item.

Utility redesign:

- Replace "dashboard of cards" with a live Student Life Feed.
- Top object: Today Signal.
  - Example: "Start Organic Chem review before 7 PM."
  - Reason: "Your next free window is 45 minutes. This exam is high impact and 6 days away."
  - Action: start focus, split task, snooze, mark blocked.
- Second layer: three compact live signals.
  - Next class.
  - Overload/weather-style forecast.
  - Grade or exam risk if it changes the decision.
- Add "changed since yesterday" only when useful.
  - "Physics moved from low to medium risk because two tasks are now within 48 hours."
- Make Home improve through feedback.
  - If the student always ignores 45-minute blocks, suggest 15-minute starts.
  - If they complete work after class, prioritize between-class actions.
  - If they open Home at night, show tomorrow setup and recovery, not morning agenda.

### Forecast

Target feel: weather.

Why would a student open this?

- To see what is coming before it becomes stressful.
- To answer: "Am I safe this week?", "Where will I get overloaded?", "What can I do now to avoid it?"

Why would they return tomorrow?

- Forecast changes with completed work, new imports, notes, grades, focus sessions, and missed plans.
- It becomes the app's predictive layer, not a calendar page.

What becomes more valuable after 30 days?

- Forecast learns real effort estimates, class volatility, focus capacity, late-start patterns, grade sensitivity, and recovery needs.
- It can predict overload and useful study windows with increasing confidence.

How does it become uniquely theirs?

- A high-GPA student sees grade leverage and exam prep windows.
- A less-stress student sees load smoothing and recovery protection.
- An athlete sees practice and recovery conflicts.
- A forgetful student sees reminder timing and urgent glances.

Missing depth:

- Current Forecast is a thin feed with date strip, sample-like items, and static "Looking ahead."
- It does not produce a risk model, confidence, or recommended intervention.
- Grade math lives separately in Grades instead of becoming one forecast input.

Missing personalization:

- No visible forecast mode by goal, friction, or life pattern.
- No learning from prior estimates or focus completion.

Missing utility:

- The screen should tell the student what will go wrong if nothing changes.
- It should create or suggest focus blocks, reminder changes, and task splits.
- It should show free time and recovery as first-class forecast data.

Missing retention loop:

- Accepted or rejected forecast suggestions do not yet improve future suggestions.
- Real effort vs estimated effort does not feed future load predictions.

Utility redesign:

- Replace calendar-first thinking with a Student Life Weather model.
- Forecast states:
  - Clear: no intervention needed.
  - Watch: a busy period is forming.
  - Warning: overload likely unless work moves.
  - Storm: high-risk cluster or grade-impact deadline.
  - Recovery: work is safe, protect rest or activity.
- Inputs:
  - assignments, exams, class meetings, focus history, notes, grade weights, target grade, reviewed imports, reminders, calendar sync, life profile.
- Outputs:
  - risk days, reason, confidence, best intervention, and one-tap action.
- Example cards:
  - "Thursday is a storm day: 2 deadlines, 1 lab, 0 open focus windows."
  - "Move 25 minutes of Calculus to Tuesday after Physics."
  - "Organic Chem exam risk dropped after yesterday's focus session."
- Merge Grade Impact into Forecast.
  - "This quiz is small. The midterm changes your target more."
  - "You need 88% average on remaining Biology work; start the lab first."

### Classes

Target feel: living course intelligence, not a class list.

Why would a student open this?

- To understand one class: what's open, what changed, what is risky, what context matters.
- To answer: "What is happening in Biology?" not "show me a list of courses."

Why would they return tomorrow?

- Class state changes after each lecture, import, note, score, or assignment update.
- It becomes the memory of each course.

What becomes more valuable after 30 days?

- The app knows class-specific patterns: which course runs heavy, which instructor changes dates, which assignment types take longer, which classes drive grade risk.
- Notes and focus history become course intelligence.

How does it become uniquely theirs?

- Each class develops its own timeline, risk profile, effort reality, notes, grade trend, and preferred widget/watch signal.

Missing depth:

- Current Classes is a semester overview with progress, counts, a week card, and rows.
- Some numbers are inflated with fallback values and the week range is fixed.
- It does not build a durable course memory or explain class-specific trends.

Missing personalization:

- Courses have color and schedule, but not learning style, instructor pattern, difficulty, actual effort, or grade sensitivity.
- The system does not adapt by class personality.

Missing utility:

- A student should open a class to decide what to do next for that class.
- It should show the class health, next action, recent context, grade impact, and what changed.

Missing retention loop:

- Notes, focus sessions, completed tasks, late tasks, and scores should deepen course intelligence over time.
- Current class state does not become more predictive with use.

Utility redesign:

- Make Classes contextual, not primary.
- Course Hub contract:
  - Class Signal: safe, needs attention, risky, unknown.
  - Next class prep: what to bring, what to review, what question to ask.
  - Open work ranked by impact.
  - Recent notes that change action.
  - Grade impact if available.
  - Effort reality: estimated vs actual.
- After 30 days, each class should answer:
  - "This class usually takes longer than planned."
  - "You tend to finish reading tasks late here."
  - "Lab work is driving most risk."
  - "Your next score matters less than this project."

### Focus

Target feel: Apple Fitness, always available.

Why would a student open this?

- To start the recommended block without thinking.
- To turn the next task into protected work.
- To log what happened and make future plans smarter.

Why would they return tomorrow?

- The app should recommend the right task, duration, and start style based on history.
- Focus should feel like a personal coach, not a timer.

What becomes more valuable after 30 days?

- The app learns actual task duration, effective block length, best study times, avoidance patterns, and class-specific focus cost.
- Forecast and Home become smarter because focus outcomes become evidence.

How does it become uniquely theirs?

- Defaults adapt: 10-minute starts for procrastination, 35-minute blocks for exam prep, recovery-aware blocks after practice, tiny starts when stress is high.

Missing depth:

- Current Focus has a real timer, task attachment, notes, planned sessions, and history.
- It is still a destination where the student chooses work.
- It does not strongly explain why this task, why this length, or what the session changed.

Missing personalization:

- `getRecommendedFocusDuration` exists, but the visible experience does not feel personalized by history or goal.
- It does not learn from completed vs stopped sessions beyond saved history.

Missing utility:

- Focus should be available from Home, Forecast, Watch, widgets, and notifications as a single recommended action.
- The session end should update task progress, effort estimates, notes, and tomorrow's forecast.

Missing retention loop:

- Every session should improve estimated minutes, preferred durations, productive windows, and class difficulty.
- Skipped, paused, stopped, and completed sessions should have different learning effects.

Utility redesign:

- Turn Focus into an action layer, not a tab.
- Start surface:
  - "Recommended now" task.
  - Duration with reason.
  - Expected outcome.
  - One alternate smaller start.
- During session:
  - Minimal controls.
  - Capture friction or note only when needed.
- End session:
  - "Did this move the task?" progress update.
  - "Was estimate accurate?" one tap.
  - "Any note for future you?"
- Feedback model:
  - Completion improves confidence.
  - Stop/skip shortens future block or changes timing.
  - Notes become linked memory.
  - Actual minutes recalibrate Forecast.

### Notes

Target feel: memory that changes the plan.

Why would a student open this?

- To capture something from class that changes action: due date, test hint, question, link, reminder, task, study context.
- To retrieve the exact context needed for today's work.

Why would they return tomorrow?

- Notes resurface when relevant: before class, before a task, during exam prep, or when a question is still unresolved.

What becomes more valuable after 30 days?

- The app has a searchable, linked study memory by class, task, focus session, import source, and exam.
- Notes become study context, task extraction, and forecast signal.

How does it become uniquely theirs?

- The app learns which notes become tasks, which classes generate questions, what kinds of reminders the student writes, and what context helps them finish work.

Missing depth:

- Current Notes has real creation, filters, pinning, assignment links, focus links, and convert-to-task support.
- It is still a generic notes library and editor.
- It does not automatically classify, resurface, or turn notes into operating-system memory.

Missing personalization:

- Notes do not yet adapt templates by course, behavior, or recurring student patterns.
- Pinned and linked state exist, but the system does not infer what matters.

Missing utility:

- Notes should not be a destination unless the student is capturing or retrieving actionable context.
- They should power Home, Forecast, Classes, Focus, and Watch.

Missing retention loop:

- The system should learn from note usage:
  - note became task
  - note helped complete assignment
  - note was pinned
  - note resurfaced and acted on
  - question remained unresolved

Utility redesign:

- Replace generic Notes with Action Memory.
- Capture modes:
  - Homework announced.
  - Test hint.
  - Ask professor.
  - Remember for assignment.
  - Study insight.
- Each note gets:
  - link target, due implication, confidence, suggested action, resurfacing rule.
- Resurface notes:
  - before linked class
  - when linked task becomes next action
  - before exam prep
  - when question is unresolved
- 30-day value:
  - "These are the 6 hints your professor gave that likely matter for the midterm."
  - "You often turn lab notes into tasks. Want to create one?"

### Widget Studio

Target feel: Apple Watch Face Gallery.

Why would a student open this?

- To create an outside-the-app surface that feels like theirs and helps them every day.
- To choose what kind of student life signal deserves Home Screen, Lock Screen, StandBy, or Watch space.

Why would they return tomorrow?

- The gallery should recommend better surfaces as the app learns the student's life.
- The student returns when a new term, class, exam week, sport season, or goal changes what they want visible.

What becomes more valuable after 30 days?

- Widget recommendations become personal:
  - exam countdown during high-risk periods
  - recovery window after heavy focus days
  - class risk when one class slips
  - free time forecast when overload patterns appear
  - grade impact near scores

How does it become uniquely theirs?

- Their Life OS generates a gallery from goals, friction, classes, focus patterns, widget usage, and current semester risk.
- Style supports ownership, but utility defines the widget.

Missing depth:

- Current Widget Studio surface is a horizontal gallery and watch preview inside `MoreScreen`.
- It previews useful widget-like ideas, but it is not a full ownership system.
- Current widget presets are still mostly type, layout, data mode, palette, and size controls.

Missing personalization:

- Recommendations come from simple planner state, not a full Life OS profile.
- Widgets do not yet explain why they are recommended for this student.

Missing utility:

- Students should not configure widgets from blank controls first.
- The app should generate a small set of "faces" for student outcomes.

Missing retention loop:

- Widget placement, opening source, ignored surfaces, and interaction should improve future recommendations.
- A widget should rotate or suggest replacement when the student's semester state changes.

Utility redesign:

- Replace control-first studio with generated gallery.
- Gallery groups:
  - Today Face: what matters now.
  - Exam Face: countdown plus prep path.
  - Grade Face: target risk.
  - Recovery Face: free time and load.
  - Class Face: one class status.
  - Focus Face: start next block.
- Each face includes:
  - reason it exists
  - best surface
  - live preview
  - what improves over time
  - one customization axis: information priority
- Advanced controls remain secondary:
  - theme, palette, layout, class focus, privacy.
- Ownership loop:
  - "Your week is heavy. Swap Today Face for Storm Watch until Friday?"
  - "You always open Class Progress. Pin Biology to Home?"

### Watch

Target feel: Apple Fitness, always available.

Why would a student open this?

- To answer one wrist question in 3 seconds:
  - What now?
  - Am I safe?
  - Start?
  - Done?
  - Snooze?

Why would they return tomorrow?

- Watch becomes the always-available action surface for tiny student decisions in class, hallway, work, practice, commute, or desk time.

What becomes more valuable after 30 days?

- The app learns which wrist signals get acted on, which reminders are too noisy, when the student has time, and what actions are realistic without the phone.

How does it become uniquely theirs?

- Watch signal changes by life profile:
  - Highest GPA: exam countdown and study block.
  - Less Stress: recovery and overload warnings.
  - Athlete: practice-school conflict.
  - Forgetful: next class and capture.
  - Focus Issues: start tiny block.

Missing depth:

- Current Watch is a preview component in the widgets screen.
- There is no visible watchOS app target in the audited source tree, only iOS WidgetKit targets.
- The preview mirrors exam, due item, and focus cards instead of acting as a distinct wrist product.

Missing personalization:

- Watch preview is not generated from Life OS profile or wrist behavior.
- It does not adapt by time of day, context, stress, goal, or ignored nudges.

Missing utility:

- Watch needs one signal, one action, one escalation.
- It should not be a mini planner or widget gallery.

Missing retention loop:

- Wrist actions should teach reminder timing, focus starts, snooze strategy, and capture patterns.

Utility redesign:

- Watch contract:
  - one signal
  - one action
  - one escalation
- Watch signal examples:
  - "Next: Bio lab in 12 min. Bring notebook."
  - "Start 10 min Chem review now."
  - "Thursday overload forming. Move one task?"
  - "Capture homework?"
  - "You are safe tonight. Protect rest."
- Watch actions:
  - start focus
  - mark done
  - smart snooze
  - quick capture
  - accept forecast adjustment
- Escalation:
  - open task on phone
  - open Forecast
  - open Review Inbox
- Retention:
  - every wrist action updates the Life OS.
  - ignored watch nudges reduce frequency or change tone.

## Ranked Opportunities

### Highest Utility Opportunities

1. Student Life Feed on Home
   - Highest impact because it is the daily opening moment.
   - Convert Home from a card board into one next-best-action system with reason and feedback.

2. Forecast as Student Life Weather
   - Prevents future pain instead of displaying dates.
   - Merges workload, free time, focus blocks, grade impact, and recovery into one predictive answer.

3. Focus as an action layer
   - Turns recommendations into progress.
   - Captures actual effort, which improves every forecast and assignment estimate.

4. Notes as Action Memory
   - Makes class context reusable.
   - Converts "notes" from storage into task extraction, resurfacing, and exam prep memory.

5. Grade Impact inside Forecast
   - Reframes grades from bookkeeping to decision support.
   - Helps students choose which work actually changes outcomes.

6. Widget Gallery generated from Life OS
   - Extends utility outside the app.
   - Makes widgets feel earned and personal instead of decorative.

7. Course Intelligence
   - Makes each class a living object.
   - Useful after imports, notes, sessions, and scores accumulate.

8. Watch micro-actions
   - Highest glance utility, but requires platform work.
   - Should follow the core Life OS recommendation model.

### Highest Retention Opportunities

1. "Changed since yesterday" on Home and Forecast
   - Creates a reason to return without adding clutter.

2. Focus feedback loop
   - Every session makes future recommendations better.

3. Forecast risk changes
   - Students return when the app can warn, calm, or adjust them.

4. Notes resurfacing
   - The app becomes memory, not just planning.

5. Widget replacement suggestions
   - Makes external surfaces evolve with the semester.

6. Class trend memory
   - Students return to see class health and pattern recognition.

7. Watch action learning
   - Wrist actions build daily habit with minimal friction.

8. End-of-day and start-of-day transitions
   - Morning: what matters now.
   - Evening: what changed for tomorrow.

### Highest Personalization Opportunities

1. Life OS profile model
   - Identity, behavior, friction, goals, schedule constraints, and action preference.

2. Personal ranking model
   - Different students should see different "most important" work from the same planner data.

3. Actual effort calibration
   - Estimated minutes become personal and class-specific.

4. Reminder and snooze learning
   - The app learns when and how the student responds.

5. Class personality
   - Each class gets risk, volatility, effort, instructor, notes, and grade sensitivity.

6. Widget DNA
   - Generated widgets reflect the student's current life mode.

7. Watch signal strategy
   - One wrist signal selected by goal, friction, and context.

8. Copy tone and action size
   - Direct, calm, tiny-start, ambitious, recovery-first, or grade-first.

### Easiest Wins

1. Write the compounding-value contract into each screen spec before UI changes.
   - No runtime risk.
   - Stops hollow feature expansion.

2. Remove fixed example bias from Home, Forecast, and Classes.
   - Replace hardcoded Organic Chemistry, Calculus, Physics, May 12-May 18, and `Math.max` inflated counts with actual ranked planner state.

3. Add "why this" reason strings to Home next action.
   - Reuses `scoreWork`, due dates, kind, priority, estimate, review status, and course.

4. Add "changed since yesterday" state using persisted lightweight snapshots.
   - Track previous top action, forecast status, risk days, and focus recommendation.

5. Use existing `getRecommendedFocusDuration` visibly.
   - Show the reason for the recommended duration.

6. End Focus with one feedback question.
   - Accurate estimate, too long, too short, blocked.

7. Promote note-to-task conversion and resurfacing rules.
   - Existing convert support can become a primary utility loop.

8. Reframe Widget Studio copy and grouping around generated outcomes.
   - Can start with existing widget data and presets before new native families.

### Hardest But Highest Leverage Wins

1. Life OS model
   - Add durable profile fields for identity, behavior, friction, goals, constraints, and learned preferences.
   - High leverage because every surface consumes it.

2. Forecast engine
   - Build risk, free-time, grade-impact, effort, and recovery models.
   - Hard because it crosses assignments, classes, focus, grades, notes, reminders, and calendar.

3. Personal ranking engine
   - Replace one-size-fits-all priority with goal-aware ranking.
   - Must remain explainable and deterministic enough to trust.

4. Feedback telemetry model
   - Track acted, ignored, snoozed, completed, stopped, converted, resurfaced, and opened-from-widget/watch.
   - High leverage because it makes the app learn.

5. Watch product
   - Requires actual watchOS direction, not just preview.
   - Highest outside-the-phone leverage if built around one signal/action/escalation.

6. Generated widget gallery
   - Requires mapping Life OS states to widget faces, surfaces, previews, and native snapshot truth.
   - High leverage for ownership and retention.

7. Course intelligence layer
   - Turns classes into learned entities.
   - Needs real historical aggregation and good empty states.

8. Grade Impact integration
   - Requires connecting grades, assignments, course categories, and Forecast without turning into a gradebook.

## Implementation Order

### Phase 0: Do Not Touch UI Yet

Define these contracts in code-facing docs before screen redesign:

- Life OS profile fields.
- Event feedback schema.
- Next action ranking reasons.
- Forecast state schema.
- Note resurfacing schema.
- Widget DNA schema.
- Watch signal schema.

### Phase 1: Make Current Data Compound

Goal: maximum utility with minimal new surface area.

- Add a lightweight `StudentLifeMemory` or equivalent persisted state.
- Track:
  - prior top action
  - prior forecast state
  - recommendation actions
  - focus outcome feedback
  - note conversion/resurface actions
  - widget source opens if available
- Add reason strings to recommendations.
- Remove hardcoded sample preference from production surfaces.
- Make Home and Forecast use actual planner-derived state first.

### Phase 2: Personal Ranking

Goal: make two students with the same homework get different useful advice.

- Add Life OS profile:
  - identity
  - behavior goal
  - friction
  - top outcome
  - schedule constraints
  - preferred focus size
- Feed profile into:
  - Home ranking
  - Forecast interventions
  - focus duration
  - widget recommendations
  - reminder tone/timing

### Phase 3: Forecast Engine

Goal: make Forecast predictive.

- Build Forecast states:
  - Clear
  - Watch
  - Warning
  - Storm
  - Recovery
- Add inputs:
  - week load
  - actual effort
  - due clusters
  - class meetings
  - focus capacity
  - grade impact
  - notes with task implications
- Add outputs:
  - reason
  - confidence
  - suggested intervention
  - one-tap action

### Phase 4: Focus And Notes Feedback

Goal: make every action improve the OS.

- End focus sessions with one useful feedback prompt.
- Update estimated minutes based on actual sessions.
- Convert stopped/skipped sessions into smaller future starts.
- Make notes classify into task, question, hint, remember, link, study insight.
- Resurface notes when they affect the next action.

### Phase 5: Widget Studio As Generated Gallery

Goal: ownership and outside-the-app retention.

- Generate recommended faces from Life OS.
- Show live preview by surface.
- Explain why each face is recommended.
- Hide advanced controls until after selecting a face.
- Suggest face changes when semester state changes.

### Phase 6: Watch As Wrist OS

Goal: one signal, one action, one escalation.

- Do not mirror the phone.
- Build from the same recommendation model as Home and Forecast.
- Start with:
  - next signal
  - start focus
  - mark done
  - smart snooze
  - quick capture
- Feed every wrist action back into Life OS.

## Feature Acceptance Test

Before any feature ships, answer these:

1. What does the student open this for?
2. What would make them return tomorrow?
3. What becomes more valuable after 30 days?
4. How does this become uniquely theirs?
5. What input makes it smarter?
6. What action can the student take immediately?
7. What feedback does the app learn from?
8. What gets worse if we remove it?

If there is no compounding value, hide it, merge it, or delete it.

## Product North Star

StudyPlanner should feel alive when:

- Home tells the student the right next move and why.
- Forecast warns or calms them before they ask.
- Classes remember the personality of each course.
- Focus teaches the app how the student actually works.
- Notes become memory that changes the plan.
- Widget Studio generates owned surfaces, not decorative controls.
- Watch gives the smallest useful action at the exact moment.

The goal is not more screens.

The goal is a student operating system that gets smarter every day.
