# Post-Goal Subagent Reviews

Date started: 2026-05-12  
Branch: `v1-3-post-goal-aso-submission-master`  
Starting commit: `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e`  
Mode: Evidence-first, read-only reviews before product-code changes.

## Executive Pattern

The first subagent wave agrees on the same core truth: StudyPlanner now has a real reviewed-assignment spine, but it is not yet a 9.4 submission package. The app must be positioned as a **reviewed due-date planner with useful Home Screen widgets**, not as a broad class-schedule, focus-session, forecast, or perfect syllabus-OCR product.

Highest-overlap problems:

1. Photo/OCR and “Syllabus AI” claims outrun the offline parser unless an endpoint is configured.
2. Today is still too dashboard-dense for stressed middle-school users.
3. Bulk `Looks good shown` acceptance risks parent trust because it can approve visible lower-confidence work after one alert.
4. App Store metadata overclaims class schedules, focus sessions, “never miss,” and long keyword strings.
5. Widget scope is mostly honest in UI but older TS/doc concepts still mention unsupported or preview-only surfaces.
6. StoreKit and native widget proof are still external blockers.
7. Privacy/support disclosures need a real support URL and clearer parser/upload retention language.

## Completed Agents

### Root Concept Destroyer

| Field | Finding |
| --- | --- |
| Score before | 8.76/10 from `docs/COMPLETION_AUDIT_9_2.md` |
| Target | 9.2+ product concept; 9.4 post-goal target after ASO/submission |
| Score if no changes | 7.7/10 for post-goal readiness |
| Root concept verdict | Not submission-ready. Product is split between trusted planner, scan paywall, dashboard analytics, class schedule, and widget showcase. |
| Top root problems | Check Work is gated before value proof; Today is still dashboard-like; Calendar/Week imply schedule control while user cannot edit class meetings; widget model has preview/future concepts beyond native small/medium; onboarding preview assignments can be unconfirmed while widget copy promises visible deadlines; paywall is nested under Widget Setup. |
| Top functionality failures | Endpoint contract drift between docs and multipart code; calendar/reminder sync lacks edit/delete reconciliation; prose matrix is much larger than automated tests. |
| Top ASO failures | Keyword string in `docs/APP_STORE_METADATA.md` exceeds 100 bytes; subtitle/description claim class schedule; description claims focus sessions; screenshot line says “Never miss a class.” |
| Recommended changes | Reposition v1 as reviewed due-date planner with widgets; make onboarding more action-led; show Check Work value before purchase where safe; collapse Today hierarchy; remove schedule/focus/never-miss claims; add metadata lint; prove StoreKit and native widgets. |
| Risk | Medium-high because route/gating/widget/IAP changes touch high-risk systems. |

### Product Truth Agent

| Field | Finding |
| --- | --- |
| Score before | Conditional pass; real spine, diluted release truth |
| Target | 9.4 claim-safe usefulness |
| Root concept verdict | Keep the review-gated planner spine. Change or remove claims/surfaces that are not truly powered by current behavior. |
| Keep | `isAssignmentOpen` and confirmed-only planner/widgets; Check New Work review flow; photo/OCR hidden without endpoint; small/medium native widget truth; paywall fail-closed behavior. |
| Change | Rename grade “forecast” language to grade target/calculator; remove class schedule claims unless meeting editing is added; soften sync/reminder lifecycle copy; update `docs/AI_PARSE_CONTRACT.md` to match multipart upload; reduce Today analytics density. |
| Remove/defer | Focus timer claims until routed; stale widget concepts from release-facing docs; unlabeled hardcoded sample snippet in production empty state; broad legacy UI cleanup. |
| Files/screens | `src/screens/GradesScreen.tsx`, `src/screens/TodayScreen.tsx`, `src/screens/ImportScreen.tsx`, `src/screens/WidgetShowcaseScreen.tsx`, `src/logic/widgetSnapshot.ts`, `docs/APP_STORE_METADATA.md`, `README.md`. |

### 9-Year-Old Clarity Agent

| Field | Finding |
| --- | --- |
| Score before | Mostly understandable; several student-facing strings still sound technical/product-led. |
| Target | Plain school language without childishness. |
| Confusing language | `command center`, `dashboard`, `hub`, `loop`, `snapshot`, `endpoint`, `automation`, `forecast`, `pressure`, `sync`, `overflow count`, `iOS timing`. |
| Replacement language | `school plan`, `Today`, `each class`, `same planner data`, `PDF or text file`, `Reminders before due dates`, `Plan grades by category`, `Widgets update after planner changes`. |
| High-value copy fixes | `Add` -> `Add work`; `Sync` -> `Calendar`; `Photo OCR needs...` -> `Photos are not ready here yet. Upload a PDF or text file instead.`; `Looks good shown` -> `Add shown items after checking`; `No upcoming deadlines` -> `No deadlines yet`. |
| Tests/screenshots | Static copy inspection only; needs screenshots after copy changes for onboarding, Check New Work, Today, Widget Setup, paywall, and captions. |

### Middle School Stress Agent

| Field | Finding |
| --- | --- |
| Score before | 7.4/10 stress clarity |
| Target | 9+ calm next-action hierarchy |
| Root concept verdict | Accurate and trust-forward, but still too dashboard-dense for stressed 9-14 year old users. |
| What works | Review boundary is strong; copy avoids shame; Today has a real next-action hero. |
| Stress risks | Today first viewport includes hero plus metrics/warnings/list/calendar/week graph/widget/class balance; Start only marks in-progress instead of opening work; overdue has count but no rescue; onboarding action chooser appears late; busy week warnings repeat across screens; reminders schedule all confirmed work without preview. |
| Recommendations | Move widgets/graphs/class balance under “Plan ahead”; add “Catch up one thing” card for overdue; make start/open task feel primary; show onboarding paths earlier; make busy-week warning more specific; preview reminder count before permission. |
| Risk | Medium. Today simplification is high value but easy to destabilize screenshots if moved carelessly. |

### Parent Trust Agent

| Field | Finding |
| --- | --- |
| Score before | Conditional pass |
| Target | Parent can trust claims, parser, purchases, and support path |
| Trust risks | AI/import scope mismatch; source visibility lacks receipt-grade proof; privacy/support disclosure gap; paywall needs renewal/cancel/trial clarity near CTA; “Never miss” copy is too absolute. |
| Good evidence | Endpoint rows are forced to `needsReview`; only accepted assignments/courses/grade items are applied; Store-backed purchase/restore/legal links exist. |
| Recommended changes | Add parser/upload retention and support details to privacy/support docs; add paywall microcopy; replace broad scan claims with endpoint-conditional wording; rename `Looks good shown`; create App Review proof packet. |
| Blockers | Sandbox purchase/restore proof; support URL; parser endpoint/vendor clarity if endpoint is enabled. |

## Running Or Queued Agents

| Agent | Status | Notes |
| --- | --- | --- |
| Master Post-Goal Orchestrator | Running | Spawned first wave; slow response, still pending. |
| Parser and Check New Work Agent | Running | Inspecting import/review/paywall/parser flow. |
| Calendar Systems Agent | Running | Inspecting dates, reminders, sync, completion, widgets. |
| Widget Retention Agent | Running | Inspecting TS/Swift/plugin/widget proof. |
| ASO Strategy Agent | Running | Building metadata and ASO recommendations. |
| App Review Submission Agent | Running | Inspecting reviewer handoff, IAP, privacy/support, capture/no-data. |
| Accessibility Agent | Queued | Held by active-thread limit. |
| Localization Implementation Agent | Queued | Held by active-thread limit. |
| Performance Agent | Queued | Held by active-thread limit. |
| Code Health and GitNexus Agent | Queued | GitNexus already ran; dedicated agent pending. |
| QA Breaker Agent | Queued | Pending after implementation shortlist. |
| Regression Sentinel | Queued | Pending before final fixes. |

## Second-Wave Agent Addendum

### Master Post-Goal Orchestrator

Verdict: **NO-SUBMIT**. Highest impact path is proof/claim cleanup, not new features. It identified iPad screenshot obligations while tablet support is enabled, stale Lock Screen widget assets, weak submission verification, and parser semester metadata trust leakage. Implemented from this review: parser semester metadata no longer applies to planner state, and submission verification now fails closed when explicit IAP IDs/support URL are missing.

### Parser and Check New Work Agent

Verdict: conditional fail for 9.4. The trusted-review concept is strong, but no-date/ambiguous/duplicate work needs a future `FoundWorkDraft` model. Implemented from this review: `docs/AI_PARSE_CONTRACT.md` now matches the actual multipart `kind` + `file` request shape and calls out endpoint/photo/OCR limits. Deferred: merge UI, no-date found-work cards, and direct paywall routing.

### Calendar Systems Agent

Verdict: internal planner surfaces conditionally pass; external lifecycle and edge dates fail. Implemented from this review: date-key day counts now use DST-safe UTC-midday math, and assignment course names refresh from the selected class after course moves. Deferred: calendar/reminder update/delete reconciliation, reminder preset honoring, partial course filters, all-day/recurring work, and meeting editing.

### Widget Retention Agent

Verdict: implementation conditional pass, submission evidence no-submit. Native small/medium widgets are real and use App Group snapshots; stale Lock Screen and large widget assets must be excluded. Deferred: fresh Home Screen widget screenshots and refresh-after-completion proof.

### ASO Strategy Agent

Verdict: prior metadata was not App Store-ready. Implemented in docs: 30-character subtitle, 100-byte keywords, safe promo text, conservative description, claim bank, PPO variants, custom product page concepts, localized metadata plan, and Apple Search Ads seeds.

### App Review Submission Agent

Verdict: do not submit yet. Blockers: IAP env/product proof, sandbox purchase/restore, support URL, privacy URL confirmation, signed archive entitlement check, widget freshness proof, and media completeness. These are now reflected in `docs/APP_STORE_SUBMISSION_HANDOFF.md`.

### Final Combined Regression Sentinel

Verdict: no-submit, overall evidence score about 8.2 before final cleanup. It found two additional small trust edges: parser grade items could enter with an accepted course, and reminder/calendar side effects still trusted invalid legacy `dueAt` strings. Implemented after this review: trusted imports now return no parser grade items until a review surface exists, and reminder/calendar services use a shared valid-due-date selector. Final tests pass 32/32.

## Implementation Gate From First Wave

Safe, high-impact, low-churn changes to consider first:

1. Claim/copy safety: import copy, Widget Setup copy, paywall microcopy, App Store metadata, grade/focus/class-schedule claims.
2. Today clarity: move dense analytics lower and add overdue rescue if feasible without touching planner logic.
3. Review flow trust: rename bulk acceptance and make the action imply checking first.
4. Submission proof: add ASO metadata packs, support/privacy blocker notes, screenshot inventory, and IAP proof requirements before any submit recommendation.

Do not touch:

- StoreKit entitlement semantics.
- Native widget families beyond small/medium.
- Parser trust boundary.
- Production capture guard.
