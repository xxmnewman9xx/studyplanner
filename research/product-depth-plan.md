# StudyPlanner product-depth pass

Base: `10a2a3a` / `apple-school-ai-os-max-leverage-cycle`.

Implemented highest-leverage depth without redoing the prior dashboard pass:
- reusable native Liquid Glass primitives for surfaces, badges, rails, and CTAs
- real persisted `StudyNote` model linked to courses
- Notes tab with create/edit/delete/pin flows and real empty states
- Today dashboard note previews wired to real note state
- Class detail linked-note previews and Notes entry point
- scanner review confidence panel, confidence badges, trust rail, and editable warnings
- 7-day workload/schedule density map on Today
- Widget Studio data-connection panel for agenda/classes/notes readiness
- deterministic simulator QA script using app document capture-file routing

Guardrails:
- no parser/IAP/bundle/compliance changes
- no fake OCR or fake production claims
- demo notes are clearly demo state and only populated by demo/capture mode
