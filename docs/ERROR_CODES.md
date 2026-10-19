# [brackit] — API Error Codes Catalog

All error responses from the [brackit] backend adhere to RFC 7807 (Problem Details for HTTP APIs) and the standard `ApiError` format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "status": 400,
  "requestId": "req-12345678",
  "timestamp": "2026-10-11T14:30:00Z",
  "fieldErrors": {}
}
```

---

## 1. Authentication & Authorization Errors

| Error Code | HTTP Status | Description | Client Action |
| :--- | :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Missing, expired, or invalid session cookie / token. | Intercepted by `SessionExpiryDialog`. Prompts user to re-authenticate without losing draft. |
| `NOT_A_MEMBER` | 403 | The authenticated user is not an enrolled member of the requested room. | Redirects to `/app/home` or displays room invite entry. |
| `LEADER_REQUIRED` | 403 | The requested mutation requires room `LEADER` role. | Disables leader action UI and shows banner informing user that only the leader can perform this action. |
| `TOKEN_EXPIRED` | 401 | Shareable invite link or mentor token has expired. | Inform user that the invite link is no longer valid. |

---

## 2. Validation & Business Rule Errors

| Error Code | HTTP Status | Description | Client Action |
| :--- | :--- | :--- | :--- |
| `VALIDATION_FAILED` | 400 | Request body failed Jakarta `@Valid` / Zod constraints. | Highlights invalid form inputs with `fieldErrors` messages. |
| `STAGE_LOCKED` | 400 | Attempted to modify an artifact before its prerequisite stage is completed. | Renders stage lock indicator and guide explaining what needs completion first. |
| `CANNOT_JUMP_STAGE` | 400 | Stage transition was rejected by the stage validator. | Prompts user to complete required stage prerequisites. |
| `CONFLICT` | 409 | Unique constraint violation (e.g. duplicate room join code, primary idea already exists). | Refetches current state or prompts user with conflict resolution modal. |

---

## 3. Resource & Network Errors

| Error Code | HTTP Status | Description | Client Action |
| :--- | :--- | :--- | :--- |
| `ROOM_NOT_FOUND` | 404 | Room ID does not exist or has been archived. | Displays 404 Not Found screen with button to return to `/app/home`. |
| `RESOURCE_NOT_FOUND` | 404 | Generic entity (task, idea, doc, slide) was not found. | Refetches parent collection cache. |
| `RATE_LIMITED` | 429 | Rate limit threshold exceeded (e.g. AI prompt generation or login attempts). | Backs off and displays retry timer. |
| `INTERNAL_ERROR` | 500 | Unhandled server error. | Displays error boundary card with request ID and "Retry" action. |
