-- V22: Add provider_avatar_url column and log completed-onboarding users with overwritten OAuth avatars
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_avatar_url VARCHAR(500);

DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_count
    FROM users
    WHERE onboarding_completed = true
      AND (avatar_url LIKE '%googleusercontent.com%' OR avatar_url LIKE '%githubusercontent.com%');
    RAISE NOTICE 'Completed-onboarding users with overwritten OAuth avatars: %', affected_count;
END $$;
