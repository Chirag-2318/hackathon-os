-- V39: Pitch settings, demo assets, failure ladder, and preflight checklist

-- 1. pitch_settings
CREATE TABLE IF NOT EXISTS pitch_settings (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL DEFAULT 'LIVE' CHECK (format IN ('LIVE', 'VIDEO', 'BOTH')),
    pitch_limit_sec INT NOT NULL DEFAULT 180,
    qa_limit_sec INT NOT NULL DEFAULT 120,
    presenter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    wpm INT NOT NULL DEFAULT 150,
    version INT NOT NULL DEFAULT 0
);

-- 2. demo_assets
CREATE TABLE IF NOT EXISTS demo_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    kind VARCHAR(50) NOT NULL CHECK (kind IN ('FULL_RECORDING', 'BACKUP_RECORDING', 'LIVE_LINK', 'SCREENSHOT')),
    url VARCHAR(2000),
    provider VARCHAR(50),
    title VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_ADDED' CHECK (status IN ('NOT_ADDED', 'CHECKING', 'REACHABLE', 'NEEDS_LOGIN', 'NOT_FOUND', 'UNREACHABLE')),
    checked_at TIMESTAMPTZ,
    caption VARCHAR(1000),
    position INT NOT NULL DEFAULT 0,
    file_key VARCHAR(500),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_assets_room_kind ON demo_assets (room_id, kind);

-- 3. demo_ladder
CREATE TABLE IF NOT EXISTS demo_ladder (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    rung VARCHAR(10) NOT NULL CHECK (rung IN ('A', 'B', 'C', 'D')),
    say_text VARCHAR(300),
    tested_at TIMESTAMPTZ,
    tested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (room_id, rung)
);

-- 4. demo_preflight
CREATE TABLE IF NOT EXISTS demo_preflight (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_hash VARCHAR(100) NOT NULL,
    label VARCHAR(500) NOT NULL,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    checked_at TIMESTAMPTZ,
    source VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    position INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_demo_preflight_room_hash UNIQUE (room_id, item_hash)
);

CREATE INDEX IF NOT EXISTS idx_demo_preflight_room ON demo_preflight (room_id, position);
