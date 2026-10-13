CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS oauth_attempts (
  state_hash TEXT PRIMARY KEY NOT NULL,
  verifier TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS oauth_expiry ON oauth_attempts(expires);
