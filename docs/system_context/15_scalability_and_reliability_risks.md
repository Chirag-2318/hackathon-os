# 15. Preliminary Scalability & Reliability Risk List

> **AUDITOR OPINION NOTICE**:
> The assessments in this section represent the engineering analysis and professional opinion of the distributed systems auditor, based on static code review of Brackit's implementation and configuration. This section is distinct from the factual audits presented in preceding sections.

For the target workload of **2,000 to 4,000 total registered users** (with an estimated **200 to 500 concurrent active users** during peak hackathon deadline and submission hours), the following potential bottlenecks and failure modes are identified, ordered by severity.

---

### [CRITICAL] 1. Database Connection Starvation via Synchronous AI Calls inside `@Transactional`
- **Location**: 19 service methods across [BriefService.java](file:///backend/src/main/java/com/hackathonos/backend/brief/BriefService.java), [PlanService.java](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanService.java), [DeckAuditService.java](file:///backend/src/main/java/com/hackathonos/backend/pitch/DeckAuditService.java), [RehearsalService.java:134](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java#L134), [PitchService.java](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/PitchService.java), [DocService.java](file:///backend/src/main/java/com/hackathonos/backend/docs/DocService.java).
- **Cause**: Outbound HTTP calls to Groq LLM (15-45s) and Whisper STT (5-15s) execute inside active `@Transactional` boundaries, holding a physical JDBC connection for the entire duration. In production, HikariCP pool size is capped at `DB_POOL_SIZE = 5` ([application-prod.yml:21](file:///backend/src/main/resources/application-prod.yml#L21)).
- **Failure Mode Under Load**: Just 5 users generating plans or uploading audio chunks simultaneously will consume 100% of the database connection pool. All other requests across the platform (even simple dashboard reads) will queue and fail after 10 seconds with `SQLTransientConnectionException: Connection is not available, request timed out after 10000ms`.
- **User Symptom**: Total application freeze. Users see red error toasts ("Request failed") on every screen; new page loads return HTTP 500.

---

### [CRITICAL] 2. In-Memory State Coupling Prevents Horizontal Scaling Beyond 1 Instance
- **Location**: [RoomEventHub.java:38-42](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L38-L42), [PresenceService.java:18](file:///backend/src/main/java/com/hackathonos/backend/presence/PresenceService.java#L18), Tomcat `StandardSessionManager`.
- **Cause**: All SSE subscriber connections, event ring buffers, sequence counters, user presence registries, and user HTTP sessions (`JSESSIONID`) exist strictly in JVM heap memory.
- **Failure Mode Under Load**: Scaling Render to 2+ web instances will break real-time functionality. Teammates distributed across instances will not receive each other's live updates. Users bouncing between instances will be logged out unless sticky sessions are configured.
- **User Symptom**: Stale screens, missing task/idea updates, inconsistent presence indicators, and unexpected session logouts.

---

### [HIGH] 3. Cold Starts and Gateway Timeouts on Render Free Tier
- **Location**: [backend/Dockerfile](file:///backend/Dockerfile), [ProductionStartupValidator.java](file:///backend/src/main/java/com/hackathonos/backend/common/config/ProductionStartupValidator.java), Flyway migrations.
- **Cause**: Render free-tier instances sleep after 15 minutes of inactivity. Starting Java 25, validating 116 Hibernate tables, and executing 44 Flyway migrations takes 25 to 45 seconds.
- **Failure Mode Under Load**: The first user visiting the application after an idle window triggers container boot. Vercel's reverse proxy times out after 15-30 seconds.
- **User Symptom**: Vercel `504 Gateway Timeout` or 45-second blank spinner.

---

### [HIGH] 4. Ephemeral Filesystem Avatar Loss on Container Restart
- **Location**: [WebMvcConfig.java:50](file:///backend/src/main/java/com/hackathonos/backend/common/config/WebMvcConfig.java#L50), [UserController.java:76](file:///backend/src/main/java/com/hackathonos/backend/users/UserController.java#L76).
- **Cause**: Avatars are saved to local container disk `/app/uploads` without an attached persistent disk or cloud object storage (S3/R2).
- **Failure Mode Under Load**: Container restarts, deployments, or sleep cycles wipe `/app/uploads`.
- **User Symptom**: User profile pictures break and render 404 broken image placeholders.

---

### [HIGH] 5. Fixed SSE Broadcast Thread Pool Starvation
- **Location**: [RoomEventHub.java:44](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L44) (`newFixedThreadPool(4)`).
- **Cause**: A fixed pool of 4 threads handles event dispatch across all active SSE connections in all rooms.
- **Failure Mode Under Load**: If several participants have poor network latency, the synchronous `emitter.send()` calls will occupy all 4 worker threads, creating an unbounded backlog in the `LinkedBlockingQueue`.
- **User Symptom**: Real-time updates lag by several seconds or minutes; memory usage spikes as queued events accumulate.

---

### [HIGH] 6. Duplicate SSE Stream Invocations Exceeding User Cap
- **Location**: [frontend/src/features/pitch-kit/pitch-kit-page.tsx:53](file:///frontend/src/features/pitch-kit/pitch-kit-page.tsx#L53) + [frontend/src/design/live.tsx:59](file:///frontend/src/design/live.tsx#L59) + [frontend/src/api/useNotificationStream.ts](file:///frontend/src/api/useNotificationStream.ts).
- **Cause**: Pitch Kit page instantiates `useRoomEvents` while already nested inside `RoomLayout`'s `useRoomLive`. With the notification stream, a single tab consumes 3 connections, matching `MAX_STREAMS_PER_USER = 3` in `RoomEventHub.java:23`.
- **Failure Mode Under Load**: Opening a second browser tab immediately forces the server to evict the oldest emitter (`oldest.emitter().complete()`). The disconnected tab enters an aggressive exponential backoff reconnect loop, amplifying server load.
- **User Symptom**: Erratic SSE disconnects, UI flickering between "live" and "reconnecting", and increased server CPU.

---

### [MEDIUM] 7. Unbounded Collection Queries & N+1 Multipliers
- **Location**: [DocService.java:listDocs](file:///backend/src/main/java/com/hackathonos/backend/docs/DocService.java#L95), [TaskService.java:getTaskDetail](file:///backend/src/main/java/com/hackathonos/backend/tasks/TaskService.java#L150), [GitHubService.java:getChecks](file:///backend/src/main/java/com/hackathonos/backend/github/GitHubService.java#L120).
- **Cause**: Endpoints load entire tables without pagination, and execute queries in loops for child entities.
- **Failure Mode Under Load**: In rooms with 50+ documents and 100+ tasks, each page load fires dozens of database queries.
- **User Symptom**: Sluggish response times (1 to 3 seconds) for task boards and docs vaults.

---

### [MEDIUM] 8. 15 Unindexed Foreign Key & Filter Columns
- **Location**: `user_oauth_tokens(user_id)`, `task_dependencies(task_id)`, `task_labels(task_id)`, `users(provider_user_id)`, `pitch_settings(room_id)`.
- **Cause**: Omitted indexes in Flyway migrations.
- **Failure Mode Under Load**: Sequential scans across growing tables under peak concurrent read traffic.
- **User Symptom**: Increased database CPU usage and query response latency.

---

### [MEDIUM] 9. Silent Overwrites on Unversioned Entities
- **Location**: `Doc.java`, `Idea.java`, `Pitch.java`.
- **Cause**: Missing `@Version` optimistic locking annotation.
- **Failure Mode Under Load**: When multiple teammates edit the same document or pitch script simultaneously, the last save blindly overwrites previous edits without conflict detection.
- **User Symptom**: Loss of edits in shared documents and pitch scripts.

---

### [MEDIUM] 10. 11 Test Suites Excluded from Build Pipeline
- **Location**: [backend/pom.xml:142-151](file:///backend/pom.xml#L142-L151).
- **Cause**: Compiler exclusion of test classes for AI, tasks, users, overview, checkpoints, invites, and templates.
- **Failure Mode Under Load**: High risk of undetected regressions in core business domains reaching production.
- **User Symptom**: Subtle logic bugs and edge-case crashes in production.
