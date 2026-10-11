CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('GITHUB', 'GOOGLE', 'DEV')),
    provider_user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url VARCHAR(500),
    login VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_users_provider UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_users_email_lower ON users (lower(email));

-- 2. user_settings
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    theme VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    notify_deadlines BOOLEAN NOT NULL DEFAULT true,
    notify_mentions BOOLEAN NOT NULL DEFAULT true,
    notify_blocked BOOLEAN NOT NULL DEFAULT true,
    notify_email BOOLEAN NOT NULL DEFAULT false,
    plan VARCHAR(20) NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. user_api_keys
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('ANTHROPIC', 'OPENAI', 'GEMINI')),
    label VARCHAR(100) NOT NULL,
    key_encrypted TEXT NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys (user_id);

-- 4. event_templates
CREATE TABLE event_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    duration_hours INT NOT NULL,
    team_min INT NOT NULL,
    team_max INT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    phases JSONB NOT NULL
);

-- 5. rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(60) NOT NULL,
    description VARCHAR(200),
    project_description VARCHAR(500),
    template_id VARCHAR(50) REFERENCES event_templates(id),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    timezone VARCHAR(100),
    stage VARCHAR(20) NOT NULL DEFAULT 'brief' CHECK (stage IN ('brief', 'ideate', 'plan', 'build')),
    brief_done BOOLEAN NOT NULL DEFAULT false,
    ideate_done BOOLEAN NOT NULL DEFAULT false,
    plan_done BOOLEAN NOT NULL DEFAULT false,
    build_started_at TIMESTAMPTZ,
    key_prefix VARCHAR(6),
    task_counter INT NOT NULL DEFAULT 0,
    join_code VARCHAR(4) NOT NULL UNIQUE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_owner_id ON rooms (owner_id);
CREATE INDEX idx_rooms_archived_at ON rooms (archived_at);
CREATE INDEX idx_rooms_template_id ON rooms (template_id);

-- 6. room_members
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('LEADER', 'BUILDER', 'DESIGNER', 'PRESENTER', 'DOMAIN_EXPERT', 'QA')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ,
    CONSTRAINT uq_room_members_room_user UNIQUE (room_id, user_id)
);

CREATE UNIQUE INDEX uq_room_members_leader ON room_members (room_id) WHERE role = 'LEADER';
CREATE INDEX idx_room_members_user_id ON room_members (user_id);
CREATE INDEX idx_room_members_room_id ON room_members (room_id);

-- 7. room_member_skills
CREATE TABLE room_member_skills (
    member_id UUID NOT NULL REFERENCES room_members(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL CHECK (skill IN ('Frontend', 'Backend', 'ML/AI', 'Design', 'Presenter', 'Domain', 'QA/Demo')),
    PRIMARY KEY (member_id, skill)
);

-- 8. room_invitations
CREATE TABLE room_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    invitee_text VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('LEADER', 'BUILDER', 'DESIGNER', 'PRESENTER', 'DOMAIN_EXPERT', 'QA')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_invitations_room_id ON room_invitations (room_id);

-- 9. invites (shareable links)
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'BUILDER' CHECK (role IN ('LEADER', 'BUILDER', 'DESIGNER', 'PRESENTER', 'DOMAIN_EXPERT', 'QA')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_room_id ON invites (room_id);
CREATE INDEX idx_invites_token ON invites (token);

-- 10. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    link_path VARCHAR(500),
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_read_created ON notifications (user_id, read_at, created_at DESC);
CREATE INDEX idx_notifications_room_id ON notifications (room_id);

-- 11. activity_events
CREATE TABLE activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_room_created ON activity_events (room_id, created_at DESC);

-- 12. uploaded_files
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uploaded_files_room_id ON uploaded_files (room_id);

-- 13. data_exports
CREATE TABLE data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    downloaded_at TIMESTAMPTZ
);

CREATE INDEX idx_data_exports_user_id ON data_exports (user_id);
