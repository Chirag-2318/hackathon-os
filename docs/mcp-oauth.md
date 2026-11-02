# Brackit OAuth 2.1 Authorization Server for MCP

This document specifies Brackit's OAuth 2.1 Authorization Server designed to support Claude's "Connect" flow (Dynamic Client Registration RFC 7591, PKCE RFC 7636 with SHA-256, Authorization Server Metadata RFC 8414, Token Revocation RFC 7009, and loopback redirects RFC 8252 for Claude Code).

---

## 1. OAuth 2.1 Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant Claude as Claude Desktop / Claude Code
    participant AuthServer as Brackit Backend (OAuth Server)
    participant McpApi as Brackit MCP API (/api/v1/mcp)

    Note over Claude,AuthServer: Phase 1: Discovery & Dynamic Client Registration
    Claude->>AuthServer: GET /.well-known/oauth-authorization-server
    AuthServer-->>Claude: 200 OK (endpoints, S256, public client, scopes)

    Claude->>AuthServer: POST /oauth/register (redirect_uris, client_name, auth="none")
    AuthServer-->>Claude: 201 Created (client_id, echoed metadata)

    Note over User,AuthServer: Phase 2: Authorization & Consent
    Claude->>User: Open browser to /oauth/authorize?client_id=...&redirect_uri=...&code_challenge=...&state=...
    User->>AuthServer: GET /oauth/authorize
    alt User Not Logged In
        AuthServer->>User: 302 Redirect to /login (saves /oauth/authorize request in session)
        User->>AuthServer: Complete GitHub/Google OAuth login
        AuthServer->>User: 302 Redirect back to saved /oauth/authorize URL
    end

    alt User Plan is FREE
        AuthServer-->>User: 200 OK (Brackit MCP requires Pro plan HTML page)
    else User Plan is PRO / MAX
        AuthServer-->>User: 200 OK (Server-rendered consent HTML page, anti-framing headers)
    end

    User->>AuthServer: POST /oauth/authorize/decision (decision=allow, CSRF token)
    AuthServer-->>User: 302 Redirect to redirect_uri?code=bkt_code_...&state=...
    User->>Claude: Browser loopback / callback receives code & state

    Note over Claude,AuthServer: Phase 3: Token Exchange with PKCE
    Claude->>AuthServer: POST /oauth/token (grant_type=authorization_code, code, code_verifier, redirect_uri, client_id)
    AuthServer-->>Claude: 200 OK (access_token: bkt_..., refresh_token: bkt_..., expires_in: 3600)

    Note over Claude,McpApi: Phase 4: API Access & Identity Validation
    Claude->>McpApi: GET /api/v1/mcp/me (Authorization: Bearer bkt_...)
    McpApi-->>Claude: 200 OK ({userId, name, plan, mcpAllowed})

    Claude->>McpApi: GET /api/v1/mcp/rooms (Authorization: Bearer bkt_...)
    McpApi-->>Claude: 200 OK ([{id, name, stage, role}])

    Note over Claude,AuthServer: Phase 5: Refresh Token Rotation
    Claude->>AuthServer: POST /oauth/token (grant_type=refresh_token, refresh_token=bkt_...)
    AuthServer-->>Claude: 200 OK (new access_token, new refresh_token in same family)
    Note over AuthServer: Old refresh token is invalidated. If replayed, whole family is revoked!

    Note over Claude,AuthServer: Phase 6: Revocation
    Claude->>AuthServer: POST /oauth/revoke (token=bkt_..., token_type_hint=refresh_token)
    AuthServer-->>Claude: 200 OK
```

---

## 2. Configuration Properties

All OAuth settings reside under `app.mcp.oauth.*` in Spring Boot configuration (`application.yml`):

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `app.mcp.oauth.allowed-redirect-uris` | `["https://claude.ai/api/mcp/auth_callback"]` | Whitelisted redirect URIs for Dynamic Client Registration. |
| `app.mcp.oauth.allow-loopback-redirects` | `true` | Allows loopback redirects (`http://localhost:<any port>/...`, `http://127.0.0.1:<any port>/...`) for Claude Code CLI. |
| `app.mcp.oauth.access-token-ttl` | `1h` (`PT1H`) | Time-to-live for issued MCP Bearer access tokens. |
| `app.mcp.oauth.refresh-token-ttl` | `30d` (`P30D`) | Time-to-live for issued MCP refresh tokens. |
| `app.mcp.oauth.auth-code-ttl` | `5m` (`PT5M`) | Single-use authorization code lifetime. |
| `app.mcp.oauth.resource-uris` | `[]` | Allowed MCP resource URLs. If empty, resource validation is skipped in dev/test profiles. |
| `app.mcp.allowed-plans` | `PRO,MAX` | Comma-delimited list of billing tiers allowed to use MCP and authorize connectors. |
| `app.api-public-url` / `app.base-url` | `http://localhost:8080` | Public base URL used as the OAuth `issuer` (no trailing slash, no path). |

---

## 3. Endpoint Reference

### 3.1 Authorization Server Metadata Discovery
- **Route**: `GET /.well-known/oauth-authorization-server` (RFC 8414)
- **Auth**: Public, CSRF-exempt
- **Headers**: `Cache-Control: max-age=3600`
- **Response `200 OK`**:
  ```json
  {
    "issuer": "https://api.brackit.link",
    "authorization_endpoint": "https://api.brackit.link/oauth/authorize",
    "token_endpoint": "https://api.brackit.link/oauth/token",
    "registration_endpoint": "https://api.brackit.link/oauth/register",
    "revocation_endpoint": "https://api.brackit.link/oauth/revoke",
    "response_types_supported": ["code"],
    "grant_types_supported": ["authorization_code", "refresh_token"],
    "code_challenge_methods_supported": ["S256"],
    "token_endpoint_auth_methods_supported": ["none"],
    "scopes_supported": ["mcp", "offline_access"]
  }
  ```

### 3.2 Dynamic Client Registration
- **Route**: `POST /oauth/register` (RFC 7591)
- **Auth**: Public, CSRF-exempt. Rate-limited to 20 registrations/hour per IP.
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "client_name": "Claude Desktop",
    "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }
  ```
- **Validation**:
  - Rejects with `400 invalid_redirect_uri` if any URI does not match `allowed-redirect-uris` or loopback (`http://localhost` / `http://127.0.0.1`).
  - Rejects with `400 invalid_client_metadata` if `token_endpoint_auth_method` != `"none"`.
- **Response `201 Created`**:
  ```json
  {
    "client_id": "bkt_client_7a9f8b...",
    "client_id_issued_at": 1729620000,
    "client_name": "Claude Desktop",
    "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }
  ```

### 3.3 Authorization Endpoint
- **Route**: `GET /oauth/authorize`
- **Auth**: Authenticated session required. If unauthenticated, saved in request cache and redirected to `/login`, returning to the exact authorize URL upon login completion.
- **Query Parameters**:
  - `client_id` (required): Must exist in `oauth_clients`.
  - `redirect_uri` (required): Must match a registered URI for this client (loopback ignores dynamic port).
  - `response_type` (required): Must be `"code"`.
  - `code_challenge` (required): Base64URL-encoded SHA-256 of `code_verifier`.
  - `code_challenge_method` (required): Must be `"S256"`.
  - `scope` (optional): Subset of `mcp offline_access`.
  - `state` (optional): Returned unchanged to the client.
- **Validation Behavior**:
  - If `client_id` or `redirect_uri` is invalid: Renders an error page with HTTP 400. **NEVER redirects** (prevents open redirects).
  - If parameters like `response_type` or `code_challenge` are invalid: Redirects to `{redirect_uri}?error=...&state=...`.
  - If user is on the FREE plan: Renders a "Brackit MCP requires a Pro plan" page with an upgrade link. No code is created.
  - If user is PRO / MAX: Renders server-side consent page showing `<client_name>` and the redirect hostname with Allow / Deny buttons and anti-framing headers (`X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`).

### 3.4 Consent Decision
- **Route**: `POST /oauth/authorize/decision`
- **Auth**: Authenticated session + CSRF protected (`_csrf` token parameter).
- **Form Parameters**: `decision` (`"allow"` or `"deny"`).
- **Behavior**:
  - Re-validates the saved authorize request from the user's session (not trusting hidden form fields).
  - `decision=deny`: Redirects to `{redirect_uri}?error=access_denied&state=...`.
  - `decision=allow`: Creates a single-use 32-byte authorization code (5-minute TTL), stores only its SHA-256 hash, and redirects to `{redirect_uri}?code=bkt_code_...&state=...`.

### 3.5 Token Endpoint
- **Route**: `POST /oauth/token` (RFC 6749)
- **Auth**: Public, CSRF-exempt.
- **Content-Type**: `application/x-www-form-urlencoded` ONLY (JSON requests are rejected with `400 invalid_request`).
- **Headers**: Always returns `Cache-Control: no-store` and `Pragma: no-cache`.
- **Grant 1: `authorization_code`**:
  - Parameters: `grant_type=authorization_code`, `code`, `client_id`, `redirect_uri`, `code_verifier`.
  - Verifies constant-time equality of `base64url(SHA256(code_verifier))` with stored `code_challenge`.
  - Atomically marks the code as used.
  - **Replay Protection**: If an authorization code is presented twice, **all tokens issued from that code are immediately revoked** and returns `400 invalid_grant`.
  - Issues 1h Access Token (`bkt_...`) and 30d Refresh Token (`bkt_...`) in a new token family (`family_id`).
- **Grant 2: `refresh_token`**:
  - Parameters: `grant_type=refresh_token`, `refresh_token`, optional `client_id`.
  - Verifies token kind is `REFRESH`, unexpired, and not revoked.
  - **Rotation & Reuse Detection**: If an already-rotated refresh token is presented, **the entire token family is immediately revoked** and returns `400 invalid_grant`.
  - Rotates atomically: invalidates old refresh token and issues a new access token + refresh token pair in the same family.
- **Token Response `200 OK`**:
  ```json
  {
    "access_token": "bkt_mF_9.B5f-4.1JqM...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "bkt_2Y_9.B5f-4.1JqM...",
    "scope": "mcp offline_access"
  }
  ```

### 3.6 Revocation Endpoint
- **Route**: `POST /oauth/revoke` (RFC 7009)
- **Auth**: Public, CSRF-exempt.
- **Content-Type**: `application/x-www-form-urlencoded`
- **Parameters**: `token` (raw token value), optional `token_type_hint` (`access_token` or `refresh_token`).
- **Response**: Always `200 OK`.

### 3.7 Current User Identity Validation (MCP Service Endpoint)
- **Route**: `GET /api/v1/mcp/me`
- **Auth**: Bearer token authentication via `McpBearerAuthFilter`.
- **Plan Gate**: **EXEMPT** from the Pro plan check so MCP services can validate tokens and inspect tier without failure.
- **Response `200 OK`**:
  ```json
  {
    "userId": "db916595-38af-4817-8cdb-9b4ba38f4172",
    "name": "Jane Developer",
    "plan": "PRO",
    "mcpAllowed": true
  }
  ```

---

## 4. Manual Testing Walkthrough (cURL)

### Step 1: Discover Authorization Server
```bash
curl -i http://localhost:8080/.well-known/oauth-authorization-server
```

### Step 2: Register Dynamic Client
```bash
curl -i -X POST http://localhost:8080/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Claude Desktop",
    "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }'
```
*Note down the returned `client_id` (e.g. `bkt_client_abc123`).*

### Step 3: Compute S256 PKCE Pair
In bash / python / powershell:
```bash
# Verifier: 43-128 chars base64url
VERIFIER="dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
# Challenge: base64url(sha256(verifier))
# For this verifier, challenge is: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
```

### Step 4: Authorize in Browser
Open in browser:
```text
http://localhost:8080/oauth/authorize?client_id=bkt_client_abc123&redirect_uri=https://claude.ai/api/mcp/auth_callback&response_type=code&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&scope=mcp%20offline_access&state=mystate123
```
1. If not logged in: Log in with GitHub or Google. You are returned to the consent page.
2. If PRO user: Click **Allow**.
3. Browser redirects to: `https://claude.ai/api/mcp/auth_callback?code=bkt_code_...&state=mystate123`.

### Step 5: Exchange Code for Access & Refresh Tokens
```bash
curl -i -X POST http://localhost:8080/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=bkt_client_abc123" \
  -d "redirect_uri=https://claude.ai/api/mcp/auth_callback" \
  -d "code=bkt_code_REPLACE_WITH_CODE" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### Step 6: Call MCP Endpoints
```bash
# Identity check (works for FREE and PRO)
curl -i http://localhost:8080/api/v1/mcp/me \
  -H "Authorization: Bearer bkt_ACCESS_TOKEN_HERE"

# List rooms (requires PRO/MAX)
curl -i http://localhost:8080/api/v1/mcp/rooms \
  -H "Authorization: Bearer bkt_ACCESS_TOKEN_HERE"
```

### Step 7: Rotate Refresh Token
```bash
curl -i -X POST http://localhost:8080/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=bkt_client_abc123" \
  -d "refresh_token=bkt_REFRESH_TOKEN_HERE"
```

### Step 8: Revoke Token
```bash
curl -i -X POST http://localhost:8080/oauth/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=bkt_ACCESS_TOKEN_HERE"
```
