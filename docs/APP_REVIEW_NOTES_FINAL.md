# App Review Notes Final Draft

Status: draft only. Replace placeholders before submission.

## Reviewer Notes

StudyPlanner helps students add schoolwork, review found assignments before they become due dates, and view confirmed deadlines in Today, Calendar, Week, Classes, reminders, and supported small/medium Home Screen widgets.

Use a clean install with capture mode disabled. Supported widget families are small and medium Home Screen widgets only. Large and Lock Screen widgets are not included in this build.

To test free planner behavior, complete onboarding, choose Try Sample or Add Classes Manually, and open Today, Calendar, Week, Classes, and Widgets.

To test Plus, use the in-app paywall with App Store sandbox products configured for monthly, yearly, and Lifetime if included. Restore Purchases is available on the paywall.

If EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT is not configured, photo/OCR parsing is unavailable and App Review should use a text-based PDF or text syllabus file. If the endpoint is configured, uploaded syllabus handling must match the privacy policy and App Privacy answers.

## Replace before submit

- Support URL.
- Privacy URL confirmation.
- Exact IAP products attached to submitted version.
- Sandbox purchase/restore proof summary.
- Signed archive entitlement check showing production APNs entitlement and shared App Group; source preflight exists, but does not replace archive proof.
