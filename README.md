# Musab X

A personal web workspace built with React, Vinext, Cloudflare Workers, and D1.

## Features
- Bing web/news search feeds and video links work without an API key, with automatic fallback if the Google connection fails.
- Google results integration through SerpAPI, with web, image, news, and video tabs, pagination, quick answers, and related searches. Requires a configured SERPAPI_KEY.
- Public-page reader with links that open inside the workspace, without requiring account sign-in.
- YouTube video links open in an embedded player when embedding is allowed.
- Live embedded view where destination sites permit it.
- Account-owned bookmarks, history, notes, settings, and JSON export.
- ChatGPT sign-in, administrator roles, and member enable/disable controls.
- Responsive dark and light themes, a simplified homepage, recent visits, and focused/wide reading.
- Signed-out bookmarks, notes, history, and preferences save locally in the browser; signed-in workspaces retain account sync.

## Limits
Reader view extracts public HTML text; it does not run destination scripts, submit forms, or handle external website accounts. Live view is subject to embedding policies and browser cookie rules. External logins and unsupported sites must open on the original website. Links inside a cross-origin live frame cannot be intercepted as workspace tabs. Direct search-page scraping is not used. A connected search service is required for inline Google results. Without it, the app displays Bing RSS search results inside the workspace. Bing feed results are for personal, non-commercial use and may be rate-limited or unavailable. Feed Safe Search behavior may differ from Google. Image results and Google pagination require the Google connection. This app does not make browsing anonymous.

The application supports public hosting. Set OWNER_EMAIL in the hosted runtime to assign the owner administrator access; other visitors join as members. Owner access cannot be disabled or demoted through member management. Account data is isolated by authenticated Site identity, with server-side role checks and optimistic concurrency on saves.

## Optional Google search setup
Configure SERPAPI_KEY as a secret in the hosted Site runtime, then deploy the current saved version to apply it. The key must belong to the site owner and have available search quota. The app sends queries to SerpAPI to retrieve Google results. Credentials remain server-side. No subscription or billing is automatically enabled. Google features are shown when the service returns them; this does not reproduce every Google interface feature or make arbitrary sites embeddable.

## Development
Run `node tests/search.test.mjs` for search parsing and fallback regression checks.
Run `npm run install:ci`, `npm run db:generate` after schema changes, and `npm run build`. The Sites helper builds and packages production assets. D1 migrations are applied during deployment. Secrets and connection tokens must never be committed.

## GitHub
The connected GitHub tools currently cannot create a repository. This source is ready to upload to a new repository named `musab-x`; the deployed Site source is tracked separately.
