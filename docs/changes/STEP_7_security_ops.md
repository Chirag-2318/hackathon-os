# Step 7 Change Report: Security Verification, Observability, Cold-Start Experience, Mail Provider

## 1. Security Findings & Hardening Inventory

Every suspicious security point highlighted across system audit documents 05, 08, 11, 12, 13, 14, and 16 was inspected directly in the codebase and hardened.

| Surface / Endpoint | Audit Claim vs Reality | Hardening Action Taken |
| :--- | :--- | :--- |
| **Dev Endpoints** (`/api/v1/dev/**`) | Audit claimed dev endpoints were session-authenticated but accessible in prod. Reality: were enabled in all profiles unless specifically protected. | Annotated `DevController`, `DevSeedController`, `DevSeedService`, `DevService`, and `DemoRoomSeeder` with `@Profile("!prod")`. Permitted `/api/v1/dev/**` in `SecurityConfig` so unauthenticated requests reach DispatcherServlet, resulting in a clean **HTTP 404 Not Found** in production. Verified with `ProdSecurityProfileTest`. |
| **Dev Mail Endpoints** (`/api/v1/dev/mail/**`) | Dev-only mail simulation routes could leak or expose mail testing. | Annotated `DevMailController` with `@Profile("!prod")`, disabling it completely in production. |
| **Public Mentor Endpoints** (`/api/v1/mentor/**`) | Audit doc 05 claimed unauthenticated `GET /api/v1/mentor/rooms/{roomId}` existed. | **Claim Refuted:** Code inspection revealed `PublicMentorController` only exposes token-based routes (`/{token}/context` and `/{token}/ask`), mapped to unguessable `mentor_links` tokens. Added question length bounds (max 2000 chars) and verified via `PublicMentorSecurityTest`. |
| **Public Portfolio** (`/api/v1/portfolio/u/**`) | Unauthenticated access to user profiles. | Verified: Only returns public profile information (username, display name, public bio, public rooms) for users with `portfolio_enabled = true`. Returns 404 for disabled or non-existent portfolios. |
| **Invite Codes** (`GET /api/v1/invites/{code}`) | Public join code preview. | Token validation verified: rate-limited by `JoinAttemptLimiter` (5 attempts/15 min). Permitted `GET /api/v1/invites/**` in Spring Security without authentication so visitors can view room name before signing in. |
| **Public Mock Controller** (`/mock/**`) | Mock API hub routes potentially exposed in production. | Annotated `PublicMockController` with `@Profile("!prod")`. In production, beans do not exist and return **HTTP 404**. |
| **Client IP Resolution & Spoofing** | Audit noted client IP resolution relied on untrusted proxy headers (`X-Forwarded-For`, `x-vercel-forwarded-for`). | Hardened `ClientIpResolver`: parses rightmost untrusted hop in `X-Forwarded-For`; only trusts custom proxy headers (`x-vercel-forwarded-for`, `cf-connecting-ip`) if `x-proxy-secret` header matches configured `PROXY_SHARED_SECRET` (`app.proxy-shared-secret`). Falls back to direct socket `remoteAddr`. Tested in `ClientIpResolverTest`. |
| **Rate Limiting** (`RateLimitInterceptor`) | IP-based limits could be bypassed via spoofed upstream headers or exhaust app on unauth attacks. | Enhanced `RateLimitInterceptor`: added socket peer bucket (`global:unauth:peer:<remoteAddr>` at 60 req/min) and global unauth ceiling (`global:unauth:ceiling` at 1200 req/min). Added `@RateLimited` annotations to heavy endpoints: `downloadAllZip` (10/min), `exportRoom` (5/min), `search` (30/min). |
| **Public Write Abuse** (`PublicCapacityController`, `ClientErrorController`) | Unauthenticated forms could suffer payload abuse or storage exhaustion. | In `PublicCapacityController`, added max 254-character email length limit. In `ClientErrorService`, added scheduled retention cleanup pruning client errors older than 30 days (`@Scheduled(cron = "0 0 3 * * ?")`). |
| **CORS, CSRF & Cookie Configuration** | Missing response headers; CSRF ignoring rules. | Added `"X-Total-Count"` and `"X-Truncated"` to `CorsConfig.setExposedHeaders`. Cookie configured with `SameSite=Lax`, `HttpOnly=true`, and `Secure=true` in production. Added `/api/v1/dev/**` and `/mock/**` to CSRF ignoring rules. |
| **Swallowed Errors & Cryptography** | `SecretCipher` and 4 service methods had empty catch blocks swallowing critical exceptions. | Added `@PostConstruct` canary round-trip self-test to `SecretCipher` with secret-safe diagnostic logging (cipher length, cause, never plaintext). Fixed empty catches in `DocService` (non-UUID doc handling), `IdeasService` (async prepare warning), `AppSettingsService` (query size debug logging), and `RoomEventHub` (SSE emitter completions). |

---

## 2. Observability & Monitoring Additions

1. **Prometheus & Micrometer Metrics**:
   - Added dependency `io.micrometer:micrometer-registry-prometheus` to `backend/pom.xml`.
   - Exposed endpoints `/actuator/prometheus`, `/actuator/health`, and `/actuator/metrics`.
   - Created `AppMetricsConfig` registering custom gauges:
     - `hackathonos_sse_room_emitters_active`: Gauge of active SSE room streams.
     - `hackathonos_sse_notification_emitters_active`: Gauge of active notification SSE streams.
     - `hackathonos_sse_connections_total`: Sum of all live SSE connections.
     - `hackathonos_ai_circuit_breaker_state`: Binary gauge indicating AI circuit breaker state (0 = closed/normal, 1 = open/tripped).
     - `hackathonos_email_outbox_pending`: Pending emails awaiting dispatch.
2. **Prometheus Security**:
   - `/actuator/prometheus` is protected by `METRICS_TOKEN` bearer authorization.
   - Denies missing or mismatched `Authorization: Bearer <METRICS_TOKEN>` headers with HTTP 401/403.
   - Verified in `ProdSecurityProfileTest`.
3. **Health Probes**:
   - `/api/v1/health`: Shallow liveness probe (<1ms), no DB access, always responds `{"status":"ok"}`.
   - `/api/v1/health/ready`: Deep readiness probe, performs `SELECT 1` with a strict 1-second query timeout. Returns 200 `{"status":"ready"}` or 503 `{"status":"unavailable"}`.
4. **Structured Logging**:
   - Updated `RequestIdFilter` with execution timing:
     - Automatically logs `WARN` for slow requests (> 1500ms): `[SLOW_REQUEST] method=... uri=... status=... duration=...ms`.
     - Automatically logs `ERROR` for all 5xx responses: `[SERVER_ERROR] method=... uri=... status=... duration=...ms`.
     - Preserves MDC `requestId` throughout thread execution.
5. **Dormant Sentry SDK Integration**:
   - Backend `SentryService`: Initialized conditionally when `SENTRY_DSN` is non-empty. Scrubs PII (emails, auth tokens, passwords, bearer headers, session cookies) before event capture. Wired into `ApiExceptionHandler`.
   - Frontend `sentry.ts`: Initialized conditionally when `VITE_SENTRY_DSN` is set. Scrubs sensitive headers and parameters in `beforeSend`.

---

## 3. Cold Start Experience & Operational Resilience

1. **Frontend Server Waking Overlay**:
   - Created `frontend/src/components/ServerWakingOverlay.tsx`.
   - Wired into `api.ts` error handler and `App.tsx` root layout.
   - Activates when HTTP 502, 503, 504, or network fetch failure occurs.
   - Suppresses toast notification storms while backend boots.
   - Polls `/api/v1/health` with exponential backoff (1s -> 2s -> 4s up to 10s max).
   - Once server responds 200 OK, invalidates React Query caches and seamlessly resumes user session.
2. **Backend Graceful Shutdown**:
   - Implemented `@PreDestroy` hook in `RoomEventHub`: broadcasts `bye` (`server_shutdown`) events to all active room and notification SSE emitters before Tomcat terminates.
   - Prevents aggressive client reconnect loops during container deployments or rollouts.
3. **Operations Runbook**:
   - Authored complete operations guide in `docs/OPERATIONS_RUNBOOK.md`.
   - Covers Render production deployment checklist, database pool sizing formula (`DB_POOL_SIZE = (pg_max_conn - headroom) / instances`), environment variable reference, health probe configurations, metric alerting thresholds, backup/restore drills, rollbacks, and free-tier spin-down considerations.

---

## 4. Mail Transport Abstraction

1. **Transport Interface & Implementations**:
   - Created `MailTransport` interface in `com.hackathonos.backend.email`.
   - `SmtpMailTransport`: Production SMTP delivery via Spring `JavaMailSender` (supports TLS/STARTTLS).
   - `ResendMailTransport`: Direct HTTPS API delivery via Resend API (`https://api.resend.com/emails`).
   - `LogMailTransport`: Development/testing provider logging email payloads to SLF4J without network calls.
2. **Provider Selection**:
   - Configurable via `MAIL_PROVIDER=smtp|resend|log` (default: `smtp`).
   - `MailTransportConfig` selects bean dynamically based on `app.mail.provider`.
   - `MailWorker` dispatches background outbox emails through `MailTransport`.
3. **Startup Validation**:
   - `ProductionStartupValidator` enforces `RESEND_API_KEY` and `MAIL_FROM_ADDRESS` when `MAIL_PROVIDER=resend`.
   - Validates `MAIL_HOST`, `MAIL_USERNAME`, and `MAIL_APP_PASSWORD` when `MAIL_PROVIDER=smtp`.
   - Warns safely when `MAIL_PROVIDER=log` in production.

---

## 5. Verification & Test Results

1. **Backend Tests**:
   - `ProdSecurityProfileTest`: Verified that in `prod` profile, dev routes (`/api/v1/dev/**`) and mock routes (`/mock/**`) return HTTP 404, `/api/v1/health` returns HTTP 200, and `/actuator/prometheus` strictly requires `METRICS_TOKEN` Bearer auth.
   - `ClientIpResolverTest`: Verified rightmost hop extraction from `X-Forwarded-For` and `PROXY_SHARED_SECRET` enforcement on custom headers.
   - `SecretCipherTest`: Verified `@PostConstruct` canary round-trip self-test and AEAD tag mismatch error logging without leaking secrets.
   - `PublicMentorSecurityTest`: Verified mentor context and question submission require valid unguessable tokens and enforce question length constraints.
   - **Total Tests Run**: 9 passed, 0 failures, 0 errors.
2. **Frontend Tests & Build**:
   - Vitest suite: 10 tests across 3 test files passed (100%).
   - Vite production build (`tsc -b && vite build`): Bundled successfully with exit code 0.
