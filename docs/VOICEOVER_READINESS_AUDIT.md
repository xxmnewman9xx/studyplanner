# VoiceOver Readiness Audit

Generated: 2026-05-12T21:49:12.925Z

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
| Elements with accessibility hints | 20 |
| Summary surfaces | 3 |
| Missing explicit labels | 0 |
| Missing roles | 0 |
| Missing recommended hints | 18 |

## Readiness Verdict

VoiceOver readiness is **partial**. Core shared controls have strong label and role coverage, but this audit still found controls that need recommended hint review before a final submission claim. Full submission readiness still requires a real VoiceOver traversal recorded in `artifacts/post-goal-aso-submission/external-proof/voiceover-traversal.md`.

## Highest-Risk Files

| File | Missing labels | Missing roles | Missing hints |
| --- | ---: | ---: | ---: |
| src/screens/CoursesScreen.tsx | 0 | 0 | 10 |
| src/screens/AssignmentDetailScreen.tsx | 0 | 0 | 3 |
| src/screens/GradesScreen.tsx | 0 | 0 | 3 |
| src/components/PremiumGate.tsx | 0 | 0 | 1 |
| src/screens/WidgetShowcaseScreen.tsx | 0 | 0 | 1 |

## Missing Explicit Labels: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
| None | - | - |

## Missing Recommended Hints: Sample

| Location | Element | Visible text guess |
| --- | --- | --- |
| src/components/PremiumGate.tsx:35 | AppButton | Unlock with Study Planner Plus These tools open after Plus is active on your store account. |
| src/screens/AssignmentDetailScreen.tsx:129 | TextInput | - |
| src/screens/AssignmentDetailScreen.tsx:206 | TextInput | - |
| src/screens/AssignmentDetailScreen.tsx:240 | TextInput | - |
| src/screens/CoursesScreen.tsx:173 | TextInput | Add Work |
| src/screens/CoursesScreen.tsx:246 | TextInput | - |
| src/screens/CoursesScreen.tsx:254 | TextInput | - |
| src/screens/CoursesScreen.tsx:263 | TextInput | Add Class Class color |
| src/screens/CoursesScreen.tsx:375 | TextInput | Edit Class Class color |
| src/screens/CoursesScreen.tsx:383 | TextInput | Edit Class Class color |
| src/screens/CoursesScreen.tsx:391 | TextInput | Edit Class Class color |
| src/screens/CoursesScreen.tsx:423 | TextInput | Semester Setup |
| src/screens/CoursesScreen.tsx:432 | TextInput | - |
| src/screens/CoursesScreen.tsx:440 | TextInput | - |
| src/screens/GradesScreen.tsx:154 | TextInput | Target-grade calculator Aim for % overall. Remaining work needs about on average. |
| src/screens/GradesScreen.tsx:185 | TextInput | - |
| src/screens/GradesScreen.tsx:267 | TextInput | - |
| src/screens/WidgetShowcaseScreen.tsx:280 | AppButton | Study Planner Plus Plus unlocks syllabus scan, calendar sync, reminders, and grade forecasting. Purchases are handled securely through the App Store, and Restore Purchases is available anytime. |

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
