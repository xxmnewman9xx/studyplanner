# 10/10 Featuring Nomination Submission Dossier

Date: 2026-07-07
Release: Back-to-School Semester Kickoff
Target featuring window: 2026-08-24 to 2026-08-31
Recommended nomination type: App Enhancements
Recommended submission mode: Manual App Store Connect nomination, not CSV

## Current Decision

Do not wait until the July 24 internal deadline. Create the App Store Connect nomination draft immediately, create and submit the In-App Event as soon as event media is ready, then submit the nomination as soon as the event is either approved or the nomination packet has five stable supplemental URLs. If the In-App Event is still not approved by July 17, submit the nomination without the related event ID and preserve the August 24-31 window.

Reasoning:

- Apple says nomination information is used to evaluate featuring opportunities and recommends submitting and finalizing at least three weeks in advance.
- August 24 is the editorial moment. Earlier submission gives Apple more time to route the student/back-to-school story.
- CSV import is the wrong path because Apple submits CSV imports automatically. The individual nomination workflow can be saved as a draft and edited before submission.
- The build and store screenshots are already submitted, so the highest-leverage remaining work is editorial packaging, In-App Event review, and clean supplemental proof.

## App Store Connect Fields

Nomination name: Back-to-School Semester Kickoff
Nomination type: App Enhancements
Publish Date Start: 2026-08-24
Publish Date End: 2026-08-31
Relevant countries or regions: All available regions
Launch in certain markets first: No
Do you intend to submit a new In-App Event: Yes
Platforms: iOS (iPhone), iOS (iPad)
Related In-App Events: Add the App Store Connect event ID only after `Semester Kickoff Week` exists and is approved or otherwise accepted by App Store Connect.
Localization: Use every App Store locale already supported by the submitted release.
Supplemental Materials: use the five stable HTTPS URLs from `qa/back-to-school-2026/supplemental-url-registry.json`.
Pre-order: No

Nomination description, 749/1000 characters:

Study Planner AI's Back-to-School Semester Kickoff update helps students turn the first stack of syllabi into a calm, reviewed semester plan before classes begin. During setup, onboarding guides them to scan or import a syllabus, review detected courses, assignments, exams, and uncertain dates, then save a plan they control. Native WidgetKit surfaces keep the plan visible after setup: Today, Upcoming, Week/Semester Calendar, Class Progress, and real Home Screen views for heavy weeks. The update is localized across key student markets, uses real release screenshots and WidgetKit captures, includes localization and accessibility QA checks, and keeps the promise focused: a reviewed Apple-native path from syllabus chaos to a calmer first week.

Helpful Details, 407/500 characters:

Built by an independent developer focused on reducing semester overwhelm, not selling generic AI. The release pairs privacy-conscious review-before-save planning with Apple-native details: real WidgetKit proof, submitted iPhone/iPad screenshots, localized store presence, Dynamic Type/RTL/accessibility QA checks, and a timed Semester Kickoff Week event that helps students finish setup before classes ramp.

## In-App Event

Use `Challenge` if the event flow clearly asks students to complete a goal before the event ends: import a syllabus, approve deadlines, and finish setup before classes ramp. Use `Major Update` only if App Review or editorial feedback rejects the challenge framing.

Reference name: Back-to-School Semester Kickoff 2026
Event name: Semester Kickoff Week
Badge: Challenge
Short description: Review your first-week plan
Long description: Import a syllabus, approve deadlines, and finish setup before classes ramp.
Publish start: 2026-08-10 08:00 local time
Start: 2026-08-24 08:00 local time
End: 2026-08-31 23:59 local time
Deep link: `studyplanner://import`
Priority: High, if App Store Connect exposes priority for the event.
Availability: all storefronts matching app availability.

Event media:

- Event Card Image: PNG/JPG, 16:9, 1920x1080 minimum.
- Event Details Page Image: PNG/JPG, 9:16, 1080x1920 minimum.
- Keep event media text-free because App Store overlays the event name and descriptions.
- Do not show fake app UI, fake widgets, fake devices, fake App Store badges, school names, LMS brands, reviews, rankings, or unsupported claims.

Final event media files:

- Event Card Image: `docs/launch/back-to-school-2026/event-media/final/semester-kickoff-event-card-1920x1080.png`
- Event Details Page Image: `docs/launch/back-to-school-2026/event-media/final/semester-kickoff-event-details-1080x1920.png`
- Media manifest: `docs/launch/back-to-school-2026/event-media/manifest.json`

## Brand Visual Direction

Real logo source: `assets/icon.png`
Logo description: white square icon with a black outlined syllabus page, folded top-right corner, black checkmark, and small gray dash.

Use the exact logo file for any supplemental cover, press image, or social asset that needs branding. Do not ask GPT Image 2.0 to redraw the logo. For generated editorial art, keep the scene logo-free unless the exact logo is composited afterward from `assets/icon.png`.

Brand palette:

- White base and black/graphite linework from the icon.
- Academic blue, fresh green, warm orange, pink, and graphite accents from the app/widget theme system.
- Clean Apple-native surfaces, translucent layers, syllabus paper geometry, calendar rhythm, and calm first-week study materials.

Rejected visual directions:

- Generic AI glow, robot assistants, futuristic neural graphics, fake dashboards, fake Home Screen widgets, fake iPhones, or generic stock-student scenes.
- Marketing text inside the image.
- Any illustration that makes the app look like an LMS, school portal, gradebook, homework-submission tool, or Watch/Live Activity product.

## GPT Image 2.0 Prompt

Use this prompt in ChatGPT with `assets/icon.png` attached as the real brand reference. The logo should guide the visual language, not be redrawn inside event media.

```text
Use GPT Image 2.0 to create four text-free creative assets for Study Planner AI's Back-to-School Semester Kickoff featuring nomination and In-App Event.

Input image role:
- The attached image is the real Study Planner AI app icon. Use it only as a brand reference for visual language: clean white field, black outlined syllabus page, folded corner, checkmark, small gray dash, simple high-contrast document geometry.
- Do not redraw, reinterpret, distort, or place a fake version of the logo inside the generated event media. If a logo is needed later, the exact source logo will be composited separately.

Context:
The submitted App Store build and screenshots already show the real app UI, real WidgetKit widgets, onboarding, syllabus import, review-before-save, Today priorities, focus blocks, and localized screenshots. These generated assets are editorial/marketing context only.

Hard rules:
- Do not invent app screens, fake widgets, fake iPhone UI, fake Home Screen placement, fake notifications, fake lock screens, fake course dashboards, fake app icons, or fake App Store badges.
- Do not include readable text, logos, school names, Canvas/LMS references, reviews, rankings, ratings, prices, or claims.
- Do not depict unsupported Watch, Live Activity, Canvas/LMS sync, automatic homework submission, or guaranteed extraction.
- The images must be text-free; App Store Connect will overlay the event name and descriptions.
- Style: Apple-native, premium, calm, student-centered, realistic, modern, clean, back-to-school energy without clutter.
- Palette: white, graphite/black linework, academic blue, fresh green, warm orange, subtle pink accent.
- Visual motif: syllabus papers, class handouts with illegible texture only, clean document geometry, colored planning tabs, calendar rhythm, translucent materials, calm morning light, and organized first-week energy. No device screens.

Generate these four separate PNG assets:

1. Event card image, 16:9 landscape, 1920x1080 minimum:
Clean student desk scene where scattered syllabus pages visually transition into an orderly semester planning rhythm using abstract colored tabs, calendar cards, and soft translucent layers. No readable text. No devices or screens.

2. Event details image, 9:16 portrait, 1080x1920 minimum:
Vertical editorial composition for Semester Kickoff Week: calm study materials, syllabus pages with illegible texture only, colored planning markers, subtle week arc, and morning light. No readable text. No devices or screens.

3. Supplemental nomination hero, 16:9 landscape:
Premium editorial hero showing first-week overwhelm becoming calm: left side softly messy syllabus stack, right side organized colored planning objects and calendar-like shapes. No readable text. No UI. Leave a clean corner where the exact real logo can be composited later.

4. Social/editorial crop, 4:5 portrait:
Polished close-up of a study table beside a backpack, syllabus pages with illegible marks, colored tabs, pencil, and soft translucent planning shapes. Calm student outcome focus, no readable text, no UI.
```

## Submission Strategy

1. July 7-10: generate and choose event media, using the real icon as reference but not as generated content.
2. July 7-10: create `Semester Kickoff Week` in App Store Connect and submit it for review.
3. July 7-12: create the featuring nomination as an individual draft and paste the fields above.
4. July 10-17: attach the In-App Event ID if it is approved or accepted by App Store Connect; otherwise leave Related In-App Events empty.
5. July 12-17: submit the featuring nomination manually. Do not wait for July 24 unless a real blocker remains.
6. July 24: absolute internal latest submit date. If the IAE is not approved by then, submit the nomination without the related event ID.
7. August 10: event becomes discoverable if approved.
8. August 24-31: event runs during the requested featuring window.

## Final Proof Checklist

- The App Store replacement version candidate is `2.0.8` build `79` with the real screenshot set; Apple rejected the closed `2.0.7` train.
- Product video URL opens without auth.
- Screenshot contact sheet URL opens without auth and reflects submitted release screenshots.
- Widget sheet URL opens without auth. Current local proof is 5/8 states; capture tinted Home Screen and Lock Screen rectangular/circular only if it will not delay nomination submission.
- Accessibility/localization URL opens without auth.
- App Review proof URL opens without auth.
- `studyplanner://import` is the event deep link. The submitted iOS `2.0.8` build `79` IPA contains the `studyplanner` URL scheme, and earlier clean-simulator smoke opened the first-run syllabus/import onboarding path; re-run the runtime smoke on processed TestFlight build `79` before final App Store submission.
- In-App Event media passes 16:9 and 9:16 size checks: `semester-kickoff-event-card-1920x1080.png` and `semester-kickoff-event-details-1080x1920.png`.
- All images are text-free and have no fake UI/widgets/devices.
- No claim mentions Canvas/LMS sync, guaranteed extraction, automatic homework submission, unsupported Watch, Live Activities, ratings, rankings, or prices.
- `detect_changes({scope: "compare", base_ref: "main"})` is run before final handoff or commit.

## Public URL Verification

Verified on 2026-07-07:

| Slot | Public readback | URL |
| --- | --- | --- |
| Product video | HTTP 200 after GitHub redirect, 1,331,420 bytes | https://github.com/xxmnewman9xx/studyplanner/releases/download/back-to-school-2026-supplementals/product-video.mp4 |
| Screenshot contact sheet | HTTP 200; `Screenshots fulfilled: 9/9` | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/screenshot-contact-sheet.md |
| Native WidgetKit sheet | HTTP 200; `Widget states captured: 5/8` | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/native-widget-sheet.md |
| Accessibility/localization summary | HTTP 200; build `2.0.8` / `79` and current verification date visible | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/accessibility-localization-summary.md |
| App Review proof | HTTP 200; build `2.0.8` / `79` and claim boundaries visible | https://gist.githubusercontent.com/xxmnewman9xx/8ce183d571c61df26dc64d69c429f166/raw/app-review-proof.md |

## Submit Or Wait Decision

Submit the nomination once the five supplemental URLs are stable and public, even if the In-App Event is still pending review. Do not block the nomination on the three missing extended widget proof states. Those states make the evidence package better, but the local App Store screenshot story already has 9/9 frames fulfilled, and Apple editorial timing matters more for the August 24 window.

The only blockers that should delay the nomination are:

- App Review rejects or blocks the replacement `2.0.8` build.
- A supplemental URL is private, expired, or points to stale/non-real UI.
- The event or nomination media includes fake UI/widgets or unsupported claims.
- The deep link cannot open the real import/onboarding path.

## Sources

- https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/
- https://developer.apple.com/help/app-store-connect/offer-in-app-events/offer-in-app-events/
- https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-event/
- https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-badges/
- https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-media-and-audio-specifications/
