# 14 — Integrations

> Purpose: list external-service boundaries and local fallbacks.
> Audience: operators and maintainers.
> Snapshot date: 2026-10-19.
> Source snapshot: integration controllers/services/configuration.
> Status: Verified source; credentials and external calls not tested.

| Integration | Source/status |
|---|---|
| GitHub | OAuth/link, repository/branch/commit/demo sync and scheduled sync code exist. |
| Canva | Status/connect/callback/design routes exist; provider configuration is optional. |
| SMTP | Mail outbox/worker/templates and optional dry-run/test controls exist. |
| AI-compatible provider | Backend `AiService`/`LlmClient`; BYOK-first resolution. |
| PostgreSQL | Required persistence boundary with Flyway migrations. |
| Billing | Interest/configuration path; live checkout not verified. |

External portal submission, video, WebSockets and judge portal are not documented as implemented.
