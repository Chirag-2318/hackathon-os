-- V37: GitHub Demo Marker, Deck Slides & Audits, Q&A Practice Tracking, Pitch Script Doc Source

CREATE TABLE IF NOT EXISTS room_github_demo (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    branch VARCHAR(255) NOT NULL,
    sha VARCHAR(64) NOT NULL,
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deck slides & audits
CREATE TABLE IF NOT EXISTS deck_slides (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    page_no INT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    chars INT NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, page_no)
);

CREATE TABLE IF NOT EXISTS deck_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('SLIDE', 'DECK')),
    page_no INT,
    result JSONB NOT NULL,
    deck_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_deck_audits_lookup ON deck_audits (room_id, scope, deck_hash);

-- Q&A practice check per user
CREATE TABLE IF NOT EXISTS qna_practice (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    question_hash VARCHAR(64) NOT NULL,
    practiced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, room_id, question_hash)
);

-- Pitch scripts doc source tracking
ALTER TABLE pitch_scripts
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'GENERATED',
    ADD COLUMN IF NOT EXISTS doc_version INT DEFAULT 1;

-- Allow 'normal' and case-insensitive roles on github_branches
ALTER TABLE github_branches DROP CONSTRAINT IF EXISTS github_branches_role_check;
ALTER TABLE github_branches ADD CONSTRAINT github_branches_role_check
    CHECK (role IN ('main', 'demo-safe', 'experiment', 'stale', 'normal', 'MAIN', 'DEMO_SAFE', 'NORMAL'));
