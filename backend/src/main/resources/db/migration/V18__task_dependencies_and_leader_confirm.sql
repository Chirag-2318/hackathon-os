-- V18__task_dependencies_and_leader_confirm.sql
-- Task prerequisites with room scoping and leader confirmation flow

CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id),
    CONSTRAINT chk_task_dependencies_not_self CHECK (task_id <> depends_on_task_id)
);

ALTER TABLE task_dependencies
    ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

UPDATE task_dependencies td
SET room_id = t.room_id
FROM tasks t
WHERE td.task_id = t.id AND td.room_id IS NULL;

DELETE FROM task_dependencies WHERE room_id IS NULL;

ALTER TABLE task_dependencies ALTER COLUMN room_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_dependencies_not_self'
    ) THEN
        ALTER TABLE task_dependencies
            ADD CONSTRAINT chk_task_dependencies_not_self CHECK (task_id <> depends_on_task_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_dependencies_room_id ON task_dependencies(room_id);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS review_state VARCHAR(30) NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS review_note TEXT;

-- Backfill: existing Done tasks become CONFIRMED in the migration.
UPDATE tasks
SET review_state = 'CONFIRMED'
WHERE status = 'DONE';
