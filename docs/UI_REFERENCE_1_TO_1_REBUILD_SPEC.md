# UI Reference 1:1 Rebuild Spec

Reference: `C:\Users\xxmne\Downloads\studyplanner_ui.png`  
Image size: 1536 x 1024

## Overall Composition

The PNG is an App Store-style product board with a dark midnight canvas, violet/blue light movement, four white iPhone app surfaces in the center, widget previews on the right, and proof panels along the bottom. The app UI inside the phones is bright, dense, rounded, and Apple-like. It is not a recolored old list app.

## Layout Zones

- Left marketing rail: app icon, StudyPlanner/Syllabus AI wordmark, large "Your Semester. Under Control." headline, short product promise, and five compact feature rows.
- Main phone rail: four iPhone screens labeled Today, Review Inbox, This Week, and Class Hub. Phones have black rounded hardware frames and white app surfaces.
- Right widget rail: small Next Due widget, medium This Week widget, and lock screen countdown widget on the same dark background.
- Bottom proof rail: before/after syllabus extraction, microinteraction cards, localization cards, and feature chips.

## Background

- Base color: near-black navy, approximately `#030815` to `#071326`.
- Mood: purple/blue aurora curves and glows from lower left into center.
- The app surfaces should use white/off-white canvas, not a dark app body.
- Widget surfaces use deep violet/navy cards with translucent borders.

## Phone Frame Style

- Rounded black iPhone shell with narrow bezel.
- White screen surface inside the shell.
- Status bar reads 9:41 in reference.
- Dynamic island visible at top.
- Bottom home indicator and compact tab dock visible.

## Card Shapes

- Main screen cards: 16-22 px visual radius, white fill, faint blue-gray borders, soft vertical shadows.
- Metric cards: compact rounded rectangles, pale purple/blue/white fills, dense labels, bold values.
- Hero cards: larger white cards with one icon block, title, metadata, and micro status pill.
- Warning cards: warm cream/yellow panels with red/coral CTA.
- Widget cards: dark translucent rounded panels with thin light border, violet accent text, and coral/blue task icons.

## Typography Scale

- Phone screen title: 26-28 px, very heavy weight.
- Section title: 15-18 px, heavy.
- Card title/task title: 13-16 px, heavy.
- Metadata: 10-12 px, medium/heavy.
- Widget time: 56-64 px, heavy.
- The feel should be San Francisco-like: tight, crisp, dense, no decorative display font.

## Spacing Rhythm

- Phone horizontal padding: about 16 px.
- Vertical screen rhythm: 12-16 px between panels.
- Card internal padding: 12-16 px.
- Compact rows: 64-76 px tall.
- Bottom dock: floating 74 px height, 14 px from the bottom, rounded pill container.

## Screen Hierarchy

1. Header identifies the active command surface.
2. Primary hero or status summary card.
3. Compact metric/status row.
4. Dense grouped content cards.
5. Widget or detail module.
6. Floating bottom dock.

## Today Screen

Required composition:
- Premium light app surface.
- "Today" command-center header with concise subtitle.
- Next Due hero card.
- Three metric pills: Due Today, Due This Week, Review Inbox.
- Heavy week warning card when the week is loaded.
- Weekly urgency strip with seven day pills and workload bars.
- Layered task cards for today's work.
- Widget preview module using `WidgetSnapshotService`.
- Floating bottom navigation.

Old Today components replaced:
- Plain upcoming list.
- Long action button rows as primary content.
- Old AssignmentCard rail.
- Old generic section-header/list structure.

## Review Inbox

Required composition:
- "Review Inbox" header and AI status copy.
- Top extraction summary card.
- Metric pills for confidence buckets.
- Clean segmented filters.
- Extracted item cards with check state, title, course/date/type metadata, confidence pill, and accept/edit/remind micro-actions.
- Prominent "Accept High Confidence" CTA.

Old Review components replaced:
- Utility-first scan hero in capture mode.
- Basic list cards.
- Sparse parser-state presentation.

## This Week Planner

Required composition:
- Date range card with week strip.
- Deadline/assignment/exam metrics.
- Workload warning card when heavy.
- Workload bar map.
- Day groups with elegant task rows.
- Exam and assignment distinction via compact pills.
- Completed states use dimmed/check styling through shared task rows.

Old Week components replaced:
- Focus timer tab for the main dock route.
- Simple grouped list styling.

## Class Hub

Required composition:
- "My Classes" header.
- Premium course cards with color glyphs, progress rings, next due item, and due-this-week count.
- Selected class detail card with metrics, syllabus source, instructor, meetings, and clean class entry point.
- Capture mode hides form-heavy setup/edit sections.

Old Class components replaced:
- Top semester setup form as first visible content.
- Basic course cards.
- Long edit/add form stack in capture view.

## Widget Surfaces

Required composition:
- Small Next Due widget with dark rounded surface, badge, icon, title, course, countdown.
- Medium This Week widget with four compact rows and due labels.
- Lock screen countdown widget with large 9:41 time and notification-style deadline card.
- All data must come from `WidgetSnapshotService.build` or the persisted snapshot service path.

## Reusable Components Needed

Implemented in `src/components/PremiumUI.tsx`:
- `PremiumScreen`
- `PremiumHeader`
- `CommandCenterHero`
- `MetricPill`
- `GlassCard`
- `TaskRow`
- `WeekStrip`
- `CourseCard`
- `WidgetPreviewSmall`
- `WidgetPreviewMedium`
- `LockWidgetPreview`
- `BottomDock`
- `PreviewPosterSurface`

## Capture Mode

When `EXPO_PUBLIC_STORE_CAPTURE=1`:
- Use deterministic Spring/March demo data.
- Force the light app surface.
- Hide dev-like theme toggles and form-heavy setup sections.
- Show polished review/class/week/widget states immediately.
- Do not persist demo planner data.
- Keep widget snapshots generated through `WidgetSnapshotService`.
