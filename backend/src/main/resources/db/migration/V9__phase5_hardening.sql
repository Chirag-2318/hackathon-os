-- V9__phase5_hardening.sql
-- Hackathon OS Phase 5: Production Hardening, Foreign Key Indexes, Constraints & Triggers

-- 1. Foreign Key Performance Indexes (covering remaining unindexed FK relationships)
CREATE INDEX IF NOT EXISTS idx_briefs_confirmed_by ON briefs(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_ideas_decided_by ON ideas(decided_by);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_actor_id ON task_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_created_by ON doc_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_doc_comments_author_id ON doc_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_id ON activity_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_mvp_flow_steps_task_id ON mvp_flow_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_mvp_ledger_rows_owner_id ON mvp_ledger_rows(owner_id);
CREATE INDEX IF NOT EXISTS idx_mvp_ledger_rows_task_id ON mvp_ledger_rows(task_id);

CREATE INDEX IF NOT EXISTS idx_pitch_rehearsals_presenter_id ON pitch_rehearsals(presenter_id);
CREATE INDEX IF NOT EXISTS idx_pitch_rehearsals_operator_id ON pitch_rehearsals(operator_id);
CREATE INDEX IF NOT EXISTS idx_pitch_roles_presenter_id ON pitch_roles(presenter_id);
CREATE INDEX IF NOT EXISTS idx_pitch_roles_operator_id ON pitch_roles(operator_id);
CREATE INDEX IF NOT EXISTS idx_pitch_qa_owner_id ON pitch_qa(owner_id);
CREATE INDEX IF NOT EXISTS idx_code_defense_drills_owner_id ON code_defense_drills(owner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_retro_items_author_id ON retro_items(author_id);
CREATE INDEX IF NOT EXISTS idx_mentor_links_created_by ON mentor_links(created_by);
CREATE INDEX IF NOT EXISTS idx_mentor_questions_answered_by ON mentor_questions(answered_by);
CREATE INDEX IF NOT EXISTS idx_mentor_questions_mentor_link ON mentor_questions(mentor_link_id);

CREATE INDEX IF NOT EXISTS idx_github_repos_connected_by ON github_repos(connected_by);
CREATE INDEX IF NOT EXISTS idx_github_branches_owner_id ON github_branches(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

-- 2. Automated timestamp updates via set_updated_at() trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON rooms;
CREATE TRIGGER trg_rooms_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_briefs_updated_at ON briefs;
CREATE TRIGGER trg_briefs_updated_at
BEFORE UPDATE ON briefs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ideas_updated_at ON ideas;
CREATE TRIGGER trg_ideas_updated_at
BEFORE UPDATE ON ideas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plan_steps_updated_at ON plan_steps;
CREATE TRIGGER trg_plan_steps_updated_at
BEFORE UPDATE ON plan_steps
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_docs_updated_at ON docs;
CREATE TRIGGER trg_docs_updated_at
BEFORE UPDATE ON docs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_mvp_state_updated_at ON mvp_state;
CREATE TRIGGER trg_mvp_state_updated_at
BEFORE UPDATE ON mvp_state
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pitch_decks_updated_at ON pitch_decks;
CREATE TRIGGER trg_pitch_decks_updated_at
BEFORE UPDATE ON pitch_decks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_demo_media_updated_at ON demo_media;
CREATE TRIGGER trg_demo_media_updated_at
BEFORE UPDATE ON demo_media
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_retros_updated_at ON retros;
CREATE TRIGGER trg_retros_updated_at
BEFORE UPDATE ON retros
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ensure github_repos has updated_at column before attaching timestamp trigger
ALTER TABLE github_repos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_github_repos_updated_at ON github_repos;
CREATE TRIGGER trg_github_repos_updated_at
BEFORE UPDATE ON github_repos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_github_branches_updated_at ON github_branches;
CREATE TRIGGER trg_github_branches_updated_at
BEFORE UPDATE ON github_branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_oauth_tokens_updated_at ON user_oauth_tokens;
CREATE TRIGGER trg_user_oauth_tokens_updated_at
BEFORE UPDATE ON user_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
