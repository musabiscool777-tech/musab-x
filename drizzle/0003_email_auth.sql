CREATE TABLE IF NOT EXISTS email_identities (
 provider_id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS email_auth_limits (
 bucket TEXT PRIMARY KEY NOT NULL,
 window_start INTEGER NOT NULL,
 attempts INTEGER NOT NULL
);
