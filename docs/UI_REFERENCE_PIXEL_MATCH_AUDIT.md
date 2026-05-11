# UI Reference Pixel Match Audit

Reference: `C:\Users\xxmne\Downloads\studyplanner_ui.png`

Baseline branch: `v1-1-widget-command-center`

Confirmed before audit:

- Pulled latest from `origin/v1-1-widget-command-center`
- Native WidgetKit bridge commit present: `fa26c4487c3e54b0ce952b318fc6a42a121ecc96`
- Branch clean before edits

## Overall Match

Currently matches:

- Product structure matches the reference: Today, Review Inbox, This Week, Class Hub, and widget surfaces exist.
- Capture mode already provides realistic demo data.
- Widget snapshot service and native bridge exist.
- Bottom tab navigation is already close to the reference flow.
- The app uses soft cards, badges, icon buttons, and rounded UI.

Does not match enough:

- Visual language is not unified across screens.
- Today hero is dark and bulky; reference Today is bright, compact, and phone-native.
- Reference relies on white elevated cards, pill chips, purple/blue accent gradients, subtle shadows, and compact list rows.
- Current Review Inbox is too form-heavy; reference uses row cards with lightweight actions.
- This Week lacks a top date strip and compact workload visual.
- Class Hub cards do not match the reference's course icon + progress ring/card rhythm.
- There is no polished in-app widget showcase surface.
- Some copy has encoding artifacts from previous edits.
- Buttons and badges are too inconsistent across screens.

## High-Impact Fixes

| Area | Fix | Files | Risk |
|---|---|---|---|
| Shared visual system | Add premium shell/card/stat/task/badge/widget/course components to standardize spacing, shadows, colors, and rounded cards | `src/components/PremiumUI.tsx`, `src/theme.ts` | Medium |
| Today dashboard | Replace dark hero with greeting, Next Due card, 3 stat chips, heavy-week card, compact today rows, scan CTA, widget preview | `src/screens/TodayScreen.tsx` | Medium |
| Review Inbox | Add header/subtitle, count, confidence filter chips, compact rows with accept/edit/ignore actions, stronger CTAs | `src/screens/ImportScreen.tsx` | Medium |
| This Week Planner | Add horizontal date strip, grouped day sections, exam/quiz labels, completed/open states, workload bars | `src/screens/TodayScreen.tsx`, `src/logic/planner.ts` | Medium |
| Class Hub | Use course cards with icon/color block, due-this-week count, progress ring/bar, detail entry, better empty state | `src/screens/CoursesScreen.tsx` | Medium |
| Widget showcase | Add small, medium, and Lock Screen concept cards powered by `WidgetSnapshotService.build` | `src/screens/TodayScreen.tsx`, `src/components/PremiumUI.tsx` | Medium |
| Demo/capture states | Ensure capture mode fills all upgraded UI without debug labels or placeholders | `src/data/demoSemester.ts`, screens | Low |
| Button polish | Convert primary to purple gradient-like solid where possible, ghost buttons to white/pill outlines | `src/components/AppButton.tsx` | Low |
| Badge polish | Add urgency/confidence badge variants with dot indicators and softer color fills | `src/components/Badge.tsx`, `src/components/PremiumUI.tsx` | Low |
| Bottom nav polish | Slightly reduce visual weight, use white/glass pill and purple selected state | `App.tsx` | Low |

## Today Dashboard

Currently matches:

- Has next action, due today, due this week, review count, overdue count, quick complete, scan CTA, reminders, calendar sync.
- Heavy week warning exists.

Does not match:

- Header should say something like `Good morning, Alex` with a small subtitle.
- Reference Next Due card is a light card with purple icon, not a dark semester hero.
- Stat chips are compact white cards with purple active accents, not large metric cards.
- Today list should use compact rows with left icon tiles and subtle dividers.
- Widget preview is missing from the screen.

Fix:

- Build Today around `PremiumScreenHeader`, `HeroDueCard`, `StatChip`, `TaskRow`, `WarningCard`, and `WidgetPreviewSection`.
- Keep all existing callbacks and planner logic.

Risk: Medium. Pure UI changes, but Today is central.

## Review Inbox

Currently matches:

- Review Inbox exists.
- Supports accept, edit, ignore, restore, apply accepted, and accept high-confidence.
- Shows confidence and review status.

Does not match:

- Reference is row-based; current cards expose full edit forms for every item.
- Missing segmented confidence filters: All, High, Medium, Low.
- Primary CTA should be a strong bottom-style purple pill.
- Secondary actions should be small text/ghost actions.

Fix:

- Add filter state.
- Show compact review rows first.
- Keep inline title/date/course/type editing available through selected/expanded card behavior or lightweight fields.
- Preserve current draft mutation functions.

Risk: Medium. Must preserve parser/review logic.

## This Week Planner

Currently matches:

- Week planner exists and groups days.
- Exam strip and heavy-week warning exist.

Does not match:

- Reference has a date strip at top.
- Grouped rows should look like white cards with tiny course icons and urgency dots.
- Heavy week should include a compact bar chart/workload visual.
- Completed state needs a clearer subdued style.

Fix:

- Add date strip and workload bars.
- Reuse `TaskRow`.
- Use urgency badges for exam/quiz/assignment distinction.

Risk: Medium. Uses existing `buildWeekPlan`.

## Class Hub

Currently matches:

- Courses tab has course list, class detail, exams, work, syllabus source, and progress.

Does not match:

- Reference course cards have colored icon tiles and circular/progress indicators.
- Course list should be the dominant surface, not semester editing.
- Empty states should be lighter and capture-ready.

Fix:

- Add `CourseCard` reusable visual.
- Put course cards first.
- Keep editing and quick add lower on page.

Risk: Medium-low. Existing course editing remains.

## Widget Preview Surface

Currently matches:

- Native/widget snapshot service exists.
- Native bridge commit exists.

Does not match:

- No in-app widget showcase.
- App Store preview needs small, medium, and Lock Screen concept cards in the app.

Fix:

- Build `WidgetPreviewSection` from `WidgetSnapshotService.build`.
- Include small Next Due, medium This Week, and Lock Screen concept previews.
- Present as `Widgets keep your deadlines visible`, not as fake native verification.

Risk: Medium. Must not break native bridge or snapshot schema.

## Typography

Currently matches:

- Uses heavy weights and readable sizes.

Does not match:

- Reference uses tighter title scale inside phone screens.
- Current hero type is too large and dark-card oriented.

Fix:

- Add premium typography helpers in component-level styles.
- Use 26-30 for screen title, 13-15 for metadata, compact row titles.

Risk: Low.

## Spacing, Cards, Colors

Currently matches:

- Rounded cards and soft shadows already exist.

Does not match:

- Reference cards are whiter, shadows softer, borders lighter.
- Accent should lean purple/blue instead of teal.
- Cards need more consistent 16px radius and 12-16px padding.

Fix:

- Update color tokens toward dark navy/purple/blue.
- Add shared card styles.

Risk: Low-medium. Could affect all screens visually.

## Navigation

Currently matches:

- Bottom nav exists and follows the right areas.

Does not match:

- Reference selected state is more compact purple, less dark teal.
- Tab bar should feel glassy/white and lighter.

Fix:

- Adjust `App.tsx` tab styles.

Risk: Low.

## App Review / Safety

Required no-change areas:

- Do not edit product ID behavior.
- Do not fake premium states.
- Keep `EXPO_PUBLIC_STORE_CAPTURE=1` as the only demo data activation.
- Keep `WidgetSnapshotService.write` and native bridge compatibility.

Risk if violated: High.
