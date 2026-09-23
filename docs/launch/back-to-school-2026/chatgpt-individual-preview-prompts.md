# ChatGPT Individual App Preview Prompt Queue

Generated: 2026-07-07

Purpose: run one GPT Image 2.0 edit prompt per submitted iPhone App Store preview, using the latest `store.config.json` screenshot paths from `store/apple/screenshot-pop`.

## Status

- Prompt count: 119
- Locale count: 17
- Slides per locale: 7
- Source root: `store/apple/screenshot-pop/{locale}/APP_IPHONE_65/`
- ChatGPT Mac app bundle verified: `com.openai.chat`
- PNG clipboard dry run: passed
- Bulk file-upload/output-save automation through AppleScript: not exposed reliably by the app UI in this environment

## Non-Negotiables

- Use the attached screenshot as the source of truth and preserve the current Apple-inspired minimal visual direction.
- Do not redraw, rewrite, translate, replace, crop out, blur, or invent any app UI, WidgetKit UI, Home Screen content, app icon, localized headline, status bar, phone geometry, or screenshot boundary.
- Keep every visible app/widget/UI pixel exact. Improve only presentation outside the real UI: lighting, depth, focus, desk/material context, and stress-relief feel.
- No fake widgets, fake notifications, fake app screens, fake lock screens, fake LMS/school integrations, fake App Store UI, fake charts, fake phone UI, or unsupported claims.
- Keep it calmer and more premium than an ad: Apple-inspired, bright white space, soft depth, restrained color, and no loud gradients/orbs/collage drift.
- Return one polished PNG at the same 1242x2688 dimensions.
- First slide must keep the real in-app scanner screen.
- Widget slide must remain real WidgetKit/Home Screen proof.

## Exact Prompt Sources

- Full JSON queue: `qa/back-to-school-2026/chatgpt-individual-preview-prompts.json`
- JSONL queue for automation: `qa/back-to-school-2026/chatgpt-individual-preview-prompts.jsonl`

## Submitted Preview Checklist

| # | Locale | Slide | Source |
| ---: | --- | --- | --- |
| 1 | en-US | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/01-scan-syllabus.png` |
| 2 | en-US | 2. 02-semester-health.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/02-semester-health.png` |
| 3 | en-US | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/03-plan-autopilot.png` |
| 4 | en-US | 4. 04-manage-semester.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/04-manage-semester.png` |
| 5 | en-US | 5. 05-class-detail.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/05-class-detail.png` |
| 6 | en-US | 6. 06-notes.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/06-notes.png` |
| 7 | en-US | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 8 | en-GB | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/01-scan-syllabus.png` |
| 9 | en-GB | 2. 02-semester-health.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/02-semester-health.png` |
| 10 | en-GB | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/03-plan-autopilot.png` |
| 11 | en-GB | 4. 04-manage-semester.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/04-manage-semester.png` |
| 12 | en-GB | 5. 05-class-detail.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/05-class-detail.png` |
| 13 | en-GB | 6. 06-notes.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/06-notes.png` |
| 14 | en-GB | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 15 | en-AU | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/01-scan-syllabus.png` |
| 16 | en-AU | 2. 02-semester-health.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/02-semester-health.png` |
| 17 | en-AU | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/03-plan-autopilot.png` |
| 18 | en-AU | 4. 04-manage-semester.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/04-manage-semester.png` |
| 19 | en-AU | 5. 05-class-detail.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/05-class-detail.png` |
| 20 | en-AU | 6. 06-notes.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/06-notes.png` |
| 21 | en-AU | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 22 | en-CA | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/01-scan-syllabus.png` |
| 23 | en-CA | 2. 02-semester-health.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/02-semester-health.png` |
| 24 | en-CA | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/03-plan-autopilot.png` |
| 25 | en-CA | 4. 04-manage-semester.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/04-manage-semester.png` |
| 26 | en-CA | 5. 05-class-detail.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/05-class-detail.png` |
| 27 | en-CA | 6. 06-notes.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/06-notes.png` |
| 28 | en-CA | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 29 | de-DE | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/01-scan-syllabus.png` |
| 30 | de-DE | 2. 02-semester-health.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/02-semester-health.png` |
| 31 | de-DE | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/03-plan-autopilot.png` |
| 32 | de-DE | 4. 04-manage-semester.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/04-manage-semester.png` |
| 33 | de-DE | 5. 05-class-detail.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/05-class-detail.png` |
| 34 | de-DE | 6. 06-notes.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/06-notes.png` |
| 35 | de-DE | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 36 | es-ES | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/01-scan-syllabus.png` |
| 37 | es-ES | 2. 02-semester-health.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/02-semester-health.png` |
| 38 | es-ES | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/03-plan-autopilot.png` |
| 39 | es-ES | 4. 04-manage-semester.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/04-manage-semester.png` |
| 40 | es-ES | 5. 05-class-detail.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/05-class-detail.png` |
| 41 | es-ES | 6. 06-notes.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/06-notes.png` |
| 42 | es-ES | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 43 | es-MX | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/01-scan-syllabus.png` |
| 44 | es-MX | 2. 02-semester-health.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/02-semester-health.png` |
| 45 | es-MX | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/03-plan-autopilot.png` |
| 46 | es-MX | 4. 04-manage-semester.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/04-manage-semester.png` |
| 47 | es-MX | 5. 05-class-detail.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/05-class-detail.png` |
| 48 | es-MX | 6. 06-notes.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/06-notes.png` |
| 49 | es-MX | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 50 | fr-FR | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/01-scan-syllabus.png` |
| 51 | fr-FR | 2. 02-semester-health.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/02-semester-health.png` |
| 52 | fr-FR | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/03-plan-autopilot.png` |
| 53 | fr-FR | 4. 04-manage-semester.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/04-manage-semester.png` |
| 54 | fr-FR | 5. 05-class-detail.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/05-class-detail.png` |
| 55 | fr-FR | 6. 06-notes.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/06-notes.png` |
| 56 | fr-FR | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 57 | fr-CA | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/01-scan-syllabus.png` |
| 58 | fr-CA | 2. 02-semester-health.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/02-semester-health.png` |
| 59 | fr-CA | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/03-plan-autopilot.png` |
| 60 | fr-CA | 4. 04-manage-semester.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/04-manage-semester.png` |
| 61 | fr-CA | 5. 05-class-detail.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/05-class-detail.png` |
| 62 | fr-CA | 6. 06-notes.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/06-notes.png` |
| 63 | fr-CA | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 64 | pt-BR | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/01-scan-syllabus.png` |
| 65 | pt-BR | 2. 02-semester-health.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/02-semester-health.png` |
| 66 | pt-BR | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/03-plan-autopilot.png` |
| 67 | pt-BR | 4. 04-manage-semester.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/04-manage-semester.png` |
| 68 | pt-BR | 5. 05-class-detail.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/05-class-detail.png` |
| 69 | pt-BR | 6. 06-notes.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/06-notes.png` |
| 70 | pt-BR | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 71 | pt-PT | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/01-scan-syllabus.png` |
| 72 | pt-PT | 2. 02-semester-health.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/02-semester-health.png` |
| 73 | pt-PT | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/03-plan-autopilot.png` |
| 74 | pt-PT | 4. 04-manage-semester.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/04-manage-semester.png` |
| 75 | pt-PT | 5. 05-class-detail.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/05-class-detail.png` |
| 76 | pt-PT | 6. 06-notes.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/06-notes.png` |
| 77 | pt-PT | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 78 | ja | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/01-scan-syllabus.png` |
| 79 | ja | 2. 02-semester-health.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/02-semester-health.png` |
| 80 | ja | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/03-plan-autopilot.png` |
| 81 | ja | 4. 04-manage-semester.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/04-manage-semester.png` |
| 82 | ja | 5. 05-class-detail.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/05-class-detail.png` |
| 83 | ja | 6. 06-notes.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/06-notes.png` |
| 84 | ja | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 85 | ko | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/01-scan-syllabus.png` |
| 86 | ko | 2. 02-semester-health.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/02-semester-health.png` |
| 87 | ko | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/03-plan-autopilot.png` |
| 88 | ko | 4. 04-manage-semester.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/04-manage-semester.png` |
| 89 | ko | 5. 05-class-detail.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/05-class-detail.png` |
| 90 | ko | 6. 06-notes.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/06-notes.png` |
| 91 | ko | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 92 | zh-Hans | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/01-scan-syllabus.png` |
| 93 | zh-Hans | 2. 02-semester-health.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/02-semester-health.png` |
| 94 | zh-Hans | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/03-plan-autopilot.png` |
| 95 | zh-Hans | 4. 04-manage-semester.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/04-manage-semester.png` |
| 96 | zh-Hans | 5. 05-class-detail.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/05-class-detail.png` |
| 97 | zh-Hans | 6. 06-notes.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/06-notes.png` |
| 98 | zh-Hans | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 99 | zh-Hant | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/01-scan-syllabus.png` |
| 100 | zh-Hant | 2. 02-semester-health.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/02-semester-health.png` |
| 101 | zh-Hant | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/03-plan-autopilot.png` |
| 102 | zh-Hant | 4. 04-manage-semester.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/04-manage-semester.png` |
| 103 | zh-Hant | 5. 05-class-detail.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/05-class-detail.png` |
| 104 | zh-Hant | 6. 06-notes.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/06-notes.png` |
| 105 | zh-Hant | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 106 | hi | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/01-scan-syllabus.png` |
| 107 | hi | 2. 02-semester-health.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/02-semester-health.png` |
| 108 | hi | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/03-plan-autopilot.png` |
| 109 | hi | 4. 04-manage-semester.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/04-manage-semester.png` |
| 110 | hi | 5. 05-class-detail.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/05-class-detail.png` |
| 111 | hi | 6. 06-notes.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/06-notes.png` |
| 112 | hi | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/07-real-home-screen-widgets.png` |
| 113 | ar-SA | 1. 01-scan-syllabus.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/01-scan-syllabus.png` |
| 114 | ar-SA | 2. 02-semester-health.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/02-semester-health.png` |
| 115 | ar-SA | 3. 03-plan-autopilot.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/03-plan-autopilot.png` |
| 116 | ar-SA | 4. 04-manage-semester.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/04-manage-semester.png` |
| 117 | ar-SA | 5. 05-class-detail.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/05-class-detail.png` |
| 118 | ar-SA | 6. 06-notes.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/06-notes.png` |
| 119 | ar-SA | 7. 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/07-real-home-screen-widgets.png` |

## Run Method

For each item in the JSON queue: attach that item's source PNG in ChatGPT Mac app, paste that item's `prompt`, generate with GPT Image 2.0, and accept only if the output passes the rejection gates above. Save accepted outputs separately until visual QA passes.

Do not batch multiple slides into one prompt. The point of this queue is one screenshot, one edit prompt, one acceptance check.
