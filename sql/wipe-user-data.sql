-- ==============================================================================
-- HACKATHON OS - ADMIN CLEANUP SCRIPT: WIPE USER-CREATED DATA
-- ==============================================================================
-- PURPOSE:
-- Safely clears all user-generated runtime data (rooms, team members, ideas,
-- sprint tasks, documents, notifications, live events, submissions, and uploads)
-- while preserving the core schema, Flyway migration history (flyway_schema_history),
-- and catalog seeds (event_templates, etc.).
--
-- USAGE:
-- Execute against PostgreSQL database using psql or Docker:
--   docker exec -i hackathon-os-postgres psql -U hackathon -d hackathon_os < sql/wipe-user-data.sql
-- ==============================================================================

BEGIN;

-- 1. Live sync and telemetry
TRUNCATE TABLE room_events CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- 2. Tasks and Collaboration
TRUNCATE TABLE task_dependencies CASCADE;
TRUNCATE TABLE task_acceptance_criteria CASCADE;
TRUNCATE TABLE task_subtasks CASCADE;
TRUNCATE TABLE task_comments CASCADE;
TRUNCATE TABLE tasks CASCADE;

-- 3. Documentation & Comments
TRUNCATE TABLE doc_comments CASCADE;
TRUNCATE TABLE doc_versions CASCADE;
TRUNCATE TABLE docs CASCADE;

-- 4. Ideation, MVP, and Planning
TRUNCATE TABLE ideas CASCADE;
TRUNCATE TABLE mvp_flow_steps CASCADE;
TRUNCATE TABLE mvp_ledger_rows CASCADE;
TRUNCATE TABLE mvp_cut_items CASCADE;
TRUNCATE TABLE mvp_state CASCADE;
TRUNCATE TABLE plan_steps CASCADE;
TRUNCATE TABLE plan_phases CASCADE;

-- 5. Presentation, Pitch Kit & Submissions
TRUNCATE TABLE pitch_qa CASCADE;
TRUNCATE TABLE pitch_slides CASCADE;
TRUNCATE TABLE pitch_decks CASCADE;
TRUNCATE TABLE submissions CASCADE;

-- 6. Briefs & Checkpoints
TRUNCATE TABLE brief_rubric_items CASCADE;
TRUNCATE TABLE briefs CASCADE;
TRUNCATE TABLE room_checkpoints CASCADE;

-- 7. GitHub & Integrations
TRUNCATE TABLE github_branches CASCADE;
TRUNCATE TABLE github_repos CASCADE;
TRUNCATE TABLE user_oauth_tokens CASCADE;
TRUNCATE TABLE uploaded_files CASCADE;

-- 8. Rooms & Memberships
TRUNCATE TABLE room_member_skills CASCADE;
TRUNCATE TABLE room_members CASCADE;
TRUNCATE TABLE rooms CASCADE;

COMMIT;
