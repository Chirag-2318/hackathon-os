# 17 — Troubleshooting

> Purpose: provide evidence-aware troubleshooting pointers.
> Audience: contributors and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: runbook, security/configuration and source inspection.
> Status: Guidance; commands not run.

| Symptom | First places to inspect |
|---|---|
| API unauthorized | Session cookie, OAuth callback configuration, CSRF token/header, `SecurityConfig`, public vs protected route list. |
| Room route rejected | UUID shape, room membership, `RoomAccess`, feature flag and canonical route/redirect. |
| Database connection failure | `SPRING_DATASOURCE_URL`, host port 5433 default, Compose published port, profile selection. |
| AI unavailable | `AI_ENABLED`, user/provider key resolution, timeout/rate/concurrency limits, backend logs without exposing keys. |
| Live updates stale | SSE endpoint, browser credentials, reconnect state, 30-second polling fallback and backend event hub. |
| Mail not sent | `MAIL_ENABLED`, dry-run, SMTP variables, outbox/worker state. |

Do not fix an environment issue by placing secrets in frontend `VITE_*` variables or browser storage.
