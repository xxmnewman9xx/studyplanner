# ChatGPT Copy B Generation Report

Generated: 2026-07-08
Queue: `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json`

## Result

Do not run the remaining 118 Copy B prompts until GPT Image 2.0 can return accepted output at `1242x2688` while preserving locked pixels.

The ChatGPT Mac app prompting path works:

- `en-US-01` was staged with the current ASC-live preview image attached.
- `en-US-01` was sent to ChatGPT/GPT Image 2.0.
- ChatGPT generated candidates and cached readable PNG outputs.
- The automation can locate cached ChatGPT PNGs under the Kingfisher image cache.

The generated outputs are rejected:

- Loose prompt candidate: `853x1844`, visibly redrew non-text areas.
- Strict pixel-locked prompt candidate: `853x1844`, still downscaled and not App Store-size.
- Rejected strict candidate saved at `qa/back-to-school-2026/chatgpt-copy-b-candidates/en-US-01-rejected-strict.png`.
- ChatGPT Mac app export probe found no usable full-resolution file in Desktop, Downloads, app containers, or the ChatGPT image cache.
- A later file-picker upload probe successfully attached the exact PNG through ChatGPT's `Attach content -> Upload file` path, but the generated candidate still returned `852x1846`, not App Store-size. Rejected file-picker candidate saved at `qa/back-to-school-2026/chatgpt-copy-b-candidates/en-US-01-file-upload-proof-852x1846.png`.
- A restarted Creative Copy B proof generated a stronger lifestyle/editorial visual direction, but still returned `853x1844`. Rejected creative candidate saved at `qa/back-to-school-2026/creative-copy-b-candidates/creative-en-US-01-rejected-853x1844.png`.
- The July 8 fresh-chat final-prefix canary started with the exact required sentence, attached the real StudyPlanner icon, latest Scan UI, latest Review Import UI, and first-three direction references, then returned `853x1844`. Rejected raw file saved at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-cache-853x1844.png`; SHA-256 `8ae7a82077e2ebe704ef5841333e946bb41b861902e69372b33d34029bf93b74`. Visual proof saved at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-08-en-US-01-fresh-dimlock-chatgpt-mac-visual-proof.png`.
- The Mac app viewer share-sheet `Copy` route exposed a temporary `media-preview` PNG file URL, but that file was the same `853x1844` asset with SHA-256 `8ae7a82077e2ebe704ef5841333e946bb41b861902e69372b33d34029bf93b74`. It is preserved at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-09-en-US-01-fresh-dimlock-share-copy-fileurl-853x1844.png`. The share-sheet `Add to Photos` route produced no readable recent image file in `Photos Library.photoslibrary`.
- The Mac app viewer `Open with Preview` route opened `8f7be8f1a1245dfe770afefab657ccf679f559df48cf6c670e3de1a6792da2c9.png` from the same temporary `media-preview` location. `lsof` showed Preview reading that path, but the file was not durable or copyable from the filesystem when immediately probed, and it did not expose a separate original-size asset.
- The all-queue automation was started from the current 119-job manual queue with `--all --send --collect --stop-on-fail`. It prompted `en-US-01` in the ChatGPT Mac app and stopped before item 2 because the retrievable GPT Image 2.0 PNG again measured `853x1844`, not `1242x2688`. The rejected raw file is preserved at `qa/back-to-school-2026/copy-b-image2-mac-app-rejected/2026-07-09-en-US-01-all-queue-chatgpt-mac-cache-853x1844.png` with SHA-256 `5b58d843ffec1fe78bc85d6bf2e67ef75c21cc9896616db22e8a2e6464947e2b`. State evidence is in `qa/back-to-school-2026/copy-b-image2-all-chatgpt-run-state.json`.

## Stop Condition

The 10/10 gate requires exact `1242x2688` PNGs, correct localized external Copy B text, and no changed app UI, widget, Home Screen, icon, brand lockup, phone geometry, background, hand, or shadow pixels.

Because strict edit, file-picker upload, restarted creative generation, first-three outcome generation, dimension-lock prompting, compensation prompting, the fresh final-prefix canary, Mac app viewer share-sheet/Preview export routes, and the current all-queue run all fail the required dimensions or fail to expose a durable original file, mass-sending the full 119-item queue would produce likely rejected outputs. Continue only after one GPT Image 2.0 candidate is retrievable as a raw exact `1242x2688` PNG and passes visual QA.

## Working Command

Stage without sending:

```bash
node scripts/prompt-chatgpt-copy-b-queue.mjs --id en-US-01 --stage --force
```

Send and collect one candidate:

```bash
node scripts/prompt-chatgpt-copy-b-queue.mjs --id en-US-01 --send --force --collect --stop-on-fail --wait-ms 240000
```

## Next Test

Use ChatGPT's image output controls, if available, to download/export the generated image at full resolution. If the downloadable file is still `853x1844`, do not use it for App Store screenshots. Under the current rule, there is no local compositor fallback for Copy B: accepted Copy B assets must come from GPT Image 2.0 in the ChatGPT Mac app or remain ungenerated. Copy B is non-blocking for the In-App Event nomination and blocks only PPO treatment upload.
