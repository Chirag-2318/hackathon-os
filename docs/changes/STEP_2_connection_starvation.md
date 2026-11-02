# Step 2: Database Connection Starvation and Resource Protection

## (a) Plain-Language Summary
Previously, when users asked the AI to analyze documents, transcribe rehearsal audio, or check external links, the application held a dedicated database connection hostage for up to 45 seconds while waiting for external cloud providers to respond. With only 5 to 10 pooled database connections available in production, just a handful of simultaneous AI requests could freeze the entire application for every team member, causing database timeout errors and crashing page loads.
With this change, all slow external network requests, speech transcription, and document parsing have been completely moved outside of database transactions so connections are immediately released back to the pool in milliseconds. We also introduced smart concurrency bulkheads that prevent AI and document processing from overwhelming memory, and background jobs now use short advisory locks instead of holding physical connections while sending emails or checking links.
Users will notice that room navigation, task updates, and document views remain instantly responsive even while other teammates generate pitch scripts, transcribe audio, or parse large PDFs. If the AI service reaches maximum concurrent capacity under heavy load, users see a calm notice explaining that the AI helper is busy, and the system automatically retries after a short pause.

## (b) Files Changed
### Configuration, Properties & Lifecycles
- `backend/src/main/resources/application.yml`: Set `spring.jpa.open-in-view: false` to release JDBC connections immediately after service calls.
- `backend/src/main/resources/application-prod.yml`: Set `spring.jpa.open-in-view: false`, default `maximum-pool-size: ${DB_POOL_SIZE:10}`, `connection-timeout: 10000`, `leak-detection-threshold: 30000`, and added warning comments on Render Postgres max connection limits.
- `backend/src/main/resources/application-local.yml`: Configured local dev settings.
- `backend/src/main/java/com/hackathonos/backend/common/config/AppProperties.java`: Added configuration properties for bulkhead concurrency limits (`aiMaxConcurrent`, `sttMaxConcurrent`, `heavyParseMaxConcurrent`, `bulkheadAcquireTimeoutMs`) and document parsing caps (`pdfMaxPages`, `pptxMaxSlides`).
- `backend/src/main/java/com/hackathonos/backend/common/config/ProductionStartupValidator.java`: Added startup log warning if pool size exceeds safe bounds relative to database connection ceilings.
- `.env.example`, `backend/.env.example`, `render-env.template`: Documented new environment variables and updated default `DB_POOL_SIZE` to 10.

### Concurrency Bulkhead & Error Handling
- `backend/src/main/java/com/hackathonos/backend/common/concurrency/ExternalCallBulkhead.java`: Thread-safe concurrency controller managing named semaphores (`ai-llm`, `ai-stt`, `heavy-parse`) with configurable acquire timeouts and active permit counters.
- `backend/src/main/java/com/hackathonos/backend/common/error/ServerBusyException.java`: Domain exception thrown when bulkhead capacity is saturated after timeout.
- `backend/src/main/java/com/hackathonos/backend/common/error/ApiExceptionHandler.java`: Mapped `ServerBusyException` to HTTP 503 (`SERVER_BUSY`) with `Retry-After: 5` header and user-friendly error payload.

### Transaction Isolation & External Call Refactoring
- `backend/src/main/java/com/hackathonos/backend/ai/AiService.java`: Guarded LLM completions (`ai-llm`) and Whisper STT (`ai-stt`) with `ExternalCallBulkhead` outside of any database transaction.
- `backend/src/main/java/com/hackathonos/backend/brief/BriefService.java`: Removed class-level `@Transactional`. Refactored `setLinkSource`, `setPdfSource`, `setImagesSource`, `intakeFile`, and `autoExtract` into short read transaction -> external HTTP/AI call -> short write transaction using `TransactionTemplate`.
- `backend/src/main/java/com/hackathonos/backend/pitch/DeckAuditService.java`: Split `saveSlidesFromUpload`, `auditSlide`, and `auditDeck` into short transactions around external parsing and LLM calls.
- `backend/src/main/java/com/hackathonos/backend/pitchkit/QnaService.java`: Refactored `uploadSessionAudio` and `generateMore` to invoke Whisper STT and LLM completions outside of database transactions; removed `@Transactional` from pure read `gradeAnswer`.
- `backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java`: Refactored `uploadAudio` and `getCoachFeedback` to run STT and LLM completions completely outside database transactions.
- `backend/src/main/java/com/hackathonos/backend/pitch/PitchQaService.java`: Refactored `generateQa` to execute AI chat completions outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/pitch/PitchScriptService.java`: Refactored `generateScript` to run AI completions outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/submission/SubmissionService.java`: Refactored `checkLinks` to perform HTTP HEAD/GET checks outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/apihub/ApiHubService.java`: Refactored `checkExternal` to test external URLs outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/integrations/IntegrationsService.java`: Refactored `connectWithToken` and `checkConnection` to perform external OAuth/provider validation outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/github/GitHubService.java`: Refactored `connect`, `link`, `sync`, and `updateDeployedLink` to run external GitHub API queries outside `@Transactional`.
- `backend/src/main/java/com/hackathonos/backend/github/GitHubSyncService.java`: Removed `@Transactional` from `sync(Room, UUID)`.
- `backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java`: Removed `@Transactional` from `getOrBuildPrompt` and `buildStepPrompt` so dynamic prompt analysis and Groq execution run without holding JDBC connections.
- Removed `@Transactional` from pure read-only methods across services: `DocService.askDocAi`, `BriefService.extractBrief`, `PhaseService.generatePhaseTasks`, `PitchDeckService.draftSlide`, `PitchService.aiEdit`, `PlanService.generateStep`, `ReadinessService.validateSimulation`, `SubmissionService.generateDraft`, `GitHubService.getMyRepos`.

### Memory Protection for Heavy Parsing
- `backend/src/main/java/com/hackathonos/backend/brief/BriefPdfParser.java`: Protected with `ExternalCallBulkhead("heavy-parse")`, configured PDFBox temp-file memory backing (`MemoryUsageSetting.setupTempFileOnly().streamCache`), capped parsed pages (`pdfMaxPages` default 80), and capped extracted text length.
- `backend/src/main/java/com/hackathonos/backend/files/FileTextExtractor.java`: Protected with `ExternalCallBulkhead("heavy-parse")`, capped PDF pages (`pdfMaxPages` default 80) and PPTX slides (`pptxMaxSlides` default 60) with stream closing and size validation.

### Background Lock Refactoring & Visibility
- `backend/src/main/java/com/hackathonos/backend/common/lock/DbAdvisoryLockService.java`: Added `tryXactLockAndClaim` using `SELECT pg_try_advisory_xact_lock(?)` within short-lived transaction scopes, releasing physical connection before subsequent background I/O.
- `backend/src/main/java/com/hackathonos/backend/submission/SubmissionLinkCheckJob.java`: Refactored to claim stale links under advisory transaction lock and verify HTTP links outside any database transaction.
- `backend/src/main/java/com/hackathonos/backend/email/MailWorker.java`: Refactored to claim queued emails under advisory transaction lock, releasing the DB connection before executing external SMTP sends.
- `backend/src/main/java/com/hackathonos/backend/github/GitHubSyncJob.java`: Refactored to claim candidate sync rooms under advisory transaction lock and execute GitHub API sync outside of any lock or database transaction.
- `backend/src/main/java/com/hackathonos/backend/events/RoomEventHub.java`: Added `getActiveConnectionCount()` to expose active SSE subscriber count.
- `backend/src/main/java/com/hackathonos/backend/common/logging/SystemMetricsLogger.java`: Added 60s scheduled single-line INFO logger tracking Hikari active/idle/waiting, bulkhead permits, SSE connections, and JVM heap usage.

### Frontend
- `frontend/src/lib/apiClient.ts`: Intercepted HTTP 503 `SERVER_BUSY` errors to display a calm toast ("Our AI helper is busy - trying again in a few seconds") and automatically retry once after `Retry-After` seconds for AI actions.

### Automated Tests
- `backend/src/test/java/com/hackathonos/backend/common/concurrency/ExternalCallBulkheadTest.java`: Verified semaphore permit tracking, timeout rejection with `ServerBusyException`, and 503 response mapping.
- `backend/src/test/java/com/hackathonos/backend/ai/AiTransactionIsolationTest.java`: Verified AI outputs remain intact and proved that under a 2-connection pool with 5 concurrent 3-second mock AI calls, normal database queries answer in < 1 second.

---

## (c) New Environment Variables
- `DB_POOL_SIZE`: HikariCP connection pool size (default: `10` in production).
- `AI_MAX_CONCURRENT`: Global concurrency bulkhead limit for outbound LLM requests (default: `6`).
- `STT_MAX_CONCURRENT`: Global concurrency bulkhead limit for Speech-to-Text Whisper transcription requests (default: `3`).
- `HEAVY_PARSE_MAX_CONCURRENT`: Global concurrency bulkhead limit for PDF/PPTX parsing (default: `2`).
- `BULKHEAD_ACQUIRE_TIMEOUT_MS`: Wait timeout in milliseconds to acquire a bulkhead permit before returning HTTP 503 (default: `5000`).
- `PDF_MAX_PAGES`: Maximum pages parsed from an uploaded PDF document before rejecting/truncating (default: `80`).
- `PPTX_MAX_SLIDES`: Maximum slides parsed from an uploaded PPTX deck before rejecting/truncating (default: `60`).

---

## (d) How to Verify Manually
1. Open terminal in `backend/` and run `./mvnw test` (or `.\mvnw.cmd test` on Windows).
   - Expected: All 190 tests execute and pass with 0 failures and 0 errors, including `AiTransactionIsolationTest` and `ExternalCallBulkheadTest`.
2. Open terminal in `frontend/` and run `npm run build && npm run test`.
   - Expected: TypeScript check and Vite build succeed with zero errors; Vitest tests pass.
3. Start the backend with `./mvnw spring-boot:run`.
   - Observe console logs: verify `ProductionStartupValidator` and the 60-second `SystemMetricsLogger` output:
     `[METRICS] Hikari active=0 idle=10 waiting=0 | Bulkhead permits: ai-llm=6/6 ai-stt=3/3 heavy-parse=2/2 | SSE connections=0 | JVM Heap=...`
4. Log into the application at `http://localhost:5173`.
5. In one browser tab, navigate to a Room and trigger an AI action (e.g. Brief Auto-Extract or Pitch Rehearsal).
6. Simultaneously in a second browser tab, navigate between Rooms, view Tasks, and update room notes.
   - Expected: Room navigation and database operations respond instantaneously with zero connection starvation delay.
7. To simulate bulkhead saturation:
   - Temporarily set `AI_MAX_CONCURRENT=1` and fire multiple concurrent AI requests.
   - Expected: The second request waits up to 5 seconds; if saturated, receives HTTP 503 `SERVER_BUSY`. The frontend displays the calm toast and automatically retries once.

---

## (e) Rollback Notes
If Step 2 needs to be reverted:
```bash
git revert HEAD
```
No database migrations were created or modified in Step 2; database schema is unchanged.
If rolling back configuration only, set `spring.jpa.open-in-view: true` in `application.yml` and revert `DB_POOL_SIZE` in `render-env.template`.

---

## (f) Decisions and Assumptions
1. **Advisory Lock Strategy**: Session-level advisory locks hold their physical connection open until explicitly unlocked or disconnected. We introduced `DbAdvisoryLockService.tryXactLockAndClaim` using `SELECT pg_try_advisory_xact_lock(?)`. This executes inside a short transaction to claim work rows (updating claim timestamps/states) and releases the database connection before initiating external I/O (link checks, SMTP sends, GitHub sync).
2. **Constructor Injection with Multiple Constructors**: In Spring Boot 4 / Spring Framework 7, beans with multiple constructors must explicitly declare `@Autowired` on the target injection constructor to avoid `NoSuchMethodException` during bean creation. Explicit `@Autowired` was added to all modified services with secondary test constructors.
3. **OSIV & DTO Mapping**: Disabling Open-Session-In-View caused zero LazyInitializationExceptions across the test suite because existing endpoints already map entities to DTOs within service boundaries.
4. **Audit Claim Verification**:
   - `DocService.downloadDoc` does not call AI; it reads doc versions and creates a zip stream.
   - `PlanService.validateStep` does not call AI; it performs markdown regex validation.
   - `PitchDeckService.exportMarkdown` performs local string formatting without external I/O.
   These were verified in code and left without unnecessary refactors.

---

## (g) Remaining Risks / Follow-ups
- Render Starter/Standard PostgreSQL has strict connection ceilings (typically 20-50 total connections). If multiple backend web service instances are deployed on Render, `DB_POOL_SIZE` across instances must not exceed `max_connections - reserved_connections`.
- Step 3 will focus on slow queries and missing database indexes.
- Step 4 will refactor `RoomEventHub` SSE streaming to prevent connection leaks and starvation.

---

## (h) Things the Human Owner Must Do Outside the Code
- In Render Web Service settings, verify that `DB_POOL_SIZE` is set appropriately based on the number of running instances (e.g. 1 instance -> `DB_POOL_SIZE=10`; 2 instances -> `DB_POOL_SIZE=5`).
- If utilizing custom limits, configure `AI_MAX_CONCURRENT`, `STT_MAX_CONCURRENT`, and `HEAVY_PARSE_MAX_CONCURRENT` in the Render environment variables dashboard.

---

## Static Grep Verification (Definition of Done)
Verification that zero outbound HTTP/STT/SMTP calls exist within `@Transactional` scope:
- Total `@Transactional` classes checked: 81
- Outbound call patterns evaluated: `aiService.chat`, `aiClient.`, `restGitHubClient.`, `safeHttpClient.`, `transcribeAudio`, `mailSender.send`.
- Results:
  - `DocService.askDocAi`: `@Transactional` removed; pure read with AI outside tx.
  - `PlanPromptService.getOrBuildPrompt`: `@Transactional` removed; AI analysis and native DB upsert executed safely outside tx.
  - `PlanPromptService.buildStepPrompt`: `@Transactional` removed.
  - `QnaService.uploadSessionAudio`: Whisper STT outside tx; DB updates use `TransactionTemplate`.
  - `RehearsalService.uploadAudio`: Whisper STT outside tx; DB updates use `TransactionTemplate`.
  - `BriefService` (5 methods): Refactored with `TransactionTemplate`.
  - `DeckAuditService` (3 methods): Refactored with `TransactionTemplate`.
  - `PitchQaService`, `PitchScriptService`, `SubmissionService`, `ApiHubService`, `IntegrationsService`, `GitHubService`, `GitHubSyncService`: All outbound I/O runs outside `@Transactional`.
  - Background workers (`MailWorker`, `SubmissionLinkCheckJob`, `GitHubSyncJob`): Claim work via `tryXactLockAndClaim`, run external calls with zero DB connections held.
- Spring Open-Session-In-View: `spring.jpa.open-in-view: false` in both `application.yml` and `application-prod.yml`.
- All tests green: 190 passed, 0 failures.

