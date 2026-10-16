-- V30__user_portfolio.sql
-- Portfolio custom bio, link chips, and project pin curation

ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE portfolio_visibility ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE portfolio_visibility ADD COLUMN IF NOT EXISTS pin_order INT NOT NULL DEFAULT 0;
ALTER TABLE portfolio_visibility ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_portfolio_visibility_user_pinned ON portfolio_visibility (user_id, is_pinned, pin_order);
