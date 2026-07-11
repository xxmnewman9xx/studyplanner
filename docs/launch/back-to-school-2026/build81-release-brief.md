# Build 81 Release Brief

Status: production build and simulator QA build in progress.

Source commit: `ee414a9fd0c6817fff4287506f2f0018c01e585f`

Version: iOS `2.0.8` (`81`)

External upload authorization: `false`

## Five-Screenshot Story

These are App Store screenshots, not Apple App Preview videos. The supplied 592×1280 JPEGs are composition references only.

| Order | Headline | Supporting line | Exact product proof | Appearance |
| --- | --- | --- | --- | --- |
| 1 | Turn class material into a plan. | Scan or import a syllabus and notes. | Scan/import | Light |
| 2 | You approve every deadline. | Nothing saves until you confirm it. | Review, including uncertain dates | Light |
| 3 | Know today's next move. | See health, deadlines, and focus in one view. | Today | Light |
| 4 | Plan the week calmly. | Turn real deadlines into balanced study blocks. | Plan | Dark |
| 5 | Your plan, in any light. | Choose Light, Dark, or System. | Profile appearance picker plus matching app screen | Light and dark |

The first three screenshots form a complete search-result story: input, user control, and daily payoff. Screenshots four and five deepen the benefit and prove the new appearance support. Product UI pixels must come from the exact candidate build and remain untouched; only the external marketing frame and copy may be composed.

## Required Screenshot Set

- 5 slides × 17 App Store locales × iPhone and iPad = 170 PNG files.
- iPhone target: 1242×2688 RGB8 sRGB PNG with no alpha.
- iPad target: 2048×2732 RGB8 sRGB PNG with no alpha.
- Locales: `ar-SA`, `de-DE`, `en-AU`, `en-CA`, `en-GB`, `en-US`, `es-ES`, `es-MX`, `fr-CA`, `fr-FR`, `hi`, `ja`, `ko`, `pt-BR`, `pt-PT`, `zh-Hans`, `zh-Hant`.
- Arabic layouts must be mirrored. Regional variants must not reuse incorrect UI language (especially `pt-PT`/`pt-BR` and `zh-Hant`/`zh-Hans`).
- Every output sidecar must bind the raw and composed hashes to the source commit, EAS build ID, IPA or simulator artifact hash, version/build, device, OS, locale, appearance, capture time, and deterministic transform.
- No asset becomes upload-authorized until dimension, color, alpha, duplicate, crop, safe-zone, thumbnail, localization, product-truth, and named human review all pass.

## In-App Event Draft

Use only if live App Store Connect state shows the existing event can be edited safely and the event remains a real time-limited completion goal.

- Reference name: Back-to-School Semester Kickoff 2026
- Event name: Semester Kickoff Week
- Badge: Challenge
- Short description: Build a calm, reviewed semester plan.
- Long description: Import a syllabus, approve each deadline, and finish your first-week plan before classes ramp up.
- Start: 2026-08-24 08:00 local time
- End: 2026-08-31 23:59 local time
- Publish start: 2026-08-10 08:00 local time
- Deep link: `studyplanner://import`

The `Challenge` badge is valid only while the app genuinely tracks progress toward completing setup during the event window. Event media remains bound to the existing manifest and `uploadAuthorized:false` until a named reviewer approves the exact hashes.

## Featuring Nomination Draft

### Description

Study Planner AI helps students turn the first stack of syllabi into a calm plan they control. Students scan or import class material, review detected courses, assignments, exams, and uncertain dates, then approve every deadline before anything is saved. Build 81 adds a user-controlled System, Light, and Dark appearance across the planning experience while native widgets adapt independently to the Home and Lock Screen. The release combines transparent review-before-save safeguards, focused study blocks built from real deadlines, accessible Dynamic Type and RTL layouts, and localized product and store experiences across 17 key student markets. The result is a distinctly Apple-native path from class material to a trusted next move today.

### Helpful details

Built by an independent developer focused on reducing semester overwhelm. The update pairs review-before-save OCR with real System/Light/Dark support, native WidgetKit views, on-device planning data, Dynamic Type and RTL QA, and localized iPhone/iPad product pages. The seasonal event asks students to complete a concrete first-week setup goal rather than promoting general app awareness.

## Submission Boundary

Do not select Build 81, replace event media, edit or resubmit the live event, update the featuring nomination, upload screenshots, or submit the app version for review until all of the following are true:

1. Production Build 81 is processed as `VALID` in App Store Connect.
2. The exact TestFlight binary passes named physical iPhone and iPad QA.
3. All 170 screenshots carry exact-binary provenance and pass mechanical and human review at the accepted quality threshold.
4. Live event and nomination status has been read before choosing edit versus replacement.
5. A named human reviewer authorizes the exact build and media hashes.
