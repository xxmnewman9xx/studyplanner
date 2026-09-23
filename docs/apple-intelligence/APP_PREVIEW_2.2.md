# App Preview + social cut: StudyPlanner 2.2

- **Source:** MASTER_PLAN §A4. The App Preview uses **beats 2–5 only**, as in-app screen capture, per Guideline 2.3.4 and Apple's App Preview specs. The social cut is separate and does not go in App Store Connect.
- **Status:** storyboard and capture spec. Capture happens on the 2.2 release candidate. **Owner action:** record on device and simulator, edit, and upload in ASC.

## 1. Rules for this preview (don't skip)
1. **Footage.** Every frame is real footage of the 2.2 build. No mock screens, no staged numbers, no device frames or hands, and no other apps' content.
2. **Real counts.** On-screen counts must be real. "43 deadlines" is only valid if the review screen actually reads 43 for the capture fixture (see §4). If it reads another number, change the caption number to match.
3. **Captions.** Captions are overlays, not UI. Keep them short, one per beat, and in the safe area (not over the item being demonstrated).
4. **No AI wording in captions, in any locale.** For **zh-Hans, hi, ar-SA**, the *footage* must also show no AI surfaces: no sparkles badge, no "Found on-device" chips, no brief sentence. Capture those locales on the classic path (Apple Intelligence off, or an ineligible simulator).
5. **Lock Screen beat.** Show only the StudyPlanner widget:
   - no notifications from other apps;
   - a neutral wallpaper;
   - status bar at 9:41, full battery.
   The widget must show real app data.
6. **Length and poster frame.** ≤ 30 s (target 27 s). Set the poster frame to the red-week heatmap frame (about 11 s).
7. **Audio.** Music bed only, with no voice-over, so one edit serves every locale. Only the caption layer changes per locale.

## 2. Storyboard (27 s)

| # | Time | Beat (MASTER_PLAN) | Screen capture | Caption key |
|---|---|---|---|---|
| 1 | 0.0–3.5 | 2: camera scan | Scan tab → **Camera** → shutter on page 1 of the printed fixture → page 2 → page 3. The progress strip ticks ("Page 2 of 3 · 17 found"). | `c1` |
| 2 | 3.5–7.0 | 2: result | Review Import header lands on **"43 found"**, then a fast scroll through items (one table row visibly parsed). | `c2` |
| 3 | 7.0–15.0 | 3: heatmap fills | Tap **See forecast**. The heatmap fills week by week, and one week turns **red**. Tap the red week; the sheet shows "Start Bio on Oct 12". | `c3` |
| 4 | 15.0–21.0 | 4: forecast card shared | Tap **Share**. The card preview (class names hidden) opens the share sheet, with Messages selected in a blank test thread. | `c4` |
| 5 | 21.0–27.0 | 5: Lock Screen widget | Device Lock Screen with the StudyPlanner rectangular widget: "Now: 25 min Bio ch. 7 · exam in 12 days". Hold 2 s, then an optional 1 s cut to the Today screen showing the same line. | `c5` |

Transitions are hard cuts only; beat 3 has one speed ramp (1.5×) through the heatmap fill.

## 3. Captions for all 17 store locales

Rules for this table:
- Target ≤ 32 characters (Latin) or ≤ 16 characters (CJK) per caption.
- Numbers use Western digits in every locale, matching in-app rendering. **[verify for ar]**
- ar-SA captions are right-aligned and placed top-right.

| Locale | c1: scan | c2: result | c3: forecast | c4: share | c5: Lock Screen |
|---|---|---|---|---|---|
| en-US | Scan every syllabus | 43 deadlines. One scan. | See your crunch weeks early | Send it to the group chat | Tonight's plan, on your Lock Screen |
| en-CA | Scan every syllabus | 43 deadlines. One scan. | See your crunch weeks early | Send it to the group chat | Tonight's plan, on your Lock Screen |
| en-GB | Scan every syllabus | 43 deadlines. One scan. | See your crunch weeks early | Send it to the group chat | Tonight's plan on your Lock Screen |
| en-AU | Scan every unit outline | 43 deadlines. One scan. | See your crunch weeks early | Send it to the group chat | Tonight's plan on your Lock Screen |
| es-MX | Escanea todos tus temarios | 43 entregas. Un escaneo. | Ve tus semanas pesadas antes | Mándalo al grupo | El plan de hoy, en tu pantalla bloqueada |
| es-ES | Escanea tus guías docentes | 43 entregas. Un escaneo. | Ve venir tus semanas duras | Pásalo al grupo | El plan de hoy, en la pantalla bloqueada |
| pt-BR | Escaneie todas as ementas | 43 prazos. Um scan. | Veja as semanas puxadas antes | Manda no grupo | O plano de hoje na Tela Bloqueada |
| pt-PT | Digitaliza os teus programas | 43 prazos. Uma digitalização. | Vê as semanas pesadas antes | Envia para o grupo | O plano de hoje no ecrã bloqueado |
| fr-FR | Scannez tous vos syllabus | 43 échéances. Un seul scan. | Voyez venir vos semaines de rush | Envoyez-la au groupe | Le plan du soir sur l’écran verrouillé |
| fr-CA | Numérise tes plans de cours | 43 échéances. Une numérisation. | Vois venir tes semaines rushantes | Envoie-la à ta gang | Le plan du soir sur l’écran verrouillé |
| de-DE | Scanne alle Kurspläne | 43 Fristen. Ein Scan. | Sieh deine Stresswochen früh | Ab in den Gruppenchat | Dein Plan für heute auf dem Sperrbildschirm |
| ja | シラバスをまとめてスキャン | 締め切り43件、スキャン1回 | 忙しい週が先に見える | グループにシェア | 今夜やることをロック画面に |
| ko | 강의계획서를 한 번에 스캔 | 마감 43개, 스캔 한 번 | 바쁜 주를 미리 확인 | 단톡방에 공유 | 오늘 할 일은 잠금 화면에 |
| zh-Hant | 掃描所有課程大綱 | 43 個截止日，一次掃描 | 提前看見爆量週 | 分享到群組 | 今晚要做的事，就在鎖定畫面 |
| zh-Hans ⚑ | 扫描所有课程大纲 | 43 个截止日期，一次扫描 | 提前看到最忙的几周 | 分享到群聊 | 今天做什么，锁屏一看就知道 |
| hi ⚑ | सारे सिलेबस स्कैन करें | 43 डेडलाइन, एक स्कैन | भारी हफ्ते पहले से देखें | ग्रुप में शेयर करें | आज का प्लान, लॉक स्क्रीन पर |
| ar-SA ⚑ | امسح كل خطط المقررات | 43 موعدًا بمسح واحد | شاهد أسابيع الضغط مبكرًا | شاركها مع المجموعة | خطة اليوم على شاشة القفل |

⚑ = no-AI listing. The captions are AI-free everywhere; for ⚑ locales the footage must also be AI-free (rule 4).

**If the ⚑ scan counts differ.** The classic parser may find fewer items than the on-device path. Re-count on the capture device and update `c2` (for example, "38 deadlines"). Never reuse the 43 from en-US.

**Upload priority** (to match store traffic):
1. en-US: also covers en-CA and en-AU if time is short, since ASC falls back to the primary locale.
2. es-MX, pt-BR, ja, ko, de-DE, fr-FR.
3. The rest.

## 4. Capture instructions

**Fixture.** Print a real 3-page course packet to use for all captures, e.g. two syllabi (BIO 201 from APP_REVIEW_NOTES_2.2.md plus a longer CHEM/HIST schedule). Adjust it until the eligible-device import reads exactly the number in `c2`. Keep the PDF in `docs/launch/2.2-preview/fixture/` **[owner creates]**.

| Beat | Where | How |
|---|---|---|
| 1–2 camera scan | **Physical iPhone 15 Pro or later** (the simulator has no camera). For ⚑ locales, turn Apple Intelligence off or use an ineligible iPhone. | Settings → General → Language & Region → set the locale. Record with Control Center Screen Recording, or QuickTime over USB (File → New Movie Recording → select the iPhone) for a clean status bar. |
| 3–4 forecast and share | Simulator (iPhone 16 Pro Max, iOS 26.x) running the 2.2 RC, built with the `back-to-school-sim` EAS profile (`EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1`, simulator-only; never in production) | See the commands below. |
| 5 Lock Screen widget | Physical device, locked, widget added and configured, Focus on (hides notifications) | Record with QuickTime over USB. |

Simulator commands, per locale:
```bash
xcrun simctl boot "iPhone 16 Pro Max"
xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
# per locale, e.g. Japanese (use the matching pair for each locale below)
xcrun simctl terminate booted com.mattnewman.studyplanner
xcrun simctl launch booted com.mattnewman.studyplanner -AppleLanguages "(ja)" -AppleLocale ja_JP
xcrun simctl io booted recordVideo --codec=h264 --force ja-beat3.mov
```

`-AppleLanguages` / `-AppleLocale` pairs:

| Locale | Pair |
|---|---|
| en-US | `(en-US)` `en_US` |
| en-CA | `(en-CA)` `en_CA` |
| en-GB | `(en-GB)` `en_GB` |
| en-AU | `(en-AU)` `en_AU` |
| es-MX | `(es-MX)` `es_MX` |
| es-ES | `(es-ES)` `es_ES` |
| pt-BR | `(pt-BR)` `pt_BR` |
| pt-PT | `(pt-PT)` `pt_PT` |
| fr-FR | `(fr-FR)` `fr_FR` |
| fr-CA | `(fr-CA)` `fr_CA` |
| de-DE | `(de-DE)` `de_DE` |
| ja | `(ja)` `ja_JP` |
| ko | `(ko)` `ko_KR` |
| zh-Hant | `(zh-Hant)` `zh_TW` |
| zh-Hans | `(zh-Hans)` `zh_CN` |
| hi | `(hi)` `hi_IN` |
| ar-SA | `(ar)` `ar_SA` |

**Store locales without their own in-app language.** The app has 10 UI locales plus two store variants in `App.tsx`: **pt-PT** and **zh-Hant**. zh-Hant is rendered from zh-Hans through `zhHansToTaiwan`.
- **pt-PT and zh-Hant:** capture them natively with the flags above.
- **en-CA/GB/AU, es-ES, fr-CA:** these render their parent UI (en-US, es, fr). Reuse the parent-language footage and change only the captions.

The capture deep link (`studyplanner://capture?config=…`) can preload a fixture state, including `locale`, for beats 3–4 on the simulator, as in the Build 57 capture runbook. Only use states produced by a real import of the fixture.

**Export (per Apple App Preview specs):**
- 886×1920 portrait (6.9"/6.5" iPhone slot, matching `APP_IPHONE_65` screenshots), 30 fps, H.264, stereo AAC.
- ≤ 30 s, under 500 MB.
- Burn captions in.
- Poster frame at about 11 s.

## 5. Social cut: 20 s, 9:16, 1080×1920 (not for the App Store)
For TikTok, Reels, and Shorts. Hands and real paper are allowed; every phone screen must still be real app footage.

| Time | Shot | On-screen text (en-US) |
|---|---|---|
| 0–2 s | Five printed syllabi fanned on a desk, then a hand drops the phone on top | "my phone found the week I'm going to cry" |
| 2–6 s | Over-the-shoulder camera scan → Review "43 found" | "43 deadlines. one scan." |
| 6–10 s | Screen recording: PDF import from Files → heatmap fills, one week turns red | "week 14. rip." |
| 10–13 s | Forecast card lands in a group chat (test thread, friends' consent, class names hidden) | "sent to the group chat" |
| 13–16 s | Phone picked up → Lock Screen widget "Now: 25 min Bio ch. 7" | "it tells me what to do tonight" |
| 16–20 s | Control Center → **Airplane Mode on** → Exam Mode quiz from own notes, answering a question | "quizzes from MY notes. offline." |

- **End card (last 0.5 s):** app icon + "StudyPlanner, free to scan".
- **Link:** in bio or as a sticker, using an App Store link with `ct=social` (or per platform `ct=social_tt|social_ig|social_yt`) so ASC Analytics attributes it.
- **Audio:** a trending sound, with the lip-sync/voice line optional. Captions carry the story when muted.
- **Locale variants:** en-US first; es-MX and pt-BR next (translate the captions in the same casual register).
- **No-AI variants (zh-Hans, hi, ar):** replace the 16–20 s airplane-mode quiz with the **Class Pack QR**. A friend scans it and the same deadlines appear: "my whole class has it now".
- **Honesty:** the airplane-mode beat must be recorded on an eligible iPhone with Apple Intelligence on. Don't claim the quiz works on every phone. If a platform asks for a disclosure, add the eligibility line in the caption text.
