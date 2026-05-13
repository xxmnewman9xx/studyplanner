# Widget Studio Functionality Audit

Supported native families shown: Small and Medium Home Screen widgets.
Unsupported families marketed: none.

| Control | Expected effect | Before | Result |
| --- | --- | --- | --- |
| Size | Switch live preview between small and medium | Worked visually, forced focus silently | Kept paired behavior; copy now says supported small/medium widgets |
| Shows | Switch Next Due / This Week preview | Worked visually, paired with size | Preferences now only accept supported `nextDue` / `thisWeek` |
| Style | Change preview/native snapshot style | Worked | Preserved |
| Color | Change app palette and widget preview accent | App changed; widget preset mostly overrode palette | Palette now drives widget accent/secondary colors |
| Class color | Color class surfaces and widget item identity | Did not enter widget item model | `courseColor` added to snapshot items and native model |
| Save/apply | Persist preferences | Auto-save existed | Preserved; no fake explicit apply button |

Widget score before: 7.1/10.
Widget score after source fixes and WidgetKit payload checks: 8.8/10.

WidgetKit verification: `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` and `EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` both built, launched, and printed shared widget payloads. Capture payload includes `demoState`; production payload does not.

Remaining widget QA: manually add small/medium Home Screen widgets and capture refresh behavior after adding/editing/completing assignments.
