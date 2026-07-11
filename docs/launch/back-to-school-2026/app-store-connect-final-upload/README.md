# App Store Connect Final Upload Bundle

Release: Back-to-School Semester Kickoff
Target featuring window: 2026-08-24 to 2026-08-31
Generated: 2026-07-09

Use this folder for the manual App Store Connect session.

## Controlling release-media decision (2026-07-10)

Overall media status: **BLOCKED / NOT SUBMISSION-READY**.

- Every GPT Image 2.0 Treatment B asset, including raw, resized, upscaled, finalized, composited, and otherwise derived files, is **BLOCKED / DO NOT UPLOAD**. Preserve the files only as historical and repair evidence.
- The only selected nomination-media candidates are slides 01-06 under `qa/back-to-school-2026/copy-b-reviewed-plan-review-only-2026-07-09/screenshots/en-US/APP_IPHONE_65/`.
- Slide 07 in that folder is not selected. It remains conditional until the raw SpringBoard/WidgetKit capture is hash-linked to the exact App Store submission binary and the composed output is re-reviewed.
- The three existing App Preview candidates are all 1080x1920 and are not ready for the current `APP_IPHONE_65` slot, which requires 886x1920. Two also exceed Apple's 30fps maximum. Keep them supplemental-only and do not upload them as App Previews.
- Independent review scored the event card `8.5/10`, event details art `7.3/10`, and supplemental hero `7.5/10`. All three are below the requested `10/10` release bar, are omitted from this curated branch, and are not approved for a new upload.
- Selection for the nomination packet is not App Store Connect upload authorization.

Local packet checks before submission:

```bash
npm run check:nomination-ready
npm run check:first-experience
npm run check:asc-final-upload
```

`npm run check:nomination-ready` is the submit-now local gate for Copy A/control. It refreshes the Copy B manual queue, verifies the final-upload zip contents, runs first-experience, ASC/network, release QA, hard-paywall, notes scanner stress, syllabus scanner stress, widget lock/integrity/no-crop QA, typecheck, whitespace checks, and the final nomination readiness summary.

Use `npm run check:asc-final-upload -- --check-network` when you want to reverify the five supplemental URLs against the public internet before the live App Store Connect session.

Use `npm run check:copy-b-image2` for the optional PPO Copy B set. It proves the `119/119` file matrix and exact `1242x2688` dimensions, not visual or source-truth approval. The completed independent human review is **blocked**; see `copy-b-human-visual-review-2026-07-09.md`.

`store.config.json` intentionally remains pointed at Copy A/control. `copy-b-image2-upload-map.json` is a historical map only; do not use it to upload or resubmit the blocked `17 x 7 = 119` Image 2.0 matrix.

## Live App Store Connect Status

Verified in App Store Connect on 2026-07-09:

- iOS app version `2.0.8` has build `79` attached; Save is disabled and Add for Review is enabled.
- Weekly Plus (`com.mattnewman.studyplanner.plus.weekly`), Monthly Plus (`com.mattnewman.studyplanner.plus.monthly`), and Yearly Plus (`com.mattnewman.studyplanner.plus.yearly`) each have a worldwide introductory offer: `Jul 9, 2026 to Sep 30, 2026`, `175 Countries or Regions`, `Free for the first week`. Apple eligibility still applies at the subscription-group level.
- In-App Event `Semester Kickoff Week` is submitted and `Waiting for Review` with both event-media files uploaded, deep link `studyplanner://import`, all countries or regions selected, high priority, and the new-user purpose selected.
- Featuring nomination `8255bf6c-6cbf-45bd-b88c-1afc3074ca41` was submitted on 2026-07-09 with the seasonal trial copy, all regions, 17 languages, and five supplemental URLs.
- Product Page Optimization draft `Copy B Back-to-School 2026` has one treatment with all `17 x 7 = 119` localized iPhone screenshots uploaded in 01-07 order. A PPO-only review submission was immediately canceled at the user's request and is `Removed`; the test has not started. Full human review found localization, product-truth, seam, and provenance blockers, so the draft must not be resubmitted in its current state.
- The iOS `2.0.8` app version/build was not submitted for review because build-79 runtime deep-link, sandbox purchase/restore, and production capture-bypass proof remain outstanding.

Before producing Copy B in the ChatGPT Mac app, run:

```bash
npm run prepare:copy-b-image2-queue
```

That writes the 119 Image 2.0 jobs, JSONL handoff, and provenance template. It does not generate or approve final B images.

## Historical Upload Order — Do Not Execute

The following sequence records the July 9 workflow only. It is blocked for any new upload until replacement event media exists, independently scores `10/10`, and the controlling readiness gates pass.

1. Create the In-App Event first.
2. Upload only the two files in `event-media/` to the In-App Event.
3. Submit the In-App Event for review.
4. Create the featuring nomination as an individual nomination, not CSV.
5. Paste the fields from `nomination-fields.md`.
6. Add the five supplemental URLs from `supplemental-url-registry.md`.
7. Attach the related In-App Event only after App Store Connect shows it is approved or otherwise accepted for selection.
8. Submit the nomination by 2026-07-17 if possible. 2026-07-24 is the absolute latest.

## Event Media

- `event-media/01-event-card-image-1920x1080.png`
- `event-media/02-event-details-image-1080x1920.png`

These paths are reserved for regenerated candidates. The files are intentionally absent and their manifest approvals are `false`. Do not upload either event image or the branded supplemental hero.

## Supplemental/Press

- `supplemental/studyplanner-branded-supplemental-hero-1920x1080.png`

This path is reserved for regenerated supplemental art. The prior `7.5/10` file is intentionally absent and is not approved for use.

## Reference Files

- `app-store-connect-live-session.md`
- `nomination-quality-scorecard.md`
- `app-preview-polish-scorecard.md`
- `submission-decision-memo.md`
- `deeplink-validation.md`
- `reference/app-store-connect-draft-payload.json`
- `reference/event-media-manifest.json`
- `reference/supplemental-url-registry.json`
- `reference/nomination-10-10-submission-dossier.md`
- `reference/scanner-first-slide-contact-sheet.png`
- `automation-feasibility.md`
- `testflight-build-status.md`
- `copy-b-image2-manual-queue.json`
- `copy-b-image2-manual-queue.jsonl`
- `copy-b-image2-upload-map.json`
- `copy-b-image2-provenance.template.json`

## PPO Hold After Nomination

Keep the existing iPhone-only Product Page Optimization treatment as a repair draft. Copy A/control remains the standard app-version screenshot set. Do not resubmit the PPO review item or press `Start Test` until every blocker in `copy-b-human-visual-review-2026-07-09.md` is repaired and all 17 locales pass a repeated full-size and ASC-thumbnail review.

- `gpt-image-2-prompts.md`
- `gpt-image-2-localized-preview-prompt-pack.md`
- `chatgpt-individual-preview-prompts.md`
- `../creative-copy-b-gpt-image-2-runbook.md`
- `../creative-copy-b-generation-report.md`
- `../reference-inspired-copy-b-gpt-image-2-runbook.md`
- `../reference-inspired-copy-b-generation-report.md`
- `../latest-build-copy-b-image2-runbook.md`
- `../latest-build-copy-b-image2-report.md`
- `reference/chatgpt-individual-preview-prompts.json`
- `reference/chatgpt-individual-preview-prompts.jsonl`

## Historical execution log (preserved, superseded for media decisions)

Everything below records the earlier production and App Store Connect work. Any use of
“ready,” “accepted,” “final,” “verified,” or “10/10” below describes a historical
mechanical/workflow state only. It is superseded by the controlling 2026-07-10 decision
at the top of this file: GPT Image 2.0 Treatment B is blocked, only the six deterministic
en-US Build 80 slides are selected for internal nomination review, slide 07 is
conditional, and no current media set is submission-ready.

The In-App Event and featuring nomination are submitted. App Store Connect shows iOS `2.0.8` build `79` attached to the unsubmitted app-version draft, the event deep link is exactly `studyplanner://import`, the worldwide one-week Plus introductory offer is live for Weekly, Monthly, and Yearly from July 9 through September 30, 2026, and the five supplemental URLs were accepted in the nomination form. Keep the app version out of review until the build-79 runtime gates pass. The Copy B visual-review cycle is complete with a blocked verdict; its PPO review submission was canceled and must remain unsubmitted.

Do not use the rejected `2.0.7` train for new App Store Connect uploads. Apple returned ITMS-90186/ITMS-90062 for `2.0.7 (78)`, so the current required binary train is iOS `2.0.8` build `79`; see `testflight-build-status.md`.

Deep link validation was refreshed on a clean iPhone 17 simulator window using the freshest local simulator artifact available at the time. The submitted iOS `2.0.8` build `79` IPA now also proves the `studyplanner` URL scheme is present in `CFBundleURLTypes`. Keep the event deep link as `studyplanner://import`, and perform the final runtime smoke from processed TestFlight build `79` before pressing the final App Store submission button.

Use the localized polished screenshot set in `store/apple/screenshot-pop/`. The preview polish cycle preserves the current Apple-inspired minimal direction, keeps real app/widget UI intact, and scores 10/10 for nomination readiness.

The restarted ChatGPT/GPT Image 2.0 Creative Copy B queues are optional PPO exploration after nomination submission. Earlier lifestyle/reference canaries exported below `1242x2688` and sometimes invented product UI despite source-first prompting; they remain preserved only as rejected evidence. Do not block the In-App Event or featuring nomination on new previews. The current Copy B root passes the mechanical size/provenance gate but is blocked by the independent human review.

Latest-build Copy B was also generated individually in the ChatGPT Mac app from the July 7 Build 77 native UI captures. Those seven outputs use the fresher UI and have exact-size review derivatives in `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/`, but the native Image 2.0 cache still exported `853x1844`. Treat them as PPO review candidates after human no-drift review, not as a nomination blocker.

Historical rejected-canary evidence: the July 8 ChatGPT Mac app/Image 2.0 canaries for `en-US-01` and `en-US-02` exported below `1242x2688`. The `en-US-02` retry used the Mac app file dialog for the real logo and real UI attachments plus a direct accessibility-set prompt, then exported `852x1846`. Copying the visible generated image from the Mac app context menu also produced `852x1846`, confirming the failure was not just the cache collector. Rejected candidates are preserved in `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/`, with state evidence in `qa/back-to-school-2026/copy-b-image2-mac-app-auto-run-state.json`. These rejected canaries are retained as evidence only; they no longer describe the current final Copy B root.

The resumed outcome-copy `en-US-01` canary used the ChatGPT Mac app file dialog for both required references and accessibility-set prompt text, then generated in the Mac app. The Mac app image viewer opened the generated cache PNG at `853x1844`, so it remains rejected as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-outcome-resume-rejected-cache-853x1844.png`.

The outcome-based Copy B set now has a refreshed manual Image 2.0 queue with outcome-led headlines/subheads instead of feature-led preview copy. The July 8 first-three update makes slide 1 show syllabus + notes intake into a reviewed plan, slide 2 show review-before-save control, and slide 3 show the organized semester payoff. This follows Apple's product-page guidance that the first one to three screenshots can appear in search results and Apple's PPO guidance that screenshot treatments can be tested against the original product page.

The clean July 8 `en-US-01` Mac app canary after this prompt update did not produce a retrievable cached PNG within 180 seconds; state evidence is in `qa/back-to-school-2026/copy-b-image2-mac-app-canary-state.json`, and the visible Mac app context remained a blank `ChatGPT Auto` chat after the failed automation pass. Earlier direct Mac app outputs preserved the export-size blocker with rejected `852/853x1844/1846` files in `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/`. The current files meet the upload dimensions, but human review found that multiple slide 7 images are not trustworthy source-locked localized Home Screen proof.

The later July 8 file-dialog canary with five attachments generated successfully but used older Copy A/review UI, so it is rejected for both provenance-fit and dimensions. Raw cache was `853x1844` and is preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-syllabus-notes-plan-rejected-filedialog-853x1844.png`.

After replacing first-three sources with latest UI/direction references, the latest-UI `en-US-01` canary was generated in the ChatGPT Mac app with the real logo, the user-provided latest Scan UI reference, latest review UI, and first-three direction references. The visual direction matched the requested latest scan UI, but the raw GPT Image 2.0 cache output was still `853x1844`; it is preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-latest-ui-rejected-filedialog-853x1844.png`. The `Add image to photos` / Photos unmodified-original export probe returned success but produced no file in `qa/back-to-school-2026/copy-b-image2-photos-export-probe/latest-ui-original-export/`, so it is not a usable accepted-output path.

The `Open with Preview` path was also probed on the latest-UI canary. Preview opened a temporary `media-preview/.../8d91155d63aa85839ca3b330c0c2350ce340dff369a30a651f4ef097279ba81b.png` handle, matching the already rejected ChatGPT cache image, and did not expose a retrievable exact-size original. This leaves no verified first-party Mac app export route that produces a raw `1242x2688` Image 2.0 PNG.

The follow-up latest-UI canary export probes also failed exact-size acceptance. Native `Save image as...` produced `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-latest-ui-rejected-native-save-20260708-045922.png` at `853x1844`; `Copy image` from the Mac app context menu produced `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-latest-ui-rejected-copy-image-20260708-050006.png` at `853x1844`. A scan of ChatGPT-owned app cache/support paths found zero exact `1242x2688` generated assets and only `853x1844` or `852x1846` readable generated images. Dragging the generated image from the Mac app into the rejected-evidence folder created no file. `Add image to photos` created no matching Photos media item and no recent readable file inside `Photos Library.photoslibrary`. The Copy B prompt pack remains generation-ready, with slide 1 requiring visible notes proof alongside syllabus proof and higher-risk locale strings tightened for pt-PT, ar-SA, de-DE, fr-FR, ja, ko, zh-Hans, and zh-Hant. Current final Copy B is accepted by the local final gate.

The share-link/original-asset route was also probed. The ChatGPT Mac app relaunched but the selected image-generation chat rendered a blank chat body, so the Mac app share-link control was not accessible for the latest canary. Chrome was checked as an evidence-only fallback, but the user's Chrome profile was not logged into ChatGPT and could not access the Mac app chat history or generated Image 2.0 assets. Current Copy B acceptance requires generation from the ChatGPT Mac app/GPT Image 2.0 queue, visual QA, preserved raw evidence, final `1242x2688` dimensions, and a matching record in `copy-b-image2-provenance.json`.

The final July 8 latest-build canary used the ChatGPT Mac app with the real app icon, latest Scan UI reference, latest Review Import UI reference, and the first-three direction reference set. The visual output matched the requested direction: slide 1 showed syllabus and notes as inputs, latest Scan UI as the hero, and review-before-save outcome copy. The raw ChatGPT Mac app cache asset was still `853x1844`, so it was rejected and preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-latest-ui-chatgpt-mac-cache-853x1844.png`; visual proof is preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-latest-ui-chatgpt-mac-visual-proof.png`. A paste/upload attempt for all five staged references also crashed the ChatGPT Mac app; the crash state is preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-chatgpt-crash-during-exact-file-paste.png`. This confirms the current blocker is retrievable output dimensions/tool stability, not prompt quality or use of old UI.

The first-three outcome previews were then prompted individually and efficiently in the ChatGPT Mac app from the regenerated manual queue. Slide 1 used latest Scan UI, syllabus and notes proof, and review-before-save outcome copy; slide 2 used the latest Review Import UI and approval-control outcome copy; slide 3 used the latest Semester Ready UI and organized-semester outcome copy. Earlier raw Mac app cache files remained below the required App Store size and are preserved as rejected evidence in `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/`. The accepted current final set is exact-size and passes `npm run check:copy-b-image2`.

The dimension-lock prompt was then strengthened to name the exact native canvas as `1242` pixels wide by `2688` pixels tall and explicitly reject scaled previews. The regenerated `en-US-01` canary used the ChatGPT Mac app, real app icon, latest Scan UI, latest Review Import UI, and both first-slide direction references. It visually matched the requested first-slide outcome, showing syllabus import, notes intake, latest Scan UI, and review-before-save copy, but the raw Mac app/preview asset still measured `853x1844`. It was rejected and preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-dimlock-prompt-chatgpt-mac-cache-853x1844.png`, with visual proof at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-dimlock-prompt-chatgpt-mac-visual-proof.png`. This is retained as historical evidence; the final accepted set has since been generated, visually QA'd, dimension-finalized, and verified by `npm run check:copy-b-image2`.

A final dimension-compensation prompt was also tested in the same ChatGPT Mac app/GPT Image 2.0 thread, explicitly requiring the retrievable PNG to measure `1242x2688` while compensating for the Mac app's observed preview downscale. The output again measured `853x1844`, proving the retrieval size was not corrected by prompt wording. It remains rejected as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-compensation-prompt-chatgpt-mac-cache-853x1844.png`, with visual proof at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-compensation-prompt-chatgpt-mac-visual-proof.png`. This is historical rejected evidence only.

The fresh-chat final-prefix canary then started with the exact required sentence from the July 8 production rule and attached the real logo, latest Scan UI, latest Review Import UI, and first-three direction references. GPT Image 2.0 again returned `853x1844`, not `1242x2688`; the raw rejected file is `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-cache-853x1844.png` with SHA-256 `8ae7a82077e2ebe704ef5841333e946bb41b861902e69372b33d34029bf93b74`, and visual proof is `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-visual-proof.png`. This is historical rejected evidence only; current final Copy B PNGs are populated and checked in `store/apple/screenshot-copy-b-image-2/`.

The Mac app viewer share sheet was also checked. `Copy` returned a temporary `media-preview` file URL for the same downscaled `853x1844` PNG and is preserved as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-09-en-US-01-fresh-dimlock-share-copy-fileurl-853x1844.png`; `Add to Photos` created no readable recent image file in `Photos Library.photoslibrary`. These routes do not provide an acceptable original-size export path.

The visible `Open with Preview` route was then checked from the same Mac app viewer. Preview opened `8f7be8f1a1245dfe770afefab657ccf679f559df48cf6c670e3de1a6792da2c9.png` from the temporary `media-preview` location, but that file was not durable or copyable from the filesystem when immediately probed and did not reveal a separate original-size asset. This leaves no verified first-party ChatGPT Mac app export path for raw exact `1242x2688` output.

The earlier all-queue automation was also started with `--all --send --collect --stop-on-fail` against all 119 manual jobs. It prompted `en-US-01` in ChatGPT Mac app/GPT Image 2.0, then stopped before item 2 because the retrievable raw PNG again measured `853x1844`. The rejected file is `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-09-en-US-01-all-queue-chatgpt-mac-cache-853x1844.png` with SHA-256 `5b58d843ffec1fe78bc85d6bf2e67ef75c21cc9896616db22e8a2e6464947e2b`; state evidence is `qa/back-to-school-2026/copy-b-image2-all-chatgpt-run-state.json`. Current final Copy B is no longer empty and is verified by the final gate.
