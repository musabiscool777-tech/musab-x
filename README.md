# Musab X

A personal web workspace with internal search, tabs, public-page reading, bookmarks, notes, synced accounts, and administrator controls.

## Run from GitHub on Cloudflare

The independent build runs entirely on your Cloudflare Workers account with your own D1 database. It has no chatgpt.site runtime dependency. GitHub stores the code and can trigger deployments. GitHub Pages cannot run this application's server or database.

Start with [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md). It covers repository import, database creation, GitHub sign-in, settings, and exact build/deploy commands. The repository is https://github.com/musabiscool777-tech/musab-x.

- `npm run build:independent`: build the independent Cloudflare Worker.
- `npm test`: run search and account security regression checks.
- `.github/workflows/deploy-cloudflare.yml`: optional GitHub Actions deployments, disabled until `CLOUDFLARE_DEPLOY_ENABLED=true` is set.

## Features

- Bing web/news search feeds and video links without a search API key; automatic fallback if the optional Google connection fails.
- Optional Google web/image/news/video search through SerpAPI, including pagination and related searches. Requires `SERPAPI_KEY` in Worker runtime secrets.
- Public-page Reader with internal links; Live view where destination sites allow embedding; embedded YouTube videos where permitted.
- GitHub sign-in on the independent host, secure cookie sessions, per-account D1 storage, owner and member roles, and member enable/disable controls.
- Local guest bookmarks, history, notes, and settings; account sync for signed-in users.
- JSON export/import for transfers, dark/light themes, recent visits, and focused/wide reading.

## Limits

Reader extracts public HTML text; it does not run destination scripts or operate external accounts. Some sites reject server reading or embedded views. External logins and unsupported pages need the original website. Cross-origin frame navigation cannot be intercepted as workspace tabs. The application does not make browsing anonymous.

Bing feed results are for personal, non-commercial use; they can be rate-limited or unavailable. Feed filtering can differ from Google Safe Search. Google image results and pagination require the optional Google connection. Provider credentials remain server-side.

## Moving existing data

The independent host creates a new D1 database and identifies users by their verified GitHub account. It does not automatically transfer the previous host's accounts or data. On the previous host, use Settings → Export data. On the independent host, sign in and use Settings → Import data. Import validates the JSON and asks before replacing existing workspace data. Each user imports their own export.

The historical Sites configuration remains available for compatibility with the original deployment; independent builds use `vite.independent.config.ts`, `wrangler.independent.json`, and `worker/index.ts` instead. Do not use the default Sites build command for the independent host.
