# Backend Reconnaissance Report: Adding Model Context Protocol (MCP) Server

**Project:** Brackit Hackathon OS  
**Target:** Spring Boot Backend (`backend/`)  
**Output Document:** `docs/mcp-recon.md`  

---

## 1. Authentication (AUTH)

### How users log in today
- **Mechanism:** OAuth2 login with **GitHub** and **Google** providers via Spring Security OAuth2 Client (`.oauth2Login(...)`).
- **Session management:** Standard stateful HTTP servlet session cookie (`JSESSIONID`).
  - Configured in [`SecurityConfig.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L172-L178) via `ServletContextInitializer sessionCookieInitializer()`:
    - `sessionCookieConfig.setHttpOnly(true)`
    - `sessionCookieConfig.setSecure(appProperties.getCookie().isSecure())`
    - `sameSite` set via `appProperties.getCookie().getSameSite()` (defaults to `Lax`).
- **CSRF Protection:** Double-submit CSRF cookie via `CookieCsrfTokenRepository.withHttpOnlyFalse()` with `X-XSRF-TOKEN` header validation.
- **Bearer Tokens / API Keys for Users:** There are currently **no** user Personal Access Tokens (PATs), bearer tokens, or API keys implemented for user identity. The only tokens stored in the database are:
  - Encrypted GitHub OAuth access tokens in `UserOAuthToken` (for repo creation / sync).
  - Encrypted BYOK AI keys in `UserAiKey` (Groq/OpenAI keys stored by users for AI features).

### Classes that handle authentication
1. [`com.hackathonos.backend.common.config.SecurityConfig`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java)
   - Configures `SecurityFilterChain`, CSRF ignoring rules, public route matchers, session cookie initializer, and authentication entry point returning 401 JSON for `/api/**`.
2. [`com.hackathonos.backend.common.security.OAuth2LoginSuccessHandler`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/security/OAuth2LoginSuccessHandler.java)
   - Extracted principal `OAuth2User`, calls `UserService.findOrCreateFromPrincipal(...)`, stores encrypted GitHub OAuth token in `UserOAuthTokenRepository`, and redirects to `${app.public-url}/app`.
3. [`com.hackathonos.backend.common.security.ExplicitRedirectUriOAuth2AuthorizationRequestResolver`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/security/ExplicitRedirectUriOAuth2AuthorizationRequestResolver.java)
   - Resolves OAuth2 authorization redirect URIs.
4. [`com.hackathonos.backend.users.UserService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/users/UserService.java)
   - Manages user lifecycle (`findOrCreateFromPrincipal`, settings creation, profile updates, account deletion).
5. [`com.hackathonos.backend.common.security.CurrentUser`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/security/CurrentUser.java)
   - Component resolving the current user from the Spring `SecurityContextHolder`.

### How current user is identified inside a controller
Controllers inject `CurrentUser currentUser` (from `com.hackathonos.backend.common.security.CurrentUser`) and call:
```java
User user = currentUser.get();
```
`CurrentUser.get()` inspects `SecurityContextHolder.getContext().getAuthentication()`:
- If null, unauthenticated, or anonymous (`"anonymousUser"`), it throws [`UnauthenticatedException`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/error/UnauthenticatedException.java) (HTTP 401 with code `"UNAUTHENTICATED"`).
- If principal is `OAuth2User`, it delegates to `userService.findOrCreateFromPrincipal(oauth2User, registrationId)`.
- If principal is `User`, it verifies `deletedAt == null` and loads from `userRepository`.
- If principal name is email, it loads via `userRepository.findByEmailIgnoreCase(name)`.

### User entity and plan field
- Entity class: [`com.hackathonos.backend.users.User`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/users/User.java) (table: `users`).
- **Does `User` have a `plan` field?** **NO.** The `User` entity has fields for `provider`, `providerUserId`, `name`, `email`, `roleTags`, `experienceLevel`, `goal`, `techStack`, `tourStatus`, etc., but no plan field.
- **Where the plan lives:** In a dedicated entity [`com.hackathonos.backend.billing.UserPlan`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/billing/UserPlan.java) (table: `user_plan`):
  - `@Id @Column(name = "user_id") private UUID userId;`
  - `@Column(nullable = false, length = 20) private String plan = "FREE";`
  - `@Column(nullable = false) private Instant since = Instant.now();`
  - `@Column(nullable = false, length = 20) private String source = "DEV";`
- Plan lookups are performed by [`com.hackathonos.backend.billing.BillingService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/billing/BillingService.java#L147-L152):
  ```java
  public String getUserPlan(User user) {
      if (user == null) return defaultPlan;
      return userPlanRepository.findById(user.getId())
              .map(UserPlan::getPlan)
              .orElse(defaultPlan != null ? defaultPlan : "FREE");
  }
  ```
  Plans configured in `config/plans.json`: `FREE` (3 rooms/mo), `PRO` (25 rooms/mo), `MAX` (unlimited).

---

## 2. Rooms and Membership (ROOMS)

### Entities and Tables
1. **Room Entity:**
   - Class: [`com.hackathonos.backend.rooms.Room`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/rooms/Room.java)
   - Table: `rooms`
   - Key fields: `id` (UUID), `name`, `description`, `ownerId` (UUID), `stage` (`brief`, `ideate`, `plan`, `build`, `ship`), `startsAt`, `freezeAt`, `endsAt`, `durationHours`, `deletedAt`, `archivedAt`.
2. **Room Member Entity:**
   - Class: [`com.hackathonos.backend.members.RoomMember`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/members/RoomMember.java)
   - Table: `room_members`
   - Unique Constraint: `uq_room_members_room_user` on `(room_id, user_id)`
   - Fields:
     - `id` (UUID, PK)
     - `roomId` (UUID, column `room_id`, non-null)
     - `userId` (UUID, column `user_id`, non-null)
     - `role` (String, column `role`, VARCHAR(30), non-null)
     - `status` (String, column `status`, default `"ACTIVE"`)
     - `joinedAt`, `lastSeenAt`, `lastVisitedAt`
3. **Room Member Skills Entity:**
   - Class: [`com.hackathonos.backend.members.RoomMemberSkill`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/members/RoomMemberSkill.java)
   - Table: `room_member_skills`

### Member Roles
Defined in [`com.hackathonos.backend.members.MemberService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/members/MemberService.java#L25-L27):
```java
public static final Set<String> VALID_ROLES = Set.of(
    "LEADER", "BUILDER", "DESIGNER", "PRESENTER", "DOMAIN_EXPERT", "QA"
);
```
Leadership transfers and leader checks also recognize `"OWNER"` or matching `room.getOwnerId()`.

### How to check "is user X a member of room Y"
1. **Direct boolean check (non-throwing):**
   ```java
   // Via RoomAccessService:
   boolean isMember = roomAccessService.isMember(roomId, userId);
   
   // Or directly via RoomMemberRepository:
   boolean exists = roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
   ```
   Implemented in [`RoomAccessService.isMember(UUID roomId, UUID userId)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/rooms/RoomAccessService.java#L82-L85).

2. **Security gate requiring membership (throws 403 / 404):**
   ```java
   // Via RoomAccessService or RoomAccess:
   RoomMember member = roomAccessService.requireMember(roomId, user);
   // or
   RoomMember member = roomAccess.requireMember(roomId, user.getId());
   ```
   - Checks that the room exists and is not soft-deleted or archived (`getActiveRoomOrThrow(roomId)` -> throws 404 `NotFoundException("ROOM_NOT_FOUND")`).
   - If user is not in `room_members`, throws [`ForbiddenException`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/error/ForbiddenException.java) (HTTP 403 with code `"NOT_A_MEMBER"`).
3. **Leader gate:**
   ```java
   RoomMember leader = roomAccessService.requireLeader(roomId, user);
   ```
   - Throws 403 `ForbiddenException("LEADER_REQUIRED")` if user is neither room owner nor has role `LEADER` / `OWNER`.

---

## 3. Context Export (CONTEXT EXPORT)

### Where the delimited bundle is generated
The bundle with sections delimited by:
```markdown
=====FILE: PRD.md=====
...
=====END FILE=====
```
is **generated by a backend service and exposed via a backend REST endpoint**.

### Generating Service and Method
- **Class:** [`com.hackathonos.backend.phases.PhaseService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/phases/PhaseService.java#L660-L684)
- **Method:** `public byte[] buildProjectContextPack(UUID roomId, User user)`
- **Implementation details:**
  ```java
  @Transactional(readOnly = true)
  public byte[] buildProjectContextPack(UUID roomId, User user) {
      roomAccess.requireMember(roomId, user);
      List<String> order = List.of("PRD.md", "MVP.md", "TECH_STACK.md", "ARCHITECTURE.md", "PHASES.md", "DESIGN.md");
      StringBuilder sb = new StringBuilder();

      for (String file : order) {
          Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, file);
          if (docOpt.isPresent()) {
              List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(docOpt.get().getId());
              if (!vers.isEmpty()) {
                  sb.append("=====FILE: ").append(file).append("=====\n");
                  sb.append(vers.get(0).getContent()).append("\n");
                  sb.append("=====END FILE=====\n\n");
              }
          }
      }

      String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);
      sb.append("=====FILE: IDEAS.md=====\n");
      sb.append(ideasMd).append("\n");
      sb.append("=====END FILE=====\n");

      return sb.toString().getBytes(StandardCharsets.UTF_8);
  }
  ```

### Backend REST Endpoint
- **Controller:** [`com.hackathonos.backend.phases.PhaseController`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/phases/PhaseController.java#L74-L81)
- **Endpoint:** `GET /api/v1/rooms/{roomId}/context-pack.md`
- **Response:** Content-Type `text/markdown; charset=UTF-8`, header `Content-Disposition: attachment; filename="project-context.md"`.

### Additional Related Endpoints
- **Per-step Plan Context:** `GET /api/v1/rooms/{roomId}/plan/context.md?step={stepKey}`
  - Controller: [`com.hackathonos.backend.plan.PlanController.getContextMarkdown(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanController.java#L170-L181)
  - Service: [`com.hackathonos.backend.plan.PlanService.getContextMarkdown(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanService.java#L342)
- **Delimited Output Instruction Generator for Prompts:**
  - Class: [`com.hackathonos.backend.plan.PlanPromptService.buildOutputDeliveryBlock(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanPromptService.java#L273-L291)

---

## 4. Document Import & Parsing (DOCUMENT IMPORT)

### Upload Endpoints
1. **Plan Steps Multi-file / Multipart Upload:**
   - **Endpoint:** `POST /api/v1/rooms/{roomId}/plan/steps/{stepNumber}/validate`
   - **Consumes:** `multipart/form-data` (`files`, `files[]`, or `file`)
   - **Controller:** [`com.hackathonos.backend.plan.PlanController.validateStepMultipart(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanController.java#L104-L119)
2. **Plan Steps Raw Text / JSON Body Upload:**
   - **Endpoint:** `POST /api/v1/rooms/{roomId}/plan/steps/{stepNumber}/validate`
   - **Consumes:** `application/json` (body: `{"text": "...", "confirm": false, "override": false}`)
   - **Controller:** [`com.hackathonos.backend.plan.PlanController.validateStepJson(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanController.java#L121-L130)
3. **Phase Tasks Multipart Upload:**
   - **Endpoint:** `POST /api/v1/rooms/{roomId}/phases/{phaseKey}/tasks/validate`
   - **Consumes:** `multipart/form-data` (`files`, `files[]`, or `file`)
   - **Controller:** [`com.hackathonos.backend.phases.PhaseController.validateAndImportTasks(...)`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/phases/PhaseController.java#L83-L100)

### Parser Classes
1. [`com.hackathonos.backend.plan.PlanDocumentParser`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanDocumentParser.java)
   - Core block extractor and structural Markdown parser.
2. [`com.hackathonos.backend.plan.PlanValidationService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanValidationService.java)
   - Coordinates file ingestion, parser invocation, step state machine, and auto-repair generation.
3. [`com.hackathonos.backend.phases.PhaseService`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/phases/PhaseService.java)
   - Handles `TASKS_{phaseKey}.md` phase task imports and seeds database `tasks`.
4. Specialized step validators in package `com.hackathonos.backend.plan.validators`:
   - `PrdValidator`, `TechValidator`, `PhasesValidator`, `TasksValidator`, `DemoValidator`, `MarkdownSections`.

### What it validates
1. **File Block Syntax:**
   - Regex: `Pattern.compile("=====FILE:\\s*([A-Za-z0-9_.-]+)=====(.*?)(?:=====END FILE=====|$)", Pattern.DOTALL)`.
   - Strips and warns on text found outside of delimiters.
2. **Required Files per Step (from `STEP_EXPECTED_FILES`):**
   - Step 1 (`prd`): expects `PRD.md` and `MVP.md`
   - Step 2 (`tech`): expects `TECH_STACK.md` and `ARCHITECTURE.md`
   - Step 3 (`phases`): expects `PHASES.md` and `DESIGN.md`
   - Step 4 (`tasks`): expects `TASKS.md`
   - Step 5 (`demo`): expects `DEMO_SCRIPT.md` and `QNA.md`
   - Blocks on missing required files or unexpected files.
3. **Size Constraints:**
   - Minimum 50 characters, maximum 200,000 characters per file.
4. **Code Fences and Placeholders:**
   - Unclosed Mermaid blocks: checks odd count of triple-backticks when ```` ```mermaid ```` is present.
   - Unresolved template placeholders: flags `<project name>`, `<project_name>`, `<n>`, `<your project>`.
5. **Heading Structure (`plan-headings.json`):**
   - H1 heading prefix: e.g. `# PRD:`, `# MVP:`, `# TECH_STACK:`.
   - Mandatory ordered H2 headings: e.g. `## Problem Statement`, `## Target Audience`, `## Core Flow`.
   - Conditional check for `## Reality check` (required on PRD/MVP, forbidden on others).
6. **Semantic Content:**
   - Step 1: Minimum 3 cut list items, core flow steps, real vs mock services.
   - Step 2: Tech stack table columns (`Category`, `Technology`, `Status`), status values (`Known` / `New`), Mermaid diagram present.
   - Step 3: Contiguous phase percentage allocations summing to 100%, feature freeze milestone present.
   - Step 4: Valid phase keys referenced, task estimate duration limits, DAG dependency check (no cyclic dependencies).
   - Step 5: Demo timing between 60s and 120s, minimum 18 judge Q&A questions formatted with `#### Q:`.

### What happens on a parse error
- The endpoints **do not throw an unhandled 400/500 HTTP error**.
- They return **HTTP 200 OK** containing a structured response:
  - For plan steps: [`ValidatePlanResponse`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/dto/ValidatePlanResponse.java)
    - `ok = false`, `valid = false`
    - `issues`: List of `ValidationIssueDto` with severity `BLOCK` or `WARN`
    - `errors`: List of blocking error strings
    - `warnings`: List of non-blocking warning strings
    - `repairPrompt`: Concise instructions constructed for the LLM detailing what structural elements failed and how to reply with only the corrected blocks.
- If only non-blocking warnings occur, `ok = true` and `needsConfirmation = true` (proceeds once `confirm = true` is passed).
- For phase tasks: [`PhaseTaskImportSummaryDto`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/phases/dto/PhaseTaskImportSummaryDto.java) returns `success = false`, `issues = [...]`, and diagnostic information.

### Is there a document-type enum?
**NO.** There is no Java `enum` for document types.
Document types are represented throughout the backend as **plain strings** matching file names (`"PRD.md"`, `"MVP.md"`, `"TECH_STACK.md"`, `"ARCHITECTURE.md"`, `"PHASES.md"`, `"DESIGN.md"`, `"TASKS.md"`, `"DEMO_SCRIPT.md"`, `"QNA.md"`, `"IDEAS.md"`). In the `Doc` entity, the column is `@Column(name = "file_name", length = 100) private String fileName;`.

---

## 5. Prompts Storage (PROMPTS)

### Where prompts are stored
Prompts originate from **backend classpath resource templates**, are dynamically hydrated by **service builders**, and are cached in the **database**.

### Prompt Locations by Document Type

| Document Type | Step Key | Static Template File (Classpath) | Dynamic Builder Service | Database Cache Table / Entity |
| :--- | :--- | :--- | :--- | :--- |
| **PRD.md**, **MVP.md** | `prd` (Step 1) | `backend/src/main/resources/plan-prompts/step1-prd-mvp.template.md` (groq fallback: `step1-prd-mvp.groq.md`) | `PlanPromptService.buildStep1Prompt(...)` & `PromptBuilder.buildStep1Prompt(...)` | `plan_step_prompts` (`PlanStepPrompt`) |
| **TECH_STACK.md**, **ARCHITECTURE.md** | `tech` (Step 2) | `backend/src/main/resources/plan-prompts/step2-stack-arch.template.md` (groq fallback: `step2-stack-arch.groq.md`) | `PlanPromptService.buildStep2Prompt(...)` & `PromptBuilder.buildStep2Prompt(...)` | `plan_step_prompts` (`PlanStepPrompt`) |
| **PHASES.md**, **DESIGN.md** | `phases` (Step 3) | `backend/src/main/resources/plan-prompts/step3-phases-design.template.md` (groq fallback: `step3-phases-design.groq.md`) | `PlanPromptService.buildStep3Prompt(...)` & `PromptBuilder.buildStep3Prompt(...)` | `plan_step_prompts` (`PlanStepPrompt`) |
| **TASKS.md** | `tasks` (Step 4) | `backend/src/main/resources/plan-prompts/step4-tasks.template.md` (groq fallback: `step4-tasks.groq.md`) | `PlanPromptService.buildStep4Prompt(...)` & `PromptBuilder.buildStep4Prompt(...)` | `plan_step_prompts` (`PlanStepPrompt`) |
| **DEMO_SCRIPT.md**, **QNA.md** | `demo` (Step 5) | `backend/src/main/resources/plan-prompts/step5-demo-qna.template.md` (groq fallback: `step5-demo-qna.groq.md`) | `PlanPromptService.buildStep5Prompt(...)` & `PromptBuilder.buildStep5Prompt(...)` | `plan_step_prompts` (`PlanStepPrompt`) |
| **TASKS_{phaseKey}.md** | Phase tasks | `backend/src/main/resources/plan-prompts/phase-tasks.template.md` | `PhaseService.buildPhaseTaskPrompt(...)` | N/A (built on demand) |
| **Heading & Structural Rules** | All docs | `backend/src/main/resources/plan-prompts/plan-headings.json` | Loaded by `PlanDocumentParser.init()` | N/A |

---

## 6. API Style & Controllers (API STYLE)

### Context Path
- `server.servlet.context-path`: **Root (`/`)** (not configured in `application.yml`, defaults to `/`).
- **All application APIs** are prefixed with `/api/v1/`.

### Complete List of REST Controllers and Base Paths

| Controller Class | Full Class Path | Base Path(s) |
| :--- | :--- | :--- |
| `UserController` | `com.hackathonos.backend.users.UserController` | Method-level: `/api/v1/me`, `/api/v1/users/me/**` |
| `RoomController` | `com.hackathonos.backend.rooms.RoomController` | `/api/v1/rooms` |
| `MemberController` | `com.hackathonos.backend.members.MemberController` | `/api/v1/rooms/{roomId}` (methods: `/members/**`) |
| `InviteController` | `com.hackathonos.backend.invites.InviteController` | `/api/v1/invites` |
| `BriefController` | `com.hackathonos.backend.brief.BriefController` | `/api/v1/rooms/{roomId}/brief` |
| `IdeasController` | `com.hackathonos.backend.ideas.IdeasController` | `/api/v1/rooms/{roomId}` (methods: `/ideas/**`, `/ideate`) |
| `PlanController` | `com.hackathonos.backend.plan.PlanController` | `/api/v1/rooms/{roomId}` (methods: `/plan/**`, `/stage/**`) |
| `PhaseController` | `com.hackathonos.backend.phases.PhaseController` | `/api/v1/rooms/{roomId}` (methods: `/phases/**`, `/context-pack.md`) |
| `DocController` | `com.hackathonos.backend.docs.DocController` | `/api/v1/rooms/{roomId}/docs` |
| `BoardController` | `com.hackathonos.backend.tasks.BoardController` | `/api/v1/rooms/{roomId}/board` |
| `TaskController` | `com.hackathonos.backend.tasks.TaskController` | `/api/v1/rooms/{roomId}` (methods: `/tasks/**`) |
| `OverviewController` | `com.hackathonos.backend.overview.OverviewController` | `/api/v1/rooms/{roomId}` (methods: `/overview`, `/progress`, `/workload`, `/nav-badges`) |
| `CheckpointController`| `com.hackathonos.backend.checkpoints.CheckpointController` | `/api/v1/rooms/{roomId}/checkpoints` |
| `MvpController` | `com.hackathonos.backend.mvp.MvpController` | `/api/v1/rooms/{roomId}/mvp` |
| `PitchKitController` | `com.hackathonos.backend.pitchkit.PitchKitController` | `/api/v1/rooms/{roomId}/pitchkit` |
| `PitchController` (kit)| `com.hackathonos.backend.pitchkit.PitchController` | `/api/v1/rooms/{roomId}/pitch` |
| `RehearsalController` | `com.hackathonos.backend.pitchkit.RehearsalController` | `/api/v1/rooms/{roomId}/rehearsals` |
| `QnaController` | `com.hackathonos.backend.pitchkit.QnaController` | `/api/v1/rooms/{roomId}/qna` |
| `DeckAuditController` | `com.hackathonos.backend.pitch.DeckAuditController` | `/api/v1/rooms/{roomId}/deck-audit` |
| `DemoController` | `com.hackathonos.backend.demo.DemoController` | `/api/v1/rooms/{roomId}/demo` |
| `DemoStationController`| `com.hackathonos.backend.demo.DemoStationController` | `/api/v1/rooms/{roomId}/demo` (station endpoints) |
| `SubmissionController`| `com.hackathonos.backend.submission.SubmissionController` | `/api/v1/rooms/{roomId}/submission` and `/api/v1/rooms/{roomId}` |
| `RetroController` | `com.hackathonos.backend.retro.RetroController` | `/api/v1/rooms/{roomId}/retro` |
| `ApiHubController` | `com.hackathonos.backend.apihub.ApiHubController` | `/api/v1/rooms/{roomId}/api-hub`, `/api/v1/rooms/{roomId}/apis` |
| `PublicMockController`| `com.hackathonos.backend.apihub.PublicMockController` | `/mock/{token}/**` |
| `CrowdCheckController`| `com.hackathonos.backend.crowdcheck.CrowdCheckController` | `/api/v1/rooms/{roomId}/crowd-check` |
| `DiagramController` | `com.hackathonos.backend.diagrams.DiagramController` | `/api/v1/rooms/{roomId}/diagrams` |
| `GitHubController` | `com.hackathonos.backend.github.GitHubController` | `/api/v1/github` |
| `CanvaController` | `com.hackathonos.backend.canva.CanvaController` | `/api/v1/canva` |
| `IntegrationsController`| `com.hackathonos.backend.integrations.IntegrationsController` | `/api/v1/integrations` |
| `BillingController` | `com.hackathonos.backend.billing.BillingController` | Method-level: `/api/v1/billing`, `/api/v1/billing/interest` |
| `NotificationController`| `com.hackathonos.backend.notifications.NotificationController`| `/api/v1/notifications` |
| `PresenceController` | `com.hackathonos.backend.presence.PresenceController` | `/api/v1/rooms/{roomId}/presence` |
| `RoomEventController`| `com.hackathonos.backend.events.RoomEventController` | `/api/v1/rooms/{roomId}` (methods: `/events`) |
| `EventStreamController`| `com.hackathonos.backend.events.EventStreamController` | `/api/v1` (methods: `/events/stream`) |
| `ActivityController` | `com.hackathonos.backend.activity.ActivityController` | `/api/v1/rooms/{roomId}/activity` |
| `ReadinessController`| `com.hackathonos.backend.readiness.ReadinessController` | `/api/v1/rooms/{roomId}/readiness` |
| `SpeedModeController`| `com.hackathonos.backend.speedmode.SpeedModeController` | `/api/v1/rooms/{roomId}/speed-mode` |
| `ScheduleController` | `com.hackathonos.backend.schedule.ScheduleController` | `/api/v1/rooms/{roomId}/schedule` |
| `SearchController` | `com.hackathonos.backend.search.SearchController` | `/api/v1/search` |
| `PrepController` | `com.hackathonos.backend.prep.PrepController` | `/api/v1/rooms/{roomId}/prep` |
| `PortfolioController`| `com.hackathonos.backend.portfolio.PortfolioController` | `/api/v1/portfolio` |
| `PublicPortfolioController`| `com.hackathonos.backend.portfolio.PublicPortfolioController` | `/api/v1/public/portfolio` |
| `PublicMentorController`| `com.hackathonos.backend.mentor.PublicMentorController` | `/api/v1/mentor` |
| `MentorController` | `com.hackathonos.backend.mentor.MentorController` | `/api/v1/rooms/{roomId}` (methods: `/mentor/**`) |
| `HomeController` | `com.hackathonos.backend.home.HomeController` | `/api/v1/home` |
| `MetaController` | `com.hackathonos.backend.meta.MetaController` | `/api/v1/meta` |
| `PublicHealthController`| `com.hackathonos.backend.common.PublicHealthController` | `/api/v1/health` |
| `PublicPlaybookController`| `com.hackathonos.backend.catalog.PublicPlaybookController` | `/api/v1/playbooks` |
| `PublicToolController`| `com.hackathonos.backend.catalog.PublicToolController` | `/api/v1/tools` |
| `EventTemplateController`| `com.hackathonos.backend.templates.EventTemplateController`| `/api/v1/event-templates` |
| `HackathonController`| `com.hackathonos.backend.hackathons.HackathonController` | `/api/v1/hackathons` |
| `ClientErrorController`| `com.hackathonos.backend.errors.ClientErrorController` | `/api/v1/client-errors` |
| `AdminController` | `com.hackathonos.backend.admin.AdminController` | `/api/v1/admin` |
| `RoomExportController`| `com.hackathonos.backend.rooms.export.RoomExportController`| `/api/v1/rooms/{roomId}` (methods: `/export/zip`, `/export/json`) |
| `DevController` (`@Profile("dev")`)| `com.hackathonos.backend.dev.DevController` | `/api/v1/dev` |
| `DevSeedController` (`@Profile("dev")`)| `com.hackathonos.backend.dev.DevSeedController` | `/api/v1/dev/seed` |
| `DevMailController` (`@Profile("dev")`)| `com.hackathonos.backend.email.DevMailController` | `/api/v1/dev/mail` |

### CORS Configuration
- Handled in [`com.hackathonos.backend.common.config.CorsConfig`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/config/CorsConfig.java)
- **Allowed Origins:**
  - `appProperties.getPublicUrl()` (`APP_PUBLIC_URL`, e.g. `https://brackit.vercel.app` or `http://localhost:5173`).
  - In non-prod profiles: includes `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://127.0.0.1:3000`.
- **Allowed Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- **Allowed Headers:** `Authorization`, `Content-Type`, `Accept`, `X-Requested-With`, `X-XSRF-TOKEN`, `X-Request-Id`, `Idempotency-Key`, `If-None-Match`, `Last-Event-ID`, `Cache-Control`, `*`.
- **Exposed Headers:** `X-Request-Id`, `Retry-After`, `Idempotency-Key`, `ETag`.
- **Credentials:** `allowCredentials: true`.
- **Max Age:** `3600L` seconds.

### Error Handling & Error JSON Shape
- Handled globally by [`com.hackathonos.backend.common.error.ApiExceptionHandler`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/error/ApiExceptionHandler.java) (`@RestControllerAdvice`).
- Representation record: [`com.hackathonos.backend.common.error.ErrorResponse`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/error/ErrorResponse.java).
- **JSON Shape:**
  ```json
  {
    "code": "ROOM_NOT_FOUND",
    "message": "Room not found",
    "details": null,
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-10-21T17:15:30.123Z",
    "status": 404
  }
  ```
- **Validation / Field Errors Shape:**
  When a `@Valid` DTO or `BadRequestException` fails with field errors, `details` is a key-value object:
  ```json
  {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed for request",
    "details": {
      "name": "Room name is required",
      "durationHours": "Duration must be between 1 and 168"
    },
    "requestId": "f8a1...-...",
    "timestamp": "2026-10-21T17:15:30.123Z",
    "status": 400
  }
  ```
- Unauthenticated requests intercepted by Spring Security return:
  ```json
  {
    "timestamp": "2026-10-21T17:15:30.123Z",
    "status": 401,
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
  ```

---

## 7. Deployment Configuration (DEPLOYMENT)

### Server Port and Profile
- **Development Port:** `8080` (`server.port: 8080` in `application.yml`).
- **Production Port:** Render dynamically sets `PORT` (defaults to `10000` via Dockerfile `ENV PORT=10000`, read via `server.port: ${PORT:8080}` in `application-prod.yml`).
- **Active Profile:** Set via `SPRING_PROFILES_ACTIVE` (`dev` locally, `prod` on Render).

### Base URLs & Environment Variables
- `APP_PUBLIC_URL` / `APP_FRONTEND_URL`: URL of the frontend web application (e.g., `https://brackit.vercel.app` or `http://localhost:5173`).
- `API_PUBLIC_URL` / `APP_BASE_URL`: Public base URL of the Spring Boot backend API (e.g., `https://brackit-backend.onrender.com` or `http://localhost:8080`).
- `AI_BASE_URL`: Gateway URL for LLM provider (defaults to `https://api.groq.com/openai/v1`).
- `STT_BASE_URL`: Speech-to-text gateway for Whisper (defaults to `https://api.groq.com/openai/v1`).
- `CORS_ALLOWED_ORIGINS`: Overrides default origins if specified.

### Dockerfile & Runtime Specifications
- **Build Stage:** `eclipse-temurin:25-jdk-alpine AS builder` (uses Maven Wrapper `./mvnw package -DskipTests`).
- **Runtime Stage:** `eclipse-temurin:25-jre-alpine` running as non-root user `appuser:appgroup`.
- **Upload Directory:** Creates `/app/uploads` owned by `appuser`.
- **JVM Options in Dockerfile:**
  ```dockerfile
  ENV JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
  ```
- **Entrypoint:** `sh -c "exec java $JAVA_OPTS -jar /app/app.jar"`.

### Database Configuration
- PostgreSQL connection via environment variables:
  - `DB_HOST`, `DB_PORT:5432`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_POOL_SIZE:5`.
- Flyway executes automatic database schema migrations on startup (`flyway.enabled: true`, `ddl-auto: validate`).

---

## 8. Gaps and Risks for Adding Two New Endpoints

When adding two new endpoints for an MCP server (such as an endpoint to export context and an endpoint to import/sync generated documents), the following factual gaps and architectural risks exist in the current codebase:

### 1. Authentication Gap for Headless / External MCP Clients
- **The Issue:** All non-public endpoints in [`SecurityConfig.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L131) enforce `.anyRequest().authenticated()`, which requires an authenticated session cookie (`JSESSIONID`) created through the browser OAuth2 flow.
- **The Gap:** There is **no API token, Bearer token, or API key authentication filter** for programmatic machine-to-machine clients (e.g., Claude Desktop, Claude Code CLI, Cursor, or local MCP server processes).
- **The Risk:** An external MCP client making an HTTP request will fail immediately with HTTP 401:
  `{"status":401,"code":"UNAUTHORIZED","message":"Authentication required"}`.
- **Remediation needed:** Either a dedicated Bearer token / API key authentication mechanism (e.g., a room-scoped token or user personal access token filter), or the MCP server must run within an authenticated user session.

### 2. CSRF Interception on State-Modifying (POST/PUT) Endpoints
- **The Issue:** [`SecurityConfig.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/common/config/SecurityConfig.java#L69-L78) enforces cookie-based CSRF protection with `CookieCsrfTokenRepository` on all requests except an explicit whitelist (`/mock/**`, `/api/v1/mentor/**`, `/api/v1/public/**`, `/api/v1/client-errors`).
- **The Risk:** Any new document import endpoint using `POST` or `PUT` called by an MCP client without an `X-XSRF-TOKEN` header will be blocked by Spring Security with HTTP 403 Forbidden.
- **Remediation needed:** Any new endpoint intended for MCP communication must be explicitly registered in `SecurityConfig.java` under `.csrf(csrf -> csrf.ignoringRequestMatchers(...))`.

### 3. Room Access Authorization Checks
- **The Issue:** Existing services (e.g. [`RoomAccessService.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/rooms/RoomAccessService.java#L50-L75)) strictly call `requireMember(roomId, user)` or `requireLeader(roomId, user)`, where `user` is obtained via `currentUser.get()`.
- **The Risk:** If an MCP endpoint does not establish an authenticated `User` in `SecurityContextHolder`, `CurrentUser.get()` will throw `UnauthenticatedException` (401), preventing access to room documents and phase context.

### 4. Document Concurrency & Versioning in Docs Vault
- **The Issue:** [`DocService.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/docs/DocService.java) and [`DocVersionRepository.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/docs/DocVersionRepository.java) maintain an immutable history of document versions (`current_version` on `docs`, and version records in `doc_versions`).
- **The Risk:** If an MCP endpoint writes directly to documents without creating a new `DocVersion` or updating `Doc.currentVersion`, it could bypass the version history, break optimistic locking (`baseVersion` checks used by the frontend markdown editor), and overwrite changes made concurrently by teammates in the web UI.

### 5. Strict Structural Parsing and Validation Constraints
- **The Issue:** The platform’s parsers ([`PlanDocumentParser.java`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/java/com/hackathonos/backend/plan/PlanDocumentParser.java) and [`plan-headings.json`](file:///c:/Users/Admin/.antigravity/hackathon-os/backend/src/main/resources/plan-prompts/plan-headings.json)) enforce strict heading prefixes, exact ordered H2 titles, character minimums (50 chars), and delimiter blocks (`=====FILE: ...=====\n...=====END FILE=====`).
- **The Risk:** If an MCP endpoint receives documents that deviate even slightly from `plan-headings.json` (such as missing an H1 prefix or altering an H2 title), `PlanDocumentParser` will mark `valid = false` and produce blocking validation issues. Any MCP integration must ensure prompts and import handlers use identical delimiter conventions and heading schemas.
