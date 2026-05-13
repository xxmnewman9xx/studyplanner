# Experience Spine Rescue Plan

## Reference Image Path Used

- Source of truth: `/Users/mattnewman/Documents/studyplanner_ui_reference.png`
- Expected paths checked but missing:
  - `/Users/mattnewman/Downloads/studyplanner_ui_reference.png`
  - `/Users/mattnewman/work/StudyPlanner-widget-command-center/studyplanner_ui_reference.png`
  - `/Users/mattnewman/work/StudyPlanner-widget-command-center/artifacts/**/studyplanner_ui_reference*.png`

## Top 10 Current Experience Failures

1. Current screens use oversized, generic dashboard typography instead of compact native app hierarchy.
2. Scan is present, but not framed as the first product action.
3. The Scan -> Parse -> Plan -> Focus -> Review loop is not visible enough across Today, Scan, and onboarding.
4. Onboarding is a good preview carousel, but still reads too much like a feature tour.
5. Today has useful data, but the hierarchy is cluttered and does not clearly say "do this next."
6. Found Work is functional, but review trust details need more prominence before Add to Planner.
7. Calendar, Week, and Classes share data, but not enough visual language to feel like one planning system.
8. Widget Studio proves supported widgets, but does not yet feel like a flagship customization studio.
9. Widget customization is too narrow: size/focus/style exist, but theme presets, background styles, class focus, and layout intent are not visible enough.
10. Theme and widget colors work technically, but the named reference presets and contrast safety are not explicit enough.

## Subagent Findings

- Experience Spine Director: Make `src/theme.ts` and `src/components/PremiumUI.tsx` the spine, then touch only onboarding, Today, Scan/Found Work, Widget Studio, and narrow app shell spacing.
- Reference Visual Director: Push toward crisp Apple-native glass: bright off-white canvas, translucent white cards, saturated purple/blue/coral accents, soft shadows, compact heavy typography, and calm dense layouts.
- 9-Year-Old Flow Agent: Use one visible loop everywhere: `1 Scan -> 2 Parse -> 3 Plan -> 4 Focus -> 5 Review`. Prefer plain school copy such as Scan Anything, Check Found Work, Add to Planner, Start Focus, Review.
- Widget Studio Flagship Agent: Keep only small/medium native families. Make the Studio one large live Home Screen preview plus compact controls for Size, Content, Class, Palette, Background, and Layout. Treat saved setup as auto-saved current preferences unless adding a real preset model.
- Functional Spine Agent: Preserve parser trust boundaries, accepted-only planner sync, persisted Found Work, confirmed assignment data, reminders/calendar, WidgetKit snapshots, StoreKit IDs, and production no-demo verification.
- Contrast and Polish Agent: Fix widget palette-only contrast, keep widget text derived from widget background luminance, avoid low parent opacity over text, and add contrast tests around palette/background combinations.

## Shared Design System Changes

- Update `src/theme.ts` with reference-style theme preset names: Aurora, Ocean, Sunset, Forest, Lavender, Midnight, Minimal, Candy, while preserving legacy palette IDs through aliases.
- Add stronger contrast-safe widget background styles: Glass, Soft Gradient, Clean Card, Dark Glass, plus reference-style color presets.
- Extend `src/components/PremiumUI.tsx` with shared primitives:
  - `LoopStepper`
  - `ActionTile`
  - `PremiumHero`
  - `FeaturePreviewCard`
  - `WidgetPreviewCard`
  - `PalettePicker`
  - `ThemePresetCard`
  - `PremiumEmptyState`
  - `ModernPrimaryButton`
- Tighten shared typography/card styles enough to improve all major screens without rewriting each surface.

## Core App Shell / Navigation Changes

- Keep the supported tabs to avoid broad routing churn, but make Scan visually primary where it appears.
- Use the shared loop stepper on onboarding, Today, Scan, and Widget Studio.
- Preserve current bottom dock behavior, settings, and mode controls.

## Animated Onboarding / Tutorial Plan

- Keep native `Animated`; do not add dependencies.
- Reduce the mental model to 5 clear steps matching the reference:
  1. Scan Anything
  2. AI Parses It
  3. Plan It All
  4. Focus Daily
  5. Review & Improve
- Add loop stepper and compact hero copy.
- Make the final CTA start in Scan, with secondary choices: Upload File, Type It In, Add Classes, Try Sample.

## Scan Loop Plan

- Reframe Import as Scan first:
  - Scan Document
  - Upload File
  - Type It In
- Add visible loop stepper and parser progress.
- Keep parser honest: no fake success, no trusted dates without review.
- Improve Found Work summary with assignment/exam/project counts and confidence counts.
- Keep Add to Planner disabled until accepted items exist.

## Today Home Base Plan

- Add the shared loop stepper and a compact glass hero that shows the one next action.
- Keep due today/due soon/needs review cards.
- Add a persistent Scan CTA through the header and warning flows.
- Reduce random dashboard feeling by grouping the rest under a clear loop.

## Plan / Calendar / Week / Classes Plan

- Use shared card/tile primitives for consistent visual language.
- Preserve confirmed assignment data only.
- Improve class identity cards with color, next due item, and quick actions where safe.
- Keep existing Week and Calendar logic.

## Widget Studio Plan

- Rebuild `src/screens/WidgetShowcaseScreen.tsx` into a customization studio:
  - Large glass live preview
  - Small/medium only
  - Widget type selector: Due Next, Today, Needs Review, Week, Class Focus, Empty State
  - Theme presets: Aurora, Ocean, Sunset, Forest, Lavender, Midnight, Minimal, Candy
  - Background styles: Glass, Soft Gradient, Clean Card, Dark Glass
  - Palette swatches affect app and widget preview
  - Class focus selector affects live preview and written snapshots when possible
  - Layout style selector
  - Auto-saved setup through existing preferences
- Avoid unsupported large and lock-screen widgets.

## Widget Visual Plan

- Update React Native previews and shared WidgetKit style snapshots toward the reference: glass/gradient bands, small Due Next / Needs Review, medium Today / Week/Class Focus states, tighter text, visible class colors, no clipping.
- Reuse the existing native Swift WidgetKit renderer unless verification shows it cannot express the new style snapshot safely.
- Keep `.supportedFamilies([.systemSmall, .systemMedium])`.
- Production widget data must not emit `demoState`.

## Contrast / Theme Safeguards

- Use `readableColorOnBackground` and `readableAccentOnBackground` for widget style snapshots.
- Give every preset explicit text/muted/accent tokens.
- Ensure selected chips use white text only on dark/high-contrast backgrounds.
- Dark mode should use dark glass surfaces, not inverted light cards.

## Files Expected To Change

- `src/theme.ts`
- `src/components/PremiumUI.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `src/screens/ImportScreen.tsx`
- `src/screens/WidgetShowcaseScreen.tsx`
- `src/services/widgetPreferences.ts`
- `src/logic/widgetSnapshot.ts`
- `src/models.ts`
- Native WidgetKit files only if verification shows template parity is required
- `tests/*` focused around preferences, widget snapshots, and contrast
- `docs/EXPERIENCE_SPINE_RESCUE_QA.md`
- `artifacts/experience-spine-rescue/*.png`

## Files / Systems To Avoid

- StoreKit internals
- IAP product IDs
- Purchase faking
- Parser rewrite beyond safe UI path fixes
- Large persistence migrations
- ASO / marketing folders
- Unsupported widget families
- Unrelated untracked files
- Videos or marketing composites
