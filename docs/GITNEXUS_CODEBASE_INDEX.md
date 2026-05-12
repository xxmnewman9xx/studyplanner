# GitNexus Codebase Index

Date: 2026-05-12
Branch: v1-1-widget-command-center
Indexed commit: 83d54f019469da23ac9b0abf5e8029425a69ddad

## GitNexus Result

`npx gitnexus analyze` completed successfully.

| Metric | Value |
| --- | ---: |
| Indexed files | 99 |
| Nodes | 2,055 |
| Edges | 3,945 |
| Clusters | 62 |
| Execution flows | 178 |
| Status | up to date |

Impact tooling was available through the CLI, not MCP tools, in this session. Before code edits, CLI impact checks were run for `widgetSwift`, `addWidgetTargetToProject`, `WidgetShowcaseScreen`, `defaultWidgetPreferences`, `widgetFocusOptions`, `UpgradeScreen`, `ctaLabel`, and `tabs`.

## Architecture Map

| Area | Files | Notes |
| --- | --- | --- |
| App shell and navigation | `App.tsx`, `src/models.ts` | Owns hydration, persistence, capture routing, premium gating, tab routing, mutation handlers, reminders, calendar sync, and widget snapshot writes. |
| Planner model and logic | `src/models.ts`, `src/logic/assignmentModel.ts`, `src/logic/planner.ts`, `src/logic/semesterInsights.ts` | Normalizes assignments, filters archived/complete work, builds Today, Week, Month, and graph plans from real data. |
| Scanner/parser | `src/services/syllabusParser.ts`, `src/services/syllabusLocalParser.ts`, `src/services/pdfText.ts` | Text-based parser is local; OCR/photo parsing requires configured endpoint. Do not loosen claims beyond actual parser capability. |
| Storage | `src/services/storage.ts`, `App.tsx`, `src/themeContext.tsx`, `src/services/widgetPreferences.ts` | Planner, theme, palette, premium entitlement, widget snapshot, and widget preferences are stored separately. |
| Screens | `src/screens/*` | Today, Calendar, Week, Classes, Inbox, Widgets, Onboarding, Upgrade, Detail, Grades, Focus. Grades and Focus are risk areas because they are not first-class navigation surfaces. |
| Premium UI | `src/components/PremiumUI.tsx`, `AppButton`, `Badge`, `MetricCard`, `SectionHeader` | Two component generations coexist. Premium UI is the active direction; old cards remain for Grades/Focus/detail. |
| Widget app contract | `src/logic/widgetSnapshot.ts`, `src/services/widgetSnapshotService.ts`, `src/services/widgetSnapshotNativeBridge.ts` | App writes deterministic JSON snapshot and mirrors it to iOS App Group through native bridge. |
| Native WidgetKit | `plugins/withStudyPlannerWidget.js`, generated iOS target | Config plugin writes Swift bridge/widget files, entitlements, App Group config, and target settings. Release risk lives here. |
| IAP and monetization | `src/services/purchaseConfig.ts`, `src/services/subscriptions.tsx`, `src/screens/UpgradeScreen.tsx`, `scripts/check-iap-config.mjs` | Store-backed only. Monthly/yearly and optional lifetime are env-driven; no fake entitlement path found. |
| Theme and capture | `src/theme.ts`, `src/themeContext.tsx`, `src/config/storeCapture.ts`, `src/data/demoSemester.ts` | Capture mode is exact-flag gated by `EXPO_PUBLIC_STORE_CAPTURE=1`; normal persistence is bypassed in capture. |
| Tests | `tests/*.test.ts` | Strong coverage for model normalization, planner counts, widget snapshots, demo determinism, and widget preferences. Native/plugin edge tests are still thin. |

## Ranked Release Risks

| Rank | Risk | Severity | Decision |
| ---: | --- | --- | --- |
| 1 | Native WidgetKit placeholder/fallback shows fake demo coursework in production widget gallery/first add | Critical | Fix. |
| 2 | Native widget relative due labels can go stale after midnight because Swift renders precomputed labels | Critical | Fix. |
| 3 | Widget extension embedding in app target is not explicit enough in config plugin | Critical | Verified generated Xcode project embeds the `.appex`; no plugin mutation needed. |
| 4 | Widget Studio advertises more native widget surfaces than WidgetKit currently supports | High | Clarify release UI and docs; keep previews honest. |
| 5 | Lifetime CTA says Subscribe when store returns a lifetime product | High | Fix label only; do not change entitlement logic. |
| 6 | Grades and Focus are advertised/implemented but not reachable from primary navigation | High | Avoid adding dock clutter; update claims/docs unless routing is safely obvious. |
| 7 | Scan copy overpromises photo/image-only PDF support without OCR endpoint | High | Clarify scan copy. |
| 8 | Review Inbox reminder chip feels like real scheduling before import | High | Rename/remove pre-import scheduling implication. |
| 9 | Class Hub syllabus chevron looks tappable but is a plain view | High | Remove chevron or make behavior real. |
| 10 | `App.tsx` owns too many responsibilities | Medium | Document for future refactor, avoid release-risk refactor now. |

## Stop/Proceed Decision

Proceed only with leaf-level or plugin fixes that directly remove release blockers. Do not do broad architecture extraction, design-system consolidation, or feature expansion in this pass.
