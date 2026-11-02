-- V45: Durable room presence across restarts and instances
CREATE TABLE IF NOT EXISTS room_presence (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_presence_last_seen ON room_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_room_presence_room_last_seen ON room_presence(room_id, last_seen);

-- Relax room_events non-null constraints for broad event topics (overview, presence, resync)
ALTER TABLE room_events ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE room_events ALTER COLUMN entity_id DROP NOT NULL;
