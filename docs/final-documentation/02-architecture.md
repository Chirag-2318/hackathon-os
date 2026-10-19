# 02 — Architecture

> Purpose: describe runtime boundaries and major modules.
> Audience: maintainers and operators.
> Snapshot date: 2026-10-19.
> Source snapshot: `backend/pom.xml`, `frontend/package.json`, `application.yml`.
> Status: Verified; not runtime-tested.

```text
Browser (React/Vite)
  ├─ REST through apiFetch/apiClient and feature services
  ├─ SSE room/notification streams
  └─ protected React Router shell
        ↓ cookie session + CSRF header
Spring Boot backend :8080
  ├─ controllers → services → repositories/JPA
  ├─ OAuth2/session security and room access checks
  ├─ Flyway-managed PostgreSQL schema
  ├─ AiService/LlmClient gateway
  └─ in-process jobs and SSE event hub
        ↓
PostgreSQL; optional SMTP, GitHub, Canva and AI-compatible provider
```

The backend uses `ddl-auto: validate`; migrations, not Hibernate schema generation, own database changes. The frontend uses code-split lazy routes and TanStack Query for server state.
