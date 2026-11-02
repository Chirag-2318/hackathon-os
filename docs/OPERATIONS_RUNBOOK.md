# Brackit Operations Runbook: Production Hardening, Observability & Deployment

**System:** Brackit (Modular Monolith)  
**Backend:** Spring Boot 4.1.x / Java 25 (Render Web Service)  
**Frontend:** React 19 + TypeScript + Vite (Vercel)  
**Database:** PostgreSQL 17 + Flyway Migrations (Render Managed Postgres)  
**Author:** Engineering Team  
**Last Updated:** November 2026  

---

## 1. Hosting Architecture & Service Layout

```
                  +---------------------------------------------+
                  |         Vercel Edge Network (CDN)           |
                  |  - Frontend SPA (React 19 + Vite + PWA)     |
                  |  - Static Assets, Service Worker Shell       |
                  |  - Cold Start "Waking Up" Overlay Banner    |
                  +----------------------+----------------------+
                                         |
                       HTTPS API Requests (with Cookie)
                                         |
                                         v
                  +---------------------------------------------+
                  |           Render Web Service                |
                  |  - Spring Boot 4.1.x Monolith (Docker)      |
                  |  - Tomcat with Java 25 Virtual Threads      |
                  |  - SSE Event Stream Engine (Local/Postgres) |
                  |  - Rate Limiter & Concurrency Bulkheads     |
                  +----------------------+----------------------+
                                         |
                       HikariCP Pool (DB_POOL_SIZE <= 10)
                                         |
                                         v
                  +---------------------------------------------+
                  |           Render Managed PostgreSQL         |
                  |  - PostgreSQL 17 (Flyway schema V1..V47)    |
                  |  - Spring Session JDBC (SPRING_SESSION)     |
                  |  - Advisory Locks & Persistent State        |
                  +---------------------------------------------+
```

---

## 2. Pre-Deployment Configuration & Checklist

### 2.1 Database Connection Pool Sizing (`DB_POOL_SIZE`)
- **Default Pool Size:** `10` connections per app container.
- **Formula:**
  $$\text{DB\_POOL\_SIZE} \le \frac{\text{PostgreSQL } \text{max\_connections} - \text{Headroom}}{\text{Number of App Instances}}$$
- **Headroom Considerations:**
  - Render Managed Postgres Starter Tier: `max_connections = 97` (typical).
  - Reserve **15 connections** for database administrative tasks, `pg_dump`, Flyway migration boots, and advisory locks.
  - For 1 backend container instance: Set `DB_POOL_SIZE=10` (max `15`).
  - For 2 backend container instances: Set `DB_POOL_SIZE=8` each.
  - Under no circumstances should pool size be set >20 on Starter or Pro tiers without verifying `SELECT current_setting('max_connections');`.

### 2.2 Critical Environment Variables Reference
Ensure all required production variables are set in the Render Web Service dashboard (use `render-env.template` as a model):

| Variable | Required | Description | Example / Recommendation |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **YES** | Active profile | `prod` |
| `PORT` | **YES** | Application listen port | `10000` (Render default) |
| `APP_PUBLIC_URL` | **YES** | Canonical Vercel frontend URL (no trailing slash) | `https://bracket-app.vercel.app` |
| `API_PUBLIC_URL` | **YES** | Canonical Render backend URL (no trailing slash) | `https://bracket-api.onrender.com` |
| `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | **YES** | Managed PostgreSQL connection credentials | Provided by Render PostgreSQL |
| `DB_POOL_SIZE` | **YES** | Maximum HikariCP pool connections | `10` |
| `APP_ENCRYPTION_KEY` | **YES** | AES-256-GCM 32-byte secret (Base64 or 64 hex characters) | `openssl rand -hex 32` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | **YES** | OAuth2 Login credentials | From GitHub Developer Console |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | **YES** | OAuth2 Login credentials | From Google Cloud Console |
| `METRICS_TOKEN` | **YES** | Secret bearer token required for `/actuator/prometheus` | High-entropy random string |
| `PROXY_SHARED_SECRET` | Optional | Shared secret between Vercel proxy & Render backend | Matches `x-proxy-secret` header |
| `MAIL_PROVIDER` | Optional | Outgoing mail provider (`smtp`, `resend`, `log`) | `resend` (recommended) or `smtp` |
| `RESEND_API_KEY` | Optional | API key for Resend HTTPS delivery | Required if `MAIL_PROVIDER=resend` |
| `STORAGE_PROVIDER` | Optional | Storage backend (`s3` or `local`) | `s3` (recommended for persistent avatars) |
| `SENTRY_DSN` | Optional | Backend Sentry DSN for error telemetry | `https://...@sentry.io/...` |

---

## 3. Health & Readiness Probes

### 3.1 Render Health Check Probe
- **Path:** `/api/v1/health`
- **Method:** `GET`
- **Behavior:** Pure in-memory check. Returns `{"status":"ok"}` in `<1ms` without querying PostgreSQL or any third-party APIs.
- **Purpose:** Cloud container startup liveness check. Prevents Render health check timeout during cold starts or transient DB saturation.

### 3.2 Deep Readiness Probe
- **Path:** `/api/v1/health/ready`
- **Method:** `GET`
- **Behavior:** Performs `SELECT 1` with a strict `1-second` query timeout.
- **Responses:**
  - `200 OK`: `{"status":"UP","database":"UP"}`
  - `503 SERVICE UNAVAILABLE`: `{"status":"DOWN","database":"DOWN","error":"..."}`
- **Purpose:** Used by monitoring scripts, smoke tests, and ingress proxies to verify full end-to-end operational capacity.

---

## 4. Observability, Prometheus Metrics & Alerting

### 4.1 Securing Metrics Endpoint
Prometheus metrics are exposed at `/actuator/prometheus`.
Access is protected by bearer authentication:
```bash
# Scraping command:
curl -H "Authorization: Bearer $METRICS_TOKEN" https://bracket-api.onrender.com/actuator/prometheus
```
Unauthorized requests receive HTTP `403 Forbidden`.

### 4.2 Key Metrics and Alert Thresholds

| Metric Name | Type | Warning Threshold | Critical Threshold | Action Plan |
|---|---|---|---|---|
| `hikaricp.connections.pending` | Gauge | `> 2` for 1m | `> 5` for 30s | Database pool exhaustion. Check slow queries and connection holds. |
| `hikaricp.connections.active` | Gauge | `> 8` (of 10) | `= 10` for 1m | Pool at capacity. Check for unbounded transactions. |
| `ai.circuit_breaker.open` | Gauge | `1.0` | `1.0` for > 5m | Upstream AI provider (Groq) is failing consecutive requests. Fail fast is active. |
| `sse.connections.total` | Gauge | `> 500` | `> 1200` | High SSE concurrency. Verify stream eviction and disconnects. |
| `email.outbox.pending` | Gauge | `> 50` | `> 200` | Email worker backlog. Verify SMTP/Resend API quota and credentials. |
| `jvm.memory.used` (heap) | Gauge | `> 80%` of max | `> 92%` of max | Potential memory leak. Capture heap dump and inspect cache sizes. |
| `http.server.requests` (5xx rate) | Counter | `> 1%` of total | `> 5%` of total | Review application logs with `SERVER_ERROR` tag. |

### 4.3 Structured Logging for Investigations
- **Slow Requests:** Any HTTP request taking `> 1500ms` is logged at `WARN` with tag `SLOW_REQUEST`:
  ```
  WARN  SLOW_REQUEST: method=GET path=/api/v1/rooms/.../docs status=200 duration=1820ms user=usr_123 requestId=req_abc
  ```
- **Server Errors:** Any 5xx status response is logged at `ERROR` with tag `SERVER_ERROR`:
  ```
  ERROR SERVER_ERROR: method=POST path=/api/v1/rooms status=500 duration=45ms user=usr_456 requestId=req_xyz
  ```
- **Request Tracing:** The `requestId` in MDC maps 1:1 with the HTTP header `X-Request-Id` returned to the browser client and stored in client-error reports.

---

## 5. Free-Tier Limitations & Cold-Start Experience

### 5.1 Free-Tier Constraints (Render & Supabase/Neon)
1. **Container Sleep:** Free Render instances spin down after 15 minutes of zero HTTP traffic.
2. **Cold Start Time:** Booting a Java 25 / Spring Boot 4 application from sleeping container to live HTTP traffic takes **30 to 60 seconds**.
3. **Ephemeral Disk:** `/app/uploads` and local filesystem writes are wiped on every container sleep, restart, or deployment. `STORAGE_PROVIDER=s3` must be used for file persistence.

### 5.2 Frontend "Server Waking Up" Experience
- When a user lands on the frontend while the backend is sleeping, background API requests return `502 Bad Gateway`, `503 Service Unavailable`, or `504 Gateway Timeout`.
- Instead of showing multiple failing error toasts, the frontend activates the `ServerWakingOverlay`:
  - Calm, single full-screen notification explaining the cloud instance wake-up cycle.
  - Automatically polls `/api/v1/health` with exponential backoff (2s, 4s, 6s... up to 10s).
  - Automatically suppresses error toasts while waking up.
  - As soon as `/api/v1/health` returns `200 OK`, the overlay auto-dismisses and React Query invalidates all active queries to populate the UI.

---

## 6. Backup, Recovery & Disaster Drills

### 6.1 Database Backup Drill (`pg_dump`)
Run a daily cron or manual backup before major deployments:
```bash
# Export compressed binary database dump
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -Fc -f "brackit_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 6.2 Database Restore Drill (`pg_restore`)
```bash
# 1. Stop backend application to terminate active connection pools
# (In Render dashboard: Suspend Web Service)

# 2. Restore into target database
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME --clean --if-exists --no-owner --no-privileges "brackit_backup_YYYYMMDD_HHMMSS.dump"

# 3. Verify migration status
# Run Flyway info or check flyway_schema_history:
# SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

# 4. Resume backend Web Service
```

---

## 7. Rollback Procedures

### 7.1 Backend Code Rollback
1. In Render Dashboard: Open the Web Service -> **Deploys**.
2. Select the previous successful deployment and click **Rollback to this deploy**.
3. Note on Flyway: All database migrations `V1..V47` are backward-compatible. Schema additions are additive (`IF NOT EXISTS`, nullable columns or columns with default values). A backend rollback will run safely against the latest database schema.

### 7.2 Frontend Rollback
1. In Vercel Dashboard: Open Project -> **Deployments**.
2. Locate the previous production deployment and click **Promote to Production** (instant CDN pointer change).
