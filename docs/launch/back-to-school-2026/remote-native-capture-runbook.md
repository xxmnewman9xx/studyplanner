# Back-to-School 2026 Remote Native Capture Runbook

Generated: 2026-07-09T09:32:55.438Z
Release: Back to School with AI
Purpose: bypass the local Xcode disk bottleneck with a simulator-targeted EAS build and EAS Simulator session.

This runbook does not start a paid EAS Simulator session. It prepares the exact static simulator build and agent-device workflow for capture once the operator is ready to run it.

## Readiness

| Check | Status | Evidence | Blocker |
| --- | --- | --- | --- |
| eas-cli | ready | eas-cli/20.5.1 darwin-arm64 node-v25.9.0 | None |
| eas-auth | blocked | ›   ModuleLoadError: [MODULE_NOT_FOUND] require failed to load <br> ›   /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/eas-cli/build/co<br> ›   mmands/account/view.js: Cannot find module '@sentry-internal/tracing'<br> ›   Require stack:<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@sentry/node/c<br> ›   js/tracing/index.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@sentry/node/c<br> ›   js/index.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/eas-cli/build/<br> ›   sentry.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/eas-cli/build/<br> ›   commandUtils/EasCommand.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/eas-cli/build/<br> ›   commands/account/view.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/module-loader.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/help/index.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/errors/handle.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/errors/index.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/config/config.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/config/index.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/command.js<br> ›   - /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/@oclif/core/li<br> ›   b/index.js<br> ›   - <br> ›   /Users/mattnewman/.npm/_npx/6bc7bae5c2059953/node_modules/eas-cli/bin/run<br> ›   Code: MODULE_NOT_FOUND | Authenticate with EAS or set EXPO_TOKEN before remote capture. |
| eas-project | ready | projectId=69335c75-753e-424e-8a76-c8bd2455a112<br>owner=xxmnewman9xx | None |
| app-identity | ready | bundleIdentifier=com.mattnewman.studyplanner<br>scheme=studyplanner | None |
| simulator-build-profile | ready | profile=back-to-school-sim<br>ios.simulator=true<br>captureEnv=1 | None |
| simulator-env-ignore | ready | .env.eas-simulator is ignored by git. | None |
| remote-capture-runner | ready | scripts/run-back-to-school-remote-capture.ts exists<br>plan:back-to-school-remote-capture is wired<br>capture:back-to-school-remote is wired<br>qa/back-to-school-2026/remote-capture-run.json | None |
| capture-targets | blocked | 102/102 app capture targets available. | Regenerate the Back-to-School native capture plan. |
| capture-deeplinks | ready | 102 deep links generated<br>Longest deep link: 274 chars | None |

## Command Order

1. Confirm the guarded runner without starting a session:
   `npm run plan:back-to-school-remote-capture`
2. Build simulator artifact:
   `npx --yes eas-cli@latest build --platform ios --profile back-to-school-sim --non-interactive`
3. Set `ARTIFACT_URL` to the EAS artifact URL and run the capture pipeline:
   `npm run capture:back-to-school-remote -- --artifact-url "$ARTIFACT_URL"`

The runner resets the simulator session file, starts EAS Simulator, polls until live, installs the artifact, opens each deep link below, captures screenshots, writes `qa/back-to-school-2026/remote-capture-run.json`, writes `qa-screenshots/back-to-school-2026-native/manifest.json`, stops the simulator, and clears `.env.eas-simulator` on exit.

## Manual Command Reference

1. Reset simulator session file:
   `printf '# managed by eas-cli\n' > .env.eas-simulator`
2. Start remote simulator:
   `npx --yes eas-cli@latest simulator:start --platform ios --type agent-device --non-interactive`
3. Poll until live:
   `for i in $(seq 1 64); do S=$(npx --yes eas-cli@latest simulator:get --json --non-interactive 2>/dev/null); echo "$S" | grep -q '"status": *"IN_PROGRESS"' && echo "$S" | grep -q remoteConfig && { echo live; break; }; echo "$S" | grep -qE '"status": *"(STOPPED|ERRORED)"' && { echo boot failed; break; }; sleep 15; done`
4. Set `ARTIFACT_URL` to the EAS artifact URL and install:
   `npx --yes eas-cli@latest simulator:exec npx --yes agent-device@latest install-from-source "$ARTIFACT_URL" --platform ios`
5. Open each capture deep link below, wait for the UI to settle, and run its screenshot command.
6. Stop the simulator and clear `.env.eas-simulator`:
   `npx --yes eas-cli@latest simulator:stop`
   `printf '# managed by eas-cli\n' > .env.eas-simulator`

## Capture Targets

| Capture ID | File | Deep link length | Required proof |
| --- | --- | --- | --- |
| app-00-scan-current | en-US/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | en-US/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | en-US/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | en-US/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | en-US/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | en-US/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | en-CA/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | en-CA/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | en-CA/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | en-CA/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | en-CA/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | en-CA/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | en-GB/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | en-GB/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | en-GB/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | en-GB/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | en-GB/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | en-GB/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | en-AU/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | en-AU/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | en-AU/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | en-AU/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | en-AU/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | en-AU/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | de-DE/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | de-DE/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | de-DE/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | de-DE/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | de-DE/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | de-DE/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | es-ES/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | es-ES/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | es-ES/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | es-ES/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | es-ES/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | es-ES/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | es-MX/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | es-MX/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | es-MX/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | es-MX/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | es-MX/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | es-MX/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | fr-FR/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | fr-FR/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | fr-FR/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | fr-FR/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | fr-FR/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | fr-FR/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | fr-CA/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | fr-CA/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | fr-CA/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | fr-CA/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | fr-CA/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | fr-CA/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | pt-BR/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | pt-BR/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | pt-BR/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | pt-BR/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | pt-BR/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | pt-BR/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | pt-PT/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | pt-PT/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | pt-PT/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | pt-PT/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | pt-PT/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | pt-PT/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | ar-SA/app-00-scan-current.png | 167 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | ar-SA/app-06-review.png | 175 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | ar-SA/app-07-semester-ready.png | 170 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | ar-SA/app-08-today.png | 168 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | ar-SA/app-09-focus.png | 166 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | ar-SA/app-10-widgets.png | 272 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | hi/app-00-scan-current.png | 164 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | hi/app-06-review.png | 172 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | hi/app-07-semester-ready.png | 167 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | hi/app-08-today.png | 165 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | hi/app-09-focus.png | 163 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | hi/app-10-widgets.png | 269 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | ja/app-00-scan-current.png | 164 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | ja/app-06-review.png | 172 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | ja/app-07-semester-ready.png | 167 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | ja/app-08-today.png | 165 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | ja/app-09-focus.png | 163 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | ja/app-10-widgets.png | 269 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | ko/app-00-scan-current.png | 164 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | ko/app-06-review.png | 172 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | ko/app-07-semester-ready.png | 167 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | ko/app-08-today.png | 165 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | ko/app-09-focus.png | 163 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | ko/app-10-widgets.png | 269 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | zh-Hans/app-00-scan-current.png | 169 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | zh-Hans/app-06-review.png | 177 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | zh-Hans/app-07-semester-ready.png | 172 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | zh-Hans/app-08-today.png | 170 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | zh-Hans/app-09-focus.png | 168 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | zh-Hans/app-10-widgets.png | 274 chars | Semester Calendar is presented as the recommended Home Screen surface. |
| app-00-scan-current | zh-Hant/app-00-scan-current.png | 169 chars | Latest Scan tab shows syllabus/PDF intake, notes intake, and review-before-save proof. |
| app-06-review | zh-Hant/app-06-review.png | 177 chars | Student reviews detected courses, deadlines, exams, and uncertain dates before save. |
| app-07-semester-ready | zh-Hant/app-07-semester-ready.png | 172 chars | Semester Pulse, next move, first focus block, and widget recommendation are visible. |
| app-08-today | zh-Hant/app-08-today.png | 170 chars | Dashboard feels semester-ready, not like a generic task list. |
| app-09-focus | zh-Hant/app-09-focus.png | 168 chars | The first study block is actionable and not cramming-oriented. |
| app-10-widgets | zh-Hant/app-10-widgets.png | 274 chars | Semester Calendar is presented as the recommended Home Screen surface. |

## Rules

- Use only the `back-to-school-sim` profile for this capture path; it is the profile that enables the guarded release capture hook.
- The capture hook is disabled in normal production because it requires `EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1`.
- Do not use Expo Go for WidgetKit proof.
- Do not composite Home Screen widget screenshots.
- Stop the EAS Simulator session on every exit path.
