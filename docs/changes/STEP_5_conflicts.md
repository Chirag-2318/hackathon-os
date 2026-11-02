# Step 5: Edit-Conflict Protection and Idempotency

## (a) Plain-Language Summary
Previously, when teammates edited documents, brainstormed ideas, or updated room settings concurrently, whoever saved last silently erased the other teammate's changes without warning. In addition, voting on an idea touched the idea record directly, causing artificial edit collisions with whoever was writing the description. Creating tasks or rooms on unstable connections could also create duplicate items because idempotency tracking lived only in temporary server memory.

Now, every collaborative table has optimistic locking: if someone modifies a document or idea while you are working on it, saving triggers an HTTP 409 conflict and opens a friendly resolution dialog. You can choose to keep your version, accept their version, or merge changes with an interactive side-by-side diff editor. Unsaved drafts are automatically preserved in local storage so work is never lost. Idea voting runs on an independent counter table that never interferes with text edits, and create requests are protected by 24-hour database-backed idempotency.

---

## (b) Files Changed

### Database Migrations
- `backend/src/main/resources/db/migration/V46__optimistic_locking_and_idempotency.sql`: Added `version BIGINT NOT NULL DEFAULT 0` to 15 collaborative tables; created `idea_votes` and `idempotency_keys` tables.

### Backend Entities (`@Version`)
- `backend/src/main/java/com/hackathonos/backend/docs/Doc.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/ideas/Idea.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/rooms/Room.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/pitchkit/Pitch.java`: Standardized `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/pitch/PitchSlide.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/pitch/DeckSlide.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/demo/DemoSection.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/demo/DemoShot.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/retro/RetroItem.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/prep/PrepItem.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/schedule/ScheduleEvent.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/pitchkit/QnaItem.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/mvp/MvpLedgerRow.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/mvp/MvpFlowStep.java`: Added `@Version` on `version`.
- `backend/src/main/java/com/hackathonos/backend/team/TeamCharterResponse.java`: Added `@Version` on `version`.

### Error Handling & Exceptions
- `backend/src/main/java/com/hackathonos/backend/common/error/ErrorCode.java`: Added `EDIT_CONFLICT` and `CONCURRENT_REQUEST`.
- `backend/src/main/java/com/hackathonos/backend/common/error/EntityConflictException.java`: Created conflict exception with current server version, last editor, and snapshot copy.
- `backend/src/main/java/com/hackathonos/backend/docs/DocConflictException.java`: Document conflict exception with content and editor metadata.
- `backend/src/main/java/com/hackathonos/backend/common/error/ApiExceptionHandler.java`: Mapped conflict and optimistic locking exceptions to unified 409 `EDIT_CONFLICT`.

### Backend Services & Controllers
- `backend/src/main/java/com/hackathonos/backend/docs/DocService.java` & `DocController.java`: Added conflict detection, `touchEditingDoc`, and `getActiveEditors`.
- `backend/src/main/java/com/hackathonos/backend/presence/PresenceController.java`: Supported `editingDoc` heartbeat parameter.
- `backend/src/main/java/com/hackathonos/backend/ideas/IdeasService.java` & `IdeasController.java`: Added conflict checks on `baseVersion` / `If-Match`, isolated voting into `idea_votes`.
- `backend/src/main/java/com/hackathonos/backend/rooms/RoomService.java` & `RoomController.java`: Added conflict checks on `baseVersion` / `If-Match`.
- `backend/src/main/java/com/hackathonos/backend/pitchkit/PitchService.java` & `PitchController.java`: Added conflict checks on `baseVersion` / `If-Match`.
- `backend/src/main/java/com/hackathonos/backend/common/idempotency/IdempotencyService.java`: Database-backed 24h persistence with concurrency lock.
- `backend/src/main/java/com/hackathonos/backend/common/idempotency/IdempotencyFilter.java`: Servlet filter for `Idempotency-Key` headers on POST endpoints.
- `backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java`: Advisory-locked cleanup (`1006L`) pruning expired keys.

### Frontend Components & Pages
- `frontend/src/components/conflict/ConflictDialog.tsx`: 3-way conflict dialog ("Keep mine", "Take theirs", "Compare and merge") with line and word diffing.
- `frontend/src/components/conflict/useConflictAwareMutation.ts`: Mutation wrapper capturing 409s and stashing drafts in `localStorage`.
- `frontend/src/features/docs/docs-page.tsx`: Integrated `ConflictDialog` and real-time SSE collision banner.
- `frontend/src/features/docs/components/docs-center-pane.tsx`: Integrated 15s editing heartbeats and active editors header pill.
- `frontend/src/features/ideate/ideate-page.tsx`: Integrated `ConflictDialog` on idea edit conflict.
- `frontend/src/features/rooms/leader-room-settings-dialog.tsx`: Passes `baseVersion` and displays `ConflictDialog` on 409.
- `frontend/src/features/board/board-page.tsx`: Handled task move conflicts with toast, query refresh, and automatic single retry.

---

## (c) New Environment Variables
None required. The database schema changes run automatically via Flyway migration `V46`, and existing connection settings are reused.

---

## (d) How to Verify Manually
1. **Document Conflict Detection & 3-Way Merge**:
   - Open the same document (e.g., `PRD.md`) in two separate browser windows / incognito sessions logged in as different teammates.
   - In Browser A, enter edit mode, change the title to "PRD - Browser A", and click **Save**.
   - In Browser B, without refreshing, type "PRD - Browser B" and click **Save**.
   - Notice the **Edit Conflict Detected** modal appears in Browser B displaying Browser A's name and modification timestamp.
   - Click **Compare & merge**: inspect the visual diff highlighting additions/deletions, adjust the text in the merged output editor, and click **Save Merged Version**. Verify the document updates without error.
2. **Ephemeral Editing Presence**:
   - In Browser A, click **Edit** on a document.
   - Look at Browser B: within 10 seconds, Browser A's avatar appears in the document header indicating they are currently editing.
3. **SSE Document Change Banner**:
   - In Browser B, remain in view mode on `PRD.md`.
   - In Browser A, edit and save the document.
   - In Browser B, a toast banner appears: "Updated by teammate just now — View changes".
4. **Independent Idea Voting**:
   - Post a new idea in the Ideation tab.
   - Open edit mode on the idea in Browser A.
   - Cast votes on the idea in Browser B and Browser C.
   - In Browser A, finish editing the idea text and save. Verify the edit saves successfully without an `EDIT_CONFLICT`.
5. **Idempotent Task Creation**:
   - Submit a new task with an `Idempotency-Key: test-key-123` header twice. Verify both requests return the exact same task ID and only one record is stored in the database.

---

## (e) Rollback Notes
If a rollback is needed:
1. Revert backend commit to restore pre-V46 entity definitions.
2. In PostgreSQL:
   ```sql
   ALTER TABLE docs DROP COLUMN IF EXISTS version;
   ALTER TABLE ideas DROP COLUMN IF EXISTS version;
   ALTER TABLE rooms DROP COLUMN IF EXISTS version;
   ALTER TABLE pitches DROP COLUMN IF EXISTS version;
   ALTER TABLE pitch_slides DROP COLUMN IF EXISTS version;
   ALTER TABLE deck_slides DROP COLUMN IF EXISTS version;
   ALTER TABLE demo_sections DROP COLUMN IF EXISTS version;
   ALTER TABLE demo_shots DROP COLUMN IF EXISTS version;
   ALTER TABLE retro_items DROP COLUMN IF EXISTS version;
   ALTER TABLE prep_items DROP COLUMN IF EXISTS version;
   ALTER TABLE schedule_events DROP COLUMN IF EXISTS version;
   ALTER TABLE qna_items DROP COLUMN IF EXISTS version;
   ALTER TABLE mvp_ledger_rows DROP COLUMN IF EXISTS version;
   ALTER TABLE mvp_flow_steps DROP COLUMN IF EXISTS version;
   ALTER TABLE team_charter_responses DROP COLUMN IF EXISTS version;
   DROP TABLE IF EXISTS idea_votes;
   DROP TABLE IF EXISTS idempotency_keys;
   DELETE FROM flyway_schema_history WHERE version = '46';
   ```
3. Revert frontend commit to remove `ConflictDialog` and diff viewer dependencies.

---

## (f) Decisions and Assumptions
1. **Backward Compatibility**: To support existing API consumers and older frontend tabs, `baseVersion` and `If-Match` are optional. If neither is supplied, the server applies the change without throwing preemptive conflicts.
2. **Voting Isolation**: Bumping entity versions on idea votes created unacceptable race conditions for teammates refining ideas during voting sprints. Creating an independent `idea_votes` join table allows atomic voting while protecting idea descriptions from false conflicts.
3. **Idempotency Lifetime**: Idempotency keys are preserved in PostgreSQL for 24 hours with status, headers, and body payloads, and automatically purged via an advisory-locked cron (`1006L`).

---

## (g) Remaining Risks / Follow-ups
1. **Full Real-Time Collaborative Editing**: For concurrent keystroke-by-keystroke collaborative editing (Google Docs style), a future enhancement could implement Yjs or CRDTs over WebSockets. For current sprint planning and pitch deck workflows, optimistic locking with 3-way merge is robust and reliable.

---

## (h) Things the Human Owner Must Do Outside the Code
- None. Flyway migration `V46` applies automatically on the next deployment, and no external provider credentials or dashboard reconfigurations are required.
