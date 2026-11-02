# 5. Authentication & Authorization

## 5.1 Authentication Mechanism
- **Primary Mechanism**: OAuth 2.0 with GitHub and Google, managed via Spring Security OAuth2 Client (`spring-boot-starter-oauth2-client`).
- **Zero Local Passwords**: The application does not store, hash, or manage local user passwords. All interactive logins require a third-party OAuth provider.
- **Session Model**:
  - Upon successful OAuth authentication, [OAuth2LoginSuccessHandler.java](file:///backend/src/main/java/com/hackathonos/backend/common/security/OAuth2LoginSuccessHandler.java#L40) extracts provider claims (id, email, name, avatar), resolves or provisions the user in the `users` table, and sets an `Authentication` token in Spring's `SecurityContext`.
  - Spring Security binds the security context to an HTTP Session managed by Apache Tomcat's `StandardSessionManager`.
  - Tomcat issues a `JSESSIONID` session cookie.
- **Token Storage & Security**:
  - In strict compliance with security standards, **no authentication tokens or sensitive user data are stored in browser `localStorage` or `sessionStorage`**.
  - All authentication state is held in the browser's HTTP-only cookie jar:
    - Cookie: `JSESSIONID`
    - `HttpOnly`: `true` (enforced via `sessionCookieInitializer()` in [SecurityConfig.java:218](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L218))
    - `SameSite`: `${COOKIE_SAME_SITE:Lax}`
    - `Secure`: `${COOKIE_SECURE:false}` in dev, forced to `true` in production ([application-prod.yml:13](file:///backend/src/main/resources/application-prod.yml#L13))
    - `Domain`: Stripped / omitted, making the cookie strictly host-only to Vercel.
- **Session Expiry & Refresh Flow**:
  - Sessions rely on Tomcat's idle session expiration (default: 30 minutes).
  - There is no automatic sliding refresh token flow for sessions.
  - When the session expires, API calls return `401 Unauthorized` with body `{"code": "UNAUTHORIZED", "message": "Authentication required"}`.
  - The frontend client interceptor ([frontend/src/lib/apiClient.ts:81](file:///frontend/src/lib/apiClient.ts#L81)) listens for 401 and dispatches a DOM event: `window.dispatchEvent(new CustomEvent('auth:session-expired'))`.
  - A modal dialog appears prompting the user to re-authenticate without losing current form inputs.
- **Logout Flow**:
  - Client sends `POST /api/v1/logout`.
  - Handled by Spring Security `.logout()` in [SecurityConfig.java:193](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L193): invalidates the `HttpSession`, clears the security context, and returns `HTTP 204 No Content`.
- **Machine-to-Machine & MCP Authentication**:
  - The application implements a separate stateless filter chain for MCP clients ([SecurityConfig.java:60](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L60)):
    - Pattern: `/api/v1/mcp/**`
    - `SessionCreationPolicy.STATELESS`
    - Filter: `McpBearerAuthFilter.java` validates `Authorization: Bearer <token>` against the `mcp_tokens` database table ([V42__mcp_tokens.sql](file:///backend/src/main/resources/db/migration/V42__mcp_tokens.sql)).
  - OAuth 2.0 Authorization Server ([OAuthServerController.java](file:///backend/src/main/java/com/hackathonos/backend/mcp/oauth/OAuthServerController.java), [V43__oauth_server.sql](file:///backend/src/main/resources/db/migration/V43__oauth_server.sql)): issues authorization codes (`/oauth/authorize`), exchanges codes for access tokens (`/oauth/token`), and supports revocation (`/oauth/revoke`).

---

## 5.2 Authorization & Resource Ownership Enforcement
- **Room Access Control**: Enforced centrally by [RoomAccessService.java](file:///backend/src/main/java/com/hackathonos/backend/rooms/RoomAccessService.java#L19) and [RoomAccess.java](file:///backend/src/main/java/com/hackathonos/backend/common/security/RoomAccess.java#L15).
  - `requireMember(roomId, user)`:
    - Verifies that the room exists and is not soft-deleted (`deleted_at IS NULL AND archived_at IS NULL`). Throws `NotFoundException` (404) if deleted.
    - Queries `room_members` table for `room_id` and `user_id`. Throws `ForbiddenException("NOT_A_MEMBER")` (403) if absent.
  - `requireLeader(roomId, user)`:
    - Executes `requireMember(roomId, user)`.
    - Verifies that `user.getId().equals(room.getOwnerId())` OR `room_members.role` equals `LEADER` or `OWNER`. Throws `ForbiddenException("LEADER_REQUIRED")` (403) if non-leader.
- **Platform Administration**:
  - Enforced by `requireAdmin()` in [AdminOverviewController.java:31](file:///backend/src/main/java/com/hackathonos/backend/admin/AdminOverviewController.java#L31) and `appSettingsService.isAdmin(email)`.
  - Checks if user's email is present in the comma-separated `${ADMIN_EMAILS}` environment variable.
  - **Defensive 404**: Unauthorized users receive `404 Not Found` rather than `403 Forbidden` to conceal administrative endpoints.

### Authorization Check Audit & Missing/Weak Checks
1. **GitHub Link OAuth Flow ([GitHubController.java:256-320](file:///backend/src/main/java/com/hackathonos/backend/github/GitHubController.java#L256-L320))**:
   - `startLink` saves `gh_link_state`, `gh_link_user_id`, and `gh_link_room_id` in Tomcat `HttpSession`.
   - `redirect_uri` is generated using `appProperties.getBaseUrl() + "/api/v1/github/link/callback"`.
   - **Weakness/Defect**: In a decoupled Vercel + Render deployment, `appProperties.getBaseUrl()` points to the Render host. When GitHub redirects the browser to Render directly, the top-level navigation has no access to Vercel's host-only session cookies. The session on Render is null, causing `reason=state_mismatch` and breaking the link flow.
2. **Canva Integration Flow ([CanvaController.java:61-120](file:///backend/src/main/java/com/hackathonos/backend/canva/CanvaController.java#L61-L120))**:
   - Same session-state issue: PKCE `code_verifier` and state are stored in Tomcat session, and redirect URL uses `appProperties.getBaseUrl()`.
3. **Public Unauthenticated Endpoints**:
   - `GET /api/v1/portfolio/u/{handle}` ([PublicPortfolioController.java](file:///backend/src/main/java/com/hackathonos/backend/portfolio/PublicPortfolioController.java)): Publicly exposes user handle, projects, and skills.
   - `GET /api/v1/mentor/rooms/{roomId}` ([PublicMentorController.java](file:///backend/src/main/java/com/hackathonos/backend/mentor/PublicMentorController.java)): Exposes room summary, track, and mentor questions without authentication.
   - `GET /mock/**` ([PublicMockController.java](file:///backend/src/main/java/com/hackathonos/backend/apihub/PublicMockController.java)): Unauthenticated dynamic mock API execution endpoint (disabled in production profile).

---

## 5.3 Password Hashing, Rate Limiting & Web Security
- **Password Hashing**: Not applicable; zero local credentials stored.
- **User Secret Encryption**: User GitHub Personal Access Tokens, Canva OAuth tokens, and BYOK AI keys are encrypted before storage in `user_oauth_tokens` and `user_ai_keys` using AES-256-GCM via `SecretCipher.java` ([backend/src/main/java/com/hackathonos/backend/common/security/SecretCipher.java](file:///backend/src/main/java/com/hackathonos/backend/common/security/SecretCipher.java)). Encryption key is provided via `APP_ENCRYPTION_KEY`.
- **Rate Limiting**:
  - Global unauthenticated IP rate limit: 60 requests per minute ([RateLimitInterceptor.java:42](file:///backend/src/main/java/com/hackathonos/backend/common/security/RateLimitInterceptor.java#L42)).
  - Room invite code attempts: 5 failed attempts per 15 minutes ([JoinAttemptLimiter.java:15](file:///backend/src/main/java/com/hackathonos/backend/invites/JoinAttemptLimiter.java#L15)).
  - AI requests: 10 calls per minute per user ([AiRateLimiter.java:23](file:///backend/src/main/java/com/hackathonos/backend/ai/AiRateLimiter.java#L23)).
  - Username updates: 3 changes per hour per user ([UserService.java:915](file:///backend/src/main/java/com/hackathonos/backend/users/UserService.java#L915)).
- **CORS Configuration ([CorsConfig.java](file:///backend/src/main/java/com/hackathonos/backend/common/config/CorsConfig.java))**:
  - Allowed Origins: `${CORS_ALLOWED_ORIGINS:${APP_PUBLIC_URL:http://localhost:5173}}`.
  - Allowed Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
  - Allowed Headers: `Authorization`, `Content-Type`, `X-XSRF-TOKEN`, `X-Request-Id`, `Idempotency-Key`, `Last-Event-ID`.
  - Allow Credentials: `true`.
- **CSRF Handling**:
  - Spring Security `CookieCsrfTokenRepository.withHttpOnlyFalse()` ([SecurityConfig.java:87](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L87)).
  - Cookie name: `XSRF-TOKEN`, header: `X-XSRF-TOKEN`.
  - Ignored on read-only requests (`GET`, `HEAD`, `OPTIONS`) and specific external callbacks (`/mock/**`, `/api/v1/mentor/**`, `/api/v1/public/**`, `/api/v1/client-errors`, `/.well-known/**`, `/oauth/**`).
  - Frontend auto-retry: [frontend/src/lib/apiClient.ts:87](file:///frontend/src/lib/apiClient.ts#L87) detects 403 CSRF failures and automatically retries the request once with a refreshed token from the cookie.
