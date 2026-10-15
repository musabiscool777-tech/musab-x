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

Add `BROWSERLESS_TOKEN` as an encrypted **Worker runtime secret**, not a public variable or frontend setting. The integration uses `https://production-sfo.browserless.io/chrome/bql` to create a detached, interactive LiveURL, then embeds only that short-lived viewer. No provider token is sent to the client or written into logs. The service plan must support BrowserQL and interactive LiveURL.

Deployment applies `drizzle/0002_live_browser.sql` automatically through the existing migration command. Sign in to Musab X with GitHub before starting a session. Each start is bounded to two minutes (or less if the provider plan requires it), with six starts per account per ten minutes enforced atomically in D1. Each start consumes Browserless usage. Reload or a new outer address starts a fresh browser; use the address bar and tabs **inside the viewer** to navigate within the running session. Switching Musab X tabs reuses the viewer link while it remains valid. Remote website logins are temporary and are not synced as workspace data.

Browserless viewer links are bearer credentials: anyone holding one can view/control that session. They stay in browser memory, not bookmarks, exports, or account data. Closed or abandoned sessions are bounded by the two-minute lifetime. Expired sessions require an explicit restart; there is no automatic spending loop.

Google may show consent, CAPTCHA, or other access checks. Site features, video playback, and latency depend on the remote browser and service plan. Missing secrets, login, plan restrictions, and usage limits appear as errors rather than loading a blocked Google iframe. The server search and reader endpoints remain for compatibility but are unused by Live browsing. Browsing does not make users anonymous.

## Moving existing data

The independent host creates a new D1 database and identifies users by their verified GitHub account. It does not automatically transfer the previous host's accounts or data. On the previous host, use Settings → Export data. On the independent host, sign in and use Settings → Import data. Import validates the JSON and asks before replacing existing workspace data. Each user imports their own export.

The historical Sites configuration remains available for compatibility with the original deployment; independent builds use `vite.independent.config.ts`, `wrangler.independent.json`, and `worker/index.ts` instead. Do not use the default Sites build command for the independent host.
