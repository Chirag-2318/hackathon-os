-- V28__widen_text_columns.sql
-- Widen free-text columns from varchar to text to support real AI-generated and downstream plan documents

-- MVP
ALTER TABLE IF EXISTS mvp_cut_items ALTER COLUMN text TYPE text;
ALTER TABLE IF EXISTS mvp_flow_steps ALTER COLUMN title TYPE text;
ALTER TABLE IF EXISTS mvp_ledger_rows ALTER COLUMN part TYPE text;
ALTER TABLE IF EXISTS mvp_state ALTER COLUMN identity TYPE text;

-- Tasks
ALTER TABLE IF EXISTS tasks ALTER COLUMN summary TYPE text;

-- Phases and Checkpoints
ALTER TABLE IF EXISTS plan_phases ALTER COLUMN name TYPE text;
ALTER TABLE IF EXISTS room_checkpoints ALTER COLUMN title TYPE text;

-- Plan documents
ALTER TABLE IF EXISTS docs ALTER COLUMN title TYPE text;

-- Ideas
ALTER TABLE IF EXISTS ideas ALTER COLUMN reject_reason TYPE text;

-- Pitch Kit and Q&A
ALTER TABLE IF EXISTS pitch_qa ALTER COLUMN question TYPE text;
ALTER TABLE IF EXISTS code_defense_drills ALTER COLUMN module TYPE text;
ALTER TABLE IF EXISTS code_defense_drills ALTER COLUMN question TYPE text;
ALTER TABLE IF EXISTS pitch_slides ALTER COLUMN title TYPE text;
ALTER TABLE IF EXISTS pitch_slides ALTER COLUMN question TYPE text;
ALTER TABLE IF EXISTS pitch_deck_sources ALTER COLUMN title TYPE text;

-- Demo Script and Beats
ALTER TABLE IF EXISTS demo_sections ALTER COLUMN title TYPE text;
ALTER TABLE IF EXISTS demo_shots ALTER COLUMN title TYPE text;
ALTER TABLE IF EXISTS demo_insurance_items ALTER COLUMN label TYPE text;

-- Submission and Room free text
ALTER TABLE IF EXISTS submission_links ALTER COLUMN label TYPE text;
ALTER TABLE IF EXISTS submission_links ALTER COLUMN url TYPE varchar(2048);
ALTER TABLE IF EXISTS submission_checklist_items ALTER COLUMN label TYPE text;
ALTER TABLE IF EXISTS rooms ALTER COLUMN description TYPE text;
ALTER TABLE IF EXISTS rooms ALTER COLUMN project_description TYPE text;
