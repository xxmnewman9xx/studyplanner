# Competitive research: StudyPlanner 2.2 (Sept 2026)

- **Date:** 2026-09-23. **Owner:** growth + localization.
- **Scope:** refresh MASTER_PLAN §A1, paywall/pricing patterns, student-planner ASO terms, Apple's Foundation Models (FM) showcase. Then give recommendations the CEO can act on this week.
- **Method and confidence:** 15 web searches. The egress proxy blocked page fetches for apps.apple.com, apple.com, and most vendor sites. As a result, **every figure below is from search-result summaries of the cited pages (secondary), not from a page I opened.** Confidence labels:
  - **S** = consistent across ≥ 2 sources or taken from the vendor's own page summary.
  - **U** = one secondary source or conflicting sources. Check in a browser before any public comparison.
- **Standing rule:** never put a competitor price or name in store copy or on the paywall. Use these numbers only for internal decisions.

## 1. A1 table, refreshed

| App | Core loop | AI | Price (US) | Conf. | Δ vs MASTER_PLAN A1 |
|---|---|---|---|---|---|
| **Semora: AI Syllabus Scanner** | Syllabus photo/PDF → calendar, grades, GPA what-if | Cloud AI; "one action" cap on free | Free: 2 syllabus scans, 2 courses. Pro **$3.99/mo, $19.99/yr**, 7-day trial on monthly. Joining a classmate's Course Space is listed under Pro. | S (vendor page + App Store snippet) | **Cheaper than A1** ($4.99 / $29.99). Course Spaces look Pro-gated, so our **free** Class Pack import is a real difference. |
| **Sylly: AI Syllabus Scanner** | Camera/photo/PDF, multi-page → review → Apple Calendar export | **Server-side, uses Claude** (per its listing and public GitHub repo) | Free | S | "Server LLM (reported)" is now **verified**. Syllabi leave the phone. |
| New syllabus-to-calendar entrants: SyllySync, SyllaScan, CourseLink: AI Study Planner, PassAI, DormWay | PDF/photo → dates → calendar | Cloud | Free to low $ | U | The category is crowded, and **"AI syllabus scanner" is now a commodity keyword**. Compete on what happens after the scan. |
| **MyStudyLife** | Timetable planner, ~10M students | "AI Schedule Scan" / Schedule Wizard (paywalled) | MyStudyLife+ **$4.99/mo, $29.99/yr**, family plans | S (2 sources) | **Cheaper than A1** ($6.99 / $39.99). Widgets and grades are paywalled too. |
| **Structured** | Day timeline | AI day planning (GPT-4o, cloud), Replan for missed tasks | **$6.99/mo; $29.99–$69.99/yr by region; lifetime $99.99** ($64.99 in some regions) | U (conflicting) | A1's $2.99/mo is outdated. Its "Replan" is the closest thing to our missed-session repair. |
| **Quizlet** | Sets → study modes | Cloud AI, capped daily on Plus | Plus **$7.99/mo, $35.99/yr**; Plus Unlimited **$44.99/yr** | S (multiple) | Caps are now a pricing tier ("Unlimited"). That validates the no-caps message. |
| **Knowt** | Notes/lectures → cards, quizzes | Cloud AI, monthly limits on free | Free with ads; Ultra **$119.99/yr** ($9.99/mo billed yearly) or **$19.99/mo** | S | High price ceiling for "AI study". |
| **Gizmo** | Gamified flashcards (lives, XP, streaks) | Cloud AI | Reports conflict: **$13.99/wk** (student $6.99/wk) or ~$77/yr, vs $8.80/mo / $52.80/yr | U | A **weekly plan** is standard in AI-study apps. |
| **StudyFetch** | Material → tutor (Spark.E), cards | Cloud AI | ~**$12/mo**; App Store snippet shows a **$96/yr** option with trial | U | Pricing page bot-blocked (per source). |
| **Notability** | Notes, recording | Metered AI | Plus **$19.99/yr** (up to **400 AI quizzes/flashcards per month**); Pro **$99.99/yr** | S | A1's "400/mo" is confirmed; its prices changed. |

**Apple's Foundation Models showcase.**
- **Sept 2025 newsroom story:** SmartGym, Stoic, VLLO, SwingVision, 7 Minute Workout, a gratitude journal, and, for education, **CellWalk, Grammo, Platzi**. **No student planner or syllabus app is named.** That keeps whitespace hypothesis #5 alive. [S]
- **WWDC25 demo:** Apple showed a study app generating a **mock quiz from handwritten notes**. Exam Mode is close to Apple's own demo story, which helps the featuring pitch. [S]
- **WWDC26 (June 9, 2026), iOS 27:**
  - The on-device model gains image input.
  - Server models, including third-party Claude and Gemini, are reachable through the same Swift API.
  - Apple's PCC model (32K context) is **free for Small Business Program developers with < 2M first-time downloads**.
  - The framework goes open source. [S, secondary]
- **Implications:**
  - By 2027, "on-device = free inference" stops being unique; rivals will get free PCC too. Our moat has to be the **product loop** (term-wide forecast → start dates → deadline-aware practice) plus **network effects** (Class Pack, Duel), not cost.
  - 2.2 must use `SystemLanguageModel` only. Calling a third-party model through the new API would trigger 5.1.2(i) disclosure and break the "nothing leaves the phone" promise.

**Whitespace check (MASTER_PLAN A1):**

| # | Hypothesis | Status |
|---|---|---|
| 1 | Practice that knows your deadlines | Holds. No rival above ties generated practice to exam dates. |
| 2 | No caps | Holds. Every rival meters AI or tiers it: Quizlet "Unlimited", Notability 400/mo, Semora 2 free scans, Knowt monthly limits. |
| 3 | No account, on-device | Holds, and is sharper now that Sylly is verified as sending syllabi to a cloud LLM. |
| 4 | System surfaces | Holds. None of these rivals markets Lock Screen, Siri, and Spotlight together. |
| 5 | Not in Apple's FM showcase | Holds as of the Sept 2025 list. Not re-checked for a 2026 list, because apple.com was blocked. |

## 2. How top study apps paywall and price

- **Annual-first with a trial is the default** (Semora 7-day, StudyFetch annual trial, Quizlet and Knowt annual as the headline).
- **Weekly plans are normal in AI-study apps** (Gizmo). Planners (MyStudyLife, Semora) don't sell weekly.
- **RevenueCat, State of Subscription Apps 2026** [S]:
  - Median Day-35 trial-to-paid is **10.7% for hard paywalls vs 2.1% for freemium**, down from 12.1% in 2025.
  - Hard paywalls earn about **8× revenue per install at D60** ($3.09 vs $0.38).
  - Year-1 annual retention is about the same (~28%) for both models.
  - Education has the **lowest share of Day-0 trial starts (78.5%)**. Students convert later than users in other categories, so the paywall has to be reachable again after the first session.
- **Takeaway for 2.2:** the free-first change must stay a **delayed hard paywall**. Free covers scan, review, forecast, and share; the planner itself stays locked. That matches CEO_LOG D1. Do not slide into freemium.

**Annual price ranges from these sources:**

| Segment | Annual price |
|---|---|
| Student planners | **$19.99–$29.99** (Semora, MyStudyLife) |
| AI study apps | **$35.99–$119.99** (Quizlet, StudyFetch, Knowt) |

Our Plus spans both segments, so $29.99–$39.99 is defensible. **$59.99 is above everything except Knowt**, which weakens the planned $39.99 vs $59.99 test.

## 3. ASO: student planner category
- **Terms that rank:** homework planner, school planner, college planner, student planner, school schedule, school agenda, college schedule, apps for school. About 249 apps compete on "homework planner". [U: ASO tool summary]
- **"syllabus" / "AI syllabus scanner":** at least 6 new apps now use it in their name (Semora, Sylly, SyllySync, SyllaScan…). It is still our most relevant term, but no longer ours alone.
- **Our new en-US subtitle** (`Study plan, exams & flashcards`) indexes study, plan, exams, and flashcards. `syllabus` therefore moves into the keyword field; see store.config.json.
- **Unclaimed terms:** "crunch", "finals", "midterm", "exam countdown", "forecast". No rival above uses them, and they match the 2.2 hero.

## 4. Recommendations (prioritized)

`[ASC]` marks an owner action in App Store Connect. `[Owner]` marks another owner action. Unmarked items are code or copy the team can do.

1. **Keep the paywall hard at "Apply" and make the reveal the trigger.**
   - Show the paywall right after the forecast reveal, with the student's own numbers.
   - Headline: "You have 3 red weeks. Plus turns them into start dates."
   - Evidence: RevenueCat hard-paywall data, 5× conversion. Do not unlock "class 1 free" in 2.2 (CEO_LOG D1).
2. **Replace the live Weekly $0.99 intro offer** (current review notes: $6.99/wk with a $0.99 first week) with MASTER_PLAN D2:
   - Weekly **"Finals cram" with no intro and no trial**, shown last.
   - The **7-day trial moves to Annual**, which is preselected and listed first.
   - Without this, the 2.2 paywall copy and the review notes contradict ASC. `[ASC]`
3. **Change the price test arms to $29.99 vs $39.99 annual** (not $39.99 vs $59.99).
   - Semora is $19.99, MyStudyLife $29.99, and Quizlet Plus $35.99. $59.99 would be priced against Knowt, not our segment.
   - Needs a second annual product ID in the same group. `[ASC]`
4. **Put a "No credits. No caps. No account." line on the paywall and in the promo text.**
   - Every rival meters AI (Quizlet Unlimited tier, Notability 400/mo, Semora 2 free scans). This is our cleanest one-line difference, and it is true on every device.
   - Say "no caps" only where it holds: practice has none, and regenerations are capped at 10/day. The store copy here says "no credits or monthly caps".
5. **First screenshot = the red-week heatmap**, then scan → review → Lock Screen widget → Exam Mode (cited cards).
   - Title card: "See your crunch weeks months early."
   - "AI syllabus scanner" is now a commodity, so lead with the outcome nobody else shows.
   - Needs a new native capture; see APP_PREVIEW_2.2.md for simulator flags. `[Owner]`
6. **Upload the App Preview** (beats 2–5, ≤ 30 s, per APP_PREVIEW_2.2.md) in en-US first, then es-MX, pt-BR, ja, ko, de-DE, fr-FR. `[ASC]`
7. **Create 3 Custom Product Pages mapped to the `ct` tokens:**
   - `forecast`: heatmap first.
   - `pack`: "Your class's deadlines, already in", with Class Pack import first.
   - `duel`: "A friend challenged you", with the Duel screen first.
   - Point share-card and pack-page "Get the app" links at them. Assign CPP keywords where ASC allows it (verify availability in ASC). `[ASC]`
8. **Submit a Featuring Nomination for 2.2 as soon as the build is in review**, under "App Enhancements".
   - Pitch: on-device FM with a strict review gate, iOS 16.4 fallback, Lock Screen + Siri + Spotlight, 14 localized listings.
   - Cite that it extends Apple's own "quiz from your notes" demo. No student planner appears in Apple's FM showcase. `[ASC]`
9. **Schedule the "Finals Crunch" In-App Event** (US; copy in IN_APP_EVENTS_2.2.md).
   - Event start **Nov 16**, publish start **Nov 2**, with **2.2 live by Nov 9** (MASTER_PLAN target).
   - If 2.2 isn't approved by **Nov 5**, run the event on Build 90 features only, or skip it. An event must not promote features the live version lacks. `[ASC]`
10. **Answer Sylly and Semora head-on in the description, without naming them.**
    - "Your syllabi and notes are processed on your iPhone. No account." plus "Import a classmate's Class Pack free."
    - Semora gates Course Spaces behind Pro; Sylly sends syllabi to a cloud model. Done in store.config.json.
    - Also check that the ASC privacy label says **Data Not Collected** before 2.2 ships. `[ASC]`
11. **Fix store.config.json housekeeping before any `eas metadata:push`:**
    - `apple.version` is still `2.0.8`, while the live version is 2.1.0.
    - `scripts/check-asc-final-upload-bundle.ts` pins 2.0.8.
    - Set it to `2.2.0` in the release commit and update that script. Left unchanged here so no existing check breaks. `[Owner]`
12. **Plan for moat erosion in 2027.** iOS 27 gives every small developer free PCC. Ship Class Pack and Quiz Duel in 2.2, not later: network effects are the part rivals can't copy with an API call.

## 5. Open items / not verified
- Current App Store prices for Semora, Gizmo, StudyFetch, and Structured. Pages were blocked, and Gizmo and Structured sources conflict.
- Whether Apple published a 2026 FM app showcase that includes a study planner.
- Whether ASC counts the keyword limit in **bytes or characters** for CJK, Hindi, and Arabic.
  - Earlier QA in this repo (`store/apple/aso-scorecard-2026-06-09.txt`) counted characters, and 240+ byte CJK keyword sets were accepted.
  - This pass follows the stricter **≤ 100 bytes** rule, which costs about ⅔ of the CJK keyword space.
  - If ASC accepts 100 characters, the ja/ko/zh keyword fields can triple. `[Owner: test one locale in ASC]`

## Sources
- Semora App Store listing: https://apps.apple.com/us/app/semora-ai-syllabus-scanner/id6762589321
- Semora AI Syllabus Scanner page: https://semoraai.com/ai-syllabus-scanner
- Sylly App Store listing: https://apps.apple.com/us/app/sylly-ai-syllabus-scanner/id6759631749
- Sylly source (GitHub): https://github.com/imAryanL/sylly-ios-app
- SyllySync: https://apps.apple.com/us/app/syllysync/id6742455642 · SyllaScan: https://apps.apple.com/my/app/syllascan/id6756897540 · CourseLink: https://apps.apple.com/us/app/id6755744656
- Syllabus app comparisons: https://passai.pro/blog/best-syllabus-apps-college-students · https://www.coursicle.com/blog/best-syllabus-to-calendar-apps/ · https://dormway.app/blog/best-syllabus-to-calendar-apps-2026
- MyStudyLife: https://apps.apple.com/us/app/my-study-life-school-planner/id910639339 · https://studytoolguide.com/comparisons/is-mystudylife-still-worth-using-2026-red-flags-alternatives
- Structured: https://toolradar.com/tools/structured · https://help.structured.app/en/articles/324674
- Quizlet: https://nibble-app.com/blog/quizlet-cost · https://aistudymaster.com/quizlet-plus-cost/
- Knowt: https://studygenie.io/blog/knowt-vs-quizlet
- Gizmo: https://www.toolsforhumans.ai/ai-tools/gizmo · https://opentools.ai/tools/gizmo
- StudyFetch: https://toolradar.com/tools/study-fetch · https://apps.apple.com/us/app/6663574866
- Notability: https://notability.com/pricing · https://toolradar.com/tools/notability/pricing
- Apple FM showcase (Sept 2025): https://www.apple.com/newsroom/2025/09/apples-foundation-models-framework-unlocks-new-intelligent-app-experiences/ · https://www.cultofmac.com/news/apple-foundation-models-framework
- WWDC26 FM updates: https://www.apple.com/newsroom/2026/06/apple-aids-app-development-with-new-intelligence-frameworks-and-advanced-tools/ · https://developer.apple.com/videos/play/wwdc2026/241/ · https://www.macrumors.com/2026/06/09/apple-outlines-major-ai-and-developer-tool-updates/ · https://dev.to/hariharanjagan/whats-new-in-apples-foundation-models-framework-at-wwdc-2026-5227
- RevenueCat SOSA 2026: https://www.revenuecat.com/state-of-subscription-apps · https://www.revenuecat.com/state-of-subscription-apps-2026-education · https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026
- ASO terms: https://asotools.io/app-analytics/school-planner-keyword-monitoring · https://powerplanner.net/best-homework-planner-apps
- Featuring: https://asomobile.net/en/blog/app-store-and-google-play-featuring-2026-how-to-get-into-editorial-collections/
