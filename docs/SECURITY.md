# [brackit] — Security Architecture & Guidelines

## 1. Authentication & Session Management

- **Cookie-Based Sessions**: Authentication is handled exclusively via secure `HttpOnly`, `SameSite=Lax` cookies.
- **Zero Token Storage on Client**: In strict accordance with security policies, tokens, passwords, and sensitive user payloads are **NEVER stored in `localStorage` or `sessionStorage`**.
- **OAuth2 Identity Providers**: Direct login flows through GitHub and Google OAuth2.
- **Development Profile**: In the `dev` profile, session cookies are created via `/api/v1/auth/dev-login` for automated tests and quick pairing.

---

## 2. Authorization & Tenant Isolation

- **RoomAccess Filter**: Every request to `/api/v1/rooms/{roomId}/**` passes through `RoomAccess.requireMember(roomId, user)`. Non-members receive a `403 Forbidden` (`NOT_A_MEMBER`).
- **Role Elevation**: Actions altering room structure, invitations, stage transitions, or team assignments require `RoomAccess.requireLeader(roomId, user)`. Regular members receive `403 Forbidden` (`LEADER_REQUIRED`).
- **Data Export & Privacy**: Data exports (`/api/v1/rooms/{roomId}/export.zip`) are scoped strictly to enrolled room members.

---

## 3. Secret Protection & Environment Hygiene

- **Frontend Variables**: No secrets are placed in `VITE_*` environment variables. Only public endpoints (`VITE_API_BASE_URL`) and non-sensitive feature flags are permitted.
- **Database Credentials**: Encrypted via Spring Boot environment variables; keys encrypted in database using `pgcrypto`.

---

## 4. Input Sanitization & Content Security

- **Markdown & HTML Sanitization**: User-provided Markdown (briefs, documentation, task descriptions, and AI prompt bridge outputs) is sanitized using `rehype-sanitize` before rendering. Raw unescaped HTML injection is blocked.
- **CSRF Protection**: State-mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require an `X-XSRF-TOKEN` header validated against the server-generated `XSRF-TOKEN` cookie.
- **Rate Limiting**: AI proxy and brute-force sensitive endpoints are rate-limited per IP and user ID, returning `429 Too Many Requests`.
