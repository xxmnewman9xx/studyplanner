# Duplication Risk Audit

Date: 2026-05-12

## Findings

| Area | Risk | Severity | Fix decision |
| --- | --- | --- | --- |
| Widget surfaces | App preview supports monthly/heavy/course/lock concepts while native WidgetKit supports small next-due and medium this-week only. | High | Clarify release UI copy and defaults. Native configurable widgets are future work. |
| Demo data | Store capture seed, onboarding preview seed, and Swift placeholder each hardcode preview data. | High | Replace native placeholder with neutral empty state now; canonical seed extraction is future work. |
| Week logic | Rolling seven-day Week plan and calendar-month heaviest-week labels can differ. | Medium | Keep for now; document semantics as "next seven days" vs "month density." |
| UI components | `Badge`/`StatusBadge`, `MetricCard`/`MetricPill`, `SectionHeader`/`PremiumHeader`, `AssignmentCard`/`TaskRow` coexist. | Medium | Do not refactor in release pass; migrate later. |
| Navigation | `grades` route exists without dock tab; `FocusScreen` exists without route. | High | Remove misleading claims or add explicit links only if safe. |
| Theme tokens | Static light exports coexist with dynamic palettes; widget styles duplicate palette colors. | Low | Leave stable; future token cleanup. |
| App shell | `App.tsx` owns state, navigation, persistence, widgets, premium gates, and mutations. | Medium | Future `usePlannerState`/router extraction; not a release fix. |
| Native snapshot contract | Swift decodes a subset while TypeScript snapshot has newer surfaces. | Medium | Add future schema check; extra JSON keys are currently ignored safely. |

## Risks Fixed In This Pass

- Native widget placeholder demo leakage.
- Native widget stale due labels.
- Medium widget empty state when future work exists outside this week.
- Misleading Lifetime CTA copy.
- Widget Studio native-support overpromise in release copy.
- Scan and Review Inbox copy that implied unsupported or fake behavior.

## Risks Not Fixed

- Full design-system consolidation.
- `App.tsx` decomposition.
- Native configurable widget intents.
- Grades/Focus first-class navigation redesign.
- Shared preview seed extraction.

These are intentionally deferred because they touch large surfaces late in a release cycle.
