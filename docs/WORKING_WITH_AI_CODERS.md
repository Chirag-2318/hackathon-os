# Working with AI Coders on Hackathon OS

A developer and prompt engineering guide for collaborating efficiently with AI models on this codebase.

---

## 1. Cheap-and-Fast Prompting Rules

1. **File-Scoped Prompts with Named Paths**: Always specify the exact file paths to inspect and modify. Never instruct the model to perform unbounded repository-wide searches.
2. **Concise Output Limits**: Demand summaries of at most 10–12 lines. Avoid voluminous regurgitations of unchanged code.
3. **Never Ask for Tests Inside Feature Prompts**: Keep automated test generation decoupled from core feature implementations to conserve token bandwidth and execution time.
4. **One Concern per Prompt**: Decompose complex tasks into atomic units (e.g., first API client, then component layout, then hook integration).
5. **Reuse Shared Design System**: Mandate importing components exclusively from `src/design` (`Button`, `Card`, `EmptyState`, `Toast`, `SpotIllustration`, etc.) rather than writing ad-hoc styles.
6. **Single Build Run at the End**: Instruct the model to execute the compilation/build step (`npm run build` or `mvn compile`) exactly once at the conclusion of changes, resolve errors, and stop.

---

## 2. Reusable Prompt Header

Paste this block at the top of feature or bugfix prompts:

```markdown
ROLE: Senior Engineer on Hackathon OS. Work strictly in the named files. Reuse the shared design system in src/design and existing backend services. Do not add dependencies without asking. Do not write test files. Do not perform repo-wide scans. Run the production build or compile step once at the end, fix errors, and stop. Respond with at most 12 lines summarizing what changed.
```

---

## 3. Codebase Architectural Map

### Frontend (`frontend/src/`)
- `app/`: Application routing (`router.tsx`), global navigation shells (`ResponsiveShell`), and top bar.
- `design/`: Shared tokenized design system (`src/design/index.ts`), live SSE hooks (`live.tsx`), spot illustrations (`spot-illustrations.tsx`), and error/empty states.
- `features/`:
  - `home/`: Main dashboard, smart header, and sprint status.
  - `room/`: My rooms grid, join code dialog, and room settings.
  - `room-overview/`: Room hero, stage clock, coach strip, and activity log.
  - `brief/`: Problem statement input, source parsing, and confirmed fields.
  - `ideate/`: Idea card board, voting, and leader approval.
  - `plan/`: 5-step milestone planner and validation gate.
  - `board/`: Sprint Kanban board, task details, assignees, and dependencies.
  - `docs/`: Document vault, Markdown preview/editor, autosave, and export.
  - `summary/`: Read-only shareable room summary, milestone offsets, and print CSS.
  - `settings/`: User profile, appearance, notifications, and read-only AI status.
- `services/`: Strongly-typed API client services wrapping `/api/v1/*`.

### Backend (`backend/src/main/java/com/hackathonos/backend/`)
- `rooms/`:
  - `RoomService`: Room lifecycle, creation, update, and export archives.
  - `RoomStageService`: Workflow stage advancement, validation checks, and reverts.
  - `RoomTimeService`: Hackathon countdown timers, freeze deadlines, and elapsed percent.
  - `NextStepService`: Intelligent "Next up" route recommendations.
- `common/security/`:
  - `RoomAccessService`: Leader and membership authorization guards.
  - `CurrentUser`: Authenticated session resolver.
- `ai/`:
  - `AiService`: Centralized gateway proxying upstream LLMs with zero client keys.
- `notifications/`:
  - `NotificationService`: In-app notification creation, unread counts, and batch read.
- `events/`:
  - `RoomEventService`: SSE stream event dispatcher and fallback event logs.
