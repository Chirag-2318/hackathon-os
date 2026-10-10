# Redesign Progress

## Phases
- [x] Phase 0: Audit
- [x] Phase 1: Foundations (Font, tokens, base styles, primitives)
- [x] Phase 2: Shell (AppFrame, AppSidebar, PanelHeader)
- [x] Phase 3: Icons and interactions (TrayArrowIcon, StackIcon, micro-animations)
- [x] Phase 4: Home content (HomeHeader, ActiveRooms, RoomsList, HomeRail)
- [x] Phase 5: Responsive + accessibility (Tailwind breakpoints, aria attributes, reduced-motion)
- [x] Phase 6: Verification + polish (E2E tests pass, Tier 2 micro-interactions)

## Current Phase: Complete

All visual components have been redesigned to match the reference screenshots.
The Home page uses a CSS grid to adapt to responsive screen sizes, ensuring the sidebar and rail display properly.
All E2E tests for the Home Page and Room Overview are functioning as expected.
Auth fixtures for MSW were also correctly added to prevent 401 redirects and ensure mock testing can continue.

## Round 2
- [x] R0 Setup: read state, add `data-testid`s, add geometry test, save geometry-before.txt.
- [x] R1 Sidebar skeleton: F1, F2, F3, F4.
- [x] R2 Sidebar details: F5, F6, F7, F8, collapsed state check.
- [x] R3 Header and page alignment: F9, F10.
- [x] R4 Content polish: F11, F12, F13.
- [x] R5 Verify and report: final loop, full suite, lint, check constraints.

## Current Phase: Complete

## Round 3: Playbooks & Tool Directory Redesign

### Phase Checklist
- [x] R3-0 Audit and baseline
- [x] R3-1 Foundations
- [ ] R3-2 Shell glue
- [ ] R3-3 Playbooks list
- [ ] R3-4 Playbook dialog and Use flow
- [ ] R3-5 Tool directory
- [ ] R3-6 Responsive and accessibility
- [ ] R3-7 Verify and report

### R3-1 Foundations Notes
- Added CSS tokens to `src/index.css`: `--r-tag: 6px`, category background and foreground tints (`--cat-recording-*`, `--cat-video-*`, `--cat-diagrams-*`, `--cat-design-*`, `--cat-api-*`, `--cat-deployment-*`, `--cat-default-*`), registered in `@theme inline`, and typography role `.text-dialog-title` (20/28 600 -0.01em).
- Created helpers in `src/shared/lib/format.ts`: `formatCheckedDate`, `daysSince`, `formatHours`, `phaseHours`.
- Created tool category icon mapping in `src/features/tools/tool-categories.ts` with Lucide icons (`Clapperboard`, `Film`, `Workflow`, `Palette`, `Braces`, `Rocket`, `Wrench`), token class mappings, and ideation F6 heuristic phase hints.
- Created tool logos resolver in `src/features/tools/tool-logos.ts` and placeholder folder `src/assets/tool-logos/.gitkeep`.
- Created playbook icons mapping in `src/features/playbooks/playbook-icons.ts`.
- Created shared UI building blocks in `src/shared/ui/`: `PageContainer`, `PageHeading`, `Lozenge`, `FilterSearch`, `FilterSelect`, `ClearFiltersButton`, `EmptyState`, `ErrorRow`, `SegmentedTimeline`, and barrel export `src/shared/ui/index.ts`.
- Verified `tsc --noEmit`, ESLint on new files, and baseline regression spec (all 4 passed without updating snapshots).


### R3-0 Audit Notes
**(a) File map of the two pages and their routes:**
- In-app routes:
  - Playbooks: route `/app/playbooks` -> rendered in `src/app/routes/router.tsx` inside `HomeShellLayout`. Currently renders `PlaybookBrowsePage` (`src/features/playbooks/playbook-browse-page.tsx`). Detail route `/app/playbooks/:slug` -> renders `PlaybookDetailPage` (`src/features/playbooks/playbook-detail-page.tsx`).
  - Tools: route `/app/tools` -> rendered in `src/app/routes/router.tsx` inside `HomeShellLayout`. Currently renders `ToolDirectoryPage` (`src/features/prep/tool-directory-page.tsx`).
- Public routes:
  - Playbooks: route `/playbooks` -> renders `PlaybookBrowsePage` (`src/features/playbooks/playbook-browse-page.tsx`) wrapped in `LandingHeader` and `LandingFooter`.
  - Playbook detail: route `/playbooks/:slug` -> renders `PlaybookDetailPage` (`src/features/playbooks/playbook-detail-page.tsx`).
  - Public tools route: None (only `/app/tools` exists; tool directory was an in-app tab under `/app/tools`).

**(b) REAL field names for playbooks and tools and mapping from placeholders:**
- **Tools** (`src/features/prep/api/types.ts` `Tool`, `toolsFixture` in `src/features/prep/api/mocks/fixtures.ts`):
  - `id`: `id` ('t1', 't2', etc.)
  - `name`: `name` ('Recordly', 'Excalidraw', 'RepoClip', 'Scalar', 'Figma', 'Railway')
  - `category`: `category` ('Recording' | 'Video' | 'Diagrams' | 'Design' | 'API' | 'Deployment')
  - `description` (placeholder): `oneLineUse`
  - `cost`: `cost` ('Free' | 'Freemium' | 'Paid')
  - `license`: `license` ('Open source' | 'Proprietary')
  - `checkedAt` (placeholder): `lastChecked` (ISO date string, e.g. "2026-09-20")
  - `verified`: `verified` (boolean)
  - `url`: `url`
- **Playbooks** (`src/api/client.ts` `PlaybookDetail`, `playbookFixtures` in `src/mocks/fixtures.ts`):
  - `id`: `id` ('pb-sih', 'pb-devpost', 'pb-mlh', 'pb-sprint', 'pb-corporate', 'pb-solo')
  - `slug`: `slug`
  - `name`/`title`: `title`
  - `eventType`/`type` (placeholder): `eventType` (string caption, e.g. "36-hour team", "48-hour online", "4-hour sprint", "1-week internal", "Weekend solo")
  - `teamSize`: `teamSize` (number | null)
  - `teamSizeLabel`: `teamSizeLabel` (e.g. "Team of 6", "1-4 members", "1 member")
  - `phaseCount`: `phaseCount` (number, e.g. 7, 5, 4, 3)
  - `phases`: `phases` (string, e.g. "7 phases")
  - `illustrationKey`: `illustrationKey`
  - `defaultRubric`: `defaultRubric` (string[] -> starter rules / rubric defaults)
  - `checklistPreview`: `checklistPreview` (string[] -> deliverables list)

**(c) Which playbook fields exist for phases, shares, checkpoints, deliverables, duration, description:**
- `phases`: Only `phaseCount: number` and string `phases: string` (e.g. "7 phases") exist on `PlaybookDetail`. Individual phase objects with weights/shares and exit checkpoints do NOT exist in the API / fixture data.
- `shares`: No phase weight/share data exists. Per Section 6.2 and Rule 8, card Row 2 mini timeline is omitted when shares data is absent.
- `checkpoints`: No per-phase checkpoint field exists. Count of checkpoints is omitted in Details panel if missing.
- `deliverables`: `checklistPreview: string[]` exists and is rendered as Deliverables with check icon.
- `duration`: Numeric total duration in hours is NOT present on `PlaybookDetail` (only textual `eventType`, e.g. "36-hour team"); duration formatting is omitted where data does not exist.
- `description`: No description field exists on `PlaybookDetail` (only `title` and `eventType`); per Section 6.3, the About section is skipped when description data does not exist.
- `rules`/`rubric`: `defaultRubric: string[]` exists and is rendered as Starter rules.

**(d) Where the leaked navbar comes from and whether public routes exist:**
- The leaked navbar comes from `LandingHeader` inside `PlaybookBrowsePage` (`src/features/playbooks/playbook-browse-page.tsx`), which was directly mounted at both `/playbooks` (public route) and `/app/playbooks` (in-app route).
- Public routes DO exist: `/playbooks` and `/playbooks/:slug`. They must keep `LandingHeader` and `LandingFooter` intact.
- The solution: Extract pure content component `PlaybooksView` (without marketing header/footer) and render it in `PageContainer` for `/app/playbooks`, while `/playbooks` continues to wrap `PlaybooksView` with `LandingHeader` and `LandingFooter`.

**(e) How Create Room dialog is opened and where its state lives:**
- Create Room dialog is `CreateRoomDialogOverlay` in `src/app/overlays/create-room-dialog.tsx`, mounted in `GlobalOverlays`.
- Open state lives in Zustand `useOverlayStore` (`src/app/providers/overlay-store.ts`), accessed via `useOverlay('create-room-dialog')`.
- `useOverlay.open(payload)` already supports passing data to `overlayData['create-room-dialog']`.
- We will support `{ defaultTemplateId?: string }` payload so when opened via "Use this playbook", `selectedTemplateId` defaults to the chosen playbook id without affecting My rooms ("New room" calls `open()` without payload).

**(f) Which existing tests touch these pages:**
- `e2e/playbooks.spec.ts`: Tests the public `/playbooks` route (heading "Playbook Templates", cards, filters, and detail navigation).
- `e2e/situation.spec.ts`: Checks navigation from onboarding situation picker to `/playbooks`.
- `e2e/landing.spec.ts`: Checks landing page playbooks preview section.
- `e2e/shell-geometry.spec.ts`: Checks sidebar navigation item `nav-row-playbooks` and `nav-row-tools`.
- No existing tests touch `/app/playbooks` or `/app/tools` directly (they will be covered by the new `e2e/resources-pages.spec.ts`).

