# Latest Local Build Push Report

App: StudyPlanner AI

Target: latest local source equivalent to TestFlight build 52

All local candidate folders found:
- /Users/mattnewman/work/StudyPlanner
- /Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai
- /Users/mattnewman/.openclaw/workspace-studyplanner
- /Users/mattnewman/work/studyplanner-carousel-system
- /Users/mattnewman/work/CreativePipeline/StudyPlanner
- /Users/mattnewman/work/FounderVault/02_APPS/StudyPlanner
- /Users/mattnewman/work/_HygieneArchive/StudyPlanner_20260514

Chosen source folder:
- /Users/mattnewman/Documents/Codex/2026-06-04/files-mentioned-by-the-user-study/studyplanner-ai

Why it was chosen:
- This folder explicitly contains app.json iOS buildNumber 52 and version 1.0.3.
- It contains BUILD_52_* release, verification, TestFlight, stress, onboarding, entitlement, and post-upload QA reports.
- It contains build-52-artifacts/studyplanner-build52.ipa with a 2026-06-06 timestamp.
- /Users/mattnewman/work/StudyPlanner is older for this target: app.json shows buildNumber 50 and its latest local reports stop at build 51.
- /Users/mattnewman/.openclaw/workspace-studyplanner has no commits and is not app source.

Branch:
- studyplanner-build-52-source

Source-state commit hash:
- 3decfd2

GitHub remote URL:
- https://github.com/xxmnewman9xx/studyplanner

Detected version/build number:
- iOS version 1.0.3
- iOS build 52

Matched latest local build:
- Yes. This matched the local TestFlight build 52 evidence found in app config, BUILD_52 reports, and build-52-artifacts/studyplanner-build52.ipa.

Pushed successfully:
- Yes. The branch and tag were pushed after this report was committed.

Tag pushed:
- studyplanner-android-source-build-52

Uncertainties/blockers:
- The chosen folder did not originally have a GitHub remote, so it was pushed to the existing StudyPlanner GitHub repository as a dedicated source-sync branch rather than merged into the older /Users/mattnewman/work/StudyPlanner main checkout.
- Build artifacts and generated native/dependency folders were left local and not committed; they are recorded as evidence but the pushed state is the source/doc/config state.
