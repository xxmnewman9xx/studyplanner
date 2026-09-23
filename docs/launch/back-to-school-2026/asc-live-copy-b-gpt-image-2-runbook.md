# ASC Live Copy B GPT Image 2.0 Runbook

Generated: 2026-07-07
Release: Back-to-School Semester Kickoff

## Rule

Copy A is only the current live App Store Connect preview set referenced by `store.config.json -> apple.info[*].screenshots.APP_IPHONE_65`.

Copy B must be generated in GPT Image 2.0 from those live ASC preview images, one image at a time. Do not use older local preview variants, draft composers, social assets, event media, or non-ASC screenshots as inputs.

Current live test status: `en-US-01` was prompted successfully in the ChatGPT Mac app, but both generated candidates were rejected because ChatGPT returned `853x1844` output instead of the required `1242x2688`. A follow-up export/cache probe did not find a full-resolution file. Do not mass-send the full queue until one candidate passes the acceptance gate.

## Test Hypothesis

Back-to-school conversion should improve when the first visible preview copy names the exact student outcome: start school organized, review every deadline, turn homework into scheduled study time, and keep the next school-day answer visible.

This is a copy treatment, not a UI treatment. The real app UI, phone screenshot, Home Screen, WidgetKit content, app icon, course data, dates, and screenshot geometry stay locked.

## GPT Image 2.0 Method

For each item:

1. Open the source PNG from the `sourcePath`.
2. Attach only that PNG in the ChatGPT Mac app.
3. Paste the matching `prompt` from `qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.json` or `qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.jsonl`.
4. Generate exactly one Copy B candidate.
5. Save accepted output to `store/apple/screenshot-copy-b/{locale}/APP_IPHONE_65/{slideFile}`.
6. Reject and regenerate if any locked product UI/Home Screen/widget pixel changes.

Generated outputs remain candidates until visual QA confirms exact locked-pixel preservation, correct localized external text, and 1242x2688 dimensions.

No local renderer, older draft compositor, social asset, or manual rebuild may be used to create Copy B. If GPT Image 2.0 cannot return an accepted file, Copy B remains ungenerated.

## PPO Setup

Use Product Page Optimization with one treatment:

- Control: current live ASC previews, Copy A.
- Treatment: Copy B screenshots generated from this queue.
- Change screenshots only. Keep icon, subtitle, description, and app preview video unchanged for this first read.
- If traffic is low, test en-US first with all seven B frames; if traffic is sufficient, localize the treatment across all 17 locales.
- Run at least 14 days unless App Store Connect reaches a clear confidence result earlier. Apply only if Apple reports the treatment is performing better with at least 90% confidence and downstream activation does not drop.

## Priority

Minimum usage, maximum leverage order:

1. Generate and QA `en-US-01`.
2. Continue only if the candidate is exactly `1242x2688` and passes locked-pixel QA.
3. Generate and QA `en-US-02` and `en-US-03`.
4. If those pass, generate all remaining en-US frames.
5. Fan out all locales using the same per-item prompts.
6. Upload Copy B as one PPO treatment.

## Acceptance Gate

Reject if any output:

- Changes app UI, widget UI, Home Screen pixels, dates, course labels, status bar content, app icon, phone geometry, or screenshot boundary.
- Adds fake widgets, notifications, lock screens, app screens, LMS integrations, school names, prices, ratings, awards, or unsupported claims.
- Truncates, misspells, mistranslates, or invents external Copy B text.
- Changes dimensions away from 1242x2688.
- Looks like a loud ad instead of premium App Store preview creative.

## Queue

| ID | Slide | Source | Copy B headline |
| --- | --- | --- | --- |
| ar-SA-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/01-scan-syllabus.png` | ابدأ الدراسة وأنت منظم. / من المنهج إلى خطة الأسبوع الأول. |
| ar-SA-02 | 02-semester-health.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/02-semester-health.png` | لا تفوّت ما يهم. / اليوم والمواعيد والاختبارات في عرض واحد. |
| ar-SA-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/03-plan-autopilot.png` | لواجباتك وقت محدد. / حوّل المواعيد إلى جلسات دراسة. |
| ar-SA-04 | 04-manage-semester.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/04-manage-semester.png` | أسبوعك الدراسي متصل. / المواد والمهام والتذكيرات والملاحظات معًا. |
| ar-SA-05 | 05-class-detail.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/05-class-detail.png` | اعرف ما تحتاجه كل مادة. / واجبات واختبارات وملاحظات وتقدم معًا. |
| ar-SA-06 | 06-notes.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/06-notes.png` | حوّل الملاحظات إلى خطوات. / التقط الأفكار. أنشئ مهام مراجعة. ابق جاهزًا. |
| ar-SA-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ar-SA/APP_IPHONE_65/07-real-home-screen-widgets.png` | إجابات اليوم الدراسي على الشاشة الرئيسية. / أدوات مصغّرة حقيقية تعرض التالي قبل فتح التطبيق. |
| de-DE-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/01-scan-syllabus.png` | Starte organisiert ins Semester. / Vom Kursplan zum Plan für Woche eins. |
| de-DE-02 | 02-semester-health.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/02-semester-health.png` | Verpasse nicht, was zählt. / Heute, Fristen und Prüfungen in einer Ansicht. |
| de-DE-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/03-plan-autopilot.png` | Hausaufgaben bekommen Zeit. / Mach aus Abgaben klare Lernblöcke. |
| de-DE-04 | 04-manage-semester.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/04-manage-semester.png` | Deine Schulwoche bleibt verbunden. / Kurse, Aufgaben, Erinnerungen und Notizen zusammen. |
| de-DE-05 | 05-class-detail.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/05-class-detail.png` | Wisse, was jeder Kurs braucht. / Aufgaben, Prüfungen, Notizen und Fortschritt zusammen. |
| de-DE-06 | 06-notes.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/06-notes.png` | Notizen werden nächste Schritte. / Ideen erfassen. Wiederholung planen. Bereit bleiben. |
| de-DE-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/de-DE/APP_IPHONE_65/07-real-home-screen-widgets.png` | Schultag-Antworten auf dem Home-Bildschirm. / Echte Widgets zeigen, was als Nächstes kommt. |
| en-AU-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/01-scan-syllabus.png` | Start term already organised. / From syllabus to first-week plan. |
| en-AU-02 | 02-semester-health.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/02-semester-health.png` | Never miss what matters. / Today, deadlines, and exams in one view. |
| en-AU-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/03-plan-autopilot.png` | Your homework has a time. / Turn due dates into study blocks. |
| en-AU-04 | 04-manage-semester.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/04-manage-semester.png` | Your school week, connected. / Classes, tasks, reminders, and notes stay together. |
| en-AU-05 | 05-class-detail.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/05-class-detail.png` | Know what each class needs. / Assignments, exams, notes, and progress together. |
| en-AU-06 | 06-notes.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/06-notes.png` | Turn notes into next steps. / Capture ideas. Make review tasks. Stay ready. |
| en-AU-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-AU/APP_IPHONE_65/07-real-home-screen-widgets.png` | School day answers, on Home Screen. / Real widgets show what is next before you open the app. |
| en-CA-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/01-scan-syllabus.png` | Start term already organized. / From course outline to first-week plan. |
| en-CA-02 | 02-semester-health.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/02-semester-health.png` | Never miss what matters. / Today, deadlines, and exams in one view. |
| en-CA-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/03-plan-autopilot.png` | Your homework has a time. / Turn due dates into study blocks. |
| en-CA-04 | 04-manage-semester.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/04-manage-semester.png` | Your school week, connected. / Classes, tasks, reminders, and notes stay together. |
| en-CA-05 | 05-class-detail.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/05-class-detail.png` | Know what each class needs. / Assignments, exams, notes, and progress together. |
| en-CA-06 | 06-notes.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/06-notes.png` | Turn notes into next steps. / Capture ideas. Make review tasks. Stay ready. |
| en-CA-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-CA/APP_IPHONE_65/07-real-home-screen-widgets.png` | School day answers, on Home Screen. / Real widgets show what is next before you open the app. |
| en-GB-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/01-scan-syllabus.png` | Start term already organised. / From syllabus to first-week plan. |
| en-GB-02 | 02-semester-health.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/02-semester-health.png` | Never miss what matters. / Today, deadlines, and exams in one view. |
| en-GB-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/03-plan-autopilot.png` | Your homework has a time. / Turn due dates into study blocks. |
| en-GB-04 | 04-manage-semester.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/04-manage-semester.png` | Your school week, connected. / Classes, tasks, reminders, and notes stay together. |
| en-GB-05 | 05-class-detail.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/05-class-detail.png` | Know what each class needs. / Assignments, exams, notes, and progress together. |
| en-GB-06 | 06-notes.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/06-notes.png` | Turn notes into next steps. / Capture ideas. Make revision tasks. Stay ready. |
| en-GB-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-GB/APP_IPHONE_65/07-real-home-screen-widgets.png` | School day answers, on Home Screen. / Real widgets show what is next before you open the app. |
| en-US-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/01-scan-syllabus.png` | Start school already organized. / From syllabus to first-week plan. |
| en-US-02 | 02-semester-health.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/02-semester-health.png` | Never miss what matters. / Today, deadlines, and exams in one view. |
| en-US-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/03-plan-autopilot.png` | Your homework has a time. / Turn due dates into study blocks. |
| en-US-04 | 04-manage-semester.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/04-manage-semester.png` | Your school week, connected. / Classes, tasks, reminders, and notes stay together. |
| en-US-05 | 05-class-detail.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/05-class-detail.png` | Know what each class needs. / Assignments, exams, notes, and progress together. |
| en-US-06 | 06-notes.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/06-notes.png` | Turn notes into next steps. / Capture ideas. Make review tasks. Stay ready. |
| en-US-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/en-US/APP_IPHONE_65/07-real-home-screen-widgets.png` | School day answers, on Home Screen. / Real widgets show what is next before you open the app. |
| es-ES-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/01-scan-syllabus.png` | Empieza el curso ya organizado. / De guía docente a plan de primera semana. |
| es-ES-02 | 02-semester-health.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/02-semester-health.png` | No pierdas lo importante. / Hoy, entregas y exámenes en una vista. |
| es-ES-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/03-plan-autopilot.png` | Tus deberes tienen hora. / Convierte entregas en bloques de estudio. |
| es-ES-04 | 04-manage-semester.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/04-manage-semester.png` | Tu semana de clase, conectada. / Clases, tareas, recordatorios y notas juntos. |
| es-ES-05 | 05-class-detail.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/05-class-detail.png` | Ve qué necesita cada clase. / Tareas, exámenes, notas y progreso juntos. |
| es-ES-06 | 06-notes.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/06-notes.png` | Tus notas pasan a pasos. / Captura ideas. Crea repaso. Llega preparado. |
| es-ES-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/es-ES/APP_IPHONE_65/07-real-home-screen-widgets.png` | Respuestas del día en Inicio. / Widgets reales muestran qué sigue antes de abrir la app. |
| es-MX-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/01-scan-syllabus.png` | Empieza clases ya organizado. / Del temario al plan de primera semana. |
| es-MX-02 | 02-semester-health.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/02-semester-health.png` | No pierdas lo importante. / Hoy, entregas y exámenes en una vista. |
| es-MX-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/03-plan-autopilot.png` | Tu tarea tiene hora. / Convierte entregas en bloques de estudio. |
| es-MX-04 | 04-manage-semester.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/04-manage-semester.png` | Tu semana escolar, conectada. / Clases, tareas, recordatorios y notas juntos. |
| es-MX-05 | 05-class-detail.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/05-class-detail.png` | Ve qué necesita cada clase. / Tareas, exámenes, notas y progreso juntos. |
| es-MX-06 | 06-notes.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/06-notes.png` | Tus notas pasan a pasos. / Captura ideas. Crea repaso. Llega preparado. |
| es-MX-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/es-MX/APP_IPHONE_65/07-real-home-screen-widgets.png` | Respuestas del día en Inicio. / Widgets reales muestran qué sigue antes de abrir la app. |
| fr-CA-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/01-scan-syllabus.png` | Commence la session bien organisée. / Du plan de cours au plan de première semaine. |
| fr-CA-02 | 02-semester-health.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/02-semester-health.png` | Ne manque plus l'important. / Aujourd'hui, échéances et examens en une vue. |
| fr-CA-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/03-plan-autopilot.png` | Tes travaux ont un créneau. / Transforme les échéances en périodes d'étude. |
| fr-CA-04 | 04-manage-semester.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/04-manage-semester.png` | Ta semaine de cours connectée. / Cours, tâches, rappels et notes restent ensemble. |
| fr-CA-05 | 05-class-detail.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/05-class-detail.png` | Vois ce que chaque cours demande. / Travaux, examens, notes et progrès ensemble. |
| fr-CA-06 | 06-notes.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/06-notes.png` | Les notes deviennent des étapes. / Capture les idées. Prépare la révision. Reste prêt. |
| fr-CA-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/fr-CA/APP_IPHONE_65/07-real-home-screen-widgets.png` | Les réponses du jour sur l'écran d'accueil. / De vrais widgets montrent la suite avant l'ouverture. |
| fr-FR-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/01-scan-syllabus.png` | Commence la rentrée l'esprit clair. / Du syllabus au plan de première semaine. |
| fr-FR-02 | 02-semester-health.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/02-semester-health.png` | Ne rate plus l'important. / Aujourd'hui, échéances et examens en une vue. |
| fr-FR-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/03-plan-autopilot.png` | Tes devoirs ont un créneau. / Transforme les échéances en sessions d'étude. |
| fr-FR-04 | 04-manage-semester.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/04-manage-semester.png` | Ta semaine de cours connectée. / Cours, tâches, rappels et notes restent ensemble. |
| fr-FR-05 | 05-class-detail.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/05-class-detail.png` | Vois ce que chaque cours demande. / Devoirs, examens, notes et progrès ensemble. |
| fr-FR-06 | 06-notes.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/06-notes.png` | Les notes deviennent des étapes. / Capture les idées. Prépare la révision. Reste prêt. |
| fr-FR-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/fr-FR/APP_IPHONE_65/07-real-home-screen-widgets.png` | Les réponses du jour sur l'écran d'accueil. / De vrais widgets montrent la suite avant l'ouverture. |
| hi-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/01-scan-syllabus.png` | स्कूल शुरू होने से पहले व्यवस्थित रहें। / सिलेबस से पहली हफ्ते की योजना तक। |
| hi-02 | 02-semester-health.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/02-semester-health.png` | ज़रूरी काम न छूटे। / आज, समयसीमा और परीक्षा एक जगह। |
| hi-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/03-plan-autopilot.png` | होमवर्क का भी समय हो। / डेडलाइन को पढ़ाई ब्लॉक में बदलें। |
| hi-04 | 04-manage-semester.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/04-manage-semester.png` | आपका स्कूल सप्ताह जुड़ा रहे। / क्लास, कार्य, रिमाइंडर और नोट्स साथ रहें। |
| hi-05 | 05-class-detail.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/05-class-detail.png` | हर क्लास की ज़रूरत जानें। / कार्य, परीक्षा, नोट्स और प्रगति साथ। |
| hi-06 | 06-notes.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/06-notes.png` | नोट्स से अगला कदम बनाएं। / विचार पकड़ें। रिव्यू कार्य बनाएं। तैयार रहें। |
| hi-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/hi/APP_IPHONE_65/07-real-home-screen-widgets.png` | स्कूल दिन के जवाब होम स्क्रीन पर। / असली विजेट ऐप खोलने से पहले अगला कदम दिखाते हैं। |
| ja-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/01-scan-syllabus.png` | 新学期を最初から整理。 / シラバスから1週目の計画へ。 |
| ja-02 | 02-semester-health.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/02-semester-health.png` | 大事な予定を逃さない。 / 今日、締切、試験をひとつの画面で。 |
| ja-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/03-plan-autopilot.png` | 宿題に時間を決める。 / 締切を学習ブロックに変える。 |
| ja-04 | 04-manage-semester.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/04-manage-semester.png` | 学校の1週間をつなげる。 / 授業、タスク、リマインダー、ノートを一緒に。 |
| ja-05 | 05-class-detail.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/05-class-detail.png` | 各授業で必要なことが分かる。 / 課題、試験、ノート、進捗をまとめて。 |
| ja-06 | 06-notes.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/06-notes.png` | ノートを次の行動へ。 / アイデアを記録。復習タスクを作成。準備を維持。 |
| ja-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ja/APP_IPHONE_65/07-real-home-screen-widgets.png` | 学校の日の答えをホーム画面に。 / 実際のウィジェットで次の予定を確認。 |
| ko-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/01-scan-syllabus.png` | 새 학기를 이미 정리된 상태로. / 강의계획서에서 첫 주 계획까지. |
| ko-02 | 02-semester-health.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/02-semester-health.png` | 중요한 일을 놓치지 마세요. / 오늘, 마감, 시험을 한 화면에서. |
| ko-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/03-plan-autopilot.png` | 숙제에도 시간이 있습니다. / 마감을 공부 블록으로 바꾸세요. |
| ko-04 | 04-manage-semester.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/04-manage-semester.png` | 학교 주간이 연결됩니다. / 수업, 할 일, 알림, 노트가 함께 움직입니다. |
| ko-05 | 05-class-detail.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/05-class-detail.png` | 각 수업에 필요한 일을 압니다. / 과제, 시험, 노트, 진행 상황을 함께. |
| ko-06 | 06-notes.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/06-notes.png` | 노트가 다음 단계가 됩니다. / 아이디어를 기록하고 복습 할 일을 만드세요. |
| ko-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/ko/APP_IPHONE_65/07-real-home-screen-widgets.png` | 학교 하루의 답을 홈 화면에. / 실제 위젯이 앱을 열기 전 다음 일을 보여줍니다. |
| pt-BR-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/01-scan-syllabus.png` | Comece as aulas com tudo organizado. / Da ementa ao plano da primeira semana. |
| pt-BR-02 | 02-semester-health.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/02-semester-health.png` | Não perca o que importa. / Hoje, prazos e provas em uma só visão. |
| pt-BR-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/03-plan-autopilot.png` | Sua tarefa tem horário. / Transforme prazos em blocos de estudo. |
| pt-BR-04 | 04-manage-semester.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/04-manage-semester.png` | Sua semana de aulas conectada. / Aulas, tarefas, lembretes e notas juntos. |
| pt-BR-05 | 05-class-detail.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/05-class-detail.png` | Saiba o que cada aula pede. / Tarefas, provas, notas e progresso juntos. |
| pt-BR-06 | 06-notes.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/06-notes.png` | Notas viram próximos passos. / Capture ideias. Crie revisão. Fique pronto. |
| pt-BR-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/pt-BR/APP_IPHONE_65/07-real-home-screen-widgets.png` | Respostas do dia na Tela de Início. / Widgets reais mostram o próximo passo antes de abrir o app. |
| pt-PT-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/01-scan-syllabus.png` | Começa as aulas com tudo organizado. / Do programa ao plano da primeira semana. |
| pt-PT-02 | 02-semester-health.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/02-semester-health.png` | Não percas o que importa. / Hoje, prazos e testes numa só vista. |
| pt-PT-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/03-plan-autopilot.png` | Os trabalhos têm horário. / Transforma prazos em blocos de estudo. |
| pt-PT-04 | 04-manage-semester.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/04-manage-semester.png` | A tua semana de aulas ligada. / Aulas, tarefas, lembretes e notas juntos. |
| pt-PT-05 | 05-class-detail.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/05-class-detail.png` | Sabe o que cada aula pede. / Tarefas, testes, notas e progresso juntos. |
| pt-PT-06 | 06-notes.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/06-notes.png` | Notas viram próximos passos. / Captura ideias. Cria revisão. Fica pronto. |
| pt-PT-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/pt-PT/APP_IPHONE_65/07-real-home-screen-widgets.png` | Respostas do dia no Ecrã principal. / Widgets reais mostram o próximo passo antes de abrir a app. |
| zh-Hans-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/01-scan-syllabus.png` | 开学前就整理好。 / 从课程大纲到第一周计划。 |
| zh-Hans-02 | 02-semester-health.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/02-semester-health.png` | 不再错过重要事项。 / 今天、截止日和考试放在一处。 |
| zh-Hans-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/03-plan-autopilot.png` | 作业也有具体时间。 / 把截止日变成学习时段。 |
| zh-Hans-04 | 04-manage-semester.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/04-manage-semester.png` | 你的上课周保持连接。 / 课程、任务、提醒和笔记放在一起。 |
| zh-Hans-05 | 05-class-detail.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/05-class-detail.png` | 看清每门课需要什么。 / 作业、考试、笔记和进度集中查看。 |
| zh-Hans-06 | 06-notes.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/06-notes.png` | 把笔记变成下一步。 / 记录想法。生成复习任务。保持准备。 |
| zh-Hans-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/zh-Hans/APP_IPHONE_65/07-real-home-screen-widgets.png` | 开学日答案放在主屏幕。 / 真实小组件在打开应用前显示下一步。 |
| zh-Hant-01 | 01-scan-syllabus.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/01-scan-syllabus.png` | 開學前就整理好。 / 從課程大綱到第一週計畫。 |
| zh-Hant-02 | 02-semester-health.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/02-semester-health.png` | 不再錯過重要事項。 / 今天、截止日和考試放在一處。 |
| zh-Hant-03 | 03-plan-autopilot.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/03-plan-autopilot.png` | 作業也有具體時間。 / 把截止日變成讀書時段。 |
| zh-Hant-04 | 04-manage-semester.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/04-manage-semester.png` | 你的上課週保持連接。 / 課程、任務、提醒和筆記放在一起。 |
| zh-Hant-05 | 05-class-detail.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/05-class-detail.png` | 看清每門課需要什麼。 / 作業、考試、筆記和進度集中查看。 |
| zh-Hant-06 | 06-notes.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/06-notes.png` | 把筆記變成下一步。 / 記錄想法。建立複習任務。保持準備。 |
| zh-Hant-07 | 07-real-home-screen-widgets.png | `store/apple/screenshot-pop/zh-Hant/APP_IPHONE_65/07-real-home-screen-widgets.png` | 開學日答案放在主畫面。 / 真實小工具在開啟 App 前顯示下一步。 |
