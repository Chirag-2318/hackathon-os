-- V3__phase2_planning.sql
-- Hackathon OS Phase 2: Planning Flow Schema (Briefs, Ideas, Plans, Docs, Tasks)

-- 1. briefs
CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('link', 'pdf', 'manual')),
    source_url TEXT,
    file_name VARCHAR(255),
    raw_text TEXT,
    problem_statement TEXT,
    target_audience TEXT,
    deadlines JSONB,
    eligibility TEXT,
    tech_rules TEXT,
    ai_policy TEXT,
    judging_format TEXT,
    deliverables JSONB,
    tracks_and_prizes JSONB,
    risks JSONB,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    confirmed_fields JSONB,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefs_room_id ON briefs (room_id);

-- 2. brief_rubric_items
CREATE TABLE brief_rubric_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    criterion TEXT NOT NULL,
    weight INT NOT NULL CHECK (weight >= 0 AND weight <= 100),
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_brief_rubric_items_brief_id ON brief_rubric_items (brief_id);


-- 4. ideas
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reject_reason VARCHAR(200),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ideas_single_primary ON ideas (room_id) WHERE is_primary = true;
CREATE INDEX idx_ideas_room_status_created ON ideas (room_id, status, created_at);
CREATE INDEX idx_ideas_author_id ON ideas (author_id);

-- 5. idea_links
CREATE TABLE idea_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT
);

CREATE INDEX idx_idea_links_idea_id ON idea_links (idea_id);

-- 6. idea_notes
CREATE TABLE idea_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    text TEXT NOT NULL
);

CREATE INDEX idx_idea_notes_idea_id ON idea_notes (idea_id);

-- 7. plan_steps
CREATE TABLE plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    step_key VARCHAR(20) NOT NULL CHECK (step_key IN ('prd', 'tech', 'phases', 'tasks', 'demo')),
    answer TEXT,
    validated BOOLEAN NOT NULL DEFAULT false,
    errors JSONB,
    warnings JSONB,
    parsed JSONB,
    validated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, step_key)
);

CREATE INDEX idx_plan_steps_room_id ON plan_steps (room_id);

-- 8. plan_phases
CREATE TABLE plan_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    plan_key VARCHAR(50) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    name VARCHAR(100) NOT NULL,
    start_pct NUMERIC(5, 2) NOT NULL,
    end_pct NUMERIC(5, 2) NOT NULL,
    exit_checkpoint TEXT,
    goals JSONB
);

CREATE INDEX idx_plan_phases_room_id ON plan_phases (room_id);

-- 9. docs
CREATE TABLE docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    file_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    current_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, file_name)
);

CREATE INDEX idx_docs_room_id ON docs (room_id);

-- 10. doc_versions
CREATE TABLE doc_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    version INT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doc_id, version)
);

CREATE INDEX idx_doc_versions_doc_id ON doc_versions (doc_id);

-- 11. doc_comments
CREATE TABLE doc_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_comments_doc_id ON doc_comments (doc_id);

-- 12. tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    task_key VARCHAR(30) NOT NULL,
    number INT NOT NULL,
    summary VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    flagged BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST')),
    phase_id UUID REFERENCES plan_phases(id) ON DELETE SET NULL,
    role_label VARCHAR(50),
    estimate_min INT NOT NULL DEFAULT 60,
    due_at TIMESTAMPTZ,
    position INT NOT NULL DEFAULT 0,
    source VARCHAR(20) NOT NULL DEFAULT 'PLAN' CHECK (source IN ('PLAN', 'MANUAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (room_id, task_key)
);

CREATE INDEX idx_tasks_room_status_pos ON tasks (room_id, status, position);
CREATE INDEX idx_tasks_assignee_id ON tasks (assignee_id);
CREATE INDEX idx_tasks_phase_id ON tasks (phase_id);

-- 13. task_labels
CREATE TABLE task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    PRIMARY KEY (task_id, label)
);

-- 14. task_dependencies
CREATE TABLE task_dependencies (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- 15. task_acceptance_items
CREATE TABLE task_acceptance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_task_acceptance_items_task_id ON task_acceptance_items (task_id);

-- 16. subtasks
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_subtasks_task_id ON subtasks (task_id);

-- 17. task_comments
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ
);

CREATE INDEX idx_task_comments_task_id ON task_comments (task_id);

-- 18. task_history
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_history_task_id ON task_history (task_id);
