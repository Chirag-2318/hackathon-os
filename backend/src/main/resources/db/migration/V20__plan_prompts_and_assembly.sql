-- V20__plan_prompts_and_assembly.sql
-- Store dynamic plan prompts, assembly cache, and plan document sources

ALTER TABLE docs ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'PLAN';

CREATE TABLE IF NOT EXISTS plan_step_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    step_index INT NOT NULL CHECK (step_index >= 1 AND step_index <= 5),
    step_key VARCHAR(20) NOT NULL,
    prompt TEXT NOT NULL,
    char_count INT NOT NULL,
    mode VARCHAR(50),
    idea_verdict TEXT,
    missing_inputs JSONB,
    stale BOOLEAN NOT NULL DEFAULT false,
    input_hash VARCHAR(64) NOT NULL,
    assessment_locked TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_plan_step_prompts_room ON plan_step_prompts (room_id);
