# StudyPlanner onboarding, paywall, billing, and metadata audit

Date: 2026-09-01  
Scope: StudyPlanner only; code, local StoreKit, tests, and repository metadata. No App Store Connect mutation, paid build, submission, or release action was performed.

## Executive assessment

StudyPlanner already had a strong three-step onboarding funnel: name, academic priorities, then a concrete import path. It personalizes the paywall, routes every setup path through the same entitlement boundary, previews the result before purchase, and makes students review detected data before saving. The highest-impact opportunity was therefore not a redesign; it was tightening billing truth, paywall hierarchy, and store positioning.

This pass:

- Preserves the concise three-step onboarding and review-before-save trust story.
- Preselects Yearly as the best-value plan and computes its savings from live StoreKit prices.
- Shows the paid first-week offer only on Weekly, only when StoreKit returns the offer, and only when Apple reports the account eligible.
- Uses localized StoreKit prices everywhere on the production paywall.
- Keeps checkout disabled until at least one real localized StoreKit product loads. Fallback identifiers can no longer open a purchase sheet.
- Keeps Restore, Terms, Privacy, and Support in the persistent purchase footer with 44-point targets.
- Removes a duplicated restore summary and duplicated legal row from the scroll body, shortening the path to the purchase decision.
- Mirrors the requested U.S. pricing contract in the local StoreKit configuration: $0.99 first Weekly period, then $6.99/week; $14.99/month; $39.99/year.
- Updates U.S. metadata around the strongest differentiator: turning one syllabus into a reviewed semester plan.

## Competitive research

| Product | Current positioning observed | Strong pattern worth using | StudyPlanner response |
| --- | --- | --- | --- |
| [Structured](https://apps.apple.com/us/app/structured-daily-planner-todo/id1499198946) | A single clear timeline promise, large trust signals, and a broad Apple-platform ecosystem | State one outcome before listing features; make premium value legible | Lead with “turn one syllabus into a reviewed semester plan,” then show the exact artifact unlocked |
| [MyStudyLife](https://apps.apple.com/us/app/my-study-life-school-planner/id910639339) | Academic-specific language, schedule scan, exams, focus, grades, reminders, and widgets | Say “built for students” through concrete school workflows | Keep syllabus import, deadlines, exams, grades, reminders, and widgets visible, but subordinate them to the semester-plan outcome |
| [Power Planner](https://apps.apple.com/us/app/power-planner-homework-more/id1278178608) | High-intent “Homework / Grades / Schedule” subtitle and a concise feature promise | Use discovery terms in subtitle and keep the product story crisp | U.S. subtitle becomes “Syllabus, Homework & Exams”; keyword field avoids repeating indexed title/subtitle words |
| [School Planner, Class Schedule](https://apps.apple.com/us/app/school-planner-class-schedule/id1520179572) | Term setup, schedule, widgets, reminders, and a direct student-planner value proposition | Make first-run setup feel finite and useful | Preserve the three-step funnel and show the selected import route at the paywall |
| [StudyKit](https://apps.apple.com/us/app/studykit-school-planner/id6754863858) | Closest direct competitor: syllabus import, assignments, grades, schedule, review-before-import, “semester in minutes” | Own the syllabus-to-semester wedge and establish trust before automation | Emphasize editable preview, uncertain-item review, and nothing saved before approval rather than generic “AI” claims |

Research conclusion: StudyPlanner should compete on trusted compression—one syllabus becomes a reviewed semester plan—not on a generic list of planner features or an unsupported AI superlative.

## Billing contract and safeguards

Target contract for the U.S. storefront:

| Product | Regular price | Introductory offer | UI rule |
| --- | ---: | --- | --- |
| Weekly | $6.99/week | Eligible customers: $0.99 for the first weekly period, pay-as-you-go | Show only when the live product includes the offer and Apple confirms subscription-group eligibility |
| Monthly | $14.99/month | None | Show the localized regular price |
| Yearly | $39.99/year | None | Preselect as best value; savings are calculated from live Monthly and Yearly numeric prices |

Billing invariants now checked in code and tests:

- All three products remain in one known subscription ID allowlist.
- Active entitlement is checked with `getActiveSubscriptions`.
- A purchase is finished only after an active known subscription is visible.
- Restore checks the current App Store account and remains usable even when products fail to load.
- Paid offer detection requires Weekly, `pay-as-you-go`, a positive price, and exactly one week.
- iOS offer visibility fails closed if eligibility cannot be confirmed.
- Production checkout starts disabled and remains disabled for fallback “Shown by App Store” plans.
- The app does not hardcode U.S. prices in the paywall; StoreKit supplies localized display values.

Apple allows one introductory offer per subscription group and recommends checking eligibility before presenting it. References: [Auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/) and [Set up introductory offers](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/).

## Metadata direction

U.S. metadata now uses:

- Title: `Study Planner AI` (16/30)
- Subtitle: `Syllabus, Homework & Exams` (26/30)
- Keywords: 97/100 characters, with no title/subtitle duplication
- Promotional text: a concrete syllabus-to-semester outcome, not operational privacy-page news
- Description: the differentiator first, review-before-save trust second, features third
- First-party support and privacy URLs
- Review notes with the exact target subscription contract, sandbox route, restore location, OCR behavior, and on-device parsing disclosure

Metadata is ready for a final App Store Connect readback, not blindly assumed live. Local files cannot prove what prices, offers, localization states, screenshots, or review attachments currently exist in App Store Connect.

## Evidence and scorecard

| Area | Score | Evidence | Remaining gate |
| --- | ---: | --- | --- |
| Onboarding UX | 9.3/10 | Three required steps, personalization, three clear build paths, no skip ambiguity, every route reaches the paywall within four taps, review-before-save promise | Device walkthrough with VoiceOver and largest Dynamic Type |
| Paywall UX | 9.2/10 | Personalized outcome preview, annual best-value default, live savings, eligible paid offer, persistent legal/restore utilities, duplicate sections removed, 44-point footer targets | Visual QA on small iPhone, large iPhone, and iPad with live products |
| Billing implementation | 9.2/10 | Localized-product purchase gate, allowlisted entitlements, post-validation finish, restore, paid-offer mode/price/period checks, fail-closed eligibility, contract tests | Live ASC readback and sandbox purchase/renew/expire/restore/cancel matrix |
| U.S. metadata package | 9.2/10 | Field limits validated; strong high-intent subtitle and nonduplicative keywords; description/review notes match shipped behavior | Confirm live metadata and screenshots in ASC; human screenshot review |
| Release readiness | 8.7/10 | Static and repository QA passes | Cannot reach 9+ until live ASC and native sandbox/device checks pass |

Code/package quality is 9.2/10 based on repository evidence. The subsequent release-lock pass aligned the retry source and native bundle settings to iOS 2.1.0 (82). Overall release readiness remains below 9/10 because a local repository cannot verify live App Store Connect state, complete the native subscription lifecycle, or provide immutable Build 82 artifact provenance. Historical Build 80 media evidence remains separate and must not be represented as Build 82 provenance. Submission should remain blocked until the gates below pass.

## Required pre-submission gates

1. In App Store Connect, confirm Weekly, Monthly, and Yearly are in the same subscription group and cleared for sale in every intended territory.
2. Confirm U.S. prices are exactly $6.99/week, $14.99/month, and $39.99/year.
3. Confirm the paid pay-as-you-go introductory offer is on Weekly only: $0.99 for one weekly period; no introductory offer on Monthly or Yearly.
4. On a native iOS sandbox build, test eligible Weekly purchase, ineligible Weekly display, Monthly purchase, Yearly purchase, cancel, expire, upgrade/downgrade behavior, interrupted purchase, pending purchase, restore, offline store failure, and relaunch entitlement recovery.
5. Walk onboarding and paywall on the smallest supported iPhone, a large iPhone, and iPad using largest Dynamic Type and VoiceOver.
6. Read back every live U.S. metadata field and visually review final screenshots. Do not submit if any claim or price differs from the app or App Store product record.
