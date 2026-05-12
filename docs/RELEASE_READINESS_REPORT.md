# Release Readiness Report

Date: 2026-05-12
Branch: v1-1-widget-command-center
Artifact folder: `artifacts/overnight-steroids-release-pass`

## Executive Verdict

Release-candidate local QA is green after the highest-impact fixes. Do not submit yet until App Store Connect lifetime setup, IAP sandbox purchase/restore testing, and final TestFlight/Home Screen widget placement are completed.

## Index And Audit

`npx gitnexus analyze` succeeded before edits:

| Metric | Value |
| --- | ---: |
| Files indexed | 99 |
| Nodes | 2,055 |
| Edges | 3,945 |
| Clusters | 62 |
| Execution flows | 178 |

Highest-risk areas identified: native WidgetKit placeholder, widget date freshness, Widget Studio/native feature drift, Lifetime copy/entitlement labeling, scanner copy overclaim, fake-feeling Review Inbox actions, unreachable Grade Forecast, and App Store screenshot cleanliness.

## Critical And High Fixes

| Area | Result |
| --- | --- |
| Native WidgetKit placeholder | Fixed neutral production placeholder; no demo coursework. |
| Native widget due labels | Fixed render-time date labels in Swift. |
| Medium widget empty state | Fixed clear-week vs no-data message. |
| Widget Studio honesty | Fixed release copy and native-supported default. |
| Lifetime plan | Added safe store-backed Lifetime UI/active-state support without fake entitlement. |
| Scan/import clarity | Fixed copy to distinguish text-based import from OCR endpoint requirement. |
| Review Inbox | Removed fake pre-import reminder action. |
| Class Hub | Added reachable Grade Forecast action. |
| App Preview assets | Recaptured clean screenshots and contact sheet without dev overlay. |

## Commands

| Command | Result |
| --- | --- |
| `git status` | Ran before/after; unrelated untracked files remain outside staged release pass. |
| `git fetch origin v1-1-widget-command-center` | Pass |
| `git pull --ff-only origin v1-1-widget-command-center` | Pass, already up to date |
| `npx gitnexus analyze` | Pass |
| `npx gitnexus detect-changes` | Critical risk reported because app shell, widget plugin, IAP, and import surfaces changed; mitigated by targeted tests/simulator QA |
| `npm run typecheck` | Pass |
| `npm run test` | Pass, 18/18 |
| `npm run check:iap` | Pass |
| `npx expo install --check` | Pass |
| `npx expo run:ios --device 6CBE6A7A-1778-406F-9F5B-3FDAA45310CE` | Pass, build succeeded |
| `EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` | Pass |

## QA Verdicts

| Mode | Verdict | Notes |
| --- | --- | --- |
| Production mode | Pass local no-demo-leak checks | Native placeholder is neutral; capture seed remains exact-flag gated. |
| Capture mode | Pass | App screenshots and contact sheet are clean; deterministic demo data remains capture-only. |
| Widget QA | Pass local WidgetKit verification | App Group snapshot writes and native widget screenshots captured. |
| IAP safety | Pass code-level checks | Lifetime remains store-backed and requires App Store Connect setup. |
| App Review safety | Pass with setup blockers | No fake purchase, no fake lifetime grant, no demo production widget placeholder. |

## Remaining Release Blockers

- Create and approve `com.mattnewman.studyplanner.plus.lifetime` in App Store Connect before enabling Lifetime in production metadata.
- Run sandbox purchase and restore for monthly, yearly, and lifetime product IDs.
- Install final TestFlight/App Store build and manually place small/medium widgets on the Home Screen.
- Confirm privacy/support URLs and App Store review notes in App Store Connect.
- Optional: final human copy review of App Preview screenshots.
