# Widget Studio Subagent Scorecard

Evidence: real iPhone simulator screenshots in `artifacts/widget-studio-live-pass/screenshots/` and contact sheet `artifacts/widget-studio-live-pass/widget-studio-contact-sheet.png`.

## Widget Product Reviewer

Score: 8/10

Top issues:
- Still feels preset-led more than deeply individualized coaching.
- Recommendation cards are partly below the fold in the first viewport.
- Subscription-worthiness depends on visible interaction depth.
- The top taxonomy repeats across behavior modes.
- Needs stronger per-card "why this is recommended" proof.

Fixes applied:
- Added live planner preview above recommendations.
- Added real course/task/status data into the preview.
- Added visible Plus adaptive stack signal.

Not applied:
- Full interaction proof beyond screenshots.
- Recommendation card set fully visible above tab bar.

## Apple Widget/HIG Reviewer

Score: 7/10

Top issues:
- Widget previews still carry too much text for pure widget-native glanceability.
- Typography remains heavy in stacked title blocks.
- Preview widgets behave more like app cards than quiet iOS widgets.
- Lower recommendation content is cramped near the tab bar.
- Saturated accents compete with the widget preview.

Fixes applied:
- Clear hierarchy, rounded native surfaces, soft fills, and recognizable widget previews.

Not applied:
- Further text reduction inside widget previews.
- More conservative Apple-style quietness.

## Personalization Reviewer

Score: 8/10

Top issues:
- StudentDNA adaptation is visible but mostly label/theme level.
- OS surfaces are tags more than deeply distinct layouts.
- WidgetDNA/WatchDNA adaptation appears mostly through recommendation copy.
- Some views still use generic strategy phrasing.
- Layout structure remains similar across all modes.

Fixes applied:
- StudentDNA, OSBehavior, WidgetDNA, WatchDNA, and friction points visibly change.
- Real course/task data appears in previews.
- Friction language changes by profile.

Not applied:
- Separate device-specific layouts per behavior.
- Continuous adaptation proof beyond capture variants.

## Frontend Craft Reviewer

Score: 8.1/10

Top issues:
- Still somewhat web-card dense.
- Hero typography can feel heavy on long behavior names.
- Small preview metadata is near edge of legibility.
- Palette quality varies by mode.
- Bottom tab bar is credible but visually crowded.

Fixes applied:
- Reduced recommendation card density versus first pass.
- Added simulator-real live preview without obvious truncation failure.

Not applied:
- Full component simplification away from nested cards.

## Monetization Reviewer

Scores:
- Plus worth paying for: 7/10
- Widget Studio feels premium: 8/10
- Value shown before paywall: 8/10

Top issues:
- Plus value is implied, not fully explained.
- Recommendation cards are partially obscured by bottom chrome.
- Structure repeats across variants.
- Live planner data badge may be too subtle as a paywall value anchor.
- Needs clearer outcome proof beyond preview change.

Fixes applied:
- Added visible "Plus adaptive stack" signal in the live preview.
- Showed tailored student segments and outcome-based modes before paywall.

Not applied:
- No new lock state or paywall/IAP behavior changes.
