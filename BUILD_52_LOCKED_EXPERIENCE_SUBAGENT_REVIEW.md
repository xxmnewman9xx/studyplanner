# Build 52 Locked Experience Subagent Review

Subagent-style review, scored 1-10.

| Reviewer | Before | After Target | After | Top Issues | Required Fixes |
| --- | ---: | ---: | ---: | --- | --- |
| Conversion Strategist | 6.8 | 9.3 | 9.4 | Locked state looked like low-value dashboard | Import-first hero, pending preview summary, unlock CTA |
| Trust Reviewer | 5.9 | 9.5 | 9.6 | Fake-looking score/dimensions risked trust | Removed score/ring/numeric dimensions before semester |
| Apple Design Reviewer | 7.0 | 9.2 | 9.3 | Paywall lacked close affordance; locked grid felt busy | Added close button, simplified locked home |
| Routing Engineer | 8.6 | 9.6 | 9.5 | Need proof protected deep links stay locked | Verified `studyplanner://today` locks; static route gate checks pass |
| IAP/Paywall Reviewer | 8.8 | 9.5 | 9.5 | Apply path must never bypass entitlement | `ReviewImport.apply()` routes to paywall before `applyImport` |
| Student Lens | 7.1 | 9.3 | 9.4 | Next action was less obvious | "Scan syllabus", "Paste manually", "Unlock to apply" |

Average after: 9.45.

## Bottom Line

The locked product now says "Build your semester" and gives a clear reason to scan/import/unlock. It no longer implies active app access.

