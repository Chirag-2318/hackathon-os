# 14. Tests & Code Quality

## 14.1 Existing Test Suites & Execution
| Project Layer | Test Framework | Test Count | Location | Execution Command |
|---|---|---|---|---|
| **Backend Active** | JUnit 5 / Spring Boot Test | 24 test classes | `backend/src/test/java/` | `./mvnw test` |
| **Backend Excluded** | JUnit 5 | **11 test classes (excluded in pom.xml)** | `backend/src/test/java/` | Skipped during compilation |
| **Frontend Unit** | Vitest 5.0.1 | 2 test files | `frontend/src/utils/` (`time.test.ts`, `zip.test.ts`) | `npm run test` (in `frontend/`) |
| **Frontend E2E** | Playwright 1.63.0 | 1 test file | `e2e/phase-6b.spec.ts` | `npx playwright test` |
| **MCP Companion** | Vitest 3.0.8 | 5 test files | `mcp-server/test/` | `npm test` (in `mcp-server/`) |

---

## 14.2 Excluded Backend Test Suites Audit (CRITICAL)
In [backend/pom.xml:142-151](file:///backend/pom.xml#L142-L151), the Maven compiler plugin explicitly excludes **11 test suites** from test compilation:
```xml
<testExcludes>
    <testExclude>**/checkpoints/**</testExclude>
    <testExclude>**/invites/**</testExclude>
    <testExclude>**/overview/**</testExclude>
    <testExclude>**/tasks/**</testExclude>
    <testExclude>**/templates/**</testExclude>
    <testExclude>**/users/**</testExclude>
    <testExclude>**/ai/**</testExclude>
</testExcludes>
```
### Excluded Test Files:
1. `com/hackathonos/backend/ai/AiServiceTest.java`
2. `com/hackathonos/backend/checkpoints/CheckpointServiceTest.java`
3. `com/hackathonos/backend/invites/JoinAttemptLimiterTest.java`
4. `com/hackathonos/backend/overview/ClockServiceTest.java`
5. `com/hackathonos/backend/overview/ProgressServiceTest.java`
6. `com/hackathonos/backend/overview/WorkloadServiceTest.java`
7. `com/hackathonos/backend/overview/attention/AttentionEngineTest.java`
8. `com/hackathonos/backend/tasks/TaskKeyServiceTest.java`
9. `com/hackathonos/backend/tasks/TaskServiceTest.java`
10. `com/hackathonos/backend/templates/TemplateAndSeederTest.java`
11. `com/hackathonos/backend/users/UserIntegrationTest.java`

**Quality Impact**: Core business functionality—including task key generation, task status transitions, AI service retries, user deletion flows, and milestone progression—is **completely unverified during `mvn clean package` and CI/CD pipelines**. These test files likely contain breaking signature changes from recent refactorings.

---

## 14.3 Dead Code & Structural Duplication
1. **Dual Pitch Controllers**:
   - `com.hackathonos.backend.pitch.PitchController` (bean: `"legacyPitchController"`, mapping: `/api/v1/rooms/{roomId}/pitch`).
   - `com.hackathonos.backend.pitchkit.PitchController` (bean: `"pitchKitPitchController"`, mapping: `/api/v1/rooms/{roomId}/pitch`).
2. **Dual Server-Sent Events Broadcasters**:
   - `RoomEventHub.java`: Active hub with sequence tracking, ring buffers, and burst deduplication.
   - `RoomSseBroadcaster.java`: Parallel broadcaster with heartbeat and user stream caps, only used by `RoomEventService`.
3. **Dual Frontend Event Hooks**:
   - `useRoomLive` in `frontend/src/design/live.tsx` (primary live context provider).
   - `useRoomEvents` in `frontend/src/api/useRoomEvents.ts` (legacy hook, still imported in `pitch-kit-page.tsx:11` and `room-nav.tsx:4`).
4. **Dual Frontend HTTP Client Wrappers**:
   - `apiFetch` in `frontend/src/design/api.ts` (52 files).
   - `apiClient` in `frontend/src/lib/apiClient.ts` (24 files).

---

## 14.4 Developer TODO / FIXME Comments
A repository scan found 2 actual developer comments:
- **`backend/src/main/java/com/hackathonos/backend/tasks/Task.java:34`**:
  ```java
  private String status = "TODO"; // TODO, IN_PROGRESS, DONE
  ```
- **`frontend/src/features/retro/components/wrapped-card.tsx:256`**:
  ```tsx
  // TODO(OQ-10): wire View destination once decided
  ```
