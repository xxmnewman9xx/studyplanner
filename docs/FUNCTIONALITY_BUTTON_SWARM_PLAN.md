# Functionality Button Swarm Plan

Branch: `v1-5-feature-functionality-button-swarm-completion`
Start commit: `12a560c54436117ef6d021cbf4aa1d23a0402d7c`

## Subagent Swarm

| Agent | Current | Target | Highest-impact finding |
| --- | ---: | ---: | --- |
| Feature Completion Director | 7.2 | 8.8 | Widget setup, onboarding scan gates, completion toggles, reminders/calendar drift |
| Visible Button Auditor | 7.3 | 9.2 | Classes checkmark had no handler; widget controls looked independent but were paired |
| 9-Year-Old Clarity Agent | 6.8 | 9.0 | Import/review labels were too vague and inconsistent |
| Reference UI Director | 8.2 | 9.4 | Dense six-tab/button UI risks reference polish |
| Widget Studio Functionality Agent | 7.1 | 9.2 | Palette/style and native widget support were not clearly aligned |
| Scan and Parser Functionality Agent | 6.4 | 8.8 | Missing typed import and deeper no-date/duplicate/page evidence model |
| Planner Systems Agent | 8.0 | 9.3 | Completion undo and external side-effect drift |
| Contrast and Accessibility Agent | 7.0 | 9.2 | Dark shared cards, disabled opacity, and small touch targets |
| Regression Sentinel | 9.18 | 9.40 | Widget plugin/native Swift mismatch and source-of-truth risks |
| QA Breaker Agent | 7.0 | 9.0 | Theme hydration overwrite, stale invalid import date, repeated automation taps |

Initial weighted score: 7.4/10.

## Implementation Scope

1. Fix visible dead/misleading controls without a redesign.
2. Add real `Type It In` parsing through the existing trusted Found Work flow.
3. Make visible task checkmarks actually mark done or hide when unsupported.
4. Protect reminder/calendar buttons from repeated taps.
5. Make Widget Setup honest about supported small/medium widgets and align plugin/native source.
6. Improve contrast/touch targets in shared controls.
7. Preserve parser, persistence, StoreKit, widget, and capture-mode safety.

## Out of Scope

Native configurable widgets, StoreKit sandbox proof, full persisted review-inbox architecture, OCR/parser rewrite, reminder/calendar reconciliation after every edit, and broad nav redesign.
