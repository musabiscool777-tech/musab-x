-- NULL account IDs grant relay access only and never create workspace accounts.
ALTER TABLE browser_tickets RENAME TO browser_tickets_previous;
CREATE TABLE browser_tickets (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
INSERT INTO browser_tickets SELECT token_hash, account_id, expires FROM browser_tickets_previous;
DROP TABLE browser_tickets_previous;
CREATE INDEX browser_ticket_expiry ON browser_tickets(expires);

ALTER TABLE browser_sessions RENAME TO browser_sessions_previous;
CREATE TABLE browser_sessions (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
 expires INTEGER NOT NULL
);
INSERT INTO browser_sessions SELECT token_hash, account_id, expires FROM browser_sessions_previous;
DROP TABLE browser_sessions_previous;
CREATE INDEX browser_session_expiry ON browser_sessions(expires);
