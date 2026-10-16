CREATE TABLE IF NOT EXISTS browser_tickets (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS browser_ticket_expiry ON browser_tickets(expires);
CREATE TABLE IF NOT EXISTS browser_sessions (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS browser_session_expiry ON browser_sessions(expires);
