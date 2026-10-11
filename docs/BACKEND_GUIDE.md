# Hackathon OS - Backend Guide

This guide documents the architecture, directory layout, request flow, and security mechanisms implemented for **Phase 1: Foundation & Core Identity** and **Phase 2: Planning Flow (Brief, Ideate, Plan, Docs & Board Read Endpoints)**.

---

## 1. Package Structure Map

```
com.hackathonos.backend
├── common
│   ├── config
│   │   ├── AppProperties.java          # App config properties (@ConfigurationProperties)
│   │   ├── CorsConfig.java             # CORS mappings with credentials
│   │   ├── JacksonConfig.java          # JavaTimeModule, ISO dates, ObjectMapper bean
│   │   └── SecurityConfig.java         # OAuth2 client login, session cookie, 401 JSON entrypoint
│   ├── dto
│   │   ├── CursorPageResponse.java     # Keyset pagination container
│   │   └── HealthResponse.java         # Public system status response
│   ├── error
│   │   ├── ApiExceptionHandler.java    # @RestControllerAdvice with structured JSON errors
│   │   ├── BadRequestException.java    # 400 with optional fieldErrors
│   │   ├── ConflictException.java      # 409 conflict (e.g. STEP_ORDER, CONFIRM_REQUIRED)
│   │   ├── ForbiddenException.java     # 403 access denied
│   │   ├── NotFoundException.java      # 404 resource not found
│   │   ├── TooManyRequestsException.java # 429 rate limit exceeded
│   │   └── BadGatewayException.java    # 502 external provider error
│   ├── security
│   │   ├── CurrentUser.java            # Injects authenticated user from SecurityContext
│   │   ├── OAuth2LoginSuccessHandler.java # Upserts GitHub/Google user & default settings
│   │   ├── RoomAccess.java             # Room permission gates (requireMember, requireLeader)
│   │   └── SecretCipher.java           # AES-256-GCM encryption for API keys
│   └── PublicHealthController.java     # GET /api/v1/health
│
├── users                               # Identity, settings, API keys, export, delete
├── templates                           # Event hackathon blueprints
├── rooms                               # Room lifecycle, scheduling, overview, stage engine
├── members                             # Teammates, roles, skills, invitations
├── invites                             # Sharable invite links & 4-char join codes
├── notifications                       # In-app event alerts
├── activity                            # Room audit timeline
│
├── brief                               # Phase 2: Hackathon brief intake & verification
│   ├── dto/                            # SaveBriefRequest, BriefResponseDto, etc.
│   ├── Brief.java                      # Brief entity (source, fields, confirmed, risks)
│   ├── BriefRubricItem.java            # Rubric criteria with weights summing to 100
│   ├── UploadedFile.java               # PDF uploads metadata and local storage path
│   ├── BriefService.java               # Validation, link fetch, PDF parsing, confirmation
│   ├── BriefController.java            # /api/v1/rooms/{id}/brief/**
│   ├── SsrfGuard.java                  # DNS resolution check blocking local & private IPs
│   ├── BriefPdfParser.java             # Apache PDFBox parser with magic byte validation
│   └── BriefMapper.java
│
├── ideas                               # Phase 2: Team ideation & leader decisions
│   ├── dto/                            # PostIdeaRequest, IdeateResponseDto, IdeaDto
│   ├── Idea.java                       # Idea proposition entity (status, primary star)
│   ├── IdeaLinkItem.java               # External references attached to idea
│   ├── IdeaNoteItem.java               # Private notes attached to idea
│   ├── IdeasService.java               # Author edit/delete, leader approve/reject/restore
│   ├── IdeasController.java           # /api/v1/rooms/{id}/ideas/**, /ideate
│   └── IdeasMapper.java
│
├── plan                                # Phase 2: 5-step progressive prompt bridge
│   ├── dto/                            # PlanDto, PlanStepDto, ValidatePlanResponse
│   ├── validators/                     # Deterministic, tolerant server validators
│   │   ├── PrdValidator.java           # Step 1: Headings, core flow, cut list, real vs mock
│   │   ├── TechValidator.java          # Step 2: Tech table, Known/New status, mermaid diagram
│   │   ├── PhasesValidator.java        # Step 3: Contiguous JSON phases 0-100%, freeze & rehearsal
│   │   ├── TasksValidator.java         # Step 4: JSON tasks referencing valid phases, DAG check
│   │   ├── DemoValidator.java          # Step 5: Demo script timing 60-120s, Q&A pairs
│   │   └── MarkdownSections.java       # Markdown parsing and header extraction utility
│   ├── PlanStep.java                   # Step state (draft, validated, errors, warnings)
│   ├── PlanPhase.java                  # Extracted phase entity
│   ├── PlanService.java                # Step ordering, autosave, 409 confirm cascade
│   ├── PlanController.java             # /api/v1/rooms/{id}/plan/**, /stage/enter-build
│   ├── PromptBuilder.java              # Server-rendered dynamic prompts per step
│   └── PlanCompletionService.java      # Generates 10 Markdown docs, phases, tasks & assignments
│
├── ai                                  # Phase 2: Multi-provider AI client
│   ├── AiService.java                  # Provider routing (OpenAI, Anthropic, Gemini)
│   ├── AiRateLimiter.java              # In-memory sliding window (10 requests/hour/user)
│   ├── OpenAiClient.java
│   ├── AnthropicClient.java
│   └── GeminiClient.java
│
├── docs                                # Phase 2 (Read) & Phase 3 (Write): Document vault
│   ├── dto/                            # DocItemDto, DocDetailDto, DocListResponseDto
│   ├── Doc.java                        # Markdown document entity
│   ├── DocVersion.java                 # Version history record
│   ├── DocService.java                 # List documents, read document by fileName
│   └── DocController.java              # /api/v1/rooms/{id}/docs/**
│
└── tasks                               # Phase 2 (Read) & Phase 3 (Write): Kanban board
    ├── dto/                            # BoardResponseDto, BoardTaskDto, BoardColumnsDto
    ├── Task.java                       # Kanban task entity
    ├── TaskDependency.java             # DAG dependency relationship
    ├── TaskKeyService.java             # Thread-safe atomic sequential key allocator (CBS-1)
    ├── BoardService.java               # Kanban board column organizer (todo/inprogress/done)
    └── BoardController.java            # /api/v1/rooms/{id}/board
```

---

## 2. Planning Flow Architecture (ASCII Diagram)

```
                 [ 1. BRIEF STAGE ]
                 /                \
        Link Intake              PDF Upload
      (SsrfGuard check)       (Apache PDFBox)
                 \                /
             Raw Announcement Text
                       │
       Extraction Prompt / Validate JSON
                       │
                 Save & Verify
             (Rubric sum must = 100)
                       │
               [ Confirm Brief ]
           (Requires all ticks checked)
                       │
                       ▼
                 [ 2. IDEATE STAGE ]
                       │
         Teammate Brainstorm Feed (15s poll)
                       │
       Leader Decisions (Approve / Reject / Undo)
                       │
             Set Single Primary Star ★
                       │
             [ Mark Ideation Done ]
         (Requires >= 1 approved idea)
                       │
                       ▼
                  [ 3. PLAN STAGE ]
                       │
      PromptBuilder builds dynamic context prompt
                       │
             Step 1: PRD & MVP Specification
                       │  (Validated -> nextStepKey)
             Step 2: Tech Stack & Architecture
                       │  (Validated -> nextStepKey)
             Step 3: Contiguous Sprints / Phases
                       │  (Validated -> nextStepKey)
             Step 4: Sprint Tasks & Estimates
                       │  (Validated -> nextStepKey)
             Step 5: Demo Script & Judge Defense Q&A
                       │
                       ▼
          [ PlanCompletionService.complete() ]
      ┌──────────────────────────────────────────────┐
      │ 1. Generates 10 Real Vault Docs:            │
      │    PRD, MVP, PROBLEM, CUT_LIST, RISKS,       │
      │    TECH_STACK, PHASES, DEMO_SCRIPT, QA,      │
      │    DECISIONS.md                              │
      │ 2. Seeds PlanPhase rows in database          │
      │ 3. Creates Board Tasks with CBS-1 atomic keys│
      │ 4. Round-robin assignments by skill matching │
      │ 5. Dispatches summary notification to team   │
      └──────────────────────────────────────────────┘
                       │
                       ▼
            [ POST /stage/enter-build ]
                       │
      - Sets room stage to 'build'
      - Sets build_started_at timestamp
      - Locks Brief, Ideas, and Plan modifications (409 PLAN_LOCKED)
      - Unlocks Board and Docs workspace
```

---

## 3. How Validators Work

Validators implement deterministic, lenient validation designed for hackathon sprints:
1. **Blocking Errors (`issues`)**:
   Missing critical structural elements that would prevent sprint execution (e.g., missing `# PRD` root heading, non-contiguous phases, cyclic task dependencies, fewer than 3 judge Q&A questions).
2. **Non-blocking Warnings (`warnings`)**:
   Quality recommendations that highlight potential sprint risks without halting progress (e.g., demo duration outside 60–120s, recommended question "What breaks first?" omitted, cut list under 3 items).
3. **Repair Prompt Generation**:
   When a step fails validation, the server constructs a concise repair prompt instructing the LLM:
   `Your previous answer had these issues: [issues list]. Fix ONLY those issues and reply again in the exact requested format.`

### How to Add a New Plan Step:
1. Add the step key and title to `PlanService.STEP_KEYS` and `PlanService.STEP_TITLES`.
2. Create a validator class in `com.hackathonos.backend.plan.validators` implementing the validation rules.
3. Update `PromptBuilder` to add prompt generation rules for the new step.
4. Update `PlanCompletionService` if the new step generates additional documentation or board artifacts.
5. Add test coverage in `PlanValidatorTest` with a valid sample, warning sample, and broken sample.

---

## 4. Resetting the Dev Database

To wipe and re-run migrations from clean state:
```bash
# In PostgreSQL
DROP DATABASE hackathon_os;
CREATE DATABASE hackathon_os;

# Run Spring Boot (Flyway applies V1-V5 migrations automatically)
./mvnw.cmd spring-boot:run
```

---

## 5. Phase 3: The BUILD Phase Architecture

Phase 3 transitions teams from planning into execution crunch time with high-velocity collaboration tooling:

### 5.1 Kanban Board & Task State Machine
- **Controller**: `TasksController` at `/api/v1/rooms/{roomId}/tasks` and `BoardController` at `/api/v1/rooms/{roomId}/board`.
- **Sequential Key Allocation**: Sequential atomic numbers per room prefix (`CKT-1`, `CKT-2`) via `TaskKeyService`.
- **Move Algorithm**: Reorders positions in source and destination columns; dragging an unassigned task to `IN_PROGRESS` automatically assigns the current user; moving to `DONE` sets `completedAt`.
- **Optimistic Locking**: Detects concurrent updates via task `version`. Returns HTTP `409 Conflict` with `TASK_CHANGED` payload.
- **Dependency Cycle Detector**: `DependencyCycleDetector` traverses directed dependency graphs and throws HTTP `400 Bad Request` with `DEPENDENCY_CYCLE` if circular dependencies are found.

### 5.2 Room Overview & Live Vitals
- **Controller**: `OverviewController` at `/api/v1/rooms/{roomId}/overview`, `/progress`, `/workload`, `/nav-badges`.
- **ClockService**: Event timeline countdown (`NOT_STARTED`, `ON_TRACK`, `DUE_SOON`, `FINAL_STRETCH`, `ENDED`) and active phase segment resolution.
- **ProgressService**: Hourly planned burnup curve vs actual completed task burnup curve and delta percentage.
- **WorkloadService**: Individual member task load, completed vs expected counts, and active presence status.
- **AttentionEngine**: Evaluates 6 deterministic rules (`BlockedTasksRule`, `BehindPlanRule`, `CheckpointBehindRule`, `OverdueTasksRule`, `SkillGapRule`, `UnassignedTasksRule`), sorts by severity (red > amber > purple > gray), and caps at the top 5 highest-priority items.

### 5.3 Seven Hackathon Checkpoints
- Automated seeding via `CheckpointService.createForRoom`:
  1. `RULES_CONFIRMED`: Auto-passes when brief rubric is confirmed.
  2. `IDEA_LOCKED`: Auto-passes when ideation is approved.
  3. `CORE_FLOW_RUNS`: Auto-passes when MVP core path executes.
  4. `FEATURE_FREEZE`: Auto-passes when clock crosses freeze waypoint.
  5. `DEMO_REHEARSED`: Rehearsal progress tracker (3 iterations target).
  6. `VIDEO_RECORDED`: Manual toggle with backup notes.
  7. `SUBMISSION_VERIFIED`: Manual team lead verification before final submission.

### 5.4 Docs Vault & MVP Studio
- **Docs Vault**: `DocsService` with optimistic locking (`baseVersion`), historical version retrieval, version restore, and ZIP archive download.
- **MVP Studio**: `MvpService` managing pitch, core flow, scope ledger, health checklist, judge Q&A prep, and cut list.

### 5.5 Background Jobs & Dev Tools
- **DeadlineReminderJob**: Scheduled job (every 5m) alerting users of tasks and checkpoints due within a 60-minute window with deduplication logging.
- **Dev Tools**: Active under `@Profile("dev")` at `/api/v1/dev/rooms/{roomId}/set-clock` and `/simulate-progress` for rapid QA testing.

---

## 6. Phase 4: Ship & Present Architecture

Phase 4 completes the journey from build to demo day, pitch defense, submission, and post-event retro:

### 6.1 GitHub Hub (`com.hackathonos.backend.github`)
- **Controller**: `GitHubController` at `/api/v1/rooms/{roomId}/github`.
- **Client Resolution**: `GitHubClientResolver` transparently switches between `RestGitHubClient` and `FakeGitHubClient` (when connecting `demo/demo-repo` or under test/dev with fake enabled).
- **Branch Management**: Role classification (`main`, `demo-safe`, `experiment`, `stale`), purpose annotation, and task linkage.
- **Freeze Mechanism**: Creates `GithubFrozenDemo` tag lock and checks for late commit drift on frozen demo branches.
- **Pure Calculators** in `com.hackathonos.backend.github.calc`:
  - `ActivityBucketsCalculator`: Generates 3-hour commit activity slices and pre-kickoff buckets.
  - `HistoryHealthCalculator`: Detects thin histories, giant commits (>60% additions), and bus factor warnings (>80% contributor share).
  - `BranchMissingCalculator`: Evaluates missing PRs, long drafts (>24h), PR conflicts, unreviewed PRs, demo-safe lag behind main, and stale branches.
  - `RuleCheckCalculator`: Evaluates whether commits were made before kickoff.

### 6.2 Pitch Studio (`com.hackathonos.backend.pitch`)
- **Controller**: `PitchController` at `/api/v1/rooms/{roomId}/pitch/**`.
- **Deck & Slides**: Automated creation, slide CRUD, and reordering.
- **Slide Linter**: `SlideLinter` validates story beat coverage (Problem, Impact with concrete numbers, What's Next), text density (<70 words), and rubric criterion alignment.
- **Format Profile**: `FormatProfileResolver` selects presentation parameters (e.g. `live_3min`, `ppt_first`, `async_video`, `demo_90s`) based on brief keywords.
- **Rehearsal Analytics**: `PitchRehearsalService` logs slide timings, pacing feedback, and rehearsal counts against targets.
- **Judging Q&A**: `PitchQaService` manages defense questions with AI generation and priority pinning.

### 6.3 Demo & Video Studio (`com.hackathonos.backend.demo`)
- **Controller**: `DemoController` at `/api/v1/rooms/{roomId}/demo/**`.
- **Demo Script**: Beat-by-beat timing and script builder with over-time alerts.
- **Shot List & Tools**: Curated tools for screen recording and shot list breakdown.
- **Demo Insurance & Media**: `DemoMedia` stores backup recordings and YouTube video links; insurance checklist ensures video fallback readiness.

### 6.4 Submission Center (`com.hackathonos.backend.submission`)
- **Controller**: `SubmissionController` at `/api/v1/rooms/{roomId}/submission/**`.
- **Submission Draft**: Stores `whatItDoes`, `whyItMatters`, `howBuilt`, `challenges`, and `whatsNext`.
- **Checklist Engine**: Groups items into required, team, and verification tiers with deadline countdown.
- **Verification**: `verify-links` checks repository, demo video, and deployed site connectivity.

### 6.5 Readiness & Simulator (`com.hackathonos.backend.readiness`)
- **Controller**: `ReadinessController` at `/api/v1/rooms/{roomId}/readiness/**`.
- **Readiness Scoring**: `ReadinessCalculator` compiles 7 dimensions (Rubric, MVP, Demo, Submission, Team, Repo, Delivery), detects top 3 weak spots, and builds readiness rings.
- **Judge Defense Simulator**: `HeuristicJudge` provides deterministic scoring (1-5) and actionable feedback on defense answers, with AI completion integration.

### 6.6 Retrospective & Portfolio (`com.hackathonos.backend.retro` & `portfolio`)
- **Controller**: `RetroController` at `/api/v1/rooms/{roomId}/retro/**` and `PortfolioController` at `/api/v1/rooms/{roomId}/portfolio`.
- **Milestone Timeline**: Reconstructs complete sprint timeline and time-per-phase breakdown.
- **Team Prompts**: Captures worked, didn't work, and change reflections, plus project decision (`continue` vs `archive`).
- **Portfolio Entry**: Publicly shareable project showcase.

### 6.7 Pre-Event Prep & Crowd Check (`com.hackathonos.backend.prep` & `crowd`)
- **Controller**: `PrepController` at `/api/v1/rooms/{roomId}/prep/**` and `CrowdCheckController` at `/api/v1/rooms/{roomId}/crowd-check/**`.
- **Prep Bento**: Event venue, dates, weather, and checklist items.
- **Crowd Check**: Competitive idea density scoring (LOW, MEDIUM, HIGH) and campus overlap risk.

### 6.8 External Mentor Portal (`com.hackathonos.backend.mentor`)
- **Controller**: `MentorController` at `/api/v1/mentor/**`.
- **Read-Only Scope**: Secure token-based access providing room summary, plan status, and board snapshot without edit privileges.
- **Mentor Q&A**: Question submission flow for external advisor guidance.

### 6.9 Dev Testing Controls (`com.hackathonos.backend.dev`)
- `POST /api/v1/dev/demo-room`: One-click seeding of full end-to-end 48h demo workspace (members, brief, ideas, tasks, presentation).
- `POST /api/v1/dev/rooms/{roomId}/github/add-commits`: Injects synthetic commits on any branch, with support for pre-kickoff timestamps.
- `POST /api/v1/dev/rooms/{roomId}/seed-present`: One-click seeding of pitch decks, Q&A, rehearsal runs, demo media, and submission drafts.

---

## 7. Phase 5: Production Hardening & Operations

### 7.1 Real-Time Server-Sent Events (SSE) Hub (`com.hackathonos.backend.events`)
- **Hub**: `RoomEventHub` manages thread-safe concurrent `SseEmitter` subscriptions with max 3 streams per user, heartbeats every 25s, and cleanup on disconnect/timeout.
- **Endpoints**:
  - `GET /api/v1/rooms/{roomId}/events`: Real-time room broadcast stream (`ROOM_STAGE_CHANGED`, `TASK_UPDATED`, `GITHUB_SYNCED`, etc.).
  - `GET /api/v1/notifications/stream`: Personal user notification stream.

### 7.2 Workspace Archive & Zip Export (`com.hackathonos.backend.rooms.export`)
- **Controller**: `RoomExportController` at `GET /api/v1/rooms/{roomId}/export.zip`.
- **Packaging**: Streams an uncompressed, structured ZIP bundle containing `room.json`, `brief.md`, `ideas.json`, `plan.json`, `docs/*.md`, and `tasks.csv`.

### 7.3 Automated Database Hardening & Maintenance
- **Flyway V9**: `V9__phase5_hardening.sql` establishes foreign key performance indexes across all relationships and creates the `set_updated_at()` automated trigger.
- **Cleanup Job**: `CleanupJob` runs nightly at `03:00 UTC` purging expired invite links, read notifications older than 30 days, and expired exports.



