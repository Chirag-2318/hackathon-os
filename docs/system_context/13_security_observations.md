# 13. Security Observations

## 13.1 Input Validation & Injection Exposure
- **SQL / NoSQL Injection**:
  - **Status: Secure**.
  - All database queries are executed via Spring Data JPA derived queries, JPQL parameterized `@Query` annotations, or `JdbcTemplate` with positional `?` bind variables.
  - Zero dynamic SQL string concatenation was found in query construction.
- **Cross-Site Scripting (XSS)**:
  - **Status: Protected**.
  - Frontend UI is built on React 19 with default JSX string escaping.
  - All user-authored and AI-generated Markdown rendering (in docs, plan steps, and brief views) is processed through `react-markdown` with **`rehype-sanitize`** ([frontend/package.json:50](file:///frontend/package.json#L50)), stripping dangerous HTML tags and script injections.
- **Server-Side Request Forgery (SSRF)**:
  - **Status: Protected**.
  - The brief intake feature allows users to provide an external URL to extract hackathon requirements (`POST /api/v1/rooms/{roomId}/brief/source/link`).
  - All outbound fetches are routed through [SsrfGuard.java](file:///backend/src/main/java/com/hackathonos/backend/brief/SsrfGuard.java).
  - Resolves DNS and explicitly blocks loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and site-local IPv6 addresses.
  - Restricts redirects to max 3; enforces 10s timeout and 5 MB response body cap.

---

## 13.2 Insecure Direct Object References (IDOR)
- **Room-Scoped Entities**:
  - Verified across controllers: Mutating endpoints require `roomId` in path and invoke `roomAccess.requireMember(roomId, user)` or `roomAccess.requireLeader(roomId, user)`.
  - Repository operations enforce compound lookup where applicable (e.g. `taskRepository.findByIdAndRoomId(taskId, roomId)` in [TaskService.java:679](file:///backend/src/main/java/com/hackathonos/backend/tasks/TaskService.java#L679), `docRepository.findByRoomIdAndFileName(roomId, fileName)` in [DocService.java:559](file:///backend/src/main/java/com/hackathonos/backend/docs/DocService.java#L559)).
- **Potential IDOR Risks / Edge Cases**:
  - `GET /api/v1/portfolio/u/{handle}`: Publicly accessible by design; returns portfolio info for any user handle.
  - `GET /api/v1/mentor/rooms/{roomId}`: Returns room overview and mentor questions to unauthenticated callers.
  - `GET /api/v1/invites/{code}`: Unauthenticated endpoint to inspect room title and metadata before joining.

---

## 13.3 Secrets Hygiene & Configuration
- **Zero Real Secrets in Repo**:
  - Environment templates (`.env.example`, `render-env.template`) contain only documentation placeholders and keys.
  - `application.yml` uses dummy fallbacks for local dev; production profile mandates environment injection.
  - Production startup validator ([ProductionStartupValidator.java](file:///backend/src/main/java/com/hackathonos/backend/common/config/ProductionStartupValidator.java)) explicitly halts the server if dummy or placeholder values are detected in `prod`.
- **Database Secret Storage**:
  - User OAuth tokens (GitHub personal tokens, Canva tokens) and user BYOK AI keys are encrypted with AES-256-GCM via `SecretCipher.java` before insertion into `user_oauth_tokens` and `user_ai_keys`.

---

## 13.4 Rate Limiting & Denial-of-Service Defenses
- **IP Rate Limiting**: Global limit of 60 requests/minute for unauthenticated callers via `RateLimiter.java` and `ClientIpResolver.java`.
- **Join Code Brute-Force Protection**: `JoinAttemptLimiter.java` locks room join code attempts after 5 consecutive failures per 15 minutes.
- **AI Cost & Resource Protection**:
  - Zero client AI keys: LLM API keys are never delivered to the client.
  - Platform fallback disabled in production: `AI_PLATFORM_FALLBACK=false` ensures platform keys are not drained.
  - Per-user semaphore caps concurrent AI prompts to 4; rate limiter caps prompts to 10/minute.
