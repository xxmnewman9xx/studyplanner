# Updated Top Improvements List — Forceful 100x Cycle

## Completed highest-leverage improvements
1. Widget Studio positioned as a flagship, not a hidden More-tab utility.
2. Widget template gallery retained and organized around real student moments.
3. Real planner-backed widget previews retained; no fake widget claims added.
4. Smart Stack schedule retained for Morning Brief, Between Classes, Study Block, and Night Review.
5. Premium theme packs retained as the right Plus moment.
6. Onboarding now includes product preview cards for Scan, Review, and Widgets.
7. Feature organization clarified around the critical user flow.
8. Freemium path clarified: useful free widgets first, Plus only for expansion.
9. Widget Studio now includes a visible customization path and readiness score.
10. Conventional test/lint commands added so release validation is not a missing-script trap.
11. Deep-link routing retained for tab-specific QA and widget tap behavior.
12. App Review-safe messaging retained: no unsupported automation or fake native widget behavior.

## Remaining non-product risks
1. Native simulator rebuild is blocked by MLKit/MLImage arm64 simulator linker behavior.
2. Current screenshot automation can capture real simulator states, but direct current-branch rebuild/install still needs the MLKit simulator issue resolved.
3. True iOS blur/refraction remains limited by the current React Native surface stack.

## Next leverage if another cycle is funded
1. Replace or conditionally isolate MLKit OCR for simulator builds so native simulator QA is deterministic again.
2. Add a small Detox/XCUITest screenshot harness for every tab.
3. Add first-run seeded demo state that can be toggled only in development builds.
4. Add native motion polish where it is truly visible, not decorative.
