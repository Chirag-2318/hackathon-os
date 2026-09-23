# tech_stack.md: How the Platform Gets Built

**Status:** Step 3 of the project (technology decisions). Follows `problem.md` and `ideation.md`.
**Written:** 19 Sep 2026
**Feature IDs (F1-F22)** refer to `ideation.md`. **Problem IDs (P-, L-, W-, D-)** refer to `problem.md`.

**Evidence note:** Version facts about Spring Boot, Java, springdoc and Antigravity were checked in research for this document (sources in Section 19). Library choices beyond those are engineering judgment, not researched this session. Before you start, confirm exact versions (Section 18). Free-tier hosting terms and AI-tool rate limits change often, so I name categories, not prices.

---

## 1. The stack on one page

| Layer | Choice | Why (short) | Main alternative |
|---|---|---|---|
| **Frontend framework** | **React + TypeScript + Vite** (single-page app, installable as a PWA) | Behind-login app; needs offline support; simplest deploy; TypeScript gives the AI agent machine-checked guard rails | Next.js (only worth it for a public SEO site) |
| **Frontend UI** | Tailwind CSS + shadcn/ui components | Fixed design vocabulary stops the agent inventing inconsistent UI | Mantine, MUI |
| **Frontend data** | TanStack Query + a **generated typed API client** | The client is generated from the backend's OpenAPI spec, so front and back can't silently drift | Hand-written fetch calls |
| **Backend language/runtime** | **Java 25 (LTS)** | Current LTS; Spring Boot 4 supports it | Java 21 (fallback) |
| **Backend framework** | **Spring Boot 4.x** (Spring MVC, virtual threads on) | Your learning goal; huge ecosystem | Node/NestJS, Kotlin |
| **Build tool** | **Maven** | Predictable, best learning material | Gradle |
| **Database** | **PostgreSQL** (+ Flyway migrations) | Relational data (rooms, tasks, votes) plus JSONB for AI outputs | MySQL |
| **Data access** | Spring Data JPA (Hibernate) + `JdbcClient` for hard queries | Standard path; teaches you the classic pitfalls | jOOQ |
| **Auth** | Spring Security + OAuth2 login (GitHub, Google), **server-side session in an HttpOnly cookie** | Safer than tokens in browser storage; the agent can't "choose" an insecure pattern | JWT |
| **API contract** | REST + **OpenAPI** (springdoc-openapi 3.x for Boot 4) | Feeds the typed client and your own API Hub (F10) | GraphQL |
| **Live updates** | **SSE** first, WebSocket/STOMP later | Simple one-way updates cover most needs | WebSocket from day one |
| **Offline** | PWA service worker: cached app shell + read-only room cache + export | Wifi failure is a known problem (P5.1) | Full offline sync (too costly early) |
| **Prompt Bridge (free AI tier)** | Deterministic **template engine + JSON Schema validation + Markdown parsing**. **No LLM call at all.** | The free tier costs almost nothing to run | n/a |
| **LLM layer (BYOK/Pro)** | Provider-agnostic `LlmProvider` interface; Spring AI or LangChain4j **evaluated later** | Avoid lock-in; defer until the free tier is proven | Direct SDK |
| **GitHub integration** | Phase 1: OAuth login. Phase 2: **GitHub App** (read-only permissions) + Java GitHub client | Least privilege; see F9 | OAuth App with broad scopes |
| **Files/exports** | Java `zip`, Markdown export, **Apache POI** for `.pptx` later | Stays in your learning language | Client-side PptxGenJS |
| **Diagrams** | **Mermaid** rendered in the browser | Nothing to host | Server-side render |
| **Testing** | JUnit 5 + Mockito + Testcontainers (backend); Vitest + Playwright (frontend) | Real DB in tests; browser tests as the agent's acceptance gate | H2 in-memory DB |
| **Local dev** | Docker Compose (Postgres) | One command to start | Manual installs |
| **CI/CD** | GitHub Actions | You already use GitHub | n/a |
| **Hosting (categories)** | Static host for the SPA; container host for the API; managed Postgres | Cheap, familiar | One VPS with Docker |
| **Agent tooling** | Google Antigravity with Claude Opus 4.6 for the frontend | Your choice; see Section 3 for the safety net | Claude Code, Cursor |

---

## 2. Principles that decide the stack

These come straight from the design rules in `ideation.md` and the findings in `problem.md`.

1. **Faster than a chat group (design rule 1).** Small, fast pages. No heavy server-side rendering framework. Speed Mode must load quickly on a bad network.
2. **Works on bad venue wifi (design rule 6).** PWA and export-everything are architecture-level requirements, not polish.
3. **Contract first.** One machine-readable API description is the single source of truth. This is the biggest safeguard for AI-written frontend code.
4. **The free tier is nearly free to run.** The Prompt Bridge deliberately does no LLM calls, so server cost does not grow with free users.
5. **One deployable backend.** A modular monolith, not microservices. It is easier to learn, debug, deploy, and afford.
6. **Human understanding where you chose it.** Backend and AI logic: you understand every line. Frontend: automated verification instead of reading.

---

## 3. Who writes what: the working model

Your plan, made explicit, with the safety net each part needs.

| Area | Who writes it | Your involvement | Safety net |
|---|---|---|---|
| **Frontend (React)** | Antigravity agent, prompted per screen | You give specs and review **behavior** (does it work?), not code | Generated typed API client, TypeScript strict mode, lint, Playwright tests, CI (Section 4.3) |
| **Backend (Spring Boot)** | **You**, file by file, with AI as tutor and code drafter | You decide what goes in each file, read every line, paste it yourself | Tests, code review by AI as a second pass, the concept ledger (Section 16) |
| **Prompt Bridge logic** | You + AI, same as backend | Full understanding | Schema tests with real pasted outputs |
| **AI/LLM integration (BYOK/Pro)** | You + AI, prompt-assisted with understanding | You understand data flow, prompts, and failure modes | Provider interface, mock provider in tests |
| **DevOps/CI** | You + AI | You understand what each pipeline step does | Start simple |
| **Docs/specs** | You (with AI help) | These `.md` files are the agent's input | Keep them in the repo |

**On "blind prompting" the frontend:** it is a legitimate way to move fast, and the backend is where you want to learn. But *blind* should not mean *unverified*. Sections 4.3-4.5 show how to keep the frontend agent honest without reading its code. Also be aware of what this trades away: when the agent produces a bug it cannot fix, you will have nobody who understands that code. Plan a later "learn the frontend" pass on the parts that keep breaking.

---

## 4. Frontend

### 4.1 Choices

| Concern | Choice | Notes |
|---|---|---|
| Language | **TypeScript** (strict) | *I read your "visible language" as TypeScript. If you meant plain JavaScript, tell me, but I strongly recommend TypeScript: type errors are how you catch an agent's mistakes automatically.* |
| Framework | **React** | Your choice; the ecosystem is best supported by AI agents |
| Build tool | **Vite** | Fast dev loop, simple static output |
| Why not Next.js | An auth-gated dashboard gains little from server rendering, and Next adds a second server runtime to run and secure. Use it only if you later want a public, SEO-heavy site. The marketing landing page can be a static page. | |
| Routing | React Router (or TanStack Router) | Pick one and pin it in `AGENTS.md` |
| Server state | **TanStack Query** | Caching, retries, background refetch, offline-friendly |
| Client state | Zustand (only for UI state) | Keep it small |
| Forms/validation | React Hook Form + Zod | |
| Styling/UI | **Tailwind CSS + shadcn/ui** (Radix underneath) | Accessible components with a fixed look |
| Drag and drop | dnd-kit | Task board (F6), idea cards (F3) |
| Markdown | `react-markdown` + **sanitizer** (e.g., `rehype-sanitize`) | Pasted AI output is untrusted (Section 7) |
| Markdown editing | TipTap or CodeMirror | Docs Vault (F5) |
| Diagrams | `mermaid` (client-side) | F11 |
| API docs view | Swagger UI or Redoc component (verify license) | F10 |
| Typed API client | Generated from OpenAPI (e.g., `orval` or `openapi-typescript`) | The key safety net |
| PWA/offline | `vite-plugin-pwa` (Workbox) | App shell + read-only cache + queued export |
| Testing | Vitest + Testing Library; **Playwright** for end-to-end | |
| Lint/format | ESLint + Prettier (or Biome) | Enforced in CI |
| API mocking | MSW (Mock Service Worker) | Lets the agent build screens before the backend exists |

### 4.2 Structure the agent should follow

```
frontend/
  src/
    app/            # routing, providers, layout
    features/       # one folder per product feature (brief, ideation, plan, tasks, ...)
      ideation/
        components/
        hooks/
        api/        # thin wrappers over the generated client
    shared/         # ui primitives, utils
    api/generated/  # GENERATED from OpenAPI: never edit by hand
  e2e/              # Playwright tests
  AGENTS.md         # rules for the agent (see 4.4)
```

### 4.3 The safety net for hands-off frontend work

Because you will not read this code, make correctness *automatic*:

1. **Generated, typed API client.** The agent calls functions that exist because the backend declares them. If the backend changes, the frontend build fails at compile time instead of breaking at runtime.
2. **Strict TypeScript + lint in CI.** A red build means "not done", regardless of what the agent says.
3. **Playwright tests as acceptance criteria.** For every screen you ask for, ask for an end-to-end test of its main flow. **You review the test's *description* (does it test what I care about?), not the code.**
4. **Vertical slices.** Prompt one small, complete flow at a time (e.g., "create room → invite link → join"), not "build the whole app".
5. **Antigravity's built-in browser check** can run a flow and show screenshots or recordings as evidence. Use it as a first check, not the only one.
6. **MSW mocks first, real API second.** The agent builds a screen against mocks; you then switch it to the real backend and re-run the tests.

### 4.4 `AGENTS.md`: the rules file for the frontend agent

Antigravity supports an `AGENTS.md` rules file. Suggested starting rules (tighten as you learn what goes wrong):

- Use only the libraries listed in this file. Do not add a dependency without asking.
- Use the generated API client. Never hand-write `fetch` calls to our backend.
- **Never store auth tokens or user data in `localStorage`/`sessionStorage`.** Auth is a server-side cookie session.
- **Never put secrets in `VITE_*` environment variables** (everything with that prefix is shipped to the browser).
- **Never render pasted or AI-generated Markdown/HTML without the sanitizer.**
- Every new screen needs: loading state, empty state, error state, and a Playwright test.
- Use shadcn/ui components and the Tailwind theme tokens. No custom colors or spacing outside the tokens.
- Read `docs/problem.md`, `docs/ideation.md`, and the OpenAPI spec before building a feature.
- Keep components small; no file over ~300 lines.

### 4.5 Human checkpoints that are worth your time even for a "blind" frontend

Small, high-value, one-time reviews (you can do these by asking an AI to walk you through them):

1. The **API client wrapper** (how requests, errors, and cookies are handled).
2. The **auth flow** (login redirect, logout, what happens on 401).
3. **Any place that renders Markdown/HTML.**
4. The **service worker configuration** (a bad one can serve stale data or cache private data).
5. The **environment/config files.**

### 4.6 Tool risk

Antigravity model availability and rate limits have changed repeatedly in 2026. Reports describe weekly limits and heavy throttling on top-tier models, and different sources list different Claude versions (Opus 4.6 in some, 4.7 in others). **Do not let the project depend on one model.** Keep `AGENTS.md`, the specs, and the tests model-agnostic so you can switch models or tools without redoing work.

---

## 5. Backend

### 5.1 Core choices

| Concern | Choice | Notes |
|---|---|---|
| Java | **25 (LTS)**, fallback 21 | Spring Boot 4 supports Java 17 minimum and Java 25 officially |
| Spring Boot | **4.x** (Spring Framework 7, Jakarta EE 11, Security 7, Hibernate 7 line) | Boot 3.5's open-source support ended on 30 Jun 2026, so start on 4.x |
| Build | Maven | Use **start.spring.io** to generate the project (starter names changed in Boot 4, so don't copy old snippets) |
| Web | Spring MVC + **virtual threads** enabled | Simple blocking code that scales well; avoids WebFlux complexity |
| Validation | Bean Validation (`@Valid`) | On every request DTO |
| DTOs | Java **records** | Avoid Lombok while learning; understand the boilerplate first |
| Mapping | Manual mappers at first; MapStruct later | |
| Persistence | Spring Data JPA + Hibernate; `JdbcClient` for reports | |
| Migrations | **Flyway** | Every schema change is a versioned SQL file |
| API docs | **springdoc-openapi 3.x** (the line built for Boot 4; 2.x is for Boot 3) | Generates the OpenAPI spec that feeds the frontend |
| Errors | `ProblemDetail` (RFC 9457 style) | One consistent error shape |
| Scheduling | Spring `@Scheduled` first (deadline reminders, checkpoint nudges) | Quartz only if you need persistence/clustering |
| Rate limiting | Bucket4j (or a proxy-level limit) | Protects the public paste-back endpoints |
| Config | `application.yml` + profiles (`local`, `test`, `prod`) + env vars for secrets | |
| Observability | Spring Actuator, structured logs | Sentry optional |

**A Boot 4 warning for your learning workflow:** most AI models learned Spring mostly from Boot 2/3-era code. Boot 4 changed a lot (Jackson 3 default, modularized jars, new starter names, Security 7). Expect AI-written snippets that use old imports, deprecated APIs, or wrong starter names. When something doesn't compile, check the official Boot 4 reference and migration notes before assuming *you* did it wrong. This is a good thing for your revision goal, because it forces you to read the docs, not just the AI's answer.

### 5.2 Architecture: modular monolith, package by feature

One Spring Boot application, split into modules that mirror the features in `ideation.md`:

```
backend/src/main/java/.../hackos/
  auth/          # login, sessions, current user
  room/          # rooms, members, roles, invites          (F2)
  brief/         # event rules, rubric, deadlines          (F1)
  ideation/      # idea cards, critique, votes             (F3)
  promptbridge/  # prompt templates, chain, validator      (F4)
  plan/          # PRD, stack, phases, docs vault          (F4, F5)
  tasks/         # phases, tasks, checkpoints, clock       (F6)
  mvp/           # MVP studio, reality ledger              (F8)
  github/        # branch map, repo health                 (F9)
  apihub/        # API registry, OpenAPI import            (F10)
  pitch/         # deck guides, coverage matrix            (F12)
  submission/    # checklists, countdown                   (F14)
  common/        # errors, security config, utilities
```

- **Rules:** modules talk through their public service classes, never by reaching into each other's repositories. Use **ArchUnit** (or **Spring Modulith**) tests to enforce this. That teaches you layering and keeps the monolith clean.
- **Layers inside a module:** controller → service → repository. Controllers stay thin.
- Build **modules in the order of the P0 spine** from `ideation.md`: `auth` → `room` → `brief` → `ideation` → `promptbridge`/`plan` → `tasks` → `submission`. Leave the others until the spine works end to end.

### 5.3 API design rules

- REST, JSON, versioned under `/api/v1` (Spring Framework 7 also has built-in API versioning support; decide early and stay consistent).
- **Every endpoint appears in the OpenAPI spec**, with request/response examples.
- One error shape (`ProblemDetail`) with stable error codes the frontend can switch on.
- Pagination on every list endpoint.
- **Idempotent paste-back:** the Prompt Bridge "import" endpoint must be safe to call twice with the same content (users will double-click).
- Never return entities directly; return response DTOs.

---

## 6. Data layer

- **PostgreSQL** as the only database at first. No Redis, no message broker, no search engine until a measured need appears.
- **Flyway** migrations in `src/main/resources/db/migration`, named `V1__init.sql`, `V2__...`.
- **JSONB columns** for things that are structured but changing: raw AI paste-backs, parsed plan output, rules extraction results. Keep relational tables for things you query and join (rooms, members, tasks, votes).
- **Keep raw and parsed forms.** Store the pasted text *and* the parsed result, plus the prompt-template version. This makes bugs reproducible and lets you re-parse later.
- **Version plan documents** (F5): a `plan_document_version` table rather than overwriting.
- **Audit basics:** `created_at`, `updated_at`, `created_by` on major tables; a `decision_log` table for F6/F3 decisions.
- Learn on the way: N+1 queries, lazy loading, transactions, optimistic locking (`@Version`). Concurrent edits of one plan or task board are the natural place to meet them.

Suggested first tables (sketch, not final): `users`, `rooms`, `room_members`, `invites`, `briefs`, `rubric_criteria`, `rule_items`, `ideas`, `idea_critiques`, `idea_votes`, `prompt_runs`, `plan_documents`, `plan_document_versions`, `phases`, `tasks`, `checkpoints`, `decisions`.

---

## 7. Authentication and security

### 7.1 Auth design (decide this yourself; do not leave it to the frontend agent)

- **Login:** OAuth2 with **GitHub** and **Google** through Spring Security's OAuth2 client. GitHub login matters because F9 builds on it.
- **Session:** server-side session, sent as an **HttpOnly, Secure, SameSite cookie**. The browser JavaScript never touches the credential.
- **CSRF:** cookie-to-header CSRF token pattern for the SPA.
- **Same-origin deploy:** serve the SPA and API under one domain via a reverse proxy/CDN rule (`/api/*` goes to Spring). This makes the cookie approach simple and avoids CORS headaches.
- **Authorization:** check room membership and role on **every** room-scoped endpoint (leader, captain, member). Write these checks as a small reusable component and test them heavily. A missing check here means one team can read another team's ideas.

### 7.2 Security checklist

| Risk | Mitigation |
|---|---|
| **XSS from pasted AI output or user text** | Sanitize all Markdown/HTML on render; never `dangerouslySetInnerHTML` unsanitized |
| **Broken access control (cross-team data)** | Membership/role check on every room endpoint; tests that try cross-room access |
| **Secrets in repo or frontend bundle** | Env vars only; secret scanning in CI; no secrets in `VITE_*` |
| **BYOK API keys** | Default: **don't store them**; hold in memory/session and send per request. If storage is later required, encrypt (AES-256-GCM) with a key from the environment/secret manager, never log |
| **Third-party API keys teams record (F10)** | Store *where the key lives*, not the key |
| **Abuse of public endpoints** | Rate limiting; request size limits (pasted text can be large) |
| **GitHub tokens** | Least privilege (read-only metadata to start); short-lived installation tokens |
| **Prompt injection (Pro/BYOK only)** | Treat all pasted room content as untrusted input to the model; never let model output trigger actions without review |
| **Dependency vulnerabilities** | Dependabot + `mvn`/`npm` audit in CI |
| **Data privacy** | Say clearly that pasting ideas into a third-party AI chat shares them with that provider; respect each event's AI-use policy (F1) |

---

## 8. Real-time and offline

### 8.1 Live updates
- **Start with polling via TanStack Query** (every few seconds on active screens). It is trivial and good enough for the first versions.
- **Then SSE** (Spring `SseEmitter`) for one-way pushes: new idea revealed, task changed, checkpoint passed, countdown events.
- **WebSocket/STOMP only if needed**, for true multi-user live editing. The ideation board is card-based with stages (silent round → reveal), not a free-form canvas, so it does not need CRDT-style collaboration libraries.

### 8.2 Offline (design rule 6)
Scope it honestly. Full offline editing with conflict resolution is expensive.

| Level | What it means | When |
|---|---|---|
| **1. App shell offline** | The app loads with no network | MVP |
| **2. Read-only room cache** | Last-seen plan, tasks, rules, and demo script viewable offline | MVP |
| **3. Export everything** | One-click zip of all docs and checklists | MVP |
| **4. Queued writes** | Edits made offline sync later | Only if interviews show teams need it |

---

## 9. Prompt Bridge and AI layer

This is where your "free tier via free chat" idea becomes engineering. It is also the best learning material in the project because it is *ordinary backend work*, not AI research.

### 9.1 Prompt Bridge (free tier: no LLM on the server)

| Component | Approach | Library/tool (suggested) |
|---|---|---|
| **Context pack builder** | Assemble rubric, rules, chosen idea, skills, time budget into a compact block | Plain Java + your own DTOs |
| **Prompt templates** | Versioned text templates stored in the repo/DB, with placeholders | Java text blocks + a small template engine (e.g., Mustache) |
| **Prompt chain** | 4-5 short prompts (PRD/MVP → stack → phases/cut list → tasks → demo/Q&A), each reusing a short summary of the last | Your own `ChainDefinition` model |
| **Output contract** | Documents as Markdown; tasks/phases as JSON | JSON Schema per prompt |
| **Validator** | Parse pasted text; validate JSON against schema; list exactly what's wrong | A JSON Schema validator library (e.g., networknt) + `commonmark-java` |
| **Repair prompt generator** | Turns validation errors into a copyable "fix your last answer" prompt | Templates |
| **Feasibility check** | Compare task count and estimated effort with people × hours | Simple arithmetic first |
| **Versioning** | Every run stores template version, raw paste, parsed result, reviewer, timestamp | `prompt_runs` table |

**Testing this well is the core skill.** Collect real pasted answers from several free AI chats (including malformed ones), store them as test fixtures, and make the validator pass or fail them correctly. Test across providers: different models format JSON differently (extra prose, code fences, trailing commas).

### 9.2 LLM layer (BYOK and Pro), built later

```
LlmProvider (interface)
  ├─ AnthropicProvider
  ├─ OpenAiProvider
  ├─ GeminiProvider
  └─ MockProvider   (tests, offline dev)
```

- The Prompt Bridge and the automatic modes use **the same templates and validators**, and only the "who calls the model" step differs. That keeps the free and paid paths from diverging.
- Evaluate **Spring AI** and **LangChain4j** when you get here. Don't adopt either before the free tier is proven. A thin interface of your own may be all you need.
- **Cost guardrails for Pro:** per-room token budgets, request timeouts, no retries loops, usage logging.
- **The agentic planner (Planner / Scoper / Judge Simulator)** is three prompts with a loop. Build it as plain code you can read before considering any agent framework. (Your "prompt with understanding, not blind" plan applies here.)
- **Do not automate consumer chat websites** (browser scripting of free chats). It likely breaks provider terms and is fragile. Keep the bridge manual.

---

## 10. GitHub integration (F9)

| Phase | What | How |
|---|---|---|
| **1** | Login with GitHub; user can paste a repo URL; read public repo data | OAuth login; GitHub REST API |
| **2** | Branch map, health checklist, commit-history checks on connected repos | **GitHub App** with read-only permissions, installed per repo; use a Java GitHub client library (e.g., `hub4j/github-api`) or Spring's `RestClient` |
| **3** | Webhooks for pushes/PRs to update the map live | Public webhook endpoint; verify signatures; use a tunnel for local testing |

- **Rate limits:** cache responses; use conditional requests (ETags).
- **Store only metadata** (branch names, commit times, file existence), not source code, unless a feature strictly needs it.
- Branch "purpose" and "role" annotations are **your database**, not GitHub's. That is the value you add.

---

## 11. Files, exports, and documents

| Need | Approach |
|---|---|
| Export docs as Markdown/zip | Java `java.util.zip`; stream the zip |
| Push docs to repo `/docs` | GitHub API (phase 2, via the GitHub App) |
| Diagram export (SVG/PNG) | Client-side from Mermaid |
| Deck export (`.pptx`) | **Apache POI** (Java) later; start with outline-as-Markdown |
| User uploads (screenshots, videos) | Avoid at first; link out. If needed later, S3-compatible object storage with size limits |
| OpenAPI import (F10) | Parse with the standard OpenAPI parser library; store the spec as JSONB |

---

## 12. DevOps and hosting

### 12.1 Local development
- **Docker Compose** with Postgres. One command: `docker compose up`.
- **Testcontainers** for backend tests, so tests use a real Postgres, not a fake one.
- Frontend dev server proxies `/api` to the local backend.

### 12.2 CI (GitHub Actions)
On every push/PR:
1. Backend: build, unit tests, integration tests (Testcontainers).
2. OpenAPI spec generated and **diffed against the last one**; breaking changes flagged.
3. Frontend: regenerate API client, typecheck, lint, unit tests, **Playwright** tests.
4. Security: dependency audit, secret scan.
5. Build a Docker image for the backend.

### 12.3 Hosting (categories; check current pricing and limits)
| Piece | Options (category) |
|---|---|
| SPA | Static hosting/CDN (Cloudflare Pages, Netlify, Vercel-style) |
| API | Container host (Render, Railway, Fly.io-style) or a small VPS with Docker |
| Database | Managed Postgres (Neon, Supabase-style) or Postgres in Docker on the VPS |
| Domain/CDN | Put both under one domain so cookies stay same-site |

**JVM-specific cautions:**
- **Memory:** a JVM app needs more RAM than a small Node service; check the memory limit of any free tier and set JVM memory flags deliberately.
- **Cold starts:** free tiers that put idle services to sleep make the first request slow with a JVM. That is a poor experience for "Speed Mode". Decide whether the free tier is acceptable for real users or only for development.
- Consider CDS/AOT or native images only if startup time proves to be a real problem. It is not a day-one topic.

### 12.4 Environments
`local` (Compose) → `staging` (optional) → `prod`. Secrets only via the host's secret manager or env vars.

### 12.5 Backups and observability
- Automated database backups and one **tested restore**. (An untested backup is a guess.)
- Actuator health endpoint, structured logs, and error tracking. Alert on failed logins spikes and 5xx rates.

---

## 13. Testing strategy

| Level | Tool | Who writes | What it covers |
|---|---|---|---|
| Unit (backend) | JUnit 5, Mockito | **You** | Services, validators, template engine |
| Integration (backend) | Spring Boot Test + Testcontainers | **You** (with AI help) | Repositories, security rules, Flyway migrations |
| Architecture | ArchUnit / Spring Modulith | You | Module boundaries respected |
| Contract | OpenAPI diff in CI | Automated | No accidental breaking API changes |
| Frontend unit | Vitest + Testing Library | Agent | Components and hooks |
| End-to-end | **Playwright** | Agent (you review test names/descriptions) | Full flows: create room, invite, ideate, plan |
| Prompt Bridge fixtures | JUnit + saved real AI outputs | **You** | Parsing and validation robustness |
| Security | Tests trying cross-room access, missing auth | **You** | Access control |

Write the backend tests yourself where possible. Writing tests forces you to understand behavior, which suits your learning goal better than reading finished code.

---

## 14. Repository layout and workflow

Single repo (monorepo) so the agent and you share specs:

```
hackathon-os/
  docs/
    problem.md
    ideation.md
    tech_stack.md
    adr/               # short decision records (one file per decision)
  backend/             # Spring Boot (Maven)
  frontend/            # React + Vite
  e2e/                 # optional shared Playwright
  docker-compose.yml
  .github/workflows/
  AGENTS.md            # rules for AI agents (frontend focus)
  README.md
```

- **Branching:** `main` is always deployable; short-lived feature branches; PRs even when you are alone (CI runs, and the diff becomes reviewable).
- **Commits:** small, meaningful (conventional-commit style). Your own commit history also becomes evidence of learning.
- **ADRs:** when you make a stack decision, write a 10-line record: context, decision, alternatives, consequences. It is cheap and stops you re-debating.

---

## 15. Decision log (why these, and when to revisit)

| Decision | Alternatives | Revisit when |
|---|---|---|
| Vite SPA over Next.js | Next.js | You want a public SEO site or server-rendered pages |
| Spring MVC + virtual threads over WebFlux | WebFlux | You have thousands of concurrent streaming connections |
| Modular monolith | Microservices | Separate teams or scaling needs (unlikely for a long time) |
| Cookie sessions over JWT | JWT in headers | You add a mobile app or third-party API clients |
| PostgreSQL only | + Redis/search | Measured slowness, or rate-limiting/session load |
| SSE/polling before WebSocket | WebSocket | You add true multi-user live editing |
| Prompt Bridge with no server LLM | Server-side LLM for all | Free-user friction proves too high |
| Maven | Gradle | You want Gradle's flexibility later |
| Java records, no Lombok | Lombok | You understand the boilerplate and want less of it |
| Metadata-only GitHub access | Read source code | A feature truly needs code (e.g., Code Defense drills, F12) |

---

## 16. Your learning plan: refining the "learn, then write" loop

Your approach (learn unknown concepts first, then write with AI help; keep the ones you know as revision) is solid. Some refinements that make it work better:

### 16.1 The per-file ritual

1. **Name the file's job** in one sentence before opening any AI.
2. **Know-gate:** "Do I know this concept well enough to explain it without notes?"
   - **Yes:** attempt the file yourself first (even roughly), then ask the AI to review or improve it.
   - **No:** ask the AI to teach the concept using a tiny example, then close it and try to reproduce the example from memory.
3. **Ask AI to write the file only after** you have tried, or when the file is pure boilerplate you have already mastered.
4. **Read every line** and be able to answer "why is this here?" for each annotation and method.
5. **Write or extend a test** for it yourself.
6. Log it in the ledger.

*Why "try first, AI second" beats "AI writes, I read":* actively trying to produce code (even badly) and then comparing is much better for retention than reading finished code. This is a suggestion; it costs more time per file, so use it on the concepts you most want to own (security, transactions, JPA).

### 16.2 The concept ledger (keep as `docs/learning-ledger.md`)

| Concept | Where used | Status | Notes / gap |
|---|---|---|---|
| Spring MVC controllers | `room` | ✅ Known | |
| Bean Validation | `room` | 🟡 Shaky | Forgot `@Valid` on nested DTOs |
| JPA relationships & N+1 | `ideation` | ❌ Learning | |
| Spring Security filter chain | `auth` | ❌ Learning | |
| Flyway migrations | `db` | 🟡 Shaky | |
| Testcontainers | tests | ❌ Learning | |

Statuses: ✅ can explain without notes; 🟡 works but can't fully explain; ❌ not yet learned. The goal is to move 🟡 to ✅ before the module ships.

### 16.3 Suggested concept order (follows the build spine)

1. Project setup, Maven, Spring Boot 4 basics, configuration profiles
2. Controllers, DTOs (records), validation, `ProblemDetail` errors
3. PostgreSQL + Flyway; JPA entities and repositories; transactions
4. Spring Security: OAuth2 login, sessions, CSRF, method-level authorization
5. Testing: JUnit 5, Mockito, Spring Boot Test, Testcontainers
6. OpenAPI with springdoc; how the frontend consumes it
7. Modules and architecture rules (ArchUnit/Modulith)
8. Template engines, JSON Schema, Markdown parsing (Prompt Bridge)
9. Scheduling and SSE
10. GitHub API integration and webhooks
11. Docker, CI/CD, deployment
12. LLM provider abstraction (later)

### 16.4 A caution on scope and time

The plan pairs *learning* with *building a large product*. That is fine, but it is slower than either alone. Protect yourself with the same rule the product teaches: **ship one vertical slice first** (login → create room → invite a teammate → enter the event brief). Only then extend.

---

## 17. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Unverified agent-written frontend hides bugs or insecure patterns** | You won't read the code | Typed generated client, CI gates, Playwright tests, `AGENTS.md`, Section 4.5 review points |
| **Antigravity/model limits or changes stall the frontend** | Rate limits and model lists shift | Model-agnostic specs and tests; keep a fallback tool |
| **AI gives Boot 3-era code that doesn't fit Boot 4** | Wasted time, confusing errors | Use the official Boot 4 docs first; start from start.spring.io; treat compile errors as a docs lookup |
| **Learning-mode slows delivery** | Big product, part-time learning | Vertical slice first; build only the P0 spine (Section 5.2) |
| **JVM hosting cost/cold starts** | Poor Speed Mode experience on cheap tiers | Choose hosting deliberately; measure startup and memory early |
| **Cross-team data leaks** | Trust-destroying | Central authorization component; access-control tests |
| **Pasted-text XSS** | Real attack surface | Sanitize on render; tests with malicious samples |
| **Prompt Bridge output varies by model** | Validator failures frustrate users | Real fixtures from many models; friendly repair prompts |
| **Spec drift** (docs and code disagree) | Agent builds the wrong thing | Docs live in the repo; update `ideation.md` when scope changes; OpenAPI is generated from code |
| **Over-engineering** (Redis, microservices, Kubernetes) | Time sink, contradicts the product's own advice | Follow Section 15 and revisit only on evidence |

---

## 18. Verify before you start (things that may have changed)

- [ ] Latest **Spring Boot 4.x** patch and the matching **springdoc-openapi 3.x** version (start.spring.io + springdoc releases)
- [ ] Java 25 works with all your chosen libraries (some libraries print warnings on Java 25; fall back to 21 if a library misbehaves)
- [ ] Current **Boot 4 starter names** for web, security, data-jpa, validation, actuator
- [ ] Which **Claude models** your Antigravity plan currently offers, and its **rate limits**
- [ ] Licenses for any embedded components (Swagger UI/Redoc, editors)
- [ ] Hosting free-tier limits: memory, sleeping behavior, database size
- [ ] GitHub App permission names and webhook requirements
- [ ] Terms of any AI provider whose free chat you reference in the Prompt Bridge

---

## 19. Sources for version and tool claims

| Claim | Source |
|---|---|
| Spring Boot 4.0 GA in Nov 2025; built on Spring Framework 7; Java 17 minimum; Java 25 support; API versioning; modularized jars; Boot 3.5 line ending | https://www.herodevs.com/blog-posts/spring-boot-versions-eol-dates-and-latest-releases-april-2026 |
| Boot 4: Jakarta EE 11, Jackson 3 default, JSpecify null-safety, Spring Security 7 / Hibernate 7 line, no LTS designation, 3.5 open-source support ended 30 Jun 2026, Boot 4.1 released, Java 25 supported | https://www.issoh.co.jp/tech/details/10124/ |
| Boot 3.5.5 and Boot 4.0.0 are Java 25 ready | https://github.com/spring-projects/spring-boot/issues/47245 |
| Java 25 runtime warnings for some libraries (Unsafe usage) | https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-with-Java-9-and-above/Restructuring |
| springdoc-openapi 3.0.0 targets Spring Boot 4 (2.x for Boot 3) | https://github.com/springdoc/springdoc-openapi/discussions/3156 ; release notes quoted in https://github.com/hendisantika/spring-boot-test-container-postgresql/pull/37 |
| Antigravity: multi-model incl. Claude Sonnet/Opus 4.6; free individual tier; browser agent; AGENTS.md support | https://en.wikipedia.org/wiki/Google_Antigravity ; https://agentpedia.codes/pt/blog/antigravity-vs-claude-code ; https://seawork.ai/en/blogs/antigravity-vs-claude-code/ |
| Antigravity rate-limit complaints; other sources list Claude Opus 4.7 | https://codex.danielvaughan.com/2026/03/28/agentic-coding-landscape-2026-antigravity-kiro ; https://nevercodealone.de/de/glossare/ki-tools-2026/google-antigravity |
| Everything about the product's problems, features, and design rules | `problem.md`, `ideation.md` |

*Library and hosting recommendations not listed above are my engineering judgment and were not researched in this session.*

---

## 20. Next step (Step 4)

Two things, in order:

1. **Validate before building** (from `problem.md` Section 9): run the interviews and test the Prompt Bridge prompt chain by hand with real students and a free AI chat. No code needed for this.
2. **Then write the architecture spec for the P0 spine:** data model, API endpoints (as an OpenAPI draft), and the first vertical slice's screens. That draft becomes the contract the frontend agent builds against.
