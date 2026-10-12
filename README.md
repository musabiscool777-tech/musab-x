# Musab X

A personal web workspace built with React, Vinext, Cloudflare Workers, and D1.

## Features
- DuckDuckGo search with workspace tabs and Safe Search settings.
- Public-page reader with links that open inside the workspace.
- Live embedded view where destination sites permit it.
- Account-owned bookmarks, history, notes, settings, and JSON export.
- ChatGPT sign-in, administrator roles, and member enable/disable controls.
- Responsive dark and light themes.

## Limits
Reader view extracts public HTML text; it does not run destination scripts, submit forms, or handle external website accounts. Live view is subject to embedding policies and browser cookie rules. External logins and unsupported sites must open on the original website. Links inside a cross-origin live frame cannot be intercepted as workspace tabs. DuckDuckGo can rate-limit automated search requests; the interface offers a direct search link when results are unavailable. This app does not make browsing anonymous.

The application supports public hosting. Set OWNER_EMAIL in the hosted runtime to assign the owner administrator access; other visitors join as members. Owner access cannot be disabled or demoted through member management. Account data is isolated by authenticated Site identity, with server-side role checks and optimistic concurrency on saves.

## Development
Run `npm run install:ci`, `npm run db:generate` after schema changes, and `npm run build`. The Sites helper builds and packages production assets. D1 migrations are applied during deployment. Secrets and connection tokens must never be committed.

## GitHub
Repository: https://github.com/musabiscool777-tech/musab-x

Live instance: https://musab-x.royalelk3.chatgpt.site

The hosted application uses Sites authentication, Workers, and D1. GitHub stores the source; GitHub Pages cannot run the server routes or account database. The deployed Site source is tracked separately, so GitHub commits do not automatically redeploy the live instance.
