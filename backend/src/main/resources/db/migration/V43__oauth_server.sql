-- V43__oauth_server.sql
-- OAuth 2.1 Authorization Server schema for Claude Connect flow and DCR

CREATE TABLE IF NOT EXISTS oauth_clients (
    client_id VARCHAR(200) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    redirect_uris TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS oauth_auth_codes (
    code_hash VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(200) NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    code_challenge VARCHAR(128) NOT NULL,
    scope VARCHAR(100),
    resource TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_auth_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_user_id ON oauth_auth_codes(user_id);

-- Extend mcp_tokens for refresh token family rotation and auth-code reuse revocation
ALTER TABLE mcp_tokens ADD COLUMN IF NOT EXISTS family_id UUID;
ALTER TABLE mcp_tokens ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mcp_tokens ADD COLUMN IF NOT EXISTS auth_code_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_family_id ON mcp_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_auth_code_hash ON mcp_tokens(auth_code_hash);
