-- V11__add_github_login_to_user_oauth_tokens.sql
ALTER TABLE user_oauth_tokens ADD COLUMN IF NOT EXISTS github_login VARCHAR(100);
