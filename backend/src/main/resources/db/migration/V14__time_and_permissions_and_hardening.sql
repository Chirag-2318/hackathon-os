-- V14__time_and_permissions_and_hardening.sql
-- Idempotent schema migration for time model, permissions, and security hardening

-- 1. Alter rooms join_code to support 8-character codes
ALTER TABLE rooms ALTER COLUMN join_code TYPE VARCHAR(16);

-- 2. Add time, stage, lifecycle, and room code columns to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS freeze_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS duration_hours INT NOT NULL DEFAULT 36;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deadline_overridden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(30) NOT NULL DEFAULT 'PLANNING';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS code_revoked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS code_expires_at TIMESTAMPTZ;

-- 3. Data backfill and repair for inconsistent values
-- Initialize starts_at from event_start, or fallback to created_at
UPDATE rooms
SET starts_at = COALESCE(event_start, created_at, NOW())
WHERE starts_at IS NULL;

-- Backfill duration_hours from event_templates if template_id is matched
UPDATE rooms r
SET duration_hours = COALESCE(t.duration_hours, 36)
FROM event_templates t
WHERE r.template_id = t.id AND (r.duration_hours IS NULL OR r.duration_hours <= 0);

-- Ensure duration_hours is valid between 1 and 168
UPDATE rooms
SET duration_hours = 36
WHERE duration_hours < 1 OR duration_hours > 168;

-- Set ends_at from starts_at + duration_hours when not overridden
UPDATE rooms
SET ends_at = starts_at + (duration_hours || ' hours')::INTERVAL
WHERE ends_at IS NULL OR (deadline_overridden = FALSE AND ends_at != starts_at + (duration_hours || ' hours')::INTERVAL);

-- freeze_at defaults to starts_at + 70% of duration
UPDATE rooms
SET freeze_at = starts_at + ((duration_hours * 0.70) || ' hours')::INTERVAL
WHERE freeze_at IS NULL OR freeze_at >= ends_at OR freeze_at <= starts_at;

-- Keep legacy event_start and event_end columns aligned
UPDATE rooms SET event_start = starts_at WHERE event_start IS NULL;
UPDATE rooms SET event_end = ends_at WHERE event_end IS NULL;

-- Map legacy stage to workflow_stage
UPDATE rooms
SET workflow_stage = CASE
    WHEN stage = 'build' OR build_started_at IS NOT NULL THEN 'BUILD'
    WHEN stage = 'present' THEN 'PRESENT'
    WHEN stage = 'review' THEN 'REVIEW'
    ELSE 'PLANNING'
END
WHERE workflow_stage IS NULL OR workflow_stage = 'PLANNING';

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_rooms_deleted_at ON rooms (deleted_at);
CREATE INDEX IF NOT EXISTS idx_rooms_workflow_stage ON rooms (workflow_stage);
CREATE INDEX IF NOT EXISTS idx_rooms_starts_at ON rooms (starts_at);
CREATE INDEX IF NOT EXISTS idx_rooms_ends_at ON rooms (ends_at);
