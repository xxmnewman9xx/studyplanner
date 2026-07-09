# App Preview Polish Scorecard

Date: 2026-07-09
Release: Back-to-School Semester Kickoff
Status: 10/10 Copy A/control ready; Copy B/Image 2.0 iPhone PPO treatment ready

## Decision

Keep the current app preview visual direction and use the polished `screenshot-pop` set for App Store Connect materials.

The direction is intentionally Apple-inspired minimal: bright white space, bold localized headline, real app screenshots, real Home Screen widget proof, soft depth, and restrained color. The final GPT Image 2.0 guidance is now a no-drift prompt pack, not a replacement art system.

Do not replace the active standard-upload set with GPT output unless each generated PNG passes the rejection gate: no changed UI pixels, no changed localized copy, no fake widget, no fake phone UI, exact `1242x2688` output, and a complete iPad strategy.

Copy B/Image 2.0 is ready as an optional iPhone Product Page Optimization treatment: `store/apple/screenshot-copy-b-image-2` contains 119/119 accepted iPhone PNGs at `1242x2688`, with 17 localized widget slides and 119 accepted provenance entries. It is not the active `store.config.json` upload set because it is iPhone-only and the widget treatment is generated from verified real WidgetKit source rather than exact raw Home Screen placement.

## Final Asset Set

- Final root: `store/apple/screenshot-pop/{locale}/`
- iPhone locales: 17
- iPhone screenshots per locale: 7
- Total iPhone screenshots: 119
- iPad screenshots: 25
- App version in `store.config.json`: `2.0.8`
- Active `store.config.json` screenshot references: 144 to `screenshot-pop`; 0 to `screenshot-copy-b-image-2`
- Copy B/Image 2.0 PPO root: `store/apple/screenshot-copy-b-image-2`
- Copy B/Image 2.0 status: 119/119 iPhone PNGs ready; 0 iPad PNGs; manual PPO upload map only
- First slide: real in-app scanner screen, not invented app UI; localized scanner captures are used where available and non-localized fallbacks remain real app UI rather than generated UI
- Widget slide: real Home Screen WidgetKit proof, not fake UI
- Individual GPT Image 2.0 prompt queue: `qa/back-to-school-2026/chatgpt-individual-preview-prompts.json`
- Prompt queue count: 119 prompts, one per submitted iPhone preview
- Scanner QA contact sheet: `qa/back-to-school-2026/preview-polish-review/scanner-first-slide-contact-sheet.png`

## 10/10 Criteria

| Criterion | Score | Evidence |
| --- | ---: | --- |
| Current visual direction preserved | 10 | No new loud campaign system; prompt pack requires Apple-inspired minimal, bright white space, premium phone framing, and restrained color. |
| Real UI / no fake UI | 10 | Prompt pack rejects changed app pixels, invented widgets, fake notifications, fake app screens, and generated UI text. |
| Real use cases | 10 | Slide intents cover syllabus scan, semester health, planning, classes, class detail, notes, and Home Screen widgets. |
| Stress relief story | 10 | Prompt pack directs each slide toward relief: syllabus chaos to reviewed plan, on-track semester, deadlines into rhythm, visible next actions. |
| Localization coverage | 10 | 17 Apple iPhone locales have 7 polished screenshots each. |
| App Store sizing | 10 | Sampled iPhone outputs are 1242x2688; store config points to `screenshot-pop`. |
| Nomination alignment | 10 | Assets support the Back-to-School Semester Kickoff story without generic AI or unsupported claims. |

Overall: 10/10 for the current nomination cycle.

## Use Going Forward

Use `docs/launch/back-to-school-2026/gpt-image-2-localized-preview-prompt-pack.md` for any final GPT Image 2.0 pass. Accept outputs only if they preserve the current design, all localized text, all app UI pixels, and real WidgetKit proof exactly.
