-- V5__phase4_tech.sql
-- Hackathon OS Phase 4: Tech Module Schema (GitHub, API Hub, Diagrams, OAuth Tokens)

-- 1. user_oauth_tokens
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('GITHUB', 'GOOGLE')),
    access_token_encrypted TEXT NOT NULL,
    scope VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, provider)
);

-- 2. github_repos
CREATE TABLE IF NOT EXISTS github_repos (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public', 'private')),
    default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
    access VARCHAR(20) NOT NULL DEFAULT 'read-only',
    connected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'failed')),
    sync_error TEXT,
    deployed_link TEXT,
    token_source VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (token_source IN ('user', 'app', 'none'))
);

-- 3. github_branches
CREATE TABLE IF NOT EXISTS github_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    purpose VARCHAR(140),
    role VARCHAR(20) NOT NULL DEFAULT 'experiment' CHECK (role IN ('main', 'demo-safe', 'experiment', 'stale')),
    role_locked BOOLEAN NOT NULL DEFAULT false,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ahead INT NOT NULL DEFAULT 0,
    behind INT NOT NULL DEFAULT 0,
    last_commit_sha VARCHAR(64),
    last_commit_message TEXT,
    last_commit_at TIMESTAMPTZ,
    pr_number INT,
    pr_title TEXT,
    pr_status VARCHAR(20) CHECK (pr_status IN ('draft', 'open', 'merged', 'closed')),
    pr_conflicts BOOLEAN NOT NULL DEFAULT false,
    pr_opened_at TIMESTAMPTZ,
    pr_reviewer_count INT NOT NULL DEFAULT 0,
    url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_github_branches_room_name UNIQUE (room_id, name)
);

CREATE INDEX IF NOT EXISTS idx_github_branches_room_id ON github_branches (room_id);

-- 4. github_branch_tasks
CREATE TABLE IF NOT EXISTS github_branch_tasks (
    branch_id UUID NOT NULL REFERENCES github_branches(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (branch_id, task_id)
);

-- 5. github_commits
CREATE TABLE IF NOT EXISTS github_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sha VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    author_login VARCHAR(255),
    author_name VARCHAR(255),
    author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    committed_at TIMESTAMPTZ NOT NULL,
    additions INT,
    deletions INT,
    branch_name VARCHAR(255),
    CONSTRAINT uq_github_commits_room_sha UNIQUE (room_id, sha)
);

CREATE INDEX IF NOT EXISTS idx_github_commits_room_committed ON github_commits (room_id, committed_at);

-- 6. github_health_items
CREATE TABLE IF NOT EXISTS github_health_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_key VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'fail' CHECK (status IN ('pass', 'fail')),
    required BOOLEAN NOT NULL DEFAULT false,
    detail TEXT,
    action_label VARCHAR(255),
    action_url TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_github_health_items_room_key UNIQUE (room_id, item_key)
);

-- 7. github_frozen_demo
CREATE TABLE IF NOT EXISTS github_frozen_demo (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    sha VARCHAR(64) NOT NULL,
    message TEXT,
    tag VARCHAR(60) NOT NULL,
    frozen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    frozen_by UUID REFERENCES users(id) ON DELETE SET NULL,
    commits_since INT NOT NULL DEFAULT 0
);

-- 8. github_attention_dismissals
CREATE TABLE IF NOT EXISTS github_attention_dismissals (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_key VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, item_key, user_id)
);

-- 9. api_externals
CREATE TABLE IF NOT EXISTS api_externals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    base_url TEXT NOT NULL,
    auth_type VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (auth_type IN ('NONE', 'API_KEY', 'BEARER', 'OAUTH')),
    rate_limit VARCHAR(100),
    cost VARCHAR(100),
    key_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    key_location TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN' CHECK (status IN ('UNKNOWN', 'WORKING', 'FAILING')),
    fallback TEXT,
    last_checked_at TIMESTAMPTZ,
    last_latency_ms INT
);

CREATE INDEX IF NOT EXISTS idx_api_externals_room_id ON api_externals (room_id);

-- 10. api_endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    path VARCHAR(255) NOT NULL,
    summary VARCHAR(255),
    request_example TEXT,
    response_status INT NOT NULL DEFAULT 200,
    response_example TEXT,
    mock_enabled BOOLEAN NOT NULL DEFAULT false,
    position INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_api_endpoints_room_method_path UNIQUE (room_id, method, path)
);

CREATE INDEX IF NOT EXISTS idx_api_endpoints_room_pos ON api_endpoints (room_id, position);

-- 11. api_mock_settings
CREATE TABLE IF NOT EXISTS api_mock_settings (
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    token VARCHAR(64) NOT NULL UNIQUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. diagrams
CREATE TABLE IF NOT EXISTS diagrams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(80) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN ('architecture', 'userflow', 'sequence', 'er', 'roadmap')),
    mermaid_source TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagrams_room_id ON diagrams (room_id);
