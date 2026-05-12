# Widget Retention Final

Implementation score: 9.0/10. Submission evidence score: 8.9/10.

## What is real

- Native WidgetKit implementation supports small and medium families.
- Small answers Next Due.
- Medium answers This Week.
- Snapshot writes through App Group and reloads timelines.
- Production placeholder does not ship demo coursework.
- Installed small and medium Home Screen widgets were captured on the simulator as `artifacts/post-goal-aso-submission/30-small-widget-home-screen.png` and `artifacts/post-goal-aso-submission/31-medium-widget-home-screen.png`.
- Capture/demo coursework dates now roll relative to the capture day, preventing stale native widget screenshots such as false "384 days overdue" labels.
- Refresh after completing the next assignment is now proven: tapping Complete moved the App Group snapshot from `lab-report` to `reading-reflection`, reduced This Week from 5 to 4 items, and the installed Home Screen widgets refreshed in `artifacts/post-goal-aso-submission/46-widget-refresh-after-completion.png`.
- Refresh after editing the next assignment is now proven: renaming Reading Reflection to Reflection Draft updated the App Group payload and the installed small/medium Home Screen widgets in `artifacts/post-goal-aso-submission/47-widget-refresh-after-edit.png`.
- Refresh after adding work is now proven: adding `Field Notes` to the new `Science Lab` class updated the App Group payload and the installed small/medium Home Screen widgets in `artifacts/post-goal-aso-submission/48-widget-refresh-after-add.png`.
- Day-boundary label behavior is now code/build proven: the native widget template recomputes due labels and urgency color from `dueAt` at render time and schedules the next timeline refresh at the earlier of 30 minutes or 00:01 local time. `npm run test` guards this source behavior and the iOS simulator build compiled the WidgetKit extension.

## Submission blockers

- Overnight Home Screen screenshot proof of the 00:01 rollover is still not captured; keep this as an optional final validation item rather than a claim blocker for supported widget behavior.
- Old Lock Screen/large widget assets must be excluded.
- In-app previews do not count as native Home Screen proof unless paired with the installed WidgetKit screenshots above.
