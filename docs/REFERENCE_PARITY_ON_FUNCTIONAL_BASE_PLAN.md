# Reference Parity On Functional Base Plan

Branch: `v1-6-reference-parity-on-functional-base`
Base: `v1-5-feature-functionality-button-swarm-completion`
Start commit: `486b4a9308030c789e47a33d50e297a405322b65`

## Compact Agent Findings

| Agent | Current | Target | Highest-impact finding |
| --- | ---: | ---: | --- |
| Reference Parity Director | 6.2 | 9.0 | Reference parity needs brighter violet/blue app surfaces, stronger Scan/Found/Plan/Focus/Review story, and better widget studio/product captures. |
| Product Loop Clarity Agent | 6.5 | 9.2 | Scan is still not the primary entry; labels and states should read Scan -> Parse -> Plan -> Focus -> Review. |
| Found Work Persistence Agent | 7.4 | 9.4 | Parsed found work is local draft state and can be lost before Add to Planner. |
| Reminder/Calendar Reconciliation Agent | 6.8 | 8.8 | App-created reminder/calendar IDs are create-only and not reconciled after edit/archive/done. |
| Widget Studio Design Agent | 6.4 | 9.1 | Widget Studio works, but visual controls are plain and do not feel like the reference style-card system. |
| Contrast and Theme Agent | 8.0 | 9.3 | Widget accent/course colors can fail contrast; default tokens drift away from violet/blue reference. |
| Regression Sentinel | 8.8 | 9.5 | v1-5 fixes are intact, but Found Work persistence and proof remain the main release confidence gaps. |

## Scope

1. Preserve all v1-5 button and action fixes.
2. Rename visible product entry points around Scan, not generic Check Work.
3. Persist Found Work draft data in planner storage until the user accepts, ignores, or clears it.
4. Promote only accepted found work into confirmed planner assignments.
5. Clear app-owned reminder/calendar IDs after edit/archive/done and attempt safe cleanup for stale reminders/events.
6. Shift default/capture styling toward the violet/blue reference without palette churn.
7. Make Widget Studio a flagship customization screen with visual style cards and supported small/medium copy.
8. Add shared contrast helpers for widget accents, widget due text, and course glyph text.
9. Capture raw iPhone/iPad proof screenshots from the final branch.

## Out Of Scope

- StoreKit rewrite or sandbox purchase proof.
- Native configurable WidgetKit intents.
- Unsupported large or lock-screen widget marketing.
- ASO, app preview videos, poster/contact-sheet generation, or unrelated docs.
- Parser internals beyond preserving trusted parsed output.

## Expected Final Score

Target: at least `9.2/10`.

Final self-score after implementation, tests, WidgetKit verification, and proof screenshots: `9.2/10`.

Score remains capped below final submission confidence until external StoreKit sandbox proof and manual installed-widget refresh proof are captured.

## Implemented Outcome

1. Preserved the v1-5 button/action fixes while shifting visible product language to Scan -> Parse -> Plan -> Focus -> Review.
2. Persisted Found Work as planner data so reviewable parsed work survives reloads until accepted or removed.
3. Kept accepted Found Work as the only path into confirmed planner assignments and widget snapshots.
4. Added safe reminder/calendar cleanup when edits, archives, or completion changes invalidate app-owned side-effect IDs.
5. Reworked default/capture styling toward Violet Glow and tightened contrast for widget accents, due labels, and course glyphs.
6. Rebuilt Widget Studio controls into visual style cards with honest Small Next Due and Medium This Week preview language.
7. Captured all requested raw iPhone and iPad screenshots in `artifacts/reference-parity-on-functional-base`.
