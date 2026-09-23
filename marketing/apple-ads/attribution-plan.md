# Attribution Plan

Goal: avoid optimizing for cheap installs that do not become subscriptions.

## Primary Paid Funnel Metrics

1. Apple Ads spend
2. Taps
3. Installs
4. App Store product page / CPP conversion rate
5. Onboarding completion
6. Paywall view
7. Trial or subscription start
8. Refund/cancel signal when available

## Minimum Source Breakdown

Track results by:

- Campaign
- Ad group
- Search term
- Keyword and match type
- Country/region
- Locale
- Custom product page ID
- Subscription product selected

## Operating Rule

Do not scale above the 5 USD/day cap from install CPA alone. A keyword can graduate from discovery to exact on install signal, but it only earns higher bid priority after trial/subscription quality appears.

## CPP IDs

Fill these after App Store Connect approval:

```text
cpp_assignments:
cpp_class_schedule:
cpp_exam_study:
```

## Notes

Apple Ads and App Store Connect reporting may not expose every subscription event at the same granularity. When direct CPP-to-subscription attribution is incomplete, use directional evidence: CPP conversion rate, source installs, paywall views, and subscription starts by market/date window.
