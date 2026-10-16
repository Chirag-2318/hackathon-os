-- V33: User AI Keys for Bring-Your-Own-Key (BYOK) architecture
CREATE TABLE IF NOT EXISTS user_ai_keys (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'GROQ',
    key_ciphertext TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    key_last4 VARCHAR(4) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',
    last_checked_at TIMESTAMPTZ,
    last_error VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_keys_status ON user_ai_keys(status);
