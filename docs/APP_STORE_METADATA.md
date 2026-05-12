# App Store Metadata Direction

Status: policy-safe draft, not submitted.  
Date checked: 2026-05-12

## Recommended Primary Metadata

| Field | Recommendation | Length/status | Notes |
| --- | --- | --- | --- |
| App name | `Study Planner: Syllabus AI` | 26/30 characters | Use only if submitted build has tested AI/endpoint-backed parsing. |
| Safer fallback name | `Study Planner: Syllabus` | 23/30 characters | Use if production parser is local/text-based only or endpoint proof is missing. |
| Subtitle | `Scan syllabi. Track deadlines.` | 30/30 characters | Safer than class-schedule or Canvas claims. |
| Keywords | `homework,assignments,exams,calendar,classes,grades,school,college,student,widget,reminders,timetable` | 100 bytes | Do not exceed Apple's keyword field limit. |
| Promotional text | `Add a syllabus, review found work, and keep confirmed deadlines visible in Today, Week, Calendar, Classes, and Home Screen widgets.` | 131/170 characters | Avoids perfect extraction and unsupported widget claims. |
| What's New | `New in this release: reviewed syllabus import, Today and Week planning, class hubs, grade tracking, reminders, calendar sync, and small/medium Home Screen widgets.` | Safe draft | Use only after screenshots and IAP status are final. |

## Description Draft

Study Planner: Syllabus AI helps students turn school materials into a plan they can check before trusting.

Add a text-based PDF or syllabus text, review found courses, assignments, exams, and grade categories, then choose what gets added to your planner. Confirmed work powers Today, Calendar, Week, Classes, reminders, calendar sync, and supported Home Screen widgets.

What you can do:

- Review found coursework before it becomes a due date.
- See what matters today and this week.
- Track classes, assignments, exams, grades, and busy weeks.
- Set reminders and sync confirmed deadlines.
- Customize class colors and small or medium Home Screen widgets.

Study Planner is built to reduce setup work, not replace checking your syllabus. Some automation features require Study Planner Plus. Purchases are handled through the App Store, and Restore Purchases is available from the paywall.

Terms of Use:  
https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Privacy Policy:  
https://political-turtle-752.notion.site/Study-Planner-Syllabus-AI-Privacy-Policy-51dfaa74348846e0996b2e0ca22b1408

Support URL:  
`BLOCKED: provide a public HTTPS support URL with real contact information before submission.`

## Safe Claim Bank

- Review found coursework.
- Confirmed deadlines.
- Text-based PDF or syllabus text.
- Today, Calendar, Week, Classes.
- Small and medium Home Screen widgets.
- Calendar sync for confirmed deadlines.
- Reminders before due dates.
- Grade planning from entered grades.
- Customize class colors.

## Claims To Avoid

- Perfect extraction.
- Never miss homework.
- Guaranteed better grades.
- Works with every syllabus.
- Fully automatic planning.
- Canvas sync, Google Classroom, Blackboard, or LMS sync.
- Lock Screen widgets.
- Large widgets.
- Free trial unless the App Store product is live and verified.
- Lifetime deal unless the non-consumable product is live and included in the submitted version.
- Class schedule editing unless meeting editing is shipped.
- Focus sessions unless the Focus screen is routed and tested.

## Screenshot Narrative

1. Turn school materials into a checked plan.
2. Review assignments before they hit your calendar.
3. Know what matters today.
4. See what is due this week.
5. See every class in one place.
6. Deadlines stay visible with small and medium widgets.
7. Your semester, organized.

## Review Notes To Prepare

- Explain that found work is editable before application.
- State whether `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is enabled.
- If no endpoint is enabled, state that App Review should use text-based PDF or text import, not photo OCR.
- Explain that only small and medium Home Screen widgets are supported.
- Include exact monthly, yearly, and Lifetime IAP product IDs only after App Store Connect products are attached and sandbox-tested.
- Provide a support URL and privacy URL.
- Do not use old assets that show Lock Screen widget claims.
