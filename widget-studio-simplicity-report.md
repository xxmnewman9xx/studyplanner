# Widget Studio Simplicity Report

## Studio shape

Widget Studio now presents a four-step preset editor:

1. Pick widget: Today, Upcoming, Week, Class Progress
2. Pick data: only valid data choices for the selected widget
3. Pick style: saved theme and layout choices
4. Save preset: exact iOS gallery widget name and Home Screen placement instructions

The screen copy is now "Customize your iPhone widgets" and avoids widget-creator language.

## Removed mismatch

- Week and Class Progress are shown only because they are registered as real native WidgetKit widgets.
- Class Progress only exposes `single_class` and disables saving until a class is selected.
- Removed Studio controls that did not feed the canonical saved preset/native snapshot path.
- Removed free/freemium/Plus/subscriber blocker language from Widget Studio.

## Native truth

The preview uses the same canonical preset and snapshot builder as native WidgetKit sync. The saved preset panel shows the same fields WidgetKit receives: widget name, data mode, class filter, theme, layout, and last sync timestamp.
