# Monthly Calendar + Widget Command Center Revamp

## Baseline Audit

The current v2 proof is structurally strong: Today, Review Inbox, This Week, Class Hub, and Widget Showcase all use real planner data and the WidgetSnapshotService contract. It still reads too generic because most app screens share the same pattern: light background, white cards, one dark hero, small metric tiles, and a flat list. The result is useful, but it does not yet feel like a semester operating system.

Main gaps versus the reference direction:

- Calendar is not a first-class product surface. It appears as a weekly strip and workload bars, but there is no rich monthly grid, no day agenda, and no month-level density story.
- Widgets are visually strong, but the app only presents them as fixed previews. There is no customization model for size, style, theme, or focus mode.
- Course color exists, but it does not consistently power calendar dots, insight graphs, badges, widget previews, and hero accents.
- Graphs are functional workload bars rather than premium, interconnected insights. They need to explain heavy weeks, course balance, and completion progress in the same visual language as the calendar.
- Screen hierarchy repeats across tabs. Review Inbox, This Week, and Class Hub need more distinctive hero modules so each surface feels like a native tool, not a white-card template.
- Capture mode has good deterministic data, but it needs a month with light, heavy, exam, completed, and varied course-density days to show the product loop clearly.

## Visual System Direction

StudyPlanner should feel like a vibrant Apple-native semester command center: layered, colorful, glassy, and practical. The UI should be premium rather than childish, student-focused rather than LMS-like, and dense enough for repeated planning.

Design principles for this pass:

- Use atmospheric screen washes and layered glass panels instead of generic flat white stacks.
- Make calendar and widgets hero product surfaces, not supporting cards.
- Use theme palettes as product-level styling, not only a dark/light toggle.
- Let course colors visibly travel through dots, graphs, chips, bars, and widget accents.
- Keep typography tight and native: compact headings inside modules, stronger hierarchy at screen tops, no oversized marketing blocks inside the app.
- Preserve real workflows: Review Inbox acceptance, Today/Week/Class Hub state, parser/scanner behavior, WidgetSnapshotService, native WidgetKit bridge, and IAP safety.

## Theme + Palette System

Add palette presets:

- Ocean Blue
- Violet Glow
- Emerald Focus
- Sunset Study
- Graphite Pro
- Rose Quartz
- Cyber Teal
- Gold Semester

Each palette should provide:

- Primary accent
- Secondary accent
- Warm accent
- Soft surfaces
- Hero background
- Widget background/accent
- Calendar dot defaults
- Graph bar colors

The selected palette should be persisted in a separate theme setting key, never inside planner data. Capture mode can showcase multiple presets and use deterministic defaults without writing demo planner content to production storage.

## Calendar Core

Add a first-class Calendar screen fed by real `Assignment` and `Course` data. Month and week should be one destination: the monthly grid, weekly strip, workload graph, and week timeline live together under the Calendar tab.

Required behavior:

- Month grid with day cells and assignment/exam/completed dots.
- Dots color-coded by course and urgency/type.
- Today marker and selected day marker.
- Heavy days highlighted when a day has three or more open items or at least one exam plus additional work.
- Selected-day agenda with real `TaskRow` entries.
- Month navigation.
- Course filters.
- Month summary: due this month, exams, heavy days, completed count.
- Current week signal and heavy-week insight shared with Today, Calendar, Class Hub, and widgets.

Implementation target:

- `src/logic/semesterInsights.ts` for month plans and graph-ready insight data.
- `src/screens/MonthlyCalendarScreen.tsx` as the combined Calendar tab/screen.

## Graph + Insight Modules

Add lightweight insights that stay useful:

- Workload graph by day/week.
- Course balance graph using course colors.
- Completion progress indicator.
- Heavy-week insight card.

These modules should appear across Today, Calendar, and Class Hub so the same data tells the same story in each context.

## Widget Customization

Expand the in-app widget surface into a customization studio.

Supported concepts:

- Next Due
- This Week
- Monthly Calendar
- Heavy Week
- Course Focus
- Lock Screen Countdown

Supported styles:

- Dark Glass
- Clean White
- Ocean
- Violet
- Emerald
- Sunset
- Graphite

WidgetSnapshotService should remain backward-compatible. Optional theme/month/insight fields may be added to the JSON snapshot; native WidgetKit decoding must continue to render small and medium widgets even if new fields are absent.

## Screens To Upgrade

- Today: central command center with calendar entry, insight module, richer hero, widget signal.
- Review Inbox: more AI-like extraction surface with colorful confidence/risk language and stronger summary.
- Calendar: monthly grid, week strip, week timeline, agenda, heavy-week signal, and workload insight in one native planning surface.
- Class Hub: course module with progress and course-balance graph.
- Widget Showcase: customization controls and multiple styled concepts.

## Capture + QA

Capture mode must remain gated by `EXPO_PUBLIC_STORE_CAPTURE=1`. It should show distinct courses, varied month density, completed days, exam days, heavy days, and widget styles without debug labels or fake production data.

Required QA:

- `npm run typecheck`
- `npm run test`
- `npm run check:iap`
- `npx expo install --check`
- `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh`

Final assets should land in `artifacts/monthly-calendar-widget-revamp`.
