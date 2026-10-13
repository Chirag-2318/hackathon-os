-- V15: Live Sync, Optimistic Concurrency, Room Events and Performance Optimization

-- 1. Room Events change feed
CREATE TABLE IF NOT EXISTS room_events (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_events_room_id_id ON room_events(room_id, id);
CREATE INDEX IF NOT EXISTS idx_room_events_created_at ON room_events(created_at);

-- 2. Optimistic locking and audit fields for editable entities
-- Docs
ALTER TABLE docs ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Briefs
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- MVP State
ALTER TABLE mvp_state ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE mvp_state ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Notifications count & deepLink support
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS count INT NOT NULL DEFAULT 1;

-- 3. Performance Indexes for list endpoints
CREATE INDEX IF NOT EXISTS idx_tasks_room_status ON tasks(room_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_room_created_at ON tasks(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_events_room_created_at ON activity_events(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ideas_room_status ON ideas(room_id, status);
