# Weekly Apple Ads Optimization Checklist

Cadence: every 7 days, same weekday, after at least 20 USD cumulative spend or 7 calendar days, whichever comes later.

## Inputs

- Apple Ads search terms export
- Campaign/ad group spend
- Taps
- Installs
- Average CPT
- Average CPA
- TTR
- Impression share/rank where available
- App Store Connect downloads and subscription starts by source/custom product page where available
- `attribution-plan.md`

## Actions

1. Confirm total daily budget still equals 5 USD/day.
2. Check if one active localization is getting enough spend. If not, do not add more locales.
3. Promote converting discovery terms to exact match in the correct intent ad group.
4. Add every promoted term as an exact negative in Discovery.
5. Add exact negatives for terms with spend above target CPA and zero installs.
6. Use broad negatives only for clearly wrong concepts, such as teacher lesson planning, LMS sync, answer/cheating intent, or unsupported school integrations.
7. Raise exact max CPT 10-20 percent only when CPA is below target and impressions are constrained.
8. Lower exact max CPT 10-20 percent when taps convert poorly above target CPA.
9. Pause keywords with repeated spend above 3x target CPA and no install.
10. Keep Discovery at or below 0.50 USD/day until at least two exact ad groups are profitable.
11. Rotate from `es-MX` to `pt-BR` only after the first market has either a proven CPA/subscription signal or two full review windows without enough signal.
12. Do not enable US discovery until US exact terms convert.

## Decision Log Template

```text
Date:
Active market:
Spend:
Installs:
Subscriptions/trials:
Best exact terms:
Promoted discovery terms:
New negatives:
Bid changes:
Next market decision:
Risk:
```

## Stop / Scale Rules

- Stop a market: 2 review windows, 40 USD spend, no install quality signal, and no improving TTR/CVR trend.
- Keep testing: cheap installs but no subscription signal yet; improve CPP first before scaling.
- Scale within 5 USD/day: move Discovery budget into exact winners.
- Scale above 5 USD/day only after the user explicitly approves a higher cap.
