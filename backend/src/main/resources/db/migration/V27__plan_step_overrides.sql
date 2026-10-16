-- V27__plan_step_overrides.sql
-- Add validated_with_overrides column to plan_steps for leader import override

ALTER TABLE plan_steps ADD COLUMN IF NOT EXISTS validated_with_overrides BOOLEAN NOT NULL DEFAULT FALSE;
