import type { DocFile } from '@/services/types';

export const DEFAULT_DOCS: DocFile[] = [
  {
    id: 'doc-decisions',
    name: 'DECISIONS.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Architecture & Product Decisions

## 1. Architectural Strategy & Philosophy
This document records key architectural decision records (ADRs) and product direction choices established for this sprint. All technical commitments balance rapid prototyping velocity with production-grade stability.

## 2. Decision Records

### ADR-001: Unified Groq AI Gateway Integration
- **Status:** Accepted
- **Context:** Low-latency response times for real-time document critique, ideation, and pitch scripting are critical during live hackathon judging.
- **Decision:** Integrate directly with Groq via an OpenAI-compatible gateway using \`llama-3.3-70b-versatile\`.
- **Consequences:** Sub-second time-to-first-token, resilient retry and circuit-breaking protocols, and transparent client fallback modes.

### ADR-002: Offline-First Client Architecture with IndexedDB Sync
- **Status:** Accepted
- **Context:** Hackathon venue WiFi is notoriously unstable. Losing documents or task progress mid-pitch is unacceptable.
- **Decision:** Cache all document vaults, versions, and board states in IndexedDB with optimistic UI updates and background synchronization.
- **Consequences:** Team members can review and edit documents seamlessly during network dropouts; conflict resolution prompts appear if concurrent edits occur.

### ADR-003: Modular Micro-Editor with Floating AI Assistant
- **Status:** Accepted
- **Context:** Authors need rapid inline AI assistance without switching away from their document view.
- **Decision:** Implement inline rich selection toolbar with quick formatting and direct Groq AI querying.
- **Consequences:** Instant inline query, rewriting, and critique directly attached to highlighted text segments.

### ADR-004: Event-Driven Real-Time Room Collaboration
- **Status:** Accepted
- **Context:** Cross-functional teammates (Developers, Designers, Presenters) need synchronized room presence and document update notifications.
- **Decision:** Utilize Server-Sent Events (SSE) \`/api/v1/rooms/{roomId}/events\` paired with REST CRUD endpoints.
- **Consequences:** Lightweight live telemetry without heavy bidirectional WebSocket overhead.

## 3. Product Boundary & Non-Goals
- **In Scope:** Full document vault, AI assisted refactoring, automated ZIP export, GitHub PR bridging.
- **Out of Scope (Post-Hackathon):** Multi-tenant enterprise SSO, custom third-party plugin marketplace.
`,
  },
  {
    id: 'doc-prd',
    name: 'PRD.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# PRD — Product Requirements Document

## Problem
Hackathon teams struggle with chaotic coordination, fragmented notes, and panic during final submission crunch time. Critical decisions get lost in chat threads, documents are half-written, and pitch preparation happens in the final 30 minutes.

## Target user
High-velocity hackathon builders, solo developers, and multidisciplinary student/professional hackathon teams aiming for podium finishes.

## One-sentence identity
Hackathon OS is the autonomous command center that turns chaotic hackathon sprints into polished, winning submissions.

## Core flow
1. **Intake & Brief:** Extract problem statement, rubric criteria, and constraints.
2. **Ideation & Scoring:** Generate and vote on high-signal concepts with rubric alignment.
3. **Plan & Vault:** Auto-compile the sprint roadmap, architectural ADRs, and 10 markdown documents.
4. **Build Board:** Execute tasks prioritized by dependency critical paths.
5. **Pitch & Demo Kit:** Rehearse pitch slides, timing scripts, and judge defense Q&A.

## Success metrics
- Zero lost documents or conflicting sprint directions.
- Live demo rehearsed with timer and backup shot list.
- Complete sprint package exportable to GitHub repository in one click.
`,
  },
  {
    id: 'doc-problem',
    name: 'PROBLEM.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Problem & Identity

## Problem
In a 24-to-36 hour hackathon, over 70% of teams fail not because they cannot code, but because of execution breakdown:
- Scope creep drains time before the core MVP is testable.
- Pitch decks are thrown together at minute 35 of hour 36.
- Architecture decisions are undocumented, leading to duplicate work and conflicting API contracts.

## Target user
- **The Solo Hacker:** Needs AI pair-programming and structured planning to match 4-person teams.
- **The Multidisciplinary Team:** Needs unified synchronization across Frontend, Backend, ML, and Pitch tracks.

## Value proposition
A focused, beautiful operating system designed specifically for the intense lifecycle of a hackathon.
`,
  },
  {
    id: 'doc-tech',
    name: 'TECH_STACK.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Tech Stack and Architecture

## Core Technologies

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Blazing fast HMR, type safety, optimal client performance |
| Styling & UI | Tailwind CSS v4 + shadcn/ui | Unified design system tokens, responsive dark/light modes |
| Motion | Framer Motion | Smooth micro-animations and physics-based transitions |
| Backend | Spring Boot 4 + Java 21 | Rock-solid REST services, enterprise concurrency, OpenAPI 3.0 |
| AI Gateway | Groq Cloud (LLaMA 3.3 70B) | Extreme inference velocity for real-time document suggestions |
| Database | PostgreSQL + Flyway | Relational consistency, JSONB flexibility, audited migrations |
| Offline Cache | IndexedDB (\`idb-keyval\`) | Resilient client offline operations during venue outages |

## Architecture Diagram

\`\`\`mermaid
graph TD
    Client[React Client] --> Gateway[Spring Boot Backend]
    Gateway --> Groq[Groq AI Gateway]
    Gateway --> DB[(PostgreSQL)]
    Client --> IDB[(IndexedDB Offline Cache)]
\`\`\`
`,
  },
  {
    id: 'doc-phases',
    name: 'PHASES.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Sprint Phases

| Phase | Time share | Exit checkpoint | Goals |
| --- | --- | --- | --- |
| 1. Discovery & Setup | 0% - 15% | Repo initialized, brief confirmed | Finalize concept, setup project scaffold, verify API keys |
| 2. Core Spine & MVP | 15% - 60% | End-to-end user flow working | Implement critical data path, UI shell, and primary API contracts |
| 3. Polish & Edge Cases | 60% - 85% | Empty states, error banners, dark mode | Comprehensive testing, error states, styling cohesion |
| 4. Pitch & Submission | 85% - 100% | Demo rehearsed, repo zipped, video ready | Record demo video, rehearse pitch script, submit project |
`,
  },
  {
    id: 'doc-mvp',
    name: 'MVP.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Minimum Viable Product (MVP)

## Must-Have Scope
- **Interactive Document Vault:** All core project documentation stored, versioned, and editable in one centralized place.
- **Inline AI Assistant:** Real-time Groq-powered rewrites, suggestions, and explanations directly inside documents.
- **Offline Reliability:** Instant local caching with zero data loss on disconnection.
- **One-Click Export:** Download all documents as a structured \`.zip\` archive or sync to GitHub repository.

## Boundary Principles
If a feature does not directly advance the judge scoring rubric or core user flow, it is strictly deferred to post-hackathon backlog.
`,
  },
  {
    id: 'doc-cutlist',
    name: 'CUT_LIST.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Scope Cut List

The following items are intentionally cut from the initial hackathon sprint to protect delivery velocity:

1. **Third-Party Auth Providers:** OAuth Google/GitHub is sufficient; defer SAML/Enterprise SSO.
2. **Custom Document Templates Engine:** Use the 10 standard markdown files rather than custom drag-and-drop template editors.
3. **Full Live Collaborative Cursor Editing:** Use version snapshots and conflict resolution banners instead of complex Operational Transformation (OT) servers.
4. **Multi-Region Cloud Deployment:** Deploy to single cloud container instance.
`,
  },
  {
    id: 'doc-risks',
    name: 'RISKS.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Risks & Fallbacks

## Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| WiFi drops during judging | High | Medium | All vault docs and demo states are cached offline in IndexedDB |
| Groq API rate limits / latency | Medium | Low | Exponential backoff retry, circuit breaker, and local fallback heuristics |
| Time crunch before submission | High | Medium | Strict Cut List adhered to; 15% phase buffer reserved for video recording |
| Live demo glitch | High | Low | Pre-recorded backup video clips embedded in pitch deck kit |
`,
  },
  {
    id: 'doc-demoscript',
    name: 'DEMO_SCRIPT.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Demo Script & Shot List

## 3-Minute Live Demo Script

- **[0:00 - 0:30] Hook & Problem:**
  "Judges, every hackathon team has lived through the 3:00 AM panic: half-written docs, lost architecture decisions, and an unpracticed pitch. We built Hackathon OS to solve this."

- **[0:30 - 1:15] The Docs Vault & AI Assistant:**
  "Show the Docs Vault. Navigate to DECISIONS.md. Highlight an architectural decision, trigger the inline Ask AI toolbar, and watch Groq return instant, tailored architectural analysis."

- **[1:15 - 2:00] End-to-End Sprint Coordination:**
  "Show the sprint phases and task board. Demonstrate how documents directly drive the task backlog and acceptance criteria."

- **[2:00 - 2:30] Offline Reliability & Export:**
  "Demonstrate offline banner and local persistence. Click 'All (.zip)' to show instant packaging."

- **[2:30 - 3:00] Summary & Q&A Transition:**
  "Hackathon OS gives teams the clarity to build fast and win. Thank you, we'd love to take your questions."
`,
  },
  {
    id: 'doc-qa',
    name: 'QA.md',
    version: 1,
    createdAt: new Date().toISOString(),
    content: `# Judge Q&A Preparation

## Likely Questions & Strategic Responses

### Q1: "How is this different from Notion or Google Docs?"
**Answer:** Notion is a general-purpose workspace. Hackathon OS is purpose-built for the high-velocity 36-hour sprint: it enforces rubric alignment, generates sprint phases, provides inline Groq AI tailored to hackathon criteria, and packages your final submission for GitHub in one click.

### Q2: "What happens if your AI provider goes down during the hackathon?"
**Answer:** Our AI Gateway implements a circuit breaker with automated exponential retry and local fallback templates. Furthermore, all documents and edits are persisted locally in IndexedDB so the team can continue working without disruption.

### Q3: "How scalable is your backend architecture?"
**Answer:** The backend runs on stateless Spring Boot containers backed by PostgreSQL with connection pooling. The AI calls are routed through Groq's high-throughput LPU infrastructure.
`,
  },
];
