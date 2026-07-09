# App Preview Polish Scorecard

Date: 2026-07-07
Release: Back-to-School Semester Kickoff
Status: 10/10 Copy A/control ready; Copy B/PPO prompt cycle sharpened for first-three outcome testing

## Decision

Keep the current app preview visual direction and use the polished `screenshot-pop` set for App Store Connect materials.

The direction is intentionally Apple-inspired minimal: bright white space, bold localized headline, real app screenshots, real Home Screen widget proof, soft depth, and restrained color. The final GPT Image 2.0 guidance is now a no-drift prompt pack, not a replacement art system.

Do not replace the submitted preview set with GPT output unless each generated PNG passes the rejection gate: no changed UI pixels, no changed localized copy, no fake widget, no fake phone UI, and exact `1242x2688` output.

## 2026-07-08 Reference Research Update

Apple's product-page guidance makes slides 1-3 the highest-leverage screenshot real estate: when no app preview is available, the first one to three screenshots may appear in search results and should show the app's essence. Apple's Product Page Optimization guidance also supports testing alternate screenshot treatments against the original product page.

Copy B is now framed for that search/PPO path:

1. Slide 1 shows the outcome of starting from syllabus material or notes: a reviewed plan, not a scanner feature tour.
2. Slide 2 shows control before save: the student approves what reaches the plan.
3. Slide 3 shows the payoff: the semester is organized and ready to use.

Reference direction from the four 2026-07-08 user-provided comps is limited to composition: bold black top headline, short gray subhead, small StudyPlanner brand mark, large latest-build phone UI, white App Store canvas, and restrained color accents. Final Copy B still requires real StudyPlanner UI references, the real logo, one-at-a-time ChatGPT Mac app / GPT Image 2.0 generation, exact `1242x2688`, and human QA acceptance.

Sources:

- Apple Product Page guidance: https://developer.apple.com/app-store/product-page/
- Apple Product Page Optimization guidance: https://developer.apple.com/app-store/product-page-optimization/
- Apple Featuring guidance: https://developer.apple.com/app-store/getting-featured/

## Final Asset Set

- Final root: `store/apple/screenshot-pop/{locale}/`
- iPhone locales: 17
- iPhone screenshots per locale: 7
- Total iPhone screenshots: 119
- iPad screenshots: 25
- App version in `store.config.json`: `2.0.8`
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
