declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OWNER_EMAIL?: string;
    SERPAPI_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
