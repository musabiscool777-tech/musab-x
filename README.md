# Musab X

A personal web workspace with internal search, tabs, public-page reading, bookmarks, notes, synced accounts, and administrator controls.

## Run from GitHub on Cloudflare

The independent build runs entirely on your Cloudflare Workers account with your own D1 database. It has no chatgpt.site runtime dependency. GitHub stores the code and can trigger deployments. GitHub Pages cannot run this application's server or database.

Start with [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md). It covers repository import, database creation, GitHub sign-in, settings, and exact build/deploy commands. The repository is https://github.com/musabiscool777-tech/musab-x.

- `npm run build:independent`: build the independent Cloudflare Worker.
- `npm test`: run search and account security regression checks.
- `.github/workflows/deploy-cloudflare.yml`: optional GitHub Actions deployments, disabled until `CLOUDFLARE_DEPLOY_ENABLED=true` is set.

## Features

- Live view only: complete original website pages appear beneath the address bar using Scramjet 1.1.0 and Epoxy 2.1.28. Google searches open the Google website; the result API and reader are not used by the browser.
- Pages render as native HTML, images and JavaScript instead of compressed remote-browser video. Scrolling is local. Website compatibility, CAPTCHA and network speed still vary.
- A separate `musab-x-browser` Worker serves the renderer and authenticated Wisp TCP relay. Rewritten websites never execute on the workspace's authenticated origin.
- No Browserless subscription, token, minute allowance or two-minute session cap is needed. Cloudflare free-plan request, CPU and connection limits still apply; free hosting is not unlimited.
- Website-only fullscreen, persistent live workspace tabs, GitHub/email account support, per-account saved data and administrator controls.
- Browser access requires Musab X sign-in. Guest bookmarks, notes, history and export/import remain available.

## Browser hosting

The existing build and deployment commands now publish two Workers automatically. `scripts/configure-independent.mjs` shares the existing D1 binding and derives `BROWSER_ORIGIN` from the standard `musab-x.<account>.workers.dev` address. For custom domains, set the public build variable `BROWSER_ORIGIN` to the separately hosted browser origin. The build token needs Workers deployment permission for both `musab-x` and `musab-x-browser`, plus D1 Edit. Existing secrets are preserved. See [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).

The workspace issues a one-use, 60-second ticket, exchanged on the browser origin for its own HttpOnly cookie. Tickets are sent through a checked cross-origin message, never in URLs. Browser sessions last eight hours and refresh after six hours without replacing the page. These are account authorizations, not paid browser sessions. Reconnecting does not purchase minutes. The relay checks account status and accepts only public TCP destinations on ports 80/443, with validated DNS pinned to the connected IP. It supports Wisp v1 with bounded per-stream queues and six concurrent TCP streams per connection. UDP is disabled.

Cloudflare blocks TCP connections to Cloudflare-hosted destination IPs, private networks and loopback. Consequently some websites cannot load through this relay even when Google works. Authentication, DRM, complex sites and browser storage restrictions can also cause compatibility issues. Browsing does not make users anonymous. The isolated browser's website data stays in that browser profile and is not synced as workspace data. Open-source notices and source links are available at the browser origin's `/NOTICE.txt` and [browser/NOTICE.txt](browser/NOTICE.txt).

Legacy `/api/live` remains for compatibility with older clients, with its previous authenticated Browserless limits; the current UI never calls it. Existing `BROWSERLESS_TOKEN` and `SERPAPI_KEY` secrets are unnecessary for the new browser.

## Moving existing data

The independent host creates a new D1 database and identifies users by their verified GitHub or linked email identity. It does not automatically transfer the previous host's accounts or data. On the previous host, use Settings → Export data. On the independent host, sign in and use Settings → Import data. Import validates the JSON and asks before replacing existing workspace data. Each user imports their own export.

The historical Sites configuration remains available for compatibility with the original deployment; independent builds use `vite.independent.config.ts`, `wrangler.independent.json`, and `worker/index.ts` instead. Do not use the default Sites build command for the independent host.

## Email sign-in

Email/password and emailed one-time-code sign-in are implemented using managed Supabase Auth. Enable them using [EMAIL_AUTH_SETUP.md](EMAIL_AUTH_SETUP.md); until configured, the UI explains that email setup is pending and GitHub remains available. Account → Link email verifies both the current workspace session and the email identity, preserving the existing account, data, and admin role. Matching email strings alone never link identities or grant admin access. Password reset uses a verified email code and revokes existing local sessions. Provider credentials and access/refresh tokens are never returned to the client; app sessions use Secure/HttpOnly cookies.

## Validation

`npm test` covers account authentication, email linking, origin checks, one-use browser tickets, disabled/expired access, DNS pinning, and Wisp handshake/data/ordering/flow control. `npm run build:independent` builds the workspace and copies locked browser packages into separate static assets. `npx wrangler deploy --dry-run --config wrangler.browser.json` validates the relay bundle.
