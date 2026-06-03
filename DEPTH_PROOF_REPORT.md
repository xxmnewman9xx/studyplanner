# Depth Proof Report

## Proof audit

Baseline screenshots audited:

- `qa-screenshots/student-life-depth/40-depth-day1-home.png`
- `qa-screenshots/student-life-depth/41-depth-day30-home.png`

Blunt read:

- Visibly changed: Day 30 had one extra sentence about World History averaging 29 minutes.
- Useful: the app was starting to use local focus history.
- Still fake/hollow: the top recommendation stayed `Do Essay Draft next.` on both days, so the memory did not feel like it changed the decision.
- Generic copy: `What I learned`, `30-day value`, and `recommendations now use your repeated patterns` felt like product marketing instead of student memory.
- More obvious: the app needed to show the learned pattern, changed recommendation, next action, and reason in the same first card.
- Should be hidden: abstract retention value copy should not be the first proof of intelligence. It belongs in tests/reporting, not the main Home card.

## What changed

Home now exposes four concrete proof points:

- Learned pattern: Day 1 says `No study pattern yet`; Day 30 says `World History averages 29 min.`
- Changed recommendation: Day 1 says `Start with the due-now task`; Day 30 says `Use a 29-min first block.`
- Next action: `Next: Essay Draft.`
- Reason: Day 1 uses deadline/priority; Day 30 uses the learned class average.

Forecast now shows stored local forecast memory directly:

- Example: `0 heavy days; 5 open items. 10 local forecasts stored.`
- Recommendation remains concrete: `Move one block earlier for World History.`

Widget Studio now proves memory affects the recommended surface:

- Example: `Storm Watch`
- Memory shown: `3 saved widgets; last pick was Storm Watch.`
- Recommendation shown: `Use Storm Watch for this week.`

Watch preview copy was shortened so the learned wrist signal is not truncated:

- Example: `History early start.`
- Adaptation copy: `37 wrist signals; 8 became focus starts.`

## Tests added

Added `scripts/check-student-life-depth.ts` and `npm run test:student-life-depth`.

Coverage:

- Day 1 returns generic starter guidance.
- Day 30 returns learned-pattern guidance.
- Changing focus memory changes the ranked Home recommendation.
- Widget recommendation changes from `focus` to `class_focus` when memory changes.
- `globalThis.fetch` is patched to throw during the test, proving the depth engine does not use API/network calls.

## Screenshots

Final simulator proof:

- `qa-screenshots/student-life-depth-proof/40-depth-day1-home.png`
- `qa-screenshots/student-life-depth-proof/41-depth-day30-home.png`
- `qa-screenshots/student-life-depth-proof/42-depth-day30-forecast.png`
- `qa-screenshots/student-life-depth-proof/43-depth-day30-widget-studio.png`

## QA

Passed:

- `npm run typecheck`
- `npm run test:student-life-depth`
- `npm run test:planner`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- iOS simulator capture for Day 1 Home, Day 30 Home, Day 30 Forecast, Day 30 Widget Studio

GitNexus:

- `TodayScreen`, `PlanScreen`, and `MoreScreen` impact checks were LOW.
- New internal `studentLifeDepth` helpers were not visible to the current index.
- `npx gitnexus detect-changes -r studyplanner --scope unstaged` reports CRITICAL because the broader depth implementation touches core app flow files from the prior pass.

## Remaining weaknesses

- The Home proof is now clear, but only the top proof card compounds visibly above the fold.
- Forecast memory is useful, but it still needs better distinction between deadline risk and true heavy-day risk.
- Widget Studio proves recommendation memory, but the actual preview carousel is still mostly static.
- Watch adaptation is visible, but the Watch adaptation card sits low enough that the tab bar partially covers it in this capture.
