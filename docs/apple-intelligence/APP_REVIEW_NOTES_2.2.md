# App Review notes: StudyPlanner 2.2.0

- **App:** Study Planner AI (ASC 6766181202). Version 2.2.0, build ≥ 91. Minimum iOS 16.4.
- **ASC field text:** the condensed text to paste into *App Review Information → Notes* (≤ 4000 characters) lives in `store.config.json → apple.review.notes`, about 3.5K characters with the sample syllabus inline. This file is the full reference. Attach it as a PDF if the reviewer asks.
- **Placeholders:** anything marked **[verify]** must be checked against the final build before submission.

---

## 1. What changed in 2.2
StudyPlanner now forecasts the whole term. From the syllabi a student scans, it:
- builds a term-wide **Crunch Forecast** heatmap with back-scheduled start dates;
- suggests one **Study Now** action a day (Today, Lock Screen widget, Siri);
- turns the student's **own notes** into practice (**Exam Mode**);
- lets classmates share deadlines through **Class Pack** links and challenge each other with **Quiz Duel**.

Syllabus extraction, the daily brief sentence, practice questions, and quick-add proposals use Apple's on-device model where it is available. Everything else is deterministic code.

## 2. On-device generation (Foundation Models)
- **Framework:** Apple's **Foundation Models** framework, using `SystemLanguageModel` on the device only. There are four features:
  - `syllabusExtract`
  - `noteStudySet` (flashcards and practice questions)
  - `dailyBrief` (one sentence explaining today's suggested task)
  - `taskProposal` (quick-add fallback when the rule-based parser can't read the input)
- **No server and no third-party AI.** The app calls no remote model, sends no Private Cloud Compute request, and uses no third-party AI provider (including the iOS 27 server-model APIs). Guideline **5.1.2(i)**'s disclosure and consent for sharing personal data with third-party AI therefore **does not apply**: no personal data leaves the device.
- **The model proposes; code and the user decide.**
  - Generated output is structured (`@Generable` schemas).
  - Each item must quote a verbatim source span from the syllabus or note.
  - Dates are parsed only by the app's deterministic date parsers and must fall inside the term window. The model never supplies a trusted date, ID, grade, reminder, or purchase state.
  - Items that fail validation are dropped.
- **Human review is always required.**
  - Syllabus items open in **Review Import**. Items found only by the model are unchecked by default and labeled "Found on-device, verify".
  - Quick-add proposals open in a **confirm sheet**.
  - Practice questions show their source line.
  - Nothing reaches the planner, widgets, or reminders until the student confirms.
- **Foreground only.** Inference runs only while the app is active. Widgets, App Intents, and notifications never run the model; they read a cached snapshot.
- **Content scope and integrity.**
  - **Exam Mode is practice from the user's own notes.** Every card and question cites the note line it came from, and weak topics get extra review blocks.
  - It does not answer homework, write essays, or solve assignments. The copy says "practice from your own notes" everywhere.
  - Received **Quiz Duel** questions are labeled "shared by a classmate". A Duel carries at most 10 multiple-choice questions and no note text, and the sender confirms "Share these questions" first.
- **Guardrail and refusal handling.** If the model refuses, hits a guardrail, runs out of context, times out, or is unavailable, the app shows the deterministic result (the classic parser or a template flashcard) and never an error dead end.
- **Disclosure.** A generic "sparkles" badge (not Apple's logo) marks AI-assisted items. The paywall footnote and the App Store description state device eligibility. "Apple Intelligence" appears only referentially and in English, never in the app name or subtitle.

## 3. How to test: eligible vs ineligible devices

| Setup | What the reviewer sees |
|---|---|
| **Eligible:** iPhone 15 Pro/Pro Max, any iPhone 16 or 17, iPhone Air; iOS 26+; Settings → Apple Intelligence & Siri **on**; a supported language (e.g. English) | Scan shows progress ("Page 2 of 5 · 17 found"). Review Import shows origin chips (both / on-device). Exam Mode generates cited cards and questions from a note of 400+ characters. Today shows a one-sentence "why". |
| **Ineligible:** any other iPhone, iOS 16.4–25, Apple Intelligence off, model still downloading, or an unsupported language (e.g. Hindi, Arabic) | The **same screens and flows** run on the classic on-device parser, as in 2.1.0. The sparkles badge and origin chips disappear. Exam Mode shows template review cards. Forecast, Class Pack, Study Now selection, widgets, reminders, Siri, and Spotlight all work. |
| **Switch between them** | On an eligible device, turn off Settings → Apple Intelligence & Siri → Apple Intelligence, then relaunch. The app falls back without errors. Turn it back on to restore AI features. Settings → Profile → "On-device AI" shows the current availability state. **[verify label]** |

## 4. What's free and what needs Plus

| Free (no purchase) | StudyPlanner Plus (auto-renewing subscription) |
|---|---|
| Onboarding | Applying imported items to the planner |
| Scan every class: camera, PDF, paste, manual | Study Now (Today card, widget line, notification body) |
| Review Import (edit, check, delete) | Exam Mode (practice, weak topics, sending a Quiz Duel) |
| Full cross-class **Crunch Forecast** + share card | Home Screen and Lock Screen widgets |
| **Class Pack** import into Review | Reminders and start-date notifications |
| **Playing a received Quiz Duel** | Siri / App Shortcuts answers |

- The paywall appears after the Forecast reveal, and any time the student taps *Apply*.
- Prices come from StoreKit. Each plan shows its billed amount with renewal and cancellation terms, plus Terms and Privacy links. Restore Purchases is on the paywall.
- The pending import is kept, so it applies right after purchase.
- **[verify]** Before submission, confirm the plan set in ASC matches what the paywall shows (see COMPETITIVE_RESEARCH_2026-09.md rec. 2): annual first with a 7-day trial, monthly, and weekly without an introductory offer.
- Receipt handling is unchanged from 2.1.0: active subscriptions are checked with native StoreKit APIs through `expo-iap`, with no server-side receipt validation.

## 5. Universal links and Class Pack
- **Link format:** `https://studyplanner-ai.xxmnewman9xx.workers.dev/p#v1.<data>`.
  - The associated domain is `applinks:studyplanner-ai.xxmnewman9xx.workers.dev`.
  - The site hosts a static `/.well-known/apple-app-site-association` file and a static `/p` page offering "Get the app" and "Copy pack".
- **Privacy of the payload.** `<data>` sits in the URL **fragment** (after `#`), which browsers never send to the server. It holds only class code, item titles, kinds, dates, and weights, compressed. It never holds syllabus text, notes, names, or grades.
- **Size.** A QR code is shown only when the payload is ≤ 1 KB; links are capped at 2 KB.
- **Import.** Opening the link (or scanning the QR with the Camera app) opens StudyPlanner in **Review Import**. Importing is free, and applying needs Plus.
- **New installs.** After a fresh install, the first-launch **"Paste Class Pack"** button reads the copied pack with the system paste permission.
- **How to test:**
  1. On device A, open Class → Share → Class Pack.
  2. Send the link to device B (Messages or AirDrop), or scan the QR with B's Camera.
- **[verify]** Owner must deploy the AASA file and `/p` page before review.

## 6. Siri, Shortcuts, and Spotlight
- **Phrases (en-US)** **[verify against `AppShortcuts.xcstrings`]**:
  - "What should I study now in StudyPlanner" → today's Study Now line
  - "What's due in StudyPlanner" → next deadlines
  - "Add an assignment in StudyPlanner" → Siri asks for the text. It replies "Saved. Open StudyPlanner to confirm." and the item waits in a confirm sheet the next time the app opens.
  - "Scan a syllabus in StudyPlanner" → opens Scan
- **Behavior.** Intents answer from a local App Group snapshot, even with the app closed. They never run the model.
- **Locales.** Phrases ship in all 10 in-app locales.
- **Spotlight.** Classes and deadlines are indexed on iOS 18+. Tapping a result opens it in the app.

## 7. Privacy summary
- **No account and no analytics SDK.** Syllabi, notes, forecasts, and practice results stay on the device.
- **Text recognition.** Camera and photo text recognition uses Apple's Vision framework on the device. Syllabus and note content is not uploaded to a remote parser or any server.
- **Widgets.** The widget and intent snapshots contain display fields only (see the WidgetKit notes in `docs/APP_REVIEW_NOTES.md`).
- **Sharing is opt-in.**
  - The Forecast card is a PNG made on the device, with "Hide class names" on by default.
  - Class Pack and Quiz Duel data travel only inside the link fragment the user chooses to share.
- **Deleting data.** Profile → "Clear on-device AI data" removes cached generations and practice results. Deleting a note or class removes its cached items.
- **Label.** The privacy label stays **Data Not Collected**. **[verify in ASC]**

## 8. Demo steps (about 5 minutes)
1. Launch the app and complete the 3 onboarding steps. On the last step, choose **Paste text**.
2. Paste **Sample syllabus A** (below). Optionally tap *Add another class* and paste **Sample syllabus B** to see a cross-class red week.
3. **Review Import** lists the found items. On an eligible device each item has an origin chip. Edit one date to see validation.
4. Tap **See forecast**. The heatmap fills and the weeks of Nov 30 and Dec 7 turn red, with "start … on" dates. **[verify colors against the final thresholds]**
5. Tap **Share** on the Forecast card. The share sheet opens a PNG with class names hidden.
6. Tap **Apply**. The paywall appears. Subscribe with the sandbox account.
7. Check the plan on **Today** (Study Now line) and in the Lock Screen widget (add the "StudyPlanner Today" accessory).
8. Go to **Notes → New note**, paste **Sample note**, then tap **Practice**. On an eligible device you get cited flashcards and questions. Answer a few, then check the "Weak topics" card; it appears after 20 answers.
9. Try quick-add: type `Lab report Friday, 10%` in the Today capture field and confirm.
10. Try Siri: "What should I study now in StudyPlanner".

### Sample syllabus A (25 lines, includes tables)
```
BIO 201 Cell Biology - Fall 2026
Instructor: Dr. A. Rivera | Office hours Tue 2-4 pm, Science Hall 214
Meets Mon/Wed/Fri 10:00-10:50 am, Science Hall 120

GRADING
| Component | Weight |
| Lab reports (6) | 20% |
| Quizzes | 10% |
| Midterm 1 | 15% |
| Midterm 2 | 15% |
| Research paper | 15% |
| Final exam | 25% |

SCHEDULE
| Week | Dates | Topic | Due |
| 8 | Oct 19-23 | Membranes | Lab 3 report due Wed Oct 21 |
| 9 | Oct 26-30 | Transport | Quiz 3 Wed Oct 28 |
| 10 | Nov 2-6 | Cell signaling | Midterm 1 Wed Nov 4, in class |
| 11 | Nov 9-13 | Cell cycle | Lab 4 report due Wed Nov 11 |
| 12 | Nov 16-20 | Mitosis and meiosis | Paper outline due Mon Nov 16; Quiz 4 Wed Nov 18 |
| 13 | Nov 23-27 | Thanksgiving break, no class | |
| 14 | Nov 30-Dec 4 | Genetics | Midterm 2 Wed Dec 2; Lab 5 report due Fri Dec 4 |
| 15 | Dec 7-11 | Review | Research paper due Mon Dec 7; Lab 6 report due Wed Dec 9 |
| Finals | Dec 14 | Final exam Mon Dec 14, 9:00-11:00 am, Science Hall 120 | |
Late work: -10% per day. Lab reports are submitted on the course site.
```
All weekdays match the 2026 calendar.

**Expected result** (the review list may also show class meetings):

| Count | Kind | Items |
|---|---|---|
| 4 | Lab reports | Oct 21, Nov 11, Dec 4, Dec 9 |
| 2 | Quizzes | Oct 28, Nov 18 |
| 2 | Midterms | Nov 4, Dec 2 |
| 2 | Paper items | outline Nov 16, paper Dec 7 |
| 1 | Final | Dec 14, 9:00 am |

Grade weights come from the Grading table.

### Sample syllabus B (optional second class)
```
CHEM 110 General Chemistry - Fall 2026
Problem Set 6 due Friday, December 4, 2026 (5%)
Exam 3: Thursday, December 3, 2026, 7:00 pm (20%)
Lab practical: Tuesday, December 8, 2026 (10%)
Final exam: Wednesday, December 16, 2026, 1:00 pm (30%)
```

### Sample note (for Exam Mode, over 400 characters)
```
Cell membranes: The plasma membrane is a phospholipid bilayer with hydrophilic heads facing outward and hydrophobic tails inside. Cholesterol stabilizes fluidity across temperatures. Integral proteins span the bilayer; peripheral proteins attach to the surface. Passive transport (diffusion, facilitated diffusion, osmosis) moves substances down their concentration gradient without ATP. Active transport, such as the sodium-potassium pump, uses ATP to move 3 Na+ out and 2 K+ in against their gradients. Endocytosis brings large particles in by folding the membrane; exocytosis releases vesicle contents outside the cell.
```

## 9. Existing behavior, unchanged from 2.1.0
Invalid-deadline guardrails, the native OCR gate, WidgetKit families, and the production capture-bypass audit are unchanged. See `docs/APP_REVIEW_NOTES.md`; those notes still apply.
