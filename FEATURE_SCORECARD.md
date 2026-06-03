# Feature Scorecard

## Reviewer Method

Seven scoring reviewers evaluated the new spine:

1. Product CEO
2. Growth/Conversion Reviewer
3. Student UX Reviewer
4. App Store Reviewer
5. Simplicity Reviewer
6. Engineering Feasibility Reviewer
7. Monetization Reviewer

Scores are 1-10. For implementation risk, 10 means low risk/easy and 1 means high risk/hard.

## Subagent Scores

| Reviewer | Onboarding Conversion | Clarity | Perceived Value | Retention Potential | Implementation Risk | Subscription Value |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Product CEO | 8 | 9 | 8 | 7 | 8 | 9 |
| Growth/Conversion | 7 | 8 | 8 | 7 | 6 | 8 |
| Student UX | 8 | 7 | 9 | 8 | 6 | 8 |
| App Store | 7 | 8 | 7 | 6 | 5 | 7 |
| Simplicity | 8 | 9 | 8 | 7 | 8 | 9 |
| Engineering Feasibility | 7 | 8 | 8 | 8 | 6 | 8 |
| Monetization | 7 | 8 | 9 | 8 | 6 | 9 |
| **Average** | **7.4** | **8.1** | **8.1** | **7.3** | **6.4** | **8.3** |

## Score Interpretation

### Strongest Signals

- Subscription value is the strongest dimension at 8.3 average.
- Clarity and perceived value are both strong at 8.1.
- The spine is commercially stronger than a feature-spread app.
- Recommended Widgets and smaller customization improve the Plus story.

### Main Risks

- Implementation risk is moderate at 6.4.
- App Store review is the toughest lens because unsupported widget/watch claims can create rejection risk.
- Hard paywall timing can hurt conversion if the pre-paywall summary does not feel concrete.
- Scan/manual input quality must be reliable enough to make the paywall feel earned.

## Reviewer Synthesis

### Product CEO

The spine is strategically correct. The dashboard should be the paid payoff, and the app must resist expanding back into many surfaces. Highest-leverage decisions:

- One singular promise.
- Lean pre-paywall flow.
- Watch absent unless real.
- Widget Studio becomes Recommended Widgets.
- Plus customization stays class colors plus dashboard style.

### Growth / Conversion

The funnel works because it builds intent before payment. Risks:

- Onboarding may feel long.
- "Syllabus AI" may sound vague.
- Hard paywall needs vivid value.
- Watch invisibility must be clean.
- Plus should not feel arbitrary.

Recommended fix: show a profile/result summary before paywall, not dashboard access.

### Student UX

Students will care if the app clearly knows their classes and tells them what to do next. Risks:

- Too many onboarding questions can feel like a form.
- Dashboard must be calm.
- Next important thing must be unmistakable.

Recommended fix: keep onboarding under 2-4 minutes and make every question visibly useful.

### App Store Reviewer

The concept is reviewable if claims match shipped behavior. Risks:

- Early hard paywall.
- Widget claims.
- Watch claims.
- Vague AI.
- Weak subscription justification.

Recommended fix: use concrete, honest language and hide unproven surfaces.

### Simplicity Reviewer

This is the clearest version of the app. Biggest cuts:

- Hide dashboard until paywall.
- Remove complex widget editor.
- Cut theme store.
- Hide Watch unless real.
- Collapse setup into scan-first with manual fallback.

### Engineering Feasibility Reviewer

Direction is feasible but not trivial. Risks:

- Existing widget/customization models may be too configurable.
- Hard paywall affects routing.
- Saved legacy settings may need migration later.
- Scan/import reliability is critical.
- Dashboard must not become a locked teaser wall.

### Monetization Reviewer

The Plus bundle is strong because dashboard intelligence, Forecast, Focus, Review, and Recommendations are recurring value. Recommendations:

- Paywall after onboarding aha.
- Lead with outcome.
- Lock dashboard interaction.
- Keep defaults polished.
- Avoid invisible/unproven features.

## Feature-Level Scorecard

| Feature | Keep / Cut / Hide | Spine Role | Paywall Decision | Risk |
| --- | --- | --- | --- | --- |
| Onboarding | Keep, rebuild | Personalization capture | Free pre-paywall | Medium |
| Profile builder | Keep, rebuild | Decisioning engine | Profile capture free; personalized dashboard paid | Medium |
| Scan syllabus | Keep, simplify | Hero input | Capture choice/source pre-paywall; applying output paid | Medium-high |
| Manual input | Keep as fallback | Sparse dashboard setup | Minimum setup pre-paywall; saved dashboard paid | Medium |
| Paywall | Keep hard | Conversion boundary | Blocks dashboard | Medium |
| Dashboard/Home | Keep, rebuild | Paid payoff | Fully paid | Medium |
| Forecast | Keep, simplify | Risk signal | Paid | Medium |
| Classes | Keep | Course explanation | Paid | Medium |
| Focus | Hide from nav | Action loop | Paid suggestions | Low-medium |
| Notes | Hide from nav | Context | Paid/contextual | Low-medium |
| Widgets | Keep as recommendations | External-surface guidance | Paid | Medium |
| Customization | Narrow | Ownership/recognition | Paid | Low |
| Review Inbox | Hide as alert | Trust | Paid helper | Medium |
| Empty states | Keep, simplify | Recovery routing | Dashboard empties paid | Low |
| Watch | Hide unless real | None until proven | Not sold | High if visible |

## Final Scores For The New Spine

| Dimension | Score | Why |
| --- | ---: | --- |
| Onboarding conversion | 7.5 | Strong if fast; risky if too many screens |
| Clarity | 8.5 | One promise beats many modules |
| Perceived value | 8.5 | Personalized dashboard feels premium |
| Retention potential | 7.5 | Home, risk, focus, widgets can create daily loop |
| Implementation risk | 6.5 | Moderate due to routing, scan reliability, model simplification |
| Subscription value | 8.5 | Dashboard intelligence and personalization justify Plus |

## Final Verdict

The new product spine is the right move.

The strongest version is strict:

- No dashboard before paywall.
- No Widget Studio.
- No theme store.
- No Watch unless real.
- Home is the paid dashboard.
- Onboarding captures only data that changes Home.
- Scan/manual input creates the data asset.
- Paywall sells the generated school dashboard.

If the team protects that discipline, the app can move from a 4/10 feature bundle to a clearer, higher-converting product.
