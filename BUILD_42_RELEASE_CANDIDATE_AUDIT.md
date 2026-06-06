# Build 42 Release Candidate Audit

Date: 2026-06-05

Scope: Build 42 only. No Build 43, no build-number increment, no TestFlight submission.

Screenshots: `qa/build42-rc/`

## Method

I audited the app as a new stressed student receiving a syllabus. I reset the simulator app state, launched the app, walked onboarding and paywall, used the Scan and Paste surfaces, applied a representative syllabus through the same parser/storage logic when simulator text input would not accept host paste, and evaluated the generated Today state.

Simulator limitations found during audit:

- Host clipboard/text entry did not reliably enter text into the React Native multiline field, even when focused through Accessibility.
- Main tab host-coordinate clicks were unreliable against the scaled Simulator frame.
- Home-screen widget placement could not be completed through available simulator automation. Widget snapshot generation and WidgetKit source were inspected instead.
- `studyplanner://reminders` triggered an iOS "Open in app?" confirmation while the app was already in a pushed task route.

These are recorded as release risks, not ignored.

## Journey Scores

| Stage | Feeling | Confusing | Trust/Relief | Premium/Magical | Clarity | Delight | Trust | Intelligence | Premium |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| First launch | Clear syllabus-first promise | "AI-powered" wording is generic | Logo, direct setup CTA | Big Apple-like typography | 9 | 8 | 8 | 8 | 8 |
| Onboarding | Calm, structured | No actual theme selection remains | Review-before-save promise | Good spacing, but blue accent was loud before patch | 8 | 7 | 8 | 8 | 8 |
| Theme selection | Removed/hidden | User-requested stage does not exist | Less customization is aligned with product direction | N/A | 7 | 6 | 7 | 6 | 8 |
| Syllabus import | Strong action surface | Paste target/text input hard to automate in simulator | "Review the semester it builds" creates trust | Saturated blue weakened premium feel before patch | 8 | 8 | 8 | 8 | 7 |
| Review imported coursework | Code path exists, parser improved | Could not fully screenshot review due text-entry automation issue | Review-before-save model is correct | Needs simulator retest | 7 | 7 | 8 | 8 | 7 |
| Semester generation | Much better after fixes | Import feedback still simple | Starter data no longer pollutes first real import | Semester impact card is meaningful | 9 | 8 | 9 | 9 | 8 |
| Today | Now answers "what should I do next?" | Hero copy can still be long | Health score + next action creates relief | Strongest screen | 9 | 8 | 9 | 9 | 8 |
| Classes | Data model and cards use V2 pulse | Tab screenshot blocked | Forecast-first logic is correct | Needs visual screenshot validation | 8 | 7 | 8 | 9 | 8 |
| Plan | Data-backed blocks and reasons exist | Tab screenshot blocked | Autopilot logic is real | Needs physical UI validation | 8 | 7 | 8 | 9 | 8 |
| Notes | Note insights feed preparedness | No notes in clean syllabus sample | Notes -> prep relationship exists | Needs visible empty/imported state polish | 7 | 7 | 8 | 8 | 8 |
| Study Session | Task detail shows study suggestion | Modal/deep-link state interrupted audit | Action copy is useful | Still has some generic AI phrasing | 8 | 7 | 8 | 8 | 8 |
| Notifications | Scheduling model real | Copy was reminder-like before patch | Copy now more coach-like | Needs live permission/schedule screenshot | 8 | 7 | 8 | 8 | 8 |
| Widgets | Snapshot engine real | Could not place widgets on home screen | Widget data reflects SemesterSnapshot | Actual Home/Lock screen not verified | 7 | 7 | 8 | 8 | 8 |

## 60 Second Test

Initial result: failed.

Why: the first imported syllabus was mixed with seeded overdue coursework. The user saw "Intervention" and old demo tasks instead of relief.

Fix implemented:

- First real syllabus import now replaces starter coursework instead of merging with it.
- Parser now extracts multiple dated clauses per line.
- First-import empty semester no longer crashes feedback generation.
- Early grade forecasts no longer imply failure when no grades exist.
- Recommended actions no longer let "No overdue work" outrank an actual next action.

Final result: mostly passes.

After clean import, the student can see:

- Semester Health: 86, On track.
- Classes: 3.
- Assignments: 7.
- Exams: 2.
- Next action: "BIO 101 exam mode. Midterm exam is in 13 days. One 30 minute review protects the B- forecast."

Remaining issue: the review screen and physical paste flow need a clean simulator retest before TestFlight.

## Semester Health Test

Strengths:

- Strong hierarchy.
- Health score is immediately visible.
- Dimensions are understandable.
- The hero now feels closer to Apple Fitness/Whoop than a task widget.

Weaknesses:

- Hero reason can become long.
- "Preparedness is the limiting factor..." is useful but a little clinical.
- Feedback card is good, but import feedback could say exactly what changed: classes, deadlines, exams, blocks.

Score: 8.8/10.

## Next Action Test

Before fixes:

- "BIO 101 pulse 58. No immediate pressure" was vague and contradictory.

After fixes:

- "BIO 101 exam mode. Midterm exam is in 13 days. One 30 minute review protects the B- forecast."

Score: 9/10.

## Class Pulse Test

Strengths:

- Uses V2 grade forecast.
- Forecast labels are visible in the model.
- Unknown/estimated grade language is less punitive after fixes.

Weaknesses:

- Needs full simulator screenshot validation.
- Estimated B- for all newly imported classes is plausible but slightly samey.
- The user still needs an obvious path to add current grades.

Score: 8.5/10.

## Premium Visual Pass

Fix implemented:

- Light theme primary accent changed from Apple blue to black.

Remaining issues:

- Status colors still appear heavily in health dimensions.
- Scan surface is now black via theme, but needs final screenshot validation after reload.
- Class colors remain useful but could be toned down further.

Score: 8.6/10.

## Widget Reality Test

Attempted:

- Verified WidgetKit extension files and app group configuration.
- Verified native snapshots are generated from `SemesterSnapshot`.
- Verified `openURL` remains `studyplanner://today`.

Not completed:

- Physical home-screen/lock-screen widget placement in Simulator.

Result: not sufficient for final TestFlight readiness.

## Notification Test

Fix implemented:

- Assignment, exam, class, and study notification copy now sounds more like a semester coach:
  - "one focused block protects the week"
  - "One active-recall pass tonight protects your forecast"
  - "keeps the semester moving"

Remaining issue:

- Permission flow and scheduled notifications need a clean simulator run with permission interaction.

## Apple Test

The app is closer to a premium Apple-native semester coach than it was at the start of this gate. It now creates more relief after a syllabus import and no longer punishes the user with fake demo risk.

It is not yet fully at "Apple Education could ship this emotionally" because several surfaces still need physical screenshot validation and widget placement remains unverified.

