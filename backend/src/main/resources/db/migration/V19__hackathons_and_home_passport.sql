-- V19: Hackathons directory, suggestions, and member last_visited_at tracking

CREATE TABLE IF NOT EXISTS hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(160) NOT NULL,
    organizer VARCHAR(120) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source VARCHAR(40),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('ONLINE', 'OFFLINE', 'HYBRID')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ,
    prize_text VARCHAR(120),
    themes JSONB DEFAULT '[]'::jsonb,
    location VARCHAR(200),
    team_min SMALLINT,
    team_max SMALLINT,
    verified_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_hackathons_active_dates ON hackathons (active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS hackathon_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    url VARCHAR(500) NOT NULL,
    note VARCHAR(300),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hackathon_suggestions_url ON hackathon_suggestions (url);
CREATE INDEX IF NOT EXISTS idx_hackathon_suggestions_user_id ON hackathon_suggestions (user_id);

ALTER TABLE room_members ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;
