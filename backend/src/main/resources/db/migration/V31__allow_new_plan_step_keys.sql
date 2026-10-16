-- V31__allow_new_plan_step_keys.sql
-- Allow new 4-step plan keys in plan_steps check constraint
ALTER TABLE plan_steps DROP CONSTRAINT IF EXISTS plan_steps_step_key_check;
ALTER TABLE plan_steps ADD CONSTRAINT plan_steps_step_key_check 
    CHECK (step_key IN ('prd', 'tech', 'phases', 'tasks', 'demo', 'prd-mvp', 'stack-arch', 'phases-design', 'demo-qna'));
