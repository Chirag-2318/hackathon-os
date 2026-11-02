-- V46: Optimistic locking for collaborative entities, atomic idea voting, and database-backed idempotency keys

-- 1. Add version column for optimistic locking to user-editable collaborative entities
ALTER TABLE docs ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- pitches table: ensure version is BIGINT
ALTER TABLE pitches ALTER COLUMN version TYPE BIGINT;
ALTER TABLE pitches ALTER COLUMN version SET DEFAULT 0;

-- Additional collaborative entities
ALTER TABLE pitch_slides ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE deck_slides ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE demo_sections ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE demo_shots ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE retro_items ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE prep_items ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE qna_items ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE mvp_ledger_rows ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE mvp_flow_steps ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE team_charter_responses ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 2. Idea votes table and vote counter for atomic voting independent of idea text
CREATE TABLE IF NOT EXISTS idea_votes (
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (idea_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id ON idea_votes (idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user_id ON idea_votes (user_id);

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS vote_count INT NOT NULL DEFAULT 0;

-- 3. Database-backed Idempotency Keys table for create requests
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(128) NOT NULL,
    user_id UUID,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status INT NOT NULL,
    response_body TEXT,
    content_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key_user ON idempotency_keys (key, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_keys (created_at);

