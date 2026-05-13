# Feature Completion Matrix

| Feature | Purpose | Before | Change in this pass | Final status |
| --- | --- | --- | --- | --- |
| Onboarding | Explain Scan -> Check -> Plan -> Focus | Mostly wired, scan path could overpromise | Scan choice hidden unless photo parsing is configured; Type It In path added | Improved |
| Today | Next action and daily plan | Useful, but Start/Done and automation labels drifted | Focus/Done labels, in-progress badge, automation busy states | Improved |
| Scan / Upload | Add syllabus files/photos | Upload worked; photo honest only with endpoint | Upload/Scan/Choose Photo labels clarified | Improved |
| Type It In | Manual pasted syllabus parse | Missing | Added parser-backed text path | Built out |
| Parser Progress | Show active parse | Spinner existed | Kept honest no-fake state | Pass |
| Found Work | Review parsed items | Useful but vague bulk actions and stale invalid date risk | Approve Shown/Edit First disabled when empty; invalid edited date blocks Looks Good | Improved |
| Add to Planner | Apply accepted work only | Trusted flow existed | Preserved accepted-only trust boundary | Pass |
| Assignment Detail | Edit/remove assignment | Wired | No broad rewrite; row toggles now coherent upstream | Pass |
| Calendar | Month/week/day planning | Wired; filter counts drifted | Filter counts match confirmed rendered work | Improved |
| Week Plan | Seven-day plan | Wired | Row checkmark toggles done/not done | Improved |
| Classes | Class hub/manual add | Wired; checkmark dead | Class task checkmark now marks done | Fixed |
| Class Color | Customize classes | Affects class cards/calendar dots | Also included in widget snapshot items/previews | Improved |
| Reminders | Queue smart notifications | Wired; repeat tap risk | Busy/idempotency guard in app UI | Improved |
| Widget Studio | Customize supported widgets | Preview worked; prefs allowed unsupported values | Supported focus values only; plugin/native style parity; palette affects widget accents | Improved |
| Small Widget | Next Due | Native supported | Course color added to snapshot/native item model | Improved |
| Medium Widget | This Week | Native supported | Course color added to rows | Improved |
| Theme Customization | App/widget color | App worked; widget accents were preset-only | Palette now affects widget accent/secondary even with style preset | Improved |
| Settings | Store, widgets, support | Wired | Kept source-safe | Pass |
| Paywall / Restore | Real StoreKit | Source-safe; no sandbox proof | No fake purchase behavior added | Source-safe |
| Production No-demo | App Review safety | Capture flag guarded | Preserved | Pass |

Remaining blockers for a 9.5: StoreKit sandbox proof, manual Home Screen widget placement/refresh proof, persisted review inbox, and full reminder/calendar reconciliation.
