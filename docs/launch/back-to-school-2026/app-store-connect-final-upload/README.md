# App Store Connect Final Upload Bundle

Release: Back-to-School Semester Kickoff
Target featuring window: 2026-08-24 to 2026-08-31
Generated: 2026-07-09

Use this folder for the manual App Store Connect session.

Local packet checks before submission:

```bash
npm run check:nomination-ready
npm run check:first-experience
npm run check:asc-final-upload
```

`npm run check:nomination-ready` is the submit-now local gate for Copy A/control. It refreshes the Copy B manual queue, verifies the final-upload zip contents, runs first-experience, ASC/network, release QA, hard-paywall, notes scanner stress, syllabus scanner stress, widget lock/integrity/no-crop QA, typecheck, whitespace checks, and the final nomination readiness summary.

Use `npm run check:asc-final-upload -- --check-network` when you want to reverify the five supplemental URLs against the public internet before the live App Store Connect session.

Use `npm run check:copy-b-image2` for the optional PPO Copy B set. Current status: `119/119` final iPhone PNGs pass at exact `1242x2688`; slides 1-7 are accepted ChatGPT Mac app / GPT Image 2.0 outputs, and slide 7 was generated from the real localized Home Screen WidgetKit source references.

`store.config.json` intentionally remains pointed at Copy A/control for the standard app-version metadata upload. For a manual Product Page Optimization treatment, use `copy-b-image2-upload-map.json`, which maps all `17 x 7 = 119` Copy B iPhone PNGs under `store/apple/screenshot-copy-b-image-2/{locale}/APP_IPHONE_65/`.

Before producing Copy B in the ChatGPT Mac app, run:

```bash
npm run prepare:copy-b-image2-queue
```

That writes the 119 Image 2.0 jobs, JSONL handoff, and provenance template. It does not generate or approve final B images.

## Upload Order

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

Do not upload the branded supplemental hero as In-App Event media.

## Supplemental/Press

- `supplemental/studyplanner-branded-supplemental-hero-1920x1080.png`

This file uses the exact real app logo from `assets/icon.png`. It is for supplemental/press context only.

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

## Immediate PPO After Nomination

After the In-App Event and featuring nomination are submitted, immediately create an iPhone-only Product Page Optimization treatment from `copy-b-image2-upload-map.json`. Keep Copy A/control as the standard app-version screenshot set until there is a complete iPad strategy for Copy B.

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

## Current Decision

Submit the nomination once App Store Connect shows iOS `2.0.8` build `79` visible/selectable, the In-App Event draft has the two approved event-media files uploaded and cropped acceptably, the event deep link is exactly `studyplanner://import`, and the five supplemental URLs are accepted in the nomination form. Do not block the nomination on extended widget variant follow-up. The package already has public 9/9 screenshot proof and five real WidgetKit proof states, and editorial timing is more important for the August 24 window.

Do not use the rejected `2.0.7` train for new App Store Connect uploads. Apple returned ITMS-90186/ITMS-90062 for `2.0.7 (78)`, so the current required binary train is iOS `2.0.8` build `79`; see `testflight-build-status.md`.

Deep link validation was refreshed on a clean iPhone 17 simulator window using the freshest local simulator artifact available at the time. The submitted iOS `2.0.8` build `79` IPA now also proves the `studyplanner` URL scheme is present in `CFBundleURLTypes`. Keep the event deep link as `studyplanner://import`, and perform the final runtime smoke from processed TestFlight build `79` before pressing the final App Store submission button.

Use the localized polished screenshot set in `store/apple/screenshot-pop/`. The preview polish cycle preserves the current Apple-inspired minimal direction, keeps real app/widget UI intact, and scores 10/10 for nomination readiness.

The restarted ChatGPT/GPT Image 2.0 Creative Copy B queues are optional PPO exploration after nomination submission. Earlier lifestyle/reference canaries exported below `1242x2688` and sometimes invented product UI despite source-first prompting; they remain preserved only as rejected evidence. Do not block the In-App Event or featuring nomination on new previews. The current accepted Copy B root is not blocked by those canaries because every final PNG now passes the local final-size/provenance gate.

Latest-build Copy B was also generated individually in the ChatGPT Mac app from the July 7 Build 77 native UI captures. Those seven outputs use the fresher UI and have exact-size review derivatives in `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/`, but the native Image 2.0 cache still exported `853x1844`. Treat them as PPO review candidates after human no-drift review, not as a nomination blocker.

Historical rejected-canary evidence: the July 8 ChatGPT Mac app/Image 2.0 canaries for `en-US-01` and `en-US-02` exported below `1242x2688`. The `en-US-02` retry used the Mac app file dialog for the real logo and real UI attachments plus a direct accessibility-set prompt, then exported `852x1846`. Copying the visible generated image from the Mac app context menu also produced `852x1846`, confirming the failure was not just the cache collector. Rejected candidates are preserved in `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/`, with state evidence in `qa/back-to-school-2026/copy-b-image2-mac-app-auto-run-state.json`. These rejected canaries are retained as evidence only; they no longer describe the current final Copy B root.

The resumed outcome-copy `en-US-01` canary used the ChatGPT Mac app file dialog for both required references and accessibility-set prompt text, then generated in the Mac app. The Mac app image viewer opened the generated cache PNG at `853x1844`, so it remains rejected as `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/en-US-01-outcome-resume-rejected-cache-853x1844.png`.

The outcome-based Copy B set now has a refreshed manual Image 2.0 queue with outcome-led headlines/subheads instead of feature-led preview copy. The July 8 first-three update makes slide 1 show syllabus + notes intake into a reviewed plan, slide 2 show review-before-save control, and slide 3 show the organized semester payoff. This follows Apple's product-page guidance that the first one to three screenshots can appear in search results and Apple's PPO guidance that screenshot treatments can be tested against the original product page.

The clean July 8 `en-US-01` Mac app canary after this prompt update did not produce a retrievable cached PNG within 180 seconds; state evidence is in `qa/back-to-school-2026/copy-b-image2-mac-app-canary-state.json`, and the visible Mac app context remained a blank `ChatGPT Auto` chat after the failed automation pass. Earlier direct Mac app outputs preserved the export-size blocker with rejected `852/853x1844/1846` files in `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/`. Current final B is no longer blocked: it is recorded in `copy-b-image2-provenance.json`; the new slide 7 set is generated through ChatGPT Mac app / GPT Image 2.0 with real localized Home Screen WidgetKit source references and accepted-size final derivatives.

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
