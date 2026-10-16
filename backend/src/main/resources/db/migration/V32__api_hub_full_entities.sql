-- V32__api_hub_full_entities.sql
-- Widen and extend API Hub entities: ApiExternal and ApiEndpoint

-- 1. ApiExternal updates
ALTER TABLE IF EXISTS api_externals ALTER COLUMN rate_limit TYPE text;
ALTER TABLE IF EXISTS api_externals ALTER COLUMN cost TYPE text;
ALTER TABLE IF EXISTS api_externals ALTER COLUMN key_location TYPE varchar(500);

ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
UPDATE api_externals SET owner_user_id = key_owner_id WHERE owner_user_id IS NULL AND key_owner_id IS NOT NULL;

ALTER TABLE IF EXISTS api_externals DROP CONSTRAINT IF EXISTS api_externals_auth_type_check;
ALTER TABLE IF EXISTS api_externals ADD CONSTRAINT api_externals_auth_type_check CHECK (auth_type IN ('NONE', 'API_KEY', 'BEARER', 'OAUTH', 'BASIC'));

ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS fallback_notes TEXT;
ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS docs_url TEXT;
ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS api_externals ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 2. ApiEndpoint updates
ALTER TABLE IF EXISTS api_endpoints ALTER COLUMN summary TYPE text;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS tag VARCHAR(100);
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS request_schema JSONB;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS response_schemas JSONB;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS parameters JSONB;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS mock_response JSONB;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS mock_status INT NOT NULL DEFAULT 200;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS auth_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS api_endpoints ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS api_endpoints DROP CONSTRAINT IF EXISTS api_endpoints_source_check;
ALTER TABLE IF EXISTS api_endpoints ADD CONSTRAINT api_endpoints_source_check CHECK (source IN ('MANUAL', 'IMPORT', 'PLAN'));
