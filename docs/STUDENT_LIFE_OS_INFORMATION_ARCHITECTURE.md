# Student Life OS Information Architecture

Date: 2026-05-31

## IA Rule

The app has four primary surfaces only:

1. Feed
2. Scan
3. Forecast
4. Life

Everything else is supporting, contextual, hidden, or deleted.

## Surface Contracts

| Surface | Job | Hero Content | Supporting Content | Hidden Under It |
|---|---|---|---|---|
| Feed | Tell me what matters now. | Next best action, reason, one-tap action. | Quick Capture, today work, adaptive reminders, relevant context. | Assignment detail, focus start, class detail, notes context. |
| Scan | Turn school material into trusted data. | Syllabus Import, Review Inbox. | Parser confidence, source picker, fix dates, duplicates. | Recent imports, parser status, import history. |
| Forecast | Prevent future overload. | Risk, free time, grade impact, recovery, focus blocks. | Calendar lens, grade impact, smart reminders, schedule suggestions. | Calendar sync, grade calculator, focus block editor. |
| Life | Make the OS adapt to me. | Your Life OS. | Customize Life, Widgets, Watch. | Themes, privacy, locale, sync, subscription, secondary tools. |

## Navigation

Primary tab bar:

- Feed
- Scan
- Forecast
- Life

Deleted from primary nav:

- Classes
- Focus
- Notes
- Grades
- More
- Subscribe

Contextual entry points:

- Class detail opens from assignment, Feed card, Forecast card, or search/context.
- Assignment detail opens from Feed, Scan Review, Forecast, widget, or Watch action.
- Focus opens only from a recommended task/block.
- Grades open from Grade Impact.
- Notes open only as linked context, not a destination.
- Paywall opens after a value preview.

## Life Tab Contract

Life must not feel like settings.

Life is "My Operating System."

Hero:

- Your Life OS

Current:

- Identity
- Behavior
- Focus
- Adaptive Insight

Actions:

- Customize Life
- Customize Widgets
- Customize Watch

Hidden or secondary:

- Themes
- Locale
- Privacy mode
- Calendar sync
- Widget sync diagnostics
- Subscription management
- Legal/support links

## Personalization System

Do not build cosmetic themes. Build behavioral personalization.

### Identity

- Focused Scholar
- Active Athlete
- Creative Artist
- Balanced Wellness
- Working Professional
- Competitive Leader
- Curious Explorer
- Research Driven

Identity affects:

- Copy tone
- Surface emphasis
- Example previews
- Activity/context language
- Widget and Watch default set

### Behavior

- Highest GPA
- Less Stress
- Athletic Performance
- Life Balance
- High Achievement

Behavior affects:

- Feed ordering
- Forecast recommendations
- Widget set
- Watch signal
- Reminder timing/tone
- Focus block duration

Behavior rules:

| Behavior | Feed | Forecast | Widgets/Watch | Reminders/Focus |
|---|---|---|---|---|
| Highest GPA | Exams and high-impact work first. | Grade impact and future risk. | Exam Countdown, Grade Impact. | Direct tone, earlier study blocks. |
| Less Stress | Recovery and manageable next step first. | Free time and load softening. | Free Time Forecast, Recovery Window. | Softer tone, smaller starts. |
| Athletic Performance | Practice/recovery conflicts first. | School around activity load. | Practice Countdown, Recovery Status. | Avoid post-practice overload. |
| Life Balance | Mixed school/life/work/wellness. | Balance and distribution. | Balance Ring, Weekly Mix. | Protect free time. |
| High Achievement | Future leverage and risk first. | Long-range forecast. | Future Risk, Semester Forecast. | Aggressive but startable blocks. |

### Friction

- Procrastination
- Exam Anxiety
- Overcommitment
- Focus Issues
- Forgetfulness

Friction rules:

| Friction | System Behavior |
|---|---|
| Procrastination | Small first step, start-tonight nudge, shorter initial blocks. |
| Exam Anxiety | Calm exam breakdowns, staged review, no shame copy. |
| Overcommitment | Load warnings, conflict language, recovery protection. |
| Focus Issues | Fewer visible tasks, shorter focus windows, Watch starts. |
| Forgetfulness | Reminder-forward Feed, Watch/Lock emphasis. |

### Goals

- Graduate
- Improve GPA
- Protect Free Time
- Perform in Activities
- Reduce Stress

Goals affect:

- Feed ranking
- Forecast headline
- Widget recommendations
- Watch complication
- Reminder strategy
- Focus defaults
- Paywall value framing

## Widget Studio Contract

Widget Studio should feel like Apple Watch Face Gallery.

It must not feel like settings.

Users configure:

1. Widget DNA
2. Information Priority
3. Home Screen
4. Lock Screen
5. Watch
6. StandBy

Primary sequence:

1. Read Life OS.
2. Generate 3-5 recommended widgets.
3. Show live previews by surface.
4. Let user adjust information priority.
5. Let user place on Home, Lock, Watch, StandBy.
6. Hide style controls behind advanced customization.

No generic widgets.

No duplicate widgets.

No cosmetic variants without utility.

## Widget DNA

| Behavior | Generated Widgets |
|---|---|
| Highest GPA | Exam Countdown, Grade Impact |
| Less Stress | Free Time Forecast, Recovery Window |
| Athletic Performance | Practice Countdown, Recovery Status |
| Life Balance | Balance Ring, Weekly Mix |
| High Achievement | Future Risk, Semester Forecast |

Widget jobs:

| Widget | Reason To Exist | Best Surface |
|---|---|---|
| Exam Countdown | Prevent surprise exam risk. | Lock Screen, Watch, Home |
| Grade Impact | Show which work changes GPA. | Home, Forecast |
| Free Time Forecast | Protect recovery and reduce stress. | Home, StandBy |
| Recovery Window | Encourage sustainable pacing. | Watch, StandBy |
| Practice Countdown | Avoid school/activity conflict. | Watch, Lock Screen |
| Recovery Status | Balance performance and study load. | Watch, StandBy |
| Balance Ring | Show weekly mix across school/life/work. | Home |
| Weekly Mix | Prevent one-domain overload. | Home, StandBy |
| Future Risk | Show overload before it hits. | Home, Forecast |
| Semester Forecast | Keep long-range progress visible. | Home, StandBy |

Surface jobs:

- Home Screen: daily operating picture.
- Lock Screen: urgent glance.
- Watch: immediate next signal and tiny action.
- StandBy: ambient forecast/recovery.

## Watch Contract

Watch is not a mini app.

Watch shows:

- One signal
- One action
- One escalation

Allowed Watch actions:

- Start focus
- Snooze intelligently
- Mark done
- Capture homework
- Approve urgent reminder

Watch generated examples:

- Highest GPA: exam countdown, grade impact, study block next.
- Less Stress: recovery window, overload warning, protected free time.
- Athletic Performance: practice countdown, recovery/study conflict.
- Life Balance: weekly mix, free time protection.
- High Achievement: future risk, next leverage action.

## Visual Philosophy

- White-first
- Black typography
- Colorful but restrained
- Apple-native
- Giant hierarchy
- Fewer cards
- Bigger cards
- Less text
- More confidence

Delete any element without intent.

## Refactor Plan

Phase 1: IA shell

- Replace primary tabs with Feed, Scan, Forecast, Life.
- Remove More as a user concept.
- Move Classes, Grades, Focus, Notes, Subscribe behind contextual entry points.

Phase 2: Life OS model

- Add Goals to personalization.
- Make Identity, Behavior, Friction, Goals available to Feed, Forecast, widgets, Watch, reminders, focus.
- Add visible "Adaptive Insight" proof on Life.

Phase 3: Feed simplification

- One dominant next action.
- Three or fewer supporting cards.
- Quick Capture as one-line capture.
- Hide generic dashboards and command rails.

Phase 4: Scan trust

- Merge parser status, recent imports, and review into one trust flow.
- Keep Syllabus Import and Review Inbox hero.
- Show technical state only when actionable.

Phase 5: Forecast

- Rename Plan/Calendar to Forecast.
- Merge calendar, survival plan, grade impact, focus blocks, reminders.
- Replace month-first UI with risk/free-time/next-best-action hierarchy.

Phase 6: Life

- Build Your Life OS hero.
- Show Current: Identity, Behavior, Focus, Adaptive Insight.
- Actions: Customize Life, Customize Widgets, Customize Watch.
- Hide settings utilities.

Phase 7: Widget Studio

- Generate widgets from Life OS.
- Replace type/style controls with gallery and information priority.
- Keep advanced style controls hidden.
- Remove generic or duplicate widgets.

Phase 8: Paywall

- Sell adaptation outcome, not feature checklist.
- Best moment: after import/review, show personalized Forecast and generated widgets.
- Keep trust, privacy, basic capture free.

## Implementation Guardrails

- No UI coding before both contracts exist.
- No feature enters primary nav unless it maps to Feed, Scan, Forecast, or Life.
- No card ships without a clear user decision or behavior change.
- No widget ships without a reason to deserve screen space.
- No Watch signal ships unless useful in 3 seconds.
- No settings-like Life tab.
