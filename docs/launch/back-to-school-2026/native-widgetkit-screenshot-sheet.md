# Back-to-School 2026 Native WidgetKit Screenshot Sheet

Generated: 2026-07-09T09:32:53.334Z
Release: Back to School with AI
Widget states captured: 5/8

This sheet is reserved for real WidgetKit placements. It must not be filled with in-app previews, Expo Go surfaces, or composited Home Screen artwork.

## Widget States

| Widget State | Appearance | Capture ID | Status | File | Required proof |
| --- | --- | --- | --- | --- | --- |
| Empty semester | Light | widget-01-empty-small | captured | [qa-screenshots/back-to-school-2026-native/widget-01-empty-small.png](qa-screenshots/back-to-school-2026-native/widget-01-empty-small.png) | Empty setup widget uses the quiet default system and zero-load calendar state. |
| Calm semester | Light | widget-02-normal-medium | captured | [qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png](qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png) | Normal widgets inherit the quiet default system. |
| Exam-heavy semester | Light | widget-03-exam-heavy-medium | captured | [qa-screenshots/back-to-school-2026-native/widget-03-exam-heavy-medium.png](qa-screenshots/back-to-school-2026-native/widget-03-exam-heavy-medium.png) | Calendar shows busy days, exam markers, and orange urgency. |
| Overdue semester | Light | widget-04-overdue-small | captured | [qa-screenshots/back-to-school-2026-native/widget-04-overdue-small.png](qa-screenshots/back-to-school-2026-native/widget-04-overdue-small.png) | Today/Upcoming use red urgency, not the theme accent. |
| Normal semester | Dark | widget-05-dark-medium | captured | [qa-screenshots/back-to-school-2026-native/widget-05-dark-medium.png](qa-screenshots/back-to-school-2026-native/widget-05-dark-medium.png) | Text, glass, and calendar cells remain readable. |
| Normal semester | Tinted/accented | widget-06-tinted-medium | missing | Missing | Widget respects iOS accented/tinted rendering mode. |
| Locked preview | Lock Screen rectangular | widget-07-lock-rectangular | missing | Missing | Accessory widget copy is concise and truthful. |
| Locked preview | Lock Screen circular | widget-08-lock-circular | missing | Missing | Circular accessory avoids clipped text. |

## Required Coverage

- Empty, normal, exam-heavy, overdue, dark, and tinted/accented Home Screen states.
- Lock Screen rectangular and circular states.
- Real WidgetKit rendering, including iOS accented/tinted behavior.
