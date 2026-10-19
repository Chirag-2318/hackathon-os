# Phase 1 — Documentation inventory

## Method

Inventory date: 2026-10-19. Tracked documentation-like files were enumerated with read-only `git ls-files`; generated/vendor output was excluded (`node_modules`, `target`, `build`, `dist`, coverage, Playwright reports and test-result output). Files listed below were read in full when present. Sizes are approximate byte counts from the working tree. Git dates are the last commit date for the path, not proof of the current working-tree content because this repository already had extensive uncommitted changes.

The source corpus includes reference documentation, design specifications, API request collections, operational templates, prompt/process artifacts, email templates, and validator fixtures. Prompt and fixture files are inventoried because they contain product decisions and validation contracts, but they are not treated as user-facing reference documentation.

## Reference, guide, and policy documents

| Path | Title / apparent purpose | Last commit | Size | Topics | Classification |
|---|---|---:|---:|---|---|
| `README.md` | `[brackit]` overview and quickstart | 2026-10-19 | ~6.6 KB | Architecture, ports, prerequisites, env names, AI gateway, structure | Reference; contains claims requiring code verification |
| `PROJECT_CONTEXT.md` | Complete project context/system reference for landing-page work | 2026-10-19 | ~52.5 KB | Product, feature catalog, stack, pricing, design, landing claims, gaps | Context dossier; partly derived from code and partly marketing/plan material |
| `AGENTS.md` | Repository rules for coding agents | 2026-09-23 | ~0.8 KB | Dependencies, generated client, secret storage, sanitization, tests, routing | Policy / process |
| `frontend/AGENTS.md` | Frontend-specific copy of agent rules | 2026-10-07 | ~0.8 KB | Same frontend safety and architecture constraints | Policy / process |
| `frontend/README.md` | Vite starter-template README | 2026-09-23 | ~2.3 KB | React/Vite template, ESLint suggestions | Template artifact; likely stale for the product |
| `docs/problem.md` | Hackathon failure research | 2026-10-07 | ~33.4 KB | Research, problems P*, loss causes L*, winner traits W*, rule eliminations D* | Research / product discovery; not implementation truth |
| `docs/ideation.md` | Feature ideation and product specification | 2026-10-19 | ~40.5 KB | F1–F22, personas, flow, free/pro, feature decisions, roadmap | Product plan; substantially superseded in places by code |
| `docs/tech_stack.md` | Proposed technology and workflow decisions | 2026-09-23 | ~37.6 KB | React/Vite, Spring, PostgreSQL, security, AI, testing, hosting, learning plan | Architecture plan; contains future/proposed choices |
| `docs/design.md` | Static UI/UX specification | 2026-10-19 | ~82.6 KB | Tokens, components C01–C40, screens S01–S32, accessibility, responsive rules | Design specification; compare with implemented CSS/components |
| `docs/animations.md` | Motion specification | 2026-09-23 | ~56.3 KB | Motion tokens, screen moments M01–M15, accessibility, performance | Design/process specification; many values are planned |
| `docs/BACKEND_GUIDE.md` | Backend architecture and phase guide | 2026-10-19 | ~21.5 KB | Packages, planning, validators, tasks, GitHub, pitch, SSE, cleanup | Reference; phase sections are partly stale and conflict with current code |
| `docs/database.md` | Database architecture and operations guide | 2026-10-19 | ~4.8 KB | ER model, V1–V9 migration history, indexes, triggers, cleanup, backups | Reference; migration list must be reconciled with actual files |
| `docs/AI_PROVIDERS.md` | AI gateway/BYOK configuration | 2026-10-19 | ~3.5 KB | Groq key storage, limits, error codes, dev fallback | Security/product reference; verify against current AI classes/config |
| `docs/SECURITY.md` | Security architecture and guidelines | 2026-10-19 | ~2.2 KB | Sessions, room authorization, secret handling, sanitization, CSRF, limits | Security guide; claims require implementation verification |
| `docs/ERROR_CODES.md` | API error-code catalog | 2026-10-19 | ~2.7 KB | Error payload, auth, validation, resource and rate errors | Reference; compare against exception classes/handlers |
| `docs/COVERAGE.md` | Backend/frontend endpoint coverage audit | 2026-10-11 | ~21.6 KB | 234 endpoint rows and connected status | Audit artifact; counts/statuses require code/client verification |
| `docs/RUNBOOK.md` | Local and production operational runbook | 2026-10-19 | ~4.4 KB | Local run, Docker, DB maintenance, health checks, troubleshooting | Runbook; commands are documentation only and were not run |
| `docs/DEPLOYMENT.md` | Production deployment guide | 2026-10-19 | ~12.0 KB | VM, Caddy, Vercel modes, OAuth, env names, backups, troubleshooting | Deployment guide; code/config wins over contradictions |
| `deploy/restore.md` | Database/uploads disaster-recovery guide | 2026-10-17 | ~3.2 KB | Cron backup, pg_restore, volume restore, full VM recovery | Runbook / operations |
| `docs/KNOWN_GAPS.md` | Current non-goals and future roadmap | 2026-10-19 | ~1.3 KB | Webhooks, video, replication, cursors, judge portal, code review | Roadmap; verify current gap status |
| `docs/SMOKE_CHECKLIST.md` | Golden-path manual smoke checklist | 2026-10-19 | ~4.3 KB | Auth, onboarding, rooms, brief, plan, board, pitch, submission, offline, AI | QA checklist; not evidence that checks passed |
| `frontend/src/features/landing/LAUNCH-CHECKLIST.md` | Landing claim register | 2026-10-19 | ~7.0 KB | Claim-by-claim evidence, contradictions, open decisions | Audit/process artifact; valuable conflict evidence |

## Process, plan, and design-history artifacts

| Path | Title / apparent purpose | Last commit | Size | Topics | Classification |
|---|---|---:|---:|---|---|
| `docs/WORK_LOG.md` | Chronological engineering log | 2026-10-19 | ~7.0 KB | SSE, PRESENT redesign, GitHub, Groq, brand rename | Process artifact; history/decision evidence |
| `docs/WORKING_WITH_AI_CODERS.md` | Prompting and agent workflow guide | 2026-10-19 | ~3.7 KB | File-scoped prompts, architecture map, safety net | Process artifact |
| `docs/PRD-phase-3b-plan-docs-vault.md` | Frontend PRD for Plan/Docs Vault | 2026-10-07 | ~6.9 KB | Mocked prompt bridge, nine docs, UI acceptance criteria | Historical plan; explicitly says backend behavior is mocked |
| `docs/frontend-phase-prd-prompts-14.md` | Meta-prompt for final frontend phase | 2026-10-07 | ~6.7 KB | S29–S32, process instructions, anti-hallucination rules | Process artifact / prompt |
| `docs/redesign/PROGRESS.md` | Redesign rounds and verification notes | 2026-10-10 | ~16.7 KB | Home/shell/playbooks/tools/create-room redesign | Process artifact; includes completed and stale checklists |
| `docs/redesign/geometry-before.txt` | Pre-fix geometry test output | 2026-10-09 | ~3.5 KB | Three failing geometry assertions | Test log artifact |
| `docs/landing/landing-page-context.md` | Landing v1 handoff and v2 plan | 2026-10-19 | ~20.5 KB | Landing implementation, claims, open items, v2 workflow | Process artifact / handoff |
| `docs/landing/landing_ideation.md` | Landing page creative/product specification | 2026-10-19 | ~70.2 KB | Landing thesis, sections, copy, claims, assets, interactions | Design plan / process artifact |
| `docs/landing/prompt-1-bugs-and-foundations.md` | Landing v2 implementation prompt 1 | 2026-10-19 | ~16.4 KB | Launch Pad bug, spacing, captions, no-orphan helper | Process artifact / coding prompt |
| `docs/landing/prompt-2-hero-wall-screens.md` | Landing v2 implementation prompt 2 | 2026-10-19 | ~46.3 KB | Hero wall frames/screens/data/CSS | Process artifact / coding prompt |
| `docs/landing/prompt-3-hero-wall-camera-and-hero.md` | Landing v2 implementation prompt 3 | 2026-10-19 | ~20.3 KB | Hero wall camera, integration, first-screen spacing | Process artifact / coding prompt |
| `docs/landing/prompt-4-pivot-and-stage.md` | Landing v2 implementation prompt 4 | 2026-10-19 | ~18.9 KB | Pivot rewind and stage enlargement | Process artifact / coding prompt |
| `docs/landing/prompt-5-quiet-middle.md` | Landing v2 implementation prompt 5 | 2026-10-19 | ~23.5 KB | Rulers, playbooks, room grid, trust, compare, FAQ, pricing | Process artifact / coding prompt |

## API request collections

These `.http` files are executable request examples, not a canonical OpenAPI specification. They contain useful historical endpoint names and payload shapes, but several paths and verbs must be checked against controllers.

| Path | Purpose | Last commit | Size | Classification |
|---|---|---:|---:|---|
| `docs/phase1-api.http` | Identity, rooms, members, invites, notifications | 2026-10-11 | ~4.9 KB | API example / phase artifact |
| `docs/phase2-api.http` | Brief, ideation, plan, minimal docs/board reads | 2026-10-11 | ~6.3 KB | API example / phase artifact |
| `docs/phase3-api.http` | Board, overview, team, checkpoints, MVP, docs, speed mode | 2026-10-11 | ~7.8 KB | API example / phase artifact |
| `docs/phase4-api.http` | GitHub, pitch, demo, submission, readiness, retro, prep, mentor | 2026-10-19 | ~11.0 KB | API example / phase artifact |

## Backend prompt templates and prompt fixtures

| Path or group | Purpose | Last commit | Size | Classification |
|---|---|---:|---:|---|
| `backend/src/main/resources/plan-prompts/phase-tasks.template.md` | Contract for phase task generation | 2026-10-17 | ~2.6 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/phase-P1-tasks.md` | Example/generated P1 traffic-dashboard task plan | 2026-10-17 | ~6.7 KB | Process fixture; unrelated historical example |
| `backend/src/main/resources/plan-prompts/step1-bundle.md` | Example PRD/MVP bundle for TrafficCast | 2026-10-17 | ~14.9 KB | Process fixture; unrelated historical example |
| `backend/src/main/resources/plan-prompts/step1-prd-mvp.template.md` | PRD/MVP generation contract | 2026-10-17 | ~8.4 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step1-prd-mvp.groq.md` | Analysis prompt for PRD/MVP | 2026-10-19 | ~3.9 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step2-stack-arch.template.md` | Tech stack/architecture generation contract | 2026-10-17 | ~8.2 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step2-stack-arch.groq.md` | Analysis prompt for stack/architecture | 2026-10-19 | ~3.4 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step3-phases-design.template.md` | Phases/design generation contract | 2026-10-17 | ~8.1 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step3-phases-design.groq.md` | Analysis prompt for phases/design | 2026-10-17 | ~4.0 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step4-tasks.template.md` | Task-board generation contract | 2026-10-17 | ~7.7 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step4-tasks.groq.md` | Analysis prompt for tasks | 2026-10-19 | ~3.7 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step5-demo-qna.template.md` | Demo/Q&A generation contract | 2026-10-17 | ~8.1 KB | Runtime prompt template |
| `backend/src/main/resources/plan-prompts/step5-demo-qna.groq.md` | Analysis prompt for demo/Q&A | 2026-10-17 | ~3.6 KB | Runtime prompt template |
| `backend/src/test/resources/plan-fixtures/phase-tasks-sample.md` | Parser fixture for phase tasks | 2026-10-19 | ~1.4 KB | Test fixture |
| `backend/src/test/resources/plan-fixtures/step1-bundle.md` | Parser fixture matching the TrafficCast bundle | 2026-10-17 | ~14.9 KB | Test fixture |
| `backend/src/test/resources/plan-samples/*.md` | Good, warning, and broken PRD/tech/demo samples | 2026-10-11/19 | ~0.05–1.7 KB each | Validator fixtures |

## Email templates and other text assets

| Path | Purpose | Last commit | Size | Classification |
|---|---|---:|---:|---|
| `backend/src/main/resources/mail/invite.txt` | Room invite email with placeholders | 2026-10-19 | ~0.35 KB | Runtime email template |
| `backend/src/main/resources/mail/joined.txt` | Joined-room notification email | 2026-10-19 | ~0.21 KB | Runtime email template |
| `backend/src/main/resources/mail/reminder.txt` | Deadline reminder email | 2026-10-19 | ~0.35 KB | Runtime email template |
| `backend/src/main/resources/mail/update.txt` | Team update email | 2026-10-17 | ~0.20 KB | Runtime email template |
| `backend/src/main/resources/mail/welcome.txt` | Participant welcome email | 2026-10-19 | ~0.37 KB | Runtime email template |

## Files not treated as authoritative documentation

- Generated/vendor trees were excluded as instructed: `node_modules`, `target`, `build`, `dist`, coverage, Playwright reports, and test-result output.
- `frontend/src/features/landing/assets/how/README.md` is tracked as deleted in the pre-existing working tree and was therefore unavailable to read. Its deletion was not caused by this task; it is recorded as an existing working-tree condition.
- No standalone OpenAPI/Swagger YAML or JSON specification file was found. The repository contains runtime/API-hub code and a Swagger UI dependency, but not a checked-in canonical spec file.
- No `CHANGELOG` or `CONTRIBUTING` file was found.
- The `.puml`, `.mmd`, `.drawio`, `.adoc`, `.rst`, and `.mdx` searches found no additional existing files outside the output folder.

## Initial inventory conclusions

1. `PROJECT_CONTEXT.md` and `LAUNCH-CHECKLIST.md` are the most useful claim cross-reference documents, but their claims are not automatically authoritative.
2. `docs/ideation.md`, `docs/tech_stack.md`, `docs/design.md`, and `docs/animations.md` are plan/design sources, not proof that every feature is implemented.
3. The API `.http` collections are historical phase artifacts. The final API reference must be generated from current controllers and DTOs.
4. The runtime plan prompts explicitly constrain AI-generated documents and include “do not invent” rules; they also contain a historical unrelated TrafficCast fixture. This is process data, not Bracket product scope.
5. Several docs use “AI” and “LLM” terminology. The final documentation will describe only verified provider/gateway behavior and will not introduce machine-learning claims.
