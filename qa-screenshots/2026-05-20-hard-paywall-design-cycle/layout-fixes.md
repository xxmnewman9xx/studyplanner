# Layout Fixes

Fixed the highest-risk text and layout issues found in this pass:

- Paywall product title/price rows now have better flex behavior and wrapping.
- Paywall feature/value tiles use readable title/detail hierarchy.
- Paywall legal/trust copy wraps safely.
- App buttons now shrink long labels more aggressively and center fallback text.
- Onboarding no longer jumps from the first slide directly to import; users can see review/widgets value before conversion.
- Onboarding card padding, hero title size, and body line-height were adjusted for iPhone-sized screens.
- Widget Studio hero no longer clips the core value proposition to two lines.
- Widget template cards now have enough vertical space for labels and detail copy.
- Today and Plan removed unnecessary one-line truncation on student-created assignment titles.

Known intentional constraints:
- Native/widget preview text still uses line limits where the real widget surface is physically constrained.
- Simulator automation used dev capture routing for tab review because direct coordinate tapping is not reliable in this runtime.
