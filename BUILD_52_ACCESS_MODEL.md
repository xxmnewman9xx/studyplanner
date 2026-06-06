# Build 52 Access Model

## One True Model

```ts
type AccessState =
  | "loading"
  | "onboarding"
  | "preview_allowed"
  | "locked"
  | "paywall"
  | "unlocked";
```

Only one condition unlocks:

```ts
entitlementStatus === "active"
```

`prefs.premium` is now treated as a display/persistence mirror only. It is scrubbed before screen props and before persistence unless entitlement is active.

## Rules Enforced

- onboarding completion does not unlock
- name entry does not unlock
- scan/paste/import preview does not unlock
- pending import does not unlock
- local premium flag does not unlock
- deep links do not unlock
- widget taps do not unlock
- restore attempts do not unlock unless active entitlement is returned
- purchase updates do not unlock unless active entitlement is revalidated
- entitlement loading does not flash app routes
- entitlement error defaults locked

## Route Outcomes

| State | Product route | Preview route | Paywall route |
|---|---|---|---|
| onboarding | welcome/onboarding | welcome | welcome |
| loading | locked dashboard | preview allowed | paywall |
| inactive/error | locked dashboard | preview allowed | paywall |
| active | requested route | requested route | requested route |

