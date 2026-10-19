# 06 — Data model and migrations

> Purpose: map persistence domains and migration authority.
> Audience: backend maintainers and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: `backend/src/main/resources/db/migration/` and JPA entities.
> Status: Verified at file/domain level; clean migration application Unverified.

Persistence domains include users/settings/OAuth/API keys; rooms/members/invites; briefs/rubric and ideas; plans/docs/phases/tasks; events/activity/notifications; GitHub/API Hub/diagrams; MVP/pitch/demo/rehearsal/Q&A; readiness/submission/retro; schedules/mail/billing/portfolio/client errors.

The migration directory contains V1–V41 and `V4_1`. Notable later migrations cover AI keys, billing, API Hub, portfolio, pitch/demo/rehearsals and Q&A. Flyway is enabled and Hibernate validates the schema. Because `V4_1` ordering and current working-tree state were not executed, migration success is **UNVERIFIED**.
