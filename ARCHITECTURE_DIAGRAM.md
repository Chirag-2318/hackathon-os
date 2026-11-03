# Architecture and System Design Specification: Hackathon OS [brackit]

> **Document Status:** Authoritative, reverse-engineered architecture blueprint.  
> **Source Evidence Base:** Derived strictly from full codebase inspection of Spring Boot 4.1 / Java 25 backend monolith, React 19 / TypeScript frontend SPA, Flyway migrations `V1`–`V48`, Node.js Model Context Protocol (MCP) server, and Playwright / Loadtest suites.  
> **Interactive Diagrams:** Generated using Archify and stored as standalone HTML artifacts in `docs/architecture/`.

---

# 1. Executive Summary

### System Purpose & Target Audience
**Hackathon OS** (branded as **[brackit]**) is an opinionated execution operating system and real-time team command room designed for collegiate, professional, and indie hackathon participants (e.g., Smart India Hackathon, MLH, Devpost, weekend AI sprints). It transforms the chaotic 24–48 hour sprint into a sequenced, disciplined delivery pipeline that guides teams from problem statement intake to a verified, rehearsed pitch before the countdown timer hits zero.

### Core Tech Stack
- **Frontend:** React 19, TypeScript, Vite 8, React Router v7, TanStack Query v5, Zustand, Tailwind CSS v4, Radix UI, CodeMirror 6, FullCalendar, Mermaid.js, Web Audio API, Vite PWA.
- **Backend:** Spring Boot 4.1 (Java 25), Spring Security 6 (OAuth2 client + RFC 6749 Auth Server), Spring Session JDBC, Flyway Database Migrations, Jackson, Apache PDFBox, Apache POI, JSoup, Caffeine Cache.
- **AI & Speech Gateway:** Groq API Gateway (LLaMA 3.3 70B Versatile, LLaMA 3.1 8B Instant) and Groq Whisper Large v3 Speech-to-Text, with Bring-Your-Own-Key (BYOK) per-user resolution and AES-256-GCM token storage.
- **Agent Interoperability:** Model Context Protocol (MCP) Server (Node.js / TypeScript, Hono transport, `@modelcontextprotocol/sdk`).
- **Data & Storage:** Managed PostgreSQL 17 (relational schema, session persistence, event streaming ledger, advisory locking), AWS S3 / Cloudflare R2 object storage for multimodal media.
- **Hosting & Edge:** Vercel (Edge CDN, static hosting, reverse proxy rewrites), Render (Containerized Java 25 backend, Managed PostgreSQL).

### End-to-End Operation (10-Line Overview)
1. Visitors land on the Vercel edge and authenticate via GitHub or Google OAuth 2.0; sessions are stored in PostgreSQL (`SPRING_SESSION`).
2. Leaders create rooms choosing an event playbook (SIH, Devpost, MLH, Corporate) and configure team duration and scheduled milestones.
3. Multimodal Brief Intake parses rulebooks, PDFs, and screenshots via vision OCR and extracts rubric weights and constraints.
4. The Leader must explicitly confirm each extracted rule and rubric toggle before subsequent room phases are unlocked.
5. Teammates enter Silent Solo Ideation, drafting cards without anchoring bias until cards are revealed and scored via AI stress-testing.
6. The AI Planning Gateway dynamically injects room context into a 4-step generator yielding a 9-document Markdown vault.
7. Autonomous agents connect via the Brackit MCP server and OAuth 2.0 to query room state and submit validated planning documents.
8. Execution transitions to a phase-driven Kanban board enforcing task dependencies, swimlanes, and leader completion approvals.
9. Pitch Kit provides a teleprompter with live Web Audio API speech telemetry (WPM) and an AI Judge's Chair Q&A defense simulator.
10. Submission Launch Pad conducts automated HTTP health checks on GitHub repos and demo URLs before the leader applies the final sign-off stamp.

---

# 2. Component Inventory

| Component ID | Component Name | Layer | Responsibility | Tech Stack | Key Source Files | Owner / Boundary |
|---|---|---|---|---|---|---|
| **FE-01** | App Router | Frontend | Code-splitting, protected route guarding, layout selection | React Router v7 | `frontend/src/app/routes/router.tsx`, `frontend/src/app/ProtectedRoute.tsx` | Client App Shell |
| **FE-02** | Responsive Shell | Frontend | Room layout frame, timer display, checkpoint HUD, navigation takeover | React 19, Framer Motion | `frontend/src/app/layout/responsive-shell.tsx`, `frontend/src/app/layout/room-nav.tsx` | Client Layout |
| **FE-03** | Query Engine | Frontend | Remote state caching, 5m stale window, exponential retry with jitter | TanStack Query v5 | `frontend/src/App.tsx`, `frontend/src/design/queries.ts` | Client Data Engine |
| **FE-04** | Live Sync Client | Frontend | SSE event reception, automatic reconnect with jitter, conflict detection | EventSource API, React | `frontend/src/design/live.tsx`, `frontend/src/api/useNotificationStream.ts` | Realtime Client |
| **FE-05** | API Client Wrapper | Frontend | HTTP client with automatic CSRF token injection and Idempotency-Key headers | Fetch API, TypeScript | `frontend/src/design/api.ts`, `frontend/src/lib/apiClient.ts` | Network Adapter |
| **FE-06** | Brief Workspace | Frontend | Multimodal problem intake, OCR preview, leader rubric confirmation toggles | React 19, Radix UI | `frontend/src/features/brief/brief-page.tsx`, `frontend/src/features/brief/components/` | Room Brief Module |
| **FE-07** | Ideation Workspace | Frontend | Silent solo card drafting, card reveal animation, voting, AI stress test | React 19, Lucide | `frontend/src/features/ideate/ideate-page.tsx` | Room Ideate Module |
| **FE-08** | Plan Workspace | Frontend | 4-step guided plan wizard, PRD generation, Markdown document viewer | React 19, CodeMirror | `frontend/src/features/plan/plan-page.tsx`, `frontend/src/features/docs/docs-page.tsx` | Room Plan Module |
| **FE-09** | Kanban Board | Frontend | Phase-driven Kanban board, task dependency lines, swimlanes, drag-and-drop | @dnd-kit/core, Lucide | `frontend/src/features/board/board-page.tsx`, `frontend/src/features/board/components/` | Room Execution Module |
| **FE-10** | Pitch Kit & Audio | Frontend | Slide teleprompter, Web Audio API mic waveform, WPM telemetry, Q&A trainer | Web Audio API, Recharts | `frontend/src/features/pitch-kit/pitch-kit-page.tsx`, `frontend/src/features/deck/` | Room Pitch Module |
| **FE-11** | Submission Pad | Frontend | Flight countdown checklist, link health statuses, red sign-off stamp | React 19, Canvas Confetti | `frontend/src/features/submission/submission-page.tsx` | Room Submission Module |
| **FE-12** | PWA Service Worker | Frontend | Offline asset caching, background update detection, offline banner | vite-plugin-pwa, Workbox | `frontend/src/components/OfflineBanner.tsx`, `frontend/vite.config.ts` | Browser Worker |
| **API-01** | Request ID Filter | Backend | Request correlation tracing, MDC injection, latency threshold logging | Java Servlet Filter | `backend/src/main/java/com/hackathonos/backend/common/http/RequestIdFilter.java` | HTTP Ingress |
| **API-02** | Security Filter Chain | Backend | Dual-chain security: stateful session web security + stateless Bearer MCP | Spring Security 6 | `backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java` | Security Ingress |
| **API-03** | IP Resolver | Backend | Reverse proxy header parsing (`x-vercel-forwarded-for`), IP literal validation | Java Net InetAddress | `backend/src/main/java/com/hackathonos/backend/common/security/ClientIpResolver.java` | Security Ingress |
| **API-04** | Rate Limiting Interceptor | Backend | Tunable IP-based buckets (120/min unauth, 600/min auth), HTTP 429 Retry-After | Spring HandlerInterceptor | `backend/src/main/java/com/hackathonos/backend/common/security/RateLimitInterceptor.java` | Security Ingress |
| **API-05** | Idempotency Filter | Backend | 24-hour response caching for create requests via `Idempotency-Key` | Spring Filter, JDBC | `backend/src/main/java/com/hackathonos/backend/common/idempotency/IdempotencyFilter.java` | Mutation Guard |
| **API-06** | Session Manager | Backend | JDBC-backed HTTP session management (`SPRING_SESSION`), host-only cookies | Spring Session JDBC | `backend/src/main/java/com/hackathonos/backend/common/config/SessionConfig.java` | Identity Store |
| **API-07** | Room Event Hub | Backend | Virtual-threaded SSE dispatch, in-memory ring buffers (200), replay by seq | Java Virtual Threads, SSE | `backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java` | Realtime Hub |
| **API-08** | Room Mutation Interceptor| Backend | Intercepts room-scoped mutations to automatically trigger SSE broadcasts | Spring HandlerInterceptor | `backend/src/main/java/com/hackathonos/backend/events/RoomChangeInterceptor.java` | Realtime Engine |
| **API-09** | Room & Brief Service | Backend | Room lifecycle states, multimodal vision OCR, rubric extraction & confirmation | Spring Service, JSoup | `backend/src/main/java/com/hackathonos/backend/rooms/RoomService.java`, `BriefService.java`| Domain Core |
| **API-10** | Planning Prompt Service | Backend | Assembles room context into 4-step generation prompts, verifies headings | Spring Service | `backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java` | Domain Core |
| **API-11** | Task & Board Service | Backend | Phase-driven Kanban task transitions, dependency validation, approvals | Spring Service, JPA | `backend/src/main/java/com/hackathonos/backend/tasks/TaskService.java` | Domain Core |
| **API-12** | Pitch & Rehearsal Service| Backend | Audio chunk ingestion, Whisper STT integration, WPM pacing analysis | Spring Service, RestClient| `backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java` | Domain Core |
| **API-13** | Submission Check Service | Backend | Automated link reachability checks (GitHub, live demo, video) with advisory lock | Spring Service, RestClient| `backend/src/main/java/com/hackathonos/backend/submission/SubmissionLinkCheckJob.java` | Background Worker |
| **API-14** | Scheduled Cleanup Job | Backend | Prunes idempotency records (>24h), expired OAuth codes, and stale events | Spring Scheduled Job | `backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java` | Background Worker |
| **API-15** | Advisory Lock Service | Backend | Distributed Postgres locks (`pg_try_advisory_lock`) preventing job overlap | Spring JDBC Client | `backend/src/main/java/com/hackathonos/backend/common/lock/DbAdvisoryLockService.java` | Distributed Sync |
| **API-16** | File Storage Service | Backend | Multi-provider storage abstraction (Cloudflare R2, AWS S3, Local Disk) | AWS SDK v2 (S3) | `backend/src/main/java/com/hackathonos/backend/common/storage/S3CompatibleFileStorage.java`| Storage Adapter |
| **API-17** | Mail Delivery Worker | Backend | Transactional outbox pattern for transactional email delivery | Spring Mail, JavaMail | `backend/src/main/java/com/hackathonos/backend/email/MailWorker.java` | Background Worker |
| **AI-01** | AI Gateway Service | AI Layer | Unified gateway, per-user BYOK key resolution, temperature steering | Spring Service | `backend/src/main/java/com/hackathonos/backend/ai/AiService.java` | AI Core |
| **AI-02** | AI Circuit Breaker | AI Layer | 5-minute rolling window tracking provider failure rate, trips at 50% | Java Concurrency | `backend/src/main/java/com/hackathonos/backend/ai/AiCircuitBreaker.java` | AI Resilience |
| **AI-03** | AI Concurrency Bulkhead | AI Layer | Concurrency semaphore (6 LLM, 3 STT, 2 parse) with 5000ms acquire timeout | Java Semaphore | `backend/src/main/java/com/hackathonos/backend/common/concurrency/ExternalCallBulkhead.java`| AI Resilience |
| **AI-04** | AI Rate Limiter | AI Layer | Token bucket rate limiting (10 requests/minute per user) | Caffeine Cache | `backend/src/main/java/com/hackathonos/backend/ai/AiRateLimiter.java` | AI Resilience |
| **AI-05** | JSON Repair & Deserializer| AI Layer | One-shot automated markdown strip and repair for structured LLM schemas | Jackson ObjectMapper | `backend/src/main/java/com/hackathonos/backend/ai/AiService.java` | AI Parsing |
| **AI-06** | User AI Key Service | AI Layer | AES-256-GCM encrypted persistence of Bring-Your-Own-Key credentials | Java Cryptography (JCE) | `backend/src/main/java/com/hackathonos/backend/ai/UserAiKeyService.java` | AI Security |
| **AGT-01** | Model Context Protocol | Agent Layer | Node.js MCP server exposing 4 hackathon tools and 5 planning prompts | @modelcontextprotocol/sdk | `mcp-server/src/server.ts`, `mcp-server/src/tools.ts`, `mcp-server/src/prompts.ts` | Agent Gateway |
| **AGT-02** | OAuth 2.0 Auth Server | Agent Layer | RFC 6749, RFC 7636 (PKCE), and RFC 7591 dynamic client registration | Spring Security | `backend/src/main/java/com/hackathonos/backend/mcp/oauth/OAuthServerService.java` | Agent Security |
| **AGT-03** | MCP Backend Client | Agent Layer | Node.js HTTP bridge to Spring Boot with 60-second Render cold-start handling | Node.js Native Fetch | `mcp-server/src/backend-client.ts` | Agent Network |
| **AGT-04** | Plan Document Validator | Agent Layer | Enforces strict heading hierarchies and length bounds on submitted bundles | Java Markdown Parser | `backend/src/main/java/com/hackathonos/backend/plan/PlanService.java` | Agent Validation |
| **DB-01** | PostgreSQL 17 Engine | Data Layer | Primary relational store, managed database on Render | PostgreSQL 17 | `backend/src/main/resources/application.yml` | Relational Core |
| **DB-02** | Flyway Migration Engine | Data Layer | Version-controlled DDL migrations tracking V1 through V48 schemas | Flyway PostgreSQL | `backend/src/main/resources/db/migration/` | Schema Evolution |
| **DB-03** | Spring Session Store | Data Layer | Distributed HTTP session persistence in `SPRING_SESSION` tables | Spring Session JDBC | `backend/src/main/resources/db/migration/V44__spring_session_and_oauth_link_states.sql`| Session Store |
| **DB-04** | Room Events Ledger | Data Layer | Monotonic BIGSERIAL event log powering SSE subscriber replay | PostgreSQL Table | `backend/src/main/resources/db/migration/V15__live_sync_optimistic_locking_and_performance.sql`| Event Store |
| **DB-05** | Idempotency Store | Data Layer | Caches POST request responses for 24h against unique idempotency keys | PostgreSQL Table | `backend/src/main/resources/db/migration/V48__ensure_idempotency_keys_and_cleanup.sql`| Idempotency Store |
| **DB-06** | Caffeine L1 Cache | Data Layer | High-throughput in-memory caching for IP rates, presence, and lock states | Ben Manes Caffeine | `backend/src/main/java/com/hackathonos/backend/common/security/RateLimiter.java` | In-Memory Cache |
| **INF-01** | Vercel Edge CDN | Infra | Static Single Page Application hosting, HTTPS termination, Edge rewrites | Vercel Platform | `frontend/vite.config.ts`, `deploy/` | Edge Ingress |
| **INF-02** | Render Cloud Container | Infra | Linux container hosting Spring Boot 4.1 monolith on Java 25 | Render Web Service | `Dockerfile`, `render-env.template` | Application Compute |
| **INF-03** | Cloudflare R2 / AWS S3 | Infra | Zero-egress object storage for slide decks, demo videos, and OCR captures | S3 API | `backend/src/main/java/com/hackathonos/backend/common/storage/` | Blob Storage |
| **INF-04** | GitHub Actions Pipeline | Infra | Continuous integration running Maven tests and frontend static scans | GitHub Actions | `.github/workflows/ci.yml` | CI/CD |
| **INF-05** | Micrometer Prometheus | Infra | Application performance metrics endpoint (`/actuator/prometheus`) | Micrometer Registry | `backend/src/main/resources/application-prod.yml` | Observability |
| **EXT-01** | GitHub OAuth & API | External | User authentication and team repository commit/branch tracking | GitHub REST API | `backend/src/main/java/com/hackathonos/backend/github/GitHubService.java` | External Identity |
| **EXT-02** | Google OAuth 2.0 | External | User social sign-in identity provider | Google OAuth 2.0 | `backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java` | External Identity |
| **EXT-03** | Groq Inference Engine | External | High-speed LLM inference (LLaMA 3.3 70B Versatile, LLaMA 3.1 8B Instant) | Groq Cloud API | `backend/src/main/java/com/hackathonos/backend/ai/GroqClient.java` | External AI |
| **EXT-04** | Groq Whisper STT | External | Speech-to-text audio transcription for pitch kit rehearsals | Groq Cloud API | `backend/src/main/java/com/hackathonos/backend/ai/AiService.java` | External Audio |
| **EXT-05** | Gmail SMTP Gateway | External | Transactional notification emails and room invite dispatch | SMTP over TLS | `backend/src/main/java/com/hackathonos/backend/email/MailWorker.java` | External Messaging |

---

# 3. Connections (Edge List)

*Note: The **PRIMARY** end-to-end user runtime execution path is designated with `[PRIMARY]`.*

| From ID | To ID | Protocol / Mechanism | Data Passed | Sync / Async | Auth Used | Source Reference |
|---|---|---|---|---|---|---|
| **FE-05** | **INF-01** | HTTPS / TLS 1.3 `[PRIMARY]` | REST requests, cookies, JSON bodies | Sync | `JSESSIONID`, `XSRF-TOKEN` | `frontend/src/design/api.ts#L82-L130` |
| **INF-01** | **API-01** | HTTPS Reverse Proxy `[PRIMARY]` | Forwarded HTTP request + proxy headers | Sync | `x-vercel-forwarded-for` | `frontend/vite.config.ts`, `deploy/Caddyfile` |
| **API-01** | **API-03** | Internal Servlet Pipeline `[PRIMARY]` | Servlet request wrapper | Sync | None | `backend/.../RequestIdFilter.java#L29-L43` |
| **API-03** | **API-04** | Internal Filter Chain `[PRIMARY]` | Resolved client IP literal | Sync | None | `backend/.../ClientIpResolver.java#L22-L55` |
| **API-04** | **API-05** | Internal Interceptor Chain `[PRIMARY]` | `Idempotency-Key` header & HTTP method | Sync | None | `backend/.../RateLimitInterceptor.java#L80-L140` |
| **API-05** | **API-02** | Internal Filter Chain `[PRIMARY]` | Cached response or next filter execution | Sync | None | `backend/.../IdempotencyFilter.java#L38-L65` |
| **API-02** | **API-06** | Spring Security Bridge `[PRIMARY]` | Cookie lookup for session deserialization | Sync | `JSESSIONID` | `backend/.../SecurityConfig.java#L90-L105` |
| **API-06** | **DB-03** | JDBC SQL Query `[PRIMARY]` | `SELECT ... FROM SPRING_SESSION` | Sync | DB Credentials | `backend/.../SessionConfig.java#L45-L51` |
| **API-02** | **API-09** | Spring MVC Dispatcher `[PRIMARY]` | Deserialized DTO, injected `User` model | Sync | SecurityContext | `backend/.../WebMvcConfig.java#L48-L68` |
| **API-09** | **AI-01** | Java Method Call `[PRIMARY]` | Generation prompt, feature tag, room context | Sync | In-Memory | `backend/.../BriefService.java#L110-L150` |
| **AI-01** | **AI-06** | Java Method Call `[PRIMARY]` | Authenticated user ID | Sync | In-Memory | `backend/.../AiService.java#L180-L210` |
| **AI-06** | **DB-01** | JPA SQL Query | `SELECT ... FROM user_ai_keys` | Sync | DB Credentials | `backend/.../UserAiKeyService.java#L45-L70` |
| **AI-01** | **AI-03** | Semaphore Acquire `[PRIMARY]` | Bulkhead concurrency slot | Sync | In-Memory | `backend/.../AiService.java#L220-L245` |
| **AI-01** | **EXT-03** | HTTPS REST / JSON `[PRIMARY]` | OpenAI-compatible chat completion payload | Sync | Bearer Token (Groq/BYOK) | `backend/.../OpenAiCompatibleClient.java#L65-L115` |
| **AI-01** | **AI-05** | Java Method Call `[PRIMARY]` | Raw LLM response string | Sync | In-Memory | `backend/.../AiService.java#L310-L345` |
| **API-09** | **DB-01** | JPA / Hibernate JDBC `[PRIMARY]` | SQL INSERT/UPDATE for room/brief entities | Sync | DB Credentials | `backend/.../BriefService.java#L160-L185` |
| **API-09** | **API-08** | Spring WebMvc postHandle `[PRIMARY]` | HTTP status code and request URI | Sync | In-Memory | `backend/.../RoomChangeInterceptor.java#L45-L70` |
| **API-08** | **API-07** | Java Method Call `[PRIMARY]` | Room ID, topic string, actor ID | Async (Virtual Th.) | In-Memory | `backend/.../RoomEventHub.java#L150-L190` |
| **API-07** | **DB-04** | JDBC SQL Insert `[PRIMARY]` | `INSERT INTO room_events (seq, topic, ...)` | Sync | DB Credentials | `backend/.../RoomEventHub.java#L205-L235` |
| **API-07** | **FE-04** | HTTP Server-Sent Events `[PRIMARY]` | `text/event-stream` SSE chunk | Async (Streaming) | Active SSE Session | `backend/.../EventStreamController.java#L38-L57` |
| **FE-04** | **FE-03** | React Context Callback `[PRIMARY]` | Query cache key invalidation trigger | Async (Debounced) | In-Memory | `frontend/src/design/live.tsx#L140-L185` |
| **FE-03** | **FE-02** | React State Dispatch `[PRIMARY]` | Re-rendered UI components | Sync | In-Memory | `frontend/src/app/layout/responsive-shell.tsx` |
| **FE-01** | **EXT-01** | Browser Redirect | OAuth 2.0 authorization code redirect | Sync | Client ID / Secret | `backend/.../SecurityConfig.java#L208-L235` |
| **FE-01** | **EXT-02** | Browser Redirect | Google OAuth 2.0 code redirect | Sync | Client ID / Secret | `backend/.../SecurityConfig.java#L208-L235` |
| **AGT-01** | **AGT-02** | HTTPS REST | OAuth 2.0 PKCE authorization & token grant | Sync | Client Secret / Code | `mcp-server/src/server.ts`, `backend/.../OAuthServerController.java` |
| **AGT-01** | **AGT-03** | Internal Function Call | MCP tool execution parameters | Sync | In-Memory | `mcp-server/src/tools.ts#L95-L245` |
| **AGT-03** | **API-02** | HTTPS REST | `/api/v1/mcp/**` API request | Sync | Bearer Token | `mcp-server/src/backend-client.ts#L45-L90` |
| **API-12** | **EXT-04** | HTTPS Multipart / REST | Audio binary stream to Whisper STT | Sync | Bearer Token (Groq/BYOK) | `backend/.../AiService.java#L360-L395` |
| **API-13** | **API-15** | SQL Function Call | `pg_try_advisory_lock(1011)` | Sync | DB Credentials | `backend/.../SubmissionLinkCheckJob.java#L40-L60` |
| **API-14** | **API-15** | SQL Function Call | `pg_try_advisory_lock(1005)` / `(1006)` | Sync | DB Credentials | `backend/.../CleanupJob.java#L50-L75` |
| **API-16** | **INF-03** | AWS SDK S3 Protocol | PutObject / GetObject binary media stream | Sync | S3 Access & Secret Keys | `backend/.../S3CompatibleFileStorage.java#L60-L110` |
| **API-17** | **EXT-05** | SMTP over TLS (:587) | MIME email delivery from `email_outbox` | Async | SMTP Auth Credentials | `backend/.../MailWorker.java#L70-L115` |
| **INF-05** | **API-02** | HTTP GET Scrape | Scrape `/actuator/prometheus` | Sync | `Bearer METRICS_TOKEN` | `backend/.../SecurityConfig.java#L159-L167` |

---

# 4. Trust Boundaries and Zones

```
+----------------------------------------------------------------------------------------------------+
| 1. CLIENT ZONE (Untrusted)                                                                         |
|    Components: FE-01, FE-02, FE-03, FE-04, FE-05, FE-06, FE-07, FE-08, FE-09, FE-10, FE-11, FE-12   |
|    Boundary Rule: Zero tokens or secrets stored in localStorage/sessionStorage. All calls via      |
|    host-only cookies. Memory state cleared on tab close.                                          |
+----------------------------------------------------------------------------------------------------+
                                      |  HTTPS + SameSite=Lax Cookie
                                      v
+----------------------------------------------------------------------------------------------------+
| 2. EDGE & REVERSE PROXY ZONE (Vercel Platform)                                                     |
|    Components: INF-01                                                                              |
|    Boundary Rule: Terminates public TLS, strips forged internal headers, sets                      |
|    x-vercel-forwarded-for, and forwards state-mutating requests to Render origin.                 |
+----------------------------------------------------------------------------------------------------+
                                      |  HTTPS Reverse Proxy + x-proxy-secret
                                      v
+----------------------------------------------------------------------------------------------------+
| 3. APPLICATION RUNTIME NETWORK (Render Cloud Container)                                            |
|    Components: API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10,   |
|                API-11, API-12, API-13, API-14, API-15, API-16, API-17, AI-01, AI-02, AI-03, AI-04, |
|                AI-05, AI-06, AGT-02, AGT-04, DB-06, INF-02, INF-05                                 |
|    Boundary Rule: Enforces rate limiting, CSRF verification, Spring Security RBAC, advisory lock  |
|    isolation, and AES-256 decryption of credentials. Never logs decrypted keys or session tokens. |
+----------------------------------------------------------------------------------------------------+
                                      |  JDBC (TLS) & S3 Protocol
                                      v
+----------------------------------------------------------------------------------------------------+
| 4. DATA PERSISTENCE ZONE (Isolated Data VPC)                                                        |
|    Components: DB-01, DB-02, DB-03, DB-04, DB-05, INF-03                                          |
|    Boundary Rule: Accessible strictly via backend credentials over encrypted transport. Restrict   |
|    max pool connections to 10; enforce UTC timezone alignment on all SQL transactions.            |
+----------------------------------------------------------------------------------------------------+
                                      |  Outbound TLS REST / OAuth
                                      v
+----------------------------------------------------------------------------------------------------+
| 5. EXTERNAL PROVIDERS & SERVICES ZONE (Third-Party APIs)                                            |
|    Components: EXT-01 (GitHub), EXT-02 (Google), EXT-03 (Groq LLM), EXT-04 (Whisper), EXT-05 (SMTP)|
|    Boundary Rule: Bound by strict bulkheads (6 LLM, 3 STT) and 45-second circuit breaking timeouts. |
+----------------------------------------------------------------------------------------------------+
```

---

# 5. Key Flows (Sequence Walkthroughs)

### 5.1 User Signup & OAuth 2.0 Authentication Flow
1. User clicks "Sign in with GitHub" on [`SignInPage`](file:///frontend/src/features/auth/sign-in-page.tsx).
2. Browser redirects to `/oauth2/authorization/github`, intercepted by Spring Security's [`SecurityConfig`](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L208-L235).
3. Backend generates state parameter, saves authorization request in HTTP session, and redirects user to GitHub's OAuth consent screen.
4. User authorizes; GitHub issues an authorization code and redirects browser back to `${APP_PUBLIC_URL}/login/oauth2/code/github`.
5. Edge proxy forwards callback to backend. [`OAuth2LoginSuccessHandler`](file:///backend/src/main/java/com/hackathonos/backend/common/security/OAuth2LoginSuccessHandler.java) exchanges code for user profile, upserts the `User` and `UserProvider` records in PostgreSQL, and generates an authenticated `SecurityContext`.
6. [`SessionConfig`](file:///backend/src/main/java/com/hackathonos/backend/common/config/SessionConfig.java#L28-L43) serializes the session into `SPRING_SESSION` and sets the `JSESSIONID` cookie (`HttpOnly`, `SameSite=Lax`, `Secure`).
7. Browser receives `200 OK` on `/api/v1/me`, hydrates user state in [`useCurrentUser`](file:///frontend/src/features/auth/useCurrentUser.ts), and routes to `/app/situation`.

### 5.2 The Main User Journey (Room Creation to Verified Submission)
1. **Room Creation:** User accesses [`CreateRoomWizard`](file:///frontend/src/features/onboarding/create-room-wizard.tsx), picks a Playbook (e.g. `pb-sih`), and triggers `POST /api/v1/rooms`. [`RoomService`](file:///backend/src/main/java/com/hackathonos/backend/rooms/RoomService.java) creates the room and seeds event templates.
2. **Brief Intake & OCR:** User uploads problem statement PDF/images. [`BriefController`](file:///backend/src/main/java/com/hackathonos/backend/brief/BriefController.java) parses files via PDFBox/Vision OCR and extracts rubric items and weights into `brief_rubric`.
3. **Mandatory Confirmation Gate:** Leader reviews rules. Leader explicitly checks every mandatory rubric toggle (`PATCH /api/v1/rooms/{id}/brief/confirmed-fields`). [`BriefService`](file:///backend/src/main/java/com/hackathonos/backend/brief/BriefService.java) verifies 100% confirmation and advances the room phase.
4. **Silent Solo Ideation:** Teammates post ideas privately in [`IdeatePage`](file:///frontend/src/features/ideate/ideate-page.tsx). When all members mark ready, the Leader triggers card reveal. Feasibility is scored via `AiService.stressTestIdea()`. The room locks the winning idea.
5. **Guided 4-Step Plan Generation:** In [`PlanPage`](file:///frontend/src/features/plan/plan-page.tsx), user triggers sequential step generation. [`PlanPromptService`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java) injects brief context into prompt templates; Groq generates PRD, Architecture, Phases, and Demo scripts into the 9-document Markdown vault.
6. **Kanban Board Execution:** Tasks generated in Step 3 are instantiated as Kanban cards in [`BoardPage`](file:///frontend/src/features/board/board-page.tsx). Teammates drag cards through `TODO` -> `IN_PROGRESS` -> `READY_FOR_REVIEW` -> `DONE`. Lead approvals are enforced on critical paths.
7. **MVP Reality Ledger:** In [`MvpPage`](file:///frontend/src/features/mvp/mvp-page.tsx), the team reconciles planned features against actual implementation, auditing "What Breaks First" defenses before judges arrive.
8. **Pitch Teleprompter & STT Rehearsal:** Presenter opens [`PitchKitPage`](file:///frontend/src/features/pitch-kit/pitch-kit-page.tsx), speaking into the microphone. Audio streams to `/api/v1/pitch/rehearsals/audio`. Groq Whisper transcribes speech; backend calculates Words-Per-Minute (WPM) telemetry and highlights pacing bottlenecks.
9. **Automated Submission Verification:** [`SubmissionPage`](file:///frontend/src/features/submission/submission-page.tsx) conducts pre-flight checks. [`SubmissionLinkCheckJob`](file:///backend/src/main/java/com/hackathonos/backend/submission/SubmissionLinkCheckJob.java) queries GitHub and deployed URL HTTP status.
10. **Final Red Stamp Sign-off:** Leader signs off (`POST /api/v1/rooms/{id}/submission/sign-off`). A red "SUBMITTED" seal locks the room, and celebratory confetti triggers across all teammate browser viewports.

### 5.3 Full AI Request Pipeline (With Circuit Breaker & JSON Repair)
1. **Frontend Dispatch:** User clicks "Suggest Room Name" or "Generate Step". [`apiFetch`](file:///frontend/src/design/api.ts) sends `POST /api/v1/ai/suggest-room-name`.
2. **Context Assembly:** [`PlanPromptService`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java) merges brief rules, rubric weights, team roles, and ideas into a structured prompt.
3. **Key Resolution:** [`UserAiKeyService`](file:///backend/src/main/java/com/hackathonos/backend/ai/UserAiKeyService.java) looks up BYOK keys. If absent, falls back to platform development key or throws `AI_KEY_REQUIRED`.
4. **Resilience Checks:** [`AiCircuitBreaker`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiCircuitBreaker.java) ensures failure rate < 50%. [`ExternalCallBulkhead`](file:///backend/src/main/java/com/hackathonos/backend/common/concurrency/ExternalCallBulkhead.java) acquires one of 6 concurrency permits.
5. **Model Invocation:** [`OpenAiCompatibleClient`](file:///backend/src/main/java/com/hackathonos/backend/ai/OpenAiCompatibleClient.java) issues an HTTP POST to Groq's endpoint with 45-second timeout and 2 retries with jitter.
6. **JSON Enforcement & Repair:** If the LLM wraps JSON in markdown fences, [`AiService`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiService.java#L310) executes a 1-shot repair loop stripping non-JSON tokens.
7. **Persistence & Accounting:** Output is saved to `doc_versions` in PostgreSQL; [`AiUsageDaily`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiUsageDaily.java) increments token counts.
8. **Real-time SSE Notification:** [`RoomEventHub`](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java) broadcasts `plan.updated` to all connected browsers.

### 5.4 Autonomous Agent Execution Loop (MCP + OAuth 2.0)
1. **Agent Discovery:** Autonomous Agent (Claude Code / Cursor) calls MCP tool `list_rooms`.
2. **Bearer Token Validation:** [`McpBearerAuthFilter`](file:///backend/src/main/java/com/hackathonos/backend/mcp/McpBearerAuthFilter.java) validates the RFC 6749 Bearer token and resolves user identity.
3. **Brief Retrieval:** Agent calls `get_step_brief(roomId, 'prd')`. The MCP server retrieves the full instructions, context, and expected file list (`PRD.md`, `MVP.md`).
4. **Autonomous Synthesis:** Agent drafts the multi-file bundle using the required delimiter:  
   `=====FILE: PRD.md=====` ... `=====END FILE=====`
5. **Submission & Validation:** Agent calls `submit_step_document(roomId, 'prd', text)`.
6. **AST Validation:** [`PlanService`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanService.java) parses Markdown headings against `plan-headings.json`.
7. **Repair Loop:** If a mandatory section (e.g., "Reality check") is omitted, backend returns `400 Bad Request` with a targeted `repairPrompt`. The Agent repairs the section and resubmits (max 3 attempts).
8. **Confirmation & URL Handoff:** Upon validation, backend commits the documents to `doc_versions` and returns a direct web URL (`/app/room/{id}/docs`) for human inspection.

### 5.5 RAG Ingestion and Multimodal Context Retrieval Flow
1. **Document Intake:** PDF rulebooks or screenshot images uploaded via [`BriefController`](file:///backend/src/main/java/com/hackathonos/backend/brief/BriefController.java).
2. **Text & Vision Extraction:** Backend routes images to Vision OCR / PDFBox, stripping non-printable artifacts.
3. **Hierarchical Categorization:** Text is classified into 8 deterministic categories: Target Audience, Rubric Weights, Hard Constraints, Team Eligibility, AI Policy, Required Deliverables, and Tracks.
4. **Context Synthesis:** When a downstream step (e.g. `TECH_STACK.md`) requires context, [`PlanPromptService`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java) retrieves confirmed brief rules, prior approved PRD sections, and team member skill tags, assembling an in-context multi-document prompt bundle without vector hallucination risk.

### 5.6 Background Job & Webhook Flow
1. **PostgreSQL Advisory Lock Acquisition:** Scheduled timer triggers [`SubmissionLinkCheckJob`](file:///backend/src/main/java/com/hackathonos/backend/submission/SubmissionLinkCheckJob.java) on a 15-minute cron. It requests `SELECT pg_try_advisory_lock(1011)`.
2. **Lock Decision:** If another instance holds lock 1011, the job immediately terminates safely. If acquired, execution proceeds.
3. **HTTP Probe Execution:** Job iterates pending room submission records, issuing `HEAD` or `GET` requests to GitHub repositories, live demo URLs, and video links with 5-second timeouts.
4. **State Persistence:** Results (`HTTP 200`, `HTTP 404`, `TIMEOUT`) are committed to `submission_link_checks`.
5. **Advisory Lock Release:** `SELECT pg_advisory_unlock(1011)` is executed in a `finally` block.

### 5.7 Error, Retry, and Cold-Start Recovery Paths
1. **Reverse Proxy 429 Throttle:** If an IP exceeds 120 unauth req/min, [`RateLimitInterceptor`](file:///backend/src/main/java/com/hackathonos/backend/common/security/RateLimitInterceptor.java) responds with HTTP 429 and `Retry-After: 60`. Frontend [`apiFetch`](file:///frontend/src/design/api.ts#L46-L56) displays a single throttled toast notification preventing UI lockup.
2. **Render Cold-Start Wake-up:** Free/starter cloud instances sleep after inactivity. When the frontend receives 502, 503, or 504 from Vercel edge rewrites, [`ServerWakingOverlay`](file:///frontend/src/components/ServerWakingOverlay.tsx) mounts a pulsing full-screen indicator, suppressing transient error toast storms until `/api/v1/health` responds healthy.
3. **SSE Connection Drop:** When Wi-Fi drops or a laptop lid closes, [`useRoomLive`](file:///frontend/src/design/live.tsx#L54-L80) pauses retries while `document.hidden` is true. When visible, it reconnects using exponential backoff with full jitter and transmits `Last-Event-ID` to replay dropped events from `room_events`.

### 5.8 Deployment & CI/CD Flow
1. Developer pushes commit to `main` branch on GitHub.
2. [`.github/workflows/ci.yml`](file:///c:/Users/Admin/.antigravity/hackathon-os/.github/workflows/ci.yml) triggers parallel pipeline jobs:
   - **Backend Job:** Spawns `postgres:17-alpine` service container, sets UTC timezone, compiles with Temurin Java 25, and executes `./mvnw test`.
   - **Frontend Job:** Runs Node 20, installs dependencies via `npm ci`, executes static code compliance scan (`scripts/scan-forbidden.mjs`), runs `npm run lint`, builds via Vite, and executes Vitest unit tests.
3. Upon green CI build, Vercel pulls the latest frontend code, compiles TypeScript, and distributes static SPA assets to global edge locations.
4. Render detects GitHub webhook, builds backend `Dockerfile`, runs Flyway migrations against managed PostgreSQL 17, validates schema constraints via `ProductionStartupValidator`, and binds to `PORT: 10000`.

---

# 6. Layer Deep Dives

## 6.1 Backend API Endpoints Table

| Method | Path | Handler File | Auth Required | Request / Response Shape |
|---|---|---|---|---|
| `GET` | `/api/v1/health` | `PublicHealthController.java` | Public | Res: `{ status: "UP", timestamp: Instant }` |
| `GET` | `/api/v1/health/ready` | `PublicHealthController.java` | Public | Res: `{ status: "READY", db: "CONNECTED" }` |
| `GET` | `/actuator/prometheus` | `PrometheusScrapeEndpoint` | Bearer Token | Res: Prometheus plaintext metrics format |
| `GET` | `/api/v1/public/capacity`| `PublicCapacityController.java` | Public | Res: `{ activeRooms, capacityStatus, signupsAllowed }` |
| `GET` | `/api/v1/public/config` | `PublicCapacityController.java` | Public | Res: `{ authProviders: ["github","google"], features }` |
| `POST` | `/api/v1/public/waitlist`| `PublicCapacityController.java`| Public | Body: `{ email, reason }` -> Res: `{ ok: true }` |
| `GET` | `/api/v1/me` | `UserController.java` | Session | Res: `{ id, email, username, name, avatarUrl }` |
| `PATCH`| `/api/v1/users/me/profile`| `UserController.java` | Session | Body: `{ name, username, avatarUrl }` -> Res: `UserDto` |
| `POST` | `/api/v1/users/me/api-keys`| `UserController.java` | Session | Body: `{ provider, apiKey }` -> Res: `{ id, provider, last4 }` |
| `POST` | `/api/v1/logout` | `SecurityConfig.java` | Session | Res: `204 No Content` (Session invalidated) |
| `GET` | `/api/v1/rooms/{id}/overview` | `OverviewController.java` | Room Member | Res: `{ room, brief, checkpoints, stats, members }` |
| `POST` | `/api/v1/rooms` | `RoomController.java` | Session | Body: `{ name, templateId, durationHours }` -> Res: `{ id }` |
| `GET` | `/api/v1/rooms/{id}/events` | `EventStreamController.java` | Room Member | Header: `Last-Event-ID` -> Res: `text/event-stream` (SSE) |
| `GET` | `/api/v1/rooms/{id}/brief` | `BriefController.java` | Room Member | Res: `{ brief, rules: [], rubric: [], confirmed: bool }` |
| `POST` | `/api/v1/rooms/{id}/brief/source/images`| `BriefController.java`| Room Leader | Multipart: `files[]` -> Res: `{ extractedText }` |
| `PATCH`| `/api/v1/rooms/{id}/brief/confirmed-fields`| `BriefController.java`| Room Leader| Body: `{ confirmedRules: [], confirmedRubrics: [] }` |
| `GET` | `/api/v1/rooms/{id}/ideas`| `IdeasController.java` | Room Member | Res: `{ ideas: [], votingOpen: bool, lockedIdeaId }` |
| `POST` | `/api/v1/rooms/{id}/ideas`| `IdeasController.java` | Room Member | Body: `{ title, pitch, novelty }` -> Res: `IdeaDto` |
| `POST` | `/api/v1/rooms/{id}/ideas/reveal`| `IdeasController.java` | Room Leader | Res: `{ revealed: true, ideas: [] }` |
| `POST` | `/api/v1/rooms/{id}/ideas/{ideaId}/stress-test`| `IdeasController.java`| Room Member| Res: `{ feasibilityScore, risks: [], suggestions: [] }` |
| `GET` | `/api/v1/rooms/{id}/plan/steps`| `PlanController.java` | Room Member | Res: `List<PlanStepDto>` (Steps 1 through 5) |
| `POST` | `/api/v1/rooms/{id}/plan/steps/{step}/generate`| `PlanController.java`| Room Member| Body: `{ notes }` -> Res: `{ step, generatedBundle }` |
| `GET` | `/api/v1/rooms/{id}/docs` | `DocController.java` | Room Member | Res: `{ documents: [PRD, ARCHITECTURE, TECH_STACK...] }` |
| `GET` | `/api/v1/rooms/{id}/board`| `BoardController.java` | Room Member | Res: `{ tasks: [], phases: [], swimlanes: [] }` |
| `POST` | `/api/v1/rooms/{id}/tasks`| `TaskController.java` | Room Member | Body: `{ title, phase, assigneeId, priority }` -> Res: `Task` |
| `PATCH`| `/api/v1/rooms/{id}/tasks/{taskId}/status`| `TaskController.java`| Room Member| Body: `{ status: "DONE", comment }` -> Res: `TaskDto` |
| `POST` | `/api/v1/pitch/rehearsals/audio`| `RehearsalController.java`| Room Member| Multipart: audio blob -> Res: `{ transcript, wpm, paceScore }` |
| `POST` | `/api/v1/pitch/qna/simulate`| `QnaController.java` | Room Member | Body: `{ transcript, slideId }` -> Res: `{ questions: [] }` |
| `POST` | `/api/v1/rooms/{id}/submission/sign-off`| `SubmissionController.java`| Room Leader| Body: `{ repoUrl, demoUrl }` -> Res: `{ submitted: true }` |
| `GET` | `/api/v1/mcp/rooms` | `McpController.java` | Bearer Token | Res: `List<McpRoomDto>` |
| `GET` | `/api/v1/mcp/rooms/{id}/steps/{step}/brief`| `McpController.java`| Bearer Token| Res: `{ prompt, expectedFiles, context, webUrl }` |
| `POST` | `/api/v1/mcp/rooms/{id}/steps/{step}/submit`| `McpController.java`| Bearer Token| Body: `{ text, confirm, override }` -> Res: `McpSubmitResponse` |
| `POST` | `/oauth/register` | `OAuthServerController.java`| Public | RFC 7591 Body: `{ client_name, redirect_uris }` -> Res: `OAuthClient`|
| `POST` | `/oauth/token` | `OAuthServerController.java`| Public | RFC 6749 Body: `{ grant_type, code, code_verifier }` -> Res: `Token`|

---

## 6.2 AI / LLM Layer Deep Dive

### AI Models Table
| Provider | Model Identifier | Purpose in Hackathon OS | Where Called in Code |
|---|---|---|---|
| **Groq Cloud** | `llama-3.3-70b-versatile` | Complex multi-document planning, PRD generation, Mermaid diagram architecture, AI stress-testing, and Judge Q&A defense generation | [`AiProperties.java#L36`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiProperties.java#L36), [`PlanPromptService.java`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java) |
| **Groq Cloud** | `llama-3.1-8b-instant` | High-speed creative room project name suggestion and low-latency brief rule classification | [`AiProperties.java#L37`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiProperties.java#L37), [`AiController.java`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiController.java) |
| **Groq Cloud** | `whisper-large-v3` | Speech-to-text audio transcription for pitch rehearsals, calculating Words-Per-Minute pacing | [`AiProperties.java#L46`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiProperties.java#L46), [`RehearsalService.java`](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java) |
| **BYOK (OpenAI/xAI)**| Custom user model | Fallback execution when users provide custom API keys in profile settings | [`UserAiKeyService.java`](file:///backend/src/main/java/com/hackathonos/backend/ai/UserAiKeyService.java), [`OpenAiCompatibleClient.java`](file:///backend/src/main/java/com/hackathonos/backend/ai/OpenAiCompatibleClient.java) |

### AI Resilience & Gateway Safeguards
- **Circuit Breaker:** [`AiCircuitBreaker`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiCircuitBreaker.java) uses a sliding window of recent provider invocations. If 50% fail within 5 minutes, calls fail fast with `AI_SERVICE_UNAVAILABLE`.
- **Bulkhead Semaphores:** [`ExternalCallBulkhead`](file:///backend/src/main/java/com/hackathonos/backend/common/concurrency/ExternalCallBulkhead.java) bounds simultaneous network connections: maximum 6 concurrent LLM prompts and 3 concurrent Whisper STT audio streams, rejecting excess traffic after a 5000ms queue wait.
- **Per-User Rate Limiting:** [`AiRateLimiter`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiRateLimiter.java) tracks sliding 60-second windows in Caffeine L1 cache, enforcing a ceiling of 10 AI operations per minute per user.
- **One-Shot JSON Repair:** When an LLM includes conversational preambles or unescaped markdown blocks inside a structured output request, [`AiService`](file:///backend/src/main/java/com/hackathonos/backend/ai/AiService.java#L310-L345) identifies JSON token boundaries (`{ ... }`), executes a regex cleanup pass, and retries deserialization before triggering a retry.

---

## 6.3 Agents and MCP Orchestration Deep Dive

### Agent Table
| Agent Name | Role | Model Used | Accessible Tools | Prompt Assembly File |
|---|---|---|---|---|
| **Autonomous Planner Agent** | Generates PRD, tech stack, phases, tasks, and demo scripts | Claude 3.5 Sonnet / GPT-4o via MCP | `list_rooms`, `get_plan_steps`, `get_step_brief`, `submit_step_document` | `mcp-server/src/prompts.ts`, `backend/.../plan-prompts/` |
| **Judge Defense Simulator** | Simulates adversarial judging questions during rehearsal | LLaMA 3.3 70B Versatile | Internal `AiService.simulateJudgeQna` | `backend/.../pitchkit/QnaService.java` |
| **Multimodal Brief Analyzer**| Extracts constraints, dead-ends, and rubric weights | LLaMA 3.3 70B Versatile | Internal `BriefService.extractRules` | `backend/.../brief/BriefService.java` |

### MCP Tool Registry Table
| Tool Name | Responsibility | Inputs Schema | Output Shape | Source File |
|---|---|---|---|---|
| `list_rooms` | Lists active hackathon rooms for the user | None (Session context) | Markdown list of rooms, IDs, stages, and user roles | `mcp-server/src/tools.ts#L95-L135` |
| `get_plan_steps` | Returns status of the 5 planning steps | `{ roomId: string }` | Formatted list of step keys, titles, and statuses | `mcp-server/src/tools.ts#L138-L171` |
| `get_step_brief` | Returns instructions, context, and file schemas | `{ roomId: string, step: "prd"\|"tech"\|"phases"\|"tasks"\|"demo" }` | Structured prompt instructions and context bundle | `mcp-server/src/tools.ts#L174-L212` |
| `submit_step_document` | Submits generated markdown bundle for AST check | `{ roomId, step, text, confirm?: bool, override?: bool }` | Validation success with `webUrl`, or repair prompt with errors | `mcp-server/src/tools.ts#L216-L330` |

---

## 6.4 Data Layer Deep Dive

### Core Database Entities & Migrations
| Entity / Table Name | Functional Responsibility | Primary Key | Key Foreign Keys | Flyway Migration |
|---|---|---|---|---|
| `users` | User account profiles, roles, waitlist states | `id` (UUID) | None | `V1__phase1_schema.sql` |
| `user_providers` | OAuth identity provider bindings (GitHub, Google) | `id` (UUID) | `user_id` -> `users(id)` | `V1__phase1_schema.sql` |
| `rooms` | Hackathon room metadata, stage, scheduled duration | `id` (UUID) | `created_by` -> `users(id)` | `V1__phase1_schema.sql` |
| `room_members` | Room roster memberships and assigned roles (LEADER, BUILDER) | `id` (UUID) | `room_id` -> `rooms`, `user_id` -> `users` | `V1__phase1_schema.sql` |
| `briefs` | Problem statement intake text, OCR source links | `id` (UUID) | `room_id` -> `rooms(id)` | `V1__phase1_schema.sql` |
| `brief_rules` | Parsed competition rules and constraints | `id` (UUID) | `brief_id` -> `briefs(id)` | `V1__phase1_schema.sql` |
| `brief_rubrics` | Judging rubric criteria and numerical percentage weights | `id` (UUID) | `brief_id` -> `briefs(id)` | `V1__phase1_schema.sql` |
| `ideas` | Solo ideation cards, votes, and AI stress-test scores | `id` (UUID) | `room_id` -> `rooms`, `user_id` -> `users` | `V1__phase1_schema.sql` |
| `plan_steps` | Sequential planning stages (1 through 5) | `id` (UUID) | `room_id` -> `rooms(id)` | `V3__phase2_planning.sql` |
| `doc_versions` | Versioned Markdown documents in the 9-doc vault | `id` (UUID) | `room_id` -> `rooms`, `created_by` -> `users` | `V3__phase2_planning.sql` |
| `tasks` | Kanban execution tasks, status, phase assignments | `id` (UUID) | `room_id` -> `rooms`, `assignee_id` -> `users` | `V4_1__phase3_build.sql` |
| `task_dependencies` | Directed DAG edges preventing out-of-order task progression| `id` (UUID) | `task_id` -> `tasks`, `depends_on_id` -> `tasks`| `V18__task_dependencies.sql` |
| `rehearsals` | Audio pitch rehearsals, WPM pacing scores, transcripts | `id` (UUID) | `room_id` -> `rooms`, `user_id` -> `users` | `V40__pitch_and_rehearsals.sql` |
| `submissions` | Final flight sign-off stamps, URLs, and submission status | `id` (UUID) | `room_id` -> `rooms`, `signed_by` -> `users` | `V12__present_group_schema.sql` |
| `room_events` | Monotonic BIGSERIAL event ledger for SSE replay | `seq` (BIGINT) | `room_id` -> `rooms(id)` | `V15__live_sync_optimistic.sql` |
| `SPRING_SESSION` | Persistent HTTP user session records | `PRIMARY_ID` | None | `V44__spring_session.sql` |
| `idempotency_keys` | Stored HTTP POST responses for 24-hour deduplication | `id` (UUID) | `user_id` -> `users(id)` | `V48__ensure_idempotency.sql` |
| `user_ai_keys` | AES-256-GCM encrypted BYOK API keys | `id` (UUID) | `user_id` -> `users(id)` | `V33__user_ai_keys.sql` |

---

## 6.5 Configuration & Environment Variables

| Variable Group | Environment Variable | Purpose / Default Value | Key File References |
|---|---|---|---|
| **Server & Profile** | `SPRING_PROFILES_ACTIVE` | Active Spring profile (`prod`, `dev`) | `application.yml`, `render-env.template` |
| | `PORT` | HTTP port for backend listener (Default: `10000` on Render) | `application-prod.yml` |
| | `APP_PUBLIC_URL` | Canonical frontend URL (e.g. `https://brackit.vercel.app`) | `AppProperties.java`, `SecurityConfig.java` |
| | `API_PUBLIC_URL` | Canonical backend URL (e.g. `https://api.onrender.com`) | `AppProperties.java` |
| **Database** | `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL host, port, database name | `application-prod.yml` |
| | `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL credentials | `application-prod.yml` |
| | `DB_POOL_SIZE` | Maximum HikariCP pool connections (Default: `10`) | `application-prod.yml` |
| **Security & Rate Limits** | `RATE_LIMIT_UNAUTH_PER_MINUTE` | Unauthenticated visitor rate ceiling (Default: `120`) | `RateLimitInterceptor.java`, `render-env.template` |
| | `RATE_LIMIT_AUTH_PER_MINUTE` | Authenticated visitor rate ceiling (Default: `600`) | `RateLimitInterceptor.java`, `render-env.template` |
| | `APP_ENCRYPTION_KEY` | 32-byte hex/base64 key for AES-256-GCM token storage | `UserAiKeyService.java`, `OAuthServerService.java` |
| | `METRICS_TOKEN` | Bearer token required to scrape `/actuator/prometheus` | `SecurityConfig.java#L160` |
| | `PROXY_SHARED_SECRET` | Optional shared secret verifying Vercel proxy headers | `ClientIpResolver.java#L28` |
| **AI Gateway** | `AI_BASE_URL` | OpenAI-compatible endpoint (Default: `https://api.groq.com/openai/v1`) | `AiProperties.java#L32` |
| | `AI_API_KEY` | Platform fallback API key (active in dev mode) | `AiProperties.java#L33` |
| | `AI_MODEL_DEFAULT` | Default inference model (`llama-3.3-70b-versatile`) | `AiProperties.java#L36` |
| | `STT_BASE_URL`, `STT_MODEL` | Speech-to-text gateway (`whisper-large-v3`) | `AiProperties.java#L45-L46` |
| | `AI_MAX_CONCURRENT` | Semaphore capacity for concurrent LLM queries (Default: `6`) | `ExternalCallBulkhead.java`, `render-env.template` |
| **Object Storage** | `STORAGE_PROVIDER` | Storage backend (`s3`, `local`, `memory`) | `FileStorageConfig.java` |
| | `S3_ENDPOINT`, `S3_BUCKET` | S3 API endpoint URL and bucket name (e.g. Cloudflare R2) | `S3CompatibleFileStorage.java` |
| | `S3_ACCESS_KEY`, `S3_SECRET_KEY` | S3 API credentials | `S3CompatibleFileStorage.java` |
| **External Auth** | `GITHUB_CLIENT_ID`, `_SECRET` | GitHub OAuth application credentials | `application-prod.yml` |
| | `GOOGLE_CLIENT_ID`, `_SECRET` | Google OAuth 2.0 application credentials | `application-prod.yml` |
| **Mail Dispatch** | `MAIL_ENABLED`, `MAIL_HOST` | SMTP server switch and hostname (e.g. `smtp.gmail.com`) | `application.yml`, `MailWorker.java` |
| | `MAIL_USERNAME`, `MAIL_APP_PASSWORD` | SMTP authentication credentials | `MailWorker.java` |

---

# 7. Diagram Plan

To ensure maximum visual legibility, each diagram adheres strictly to an 8 to 12 core node layout featuring a single highlighted primary execution path and rich peripheral detail cards.

1. **System Overview (`docs/architecture/01-system-overview.html`):** High-level topology across Client Browser, Vercel Edge Proxy, Spring Boot Backend API, Groq LLM, PostgreSQL 17, and Cloudflare R2.
2. **Frontend Architecture (`docs/architecture/02-frontend.html`):** Component hierarchy, React Router v7, TanStack Query v5, Zustand state, useRoomLive SSE hook, and Web Audio API teleprompter.
3. **Backend & API Architecture (`docs/architecture/03-backend-api.html`):** RequestIdFilter, RateLimitInterceptor, Spring Security dual-chain, Spring MVC REST controllers, RoomEventHub, and HikariCP data access.
4. **AI & LLM Pipeline (`docs/architecture/04-ai-pipeline.html`):** PlanPromptService, UserAiKeyService BYOK resolution, AiCircuitBreaker, ExternalCallBulkhead, Groq LLaMA 3.3 70B, Whisper STT, and 1-shot JSON repair.
5. **Agent Orchestration & MCP Server (`docs/architecture/05-agent-orchestration.html`):** Node.js MCP Server (`@modelcontextprotocol/sdk`), RFC 6749 OAuth server, 4 core tools, 5 plan prompts, and automated Markdown AST validation.
6. **Data Architecture & Persistence (`docs/architecture/06-data-architecture.html`):** PostgreSQL 17 schemas, 48 Flyway migrations, Spring Session JDBC persistence, monotonic room_events log, and advisory locks.
7. **Auth, Security & Trust Boundaries (`docs/architecture/07-auth-security.html`):** Zero-trust browser boundaries, `x-vercel-forwarded-for` IP parsing, CSRF token verification, AES-256-GCM vault, and Prometheus security.
8. **Infrastructure, CI/CD & Observability (`docs/architecture/08-infra-devops.html`):** GitHub Actions CI pipeline, Vercel Edge CDN, Render cloud web service, Prometheus metrics, structured MDC logging, and load testing.
9. **Sequence Diagram: End-to-End User Hackathon Journey (`docs/architecture/09-sequence-main-flow.html`):** Step-by-step runtime sequence from Multimodal OCR intake to 4-Step Planning, Kanban sync, mic rehearsal, and final sign-off.
10. **Sequence Diagram: Autonomous Agent MCP Planning Loop (`docs/architecture/10-sequence-agent-loop.html`):** Step-by-step sequence of an autonomous agent discovering rooms, fetching step briefs, submitting delimited bundles, and repairing heading failures.
11. **One-Page System Explainer (`docs/architecture/how-this-system-works.html`):** Standalone reader panel explaining how Hackathon OS prevents hackathon failure modes with conclusion-first summaries and comparative tables.

---

# 8. Archify-Ready Prompts

### Prompt 1: System Overview
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - System Overview".
Nodes:
- browser [40, 300] (frontend, "Client Browser", sublabel: "React 19 + PWA", tag: "TanStack + SSE")
- auth_idp [40, 110] (external, "OAuth 2.0 IdPs", sublabel: "GitHub & Google", tag: "RFC 6749")
- vercel [250, 300] (cloud, "Vercel Edge", sublabel: "Reverse Proxy", tag: "Forwarded IP")
- api_gateway [470, 300] (backend, "Spring Boot API", sublabel: "Java 25 Engine", tag: "Monolith")
- mcp_server [470, 110] (backend, "Brackit MCP", sublabel: "Agent Tools/Prompts", tag: "RFC 6749 Auth")
- ai_gateway [690, 300] (backend, "AI Gateway", sublabel: "AiService + BYOK", tag: "CircuitBreaker")
- groq_llm [910, 300] (external, "Groq & Whisper", sublabel: "Llama 3.3 & STT", tag: "Zero Client Key")
- sse_hub [250, 480] (messagebus, "RoomEventHub", sublabel: "SSE Live Sync", tag: "Virtual Threads")
- postgres [470, 480] (database, "PostgreSQL 17", sublabel: "Persistent Store", tag: "V1-V48 Flyway")
- s3_storage [690, 480] (cloud, "Cloudflare R2", sublabel: "S3-Compatible", tag: "Decks & Media")
Boundaries:
- region "Client Zone" wraps ["browser"]
- region "Edge Routing Zone" wraps ["vercel"]
- region "Application Network" wraps ["api_gateway", "mcp_server", "ai_gateway"]
- region "Data Persistence Zone" wraps ["postgres", "s3_storage"]
Connections:
- browser -> auth_idp (label: "OAuth Login", variant: security, labelDx: 50)
- browser -> vercel (label: "HTTPS :443", variant: emphasis) [PRIMARY]
- vercel -> api_gateway (label: "Proxy Forward", variant: emphasis) [PRIMARY]
- mcp_server -> api_gateway (label: "Bearer Auth", variant: security, labelDy: 24)
- api_gateway -> ai_gateway (label: "AI Invocation", variant: emphasis) [PRIMARY]
- ai_gateway -> groq_llm (label: "REST Client", variant: emphasis) [PRIMARY]
- api_gateway -> postgres (label: "HikariCP JDBC", labelDy: 24)
- api_gateway -> s3_storage (label: "S3 SDK")
- api_gateway -> sse_hub (label: "Mutations")
- sse_hub -> browser (label: "SSE Events", variant: dashed)
Detail Cards:
- cyan "Client Tier": ["React 19 SPA with Vite and TanStack Query v5", "PWA offline-ready service worker", "Real-time SSE event stream with auto-reconnection"]
- emerald "Backend Core": ["Spring Boot 4.1 monolith on Java 25", "Per-IP rate limiting with Vercel proxy awareness", "Idempotency filter caching POST requests for 24h"]
- violet "AI & Agent Layer": ["Unified AiService gateway with circuit breaking and BYOK fallback", "Groq-hosted LLaMA 3.3 70B and Whisper Large v3 STT", "Stand-alone MCP server with 4 room tools and 5 plan prompts"]
- amber "Data Persistence": ["PostgreSQL 17 with 48 Flyway migrations", "JDBC-backed persistent user sessions (SPRING_SESSION)", "Cloudflare R2 / AWS S3 object storage for pitch decks and media"]
```

### Prompt 2: Frontend Architecture
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Frontend Architecture".
Nodes:
- router [40, 300] (frontend, "AppRouter", sublabel: "React Router v7", tag: "Code-Split /app")
- pwa_worker [40, 470] (frontend, "PWA Worker", sublabel: "Service Worker", tag: "Offline Cache")
- shell [250, 300] (frontend, "ResponsiveShell", sublabel: "App & Room Nav", tag: "Layout Frame")
- ui_tokens [250, 130] (frontend, "UI & Design System", sublabel: "Radix + Tailwind 4", tag: "shadcn Tokens")
- pages [460, 300] (frontend, "Room Workspaces", sublabel: "Brief/Plan/Board/MVP", tag: "Feature Pages")
- state_stores [460, 130] (frontend, "Zustand Stores", sublabel: "Client Preferences", tag: "Ephemeral State")
- query [670, 300] (frontend, "TanStack Query v5", sublabel: "QueryClient & Cache", tag: "5m Stale / Jitter")
- specialized_ui [670, 130] (frontend, "Specialized Engines", sublabel: "Mermaid / CodeMirror", tag: "Recharts + Cal")
- api_client [880, 300] (backend, "design/api.ts", sublabel: "apiFetch Wrapper", tag: "CSRF + Idempotent")
- live_stream [460, 470] (messagebus, "useRoomLive", sublabel: "SSE Hook / Coalesce", tag: "Conflict Guard")
- audio_mic [670, 470] (frontend, "Audio & Telemetry", sublabel: "Web Audio API", tag: "Mic Waveform")
Boundaries:
- region "Presentation Hierarchy" wraps ["router", "shell", "pages", "ui_tokens"]
- region "State & Client Logic" wraps ["query", "state_stores", "api_client", "specialized_ui"]
- region "Sensory & Realtime Channels" wraps ["live_stream", "audio_mic"]
Connections:
- router -> shell (label: "Protected Route", variant: emphasis) [PRIMARY]
- shell -> pages (label: "Outlet Render", variant: emphasis) [PRIMARY]
- pages -> query (label: "useQuery Hook", variant: emphasis) [PRIMARY]
- query -> api_client (label: "Fetch Function", variant: emphasis) [PRIMARY]
- pages -> state_stores (label: "Sync State")
- pages -> specialized_ui (label: "Render Canvas")
- pages -> live_stream (label: "Subscribe Room", labelDy: 24)
- live_stream -> query (label: "Debounced Invalidate", variant: dashed)
- pages -> audio_mic (label: "Stream Mic")
- router -> pwa_worker (label: "Service Worker", variant: dashed, labelDy: 24)
Detail Cards:
- cyan "Router & Layout": ["React Router v7 with ProtectedRoute session verification", "Lazy-loaded route splitting via React.lazy and Suspense boundaries", "Unified ResponsiveShell with room banner, timer, and checkpoint HUD"]
- emerald "Data & Network Client": ["TanStack Query v5 with 5-minute staleTime and 2x exponential retry with jitter", "apiFetch in design/api.ts with automatic XSRF-TOKEN header injection", "Per-request Idempotency-Key UUID headers on creates and mutations"]
- violet "Real-time & Sensory UI": ["useRoomLive SSE hook with exponential backoff and tab-visibility pausing", "Optimistic locking conflict alert dialog with one-click reload", "Web Audio API microphone waveform analyser and speech pacing teleprompter"]
- amber "Design System Tokens": ["Tailwind CSS v4 with semantic CSS theme tokens (shadcn/ui style)", "Radix UI unstyled primitives for dialogs, popovers, tooltips, and tabs", "CodeMirror 6 for markdown authoring and Mermaid.js runtime rendering"]
```

### Prompt 3: Backend & API Architecture
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Backend & API Architecture".
Nodes:
- filter_chain [40, 300] (security, "Security Filters", sublabel: "RequestId + CSRF + Auth", tag: "Order(1 & 2)")
- idempotency [250, 130] (security, "IdempotencyFilter", sublabel: "24h POST Dedup", tag: "idempotency_keys")
- rate_limiter [250, 300] (security, "RateLimiter", sublabel: "ClientIpResolver", tag: "Vercel-Aware")
- room_interceptor [250, 470] (messagebus, "RoomInterceptor", sublabel: "Mutation Capture", tag: "WebMvcConfig")
- auth_manager [460, 130] (backend, "Session & OAuth", sublabel: "Spring Session JDBC", tag: "JSESSIONID")
- controllers [460, 300] (backend, "REST Controllers", sublabel: "50+ Feature Endpoints", tag: "@RestController")
- event_hub [460, 470] (messagebus, "RoomEventHub", sublabel: "SSE Live Dispatcher", tag: "RingBuffer(200)")
- mcp_gateway [670, 130] (backend, "MCP & OAuth Server", sublabel: "RFC 6749 Endpoints", tag: "McpController")
- core_services [670, 300] (backend, "Domain Services", sublabel: "Brief/Plan/Task/Pitch", tag: "@Service Beans")
- schedulers [670, 470] (backend, "Scheduled Jobs", sublabel: "Cleanup + Reminders", tag: "Advisory Locks")
- data_layer [880, 300] (database, "Data Access", sublabel: "Spring Data JPA + JDBC", tag: "HikariCP Pool")
Boundaries:
- region "HTTP Ingress & Security" wraps ["filter_chain", "rate_limiter", "idempotency"]
- region "Controllers & Identity" wraps ["controllers", "auth_manager", "mcp_gateway"]
- region "Domain & Realtime Engine" wraps ["core_services", "room_interceptor", "event_hub"]
- region "Persistence & Background Tasks" wraps ["data_layer", "schedulers"]
Connections:
- filter_chain -> idempotency (label: "Verify Key", variant: security)
- filter_chain -> rate_limiter (label: "Filter Pipeline", variant: emphasis) [PRIMARY]
- rate_limiter -> controllers (label: "Dispatch Request", variant: emphasis) [PRIMARY]
- controllers -> auth_manager (label: "CurrentUser")
- controllers -> core_services (label: "Invoke Logic", variant: emphasis) [PRIMARY]
- core_services -> data_layer (label: "Read/Write SQL", variant: emphasis) [PRIMARY]
- controllers -> mcp_gateway (label: "Route MCP")
- rate_limiter -> room_interceptor (label: "PostHandle", labelDy: 24)
- room_interceptor -> event_hub (label: "Emit Event", variant: dashed)
- schedulers -> data_layer (label: "Advisory Lock")
Detail Cards:
- cyan "Security Ingress": ["RequestIdFilter sets MDC and X-Request-Id header on all requests", "ClientIpResolver parses x-vercel-forwarded-for with InetAddress literal checks", "RateLimitInterceptor enforces 120/min unauth and 600/min auth limits"]
- emerald "Controllers & Sessions": ["CurrentUser method argument resolver injects authenticated User model", "Spring Session JDBC stores encrypted sessions in postgres table", "RFC 6749 OAuth 2.0 authorization server exposes token issuing and verification"]
- violet "Real-time SSE Engine": ["RoomChangeInterceptor captures POST/PUT/PATCH mutations matching /api/v1/**", "RoomEventHub maintains in-memory ring buffers of 200 events and emits heartbeats", "Supports Last-Event-ID event replay for reconnecting browsers"]
- amber "Persistence & Schedulers": ["HikariCP connection pool sized to 10 connections on managed Postgres", "Postgres advisory locks (1010L for reminders, 1011L for link checks) prevent overlap", "Scheduled CleanupJob prunes idempotency records older than 24 hours"]
```

### Prompt 4: AI & LLM Pipeline
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - AI & LLM Pipeline".
Nodes:
- feature_caller [40, 300] (backend, "Feature Services", sublabel: "Plan / Brief / Pitch", tag: "13 AI Features")
- prompt_engine [250, 130] (backend, "Prompt Engine", sublabel: "plan-prompts/*.md", tag: "Template Injector")
- byok_resolver [250, 300] (security, "Key Resolver", sublabel: "UserAiKeyService", tag: "BYOK + AES-256")
- rate_limiter [250, 470] (security, "AiRateLimiter", sublabel: "10 req/min per User", tag: "Caffeine Bucket")
- circuit_breaker [460, 130] (security, "CircuitBreaker", sublabel: "AiCircuitBreaker", tag: "50% Error Trip")
- ai_service [460, 300] (backend, "AiService Gateway", sublabel: "Unified Orchestrator", tag: "Temperature Steer")
- json_repair [460, 470] (backend, "JSON Repair", sublabel: "1-Shot Repair Loop", tag: "Schema Enforcer")
- whisper_stt [670, 130] (cloud, "Whisper STT", sublabel: "whisper-large-v3", tag: "Pitch Audio STT")
- client_bulkhead [670, 300] (security, "Bulkhead Limiter", sublabel: "ExternalCallBulkhead", tag: "Semaphore(6)")
- usage_ledger [670, 470] (database, "AiUsageDaily", sublabel: "Token Accounting", tag: "Daily Quota")
- groq_client [880, 300] (external, "Groq LLM Engine", sublabel: "llama-3.3-70b", tag: "45s Timeout / Jitter")
Boundaries:
- region "Prompt & Key Intake" wraps ["feature_caller", "prompt_engine", "byok_resolver", "rate_limiter"]
- region "Gateway Resilience Core" wraps ["circuit_breaker", "ai_service", "json_repair", "client_bulkhead"]
- region "External Providers & Auditing" wraps ["whisper_stt", "usage_ledger", "groq_client"]
Connections:
- feature_caller -> prompt_engine (label: "Assemble Context")
- feature_caller -> byok_resolver (label: "Resolve Credential", variant: security) [PRIMARY]
- byok_resolver -> ai_service (label: "Gateway Invoke", variant: emphasis) [PRIMARY]
- ai_service -> circuit_breaker (label: "State Check", variant: security)
- ai_service -> client_bulkhead (label: "Acquire Slot", variant: emphasis) [PRIMARY]
- client_bulkhead -> groq_client (label: "OpenAI REST", variant: emphasis) [PRIMARY]
- ai_service -> whisper_stt (label: "Audio MultiPart")
- ai_service -> json_repair (label: "Parse JSON", labelDy: 24)
- ai_service -> rate_limiter (label: "Check Rate", variant: security)
- ai_service -> usage_ledger (label: "Log Tokens")
Detail Cards:
- cyan "Prompt & Key Resolution": ["PlanPromptService dynamically injects team roles, rubric weights, and PRD context into markdown templates", "UserAiKeyService supports Bring-Your-Own-Key (BYOK) with AES-256 encrypted database storage", "Platform key fallback active in development mode with zero client exposure"]
- emerald "Gateway Resilience": ["AiCircuitBreaker tracks 5-minute rolling window and trips after 50% failures", "ExternalCallBulkhead bounds concurrent LLM calls to 6 and STT to 3", "AiRateLimiter enforces 10 requests/minute per authenticated user"]
- violet "Model Providers & Audio": ["Primary generation via Groq LLaMA 3.3 70B Versatile with temperature steering per feature tag", "Speech-to-Text transcription via Groq Whisper Large v3 for pitch kit practice", "45-second read timeout with 2x exponential retries and backoff jitter"]
- amber "Structured Parsing & Audit": ["Enforces JSON Mode and executes automated 1-shot repair if LLM outputs markdown syntax", "Strict Jackson deserialization validating expected heading schemas", "AiUsageDaily increments daily token counters per room and user for cost observability"]
```

### Prompt 5: Agent Orchestration & MCP Server
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Agent Orchestration & MCP Server".
Nodes:
- mcp_client [40, 300] (external, "Autonomous Agent", sublabel: "Claude/Cursor/AGY", tag: "LLM Orchestrator")
- client_reg [250, 130] (security, "Client Registration", sublabel: "RFC 7591 /register", tag: "Dynamic Client")
- mcp_server [250, 300] (backend, "Brackit MCP Server", sublabel: "Node.js MCP SDK", tag: "Hono Transport")
- mcp_backend_client [250, 470] (backend, "Backend Client", sublabel: "backend-client.ts", tag: "60s Render Cold")
- token_service [460, 130] (security, "OAuth Token Service", sublabel: "PKCE & Refresh", tag: "OAuthServerService")
- oauth_guard [460, 300] (security, "Bearer Auth Filter", sublabel: "McpBearerAuthFilter", tag: "Stateless Guard")
- prompt_registry [670, 130] (backend, "Prompt Registry", sublabel: "5 Step Prompts", tag: "prd/tech/phases")
- tool_router [670, 300] (messagebus, "MCP Tool Registry", sublabel: "4 Execution Tools", tag: "list/get/submit")
- repair_loop [670, 470] (backend, "Repair Generator", sublabel: "Fix & Resubmit Loop", tag: "Max 3 Attempts")
- plan_validator [880, 300] (backend, "Plan Validator", sublabel: "Headings & Reality", tag: "Strict Headings")
- doc_vault [880, 470] (database, "Docs Vault", sublabel: "Versioned Documents", tag: "DocRepository")
Boundaries:
- region "External Agent Environment" wraps ["mcp_client"]
- region "MCP Server & Auth Boundary" wraps ["client_reg", "mcp_server", "token_service", "oauth_guard"]
- region "Tools & Execution Engine" wraps ["prompt_registry", "tool_router", "mcp_backend_client"]
- region "Validation & Persistence Core" wraps ["plan_validator", "repair_loop", "doc_vault"]
Connections:
- mcp_client -> mcp_server (label: "MCP Protocol", variant: emphasis) [PRIMARY]
- mcp_server -> client_reg (label: "Dynamic Client", variant: security)
- mcp_server -> oauth_guard (label: "Bearer Token", variant: security) [PRIMARY]
- oauth_guard -> token_service (label: "Validate Code", variant: security)
- oauth_guard -> tool_router (label: "Authorize Call", variant: emphasis) [PRIMARY]
- tool_router -> prompt_registry (label: "Get Brief")
- tool_router -> mcp_backend_client (label: "API Fetch")
- tool_router -> plan_validator (label: "Submit Bundle", variant: emphasis) [PRIMARY]
- plan_validator -> repair_loop (label: "Errors Found", variant: dashed, labelDy: 24)
- plan_validator -> doc_vault (label: "Save Validated", variant: emphasis, labelDy: 24) [PRIMARY]
Detail Cards:
- cyan "Model Context Protocol Server": ["Node.js MCP implementation using @modelcontextprotocol/sdk/server/mcp.js", "Handles Render cold-start timeouts with explicit 60-second fetch budget", "Communicates with Spring Boot backend via dedicated /api/v1/mcp/** API"]
- emerald "OAuth 2.0 Authorization Server": ["Full RFC 6749 and RFC 7636 (PKCE) implementation in Spring Security", "Dynamic client registration (RFC 7591) at /oauth/register", "Issues opaque, cryptographically random 40-character tokens with refresh rotation"]
- violet "Tool Registry & Prompts": ["Exposes 4 core tools: list_rooms, get_plan_steps, get_step_brief, and submit_step_document", "Exposes 5 structured planning prompts (prd, tech, phases, tasks, demo)", "Enforces 200,000 character payload ceilings before backend handoff"]
- amber "Automated Validation & Repair": ["Enforces strict heading hierarchies (plan-headings.json) and delimiters", "Generates targeted Fix and Resubmit repair prompts on validation failures", "Supports warnings confirmation gate (confirm=true) for non-blocking ambiguities"]
```

### Prompt 6: Data Architecture & Persistence
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Data Architecture & Persistence".
Nodes:
- backend_orm [40, 300] (backend, "ORM & Data Access", sublabel: "Spring Data JPA / JDBC", tag: "open-in-view: false")
- caffeine_cache [250, 130] (database, "Caffeine L1 Cache", sublabel: "In-Memory JVM Cache", tag: "1h TTL / 5000 max")
- hikaricp [250, 300] (database, "HikariCP Pool", sublabel: "Connection Pool (10)", tag: "Leak Detect 30s")
- advisory_locks [250, 470] (database, "Advisory Locks", sublabel: "pg_try_advisory_lock", tag: "Locks 1010/1011")
- session_store [460, 130] (database, "Spring Session JDBC", sublabel: "SPRING_SESSION", tag: "8h Expiration")
- postgres_engine [460, 300] (database, "PostgreSQL 17", sublabel: "Render Managed DB", tag: "UTC Timestamps")
- room_events_store [460, 470] (database, "Event Store", sublabel: "room_events Table", tag: "Monotonic Bigserial")
- idempotency_store [670, 130] (database, "Idempotency Store", sublabel: "idempotency_keys", tag: "24h Prune")
- core_tables [670, 300] (database, "Core Relational DB", sublabel: "50+ JPA Entities", tag: "Users/Rooms/Tasks")
- s3_blob_store [670, 470] (cloud, "Cloudflare R2 / S3", sublabel: "Object Storage", tag: "Blobs & Media")
- flyway_engine [880, 300] (backend, "Flyway Migrations", sublabel: "V1 to V48 SQL", tag: "Automatic DDL")
Boundaries:
- region "In-Memory & Connection Tier" wraps ["backend_orm", "hikaricp", "caffeine_cache", "advisory_locks"]
- region "PostgreSQL 17 Database Engine" wraps ["postgres_engine", "session_store", "room_events_store"]
- region "Schemas & Relational Tables" wraps ["core_tables", "idempotency_store", "flyway_engine"]
- region "External Object Storage" wraps ["s3_blob_store"]
Connections:
- backend_orm -> caffeine_cache (label: "Fast Lookup")
- backend_orm -> hikaricp (label: "Borrow Conn", variant: emphasis) [PRIMARY]
- hikaricp -> postgres_engine (label: "TCP :5432", variant: emphasis) [PRIMARY]
- postgres_engine -> session_store (label: "Persist Session", variant: security)
- postgres_engine -> room_events_store (label: "Append Only", labelDy: 24)
- postgres_engine -> core_tables (label: "CRUD Query", variant: emphasis) [PRIMARY]
- postgres_engine -> idempotency_store (label: "Lookup Key")
- core_tables -> flyway_engine (label: "Apply DDL")
- hikaricp -> advisory_locks (label: "Advisory Lock", variant: security, labelDy: 24)
- backend_orm -> s3_blob_store (label: "Store Binary")
Detail Cards:
- cyan "Connection Management": ["HikariCP connection pool sized to 10 connections for managed PostgreSQL headroom", "Connection timeout of 10s and leak detection threshold of 30s", "Spring JPA configured with open-in-view: false and batch fetching (size 50)"]
- emerald "PostgreSQL 17 Relational Storage": ["Managed PostgreSQL hosted on Render with forced UTC timezone option", "48 Flyway migrations automating schema evolution and indexes", "Monotonic BIGSERIAL sequence on room_events for gapless event sync"]
- violet "Distributed Coordination & Caching": ["PostgreSQL advisory locks (1005L, 1006L, 1010L, 1011L) guard singleton jobs", "Spring Session JDBC maintains distributed HTTP user sessions across restarts", "Caffeine in-memory cache isolates rate limit buckets and SSE ring buffers"]
- amber "Object Storage & Idempotency": ["S3-compatible Cloudflare R2 / AWS S3 bucket stores PPTX decks, PDFs, and OCR screenshots", "idempotency_keys table stores hashed request URIs and status codes with 24h retention", "Timestamp conversion explicitly maps Java Instant to java.sql.Timestamp for JDBC compatibility"]
```

### Prompt 7: Auth, Security, and Trust Boundaries
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Auth, Security & Trust Boundaries".
Nodes:
- browser_client [40, 300] (frontend, "Browser Sandbox", sublabel: "Zero Secret Storage", tag: "No LocalStorage")
- oauth_idps [250, 130] (external, "External IdPs", sublabel: "GitHub & Google", tag: "OAuth 2.0 Auth")
- vercel_proxy [250, 300] (cloud, "Vercel Edge Proxy", sublabel: "Reverse Proxy", tag: "x-vercel-forw")
- csp_headers [250, 470] (security, "Security Headers", sublabel: "CSP + FrameOptions", tag: "DENY Frame")
- mcp_auth_filter [460, 130] (security, "MCP Bearer Auth", sublabel: "McpBearerAuthFilter", tag: "Stateless API")
- ip_resolver [460, 300] (security, "ClientIpResolver", sublabel: "Literal Validation", tag: "Anti-Spoofing")
- rate_interceptor [460, 470] (security, "RateLimiter", sublabel: "120/min & 600/min", tag: "Retry-After")
- aes_encryption [670, 130] (security, "AES-256 Vault", sublabel: "APP_ENCRYPTION_KEY", tag: "GCM Encryption")
- spring_security [670, 300] (security, "Spring Security", sublabel: "DelegatingContext", tag: "CSRF + Cookie")
- prometheus_guard [670, 470] (security, "Metrics Guard", sublabel: "/actuator/prometheus", tag: "METRICS_TOKEN")
- session_db [880, 300] (database, "SPRING_SESSION", sublabel: "Persistent Session", tag: "JSESSIONID")
Boundaries:
- region "Client Trust Boundary" wraps ["browser_client"]
- region "Reverse Proxy Edge Zone" wraps ["vercel_proxy", "csp_headers"]
- region "Security Enforcement Core" wraps ["mcp_auth_filter", "ip_resolver", "rate_interceptor", "spring_security"]
- region "Encrypted Persistence Zone" wraps ["aes_encryption", "prometheus_guard", "session_db"]
Connections:
- browser_client -> oauth_idps (label: "Login Redirect", variant: security)
- browser_client -> vercel_proxy (label: "TLS :443", variant: emphasis) [PRIMARY]
- vercel_proxy -> csp_headers (label: "Inject Headers", labelDy: 24)
- vercel_proxy -> ip_resolver (label: "Forwarded IP", variant: emphasis) [PRIMARY]
- ip_resolver -> rate_interceptor (label: "Check Quota", variant: security, labelDy: 24)
- ip_resolver -> spring_security (label: "Authorized Flow", variant: emphasis) [PRIMARY]
- spring_security -> mcp_auth_filter (label: "McpMatcher")
- spring_security -> session_db (label: "Load Session", variant: emphasis) [PRIMARY]
- spring_security -> aes_encryption (label: "Decrypt BYOK", variant: security)
- spring_security -> prometheus_guard (label: "Check Token", variant: security, labelDy: 24)
Detail Cards:
- cyan "Zero-Trust Browser Sandbox": ["No auth tokens, user credentials, or AI API keys are stored in localStorage or sessionStorage", "HttpOnly, SameSite=Lax, Secure session cookie (JSESSIONID) scoped as host-only", "XSRF-TOKEN cookie verified on all state-mutating requests (POST, PUT, PATCH, DELETE)"]
- emerald "Proxy & Rate Limiting Guard": ["ClientIpResolver inspects x-vercel-forwarded-for and validates IP literals with InetAddress", "Prevents reverse proxy IP clustering where all visitors shared a single bucket", "RateLimitInterceptor returns HTTP 429 with explicit Retry-After headers"]
- violet "Session Persistence & OAuth": ["Spring Session JDBC persists sessions in PostgreSQL across server cold starts and deploys", "Dual-chain security architecture separates stateful web UI from stateless Bearer MCP", "Full OAuth 2.0 authorization server supports dynamic client registration (RFC 7591)"]
- amber "Cryptographic Protection": ["AES-256-GCM encryption for stored user BYOK API keys using APP_ENCRYPTION_KEY", "Content Security Policy (CSP) and X-Frame-Options: DENY prevent clickjacking", "Prometheus actuator endpoint (/actuator/prometheus) protected by METRICS_TOKEN"]
```

### Prompt 8: Infrastructure, CI/CD, and Observability
```text
Use Archify to diagram architecture for "Hackathon OS (Brackit) - Infrastructure, CI/CD & Observability".
Nodes:
- dev_git [40, 300] (external, "Git Repository", sublabel: "Push to main", tag: "GitHub Repo")
- playwright_e2e [250, 130] (backend, "Test Automation", sublabel: "Vitest + Playwright", tag: "E2E + Unit")
- github_actions [250, 300] (cloud, "GitHub Actions", sublabel: "Java 25 + Node 20", tag: "Postgres 17 Svc")
- loadtest_suite [250, 470] (backend, "Loadtest Suite", sublabel: "loadtest/run.mjs", tag: "Autocannon")
- gmail_smtp [460, 130] (cloud, "Gmail SMTP", sublabel: "Outbox Dispatcher", tag: "TLS :587")
- vercel_cdn [460, 300] (cloud, "Vercel Frontend", sublabel: "Edge CDN & Rewrites", tag: "SPA Hosting")
- system_logs [460, 470] (messagebus, "Structured Logs", sublabel: "MDC [requestId]", tag: "Logback")
- cloudflare_r2 [670, 130] (cloud, "Cloudflare R2", sublabel: "Object Storage", tag: "S3-Compatible")
- render_app [670, 300] (backend, "Render Web Svc", sublabel: "Spring Boot Docker", tag: "Port 10000")
- prometheus_metrics [670, 470] (security, "Prometheus Actuator", sublabel: "/actuator/prometheus", tag: "METRICS_TOKEN")
- render_db [880, 300] (database, "Render Postgres", sublabel: "PostgreSQL 17 DB", tag: "Hikari 10 Conn")
Boundaries:
- region "Continuous Integration Pipeline" wraps ["dev_git", "github_actions", "playwright_e2e", "loadtest_suite"]
- region "Edge Delivery & Logging" wraps ["vercel_cdn", "system_logs"]
- region "Cloud Compute & Database Tier" wraps ["render_app", "render_db", "prometheus_metrics"]
- region "External Cloud Services" wraps ["cloudflare_r2", "gmail_smtp"]
Connections:
- dev_git -> github_actions (label: "Push Trigger", variant: emphasis) [PRIMARY]
- github_actions -> playwright_e2e (label: "Run Matrix")
- github_actions -> loadtest_suite (label: "Perf Baseline", labelDy: 24)
- github_actions -> vercel_cdn (label: "Deploy Edge", variant: emphasis) [PRIMARY]
- vercel_cdn -> render_app (label: "Reverse Proxy", variant: emphasis) [PRIMARY]
- render_app -> render_db (label: "TCP :5432", variant: emphasis) [PRIMARY]
- render_app -> cloudflare_r2 (label: "S3 Protocol")
- render_app -> gmail_smtp (label: "SMTP :587")
- render_app -> prometheus_metrics (label: "Scrape Target", variant: security, labelDy: 24)
- render_app -> system_logs (label: "MDC Output")
Detail Cards:
- cyan "GitHub Actions CI": ["Runs on every push to main with parallel backend and frontend jobs", "Spins up postgres:17-alpine service container with UTC timezone options", "Executes Maven compile, static forbidden syntax scans, and unit tests"]
- emerald "Dual-Cloud Hosting": ["Vercel hosts the React 19 Single Page Application and edge rewrites", "Render hosts the containerized Spring Boot 4.1 / Java 25 web application", "Managed PostgreSQL 17 on Render with strict connection limits (pool size 10)"]
- violet "External Infrastructure": ["Cloudflare R2 provides zero-egress S3-compatible storage for pitch media", "Gmail SMTP configured with transactional retry worker reading email_outbox table", "Local Docker Compose manifests provided for full offline reproduction"]
- amber "Observability & Alerting": ["Spring Actuator Prometheus endpoint scraped securely using Bearer METRICS_TOKEN", "RequestIdFilter logs execution durations and flags slow requests (>1500ms)", "ClientErrorController captures frontend exception telemetry and stores in DB"]
```

### Prompt 9: Sequence of Main User Journey
```text
Use Archify to diagram sequence for "Hackathon OS (Brackit) - End-to-End User Hackathon Journey".
Participants:
- user (external, "Team Leader", sublabel: "Browser / UI")
- ui (frontend, "React 19 UI", sublabel: "App Shell")
- api (backend, "Spring Boot", sublabel: "REST API")
- ai (backend, "AiService", sublabel: "AI Gateway")
- llm (external, "Groq LLM", sublabel: "Llama 3.3 70B")
- db (database, "PostgreSQL", sublabel: "Persistence")
- sse (messagebus, "EventHub", sublabel: "SSE Live Sync")
Segments:
- 150 to 350: "1. Intake & Multimodal OCR"
- 360 to 625: "2. AI 4-Step Planning Generation"
- 635 to 825: "3. Live Execution & Reality Sync"
- 835 to 1030: "4. Pitch Teleprompter & Submission"
Messages:
- user -> ui (y: 180, label: "Upload problem PDF/images", variant: emphasis)
- ui -> api (y: 215, label: "POST /brief/source/images", variant: emphasis)
- api -> ai (y: 250, label: "Extract rules & rubrics", variant: emphasis)
- ai -> api (y: 285, label: "Extracted rubric weights", variant: return)
- api -> db (y: 320, label: "Save brief rules & rubrics")
- user -> ui (y: 390, label: "Click 'Generate Plan'", variant: emphasis)
- ui -> api (y: 425, label: "POST /plan/steps/1/generate", variant: emphasis)
- api -> ai (y: 460, label: "Assemble context + prompt", variant: emphasis)
- ai -> llm (y: 495, label: "POST /chat/completions (JSON)", variant: emphasis)
- llm -> ai (y: 530, label: "PRD & MVP markdown bundle", variant: return)
- ai -> api (y: 565, label: "Parsed & validated headings", variant: return)
- api -> db (y: 600, label: "Store versioned documents", variant: emphasis)
- api -> sse (y: 655, label: "Publish 'plan.updated' event", variant: dashed)
- sse -> ui (y: 690, label: "Push live sync to all members", variant: dashed)
- user -> ui (y: 725, label: "Move task to 'IN_PROGRESS'", variant: emphasis)
- ui -> api (y: 760, label: "PATCH /board/tasks/{id}", variant: emphasis)
- api -> sse (y: 795, label: "Broadcast 'board.task_moved'", variant: dashed)
- user -> ui (y: 860, label: "Rehearse pitch with mic audio", variant: emphasis)
- ui -> api (y: 895, label: "POST /pitch/rehearsals/audio", variant: emphasis)
- api -> ai (y: 930, label: "Whisper STT pace analysis")
- api -> user (y: 965, label: "WPM telemetry & feedback", variant: return)
- user -> ui (y: 1000, label: "Leader sign-off & submission", variant: emphasis)
Detail Cards:
- cyan "Phase 1: Brief & Intake": ["Multimodal OCR parses competition PDFs and rubric tables", "Leader enforces mandatory confirmation toggles before ideation unlocks", "Rules engine flags forbidden technologies and judging priorities"]
- emerald "Phase 2: 4-Step Planning": ["Assembles room context into 4 structured markdown files (PRD, Stack, Phases, Demo)", "Enforces strict heading hierarchies and automated repair prompts", "Persists versioned documents in PostgreSQL vault with ZIP export"]
- violet "Phase 3: Real-Time Execution": ["RoomChangeInterceptor broadcasts state mutations over Server-Sent Events", "Clients receive debounced query invalidation preventing UI desync", "Lead approvals protect critical task completions and phase transitions"]
- amber "Phase 4: Pitch & Final Submission": ["Web Audio API teleprompter records rehearsal audio for speech analysis", "SubmissionLinkCheckJob validates live demo links and GitHub repos", "Red stamp leader sign-off seals the final flight checklist"]
```

### Prompt 10: Sequence of Autonomous Agent MCP Planning Loop
```text
Use Archify to diagram sequence for "Hackathon OS (Brackit) - Autonomous Agent MCP Planning Loop".
Participants:
- agent (external, "AI Agent", sublabel: "Claude/Cursor/AGY")
- mcp (backend, "Brackit MCP", sublabel: "Node.js Server")
- auth (security, "OAuth Guard", sublabel: "RFC 6749 Bearer")
- api (backend, "Spring API", sublabel: "McpController")
- val (backend, "PlanValidator", sublabel: "Headings Engine")
- vault (database, "Docs Vault", sublabel: "PostgreSQL Store")
Segments:
- 150 to 345: "1. Discover & Inspect Brief"
- 355 to 585: "2. Delimited Bundle Submission"
- 595 to 825: "3. Automated Heading Repair Loop"
- 835 to 1020: "4. Persistence & Direct Team Link"
Messages:
- agent -> mcp (y: 180, label: "Tool call: 'list_rooms'", variant: emphasis)
- mcp -> auth (y: 215, label: "Validate Bearer token", variant: security)
- auth -> api (y: 250, label: "GET /api/v1/mcp/rooms")
- api -> mcp (y: 285, label: "Active rooms + member roles", variant: return)
- agent -> mcp (y: 320, label: "Tool call: 'get_step_brief(id, prd)'", variant: emphasis)
- mcp -> api (y: 385, label: "GET /mcp/rooms/{id}/steps/prd/brief")
- api -> agent (y: 420, label: "Instructions, context & expected files", variant: return)
- agent -> mcp (y: 465, label: "Submit =====FILE===== bundle", variant: emphasis)
- mcp -> api (y: 505, label: "POST /steps/prd/submit", variant: emphasis)
- api -> val (y: 545, label: "Validate headings & length")
- val -> api (y: 625, label: "Error: Missing 'Reality check' section", variant: dashed)
- api -> mcp (y: 665, label: "400 + targeted repairPrompt", variant: return)
- mcp -> agent (y: 705, label: "Fix and resubmit instructions", variant: dashed)
- agent -> mcp (y: 745, label: "Resubmit corrected bundle", variant: emphasis)
- mcp -> val (y: 785, label: "Re-verify heading hierarchy", variant: emphasis)
- val -> vault (y: 860, label: "Save versioned PRD & MVP docs", variant: emphasis)
- vault -> api (y: 900, label: "DocVersion record created", variant: return)
- api -> mcp (y: 940, label: "200 OK + webUrl link", variant: return)
- mcp -> agent (y: 980, label: "Final summary + team URL", variant: emphasis)
Detail Cards:
- cyan "Room & Brief Discovery": ["Agent calls list_rooms to enumerate hackathon rooms where user has LEADER/BUILDER role", "get_step_brief returns strict instructions, rubric weights, and =====FILE===== formatting rules", "Read-only tools are marked with readOnlyHint: true in MCP tool registration"]
- emerald "Delimited Bundle Submission": ["submit_step_document accepts multi-file bundles bounded by 200,000 character payload limits", "Transmits confirm=false by default and flags non-fatal ambiguities needing user approval", "Handles Render 60-second cold-start delays transparently in the client"]
- violet "Automated Heading Repair": ["PlanValidator compares Markdown AST against plan-headings.json requirements", "Generates structured repair prompts highlighting exact missing H2 sections or length deficiencies", "Caps autonomous agent retries at 3 attempts before escalating to the human user"]
- amber "Persistence & Team Handoff": ["Valid submissions write versioned markdown rows to postgres doc_versions table", "Returns direct web link (e.g. /app/room/{id}/docs) for immediate team review in UI", "Agent outputs a concise 3-5 line confirmation rather than echoing full text"]
```

### Prompt 11: One-Page Explainer
```text
Use Archify to create an explainer titled "How Hackathon OS (Brackit) Works".
Answer:
- Summary: "Hackathon OS coordinates 24-48 hour teams through a linear execution operating system. It combines real-time SSE live sync with an automated backend AI gateway."
- Reasons:
  - "Enforces mandatory rubric confirmation gates before coding begins, preventing disqualified submissions."
  - "Replaces unstructured chat chaos with synchronized workspaces: Silent Ideation, 4-Step Plan Vault, and Kanban Board."
  - "Synchronizes all teammates in real time via virtual-threaded Server-Sent Events with optimistic locking."
- Scope: "Covers React 19 + Vite frontend, Spring Boot 4.1 backend, PostgreSQL 17, and Groq-hosted LLaMA 3.3 70B & Whisper STT AI gateway."
Panels:
1. Steps panel "How does a team progress from brief intake to final pitch?":
   - "1. Intake & Rules Extraction": Multimodal OCR ingests competition PDFs. The team leader confirms every extracted rule before ideation unlocks.
   - "2. Silent Solo Storming": Members draft ideas without bias until revealed. AI stress tests feasibility before the room locks a winner.
   - "3. 4-Step Planning Vault": AiService generates PRD, Architecture, Phases, and Demo Script into a versioned 9-doc Markdown vault.
   - "4. Execution & Reality Sync": Phase-driven Kanban board coordinates tasks with dependency checks. Reality Ledger tracks what was actually built.
   - "5. Pitch Kit & Final Sign-off": Live mic telemetry evaluates pace, Judge's Chair trains defense, and link checkers verify repos before sign-off.
2. Comparison panel "Why do ad-hoc teams lose compared to Brackit-guided teams?":
   - Row "Rules & Rubrics": Brackit enforces mandatory leader confirmation gate (Zero rule disqualifications) vs. Unread rules in scattered PDFs (Frequent rubric penalties).
   - Row "Ideation & Scope": Silent card reveal + AI reality stress test (Feasible MVP scope) vs. Loudest-voice debates & overscoping (Broken demo at judging).
   - Row "State Synchronization": Virtual-threaded SSE streams + optimistic lock (Zero UI desync) vs. Buried messages and manual check-ins (Duplicated work & panic).
   - Row "Pitch Preparation": Teleprompter + Whisper STT pace telemetry (Rehearsed 3-minute delivery) vs. Slides thrown together in last 15 minutes (Unrehearsed presentation).
3. List panel "What architectural safeguards guarantee production stability?":
   - "Reverse Proxy IP Resolution: ClientIpResolver parses x-vercel-forwarded-for literals, preventing shared 429 rate limit buckets."
   - "Circuit Breaking & Bulkheads: ExternalCallBulkhead isolates Groq LLM calls (max 6 concurrent) with 45-second timeouts."
   - "Distributed PostgreSQL Locks: Advisory locks 1010L and 1011L ensure scheduled jobs never execute concurrently across instances."
   - "Spring Session Persistence: JDBC-backed HTTP sessions prevent user logout storms during container redeployments and cold starts."
Sources:
- "BriefService: Multimodal statement intake & rules engine" -> https://github.com/Chirag-2318/hackathon-os/blob/main/backend/src/main/java/com/hackathonos/backend/brief/BriefService.java
- "IdeasService: Silent ideation & AI stress testing" -> https://github.com/Chirag-2318/hackathon-os/blob/main/backend/src/main/java/com/hackathonos/backend/ideas/IdeasService.java
- "PlanPromptService: 4-step dynamic planning & heading validation" -> https://github.com/Chirag-2318/hackathon-os/blob/main/backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java
- "BoardController: Phase-driven Kanban board with task dependencies" -> https://github.com/Chirag-2318/hackathon-os/blob/main/backend/src/main/java/com/hackathonos/backend/tasks/BoardController.java
- "PitchKitController: Speech teleprompter & judge Q&A simulator" -> https://github.com/Chirag-2318/hackathon-os/blob/main/backend/src/main/java/com/hackathonos/backend/pitchkit/PitchKitController.java
```

---

# 9. Gaps, Risks, and Assumptions

### Verified Findings (Observed Directly in Code)
1. **[VERIFIED] Single Reverse-Proxy Rate Limit Clustering Resolution:** Previously, because traffic traverses Vercel's edge proxy before reaching Render, the backend rate-limited requests using direct socket IP literals. As a result, all global visitors shared a single 60 req/min unauthenticated bucket, exhausting login requests. This was resolved in Step 10 by [`ClientIpResolver.java`](file:///backend/src/main/java/com/hackathonos/backend/common/security/ClientIpResolver.java) which validates IPv4/IPv6 literals from `x-vercel-forwarded-for` and raises unauth limits to 120/min.
2. **[VERIFIED] PostgreSQL JDBC Instant Type Incompatibility:** Scheduled cleanup queries previously failed with `PSQLException: bad SQL grammar` when raw `java.time.Instant` instances were bound to `JdbcClient` parameters. Fixed in [`CleanupJob.java`](file:///backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java) and [`IdempotencyService.java`](file:///backend/src/main/java/com/hackathonos/backend/common/idempotency/IdempotencyService.java) by explicitly binding `java.sql.Timestamp.from(instant)`.
3. **[VERIFIED] Advisory Lock Collision Resolution:** Both `CleanupJob` and `DeadlineReminderJob` previously attempted to acquire advisory lock `1005L`. This was resolved by reassigning `DeadlineReminderJob` to lock `1010L` and `SubmissionLinkCheckJob` to lock `1011L`.
4. **[VERIFIED] Zero-Storage Client Contract:** The frontend strictly respects security mandates: no access tokens, refresh tokens, user profiles, or BYOK API keys are stored in browser `localStorage` or `sessionStorage`. All auth rests on HTTP-only `JSESSIONID` cookies serialized in PostgreSQL.
5. **[VERIFIED] Strict Headings AST Validator:** Generated planning documents are not accepted on raw text presence alone. [`PlanService`](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanService.java) matches exact H2 headings (e.g., "Rubric strategy", "Reality check") and minimum character bounds defined in [`plan-headings.json`](file:///backend/src/main/resources/plan-prompts/plan-headings.json).
6. **[VERIFIED] S3 & R2 Path-Style Toggle:** Object storage dynamically toggles between Virtual-Hosted Style and Path-Style (`s3.path-style: false` for Cloudflare R2 / AWS S3, `true` for local MinIO).

### Inferred & Architectural Assumptions
1. **[INFERRED] Single-Instance Event Bus Production Assumption:** While [`RoomEventHub.java`](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java) provides an abstraction for a PostgreSQL `LISTEN/NOTIFY` distributed bus, the default production deployment currently runs as a single Render container with `EVENTS_BUS: postgres` or `local`. Scaling horizontally to multiple Render web dynos requires PostgreSQL connection pool headroom beyond the current 10-connection limit.
2. **[INFERRED] Groq Rate Limit Ceiling Under Event Peak:** If multiple hackathon rooms simultaneously trigger Step 1 (PRD generation) and Pitch STT audio transcription during the final hour of a competition, Groq's Tier-1 API rate limits (tokens-per-minute) may throttle before the backend's internal semaphore (6 concurrent) exhausts. BYOK key resolution mitigates this for teams with private keys.
3. **[INFERRED] Cold-Start Impact on Render Free Tier:** On Render starter/free tiers, backend containers spin down after 15 minutes of inactivity. First-load latency can reach 50–60 seconds. The frontend mitigates this through [`ServerWakingOverlay`](file:///frontend/src/components/ServerWakingOverlay.tsx) and MCP client's 60-second fetch timeout budget.

