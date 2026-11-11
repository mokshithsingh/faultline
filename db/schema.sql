-- 1. Create custom ENUM type first (required before issues table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
        CREATE TYPE issue_status AS ENUM ('UNRESOLVED', 'RESOLVED');
    END IF;
END $$;

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on users lower(email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- 3. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    api_key_hash VARCHAR(64) NOT NULL UNIQUE CHECK (char_length(api_key_hash) = 64),
    key_prefix VARCHAR(12) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_event_at TIMESTAMPTZ
);

-- Performance index for projects by user
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 4. Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    fingerprint VARCHAR(64) NOT NULL,
    type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status issue_status DEFAULT 'UNRESOLVED',
    events_count INT DEFAULT 1,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT issues_project_id_fingerprint_key UNIQUE (project_id, fingerprint)
);

-- Performance index for issues by project and last_seen
CREATE INDEX IF NOT EXISTS idx_issues_project_id_last_seen ON issues(project_id, last_seen DESC);

-- 5. Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    issue_id INT REFERENCES issues(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for events
CREATE INDEX IF NOT EXISTS idx_events_issue_id ON events(issue_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id);
