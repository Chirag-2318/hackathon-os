# 1. Project Overview

## 1.1 Purpose and Core Functionality
**[brackit]** (internally identified by package name `hackathonos` and database `hackathon_os`) is an opinionated execution operating system and real-time team collaboration platform designed specifically for competitive hackathons. It guides participant teams through a structured hackathon sprint lifecycle:
1. **Intake & Brief**: Problem statement capture, PDF rubric extraction, judging criteria analysis, and track selection.
2. **Ideation**: Collaborative brainstorming, voting, deduplication, structured idea scoring, and primary concept lock-in.
3. **5-Step Planning**: PRD generation, technology stack architecture, phased sprint roadmap, granular task breakdown, and judge defence preparation.
4. **Build Execution**: Real-time Kanban board, MVP flow state ledger, markdown documentation vault (`/docs`), API catalog & mock server (`ApiHub`), and automated GitHub synchronization.
5. **Pitch Kit & Presentation**: Slide deck linting and audit, interactive demo station, audio-transcribed rehearsal telemetry (using Whisper), and judge Q&A defence trainer.
6. **Review & Archiving**: Post-event retrospective, award distribution, submission verification, team passport badges, and room archiving.

All interactions are backed by real-time Server-Sent Events (SSE), versioned optimistic locking concurrency, and a server-side AI gateway with zero client-exposed keys.

## 1.2 Core User Flows
- **Authentication Flow**: User navigates to `/login` -> initiates GitHub or Google OAuth2 -> redirects to provider -> provider redirects to `${APP_PUBLIC_URL}/login/oauth2/code/{provider}` -> proxied by Vercel to Spring Boot backend -> backend `OAuth2LoginSuccessHandler` resolves/creates user in `users` table -> issues HTTP-only `JSESSIONID` cookie -> redirects to `/app` (or `/onboarding` if new user).
- **Room Lifecycle Flow**:
  - `POST /api/v1/rooms` creates a new hackathon workspace with a specified track, start/end deadlines, and event template.
  - Creator is assigned `LEADER` role in `room_members` (`V1__phase1_schema.sql`).
  - Leader invites teammates via shareable join code (`POST /api/v1/rooms/{roomId}/invites`) or direct email outbox invitations (`POST /api/v1/rooms/{roomId}/email-invites`).
  - Stage progression: `PLANNING` -> `BUILD` -> `PRESENT` -> `REVIEW` enforced by `RoomStageService.java`.
- **Sprint Task Flow**:
  - Tasks belong to a room and optional phase (`tasks` table).
  - Columns: `TODO`, `IN_PROGRESS`, `DONE` (and `DROPPED`).
  - Mutations emit real-time SSE events via `RoomChangeInterceptor.java` (`afterCompletion`), invalidating React Query caches across all connected teammates within 250ms.
- **AI Planning Flow**:
  - Frontend triggers step generation -> `PlanController.java` calls `PlanService.java` -> calls backend `AiService.java` -> Groq / OpenAI compatible API -> response validated by `PlanValidationService.java` -> saved to `plan_steps` and markdown docs in `docs` table.
- **Pitch & Rehearsal Flow**:
  - Team uploads slide deck (`POST /api/v1/rooms/{roomId}/pitch/deck`) -> linter analyzes density and pacing (`SlideLinter.java`).
  - Rehearsal audio chunk recorded in browser -> uploaded as multipart WebM/WAV (`POST /api/v1/rooms/{roomId}/pitch/rehearsals/{runId}/beats/{beatId}/audio`) -> transcribed via Whisper (`aiService.transcribeAudio`) -> feedback generated.

## 1.3 User Roles and Permissions
The application models access controls at three distinct levels:
1. **Platform Administrator**:
   - Identified by email inclusion in `${ADMIN_EMAILS}`.
   - Enforced by `AdminOverviewController.java` (`requireAdmin()`) and `AppSettingsService.java` (`isAdmin()`).
   - Controls waitlist approval, user signup cap, hackathon directory synchronization, and global feature flags.
2. **Room Leader / Owner**:
   - `room_members.role = 'LEADER'` or matching `rooms.owner_id`.
   - Enforced by `RoomAccessService.java` (`requireLeader()`).
   - Exclusive permissions: advancing room stages (`RoomStageService`), deleting room, archiving room, kicking members, finalizing submissions, configuring integrations (GitHub, Canva), locking pitch settings.
3. **Room Member**:
   - `room_members.role = 'MEMBER'`.
   - Enforced by `RoomAccessService.java` (`requireMember()`).
   - Standard permissions: create/edit tasks, add comments, submit ideas, vote, edit documents, record rehearsals, test mock APIs.
4. **Mentor / Public Reviewer**:
   - Read-only access to specific shared room views via unauthenticated or tokenized public endpoints (`PublicMentorController.java`, `PublicPortfolioController.java`, `PublicMockController.java`).

## 1.4 Main Entities
The data domain comprises 113 JPA entities and 3 JDBC-managed tables (116 total tables):
- **Core Collaboration**: `User`, `Room`, `RoomMember`, `Invite`, `RoomInvite`, `Notification`, `ActivityEvent`.
- **Stage 1 (Intake & Ideation)**: `Brief`, `BriefRubricItem`, `UploadedFile`, `Idea`, `IdeaNote`, `IdeaLink`.
- **Stage 2 (Planning & Docs)**: `PlanStep`, `PlanPhase`, `PlanStepPrompt`, `Doc`, `DocVersion`, `DocComment`, `RoomPhaseDoc`.
- **Stage 3 (Build Execution)**: `Task`, `Subtask`, `TaskComment`, `TaskHistory`, `TaskLabel`, `TaskDependency`, `MvpState`, `MvpFlowStep`, `MvpCutItem`, `MvpLedgerRow`, `SpeedModeCapture`.
- **Tech & APIs**: `GithubRepo`, `GithubBranch`, `GithubCommit`, `GithubBranchTask`, `GithubFrozenDemo`, `GithubHealthItem`, `ApiEndpoint`, `ApiExternal`, `ApiMockSettings`, `Diagram`.
- **Stage 4 (Pitch & Demo)**: `Pitch`, `PitchVersion`, `PitchDeck`, `PitchSlide`, `PitchSlideCoverage`, `PitchScript`, `PitchDeckSource`, `PitchRole`, `PitchSettings`, `DemoSection`, `DemoShot`, `DemoMedia`, `DemoAsset`, `DemoLadder`, `DemoPreflight`, `Rehearsal`, `PitchRehearsal`, `QnaItem`, `QnaAnswer`, `QnaSession`, `QnaSessionAnswer`, `QnaPractice`, `QnaProgress`, `CodeDefenseDrill`, `DeckAudit`, `DeckSlide`.
- **Stage 5 (Submission & Review)**: `Submission`, `SubmissionLink`, `SubmissionChecklistItem`, `Retro`, `RetroItem`, `RetroAward`, `ReadinessSnapshot`, `ReadinessSimulation`.
- **Cross-Cutting**: `RoomEvent`, `EmailOutbox`, `UserPreference`, `UserEmailPreference`, `UserAiKey`, `UserOAuthToken`, `McpToken`, `OAuthClient`, `OAuthAuthCode`, `ClientError`, `AppSettings`, `WaitlistSignup`.

## 1.5 Repository Layout and Directory Tree
The repository is structured as a full-stack mono-repository:

```text
brackit/
├── backend/                       # Spring Boot 4.1.1 monolith (Java 25)
│   ├── .mvn/                      # Maven wrapper configuration
│   ├── config/                    # Static seed JSON configurations (hackathons.json, plans.json)
│   ├── src/main/java/             # Backend application source code
│   │   └── com/hackathonos/backend/
│   │       ├── activity/          # Audit logging and room activity feeds
│   │       ├── admin/             # System overview, waitlist, capacity controls
│   │       ├── ai/                # AI gateway, circuit breaker, rate limiters, LLM client
│   │       ├── apihub/            # OpenAPI 3.0 import, mock endpoint responder
│   │       ├── billing/           # User tier management and interest capture
│   │       ├── brief/             # Hackathon brief intake, PDF/URL SSRF-guarded parser
│   │       ├── canva/             # Canva Connect OAuth & design integration
│   │       ├── catalog/           # Public playbooks and curated tool directory
│   │       ├── checkpoints/       # Milestone verification and auto-progression rules
│   │       ├── common/            # Security config, CORS, exception handlers, locks
│   │       ├── crowdcheck/        # Idea cliché detector and crowd analysis
│   │       ├── demo/              # Demo video script and shot list management
│   │       ├── dev/               # Development seeds and simulation controllers
│   │       ├── diagrams/          # Mermaid architecture and entity diagram vault
│   │       ├── docs/              # Markdown document vault with version rollback
│   │       ├── email/             # Outbox pattern worker, Gmail SMTP client, templates
│   │       ├── errors/            # Client-side telemetry and error collection
│   │       ├── events/            # SSE event hub, ring buffers, mutating interceptor
│   │       ├── github/            # GitHub REST API client, branch task tracking, sync
│   │       ├── hackathons/        # Global hackathon directory and suggest system
│   │       ├── home/              # User dashboard passport, recent rooms aggregator
│   │       ├── ideas/             # Idea brainstorming, voting, and scoring
│   │       ├── integrations/      # Integration status and OAuth callback aggregators
│   │       ├── invites/           # Join codes, email invite token validation
│   │       ├── mcp/               # Model Context Protocol backend endpoints & OAuth
│   │       ├── members/           # Team roster, roles, skill matrix, leaves
│   │       ├── mentor/            # Mentor question queue and public room viewer
│   │       ├── meta/              # Constants, track definitions, skills directory
│   │       ├── mvp/               # Flow state ledger, feature cuts, MVP scope lock
│   │       ├── notifications/     # User notification repository, SSE stream
│   │       ├── overview/          # Room metrics, KPI calculators, Attention engine
│   │       ├── phases/            # Sprint phase breakdown (P0-P4) & task generation
│   │       ├── pitch/             # Pitch deck linter, slide coverage analyzer
│   │       ├── pitchkit/          # Demo station, rehearsal audio telemetry, Q&A trainer
│   │       ├── plan/              # 5-step plan prompt assembly and validation
│   │       ├── portfolio/         # Public user profile and room project showcases
│   │       ├── prep/              # Pre-hackathon checklist and equipment verification
│   │       ├── presence/          # Real-time room presence tracking and ping
│   │       ├── readiness/         # Heuristic judge scoring and readiness simulation
│   │       ├── reminders/         # Scheduled deadline notification alerts
│   │       ├── retro/             # Hackathon retrospective, awards, team reflections
│   │       ├── rooms/             # Room CRUD, stage state machine, exports
│   │       ├── schedule/          # Agenda timeline and calendar synchronization
│   │       ├── search/            # Cross-room global search across tasks/docs/ideas
│   │       ├── speedmode/         # Rapid ideation micro-captures
│   │       ├── submission/        # Final submission package assembler & link checker
│   │       ├── tasks/             # Kanban board, task dependencies, swimlanes
│   │       ├── team/              # Team charter, skill gap analyzer, work style poll
│   │       ├── templates/         # Event templates (48h, 24h, 12h, AI sprint)
│   │       └── users/             # User profile, preferences, deletion, data export
│   └── src/main/resources/        # Configuration, Flyway SQL migrations, email templates
│       ├── db/migration/          # 44 Flyway migration scripts (V1 through V43)
│       ├── mail/                  # HTML and text templates for transactional emails
│       └── plan-prompts/          # System prompts for 5-step planning generation
├── frontend/                      # React 19 Single Page Application (Vite + Tailwind v4)
│   ├── public/                    # Static assets, favicon, MSW mock worker
│   └── src/
│       ├── api/                   # Base API hooks, SSE stream consumers
│       ├── app/                   # Root application shell, navigation, providers, router
│       ├── components/            # shadcn/ui shared components (dialog, button, table, etc.)
│       ├── design/                # Theme tokens, typography, live context provider
│       ├── features/              # Modular domain feature components (board, plan, pitch, etc.)
│       ├── lib/                   # Utility helpers, classnames, shared apiClient
│       ├── services/              # Domain-specific typed API call wrappers
│       ├── shared/                # Clock synchronization, motion mode, keyboard shortcuts
│       └── tour/                  # Interactive onboarding walkthrough, spotlight, mock scenes
├── mcp-server/                    # Model Context Protocol standalone server (Node.js 20+)
│   ├── src/                       # MCP server entry, tool definitions, prompts, backend client
│   └── test/                      # Vitest unit & integration test suites for MCP server
├── docs/                          # Architectural documentation, PRDs, runbooks, work logs
├── nginx/                         # Docker reverse proxy configuration
├── deploy/                        # Production deployment verification and health check scripts
├── sql/                           # Local utility and data wipe scripts
└── e2e/                           # Playwright end-to-end browser test suites
```
