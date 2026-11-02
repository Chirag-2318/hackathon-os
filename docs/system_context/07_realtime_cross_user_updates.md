# 7. Real-Time & Cross-User Updates

## 7.1 Cross-User Update Mechanisms Inventory
The application uses **Server-Sent Events (SSE)** as its primary live communication layer, with fallback to **HTTP polling** and **periodic heartbeat background requests**:

| Mechanism | Transport | Server Component | Client Component | Endpoint / Channel | Frequency / Trigger | Payload Shape |
|---|---|---|---|---|---|---|
| **Primary Room Live Stream** | Server-Sent Events (SSE) | [RoomEventHub.java:57](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L57) | [frontend/src/design/live.tsx:59](file:///frontend/src/design/live.tsx#L59) (`useRoomLive`) | `GET /api/v1/rooms/{roomId}/events` | Mutating request after-commit trigger via `RoomChangeInterceptor` | Named event `"room"`, data: `RoomEvent` JSON |
| **Personal Notification Stream** | Server-Sent Events (SSE) | [RoomEventHub.java:130](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L130) | [frontend/src/api/useNotificationStream.ts](file:///frontend/src/api/useNotificationStream.ts) | `GET /api/v1/notifications/stream` | Triggered on new personal notification or invite | Named event `"notification"`, data: `{"topic":"notification","at":"..."}` |
| **Secondary Legacy Stream** | Server-Sent Events (SSE) | [RoomSseBroadcaster.java:31](file:///backend/src/main/java/com/hackathonos/backend/events/RoomSseBroadcaster.java#L31) | [frontend/src/api/useRoomEvents.ts](file:///frontend/src/api/useRoomEvents.ts) | `GET /api/v1/rooms/{roomId}/stream` | Direct `RoomEventService.broadcast()` | Named event `"room-event"`, data: `SsePayload` |
| **Fallback Polling** | HTTP GET Polling | `EventStreamController.java:50` | `frontend/src/design/live.tsx:311` | `GET /api/v1/rooms/{roomId}/presence` | Every 30 seconds (triggered when SSE fails 3 times) | `{"online":["uuid1","uuid2"]}` |
| **Heartbeat / Presence Ping** | HTTP POST Polling | `RoomController.java` | `frontend/src/app/layout/room-nav.tsx:67` | `POST /api/v1/rooms/{roomId}/heartbeat` | Every 60 seconds while tab is visible | `{"status":"ok"}` |
| **Nav Badges Polling** | HTTP GET Polling | `OverviewController.java` | `frontend/src/app/layout/room-nav.tsx:61` | `GET /api/v1/rooms/{roomId}/nav-badges` | Every 60 seconds (`refetchInterval: 60000`) | `NavBadgesDto` JSON |

---

## 7.2 Detailed Event Protocol & Subscription Details
### 1. Primary Room Stream (`RoomEventHub`)
- **Connection Handshake**:
  - URL: `/api/v1/rooms/{roomId}/events`
  - Headers: `Accept: text/event-stream`, `Last-Event-ID: <seq>` (on reconnect)
  - Auth: Enforced by `roomAccess.requireMember(roomId, user)`.
  - Max Streams Cap: `MAX_STREAMS_PER_USER = 3` ([RoomEventHub.java:23](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L23)). If a user opens a 4th stream, the oldest emitter is abruptly closed:
    ```java
    if (userStreams.size() >= MAX_STREAMS_PER_USER) {
        UserEmitter oldest = userStreams.get(0);
        oldest.emitter().complete();
        emitters.remove(oldest);
    }
    ```
- **Event Shape**:
  ```json
  {
    "seq": 142,
    "topic": "board",
    "roomId": "e2b6a953-3b10-4f9e-8cf4-28b394ef3294",
    "actorId": "c4d1b849-...",
    "actorName": "Alex",
    "entityId": "a98402b1-...",
    "at": "2026-11-02T08:50:12.456Z"
  }
  ```
- **Topic Vocabulary**:
  - `board`: Kanban task created, updated, moved, or deleted.
  - `task:<id>`: Specific task mutation.
  - `ideas`: Brainstorm idea added, voted, approved, or deleted.
  - `brief`: Brief confirmed or rubric updated.
  - `plan`: Plan step generated or locked.
  - `members`: Team roster updated, member invited or removed.
  - `presence`: Online presence updated (debounced by 2 seconds).
  - `docs`: Markdown document modified or version restored.
  - `mvp`: Scope item toggled or flow step updated.
  - `checkpoints`: Milestone resolved.
  - `github`: Repository synced or commits recorded.
  - `pitch`: Pitch deck, slides, or rehearsal updated.
  - `stage`: Room stage transitioned (`PLANNING` -> `BUILD` -> `PRESENT` -> `REVIEW`).
  - `overview`: Room KPIs or vitals updated (emitted on every mutating request).
  - `resync`: Sent on reconnect when missed events exceed the 200-item ring buffer.
- **Replay & Ordering**:
  - Sequence numbers are monotonic per room via `AtomicLong` ([RoomEventHub.java:51](file:///backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java#L51)).
  - Ring buffer retains the most recent 200 events in memory (`ConcurrentLinkedDeque<RoomEvent>`).
  - If reconnecting client passes `Last-Event-ID`:
    - If `lastSeq >= oldestSeq`: Replays missed events sequentially.
    - If `lastSeq < oldestSeq`: Ring buffer has wrapped; emits event `resync`, triggering full cache invalidation on the client.
- **Keep-Alive Ping**:
  - Scheduled every 25 seconds via `@Scheduled(fixedDelay = 25000) public void pingAll()`. Sends SSE comment `: ping` to prevent proxy socket timeout.

---

## 7.3 Multi-Instance Single Point of Failure (CRITICAL)
**All SSE emitters, ring buffers, sequence counters, and presence maps exist purely in single-JVM heap memory.**
- **Consequence of 2+ Instances**:
  If Brackit is scaled to 2 or more web service containers on Render behind a load balancer:
  1. Users connected to Room X will be randomly distributed across Instance 1 and Instance 2.
  2. When Alice (connected to Instance 1) updates a task, `RoomChangeInterceptor` on Instance 1 publishes the event to `RoomEventHub` on Instance 1.
  3. Bob (connected to Instance 2) **receives nothing**. His screen remains completely stale until 30-second fallback polling runs or he manually refreshes.
  4. Sequence numbers (`nextSeq`) will diverge between instances, breaking event ordering and replay.
- **Mitigation Requirement**:
  To scale beyond 1 instance, an external publish/subscribe bus (e.g. Redis Pub/Sub, NATS, or PostgreSQL `LISTEN/NOTIFY`) and centralized distributed presence store must replace the in-memory `RoomEventHub`.

---

## 7.4 Feature-by-Feature Data Staleness & Inconsistency Matrix

| Feature Domain | Potential Staleness Window | Inconsistency Scenario | Resolution Mechanism |
|---|---|---|---|
| **Docs Vault** | Indefinite until refresh | Two teammates edit the same document (`README.md`) simultaneously. Neither sees the other typing. | **None (Silent Overwrite)**: The last user to click "Save" blindly overwrites previous edits in `docs` table. No `@Version` exists on `Doc`. |
| **Kanban Sprint Board** | Up to 250ms (SSE) or 30s (polling) | Two teammates drag or update the same task simultaneously. | **Optimistic Locking Exception**: `Task` has `@Version private Long version`. The second update receives HTTP 409 Conflict. If unhandled, user sees error toast. |
| **Brainstorming Ideas** | Up to 250ms (SSE) or 30s (polling) | Teammate votes on an idea while creator edits the description. | Last write wins. No `@Version` on `Idea`. Vote count or text may be overwritten depending on which update executes last. |
| **Stage Progression** | Up to 250ms (SSE) or 30s (polling) | Leader clicks "Unlock Build Stage". Teammates are on Planning screen. | SSE emits topic `"stage"`. Teammates' `live.tsx` receives event, invalidates `['room', roomId]`, and transitions route automatically. |
| **Team Membership / Kick** | Up to 250ms (SSE) or 30s (polling) | Leader kicks a teammate from the room. | SSE emits topic `"members"`. Client `live.tsx:143` executes `apiFetch('/api/v1/rooms/' + roomId)`. Receives 403 Forbidden, shows toast `"You were removed from this room"`, and redirects to `/app/rooms`. |
| **GitHub Synchronization** | Up to 10 minutes | Commits pushed to GitHub repo. | Handled by `GitHubSyncJob` running every 10 minutes. Triggers SSE topic `"github"` upon completing sync. |
| **Pitch Settings Lock** | Up to 250ms (SSE) | Presenter locks slide deck for presentation. | Emits topic `"pitch"`. Teammate screens lock editing controls. |
