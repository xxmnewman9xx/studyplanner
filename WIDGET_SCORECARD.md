# Widget Scorecard

Baseline: build `1.0.2 (32)` fresh capture plus WidgetKit source/config review.

## Scores

| Surface | Score | Verdict | Evidence |
|---|---:|---|---|
| Home Screen widgets | 8.2 | Promising but not final-localized. | Widget source and in-app Widget Studio; `systemSmall`/`systemMedium` configured. |
| Lock Screen widgets | 4.8 | Do not claim. | No accessory families configured in `app.json` or Swift widget declarations. |
| Watch widgets | 3.2 | Do not claim. | No watchOS target found; only in-app watch-style settings/source references. |
| Widget Studio | 7.4 | Useful and visually strong, but localization blocked. | `15-widget-studio.png`, `16-widget-watch-showcase.png`. |
| Widget gallery metadata | 6.5 | Functional but English-only. | `app.json` display names/descriptions. |
| Apple Sports influence | 8.0 | Good glanceable color/stat style. | Home and Forecast cards use strong, sports-like hierarchy. |

## Issues

| Severity | Issue | Required fix |
|---|---|---|
| critical | Lock Screen widget claims are unsupported by configured families. | Remove claims or add/test accessory widget families. |
| critical | Watch widget claims are unsupported by target structure. | Remove Watch from App Store screenshots/App Preview unless a real watchOS target exists. |
| critical | Widget Studio uses hardcoded English in current b32 UI. | Localize all labels, sections, and control text. |
| major | `16-widget-watch-showcase.png` is not a Watch showcase. | Rename/use as Widget Studio color/widget setup evidence only. |
| major | WidgetKit display names/descriptions are English-only. | Localize or keep screenshots to English until metadata is ready. |
| minor | Widget Studio first screen says "Customize" rather than "Widget Studio". | Match App Store caption to the real UI wording. |

## Store Screenshot Guidance

Use after localization:

- `15-widget-studio.png` for customization.
- A real WidgetKit gallery/Home Screen screenshot only if captured from SpringBoard or WidgetKit gallery.

Do not use:

- Any Lock Screen widget screenshot or claim.
- Any Watch widget/Watch showcase claim.
