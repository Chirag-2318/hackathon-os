-- V40: Pitch Editor and Rehearsals Station
-- Schema for pitches, pitch versions, and full rehearsal tracking

CREATE TABLE IF NOT EXISTS pitches (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    beats JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_limit_sec INT NOT NULL DEFAULT 180,
    source VARCHAR(20) NOT NULL DEFAULT 'DOC',
    doc_version INT,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pitch_versions (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    version INT NOT NULL,
    beats JSONB NOT NULL DEFAULT '[]'::jsonb,
    note TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pitch_versions_room_ver ON pitch_versions(room_id, version DESC);

CREATE TABLE IF NOT EXISTS rehearsals (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pitch_version INT NOT NULL DEFAULT 1,
    mode VARCHAR(20) NOT NULL DEFAULT 'TIMED',
    scope VARCHAR(20) NOT NULL DEFAULT 'FULL',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms BIGINT NOT NULL DEFAULT 0,
    planned_ms BIGINT NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completion_pct INT NOT NULL DEFAULT 0,
    beat_timings JSONB NOT NULL DEFAULT '[]'::jsonb,
    stumbles JSONB NOT NULL DEFAULT '[]'::jsonb,
    transcript JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    coach JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rehearsals_room ON rehearsals(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rehearsals_room_user ON rehearsals(room_id, user_id, created_at DESC);
