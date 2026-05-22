# /goal — Widgetsmith-Level StudyPlanner Widget Studio

## Mission
Transform StudyPlanner’s Widget Studio from “a settings page for widget presets” into a student-specific widget operating system: beautiful like Widgetsmith/Color Widgets, direct like Widgetsmith templates, more useful than generic aesthetic apps because every surface is powered by real syllabus/homework/class/focus data.

## Research synthesis
Highest-leverage patterns from Widgetsmith and adjacent apps:

1. **Timed/contextual widget systems** — Widgetsmith’s core magic is not only customization; it is matching a widget to a moment. For StudyPlanner, the student equivalent is Morning Brief → Between Classes → Study Block → Night Review.
2. **One-tap cohesive aesthetic packs** — Color Widgets/Themify win by making the whole phone feel coordinated: widget, wallpaper/icon/theme language. For StudyPlanner, the safe high-leverage version is app theme + widget material + palette packs.
3. **Live preview while editing** — Widgy’s strongest UX lesson: preview and controls must be together; no back-and-forth.
4. **Template-first, power-second** — Widgetsmith is approachable because users start from useful templates, then tune color/font/background. StudyPlanner should not become a blank-canvas design tool.
5. **Real data clarity** — Generic widget apps trade on aesthetics; StudyPlanner should win by proving widgets show real reviewed homework, class risk, focus tasks, and import review queues.
6. **Premium boundary around identity and advanced systems** — Free should keep Today/Upcoming. Plus should unlock Smart Stack schedules, advanced templates, premium app themes, and saved customization.

## Exact product definition
A 10/10 Widget Studio must satisfy all of this:

### 1. Smart Stack schedule
- User sees a clear “school day widget rotation” section near the top.
- Four slots are named by moment, not implementation:
  - Morning Brief — 7–10 AM — due today
  - Between Classes — 10 AM–3 PM — class-specific reminder
  - Study Block — 3–9 PM — next focus task
  - Night Review — 9 PM+ — tomorrow/week load
- Each slot is tappable and loads that widget into the live editor.
- One CTA saves all four presets with schedule metadata.
- Copy must not falsely claim iOS will auto-rotate native widgets unless we actually implement that later.

### 2. One-tap theme packs
- User can apply a cohesive app/widget look in one tap.
- Packs pair app theme + widget palette + widget background.
- Plus-gated because identity customization is premium.

### 3. Live editor reinforcement
- Controls include a mini live preview that updates as the user changes options.
- Save copy reinforces “live preview.”

### 4. Premium/Free clarity
- Free remains genuinely useful: Today and Upcoming native widgets.
- Plus owns Smart Stack, premium theme packs, advanced templates, and advanced customization.

### 5. Validation rubric
- Research depth: 10/10 if recommendations are derived from Widgetsmith/Widgy/Color Widgets patterns and mapped to StudyPlanner-specific student value.
- Product leverage: 10/10 if it increases retention, premium conversion, and differentiation without backend/native risk.
- UI clarity: 10/10 if a user understands within 5 seconds what widgets to add and why.
- Honesty: 10/10 if we never imply fake native capabilities or fake sample data.
- Engineering safety: 10/10 if TypeScript + release QA passes and existing import/review/planner flows remain untouched.

## Chosen highest-leverage implementation
Implement Smart Stack schedule + one-tap theme packs + preset schedule metadata. This gives StudyPlanner the biggest Widgetsmith-inspired jump without overbuilding a fragile blank-canvas editor or native WidgetKit scheduler.
