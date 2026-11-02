# 8. Background Work & External Dependencies

## 8.1 Scheduled Background Jobs Inventory
The application runs **13 scheduled background tasks** managed by Spring's `@Scheduled` annotation across 4 scheduler threads (`spring.task.scheduling.pool.size: 4` in [application.yml:65](file:///backend/src/main/resources/application.yml#L65)).
All major recurring jobs acquire a PostgreSQL session-level advisory lock via [DbAdvisoryLockService.java](file:///backend/src/main/java/com/hackathonos/backend/common/lock/DbAdvisoryLockService.java) to prevent overlapping executions during zero-downtime rolling deploys:

| Job Class | Schedule / Cron | Lock Key | Advisory Lock Method | DB Tables Touched | External Calls | Purpose |
|---|---|---|---|---|---|---|
| **`MailWorker.java:65`** | Fixed Delay: 5,000ms (5s) | `1004L` | `tryLockAndRun(1004L)` | `email_outbox` | SMTP TLS (Port 587) | Polls queued transactional emails; delivers with exponential backoff (1m, 5m, 20m, 1h, 3h). |
| **`RoomEventHub.java:379`** | Fixed Delay: 25,000ms (25s)| None | In-Memory Only | None | None | Iterates through all open SSE connections, writing keep-alive ping comments (`: ping`). |
| **`RoomSseBroadcaster.java:81`** | Fixed Rate: 25,000ms (25s) | None | In-Memory Only | None | None | Iterates through secondary SSE connections, sending heartbeat events. |
| **`RateLimiter.java:71`** | Fixed Delay: 300,000ms (5m)| None | In-Memory Only | None | None | Evicts idle token buckets older than 1 hour from heap memory. |
| **`DeadlineReminderJob.java:59`**| Fixed Rate: 300,000ms (5m) | `1005L` | `tryLockAndRun(1005L)` | `rooms`, `reminder_log`, `notifications`, `email_outbox` | None (queues emails) | Checks room deadlines (3h, 1h, 15m remaining); queues reminder notifications and emails. |
| **`EmailReminderScheduledJob.java:60`**| Fixed Rate: 300,000ms (5m)| `1008L` | `tryLockAndRun(1008L)` | `rooms`, `room_members`, `email_outbox` | None (queues emails) | Sends stage reminder emails based on user preferences. |
| **`GitHubSyncJob.java:43`** | Cron: `0 */10 * * * *` (10m)| `1007L` | `tryLockAndRun(1007L)` | `github_repos`, `github_branches`, `github_commits` | GitHub REST API | Syncs branch updates and commit frequency for all connected room repositories. |
| **`SubmissionLinkCheckJob.java:46`**| Fixed Delay: 1,800,000ms (30m)| `1006L` | `tryLockAndRun(1006L)` | `submission_links`, `submissions` | Outbound HTTP HEAD/GET | Validates that demo links, video URLs, and repo links are reachable (status 200). |
| **`HackathonService.java:56`** | Cron: `0 0 */6 * * *` (6h) | `1003L` | `tryLockAndRun(1003L)` | `hackathons` | None | Re-syncs hackathon directory from static config file. |
| **`OAuthServerService.java:263`**| Fixed Delay: 86,400,000ms (24h)| None | `@Transactional` | `oauth_auth_codes`, `oauth_clients` | None | Deletes expired OAuth authorization codes (>10m old) and inactive client registrations. |
| **`CleanupJob.java:29`** | Cron: `0 0 3 * * *` (3 AM UTC)| `1002L` | `tryLockAndRun(1002L)` | `data_exports`, `uploaded_files` | Filesystem delete | Deletes expired ZIP export files and temp files from container filesystem. |
| **`DataRetentionService.java:59`**| Cron: `0 0 3 * * ?` (3 AM) | `1001L` | `tryLockAndRun(1001L)` | `rooms`, `tasks`, `docs`, etc. | Filesystem delete | Permanently purges soft-deleted rooms older than the retention threshold (30 days). |
| **`NotificationService.java:291`**| Cron: `0 0 3 * * ?` (3 AM) | `1009L` | `tryLockAndRun(1009L)` | `notifications` | None | Purges read notifications older than 30 days. |

---

## 8.2 Outbox Pattern & Email Processing
Transactional emails are decoupled from client request threads using an asynchronous **Transactional Outbox Pattern**:
1. When a user is invited (`POST /api/v1/rooms/{roomId}/email-invites`) or a deadline approaches, the service persists a record to `email_outbox` ([V23__email_outbox_and_room_invites.sql](file:///backend/src/main/resources/db/migration/V23__email_outbox_and_room_invites.sql)) inside the same database transaction.
2. `MailWorker.java` wakes every 5 seconds, queries pending emails (`status = 'PENDING' OR (status = 'RETRYING' AND next_attempt_at <= NOW())`), and acquires advisory lock `1004L`.
3. Checks daily sending volume against `mailProperties.getDailyLimit()` (default: 400).
4. Renders HTML and plain-text templates using `MailTemplateRenderer.java` ([backend/src/main/resources/mail/](file:///backend/src/main/resources/mail/)).
5. Delivers via Spring `JavaMailSender` over TLS to `smtp.gmail.com:587`.
6. On delivery failure, calculates backoff delay using `BACKOFF = [1m, 5m, 20m, 1h, 3h]`. After 5 consecutive failures, marks status as `FAILED`.

---

## 8.3 Third-Party External APIs
| Service | Provider / Endpoint | Auth Method | Timeouts | Circuit Breaker & Fallback |
|---|---|---|---|---|
| **LLM Gateway** | Groq / OpenAI-compatible (`${AI_BASE_URL:https://api.groq.com/openai/v1}`) | Bearer API Key (`${AI_API_KEY}`) or User BYOK Key | Timeout: 45s ([application.yml:174](file:///backend/src/main/resources/application.yml#L174)); Retries: 2 | `AiCircuitBreaker.java`: Opens after 3 consecutive errors for 30s. Per-user semaphore caps concurrent calls to 4. Rate limited to 10 calls/min. |
| **Whisper STT** | Groq Whisper (`${STT_BASE_URL}`) / `whisper-large-v3` | Bearer API Key (`${STT_API_KEY}`) | Timeout: 45s; Retries: 1 | Same circuit breaker and rate limiting as LLM gateway. |
| **GitHub API** | `https://api.github.com` | Personal Access Token (`APP_GITHUB_TOKEN`) or User OAuth Token | Connect: 5s, Read: 10s | Evaluates `x-ratelimit-remaining`. In-memory cache caches stats for 60 seconds (`GitHubService.sectionCache`). |
| **Canva API** | `https://www.canva.com/api` | OAuth 2.0 PKCE Bearer Token | Standard HTTP timeouts | None |
| **Gmail SMTP** | `smtp.gmail.com:587` | Username & 16-char App Password (`MAIL_APP_PASSWORD`) | Connect: 10s, Read: 10s, Write: 10s | Backoff retry queue (max 5 retries); disables delivery if credentials missing. |

---

## 8.4 Synchronous Blocking Work Inside HTTP Requests (CRITICAL)
The following heavy operations execute **synchronously on the HTTP request thread** while the client awaits an HTTP response:

1. **AI 5-Step Planning Generation ([PlanController.java](file:///backend/src/main/java/com/hackathonos/backend/plan/PlanController.java) -> `PlanService.generateStep`)**:
   - Compiles full room context pack (PRD, tech stack, phases, existing tasks).
   - Makes outbound HTTP call to Groq LLM (duration: 20 to 45 seconds).
   - Validates response JSON using `PlanValidationService.java`.
   - **Blocks the client connection and holds a database transaction open.**
2. **Brief Extraction & Parsing ([BriefController.java](file:///backend/src/main/java/com/hackathonos/backend/brief/BriefController.java) -> `BriefService.extractBrief`)**:
   - Parses multi-page PDF via Apache PDFBox or fetches URL via `SsrfGuard`.
   - Dispatches full text to LLM (duration: 15 to 30 seconds).
   - **Blocks the client connection and holds a database transaction open.**
3. **Pitch Deck Slide Audit ([DeckAuditController.java](file:///backend/src/main/java/com/hackathonos/backend/pitch/DeckAuditController.java) -> `DeckAuditService.auditDeck`)**:
   - Iterates through deck slides, calling LLM for slide linting and suggestions (duration: 15 to 35 seconds).
   - **Blocks the client connection and holds a database transaction open.**
4. **Rehearsal Audio Transcription ([RehearsalController.java](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalController.java) -> `RehearsalService.uploadAudio`)**:
   - Receives multipart WebM/WAV audio chunk (up to 5 MB).
   - Validates magic bytes.
   - Synchronously streams bytes to Whisper STT API (duration: 5 to 15 seconds).
   - **Blocks the client connection and holds a database transaction open.**
