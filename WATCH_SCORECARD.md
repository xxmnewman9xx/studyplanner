# Watch Scorecard

Baseline: build `1.0.2 (32)` fresh capture and source review.

Verdict: **Not App Store ready as an Apple Watch feature.**

## Scores

| Area | Score | Finding |
|---|---:|---|
| Real watchOS surface | 2.0 | No watchOS target or real Watch app was found. |
| In-app watch-style preview | 5.5 | Source has watch-style settings/copy, but the fresh capture did not expose a real Watch preview. |
| Glanceability | 6.0 | The concept is glanceable, but current hardcoded English and lack of real surface block review use. |
| Consistency | 5.0 | Colors align with the app, but implementation appears to be an in-app concept, not a platform surface. |
| Screenshot readiness | 2.5 | `16-widget-watch-showcase.png` is not a Watch screenshot. |

Final Watch score: **4.2 / 10**.

## Issues

| Severity | Issue | Required fix |
|---|---|---|
| critical | No real Watch target found. | Do not mention Apple Watch in App Store screenshots/App Preview unless a real target exists. |
| critical | Fresh b32 capture could not produce a Watch showcase. | Replace storyboard step with Widgets or Focus. |
| major | Watch preview source has hardcoded English. | Localize before any future Watch marketing. |
| major | "Watch widgets" can be interpreted as a real watchOS feature. | Use "in-app widget setup" language only, or remove. |

## Recommendation

For this submission, omit Watch from the App Store story. Use Focus or Widget Studio as the seventh/eighth preview beat instead.
