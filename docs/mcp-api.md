# Brackit MCP API Documentation

This document describes the MCP (Model Context Protocol) API layer in Brackit's Spring Boot backend.
The MCP API enables external services (e.g. a Node-based MCP server running Claude, Cursor, or ChatGPT desktop adapters) to query rooms, fetch plan step briefs (prompts + context), and submit AI-generated plan documents on behalf of an authenticated Brackit user.

---

## 1. Authentication & Security Architecture

### Bearer Token Scheme
- External MCP calls authenticate using an HTTP `Authorization` header:
  ```http
  Authorization: Bearer bkt_<raw_token>
  ```
- Format: `bkt_` prefix followed by 32 cryptographically secure random bytes encoded as URL-safe base64 (without padding).
- **Security Storage**: Raw tokens are **never** stored in the database or logged. Only their SHA-256 hex digest (`token_hash`) is persisted in table `mcp_tokens`.
- **Token Validity**: Tokens have an expiration timestamp (`expires_at`), can be explicitly revoked (`revoked_at`), and track `last_used_at`.
- **Security Filter Chain**: A dedicated, stateless filter chain (`@Order(1)`) intercepts all requests under `/api/v1/mcp/**`. It does not create HTTP sessions (`JSESSIONID`), disables CSRF (server-to-server), and populates Spring's `SecurityContextHolder` with the authenticated `User` as the principal so downstream services (`CurrentUser.get()`, `RoomAccessService.requireMember(...)`) function identically to web session requests.

### Plan Gating
All endpoints under `/api/v1/mcp/**` check the user's current billing plan (`BillingService.getUserPlan(user)`).
Allowed plans are configured via `app.mcp.allowed-plans` (default: `PRO,MAX`).
If a user is on `FREE` (or any non-allowed tier), the API returns HTTP 403 with error code `MCP_REQUIRES_PRO`.

---

## 2. API Endpoints

### 2.0 Dev Token Generation (Dev Profile Only)

Create a 24-hour MCP access token for the current user.

* **URL**: `POST /api/v1/dev/mcp-token`
* **Profile**: `@Profile("dev")` only
* **Authentication**: Requires standard web login session (`SESSION` cookie) + CSRF token header (`X-XSRF-TOKEN`).
* **Request Body**: empty or `{}`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "token": "bkt_aB3dE_992kdslk2j9s8dflkj234_sdfkljsdf09",
    "expiresAt": "2026-10-22T23:59:59Z",
    "scope": "mcp",
    "kind": "ACCESS"
  }
  ```

---

### 2.1 List Rooms

Returns all active rooms where the authenticated user is a member.

* **URL**: `GET /api/v1/mcp/rooms`
* **Authentication**: `Authorization: Bearer bkt_...`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "id": "70d557c6-a67b-426b-a25e-0498b36a161c",
      "name": "TrafficCast Room",
      "stage": "plan",
      "role": "LEAD"
    },
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Agentic IDE",
      "stage": "build",
      "role": "MEMBER"
    }
  ]
  ```

---

### 2.2 Get Plan Steps

Returns the 5 sequential planning steps with their expected markdown file names and current status in the room.

* **URL**: `GET /api/v1/mcp/rooms/{roomId}/steps`
* **Path Parameters**:
  * `roomId` (UUID): Room identifier.
* **Authentication**: `Authorization: Bearer bkt_...`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  [
    {
      "number": 1,
      "key": "prd",
      "title": "PRD & Product Scope",
      "expectedFiles": [
        "PRD.md"
      ],
      "status": "APPROVED"
    },
    {
      "number": 2,
      "key": "tech",
      "title": "Tech Stack & Architecture",
      "expectedFiles": [
        "TECH_STACK.md",
        "ARCHITECTURE.md"
      ],
      "status": "DRAFT"
    },
    {
      "number": 3,
      "key": "phases",
      "title": "Implementation Phases",
      "expectedFiles": [
        "PHASES.md"
      ],
      "status": "LOCKED"
    },
    {
      "number": 4,
      "key": "tasks",
      "title": "Task Breakdown",
      "expectedFiles": [
        "TASKS.md"
      ],
      "status": "LOCKED"
    },
    {
      "number": 5,
      "key": "demo",
      "title": "Demo & Presentation Script",
      "expectedFiles": [
        "DEMO_SCRIPT.md"
      ],
      "status": "LOCKED"
    }
  ]
  ```

---

### 2.3 Get Step Brief (Prompt + Context)

Returns everything the AI needs to generate the plan documents for a specific step:
1. `prompt`: The exact prompt Brackit uses, including instructions and output delimiter specifications (`=====FILE: filename=====\n...\n=====END FILE=====`).
2. `context`: The project context pack (ideas, problem statement, preceding approved steps).
3. `webUrl`: Deep-link to this step in the Brackit web app.

* **URL**: `GET /api/v1/mcp/rooms/{roomId}/steps/{step}/brief`
* **Path Parameters**:
  * `roomId` (UUID): Room identifier.
  * `step` (String): Step key (`prd`, `tech`, `phases`, `tasks`, or `demo`).
* **Authentication**: `Authorization: Bearer bkt_...`
* **Response Status**: `200 OK`
* **Response Body**:
  ```json
  {
    "step": "prd",
    "expectedFiles": [
      "PRD.md"
    ],
    "prompt": "# Step 1: PRD & Product Scope\n\nGenerate the Product Requirements Document...\n\n### Required Output Format:\n=====FILE: PRD.md=====\n# PRD: <Project Name>\n...\n=====END FILE=====",
    "context": "# Project Context Pack\n## Problem Statement\n...\n## Idea\n...",
    "webUrl": "http://localhost:5173/rooms/70d557c6-a67b-426b-a25e-0498b36a161c/plan"
  }
  ```

---

### 2.4 Submit Step Document

Validates and saves the AI-generated document for a step. This uses the existing `PlanValidationService` and `DocService` workflow, ensuring versioning, optimistic locking, and state transitions are strictly honored.

* **URL**: `POST /api/v1/mcp/rooms/{roomId}/steps/{step}/submit`
* **Path Parameters**:
  * `roomId` (UUID): Room identifier.
  * `step` (String): Step key (`prd`, `tech`, `phases`, `tasks`, or `demo`).
* **Authentication**: `Authorization: Bearer bkt_...`
* **Request Body**:
  ```json
  {
    "text": "=====FILE: PRD.md=====\n# PRD: TrafficCast\n## Problem Statement\nReal-time traffic prediction.\n## Target Audience\nCity commuters.\n## Key Features\n- Live routing\n## Tech Requirements\n- WebSocket feeds\n## Success Metrics\n- 95% accuracy\n=====END FILE=====",
    "confirm": false,
    "override": false
  }
  ```
* **Response Status**: `200 OK`
* **Response Body (Valid Submission)**:
  ```json
  {
    "ok": true,
    "valid": true,
    "issues": [],
    "errors": [],
    "warnings": [],
    "repairPrompt": null,
    "needsConfirmation": false,
    "webUrl": "http://localhost:5173/rooms/70d557c6-a67b-426b-a25e-0498b36a161c/plan"
  }
  ```
* **Response Body (Validation Failure with Repair Prompt)**:
  ```json
  {
    "ok": false,
    "valid": false,
    "issues": [
      {
        "severity": "ERROR",
        "code": "MISSING_REQUIRED_SECTIONS",
        "message": "PRD.md is missing required section: ## Success Metrics"
      }
    ],
    "errors": [
      "PRD.md is missing required section: ## Success Metrics"
    ],
    "warnings": [],
    "repairPrompt": "The document submitted failed validation. Please fix the following errors and re-submit:\n- PRD.md is missing required section: ## Success Metrics",
    "needsConfirmation": false,
    "webUrl": "http://localhost:5173/rooms/70d557c6-a67b-426b-a25e-0498b36a161c/plan"
  }
  ```

---

## 3. Error Responses

All error responses strictly follow Brackit's standard error payload structure:

### 3.1 Unauthorized (401)
Missing, expired, revoked, or invalid bearer token:
```json
{
  "code": "UNAUTHORIZED",
  "message": "Bearer token has expired",
  "status": 401,
  "requestId": "92f3e8f8-bca7-48f0-b991-38cb4da7f5a2",
  "timestamp": "2026-10-21T18:45:00Z"
}
```

### 3.2 Plan Upgrade Required (403)
User's subscription tier does not allow MCP access:
```json
{
  "code": "MCP_REQUIRES_PRO",
  "message": "MCP API access requires an active PRO or MAX plan.",
  "status": 403,
  "requestId": "c1f71dfa-191a-4712-ae2d-7bbfe6b2a4c1",
  "timestamp": "2026-10-21T18:45:00Z"
}
```

### 3.3 Not a Room Member (403)
Authenticated user is not an active member of the specified room:
```json
{
  "code": "NOT_A_MEMBER",
  "message": "User is not a member of this room",
  "status": 403,
  "requestId": "d2f3e8f8-bca7-48f0-b991-38cb4da7f5a2",
  "timestamp": "2026-10-21T18:45:00Z"
}
```

---

## 4. End-to-End Walkthrough via cURL

### Step 1: Log in via Web Session (Dev Profile)
Log in using dev login to obtain a session cookie:
```bash
curl -i -X POST http://localhost:8080/api/v1/dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}' \
  -c cookies.txt
```
*Note: Save cookies to `cookies.txt`.*

### Step 2: Fetch CSRF Token
Fetch the CSRF token cookie and header:
```bash
curl -i http://localhost:8080/api/v1/auth/csrf \
  -b cookies.txt \
  -c cookies.txt
```
Extract `XSRF-TOKEN` from the response cookies.

### Step 3: Mint an MCP Access Token (Dev Only)
Request a 24-hour raw bearer token:
```bash
curl -X POST http://localhost:8080/api/v1/dev/mcp-token \
  -b cookies.txt \
  -H "X-XSRF-TOKEN: <xsrf-token-value>"
```
Sample Output:
```json
{
  "token": "bkt_mF0aZ4Kld_c882LKmO_082ksmDLKsmflksjdf908",
  "expiresAt": "2026-10-22T18:50:00Z",
  "scope": "mcp",
  "kind": "ACCESS"
}
```
Store this token:
```bash
MCP_TOKEN="bkt_mF0aZ4Kld_c882LKmO_082ksmDLKsmflksjdf908"
```

### Step 4: List Rooms
```bash
curl -H "Authorization: Bearer $MCP_TOKEN" \
  http://localhost:8080/api/v1/mcp/rooms
```

### Step 5: Get Steps for a Room
```bash
ROOM_ID="70d557c6-a67b-426b-a25e-0498b36a161c"

curl -H "Authorization: Bearer $MCP_TOKEN" \
  http://localhost:8080/api/v1/mcp/rooms/$ROOM_ID/steps
```

### Step 6: Fetch Brief for Step 1 (PRD)
```bash
curl -H "Authorization: Bearer $MCP_TOKEN" \
  http://localhost:8080/api/v1/mcp/rooms/$ROOM_ID/steps/prd/brief
```

### Step 7: Submit Plan Document
```bash
curl -X POST http://localhost:8080/api/v1/mcp/rooms/$ROOM_ID/steps/prd/submit \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "=====FILE: PRD.md=====\n# PRD: TrafficCast\n## Problem Statement\nPredict traffic jams in real time.\n## Target Audience\nCommuters and bus transit operators.\n## Key Features\n- Real-time delay alerts\n- Congestion heatmap\n## Tech Requirements\n- OpenStreetMap API\n- WebSockets\n## Success Metrics\n- Over 90% routing accuracy\n=====END FILE=====",
    "confirm": false,
    "override": false
  }'
```
Response:
```json
{
  "ok": true,
  "valid": true,
  "issues": [],
  "errors": [],
  "warnings": [],
  "repairPrompt": null,
  "needsConfirmation": false,
  "webUrl": "http://localhost:5173/rooms/70d557c6-a67b-426b-a25e-0498b36a161c/plan"
}
```
