# 10. Frontend Data-Fetching Behaviour

## 10.1 HTTP Client Architecture & Interceptors
The frontend application uses the native browser `fetch` API wrapped in two parallel service wrappers:
1. **`apiFetch` ([frontend/src/design/api.ts:53](file:///frontend/src/design/api.ts#L53))** (Primary client, used across 52 feature files):
   - Injects `Content-Type: application/json` unless payload is `FormData`.
   - Reads `XSRF-TOKEN` cookie; attaches `X-XSRF-TOKEN` header on mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Generates and attaches a unique UUID `Idempotency-Key` header on create requests.
   - Credentials mode: `credentials: 'include'` (sends first-party session cookies).
   - Network error retry: Retries network failures once on idempotent `GET` requests.
   - Unified Error Parsing: Deserializes error responses into `ApiError` instances containing `{ status, code, message, fieldErrors, details, requestId }`.
   - 401 Interception: Dispatches session expiration event; triggers toast or dialog.
   - 429 Toast: Shows automatic rate-limit warning.
2. **`apiClient` ([frontend/src/lib/apiClient.ts:33](file:///frontend/src/lib/apiClient.ts#L33))** (Secondary client, used across 24 files):
   - Intercepts `403 Forbidden` on mutating requests and automatically retries once with a fresh CSRF token from the cookie ([apiClient.ts:87](file:///frontend/src/lib/apiClient.ts#L87)).
   - Intercepts `401 Unauthorized` and dispatches DOM event: `window.dispatchEvent(new CustomEvent('auth:session-expired'))`.
   - Contains adapter interception for `sample-room` mock testing mode.

---

## 10.2 Server State Management (TanStack Query v5)
Configured globally in [frontend/src/App.tsx:28-52](file:///frontend/src/App.tsx#L28-L52):
- **Stale Time**: `staleTime: 5 * 60 * 1000` (5 minutes). Data remains fresh in cache for 5 minutes without re-fetching unless explicitly invalidated by an SSE event.
- **Retry Strategy**:
  ```ts
  retry: (failureCount, error: any) => {
    const status = error?.status ?? error?.response?.status;
    if (status === 400 || status === 403 || status === 404) return false;
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 60000)
  ```
- **Global Error Handling**: `queryCache.onError` displays throttled toast notifications via Sonner, skipping 401 and AbortErrors.

---

## 10.3 Page Load API Request Volume
When navigating to the application's core screens, the following API requests are dispatched concurrently:

### 1. User Dashboard / Home Screen (`/app`)
Fires **5 parallel REST requests + 1 persistent SSE stream**:
- `GET /api/v1/home`: User passport, current room memberships, upcoming hackathons.
- `GET /api/v1/me`: Authenticated user profile and avatar.
- `GET /api/v1/notifications`: Initial unread notification list.
- `GET /api/v1/user/preferences`: Notification and theme preferences.
- `GET /api/v1/billing`: User plan tier and quotas.
- `GET /api/v1/notifications/stream`: Persistent Server-Sent Events stream for real-time notifications.

### 2. Room Overview Screen (`/app/room/:roomId` or `/overview`)
Fires **7 parallel REST requests + 1 persistent SSE stream + 1 periodic heartbeat**:
- `GET /api/v1/rooms/{roomId}`: Room metadata, stage, deadlines.
- `GET /api/v1/rooms/{roomId}/overview`: KPIs, attention items, task burndown counts.
- `GET /api/v1/rooms/{roomId}/team`: Team roster, member status, skills.
- `GET /api/v1/rooms/{roomId}/nav-badges`: Navigation badge counters (polled every 60s).
- `GET /api/v1/rooms/{roomId}/presence`: Online user IDs list.
- `GET /api/v1/rooms/{roomId}/clock`: Server clock for client drift synchronization.
- `POST /api/v1/rooms/{roomId}/heartbeat`: Presence heartbeat (dispatched on mount and every 60s).
- `GET /api/v1/rooms/{roomId}/events`: Persistent Server-Sent Events room stream (`useRoomLive`).

### 3. Pitch Kit Screen (`/app/room/:roomId/pitch-kit`)
Fires **8 REST requests + 2 CONCURRENT SSE STREAMS**:
- Standard room shell requests (`/rooms/{id}`, `/overview`, `/team`, `/nav-badges`).
- `GET /api/v1/rooms/{roomId}/pitch`: Pitch metadata, deck links, stage status.
- `GET /api/v1/rooms/{roomId}/pitch/settings`: Presenter and operator role locks.
- `GET /api/v1/rooms/{roomId}/demo/assets`: Demo station links and backup video URLs.
- `GET /api/v1/rooms/{roomId}/demo/ladder`: Demo feature ladder items.
- `GET /api/v1/rooms/{roomId}/demo/preflight`: Preflight checklist item status.
- `GET /api/v1/rooms/{roomId}/qna`: Judge Q&A defense questions.
- `GET /api/v1/rooms/{roomId}/rehearsals`: Rehearsal runs and telemetry.
- **DUPLICATE SSE STREAM (CRITICAL)**:
  - Stream 1: Opened by outer shell `useRoomLive` in `frontend/src/design/live.tsx`.
  - Stream 2: Opened independently by [pitch-kit-page.tsx:53](file:///frontend/src/features/pitch-kit/pitch-kit-page.tsx#L53):
    ```tsx
    const { lastEvent } = useRoomEvents(roomId, currentUser?.id);
    ```
  - **Risk**: Opening 2 room streams + 1 notification stream consumes all 3 allowed user streams (`MAX_STREAMS_PER_USER = 3`). If the user opens a second browser tab, the server terminates the oldest stream, causing reconnect churn.

---

## 10.4 Client State Management (Zustand Stores)
8 lightweight Zustand stores manage non-server UI state:
- `useDraftStore.ts`: Local draft caching for brief text, idea submissions, docs, and pitch scripts to prevent data loss before manual save.
- `useSidebarStore.ts`: Collapsed/expanded navigation state and mobile drawer visibility.
- `useOverlayStore.ts`: Global command palette (`Cmd+K`), modal dialogs, and settings slide-over.
- `useAiKeyDialogStore.ts`: User-supplied BYOK AI key configuration dialog.
- `useAuthStore.ts`: Client-side cached copy of user identity.
- `useTimePreferencesStore.ts`: Relative vs absolute timestamp formatting and timezone overrides.
- `useMotionModeStore.ts`: Synchronization of reduced motion settings (`system`, `reduced`, `standard`).
- `useSpotlightStore.ts`: Product tour spotlight step progression and highlighted DOM elements.
