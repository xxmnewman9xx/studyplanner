# Build 52 Entitlement Trace Report

## Trace Added

`App.tsx` now emits a QA-safe console line:

```text
[Build52Access] source=<source> status=<status> localPremium=<bool> onboarding=<bool> active=<route> decision=<route> access=<state>
```

## Source Values

- `storekit_active`
- `loading`
- `none`
- `error`
- `local_cached_ignored_loading`
- `local_cached_ignored_none`
- `local_cached_ignored_error`

## QA Question Answered

The logs distinguish:

- legitimate unlock: `source=storekit_active`, `access=unlocked`
- stale local premium ignored: `source=local_cached_ignored_*`, `access=locked` or `preview_allowed`
- entitlement error: `source=error` or `local_cached_ignored_error`, locked by default

