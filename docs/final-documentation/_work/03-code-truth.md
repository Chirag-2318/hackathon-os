# Phase 3 — Code-truth inventory

> Status: verified by source inspection on 2026-10-19. This is an inventory, not a runtime test report. No build, test, install, server, migration, or formatter command was run.

## Runtime and configuration

| Area | Verified source truth |
|---|---|
| Backend | Spring Boot `4.1.1`, Maven, Java release `25` (`backend/pom.xml`). Main class is `BackendApplication`; scheduling is enabled and the application clock is UTC. |
| HTTP | Backend default port is `8080`; graceful shutdown, compression, virtual threads, multipart limit 12 MB/file and 14 MB/request are configured in `application.yml`. |
| Database | PostgreSQL datasource defaults to `jdbc:postgresql://localhost:5433/hackathon_os`; Hibernate is `validate`; Flyway is enabled. |
| Migrations | The directory contains `V1`–`V41` plus `V4_1`; later migrations cover plan prompts, billing, API hub, AI keys, portfolio, pitch, demo and Q&A. Exact runtime ordering should be confirmed by Flyway in a real environment; this task did not run it. |
| Frontend | React 19, Vite, TypeScript, React Router, TanStack Query, Framer Motion, Tailwind/Vite integration and `rehype-sanitize` are present. |
| API client | The frontend uses `apiFetch`, `apiClient`, feature service modules and some direct `fetch` calls (SSE, downloads, export helper). The repository rule requiring a generated client is not fully reflected by current usage. |
| API specification | Springdoc exposes `/v3/api-docs` and `/swagger-ui.html` outside production; production disables both. No checked-in OpenAPI file was found. Room API Hub can emit room-level JSON/YAML OpenAPI. |

## Security and access

- Authentication is Spring Security OAuth2/session based. GitHub and Google registrations are configured through environment-backed properties.
- Session cookies are HttpOnly and SameSite=Lax; production marks them Secure. CSRF uses a cookie token repository and the token is intentionally readable by the browser so the frontend can send the CSRF header.
- Public/permit-all groups include health, login/OAuth callbacks, mentor, public APIs, client-error reporting, public portfolio, playbooks, tools, metadata, integration callbacks, username availability and uploads.
- Development-only Swagger, mock and `/api/v1/dev/**` routes are permitted when the `prod` profile is not active. Other requests require authentication.
- CSRF is ignored for `/mock/**`, mentor, public endpoints and `/api/v1/client-errors`; this is an implementation detail that should be reviewed before exposing those routes publicly.
- Room-specific authorization is primarily enforced in services through `RoomAccess` and role checks rather than by a single controller annotation catalogue.

## Backend endpoint families

The current controllers cover these route families. Controller source is authoritative for exact verbs, aliases, DTOs and role requirements.

| Family | Controller/source area | Main capability |
|---|---|---|
| Identity | `users`, `SecurityConfig` | Current user, logout, profile, settings, preferences, AI key, API keys, export/delete, onboarding/tour. |
| Public/catalog | `common`, `catalog`, `admin`, `portfolio`, `mentor`, `meta` | Health, capacity/waitlist, playbooks, tools, public portfolio, mentor context, metadata. |
| Rooms | `rooms`, `members`, `invites`, `presence`, `activity`, `overview`, `home` | Room lifecycle, membership, invite flow, presence and dashboards. |
| Brief/ideation | `brief`, `ideas` | Brief extraction/editing, rubric, idea creation, links, approval and ideation assistance. |
| Plan/docs | `plan`, `docs`, `phases`, `tasks`, `checkpoints` | Four-step plan, prompt/context assembly, validation, docs versions/comments, phases and task board. |
| Build/design | `mvp`, `diagrams`, `apihub`, `github`, `canva` | MVP ledger/flow, diagrams, external API catalogue/import/mock/OpenAPI, GitHub sync/demo and Canva callback/status. |
| Present | `pitch`, `pitchkit`, `demo`, `submission`, `readiness`, `prep`, `crowdcheck`, `retro` | Deck/script, demo station, rehearsal, Q&A, readiness, preparation, crowd check, submission and retrospective. |
| Operations | `email`, `errors`, `dev`, `admin`, `billing`, `search`, `schedule`, `notifications` | Mail, client errors, development seed tools, admin overview, billing interest, search, schedule and notifications. |

Notable concrete mappings verified from controller annotations include:

- `GET /api/v1/health`
- `GET/POST /api/v1/public/capacity` and `/api/v1/public/waitlist`
- `GET /api/v1/me`, `/api/v1/users/me`, `/api/v1/home`
- Room routes under `/api/v1/rooms/{roomId}` for overview, members, invites, ideation, plan, docs, board, MVP, GitHub, APIs, diagrams, PRESENT, readiness, summary and retro.
- `GET /api/v1/rooms/{roomId}/events` and `GET /api/v1/notifications/stream` for SSE.
- `GET /api/v1/rooms/{roomId}/api-hub/openapi.json` and `.yaml` for room-scoped generated API descriptions.
- Legacy non-versioned aliases exist for selected room, brief, plan/present and billing routes; document `/api/v1` as canonical.

The repository contains a large endpoint surface (the existing coverage audit lists 234 rows), so the final API document will group endpoints by controller and link to source rather than reproduce every DTO field in prose. Exact DTO shapes remain available in each controller method signature and `dto` package.

## Plan pipeline

`PlanService.STEP_KEYS` is the current contract:

1. `prd-mvp` — PRD and MVP
2. `stack-arch` — Tech stack and architecture
3. `phases-design` — Phases and design
4. `demo-qna` — Demo and Q&A

The service requires ideation completion before starting, supports leader/member access distinctions, stores step answers and validation diagnostics, assembles prompts/context, invokes `AiService` on generation paths, and synchronizes downstream docs/tasks/phases. The old five-step Plan/Docs Vault PRD is historical.

## AI gateway

`AiService` is backend-mediated and uses an injected `LlmClient`. User AI keys are resolved first; a configured platform key is a development fallback. Configuration is property-driven through `AI_*`, legacy `GROQ_*`, and related STT variables. Current defaults include a Groq-compatible base URL, `openai/gpt-oss-120b` default/smart model, `openai/gpt-oss-20b` fast model, 45-second timeout, two retries, global concurrency four, user rate ten/minute, and enabled true. Room/user limiters and a per-user concurrency guard are separate concerns. No machine-learning implementation claim is made here.

## Live updates and jobs

- Room and notification streams use Spring MVC `SseEmitter` and an in-memory `RoomEventHub`; event replay/resync uses event IDs and persisted room events.
- Backend keepalive scheduling is approximately 25 seconds. Frontend reconnect backoff is 1/2/4 seconds up to 30 seconds, with a 30-second polling fallback after repeated SSE failure.
- Scheduled code includes cleanup/data retention, rate-limiter cleanup, GitHub sync, deadline/email reminders, mail-worker delivery, notification cleanup and submission-link checks.
- No WebSocket/STOMP implementation was found in the inspected source. Cursor-level collaborative editing was not verified.

## Frontend route truth

- Public routes include landing, sign-in/login, invites, playbooks, onboarding, public portfolio, mentor and system pages.
- Authenticated shell routes include home, rooms, playbooks, tools, portfolio, settings, notifications and admin.
- Room routes include overview, brief, team, ideate, plan, docs, board, MVP, GitHub, APIs, diagrams, deck, pitch kit, submission, readiness, summary, retro and notifications; prep, crowd-check and schedule are feature-flag-gated.
- Legacy room routes redirect to current PRESENT routes: pitch/deck → deck; pitch/rehearse and pitch/qa → pitch kit query states; demo → pitch kit demo state; submit → submission.
- Routes are lazy-loaded under Suspense and protected routes use `ProtectedRoute`. Room shell owns live state and presence heartbeat. A non-secret `tour_active` flag is read from `sessionStorage`; auth credentials are not stored there.

## Data model overview

JPA entities span users/settings/preferences/OAuth/API keys, rooms/members/invites, briefs/rubric, ideas/links, plans/docs/tasks/phases, events/activity/notifications, GitHub, API Hub, diagrams, MVP, pitch/demo/rehearsal/Q&A, readiness, submission, retro, schedules, mail, billing, portfolio and client errors. Flyway remains the schema authority because the entity set and migration history have evolved together; a full column-by-column reconciliation is deferred to the final source map rather than inferred from class names.

## Verification limits

- No runtime checks were executed, so this file does not assert that the application currently starts or that migrations apply cleanly.
- The endpoint family table is intentionally not a substitute for generated OpenAPI output.
- DTO field-level documentation is incomplete until the final source map links each controller to its request/response classes.
