# Widget 9.2 Retention Spec

Native supported scope in this branch: **small** and **medium** iOS Home Screen widgets. Do not show unsupported large or Lock Screen widgets as shipped features.

| Widget | Root Concept | Question Answered | Data Source | Refresh Behavior | Empty State | Visual Design | Customization | Clipping Test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Small | Start Now | What should I care about next? | Confirmed open nextDue + review count | App snapshot write + WidgetKit timeline | No upcoming deadlines / Needs Check count | Crisp compact card | Style/palette only until WidgetKit intents exist | Long title/course proof | Captured on Home Screen; refreshed after completing Lab Report |
| Medium | This Week + Attention | What is due this week and what needs checking? | Confirmed week items, dueTodayCount, reviewQueueCount, heavyWeek | Snapshot reload + render-time labels | Nothing due this week; next later if available | Rows plus compact attention summary | Style/palette only | Footer not dock/bottom clipped | Captured on Home Screen; refreshed after completing Lab Report |
| Widget Setup | Installed widgets, not fake preview gallery | Why should I add widgets? | Real snapshot preview | Shows last updated time | Setup instructions | Apple-native white cards plus widget frames | Style/color controls with honest native scope | Bottom controls visible above dock | Implemented with native screenshot proof |

Refresh evidence: `artifacts/post-goal-aso-submission/widget-refresh-after-completion-snapshot.json` shows `nextDue = reading-reflection`, medium items no longer include `lab-report`, This Week dropped to 4 items, and completed count rose to 4. `artifacts/post-goal-aso-submission/46-widget-refresh-after-completion.png` shows the installed widgets rendering the refreshed snapshot.
