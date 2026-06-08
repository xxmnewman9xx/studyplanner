# Build 52 Locked Onboarding Audit

Date: 2026-06-08

Scope: fresh install, onboarding, skipped import, locked home, import preview, paywall cancel, deep link, relaunch.

## Flow Audit

| Step | Expected | Actual Before | Actual After | Screenshot | Fix |
| --- | --- | --- | --- | --- | --- |
| Fresh install | Welcome, no app data, no tabs | Welcome was okay, but later locked state felt like dashboard access | Welcome routes only to onboarding | `qa/build52-locked-experience/01-welcome.png` | Kept welcome as import-first entry |
| Name onboarding | Persist and use user name | Some paths could fall back to Student if legacy `name` was Student | `Matt` persists and appears in next step | `qa/build52-locked-experience/03-onboarding-name-filled.png`, `04-student-type.png` | Onboarding now prefers stored `firstName` before legacy `name` |
| Student type / goal | Short, personalized, premium | Mostly good | Personalized and concise | `04-student-type.png`, `05-goal.png` | No structural redesign |
| Final import choice | End at import options / locked home | Present, but skip led to dashboard-like locked screen | Final screen offers upload, paste, camera, skip | `07-final-import-options.png` | Kept scan-oriented choices |
| Skip import | No fake data, no real dashboard | Locked dashboard still felt like app access | Personalized locked home: "Matt, build your semester." | `08-locked-home.png` | Replaced dashboard-like content |
| Locked health | No score or fake dimensions | Displayed ring/zero-style status and app-like feature grid | Locked preview with skeleton dimensions only | `09-locked-health-preview.png` | Removed ring, zero badge, dashboard language |
| Scan/import preview | Preview allowed, no apply | Preview existed | Preview says "Preview only" and CTA unlocks | `10-scan-preview.png`, `13-import-preview.png` | Verified no apply without premium |
| Paywall cancel | User returns locked | Paywall had no visible close | Added top-right close button | `14-paywall.png`, `15-paywall-cancel-locked.png` | `Paywall` now calls `nav.back` |
| Deep links | Protected routes stay locked | Central gate already existed | `studyplanner://today` resolves to locked home/review, not Today | `16-deeplink-today-locked.png` | Static and simulator-verified |
| Relaunch | Pending preview restores; no apply | Pending review restore existed | Relaunch restores review preview while inactive | `17-relaunch-locked-preview.png` | Verified with pending import draft |

## Critical Questions

- Why was "Student" showing instead of collected name? The helper falls back to `Student` when prefs are default. The repair avoids legacy `name: Student` masking a valid `firstName`, and locked home now uses `firstNameFromPrefs(data)`.
- Why was health showing with no semester? The intelligence layer can compute empty/default snapshots, but the locked route should never render real dashboard health. The locked home now renders a separate locked preview.
- Why were dimensions showing with no data? They came from dashboard-style empty state language. The new locked health card shows only Workload, Grades, Preparedness, and Consistency as locked skeleton rows, with no numeric values.
- Why did locked state look like partial access? It used a dashboard card, health ring, feature grid, and app-route labels. The new state is a single premium preview and import funnel.
- Are tabs visible before entitlement? No. `showTabs` remains gated by `entitlementUnlocks(data, entitlementStatus)`.
- Are CTAs clear enough? Yes. Primary: Scan syllabus. Secondary: Paste manually. Monetization: Unlock StudyPlanner / Unlock to apply.

