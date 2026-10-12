-- V12: PRESENT group schema additions
-- Deck source (provider, link or file, embed metadata)
CREATE TABLE IF NOT EXISTS pitch_deck_sources (
    room_id      UUID PRIMARY KEY,
    provider     VARCHAR(10)  NOT NULL CHECK (provider IN ('canva','pptx','gslides')),
    url          TEXT         NOT NULL,
    title        VARCHAR(200) NOT NULL DEFAULT '',
    file_path    TEXT,
    thumbnail_url TEXT,
    embed_url    TEXT,
    updated_by   UUID,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Pitch script (AI-generated, one per room)
CREATE TABLE IF NOT EXISTS pitch_scripts (
    room_id        UUID PRIMARY KEY,
    type           VARCHAR(20)  NOT NULL,
    speaker_count  INT          NOT NULL DEFAULT 1,
    speakers       JSONB        NOT NULL DEFAULT '[]',
    instructions   TEXT,
    hook           TEXT,
    closing_line   TEXT,
    total_seconds  INT          NOT NULL DEFAULT 0,
    slides         JSONB        NOT NULL DEFAULT '[]',
    generated_by   UUID,
    generated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Q&A enrichment columns
ALTER TABLE pitch_qa
    ADD COLUMN IF NOT EXISTS why_asked   TEXT,
    ADD COLUMN IF NOT EXISTS risk_point  TEXT,
    ADD COLUMN IF NOT EXISTS difficulty  INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3);

-- Demo: proof URL on shots, local-recording flags on media
ALTER TABLE demo_shots
    ADD COLUMN IF NOT EXISTS proof_url TEXT;

ALTER TABLE demo_media
    ADD COLUMN IF NOT EXISTS local_recording_saved  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS local_backup_saved     BOOLEAN NOT NULL DEFAULT FALSE;

-- Rehearsal run stats
ALTER TABLE pitch_rehearsals
    ADD COLUMN IF NOT EXISTS stats JSONB;
