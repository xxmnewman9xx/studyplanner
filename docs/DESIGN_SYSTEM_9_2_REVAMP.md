# Design System 9.2 Revamp

Direction: Apple-native, bright, clean, friendly, premium, customizable, white-card based, with soft gradients and controlled color. Avoid childish, cyber, generic dashboard, hospital, finance, and unsupported-widget visual claims.

| Area | Current Finding | 9.2 Requirement | Implementation Status | Retest |
| --- | --- | --- | --- | --- |
| Typography | Strong hierarchy on premium screens; legacy forms remain dense. | Use compact Apple-like hierarchy; avoid tiny labels for core actions. | Pending implementation | Screenshots and accessibility pass |
| Spacing | Today and Review are busy; Widget Setup bottom controls can be dock-covered. | Generous but dense-enough spacing; final controls never hidden. | Pending | Simulator screenshots |
| Cards | GlassCard is cohesive but shadows/radius can feel heavy. | Calmer white cards, purposeful hero cards only. | Pending | Contact sheet comparison |
| Buttons | Some icon controls below 44pt. | All touchable controls 44pt minimum or hitSlop. | Pending | Accessibility QA |
| Gradients | Soft washes appear often. | Use one signal-gradient family sparingly. | Pending | Visual audit |
| Icons | Lucide icons are consistent; brand mark/app icon differ. | Unify icon language without over-customizing. | Deferred partial | App icon proof |
| Class colors | Not user-owned. | Distinct, editable, accessible class swatches. | Planned | Class/calendar/widget proof |
| Widgets | Crisp but native/previews blurred conceptually. | Installed small/medium separated from preview ideas. | Planned | Native widget screenshots |
| Paywall | Functional but less premium than app. | Shared premium visual grammar and clearer StoreKit-safe copy. | Planned | Paywall screenshot |
| Empty states | Some are generic or misleading for sparse users. | Action-led, calm, specific to next useful step. | Planned | No-data/sparse tests |

## Screen Visual Scores Before

| Screen | Current Score | Weakness | 9.2 Redesign |
| --- | --- | --- | --- |
| Onboarding | 7.8 | Feature-tour shape. | Value journey with first action. |
| Today | 7.5 | Dashboard before relief. | Next action first. |
| Check New Work | 7.0 | Wordy, weak evidence. | Mail-like review evidence cards. |
| Calendar | 7.4 | Admin-like filters. | Compact chip rail and clearer day detail. |
| Week Plan | 7.6 | Good but graph rhythm can improve. | More action copy and visual rhythm. |
| Classes | 7.2 | Forms and colors underbuilt. | Living class hubs with swatches. |
| Assignment Detail | 6.4 | Legacy form. | Premium detail editor. |
| Widget Setup | 7.4 | Dock overlap and preview/native ambiguity. | Installed widgets first. |
| Paywall | 6.8 | Functional, not premium enough. | StoreKit-safe premium card system. |
