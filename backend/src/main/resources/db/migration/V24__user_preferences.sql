CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(32) NOT NULL DEFAULT 'system',
    text_size VARCHAR(32) NOT NULL DEFAULT 'default',
    motion VARCHAR(32) NOT NULL DEFAULT 'system',
    sidebar_default VARCHAR(32) NOT NULL DEFAULT 'expanded',
    time_format VARCHAR(32) NOT NULL DEFAULT '12h',
    timezone VARCHAR(100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
