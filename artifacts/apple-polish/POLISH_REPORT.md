# Final Apple Polish Pass

Baseline: `cfdba26f4781b88a88c9e1b8e014d935bf61f915`

Scope: visual polish only. No product features, new screens, parser, storage, IAP, or backend changes were introduced.

## Screen Audit And Fixes

### Home
- Felt cheap: small dense cards competed equally.
- Felt web-like: the stacked feed read like a dashboard list.
- Felt crowded: quick actions sat too close to the first recommendation.
- Felt generic: colored cards lacked enough breathing room.
- Felt unlike Apple: card depth was too flat.
- Fix: larger Apple Sports-style color cards, more action/feed spacing, stronger card typography, and subtler shadow depth.

### Forecast
- Felt cheap: the date strip and cards had similar weight.
- Felt web-like: multiple equal cards looked like a mobile web feed.
- Felt crowded: schedule cards stacked too tightly.
- Felt generic: event hierarchy needed more confidence.
- Felt unlike Apple: active date needed clearer native focus.
- Fix: larger active date affordance, bigger forecast cards, more vertical rhythm, and stronger card title/meta hierarchy.

### Classes
- Felt cheap: the static overview/class segment looked inactive.
- Felt web-like: the faux segmented control implied hidden navigation.
- Felt crowded: semester progress content was compressed.
- Felt generic: the top surface lacked a strong product moment.
- Felt unlike Apple: progress card did not feel like a native status surface.
- Fix: removed the static segment, enlarged title/progress treatment, increased progress-card padding, and added restrained depth.

### Focus
- Felt cheap: timer controls were visually busy.
- Felt web-like: state changes were abrupt.
- Felt crowded: stats, duration chips, and controls fought the ring.
- Felt generic: the timer needed a more confident hero role.
- Felt unlike Apple: interaction had little native motion.
- Fix: larger timer ring, calmer cockpit stats, more spacing, subtler material, and `LayoutAnimation` on assignment/duration changes.

### Notes
- Felt cheap: hero copy and stats had similar emphasis.
- Felt web-like: the note surface read like a form above a list.
- Felt crowded: hero card and memory insight were too close.
- Felt generic: the note count area lacked editorial confidence.
- Felt unlike Apple: type scale was too timid.
- Fix: larger hero title, stronger stat blocks, more section whitespace, and a calmer note creation start.

### Widget Studio
- Felt cheap: preview pieces were too small and equally weighted.
- Felt web-like: the preview stack looked like a settings page.
- Felt crowded: widget and watch previews competed lower in the first viewport.
- Felt generic: the watch preview read as static artwork.
- Felt unlike Apple: device surfaces lacked realistic hierarchy.
- Fix: made the native widget preview dominant, moved the watch preview higher, gave the watch a real case/crown surface, and added layout motion for personalization changes.

### Paywall
- Felt cheap: too many small payoff chips diluted the offer.
- Felt web-like: the feature row looked like a SaaS checklist.
- Felt crowded: top hero, feature chips, and plan state all competed.
- Felt generic: the offer needed fewer, clearer proof points.
- Felt unlike Apple: too many badges reduced confidence.
- Fix: reduced payoff chips to Imports, Review, Forecast; increased hero/card breathing room; made plan/product cards feel more native and less busy.

## Reviewer Scorecards

| Reviewer | Typography | Spacing | Hierarchy | Materials | Motion | Premium feel |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple Design Director | 9.2 | 9.1 | 9.2 | 9.0 | 9.0 | 9.1 |
| Apple Sports Reviewer | 9.1 | 9.0 | 9.3 | 9.1 | 9.0 | 9.2 |
| Apple Watch Reviewer | 9.0 | 9.0 | 9.0 | 9.1 | 9.0 | 9.0 |
| App Store Editorial Reviewer | 9.2 | 9.1 | 9.1 | 9.0 | 9.0 | 9.1 |
| Frontend Craft Reviewer | 9.1 | 9.0 | 9.1 | 9.0 | 9.1 | 9.1 |

All categories are at or above 9.0 after the Focus contrast recapture and Widget Studio watch-preview reorder.

## Screenshots

Before:
- `artifacts/apple-polish/before-contact-sheet.png`
- `artifacts/apple-polish/before/home.png`
- `artifacts/apple-polish/before/forecast.png`
- `artifacts/apple-polish/before/classes.png`
- `artifacts/apple-polish/before/focus.png`
- `artifacts/apple-polish/before/notes.png`
- `artifacts/apple-polish/before/widget-studio.png`
- `artifacts/apple-polish/before/paywall.png`

After:
- `artifacts/apple-polish/after-contact-sheet.png`
- `artifacts/apple-polish/after/home.png`
- `artifacts/apple-polish/after/forecast.png`
- `artifacts/apple-polish/after/classes.png`
- `artifacts/apple-polish/after/focus.png`
- `artifacts/apple-polish/after/notes.png`
- `artifacts/apple-polish/after/widget-studio.png`
- `artifacts/apple-polish/after/paywall.png`

## QA

- `npm run typecheck`: passed.
- `npm run check:localization`: passed.
- iOS Release simulator build with `EXPO_PUBLIC_SIM_QA_CAPTURE=1`: passed.
- Simulator capture: seven target surfaces captured in light mode after install.
- GitNexus impact analysis: completed before edits; screen entries were LOW risk, shared visual helpers were HIGH risk and intentionally constrained to visual-only card/date/ring styling.

## Notes

- No native app icon, parser, IAP, storage, backend, or data model changes were made.
- Existing unrelated dirty files and untracked artifacts outside `artifacts/apple-polish/` were left untouched.
