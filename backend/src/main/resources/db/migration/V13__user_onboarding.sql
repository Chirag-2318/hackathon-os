-- V13: User onboarding fields and unique username index
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(20),
    ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'PRESET',
    ADD COLUMN IF NOT EXISTS avatar_preset INTEGER,
    ADD COLUMN IF NOT EXISTS role_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20),
    ADD COLUMN IF NOT EXISTS goal VARCHAR(20),
    ADD COLUMN IF NOT EXISTS tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Case-insensitive unique index on lower(username)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (lower(username)) WHERE username IS NOT NULL;
