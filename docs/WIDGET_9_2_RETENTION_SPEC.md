# Widget 9.2 Retention Spec

Native supported scope in this branch: **small** and **medium** iOS Home Screen widgets. Do not show unsupported large or Lock Screen widgets as shipped features.

| Widget | Root Concept | Question Answered | Data Source | Refresh Behavior | Empty State | Visual Design | Customization | Clipping Test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Small | Start Now | What should I care about next? | Confirmed open nextDue + review count | App snapshot write + WidgetKit timeline; render-time due label/urgency; refresh at 30 min or 00:01 local, whichever comes first | No upcoming deadlines / Needs Check count | Crisp compact card | Style/palette only until WidgetKit intents exist | Long title/course proof | Captured on Home Screen; refreshed after completing, editing, and adding work; day-boundary behavior code/build proven |
| Medium | This Week + Attention | What is due this week and what needs checking? | Confirmed week items, dueTodayCount, reviewQueueCount, heavyWeek | Snapshot reload + render-time labels/urgency; refresh at 30 min or 00:01 local, whichever comes first | Nothing due this week; next later if available | Rows plus compact attention summary | Style/palette only | Footer not dock/bottom clipped | Captured on Home Screen; refreshed after completing, editing, and adding work; day-boundary behavior code/build proven |
| Widget Setup | Installed widgets, not fake preview gallery | Why should I add widgets? | Real snapshot preview | Shows last updated time | Setup instructions | Apple-native white cards plus widget frames | Style/color controls with honest native scope | Bottom controls visible above dock | Implemented with native screenshot proof |

Refresh evidence: `artifacts/post-goal-aso-submission/widget-refresh-after-completion-snapshot.json` shows `nextDue = reading-reflection`, medium items no longer include `lab-report`, This Week dropped to 4 items, and completed count rose to 4. `artifacts/post-goal-aso-submission/46-widget-refresh-after-completion.png` shows the installed widgets rendering the refreshed snapshot.

Edit evidence: `artifacts/post-goal-aso-submission/widget-refresh-after-edit-snapshot.json` shows `nextDue.title = Reflection Draft`, and `artifacts/post-goal-aso-submission/47-widget-refresh-after-edit.png` shows the installed widgets rendering the edited title.

Add evidence: `artifacts/post-goal-aso-submission/widget-refresh-after-add-snapshot.json` shows `nextDue.title = Field Notes`, `courseName = Science Lab`, `dueLabel = Tomorrow`, `thisWeek = 1`, and `monthly.dueThisMonth = 1`. `artifacts/post-goal-aso-submission/48-widget-refresh-after-add.png` shows the installed widgets rendering the added assignment.

Day-boundary evidence: `plugins/withStudyPlannerWidget.js` now generates WidgetKit code with `nextWidgetRefreshDate(from:)`, `relativeDueDays`, and `relativeUrgency`, so stale snapshot urgency is not reused after midnight. `tests/widgetPlugin.test.ts` asserts the plugin and generated Swift source include those behaviors. `npm run test` passed 38/38 and `EXPO_PUBLIC_STORE_CAPTURE=0 npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE --no-bundler` built and installed successfully with the WidgetKit extension.
