# Musab X

A personal web workspace with internal search, tabs, public-page reading, bookmarks, notes, synced accounts, and administrator controls.

## Run from GitHub on Cloudflare

The independent build runs entirely on your Cloudflare Workers account with your own D1 database. It has no chatgpt.site runtime dependency. GitHub stores the code and can trigger deployments. GitHub Pages cannot run this application's server or database.

Start with [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md). It covers repository import, database creation, GitHub sign-in, settings, and exact build/deploy commands. The repository is https://github.com/musabiscool777-tech/musab-x.

- `npm run build:independent`: build the independent Cloudflare Worker.
- `npm test`: run search and account security regression checks.
- `.github/workflows/deploy-cloudflare.yml`: optional GitHub Actions deployments, disabled until `CLOUDFLARE_DEPLOY_ENABLED=true` is set.

## Features

- Live view only: original websites fill the area beneath the address bar, preserving their own layout, images, video, and scripts.
- Google and visited websites run in an interactive Browserless remote browser. The browsing UI does not use the search-result API or public-page reader. Set the Worker runtime secret `BROWSERLESS_TOKEN` to enable it.
- Website-only fullscreen: the live website container expands; the Musab X sidebar and address bar are outside fullscreen. Escape or Exit fullscreen returns to the workspace.
- GitHub sign-in, secure cookie sessions, per-account D1 storage, owner/member roles, and member controls.
- Guest bookmarks, history, notes, settings, and JSON export/import. Starting a remote browser requires Musab X sign-in to protect the service token and account quota.

## Live browser setup and limits

Add `BROWSERLESS_TOKEN` as an encrypted **Worker runtime secret**, not a public variable or frontend setting. The integration uses `https://production-sfo.browserless.io/chrome/bql` to create a detached, interactive LiveURL, then embeds only that short-lived viewer. No provider API token is sent to the client or written into logs. The service plan must support BrowserQL and interactive LiveURL.

Deployment applies `drizzle/0002_live_browser.sql` automatically through the existing migration command. Sign in to Musab X before starting a session. New sessions request one hour by default, with 2/15/30/60/120-minute choices in Settings. Both the browser launch timeout and viewer timeout use the selected duration. Browserless plan limits still apply; a rejected duration is explained, and a shorter granted lifetime is reflected in the viewer expiry. The service does not offer an unlimited option. Six starts per account per ten minutes remain enforced atomically in D1. Each start consumes Browserless usage. Reload or a new outer address starts a fresh browser; search and click links **within the displayed website** to navigate within the running session. Browserless tabs and its extra address bar are hidden. Switching Musab X tabs reuses the viewer link while it remains valid. Remote website logins are temporary and are not synced as workspace data.

Browserless viewer links are bearer credentials: anyone holding one can view/control that session. They stay in browser memory, not bookmarks, exports, or account data. Closed or abandoned sessions are bounded by the selected/provider-enforced lifetime. Longer sessions consume more provider usage. Expired sessions require an explicit restart; there is no automatic spending loop.

Google may show consent, CAPTCHA, or other access checks. Site features, video playback, and latency depend on the remote browser and service plan. Missing secrets, login, plan restrictions, and usage limits appear as errors rather than loading a blocked Google iframe. The server search and reader endpoints remain for compatibility but are unused by Live browsing. Browsing does not make users anonymous.

## Moving existing data

The independent host creates a new D1 database and identifies users by their verified GitHub or linked email identity. It does not automatically transfer the previous host's accounts or data. On the previous host, use Settings → Export data. On the independent host, sign in and use Settings → Import data. Import validates the JSON and asks before replacing existing workspace data. Each user imports their own export.

The historical Sites configuration remains available for compatibility with the original deployment; independent builds use `vite.independent.config.ts`, `wrangler.independent.json`, and `worker/index.ts` instead. Do not use the default Sites build command for the independent host.

## Email sign-in

Email/password and emailed one-time-code sign-in are implemented using managed Supabase Auth. Enable them using [EMAIL_AUTH_SETUP.md](EMAIL_AUTH_SETUP.md); until configured, the UI explains that email setup is pending and GitHub remains available. Account → Link email verifies both the current workspace session and the email identity, preserving the existing account, data, and admin role. Matching email strings alone never link identities or grant admin access. Password reset uses a verified email code and revokes existing local sessions. Provider credentials and access/refresh tokens are never returned to the client; app sessions use Secure/HttpOnly cookies.

## Browser quality and loading

Settings → Browser image quality offers Fast (JPEG 60, 1×), Balanced (JPEG 85, 1×), and Sharp (JPEG 92, 2×). Fast and Balanced disable extra stream compression for lower processing latency; Sharp compresses the higher-resolution stream to reduce its bandwidth cost. The viewer starts when the navigation response commits, rather than waiting for DOMContentLoaded, and the page preconnects to the Browserless region. These reduce avoidable startup/stream overhead; actual scrolling, frame rate, and website loading still depend on the network and remote service. Quality changes apply to new sessions.
