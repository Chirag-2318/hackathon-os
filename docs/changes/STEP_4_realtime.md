# Step 4: Real-Time (SSE) Hardening

## (a) Plain-Language Summary
Previously, every browser tab open to a room or personal dashboard created multiple duplicate Server-Sent Events (SSE) connections. Because the backend strictly capped each user at 3 streams, opening a second tab or visiting the pitch kit immediately triggered an eviction disconnect loop that bombarded the server with reconnect requests. Furthermore, real-time events lived only in server RAM with volatile in-memory sequence numbers; restarting the backend or deploying a new container erased all event history and prevented clients from catching up. If multiple backend containers ran on Render behind a load balancer, events published on one container were completely invisible to users connected to another.

With this hardening update:
1. The frontend enforces exactly **one room stream per tab** via `useRoomLive` in `LiveContext` and **one global notification stream** via `useNotificationStream`, sharing real-time event subscriptions across components while removing duplicate connections.
2. Reconnections use exponential backoff with full randomized jitter, pause automatically while browser tabs are hidden, and cleanly respect server `bye` eviction signals without spamming reconnects.
3. Every real-time event is durably recorded in the database `room_events` table using PostgreSQL `BIGSERIAL` monotonically increasing IDs, enabling reconnecting clients to replay missed events or trigger clean resyncs when gaps exceed 200 events.
4. User online presence is backed by a database table `room_presence` with periodic heartbeats, making presence accurate across instances and deployments.
5. The backend introduces a modular `EventBus` architecture with `PostgresNotifyEventBus` (`EVENTS_BUS=postgres`), leveraging PostgreSQL `LISTEN/NOTIFY` on dedicated non-pooled connections to distribute events instantly across any number of clustered backend containers.

---

## (b) Files Created / Modified / Deleted

### Database Migrations & Entities
- `backend/src/main/resources/db/migration/V45__room_presence.sql`: Created `room_presence(room_id, user_id, last_seen)` table with primary key and composite indexes, and relaxed `room_events(entity_type, entity_id)` to nullable for lightweight broadcast signals.
- `backend/src/main/java/com/hackathonos/backend/presence/RoomPresenceId.java`: Composite JPA primary key embedding `roomId` and `userId`.
- `backend/src/main/java/com/hackathonos/backend/presence/RoomPresence.java`: Entity representing active user presence with `lastSeen` timestamp.
- `backend/src/main/java/com/hackathonos/backend/presence/RoomPresenceRepository.java`: Repository with native PostgreSQL `ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = EXCLUDED.last_seen` upsert and prune queries.
- `backend/src/main/java/com/hackathonos/backend/events/RoomEvent.java`: Relaxed entity constraints on `entityType` and `entityId` to match nullable schema.

### Event Bus Architecture (Multi-Instance Scaling)
- `backend/src/main/java/com/hackathonos/backend/events/bus/EventBus.java`: Interface defining publish and fanout contracts across instances.
- `backend/src/main/java/com/hackathonos/backend/events/bus/LocalEventBus.java`: In-memory direct fanout implementation for single-container development.
- `backend/src/main/java/com/hackathonos/backend/events/bus/PostgresNotifyEventBus.java`: Clustered event bus using PostgreSQL `LISTEN/NOTIFY` on channel `room_events_channel` with dedicated non-pooled JDBC connection and automatic reconnect loop.
- `backend/src/main/java/com/hackathonos/backend/events/bus/EventBusConfig.java`: Spring `@Configuration` conditionally selecting `LocalEventBus` or `PostgresNotifyEventBus` based on `app.events.bus`.

### Server Broadcast Engine & Presence Service
- `backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java`: Hardened broadcast engine using Java virtual threads, thread-safe `UserEmitter` with `synchronized(writeLock)` and backpressure protection (dropping clients lagging beyond 50 pending writes), configurable user stream caps (`SSE_MAX_STREAMS_PER_USER`) sending `bye` before eviction, 15s keep-alive pings, Caffeine bounded caches with `expireAfterAccess`, and durable sequence replay / resync.
- `backend/src/main/java/com/hackathonos/backend/events/RoomChangeInterceptor.java`: Added Caffeine cache to coalesce high-frequency `overview` events to at most once per 2 seconds (2000ms) per room, plus 150ms topic deduplication.
- `backend/src/main/java/com/hackathonos/backend/events/EventStreamController.java`: Standardized SSE HTTP response headers (`Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`, `retry: 3000`), handled `Last-Event-ID` header and query param, and added admin diagnostic endpoint `GET /api/v1/admin/realtime/stats`.
- `backend/src/main/java/com/hackathonos/backend/presence/PresenceService.java`: Replaced volatile in-memory presence maps with database-backed `RoomPresence` queries using 90-second activity cutoffs.
- `backend/src/main/java/com/hackathonos/backend/presence/PresenceController.java`: Mapped `/presence/heartbeat` and `/presence/members` endpoints matching API contracts.
- `backend/src/main/java/com/hackathonos/backend/events/RoomEventService.java`: Cleaned up to publish directly through `RoomEventHub`.
- `backend/src/main/java/com/hackathonos/backend/events/RoomEventController.java`: Removed legacy `/stream` endpoint.
- `backend/src/main/java/com/hackathonos/backend/events/RoomSseBroadcaster.java`: **Deleted** redundant legacy broadcaster class.
- `backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java`: Added hourly advisory-locked cleanup job (lock ID `1005L`) pruning `room_events` and `room_presence` older than 24 hours.
- `backend/src/main/java/com/hackathonos/backend/common/config/AppProperties.java`: Added `EventsProperties` for `maxStreamsPerUser` and `bus`.
- `backend/pom.xml`: Added `com.github.ben-manes.caffeine:caffeine` dependency and removed runtime scope on `postgresql` JDBC driver.

### Frontend Stream Consolidation & Lifecycle
- `frontend/src/design/live.tsx`: Refactored `useRoomLive` as the single owner of room SSE, exposed `lastEvent` and `subscribe` on `LiveContext`, implemented exponential backoff with full jitter (1s to 30s), tab visibility pause and reconnect resync, server `bye` eviction handling, and debounced active cache invalidations (`refetchType: 'active'`).
- `frontend/src/api/useNotificationStream.ts`: Hardened notifications SSE stream with exponential jitter backoff, tab visibility lifecycle, and active query invalidation.
- `frontend/src/App.tsx`: Mounted `AuthenticatedNotificationStream` inside `QueryClientProvider` so authenticated users maintain exactly 1 notifications stream per tab.
- `frontend/src/features/pitch-kit/pitch-kit-page.tsx`: Migrated from legacy `useRoomEvents` to `useLiveContext()`.
- `frontend/src/app/layout/room-nav.tsx`: Removed `useRoomEvents` and updated `nav-badges` polling to 5 minutes (300s) when SSE is active, 60s when disconnected.
- `frontend/src/features/ideate/ideate-page.tsx` & `frontend/src/features/team/team-page.tsx`: Adjusted polling intervals to slow to 5m when SSE stream is healthy.
- `frontend/src/api/useRoomEvents.ts`: **Deleted** duplicate legacy SSE hook.

### Configuration, Documentation & CI
- `.env.example`: Added `SSE_MAX_STREAMS_PER_USER=6` and `EVENTS_BUS=local`.
- `backend/.env.example`: Added detailed comments for SSE stream caps and event bus configuration.
- `render-env.template`: Added production template values for `SSE_MAX_STREAMS_PER_USER=6` and `EVENTS_BUS=postgres`.
- `docs/REALTIME.md`: Complete architectural guide with Mermaid sequence and flow diagrams detailing client stream lifecycle, replay protocol, and multi-instance scaling.

---

## (c) Tests Added and Their Results

### 1. `backend/src/test/java/com/hackathonos/backend/events/RoomEventHubTest.java` (Unit Tests)
- `testNextSeqMonotonicity`: Verified `nextSeq` generates strictly increasing sequence numbers per room. (PASSED)
- `testSubscribeAndOnlinePresence`: Verified emitter registration and delegation to database-backed `PresenceService`. (PASSED)
- `testMaxStreamsPerUserEvictionSendsBye`: Verified that exceeding `MAX_STREAMS_PER_USER` evicts the oldest stream with a `bye` SSE event before closing. (PASSED)
- `testReplayEventsFromRepository`: Verified that connecting with `Last-Event-ID` queries `room_events` for missed events. (PASSED)
- `testResyncWhenGapTooLarge`: Verified that a gap > 200 dispatches a `resync` event to trigger full client refetch. (PASSED)
- `testSlowClientLaggingDropped`: Verified that slow lagging emitters exceeding 50 pending writes are dropped without blocking or slowing down fast subscribers. (PASSED)

### 2. `backend/src/test/java/com/hackathonos/backend/events/RoomChangeInterceptorTest.java` (Unit Test)
- `testOverviewCoalescing`: Verified that rapid successive mutating requests coalesce `overview` events to at most 1 every 2000ms. (PASSED)

### 3. `backend/src/test/java/com/hackathonos/backend/events/RealtimeIntegrationTest.java` (Integration Tests)
- `testTwoInstanceDelivery`: Verified multi-instance cluster delivery where an event published on Instance A reaches a subscriber on Instance B via PostgreSQL `LISTEN/NOTIFY`. (PASSED)
- `testPresencePersistenceAndCutoff`: Verified heartbeat upsert into `room_presence` and active queries within 90s cutoff. (PASSED)

### 4. Full Suite Results
- Backend: **All tests passed** (`BUILD SUCCESS`, total elapsed time: 42.1s).
- Frontend: TypeScript check passed, Vite production build succeeded (12.19s), Vitest unit tests passed (6 passed).

---

## (d) Audit Claims Verified vs False / Skipped
- **Audit Claim (06_data_layer.md / 15_scalability_and_reliability_risks.md)**: "Two competing SSE implementations exist on the backend (`RoomEventHub` and `RoomSseBroadcaster`)." -> **VERIFIED**. `RoomSseBroadcaster` and `/api/v1/rooms/{roomId}/stream` were active and redundant. Deleted `RoomSseBroadcaster` and consolidated onto `RoomEventHub`.
- **Audit Claim (15_scalability_and_reliability_risks.md item 5)**: "Frontend creates duplicate SSE connections per tab in `pitch-kit-page.tsx`." -> **VERIFIED**. `pitch-kit-page.tsx` called `useRoomEvents` directly despite `RoomShellLayout` mounting `useRoomLive`. Migrated to `useLiveContext()` and deleted `useRoomEvents.ts`.
- **Audit Claim (10_realtime_and_events.md)**: "Events are entirely in-memory and sequence numbers reset per JVM restart." -> **VERIFIED**. Now durably backed by PostgreSQL `room_events` with global BIGSERIAL sequence IDs and replay protocol.

---

## (e) Remaining Debt / Follow-ups for Later Steps
- Step 5: Rate limiting and abuse protection (Bucket4j on auth, invitations, join codes, AI endpoints).
- Step 6: Frontend bundle optimization, code splitting, and caching headers.
- Step 7: Zero-trust database constraints, cascade safety, and soft-delete consistency.
- Step 8: Production readiness checklist, health checks, and alerting.

---

## (f) Proof the Build and Test Suites Pass
- Backend: `./mvnw -q test` passed cleanly with code 0 (`Results: Tests run: 9, Failures: 0, Errors: 0, Skipped: 0` in focused tests; full test suite passed).
- Frontend: `npm run build && npm run test` passed cleanly with code 0:
  ```
  ✓ built in 12.19s
  ✓ src/utils/zip.test.ts (2 tests)
  ✓ src/utils/time.test.ts (4 tests)
  Test Files  2 passed (2)
  Tests  6 passed (6)
  ```

---

## (g) How to Verify Manually on Render / Local
1. **Single Tab Verification**:
   - Open browser DevTools Network tab, filter by `Fetch/XHR` or `EventStream`.
   - Open a room page (`/rooms/{id}/board`). Verify exactly **one** `/api/v1/rooms/{id}/events` stream is established.
   - Navigate to the Pitch Kit page (`/rooms/{id}/pitch-kit`). Verify no second room SSE stream is opened.
2. **Tab Visibility Lifecycle**:
   - Switch to a different browser tab. The room SSE stream closes while hidden. Switch back; the stream reopens with `?lastEventId=...` and refetches active queries.
3. **Multi-Instance Verification**:
   - Set `EVENTS_BUS=postgres` in `.env`.
   - Boot two backend instances on different ports (`SERVER_PORT=8080` and `SERVER_PORT=8081`).
   - Connect Client 1 to port 8080 and Client 2 to port 8081 in the same room.
   - Create a task or update state via Client 1. Client 2 receives the SSE event within <500ms via PostgreSQL `LISTEN/NOTIFY`.
4. **Admin Diagnostics**:
   - Send `GET /api/v1/admin/realtime/stats` as an admin user to inspect active room streams, online presence, and buffer metrics.

---

## (h) New Environment Variables
- `SSE_MAX_STREAMS_PER_USER`: Maximum concurrent SSE streams allowed per user across tabs/devices (default: `6`). Evicts the oldest stream with a `bye` event if exceeded.
- `EVENTS_BUS`: Real-time event bus distribution engine (`local` for single-container in-memory dispatch, `postgres` for multi-instance clustering via PostgreSQL `LISTEN/NOTIFY`, default: `local`).

