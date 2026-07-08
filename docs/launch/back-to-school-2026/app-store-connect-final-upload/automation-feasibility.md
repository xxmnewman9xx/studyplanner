# Automation Feasibility

Checked: 2026-07-07

## Result

Manual App Store Connect submission is the correct path from this machine.

Manual ChatGPT output acceptance is also the correct path for final GPT Image 2.0 preview variants. The ChatGPT Mac app can be launched and prompted, and PNG clipboard handoff works, but the app does not expose a stable AppleScript API for bulk image attachment, generation completion detection, or output download/save in this environment.

## Evidence

- Local private key exists: `~/.appstoreconnect/private_keys/AuthKey_HDR783736G.p8`
- Known ASC app ID: `6766181202`
- Existing EAS submit logs confirm EAS used API key ID `HDR783736G`.
- No issuer ID was found in repo docs, EAS settings, local App Store config, or submit logs.
- A read-only App Store Connect API probe against the app list endpoint returned `401 NOT_AUTHORIZED` when signed with key ID `HDR783736G` and no issuer claim.
- Chrome automation is not currently available because Chrome is not running in this session. Chrome, the Codex Chrome Extension, and the native host are installed/configured, but the Chrome workflow requires user approval before launching Chrome.
- ChatGPT Mac app bundle ID verified: `com.openai.chat`.
- ChatGPT Mac app UI is visible to AppleScript/System Events, and a PNG clipboard dry run passed.
- ChatGPT Mac app does not expose a reliable bulk file-upload/output-save automation surface through AppleScript here, so the 119-item prompt queue is prepared as a deterministic handoff instead of claiming unattended generation.

## Practical Impact

Do not attempt API submission until the issuer ID/team context is available and the key is confirmed to have the required App Store Connect API access. The upload bundle is therefore optimized for the individual manual App Store Connect workflow.

For the preview creative pass, use `chatgpt-individual-preview-prompts.md` and `reference/chatgpt-individual-preview-prompts.jsonl`. Each item is intentionally one attached screenshot plus one prompt so generated outputs can be rejected if any real UI, widget, localized text, phone geometry, or App Store screenshot dimensions drift.

## Manual Workflow To Use

1. Open App Store Connect.
2. Create and submit `Semester Kickoff Week` as an In-App Event using the files in `event-media/`.
3. Create an individual featuring nomination, not a CSV import.
4. Paste the fields from `nomination-fields.md`.
5. Paste the URLs from `supplemental-url-registry.md`.
6. Attach the In-App Event only if App Store Connect allows selecting the approved/submitted event.
7. Submit the nomination by 2026-07-17 if possible.

## Source Notes

- Apple supports App Store Connect API authentication with JWT tokens generated from API key material.
- The local key material alone did not allow a successful read-only API call in this environment.
