# Widget 9.2 Retention Spec

Native supported scope in this branch: **small** and **medium** iOS Home Screen widgets. Do not show unsupported large or Lock Screen widgets as shipped features.

| Widget | Root Concept | Question Answered | Data Source | Refresh Behavior | Empty State | Visual Design | Customization | Clipping Test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Small | Start Now | What should I care about next? | Confirmed open nextDue + review count | App snapshot write + WidgetKit timeline | No upcoming deadlines / Needs Check count | Crisp compact card | Style/palette only until WidgetKit intents exist | Long title/course proof | Captured on Home Screen; refresh-after-completion still pending |
| Medium | This Week + Attention | What is due this week and what needs checking? | Confirmed week items, dueTodayCount, reviewQueueCount, heavyWeek | Snapshot reload + render-time labels | Nothing due this week; next later if available | Rows plus compact attention summary | Style/palette only | Footer not dock/bottom clipped | Captured on Home Screen; refresh-after-completion still pending |
| Widget Setup | Installed widgets, not fake preview gallery | Why should I add widgets? | Real snapshot preview | Shows last updated time | Setup instructions | Apple-native white cards plus widget frames | Style/color controls with honest native scope | Bottom controls visible above dock | Implemented with native screenshot proof |
