-- V5__phase3_build.sql
-- Hackathon OS Phase 3: The Build Phase Schema

-- 1. tasks: add optimistic locking version
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 2. mvp_state
CREATE TABLE IF NOT EXISTS mvp_state (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    identity VARCHAR(200),
    wow TEXT,
    differentiation TEXT,
    breaks_first TEXT,
    health_runs BOOLEAN NOT NULL DEFAULT false,
    health_stable BOOLEAN NOT NULL DEFAULT false,
    health_clear30 BOOLEAN NOT NULL DEFAULT false,
    health_wow60 BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. mvp_flow_steps
CREATE TABLE IF NOT EXISTS mvp_flow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    title VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_YET' CHECK (status IN ('WORKING', 'NOT_YET', 'MOCKED')),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

-- 4. mvp_ledger_rows
CREATE TABLE IF NOT EXISTS mvp_ledger_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    part VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('BUILT', 'EXISTING', 'MOCKED', 'PLANNED')),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    notes TEXT
);

-- 5. mvp_cut_items
CREATE TABLE IF NOT EXISTS mvp_cut_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    text VARCHAR(255) NOT NULL,
    is_cut BOOLEAN NOT NULL DEFAULT false
);

-- 6. room_checkpoints
CREATE TABLE IF NOT EXISTS room_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    rule_key VARCHAR(50) NOT NULL CHECK (rule_key IN (
        'RULES_CONFIRMED', 'IDEA_LOCKED', 'CORE_FLOW_RUNS',
        'FEATURE_FREEZE', 'DEMO_REHEARSED', 'VIDEO_RECORDED', 'SUBMISSION_VERIFIED'
    )),
    title VARCHAR(200) NOT NULL,
    helper TEXT,
    tag VARCHAR(20) CHECK (tag IN ('VIDEO', 'DRAFT', 'SUBMIT', 'DEMO')),
    due_at TIMESTAMPTZ,
    progress_current INT,
    progress_target INT,
    passed_at TIMESTAMPTZ,
    passed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    auto_passed BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_room_checkpoints_room_rule UNIQUE (room_id, rule_key)
);

-- 7. team_charter_responses
CREATE TABLE IF NOT EXISTS team_charter_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal VARCHAR(20) NOT NULL CHECK (goal IN ('WIN', 'LEARN', 'PORTFOLIO', 'ALL')),
    hours_available INT NOT NULL DEFAULT 0,
    norms_acknowledged BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_team_charter_room_user UNIQUE (room_id, user_id)
);

-- 8. speed_mode_captures
CREATE TABLE IF NOT EXISTS speed_mode_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. reminder_log
CREATE TABLE IF NOT EXISTS reminder_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(30) NOT NULL CHECK (kind IN ('TASK_DUE', 'CHECKPOINT_DUE')),
    ref_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_reminder_log_kind_ref_user UNIQUE (kind, ref_id, user_id)
);

-- 10. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_tasks_room_status_assignee_due ON tasks (room_id, status, assignee_id, due_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON task_comments (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_task_created ON task_history (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_doc_comments_doc_created ON doc_comments (doc_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mvp_flow_steps_room_pos ON mvp_flow_steps (room_id, position);
CREATE INDEX IF NOT EXISTS idx_mvp_ledger_rows_room_pos ON mvp_ledger_rows (room_id, position);
CREATE INDEX IF NOT EXISTS idx_mvp_cut_items_room_pos ON mvp_cut_items (room_id, position);
CREATE INDEX IF NOT EXISTS idx_room_checkpoints_room_pos ON room_checkpoints (room_id, position);
CREATE INDEX IF NOT EXISTS idx_speed_captures_room_user_created ON speed_mode_captures (room_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reminder_log_lookup ON reminder_log (kind, ref_id, user_id);
