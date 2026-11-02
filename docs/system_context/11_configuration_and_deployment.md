# 11. Configuration & Deployment (Render & Vercel Focus)

## 11.1 Complete Environment Variables Inventory
The table below inventories all environment variables recognized by the backend. **Real secrets are excluded.**

| Variable Name | Required in Prod | Default Value (Dev) | Description | What Breaks if Missing or Misconfigured |
|---|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **Yes** | `dev` | Active Spring profile (`dev`, `prod`, `test`) | In production, if not set to `prod`, Swagger UI and dev endpoints are exposed, and production validations are skipped. |
| `PORT` | **Yes** | `8080` (dev) / `10000` (prod) | HTTP listening port bound by Tomcat | Render fails port binding check if not matching container port (10000). Container fails health check. |
| `SPRING_DATASOURCE_URL` | **Yes** | `jdbc:postgresql://localhost:5432/hackathon_os` | PostgreSQL JDBC connection URL | In `prod`, constructed from `DB_HOST`, `DB_PORT`, `DB_NAME`. Application crashes at boot if database unreachable. |
| `DB_HOST` | **Yes** (prod) | None | Render PostgreSQL internal hostname | `ProductionStartupValidator` fails startup with fatal configuration error. |
| `DB_PORT` | No | `5432` | Render PostgreSQL port | Defaults to 5432. |
| `DB_NAME` | **Yes** (prod) | None | Render PostgreSQL database name | `ProductionStartupValidator` fails startup. |
| `DB_USERNAME` | **Yes** (prod) | `hackathon` | PostgreSQL database user | Database authentication fails; Spring aborts boot. |
| `DB_PASSWORD` | **Yes** (prod) | `hackathon` | PostgreSQL database password | Database authentication fails; Spring aborts boot. |
| `DB_POOL_SIZE` | No | `5` (prod) / `10` (dev) | Maximum HikariCP connection pool size | Defaults to 5 in prod. Heavy load queues requests on Hikari. |
| `APP_PUBLIC_URL` | **Yes** | `http://localhost:5173` | Public URL of frontend (Vercel) without trailing slash | `ProductionStartupValidator` fails if contains "localhost" in prod. OAuth redirects fail; CORS blocks requests. |
| `API_PUBLIC_URL` | **Yes** | `http://localhost:8080` | Public URL of backend (Render) without trailing slash | `ProductionStartupValidator` fails if contains "localhost" in prod. |
| `APP_BASE_URL` | No | `http://localhost:8080` | Backend internal/base URL | If missing on Render, GitHub OAuth linking and Canva OAuth redirect to `localhost:8080`. |
| `COOKIE_SECURE` | **Yes** (prod) | `false` (dev) / `true` (prod) | Require HTTPS for session and CSRF cookies | If `false` in production, cookies vulnerable to interception; if `true` in local HTTP, cookies rejected. |
| `COOKIE_SAME_SITE` | No | `Lax` | SameSite attribute for session cookies | Defaults to `Lax`. |
| `COOKIE_DOMAIN` | No | Empty (host-only) | Cookie domain attribute | Must remain empty for Vercel host-only cookies. |
| `APP_ENCRYPTION_KEY` | **Yes** | None | 32-byte AES-256-GCM encryption key | `ProductionStartupValidator` crashes startup if missing or <16 chars. Token encryption/decryption fails. |
| `GITHUB_CLIENT_ID` | **Yes** | `dummy-github-client-id` | GitHub OAuth App Client ID | `ProductionStartupValidator` crashes startup if placeholder in prod. GitHub login fails. |
| `GITHUB_CLIENT_SECRET` | **Yes** | `dummy-github-client-secret` | GitHub OAuth App Client Secret | `ProductionStartupValidator` crashes startup if placeholder in prod. GitHub login fails. |
| `GOOGLE_CLIENT_ID` | **Yes** | `dummy-google-client-id` | Google Cloud OAuth 2.0 Client ID | `ProductionStartupValidator` crashes startup if placeholder in prod. Google login fails. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | `dummy-google-client-secret` | Google Cloud OAuth 2.0 Client Secret | `ProductionStartupValidator` crashes startup if placeholder in prod. Google login fails. |
| `ADMIN_EMAILS` | **Yes** | None | Comma-separated admin email addresses | `ProductionStartupValidator` crashes startup if missing or no `@` in prod. Admin endpoints return 404. |
| `SUPPORT_EMAIL` | **Yes** | None | Support email address shown in error payloads | `ProductionStartupValidator` crashes startup if missing or no `@` in prod. |
| `AI_BASE_URL` | **Yes** | `https://api.groq.com/openai/v1` | Base URL for LLM provider gateway | AI features (plan, brief, audit, Q&A) fail if unreachable. |
| `AI_API_KEY` | **Yes** | None | Server-side platform AI API key | AI prompts fail with 401 Bad Gateway unless user supplies BYOK key. |
| `AI_MODEL_DEFAULT` | No | `llama-3.3-70b-versatile` | Default model for planning & chat | Defaults to Llama 3.3 70B. |
| `AI_MODEL_FAST` | No | `llama-3.1-8b-instant` | Lightweight fast model for quick suggestions | Defaults to Llama 3.1 8B. |
| `AI_MODEL_SMART` | No | `llama-3.3-70b-versatile` | High-reasoning model for planning & critique | Defaults to Llama 3.3 70B. |
| `AI_PLATFORM_FALLBACK` | **Yes** (prod) | `false` | Prevent platform subsidizing user AI calls | Must be `false` in prod; `ProductionStartupValidator` crashes startup if `true`. |
| `STT_BASE_URL` | No | Same as `AI_BASE_URL` | Whisper Speech-to-Text API base URL | Rehearsal audio transcription fails if invalid. |
| `STT_API_KEY` | No | Same as `AI_API_KEY` | Whisper Speech-to-Text API Key | Rehearsal audio transcription fails if invalid. |
| `STT_MODEL` | No | `whisper-large-v3` | Whisper model for rehearsal transcription | Defaults to `whisper-large-v3`. |
| `MAIL_ENABLED` | **Yes** | `false` | Toggle transactional email sending | If `false`, emails are not sent (logged or queued). If `true`, SMTP variables become required. |
| `MAIL_HOST` | If mail on | `smtp.gmail.com` | SMTP host | `ProductionStartupValidator` checks if `MAIL_ENABLED=true`. |
| `MAIL_PORT` | If mail on | `587` | SMTP port | Standard submission port 587. |
| `MAIL_USERNAME` | If mail on | None | Gmail sender email address | `ProductionStartupValidator` checks for `@`. |
| `MAIL_APP_PASSWORD` | If mail on | None | Gmail 16-character App Password | SMTP authentication fails if missing. |
| `MAIL_FROM_ADDRESS` | No | Same as `MAIL_USERNAME` | From header email address | Defaults to `MAIL_USERNAME`. |
| `APP_UPLOAD_DIR` | No | `./uploads` (dev) / `/app/uploads` | Path to avatar storage directory | Avatars fail to persist if directory not writable. |
| `APP_GITHUB_TOKEN` | No | None | Personal access token for repository stats | Repository commit sync falls back to user token or fake data. |
| `APP_GITHUB_USE_FAKE` | No | `false` | Simulate GitHub responses if token is absent | Dev testing flag. |
| `GITHUB_LINK_CLIENT_ID` | No | None | Client ID for in-app GitHub repository link | In-app repo linking disabled if missing. |
| `GITHUB_LINK_CLIENT_SECRET`| No | None | Client Secret for in-app GitHub repo link | In-app repo linking disabled if missing. |
| `CANVA_CLIENT_ID` | No | None | Canva Connect integration Client ID | Canva integration disabled if missing. |
| `CANVA_CLIENT_SECRET` | No | None | Canva Connect integration Client Secret | Canva integration disabled if missing. |

---

## 11.2 Build, Startup & Container Configuration
- **Dockerfile ([backend/Dockerfile](file:///backend/Dockerfile))**:
  - Multi-stage build based on `eclipse-temurin:25-jdk-alpine` builder and `eclipse-temurin:25-jre-alpine` runtime.
  - Runs as non-root user `appuser:appgroup` (UID/GID created in container).
  - Port binding: `ENV PORT=10000`, `EXPOSE 10000`. Spring Boot binds to `0.0.0.0:10000`.
  - JVM Flags tuned for 512 MB RAM ceiling:
    ```bash
    JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
    ```
    - `-XX:MaxRAMPercentage=65`: Limits heap to ~332 MB in a 512 MB container.
    - `-XX:MaxMetaspaceSize=128m`: Prevents class metadata from consuming remaining native memory.
    - `-XX:+UseSerialGC`: Minimal GC memory overhead (avoids G1 multi-threaded GC memory buffers).
    - `-XX:TieredStopAtLevel=1`: Stops JIT at C1 compiler (reduces JIT compilation memory; increases startup speed, but sacrifices peak throughput).
    - `-Xss512k`: Reduces thread stack size from default 1 MB to 512 KB.
- **Health Check Endpoint**:
  - `GET /api/v1/health` ([PublicHealthController.java](file:///backend/src/main/java/com/hackathonos/backend/common/PublicHealthController.java)).
  - Returns `{"status":"ok"}` with HTTP 200 immediately.
  - **Does not touch the database**, allowing Render's container health check to pass during cold start before database migrations or connection pool initialization complete.
  - Permitted without authentication or CSRF in `SecurityConfig.java:144`.
- **Graceful Shutdown**:
  - `server.shutdown: graceful` ([application.yml:4](file:///backend/src/main/resources/application.yml#L4)).
  - `spring.lifecycle.timeout-per-shutdown-phase: 30s` ([application.yml:61](file:///backend/src/main/resources/application.yml#L61)).
  - `RoomEventHub.shutdown()` ([RoomEventHub.java:413](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L413)) gracefully completes all open SSE emitters on `@PreDestroy`.

---

## 11.3 Localhost vs Hosted Environment Differences
| Characteristic | Localhost Development | Hosted Production (Render + Vercel) | Impact / Failure Mode |
|---|---|---|---|
| **Public URL** | `http://localhost:5173` | `https://<app>.vercel.app` | OAuth callback mismatch if URLs not aligned. |
| **API URL** | `http://localhost:8080` | `https://<backend>.onrender.com` | Handled via Vercel proxy rewrite. |
| **Cookie Security** | `COOKIE_SECURE=false`, `Lax` | `COOKIE_SECURE=true`, `Lax` | Cookies rejected by browser if HTTPS not enforced in prod. |
| **Reverse Proxy** | Direct connection to port 8080 | Vercel Edge Proxy -> Render Ingress | `x-vercel-forwarded-for` required for client IP rate limiting. |
| **File Uploads** | Local `./uploads` directory | `/app/uploads` inside container | Ephemeral on Render; files wiped on restart. |
| **Database Pool** | `maximum-pool-size: 10`, `idle: 2` | `maximum-pool-size: 5`, `idle: 1` | Connection starvation happens twice as fast in production. |
| **OpenAPI Docs** | `/swagger-ui.html` and `/v3/api-docs` | **Disabled** (`springdoc.api-docs.enabled: false`) | Swagger UI returns 404 in production. |
| **Dev Seeds** | `/api/v1/dev/**` available | **Disabled** (`SecurityConfig.java:171`) | Seed endpoint returns 401/403 in production. |

---

## 11.4 Code-Level Reasons for "Works on Localhost but Breaks on Render"
The following specific code-level mechanisms can cause the application to function locally but fail or crash when deployed to Render:

1. **`ProductionStartupValidator.java` Aborts Boot with `IllegalStateException`**:
   - In `prod` profile, `ProductionStartupValidator.run()` ([ProductionStartupValidator.java:33](file:///backend/src/main/java/com/hackathonos/backend/common/config/ProductionStartupValidator.java#L33)) scans all critical environment variables.
   - If `ADMIN_EMAILS`, `SUPPORT_EMAIL`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, or `APP_ENCRYPTION_KEY` are missing or contain placeholder strings (`"dummy"`, `"todo"`, `"changeme"`), **Spring Boot aborts startup immediately**.
2. **Cold-Start Delays on Free Tier (15-Minute Sleep)**:
   - Render's free tier spins down containers after 15 minutes of inactivity.
   - Booting Java 25, executing 44 Flyway migrations, and performing Hibernate schema validation across 116 tables takes **25 to 45 seconds**.
   - If a user sends a request while the service is sleeping, the request hangs until the container warms up or Vercel times out with a `504 Gateway Timeout`.
3. **Database Connection Pool Starvation (HikariCP Size = 5)**:
   - On localhost, pool size is 10. On Render, [application-prod.yml:21](file:///backend/src/main/resources/application-prod.yml#L21) restricts pool size to 5 to stay within free PostgreSQL connection limits.
   - Because 19 service methods make slow external LLM or Whisper calls inside `@Transactional`, **5 concurrent AI requests lock all 5 database connections for up to 45 seconds**.
   - All other incoming HTTP requests freeze and throw `SQLTransientConnectionException` after 10 seconds.
4. **Out-of-Memory (OOM) Container Kills (512 MB Ceiling)**:
   - The JVM heap is capped at ~332 MB, leaving ~180 MB for metaspace, OS threads, and native buffers.
   - Parsing large multi-page PDFs with Apache PDFBox (`BriefPdfParser.java`) or PPTX decks with Apache POI (`PitchDeckService.java`) creates large native memory spikes that can exceed 512 MB, causing Render's Linux kernel to abruptly kill the container (`SIGKILL / OOMKilled`).
5. **Session Loss on Restart / Sleep**:
   - User login sessions (`JSESSIONID`) are held strictly in Tomcat memory.
   - Every time Render sleeps or redeploys, all active sessions are wiped. Users are logged out instantly.
6. **Cross-Site OAuth Link Failure ([GitHubController.java:284](file:///backend/src/main/java/com/hackathonos/backend/github/GitHubController.java#L284))**:
   - `GitHubController.startLink` generates `redirect_uri` using `appProperties.getBaseUrl() + "/api/v1/github/link/callback"`.
   - In production, if `APP_BASE_URL` is unset, it defaults to `http://localhost:8080`.
   - If set to the Render hostname, the browser makes a cross-site GET request to Render directly, where Vercel host-only session cookies are unavailable. Session lookup fails, resulting in `reason=state_mismatch`.
7. **Ephemeral Uploads Storage**:
   - Avatars saved to `/app/uploads` disappear on every restart.
