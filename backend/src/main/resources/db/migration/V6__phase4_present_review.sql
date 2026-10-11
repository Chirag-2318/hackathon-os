-- V6__phase4_present_review.sql
-- Hackathon OS Phase 4: Present & Review Modules Schema

-- 1. pitch_decks
CREATE TABLE IF NOT EXISTS pitch_decks (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    format_kind VARCHAR(30) NOT NULL CHECK (format_kind IN ('live_3min', 'ppt_first', 'demo_90s', 'async_video')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. pitch_slides
CREATE TABLE IF NOT EXISTS pitch_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('PROBLEM', 'SOLUTION', 'DEMO', 'IMPACT', 'NEXT', 'TEAM', 'TECH', 'CUSTOM')),
    title VARCHAR(120) NOT NULL,
    question TEXT NOT NULL,
    content TEXT
);

CREATE INDEX IF NOT EXISTS idx_pitch_slides_room_pos ON pitch_slides (room_id, position);

-- 3. pitch_slide_coverage
CREATE TABLE IF NOT EXISTS pitch_slide_coverage (
    slide_id UUID NOT NULL REFERENCES pitch_slides(id) ON DELETE CASCADE,
    criterion TEXT NOT NULL,
    PRIMARY KEY (slide_id, criterion)
);

-- 4. pitch_rehearsals
CREATE TABLE IF NOT EXISTS pitch_rehearsals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_sec INT NOT NULL,
    presenter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    section_paces JSONB,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_pitch_rehearsals_room ON pitch_rehearsals (room_id, run_at);

-- 5. pitch_roles
CREATE TABLE IF NOT EXISTS pitch_roles (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    presenter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 6. pitch_qa
CREATE TABLE IF NOT EXISTS pitch_qa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    question TEXT NOT NULL,
    answer TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'PRODUCT' CHECK (category IN ('PRODUCT', 'TECH', 'IMPACT', 'TEAM', 'PROCESS')),
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('GENERATED', 'MANUAL')),
    practiced BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pitch_qa_room_pos ON pitch_qa (room_id, position);

-- 7. code_defense_drills
CREATE TABLE IF NOT EXISTS code_defense_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    module VARCHAR(120) NOT NULL,
    question TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    practiced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_code_defense_drills_room ON code_defense_drills (room_id);

-- 8. demo_sections
CREATE TABLE IF NOT EXISTS demo_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    title VARCHAR(120) NOT NULL,
    seconds INT NOT NULL DEFAULT 0,
    text TEXT
);

CREATE INDEX IF NOT EXISTS idx_demo_sections_room_pos ON demo_sections (room_id, position);

-- 9. demo_shots
CREATE TABLE IF NOT EXISTS demo_shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    title VARCHAR(120) NOT NULL,
    duration_sec INT NOT NULL DEFAULT 0,
    notes TEXT,
    done BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_demo_shots_room_pos ON demo_shots (room_id, position);

-- 10. demo_insurance_items
CREATE TABLE IF NOT EXISTS demo_insurance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_key VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_demo_insurance_room_key UNIQUE (room_id, item_key)
);

-- 11. demo_media
CREATE TABLE IF NOT EXISTS demo_media (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    video_url TEXT,
    fallback_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. submissions
CREATE TABLE IF NOT EXISTS submissions (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VERIFIED', 'SUBMITTED')),
    draft JSONB,
    form_fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 13. submission_checklist_items
CREATE TABLE IF NOT EXISTS submission_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_key VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    done BOOLEAN NOT NULL DEFAULT false,
    auto BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_submission_checklist_room_key UNIQUE (room_id, item_key)
);

-- 14. submission_links
CREATE TABLE IF NOT EXISTS submission_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    label VARCHAR(120) NOT NULL,
    url TEXT NOT NULL,
    ok BOOLEAN,
    http_status INT,
    last_checked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submission_links_room ON submission_links (room_id);

-- 15. readiness_snapshots
CREATE TABLE IF NOT EXISTS readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    score INT NOT NULL,
    breakdown JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_room_created ON readiness_snapshots (room_id, created_at DESC);

-- 16. readiness_simulations
CREATE TABLE IF NOT EXISTS readiness_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    answers JSONB,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_simulations_room_created ON readiness_simulations (room_id, created_at DESC);

-- 17. retros
CREATE TABLE IF NOT EXISTS retros (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    decision VARCHAR(20) CHECK (decision IN ('CONTINUE', 'ARCHIVE')),
    next_steps TEXT,
    result TEXT,
    portfolio_summary TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. retro_items
CREATE TABLE IF NOT EXISTS retro_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('WENT_WELL', 'DIDNT_GO', 'CHANGE')),
    text TEXT NOT NULL,
    tag VARCHAR(50) CHECK (tag IN ('overscope', 'late-testing', 'unread-ai-code', 'no-rehearsal', 'conflict', 'wifi-failure', 'rules-miss')),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retro_items_room ON retro_items (room_id);

-- 19. retro_awards
CREATE TABLE IF NOT EXISTS retro_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_retro_awards_room ON retro_awards (room_id);

-- 20. portfolio_settings
CREATE TABLE IF NOT EXISTS portfolio_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(60) UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT false
);

-- 21. portfolio_visibility
CREATE TABLE IF NOT EXISTS portfolio_visibility (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    visible BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, room_id)
);

-- 22. mentor_links
CREATE TABLE IF NOT EXISTS mentor_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    token VARCHAR(60) NOT NULL UNIQUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_links_room ON mentor_links (room_id);

-- 23. mentor_questions
CREATE TABLE IF NOT EXISTS mentor_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    mentor_link_id UUID REFERENCES mentor_links(id) ON DELETE CASCADE,
    mentor_name VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at TIMESTAMPTZ,
    answered_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_questions_room ON mentor_questions (room_id, created_at DESC);
