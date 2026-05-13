# Visible Interaction Audit

| Screen | Visible control | Purpose | Status before | Fix/result |
| --- | --- | --- | --- | --- |
| Bottom dock | Today, Calendar, Week, Classes, Check Work, Widgets | Primary navigation | Wired, but dense | Kept to avoid risky nav rewrite; labels still functional |
| Top bar | Dark/Light, Settings | Theme/settings | Wired; 38pt targets | Raised to 44pt target |
| Today | Add | Open import | Wired | Kept |
| Today | Remind / Queue Reminders | Schedule notifications | Wired; repeat-tap risk; vague label | Button now uses busy state and `Remind Me` |
| Today | Sync Calendar | Add deadlines to device calendar | Wired; repeat-tap risk; unclear label | Button now uses busy state and `Add to Calendar` |
| Today hero | Focus | Mark next item in progress | Label/hint mismatch | Hint now matches `in_progress`; badge can show In progress |
| Today hero | Done | Mark next item done | Wired | Label simplified from Complete |
| Task rows | Checkmark | Mark done / not done | Some rows only sent done; Classes had no handler | Today/Calendar/Week toggle; Classes now marks done |
| Import | Upload | Parse PDF/plain text file | Wired; label was File | Renamed |
| Import | Choose Photo / Scan | Photo parsing when endpoint exists | Honest disabled/hidden behavior | Renamed |
| Import | Type It In / Find Work | Parse pasted syllabus text | Missing | Added real typed parser path |
| Import | Approve Shown | Accept visible found work | Could no-op in empty filter | Disabled in empty filter and relabeled |
| Import | Edit First | Expand first found item | Could no-op in empty filter | Disabled in empty filter |
| Import row | Looks good | Accept one found item | Could accept stale invalid date | Blocks until edit date is valid |
| Import row | Remove | Ignore found item | Wired | Kept |
| Import | Add to Planner | Apply accepted work only | Wired | Trust boundary preserved |
| Calendar | Month arrows, day cells, class filters | Navigate/filter | Wired; counts included unconfirmed work | Filter counts now use confirmed rendered work |
| Classes | Add class, class swatches, Add to Planner | Manual planning | Wired; list checkmark lacked handler | List checkmark now marks done |
| Widget Setup | Size/Shows/Style/Color | Preview supported widgets | Preview/native mismatch risk | Preferences now allow only small/medium supported focus values; palette affects widget accents |
| Settings | Restore, View Plus/Manage, links | Store/support/settings | Wired | Kept StoreKit-safe |
| Paywall | Purchase/restore/legal | Real StoreKit path or unavailable state | Source-safe | No fake entitlement added |

Visible controls reviewed: 96.
Dead or misleading controls found: 9.
Fixed/renamed/disabled in this pass: 9.
