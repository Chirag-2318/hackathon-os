-- V41__qna_defence_trainer.sql
-- Q&A Defence Trainer and Hot Seat Sessions

CREATE TABLE IF NOT EXISTS qna_items (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    hash VARCHAR(64) NOT NULL,
    kind VARCHAR(32) NOT NULL DEFAULT 'QUESTION',
    category TEXT,
    criterion TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    followup TEXT,
    counter TEXT,
    proof TEXT,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    owner_handle TEXT,
    source VARCHAR(32) NOT NULL DEFAULT 'DOC',
    doc_version INT,
    position INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_qna_items_room_hash UNIQUE (room_id, hash)
);

CREATE INDEX IF NOT EXISTS idx_qna_items_room_active_pos ON qna_items(room_id, active, position);
CREATE INDEX IF NOT EXISTS idx_qna_items_room_criterion ON qna_items(room_id, criterion);

CREATE TABLE IF NOT EXISTS qna_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    hash VARCHAR(64) NOT NULL,
    mastery INT NOT NULL DEFAULT 0, -- 0 UNSEEN, 1 MISSED, 2 SHAKY, 3 SOLID
    times_seen INT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    last_rating INT,
    last_answer_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, room_id, hash)
);

CREATE INDEX IF NOT EXISTS idx_qna_progress_room_hash ON qna_progress(room_id, hash);

CREATE TABLE IF NOT EXISTS qna_answers (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    hash VARCHAR(64) NOT NULL,
    own_answer TEXT,
    shared BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, room_id, hash)
);

CREATE INDEX IF NOT EXISTS idx_qna_answers_room_shared ON qna_answers(room_id, shared);

CREATE TABLE IF NOT EXISTS qna_sessions (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(32) NOT NULL DEFAULT 'HOT_SEAT',
    config JSONB,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qna_sessions_room_user ON qna_sessions(room_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS qna_session_answers (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES qna_sessions(id) ON DELETE CASCADE,
    hash VARCHAR(64) NOT NULL,
    rating INT,
    answer_text TEXT,
    transcript TEXT,
    duration_ms BIGINT,
    followup_shown BOOLEAN NOT NULL DEFAULT false,
    covered_points JSONB,
    ai_score INT,
    ai_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qna_session_answers_session ON qna_session_answers(session_id);
