-- V7__phase4_catalog_hidden.sql
-- Hackathon OS Phase 4: Catalogs (Playbooks, Tools) & Hidden Modules (Prep, Crowd Check, Schedule)

-- 1. playbooks
CREATE TABLE IF NOT EXISTS playbooks (
    slug VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    read_minutes INT NOT NULL DEFAULT 5,
    sort_order INT NOT NULL DEFAULT 0
);

-- 2. tools
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL,
    cost VARCHAR(20) NOT NULL CHECK (cost IN ('FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE')),
    license TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    last_checked DATE NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON tools (category);

-- 3. prep_items
CREATE TABLE IF NOT EXISTS prep_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    label VARCHAR(255) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    due_at TIMESTAMPTZ,
    done_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prep_items_room_pos ON prep_items (room_id, position);

-- 4. crowd_rows
CREATE TABLE IF NOT EXISTS crowd_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
    crowdedness INT NOT NULL DEFAULT 1 CHECK (crowdedness >= 1 AND crowdedness <= 5),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_crowd_rows_room ON crowd_rows (room_id);

-- 5. schedule_events
CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN ('MILESTONE', 'SYNC', 'CHECKPOINT', 'DEADLINE')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_room_starts ON schedule_events (room_id, starts_at);
