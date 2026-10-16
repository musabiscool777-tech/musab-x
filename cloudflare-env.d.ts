declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    AUTH_MODE?: 'github' | 'sites';
    APP_ORIGIN?: string;
    BROWSER_ORIGIN?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    OWNER_GITHUB_ID?: string;
    OWNER_EMAIL?: string;
    SERPAPI_KEY?: string;
    BROWSERLESS_TOKEN?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
