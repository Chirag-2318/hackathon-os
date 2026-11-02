# 4. Request Lifecycle & API Inventory

## 4.1 End-to-End Typical Request Flow
Tracing a mutating request (e.g. `POST /api/v1/rooms/{roomId}/tasks` creating a sprint task):

1. **Client Action (Browser)**:
   - User types a task title on the Kanban board and clicks "Create Task".
   - `frontend/src/features/board/components/create-task-dialog.tsx` dispatches a mutation using `apiFetch` ([frontend/src/design/api.ts](file:///frontend/src/design/api.ts#L53)).
   - `apiFetch` reads cookie `XSRF-TOKEN`, attaches header `X-XSRF-TOKEN`, generates a unique `Idempotency-Key` header, sets `Content-Type: application/json`, and includes `credentials: 'include'`.
2. **Edge Proxy & CDN (Vercel)**:
   - Request hits `https://<app>.vercel.app/api/v1/rooms/{roomId}/tasks`.
   - Vercel evaluates [frontend/vercel.json](file:///frontend/vercel.json#L4): matches rewrite rule `{"source": "/api/:path*", "destination": "https://<render-service>.onrender.com/api/:path*"}`.
   - Vercel proxies the HTTP request over TLS to Render, preserving `Cookie`, `X-XSRF-TOKEN`, `Idempotency-Key`, and injecting standard forwarding headers (`x-vercel-forwarded-for`, `x-forwarded-proto: https`, `x-forwarded-host`).
3. **Container Ingress & Tomcat Server Entry**:
   - Render terminates SSL and forwards cleartext traffic to port 10000.
   - Embedded Apache Tomcat servlet container (`server.port: 10000`, `server.forward-headers-strategy: framework`) dispatches the request to a Java 25 Virtual Thread (`spring.threads.virtual.enabled: true`).
4. **Servlet Filter Pipeline (in exact execution order)**:
   - **`RequestIdFilter.java`**: Extracts incoming `X-Request-Id` or generates a random UUID; binds it to SLF4J MDC (`RequestIdFilter.MDC_KEY`) and appends `X-Request-Id` to the HTTP response headers.
   - **`ApiSecurityHeadersFilter.java`**: Appends baseline security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`, restrictive CSP).
   - **Spring Security Filter Chain (Order 2: `SecurityConfig.java:83`)**:
     - *CorsFilter*: Evaluates origin against `appProperties.getCors().getAllowedOrigins()`.
     - *CsrfFilter*: Evaluates `CookieCsrfTokenRepository.withHttpOnlyFalse()` ([SecurityConfig.java:87](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L87)); compares `X-XSRF-TOKEN` request header with session token.
     - *SecurityContextHolderFilter*: Extracts `JSESSIONID` session cookie from Tomcat's `StandardSessionManager`; restores the authenticated `User` principal.
     - *AuthorizationFilter*: Verifies that the matched route pattern `/api/v1/rooms/**` requires `.authenticated()`. If unauthenticated, returns 401 with standard JSON `ErrorResponse` ([SecurityConfig.java:125](file:///backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L125)).
5. **Spring WebMvc Interceptor Pipeline ([WebMvcConfig.java:42](file:///backend/src/main/java/com/hackathonos/backend/common/config/WebMvcConfig.java#L42))**:
   - **`RateLimitInterceptor.preHandle`**: Resolves client IP via `ClientIpResolver` (`x-vercel-forwarded-for`). For authenticated requests, checks caller bucket `user:<uuid>`. Checks if controller/method has `@RateLimited`. If exceeded, sets `Retry-After` header and throws `TooManyRequestsException` (429).
   - **`RoomChangeInterceptor.preHandle`**: Records start timestamp.
6. **Controller Dispatch & Argument Resolution**:
   - `DispatcherServlet` identifies matching route in `TaskController.java` (`@PostMapping("/api/v1/rooms/{roomId}/tasks")`).
   - `WebMvcConfig.createUserResolver` resolves parameter `User user` from `CurrentUser.get()`.
   - Jakarta Bean Validation (`@Valid`) validates `CreateTaskRequest` payload fields (`@NotBlank`, `@Size`).
7. **Service Layer & Domain Access Control**:
   - Controller invokes `TaskService.createTask(roomId, request, user)`.
   - `RoomAccess.requireMember(roomId, user)` ([RoomAccessService.java:50](file:///backend/src/main/java/com/hackathonos/backend/rooms/RoomAccessService.java#L50)) verifies:
     - Room exists and is not soft-deleted or archived (`deleted_at IS NULL AND archived_at IS NULL`).
     - Query `roomMemberRepository.findByRoomIdAndUserId(roomId, userId)` finds active membership. If missing, throws `ForbiddenException("NOT_A_MEMBER")` (403).
   - Generates sequential project task key (e.g. `HOS-14`) via `TaskKeyService.java`.
   - Checks task dependencies; rejects circular dependencies.
8. **Data Layer Persistence & Transaction Commit**:
   - `@Transactional` commits changes.
   - `TaskRepository.save(task)` executes `INSERT INTO tasks ...` through HikariCP connection.
   - Database increments version column (`@Version private Long version` for optimistic concurrency protection).
9. **Post-Completion Real-Time Hook ([RoomChangeInterceptor.java:37](file:///backend/src/main/java/com/hackathonos/backend/events/RoomChangeInterceptor.java#L37))**:
   - `afterCompletion` executes because HTTP status is 201 (< 400).
   - Regex matches `/api/v1/rooms/{roomId}/tasks` -> resolves topic `"board"`.
   - 150ms burst deduplication check passes.
   - Publishes event to `RoomEventHub`:
     - Monotonic sequence increment: `seq = eventHub.nextSeq(roomId)`.
     - Appends to in-memory 200-event ring buffer (`roomRingBuffers`).
     - Submits broadcast task to `sseExecutor` (pool size: 4) pushing SSE data to all open `SseEmitter` instances in this room.
10. **Client Broadcast & Cache Invalidation**:
    - All connected teammates' browsers receive SSE named event `"room"` with payload `{"seq": 42, "topic": "board", "roomId": "...", "actorName": "Alice"}`.
    - Teammates' `useRoomLive` hook in `frontend/src/design/live.tsx`:
      - Shows brief toast: `"Alice updated the board"`.
      - Flashes visual accent outline on changed item for 1.2s.
      - Debounces for 250ms and calls `queryClient.invalidateQueries({ queryKey: ['board', roomId] })`.
    - TanStack Query automatically refetches `/api/v1/rooms/{roomId}/tasks` in the background.

---

## 4.2 Concurrency & Threading Model
- **Virtual Threads (Project Loom)**: Enabled in [backend/src/main/resources/application.yml](file:///backend/src/main/resources/application.yml#L33):
  ```yaml
  spring:
    threads:
      virtual:
        enabled: true
  ```
  Tomcat assigns incoming requests to lightweight virtual threads, allowing thousands of concurrent idle or I/O-blocked connections without consuming operating system threads.
- **Tomcat Limits**: Configured in `application.yml:9-12`:
  - `server.tomcat.threads.max: 200`
  - `server.tomcat.max-connections: 8192`
- **Database Connection Pool Bottleneck (CRITICAL)**:
  - While Tomcat supports 8,192 connections, the HikariCP pool in production ([application-prod.yml:21](file:///backend/src/main/resources/application-prod.yml#L21)) is capped at:
    ```yaml
    maximum-pool-size: 5
    minimum-idle: 1
    ```
  - **Severe Imbalance**: If more than 5 virtual threads perform concurrent database queries, the 6th virtual thread blocks on `HikariPool.getConnection()`. If connections are held by slow operations (such as AI calls inside `@Transactional`), requests queue up and abort with `SQLTransientConnectionException` after `connection-timeout: 10000ms`.
- **SSE Thread Pool**: `RoomEventHub.java:44` allocates a fixed thread pool:
  ```java
  private final ExecutorService sseExecutor = Executors.newFixedThreadPool(4);
  private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(2);
  ```
  All SSE event broadcast tasks across ALL rooms are queued to these 4 threads. Under heavy load, slow SSE network clients can monopolize these threads, causing broadcast latency for all users.
- **Scheduler Thread Pool**: `spring.task.scheduling.pool.size: 4` allocates 4 threads for 13 scheduled background jobs.

---

## 4.3 Request Validation & Error Handling
- **Validation Mechanism**: Jakarta Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Email`) on controller request body DTOs.
- **Global Exception Handler**: `ApiExceptionHandler.java` ([backend/src/main/java/com/hackathonos/backend/common/error/ApiExceptionHandler.java](file:///backend/src/main/java/com/hackathonos/backend/common/error/ApiExceptionHandler.java#L26)):
  - Consistently returns HTTP error response format:
    ```json
    {
      "timestamp": "2026-11-02T08:45:00.123Z",
      "status": 400,
      "code": "VALIDATION_FAILED",
      "message": "Validation failed for request",
      "requestId": "c1f7a0b2-...",
      "fieldErrors": {
        "title": "Title cannot be blank"
      }
    }
    ```
- **Error Code Consistency**: Mapped exceptions return standardized machine-readable `code` attributes: `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `LIMIT_REACHED`, `CONFLICT`, `VALIDATION_FAILED`, `TOO_MANY_REQUESTS`, `BAD_GATEWAY`.

---

## 4.4 Unbounded List Endpoints (Pagination & Filtering Audit)
The majority of collection endpoints in the application do **not** support pagination, returning complete lists. Under moderate-to-high data volume, these represent memory and bandwidth risks:

| Endpoint | Handler | Pagination Status | Risk Level | Notes |
|---|---|---|---|---|
| `GET /api/v1/rooms/{roomId}/tasks` | `TaskController.listTasks` | **Unbounded** | High | Returns all tasks in room. Sprint rooms with 100+ tasks return full entity hierarchy. |
| `GET /api/v1/rooms/{roomId}/ideas` | `IdeasController.getIdeas` | **Unbounded** | High | Returns all brainstormed ideas and sub-links. |
| `GET /api/v1/rooms/{roomId}/docs` | `DocController.listDocs` | **Unbounded (N+1)** | Critical | Returns all docs, executing N+1 version queries per doc. |
| `GET /api/v1/rooms/{roomId}/rehearsals` | `RehearsalController.getRehearsals` | **Unbounded** | Medium | Returns all rehearsal runs and transcript metrics. |
| `GET /api/v1/rooms/{roomId}/members` | `MemberController.getMembers` | **Unbounded** | Low | Hackathon teams rarely exceed 10 members. |
| `GET /api/v1/tools` | `PublicToolController.getTools` | **Unbounded** | Low | Curated directory; fixed dataset size. |
| `GET /api/v1/playbooks` | `PublicPlaybookController.getPlaybooks`| **Unbounded** | Low | Curated catalog; fixed dataset size. |
| `GET /api/v1/notifications` | `NotificationController.list` | **Unbounded** | Medium | Returns all user notifications without limit or offset. |
| `GET /api/v1/rooms/{roomId}/activity` | `ActivityController.getActivity` | Partial | Medium | Supports `limit` param but defaults to unbounded or large slices. |
| `GET /api/v1/rooms/{roomId}/events` (JSON) | `RoomEventController.getEvents` | Paginated (`after`, `limit: 50`) | Low | Safely bounds replay history. |

---

## 4.5 Complete API Inventory Table (348 Endpoints)
The table below inventories all 348 canonical HTTP endpoints implemented across 67 Spring MVC controllers.

| Method | Path | Auth Required | Handler File & Method | DB Tables Touched | External Calls | Concurrency | Notes |
|---|---|---|---|---|---|---|---|
| `GET` | `/.well-known/oauth-authorization-server` | No (Public) | `OAuthServerController.java:getDiscovery` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
| `POST` | `/api/v1/admin/hackathons/reload` | Yes (Admin) | `AdminOverviewController.java:reloadHackathons` | None / In-Memory | SMTP | Sync | - |
| `GET` | `/api/v1/admin/overview` | Yes (Admin) | `AdminOverviewController.java:getOverview` | None / In-Memory | SMTP | Sync | - |
| `PATCH` | `/api/v1/admin/settings` | Yes (Admin) | `AdminOverviewController.java:updateSettings` | None / In-Memory | SMTP | Sync | - |
| `GET` | `/api/v1/admin/text/csv` | Yes (Admin) | `AdminOverviewController.java:downloadWaitlistCsv` | None / In-Memory | SMTP | Sync | - |
| `GET` | `/api/v1/admin/waitlist.csv` | Yes (Admin) | `AdminOverviewController.java:downloadWaitlistCsv` | None / In-Memory | SMTP | Sync | - |
| `GET` | `/api/v1/ai/status` | Yes (Session) | `AiController.java:getStatus` | aiusagedaily, brief, usage, useraikey | Groq/LLM | Sync | - |
| `POST` | `/api/v1/ai/status/test` | Yes (Session) | `AiController.java:testConnection` | aiusagedaily, brief, usage, useraikey | Groq/LLM | Sync | - |
| `POST` | `/api/v1/ai/suggest-room-name` | Yes (Session) | `AiController.java:suggestRoomName` | aiusagedaily, brief, usage, useraikey | Groq/LLM | Sync | - |
| `POST` | `/api/v1/billing/interest` | Yes (Session) | `BillingController.java:recordInterest` | planinterest, room, userplan | None | Sync | - |
| `POST` | `/api/v1/client-errors` | No (Public) | `ClientErrorController.java:reportError` | clienterror | SMTP | Sync | - |
| `POST` | `/api/v1/dev/demo-room` | Yes (Session) | `DevController.java:seedDemoRoom` | branch, commit, demomedia, githubbranch, | SMTP | Sync | - |
| `GET` | `/api/v1/dev/mail/preview/{template}` | Yes (Session) | `DevMailController.java:preview` | None / In-Memory | None | Sync | - |
| `POST` | `/api/v1/dev/mail/test` | Yes (Session) | `DevMailController.java:sendTest` | None / In-Memory | None | Sync | - |
| `POST` | `/api/v1/dev/mcp-token` | Yes (Session) | `DevController.java:createDevMcpToken` | branch, commit, demomedia, githubbranch, | SMTP | Sync | - |
| `POST` | `/api/v1/dev/rooms/{roomId}/fake-members` | Yes (Session) | `DevController.java:addFakeMembers` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `POST` | `/api/v1/dev/rooms/{roomId}/github/add-commits` | Yes (Session) | `DevController.java:addCommits` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `POST` | `/api/v1/dev/rooms/{roomId}/seed-ideas` | Yes (Session) | `DevController.java:seedIdeas` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `POST` | `/api/v1/dev/rooms/{roomId}/seed-present` | Yes (Session) | `DevController.java:seedPresent` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `POST` | `/api/v1/dev/rooms/{roomId}/set-clock` | Yes (Session) | `DevController.java:setClock` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `POST` | `/api/v1/dev/rooms/{roomId}/simulate-progress` | Yes (Session) | `DevController.java:simulateProgress` | branch, commit, demomedia, githubbranch, | SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/dev/seed` | Yes (Session) | `DevSeedController.java:clearDemoRooms` | brief, doc, docversion, idea, member, pi | Canva, SMTP | Sync | - |
| `POST` | `/api/v1/dev/seed` | Yes (Session) | `DevSeedController.java:seedDemoRoom` | brief, doc, docversion, idea, member, pi | Canva, SMTP | Sync | - |
| `GET` | `/api/v1/email/unsubscribe` | Yes (Session) | `UnsubscribeController.java:unsubscribe` | preference, user, useremailpreference | SMTP | Sync | - |
| `GET` | `/api/v1/event-templates` | Yes (Session) | `EventTemplateController.java:listTemplates` | eventtemplate, template | None | Sync | - |
| `DELETE` | `/api/v1/github/link` | Yes (User) | `GitHubController.java:disconnectLink` | branch, branchtask, brief, client, commi | GitHub | Sync | - |
| `GET` | `/api/v1/github/link/callback` | No (Public) | `GitHubController.java:linkCallback` | branch, branchtask, brief, client, commi | GitHub | Sync | - |
| `GET` | `/api/v1/github/link/start` | Yes (Session) | `GitHubController.java:startLink` | branch, branchtask, brief, client, commi | GitHub | Sync | - |
| `GET` | `/api/v1/github/my-repos` | Yes (Session) | `GitHubController.java:getMyRepos` | branch, branchtask, brief, client, commi | GitHub | Sync | - |
| `GET` | `/api/v1/github/status` | Yes (User) | `GitHubController.java:getStatus` | branch, branchtask, brief, client, commi | GitHub | Sync | - |
| `GET` | `/api/v1/hackathons/live` | Yes (Session) | `HackathonController.java:getLiveHackathons` | hackathon, hackathonsuggestion, suggesti | None | Sync | Rate Limited |
| `POST` | `/api/v1/hackathons/suggestions` | Yes (Session) | `HackathonController.java:submitSuggestion` | hackathon, hackathonsuggestion, suggesti | None | Sync | Rate Limited |
| `GET` | `/api/v1/health` | No (Public) | `PublicHealthController.java:check` | None / In-Memory | None | Sync | - |
| `GET` | `/api/v1/home` | Yes (Session) | `HomeController.java:getHome` | brief, idea, notification, phase, planph | None | Sync | - |
| `DELETE` | `/api/v1/integrations/canva` | Yes (User) | `CanvaController.java:disconnect` | token, useroauthtoken | Canva | Sync | - |
| `GET` | `/api/v1/integrations/canva/callback` | No (Public) | `CanvaController.java:callback` | token, useroauthtoken | Canva | Sync | - |
| `GET` | `/api/v1/integrations/canva/connect` | Yes (Session) | `CanvaController.java:connect` | token, useroauthtoken | Canva | Sync | - |
| `GET` | `/api/v1/integrations/canva/status` | Yes (User) | `CanvaController.java:getStatus` | token, useroauthtoken | Canva | Sync | - |
| `DELETE` | `/api/v1/integrations/github` | Yes (Session) | `IntegrationsController.java:disconnectGitHub` | github, member, private, repo, room, roo | SMTP | Sync | - |
| `DELETE` | `/api/v1/integrations/github/private-access` | Yes (Session) | `IntegrationsController.java:removePrivateAccess` | github, member, private, repo, room, roo | SMTP | Sync | - |
| `POST` | `/api/v1/invites/accept` | Yes (Session) | `InviteController.java:acceptInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | - |
| `GET` | `/api/v1/invites/preview` | No (Public) | `InviteController.java:previewInviteByToken` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | - |
| `GET` | `/api/v1/invites/{token}` | No (Public) | `InviteController.java:previewInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | - |
| `POST` | `/api/v1/invites/{token}/join` | Yes (Session) | `InviteController.java:joinByInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | - |
| `POST` | `/api/v1/mail/test-self` | Yes (Session) | `MailTestController.java:testSelf` | None / In-Memory | None | Sync | Rate Limited |
| `GET` | `/api/v1/mcp/rooms` | Yes (Bearer Token) | `McpController.java:listRooms` | planstep, room | None | Sync | - |
| `GET` | `/api/v1/mcp/rooms/{roomId}/steps` | Yes (Bearer Token) | `McpController.java:getSteps` | planstep, room | None | Sync | Room Member |
| `GET` | `/api/v1/mcp/rooms/{roomId}/steps/{step}/brief` | Yes (Bearer Token) | `McpController.java:getStepBrief` | planstep, room | None | Sync | Room Member |
| `POST` | `/api/v1/mcp/rooms/{roomId}/steps/{step}/submit` | Yes (Bearer Token) | `McpController.java:submitStep` | planstep, room | None | Sync | Room Member |
| `GET` | `/api/v1/me` | Yes (Session) | `UserController.java:getMe` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/mentor/{token}/ask` | No (Public) | `PublicMentorController.java:submitQuestion` | activityevent, brief, briefrubricitem, d | SMTP | Sync | - |
| `GET` | `/api/v1/meta` | No (Public) | `MetaController.java:getMeta` | aiusagedaily, brief, usage | Groq/LLM | Sync | - |
| `GET` | `/api/v1/notifications` | Yes (Session) | `NotificationController.java:listNotifications` | member, notification, room, roommember,  | SMTP | Sync | - |
| `POST` | `/api/v1/notifications/mark-all-read` | Yes (Session) | `NotificationController.java:markAllRead` | member, notification, room, roommember,  | SMTP | Sync | - |
| `GET` | `/api/v1/notifications/stream` | Yes (Session) | `EventStreamController.java:getNotificationStream` | None / In-Memory | None | Async (SSE) | Room Member; SSE Stream |
| `GET` | `/api/v1/notifications/unread-count` | Yes (Session) | `NotificationController.java:getUnreadCount` | member, notification, room, roommember,  | SMTP | Sync | - |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | Yes (Session) | `NotificationController.java:markReadGlobal` | member, notification, room, roommember,  | SMTP | Sync | - |
| `ALL` | `/api/v1/portfolio/projects/{roomId}` | Yes (User) | `PortfolioController.java:updateProjectCuration` | award, demomedia, doc, docversion, githu | Canva, SMTP | Sync | Room Member |
| `PATCH` | `/api/v1/portfolio/{roomId}` | Yes (User) | `PortfolioController.java:setVisibility` | award, demomedia, doc, docversion, githu | Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/public/capacity` | No (Public) | `PublicCapacityController.java:getCapacity` | None / In-Memory | SMTP | Sync | - |
| `POST` | `/api/v1/public/waitlist` | No (Public) | `PublicCapacityController.java:joinWaitlist` | None / In-Memory | SMTP | Sync | - |
| `POST` | `/api/v1/qna/sessions/{sessionId}/answers` | Yes (Session) | `QnaController.java:submitSessionAnswer` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | - |
| `POST` | `/api/v1/qna/sessions/{sessionId}/audio` | Yes (Session) | `QnaController.java:uploadSessionAudio` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | - |
| `POST` | `/api/v1/qna/sessions/{sessionId}/finish` | Yes (Session) | `QnaController.java:finishSession` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | - |
| `GET` | `/api/v1/rooms` | Yes (Session) | `RoomController.java:listRooms` | brief, checkpoint, doc, docversion, idea | None | Sync | - |
| `POST` | `/api/v1/rooms` | Yes (Session) | `RoomController.java:createRoom` | brief, checkpoint, doc, docversion, idea | None | Sync | - |
| `POST` | `/api/v1/rooms/join` | Yes (Session) | `InviteController.java:joinByCode` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | - |
| `GET` | `/api/v1/rooms/suggest-name` | Yes (Session) | `RoomController.java:suggestName` | brief, checkpoint, doc, docversion, idea | None | Sync | - |
| `DELETE` | `/api/v1/rooms/{roomId}` | Yes (Session) | `RoomController.java:archiveRoom` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}` | Yes (Session) | `RoomController.java:getRoomDetail` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}` | Yes (Session) | `RoomController.java:updateRoom` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/acceptance/{itemId}` | Yes (Session) | `TaskController.java:deleteAcceptance` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/acceptance/{itemId}` | Yes (Session) | `TaskController.java:updateAcceptance` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/activity` | Yes (Session) | `ActivityController.java:listRoomActivity` | activity, activityevent, user | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub` | Yes (User) | `ApiHubController.java:getApis` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub/endpoints` | Yes (User) | `ApiHubController.java:getEndpoints` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/api-hub/endpoints` | Yes (User) | `ApiHubController.java:createEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:deleteEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:updateEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/api-hub/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:updateEndpointPut` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub/external` | Yes (User) | `ApiHubController.java:getExternals` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/api-hub/external` | Yes (User) | `ApiHubController.java:createExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/api-hub/external/{apiId}` | Yes (User) | `ApiHubController.java:deleteExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/api-hub/external/{apiId}` | Yes (User) | `ApiHubController.java:updateExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/api-hub/external/{apiId}/check` | Yes (User) | `ApiHubController.java:checkExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/api-hub/import` | Yes (Session) | `ApiHubController.java:importMultipart` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/api-hub/import-from-plan` | Yes (User) | `ApiHubController.java:importFromPlan` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/api-hub/mock` | Yes (User) | `ApiHubController.java:toggleMock` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub/openapi.json` | Yes (Session) | `ApiHubController.java:exportOpenApiJson` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub/openapi.yaml` | Yes (Session) | `ApiHubController.java:exportOpenApiYaml` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/api-hub/summary` | Yes (User) | `ApiHubController.java:getSummary` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/apis` | Yes (User) | `ApiHubController.java:getApis` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/apis/endpoints` | Yes (User) | `ApiHubController.java:createEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:deleteEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:updateEndpoint` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/apis/endpoints/{endpointId}` | Yes (User) | `ApiHubController.java:updateEndpointPut` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/apis/externals` | Yes (User) | `ApiHubController.java:createExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/apis/externals/{apiId}` | Yes (User) | `ApiHubController.java:deleteExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/apis/externals/{apiId}` | Yes (User) | `ApiHubController.java:updateExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/apis/externals/{apiId}/check` | Yes (User) | `ApiHubController.java:checkExternal` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/apis/import` | Yes (Session) | `ApiHubController.java:importMultipart` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/apis/mock` | Yes (User) | `ApiHubController.java:toggleMock` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/apis/openapi.json` | Yes (Session) | `ApiHubController.java:exportOpenApiJson` | apiendpoint, apiexternal, apimocksetting | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/application/zip` | Yes (Session) | `RoomExportController.java:exportRoom` | brief, doc, docversion, github, githubbr | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/board` | Yes (Session) | `BoardController.java:getBoard` | acceptance, branchtask, comment, depende | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/brief` | Yes (Session) | `BriefController.java:deleteBrief` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/brief` | Yes (Session) | `BriefController.java:getBrief` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/brief` | Yes (Session) | `BriefController.java:saveBrief` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/confirm` | Yes (Session) | `BriefController.java:confirmBrief` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/brief/confirmed-fields` | Yes (Session) | `BriefController.java:updateConfirmedField` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/extract` | Yes (Session) | `BriefController.java:extractBrief` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/extract/auto` | Yes (Session) | `BriefController.java:autoExtract` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/extract/validate` | Yes (Session) | `BriefController.java:validateExtract` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/brief/extraction-prompt` | Yes (Session) | `BriefController.java:getExtractionPrompt` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/intake/file` | Yes (Session) | `BriefController.java:intakeFile` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/source/images` | Yes (Session) | `BriefController.java:setImagesSource` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/source/link` | Yes (Session) | `BriefController.java:setLinkSource` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/source/pdf` | Yes (Session) | `BriefController.java:setPdfSource` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/brief/source/text` | Yes (Session) | `BriefController.java:setTextSource` | brief, briefrubricitem, room, rubric, up | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/checkpoints` | Yes (Session) | `CheckpointController.java:getCheckpoints` | checkpoint, demomedia, mvpstate, phase,  | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/checkpoints/{id}/pass` | Yes (Session) | `CheckpointController.java:passCheckpoint` | checkpoint, demomedia, mvpstate, phase,  | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/checkpoints/{id}/progress` | Yes (Session) | `CheckpointController.java:updateProgress` | checkpoint, demomedia, mvpstate, phase,  | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/comments/{commentId}` | Yes (Session) | `TaskController.java:deleteComment` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/comments/{commentId}` | Yes (Session) | `TaskController.java:updateComment` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/context-pack.md` | Yes (Session) | `PhaseController.java:getContextPack` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/crowd-check/rows/{rowId}` | Yes (User) | `CrowdCheckController.java:deleteRow` | crowdrow, idea, room | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/deck/slides` | Yes (User) | `DeckAuditController.java:getSlides` | audit, brief, briefrubricitem, deckaudit | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/deck/slides` | Yes (Session) | `DeckAuditController.java:uploadSlides` | audit, brief, briefrubricitem, deckaudit | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/deck/slides/text` | Yes (User) | `DeckAuditController.java:saveSlidesText` | audit, brief, briefrubricitem, deckaudit | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/demo/assets/zip` | Yes (User) | `DemoStationController.java:downloadScreenshotsZip` | asset, demoasset, demoladder, demoprefli | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/demo/assets/{assetId}` | Yes (User) | `DemoStationController.java:deleteAsset` | asset, demoasset, demoladder, demoprefli | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/demo/assets/{assetId}/file` | Yes (User) | `DemoStationController.java:getScreenshotFile` | asset, demoasset, demoladder, demoprefli | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/demo/preflight/reset` | Yes (User) | `DemoStationController.java:resetPreflight` | asset, demoasset, demoladder, demoprefli | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/diagrams/{id}` | Yes (User) | `DiagramController.java:deleteDiagram` | diagram, member, roommember | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs` | Yes (User) | `DocController.java:listDocs` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/docs` | Yes (User) | `DocController.java:createCustomDoc` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/docs/ai` | Yes (User) | `DocController.java:askGeneralDocAi` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/docs/comments/{commentId}` | Yes (User) | `DocController.java:deleteComment` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs/download.zip` | Yes (User) | `DocController.java:downloadAllZip` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs/{docId}/download` | Yes (User) | `DocController.java:downloadDoc` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/docs/{fileName}` | Yes (User) | `DocController.java:deleteDoc` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}` | Yes (User) | `DocController.java:getDoc` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/docs/{fileName}` | Yes (User) | `DocController.java:updateDoc` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/docs/{fileName}/ai` | Yes (User) | `DocController.java:askDocAi` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}/comments` | Yes (User) | `DocController.java:listComments` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/docs/{fileName}/comments` | Yes (User) | `DocController.java:addComment` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/docs/{fileName}/restore` | Yes (User) | `DocController.java:restoreVersion` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/docs/{fileName}/versions/{version}` | Yes (User) | `DocController.java:getVersionContent` | comment, doc, doccomment, docversion, us | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/events` | Yes (Session) | `EventStreamController.java:getRoomEvents` | None / In-Memory | None | Async (SSE) | Room Member; SSE Stream |
| `GET` | `/api/v1/rooms/{roomId}/events/latest` | Yes (Session) | `RoomEventController.java:getLatestEventId` | event, roomevent | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/export` | Yes (Session) | `RoomExportController.java:exportRoom` | brief, doc, docversion, github, githubbr | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/export.zip` | Yes (Session) | `RoomExportController.java:exportRoom` | brief, doc, docversion, github, githubbr | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/export/push-docs` | Yes (Session) | `RoomExportController.java:pushDocsToGithub` | brief, doc, docversion, github, githubbr | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github` | Yes (User) | `GitHubController.java:getPage` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/attention/{itemKey}/dismiss` | Yes (User) | `GitHubController.java:dismissAttention` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/branches` | Yes (Session) | `GitHubController.java:getBranches` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/github/branches/{branchId}` | Yes (User) | `GitHubController.java:updateBranch` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/github/branches/{branchId}/tasks` | Yes (User) | `GitHubController.java:linkBranchTasks` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/checks` | Yes (User) | `GitHubController.java:getChecks` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/commits` | Yes (Session) | `GitHubController.java:getCommits` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/github/connect` | Yes (User) | `GitHubController.java:disconnect` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/connect` | Yes (User) | `GitHubController.java:connect` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/contributors` | Yes (User) | `GitHubController.java:getContributors` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/github/demo-marker` | Yes (User) | `GitHubController.java:deleteDemoMarker` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/demo-marker` | Yes (User) | `GitHubController.java:getDemoMarker` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/demo-marker` | Yes (Session) | `GitHubController.java:saveDemoMarker` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/github/deployed-link` | Yes (User) | `GitHubController.java:updateDeployedLink` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/freeze` | Yes (User) | `GitHubController.java:getFreezeChecklist` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/freeze` | Yes (User) | `GitHubController.java:freezeDemo` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/health` | Yes (Session) | `GitHubController.java:getHealth` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/link` | Yes (User) | `GitHubController.java:link` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/pulls` | Yes (Session) | `GitHubController.java:getPulls` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/summary` | Yes (Session) | `GitHubController.java:getSummary` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/github/sync` | Yes (User) | `GitHubController.java:sync` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/github/task-links` | Yes (User) | `GitHubController.java:getTaskLinks` | branch, branchtask, brief, client, commi | GitHub | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/heartbeat` | Yes (Session) | `MemberController.java:heartbeat` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/ideas` | Yes (Session) | `IdeasController.java:listIdeas` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideas` | Yes (Session) | `IdeasController.java:createIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/ideas/export.md` | Yes (Session) | `IdeasController.java:exportIdeasMarkdown` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/ideas/{ideaId}` | Yes (Session) | `IdeasController.java:deleteIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/ideas/{ideaId}` | Yes (Session) | `IdeasController.java:updateIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/approve` | Yes (Session) | `IdeasController.java:approveIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/primary` | Yes (Session) | `IdeasController.java:clearPrimary` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/primary` | Yes (Session) | `IdeasController.java:setPrimary` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/reject` | Yes (Session) | `IdeasController.java:rejectIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/restore` | Yes (Session) | `IdeasController.java:restoreIdea` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideas/{ideaId}/set-primary` | Yes (Session) | `IdeasController.java:setPrimaryPost` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/ideate` | Yes (Session) | `IdeasController.java:getIdeate` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideate/done` | Yes (Session) | `IdeasController.java:markIdeationDone` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideate/reopen` | Yes (Session) | `IdeasController.java:reopenIdeation` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideation/done` | Yes (Session) | `IdeasController.java:markIdeationDone` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/ideation/reopen` | Yes (Session) | `IdeasController.java:reopenIdeation` | brief, briefrubricitem, idea, idealink,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/invitations` | Yes (Session) | `MemberController.java:createInvitation` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/invitations/{id}` | Yes (Session) | `MemberController.java:revokeInvitation` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/invites` | Yes (Session) | `InviteController.java:listRoomInvites` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/invites` | Yes (Session) | `InviteController.java:createInviteLink` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/invites/email` | Yes (Session) | `InviteController.java:sendEmailInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/invites/{id}` | Yes (Session) | `InviteController.java:revokeInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/invites/{id}/resend` | Yes (Session) | `InviteController.java:resendInvite` | emailoutbox, eventtemplate, invitation,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/join-code/regenerate` | Yes (Session) | `RoomController.java:regenerateJoinCode` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/join-code/revoke` | Yes (Session) | `RoomController.java:revokeJoinCode` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/journey` | Yes (Session) | `RoomController.java:getJourney` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/leave` | Yes (Session) | `MemberController.java:leaveRoom` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/members` | Yes (Session) | `MemberController.java:listMembers` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/members/{userId}` | Yes (Session) | `MemberController.java:removeMember` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/members/{userId}/role` | Yes (Session) | `MemberController.java:updateRole` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/members/{userId}/skills` | Yes (Session) | `MemberController.java:updateSkills` | invitation, member, room, roominvitation | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/mentor-links/{linkId}` | Yes (User) | `MentorController.java:revokeLink` | activityevent, brief, briefrubricitem, d | SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/mvp` | Yes (Session) | `MvpController.java:getMvp` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp` | Yes (Session) | `MvpController.java:updateFullMvp` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/core-flow` | Yes (Session) | `MvpController.java:updateCoreFlow` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/cut-list` | Yes (Session) | `MvpController.java:updateCutList` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/health` | Yes (Session) | `MvpController.java:updateHealth` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/judge-prep` | Yes (Session) | `MvpController.java:updateJudgePrep` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/ledger` | Yes (Session) | `MvpController.java:updateLedger` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/mvp/pitch` | Yes (Session) | `MvpController.java:updatePitch` | cutitem, flowstep, ledgerrow, mvpcutitem | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/nav-badges` | Yes (User) | `OverviewController.java:getNavBadges` | brief, briefrubricitem, idea, member, me | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/notifications` | Yes (Session) | `NotificationController.java:listRoomNotifications` | member, notification, room, roommember,  | SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/notifications/mark-all-read` | Yes (Session) | `NotificationController.java:markAllReadForRoom` | member, notification, room, roommember,  | SMTP | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/notifications/{notificationId}/read` | Yes (Session) | `NotificationController.java:markRead` | member, notification, room, roommember,  | SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/overview` | Yes (User) | `OverviewController.java:getOverview` | brief, briefrubricitem, idea, member, me | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/phases` | Yes (Session) | `PhaseController.java:getPhases` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/phases/{phaseKey}/advance` | Yes (Session) | `PhaseController.java:advancePhase` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/phases/{phaseKey}/dismiss-ready` | Yes (Session) | `PhaseController.java:dismissReady` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/phases/{phaseKey}/tasks/generate` | Yes (Session) | `PhaseController.java:generateTasks` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/phases/{phaseKey}/tasks/prompt` | Yes (Session) | `PhaseController.java:getPhaseTaskPrompt` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/phases/{phaseKey}/tasks/validate` | Yes (Session) | `PhaseController.java:validateAndImportTasks` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/pitch` | Yes (User) | `PitchController.java:getPitch` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/pitch` | Yes (User) | `PitchController.java:updatePitch` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/pitch/ai-edit` | Yes (User) | `PitchController.java:aiEdit` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/pitch/coverage` | Yes (User) | `PitchController.java:getCoverage` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/pitch/deck/export.md` | Yes (User) | `PitchController.java:exportMarkdown` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/pitch/deck/order` | Yes (User) | `PitchController.java:reorderSlides` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/deck/source` | Yes (User) | `PitchController.java:deleteDeckSource` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/pitch/deck/source/file` | Yes (User) | `PitchController.java:getDeckFile` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/pitch/pull-from-doc` | Yes (Session) | `PitchController.java:pullFromDoc` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/pitch/push-to-doc` | Yes (User) | `PitchController.java:pushToDoc` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/qa/code-defense/{id}` | Yes (User) | `PitchController.java:deleteCodeDefense` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/qa/{id}` | Yes (User) | `PitchController.java:deleteQa` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/pitch/qna-practice` | Yes (User) | `PitchController.java:toggleQnaPractice` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/rehearse/runs/{id}` | Yes (User) | `PitchController.java:deleteRun` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/script` | Yes (User) | `PitchController.java:deletePitchScript` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/pitch/slides/{id}` | Yes (User) | `PitchController.java:deleteSlide` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/pitch/slides/{id}/coverage` | Yes (User) | `PitchController.java:updateCoverage` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/pitch/versions` | Yes (User) | `PitchController.java:getVersions` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/pitch/versions/{version}/restore` | Yes (User) | `PitchController.java:restoreVersion` | brief, briefrubricitem, doc, docversion, | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/plan` | Yes (Session) | `PlanController.java:getPlan` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/plan/context.md` | Yes (Session) | `PlanController.java:getContextMarkdown` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/plan/notes` | Yes (Session) | `PlanController.java:updatePlanNotes` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/prepare` | Yes (Session) | `PlanController.java:preparePlan` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/plan/prepare/status` | Yes (Session) | `PlanController.java:getPrepareStatus` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/start` | Yes (Session) | `PlanController.java:startPlan` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/plan/steps/{stepKey}` | Yes (Session) | `PlanController.java:saveStepDraft` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepKey}/generate` | Yes (Session) | `PlanController.java:generateStep` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/prefetch-next` | Yes (Session) | `PlanController.java:prefetchNext` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/prepare` | Yes (Session) | `PlanController.java:prepareStep` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/prepare/status` | Yes (Session) | `PlanController.java:getStepPrepareStatus` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/prompt` | Yes (Session) | `PlanController.java:getStepPrompt` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/prompt/refresh` | Yes (Session) | `PlanController.java:refreshStepPrompt` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/steps/{stepNumber}/validate` | Yes (Session) | `PlanController.java:validateStepMultipart` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/plan/validate` | Yes (Session) | `PlanController.java:validateStep` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/prep/{itemId}` | Yes (User) | `PrepController.java:deleteItem` | brief, github, prepitem, room | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/presence` | Yes (Session) | `EventStreamController.java:getPresence` | None / In-Memory | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/presence` | Yes (Session) | `PresenceController.java:sendHeartbeat` | user | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/presence/heartbeat` | Yes (Session) | `PresenceController.java:sendHeartbeat` | user | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/presence/members` | Yes (Session) | `PresenceController.java:getOnlineMembers` | user | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/presence/online-members` | Yes (Session) | `PresenceController.java:getOnlineMembers` | user | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/qna` | Yes (User) | `QnaController.java:getItems` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/grade` | Yes (User) | `QnaController.java:gradeAnswer` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/items` | Yes (User) | `QnaController.java:createCustomItem` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/qna/items/{itemId}` | Yes (User) | `QnaController.java:deleteCustomItem` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/qna/items/{itemId}` | Yes (User) | `QnaController.java:patchCustomItem` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/qna/map` | Yes (User) | `QnaController.java:getMap` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/more` | Yes (User) | `QnaController.java:generateMore` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/sessions` | Yes (User) | `QnaController.java:startSession` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/answers` | Yes (Session) | `QnaController.java:submitSessionAnswer` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/audio` | Yes (Session) | `QnaController.java:uploadSessionAudio` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/qna/sessions/{sessionId}/finish` | Yes (Session) | `QnaController.java:finishSession` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/qna/{hash}/mastery` | Yes (User) | `QnaController.java:updateMastery` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/qna/{hash}/mine` | Yes (User) | `QnaController.java:updateMyAnswer` | answer, brief, briefrubricitem, doc, doc | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/rehearsals` | Yes (User) | `RehearsalController.java:listRehearsals` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/rehearsals` | Yes (User) | `RehearsalController.java:startRehearsal` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/rehearsals/{rid}` | Yes (User) | `RehearsalController.java:deleteRehearsal` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/rehearsals/{rid}` | Yes (User) | `RehearsalController.java:getRehearsal` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/rehearsals/{rid}/audio` | Yes (Session) | `RehearsalController.java:uploadAudio` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/rehearsals/{rid}/coach` | Yes (User) | `RehearsalController.java:getCoach` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/rehearsals/{rid}/finish` | Yes (User) | `RehearsalController.java:finishRehearsal` | brief, briefrubricitem, pitchsettings, r | Groq/LLM | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/retro/awards/{id}` | Yes (User) | `RetroController.java:deleteAward` | checkpoint, demomedia, github, githubcom | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/retro/items/{id}` | Yes (User) | `RetroController.java:deleteRetroItem` | checkpoint, demomedia, github, githubcom | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/schedule/events/{id}` | Yes (User) | `ScheduleController.java:deleteEvent` | checkpoint, event, member, phase, planph | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/soft-delete` | Yes (Session) | `RoomController.java:deleteRoom` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/speed-mode` | Yes (User) | `SpeedModeController.java:getSpeedMode` | acceptance, capture, phase, planphase, s | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/speed-mode/capture` | Yes (User) | `SpeedModeController.java:capture` | acceptance, capture, phase, planphase, s | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/speed-mode/captures` | Yes (User) | `SpeedModeController.java:listCaptures` | acceptance, capture, phase, planphase, s | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/speed-mode/captures/{captureId}` | Yes (User) | `SpeedModeController.java:deleteCapture` | acceptance, capture, phase, planphase, s | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/speed-mode/tasks/{taskId}/done` | Yes (User) | `SpeedModeController.java:markTaskDone` | acceptance, capture, phase, planphase, s | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/stage/advance` | Yes (Session) | `RoomController.java:advanceStage` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/stage/enter-build` | Yes (Session) | `PlanController.java:enterBuild` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/stage/revert` | Yes (Session) | `RoomController.java:revertStage` | brief, checkpoint, doc, docversion, idea | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/stage/unlock-build` | Yes (Session) | `PlanController.java:unlockBuild` | brief, briefrubricitem, charter, doc, do | Groq/LLM, Canva, SMTP | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/stream` | Yes (Session) | `RoomEventController.java:streamEvents` | event, roomevent | None | Async (SSE) | Room Member; SSE Stream |
| `DELETE` | `/api/v1/rooms/{roomId}/submission/links/{id}` | Yes (User) | `SubmissionController.java:deleteLink` | brief, checklist, demomedia, doc, docver | Groq/LLM, SMTP | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/subtasks/{subtaskId}` | Yes (Session) | `TaskController.java:deleteSubtask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/subtasks/{subtaskId}` | Yes (Session) | `TaskController.java:updateSubtask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/summary` | Yes (Session) | `RoomExportController.java:getRoomSummary` | brief, doc, docversion, github, githubbr | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks` | Yes (Session) | `TaskController.java:createTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/tasks/{taskIdOrKey}` | Yes (Session) | `TaskController.java:getTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `DELETE` | `/api/v1/rooms/{roomId}/tasks/{taskId}` | Yes (Session) | `TaskController.java:deleteTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `PATCH` | `/api/v1/rooms/{roomId}/tasks/{taskId}` | Yes (Session) | `TaskController.java:updateTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/acceptance` | Yes (Session) | `TaskController.java:addAcceptance` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/assign` | Yes (Session) | `TaskController.java:assignTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/comments` | Yes (Session) | `TaskController.java:addComment` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/confirm` | Yes (Session) | `TaskController.java:confirmTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/defer` | Yes (Session) | `PhaseController.java:deferTask` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/tasks/{taskId}/dependencies` | Yes (Session) | `TaskController.java:updateDependencies` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/drop` | Yes (Session) | `PhaseController.java:dropTask` | acceptance, brief, briefrubricitem, char | Groq/LLM | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/flag` | Yes (Session) | `TaskController.java:flagTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/move` | Yes (Session) | `TaskController.java:moveTask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/request-changes` | Yes (Session) | `TaskController.java:requestChanges` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `POST` | `/api/v1/rooms/{roomId}/tasks/{taskId}/subtasks` | Yes (Session) | `TaskController.java:addSubtask` | acceptance, branch, branchtask, comment, | None | Sync | Room Member |
| `GET` | `/api/v1/rooms/{roomId}/team` | Yes (Session) | `TeamController.java:getTeam` | charter, member, roommember, roommembers | None | Sync | Room Member |
| `PUT` | `/api/v1/rooms/{roomId}/team/charter` | Yes (Session) | `TeamController.java:saveCharter` | charter, member, roommember, roommembers | None | Sync | Room Member |
| `GET` | `/api/v1/search` | Yes (Session) | `SearchController.java:search` | brief, doc, room, task | None | Sync | - |
| `DELETE` | `/api/v1/users/me` | Yes (Session) | `UserController.java:deleteAccount` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/me` | Yes (Session) | `UserController.java:getUsersMe` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `DELETE` | `/api/v1/users/me/ai-key` | Yes (Session) | `UserController.java:deleteAiKey` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/ai-key/test` | Yes (Session) | `UserController.java:testAiKey` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/api-keys` | Yes (Session) | `UserController.java:addApiKey` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `DELETE` | `/api/v1/users/me/api-keys/{id}` | Yes (Session) | `UserController.java:deleteApiKey` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/avatar` | Yes (Session) | `UserController.java:uploadAvatar` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/me/data-summary` | Yes (Session) | `UserController.java:getDataSummary` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/me/delete-preview` | Yes (Session) | `UserController.java:getDeletePreview` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/hotspots` | Yes (Session) | `UserController.java:addHotspot` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/hotspots/reset` | Yes (Session) | `UserController.java:resetHotspots` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `PATCH` | `/api/v1/users/me/notification-prefs` | Yes (Session) | `UserController.java:updateNotificationPrefs` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/onboarding` | Yes (Session) | `UserController.java:completeOnboarding` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/me/preferences` | Yes (Session) | `UserController.java:getPreferences` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `PATCH` | `/api/v1/users/me/preferences` | Yes (Session) | `UserController.java:updatePreferences` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `PATCH` | `/api/v1/users/me/profile` | Yes (Session) | `UserController.java:updateProfile` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/me/settings` | Yes (Session) | `UserController.java:getSettings` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `PATCH` | `/api/v1/users/me/settings` | Yes (Session) | `UserController.java:updateSettings` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `POST` | `/api/v1/users/me/tour` | Yes (Session) | `UserController.java:updateTour` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/api/v1/users/username-available` | No (Public) | `UserController.java:checkUsernameAvailable` | activityevent, aiusagedaily, apikey, cou | Groq/LLM, SMTP | Sync | - |
| `GET` | `/oauth/authorize` | Yes (Session) | `OAuthServerController.java:authorize` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
| `POST` | `/oauth/authorize/decision` | Yes (Session) | `OAuthServerController.java:authorizeDecision` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
| `POST` | `/oauth/register` | No (Public) | `OAuthServerController.java:register` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
| `POST` | `/oauth/revoke` | No (Public) | `OAuthServerController.java:revoke` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
| `POST` | `/oauth/token` | No (Public) | `OAuthServerController.java:token` | authcode, client, oauthauthcode, oauthcl | None | Sync | - |
