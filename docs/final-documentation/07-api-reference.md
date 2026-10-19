# 07 — API reference

> Purpose: orient readers to the implemented HTTP surface.
> Audience: frontend/backend maintainers and integrators.
> Snapshot date: 2026-10-19.
> Source snapshot: controller annotations under `backend/src/main/java/...`.
> Status: Verified route families; not a generated OpenAPI replacement.

Canonical paths use `/api/v1`. Controller families: identity/users; public health/catalog/capacity; rooms/members/invites/presence; brief/ideas; plan/docs/phases/tasks/checkpoints; MVP/diagrams/API Hub/GitHub/Canva; pitch/pitchkit/demo/submission/readiness/prep/crowd-check/retro; notifications/search/schedule/email/admin/billing/dev.

Important streams are `GET /api/v1/rooms/{roomId}/events` and `GET /api/v1/notifications/stream`. API Hub emits room-level `/openapi.json` and `/openapi.yaml`. Springdoc exposes `/v3/api-docs` and Swagger UI only outside production.

The exact request/response contract is in each controller method and `dto` package. Existing `docs/COVERAGE.md` is an audit artifact, not proof that every row is live. Non-versioned aliases exist for selected routes and should be treated as compatibility paths.
