-- V21__user_confirmation_email_and_invites.sql
-- Track account confirmation email status and optimize email invitations

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_room_invitations_invitee_text ON room_invitations (lower(invitee_text));
