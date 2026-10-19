# Work Log

## 2026-10-17: Board Drag Bug Fix & Whole-Room Real-Time Engine

- **Board Drag Bug**: Resolved drop target and index directly from pointer element (`document.elementFromPoint`); applied immediate optimistic update to board `tasks` state; added sequence guard ignoring stale refetches and protecting in-flight moves; applied server task directly on move response instead of whole-board refetching; removed echo suppression in favor of sequence guard + 250ms debounce.
- **Backend Event Hub (`RoomEventHub`)**: Monotonic `AtomicLong` sequence per room, 200-event ring buffer for replay, SSE stream (`/api/v1/rooms/{roomId}/events`) with `Last-Event-ID` support and `resync` topic on sequence gaps, 25s pings, user stream for room membership changes, and presence endpoint (`/presence`).
- **Central Mutation Interceptor (`RoomChangeInterceptor`)**: Captures non-GET mutating endpoints under `/api/v1/rooms/{roomId}/**` and dev endpoints with 150ms burst deduplication, broadcasting primary topic, entity topic (`task:<id>`), and `overview`.
- **Frontend Real-Time (`useRoomLive`)**: Mounted once in room layout; exponential backoff (1s-30s), tab-hidden 2-minute sleep and wake resync; 3-try fallback to 30s polling; 250ms debounced topic query invalidation; live status chip ("Live", "Reconnecting...", "Polling", "Offline") and online avatar stack; 1.2s soft accent fade on foreign mutations; notable event toasts.
- **Concurrency & Locking**: `RoomLock` pessimistic write locking on task move/create, plan completion, enter build, and idea review; Flyway V38 optimistic locking version on submissions and pitch scripts with 409 `CHANGED` conflict resolution; idempotent moves and checkpoints.

## 2026-10-12: PRESENT Group Redesign (Deck, Pitch Kit, Submission)

- **Navigation**: Collapsed Deck + Demo + Rehearse + Q&A + Submission into 3 items: `Deck` (/deck), `Pitch kit` (/pitch-kit?open=…) and `Submission` (/submission); old sub-routes redirect with `Navigate`. Updated PRESENT group in `room-nav.tsx`; new hover icon animations added to `icons.css` (Deck: screen slides up + bar grows; Pitch kit: mic emits two waves; Submission: plane flies up-right and settles).
- **Stage theme tokens**: Scoped `.stage-theme` CSS class with ink, dark-card, cream, sun, orange, pink, lilac, mint, sky palette; bento grid (radius 24, gap 16) with staggered rise-in, animated accordion (280ms), number count-up, progress rings (700ms), press scale 0.98; respects `prefers-reduced-motion`.
- **Deck page** (`/deck`): State A "Where does your deck live?" hero with Canva/PowerPoint/Google Slides choice cards and inline sub-panels (no modal); State B "Deck stage" with 16:9 embed frame + orange glow, filmstrip slide plan, CUE panel, and Deck health sidebar (lint chips + rubric bars + rehearsal counter).
- **Pitch kit page** (`/pitch-kit`): Readiness ring header; three accordion panels — Demo "Proof of work" (vault slots, shot grid, insurance pills, demo-script bar), Pitch (wizard → run-of-show ruler + script cards + teleprompter + rehearsal stage with live waveform + result card), Q&A "Judge's chair" (grill-level generator, bento cards, practice mode).
- **Submission page** (`/submission`): "Launch pad" hero (flight-path breadcrumb, countdown, step-aware CTA); left column five editable write-up cards with Judge view toggle; right column pre-flight checklist, link-status checker and cross-page chips.
- **Backend (V12 migration)**: `pitch_deck_sources` table; `pitch_scripts` table; new columns `why_asked/risk_point/difficulty` on `pitch_qa`; `demo_shots.proof_url`, `demo_media.local_recording_saved/local_backup_saved`; `pitch_rehearsals.stats` jsonb; `canvaEnabled` on `/api/v1/meta`. New controllers/services for deck-source CRUD + file upload, pitch-script generate/edit/delete, Q&A generate (adds new fields), Canva OAuth integration (feature-flagged).



## 2026-10-12: Robust GitHub Connect Flow & Account Linking

- **Robust Repo Parsing**: Strips prefixes, `.git`, subpaths, tabs, fragments, and SSH, validating strictly `github.com`.
- **Accurate Error Mapping**: Maps 404 to `REPO_NOT_FOUND`, 401 to `GITHUB_TOKEN_INVALID`, 403 rate limits to `GITHUB_RATE_LIMIT`, other 403s to `GITHUB_FORBIDDEN`; visibility derived only from 200 `private` field.
- **Smart 401 Token Fallback**: Logs single WARN on 401 and retries once unauthenticated; logs one-line failure with token source and repo coordinates.
- **Dedicated Account Linking**: OAuth linking via `/api/v1/github/link/start` and `/callback` using HTTP session, preserving user auth and storing encrypted token with scope & login in `user_oauth_tokens`.
- **Status & Repo Picker**: Added `/status`, `/link` (DELETE), and `/my-repos` with search; frontend supports full-page OAuth redirect, private repos toggle, toast callbacks, and repo picker.

## 2026-10-12: Groq AI Migration, Plan Gate & Dynamic Content

- **Unified Groq Client**: Replaced legacy AI clients with `GroqClient` (supports GROQ and XAI keys), 120s timeout, 30 calls/hr rate limit, and exposed `aiEnabled` on `GET /api/v1/meta`.
- **Settings & UI Error Mapping**: Removed client-side key inputs from Settings; added disabled tooltips and friendly toast error messages for `AI_NOT_CONFIGURED`, `AI_RATE_LIMIT`, and `AI_FAILED`.
- **Brief Intake Overhaul**: Renamed to "Upload file", accepting 1 PDF or up to 5 images via `POST /brief/source/images` with Groq vision extraction; added auto-extract on save with "Reading the statement..." overlay.
- **Before We Plan Gate**: Added `rooms.plan_started_at` & `rooms.plan_notes` (Flyway V10), 409 `PLAN_NOT_STARTED` enforcement, and a pre-plan screen with brief preview, approved ideas, and notes autosave.
- **Dynamic Context Injection**: Updated `PromptBuilder` with full brief text (12k limit), approved ideas with authors, team skills, and hours; AI fills answer box without auto-saving.
- **User Display Names**: Replaced raw IDs across ideas feed, task modal, task activity, doc versions, team list, and branch map.
- **Dynamic Plan Regeneration**: Clean regeneration deletes and regenerates docs, phases, tasks, MVP, diagrams, demo script/shots, and pitch QA from plan without fake fallbacks.

## 2026-10-16: Product Brand Rename to [brackit]

- **Product Rebranding**: Renamed product from "Hackathon OS" to `[brackit]` (exact spelling: lowercase, square brackets included, no spaces) across user-facing surfaces, shell, documentation, templates, OpenAPI specification, and email layouts.
- **Source of Truth**: Defined `BRAND_NAME = "[brackit]"` and `BRAND_DESCRIPTOR = "the hackathon OS"` in `frontend/src/shared/constants/copy.ts`.
- **System Stability & Scope**: Retained code identifiers (Java packages `com.hackathonos`, database name `hackathon_os`, docker containers/volumes, local storage keys, and historical migrations) while updating public brand copy, download filenames (`brackit-docs.zip`), export headers, and OpenAPI title (`[brackit] API`).

