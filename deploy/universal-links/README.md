# Universal links for Class Pack and Quiz Duel

Static files for `https://studyplanner-ai.xxmnewman9xx.workers.dev`. They serve:

| Path | File | Purpose |
|---|---|---|
| `/.well-known/apple-app-site-association` | `.well-known/apple-app-site-association` | Tells iOS that `/p`, `/p/*`, `/d` and `/d/*` open StudyPlanner (`5JN35MJ3QD.com.mattnewman.studyplanner`). |
| `/p` | `p/index.html` | Class Pack landing page (`/p#v1.<data>`). |
| `/d` | `d/index.html` | Quiz Duel landing page (`/d#v1.<data>`). |
| n/a | `_headers` | Forces `Content-Type: application/json` on the AASA file and `no-referrer` on the pages. |

The payload lives only in the `#fragment`. Browsers never send the fragment to the server, and the pages read it with `location.hash` on the device. Each page also sets a Content-Security-Policy with `default-src 'none'`, so it cannot make network requests.

The app side is already configured: `app.json` has `ios.associatedDomains: ["applinks:studyplanner-ai.xxmnewman9xx.workers.dev"]`. The Team ID `5JN35MJ3QD` comes from `expo.ios.appleTeamId`.

## Deploy (Cloudflare Workers static assets)

The worker already serves `/privacy` and `/support`, and its source is not in this repo. Copy this folder's contents into that worker's assets directory, so that `.well-known/`, `p/`, `d/` and `_headers` sit at the root of the assets directory.

1. Point `wrangler.jsonc` (or `wrangler.toml`) at the assets directory. Use `drop-trailing-slash` so `/p` serves `p/index.html` without a redirect:

   ```jsonc
   {
     "name": "studyplanner-ai",
     "compatibility_date": "2026-09-01",
     "assets": {
       "directory": "./public",
       "html_handling": "drop-trailing-slash",
       "not_found_handling": "none"
     }
   }
   ```

   If the worker has a `main` script that handles every request, set `"run_worker_first": false` (the default). Otherwise, make sure the script returns `env.ASSETS.fetch(request)` for `/.well-known/*`, `/p*` and `/d*`.

2. Check that `.well-known` is uploaded. Wrangler skips anything listed in `.assetsignore`, so make sure `.well-known` is not listed there.

3. Deploy the worker with `npx wrangler deploy`.

4. Verify. The AASA file must return `200` directly: no redirect, JSON content type, and no auth or bot challenge on this path.

   ```sh
   curl -sI https://studyplanner-ai.xxmnewman9xx.workers.dev/.well-known/apple-app-site-association
   # HTTP/2 200
   # content-type: application/json

   curl -s https://studyplanner-ai.xxmnewman9xx.workers.dev/.well-known/apple-app-site-association | python3 -m json.tool

   # Apple's CDN copy, which is what devices read. It can lag by up to a day after a change:
   curl -s https://app-site-association.cdn-apple.com/a/v1/studyplanner-ai.xxmnewman9xx.workers.dev
   ```

   If `content-type` is still `application/octet-stream`, `_headers` was not picked up. Check that it sits at the root of the assets directory.

5. Test on a device running a TestFlight build that includes the `associatedDomains` entitlement:
   - Paste `https://studyplanner-ai.xxmnewman9xx.workers.dev/p#v1.test` into Notes and tap it. StudyPlanner should open.
   - Open the same link in Safari. The landing page should appear, with the Smart App Banner showing **Open**.
   - For debugging, go to Settings > Developer > Universal Links > Diagnostics and enter the URL.

## Page behaviour

- **Open in StudyPlanner**: Safari never opens a universal link that points to the same domain as the page already showing. So this button uses the app's custom scheme with the same path and fragment: `studyplanner://p#v1.<data>` or `studyplanner://d#v1.<data>`. The Smart App Banner's **Open** button passes the full `https://…/p#v1.<data>` URL to the app. The app's link handler (`packFromUrl`) must therefore accept both forms. The payload is the fragment in either case.
- **Get the app**: `https://apps.apple.com/app/id6766181202?ct=pack` (or `ct=duel`). App Store Connect only counts campaign links that also carry the provider token, `pt=<ProviderID>`. Add it once it is known (App Store Connect > App Analytics > Campaigns > Generate link).
- **Copy pack / Copy duel**: copies the full URL, including the fragment, so the app's first-launch "Paste Class Pack" can restore it.
- **Localization**: `navigator.languages` selects one of the 10 in-app locales (`ar de en es fr hi ja ko pt-BR zh-Hans`). All `pt-*` tags map to `pt-BR`, all `zh-*` tags map to `zh-Hans`, and Arabic switches the page to `dir="rtl"`.
- **Missing or garbled fragment**: the page shows "This link is incomplete" and disables Open and Copy.
