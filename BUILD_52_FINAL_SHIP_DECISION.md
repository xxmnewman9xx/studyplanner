# Build 52 Final Ship Decision

## Decision

PASS - Submit to TestFlight.

## Rationale

- Auth leak root cause was found and fixed.
- Unlock requires validated active entitlement.
- Local premium does not unlock.
- Stored premium is scrubbed unless entitlement is active.
- Purchase update events revalidate active entitlement before unlock.
- StoreKit pricing must load before purchase CTA is enabled.
- Local release gates passed.
- Physical validation is deferred to TestFlight real-device QA because TestFlight is required to prove signed StoreKit, widget, notification, and upgrade behavior.

## Deferred TestFlight Device Validation

- Fresh TestFlight install.
- No-purchase onboarding.
- Paywall cancel.
- StoreKit purchase/restore.
- Widget locked/unlocked state.
- Notification/deep-link locked state.
- Upgrade from Build 51 if available.

## Release Rule

No entitlement = locked.

