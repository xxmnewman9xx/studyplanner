# Launch Assumptions Checked

Checked on May 4, 2026.

## App Store Metadata

Apple's current public review and product-page guidance emphasizes accurate app names, relevant keywords, and avoiding metadata that packs trademarked terms or popular app names just to improve search placement.

Decision: avoid using `Canvas` in the subtitle or keywords until a shipped feature actually supports Canvas. `Homework, Exams, Class Schedule` is the safer MVP subtitle.

Sources:

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Product Page Guidance](https://developer.apple.com/app-store/product-page/)
- [Apple App Store Search Guidance](https://developer.apple.com/app-store/search/)

## Canvas API

Canvas has official REST resources for assignments and calendar events, and the API docs include OAuth2 resources. That makes Canvas a credible later milestone, but not a low-risk MVP claim.

Decision: keep Canvas out of live V1 scope. Treat it as a paid milestone after OAuth, school-domain discovery, permission handling, assignment reconciliation, and calendar-event update semantics are designed.

Sources:

- [Canvas LMS REST API Documentation](https://canvas.instructure.com/doc/api/)
- [Canvas Assignments API](https://canvas.instructure.com/doc/api/assignments.html)
- [Canvas Calendar Events API](https://canvas.instructure.com/doc/api/calendar_events.html)

## Calendar Sync

The starter can create device calendar events, but production sync needs persisted external event IDs. Without those IDs, repeated sync can create duplicates.

Decision: ship calendar sync only after update/delete behavior is safe and clear.

## Syllabus AI

Syllabi can include personal notes, school names, instructor details, and accommodations language. Upload handling needs retention limits and deletion controls before production.

Decision: the MVP client includes an editable contract and stub parser, but real OCR/LLM parsing belongs behind a backend with validation, observability, and privacy policy coverage.
