# Custom Product Page and Ad Variation Briefs

Use custom product pages only where the App Store listing and screenshots already support the claim. Apple allows custom product pages to vary screenshots, promotional text, and app previews, and Apple Ads can use them for Search tab and search results ad variations.

Sources:

- https://developer.apple.com/app-store/custom-product-pages/
- https://ads.apple.com/app-store/help/ads/0077-create-ad-variations

## CPP 1: Assignments And Deadlines

ID: `cpp_assignments`

Primary markets: `es-MX`, `pt-BR`, `en-US`

Expansion locales: `ja`, `ko`, `fr-FR`, `de-DE`

Use with ad groups:

- `Category_Assignments_Exact`
- `Brand_Exact`

Message:

- English: Turn class chaos into checked assignments.
- Spanish MX: Convierte temarios en tareas revisadas.
- Portuguese BR: Transforme ementas em tarefas revisadas.
- Japanese: 課題と締切を確認してから計画に。
- Korean: 과제와 마감일을 확인한 뒤 계획하세요.
- French FR: Transformez les cours en devoirs vérifiés.
- German DE: Mach aus Kursplänen geprüfte Aufgaben.

Screenshot order:

1. `01-scan-syllabus`
2. `03-plan-autopilot`
3. `04-manage-semester`
4. `05-class-detail`

Deep link: `studyplanner://today`

Do not say:

- automatic submission
- guaranteed extraction
- Canvas or school-account sync

## CPP 2: Class Schedule And Semester Control

ID: `cpp_class_schedule`

Primary markets: `es-MX`, `pt-BR`, `en-US`, `fr-FR`, `de-DE`

Expansion locales: `ja`, `ko`

Use with ad groups:

- `Category_Class_Schedule_Exact`
- schedule/calendar/timetable terms

Message:

- English: Keep every class easier to track.
- Spanish MX: Organiza clases, fechas y entregas.
- Portuguese BR: Veja aulas, prazos e provas com clareza.
- French FR: Gardez cours, devoirs et dates au clair.
- German DE: Behalte Kurse, Fristen und Prüfungen im Blick.
- Japanese: 授業、締切、試験を見やすく整理。
- Korean: 수업, 마감일, 시험을 한눈에 정리.

Screenshot order:

1. `02-semester-health`
2. `04-manage-semester`
3. `05-class-detail`
4. `06-notes`

Deep link: `studyplanner://courses`

## CPP 3: Exam Study And Focus

ID: `cpp_exam_study`

Primary markets: `es-MX`, `pt-BR`, `ja`, `ko`, `fr-FR`, `de-DE`

Use with ad groups:

- `Category_Study_Exams_Exact`
- exam/revision/study-plan terms

Message:

- English: Plan study time before weeks get heavy.
- Spanish MX: Prepara exámenes con sesiones claras.
- Portuguese BR: Planeje estudos antes das semanas cheias.
- Japanese: 試験前の勉強計画を見える化。
- Korean: 시험 전 공부 계획을 한눈에.
- French FR: Préparez vos révisions avant les semaines chargées.
- German DE: Plane Lernzeiten vor vollen Wochen.

Screenshot order:

1. `02-semester-health`
2. `07-focus`
3. `06-notes`
4. `04-manage-semester`

Deep link: `studyplanner://study`

## Launch Rule

Create all three CPPs for the first Spanish/Brazil tests because launch keywords already map to assignments, class schedule, and exam-study intent. If App Store Connect setup time is constrained, remove or pause schedule/calendar keywords until `cpp_class_schedule` is approved.
