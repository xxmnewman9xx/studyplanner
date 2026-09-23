# Scoring swarm record (Apple Intelligence 2.2 plan)

The plan was reviewed by two independent read-only agents: Market/CEO and Engineering (which checked claims against the repo and the iOS 26.5 SDK).

## Round 1: market
| Area | Score |
|---|---|
| Concept | 7 |
| Virality | 5 |
| Utility | 8 |
| Monetization | 6 |
| Differentiation | 6 |
| Compliance | 6 |
| Localization/GTM | 6 |
| F1 | 8 |
| F2 | 8 |
| F3 | 6 |
| F4 | 9 |
| F5 | 8 |
| F6 | 8 |
| F7 | 8 |
| F8 | 8 |
| Minimum inference | 8 |

## Round 1: engineering
| Area | Score |
|---|---|
| Accuracy vs repo | 7 |
| Accuracy vs SDK | 8 |
| Safety boundary | 9 |
| Executability | 7 |
| Tests/eval | 7 |
| Localization | 6 |
| Minimum inference | 8 |
| Risk | 7 |
| Gates | 7 |

## How the findings were resolved (all applied in MASTER_PLAN.md)
| Finding | Resolution |
|---|---|
| A single free class can't show a crunch week | Free tier now imports **all** classes and shows the cross-class Forecast. Only class 1 is applied before purchase. |
| `studyplanner://` links reach no one who hasn't installed | Universal link with a `#fragment` payload, a static page on the workers.dev site, and paste-restore after install. QR codes only for payloads ≤ 1 KB. |
| No attribution or experiment design | `ct` campaign tokens, a Keychain cohort, separate product IDs, a fixed 4-week window. Monthly kept. |
| Overclaims ("8 s", "every iPhone", vague device list, full App Preview) | Exact eligibility line. "43 deadlines, one scan". App Preview uses beats 2–5 only. zh-Hans, hi, and ar get no AI claims. |
| Inference leaks (F1 caption, F7 tagging, explain, ask) | Removed. 2.2 has exactly 4 model calls, with skip rules. |
| 17 vs 10 locales; `ar-SA` vs `ar` | Corrected: 10 in-app locales, 17 in the store. Locale support is checked at runtime with `supportsLocale`. |
| Private helpers, `database()`, `resetData` unused | Export-only edit list. No erase path exists, so purge hooks are specified. |
| `if #available` on types | `@available(iOS 26.0, *)` on types; the actor is stored as `Any?`. |
| No gold labels | Fixture export, hand-labeled gold for 21 fixtures plus ≥ 10 real syllabi, and a heuristic baseline in G1. |
| `routeFromUrl` can't carry a payload | `packFromUrl(rawUrl)` runs before `routeFromUrl` at `App.tsx:6017`. |
| 80-candidate pending cap | The merge caps at 80, prioritized. |
| Weak-link, App Intents target, and cold-launch risks | Exit checks: `otool -l` in G1, `Metadata.appintents` in G7. AI requires `AppState` active. |
| G4 scope incomplete | All access functions and routes are listed, with edge-case tests. |

## Round 2
The owner stopped round 2 before either reviewer returned a re-score. **The post-fix scores are not independently verified.** The implementation swarm's review wave (IMPLEMENTATION_PROMPT.md, wave 4) must re-score the plan and the built product against the same rubric, with a target of **≥ 9 in every row**.
