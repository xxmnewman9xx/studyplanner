# Product Truth Review

## Keep

Today, Add School Stuff, Check New Work, Calendar, Week, Classes, Widget Setup, onboarding previews, capture mode, the native WidgetKit bridge, themes, and store-backed IAP. These now align around one user promise: reviewed school work becomes a trusted plan.

## Changed

- Technical labels were softened where safe: Inbox to Check, Widget Studio to Widget Setup, confidence language to How sure/Looks good/Needs check.
- Parser output is explicitly treated as found work until the student accepts it.
- Today now shows Needs Check as a review action, not as a fake deadline.
- Busy Week and widget views are backed by confirmed assignment data.
- Paywall failure state is recoverable instead of stuck loading.

## Removed Or Deferred

- Large and lock-screen native widget screenshots were not faked because the native extension only supports small and medium.
- Broad Focus feature claims remain deferred.
- Heavy list virtualization, broad localization, and full calendar/reminder reconciliation are deferred because they are higher-risk than the trust fixes for this cycle.

## Verdict

Pass for internal release candidate. Remaining risk is not fake-feeling product surface; it is external StoreKit validation and deeper performance/localization polish.
