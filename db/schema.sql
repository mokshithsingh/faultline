-- 1. Create custom ENUM type first (required before issues table)
CREATE TYPE issue_status AS ENUM ('UNRESOLVED', 'RESOLVED');

-- 2. Create issues table (required before events table references it)
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    fingerprint VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status issue_status DEFAULT 'UNRESOLVED',
    events_count INT DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create events table (references issues table via issue_id)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create performance indexes last
CREATE INDEX idx_issues_fingerprint ON issues(fingerprint);
CREATE INDEX idx_events_issue_id ON events(issue_id);