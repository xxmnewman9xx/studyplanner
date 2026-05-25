# Top 30 Redesign Gaps

Ranked by student value, conversion impact, implementation risk, and backend truth.

| Rank | Gap | Value | Risk |
| ---: | --- | --- | --- |
| 1 | Today quick-add state existed but had no UI. Fixed in this pass. | High | Low |
| 2 | Calendar quick capture and survival-plan state existed but had no UI. Fixed in this pass. | High | Low |
| 3 | Tablet review action opened Calendar instead of Scan. Fixed in this pass. | High | Low |
| 4 | Import review lacked summary and bulk confirm. Fixed in this pass. | High | Low |
| 5 | Onboarding skipped Today, the core daily value. Fixed in this pass. | High | Low |
| 6 | More tools were buried under the long Widget Studio. Fixed in this pass. | High | Low |
| 7 | Parser docs claimed JSON request while client sends FormData. Fixed in docs. | High | Low |
| 8 | `isSyllabusParsingConfigured` always returned true. Fixed to reflect endpoint config. | Medium | Low |
| 9 | No production parser endpoint implementation in repo. | High | Critical |
| 10 | Photo OCR is endpoint-only; local image parser throws. | High | High |
| 11 | Storage lacks schema validation and migration. | High | Critical |
| 12 | Storage write/read failures are mostly invisible to users. | High | High |
| 13 | Entitlement has no server receipt validation. | High | Critical |
| 14 | Widget sync is opportunistic and can be stale until app open. | High | High |
| 15 | Calendar sync lacks reconciliation for edited/deleted assignments. | High | Medium |
| 16 | Manual class meeting creation is missing. | Medium | Medium |
| 17 | Applied imports can reopen as empty recent drafts. | Medium | Medium |
| 18 | Widget readiness overweights four Smart Stack presets for basic use. | Medium | Medium |
| 19 | Focus is premium-gated, so Today's best CTA can become a paywall. | Medium | Medium |
| 20 | Assignment progress is often zero, making bars feel less useful. | Medium | Medium |
| 21 | Demo/capture paths are extensive and must remain release-off. | Medium | High |
| 22 | No API contract tests against a live parser endpoint. | High | High |
| 23 | No account sync or backup/export path. | Medium | High |
| 24 | Paywall value is clear, but pricing depends fully on store product metadata. | Medium | Medium |
| 25 | Review rows do not show original source snippets/page numbers. | Medium | Medium |
| 26 | Widget Studio is strong but dense on small screens. | Medium | Medium |
| 27 | Notes are real but not yet a first-class Today signal. | Medium | Low |
| 28 | Grades are useful but sit outside the daily loop. | Medium | Medium |
| 29 | No screenshot regression harness is wired into CI. | Medium | Medium |
| 30 | `App.tsx` remains a large state orchestrator and should eventually be split. | Medium | High |
