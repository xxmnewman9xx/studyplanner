# In-App Events: StudyPlanner 2.2

- **Source:** MASTER_PLAN §A5 (events by region). This reuses the Back-to-School workflow in `docs/launch/back-to-school-2026/in-app-event-draft.md`: same media rules, and events are attached to a featuring nomination only after approval.
- **All actions here are owner actions in ASC:** create the event, localize it, set region availability, upload media, and submit it with (or after) the 2.2 build.

## Apple limits used
- **Text:** event name ≤ 30 characters, short description ≤ 50, long description ≤ 120. All strings below were length-checked.
- **Timing:** an event runs ≤ 31 days. Promotion can start up to 14 days before the event.
- **Media:** an event card (1920×1080) and a details image or video (1080×1920). Use real app UI only.
- **Rule:** an event must promote content that exists in the live version. **Do not publish either event until 2.2 is approved and live**, because both lead into the Crunch Forecast.

## Deep links
- **Syllabus Week:** `studyplanner://scan`, a route already handled by `routeFromUrl`.
- **Finals Crunch:** `studyplanner://scan` for now. Switch to a `forecast` route **only if** 2.2 adds one and it's tested. **[verify]**

---

## 1. "Finals Crunch"
- **Badge:** Challenge
- **Reference name:** `Finals Crunch Fall 2026`
- **Purpose:** turn finals anxiety into a free forecast, which is the aha moment before the paywall.

| Locale | Event name (≤30) | Short description (≤50) | Long description (≤120) |
|---|---|---|---|
| en-US | Finals Crunch | See your red weeks before finals hit | Scan every syllabus free, spot your heaviest finals weeks and get a start date for every exam. Practice from your notes. |
| es-MX | Temporada de Finales | Ve tus semanas rojas antes de los finales | Escanea tus temarios gratis, detecta tus semanas más pesadas y recibe una fecha para empezar cada final. |
| pt-BR | Reta Final de Provas | Veja as semanas puxadas antes das provas | Escaneie as ementas grátis, descubra as semanas mais puxadas e saiba quando começar a estudar para cada prova. |
| ja | 期末試験ラストスパート | 期末前の忙しい週を先回りでチェック | シラバスを無料でスキャンして、期末の山場の週を確認。試験ごとに勉強を始める日もわかります。 |
| ko | 기말고사 대비 주간 | 기말 전에 바쁜 주를 미리 확인하세요 | 강의계획서를 무료로 스캔하고 기말 전 가장 바쁜 주와 시험별 시작일을 확인하세요. |
| de-DE | Klausurphase im Griff | Sieh deine Stresswochen vor den Klausuren | Scanne Kurspläne gratis, erkenne die härtesten Wochen der Klausurphase und bekomme für jede Klausur einen Starttermin. |
| fr-FR | Objectif partiels | Repérez vos semaines de rush avant les partiels | Scannez vos syllabus gratuitement, repérez les semaines les plus chargées et obtenez une date de départ par partiel. |

**Schedule by region.** Create one event per window, reuse the localizations, and restrict availability to the listed storefronts.

| Window | Storefronts | Promo start | Event | Notes |
|---|---|---|---|---|
| Fall 2026 | US, CA | Nov 2, 2026 | **Nov 16 – Dec 16, 2026** | Needs 2.2 live by **Nov 9** (MASTER_PLAN target). If 2.2 isn't approved by **Nov 5**, move the start to Nov 30 (event Nov 30 – Dec 18). |
| Fall 2026 | KR (기말고사, mid-Dec) | Nov 23 | Nov 30 – Dec 18, 2026 | |
| Fall 2026 | MX, BR (finales / provas finais) | Nov 9 | Nov 23 – Dec 18, 2026 | |
| Winter 2027 | FR (partiels, January) | Dec 21 | Jan 4 – Jan 24, 2027 | |
| Winter 2027 | DE (Klausurphase) | Jan 11 | Jan 25 – Feb 21, 2027 | |
| Winter 2027 | JP (期末試験, late Jan) | Jan 4 | Jan 12 – Feb 5, 2027 | |
| Spring 2027 | US, CA | Apr 5 | **Apr 19 – May 14, 2027** | |

## 2. "Syllabus Week"
- **Badge:** New Season
- **Reference name:** `Syllabus Week <Region> <Term>`
- **Purpose:** term-start acquisition. Scanning, review, the forecast, and Class Pack import are all free.

| Locale | Event name (≤30) | Short description (≤50) | Long description (≤120) |
|---|---|---|---|
| en-US | Syllabus Week | Scan every syllabus. See your whole term. | Import every class free with camera, PDF or paste. Review each deadline and see your semester's crunch weeks. |
| es-MX | Semana de Temarios | Escanea tus temarios y ve todo el semestre | Importa todas tus materias gratis con cámara, PDF o texto. Revisa cada fecha y ve las semanas pesadas. |
| pt-BR | Semana das Ementas | Escaneie as ementas e veja o semestre todo | Importe todas as matérias grátis com câmera, PDF ou texto. Revise cada prazo e veja as semanas puxadas. |
| ja | 新学期シラバス週間 | シラバスをスキャンして学期全体を把握 | カメラ・PDF・テキストで全授業を無料で取り込み。締め切りを確認して、学期の忙しい週を先に把握。 |
| ko | 개강 강의계획서 주간 | 강의계획서 스캔하고 학기 전체를 한눈에 | 카메라, PDF, 텍스트로 모든 수업을 무료로 가져오세요. 마감일을 확인하고 이번 학기 바쁜 주를 미리 보세요. |
| de-DE | Semesterstart-Woche | Kurspläne scannen, ganzes Semester sehen | Importiere alle Kurse kostenlos per Kamera, PDF oder Text. Prüfe jede Frist und sieh die Stresswochen. |
| fr-FR | Semaine de la rentrée | Scannez vos syllabus, voyez tout le semestre | Importez tous vos cours gratuitement : photo, PDF ou texte. Vérifiez chaque échéance et repérez les semaines de rush. |

**Schedule by region** (MASTER_PLAN §A5: US/CA Aug–Sep and Jan; AU/BR Feb–Mar; JP/KR Mar–Apr; plus DE/FR term starts):

| Window | Storefronts | Promo start | Event |
|---|---|---|---|
| Spring 2027 | US, CA | Dec 28, 2026 | Jan 11 – Jan 31, 2027 |
| Sem. 1 2027 | KR (개강, Mar 2) | Feb 15 | Feb 22 – Mar 14, 2027 |
| Sem. 1 2027 | BR (after Carnaval) | Feb 15 | Feb 22 – Mar 19, 2027 |
| Sem. 1 2027 | AU (O-Week, late Feb) | Feb 8 | Feb 15 – Mar 12, 2027 |
| Sommersemester 2027 | DE (lectures from mid-Apr) | Mar 29 | Apr 12 – Apr 30, 2027 |
| New year 2027 | JP (新学期, April) | Mar 22 | Apr 1 – Apr 25, 2027 |
| Fall 2027 | US, CA, FR (rentrée) | Aug 9 | Aug 23 – Sep 19, 2027 |

**Language coverage.** For storefronts whose language isn't localized above (AU uses en-US, and so on), ASC falls back to the primary language. If an event runs in a no-AI market (zh-Hans, hi, ar), use the Syllabus Week text, which makes no AI claims. Finals Crunch en-US says "Practice from your notes", which is fine for AI-claim locales only.

## 3. Media brief (both events)
- **Card (1920×1080):**
  - Finals Crunch: a real Crunch Forecast capture with one red week, on a solid brand background, with the event name set outside the UI.
  - Syllabus Week: a real Review Import capture showing "43 found" (or whatever the real count is).
- **Details (1080×1920):** a 10–15 s cut of App Preview beats 2–3 (APP_PREVIEW_2.2.md §2), captions only, no logo.
- **Rules:** no invented screens, no fake widgets, and no Apple logo or "Apple Intelligence" wording in event media.
- **Location:** save the media to `docs/launch/2.2-events/media/` with a provenance JSON, the same way as the Back-to-School media manifest. **[owner]**

## 4. Owner checklist (ASC)
1. Wait for 2.2 approval, then create "Finals Crunch Fall 2026" (US, CA) and add the 7 localizations above.
2. Upload the media, set the deep link, and submit the event.
3. Once the event is approved, attach it to the 2.2 Featuring Nomination (COMPETITIVE_RESEARCH_2026-09.md rec. 8).
4. Queue the remaining windows as drafts. Re-check each date against the region's academic calendar before submitting.
