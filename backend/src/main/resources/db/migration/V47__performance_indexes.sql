-- V47__performance_indexes.sql
-- Step 6 hardening: Add missing performance indexes and drop duplicate indexes.

-- 1. Real missing foreign key index on task dependencies for reverse blocker lookups
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies (depends_on_task_id);

-- 2. Real missing foreign key index on room phase docs
CREATE INDEX IF NOT EXISTS idx_room_phase_docs_doc_id ON room_phase_docs (doc_id);

-- 3. Composite index on doc_versions for latest-version lookups
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id_version ON doc_versions (doc_id, version DESC);

-- 4. Drop redundant index: idx_tasks_room_status (room_id, status) is a prefix duplicate of idx_tasks_room_status_pos (room_id, status, position)
DROP INDEX IF EXISTS idx_tasks_room_status;
