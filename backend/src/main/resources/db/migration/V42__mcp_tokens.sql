-- V42__mcp_tokens.sql
-- Table for Model Context Protocol (MCP) Bearer access and refresh tokens

CREATE TABLE IF NOT EXISTS mcp_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('ACCESS', 'REFRESH')),
    client_id VARCHAR(200),
    scope VARCHAR(50) NOT NULL DEFAULT 'mcp',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id ON mcp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_token_hash ON mcp_tokens(token_hash);
