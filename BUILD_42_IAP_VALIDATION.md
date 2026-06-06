# Build 42 IAP Validation

Date: 2026-06-05  
Build: 1.0.3 (42)

## Configuration

- Bundle ID: `com.mattnewman.studyplanner`
- ASC App ID: `6766181202`
- Monthly product: `com.mattnewman.studyplanner.plus.monthly`
- Yearly product: `com.mattnewman.studyplanner.plus.yearly`
- EAS account: `xxmnewman9xx`

## Evidence

- Product IDs are defined in `src/iap.ts`.
- Paywall loaded real sandbox prices in prior simulator gate:
  - Monthly: `$3.99`
  - Yearly: `$24.99`
- Purchase path reached Apple Account sign-in:
  - `qa/build42-final-device/20-iap-purchase-attempt.png`

## Results

| Check | Result | Notes |
|---|---:|---|
| Product IDs wired | Pass | IDs match `com.mattnewman.studyplanner.*`. |
| Bundle/App ID wired | Pass | Bundle and ASC app ID are present. |
| Paywall renders products | Pass | Prior sandbox run showed real prices. |
| Purchase boundary | Pass | StoreKit opened Apple Account sign-in. |
| Restore path | Source verified | Restore uses `restorePurchases()` then entitlement check. |
| Completed purchase | Blocked | No sandbox Apple credentials available. |
| Relaunch entitlement persistence | Partial | App persistence was validated with simulator-local entitlement, not a real StoreKit transaction. |

## Decision

Do not claim completed IAP validation. The wiring is correct, but purchase/restore completion still needs sandbox credentials or TestFlight sandbox validation.

