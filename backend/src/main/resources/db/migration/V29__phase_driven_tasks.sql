-- V29__phase_driven_tasks.sql
-- Phase-driven task generation in Build stage

-- 1. room_phases / plan_phases additions
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS tasks_generated_at TIMESTAMPTZ;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS ready_notified_at TIMESTAMPTZ;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS ready_dismissed_at TIMESTAMPTZ;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS start_hour NUMERIC(6, 2);
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS end_hour NUMERIC(6, 2);
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS owners TEXT;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS deliverables TEXT;
ALTER TABLE plan_phases ADD COLUMN IF NOT EXISTS raw_markdown TEXT;

-- Create room_phases view for seamless compatibility
CREATE OR REPLACE VIEW room_phases AS SELECT * FROM plan_phases;

-- 2. tasks additions
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS phase_key VARCHAR(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS local_id VARCHAR(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deferred_from VARCHAR(20);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS drop_reason VARCHAR(300);

-- Update check constraints on tasks to allow DROPPED and PHASE_IMPORT
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'DROPPED'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_source_check CHECK (source IN ('PLAN', 'MANUAL', 'PHASE_IMPORT'));

-- Widen free-text columns
ALTER TABLE tasks ALTER COLUMN summary TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN role_label TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN drop_reason TYPE TEXT;

-- 3. room_phase_docs
CREATE TABLE IF NOT EXISTS room_phase_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    phase_key VARCHAR(20) NOT NULL,
    doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (room_id, phase_key, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_room_phase_docs_room_phase ON room_phase_docs (room_id, phase_key);

-- 4. Backfill existing tasks and phases
UPDATE tasks t
SET phase_key = p.plan_key
FROM plan_phases p
WHERE t.phase_id = p.id AND (t.phase_key IS NULL OR t.phase_key = '');

UPDATE plan_phases p
SET tasks_generated_at = now()
WHERE EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.phase_id = p.id OR (t.phase_key IS NOT NULL AND t.phase_key = p.plan_key)
);

-- For rooms in BUILD stage:
-- Lowest-numbered phase with unconfirmed tasks -> ACTIVE
-- Earlier phases where all tasks are confirmed -> COMPLETED
-- Later ones -> NOT_STARTED
UPDATE plan_phases p
SET status = 'COMPLETED',
    activated_at = COALESCE(activated_at, now()),
    completed_at = COALESCE(completed_at, now())
WHERE EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = p.room_id AND r.stage = 'BUILD'
)
AND p.tasks_generated_at IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tasks t
    WHERE (t.phase_id = p.id OR t.phase_key = p.plan_key)
      AND t.status != 'DROPPED'
      AND (t.status != 'DONE' OR t.review_state != 'CONFIRMED')
);

-- Active phase: lowest position among uncompleted phases in BUILD rooms
WITH active_candidates AS (
    SELECT p.id,
           ROW_NUMBER() OVER (PARTITION BY p.room_id ORDER BY p.position ASC) as rn
    FROM plan_phases p
    JOIN rooms r ON r.id = p.room_id
    WHERE r.stage = 'BUILD' AND p.status = 'NOT_STARTED'
)
UPDATE plan_phases p
SET status = 'ACTIVE',
    activated_at = COALESCE(p.activated_at, now())
FROM active_candidates ac
WHERE p.id = ac.id AND ac.rn = 1;
