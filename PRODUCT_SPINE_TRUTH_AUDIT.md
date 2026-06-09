# Product Spine Truth Audit

Date: 2026-06-02  
Baseline: latest local product-spine implementation at `18d1e47` plus current dirty worktree.

## Verdict

**FAIL.** The flow is implemented and the hard paywall is technically gated, but the experience does not yet clear the product truth bar.

Primary failure reasons:

- Onboarding still reads like a sequence of form cards after the first promise screen.
- The post-paywall Home capture does not clearly prove that onboarding answers drive the dashboard.
- Recommended Widgets uses real data, but still feels partially artificial because the recommendation, preview, and internal proof copy do not line up cleanly.
- The final personalization step has clipped hero text on iPhone-size capture.

## Evidence

Screenshots: `artifacts/product-spine-truth-audit/screenshots/`  
Contact sheet: `artifacts/product-spine-truth-audit/contact-sheet.png`

Required evidence captured:

- Onboarding steps: `00-onboarding-scan.png` through `07-onboarding-personalize.png`
- Scan/manual fork: `05-onboarding-focus.png`, `06-onboarding-widgets.png`, `12-scan.png`, `12a-capture-type-it-in.png`
- Hard paywall: `24-hard-paywall-locked.png`
- Post-paywall Home/dev bypass: `10-today-light.png`
- Recommended Widgets: `19-widgets-ocean.png`
- Empty/manual state: `57-empty-today.png`, `12a-capture-type-it-in.png`

## Acceptance

| Gate | Result | Notes |
| --- | --- | --- |
| Fresh install | PASS | Normal first-run arrays are empty; hard paywall blocks main app after onboarding. |
| Guided onboarding | FAIL | Step flow is mostly option cards: school level, goal, struggle, schedule, input choice. It feels like a form despite good copy. |
| Profile builder | PASS/WEAK | Captures school level, goal, struggle, schedule, input path, and summary. Final screen has clipped title text. |
| Scan/manual choice | PASS | Scan/manual fork appears before paywall. |
| Hard paywall timing | PASS/WEAK | Paywall appears after profile, input choice, and setup summary. Value is explained, but not experienced. |
| Dashboard reflects answers | FAIL | Home capture shows useful planner modules, but not clear proof of selected answers like deadline memory or balanced schedule. |
| Recommended Widgets feels real | FAIL | Uses planner data, but recommendation and preview can mismatch; visible QA-style copy weakens trust. |
| Unsupported Watch/widget claims | PASS/WEAK | Captured product-spine screens show Home Screen widget claims only. Source/localized strings still contain legacy Watch wording, so release-string QA remains risky. |

## Reviewer Scores

Scale: 10 = strong / low risk. For implementation risk, 10 = low implementation risk.

| Reviewer | Onboarding clarity | Value before paywall | Paywall timing | Dashboard personalization | Widget usefulness | Visual polish | Implementation risk |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Product CEO | 5 | 7 | 7 | 4 | 5 | 4 | 7 |
| Growth/Conversion | 5 | 6 | 7 | 4 | 5 | 4 | 7 |
| Student UX | 4 | 6 | 6 | 3 | 5 | 4 | 7 |
| App Store Editorial | 4 | 6 | 6 | 4 | 4 | 3 | 6 |
| Monetization | 6 | 7 | 7 | 4 | 5 | 4 | 7 |
| Engineering QA | 7 | 7 | 8 | 5 | 6 | 5 | 8 |

## Findings

1. **Onboarding feels like a form.**  
   The first promise screen is strong, but steps 2-6 are stacked choice cards with disabled Next buttons until a selection is made. This fails the stated bar.

2. **Final onboarding text clips.**  
   `07-onboarding-personalize.png` clips "Your school dashboard is ready to unlock." horizontally. This is visible polish debt.

3. **Dashboard personalization is not obvious.**  
   Home has the right modules: Next important thing, Today, Semester Pulse, Upcoming risk, Focus suggestion, and Recommended Widgets. The screen does not clearly echo the selected profile answers, so a user cannot tell the setup mattered.

4. **Recommended Widgets is closer, but not true enough.**  
   The screen leads with a recommendation from planner data, but the preview can show a different widget type. The note "Only claim live widget behavior when it is proven in the shipped app" feels like internal QA language.

5. **Watch claims are not visible in captured flow, but legacy strings remain.**  
   `localized-app-strings/core-launch-strings.json` still includes older Watch wording. I did not change it because it was not visible in the audited flow and this audit was not a localization cleanup pass.

6. **QA harness blocker fixed.**  
   `App.tsx` capture routing accepted onboarding indexes `0..6` while onboarding now has 8 steps. I changed it to `0..7` so the final personalization step can be captured.

## Commands

| Command | Result | Log |
| --- | --- | --- |
| `npm test` | PASS | `artifacts/product-spine-truth-audit/logs/npm-test-clean.log` |
| `npm run check:localization` | PASS | `artifacts/product-spine-truth-audit/logs/check-localization.log` |
| `npm run check:scenarios` | PASS | `artifacts/product-spine-truth-audit/logs/check-scenarios.log` |
| `npm run check:iap` | PASS | `artifacts/product-spine-truth-audit/logs/check-iap.log` |
| `npm run qa:sim-product-depth` | PASS | `artifacts/product-spine-truth-audit/logs/qa-sim-product-depth.log` |

## Bottom Line

The implementation is technically coherent and tests pass, but the product spine is not yet good enough. The biggest truth gap is not gating or navigation; it is whether the user feels guided, sees value before payment, and can recognize that their answers shaped the paid dashboard.
