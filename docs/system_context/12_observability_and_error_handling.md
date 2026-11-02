# 12. Observability & Error Handling

## 12.1 Logging Architecture & Request Correlation
- **Logging Framework**: SLF4J with Logback configured via [backend/src/main/resources/logback-spring.xml](file:///backend/src/main/resources/logback-spring.xml).
- **Production Logging Level**: Set to `INFO` in [application-prod.yml:54](file:///backend/src/main/resources/application-prod.yml#L54). SQL logging and debug endpoints are strictly disabled in production (`spring.jpa.show-sql: false`, `hibernate.format_sql: false`).
- **Request Correlation (MDC)**:
  - Managed by [RequestIdFilter.java](file:///backend/src/main/java/com/hackathonos/backend/common/http/RequestIdFilter.java).
  - Inspects incoming `X-Request-Id` header; if missing or blank, generates a random UUID.
  - Binds request ID to SLF4J MDC using key `reqId`.
  - Injects `X-Request-Id: <uuid>` into every outgoing HTTP response header.
  - Every error response body emitted by `ApiExceptionHandler.java` includes this `requestId` for correlation.

---

## 12.2 Health Probes & Metrics
- **Public Lightweight Health Probe**:
  - `GET /api/v1/health` ([PublicHealthController.java](file:///backend/src/main/java/com/hackathonos/backend/common/PublicHealthController.java)).
  - Returns `{"status":"ok"}` with HTTP 200.
  - Does **not** query the database or check external dependencies. Configured specifically as Render's container health check path (`/api/v1/health`) to allow container startup to pass immediately without cold-start blocking.
- **Spring Boot Actuator Probes**:
  - `GET /actuator/health`, `GET /actuator/health/liveness`, `GET /actuator/health/readiness`.
  - Configured in [application.yml:111-121](file:///backend/src/main/resources/application.yml#L111-L121) and [application-prod.yml:57-65](file:///backend/src/main/resources/application-prod.yml#L57-L65).
  - In production, details are hidden (`show-details: never`).
  - **Metrics Exposure**: Detailed actuator metrics (`/actuator/metrics`, `/actuator/prometheus`) are **not** exposed in web management endpoints (`include: health` only). There is no Prometheus or Grafana integration.

---

## 12.3 Error Reporting & Client Telemetry
- **Client Error Ingestion Endpoint**:
  - `POST /api/v1/client-errors` ([ClientErrorController.java:47](file:///backend/src/main/java/com/hackathonos/backend/errors/ClientErrorController.java#L47)).
  - Unauthenticated endpoint (CSRF ignored in `SecurityConfig.java:107`).
  - Ingests frontend runtime errors, stack traces, user agent, current route, and client timestamp.
  - Persists errors to relational table `client_errors` ([V35__client_errors_and_email_priority.sql](file:///backend/src/main/resources/db/migration/V35__client_errors_and_email_priority.sql)).
- **APM & Error Aggregation Services**:
  - There is **no Sentry, Datadog, New Relic, or Honeycomb SDK** integrated in either the backend or frontend.
  - All operational diagnosis currently relies entirely on Render container stdout logs and querying the `client_errors` database table.

---

## 12.4 Swallowed Exceptions & Silent Catch Blocks (CRITICAL)
A repository-wide audit identified **135 empty or swallowed catch blocks** in backend Java source code (e.g. `catch (Exception ignored) {}`):
- **`RoomEventHub.java:79, 110, 138, 364, 370`**: SSE emitter completion errors, sequence parse errors, and replay write exceptions are completely ignored without logging.
- **`RoomChangeInterceptor.java:58`**: If `roomId` in path fails UUID parsing, the exception is caught and silently dropped without logging.
- **`SecretCipher.java`**: Token decryption failures swallow exceptions, making corrupted encryption keys or misconfigured `APP_ENCRYPTION_KEY` difficult to diagnose.
- **`DocService.java` & `IdeasService.java`**: JSON parsing and date calculation exceptions are silently ignored, returning empty defaults instead of surfacing data corruption.
- **`AppSettingsService.java`**: Cache synchronization failures swallow exceptions.
