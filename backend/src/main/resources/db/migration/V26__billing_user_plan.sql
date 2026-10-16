-- Flyway Migration V26: User Plans and Billing Waitlist
CREATE TABLE IF NOT EXISTS user_plan (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
    since TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    source VARCHAR(20) NOT NULL DEFAULT 'DEV'
);

CREATE TABLE IF NOT EXISTS plan_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL,
    note VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_plan_interest_user_plan UNIQUE (user_id, plan)
);

CREATE INDEX IF NOT EXISTS idx_plan_interest_user ON plan_interest(user_id);

ALTER TABLE ideas ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE doc_comments ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE task_comments ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE room_invites ALTER COLUMN invited_by DROP NOT NULL;
