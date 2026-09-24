# Study Planner Privacy Policy

Effective date: July 10, 2026

Study Planner: Syllabus AI is designed as a local-first planner. Courses, assignments, grades, preferences, and onboarding state are stored on the device unless you choose a feature that needs device or network access.

## Information The App Handles

- Planner content you enter, such as courses, assignments, exams, grades, class meetings, and focus sessions.
- Syllabus files or photos you choose for import.
- Device permission results for optional notification, photo library, camera, and document picker features.
- Store entitlement status from Apple or Google when you purchase or restore Study Planner.

## How Information Is Used

Planner content is used to display your schedule, deadlines, grades, reminders, widgets, and focus tools. Syllabus files are used only to extract editable courses and deadlines. Store entitlement status is used to unlock full app features.

On iOS, Home Screen widgets use a small WidgetKit snapshot stored in an App Group shared by the app and its widget extension. The snapshot includes only the reviewed assignment display fields needed for Today and Upcoming widgets: local assignment ID, title, course code/color, due label, priority, assignment type, semester name, widget state, generated time, colors, and widget display text. It does not include raw syllabus text, teacher names, rooms, grades, notes, checklist details, purchase state, reminder IDs, calendar event IDs, or the full planner database. Demo coursework and unreviewed scan results are not written to native widgets.

## Syllabus Import

In the current app, pasted syllabus text, readable text-based PDFs, and camera/photo text recognition are processed on the device. Native iOS camera/photo text recognition uses Apple's Vision framework. Imported results stay editable and require review before they are applied to the planner. This build does not upload syllabus content to a StudyPlanner parser service.

## Third-Party Services

The app uses Apple App Store or Google Play billing for purchases. Optional notifications use the operating system service on your device. iOS widgets use Apple's WidgetKit and App Groups on device.

## Data Sharing

Study Planner does not sell personal information. Planner data is not shared with advertisers. Syllabus content is processed only when you choose to import a syllabus.

## Your Choices

This build presents StudyPlanner after onboarding before the full planner unlocks. You can decline camera, photo library, or notification permissions and continue using supported planner features after access is unlocked. You can delete individual planner content in the app or remove all locally stored app data by uninstalling StudyPlanner.

## Contact

For privacy questions or deletion help, email mattnewmanapps@gmail.com or use the Support link in StudyPlanner settings.

## On-Device AI Features (StudyPlanner 2.2 and later)

This section was added on September 23, 2026 and applies from StudyPlanner 2.2.

- **What runs on the device.** On supported iPhones with Apple Intelligence turned on, StudyPlanner uses Apple's on-device Foundation Models framework to find deadlines in syllabi you import, write the one-sentence daily study brief, turn your own notes into flashcards and practice questions, and suggest a task from text you type or say to Siri. This processing happens entirely on your iPhone. StudyPlanner does not send syllabus text, notes, planner data, or generated content to StudyPlanner servers, Apple servers (including Private Cloud Compute), or any third-party AI provider. On other devices, or when Apple Intelligence is off, the app uses its existing on-device parser instead.
- **You review everything.** Generated items are suggestions. Deadlines, tasks, and practice items are shown for your review, and nothing is added to your planner, widgets, or reminders until you confirm it.
- **What is stored.** To avoid repeating work, the app keeps a local cache of generated results and your practice answers (used to find weak topics) in the app's on-device database. Widgets and Siri read a small on-device snapshot of your next study step and upcoming deadlines. Deleting a note or class removes its cached results, "Clear on-device AI data" in Profile removes all of them, and uninstalling the app removes everything.
- **Sharing is your choice.** Nothing is shared unless you tap Share:
  - *Forecast card*: an image created on your device. Class names are hidden by default.
  - *Class Pack link or QR code*: contains only class codes, item titles, kinds, dates, and weights, compressed into the part of the link after the "#". Browsers do not send that part of a link to any server, so the StudyPlanner website never receives it. It never includes syllabus text, notes, grades, or your name.
  - *Quiz Duel*: up to 10 multiple-choice questions you choose to send. It never includes your notes.
  Anyone you send a link to can read what it contains, so share it only with people you trust.
- **No account, no tracking.** Using these features does not require an account, and StudyPlanner does not use your syllabus, notes, or practice results for advertising, profiling, or model training.
