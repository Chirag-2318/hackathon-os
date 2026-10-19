# 18 — Source map

> Purpose: point every major documentation claim to authoritative repository sources.
> Audience: maintainers, reviewers and agents.
> Snapshot date: 2026-10-19.
> Source snapshot: repository HEAD `211bc96` plus inspected working-tree files.
> Status: Verified map; exhaustive field-level API/schema map remains Unverified.

| Claim area | Primary source |
|---|---|
| Backend version/build | `backend/pom.xml` |
| App/server/database/AI properties | `backend/src/main/resources/application.yml`, `application-prod.yml`, `application-local.yml` |
| Security | `backend/.../common/config/SecurityConfig.java`, `common/config/AppProperties.java` |
| AI gateway | `backend/.../ai/AiService.java`, `AiProperties.java`, `LlmClient.java` |
| Planning contract | `backend/.../plan/PlanService.java`, `PlanController.java`, plan validators/prompts |
| Readiness | `backend/.../readiness/ReadinessCalculator.java`, `ReadinessController.java` |
| HTTP routes | `backend/.../*Controller.java` and `.../dto/` |
| Persistence | `backend/src/main/resources/db/migration/*.sql` and `backend/...` entity/repository packages |
| Frontend routing | `frontend/src/app/routes/router.tsx` |
| Frontend API/live behavior | `frontend/src/api/`, `frontend/src/lib/apiClient.ts`, `frontend/src/design/live.tsx` |
| Tooling/tests | `frontend/package.json`, `vitest.config.ts`, `e2e/playwright.config.ts`, backend test tree |
| Deployment | `docker-compose.yml`, `deploy/docker-compose.prod.yml`, `deploy/*`, `nginx/*`, Dockerfiles |
| Historical decisions | `docs/WORK_LOG.md`, `docs/ideation.md`, `docs/tech_stack.md`, `docs/PRD-phase-3b-plan-docs-vault.md` |

When sources disagree, runtime code/config/migrations outrank design notes, historical prompts, marketing copy and old API examples.
