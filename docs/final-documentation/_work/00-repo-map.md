# Phase 0 — Repository map

## Scope and safety record

- Project name used by this documentation: **Bracket**.
- Repository/workspace: `hackathon-os`.
- This phase created only `docs/final-documentation/` and its `_work/` subfolder.
- Existing working-tree changes were present before documentation work began. They are not part of this documentation effort and must not be overwritten.
- Date of orientation: 2026-10-19 (repository host date; user timezone is Asia/Calcutta).

## Top-level structure

| Path | Observed role |
|---|---|
| `backend/` | Spring Boot/Maven application. Java sources, resources, Flyway migrations, tests, Dockerfile, and environment example. |
| `frontend/` | React/Vite/TypeScript application. Feature modules, shared UI, tests, mocks, build/deployment files, and generated/test artifacts. |
| `e2e/` | Root-level end-to-end test material (`phase-6b.spec.ts`). |
| `docs/` | Existing project documentation, API request collections, landing-page notes, redesign notes, and process artifacts. |
| `deploy/` | Production deployment scripts and deployment Docker Compose/Caddy configuration. |
| `scripts/` | Development, database backup/restore, reset, and endpoint-coverage scripts. |
| `sql/` | SQL utility script(s), including user-data wipe support. |
| `config/` | Repository-level seed/configuration JSON. |
| `nginx/` | Root deployment reverse-proxy configuration. |
| `uploads/` | Checked-in demo screenshot asset(s) observed during mapping. |
| `backup/` | SQL backup artifact observed during mapping. |
| `scratch/` | Inspection/check scripts; not treated as authoritative documentation. |
| `test-results/` | Test-run metadata/artifacts. |
| `.vscode/` | Editor settings. |
| `.env.example` | Root environment-variable example; values must not be copied into docs. |
| `docker-compose.yml` | Development/container orchestration configuration. |
| `README.md` | Existing root project overview/instructions; must be checked against code. |
| `AGENTS.md` | Repository instructions. |
| `PROJECT_CONTEXT.md` | Existing project context artifact. |

## Backend map

- Build: `backend/pom.xml`, Maven wrapper (`backend/mvnw`, `backend/mvnw.cmd`).
- Container: `backend/Dockerfile`.
- Configuration: `backend/src/main/resources/application.yml`, `application.yaml`, `application-local.yml`, and `application-prod.yml`; `backend/.env.example` exists. The duplicate YAML names and profile behavior require code/config verification.
- Main Java package: `com.hackathonos.backend`.
- Observed feature/package areas include authentication, AI, briefs/files, checkpoints, events/SSE, errors, GitHub integration, hackathons, home, integrations, invites, ideas, notifications, onboarding, overview, pitch, plan, readiness, reminders, retro, rooms, schedule, submissions, tasks, team, templates, and users.
- Database migration location: `backend/src/main/resources/db/migration/`. Both phase-named and feature-named versioned SQL files are present; migration ordering and duplicate version prefixes must be reconciled during code-truth analysis.
- Tests: `backend/src/test/java/` with unit/integration/e2e-style test classes and plan sample resources.

## Frontend map

- Build/tooling files: `frontend/package.json`, `package-lock.json`, `vite.config.ts`, TypeScript configs, `vitest.config.ts`, `playwright.config.ts`, Dockerfile, and Nginx config.
- Entry/routing: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/app/routes/router.tsx`.
- API/client areas: `frontend/src/api/`, `frontend/src/lib/apiClient.ts`, `frontend/src/services/`, and feature-local API modules.
- Feature areas observed include auth, home, rooms, room overview, onboarding, invites, ideation, brief, plan, docs, board, build, MVP, pitch, pitch kit, readiness, prep, GitHub, team, notifications, schedule, submission, retro, portfolio, playbooks, tools, APIs, diagrams, mentor, demo, settings, public/system pages, and landing.
- Shared presentation: `frontend/src/components/`, `frontend/src/shared/`, `frontend/src/design/`, `frontend/src/index.css`, and `frontend/src/shared/motion/`.
- Tests/mocks: `frontend/e2e/`, Vitest tests under source, MSW mocks under `frontend/src/mocks/` and feature-local mock folders, plus checked-in Playwright reports/artifacts.
- Landing implementation: `frontend/src/features/landing/` contains a substantial implemented route and many components/data/hooks; the separate `docs/landing/` material is therefore expected to include both plan/history and implemented-state claims requiring reconciliation.

## Deployment/operations map

- Development orchestration: `docker-compose.yml`, `scripts/dev-up.sh`, `scripts/dev-up.ps1`.
- Production orchestration: `deploy/docker-compose.prod.yml`, `deploy/Caddyfile`, `nginx/nginx.conf`, `frontend/nginx.conf`.
- Deployment lifecycle: `deploy/setup-vm.sh`, `deploy/update.sh`, `deploy/rollback.sh`, `deploy/backup.sh`, `deploy/restore.md`, and `deploy/backend.env.example`.
- Database operations: `scripts/db-backup.*`, `scripts/db-restore.*`, `scripts/reset-user-data.*`, `sql/wipe-user-data.sql`.
- CI configuration was not identified in the initial top-level listing; this is unverified until a full file inventory is completed.

## Git orientation (read-only)

- Current branch: `main`.
- HEAD at orientation: `211bc96` — `feat(pitch-kit): complete Pitch Kit with Demo station, Rehearsal telemetry, and Q&A defence trainer` — 2026-10-19 15:43:24 +0530.
- Recent history also includes `2249e74` (landing v2, 2026-10-19), `26a2989` (production hardening/deployment, 2026-10-17), `a9d5fcb` (plan work, 2026-10-13), `072237a` (onboarding/rooms/Postgres JSONB fixes, 2026-10-12), and `631dc02` (end-to-end flows and integrations, 2026-10-12).
- The working tree is heavily modified relative to HEAD, including existing changes across docs, backend-adjacent scripts, frontend source/tests/assets, deployment files, and untracked frontend files. These changes predate this task as observed before the output folder was created.
- The full exact status/diff baseline will be captured again in the final report using read-only `git status --short` and `git diff --stat`; no attempt will be made to clean or normalize it.

## Initial findings requiring later verification

1. Multiple application configuration files (`application.yml` and `application.yaml`) exist.
2. Migration filenames contain repeated version prefixes (`V1`, `V2`, `V3`, and `V4` families), so actual Flyway compatibility and ordering must be read from configuration and files rather than inferred.
3. The repository contains both real integrations and local/mock/demo implementations; documentation must distinguish them.
4. Existing docs and source files are actively modified in the working tree. Git commit dates alone cannot prove the current working-tree content's age; claims will be marked accordingly.
5. The user states the project has no machine learning. No ML claims will be introduced; AI-provider references will be retained only where verified in code/config and described precisely.
