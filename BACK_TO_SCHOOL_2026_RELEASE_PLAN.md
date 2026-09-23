# Study Planner AI Back-to-School 2026 Release Plan

Date: 2026-07-06
Theme: Back to School with AI
Goal: Help a student go from an empty semester to a complete, personalized study plan in a few minutes.

## Recommendation

Ship one headline feature:

**AI Semester Setup**

Position it as a guided setup journey, not a standalone scanner:

1. Choose school context and planning goal.
2. Import or paste a syllabus, or use manual quick setup.
3. Review detected courses, assignments, exams, and uncertain dates.
4. Generate the semester dashboard: Pulse, Today, Forecast, Focus blocks, reminders, calendar-ready dates, and recommended widgets.
5. Show the "semester is ready" moment with one next action.

This is higher impact than adding many separate tools because the repo already has the pieces: syllabus import, review inbox, Semester Pulse, Today planning, focus sessions, reminders, calendar sync, widgets, localization, paywall, and App Store screenshot tooling. The release should connect those pieces into one first-run story.

## Why This Is The Flagship

Competitors now commonly lead with AI syllabus or timetable scanning. CourseLink says it extracts assignments, due dates, and exams from a syllabus and syncs them to a calendar. Ahead leads with an AI syllabus scanner plus auto-generated study plans. MyStudyLife has strong student planner coverage and promotes AI timetable scan, reminders, Pomodoro, calendar, grade tracking, and personalization.

Study Planner AI should therefore avoid a "we also scan syllabi" story. The editorial story should be:

**Before classes start, Study Planner AI turns a blank semester into a reviewed plan, forecast, focus rhythm, and glanceable dashboard.**

That is timely, student-outcome driven, and stronger for App Store featuring than a technical parser story.

## Current Repo Evidence

- `README.md` confirms current support for onboarding, syllabus import, course and semester setup, assignments/exams, Today planning, grade tracking, reminders, calendar sync, focus sessions, widgets, and subscription guards.
- `FEATURE_IMPACT_MAP.md` defines Scan, Review Inbox, Home, Forecast, Focus, Classes, Notes, Widgets, Studio, and Paywall around Semester Pulse.
- `EXPERIENCE_SPINE_RND.md` already argues for a linear first session: guided onboarding, profile builder, scan/manual input, hard paywall, personalized dashboard.
- `R_AND_D_PRODUCT_RESEARCH.md` positions Semester Pulse as the signature object.
- `SCREENSHOT_CAPTURE_PLAN.md`, `marketing/social-launch-video/README.md`, and `marketing/apple-ads/README.md` define real-UI asset pipelines and claim guardrails.
- GitNexus index status was current at commit `f25daa6`; CLI queries pointed to `ImportScreen`, `StudySession`, `buildTodayBrain`, `buildStudentLifeContext`, and widget sync as relevant surfaces.
- The current widget suite ships four WidgetKit surfaces: Today, Upcoming, Week, and Class Progress. The Week widget already has a `calendar` layout option, which makes it the lowest-risk entry point for a stronger calendar experience before adding a fifth native widget kind.

## External Reference Patterns

Use references as product strategy, not as a visual copy target.

1. Widgetsmith
   - Strength: broad customization with simple outcomes: themes, wallpapers, countdowns, calendar-aware widgets, actions, Shortcuts, Control Center, and time-of-day widget switching.
   - Takeaway for Study Planner AI: students should not build widgets from scratch. The app should recommend and generate a useful widget set from semester setup, while letting the onboarding color carry through.

2. Widgy
   - Strength: live preview, visible layer/data model, and confidence that the final widget will match the editor.
   - Takeaway for Study Planner AI: every widget upgrade should have a live in-app preview and a screenshot QA target. The student should understand what the widget will show before adding it.

3. Color Widgets
   - Strength: easy theme browsing, calendar widgets, icon/wallpaper coordination, and fast aesthetic payoff.
   - Takeaway for Study Planner AI: keep customization simple. A few basic theme colors, coherent widget styling, and Back-to-School screenshots are enough. Do not turn the app into a theme marketplace.

4. Apple WidgetKit and Liquid Glass guidance
   - Strength: modern widgets should be glanceable, relevant, personalizable, adaptive to tinted/clear/Liquid Glass appearances, and integrated through deep links, configuration, and App Intents where appropriate.
   - Takeaway for Study Planner AI: the widget story should be "your semester is visible before you open the app." Support accented rendering, clear/tinted modes, deep links, and one meaningful action only where native implementation is proven.

## Scope

### Must Ship

1. AI Semester Setup first-run flow
   - Profile questions: school level, semester timing, main concern, schedule style, planning goal.
   - Clear route choice: import syllabus, paste text, upload PDF, saved photo/native OCR if proven, or quick manual setup.
   - Live setup summary: "We will build courses, deadlines, exam countdowns, focus blocks, reminders, and widgets."

2. Immersive color setup inside onboarding
   - Color selection belongs before import/manual setup, while the student is building their semester identity.
   - Replace visible customization/studio controls with one emotional step: "Make it feel like your semester."
   - The screen should be full-bleed, tactile, and interactive: live dashboard preview, live widget preview, course cards, pulse ring, and focus button all recolor when the student taps a theme color.
   - Primary controls: pick one theme color from a few basic options, preview it live, and continue.
   - The result writes app accent, class colors, risk color, focus color, widget accent, and custom palette in one save.
   - Keep advanced decisions automatic: widget type, widget size, card style, urgency source, and layout are planner-owned.

3. Review-to-dashboard completion moment
   - After review/apply, show "Your semester is ready."
   - Include classes created, assignments found, exams found, dates needing review, first focus block, and next action.
   - Route directly into Home with Semester Pulse at the top.

4. Semester Plan Generator
   - Convert reviewed assignments and exams into week-by-week study blocks.
   - Use existing `buildStudyPlan`, `buildSemesterSnapshot`, `buildTodayBrain`, Forecast, and Focus logic where possible.
   - Avoid opaque auto-scheduling. Show reasons: due date, workload, exam proximity, estimated effort.

5. Back-to-School visual refresh
   - Keep the app calm and premium.
   - Add seasonal setup artwork or accents only where it reinforces "new semester."
   - Do not turn the app into a theme store.

6. App Store creative refresh
   - First screenshots should show: import, review, semester ready, Pulse/Home, forecast, focus, widgets.
   - Use only real UI from the release build.
   - Do not claim Canvas/LMS sync, automatic homework submission, guaranteed extraction, or unsupported Watch surfaces.

### Should Ship

1. Exam countdown improvements
   - Prominent exam cards in Home, Forecast, Focus, widgets, and screenshots.

2. Calendar confidence polish
   - Make reviewed dates visibly safe to sync.
   - Show unreviewed dates are held back.

3. Focus block suggestions
   - "Start with 25 minutes tonight" from deadline pressure and student profile.

4. Widget recommendation refresh
   - Default Back-to-School widget set: Today, Upcoming, Week, Class Progress.
   - Recommend based on first semester setup state.

5. Calendar widget upgrade
   - Promote the Week widget into a real calendar-style semester widget first: seven-day grid or strip, due-count dots, exam badges, today highlight, and a next-focus cue.
   - Evaluate a dedicated Calendar widget only after implementation impact analysis across widget kind types, snapshot generation, native Swift widget files, Expo widget declarations, and App Store screenshot fixtures.
   - The calendar widget should answer: "What is coming this week, and where are the danger days?"

6. Existing widget quality pass
   - Today: one next action, two supporting tasks, deadline pressure, and a direct deep link to Today or Focus.
   - Upcoming: next deadline timeline, exam countdown emphasis, and reviewed/unreviewed date confidence.
   - Week: workload heat by day, peak-day label, exam markers, and calendar layout as the default Back-to-School hero.
   - Class Progress: class health, next task, current progress, and a deep link to the class.
   - All widgets: selected onboarding color, Liquid Glass/accented rendering compatibility, tinted/clear appearance QA, Dynamic Type fit, dark mode, and no unreadable transparency.

7. Accessibility and localization pass
   - Dynamic type, VoiceOver labels, contrast, RTL screenshots, long-language fit.

### Do Not Ship In This Release Unless Already Proven

- Canvas/LMS sync.
- Full App Intents/Shortcuts unless the native scope is already implemented and testable.
- New Watch marketing unless a real watchOS target/surface is proven.
- Opaque automatic calendar overwrites.
- Broad social/community features.
- Heavy gamification or streak pressure.

## Product Flow

1. Empty semester
   - CTA: "Set up my semester."
   - Secondary: "Try a quick manual plan."

2. Student profile
   - Five taps max.
   - Output: "College, exam stress, busy afternoons. We will prioritize early study blocks and deadline warnings."

3. Interactive color setup
   - Working title: "Pick your semester color."
   - Student sees a living preview of their semester board, not a form.
   - Tapping a color instantly changes the preview, widgets, class cards, and focus state.
   - The step should feel immersive because the board responds, not because the user has many controls.
   - Haptics mark selections, resets, and final lock-in.
   - Final CTA: "Use this color."

4. Import or manual setup
   - Import remains the hero input.
   - Manual setup is an express fallback: class names plus 3-5 key dates.

5. Review
   - Trust is the feature.
   - User confirms or edits rows before anything enters Home, widgets, reminders, or calendar.

6. Generated semester
   - Courses, assignments, exams, study blocks, reminders, and widgets become one dashboard.

7. First action
   - "Review 2 uncertain dates" or "Start a 25-minute Chemistry block."

## Immersive Color Onboarding Spec

This is the custom feature: not themes, not a settings panel, not a widget studio. It is a short, high-feel onboarding moment where the student picks one theme color and immediately sees the generated semester feel like theirs.

### Experience

The screen opens on a floating semester board. Behind it, soft school-year color fields shift with the selected theme color. The preview has three live objects:

- Semester Pulse hero.
- Three class cards.
- A small widget/focus preview.

When the student taps a theme color, the whole board responds immediately. The class dots, pulse ring, focus CTA, widget accent, and import/review highlights all shift together. The student should understand that color is not decorative; it becomes the language of the semester.

### Interaction Model

1. Theme color choice
   - Options should be basic and obvious: Blue, Green, Orange, Purple, Pink, Graphite.
   - Use color names only. Avoid mood names, theme packs, and abstract labels.
   - The default can be Blue, unless onboarding profile data strongly suggests another safe default.

2. Immersive preview
   - Large glass color wells sit over the live board.
   - Tap a color to preview immediately.
   - No sliders, gradients, opacity, or advanced edit controls in onboarding.

3. Smart derivation
   - The picked theme color becomes the app accent and widget accent.
   - Class colors are derived automatically from the theme color and adjusted for contrast.
   - Risk, focus, and activity colors are derived from fixed semantic rules so meaning stays consistent.

4. No exact color picker in onboarding
   - Native `ColorPicker` can remain a later settings enhancement, not part of first-run setup.
   - Onboarding should ask for one decision and move on.

5. Lock-in
   - CTA: "Use this color."
   - The board briefly settles into the selected palette.
   - Save patch updates `selectedTheme: "custom"`, `customPalette`, `appTheme`, and `customization`.

### Basic Theme Colors

Initial recommended set:

| Name | Theme color | Derived role |
| --- | --- | --- |
| Blue | `#1476FF` | Default academic/productivity accent |
| Green | `#16A66E` | Calm progress and focus-friendly setup |
| Orange | `#FF5A1F` | Energetic Back-to-School setup |
| Purple | `#8B3DFF` | Creative/planning-forward setup |
| Pink | `#EC4899` | Expressive but still app-safe setup |
| Graphite | `#111827` | Minimal, high-contrast setup |

The selected color should generate a complete palette rather than letting the user manually tune every role. This keeps onboarding fast while still making the app feel personal.

### Liquid Glass Rules

- Use Liquid Glass for the floating interaction layer: onboarding board, palette tray, CTAs, bottom controls, and live preview objects.
- Do not make dense text cards fully transparent.
- Use clear glass only over visually rich, stable background areas.
- On iOS 26+, use Expo `GlassView`; on unsupported platforms, use `BlurView` or the current styled fallback.
- Respect Reduce Transparency, Reduce Motion, and high-contrast accessibility settings.

### Implementation Notes

Likely code targets, pending GitNexus impact before edits:

- `App.tsx` `Onboarding`: primary shipping onboarding flow appears to live here.
- `src/screens/OnboardingScreen.tsx`: older/simple onboarding screen; confirm whether still routed before investing.
- `src/components/LiquidGlass.tsx`: consolidate native `expo-glass-effect` support here.
- `src/customization.ts`: add one helper like `applyOnboardingPalette(...)` that sets all relevant color roles at once.
- `src/theme.ts` and `src/themeContext.tsx`: ensure selected onboarding colors drive app-level accent consistently.
- `src/services/widgetSnapshot.ts`: ensure widget previews inherit the onboarding palette automatically.

Dependencies to verify before implementation:

- `expo-glass-effect` for iOS 26 Liquid Glass.
- `expo-blur` for fallback.
- `@expo/ui` only if we later add a native exact color picker outside onboarding.

## Screenshot QA Planning Pass

Before implementation, run a screenshot-led QA planning pass so the build target is exact.

### Baseline Screenshots To Capture

1. Current onboarding first screen.
2. Current profile/question steps in the active `App.tsx` onboarding flow.
3. Current paywall transition from onboarding.
4. Current Home/Semester Pulse surface.
5. Current widget preview/customization surface.
6. Current native Today, Upcoming, Week, and Class Progress widgets in light, dark, tinted, and clear appearances where simulator support allows.
7. Current week/calendar widget state with an empty semester, a normal week, and an overloaded exam week.

### Prototype Screenshots To Produce Before Code

Create a short visual storyboard for the intended onboarding color step:

1. Default Blue selected.
2. Orange selected with live preview recolored.
3. Graphite selected in high-contrast style.
4. Final lock-in state after tapping "Use this color."
5. Same screen with long localized strings.
6. Same screen with RTL layout.

Create a second storyboard for the Back-to-School widget suite:

1. Calendar/Week widget as the hero: today highlight, due dots, exam badge, peak-day label.
2. Today widget showing one next action and a focus CTA/deep link.
3. Upcoming widget showing a clean deadline countdown.
4. Class Progress widget showing class health and next task.
5. Widget recommendation screen after semester setup.
6. Same widgets under selected Blue, Orange, Graphite, dark mode, tinted mode, and Reduce Transparency.

### QA Questions

- Does the screen communicate one decision only?
- Does the live preview make the choice feel meaningful?
- Are the color wells large enough for one-handed use?
- Does text remain readable on every color?
- Does Reduce Transparency still look premium?
- Does the final selected color visibly carry into Home, widgets, focus, and review?
- Does the interaction feel immersive without delaying the path to syllabus import?

### Top-Down QA Concepts

These are the release concepts to screenshot, critique, and improve before final implementation:

1. Empty semester to generated semester
   - Can a new student understand the path from blank state to complete plan in under a minute of screenshots?

2. Immersive color onboarding
   - Does the color choice feel like setting up a semester identity, not decorating settings?

3. Calendar widget hero
   - Does the widget communicate workload, exams, and danger days at a glance?

4. Widget recommendation moment
   - After setup, does the app make the right widgets feel obvious and worth adding?

5. Import trust loop
   - Are detected assignments, exams, uncertain dates, and review gates clear enough for a student to trust AI setup?

6. Semester-ready payoff
   - Does the completion screen feel like the student's semester has materially changed?

7. Home/Pulse first viewport
   - Does Home immediately answer "what matters today, this week, and before the next exam?"

8. Forecast and anti-cramming story
   - Does the app show heavy weeks early enough to support the nomination story?

9. Focus session handoff
   - Can the app turn a deadline into the next 25-minute action without extra configuration?

10. Accessibility and system adaptation
   - Do onboarding, widgets, and screenshots hold up under Dynamic Type, VoiceOver, Reduce Motion, Reduce Transparency, dark mode, tinted widgets, and long localized copy?

## App Store Featuring Strategy

Apple says Featuring Nominations can be used for significant updates, app enhancements, app launches, In-App Events, and stories. Apple asks for a minimum of two weeks lead time and recommends up to three months for wider consideration. The CSV template guidance recommends submitting and finalizing plans at least three weeks before launch.

Target launch window: August 20 to September 5, 2026.

Nomination submission target: July 27 to August 7, 2026.

Nomination type: App Enhancements.

Nomination name: Back to School with AI.

Nomination description draft, under 1,000 characters:

Study Planner AI's Back-to-School update helps students turn an empty semester into a reviewed, personalized study plan before classes begin. Students can import a syllabus or enter key dates, review detected courses, assignments, exams, and uncertain deadlines, then generate a semester dashboard with Today priorities, Semester Pulse, workload forecast, focus blocks, reminders, calendar-ready dates, and recommended widgets. The update is designed around a timely student outcome: reducing first-week setup stress and helping students avoid last-minute cramming by building the plan early. It keeps students in control by requiring review before imported work affects reminders, widgets, or calendar sync.

Helpful details draft, under 500 characters:

This release reframes Study Planner AI from a task manager into a semester planning assistant. The standout moment is the guided setup: import or enter a syllabus, verify the dates, then see the whole semester become a daily plan, forecast, focus rhythm, and widget set. Built by an indie developer for students preparing for the new school year.

Supplemental material links to prepare:

- Product video or App Preview showing import, review, semester ready, and Home.
- Screenshot contact sheet.
- Press kit or launch page.
- Accessibility/localization QA summary.
- App Review notes proving claim boundaries.

## Marketing Assets

Required:

1. Updated App Store screenshots
   - 01: "Set up your semester in minutes"
   - 02: "Import your syllabus"
   - 03: "Review every deadline first"
   - 04: "Your semester plan is ready"
   - 05: "Know what matters today"
   - 06: "See heavy weeks before they hit"
   - 07: "Turn deadlines into focus blocks"
   - 08: "See your semester on your calendar widget"
   - 09: "Keep Today, exams, and class progress on your Home Screen"

2. Release notes
   - Lead with student outcome, not implementation.
   - Mention reviewed imports, generated semester plan, focus suggestions, Back-to-School polish, and accessibility/performance improvements.

3. Launch blog post
   - Title: "Back to School with AI: Build Your Semester Plan Before Classes Begin"
   - Structure: first-week problem, syllabus setup, review/trust, generated plan, focus rhythm, widgets, student control.

4. Social assets
   - 9:16 launch video using real UI.
   - Poster frame: "Your semester, planned before it starts."
   - 3 short cuts: import, review, semester ready.

Optional:

- Press kit.
- In-App Event if there is a credible seasonal moment and final build timing is stable.
- Custom product page for "syllabus planner" and "exam planner" search intent.

## Timeline

### Week 1: July 6-12

- Finalize flagship scope.
- Audit current onboarding, import, review, Home, Focus, Forecast, and widget flows.
- Audit current native widgets against Widgetsmith, Widgy, Color Widgets, and Apple WidgetKit guidance.
- Identify exact code surfaces and run GitNexus impact before any symbol edits.
- Prototype copy and wire flow.
- Produce screenshot targets for immersive color onboarding and the calendar/widget suite.

### Week 2: July 13-19

- Implement setup flow and semester-ready moment.
- Wire reviewed import/manual setup into generated plan summary.
- Promote the Week widget calendar layout into the Back-to-School widget hero if impact analysis confirms this is the lowest-risk route.
- Start screenshot fixture updates.

### Week 3: July 20-26

- Polish Semester Plan Generator behavior.
- Add Back-to-School visual refresh.
- Improve exam countdown, focus suggestion, widget recommendation, and existing widget quality moments.
- Run typecheck and targeted planner/import/widget tests.

### Week 4: July 27-August 2

- Full localization, accessibility, and layout QA.
- Capture first App Store screenshots and video source.
- Submit App Store featuring nomination if build scope is stable.

### Week 5: August 3-9

- TestFlight build.
- Regression QA: onboarding, paywall, import, review, Home, reminders, calendar, widgets, localization.
- Fix blockers only.

### Week 6: August 10-16

- Final creative production.
- App Store metadata, release notes, App Review notes, and launch blog final.
- Submit App Store build.

### Launch: August 20-September 5

- Release during peak Back-to-School window.
- Monitor activation, import completion, review completion, generated plan completion, paywall conversion, crash-free sessions, and screenshot/product page conversion.

## Success Metrics

- Setup completion: empty semester to generated dashboard.
- Import/paste/manual setup start rate.
- Review completion rate.
- First useful action rate within first session.
- Day 1 and Day 7 retention.
- Subscription conversion after semester-ready moment.
- App Store product page conversion.
- Widget setup or widget sync rate.
- Crash-free and performance stability.

## Engineering Guardrails

- Before code changes, read Expo SDK 56 docs at `https://docs.expo.dev/versions/v56.0.0/`.
- Before editing any function, class, or method, run GitNexus impact analysis for that symbol and report direct callers, affected processes, and risk.
- If impact is HIGH or CRITICAL, warn before editing.
- Before commit, run `npx gitnexus detect-changes --repo /Users/mattnewman/work/StudyPlanner`.
- Preserve the current dirty tree; do not revert unrelated user or generated changes.
- Use real product behavior and real screenshots only.
- Keep all marketing claims within proven App Review boundaries.

## First Implementation Targets

These are the likely starting points, subject to pre-edit GitNexus impact checks:

- `src/screens/ImportScreen.tsx`: import/setup entry and review bridge.
- `App.tsx`: first-run routing, paywall flow, and semester-ready route if still centralized there.
- `src/ai.ts`: study plan generation behavior.
- `src/intelligence.ts`: semester snapshot and plan summary.
- `src/logic/planner.ts`: Today/Pulse/focus recommendation logic.
- `src/logic/studentLifeDepth.ts`: personalization and retention signals.
- `src/services/widgetSnapshot.ts`: recommended widget defaults from setup state.
- `src/widgets/widgetPresets.ts`: widget kind definitions, defaults, layouts, and calendar promotion path.
- `src/widgets/StudyPlannerWidgets.tsx`: shared Expo widget layout source for Today, Upcoming, Week, and Class Progress.
- `ios/ExpoWidgetsTarget/`: native WidgetKit wrappers and supported families.
- Screenshot/video scripts under `scripts/` and `marketing/social-launch-video/`.

## Sources Checked

- Apple Getting Featured: https://developer.apple.com/app-store/getting-featured/
- Apple Featuring Nominations Help: https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- Apple Nominations Template: https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
- Apple WidgetKit Liquid Glass guidance: https://developer.apple.com/documentation/widgetkit/optimizing-your-widget-for-accented-rendering-mode-and-liquid-glass
- Apple HIG Widgets: https://developer.apple.com/design/human-interface-guidelines/widgets/
- Apple WWDC26 WidgetKit foundations: https://developer.apple.com/videos/play/wwdc2026/277/
- Widgetsmith App Store page: https://apps.apple.com/us/app/widgetsmith/id1523682319
- Widgy Widgets App Store page: https://apps.apple.com/us/app/widgy-widgets-home-lock-watch/id1524540481
- Color Widgets App Store page: https://apps.apple.com/us/app/color-widgets/id1531594277
- Study Planner AI App Store page: https://apps.apple.com/us/app/study-planner-ai/id6766181202
- CourseLink App Store page: https://apps.apple.com/us/app/courselink-ai-study-planner/id6755744656
- Ahead App Store page: https://apps.apple.com/us/app/ahead-ai-student-planner/id6756762430
- MyStudyLife App Store page: https://apps.apple.com/us/app/my-study-life-school-planner/id910639339
- MyStudyLife website: https://mystudylife.com/
