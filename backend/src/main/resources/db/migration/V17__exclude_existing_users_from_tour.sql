-- V17: Permanently exclude existing onboarded users from the guided flight tour
UPDATE users SET tour_status = 'SKIPPED' WHERE tour_status = 'NOT_STARTED' AND onboarded_at IS NOT NULL;
