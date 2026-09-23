# Reference-Inspired Copy B GPT Image 2.0 Runbook

Generated: 2026-07-07
Release: Back-to-School Semester Kickoff

## Rule

This is the redirected Copy B cycle. Use the current live App Store Connect previews as Copy A/control and as the product UI source of truth. Use the attached Calendly-style references only for composition inspiration.

No fake UI or product drift is acceptable. A visually exciting output that redraws StudyPlanner UI is rejected.

## Source Images Per Prompt

Each queue item attaches two images:

1. The item-specific live ASC preview from `store/apple/screenshot-pop/<locale>/APP_IPHONE_65/`.
2. `qa/back-to-school-2026/reference-inspired-copy-b/references/calendly-style-reference-sheet.png` — style reference only.

## Minimum-Usage Canary Result

Two `refpop-en-US-01` canaries were generated in the ChatGPT Mac app:

- `qa/back-to-school-2026/reference-inspired-copy-b-candidates/refpop-en-US-01-rejected-853x1844-style-first-fake-ui.png`
- `qa/back-to-school-2026/reference-inspired-copy-b-candidates/refpop-en-US-01-rejected-853x1844.png`

Both are rejected: `853x1844` output and fake/redrawn product UI. Do not parallel-send or parallel-collect the remaining queue until a new canary first passes exact `1242x2688` sizing and no-drift product UI QA.

If a future canary passes, parallel-send the first three en-US items with one driver process only, without automated collect, then save/QA candidates one chat at a time.

## Nomination Rule

Do not block the Back-to-School In-App Event nomination on this Copy B cycle. Submit nomination from `docs/launch/back-to-school-2026/app-store-connect-final-upload/`. Use Copy B only as PPO/new preview exploration after a candidate passes QA.

## Queue

| ID | Locale | Slide | Direction | Primary Copy |
| --- | --- | ---: | --- | --- |
| refpop-ar-SA-01 | ar-SA | 1 | Turn any syllabus into a reviewed plan. | ابدأ الدراسة وأنت منظم. |
| refpop-ar-SA-02 | ar-SA | 2 | Know if your semester is on track. | لا تفوّت ما يهم. |
| refpop-ar-SA-03 | ar-SA | 3 | Let deadlines become study blocks. | لواجباتك وقت محدد. |
| refpop-ar-SA-04 | ar-SA | 4 | Keep classes, tasks, and notes together. | أسبوعك الدراسي متصل. |
| refpop-ar-SA-05 | ar-SA | 5 | Know what every class needs. | اعرف ما تحتاجه كل مادة. |
| refpop-ar-SA-06 | ar-SA | 6 | Turn notes into next actions. | حوّل الملاحظات إلى خطوات. |
| refpop-ar-SA-07 | ar-SA | 7 | Keep today on your Home Screen. | إجابات اليوم الدراسي على الشاشة الرئيسية. |
| refpop-de-DE-01 | de-DE | 1 | Turn any syllabus into a reviewed plan. | Starte organisiert ins Semester. |
| refpop-de-DE-02 | de-DE | 2 | Know if your semester is on track. | Verpasse nicht, was zählt. |
| refpop-de-DE-03 | de-DE | 3 | Let deadlines become study blocks. | Hausaufgaben bekommen Zeit. |
| refpop-de-DE-04 | de-DE | 4 | Keep classes, tasks, and notes together. | Deine Schulwoche bleibt verbunden. |
| refpop-de-DE-05 | de-DE | 5 | Know what every class needs. | Wisse, was jeder Kurs braucht. |
| refpop-de-DE-06 | de-DE | 6 | Turn notes into next actions. | Notizen werden nächste Schritte. |
| refpop-de-DE-07 | de-DE | 7 | Keep today on your Home Screen. | Schultag-Antworten auf dem Home-Bildschirm. |
| refpop-en-AU-01 | en-AU | 1 | Turn any syllabus into a reviewed plan. | Start term already organised. |
| refpop-en-AU-02 | en-AU | 2 | Know if your semester is on track. | Never miss what matters. |
| refpop-en-AU-03 | en-AU | 3 | Let deadlines become study blocks. | Your homework has a time. |
| refpop-en-AU-04 | en-AU | 4 | Keep classes, tasks, and notes together. | Your school week, connected. |
| refpop-en-AU-05 | en-AU | 5 | Know what every class needs. | Know what each class needs. |
| refpop-en-AU-06 | en-AU | 6 | Turn notes into next actions. | Turn notes into next steps. |
| refpop-en-AU-07 | en-AU | 7 | Keep today on your Home Screen. | School day answers, on Home Screen. |
| refpop-en-CA-01 | en-CA | 1 | Turn any syllabus into a reviewed plan. | Start term already organized. |
| refpop-en-CA-02 | en-CA | 2 | Know if your semester is on track. | Never miss what matters. |
| refpop-en-CA-03 | en-CA | 3 | Let deadlines become study blocks. | Your homework has a time. |
| refpop-en-CA-04 | en-CA | 4 | Keep classes, tasks, and notes together. | Your school week, connected. |
| refpop-en-CA-05 | en-CA | 5 | Know what every class needs. | Know what each class needs. |
| refpop-en-CA-06 | en-CA | 6 | Turn notes into next actions. | Turn notes into next steps. |
| refpop-en-CA-07 | en-CA | 7 | Keep today on your Home Screen. | School day answers, on Home Screen. |
| refpop-en-GB-01 | en-GB | 1 | Turn any syllabus into a reviewed plan. | Start term already organised. |
| refpop-en-GB-02 | en-GB | 2 | Know if your semester is on track. | Never miss what matters. |
| refpop-en-GB-03 | en-GB | 3 | Let deadlines become study blocks. | Your homework has a time. |
| refpop-en-GB-04 | en-GB | 4 | Keep classes, tasks, and notes together. | Your school week, connected. |
| refpop-en-GB-05 | en-GB | 5 | Know what every class needs. | Know what each class needs. |
| refpop-en-GB-06 | en-GB | 6 | Turn notes into next actions. | Turn notes into next steps. |
| refpop-en-GB-07 | en-GB | 7 | Keep today on your Home Screen. | School day answers, on Home Screen. |
| refpop-en-US-01 | en-US | 1 | Turn any syllabus into a reviewed plan. | Start school already organized. |
| refpop-en-US-02 | en-US | 2 | Know if your semester is on track. | Never miss what matters. |
| refpop-en-US-03 | en-US | 3 | Let deadlines become study blocks. | Your homework has a time. |
| refpop-en-US-04 | en-US | 4 | Keep classes, tasks, and notes together. | Your school week, connected. |
| refpop-en-US-05 | en-US | 5 | Know what every class needs. | Know what each class needs. |
| refpop-en-US-06 | en-US | 6 | Turn notes into next actions. | Turn notes into next steps. |
| refpop-en-US-07 | en-US | 7 | Keep today on your Home Screen. | School day answers, on Home Screen. |
| refpop-es-ES-01 | es-ES | 1 | Turn any syllabus into a reviewed plan. | Empieza el curso ya organizado. |
| refpop-es-ES-02 | es-ES | 2 | Know if your semester is on track. | No pierdas lo importante. |
| refpop-es-ES-03 | es-ES | 3 | Let deadlines become study blocks. | Tus deberes tienen hora. |
| refpop-es-ES-04 | es-ES | 4 | Keep classes, tasks, and notes together. | Tu semana de clase, conectada. |
| refpop-es-ES-05 | es-ES | 5 | Know what every class needs. | Ve qué necesita cada clase. |
| refpop-es-ES-06 | es-ES | 6 | Turn notes into next actions. | Tus notas pasan a pasos. |
| refpop-es-ES-07 | es-ES | 7 | Keep today on your Home Screen. | Respuestas del día en Inicio. |
| refpop-es-MX-01 | es-MX | 1 | Turn any syllabus into a reviewed plan. | Empieza clases ya organizado. |
| refpop-es-MX-02 | es-MX | 2 | Know if your semester is on track. | No pierdas lo importante. |
| refpop-es-MX-03 | es-MX | 3 | Let deadlines become study blocks. | Tu tarea tiene hora. |
| refpop-es-MX-04 | es-MX | 4 | Keep classes, tasks, and notes together. | Tu semana escolar, conectada. |
| refpop-es-MX-05 | es-MX | 5 | Know what every class needs. | Ve qué necesita cada clase. |
| refpop-es-MX-06 | es-MX | 6 | Turn notes into next actions. | Tus notas pasan a pasos. |
| refpop-es-MX-07 | es-MX | 7 | Keep today on your Home Screen. | Respuestas del día en Inicio. |
| refpop-fr-CA-01 | fr-CA | 1 | Turn any syllabus into a reviewed plan. | Commence la session bien organisée. |
| refpop-fr-CA-02 | fr-CA | 2 | Know if your semester is on track. | Ne manque plus l'important. |
| refpop-fr-CA-03 | fr-CA | 3 | Let deadlines become study blocks. | Tes travaux ont un créneau. |
| refpop-fr-CA-04 | fr-CA | 4 | Keep classes, tasks, and notes together. | Ta semaine de cours connectée. |
| refpop-fr-CA-05 | fr-CA | 5 | Know what every class needs. | Vois ce que chaque cours demande. |
| refpop-fr-CA-06 | fr-CA | 6 | Turn notes into next actions. | Les notes deviennent des étapes. |
| refpop-fr-CA-07 | fr-CA | 7 | Keep today on your Home Screen. | Les réponses du jour sur l'écran d'accueil. |
| refpop-fr-FR-01 | fr-FR | 1 | Turn any syllabus into a reviewed plan. | Commence la rentrée l'esprit clair. |
| refpop-fr-FR-02 | fr-FR | 2 | Know if your semester is on track. | Ne rate plus l'important. |
| refpop-fr-FR-03 | fr-FR | 3 | Let deadlines become study blocks. | Tes devoirs ont un créneau. |
| refpop-fr-FR-04 | fr-FR | 4 | Keep classes, tasks, and notes together. | Ta semaine de cours connectée. |
| refpop-fr-FR-05 | fr-FR | 5 | Know what every class needs. | Vois ce que chaque cours demande. |
| refpop-fr-FR-06 | fr-FR | 6 | Turn notes into next actions. | Les notes deviennent des étapes. |
| refpop-fr-FR-07 | fr-FR | 7 | Keep today on your Home Screen. | Les réponses du jour sur l'écran d'accueil. |
| refpop-hi-01 | hi | 1 | Turn any syllabus into a reviewed plan. | स्कूल शुरू होने से पहले व्यवस्थित रहें। |
| refpop-hi-02 | hi | 2 | Know if your semester is on track. | ज़रूरी काम न छूटे। |
| refpop-hi-03 | hi | 3 | Let deadlines become study blocks. | होमवर्क का भी समय हो। |
| refpop-hi-04 | hi | 4 | Keep classes, tasks, and notes together. | आपका स्कूल सप्ताह जुड़ा रहे। |
| refpop-hi-05 | hi | 5 | Know what every class needs. | हर क्लास की ज़रूरत जानें। |
| refpop-hi-06 | hi | 6 | Turn notes into next actions. | नोट्स से अगला कदम बनाएं। |
| refpop-hi-07 | hi | 7 | Keep today on your Home Screen. | स्कूल दिन के जवाब होम स्क्रीन पर। |
| refpop-ja-01 | ja | 1 | Turn any syllabus into a reviewed plan. | 新学期を最初から整理。 |
| refpop-ja-02 | ja | 2 | Know if your semester is on track. | 大事な予定を逃さない。 |
| refpop-ja-03 | ja | 3 | Let deadlines become study blocks. | 宿題に時間を決める。 |
| refpop-ja-04 | ja | 4 | Keep classes, tasks, and notes together. | 学校の1週間をつなげる。 |
| refpop-ja-05 | ja | 5 | Know what every class needs. | 各授業で必要なことが分かる。 |
| refpop-ja-06 | ja | 6 | Turn notes into next actions. | ノートを次の行動へ。 |
| refpop-ja-07 | ja | 7 | Keep today on your Home Screen. | 学校の日の答えをホーム画面に。 |
| refpop-ko-01 | ko | 1 | Turn any syllabus into a reviewed plan. | 새 학기를 이미 정리된 상태로. |
| refpop-ko-02 | ko | 2 | Know if your semester is on track. | 중요한 일을 놓치지 마세요. |
| refpop-ko-03 | ko | 3 | Let deadlines become study blocks. | 숙제에도 시간이 있습니다. |
| refpop-ko-04 | ko | 4 | Keep classes, tasks, and notes together. | 학교 주간이 연결됩니다. |
| refpop-ko-05 | ko | 5 | Know what every class needs. | 각 수업에 필요한 일을 압니다. |
| refpop-ko-06 | ko | 6 | Turn notes into next actions. | 노트가 다음 단계가 됩니다. |
| refpop-ko-07 | ko | 7 | Keep today on your Home Screen. | 학교 하루의 답을 홈 화면에. |
| refpop-pt-BR-01 | pt-BR | 1 | Turn any syllabus into a reviewed plan. | Comece as aulas com tudo organizado. |
| refpop-pt-BR-02 | pt-BR | 2 | Know if your semester is on track. | Não perca o que importa. |
| refpop-pt-BR-03 | pt-BR | 3 | Let deadlines become study blocks. | Sua tarefa tem horário. |
| refpop-pt-BR-04 | pt-BR | 4 | Keep classes, tasks, and notes together. | Sua semana de aulas conectada. |
| refpop-pt-BR-05 | pt-BR | 5 | Know what every class needs. | Saiba o que cada aula pede. |
| refpop-pt-BR-06 | pt-BR | 6 | Turn notes into next actions. | Notas viram próximos passos. |
| refpop-pt-BR-07 | pt-BR | 7 | Keep today on your Home Screen. | Respostas do dia na Tela de Início. |
| refpop-pt-PT-01 | pt-PT | 1 | Turn any syllabus into a reviewed plan. | Começa as aulas com tudo organizado. |
| refpop-pt-PT-02 | pt-PT | 2 | Know if your semester is on track. | Não percas o que importa. |
| refpop-pt-PT-03 | pt-PT | 3 | Let deadlines become study blocks. | Os trabalhos têm horário. |
| refpop-pt-PT-04 | pt-PT | 4 | Keep classes, tasks, and notes together. | A tua semana de aulas ligada. |
| refpop-pt-PT-05 | pt-PT | 5 | Know what every class needs. | Sabe o que cada aula pede. |
| refpop-pt-PT-06 | pt-PT | 6 | Turn notes into next actions. | Notas viram próximos passos. |
| refpop-pt-PT-07 | pt-PT | 7 | Keep today on your Home Screen. | Respostas do dia no Ecrã principal. |
| refpop-zh-Hans-01 | zh-Hans | 1 | Turn any syllabus into a reviewed plan. | 开学前就整理好。 |
| refpop-zh-Hans-02 | zh-Hans | 2 | Know if your semester is on track. | 不再错过重要事项。 |
| refpop-zh-Hans-03 | zh-Hans | 3 | Let deadlines become study blocks. | 作业也有具体时间。 |
| refpop-zh-Hans-04 | zh-Hans | 4 | Keep classes, tasks, and notes together. | 你的上课周保持连接。 |
| refpop-zh-Hans-05 | zh-Hans | 5 | Know what every class needs. | 看清每门课需要什么。 |
| refpop-zh-Hans-06 | zh-Hans | 6 | Turn notes into next actions. | 把笔记变成下一步。 |
| refpop-zh-Hans-07 | zh-Hans | 7 | Keep today on your Home Screen. | 开学日答案放在主屏幕。 |
| refpop-zh-Hant-01 | zh-Hant | 1 | Turn any syllabus into a reviewed plan. | 開學前就整理好。 |
| refpop-zh-Hant-02 | zh-Hant | 2 | Know if your semester is on track. | 不再錯過重要事項。 |
| refpop-zh-Hant-03 | zh-Hant | 3 | Let deadlines become study blocks. | 作業也有具體時間。 |
| refpop-zh-Hant-04 | zh-Hant | 4 | Keep classes, tasks, and notes together. | 你的上課週保持連接。 |
| refpop-zh-Hant-05 | zh-Hant | 5 | Know what every class needs. | 看清每門課需要什麼。 |
| refpop-zh-Hant-06 | zh-Hant | 6 | Turn notes into next actions. | 把筆記變成下一步。 |
| refpop-zh-Hant-07 | zh-Hant | 7 | Keep today on your Home Screen. | 開學日答案放在主畫面。 |
