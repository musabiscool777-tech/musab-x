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
- Searches navigate directly to Google's original search page. The browsing UI does not use the search-result API or public-page reader.
- Website-only fullscreen: the live website container expands; the Musab X sidebar and address bar are outside fullscreen. Escape or Exit fullscreen returns to the workspace.
- GitHub sign-in, secure cookie sessions, per-account D1 storage, owner/member roles, and member controls.
- Guest bookmarks, history, notes, settings, and JSON export/import.

## Limits

Google and destination websites control whether their pages may appear in an embedded frame. A direct Google URL is not a guarantee of embedding: consent screens, anti-bot challenges, cookies, or frame restrictions can prevent it. Use the small Open original control if a page is blank or blocked. No claim is made that all Google features work inside the frame.

Links and navigation inside a cross-origin website are controlled by that website. Musab X cannot inspect them, synchronize its outer address/history with those navigations, or force every popup into a workspace tab. Native page popups may open browser tabs. Native fullscreen requires browser support and a user click; otherwise the website expands over the workspace until Exit fullscreen.

The server search and reader endpoints remain available for compatibility but are unused by Live browsing. No search API key is needed for this UI. Browsing does not make users anonymous.

## Moving existing data

The independent host creates a new D1 database and identifies users by their verified GitHub account. It does not automatically transfer the previous host's accounts or data. On the previous host, use Settings → Export data. On the independent host, sign in and use Settings → Import data. Import validates the JSON and asks before replacing existing workspace data. Each user imports their own export.

The historical Sites configuration remains available for compatibility with the original deployment; independent builds use `vite.independent.config.ts`, `wrangler.independent.json`, and `worker/index.ts` instead. Do not use the default Sites build command for the independent host.
