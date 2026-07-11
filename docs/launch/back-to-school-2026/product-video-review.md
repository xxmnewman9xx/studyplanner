# Back-to-School 2026 Product Video Review

Generated: 2026-07-10T23:39:51.364Z
Status: legacy_supporting_approved
Role: Supplemental featuring nomination product-video candidate
App Preview ready: no

This review approves the existing scanner video only as a supplemental featuring URL candidate. None of the three 1080x1920 binaries—or their three draft-package copies—is approved for an App Store Connect App Preview upload: the current APP_IPHONE_65 portrait slot requires 886x1920, two canonical binaries exceed 30fps, and all H.264 bitrates are far below Apple's 10-12 Mbps target. It does not replace final native screenshots, WidgetKit proof, or a separate current-binary App Preview export.

Required App Store Connect export: `886x1920`, 15-30 seconds, 30fps or lower, progressive H.264 up to High Profile 4.0 at a 10-12 Mbps target, with compliant stereo AAC if audio is present. Upload approved: **no**.

## Primary Candidate

- Path: `marketing/social-launch-video/final/studyplanner-scanner-demo-app-preview-1080x1920.mp4`
- SHA-256: `1ab92985751a7930619659188bd52f0ce7762d47c623fc901da445544a45c2a0`
- Evidence: 1080x1920 portrait; 15.00 seconds; 60.00 fps; h264 High level 50 · progressive; 0.704 Mbps video; no audio track; MP4; 1300 KB

## Candidate Matrix

| Candidate | Status | App Preview Ready | Evidence | Warnings |
| --- | --- | --- | --- | --- |
| Final scanner demo | supplemental_ready | no | 1080x1920 portrait<br>15.00 seconds<br>60.00 fps<br>h264 High level 50 · progressive<br>0.704 Mbps video<br>no audio track<br>MP4<br>1300 KB | Not App Preview-ready: Apple app previews max out at 30fps; this export should stay supplemental unless re-exported.<br>Not App Preview-ready for APP_IPHONE_65: 1080x1920 must be re-exported at 886x1920.<br>Not App Preview-ready: H.264 must be Baseline/Main/High at level 4.0 or lower; found High level 50.<br>Not App Preview-ready: H.264 target video bitrate is 10-12 Mbps; found 0.704 Mbps. |
| Build 66 final app preview | supplemental_ready | no | 1080x1920 portrait<br>15.03 seconds<br>60.00 fps<br>h264 High level 50 · progressive<br>0.329 Mbps video<br>no audio track<br>MP4<br>615 KB | Not App Preview-ready: Apple app previews max out at 30fps; this export should stay supplemental unless re-exported.<br>Not App Preview-ready for APP_IPHONE_65: 1080x1920 must be re-exported at 886x1920.<br>Not App Preview-ready: H.264 must be Baseline/Main/High at level 4.0 or lower; found High level 50.<br>Not App Preview-ready: H.264 target video bitrate is 10-12 Mbps; found 0.329 Mbps. |
| Build 66 produced app preview | supplemental_ready | no | 1080x1920 portrait<br>18.52 seconds<br>30.00 fps<br>h264 High level 40 · progressive<br>0.156 Mbps video<br>aac 2ch 48000Hz 2.3 kbps<br>MP4<br>380 KB | Not App Preview-ready for APP_IPHONE_65: 1080x1920 must be re-exported at 886x1920.<br>Not App Preview-ready: H.264 target video bitrate is 10-12 Mbps; found 0.156 Mbps.<br>Not App Preview-ready: when audio is present it must be stereo AAC near 256 kbps at 44.1 or 48 kHz. |

## Blockers

- None for supplemental product-video candidacy.

## Warnings

- Not App Preview-ready: Apple app previews max out at 30fps; this export should stay supplemental unless re-exported.
- Not App Preview-ready for APP_IPHONE_65: 1080x1920 must be re-exported at 886x1920.
- Not App Preview-ready: H.264 must be Baseline/Main/High at level 4.0 or lower; found High level 50.
- Not App Preview-ready: H.264 target video bitrate is 10-12 Mbps; found 0.704 Mbps.
- All existing 1080x1920 candidates are supplemental-only and must not be uploaded to the APP_IPHONE_65 App Preview slot.
- Replace them with current-binary 886x1920 progressive footage at 30fps or lower, H.264 High Profile level 4.0 or lower at a 10-12 Mbps target, and compliant stereo AAC if audio is present.

## Source

- https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/
