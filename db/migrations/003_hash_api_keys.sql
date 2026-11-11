BEGIN;

-- 1. Rename api_key column to api_key_hash in projects table
ALTER TABLE projects RENAME COLUMN api_key TO api_key_hash;

-- 2. Rename the unique constraint to reflect the new column name
ALTER TABLE projects RENAME CONSTRAINT projects_api_key_key TO projects_api_key_hash_key;

-- 3. Rename the length check constraint to reflect the new column name
ALTER TABLE projects RENAME CONSTRAINT projects_api_key_check TO projects_api_key_hash_check;

-- 4. Add key_prefix column for displaying the key prefix
ALTER TABLE projects ADD COLUMN key_prefix VARCHAR(12) NOT NULL;

COMMIT;
