# Apple ASO and Submission Research

Date checked: 2026-05-12  
Source policy: Official Apple Developer and App Store Connect documentation only for policy requirements. Third-party ASO inspiration is deferred until after policy-safe metadata is drafted.

## Policy Findings

| Topic | Official source | Finding | Impact for StudyPlanner |
| --- | --- | --- | --- |
| App Review completeness | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Apple says apps should be tested for crashes/bugs, metadata must be complete and accurate, backend services must be accessible, and non-obvious features/IAPs should be explained in review notes. | The submission handoff must include reviewer steps, IAP details, parser/OCR limitations, widget scope, and any backend/parser endpoint status. |
| Accurate metadata and screenshots | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | Metadata, privacy information, description, screenshots, and previews must accurately reflect the app's core experience; misleading marketing is a rejection/removal risk. | ASO copy must not claim perfect extraction, guaranteed grades, automatic completeness, unsupported widgets, or fake AI/OCR certainty. |
| App screenshots | [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) | Apple requires one to ten screenshots in `.jpeg`, `.jpg`, or `.png`. Current accepted iPhone sizes include 6.9-inch portrait sizes such as 1260x2736, 1290x2796, and 1320x2868. | Raw simulator screenshots are evidence, but final App Store uploads may need resizing/compositing to accepted device sizes. |
| Uploading screenshots | [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots) | Screenshot/app-preview edits are available in editable app statuses; one to ten screenshots are allowed; highest-resolution screenshots can scale down when UI is the same; localized media can be added in Media Manager. | Capture individual PNGs now, then prepare default and localized screenshot order. No videos are required for this goal. |
| App previews | [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) and [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots) | App previews are optional and up to three per localization/device size. | The user explicitly requested no preview videos; screenshots-only is policy-safe. |
| App name and subtitle | [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) | App name is 2-30 characters; subtitle is max 30 characters. Privacy Policy URL is required for iOS/macOS. Bundle ID must match the build. | Recommended names/subtitles must be length-checked. Bundle ID in `app.json` and Xcode must stay `com.mattnewman.studyplanner`. |
| Description, promo text, keywords, support URL | [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) | Promotional text is max 170 characters; description is max 4000 characters; keywords are required, localizable, and max 100 bytes; support URL is required and must lead to actual contact information. | ASO package must include length-safe metadata and a support URL status. Current privacy URL exists; support URL must be verified/provided before submission. |
| Metadata localization | [Localize app information](https://developer.apple.com/help/app-store-connect/manage-app-information/localize-app-information/) | Localized metadata affects what users see and what localized keywords they can search. New language metadata defaults screenshots/properties from primary language except description and keywords. | Localization packs can improve search reach, but localized screenshots/captions need review. Native-speaker review remains required before submission in non-English locales. |
| Primary language changes | [Localize app information](https://developer.apple.com/help/app-store-connect/manage-app-information/localize-app-information/) | Changing primary language requires the localization and screenshots to be approved; screenshots must match sizes. | Keep `en-US` as practical primary unless App Store Connect evidence says otherwise. |
| Product Page Optimization | [Product Page Optimization](https://developer.apple.com/app-store/product-page-optimization/) and [ASC PPO overview](https://developer.apple.com/help/app-store-connect/create-product-page-optimization-tests/overview-of-product-page-optimization) | PPO can test up to three alternate app icons, screenshots, and previews. Tests are for Ready for Distribution apps, can be localized, and use App Analytics to evaluate conversion. | Draft PPO variants for syllabus proof, stress relief, widget-first, and parent trust. Do not claim test winners until live data exists. |
| Custom Product Pages | [Custom Product Pages](https://developer.apple.com/app-store/custom-product-pages/) and [Configure multiple product page versions](https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions) | Apple now allows up to 70 additional product page versions for iPhone/iPad. Pages can vary screenshots, promotional text, previews, and keywords, and can be linked/shared; metadata requires review. | Create concepts for Middle School Planner, Syllabus AI, Homework Widgets, and ADHD School Calm. Keep claims and visuals feature-true. |
| Custom Product Page keywords/deep links | [Configure multiple product page versions](https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions) | Custom pages can assign approved-version keywords and optional deep links; deep links require iOS/iPadOS 18+ and review. | Keyword-page mapping is useful. Deep links should be deferred unless tested through `studyplanner://` and approved as part of the page. |
| IAP payment rule | [App Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/) | Digital feature unlocks must use in-app purchase; restorable IAPs need a restore mechanism. | StudyPlanner Plus must stay StoreKit-backed. No external unlocks, fake entitlement, or fake Lifetime state. |
| Auto-renewable subscriptions | [App Review Guidelines 3.1.2](https://developer.apple.com/app-store/review/guidelines/) and [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions) | Subscriptions must provide ongoing value; subscription groups control product levels/durations and users can subscribe to one product per group at a time. | Monthly/yearly Plus must be in one subscription group with clear value and cancellation/store account messaging. |
| Lifetime IAP type | [In-App Purchase types](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types) | Non-consumable is purchased once and does not expire/decrease with use. | Lifetime must remain a real non-consumable IAP: `com.mattnewman.studyplanner.plus.lifetime`. |
| Creating non-consumable IAP | [Create consumable or non-consumable IAPs](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-consumable-or-non-consumable-in-app-purchases) | App Store Connect requires choosing consumable/non-consumable, then adding reference name and Product ID. | Submission handoff must confirm the Lifetime product exists in App Store Connect, not only in code. |
| Sandbox IAP testing | [Overview of testing in sandbox](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/overview-of-testing-in-sandbox) | Apple provides sandbox testing with test accounts; scenarios include storefronts, subscriptions, server notifications, Family Sharing, Apple Pay, and StoreKit Testing in Xcode. | Static `check:iap` is insufficient for submit-ready confidence. Need sandbox proof for monthly, yearly, Lifetime, failed product load, and restore. |
| Privacy policy | [App Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/) and [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) | App Store metadata and the app must include an accessible privacy policy that identifies data collection/use, sharing protections, retention/deletion, and consent withdrawal. | Existing privacy URL in `src/services/purchaseConfig.ts` must be checked for completeness and in-app discoverability. |
| Support contact | [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information) and [App Review Guidelines 1.5](https://developer.apple.com/app-store/review/guidelines/) | Support URL is required and should provide real contact information; classroom-used apps especially need reachable developer contact. | Submission handoff must mark support URL as blocker until a real support page/email is confirmed. |

## StudyPlanner-Specific Conservative Claim Bank

Use:

- Scan school materials.
- Upload syllabus files or photos.
- Check found assignments before adding them.
- Track due dates, classes, and busy weeks.
- Keep confirmed schoolwork visible in Today, Calendar, Week Plan, Classes, and supported Home Screen widgets.
- Customize class colors and widget styles.
- Set reminders and calendar sync from confirmed assignments.

Avoid:

- Perfectly extracts every assignment.
- Never miss homework.
- Guaranteed better grades.
- Fully automatic semester planning.
- Works with every syllabus.
- No mistakes.
- Replaces checking your syllabus.
- Instantly detects everything.
- Large widgets, Lock Screen widgets, or app preview videos unless implemented and captured.

## Submission Risks Open After Research

1. StoreKit sandbox proof is still missing for monthly, yearly, Lifetime, restore, and product-load failure.
2. Support URL is not yet confirmed in code or handoff.
3. Final App Store screenshots still need accepted-size export planning.
4. Localized ASO can be drafted now, but should require native-speaker/legal review before upload.
5. Custom Product Pages and PPO are strong ASO levers but require review and Ready for Distribution context.
