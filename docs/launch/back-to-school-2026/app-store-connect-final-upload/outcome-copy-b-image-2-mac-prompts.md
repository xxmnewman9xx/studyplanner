# Outcome Copy B - GPT Image 2.0 Mac App Prompt Pack

Status: prepared for manual generation in the ChatGPT Mac app. Do not use the local deterministic renderer for final Copy B.

Copy A/control remains the nomination upload set in `store/apple/screenshot-pop`. Copy B must be generated one image at a time in the ChatGPT Mac app with GPT Image 2.0, using real StudyPlanner UI screenshots and the real app icon as references.

## Source References

Attach the real logo and every listed latest-build UI or direction reference for each prompt:

- Real app icon/logo: `assets/app/study-planner-icon.png`
- Slide-specific latest UI references:
  - Slide 1: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`
  - Slide 1: `qa-screenshots/back-to-school-2026-native-color-system-v3/app-06-review.png`
  - Slide 2: `qa-screenshots/back-to-school-2026-native-color-system-v3/app-06-review.png`
  - Slide 3: `qa-screenshots/back-to-school-2026-native-color-system-v3/app-07-semester-ready.png`
  - Slide 4: `qa-screenshots/back-to-school-2026-native/app-08-today.png`
  - Slide 5: `qa-screenshots/back-to-school-2026-native/app-09-focus.png`
  - Slide 6: `qa-screenshots/back-to-school-2026-native/app-10-widgets.png`
  - Slide 7: `qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png`
- User-provided first-three direction references:
  - Slide 1: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg`
  - Slide 1: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/03-scan-syllabus-direction.jpg`
  - Slide 2: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg`
  - Slide 2: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`
  - Slide 3: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/01-today-next-move-direction.jpg`
  - Slide 3: `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`

Use the approved English Image 2.0 visual direction and the four 2026-07-08 user-provided direction references as composition guidance only: bold black outcome headline at the top, short gray subhead, small StudyPlanner brand mark, large latest-build iPhone UI as the hero, soft realistic phone depth, white rounded App Store canvas, and restrained green/blue/purple/orange semicircle accents at the edges. The preview should feel like the strongest approved Image 2.0 examples: outcome-led, calm, premium, and grounded in real StudyPlanner UI proof. Do not use the direction references as permission to invent product UI.

Do not use the older Copy A/App Store preview UI as Copy B product proof. Reject any output that resembles the old `store/apple/screenshot-pop` first-slide phone UI or the older locked `Build your semester` scan-choice screen. Copy B must be grounded in the latest scan/review/semester-ready UI references above.

Apple reference research makes the first three slides the highest-leverage path: the first one to three screenshots may appear in search results when no app preview is available, and Product Page Optimization can test alternate screenshot treatments. Therefore slides 1-3 must sell the outcome sequence immediately:

1. Syllabus and notes become a reviewed plan.
2. The student approves every deadline before save.
3. The semester is organized and ready to use.

Recommended output root after acceptance:

`store/apple/screenshot-copy-b-image-2/{locale}/APP_IPHONE_65/{slide-file}`

Do not save final Image 2.0 outputs into `store/apple/screenshot-copy-b-outcomes`; that folder is local-render scratch and is not upload-safe.

## Final QA Command

Before manual production, create the per-image queue and provenance template:

```bash
npm run prepare:copy-b-image2-queue
```

This writes:

- `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.jsonl`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.template.json`

After manually saving accepted ChatGPT Mac app outputs, run:

```bash
npm run check:copy-b-image2
```

The gate requires 17 locales x 7 screenshots, exact `1242x2688` PNG dimensions, the required file names, and a human provenance registry at:

`docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json`

Use this entry shape for every locale/slide pair:

```json
{
  "entries": [
    {
      "locale": "en-US",
      "file": "01-scan-syllabus-notes.png",
      "generatedInChatGPTMacApp": true,
      "gptImage2": true,
      "attachedRealLogo": true,
      "attachedRealUiReference": true,
      "generatedIndividually": true,
      "humanAccepted": true,
      "notes": "Checked exact text, real UI, exact logo, no fake claims."
    }
  ]
}
```

## Global Prompt Rules

Use GPT Image 2.0 in the ChatGPT Mac app. Generate exactly one screenshot per prompt. Create a 1242x2688 App Store screenshot.

Use the attached real StudyPlanner UI screenshot as the product proof. Preserve the app UI content exactly enough to remain clearly real StudyPlanner: do not invent fake screens, fake WidgetKit content, fake Home Screen content, fake LMS integrations, fake App Store UI, prices, ratings, awards, school logos, or unsupported claims.

Use the attached real app icon/logo exactly as the brand mark. Do not redraw, restyle, reinterpret, recolor, or replace the logo.

Make the composition premium, Apple-native, bright, calm, student-focused, and conversion-oriented. Use clean white space, graphite structure, soft realistic depth, restrained class-color accents, and high text readability. Avoid loud gradients, decorative orbs, collages, stock-photo drift, or generic AI visuals.

Composition standard:

- Top 20-25%: bold, black, left-aligned headline and a short gray subhead.
- Middle/bottom: one large iPhone or Home Screen/widget proof that dominates the frame.
- Edges: one or two restrained semicircle color accents only; no decorative blobs, gradients, or busy backgrounds.
- The real UI is the conversion proof. Keep it legible, premium, and central.
- The style must be consistent across all seven slides and all 17 locales.

Keep external marketing copy exactly as written for the selected locale. For localized generation, replace only the headline and subhead with the locale copy table below.

Reject any output that changes app UI facts, creates fake UI, clips text, produces the wrong dimensions, uses an altered logo, or makes the visual feel like an ad instead of an App Store preview.

## Seven Individual Prompts

### 1. `01-scan-syllabus-notes.png`

Attach:

- `assets/app/study-planner-icon.png`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`
- `qa-screenshots/back-to-school-2026-native-color-system-v3/app-06-review.png`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/03-scan-syllabus-direction.jpg`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached latest StudyPlanner scan UI and review UI references as product proof and the attached app icon as the exact logo. Use the supplied direction references only for composition. Build a premium Apple-native screenshot around the latest scan/import experience and the reviewed-plan payoff. The first slide must visibly communicate that a student can start from syllabus material or notes, then review the extracted next steps before anything saves. Make notes visible as proof, not only headline copy: include a clean notebook/lecture-notes page beside the syllabus paper, or keep the latest StudyPlanner `Notes` source row legible in the phone UI. Use clean white space, bright desk-light realism, soft device depth, graphite typography, small blue/green/orange class-color accents, and a calm back-to-school feel.

Match the approved Image 2.0 reference system and the 2026-07-08 direction examples: bold top headline, short gray subhead, small StudyPlanner brand mark, one large phone UI hero, white rounded canvas, and restrained edge semicircle accents. The hero should feel like the current Scan flow: Capture anything, Import. Review. Start., upload syllabus PDF, camera/photo capture, notes, then review-before-save. Do not show the older Copy A scan screen or the older locked `Build your semester` UI. Do not invent LMS integrations, guaranteed extraction, fake document text, fake camera UI, or fake review rows. The UI must remain recognizably attached latest StudyPlanner UI, not a fake app screen.

External marketing text:
Headline: Syllabus and notes become a plan.
Subhead: Review next steps before they save.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 2. `02-approve-deadlines.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native-color-system-v3/app-06-review.png`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached latest StudyPlanner review-import UI screenshot as the product proof and the attached app icon as the exact logo. Use the supplied first-three direction references only for composition and scan-context continuity. Make the screenshot feel like the outcome of control: the student sees what was found, confirms it, and keeps bad data out of the plan. Use crisp real UI, highlighted review rows, calm premium composition, white space, soft shadows, and restrained blue/green/orange accents.

Match the approved Image 2.0 reference system and the 2026-07-08 direction examples: bold top headline, short gray subhead, small StudyPlanner brand mark, large phone UI hero, white rounded canvas, and restrained edge semicircle accents. The visual story is: the user approves classes, deadlines, exams, or note tasks before anything reaches the plan. Do not show automatic saving, submission, or LMS sync. Do not show older Copy A scanner UI. Do not invent any app UI beyond the real referenced StudyPlanner screen.

External marketing text:
Headline: Stay in control before save.
Subhead: You confirm what reaches the plan.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 3. `03-semester-built.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native-color-system-v3/app-07-semester-ready.png`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/01-today-next-move-direction.jpg`
- `docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached latest StudyPlanner semester-ready UI screenshot as the product proof and the attached app icon as the exact logo. Use the supplied first-three direction references only for composition and payoff hierarchy. Make the composition feel like the payoff after approval: the semester is organized, the plan is live, and the student can breathe. Use bright Apple-native layout, clean graphite typography, realistic phone depth, and restrained class-color accents.

Match the approved Image 2.0 reference system and the 2026-07-08 direction examples: bold top headline, short gray subhead, small StudyPlanner brand mark, large phone UI hero, white rounded canvas, and restrained edge semicircle accents. The visual story is: reviewed classes, assignments, exams, Today, Plan, and widgets are now connected. Do not claim automatic perfection or guaranteed extraction. Do not show older Copy A scanner UI. Do not invent extra product screens.

External marketing text:
Headline: See the semester take shape.
Subhead: Classes, deadlines, and exams together.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 4. `04-today-next-move.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native/app-08-today.png`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached real StudyPlanner Today UI screenshot as the product proof and the attached app icon as the exact logo. Build a polished App Store preview that makes the next action obvious: Today, deadlines, health, and focus block visible in one calm view. Use bright white space, soft realistic depth, graphite headline type, and subtle blue/green/orange accents.

Match the approved Image 2.0 reference system: bold top headline, short gray subhead, large Today screen hero, white rounded canvas, green and purple edge accents, and calm premium spacing. The visual story is: the student opens the app and knows what to do today. Do not invent fake calendar data, fake notifications, fake charts, or fake school integrations. Keep the UI grounded in the attached real StudyPlanner screenshot.

External marketing text:
Headline: Know what to do today.
Subhead: Health, deadlines, and focus in one view.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 5. `05-study-blocks.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native/app-09-focus.png`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached real StudyPlanner focus/plan UI screenshot as the product proof and the attached app icon as the exact logo. Make the composition communicate calm study planning from real due dates: focus blocks, prepared time, and less Sunday-night pressure. Use clean Apple-native design, precise spacing, soft depth, and restrained blue/green/orange accents.

Match the approved Image 2.0 reference system from the supplied `Plan the week calmly.` example: bold top headline, short gray subhead, large Plan screen hero, white rounded canvas, blue and lavender edge accents, and calm premium spacing. The visual story is: deadlines become study blocks the student can actually follow. Do not claim automatic homework completion, LMS sync, or guaranteed schedules. Do not invent fake app UI.

External marketing text:
Headline: Study without the scramble.
Subhead: Real deadlines become calm study blocks.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 6. `06-widgets-sync.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native/app-10-widgets.png`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached real StudyPlanner widgets screen as the product proof and the attached app icon as the exact logo. Make the screenshot sell the outcome after setup: the reviewed plan keeps showing up where the student needs it, so the school day stays visible without reopening the whole app. Keep it Apple-native, bright, realistic, calm, and premium.

Match the approved Image 2.0 reference system: bold top headline, short gray subhead, large phone UI hero, white rounded canvas, and restrained edge semicircle accents. The visual story is: widgets reflect the reviewed school plan. Do not create fake widgets outside the real product proof. Do not invent extra Home Screen content, fake notifications, or unsupported platform claims.

External marketing text:
Headline: Your plan stays with you.
Subhead: School priorities stay visible.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no fake widgets, no App Store badges, no prices, no ratings.
```

### 7. `07-home-screen-widgets.png`

Attach:

- `assets/app/study-planner-icon.png`
- `qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png`

Prompt:

```text
GPT Image 2.0, create one 1242x2688 App Store screenshot for StudyPlanner.

Use the attached real WidgetKit/Home Screen screenshot as the product proof and the attached app icon as the exact logo. This must read as authentic Home Screen widget proof, not a mockup. Preserve the real widget/Home Screen content enough that it is clearly the attached StudyPlanner WidgetKit proof. Use a premium Apple-native preview frame with clean white space, soft lighting, subtle depth, and restrained class-color accents.

Match the approved Image 2.0 reference system: bold top headline, short gray subhead, large real Home Screen/widget proof, white rounded canvas, and restrained edge semicircle accents. The visual story is: after setup, StudyPlanner stays visible on the Home Screen. Do not invent extra widgets, fake notifications, fake lock screens, fake app icons, or unsupported Home Screen content.

External marketing text:
Headline: See the week at a glance.
Subhead: Today stays close on Home Screen.

Place the real app icon/logo as a small brand mark. Do not redraw or alter it. Keep all text readable and professionally spaced. No fake UI, no App Store badges, no prices, no ratings.
```

## Locale Copy Table

Use the same seven prompts for each locale, replacing only the external marketing text.

| Locale | 1 Headline | 1 Subhead | 2 Headline | 2 Subhead | 3 Headline | 3 Subhead | 4 Headline | 4 Subhead | 5 Headline | 5 Subhead | 6 Headline | 6 Subhead | 7 Headline | 7 Subhead |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| en-US | Syllabus and notes become a plan. | Review next steps before they save. | Stay in control before save. | You confirm what reaches the plan. | See the semester take shape. | Classes, deadlines, and exams together. | Know what to do today. | Health, deadlines, and focus in one view. | Study without the scramble. | Real deadlines become calm study blocks. | Your plan stays with you. | School priorities stay visible. | See the week at a glance. | Today stays close on Home Screen. |
| en-CA | Syllabus and notes become a plan. | Review next steps before they save. | Stay in control before save. | You confirm what reaches the plan. | See the term take shape. | Classes, deadlines, and exams together. | Know what to do today. | Health, deadlines, and focus in one view. | Study without the scramble. | Real deadlines become calm study blocks. | Your plan stays with you. | School priorities stay visible. | See the week at a glance. | Today stays close on Home Screen. |
| en-GB | Syllabus and notes become a plan. | Review next steps before they save. | Stay in control before save. | You confirm what reaches the plan. | See your term take shape. | Classes, deadlines, and exams together. | Know what to do today. | Progress, deadlines, and focus in one view. | Study without the scramble. | Real deadlines become calm study blocks. | Your plan stays with you. | Study priorities stay visible. | See the week at a glance. | Today stays close on Home Screen. |
| en-AU | Syllabus and notes become a plan. | Review next steps before they save. | Stay in control before save. | You confirm what reaches the plan. | See your term take shape. | Classes, deadlines, and exams together. | Know what to do today. | Progress, deadlines, and focus in one view. | Study without the scramble. | Real deadlines become calm study blocks. | Your plan stays with you. | Study priorities stay visible. | See the week at a glance. | Today stays close on Home Screen. |
| de-DE | Kursplan und Notizen werden Plan. | Prüfe Schritte vor dem Speichern. | Du behältst Kontrolle. | Du bestätigst, was in den Plan kommt. | Sieh dein Semester entstehen. | Kurse, Fristen und Prüfungen zusammen. | Wissen, was heute ansteht. | Status, Fristen, Fokus. | Lernen ohne Last-Minute-Stress. | Fristen werden ruhige Lernblöcke. | Dein Plan bleibt synchron. | Studienprioritäten bleiben sichtbar. | Woche im Blick. | Heute auf dem Home-Bildschirm. |
| es-ES | Temario y apuntes se vuelven plan. | Revisa los pasos antes de guardar. | Mantén el control antes de guardar. | Tú confirmas qué llega al plan. | Ve cómo toma forma el curso. | Clases, fechas y exámenes juntos. | Sabe qué hacer hoy. | Progreso, fechas y concentración en una vista. | Estudia sin agobios. | Las fechas reales crean bloques tranquilos. | Tu plan te acompaña. | Tus prioridades siguen visibles. | Ve la semana de un vistazo. | Hoy siempre cerca en la pantalla de inicio. |
| es-MX | Temario y apuntes se vuelven plan. | Revisa los pasos antes de guardar. | Mantén el control antes de guardar. | Tú confirmas qué llega al plan. | Ve cómo toma forma el semestre. | Clases, fechas y exámenes juntos. | Conoce qué hacer hoy. | Avance, fechas y enfoque en una vista. | Estudia sin prisas. | Las fechas reales crean bloques tranquilos. | Tu plan te acompaña. | Tus prioridades siguen visibles. | Ve la semana de un vistazo. | Hoy siempre cerca en la pantalla de inicio. |
| fr-FR | Syllabus et notes deviennent un plan. | Validez avant d'enregistrer. | Gardez le contrôle. | Vous confirmez ce qui rejoint le plan. | Voyez le semestre prendre forme. | Cours, échéances et examens réunis. | Sachez quoi faire aujourd'hui. | État, échéances, focus. | Étudiez sans panique. | Les échéances deviennent des sessions calmes. | Votre plan reste synchronisé. | Vos priorités restent visibles. | La semaine d'un coup d'œil. | Aujourd'hui sur l'écran d'accueil. |
| fr-CA | Syllabus et notes deviennent un plan. | Validez les étapes avant d'enregistrer. | Gardez le contrôle avant d'enregistrer. | Vous confirmez ce qui rejoint le plan. | Voyez la session prendre forme. | Cours, échéances et examens réunis. | Sachez quoi faire aujourd'hui. | État, échéances, focus. | Étudiez sans panique. | Les vraies échéances deviennent des blocs calmes. | Votre plan vous suit. | Vos priorités restent visibles. | Voyez la semaine d'un coup d'œil. | Aujourd'hui reste proche sur l'écran d'accueil. |
| pt-BR | Ementa e notas viram plano. | Revise os passos antes de salvar. | Controle tudo antes de salvar. | Você confirma o que entra no plano. | Veja o semestre tomar forma. | Aulas, prazos e provas juntos. | Saiba o que fazer hoje. | Progresso, prazos e foco. | Estude sem correria. | Prazos reais viram blocos tranquilos. | Seu plano acompanha você. | Prioridades ficam visíveis. | Veja a semana num olhar. | Hoje fica perto na Tela de Início. |
| pt-PT | Do programa e apontamentos nasce o plano. | Reveja os passos antes de guardar. | Confirme antes de guardar. | Só entra no plano o que aprovar. | O semestre ganha forma. | Aulas, prazos e exames juntos. | Saiba o que fazer hoje. | Progresso, prazos e foco. | Estude sem pressa. | Prazos reais tornam-se blocos de estudo. | O plano mantém-se sincronizado. | Prioridades ficam visíveis. | A semana num relance. | Hoje no Ecrã principal. |
| ar-SA | يتحول المنهج والملاحظات إلى خطة. | راجع الخطوات قبل حفظها. | تحكّم قبل الحفظ. | تؤكد ما يدخل إلى الخطة. | شاهد الفصل الدراسي يتشكل. | المواد والمواعيد والاختبارات معًا. | اعرف ما تفعله اليوم. | الحالة والمواعيد والتركيز. | ذاكر بلا ارتباك. | المواعيد تتحول إلى جلسات هادئة. | تبقى خطتك متزامنة. | الأولويات الدراسية تبقى ظاهرة. | الأسبوع بلمحة واحدة. | اليوم على الشاشة الرئيسية. |
| hi | सिलेबस और नोट्स प्लान बनते हैं. | सेव से पहले अगले कदम देखें. | सेव से पहले नियंत्रण रखें. | प्लान में क्या जाए, आप तय करें. | सेमेस्टर को आकार लेते देखें. | क्लास, डेडलाइन और परीक्षाएं साथ में. | आज क्या करना है जानें. | प्रगति, डेडलाइन और फोकस एक जगह. | बिना हड़बड़ी पढ़ें. | असली डेडलाइन शांत स्टडी ब्लॉक बनती हैं. | आपका प्लान साथ रहता है. | पढ़ाई की प्राथमिकताएं दिखती रहती हैं. | सप्ताह एक नज़र में देखें. | आज होम स्क्रीन पर पास रहता है. |
| ja | シラバスとノートが計画に。 | 保存前に次の一歩を確認。 | 保存前に自分で管理。 | 計画に入る内容を確認。 | 学期が形になっていく。 | 授業、締切、試験をまとめて。 | 今日やることがわかる。 | 進捗、締切、集中を一画面で。 | 慌てずに勉強できる。 | 締切が落ち着いた学習枠に。 | 計画が同期される。 | 学習の優先事項が見える。 | 週をひと目で確認。 | 今日の予定をホーム画面に。 |
| ko | 강의계획서와 노트가 계획으로. | 저장 전 다음 할 일을 검토하세요. | 저장 전까지 직접 관리하세요. | 계획에 들어갈 내용을 확인합니다. | 학기 계획이 잡혀갑니다. | 수업, 마감일, 시험을 한곳에. | 오늘 할 일을 알 수 있습니다. | 상태, 마감일, 집중을 한 화면에. | 허둥대지 않고 공부하세요. | 실제 마감일이 차분한 공부 블록이 됩니다. | 계획이 계속 동기화됩니다. | 공부 우선순위가 보입니다. | 한 주를 한눈에 보세요. | 홈 화면에서 오늘을 확인. |
| zh-Hans | 教学大纲和笔记变成计划。 | 保存前先审核下一步。 | 保存前你始终掌控。 | 你确认哪些进入计划。 | 看见学期逐渐成形。 | 课程、截止日期和考试集中管理。 | 知道今天要做什么。 | 进度、截止日期和专注一屏呈现。 | 不再临时抱佛脚。 | 真实截止日期变成从容学习时段。 | 计划保持同步。 | 学习重点始终可见。 | 一眼看清本周。 | 今天就在主屏幕。 |
| zh-Hant | 教學大綱和筆記變成計畫。 | 儲存前先審核下一步。 | 儲存前你始終掌控。 | 你確認哪些進入計畫。 | 看見學期逐漸成形。 | 課程、截止日期和考試集中管理。 | 知道今天要做什麼。 | 進度、截止日期和專注一屏呈現。 | 不再臨時抱佛腳。 | 真實截止日期變成從容學習時段。 | 計畫保持同步。 | 學習重點始終可見。 | 一眼看清本週。 | 今天就在主畫面。 |

## Acceptance Gate

Accept a generated B image only when all are true:

- It was generated individually in the ChatGPT Mac app with GPT Image 2.0.
- It used the real UI screenshot and `assets/app/study-planner-icon.png` as references.
- Output is exactly `1242x2688`.
- Product UI remains credible real StudyPlanner UI, with no fake app screens or fake widgets.
- App icon/logo is exact enough to read as the real supplied logo and is not stylized.
- External headline and subhead match the selected locale row exactly.
- Text fits on `de-DE`, `fr-FR`, `fr-CA`, `pt-PT`, `hi`, `ar-SA`, and CJK locales.
- No unsupported claims: no LMS sync, automatic submission, guaranteed extraction, Apple endorsement, ratings, prices, school names, or App Store chrome.
- A/control remains untouched for nomination upload.
