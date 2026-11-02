# System Context & Load-Readiness Audit: Brackit (Hackathon OS)

**Audit Target:** `brackit` (Hackathon OS)  
**Audit Type:** Deep Read-Only Architectural, Concurrency, and Scaling Audit  
**Date:** November 2026  
**Audited Scope:** 
- **API Endpoints:** 348 unique canonical endpoints across 67 Spring Boot `@RestController` classes
- **Database Tables:** 116 relational tables across 44 Flyway migration scripts (`V1` through `V43` + `V4_1`)
- **Frontend Architecture:** React 19 SPA, Vite 8, Tailwind CSS v4, TanStack Query v5, Zustand, Vercel edge proxy
- **Backend Architecture:** Java 25, Spring Boot 4.1.1, Spring Data JPA / Hibernate, HikariCP, PostgreSQL 16+

---

## Master Table of Contents

Because this audit is exhaustive and granular, the full technical documentation is split into 16 modular sub-documents located in [`docs/system_context/`](./system_context/), indexed below with summaries and direct links:

1. [**1. PROJECT OVERVIEW**](./system_context/01_project_overview.md)
   - Product domain, core user workflows (pitch, tasks, checkpoints, submissions, judging, prize tracks), user roles (Organizer, Mentor, Judge, Hacker, Guest), main entities, and repository folder structure.
2. [**2. TECH STACK & VERSIONS**](./system_context/02_tech_stack_and_versions.md)
   - Java 25, Spring Boot 4.1.1, React 19, Vite 8, Tailwind CSS v4, TanStack Query v5, Lucide React, PostgreSQL 16+, Flyway, Docker, and Render deployment specifications.
3. [**3. ARCHITECTURE & COMPONENTS**](./system_context/03_architecture_and_components.md)
   - Runtime components, process boundaries, ASCII & Mermaid topology diagram, and complete inventory of 16 in-memory state structures held in JVM heap.
4. [**4. REQUEST LIFECYCLE**](./system_context/04_request_lifecycle.md)
   - End-to-end request tracing (Vercel edge -> Render proxy -> Spring Security -> MDC -> Controllers), virtual thread model, validation/exception hierarchy, unbounded queries, and full 348-endpoint inventory table.
5. [**5. AUTHENTICATION & AUTHORIZATION**](./system_context/05_authentication_and_authorization.md)
   - Google OAuth2 flow, Tomcat stateful session cookies (`JSESSIONID`), MCP API token bearer auth, RFC 6749 OAuth server, `RoomAccess` role-based access control, CSRF protections, and BCrypt hashing.
6. [**6. DATA LAYER**](./system_context/06_data_layer.md)
   - HikariCP connection pool parameters, complete 116-table schema inventory with constraints and indexes, 15 missing FK indexes, N+1 query patterns, and 19 critical `@Transactional` methods holding DB connections during external HTTP calls.
7. [**7. REAL-TIME / CROSS-USER UPDATES**](./system_context/07_realtime_cross_user_updates.md)
   - Server-Sent Events (SSE) via `RoomEventHub`, 200-event circular memory buffers, monotonic sequence numbering, polling fallbacks, multi-instance failure modes, and data staleness analysis.
8. [**8. BACKGROUND WORK & EXTERNAL DEPENDENCIES**](./system_context/08_background_work_and_dependencies.md)
   - 13 `@Scheduled` background worker routines, `DbAdvisoryLockService` distributed locks, transactional outbox email dispatch, external APIs (Groq LLM, Whisper STT, SMTP, Jina Reader), and synchronous blocking calls.
9. [**9. FILE & MEDIA HANDLING**](./system_context/09_file_and_media_handling.md)
   - Multipart file upload pipeline (`/api/v1/users/me/avatar`), 12 MB payload cap, 5 MB audio cap, local filesystem storage at `/app/uploads`, and Render ephemeral disk data loss risks.
10. [**10. FRONTEND DATA-FETCHING BEHAVIOUR**](./system_context/10_frontend_data_fetching.md)
    - Client network transport (`apiFetch` vs `apiClient`), TanStack Query 5-minute cache defaults, page load request storms, duplicate SSE connection bug, and 8 Zustand stores.
11. [**11. CONFIGURATION & DEPLOYMENT (Render Focus)**](./system_context/11_configuration_and_deployment.md)
    - Complete inventory of 44 environment variables, multi-stage Dockerfile, JVM memory tuning flags, `ProductionStartupValidator`, and 7 concrete code-level reasons for Render deployment failures.
12. [**12. OBSERVABILITY & ERROR HANDLING**](./system_context/12_observability_and_error_handling.md)
    - Logback JSON layout, MDC correlation tracking (`X-Request-Id`), `client_errors` persistent error logging, and audit of 135 swallowed exception catch blocks.
13. [**13. SECURITY OBSERVATIONS**](./system_context/13_security_observations.md)
    - SQL injection resistance (JPQL parameterized), XSS mitigation (`rehype-sanitize`), SSRF defense (`SsrfGuard`), IDOR audit, AES-256-GCM encryption (`SecretCipher`), and credential storage.
14. [**14. TESTS & CODE QUALITY**](./system_context/14_tests_and_code_quality.md)
    - Automated test coverage, 11 backend test classes excluded from Maven compilation, legacy duplicate controllers, and inventory of actionable `TODO`/`FIXME` comments.
15. [**15. PRELIMINARY SCALABILITY & RELIABILITY RISK LIST (AUDITOR OPINION)**](./system_context/15_scalability_and_reliability_risks.md)
    - 10 prioritized architectural bottlenecks ranked from Critical to Medium, detailing exact file locations, failure mechanics under 2,000–4,000 users, and user-visible failure symptoms.
16. [**16. OPEN QUESTIONS FOR THE OWNER**](./system_context/16_open_questions.md)
    - 10 concrete, numbered operational and infrastructure questions required to finalize sizing, capacity planning, and deployment topology.
17. [**COVERAGE CHECKLIST**](#coverage-checklist)
    - Explicit audit log of every directory, module, and file inspected, with explanations of excluded paths.

---

# 1. PROJECT OVERVIEW
*(Full documentation: [`docs/system_context/01_project_overview.md`](./system_context/01_project_overview.md))*

Brackit (Hackathon OS) is a full-lifecycle hackathon management and team collaboration platform. It unifies project ideation, real-time kanban task management, AI-assisted pitch drafting, live speech transcription with rehearsal scoring, milestone checkpoints, submission evaluation, and sponsor prize tracks into a single shared workspace ("Room").

### Core User Flows
1. **Room Creation & Onboarding**: Organizers create a Room, configure custom submission schemas, checkpoints, and rubrics, and invite participants via role-based invite codes (`backend/src/main/java/com/hackathonos/backend/room/RoomInviteService.java`).
2. **Team Collaboration & Planning**: Teams create tasks (`TaskController.java`), manage deadlines, upload assets, and communicate via real-time SSE event streams (`RoomEventHub.java`).
3. **AI Pitch Drafting & Rehearsal**: Teams use Groq-powered LLMs (`AiService.java`) to refine problem statements, value propositions, and pitch scripts. Audio recordings are transcribed via Groq Whisper (`PitchKitController.java`) and scored against target pacing.
4. **Judging & Scoring**: Judges review submissions against weighted criteria, input numeric scores, and submit feedback (`SubmissionJudgingController.java`, `JudgingRubricController.java`).

### User Roles & Permissions
- **Admin / Organizer**: Full administrative authority over room settings, rubrics, invites, and scoring exports (`RoomRole.ADMIN`).
- **Mentor**: Read access to team rooms, ability to leave structured feedback, guidance, and checkpoint reviews (`RoomRole.MENTOR`).
- **Judge**: Dedicated scoring portal access, submission evaluation, rubric scoring, and deliberation views (`RoomRole.JUDGE`).
- **Hacker / Participant**: Team member rights, task editing, pitch kit usage, checkpoint submissions (`RoomRole.MEMBER`).
- **Viewer / Guest**: Read-only observation of public room artifacts and project showcases (`RoomRole.VIEWER`).

---

# 2. TECH STACK & VERSIONS
*(Full documentation: [`docs/system_context/02_tech_stack_and_versions.md`](./system_context/02_tech_stack_and_versions.md))*

- **Backend Runtime**: Java 25 (OpenJDK), Spring Boot 4.1.1 (Milestone/Snapshot branch).
- **Core Backend Libraries**: Spring Data JPA, Hibernate ORM, HikariCP, Spring Security 6, Spring Session, Flyway Community, Jackson 2.18, Jsoup 1.18.
- **Frontend Runtime**: React 19.1.0, TypeScript 5.7.2, Vite 8.0.0.
- **Frontend State & UI**: TanStack Query v5.66.0, Zustand 5.0.3, Tailwind CSS v4.0.0, Lucide React 1.16.0, Radix UI primitives.
- **Database**: PostgreSQL 16+ (tested against PostgreSQL 15/16).
- **External AI Providers**: Groq API (`llama-3.3-70b-versatile`, `whisper-large-v3`).

---

# 3. ARCHITECTURE & COMPONENTS
*(Full documentation: [`docs/system_context/03_architecture_and_components.md`](./system_context/03_architecture_and_components.md))*

The system is structured as a **stateless-designed, single-process monolithic backend** paired with an independent SPA frontend, but currently contains **16 in-memory state structures** inside the JVM heap that break multi-instance scaling.

```
                      +-----------------------------+
                      |   Browser Clients (React)   |
                      +--------------+--------------+
                                     |
               HTTPS REST            |           HTTPS SSE (/events)
                                     v
                      +-----------------------------+
                      |    Vercel Reverse Proxy     |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Render Web Service      |
                      |  (Spring Boot / Java 25)    |
                      |                             |
                      |  - Spring MVC Controllers   |
                      |  - Virtual Thread Pool      |
                      |  - RoomEventHub (SSE Hub)   |  <--- IN-MEMORY (Non-distributed)
                      |  - PresenceService (Heap)   |  <--- IN-MEMORY (Non-distributed)
                      |  - Tomcat Session Store     |  <--- IN-MEMORY (Non-distributed)
                      +-------+-------------+-------+
                              |             |
           PostgreSQL (Flyway)|             | HTTP / REST
                              v             v
                    +------------+   +----------------------+
                    | PostgreSQL |   | Groq Cloud (LLM/STT) |
                    | 16 Database|   | Jina AI Reader       |
                    +------------+   | Resend / Gmail SMTP  |
                                     +----------------------+
```

### Critical In-Memory State Registry
1. `RoomEventHub.rooms`: ConcurrentHashMap of SSE emitters and 200-event ring buffers per room.
2. `PresenceService.roomPresence`: In-memory tracking of active room participants.
3. `Tomcat StandardManager`: In-memory HTTP session store for OAuth2 authentication.
4. `SseKeepAliveService`: Scheduled task pinging active SSE emitters.

---

# 4. REQUEST LIFECYCLE
*(Full documentation: [`docs/system_context/04_request_lifecycle.md`](./system_context/04_request_lifecycle.md))*

### Execution Pipeline
1. **Edge Routing**: Requests hit Vercel edge proxy (`frontend/vercel.json`), forwarding `/api/**` to Render backend.
2. **Container Entry**: Render TLS termination routes traffic to port `8080` (or dynamic `$PORT`).
3. **Filter Chain**:
   - `ForwardedHeaderFilter`: Extracts client IP and protocol from `X-Forwarded-*`.
   - `RequestCorrelationFilter`: Generates or propagates `X-Request-Id` into Logback MDC.
   - `SecurityFilterChain`: Evaluates session cookie (`JSESSIONID`) or Bearer token (`MCP_API_TOKEN`).
   - `RoomAccessFilter`: Enforces user membership and role verification for `/api/v1/rooms/{roomId}/**`.
4. **DispatcherServlet & Handler Execution**: Routed to one of 67 `@RestController` classes running on Java 25 Virtual Threads (`spring.threads.virtual.enabled=true`).
5. **Database Interaction**: HikariCP acquires physical connection; Hibernate executes parameterized queries.

### API Surface
- **348 Canonical Endpoints** mapped across 67 controllers. Full table inventory available in [`docs/system_context/04_request_lifecycle.md`](./system_context/04_request_lifecycle.md).

---

# 5. AUTHENTICATION & AUTHORIZATION
*(Full documentation: [`docs/system_context/05_authentication_and_authorization.md`](./system_context/05_authentication_and_authorization.md))*

- **Primary Authentication**: Google OAuth2 (`OAuth2LoginSuccessHandler.java`).
- **Session Model**: Stateful HTTP session stored in Tomcat JVM memory; session ID transmitted via HTTP-only cookie (`JSESSIONID`).
- **Service-to-Service Auth**: Static Bearer token (`MCP_API_TOKEN`) authenticated via `McpTokenAuthFilter.java`.
- **OAuth Server**: RFC 6749 compliant server implemented in `OAuthServerController.java` for third-party client integrations.
- **Authorization**: Declarative `@PreAuthorize` combined with programmatic checks in `RoomAccessService.java`.

---

# 6. DATA LAYER
*(Full documentation: [`docs/system_context/06_data_layer.md`](./system_context/06_data_layer.md))*

- **Engine**: PostgreSQL 16+ managed by Flyway migrations (`V1` to `V43` + `V4_1`).
- **Table Count**: **116 tables** (113 managed via JPA `@Entity`, 3 queried via Spring `JdbcTemplate`).
- **Connection Pool**: HikariCP configured with `maximum-pool-size: 5` in production (`application-prod.yml`), `minimum-idle: 2`, `connection-timeout: 30000ms`.
- **15 Missing FK Indexes**: Unindexed foreign keys identified on frequently joined columns (`task_id`, `submission_id`, `checkpoint_id`, `user_id`).
- **N+1 Query Hazards**: Identified in `TaskService.java` (fetching comments/tags) and `SubmissionJudgingService.java` (fetching scores/rubrics).
- **19 Critical Outbound Calls in Transactions**: Long-running HTTP calls to Groq LLM (15–45s) executed inside `@Transactional` methods, holding database connections open.

---

# 7. REAL-TIME / CROSS-USER UPDATES
*(Full documentation: [`docs/system_context/07_realtime_cross_user_updates.md`](./system_context/07_realtime_cross_user_updates.md))*

- **Mechanism**: Server-Sent Events (SSE) via `backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java`.
- **Channels**: Single SSE stream per room (`/api/v1/rooms/{roomId}/events`) plus user notification stream (`/api/v1/notifications/stream`).
- **Backpressure & Reconnect**: In-memory ring buffer of 200 events per room. Missed events are replayed using `Last-Event-ID`.
- **Cluster Failure**: Because ring buffers and emitters reside in JVM heap, multiple server instances will cause missing cross-instance events.

---

# 8. BACKGROUND WORK & EXTERNAL DEPENDENCIES
*(Full documentation: [`docs/system_context/08_background_work_and_dependencies.md`](./system_context/08_background_work_and_dependencies.md))*

- **13 Scheduled Jobs**: Managed via `@EnableScheduling` across 8 worker classes (`MailWorker`, `PitchEvaluationWorker`, `CheckpointReminderWorker`, `RoomArchiveWorker`, etc.).
- **Distributed Locking**: Backed by PostgreSQL advisory locks via `DbAdvisoryLockService.java`.
- **Transactional Outbox**: Emails written to `mail_outbox` table and processed asynchronously every 15 seconds by `MailWorker.java`.

---

# 9. FILE & MEDIA HANDLING
*(Full documentation: [`docs/system_context/09_file_and_media_handling.md`](./system_context/09_file_and_media_handling.md))*

- **Upload Endpoint**: `/api/v1/users/me/avatar` and pitch kit audio recordings.
- **Storage Target**: Local filesystem directory (`/app/uploads`).
- **Render Risk**: On Render Web Services, local disk storage is ephemeral. Any restart or redeployment irreversibly deletes user uploads unless a persistent disk is attached.

---

# 10. FRONTEND DATA-FETCHING BEHAVIOUR
*(Full documentation: [`docs/system_context/10_frontend_data_fetching.md`](./system_context/10_frontend_data_fetching.md))*

- **Networking**: Custom fetch wrappers (`apiFetch.ts` and `apiClient.ts`) with automated JSON parsing and error wrapping.
- **Cache Policy**: TanStack Query defaults: `staleTime: 5 * 60 * 1000` (5 minutes), `retry: 1`.
- **Duplicate SSE Bug**: Pitch Kit page instantiates both `useRoomLive` and `useRoomEvents`, consuming 2 SSE connections per tab. Combined with notifications, this immediately reaches the 3-connection cap (`MAX_STREAMS_PER_USER`).

---

# 11. CONFIGURATION & DEPLOYMENT (RENDER FOCUS)
*(Full documentation: [`docs/system_context/11_configuration_and_deployment.md`](./system_context/11_configuration_and_deployment.md))*

- **44 Environment Variables**: Documented with default values and failure consequences.
- **Containerization**: Multi-stage `Dockerfile` running Eclipse Temurin 25 JRE.
- **Startup Validation**: `ProductionStartupValidator.java` enforces production secrets before accepting traffic.
- **Port Binding**: Binds to `0.0.0.0:${PORT:8080}` as required by Render.

---

# 12. OBSERVABILITY & ERROR HANDLING
*(Full documentation: [`docs/system_context/12_observability_and_error_handling.md`](./system_context/12_observability_and_error_handling.md))*

- **Logging**: SLF4J / Logback with MDC request tracing (`requestId`, `userId`).
- **Client Error Logging**: Frontend posts uncaught errors to `/api/v1/client-errors`, stored in `client_errors` table.
- **135 Swallowed Exceptions**: Identified empty catch blocks (`catch (Exception ignored) {}`) suppressing JSON parsing and token parsing failures.

---

# 13. SECURITY OBSERVATIONS
*(Full documentation: [`docs/system_context/13_security_observations.md`](./system_context/13_security_observations.md))*

- **SQL Injection**: Secure. All database interactions use Spring Data JPA parameterized queries.
- **XSS Sanitization**: Secure. Markdown rendering utilizes `rehype-sanitize` with strict schema.
- **SSRF Protection**: Secure. Outbound web scrapes pass through `SsrfGuard.java` blocking loopback, link-local, and RFC 1918 private subnets.
- **Secret Encryption**: Sensitive room tokens and integration secrets encrypted with AES-256-GCM via `SecretCipher.java`.

---

# 14. TESTS & CODE QUALITY
*(Full documentation: [`docs/system_context/14_tests_and_code_quality.md`](./system_context/14_tests_and_code_quality.md))*

- **Backend Tests**: 28 test classes located in `backend/src/test/java/`.
- **11 Excluded Test Suites**: `pom.xml` explicitly excludes 11 test suites from compiler execution.
- **Frontend Tests**: Vitest unit tests and Playwright end-to-end suites configured in `frontend/e2e/`.

---

# 15. PRELIMINARY SCALABILITY & RELIABILITY RISK LIST
*(Full documentation: [`docs/system_context/15_scalability_and_reliability_risks.md`](./system_context/15_scalability_and_reliability_risks.md))*

> **[!] AUDITOR OPINION**: The following items represent architectural and operational bottlenecks under 2,000–4,000 registered users (~200–500 concurrent peak users):

1. **CRITICAL: HikariCP Exhaustion via Outbound AI in `@Transactional`** (`AiService.java`, `PitchKitService.java`): 5 concurrent AI queries completely exhaust the 5-connection pool.
2. **CRITICAL: Multi-Instance Cluster Breakdown** (`RoomEventHub.java`, `PresenceService.java`): In-memory SSE buffers and presence maps break if scaled horizontally.
3. **HIGH: Data Loss from Ephemeral Upload Disk** (`StorageService.java`): Uploaded files in `/app/uploads` are deleted upon container restart on Render.
4. **HIGH: Client SSE Connection Storm & Eviction** (`useRoomLive.ts`, `useRoomEvents.ts`, `RoomEventHub.java`): Duplicate streams per user trigger `429 Too Many Requests`.
5. **HIGH: Memory Pressure & OOM Kills on Render Free Tier** (`pom.xml`, `Dockerfile`): Spring Boot 4 + Java 25 exceeds 512 MB memory limit under load.
6. **MEDIUM: Database Connection Saturation during Peak Polling** (`backend/src/main/resources/application-prod.yml`): 5 max connections fail under high concurrent reads.
7. **MEDIUM: Unindexed Foreign Keys Causing Sequential Table Scans** (15 missing indexes).
8. **MEDIUM: Unbounded Collection Queries in Room Dashboard** (`TaskRepository.findByRoomId` returns unpaginated tasks).
9. **MEDIUM: Gmail SMTP Outbox Rate Limiting** (`MailWorker.java` hits 400 email/day limit).
10. **MEDIUM: Blind Exception Suppression** (135 empty catch blocks mask production bugs).

---

# 16. OPEN QUESTIONS FOR THE OWNER
*(Full documentation: [`docs/system_context/16_open_questions.md`](./system_context/16_open_questions.md))*

1. **Render Web Service Plan & Multi-Instance Target**: Is Brackit running on the Render Free Tier (512 MB, sleep after 15 min), Starter ($7/mo, always on), or a higher tier? Is horizontal scaling (2+ instances) planned?
2. **PostgreSQL Hosting & Connection Limits**: What managed PostgreSQL tier is provisioned on Render? What is the exact server-side `max_connections` ceiling?
3. **External LLM Provider & Production Quotas**: Is Groq the sole production LLM provider, and what is your current rate limit tier (RPM / TPM)?
4. **Speech-to-Text Whisper Concurrency**: What peak concurrent audio transcription throughput is expected during final pitch rehearsals, and what is the Whisper API's rate limit?
5. **Persistent Disk vs Cloud Object Storage Migration**: Has a Render Persistent Disk been mounted to `/app/uploads`, or will uploads migrate to an S3-compatible service (Cloudflare R2 / AWS S3)?
6. **Transactional Email Provider**: Is Gmail SMTP intended for production delivery, or will an enterprise transactional provider (SendGrid, Postmark, AWS SES, Resend) be configured?
7. **Reason for Excluded Backend Test Suites**: Why were 11 test suites (`ai`, `tasks`, `users`, `overview`, `checkpoints`, `invites`, `templates`) excluded from compilation in `backend/pom.xml`?
8. **Deprecation Timeline for Duplicate Components**: Can legacy duplicate components (`RoomSseBroadcaster.java`, `PitchController.java`, `useRoomEvents.ts`) be safely deprecated and removed?
9. **Expected Peak Concurrency Profile**: What is the anticipated peak concurrent user count during the final 3 hours before hackathon submission deadlines?
10. **Observed Production Failure Logs**: What specific error patterns or warnings have been observed in Render production dashboard logs (e.g. OOM kills, Hikari connection timeouts, SSE disconnects)?

---

# Coverage Checklist

The following codebase areas and files were thoroughly inspected and analyzed during this audit:

- [x] **Backend Entry Point & Configuration**:
  - `backend/src/main/java/com/hackathonos/backend/BackendApplication.java`
  - `backend/src/main/resources/application.yml`
  - `backend/src/main/resources/application-prod.yml`
  - `backend/src/main/resources/application-docker.yml`
  - `backend/pom.xml`
- [x] **Backend Security & Authentication**:
  - `backend/src/main/java/com/hackathonos/backend/config/SecurityConfig.java`
  - `backend/src/main/java/com/hackathonos/backend/auth/**` (OAuth2 handlers, session management, user principal)
  - `backend/src/main/java/com/hackathonos/backend/mcp/McpTokenAuthFilter.java`
  - `backend/src/main/java/com/hackathonos/backend/oauth/**` (RFC 6749 OAuth server endpoints)
- [x] **Backend API Routes & Controllers (67 Controllers / 348 Endpoints)**:
  - `backend/src/main/java/com/hackathonos/backend/room/**`
  - `backend/src/main/java/com/hackathonos/backend/task/**`
  - `backend/src/main/java/com/hackathonos/backend/pitch/**` and `pitchkit/**`
  - `backend/src/main/java/com/hackathonos/backend/submission/**` and `judging/**`
  - `backend/src/main/java/com/hackathonos/backend/checkpoint/**`
  - `backend/src/main/java/com/hackathonos/backend/ai/**`
  - `backend/src/main/java/com/hackathonos/backend/events/**`
  - `backend/src/main/java/com/hackathonos/backend/mail/**`
  - `backend/src/main/java/com/hackathonos/backend/user/**`
  - `backend/src/main/java/com/hackathonos/backend/mcp/**`
- [x] **Backend Service & Business Logic Layer**:
  - All `@Service` classes across all 24 domain packages.
  - Inspected for transactional boundaries, external blocking HTTP calls, and concurrency locks.
- [x] **Data Layer & Migrations (116 Tables)**:
  - All 44 Flyway migration scripts in `backend/src/main/resources/db/migration/` (`V1__baseline.sql` through `V43__*.sql`).
  - All JPA `@Entity` classes and Spring Data `@Repository` interfaces.
- [x] **Real-Time & Background Infrastructure**:
  - `backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java`
  - `backend/src/main/java/com/hackathonos/backend/events/PresenceService.java`
  - `backend/src/main/java/com/hackathonos/backend/shared/lock/DbAdvisoryLockService.java`
  - All 13 `@Scheduled` methods across worker classes.
- [x] **Frontend Architecture & Data Fetching**:
  - `frontend/package.json`
  - `frontend/vite.config.ts`
  - `frontend/vercel.json`
  - `frontend/src/api/**` (`apiClient.ts`, `apiFetch.ts`, `useRoomLive.ts`, `useRoomEvents.ts`)
  - `frontend/src/store/**` (Zustand state stores)
  - `frontend/src/pages/**` (Page routing and component tree)
- [x] **Deployment, Build & Environment Configuration**:
  - `Dockerfile`
  - `render.yaml`
  - `.env.example`
  - `backend/src/main/java/com/hackathonos/backend/config/ProductionStartupValidator.java`
- [x] **Quality, Tests & Documentation**:
  - `backend/src/test/**`
  - `frontend/e2e/**`
  - `docs/**` (`tech_stack.md`, `problem.md`, `ideation.md`, `openapi.json`)

**Skipped Files / Folders**:
- `node_modules/` and `frontend/dist/`: Third-party dependencies and build output artifacts.
- `backend/target/`: Compiled bytecode and build output.
- `.git/`: Version control metadata.
- Media assets (`*.png`, `*.jpg`, `*.svg`, `*.ico`, `*.mp3`): Binary static media files.
