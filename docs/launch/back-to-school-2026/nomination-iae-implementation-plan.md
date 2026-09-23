# Nomination And In-App Event Implementation Plan

Release: Back to School with AI
Campaign: Back-to-School Semester Kickoff
Build assumption: iOS 2.0.7 (77) is already submitted with the final screenshots, so do not change App Store version screenshots unless App Review requires it.

## Goal

Submit a featuring nomination for `2026-08-24 to 2026-08-31` while keeping the already-submitted build and screenshot set stable. Use the In-App Event as a timely App Store discovery layer only after its own review path is valid.

## Nomination Path

1. Keep nomination type as `App Enhancements`.
2. Use the existing paste-ready draft payload at `docs/launch/back-to-school-2026/app-store-connect-draft-payload.json`.
3. Submit no later than `2026-07-24`.
4. Keep `csvAllowed` false. Use the manual App Store Connect draft flow because CSV import submits nominations automatically.
5. Attach the submitted build evidence, screenshot contact sheet, widget proof sheet, accessibility/localization summary, product video, and App Review proof as supplemental URLs.
6. If the In-App Event is not approved or published by final nomination submit time, submit the nomination without a related event ID and mention the planned event in Helpful Details only if the field remains under limit.

## In-App Event Path

1. Create the event in App Store Connect.
2. Reference name: `Back-to-School Semester Kickoff 2026`.
3. Event name: `Semester Kickoff Week`.
4. Badge: `Challenge`.
5. Short description: `Build your semester plan`.
6. Long description: `Scan your syllabus, review deadlines, and start the week with widgets.`
7. Start: `2026-08-24 08:00 local time`.
8. End: `2026-08-31 23:59 local time`.
9. Publish start: `2026-08-10 08:00 local time`.
10. Deep link candidate: `studyplanner://import`.
11. Localize IAE metadata for the same App Store locales already supported by the release.
12. Submit the IAE for review after media, deep link, and subscription disclosure checks pass.
13. Attach the IAE to the nomination only after App Store Connect shows the event as approved or published.

## Creative Scope

Use GPT Image 2.0 only for editorial/marketing context assets:

- Event card image: 16:9, 1920x1080 minimum.
- Event details image: 9:16, 1080x1920 minimum.
- Supplemental hero/contact-sheet cover: 16:9.
- Social/editorial crop: 4:5 or 9:16.

Rules:

- No fake app screens.
- No fake widgets.
- No fake phone UI.
- No readable claims, labels, school names, institutional logos, Canvas/LMS references, homework submission references, rankings, ratings, or reviews.
- If app UI is shown, use only the real submitted screenshots as source pixels and preserve them exactly.
- Prefer text-free creative because App Store overlays event name and descriptions.

## Acceptance Gates

- IAE metadata lengths remain inside Apple limits: 30 event name, 50 short description, 120 long description.
- Event card image is landscape 16:9 and details image is portrait 9:16.
- Deep link opens the submitted app build to the import/onboarding path.
- Event media has no invented UI or unsupported claims.
- Nomination remains `Save as Draft` until all local gates pass or blockers are explicitly accepted.

## GPT Image 2.0 Master Prompt

```text
Use GPT Image 2.0 to create four text-free creative assets for Study Planner AI's Back-to-School Semester Kickoff In-App Event and featuring nomination.

Context:
Study Planner AI helps students turn syllabus chaos into a calm semester plan. The submitted App Store build and screenshots already show the real app UI, real WidgetKit widgets, onboarding, syllabus import, review-before-save, Today priorities, focus blocks, and localized screenshots. These generated assets are editorial/marketing context only.

Hard rules:
- Do not invent app screens, fake widgets, fake iPhone UI, fake Home Screen placement, fake notifications, fake lock screens, fake course dashboards, fake app icons, or fake App Store badges.
- Do not include readable text, logos, school names, Canvas/LMS references, reviews, rankings, ratings, prices, or claims.
- Do not depict unsupported Watch, Live Activity, Canvas/LMS sync, automatic homework submission, or guaranteed extraction.
- The images should be text-free; App Store Connect will overlay the event name and descriptions.
- Style: Apple-native, premium, calm, student-centered, realistic, modern, clean, back-to-school energy without clutter.
- Visual idea: syllabus papers, class handouts, a backpack/tablet/laptop-free study desk, calendar rhythm, soft translucent materials, colored planning tabs, calm morning light, and subtle organized-semester cues. No device screens.

Generate these four assets:

1. Event card image, 16:9 landscape, 1920x1080 minimum:
   A clean student desk scene where scattered syllabus pages visually transition into an orderly semester planning rhythm using abstract colored tabs, calendar cards, and soft translucent layers. No readable text. No devices or screens.

2. Event details image, 9:16 portrait, 1080x1920 minimum:
   A vertical editorial composition for "Semester Kickoff Week": calm study materials, syllabus pages with illegible texture only, colored planning markers, a subtle week arc, and morning light. No readable text. No devices or screens.

3. Supplemental nomination hero, 16:9 landscape:
   A premium editorial hero showing the feeling of first-week overwhelm becoming calm: left side softly messy syllabus stack, right side organized colored planning objects and calendar-like shapes. No readable text. No UI.

4. Social/editorial crop, 4:5 portrait:
   A polished close-up of a backpack-side study table, syllabus pages with illegible marks, colored tabs, pencil, and soft translucent planning shapes. Calm, student outcome focused, no readable text, no UI.

Return the four images as separate PNGs. Use consistent palette across all outputs: academic blue, fresh green, warm orange, graphite, and white. Keep enough negative space for App Store overlays.
```
