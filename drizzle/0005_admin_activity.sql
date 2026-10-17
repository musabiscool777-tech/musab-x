CREATE TABLE IF NOT EXISTS admin_activity (
 id TEXT PRIMARY KEY NOT NULL,
 actor_id TEXT NOT NULL,
 target_id TEXT NOT NULL,
 old_role TEXT NOT NULL,
 new_role TEXT NOT NULL,
 old_disabled INTEGER NOT NULL,
 new_disabled INTEGER NOT NULL,
 created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_activity_created ON admin_activity(created);
