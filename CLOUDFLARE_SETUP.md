# Deploy Musab X on your Cloudflare account

This deploys the full application, including internal search and a synced account database. Use a **Worker**, not Cloudflare Pages or GitHub Pages. Pick either Cloudflare's Git integration (recommended) or GitHub Actions; enabling both would trigger duplicate deployments.

## 1. Reserve the Worker address

In Cloudflare, open **Workers & Pages → Create application** and create a basic Worker named **musab-x**. Its name must match the Wrangler configuration. Copy its actual HTTPS URL, such as the address Cloudflare provides on workers.dev. Use that URL without a trailing slash as `APP_ORIGIN`. The independent app has not deployed until the configured build succeeds.

## 2. Create the account database

In Cloudflare, open **Storage & databases → D1 SQL Database**, create a database named **musab-x**, and copy its database ID. Set that ID as `CLOUDFLARE_D1_DATABASE_ID`. The deploy command applies the repository's migrations automatically; do not paste the website source into the SQL console.

CLI equivalent after installing dependencies and authenticating with `wrangler login`:

```sh
node node_modules/wrangler/bin/wrangler.js d1 create musab-x
```

## 3. Enable GitHub account sign-in

Create an OAuth app at https://github.com/settings/applications/new:

- Application name: **Musab X**
- Homepage URL: your exact `APP_ORIGIN`
- Authorization callback URL: your exact `APP_ORIGIN` plus **/auth/callback**

Copy the Client ID and generate a Client Secret. This sign-in app is separate from Cloudflare's GitHub repository connection. Musab X requests verified email identity, not repository access. Put the Client Secret only in the deployment service's encrypted secret field.

## 4. Connect the repository to Cloudflare

Open the **musab-x** Worker → **Settings → Builds**, connect GitHub, and select **musabiscool777-tech/musab-x**, production branch **main**, repository root **/**.

Set the **Build command**:

```sh
npx --yes pnpm@11.25.0 install --frozen-lockfile && node scripts/configure-independent.mjs && npm test && npm run build:independent
```

Set the **Deploy command**:

```sh
npx wrangler d1 migrations apply musab-x --remote --config wrangler.independent.json && node scripts/deploy-independent.mjs
```

Do not set a static output directory; this is a Worker deployment.

Add these **build variables** (available to both build and deploy steps):

| Name | Value |
| --- | --- |
| `CLOUDFLARE_D1_DATABASE_ID` | The database ID from step 2 |
| `APP_ORIGIN` | The Worker HTTPS origin from step 1, without a trailing slash |
| `GITHUB_CLIENT_ID` | The OAuth app's Client ID |
| `OWNER_GITHUB_ID` | `245616942`, the GitHub ID of repository owner musabiscool777-tech |

Add this encrypted **build secret**:

| Name | Value |
| --- | --- |
| `MUSAB_GITHUB_CLIENT_SECRET` | The OAuth app's Client Secret |

The configuration script embeds only public settings in Worker configuration. The deployment script sends the Client Secret through stdin as the runtime secret `GITHUB_CLIENT_SECRET`; it is never committed or included in frontend assets. Cloudflare's generated build token must also have **D1 Edit** permission to apply database migrations. Restrict token access to the intended Cloudflare account.

Trigger a build or retry the initial import build after all settings are entered. After deployment succeeds, open the actual Cloudflare Worker URL, search, sign in with GitHub, save a bookmark, and verify it on a second device. Use the GitHub account associated with `OWNER_GITHUB_ID` for administrator access.

## Alternative: GitHub Actions

Instead of Cloudflare Git integration, use the included workflow. In the GitHub repository's **Settings → Secrets and variables → Actions**, add:

**Repository variables**:

- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID
- `CLOUDFLARE_D1_DATABASE_ID`: your D1 database ID
- `APP_ORIGIN`: your exact Worker origin
- `MUSAB_GITHUB_CLIENT_ID`: your OAuth app Client ID
- `OWNER_GITHUB_ID`: `245616942`
- `CLOUDFLARE_DEPLOY_ENABLED`: `true` (set this last)

**Repository secrets**:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare token with Workers deployment and D1 Edit permissions, scoped to your account
- `MUSAB_GITHUB_CLIENT_SECRET`: the OAuth app Client Secret

Run **Actions → Deploy Musab X → Run workflow** for the first deployment. Subsequent pushes to main deploy automatically. The workflow uses the `production` environment; any protection rules you configure there still apply.

## Interactive live browser

The browser now uses Scramjet + Epoxy + a Wisp relay on a separate `musab-x-browser` Worker. No Browserless token or paid browser service is needed. The existing build command prepares both deployments; the existing deploy command applies migration `0004_browser_relay.sql` and publishes the browser Worker before the main workspace.

The build token must permit Workers deployment for **both** `musab-x` and `musab-x-browser`, plus D1 Edit. If a generated build token is restricted to the original Worker, update its scope in Cloudflare's build settings before retrying. For the standard `musab-x.<account>.workers.dev` URL, the browser address is derived automatically as `musab-x-browser.<account>.workers.dev`. A custom domain requires a public build variable `BROWSER_ORIGIN` set to the separate browser origin.

Sign in and search normally. The original Google page loads within the workspace, without a streamed browser's tab/address bar. Search, click, scroll, and use the outer back/forward/reload buttons. Live tabs stay mounted when changing workspace sections. Fullscreen expands only the website. Pages use native image/text quality and local scrolling, so stream-quality and paid-session duration controls are removed.

Browser access uses a one-use short-lived ticket and a separate HttpOnly session cookie. The eight-hour account authorization refreshes automatically; there is no two-minute browser timer. Cloudflare's free usage/CPU limits still apply. Outbound TCP to Cloudflare-hosted IPs is blocked by Cloudflare, so some websites will be unavailable. Google may show CAPTCHA or consent. See README for technical limits and browser/NOTICE.txt for licenses and source.

Existing runtime secrets are preserved. `BROWSERLESS_TOKEN` is only used by the older compatibility endpoint and `SERPAPI_KEY` only by the older result API. Neither powers the current live browser.

## Email sign-in

See [EMAIL_AUTH_SETUP.md](EMAIL_AUTH_SETUP.md) to configure both email/password and email-code sign-in. Existing GitHub sign-in remains available.

## Transfer saved data

On the previous site, export your workspace from Settings. On the new site, sign in with GitHub and import that JSON from Settings. Account IDs and sessions change with the host; neither accounts nor saved data migrate automatically. Import replaces the current workspace after confirmation. Old sessions do not grant access to the new database.
