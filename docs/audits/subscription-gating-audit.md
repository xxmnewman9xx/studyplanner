# Subscription Gating Audit

Agent: Subscription/Paywall Auditor

## Findings

- The success alert was only present in the purchase listener, but the same entitlement activation helper also caused the onboarding skip by writing onboarding completion.
- StoreKit entitlement hydration now calls `maybeShowUnlockSuccess("startup_hydration")`, which intentionally does nothing.
- Purchase and restore are the only allowed alert sources.

## Changes

- Added `UnlockSuccessSource = "purchase_action" | "restore_action" | "startup_hydration"`.
- Added `maybeShowUnlockSuccess()` with a source allowlist and short duplicate-alert guard.
- Purchase listener calls `maybeShowUnlockSuccess("purchase_action")`.
- Restore button calls `maybeShowUnlockSuccess("restore_action")` only after `restoreStudyPlannerPurchases()` returns premium.
- Entitlement hydration silently activates premium access without showing the unlock success modal.
- Premium entitlement no longer implies onboarding completion.

## GitNexus Impact

- `premiumData`: HIGH risk. Changed narrowly to preserve onboarding state while still writing `premium`, `premiumProductId`, `premiumCheckedAt`, and `osLive`.
- `Paywall`: LOW risk. Direct caller: `App`.

## Verification

- `npm run check:activation-spine`: PASS.
- `npm run check:localization`: PASS.
- Fresh simulator launch showed StoreKit sandbox queue error but no unlock success alert and no dashboard skip.

## Score

- No false modals: 10/10
- Restore behavior: 9/10
- Purchase behavior: 9/10
- Premium state safety: 10/10

Remaining risk: purchase/restore success alert paths are source-gated and code-verified, but live App Store sandbox purchase/restore was not completed during this run.
