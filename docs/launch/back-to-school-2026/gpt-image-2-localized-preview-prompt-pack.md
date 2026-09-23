# GPT Image 2 Localized Preview Prompt Pack

Purpose: make the localized App Store preview slides more engaging while preserving the current Apple-inspired minimal visual direction and all real app/WidgetKit pixels. Use this in the Mac ChatGPT app or GPT Image 2.0 image-edit flow, one slide at a time.

Status: final guidance for the 10/10 polish cycle. Do not switch to a new campaign style, abstract art system, fake phone UI, or newly invented widget presentation.

Exact one-prompt-per-slide queue:

- Human runbook: `docs/launch/back-to-school-2026/chatgpt-individual-preview-prompts.md`
- Full JSON queue: `qa/back-to-school-2026/chatgpt-individual-preview-prompts.json`
- JSONL queue: `qa/back-to-school-2026/chatgpt-individual-preview-prompts.jsonl`

## Non-Negotiable Rules

- Keep the current visual direction: Apple-inspired minimal, bright white space, soft depth, premium phone framing, crisp localized headline, mostly white brand system with black controls and restrained class-color accents, and subtle color only where it supports the existing slide.
- Do not redraw, rewrite, translate, replace, crop out, blur, or invent any app UI or widget UI.
- Preserve the phone screen and Home Screen screenshot exactly as source pixels, including all visible text.
- Do not add fake widgets, fake notifications, fake lock screens, fake charts, fake app icons, fake App Store UI, or unsupported LMS/watch/live-activity claims.
- Improve only the surrounding presentation: depth, lighting, device context, student relief, real use-case clarity, and App Store polish.
- Keep it calmer and more premium than an ad. No busy collage, no loud gradients, no decorative bokeh/orbs, no stock-photo drift.
- Reject the output if any UI text, widget content, icon, course data, price, button, screenshot boundary, app logo, or localization changes.

## Source Slides

Final polished screenshot root: `store/apple/screenshot-pop/{store-locale}/APP_IPHONE_65/`

Original screenshot root: `store/apple/screenshot/{store-locale}/APP_IPHONE_65/`

Store locale fanout:
`en-US`, `en-GB`, `en-AU`, `en-CA`, `de-DE`, `es-ES`, `es-MX`, `fr-FR`, `fr-CA`, `pt-BR`, `pt-PT`, `ja`, `ko`, `zh-Hans`, `zh-Hant`, `hi`, `ar-SA`

The real WidgetKit proof slide is:
`store/apple/screenshot-pop/{store-locale}/APP_IPHONE_65/07-real-home-screen-widgets.png`

Final slide set per iPhone locale:

- `01-scan-syllabus.png`
- `02-semester-health.png`
- `03-plan-autopilot.png`
- `04-manage-semester.png`
- `05-class-detail.png`
- `06-notes.png`
- `07-real-home-screen-widgets.png`

## Per-Slide Prompt Template

Use this template for each PNG:

```text
Enhance this existing App Store screenshot for StudyPlanner AI without changing the design direction.

Use the attached screenshot as the source of truth. Preserve the current Apple-inspired minimal composition: bright white space, large localized type, understated logo, premium phone/device framing, soft shadows, and a calm back-to-school feel.

Preserve the phone screen / Home Screen widget screenshot exactly as source pixels. Do not change any visible app UI, widget UI, text, icons, dates, course labels, buttons, status bar content, app logo, localization, or screenshot geometry.

Make only the surrounding presentation more engaging and premium: slightly stronger depth, realistic device lighting, clearer student use-case context, subtle stress-relief cues, refined paper/glass material, and stronger visual focus on the existing screenshot. Keep it clean, Apple-native, and suitable for App Store screenshots.

Locale: {store-locale}
Slide: {slide-file}
Hard rule: no fake UI, no fake widgets, no changed UI text, no changed localized marketing text, no unsupported claims, no style drift.
Return one polished PNG at the same 1242x2688 aspect ratio.
```

## Per-Slide Creative Intent

Use the same base template above, then append the matching intent line.

### `01-scan-syllabus.png`

```text
Intent: Show the first moment of relief: a messy syllabus becomes manageable. Keep the existing real scanner/use-case presentation and make it feel more immediate, calmer, and more trustworthy. Use subtle student-desk context only if it does not distract from the current slide.
```

### `02-semester-health.png`

```text
Intent: Show relief after setup: the student can see whether the semester is on track. Keep the current clean dashboard framing and add a touch more confidence, breathing room, and organized progress energy.
```

### `03-plan-autopilot.png`

```text
Intent: Show deadlines turning into a plan. Keep the current minimal calendar/planning direction and add subtle rhythm, focus, and less-overwhelmed energy without making it look like a generic AI ad.
```

### `04-manage-semester.png`

```text
Intent: Show everything staying connected: classes, reminders, tasks, and notes. Keep the current directness and make the surrounding presentation feel a little more dynamic and organized, with no extra UI.
```

### `05-class-detail.png`

```text
Intent: Show class-level calm: every course has assignments, exams, notes, and progress in one place. Preserve the current premium product frame and add subtle clarity and control cues.
```

### `06-notes.png`

```text
Intent: Show notes becoming action. Keep the current minimal note/productivity feel and add a light study-session context, without adding readable generated text or changing app UI.
```

### `07-real-home-screen-widgets.png`

```text
Intent: Show ongoing relief after setup: the plan stays visible on the Home Screen. This slide must remain real WidgetKit proof, not a mockup.

Enhance this StudyPlanner AI App Store preview slide that shows real iOS Home Screen widgets.

The widgets and Home Screen must remain exact source pixels from the real WidgetKit screenshot. Do not add, remove, resize, rewrite, recolor, blur, or invent any widget, app icon, label, date, course, ring, calendar cell, or Home Screen element.

Improve only the surrounding preview composition: subtle depth, clean Apple-native lighting, better visual focus, and calmer back-to-school context. The result must still read as authentic Home Screen proof, not a mockup.

Locale: {store-locale}
Source proof: store/apple/screenshot-pop/{store-locale}/APP_IPHONE_65/07-real-home-screen-widgets.png
Hard rule: no fake UI, no fake widgets, no changed Home Screen text, no unsupported claims, no style drift.
Return one polished PNG at the same 1242x2688 aspect ratio.
```

## Rejection Examples

Reject any GPT output that:

- changes `StudyPlanner AI`, localized headlines, or any visible app/widget text,
- redraws the app icon or makes a fake app icon,
- makes the phone look like a different device class,
- inserts extra widgets, notifications, Dynamic Island content, lock-screen controls, or app screens,
- changes real WidgetKit layout, widget labels, calendar cells, or Home Screen icons,
- adds school/LMS brand names,
- makes the slide look like a loud social ad instead of an Apple-style App Store screenshot,
- removes the stress-relief story and turns the image into generic AI.

## Audit Checklist

For every GPT image output, compare against the source slide before accepting:

- UI pixels unchanged inside the phone/Home Screen screenshot.
- No invented screens, widgets, app icons, native chrome, notifications, or overlays.
- Locale headline remains appropriate and visible.
- No text drift inside app or widget UI.
- No unsupported claims: Canvas/LMS sync, guaranteed extraction, watch app, Live Activity, automatic homework submission.
- App Store screenshot remains 1242x2688 for `APP_IPHONE_65`.
- Current visual direction is preserved.
- The slide communicates a real student use case and stress relief within 2 seconds.

Accepted outputs should be stored separately from raw/composed sources until review passes.
