# Back-to-School 2026 Native Disk Cleanup Runbook

Generated: 2026-07-12T03:33:37.134Z
Release: Back to School with AI
Safe cleanup applied: no
Native capture threshold: 15.00 GiB
Current free disk: 0.93 GiB
Gap to close: 14.07 GiB

This runbook is intentionally non-destructive for user and system folders. The script only deletes scoped generated project caches when `--apply-safe` is used.

## Auto-Safe Project Cleanup

| Candidate | Exists | Size | Applied | Reason |
| --- | --- | --- | --- | --- |
| back-to-school-derived-data | no | 0.00 GiB | no | Generated only by the Back-to-School native capture command and safe to remove between attempts. |
| .expo-web-cache | yes | 0.00 GiB | no | Expo web cache; safe to regenerate. |
| node-modules-cache | no | 0.00 GiB | no | Package/tool cache under node_modules; safe to regenerate. |

## Manual Review Candidates

| Candidate | Size | Path | Reason |
| --- | --- | --- | --- |
| .gitnexus-index | 0.29 GiB | `.gitnexus` | GitNexus index can be regenerated, but removing it slows code intelligence. |

## External Review Plan

| Order | Candidate | Size | Cumulative | Closes gap | Path | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | core-simulator-devices | 4.25 GiB | 4.25 GiB | no | `/Users/mattnewman/Library/Developer/CoreSimulator/Devices` | Installed simulator device data outside the repo. |
| 2 | home-cache | 0.88 GiB | 5.13 GiB | no | `/Users/mattnewman/Library/Caches` | User cache directory outside the repo. |
| 3 | downloads | 0.69 GiB | 5.82 GiB | no | `/Users/mattnewman/Downloads` | User downloads outside the repo. |
| 4 | xcode-derived-data | 0.20 GiB | 6.02 GiB | no | `/Users/mattnewman/Library/Developer/Xcode/DerivedData` | Xcode build cache outside the repo. |
| 5 | xcode-archives | 0.12 GiB | 6.14 GiB | no | `/Users/mattnewman/Library/Developer/Xcode/Archives` | Xcode archives outside the repo. |
| 6 | npm-cache | 0.06 GiB | 6.20 GiB | no | `/Users/mattnewman/.npm` | npm cache outside the repo. |

## Commands

- Audit only: `npm run check:back-to-school-native-disk`
- Apply scoped project-cache cleanup only: `npm run clean:back-to-school-native-disk`
- Re-check native preflight after cleanup: `npm run check:back-to-school-native-preflight`
- Capture native screenshots after preflight: `npm run capture:back-to-school-native`

## Guardrails

- Do not delete real WidgetKit, App Store, or launch evidence without copying it into the release packet first.
- The script does not remove external candidates automatically.
- Review simulator devices, downloads, caches, and Xcode folders in Finder/Xcode before deleting anything outside the repo.
- If local cleanup cannot close the gap, use the guarded EAS simulator remote-capture path instead.
