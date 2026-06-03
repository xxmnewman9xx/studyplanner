# New App Flow Spec

## North Star

StudyPlanner: Syllabus AI turns your syllabus and student profile into a personalized school dashboard.

The first session should feel like:

1. Tell us what kind of student life you have.
2. Choose how to add your school data.
3. Unlock the dashboard we will build for you.
4. Land on Home with one clear next action.

## Exact Onboarding Steps

### Step 1: Promise

**Screen job:** Establish one outcome.

**Primary copy:** "Turn your syllabus into a personalized school dashboard."

**Data captured:** None.

**Dashboard impact:** Sets expectation for Home modules: Next important thing, Today, Semester Pulse, Upcoming risk, Focus suggestion, Recommended Widgets.

**CTA:** Continue.

### Step 2: School Level

**Question:** "What level are you in?"

**Options:** Middle school, High school, College, Grad school.

**Data captured:** `schoolLevel`.

**Dashboard impact:**

- Middle school: simpler copy, fewer assumptions about syllabi, more deadline reminders.
- High school: classes and activities balance, exam/homework language.
- College: syllabus-first, semester risk, readings/projects.
- Grad school: readings, long projects, research deadlines, less childish motivation.

### Step 3: Goal

**Question:** "What do you want StudyPlanner to help with most?"

**Options:** Better grades, Less stress, Stay organized, Balance activities.

**Data captured:** `goal`.

**Dashboard impact:**

- Better grades: risk, exams, class progress emphasized.
- Less stress: Next important thing and Focus suggestion use calming copy.
- Stay organized: Today and Review trust emphasized.
- Balance activities: schedule pressure and Upcoming risk emphasized.

### Step 4: Struggle

**Question:** "What usually gets in the way?"

**Options:** Procrastination, Forgetting deadlines, Exam anxiety, Too much going on.

**Data captured:** `struggle`.

**Dashboard impact:**

- Procrastination: smaller focus suggestions and earlier starts.
- Forgetting deadlines: Today, due-next widget recommendation, reminders.
- Exam anxiety: exam risk, study pacing, calm focus copy.
- Too much going on: workload forecast and schedule conflict language.

### Step 5: Schedule Style

**Question:** "What does your week feel like?"

**Options:** Class-heavy, Activities-heavy, Work-heavy, Balanced.

**Data captured:** `scheduleStyle`.

**Dashboard impact:**

- Class-heavy: class meeting density affects Today and risk.
- Activities-heavy: dashboard protects shorter focus windows.
- Work-heavy: recommendations prefer realistic evening/weekend blocks.
- Balanced: default prioritization across due dates and effort.

### Step 6: Input Choice

**Question:** "How do you want to add your schoolwork?"

**Options:** Scan syllabus, Add manually.

**Data captured:** `inputChoice`.

**Dashboard impact:**

- Scan syllabus: route to scan/upload/paste source; dashboard confidence depends on extraction/review.
- Add manually: route to class names plus key dates; dashboard starts from sparse but trusted data.

### Step 7A: Scan Syllabus Setup

**Shown if:** Student chooses Scan syllabus.

**Screen job:** Capture a source without adding complexity.

**Actions:** Scan paper, upload PDF, paste text.

**Data captured:** `syllabusSourceType`, source file/text/photo reference, parse confidence when available, classes, assignments, exams, review flags.

**Dashboard impact:** Powers all modules. Low-confidence items trigger Review trust alerts after Plus.

**Important constraint:** Only claim OCR/photo extraction if real. If not proven, frame photo as a review source and prefer upload/paste.

### Step 7B: Manual Input Setup

**Shown if:** Student chooses Add manually.

**Screen job:** Create minimum viable dashboard data.

**Fields:** Class names, optional meeting pattern, 3-5 key dates, optional exam/project labels.

**Data captured:** `classes`, `manualAssignments`, `manualExams`, optional `meetings`.

**Dashboard impact:** Creates Today, Classes, simple risk, and focus suggestions. Sparse data should produce softer Forecast language.

### Step 8: Auto Personalization

**Screen job:** Show that the profile has become a plan, without revealing dashboard access.

**Data captured:** Generated `classColors`, dashboard emphasis model, recommended module order, recommended widget types.

**Dashboard impact:** Applies class colors automatically. Sets first Home arrangement.

**What the student sees:** A summary, not the dashboard:

- "Your dashboard will prioritize: deadlines, exam risk, 25-minute focus blocks."
- "Class colors generated automatically."
- "Recommended widgets will be based on your biggest struggle."

### Step 9: Hard Paywall

**Trigger:** Immediately after onboarding, input choice, and auto-personalization summary.

**Rule:** No dashboard access before paywall.

**Paywall headline:** "Your school dashboard is ready."

**Paywall value stack:**

- Personalized dashboard from your syllabus and profile
- Next important thing every day
- Semester Pulse and upcoming risk
- Focus suggestions based on your week
- Recommended widgets
- Class colors and dashboard style

**Allowed before payment:** Restore, purchase, terms/privacy, close only if app policy requires it. If closed, route back to locked paywall state, not Home.

### Step 10: Personalized Dashboard

**Shown after:** Active Plus entitlement.

**First Home state:** The student lands on Home with one clear action and personalized dashboard modules.

## Data Captured At Each Step

| Step | Data | Required? | Used For |
| --- | --- | --- | --- |
| Promise | None | No | Sets expectation |
| School level | `schoolLevel` | Yes | Copy, class assumptions, risk language |
| Goal | `goal` | Yes | Dashboard emphasis |
| Struggle | `struggle` | Yes | Focus, reminders, widgets |
| Schedule style | `scheduleStyle` | Yes | Forecast/risk weighting |
| Input choice | `inputChoice` | Yes | Scan/manual routing |
| Scan setup | Source, parsed classes/dates, confidence | Yes for scan path | Dashboard data |
| Manual setup | Classes and key dates | Yes for manual path | Dashboard data |
| Auto personalization | Class colors, module emphasis, widget recommendations | Yes | Dashboard appearance |
| Paywall | Entitlement result | Yes | Access control |

## How Data Affects Dashboard

| Data | Dashboard Effect |
| --- | --- |
| School level | Changes language, default workload assumptions, class/date expectations |
| Goal | Determines which module gets stronger emphasis |
| Struggle | Determines Today copy, Focus suggestion, widget recommendation |
| Schedule style | Tunes Upcoming risk and focus window realism |
| Syllabus/manual data | Creates classes, deadlines, exams, Today, risk, Focus |
| Class colors | Colors classes, tasks, risk labels, widgets |
| Source confidence | Controls Review trust alerts and whether items can power Today |

## Paywall Trigger

The hard paywall triggers after:

1. Required profile questions are answered.
2. Student chooses scan or manual input.
3. The app has either captured a source or captured minimum manual class/date data.
4. Auto-personalization summary is generated.

The dashboard must not be reachable until Plus is active.

## Dashboard Modules

### Next Important Thing

The primary paid payoff. Shows one action, one reason, one class, one CTA.

Examples:

- "Start Chemistry lab prep tonight."
- "Review 3 imported dates before they affect Today."
- "Add your first due date to finish setup."

### Today

A compact list of today's classes, deadlines, and actions. It should not become a full task manager on Home.

### Semester Pulse

A simple semester health state with score/status/trend/reason/action. Must never imply grade prediction.

### Upcoming Risk

A weather-like warning: calm, building, heavy, peak, recovery. Shows the next overloaded day/week and why.

### Focus Suggestion

One recommended study block tied to a class or assignment. Duration depends on profile and workload.

### Recommended Widgets

One small module recommending a real or instruction-only widget preview:

- Due Next for deadline forgetfulness
- Week Risk for too much going on
- Focus Next for procrastination
- Exam Countdown for exam anxiety

Only claim real widget behavior if proven in the shipped app.

## Tab Structure

Tabs that remain:

1. Home
2. Scan
3. Plan
4. Classes
5. More

## What Each Remaining Tab Does

### Home

Paid dashboard and daily decision surface.

### Scan

Add or update syllabus sources. Also supports manual add as fallback.

### Plan

Forecast, upcoming workload, and schedule risk. This replaces "Calendar" as the main mental model.

### Classes

Course hubs, class colors, class-level risk, assignments by class.

### More

Settings, Plus status, Recommended Widgets, customization, restore purchase, privacy, support.

## Tabs Removed Or Hidden

| Current / Possible Tab | Decision | Why |
| --- | --- | --- |
| Today | Rename/merge into Home | Home is the dashboard payoff |
| Calendar | Rename to Plan | Forecast is stronger than generic calendar |
| Notes | Hide from tab bar | Notes are contextual, not primary |
| Focus | Hide from tab bar | Focus launches from Home/Plan/Class actions |
| Widgets | Move into More as Recommended Widgets | Avoid overbuilding and editor complexity |
| Watch | Hide completely unless real | Avoid unsupported claims |
| Grades | Hide for now | Not part of the new spine |
| Review Inbox | Hide as contextual alert | Trust workflow, not a destination |
| Customization | Move into More / Plus | Small paid setting, not a store |

## What Plus Unlocks

Plus unlocks:

- Personalized dashboard/Home
- Syllabus AI output applied to the dashboard
- Manual setup saved as dashboard
- Next important thing
- Today module
- Semester Pulse
- Upcoming risk and Plan forecast
- Focus suggestions
- Classes dashboard
- Review helpers
- Recommended Widgets
- Class color customization
- Dashboard style
- Adaptive local recommendations from usage

Plus does not unlock unsupported Watch features unless Watch is real.

## Widget Requirements

- Do not overbuild.
- Use Recommended Widgets only.
- Show preview plus add instructions.
- Recommend based on onboarding and dashboard data.
- Do not claim live widget behavior unless proven.
- Widget Studio is not part of this flow.

## Empty State Rules

- Before Plus: no dashboard empty states. The user sees onboarding/input/paywall.
- After Plus with no data: one action only, usually Scan or Add manually.
- Module empties should be quiet and useful.
- Empty states should not advertise hidden tabs.
