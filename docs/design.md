# design.md: UI/UX Specification

**Status:** Step 4 of the project (frontend design). Follows `problem.md`, `ideation.md`, `tech_stack.md`.
**Written:** 20 Sep 2026
**Scope:** Everything visible: look, layout, pages, components, states, content, and component-library choices. **Excluded on purpose:** application code, prompts, and all motion (transitions, hover/entrance effects, loading animations, drag animations). Motion lives in a separate `animations.md`. Where a component has an animated behavior, this file specifies only its *static* appearance.

**IDs used:** Screens `S01-S32`, components `C01-C40`, references `R1-R6`. Feature IDs `F1-F22` are from `ideation.md`; problem IDs `P-/L-/W-/D-` are from `problem.md`.

---

## 0. How this document is built (read once)

1. **Your references were analyzed at pixel level.** Every color quoted as "ref" was sampled from your six images (Section 2). Layout, component anatomy, and composition were copied wherever they fit the product.
2. **Where a reference could not be copied literally, the deviation is listed and justified** (Section 1.3). The main reasons are accessibility (several reference colors fail contrast), density (reference text is often 10-11px), and intellectual property (the illustration art and brand names belong to the reference designers).
3. **Component-library choices come from a survey of 30+ libraries and tools** (Section 12). Anything I could not verify is marked.
4. **Precedence if two rules conflict:** accessibility (Section 10) > component spec (Section 4) > page spec (Section 6) > references (Section 1).

---

## 1. Design direction

### 1.1 One-paragraph philosophy
**Calm, warm, and focused: a workspace that hackathon teams can read in two seconds while sleep-deprived.** The look is soft and rounded (pastel fills, large radii, pill controls) from your references, but disciplined like GitHub or Notion: one neutral canvas, one brand color, flat cards, real data in every screen, every state designed. Color carries meaning (time, progress, danger), not decoration. The dark sidebar and dark callout cards give each screen a single strong anchor.

### 1.2 What "not vibe-coded" means here (the rules that make it look team-built)
Research on why AI-generated UIs look generic converges on one point: the defaults have no decisions behind them. The fix is exact, written decisions. So this file:
- fixes **exact hex values, font names, pixel sizes** (not descriptions);
- lists **explicit banned patterns** (Section 13);
- requires **realistic content, never placeholder names** (Section 8);
- defines **every state** (empty, loading, error, offline, no-permission) for every screen (Section 9);
- uses **one system** (one icon set, one font family, one radius scale, one elevation scale).

### 1.3 The six references: what each contributes

| Ref | What it is | Role in the product | Fidelity |
|---|---|---|---|
| **R1 CourseCo** (lavender, dark sidebar) | Learning dashboard | **App shell and Home.** Sidebar, greeting header, feature cards with progress rings, list rows with letter tiles, right rail with illustrated hero + week strip + upcoming list, upgrade card | **Copied nearly 1:1** |
| **R2 LeadNest** (sage-gray, kanban) | CRM dashboard | **Structural backbone of the product.** Task board, KPI tiles, area chart, activity heatmap, dark callout card, members list, sort/filter bar | **Copied nearly 1:1; most important reference** |
| **R3 Hebats** (warm orange, bento) | Habit tracker | **Checklists, prep, retro.** Dashed checklist container, ringed-day calendar, integration tiles, highlighted-bar chart, dark "Wrapped" card, map/event card | **Copied for the parts that fit**; weather/music widgets adapted |
| **R4 Profile dashboard** (mint, pill nav) | Freelancer profile | **Phase Track, Team page, room cards, inbox.** Pill nav with black active pill, detail rows, pastel project cards, message list | **Partial; weakest fit** (profile-first layout has low information density) |
| **R5 Calendar** (dark glass, pastel blocks) | Calendar app | **Schedule screen** (hackathon clock). Week/day grid, pastel event blocks, mini calendar, "next up" card, layers list, create-event popover | **Copied nearly 1:1**; glass blur replaced by solid dark |
| **R6 Dark dashboard** (cream, orange, pink) | Dark productivity | **Dark theme and Speed Mode.** Icon rail with avatars, pink FAB, cream selected states, yellow event card, category list with badges | **Copied for dark theme and Speed Mode** |

**Choices you asked for:** *Adapted most fully:* R2 (board) and R1 (shell). *Used least:* R4 (only pill nav, pastel cards, detail rows, inbox). *No reference ignored completely.* From R3 the music/habit content is dropped; from R6 the gradient photo card is dropped.

### 1.4 Deviations from the references (and why)

Deviation IDs are **X1-X11** (not to be confused with `problem.md` D-IDs, which are rule-based eliminations).

| # | Reference detail | What we do instead | Reason |
|---|---|---|---|
| X1 | White text on lavender `#8E8EF1` (R1 active pill, buttons) | **Dark ink on lavender fills**; white text only on darker lavender `#5F5FDC` | Measured contrast of white on ref lavender is **2.88:1** (needs 4.5:1) |
| X2 | Light-gray secondary text (~`#A9A9A9` on white) | Muted ink `#5C6068` | Ref gray measures **2.35:1** |
| X3 | 10-11px meta text | **12px minimum**, body 14px | Legibility and WCAG-friendly sizing |
| X4 | White text on blue tag `#5880D1` (R2) | Soft pastel chip with ink text (default) or darker blue `#3B63B8` with white | Ref combo measures **3.87:1** |
| X5 | Outer colored "frame" around each app (R1 lavender, R3, R4) | Not reproduced; app fills the viewport. Lavender stays as the brand color | The frames are presentation backdrops, not product UI |
| X6 | Character illustrations and mascots in R1/R3 | **CC0 illustrations recolored to our palette** (Section 2.9) | The reference art belongs to its designers |
| X7 | Brand names, logos, sample data ("CourseCo", "LeadNest", "Lord") | Our own brand and realistic hackathon content | IP and realism |
| X8 | Glass blur sidebar (R5) | Solid dark surface | Blur is decorative, hurts readability, and is a common AI-UI tell |
| X9 | Gradient photo event card (R6) | Flat pastel card with illustration | Keep UI surfaces flat; gradients only inside artwork |
| X10 | Tilted "dragging" card (R2) | Static "lifted" style (blue tint + elevation) | Tilt is a motion effect; deferred to `animations.md` |
| X11 | Different page backdrop per reference (cool white, sage, mint, warm white) | **One canvas** per theme (R2 sage-neutral), pastel washes used sparingly | Consistency is what makes a UI look team-designed |

---

## 2. Foundations

### 2.1 Color: light theme

Marked **ref** = sampled from your images. **derived** = computed by me (tints/shades) and contrast-checked.

**Neutrals**

| Token | Hex | Source | Use |
|---|---|---|---|
| `canvas` | `#EDEEE6` | ref R2 | App background |
| `surface` | `#F6F8F4` | ref R2 | Cards, panels |
| `surface-raised` | `#FFFFFF` | ref R1 | Popovers, menus, dialogs, highlighted cards |
| `surface-sunken` | `#E3E5DA` | derived | Tracks, table stripes, code background |
| `border` | `#DADCD2` | derived | Decorative dividers, card outlines |
| `border-strong` | `#C7CAC4` | ref R2 | Chips, separators that need weight |
| `border-input` | `#8A8E86` | derived | **Form control outlines** (3.12:1 against surface) |
| `ink-strong` | `#070707` | ref R1 | Sidebar, headings on light fills |
| `ink` | `#2A2D32` | ref R2 | Body text, dark callout card fill |
| `ink-muted` | `#5C6068` | derived | Secondary text (5.40:1 on canvas) |
| `ink-disabled` | `#9A9E96` | derived | Disabled controls only |

**Brand (lavender)**

| Token | Hex | Source | Use |
|---|---|---|---|
| `lav-50` | `#F2F2FE` | derived | Selected-row wash |
| `lav-100` | `#E4E4FB` | derived | Hover wash on light |
| `lav-200` | `#C4C3F6` | ref R1 | Soft chips, tag fills |
| `lav-400` | `#A9A9F4` | derived | Primary in dark theme |
| `lav-500` | `#8E8EF1` | ref R1 | **Brand fill** (active nav pill, selected day). Always with dark ink text |
| `lav-600` | `#5F5FDC` | derived | **Solid button fill with white text** (5.05:1); focus ring |
| `lav-700` | `#4B4BC4` | derived | Links and text-on-canvas (5.79:1) |

**Sidebar and callouts (dark on light theme)**

| Token | Hex | Source |
|---|---|---|
| `sidebar` | `#070707` | ref R1 |
| `sidebar-text` | `#E8E8EA` | derived (16.5:1) |
| `sidebar-muted` | `#9A9AA3` | derived (7.2:1) |
| `callout` | `#2A2D32` | ref R2 (white text 13.8:1) |

**Pastel fills (always paired with `ink` text; never with muted text)**

| Name | Hex | Source | Used for |
|---|---|---|---|
| Lavender | `#C4C5FC` | ref R1 | Phase: Ideate; role: Backend |
| Pink | `#FCC4E0` | ref R1 | Phase: Retro; role: Design |
| Sun | `#FDE781` | ref R1 | Attention, highlights |
| Cream | `#FBECBE` | ref R4 | Card wash (yellow) |
| Sky | `#B7D9FF` | ref R5 | Phase: Plan; role: Frontend; info |
| Ice | `#D7EDFB` | ref R4 | Phase: Prep |
| Green | `#A5EFBE` | ref R5 | Role: QA; positive states |
| Lime | `#C9EF84` | ref R2 | Phase: Build; success chips; delta chips |
| Peach | `#F9B672` | ref R3 | Phase: Ship; time/deadline |
| Amber | `#FDD484` | ref R5 | Phase: Freeze; role: Domain |
| Blush | `#FBD9D7` | ref R4 | Card wash (pink) |
| Violet | `#C1AFFD` | ref R5 | Role: ML/AI |
| Mint wash | `#E8F3EB` | ref R4 | Team-page card wash |

**Semantic colors (each has a fill, a solid, and a text/icon variant)**

| Meaning | Fill (ink text) | Solid (white text) | Text/icon on canvas | UI stroke on surface |
|---|---|---|---|---|
| Success / progress | Lime `#C9EF84` | `#3F6B0F` (6.32:1) | `#3F6B0F` (5.41:1) | `#4F8F1A` (3.72:1) |
| Info | Sky `#B7D9FF` | `#3B63B8` (5.73:1) | `#3B63B8` (4.91:1) | `#5880D1` ref (3.62:1) |
| Warning / attention | Yellow `#F7CB2D` ref R2 | not used | `#7A5C00` (5.35:1) | `#A67C00` (3.57:1) |
| Time / deadline | Peach `#F9B672` | `#B34700` (5.50:1) | `#B34700` (4.71:1) | `#EB6404` ref R6 (3.09:1 on surface only) |
| Danger / blocked | Coral `#F77271` ref R3 (ink text 6.60:1) | `#C23A3A` (5.30:1) | `#A82D2D` (5.84:1) | `#E0524F` (3.58:1) |

Rules: **yellow is never used as a line or thin icon on light backgrounds** (1.45:1). **Coral is a fill only** (as a stroke it measures 2.59:1). **`#EB6404` orange is not used as a stroke on the canvas** (2.83:1); use it on surface or use `#B34700`.

### 2.2 Color: dark theme (from R6)

| Token | Hex | Source | Use |
|---|---|---|---|
| `sidebar` | `#0E0E0E` | derived | Sidebar / icon rail |
| `canvas` | `#131313` | ref R6 | App background |
| `surface` | `#1C1C1C` | ref R6 | Cards |
| `surface-raised` | `#2A2A2A` | ref R6 | Popovers, hover, callouts |
| `border` | `rgba(255,255,255,0.08)` | derived | Dividers |
| `border-input` | `#6B6B6B` | derived (3.20:1) | Form controls |
| `ink` | `#F5F3EE` | derived from ref cream/white (15.4:1) | Body text |
| `ink-muted` | `#AB9C9F` | ref R6 (6.48:1) | Secondary text |
| `primary` | `#A9A9F4` (`lav-400`) | derived (7.85:1) | Primary actions, links, focus ring |
| `on-primary` | `#14151A` | derived (8.39:1) | Text on primary |
| `selected-fill` | `#F7EBD4` cream | ref R6 | Selected calendar day, selected chips; text `#131313` (15.7:1) |
| Accents | Yellow `#F8B315`, Orange `#FCB160` (solid `#EB6404`), Pink `#F36498`, Purple `#C09BF0`, Lime `#C9EF84`, Blue `#7FA2EA`, Coral `#F77271` | ref R6 / R2 / R3 / derived | All measure at least 5.7:1 on `#1C1C1C` |

Pink FAB `#F36498`: **icon and label use ink `#14151A` (6.15:1), not white (2.96:1).**
Pastel fills remain available in dark theme for tags and blocks, always with dark text.

### 2.3 Typography

| Role | Font | Notes |
|---|---|---|
| UI and headings | **Manrope** (variable, weights 200-800) | Open-source, on Google Fonts; has tabular figures; geometric, semi-rounded, close to the references' type. Self-host. |
| Code, API paths, JSON, commit hashes | **JetBrains Mono** | Regular 400, medium 500 |
| Fallback stack | system-ui, "Noto Sans Devanagari", "Noto Sans", sans-serif | **Manrope has no Devanagari glyphs**; Hindi/Marathi content must fall back to a Devanagari-capable font |

**Numbers:** enable tabular figures on countdowns, KPIs, table columns, and chart labels.

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| Display | 40 / 48 | 800 | Countdown hero numerals |
| Page greeting | 32 / 40 | 800 | "Welcome back, Aarav" (R1) |
| H1 page title | 28 / 36 | 700 | Page titles |
| H2 section title | 20 / 28 | 700 | Card titles, section headers |
| H3 | 16 / 24 | 600 | Sub-sections |
| Body | 14 / 22 | 500 | Default |
| Body strong | 14 / 22 | 700 | Emphasis, list titles |
| Label | 13 / 18 | 600 | Form labels, table headers |
| Caption | 12 / 16 | 600 | **Minimum size.** Meta, timestamps, chip text |
| Code | 13 / 20 | 400 | Mono |

Rules: **sentence case everywhere** (no all-caps section labels), max line length 72 characters for prose, no gradient text, no letter-spacing tricks.

### 2.4 Spacing, layout grid, breakpoints

- **Base unit 4px.** Scale: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Card padding:** 20 (standard), 24 (feature cards and hero panels). **Gap between cards:** 16 in dense areas, 24 between major regions.
- **Desktop shell (≥1280):** sidebar 248px (collapsed rail 72px) · top bar 64px · main content fluid with max width 1440 · optional right rail 360px.
- **Grid:** 12 columns, 24px gutters in main content; bento zones use CSS-grid areas rather than equal thirds.
- **Breakpoints:** 360 (small phone) · 640 · 768 · 1024 · 1280 · 1536.

| Density | Row height | Control height | Where |
|---|---|---|---|
| Comfortable | 56 | 40 | Default (as references) |
| Compact | 40 | 32 | Tables, Board list view, Speed Mode |

### 2.5 Shape
| Token | Value | Use |
|---|---|---|
| `r-chip` | 8 | Tags, chips |
| `r-control` | 12 | Buttons, inputs, selects |
| `r-card` | 20 | Cards, list containers |
| `r-panel` | 28 | Hero panels, dialogs, sheet top corners |
| `r-pop` | 16 | Popovers, menus, tooltips |
| `r-pill` | 999 | Nav pills, segmented controls, avatars, primary hero CTAs |

### 2.6 Borders and elevation
- **Cards are flat:** fill contrast plus a 1px `border` (light) or none (dark). No shadow on ordinary cards.
- **Shadows only on floating layers.**

| Level | Where | Value |
|---|---|---|
| e0 | Cards, list rows | none |
| e1 | Feature cards (R1 cards), sticky bars | 0 1px 2px rgba(20,22,26,0.06) |
| e2 | Popovers, menus, dragged card (static lifted state) | 0 8px 24px rgba(20,22,26,0.10) |
| e3 | Dialogs, sheets, command palette | 0 16px 48px rgba(20,22,26,0.18) |

In dark theme, elevation is expressed by lighter surface (`surface` to `surface-raised`), not by shadow.

### 2.7 Iconography
- **One set: Lucide** (shadcn default), **1.5px stroke**, sizes 16 / 20 / 24, color follows text. Matches the outline icons in all six references.
- Icons always accompany a text label in navigation; icon-only buttons need a tooltip text and accessible name.
- **No emoji as UI icons.** Emoji allowed only in user-generated content (room icon, reactions) and the single greeting wave on Home (R1, R3).

### 2.8 Avatars
- Sizes 24 / 32 / 40 / 56. Circle. User photo (from GitHub/Google) or **initials on a pastel fill** (color chosen by stable hash of the user id from the pastel list; ink text).
- Stacks overlap by 8px with a 2px `surface` ring; show up to 3 then a "+N" count.
- Presence dot (8px, lime with `surface` ring) only on team views.

### 2.9 Illustration
- Style: flat, friendly, pastel, people-focused (matches R1/R3).
- **Source:** Open Peeps and Humaaans (both CC0 by Pablo Stanley, mix-and-match figures) recolored to the pastel list; unDraw for spot scenes (free without attribution, but its license forbids redistributing packs or embedding programmatically on another service). **Avoid** Storyset free tier (requires attribution) and Blush (paid for commercial use).
- **One illustration style across the product.** Used only in: Home hero panel, Submission hero, empty states, sign-in, landing.

### 2.10 Charts palette
Series order: blue `#5880D1` · lime `#C9EF84` · light blue `#B9D4FE` · peach `#F9B672` · violet `#C1AFFD` · coral `#F77271`. Every chart has direct labels or a legend, and **color is never the only encoding** (also position, shape, or text).

---

## 3. App shell and navigation

### 3.1 Desktop shell (from R1 + R6)

```
+---------+------------------------------------------------------------+------------+
| C01     | C02 Top bar: breadcrumb | search pill | clock chip | bell | you |            |
| Sidebar +------------------------------------------------------------+ Right rail |
| (dark)  | C03 Phase Track (room pages only)                          | (optional) |
|         +------------------------------------------------------------+            |
|         |  Page header (title, actions)                              |            |
|         |  Page body                                                 |            |
+---------+------------------------------------------------------------+------------+
```

**C01 Sidebar (R1).** Floating dark rounded container (`r-panel`), 248px, 12px margin from viewport edge. Logo top. Nav items 40px tall, icon + label, `sidebar-muted` text; **active item = full-width `lav-500` pill with ink text (`#070707`)**. Two groups:
- **Workspace:** Home · My rooms · Playbooks · Tool directory · Portfolio · Settings
- **This room** (appears inside a room, grouped by hackathon flow, with a dot on the current phase's group):
  - *Set up:* Overview · Brief · Team · Prep
  - *Decide:* Ideate · Plan · Docs
  - *Build:* Board · Schedule · MVP · GitHub · APIs · Diagrams
  - *Ship:* Pitch · Demo · Submit · Readiness
  - *After:* Retro
- **Bottom slot:** in Workspace, the **upgrade card** (R1 "Premium account": ice-blue fill `#AEE6FF`, small illustration, "Get Pro" outlined button). In a room, the **Next-step callout** (R2 dark "Priority deal" card): one sentence about the most urgent thing plus a white button (e.g., "Feature freeze in 3h 20m. 4 tasks still open." / "Review tasks").
- **Collapsed state (72px rail, R6):** icons only, tooltip labels, team avatar column, pink blocker FAB at bottom.

**C02 Top bar (R1 + R3 chrome).** Left: breadcrumb (Workspace / Room name / Page). Center: **search pill** (white, magnifier, "Search tasks, docs, rules", `Ctrl K` hint); it is a button that opens the command palette. Right: **clock chip** (peach fill, clock icon, "Freeze in 3h 20m"; hidden outside a room), bell with count badge, avatar menu.

**C03 Phase Track (R4 pill nav).** A pill group under the top bar: **Prep · Ideate · Plan · Build · Freeze · Ship · Retro**. Current phase = **black pill** (`#0B0C0C`, white text); completed phases show a check; future phases muted. Each pill uses its phase color as a 6px dot. Right side: Rubric button (opens the Rubric drawer) and Decision-timer chip when a decision is open. Clicking a phase filters Board and Plan to that phase; it does not navigate away.

### 3.2 Global overlays

| Overlay | Trigger | Content |
|---|---|---|
| **Command palette (C26)** | `Ctrl K` or search pill | Jump to page, search tasks/docs/rules, actions ("Add task", "I'm blocked", "Copy demo script"), recent items |
| **Rubric drawer** | Rubric button; `R` | Rubric criteria with weights, criteria coverage status, pinned rules, AI-use policy |
| **Room feed slide-over** | Bell; `F` | Inbox-style list (R4): announcements, blockers, mentions, system events |
| **Task drawer** | Click any task | Full task detail (Section S14) |
| **Blocker dialog** | Pink FAB; `B` | One field ("What's blocking you?") plus optional task link; notifies captain |
| **Scope Guard dialog** | Adding a task after feature freeze | Question "Does a judge need to see this?" with three answers (Yes, add / Park it / Cancel) |
| **Invite dialog** | Team page, onboarding | Link, role choice, copy button |

### 3.3 Mobile shell (≤767)
- Top bar simplified: room name, clock chip, bell.
- **Bottom tab bar (5):** Now · Board · Ideas/Plan (context) · Ship · More. Center-right floating pink **blocker button**.
- Sidebar becomes a full-height sheet opened from "More".
- Right rail content moves below main content as stacked cards.

### 3.4 Speed Mode shell (S31; R6)
Icon rail (72px) with team avatars (presence) and the pink blocker FAB; **dark theme by default (user can override)**; single-column focus content; compact density. Detail in S31.

---

## 4. Component specifications

Each component notes its origin (R#) and the library that supplies the base (Section 12). "State" lists static appearance only.

| ID | Component | Anatomy and rules | From | Base |
|---|---|---|---|---|
| **C05** | **Button** | Sizes 32/40/48. Variants: **Primary** (`lav-600` fill, white text), **Dark** (`ink`/`#2A2D32` fill, white text; used for "Add task", "Add customer" style CTAs, R2), **Soft** (`lav-200` fill, ink text), **Outline** (1px `border-strong`, ink text; R1 "Submit →"), **Ghost**, **Danger** (`#C23A3A`, white). Radius `r-control`; hero CTAs are pill. Optional trailing arrow icon. States: default, hover (one step darker/lighter fill), pressed, focus (2px `lav-600` ring, 2px offset), disabled (`ink-disabled` text, `surface-sunken` fill), loading (spinner slot, label kept). | R1, R2, R3 | shadcn Button |
| **C06** | Icon button | 32/40 circle or rounded square, 20px icon, tooltip required. Circular "contact" buttons (R4) for message/call/repo actions. | R4 | shadcn |
| **C07** | **Chip / tag** | Height 24, padding 8/10, `r-chip`, caption text 12/600. **Soft style (default):** pastel fill + ink text. **Solid style:** `#2A2D32` fill + white text (e.g., "Priority") or `#3B63B8` + white. Optional leading dot or icon. | R2, R1 | shadcn Badge |
| **C08** | Status chip / dot | Semantic fill + text label always shown (never dot alone): Not started, In progress, Blocked, In review, Done, Verified, Failing, Working. | R4 "Online", R2 | Badge |
| **C09** | Avatar / stack | See 2.8 | R1, R2 | shadcn Avatar |
| **C10a** | **Feature card** (R1) | `surface-raised`, `r-card`, e1. Layout: illustrated avatar tile (top-left 44px), tag chip (top-right), title (H2, 2 lines max), meta row with "Participants" label + avatar stack and "Progress" label + ring (C11), footer row with author icon + name and lessons-style meta ("12 tasks"). | R1 | shadcn Card |
| **C10b** | **List row with identity tile** (R1) | Row 64px on `surface`; 40px rounded-square **tile with 2-letter code** on a pastel fill; title (Body strong) + meta line (avatar, name, time) ; trailing ring/percent + 3 small meta icons with counts. Whole row is one target. | R1 | shadcn Item |
| **C10c** | **Pastel project card** (R4) | Fill = pastel by category; date chip (white pill) top-left; info-icon top-right; title H3; stage label + "Progress" chip with % ; 4px progress bar in darker tone; avatar stack; "N days left" chip bottom-right. | R4 | Card |
| **C10d** | **Dark callout card** (R2 "Priority deal") | `#2A2D32`, `r-card`, white text. Title (H3), 2-line body in `#C7CAC4`, **white full-width button with ink text**. Used for the single most important action on a screen. **Maximum one per screen.** | R2 | Card |
| **C10e** | **Dashed checklist container** (R3 "Today's Todos") | Outer 1.5px dashed `border-strong` region (`r-card`) holding a raised white list card. | R3 | Card |
| **C10f** | **KPI tile** (R2) | `surface`, `r-card`. Label (Body, muted), value (Display-ish 40/48, tabular), delta chip (lime fill, ink text, e.g., "+6%"; coral fill for negative). Optional 24px sparkline. | R2 | Card + chart |
| **C10g** | **Hero illustration panel** (R1 right rail) | `r-panel`, ice-blue `#AEE6FF` field with CC0 illustration; bell + avatar overlay top-right (only on Home). Holds countdown in Submission/Overview variants. | R1 | custom |
| **C11** | **Progress ring** | 36 or 56px, 3px stroke; track `surface-sunken`; value stroke `#4F8F1A` (3.72:1); percent in Caption/Body strong beside or inside. | R1 | SVG |
| **C12** | Progress bar | 4 or 8px tall, `r-pill`, track `surface-sunken`, fill = category color one step darker. Percent as text nearby. | R4, R5 | shadcn Progress |
| **C13** | **Task card** (R2 kanban card) | `surface-raised`, `r-card` 16, padding 16. Top row: tag chip (left) + kebab (right). Title (Body strong, 2 lines). Description (Body, muted, 2 lines). **Owner row:** 32px avatar + name (Body strong) + role (Caption muted). **Footer row:** due-date icon + date · attachment icon + count · comment icon + count. States: default; hovered (border-strong); **selected/drag-lifted = `#B6D2F3` fill + e2 (static)**; blocked (coral chip + `#A82D2D` "Blocked" text); done (title muted, check chip). | R2 | custom on Kibo/ReUI Kanban |
| **C14** | **Kanban column** | Header: title (H2) + **dark circular count pill** (`#2A2D32`, white number, 24px). Column background transparent on canvas; 12px gap between cards; column width 280-320. | R2 | Kibo UI / ReUI Kanban |
| **C15** | **Data table** | Header row 40, Label style; rows 56/40; zebra off; hover row `lav-50`; sticky header; column menu; sort arrows; filters bar above (search, chips, "Filters" button); pagination footer or virtualized. Numeric columns right-aligned, tabular. | R2 | shadcn Data Table (TanStack) ; ReUI Data Grid for heavy tables |
| **C16** | **Form controls** | Height 40 (32 compact), `r-control`, 1px `border-input`, surface fill, label above (Label 13/600), helper text below (Caption), error text `#A82D2D` with icon. Includes input, textarea, select, combobox, checkbox (20px, `r-chip` 6), radio, switch, slider, date/time picker, segmented. | R1, R5 | shadcn Field, Input, Select, Combobox |
| **C17** | **Segmented control** | Pill container `surface-sunken`; selected segment = white (light) or cream (dark) with ink text; used for Month/Week/Day (R5), mode switches, view toggles. | R5 | shadcn Toggle Group / Tabs |
| **C18** | **Day pill / week strip** | 56×64 rounded (`r-pill` 16) with weekday (Caption) and date (H3); **selected = `#202020` fill, white text** (R5) or `lav-500` with ink (R1); today gets a 2px ring. | R1, R5 | custom on react-day-picker |
| **C19** | **Mini calendar** | Month grid 7×6, 32px cells; selected = `lav-500`/purple `#B390EA` circle with ink text (R5); event days show a 4px dot; **ringed days** (R3) for scheduled sessions; dark-theme selected = cream circle (R6). | R3, R5, R6 | shadcn Calendar (react-day-picker) |
| **C20** | **Time grid** | Hour labels left (Caption muted), 64px per hour default, hairline rows, current-time line in `#E0524F` with a dot, weekend/off-hours tinted `surface-sunken`. | R5 | FullCalendar time grid (see §12) |
| **C21** | **Event block** | Pastel fill by category, `r-control` 12, padding 10: time range (Caption), title (Body strong), avatar stack; optional image thumbnail with download-style icon overlay; dashed empty "add" slot (R5) on hover-target areas. | R5 | custom content in calendar |
| **C22** | **Create popover form** | `surface-raised`, `r-pop`, e2, 320px: title input (H3 size, borderless), rows with icon (date, time, place), tag chips row, avatar stack + "+" dashed circle, footer: **Dark "Add" button + kebab**. | R5 | shadcn Popover + Field |
| **C23** | **Checklist row** | 56px: 32px identity icon tile · title (Body strong) · meta (clock icon + time; pin icon + place) · trailing 24px checkbox. **Done:** title struck through and muted, checkbox becomes green `#3F6B0F` check on white. | R3 | shadcn Checkbox + Item |
| **C24** | **Detail row** | 56px bordered row (`r-control` 14): radio-dot leading, label (Caption muted) over value (Body strong), trailing action icon button, optional status chip (e.g., green "Online"). | R4 | shadcn Item |
| **C25** | **Dialog / Sheet / Drawer** | Dialog 480/640, `r-panel` 24, e3, header with title + close, footer with actions right-aligned (primary right). Sheet (right, 480-560) for task drawer and room feed. Mobile: bottom sheet with top corners `r-panel`. | R5 | shadcn Dialog, Sheet, Drawer |
| **C26** | **Command palette** | 640px, search field, grouped results with icon, shortcut hints (kbd). | new | shadcn Command |
| **C27** | **Toast / banner** | Toast bottom-right, `#2A2D32`, white text, one action. Banners full-width under top bar for: offline, freeze imminent, submission in last hour, rules changed. | R2 (dark tooltip style) | shadcn Toast/Sonner |
| **C28** | **Empty state** | Illustration (CC0, 120px), H3 headline, one sentence of specific guidance, one primary action, optional secondary link. Never just "No data". | R1 | shadcn Empty |
| **C29** | **Skeleton** | Static placeholder shapes matching the final layout (lines, tiles, cards) in `surface-sunken`. | (state) | shadcn Skeleton |
| **C30** | **Code block** | `surface-sunken`, `r-control`, JetBrains Mono 13, header bar with language chip and Copy button, line numbers optional, max height 360 then scroll. Syntax colors from the pastel palette darkened for contrast. | new | Kibo UI Code Block or Shiki |
| **C31** | **Doc editor** | Notion-like: slash menu, block handles, headings/lists/tables/code, Markdown import/export, comments in margin. Toolbar is a floating pill on selection. | new | Plate (primary), Tiptap fallback |
| **C32** | **Charts** | See Section 7 | R1-R3, R6 | shadcn Charts, Evil Charts, shadcn-heatmap |
| **C33** | **Tooltip** | Dark `#2A2D32` card, white text, colored dots for series, rows of label + value (R2 chart tooltip). | R2 | shadcn Tooltip |
| **C34** | **Dropzone** | Dashed `border-strong`, `r-card`, icon, "Drop OpenAPI file or click to choose", accepted types chip. | R3 | Kibo UI Dropzone |
| **C35** | **Stepper** | Numbered circles + labels; states: done (check), current (lav-600 ring), locked. Horizontal for wizards; vertical for Prompt Bridge. | R4 | ReUI Stepper |
| **C36** | Tabs | Underline-free pill tabs in `surface-sunken` container (same as C17) for page-internal sections. | R4 | shadcn Tabs |
| **C37** | Menu / dropdown | `surface-raised`, `r-pop`, e2, 36px items with icon + shortcut. | R2 | shadcn Dropdown Menu |
| **C38** | Count badge | 18-20px circle, white number on `#EB6404`/pink or dark; used on bell, layers list (R5/R6). | R5, R6 | Badge |
| **C39** | **Blocker FAB** | 56px circle, pink `#F36498` (dark theme) or `#C23A3A` (light), ink/white icon per contrast, label "I'm blocked" appears on wide screens as an extended pill. | R6 | custom |
| **C40** | Illustration slot | Fixed aspect containers with defined art per use (Section 2.9). | R1 | custom |

**Interactive state colors (static):** hover on row = `lav-50`; selected row = `lav-100` with 2px `lav-600` left marker (a 2px marker on selection only, not a decorative colored border on every card); focus = 2px `lav-600` ring, 2px offset (dark: `lav-400`).

---

## 5. Signature components (unique to this product)

These carry the ideas from `problem.md` and `ideation.md`. Visual language is built from the references.

| Component | Purpose (problem it addresses) | Appearance |
|---|---|---|
| **Clock strip** | Time is the main adversary (L10, P3.9) | Horizontal segmented bar across the top of Overview and Board. Segments colored by phase (Section 2.1), width proportional to time. A `#2A2D32` needle marks "now". Freeze and deadline markers carry small flags. Text: "Freeze in 3h 20m · Submit in 9h 05m". Same anatomy as R4/R5 progress bars. |
| **Rubric card** | Rubric unread (P0.1, L4) | Compact card: criteria rows with weight percent and a coverage dot (Covered / Partly / Not yet). Total chip "100%". Also shown in the Rubric drawer. |
| **Eligibility check** | Rule-based elimination (D1-D12) | R4 detail rows: rule text, status chip (Pass / Fail / Unknown), action. A red summary banner when any Fail. |
| **Decision timer chip** | Decision paralysis (P2.4) | Pill in the Phase Track: "Decide in 08:42", peach fill; on expiry turns coral with "Leader decides". |
| **Scope Guard dialog** | Overscope (L2) | Small dialog (480) with the question, the task title, and three buttons. Never blocks the leader. |
| **Reality Ledger** | Defending the build (P5.6, W13) | Table with status chips: **Built this weekend** (lime), **Library / API** (sky), **Mocked** (amber), **Planned** (lavender). |
| **Idea card** | Structured ideation (F3) | R2 card layout with fixed fields: "Who is it for", "One-sentence identity", core flow (3-5 steps), wow moment, riskiest assumption. |
| **Stress-test panel** | Overscope / crowded ideas (L6) | Six questions, each with three chips (Yes / Not sure / No) and a note field; result badge "Ready", "Risky", "Not ready". |
| **Prompt Bridge stepper** | Free-tier planning (F4) | Vertical stepper C35, each step a three-panel card (Copy / Paste / Check). |
| **Paste validator result** | Bad AI output | List of pass/fail rows with line references; failing rows expand to show what is missing; a "Copy repair prompt" button. |
| **Criteria coverage matrix** | Pitch vs rubric (W5) | Grid: rows = rubric criteria, columns = slides; filled dot where the slide addresses it; empty rows highlighted in coral wash. |
| **Judge View preview** | Non-technical judges (P4.6) | Device-frame preview of the public submission page at 60-second scan size. |
| **Demo insurance checklist** | Demo failure (P5.1, W12) | R3 checklist container: offline works, cached responses, fallback video recorded, spare charger and hotspot. |
| **Branch map** | GitHub structure (F9) | Table + tiny lane graph (custom SVG): branch, purpose, owner, ahead/behind chips, role tag (main / demo-safe / experiment). |
| **API status list** | Flaky dependencies (P3.11) | Rows with status dot + label (Working / Slow / Failing), fallback chip (Mocked / Cached / None). |
| **Readiness rings** | One "are we ready?" view (F15) | Six 56px rings (Rubric coverage, MVP runs, Demo rehearsed, Submission complete, Roles set, Fallback recorded). |
| **Skill-gap radar** | Team composition (P1.1) | 5-axis radar (Build, Design, Pitch, Domain, AI) in Evil Charts radar style; missing axis flagged with a coral chip. |
| **Check-in scale** | Team health (F16) | Five-step icon scale (not emoji), private by default. |
| **Hackathon Wrapped card** | Retro and portfolio (F19) | R3 dark "Wrapped" card: dark `#231F1B`, cream text, big year numeral, "View" pill button. |

---

## 6. Screen catalog

Every screen lists: **purpose · reference · layout · content · key states · responsive · features**. ASCII sketches show desktop (≥1280) layout.

### PUBLIC

#### S01 Landing
- **Purpose:** Explain the product and route to sign-in.
- **Reference:** R1 hero panel style, R3 bento, no reference for page structure (product-led, deliberately not the generic template).
- **Layout (asymmetric, not centered):**
  1. Header: logo · Playbooks · Pricing · Sign in (Outline) · Start a room (Primary).
  2. **Hero, two columns:** left = specific headline and one sentence; right = a **real Room Overview screen** in a framed container (R1/R2 UI), not an abstract graphic.
  3. **"Five ways teams lose"** split section: left list from `problem.md` (no demo running by the halfway point, scope larger than the clock, rubric never read, submission started last, no fallback if wifi fails); right = the matching screen for each item, changing as you select.
  4. **Phase walkthrough:** sticky phase list on the left (Prep to Retro), matching screen on the right.
  5. **Plans:** Free (Prompt Bridge) · Bring your key · Pro, as an honest three-row comparison table.
  6. Playbook cards (R1 feature card style).
  7. Footer.
- **Not allowed:** logo strip, testimonials, fake stats, gradient headline.
- **Responsive:** columns stack; the framed screen follows the headline.

#### S02 Sign in
Split layout: left form (logo, H1, **Continue with GitHub** primary dark button, Continue with Google outline, one line stating the minimal GitHub permissions requested, link to privacy); right = R1 hero illustration panel (ice-blue, CC0 illustration). Errors inline above the buttons.

#### S03 Invite landing (join a room)
Card centered on canvas: room name, event, leader avatar, roles needed as chips, member avatars, **Join as** role selector, primary "Join room". Expired/invalid link state with a "Ask the leader for a new link" message.

#### S04 Playbooks (public browse, also in-app S27)
Grid of **feature cards (C10a)** per event template: title, tag chip (event type: 36-hour team, 48-hour online, 4-hour sprint, solo), team size, "phases" meta, progress ring omitted. Filter bar (type, team size). Detail page: phase plan as a vertical timeline, default rubric guess, checklist preview, "Use this playbook" primary.

### ONBOARDING

#### S05 Situation picker
Three large selectable cards (R1 feature card size): **Event hasn't started (Prep)**, **Event is live (Speed Mode)**, **Just exploring**. Each with a one-line outcome and an illustration. Selecting Speed Mode routes to S06 with the fewest fields.

#### S06 Create room wizard
Dialog-in-page, stepper C35 with 4 steps: **1 Event** (template picker + paste rules text or link) · **2 Time** (start, end, timezone; shows total hours and default phase split as a Clock strip preview) · **3 Team** (name, invite link, team size) · **4 Confirm** (summary, "Create room"). Speed Mode variant collapses to two steps (Event + Time). Target: a usable room in under 3 minutes.

### APP

#### S07 Home (My hackathons): R1
Purpose: Resume a room; see what's next across rooms.

```
+------+---------------------------------------------------+--------------------+
| Side | [ search pill ]                                   | Hero panel (art)   |
| bar  | Welcome back, Aarav                [Today, 20 Sep]|  bell / avatar     |
|      | +--------------------+ +--------------------+     +--------------------+
|      | | tag  Campus Sprint | | tag  SIH Internal  |     | Week strip         |
|      | | avatars  ring 62%  | | avatars  ring 30%  |     | Fri Sat Sun ...    |
|      | +--------------------+ +--------------------+     | Upcoming           |
|      | Rooms you're in       [Active v] [search] [+]     |  Freeze  [Open ->] |
|      | [AI] Row ...                        ring  meta    |  Submit  [Open ->] |
|      | [UI] Row ...                        ring  meta    | Show all           |
+------+---------------------------------------------------+--------------------+
```
- **Header:** greeting (32/40, 800) with wave emoji; date chip (white pill, calendar icon) on the right.
- **Two feature cards (C10a):** the two most urgent rooms. Tag = event type; "Participants" = avatar stack; "Progress" = ring; footer = leader name and "N tasks left".
- **"Rooms you're in" list:** C10b rows, filter dropdown (Active / Completed / Archived), search icon, blue "+" circle to create.
- **Right rail:** C10g hero panel with countdown to the nearest deadline; **week strip** (C18) for the current week; **Upcoming** list: checkpoint/deadline rows with outlined "Open →" buttons (R1 "Submit →"); "Show all" link.
- **States:** no rooms = empty state with two actions (Create a room / Join with link). Loading = skeleton cards.
- **Responsive:** right rail moves below list; feature cards stack.
- **Features:** F6, F17, F20.

#### S08 Room Overview (command center): R2 + R1 + R4
Purpose: One glance at time, blockers, and the next best action.

```
Phase Track: [Prep][Ideate][Plan][Build*][Freeze][Ship][Retro]   [Rubric] [Decide 08:42]
Clock strip: |####|####|######|====|>>--|-----|  Freeze in 3h 20m  Submit in 9h 05m
+-------------+-------------+-------------+-------------+   +---------------------+
| Time left   | Checkpoints | Tasks open  | Blockers    |   | Hero: countdown     |
| 09:05  ...  | 3 / 7  +1   | 18   -4     | [dark card] |   | to submission       |
+-------------+-------------+-------------+-------------+   | Event days strip    |
| Progress vs plan (area/burndown)  | Team activity heatmap |   | Upcoming checkpoints|
+-----------------------------------+-----------------------+   +---------------------+
| My tasks (rows C10b)              | Team (members + presence)|
```
- **KPI tiles (C10f):** Time left, Checkpoints passed, Tasks open (with delta chips), and a **dark callout card (C10d)** for blockers: "2 tasks are blocked. Assign owners." with white button.
- **Progress vs plan:** burndown-style area chart (Section 7) with ideal line.
- **Team activity:** R2 heatmap, hours × day, three categories (Code / Docs and plan / Pitch and design).
- **My tasks:** C10b rows with ring per task's checklist progress.
- **Team card:** R2 members list (avatar, name, role, presence dot).
- **States:** Prep phase shows checklist card (C10e) instead of KPIs; Post-event shows Retro CTA.
- **Features:** F6, F7, F15, F16.

#### S09 Brief (rules hub): R4 + R3 + R2
Purpose: Every rule, deadline, and criterion in one confirmed place (F1).

```
+-----------------------------------------------+------------------------------+
| Problem statement (card, source link)         | Source text panel            |
| Rubric card (criteria + weight bars, 100%)    |  original pasted text        |
| Rules checklist (dashed container, C23 rows)  |  matches highlighted         |
| Deadlines (rows with countdown chips + tz)    |------------------------------|
| Eligibility check (C24 rows: Pass/Fail/?)     | Extraction status ring 14/18 |
| Tracks & prizes (pastel cards)                | confirmed  [Confirm all]     |
| AI-use policy (dark callout)                  |                              |
| Format profile [Live booth|Presentation|Video]|                              |
+-----------------------------------------------+------------------------------+
```
- Each extracted item has a **"Confirm" checkbox** and a "Source" link that scrolls the right panel to the matching line.
- **Import step (empty state):** large dropzone/paste area, "Paste the event page text", secondary "Enter manually". Free mode shows the extraction prompt (see S12 pattern).
- **States:** Unconfirmed items show a `Sun` chip "Unconfirmed"; rule changed → banner "Rules changed on 20 Sep. Review 2 items."
- **Features:** F1, F20. **Problems:** P0.1, P0.5, D1-D12.

#### S10 Team: R4 + R2
- **Layout:** Left column "Members" list; center member profile card (R4: avatar 96, name, role, contact icon buttons, "Time slots" chip, "Sessions" count chip); right: **Skill-gap radar** and **Team charter**.
- **Member profile detail rows (C24):** Full name, Email, GitHub handle, Role tags, Availability (hours), Skills.
- **Team charter:** three poll cards (Goals: win / learn / portfolio; Commitment hours; Feedback norms) with results as segmented bars; unanswered members shown as dashed avatars.
- **Health panel:** private check-in scale, workload bars per person (C12), "Rescuer alert" callout when one person has over 60% of completed tasks.
- **Invite:** "Invite" primary dark button, roles-needed chips.
- **Permissions:** leader can change roles; members edit their own profile.
- **Features:** F2, F16. **Problems:** P1.1-P1.6, P3.12.

#### S11 Ideate: R2 + R4 stepper
Stage stepper (C35) across the top: **Solo · Reveal · Research · Critique · Stress test · Vote · Decide.** The leader advances stages. Each stage has a timer chip.

| Stage | Layout |
|---|---|
| **Solo** | Left: "Your ideas" list (only yours) with "Private until reveal" lock chip. Right: Idea card editor (form C16). No one else's ideas visible. |
| **Reveal** | **R2 kanban:** columns New · Shortlist · Chosen · Parked. Idea cards show identity sentence, author (or "Anonymous"), role-needs chips, comment and attachment counts. |
| **Research** | Idea drawer: attachments list (links, notes, prior art), user-quote blocks, "Talked to a real user" checkbox. |
| **Critique** | Matrix table C15: rows = ideas, columns = 5 criteria (rubric fit, finishable, differentiation, user clarity, team skill fit), 1-5 dot selectors, averages, total. |
| **Stress test** | Per-idea stress-test panel (six questions), result badge. |
| **Vote** | Radio cards; "6 of 6 voted" count; results hidden until the leader closes. |
| **Decide** | Dark callout with decision timer and **Lock idea** (dark button). Locked = summary card and "Continue to Plan". |

Right rail (all stages): compact Rubric card, presence list, timer.
- **Features:** F3. **Problems:** P2.1-P2.5, L2, L6.

#### S12 Plan (Prompt Bridge): new, using R4 stepper + R1 upgrade card
Purpose: Build the plan files, free or with a key.

```
Mode: [ Prompt Bridge (free) | Your API key | Managed (Pro) ]
+------------------+-----------------------------------------------+---------------+
| Vertical stepper | Step 2 of 5: Tech stack and architecture      | Context pack  |
|  1 PRD & MVP  v  |  1 Copy this prompt        [Copy] ~1.8k chars |  fields sent  |
|  2 Tech stack .  |  [ code block C30 ]     Open in: Claude | ... |  [x] Idea     |
|  3 Phases        |  2 Paste the answer                           |  [x] Rubric   |
|  4 Tasks         |  [ textarea ]              [drop file]        |  [x] Skills   |
|  5 Demo & Q&A    |  3 Check it     [Validate]                    |  privacy note |
+------------------+-----------------------------------------------+---------------+
```
- Step states: Not started · Prompt copied · Answer pasted · Validated · Locked.
- **Validate result:** C-signature "Paste validator": pass/fail rows; fail rows list exactly what is missing; "Copy repair prompt" button.
- "Open in" links are plain outbound links to each AI chat (no claim of integration).
- **Privacy note (always visible):** "This prompt contains your idea text. It goes to the AI service you paste it into."
- **AI-use policy gate:** if the Brief says AI use is restricted, the screen shows a dark callout and disables the flow until the leader overrides.
- **Upgrade card (R1 style)** in the right rail: "Skip copy-paste with Pro".
- **Final step:** review screen listing generated files with diff-like summary → "Lock plan".
- **Features:** F4. **Problems:** L1, L2, L4, W2, W6.

#### S13 Docs vault: Notion/GitHub style
Three panes: **file tree** (PRD.md, PROBLEM.md, TECH_STACK.md, PHASES.md, MVP.md, CUT_LIST.md, RISKS.md, DEMO_SCRIPT.md, DECISIONS.md; version chip and "edited by") · **editor/reader** (C31) · **outline + history + comments**. Top actions: Export zip, Push to repo `/docs` (disabled with tooltip until GitHub connected). Empty state: illustration + "Generate your plan" link to S12.

#### S14 Board: R2 (primary)
Purpose: run the build (F6).

```
[ Search tasks... ]                 [Sort by] [Filters] [ + Add task (dark) ]
+-------------------+ +---------------------------+ +---------+ +---------+
| Progress vs plan  | | Team activity heatmap     | | KPI     | | KPI     |
| area chart        | | hour x day, 3 categories  | | Open 18 | | Freeze  |
+-------------------+ +---------------------------+ +---------+ +---------+
 Backlog (9)      Building (6)      Blocked (2)      Review (4)     Done (11)
 [task card]      [task card]       [task card]      [task card]    [task card]
 [task card]      [task card *lift] [task card]
```
- **Columns (C14):** Backlog · Building · Blocked · Review · Done, each with a dark count pill. Phase filter from the Phase Track applies here.
- **Cards (C13):** exactly the R2 anatomy. **Tag chips** carry role or type: Frontend, Backend, Design, Pitch, Must-have, Cut candidate, Blocked.
- **Sidebar panel (right, R2 members list):** Members with role and load; below it the **dark callout** "Unowned task. Assign an owner." with a white "Assign" button.
- **Views:** Board (default) · List (C15, compact) · By person (swimlanes with workload bars) · Timeline (S15).
- **Task drawer (right sheet 520):** Title, description, assignee, role, phase, due, estimate, **linked branch/PR chips**, **checklist (R6 purple task card style: checkbox rows with progress ring)**, attachments, comments, activity log. Footer: Mark done / Move / "I'm blocked".
- **Feature freeze:** after freeze time, a lavender-wash banner "Feature freeze is on. New tasks ask Scope Guard first." and the "+ Add task" button triggers Scope Guard.
- **States:** empty board = illustration + "Add your first task or import from the plan"; column empty = dashed slot; locked column when viewer lacks permission.
- **Responsive:** columns become a horizontally scrolling row with snap; on phones, a single-column list with a column selector (C17).
- **Features:** F6. **Problems:** P3.1, P3.2, P3.6-P3.9, L1, L2.

#### S15 Schedule (Hackathon clock): R5
- **Header:** title "Schedule"; range label; **Month / Week / Day** segmented control (adds **Event** view = the actual event span as day columns); prev/next arrows; **Today** button.
- **Left context panel (R5):** mini calendar (C19); **Next up** card (dark solid, not glass): "Rehearsal 1 · 14 min" with a peach countdown chip and Later / Details buttons; **Layers** checklist with count badges (Tasks, Checkpoints, Deadlines, Meals and sleep, Sessions); **Categories** with colored progress bars (time allocation per role/phase).
- **Main:** day pills (C18) row, time grid (C20), event blocks (C21) colored by phase; checkpoints as full-width thin bars with a flag icon; sleep blocks in `surface-sunken` with a moon icon.
- **Create popover (C22):** title, date, time range, place, tag chips, attendees, Add.
- **States:** empty day shows the dashed add slot; conflicts show a coral outline on both blocks with a "Conflict" chip.
- **Responsive:** on phones, Day view only with a horizontal day-pill strip.
- **Features:** F6, F17. **Problems:** P3.4, P3.9, P4.1.

#### S16 MVP Studio: R4 detail rows + R3 checklist + R2 tags
- Top card: **One-sentence identity** as large text (H1 size) with an edit icon and a character guide.
- Two columns: left = **Core flow** (numbered steps as C24 rows), **Wow moment** card (sky wash), **Differentiation statement**, **What breaks first** answer; right = **Reality Ledger** table and **MVP health checklist** (C23 rows with green checks).
- **States:** missing fields show a `Sun` "Needed for pitch" chip.
- **Features:** F8. **Problems:** L1, L3, L6, W1, W8, W13.

#### S17 GitHub Hub: R2 + R3
- **Header:** repo selector, connection status chip, "Sync" button.
- **KPI tiles:** Branches · Open PRs · Last commit · **Commits since event start** (with pass/fail chip for the pre-event rule, D7).
- **Branch map:** table (C15) + lane graph. Columns: Branch · Purpose (editable) · Owner · Ahead/behind chips · PR status · Role tag · Last commit. **Role tags:** main (lime), demo-safe (sky), experiment (amber).
- **Repo health checklist (C10e/C23):** README, run instructions, `.env.example`, no secrets committed, license, deployed link, screenshots.
- **Commit heatmap:** GitHub-style contribution grid.
- **History health callout (dark):** appears if history looks like a single large commit (D8).
- **Branch drawer:** purpose, owner, ahead/behind, PRs, linked tasks, "what's missing" list.
- **Empty state:** "Connect GitHub" card (R3 integration tile).
- **Features:** F9. **Problems:** P4.5, D7, D8.

#### S18 API Hub: Postman/Swagger-like
- **Layout:** left list (grouped: External APIs, Our endpoints; status dot per item) · center detail · right "Fallbacks" panel.
- **External APIs table:** Name · Base URL · Auth · Rate limit · Cost · Key location (text, never the key) · Status · Fallback chip (Mocked / Cached / None).
- **Our endpoints detail:** grouped by tag; **method chips** GET (sky), POST (lime), PUT (amber), PATCH (lavender), DELETE (coral), all with ink text; path in mono; request/response examples as code blocks (C30); response status chips.
- **Import:** dropzone (C34) for OpenAPI JSON/YAML.
- **Reference viewer:** embedded API reference component styled with our tokens (Section 12).
- **Features:** F10. **Problems:** P3.3, P3.11.

#### S19 Diagram Studio
Split editor: left Mermaid code (CodeMirror, JetBrains Mono), right live preview on `surface-sunken` with pan/zoom controls; top bar: diagram type select, Templates button, Export (SVG, PNG), "Insert into doc". **Template gallery:** R3 bento tiles (architecture, user flow, sequence, ER, roadmap). Error strip below the editor shows Mermaid syntax errors with line numbers.
Features: F11.

#### S20 Pitch Studio: new
Tabs (C36): **Deck · Rehearse · Q&A**.
- **Deck:** left slide rail (thumbnails with slide title and a coverage dot); center: slide guide ("This slide must answer: who suffers, and how often?") + content editor; right: **Criteria coverage matrix** and **Slide lint** list (too much text, no problem slide, no impact number, no roadmap).
- **Rehearse:** large timer (Display type), run counter "Rehearsed 3 times", role cards (**Presenter** and **Demo operator**), target time vs last run bar.
- **Q&A:** question cards (likely judge questions) with "Answered / Needs work" chips; **Code Defense** drills listing modules with an "Explain this" prompt.
- **Features:** F12. **Problems:** P5.x, L3, L4, L7.

#### S21 Demo and Video Studio
- **Script builder:** beat rows (Hook, Problem, Core flow, Wow moment, Impact, What's next), each with duration; a total-duration bar turns peach over the limit set in the Brief.
- **Shot list** table (Shot · Screen · Narration · Length).
- **Demo insurance checklist** (C10e).
- **Video rules check** (from Brief): max length, public link, captions.
- **Tool directory strip:** cards (see S26) filtered to recording/editing/video tools.
- Features: F13.

#### S22 Submission Center: R1 hero + R3 checklist
```
+-------------------------------------------------------+------------------------+
| Hero panel: Submit in 02:14:30       [Verify & submit]|  Judge View (device)   |
+-------------------------------------------------------+  60-second scan        |
| Required by this event   (dashed container, C23 rows) |------------------------|
| Team checks                                            |  Link check table      |
| Verification (links open, video public, repo public)  |  URL | Status | Fix    |
+-------------------------------------------------------+------------------------+
| Sticky bar: 12 of 15 done                                          [Verify & submit] |
```
- **Hero panel (C10g):** illustration, big countdown (Display), CTA. In the **last hour** the panel turns `#2A2D32` (dark) and a banner reads "Last hour. Only verification and submission from here."
- **Checklist groups** come from the Brief (D4-D11): video, repo link, all teammates registered, correct track, prizes, forms.
- **Submission draft** section: structured fields (What it does, Why it matters, How we built it, Challenges, What's next) with character counts.
- **States:** items linked to unconfirmed rules show "Confirm in Brief" chips.
- **Features:** F14. **Problems:** P4.x, D1-D12, W15.

#### S23 Readiness: R1 rings + R2 tiles
Six readiness rings (56px) in a row, each clickable to its page; **weak spots** list (C10b rows, ordered by severity); **Judge Simulator** panel with a disclaimer chip "Estimate, not a prediction", scores per rubric criterion as horizontal bars, likely questions list. Free-mode shows the Prompt Bridge pattern for the simulator prompt.
Features: F15.

#### S24 Retro and Portfolio: R3
- **Wrapped card:** dark card `#231F1B`, big numerals: hours, tasks done, first working demo hour, rehearsals; "View" pill button.
- **Timeline:** vertical timeline of milestones with phase-colored dots ("Idea locked hour 6", "First end-to-end run hour 14", "Submission started hour 30").
- **Analytics:** **highlighted-bar chart** (R3): time spent per phase, the phase with the most overrun in peach.
- **Retro prompts:** three cards (Worked / Didn't / Change) with sticky-style inputs.
- **Continue or archive:** two big cards; choosing "Continue" opens a 2-week plan card.
- **Portfolio entry preview** (public page style): project, role, links, awards.
Features: F19. **Problems:** P6.1.

#### S25 Prep Mode: R3 layout
Bento: **Today's checklist** (dashed container, C23 rows: environment readiness, stack sandbox test, logistics, team intro, read the brief); **Calendar** with ringed days; **Event-day card** (venue, address, weather, travel time, map thumbnail with orange arrow button; R3 weather and running cards adapted); **Connect GitHub** card (R3 "Connect your account", dark) and **More integrations** tile (coral `#F77271`, ink text) listing "coming soon" items honestly.
**Guardrail banner:** if pre-existing code is not allowed, "Prep is limited to setup and learning. Do not write project code before kickoff."
Features: F17.

#### S26 Crowd Check
Table (C15) of tracks/problem statements: option · likely competing ideas (text) · overlap in your college (number input) · **crowdedness meter** (3-segment bar Low / Medium / High) · notes. Footer note: "Popularity is not quality. Choose knowingly." Later shows aggregated anonymous choice counts as an extra column.
Features: F18.

#### S27 Tool directory and Playbooks (in-app)
- **Tool directory:** filter bar (category: recording, video, diagrams, design, API, deployment · cost: free/freemium/paid · license). **Tool card:** name, one-line use, chips (cost, license), "Last checked 20 Sep 2026", outbound link button. Unverified tools show a `Sun` chip "Not verified".
- **Playbooks:** same as S04 but with "Use in room" action.

#### S28 Settings
Left sub-nav list, right content cards.
- **Profile**, **Appearance** (theme: Light / Dark / System; density: Comfortable / Compact), **Notifications**, **Integrations** (R3 tile grid: GitHub connected/not, Google; others "Coming soon"), **AI and keys** (mode selector, provider list, key field with masked value and "Stored only in this browser session" note; "Remove"), **Privacy** (what the platform stores, export data, delete account), **Billing** (plan card).

#### S29 Notifications and activity
Inbox list (R4): rows with avatar, title, one-line body, time; unread row = black fill with white text (R4 highlighted message) in light theme, cream fill in dark; filters (All, Mentions, Blockers, System).

#### S30 Mentor view (read-only)
Reduced sidebar (Summary, Plan, Board snapshot, Ask). Read-only chip in the top bar. **Ask a mentor** card packages the team's context and a question field; no edit controls anywhere.

#### S31 Speed Mode: R6
- **Shell:** icon rail 72px (team avatars with presence dots, pink **I'm blocked** FAB).
- **Column (max 720):**
  1. **Clock (Display size):** time to next checkpoint and to submission.
  2. **Now:** my current task as a **purple task card (R6)**: title, checklist with progress ring, "Mark done".
  3. **Next up:** two compact task rows.
  4. **Blockers:** count and list, dark callout when any.
  5. **Quick capture:** single field "Add a task or note".
- **Yellow event card (R6):** next checkpoint with Details / Dismiss buttons.
- **Category list with count badges (R6):** Urgent, Build, Docs, Pitch (filter for the list).
- Compact density; dark theme default.
- **Features:** F6, F7. **Problems:** L10, P3.1.

#### S32 System pages
403 (not a member: "Ask the leader for an invite" + join-code field), 404, 500, offline (banner and last-synced time), maintenance. All use the illustration slot, one headline, one action.

---

## 7. Data visualization specification

| Chart | Use | Base | Spec (from reference) |
|---|---|---|---|
| **Stacked smooth area** | Progress vs plan; commits per hour | shadcn Charts (Recharts); Evil Charts area style | R2: 3 series (blue `#5880D1`, lime `#C9EF84`, light blue `#B9D4FE`), dashed light gridlines, y-axis ticks at 0/10/20, x-axis day or hour labels, **dark tooltip (C33) with vertical guide line**. Ideal-line variant for burndown adds a dashed `ink-muted` line. |
| **Category heatmap** | Team activity (hour × day) | shadcn-heatmap components | R2: rounded-square cells 20-24px, 4px gap, hour labels left, date labels below. **Three categories, not intensity:** blue = Code, lime = Docs and plan, light blue = Pitch and design; empty = `surface-sunken`. |
| **Contribution grid** | GitHub commit history | Kibo UI Contribution Graph or shadcn-heatmap | 5-level lime ramp (`#EEF7DA` to `#4F8F1A`). |
| **Bar with highlighted bar** | Time per phase; tasks per hour | shadcn Charts / Evil Charts bar | R3: bars in `#C7CAC4`, **one bar in peach `#F9B672`** with a dark tooltip showing percent. |
| **Progress ring** | Task/phase/readiness progress | SVG (C11) | R1. |
| **Radar** | Team skill coverage | Evil Charts radar | 5 axes, filled polygon at 40% blue, outline blue. |
| **Sparkline** | KPI tiles | Recharts | 24px tall, single line `#5880D1`. |
| **Stacked bar** | Hours per person | shadcn Charts | R6 weekly productivity bars in pastel categories, y-axis in hours. |
| **Donut / half-donut** | Rubric weights | shadcn Charts | Only where parts-to-whole matters; labeled segments. |

Every chart: title (H3), unit in the subtitle, accessible text summary (one sentence) under or in an accessible label, data table alternative available via a "View data" link.

---

## 8. Content design and seed data

### 8.1 Voice
Direct, calm, specific. Short sentences. The tone of a good teammate at 3 AM, not a marketing page. **Verbs tied to outcomes:** "Confirm rules", "Lock idea", "Copy prompt", "Verify and submit". **Banned:** seamless, unleash, supercharge, elevate, effortless, "let's get started!".

| Situation | Copy pattern | Example |
|---|---|---|
| Button | Verb + object, sentence case | "Add task", "Lock idea" |
| Empty state | What this is + the next action | "No tasks yet. Import them from your plan or add the first one." |
| Error | What happened + what to do | "We couldn't read that answer. 2 sections are missing: Tasks, Risks. Copy the repair prompt." |
| Warning | The consequence | "Feature freeze is on. New tasks may not fit before submission." |
| Confirm | State the action's result | "Lock this idea? The team moves to planning." |
| Offline | Status + what still works | "You're offline. Showing data from 14:02. You can still read docs and export." |

### 8.2 Seed data (use for every mock screen; no "John Doe", "Acme")
- **Event:** *Campus Build Sprint 2026*, 36 hours, Fri 20 Nov 6:00 PM to Sun 22 Nov 6:00 AM (IST). Second room: *Internal Round: Software Edition* (PPT round).
- **Team:** **Team Kaveri**, six members: **Aarav Mehta** (leader, Backend), **Ishita Rao** (Design, Pitch), **Kabir Nair** (Frontend), **Meera Iyer** (ML/AI), **Rohan Das** (Domain, QA), **Tanvi Kulkarni** (Presenter, Demo operator).
- **Problem statement:** "Reduce food waste in college messes using daily demand forecasts."
- **Project:** *MessMeter*. Identity sentence: "MessMeter is a tool that tells mess managers how many meals to cook tomorrow, for college hostels."
- **Rubric (sums to 100):** Innovation 25 · Feasibility 20 · Impact 20 · Technical depth 15 · UX 10 · Presentation 10.
- **Phases:** Prep, Ideate (6 h), Plan (3 h), Build (16 h), Freeze at hour 28, Ship (6 h), Retro.
- **Tasks:** "Set up repo and CI", "Attendance CSV importer", "Forecast endpoint (GET /api/v1/forecast)", "Manager dashboard screen", "Record fallback demo video", "Write submission draft".
- **Tags:** Frontend, Backend, Design, Pitch, Must-have, Cut candidate, Blocked.
- **Numbers must be internally consistent** (counts on tiles match visible lists).

---

## 9. States and edge cases (required for every screen)

| State | Requirement |
|---|---|
| **Empty (first use)** | C28 with a specific next action |
| **Empty (filtered)** | "No tasks match these filters." + "Clear filters" |
| **Loading** | Static skeletons that match the final layout; keep headers and controls visible |
| **Error (recoverable)** | Inline message near the failing region + retry; never a full-page failure for a partial error |
| **Error (validation)** | Field-level text plus a summary at the top of long forms |
| **Offline** | Banner (peach) with last-synced time; read-only cache of plan, tasks, rules, demo script; edit controls disabled with a tooltip; **Export everything** stays available |
| **No permission** | Controls hidden if never allowed; disabled with reason if temporarily blocked (e.g., "Leader only") |
| **Locked (freeze / last hour)** | Lavender-wash banner and disabled creation controls with explanation |
| **Long text** | Titles truncate at 2 lines with a tooltip; table cells truncate with a tooltip; no layout shift |
| **Many items** | Lists over 50 rows virtualize; kanban columns scroll independently |
| **Time zones** | All times show the event timezone by default with a toggle for "my timezone" |
| **Right-to-left / long locale text** | Layout uses logical (start/end) spacing; components tolerate 30% longer labels |

---

## 10. Accessibility and internationalization

- **Target: WCAG 2.2 AA.** Text contrast 4.5:1 (3:1 for 18px+ or 14px bold); UI boundaries and icons 3:1. All palette pairs in Section 2 were measured; only measured-passing pairs are specified.
- **Never** white text on `lav-500`, `blue-500`, coral, orange-600, or pink FAB (all measured below 4.5:1). Use the paired ink or darker solid.
- **Focus:** 2px ring in `lav-600` (light) or `lav-400` (dark), 2px offset, always visible.
- **Target size:** minimum 24×24 CSS px (WCAG 2.2); **44×44 on touch**.
- **Keyboard:** every interactive element reachable; drag-and-drop has a keyboard alternative (move via menu: "Move to column").
- **Shortcuts (displayed as kbd chips):** `Ctrl K` palette · `B` I'm blocked · `R` rubric · `F` feed · `N` new task · `G` then `B` go to board.
- **Not by color alone:** every status has text/icon; charts have labels.
- **Screen readers:** icon-only controls have names; charts have text summaries; live regions announce timer milestones and validation results.
- **Language and scripts:** UI language English at launch; components handle right-to-left and longer strings; **Devanagari fallback font** is included (Section 2.3). Numerals: Latin digits by default.
- **Reduced motion and motion-related preferences** are handled in `animations.md`.

---

## 11. Responsive behavior and PWA presentation

| Range | Shell | Notes |
|---|---|---|
| ≥1280 | Sidebar 248 + main + optional right rail 360 | Full spec |
| 1024-1279 | Sidebar collapses to 72px rail; right rail becomes a collapsible panel | Kanban still shows 4-5 columns |
| 768-1023 | Rail hidden; top-left menu opens sidebar sheet; single column with cards in 2-column grid | |
| <768 | Bottom tab bar, floating blocker button, stacked cards, full-screen sheets | Speed Mode is the recommended phone experience |

- **Installable app:** app icon uses the lavender fill and dark mark; splash background = canvas token; status bar follows theme.
- **Offline visuals:** described in Section 9.
- **Touch:** rows at least 48px tall; swipe actions are specified in `animations.md`.
- **Print:** Docs Vault and Submission summary have a clean print stylesheet (white, no chrome).

---

## 12. Component-library survey and decisions

**Interpretation of your names:** "ShadesCN" = shadcn/ui; "Eternity UI" = Aceternity UI; "all evil charts" = Evil Charts. Tell me if any was meant differently.

### 12.1 Base layer
| Need | Choice | Why | Notes |
|---|---|---|---|
| **Component base** | **shadcn/ui, Base UI flavor** | **Since July 2026 Base UI is the shadcn default**; Radix remains fully supported and every update ships for both; React Aria was added as a third base the same month. Pick one and never mix. | *Update to `tech_stack.md`, which assumed Radix.* If the build agent struggles with Base UI, fall back to Radix (same abstraction). |
| **Style preset** | **Luma** (fluid, luminous, soft; pill-shaped controls, fully rounded cards) as the starting point, tuned with our tokens; **Maia** (soft, rounded, generous spacing) is the alternative to compare in shadcn/create | Closest to the references' pill controls and big radii. Mira/Nova (compact) informs the Compact density mode only. | Preview both in shadcn/create with our tokens before locking. A preset changes shape and density; theme (colors, font) is applied on top. |
| **New shadcn parts worth using** | Sidebar, Data Table, Item, Empty, Field, Input Group, Button Group, Kbd, Command, Calendar, Chart, Toast, Skeleton, Sheet, Drawer; **Questionnaire** and **Message** (chat components added June 2026) for charter polls and Q&A drills | Official, accessible, same tokens | Verify each component's current API in the docs before use. |

### 12.2 Specialized libraries: evaluated

| Library | Category | Verdict | Where | Notes |
|---|---|---|---|---|
| **Kibo UI** | Composite components on shadcn (Kanban, Gantt, Calendar, Contribution graph, Dropzone, Code block, Editor, Color picker) | **Use** | S14 base, S17 heatmap, S18 dropzone, code blocks | MIT; curated (~41 items); complements shadcn. Restyle the Kanban to match C13/C14. Acquired by Shadcnblocks in late 2025; check maintenance before depending on it. |
| **ReUI** | shadcn registry with 17-19 primitives (Data Grid, Kanban, Filters, Date selector, Stepper, Tree, Event calendar) and 1,000+ examples | **Use selectively** | Stepper (C35), Filters, Data Grid (heavy tables), Tree (file tree in S13) | Copy-and-own; Radix and Base UI versions. Some blocks are paid (Pro); **confirm which components are free before adopting.** |
| **Evil Charts** | Chart components on shadcn + Recharts (area, bar, line, pie, radar; also ECharts variants) | **Use** for area, bar, radar styling | S08, S10, S14, S24 | 49 components installable via shadcn CLI; **the 21st.dev listing shows license "unknown", so read the repo license before use.** The library is animated by default: **use static configuration only** (motion is specified in `animations.md`). |
| **shadcn Charts (Recharts)** | Base chart primitives | **Use** (default) | All charts | Same theme tokens. |
| **shadcn-heatmap** (fishdev20) | GitHub-style and weekday × hour heatmaps; no chart lib | **Use** | S08, S14, S17 | Copy-paste, light/dark. Convert intensity ramp to our three-category scheme for the R2 look. |
| **shadcn.io stats blocks** (unaffiliated with shadcn) | Prebuilt stat cards: burndown, goal rings, progress list, hourly heatmap | **Use as visual reference; re-implement with our tokens** | S08, S23 | Blocks include Motion effects and NumberFlow; strip these. Community source, not official. |
| **Origin UI** (registry on 21st.dev) | Application-surface components (inputs, selects, pickers), deliberately no marketing effects | **Consult for forms and pickers** | S06, S09, S28 | Status has changed over time; verify current home and license. |
| **Aceternity UI** | Cinematic marketing components (spotlights, beams, 3D cards) | **Skip** | none | Marketing/motion-first; its look is what many reviewers call the recognizable AI-startup style, the opposite of the goal. |
| **Magic UI** | Animated marketing components (marquees, beams, bento) | **Skip for app; landing only if needed** | none | MIT; motion-first. Any use belongs to `animations.md`. |
| **react-bits, Animata, Motion Primitives, Cult UI** | Animation-oriented registries | **Defer to `animations.md`** | none | Not evaluated for static UI use. |
| **Mantine, MUI, HeroUI, Ant Design** | Full component suites with their own theming systems | **Skip** | none | Would fight the shadcn token system and give a generic look. (Judgment, not benchmarked.) |
| **FullCalendar (core, MIT)** | Time grid / calendar | **Use** for S15 | Custom event content lets us render C21 blocks | Alternatives to spike: **Schedule-X** (default and shadcn themes; custom slots), **react-big-calendar** (MIT), **ReUI Event Calendar** (headless, month/week/day/agenda; confirm license/pricing). Run a one-day spike to confirm the R5 look is achievable. |
| **react-day-picker** (via shadcn Calendar) | Mini calendars, date pickers | **Use** | C19 | |
| **Plate** | Notion-like editor styled on shadcn primitives | **Use (primary) for C31** | S13 | Slate-based, plugin architecture, Markdown serialization. |
| **Tiptap** | ProseMirror editor framework | **Fallback for C31** | S13 | Some extensions/UI templates are paid; check the license. |
| **BlockNote** | Ready-made Notion-style editor (Yjs collaboration) | **Alternative** | S13 | More opinionated; harder to customize deeply. Verify license of add-on packages. |
| **CodeMirror 6** | Code/Mermaid/JSON editor | **Use** | S19, S18 | Lighter than Monaco. |
| **Scalar API Reference** | Modern OpenAPI viewer | **Use (primary) for S18 reference view** | S18 | springdoc 3.x added Scalar support, so it fits the backend. **Verify license.** **Swagger UI** is the fallback (well-known, heavier look). |
| **Mermaid** | Diagram rendering | **Use** | S19 | Client-side. |
| **dnd-kit** | Drag and drop | **Use** | S14, S11 | Underlies Kibo/ReUI kanban. Keyboard alternatives required (Section 10). |
| **TanStack Table** | Data table engine | **Use** | C15 | Via shadcn Data Table. |
| **cmdk / shadcn Command** | Command palette | **Use** | C26 | |
| **Sonner / shadcn Toast** | Toasts | **Use** | C27 | shadcn changelog lists a new Toast component (July 2026); choose one and pin. |

### 12.3 Icons, fonts, illustration
- **Icons:** Lucide default. shadcn's config also supports Tabler, Hugeicons, Phosphor, and Remix if you later prefer a different stroke; never mix sets.
- **Fonts:** Manrope + JetBrains Mono via Fontsource (self-hosted). **Do not use Inter, Plus Jakarta Sans, Geist, or Space Grotesk as the UI font**: reviewers list them among the fonts AI tools default to.
- **Illustration:** Open Peeps, Humaaans (CC0), unDraw (with its restrictions) as described in Section 2.9.

---

## 13. Rules: the "not AI-generated" checklist

**Banned (hard fails):**
- Purple-to-blue gradients; gradient text; glow/neon borders; glassmorphism.
- Untouched shadcn zinc palette or default Tailwind blue buttons: all colors come from Section 2.
- `rounded-2xl shadow-lg` on every card; cards nested inside cards ("every block boxed").
- A colored 3-4px left-border strip on cards (only the 2px selection marker in Section 4 is allowed).
- Icon-in-a-rounded-square as decoration on every feature card (identity tiles with two-letter codes in list rows are allowed; they carry meaning).
- Centered hero + badge + three equal feature cards + logo strip + pricing rings + FAQ as the landing page skeleton.
- Emoji as icons; placeholder names ("John Doe", "Acme"); invented statistics or testimonials.
- Permanent dark mode as a reflex (dark is a user choice and the Speed Mode default).
- Monospace used decoratively.

**Required:**
- Every screen uses only tokens from Section 2 and components from Sections 4-5.
- Every screen has all states from Section 9.
- Every screen is checked in light and dark, comfortable and compact, at three widths (1440, 1024, 390).
- At most **one dark callout (C10d)** per screen.
- Numbers on screen are internally consistent.

**Definition of done for a screen:** matches the spec · all states designed · contrast verified · keyboard path works · long-text and many-items cases checked · dark theme checked · no banned pattern · realistic seed data.

---

## 14. Traceability: screens to features and problems

| Screen | Features | Main problems addressed |
|---|---|---|
| S01-S04 | F20 | Discovery |
| S05-S06 | F1, F2, F17, F20 | P0.x, setup speed |
| S07 Home | F6, F17, F20 | P3.1 |
| S08 Overview | F6, F7, F15, F16 | L10, P3.1, P3.9 |
| S09 Brief | F1 | P0.1, P0.5, D1-D12, L4, L8 |
| S10 Team | F2, F16 | P1.1-P1.6, P3.12, L5, L9 |
| S11 Ideate | F3 | P2.1-P2.5, L2, L6 |
| S12 Plan | F4 | L1, L2, L4, W2, W6 |
| S13 Docs | F5 | P3.1, P4.x |
| S14 Board | F6 | P3.1, P3.2, P3.6-P3.9, L1, L2 |
| S15 Schedule | F6, F17 | P3.4, P3.9, P4.1 |
| S16 MVP | F8 | L1, L3, L6, W1, W8, W13 |
| S17 GitHub | F9 | P4.5, D7, D8 |
| S18 APIs | F10 | P3.3, P3.11 |
| S19 Diagrams | F11 | P3.1, L3 |
| S20 Pitch | F12 | P5.x, L3, L4, L7 |
| S21 Demo | F13 | P5.1, P4.4, W12 |
| S22 Submit | F14 | P4.x, D1-D12, L8, W15 |
| S23 Readiness | F15 | L1-L4, L7 |
| S24 Retro | F19 | P6.1 |
| S25 Prep | F17 | P0.2-P0.4 |
| S26 Crowd Check | F18 | P0.6, P2.3, L6 |
| S27 Tools | F13, F11 | P5.1 |
| S28-S29 | Settings, F7 | P3.8 |
| S30 Mentor | F22 | P3.13 |
| S31 Speed Mode | F6, F7 | L10, P3.1 |

---

## 15. Assumptions, open questions, and changes to earlier documents

**Assumptions I made (change any of them):**
1. Brand color is the lavender from R1 in both themes; orange/peach means time; coral/red means blocked/danger.
2. Sidebar is dark in the light theme (R1); the light sidebar card from R2 is not used for global navigation, only its members-list pattern.
3. Speed Mode defaults to dark theme.
4. The product name is [brackit] (originally placeholder "Hackathon OS" from `ideation.md`).
5. English UI at launch.

**Open questions:**
- **Font check:** confirm Manrope on real screens (I chose it for its close resemblance to the references, its tabular figures, and its open license). Its lack of Devanagari matters if you expect Hindi content.
- **Reference art:** do you want me to search for a specific CC0 illustration set (Open Peeps vs Humaaans) and define the exact palette mapping?
- **Calendar library:** one-day spike needed (FullCalendar vs Schedule-X vs ReUI Event Calendar).
- **Evil Charts and Scalar licenses:** to verify before installing.

**Changes this document implies for `tech_stack.md`:**
- shadcn/ui base is **Base UI (new default since July 2026) or Radix**, not "Radix underneath".
- Docs editor: **Plate primary, Tiptap fallback** (instead of "TipTap or CodeMirror" only); CodeMirror stays for Mermaid/JSON.
- API viewer: **Scalar** primary, Swagger UI fallback.
- Add Kibo UI, ReUI, Evil Charts, shadcn-heatmap to the frontend dependency list, all installed through the shadcn CLI.
- Add Manrope and JetBrains Mono (Fontsource) and a Devanagari fallback font.

---

## 16. Sources

| Claim | Source |
|---|---|
| Reference colors and contrast values | Measured directly from your six uploaded images; contrast computed with the WCAG relative-luminance formula |
| Manrope: open source, on Google Fonts, variable weights 200-800, tabular figures; scripts supported (Latin, Cyrillic, Greek, Vietnamese) | https://github.com/terrapkg/pkg-manrope-fonts ; https://typewolf.com/manrope |
| shadcn/ui: Base UI default (July 2026); React Aria base; eight styles; chat components (June 2026); shadcn/cli v4 presets | https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default ; https://ui.shadcn.com/docs/changelog/2026-07-react-aria ; https://ui.shadcn.com/docs/changelog ; https://ui.shadcn.com/docs/changelog/2026-03-cli-v4 |
| shadcn styles: Luma (pill-shaped controls, fully rounded cards), Maia (soft and rounded), Mira/Nova (compact) | https://www.shadcnblocks.com/docs/blocks/styles ; https://dev.to/shadcncraft/pick-your-shadcn-base-your-style-your-icons-23dm |
| Kibo UI: MIT registry (Kanban, Gantt, Calendar, editor, Dropzone, code block); Shadcnblocks acquisition | https://www.kibo-ui.com/ ; https://designrevision.com/compare/shadcn-vs-kibo-ui ; https://21st.dev/blog/kibo-ui-components |
| ReUI: components (Data Grid, Kanban, Filters, Stepper, Tree), Radix and Base UI versions; event calendar | https://docsearch.algolia.com/mcp/docs/repo/keenthemes/reui ; https://reui.io/docs/components/radix/event-calendar |
| Evil Charts: shadcn + Recharts, area/bar/line/pie/radar; license shown as unknown on 21st.dev | https://evilcharts.com ; https://github.com/legions-developer/evilcharts ; https://21st.dev/@LegionWebDev/components/bar-chart.md |
| shadcn-heatmap; shadcn.io stats blocks | https://github.com/fishdev20/shadcn-heatmap ; https://www.shadcn.io/blocks/stats-hourly-heatmap-grid ; https://www.shadcn.io/blocks/stats-burndown-chart-card |
| Aceternity / Magic UI positioning (marketing, motion-first) and Origin UI (application surfaces, no animated heroes) | https://www.pkgpulse.com/guides/aceternity-ui-vs-magic-ui-vs-shadcn-animated-react-2026 ; https://designrevision.com/alternatives/magic-ui ; https://21st.dev/blog/origin-ui-components |
| Calendar/scheduler options and licenses (FullCalendar, react-big-calendar MIT; Schedule-X) | https://blog.logrocket.com/best-react-scheduler-component-libraries/ ; https://daily.dev/posts/best-react-scheduler-component-libraries-qn8yoyffu |
| Editors: BlockNote, Tiptap, Plate | https://tiptap.dev/alternatives/blocknote-vs-tiptap ; https://sourceforge.net/software/product/Plate-JS/alternatives |
| springdoc 3.x for Boot 4 with Scalar | https://github.com/hendisantika/spring-boot-test-container-postgresql/pull/37 |
| Illustration licenses (Open Peeps CC0; Humaaans; unDraw restrictions; Storyset attribution; Blush paid) | https://www.openpeeps.com/ ; https://allsvgicons.com/cc0-illustrations/ ; https://pixels.market/blog/best-free-illustration-sites |
| AI-slop patterns and the "written direction with exact values" fix | https://vibecodekit.dev/ai-slop-design ; https://www.mindstudio.ai/blog/claude-design-avoid-ai-slop-design-system ; https://github.com/nate-zz/DeSlop |
| Product context | `problem.md`, `ideation.md`, `tech_stack.md` |

*WCAG 2.2 requirements (contrast 4.5:1 and 3:1, target size 24×24) are stated from general knowledge of the standard, not from a source fetched in this session. Libraries not marked "verified" in Section 12 (Plate, Tiptap, BlockNote, CodeMirror, Scalar, dnd-kit, TanStack Table, cmdk) are recommended from general knowledge and should be checked before adoption.*
