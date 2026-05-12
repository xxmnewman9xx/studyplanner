# VoiceOver Readiness Audit

Generated: 2026-05-12T21:52:05.974Z

## Summary

This source audit scans tracked UI files in `src/components` and `src/screens` for interactive React Native elements. It is not a replacement for a real VoiceOver traversal. It exists to make the manual traversal sharper by identifying controls likely to need explicit labels, roles, or hints.

| Metric | Count |
| --- | ---: |
| UI files scanned | 21 |
| Interactive elements found | 104 |
| AppButton elements | 29 |
| Touchable elements | 50 |
| TextInput elements | 25 |
| Elements with explicit labels | 104 |
| Elements with accessibility roles | 104 |
| Elements with accessibility hints | 39 |
| Summary surfaces | 3 |
| Missing explicit labels | 0 |
| Missing roles | 0 |
| Missing recommended hints | 0 |

## Readiness Verdict

VoiceOver source readiness is **strong** for the scanned controls: this audit found no missing explicit labels, roles, or recommended hints. Full submission readiness still requires a real VoiceOver traversal recorded in `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`.

## Highest-Risk Files

| File | Missing labels | Missing roles | Missing hints |
| --- | ---: | ---: | ---: |
| None | 0 | 0 | 0 |

## Missing Explicit Labels: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
| None | - | - |

## Missing Recommended Hints: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
| None | - | - |

## Manual Traversal Route

1. Today: hero next-due card, Complete/Start actions, Busy Week, Check New Work, Reminders.
2. Check New Work: scan/upload/manual actions, filter chips, edit first item, mark shown items, duplicate state.
3. Assignment Detail: title, date, time, course, priority/type/status chips, save/complete/delete.
4. Calendar and Week Plan: month navigation, day cells, filtered class, week workload bars.
5. Classes: add work, add class, edit class fields, color picker, class detail.
6. Widget Setup: size, focus, style, theme, preview, Plus plans path.
7. Settings and Paywall: restore, support/privacy links, product-load failure, plan selection if StoreKit loads.

## QA Requirements Before Final Claim

- Fix or intentionally accept each high-risk source finding.
- Run this audit again and record the remaining counts.
- Run real VoiceOver traversal on simulator/device.
- Record traversal proof in `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`.
