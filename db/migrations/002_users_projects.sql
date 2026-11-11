BEGIN;

-- DEV ONLY: removes demo rows so NOT NULL project_id can be added. Never run on a database with real data.
TRUNCATE events, issues RESTART IDENTITY;

-- 1. Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create case-insensitive unique index on users email
CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email));

-- 3. Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    api_key VARCHAR(64) NOT NULL UNIQUE CHECK (char_length(api_key) = 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_event_at TIMESTAMPTZ
);

-- 4. Create index on projects user_id foreign key
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 5. Add project_id foreign key column to issues table
ALTER TABLE issues ADD COLUMN project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE;

-- 6. Drop the old unique constraint on fingerprint alone in issues table
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_fingerprint_key;

-- 7. Drop the old standalone index on issues fingerprint if present
DROP INDEX IF EXISTS idx_issues_fingerprint;

-- 8. Add compound unique constraint on (project_id, fingerprint) in issues table
ALTER TABLE issues ADD CONSTRAINT issues_project_id_fingerprint_key UNIQUE (project_id, fingerprint);

-- 9. Add compound index on issues(project_id, last_seen DESC) for project-scoped queries
CREATE INDEX idx_issues_project_id_last_seen ON issues(project_id, last_seen DESC);

-- 10. Add project_id foreign key column to events table
ALTER TABLE events ADD COLUMN project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE;

-- 11. Ensure index on events issue_id foreign key exists
CREATE INDEX IF NOT EXISTS idx_events_issue_id ON events(issue_id);

-- 12. Create index on events project_id foreign key
CREATE INDEX idx_events_project_id ON events(project_id);

COMMIT;
