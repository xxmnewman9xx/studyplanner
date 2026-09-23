# Reference-Inspired Copy B Generation Report

Generated: 2026-07-07
Queue: `qa/back-to-school-2026/reference-inspired-copy-b-gpt-image-2-prompts.json`

## Status

The Copy B cycle has been redirected to a **Real UI Pop Card** visual direction inspired by the supplied reference screenshots.

This queue uses two attachments per prompt: the current live ASC preview first for literal StudyPlanner UI, then the reference sheet for style only. It explicitly rejects any fake UI, invented widget, generated notification, or product-pixel drift.

## Current Proof Gate

Two `refpop-en-US-01` canaries were generated in the ChatGPT Mac app through GPT Image 2.0:

1. Style-first attachment order:
   `qa/back-to-school-2026/reference-inspired-copy-b-candidates/refpop-en-US-01-rejected-853x1844-style-first-fake-ui.png`
2. Source-first attachment order:
   `qa/back-to-school-2026/reference-inspired-copy-b-candidates/refpop-en-US-01-rejected-853x1844.png`

Both candidates are rejected.

## Rejection Reasons

- Dimensions failed: both collected PNGs were `853x1844`, not `1242x2688`.
- Product UI failed: both candidates invented or redrew StudyPlanner-like UI instead of preserving the live ASC preview UI.
- The source-first prompt reduced ambiguity but still produced fake product surfaces, so this is not a safe generation path for App Store screenshots.

## Parallel Prompt Decision

Do not parallel-send the remaining queue. Parallelizing after two failed canaries would multiply non-compliant fake UI and waste usage.

Only continue if a new ChatGPT/GPT Image 2.0 workflow can first prove one candidate that passes both gates:

- dimensions: exactly `1242x2688`
- product UI: no visible drift from the live ASC source

Prior GPT Image 2.0 proof attempts were rejected at `853x1844` / `852x1846`, and the reference-inspired canaries repeated the same dimension failure while also drifting UI.

## Nomination Impact

This Copy B work is not a nomination blocker. The 10/10 nomination route is still the final-upload packet plus the current live App Store previews as Copy A/control.
