# [brackit] landing page: ideation.md

> **What this file is.** The single source of truth for ideating and later building the [brackit] landing page. Part A (about 10%) is the project context any AI needs. Part B (about 90%) is the full creative ideation: concept, flow, every section, every component, down to sizes, timings and copy.
> **What this file is not.** It is not a build prompt. The page is built later in many small slices (Part B, section 16). Never paste this whole file into a coding agent.
> **Conventions.** `[DECIDED]` = chosen here, change only on purpose. `[OPEN]` = needs a founder call, a default is given. `[CALIBRATE]` = based on a text-only reading of a reference, check against a screen recording before building. `[VERIFY]` = a claim or number to re-check before it goes public.
> **Naming.** If the repo already has an `ideation.md` for the product, store this one as `landing/ideation.md`.

---

# PART A. Project context (the 10%)

## A1. The product in 60 seconds
- **Name:** `[brackit]`, always lowercase, brackets included, in headings, buttons and sentence starts. URLs, slugs, emails and filenames drop the brackets (`brackit`). Formerly "Hackathon OS"; the repo folder `hackathon-os/` and Java package `com.hackathonos.backend` are code names, never shown to users.
- **Descriptor:** "a hackathon OS": an execution operating system and real-time team room for hackathons.
- **Core promise:** go from problem statement to a rehearsed, verified submission without losing the clock.
- **Status:** the product is finished and working. Only the landing page remains.
- **Who signs in:** hackathon teams and solo builders via GitHub or Google OAuth. No credit card.
- **Primary audience:** student teams in big competitions (Smart India Hackathon, MLH, Devpost, collegiate events). Secondary: corporate innovation hackathons, solo builders. Future: organizers and mentors.
- **Positioning in one line:** hackathon teams rarely lose on talent; they lose on sequencing (rubric unread, scope bigger than the clock, demo broken at minute thirty). [brackit] keeps the whole sprint on one clock and enforces the checkpoints that decide hackathons.
- **Five pillars:** clock-aware, rubric-aware, gated, demo-first, honest.

## A2. The journey the page must mirror (8 stages)
1 Set up, 2 Read the brief, 3 Align the team, 4 Choose one idea, 5 Plan, 6 Build, 7 Present, 8 Submit and keep. Readiness rings run alongside from stage 6 on.

## A3. Tech stack of the landing page
- **Where it lives:** `frontend/src/features/landing/` in the existing app (React 19, TypeScript strict, Vite, Tailwind CSS v4, shadcn/ui, Radix, Lucide, React Router v7). It is a Vite SPA, not Next.js.
- **Motion:** `motion` (the Framer Motion successor, import from `motion/react`) only. Use `LazyMotion` with `domAnimation` to keep the bundle small. No GSAP, no Lenis or other scroll hijacking. Native scroll.
- **Fonts (self-hosted, subset, `font-display: swap`):** Instrument Serif (regular and italic) for display, Inter Variable for UI and body, JetBrains Mono Variable for clocks, labels, hashes.
- **No new heavy dependencies.** Waveforms, stamps, rings, grids and glows are CSS, SVG and canvas-free where possible.
- **[OPEN] Landing location and SEO:** a pure SPA hurts link previews and indexing. Default: static meta and Open Graph tags in `index.html` for `/`, plus prerendering of `/` only (for example `vite-react-ssg` or a prerender plugin) decided in the build phase. Do not move the app to Next.js for this.
- **Existing landing components** in `features/landing/` have not been audited. Before replacing, list them and decide per file: keep, restyle, delete.

## A4. Routes the page links to (all exist)
| Purpose | Route |
|---|---|
| Primary CTA "Start a room" | `/signin`, then `/app/create-room` |
| Secondary CTA "Browse playbooks" | `/playbooks` (public, no login) |
| Tool directory | `/app/tools` (public browsing) |
| Situation picker (the three doors) | `/app/situation` |
| Pricing waitlist | modal, `POST /api/v1/billing/interest`, no purchase link |
| System pages | `/403`, `/404`, `/500`, `/offline`, `/maintenance` |

## A5. Design tokens that already exist (reuse, do not rename)
```css
--shell:#F5F5F5; --surface:#FBFBFB; --card:#FFFFFF;
--border:#EAEAEA; --border-strong:#DADADA; --hover:#EFEFEF; --active:#EBEBEB;
--ink:#0A0A0A; --ink-2:#737373; --ink-3:#A3A3A3;
--brand-from:#6D5EF5; --brand-to:#9B8CFF;   /* violet gradient */
--bg-accent:#F0B04A;                        /* warm amber */
--success-bg:#DDF7DA; --success-fg:#16820F; --warn-bg:#FEF1D6; --warn-fg:#A15C07;
--danger:#E5484D;                           /* deadline, destructive, the stamp */
/* PRESENT "stage" palette */
--stage-ink:#0E0E10; --stage-dark-card:#151517;
--stage-sun:#FDE781; --stage-orange:#FF7A1A; --stage-pink:#FCC4E0;
--stage-lilac:#C4C5FC; --stage-mint:#A5EFBE; --stage-sky:#B7D9FF;
```
Fonts: display `'Instrument Serif', Georgia, serif`; UI `'Inter Variable', -apple-system, 'Segoe UI', Roboto, sans-serif`; mono `'JetBrains Mono Variable', 'JetBrains Mono', monospace`.

## A6. Voice and copy rules
- Direct, calm, specific, short sentences. No hype.
- **Banned words:** `seamless`, `unleash`, `supercharge`, `elevate`, `effortless`, "let's get started!".
- Say "Rubric never read." not "Unlock the power of intelligent rubric analysis." Say "Three rooms a month, free." not "Generous free tier."

## A7. Claim guardrails (non-negotiable)
**Never say:** it writes your whole app or is "autonomous AI coding"; it submits to Devpost, Devfolio or Unstop; Pro or Max can be bought today; Google Docs-style live cursors; server-side video recording or hosting; invented testimonials, user counts, awards, partners, logos; any measured generation time (none exists).
**Safe to say:** reads your problem statement (text, PDF, images) and extracts rules and rubric for you to confirm; generates a PRD, tech stack, phases, demo script and 9 Markdown docs through a backend AI gateway with no API key needed; seeds a phase-driven task board with dependency enforcement; tracks built versus mocked in a Reality Ledger; rehearsal with live microphone waveform and anticipated judge questions; flags pre-event commits and freezes a demo tag on GitHub; live team sync with offline caching and ZIP export; free plan is 3 rooms a month.
**Say carefully [VERIFY]:** "38 tasks"; "updated weekly" for the tool directory; "zero affiliate links"; SIH, MLH and Devpost only as "playbooks for", never as partners. No audience-visible mention of "Rule 13" or "sub-second".

## A8. Real facts usable on the page (verified in the brief)
6 event playbooks (SIH 36h team of 6; Devpost 48h teams of 1 to 4; MLH 36h; 4-hour generative AI sprint; corporate 24h; solo 24h). 9 docs generated per room (`PRD.md`, `PROBLEM.md`, `TECH_STACK.md`, `PHASES.md`, `MVP.md`, `CUT_LIST.md`, `RISKS.md`, `DEMO_SCRIPT.md`, `DECISIONS.md`). 6 readiness rings (Rubric coverage, MVP health, Demo rehearsal, Pitch deck, Submission checklist, Fallback insurance). 3 rooms a month free. 4-step plan pipeline. 8 stages. Zero client keys. AES-256-GCM encrypted tokens. SSE live sync with 20-second polling fallback. ZIP export.

**There is no social proof.** No users, quotes, logos or awards exist. The page earns trust with verifiable facts and live product demos instead (sections 6.2 and 6.4).

---

# PART B. The ideation (the 90%)

## 1. The one-paragraph thesis
Most hackathon tools sell features. [brackit] sells **order**. So the page is built as one long hackathon: **hour 36 at the top, a submitted project at the bottom**, with a clock that runs as you scroll. First the page shows how teams lose (five failures pinned to the hours where they happen). Then it replays the same 36 hours inside [brackit]. It ends on a red `SUBMITTED` stamp landing with **hours still on the clock**, because the product's real promise is not "finish at the buzzer" but "submit with margin". Visually it borrows Wispr's restraint (quiet, light, one typographic rule), Huly's framing and dark-stage flip, Fibery's dry voice, and Aceternity's calm section rhythm. The brand device is the bracket pair: to *bracket* something is to mark it and set it apart, which is exactly what the product does to a rubric, a rule, an idea, a risk.

## 2. Decisions made, and the ones left open

### 2.1 [DECIDED]
| # | Decision | Why |
|---|---|---|
| D1 | **Concept = "hour 36 to submitted"** (scroll as the clock) plus **the bracket as the visual language**. | Ties the page to what the product does (clock-aware, gated, deadline-driven) and gives an emotional arc. |
| D2 | **Base theme is light and quiet** (Wispr-like), using the product's own tokens. | Matches the product UI the visitor will actually see. |
| D3 | **One dark "stage" act** (Huly-style flip) for pitch rehearsal and submission, using the `--stage-*` palette. | The brief already reserves the dark palette for these two moments. |
| D4 | **Hero is a live demo, not an illustration:** a messy pasted brief gets bracketed, extracted and confirmed, and the clock starts. | Wispr's best trick: perform the product's value in the hero. [brackit] also turns mess into structure. |
| D5 | **Effect budget: three showpiece moments** (hero demo, the 36-hour rail, the stage act). Everything else is quiet. | Taste is restraint. Avoids the Aceternity-style "everything is moving" overcrowding. |
| D6 | **One type rule:** every H2 ends in an italic phrase (Instrument Serif italic). | Wispr's repeated device; the cheapest way to look designed. |
| D7 | **The ending shows margin, not the buzzer:** clock stops with hours left, "Submitted with margin." | Reverses the opening failure story and matches "submit with margin". |
| D8 | **No audio, no mic prompt, no custom cursor, no smooth-scroll hijack.** | Trust, accessibility, performance. The waveform is simulated; real mic use lives inside the product. |
| D9 | **Use real product visuals** (seeded fixture room, fictional names) plus a few live-coded mini UIs for animation. | The product exists; faking it would waste the biggest advantage. |
| D10 | **Section order:** hero, doors, proof strip, problem rail, pivot, how it works, two deep dives, dark stage, playbooks, room grid, trust, compare, pricing, FAQ, final CTA (dark), footer. | Section 4 explains each job. |

### 2.2 [OPEN] with defaults
| # | Question | Default if unanswered |
|---|---|---|
| O1 | Public domain, deployment and email domain. | Use relative links; no "live now" claims. |
| O2 | Is the rail's five-failure order allowed to differ from `copy.ts` (which lists them in a different order)? Wording stays verbatim; only order changes to chronological. | Yes, chronological. |
| O3 | Is Review/Retro/Summary free or Max-only? | Show Max as "Review, Retro and Project Summary pages" per `plans.json`; revisit before pricing is built. |
| O4 | Does `create-room` accept a `?name=` query param so the final CTA's "name your room" field carries over? | Treat as a stretch. If not, the field is removed and the button just links. |
| O5 | Real screenshots versus live-coded UI per section (section 12). | As listed in the asset table. |
| O6 | India-first: SIH first in playbooks, examples in IST, no currency display beyond the pricing cards. | Yes, India-first examples; copy stays globally readable. |
| O7 | Logo mark. | Build from the bracket pair; retire the `H` monogram (section 3.3). |
| O8 | Will the name "brackit" be read as "bracket it" in copy? | Use it only visually (marking things), never as a claimed origin story. |

## 3. Design system for the landing page

### 3.1 Grid, space and shape
- **Design frame:** 1440 wide. **Content max-width:** 1200. **Wide max (demo frames):** 1280. 12 columns, 24px gutters, 24px page padding on mobile, 40px on tablet, auto-centered on desktop.
- **Section vertical padding:** 160px top and bottom desktop, 120px tablet, 88px mobile. Pinned sequences ignore this.
- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. No other values.
- **Radii:** 8 (chips, inputs), 16 (cards), 24 (large frames), 999 (pills). The stamp and brackets are square-cornered on purpose.
- **Borders:** 1px `--border` on cards; `--border-strong` on hover. No drop shadows on cards in the light theme. Only the demo frames and the nav get a shadow: `0 1px 0 rgba(10,10,10,0.04), 0 24px 64px -24px rgba(10,10,10,0.18)`.
- **Backgrounds:** `--shell` page, `--surface` alternate bands, `--card` cards.

### 3.2 Typography (desktop / mobile)
| Role | Font | Size / line-height | Tracking | Notes |
|---|---|---|---|---|
| H1 | Instrument Serif | `clamp(52px, 7.2vw, 104px)` / 0.96 | -0.02em | One italic phrase |
| H2 | Instrument Serif | `clamp(36px, 4.4vw, 60px)` / 1.02 | -0.015em | Always ends in an italic phrase (D6) |
| H3 | Inter Variable 600 | 20 / 1.3 | -0.01em | Card titles |
| Lead | Inter Variable 400 | 20 / 1.5 (mobile 17 / 1.5) | 0 | `--ink-2`, max 56ch |
| Body | Inter Variable 400 | 16 / 1.6 | 0 | `--ink-2` on light |
| Eyebrow | JetBrains Mono 500 | 12 / 1 | 0.08em, uppercase | `[ 01 ]` index, then label. Counts allowed: `6 playbooks` |
| Clock | JetBrains Mono 500, tabular nums | 14 (HUD), 96 (stage) | 0.02em | `font-variant-numeric: tabular-nums` always |
| Caption | Inter 500 | 13 / 1.4 | 0.01em | `--ink-3` |

Italic rule: in H1 and H2 the italic phrase is Instrument Serif Italic, same size, `--ink`. Never colored, never gradient text.

### 3.3 The bracket device (the brand's one idea, used in five places)
1. **Logo mark:** `[brackit]` wordmark in Instrument Serif, 22px in the nav, brackets in `--brand-from`, letters in `--ink`. Standalone mark `[ ]` (favicon, loader): two square brackets, 2px stroke, 40% height gap, `--ink` (favicon on `--ink` background in `--stage-sun`).
2. **Highlighter:** when the product "finds" something in the hero, a bracket pair draws around it (SVG stroke-dashoffset, 280ms).
3. **Frame:** large product frames are flanked by tall brackets set 16px outside the frame, stroke 2px, `--border-strong` (light) or `rgba(255,255,255,0.28)` (dark).
4. **Index markers:** eyebrows are `[ 03 ]`; stages are `[01]`..`[08]`.
5. **Final CTA:** one oversized bracket pair, 70vh tall, stroke 2px, draws on entering view.
Rule: brackets never decorate randomly. They mean "this is marked and confirmed".

### 3.4 Color use
- Light acts: `--shell` base, `--ink` text, `--ink-2` secondary. Violet appears only as: logo brackets, focus rings, one soft wash behind the hero demo (radial, `--brand-from` at 10% opacity, 720px, blurred 120px), and active states.
- Amber `--bg-accent` appears only as clock accents and the warm rim in the stage act.
- `--danger` is reserved for time pressure (rail HUD under 06:00:00, the unread tag) and the stamp. It must feel rare.
- Dark act: `--stage-ink` background, `--stage-dark-card` cards, cream text `#F4F1EA`, mint `--stage-mint` for the waveform, sun `--stage-sun` for the teleprompter's current line. Edge glow on the stage frame: left `--brand-from` at 35%, right `--bg-accent` at 35%, blur 48px (echoes Huly's blue/orange rim in our own colors).

### 3.5 Texture and depth
- **Hairline grid** behind the hero and final CTA: 1px lines `--border`, 64px cells, masked with a radial gradient so it fades out by 640px from center. (Aceternity-like background grid, quiet version.) [CALIBRATE]
- **Grain:** 3% opacity monochrome noise PNG (128px tile) over light acts; 5% over the dark act. `pointer-events: none`.
- No gradient blobs, no glassmorphism, no emoji, no stock photography, no illustrations of people.

### 3.6 Motion system
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for everything entering; `cubic-bezier(0.4, 0, 1, 1)` for exits. Springs only for the stamp and the doors (stiffness 320, damping 28).
- **Durations:** micro 120ms, hover 180ms, reveal 480ms, scene 700ms.
- **In-view reveal (default):** opacity 0→1, translateY 12px→0, once only, stagger 60ms, threshold 25%.
- **Scroll-linked motion exists in exactly three places:** the problem rail, the how-it-works sticky pane, the stage act. Everywhere else is trigger-once.
- **Reduced motion:** every scroll-linked and looping animation collapses to its final static state. The hero demo shows its end state. The stamp is simply present. Nothing is hidden behind motion.
- **No parallax on text.** No scroll-jacking: the user always controls scroll speed.

### 3.7 The clock HUD (the persistent device)
- A small mono pill in the center of the floating nav: `T–36:00:00` with a 6px dot on the left. 28px tall, padding 0 12px, `--card` background, 1px `--border`, 14px JetBrains Mono.
- It shows **illustrative** time-remaining tied to scroll position (never real time). States:
  - **Idle (hero):** `T–36:00:00`, dot `--ink-3`, no motion.
  - **Rail (problem section):** counts down fast as you scroll the 36-hour rail; under `06:00:00` the pill turns `--danger` text with a `--danger` 12% background.
  - **Reset (pivot):** snaps back to `T–36:00:00`, dot turns `--brand-from`, one 240ms pulse ring.
  - **Room (how it works):** moves with the stage list (section 9 maps each stage to a time).
  - **Stage (dark act):** pill inverts (dark card, cream text); stops at `T–03:12:47` when the stamp lands; dot turns `--success-fg`.
  - **After stage:** shows `SUBMITTED` in mono, dot `--success-fg`; remains for the rest of the page.
- On mobile the pill moves to a fixed bottom-center position, 16px above the safe area.
- `aria-hidden="true"`; a visually hidden sentence in the hero says the clock is illustrative.

**Gotcha: product name and CSS.** Never apply `text-transform: uppercase` or `capitalize` to any element that can contain `[brackit]`. Uppercase eyebrows apply only to labels that never contain the product name.

---

## 4. Page flow: one job per section

| # | Section | Job | The visitor should feel | Theme | Approx. scroll length |
|---|---|---|---|---|---|
| 0 | Nav + clock HUD | Orient, always available | "This is a tool with a clock in it." | Light | fixed |
| 1 | Hero (live brief demo) | State the promise, prove it in 6 seconds | "It reads my rules and structures them. Okay." | Light | 100svh |
| 2 | Three doors | Self-select by urgency | "It knows where I am right now." | Light | 1 screen |
| 3 | Proof strip | Verifiable facts, no fake proof | "Specific, not salesy." | Light | 64px band |
| 4 | Problem rail | Name the pain in the clock's terms | "That is exactly how it went last time." | Light, tints red late | about 360vh (pinned, scroll-linked) |
| 5 | Pivot | Reset the clock, flip the story | Relief | Light | 100svh |
| 6 | How it works | The whole arc in one glance | "I can see the whole 36 hours." | Light | about 560vh (sticky, scroll-linked) |
| 7 | Two deep dives | Make gates and honesty tangible | "I can try this right here." | Light | 2 screens |
| 8 | Stage act | Emotional peak: rehearse, then submit with margin | "I want to walk in like that." | Dark | about 300vh (pinned, scroll-linked) |
| 9 | Playbooks | Relevance to my event | "It has my format." | Light | 1.5 screens |
| 10 | Everything in the room | Coverage without a wall of text | "Nothing is missing." | Light | 1.5 screens |
| 11 | Trust | Remove technical and privacy doubt | "I can rely on this." | Light | 1 screen |
| 12 | Compared to what you use | Handle "why not Discord/Jira/Notion" | "Fair. They are not the enemy." | Light | 1 screen |
| 13 | Pricing | Honest expectations | "Free now, no tricks." | Light | 1 screen |
| 14 | FAQ | Close objections | "My question is already here." | Light | 1 screen |
| 15 | Final CTA + footer | Convert | "I will start a room." | Dark | 1 screen + footer |

Total scroll is long (about 22 screens on desktop). That is acceptable only because three of the sections are scroll-linked stories rather than reading. Everything else stays under two screens.

**Rhythm:** light, light, light, (tinting red), reset, light, light, **dark**, light, light, light, light, light, light, **dark**. Two dark flips only (stage act, final CTA) so each one means something.

---

## 5. Navigation

- **Floating pill**, fixed, `top: 16px`, centered, max-width 920, height 56 (48 after 80px of scroll, 240ms), radius 999, background `rgba(251,251,251,0.82)` with `backdrop-filter: blur(16px)`, 1px `--border`, the nav shadow from 3.1.
- **Content, left to right:** `[brackit]` wordmark (22px), links `Playbooks` `Tools` `Pricing` (Inter 14/500, `--ink-2`, hover `--ink`, 180ms), the clock HUD (3.7), `Sign in` (text link), `Start a room` (button).
- **Button:** 36px tall, padding 0 16px, `--ink` background, white text 14/500, radius 999, hover lifts 1px and background `#1b1b1b`.
- **Mobile (below 768):** pill shows wordmark and a 40px round menu button. The menu is a full-screen sheet on `--shell` with the four links as 40px serif lines, `Start a room` as a full-width button pinned at the bottom. HUD moves to a fixed bottom-center pill.
- **During the dark stage act:** the pill switches to dark glass (`rgba(21,21,23,0.78)`, cream text, 1px `rgba(255,255,255,0.12)`) in a 300ms crossfade; the primary button becomes cream with ink text.
- **Anchors:** none visible. The nav links go to routes, not to page sections (this is a story, not a menu).

---

## 6. The opening (hero, doors, proof strip)

### 6.1 Hero layout (1440 frame)
- Section: `min-height: 100svh`, min 780, max 960. Top padding 144 (clears the nav). Background `--shell` with the hairline grid (3.5) and the violet wash behind the demo (3.4).
- **Eyebrow** (centered, 12px mono, no uppercase because it holds the product name): `[brackit] · a hackathon OS`. Pill: padding 6px 12px, 1px `--border`, `--card` background.
- **H1** (centered, max-width 1080, 24px below eyebrow): `Most teams don't lose because they *can't code.*` Forced line break after "lose" on desktop. Two lines at 1280 and up, three lines on tablet.
- **Lead** (20px, `--ink-2`, max-width 600, 24px below H1): `They decide late, scope wrong, and run out of time. [brackit] is a hackathon OS that keeps your team on one clock, from the first brief to the final submit.`
- **CTA row** (32px below lead, 12px gap): `Start a room` (primary, 48px tall, padding 0 24px, radius 999, 16/500, 16px arrow icon that nudges 4px right on hover) and `Browse playbooks` (secondary, 48px tall, 1px `--border-strong`, `--card` background).
- **Under CTAs** (13px caption, `--ink-3`, 16px below): `Free to start. GitHub or Google sign-in. No card.`
- **Visually hidden** sentence for screen readers: `The clock shown on this page is illustrative and tied to scroll position, not the real time.`
- **Alternate H1s** (for A/B later, same layout): `Stop losing hackathons to *bad sequencing.*` and `Built for 36 hours, *not 36 sprints.*`

### 6.2 The hero demo: "the brief becomes a room"
A live-coded mini UI (not a screenshot), so it can animate. It performs the real product moment (brief intake, extraction, leader confirmation) in a fictional event.

**Frame:** 1120 x 560, 64px below the CTA caption, radius 24, `--card`, 1px `--border`, demo shadow. Tall brackets flank it, 16px outside, 2px stroke, `--border-strong`. Header bar 44px with a bottom border: left label `Problem statement` (13px, `--ink-2`); center nothing; right a mono in-frame clock `T–36:00:00` and a `[ replay ]` mono link (12px, `--ink-3`, appears after the sequence ends).
**Split:** left pane 44% (`--surface`, padding 32), right pane 56% (`--card`, padding 32), divided by a 1px border.

**Left pane: the pasted brief (fictional, invented for the demo):**
> Campus Build Sprint 2026 · Problem Statement 07. Build a tool that helps small campus clubs track event budgets. Teams of 2–4. Judging: Impact 30%, Feasibility 30%, Innovation 20%, Presentation 20%. Submission is due Sunday 6:00 PM IST with a 3-minute demo video and a public repo link. No paid APIs. AI tools are allowed with disclosure. Code committed before Friday 9:00 AM disqualifies the team.

Text 14/1.7 Inter, `--ink-2`, with a faint "pasted" look: a 1px dashed `--border-strong` outline and a `Pasted text` chip in the corner. The event is fictional and must never be named SIH, MLH or Devpost here (no implied partnership).

**Right pane: the room's Brief view.** Header row: `Brief` (H3) and a counter `0 of 8 confirmed` (mono). Eight rows (each 44px, radius 8, `--surface`, checkbox 18px square on the left, label, value). The eight items, in order:
1. Rubric: `Impact 30 · Feasibility 30 · Innovation 20 · Presentation 20` with a thin 4-segment weight bar under the row
2. Deadline: `Sun 6:00 PM IST`
3. Team size: `2 to 4 members`
4. Demo video: `3 minutes max`
5. Repo: `Public link required`
6. Tech: `No paid APIs`
7. AI policy: `Allowed, disclose use`
8. Start rule: `No commits before Fri 9:00 AM`
Footer: button `Confirm brief` (disabled, `--border` background, `--ink-3` text, 40px tall, full width) with caption `Only the leader can confirm.`

**Sequence (autoplay once when the hero is 60% in view):**
| t (s) | What happens |
|---|---|
| 0.0 | Frame fades in (480ms). Brief text is fully visible. |
| 0.6 | A mono chip appears top-right of the left pane: `reading…` |
| 1.0 to 2.9 | Eight bracket pairs draw around the matching phrases in the brief, one every 160ms, each stroke 280ms in `--brand-from`. As each draws, its row slides into the right pane (x -16 to 0, opacity 0 to 1, 320ms). The rubric's four weights draw as one long bracket. |
| 3.1 | Chip changes to `8 items found` and turns `--success-fg`. Counter reads `0 of 8 confirmed`. |
| 3.6 to 4.9 | Checkboxes tick one by one (140ms each, 80ms stagger), counter counts up. The bracket around each phrase in the brief turns ink as its row is ticked. |
| 5.2 | `Confirm brief` enables (`--ink` background, white text), 120ms pulse, then the label changes to `Brief confirmed` with a check icon. |
| 5.6 | The in-frame clock starts ticking in real seconds from `T–36:00:00`. A small `Room ready` chip drops in under the header. |
| 6.5 | `[ replay ]` appears. End state holds. |

**Interactive rules:**
- Any pointer-down inside the frame stops the autoplay and leaves the state as is. The visitor can tick the remaining rows themselves, and `Confirm brief` only enables when all eight are ticked. This makes the gate (pillar 3) tangible in the hero.
- `[ replay ]` resets and replays at the same speed.
- No sound, no real data, nothing is sent anywhere.

**Reduced motion:** show the end state immediately; `[ replay ]` hidden.
**Mobile:** frame becomes one column (brief on top, 200px tall and clipped with a fade; rows below). Frame width = viewport minus 48, brackets hidden. Sequence unchanged.

### 6.3 The three doors (below the hero, 96px gap)
Three cards in a row inside the 1200 container: each 384 x 148, 24px gap, radius 16, `--card`, 1px `--border`, padding 24. Layout inside: top row mono tag `[ 01 ]`, then title (Inter 600, 20px), then one 14px `--ink-2` line, arrow icon bottom-right.
| Door | Title | Line | Goes to |
|---|---|---|---|
| 1 | The event hasn't started. | Pick a playbook, read the rules, form the team. | `/signin` with `?intent=prep` |
| 2 | The event is live. | Get the brief in, lock one idea, generate the plan now. A 6px `--danger` dot pulses beside the tag (1.6s). | `/signin` with `?intent=speed` |
| 3 | Just exploring. | Browse playbooks and the tool directory. No account. | `/playbooks` |
Hover: lift 2px, border `--border-strong`, arrow nudges 4px, 180ms. **[OPEN]** whether `/app/situation` accepts `?intent=`; if not, all three go to `/signin` and door 3 stays `/playbooks`.
Above the row: no heading. Only a 13px caption centered, `--ink-3`: `Where are you right now?`

### 6.4 The proof strip
A single band, 64px tall, 1px top and bottom `--border`, centered mono 13px, `--ink-2`, separated by ` · `: `6 event playbooks · 9 docs generated per room · 3 rooms a month, free · No API key needed`. Each item reveals with 60ms stagger. This is the Aceternity-style "eyebrow with a real count" idea, used as a trust device because no social proof exists. Never replace these with invented numbers. [VERIFY] each number before launch. Swap in real numbers or quotes only when they exist.

---

## 7. The problem rail: "how the 36 hours usually go"

**Job:** make the visitor recognize their own last hackathon, with the five existing failure lines, in the order they actually hit a team. This is showpiece moment #2 (scroll-linked, pinned).

**Header (one screen):** eyebrow `[ 01 ] the problem`; H2 `Here is how the 36 hours *usually go.*`; one line under it: `Illustrative. A team that skipped the order.` (`--ink-3`).

**Layout (desktop):** section pinned for about 360vh. Left column (5 of 12) holds the H2 in a compact size (44px) and a small legend (`Time remaining` label plus the mono clock readout mirroring the HUD, 28px). Right column (7 of 12) holds the **rail**: a 2px vertical line (`--border-strong`) at x = 0 of the column, with a fill that grows from the top as you scroll (ink, turning to `--danger` after stop 3). Five nodes (14px circles) sit on the line; the active node fills and gets a 6px ring in `--ink` at 12%. Each stop is a card (width 100% minus 48 from the rail, min-height 260, `--card`, 1px `--border`, radius 16, padding 32) that slides in from the right (x 24 to 0, 480ms) when its node activates, and dims to 40% when the next one arrives.

**Stop content** (copy in bold is verbatim from `copy.ts`; order is chronological, see O2):
| # | Time label | Line (H3 serif, 40px) | Supporting line (16px) | Mini-visual (CSS, 280x180, right side of card) |
|---|---|---|---|---|
| 1 | `T–36:00:00` | **Rubric never read.** | The rules sat in a PDF nobody opened. A missing demo video, the wrong team size or a single-commit repo can disqualify a team. | A document card with an `unread` dot; its criteria lines are gray bars. At the end of the stop a `--danger` tag slides in: `video missing`. |
| 2 | `T–30:00:00` | **Scope larger than the clock.** | Five half-working paths. Zero end-to-end flows. | Five horizontal progress bars filled to different partial widths (30 to 70%). None reaches 100. |
| 3 | `T–18:00:00` | **No demo running by the halfway point.** | Halfway through there is still nothing to click. [VERIFY: "6 to 10 hours debating tech and ideas" comes from `docs/problem.md`; use it only if confirmed.] | A browser bar with an empty live-URL field and a `—` placeholder; a spinner that never resolves. |
| 4 | `T–01:00:00` | **Submission started last.** | The form, the video and the repo link all land in the final hour. | A submission form with four empty fields and a progress bar at 0%. |
| 5 | `T–00:20:00` | **No fallback if wifi fails.** | The demo needs the network. The network is gone. | A wifi icon with a diagonal slash; a demo frame showing `Connecting…` |

**HUD behaviour:** scroll progress through the rail maps piecewise-linearly to the clock so each node lands on its own time: node 1 at 36:00:00, node 2 at 30:00:00, node 3 at 18:00:00, node 4 at 01:00:00, node 5 at 00:20:00, end at 00:00:00. Under `06:00:00` the HUD pill goes `--danger` (text) with a 12% `--danger` background. The section background gains a `--danger` tint at 3% after node 4 (fades in over 600ms of scroll).

**Closing beat (after node 5, 80vh):** the clock reads `00:00:00` and holds. Centered serif line, 56px: `None of this is a coding problem. It is an *order problem.*` Then the pin releases.

**Mobile:** no pinning. Stops stack vertically as full-width cards with the rail as a 2px line on the left. The HUD still updates (bottom pill) as each card enters the viewport. Mini-visuals sit under the text.
**Reduced motion:** stops render as a static vertical list with all five cards visible, the rail fully filled, HUD showing `T–00:00:00`.
**Fallback for a simpler build (if the pin is too heavy):** use the tab switcher from the brief (five tabs, one card visible at a time) with the same cards. The rail is the preferred design; the tabs are the backup.

---

## 8. The pivot: "same 36 hours"
- Height `100svh`, background `--shell`, nothing else on screen.
- As the rail section ends, the red tint fades out (600ms) and the HUD snaps back to `T–36:00:00` with a 240ms pulse ring; the dot turns `--brand-from`.
- H2, centered, 72px: `Same 36 hours. *Different order.*`
- Under it, 16px `--ink-2`, one line: `Read the rubric. Pick one idea. Ship a demo that works.`
- Bottom center: mono `[ scroll ]` with a 12px arrow that bobs 4px (1.6s loop; stops under reduced motion).

---

## 9. How it works: the whole arc, sticky and scroll-linked

**Job:** show all eight stages in one pass so the visitor can see the whole 36 hours. This is the product tour. It uses real screenshots (light theme) of the seeded fixture room (section 12). This is the third scroll-linked section, kept light so the dark stage act later hits harder.

**Header (above the pin):** eyebrow `[ 02 ] how it works`; H2 `From kickoff to submission, *on one clock.*`; lead (`--ink-2`): `Eight stages. One room. The checkpoints that decide hackathons are built in.`

**Layout (desktop):** the section is about 560vh tall (8 stages x 70vh). A sticky container (`top: 96px`, height `calc(100svh - 128px)`) holds two columns:
- **Left (4 of 12): the stage list.** Eight items, each 56px tall when inactive: mono index `[01]`, title (Inter 600, 18px). Inactive items sit at 40% opacity. The active item grows to about 120px (320ms) and reveals the outcome line (16px, `--ink-2`) and a mono time label (`T–35:40:00`). A 2px vertical progress line runs along the left edge of the list (ink fill).
- **Right (8 of 12): the product frame.** 784 x 500, radius 24, `--card`, demo shadow, tall brackets 16px outside, `--border-strong`. The screenshot sits at 100% width. On stage change the old image fades out and the new one fades in (420ms, y 8 to 0, scale 0.985 to 1). 200ms later the stage's bracket callouts draw (280ms stroke). A mono caption chip sits bottom-left inside the frame (12px, `--card` at 90%, 1px border): e.g. `Brief · leader confirmation`.
- **In-frame demo cursor:** a 14px ink arrow cursor moves to one callout per stage over 600ms and "clicks" (scale 0.9, 120ms). This is part of the picture, not a site cursor (D8 stands for the site).
- **Readiness rings** (from stage 6): six 20px rings cluster at the frame's top-right and fill progressively through stages 6 to 8. They stay visible until the end of the section.

**Stages (all outcome lines are final copy):**
| # | Title | Outcome line | Screenshot (fixture room) | Bracket callouts | HUD time |
|---|---|---|---|---|---|
| 01 | Set up the room | Pick a playbook. The room is ready. | Create Room wizard with event template chosen | the template, the 4-character join code | `T–36:00:00` |
| 02 | Read the brief | Rules and rubric, confirmed by the leader. | Brief with extracted rubric and weights, confirm bar | the rubric weights, the confirm button | `T–35:40:00` |
| 03 | Align the team | Roles named. Skill gaps visible. | Team page with roles and Skill-Gap Meter | the meter's seven axes, the Team Charter | `T–34:30:00` |
| 04 | Choose one idea | The best idea wins, not the loudest voice. | Ideate with silent round revealed and AI Stress Test | the anonymous votes, the lock button | `T–33:00:00` |
| 05 | Plan | Nine docs and a seeded board. | Plan (4 steps done) beside the 9-file Docs vault | the 9 files, the step bar | `T–30:00:00` |
| 06 | Build | One core flow. An honest ledger. | Board with a dependency lock and an "I'm Blocked" card | the dependency lock, the blocked chip | `T–28:00:00` |
| 07 | Present | Rehearse out loud. Hear the hard questions. | Pitch Kit rehearsal view | the waveform, the Judge's Chair tab | `T–06:00:00` |
| 08 | Submit and keep | Submit with margin. Keep the proof. | Launch Pad State A (countdown, no stamp yet) | the countdown, the leader-only button | `T–03:12:47` |
The HUD interpolates smoothly between these anchors as the visitor scrolls. **The stamp is not shown here.** Stage 08 shows the countdown state only; the stamp lands in the stage act (section 11) so the payoff happens once.

**Mobile:** no pin. Eight stacked cards, each with the stage title, outcome line, the screenshot (16:10, full width, radius 16) and its callouts already drawn. HUD updates as each card enters view.
**Reduced motion:** same stacked layout as mobile, on every viewport.

---

## 10. Two deep dives: "build what the judges *will reward*"

**Job:** make two product ideas tangible with small things the visitor can touch. Each is a live-coded mini UI, interactive, with canned example data (labelled).

**Section header:** eyebrow `[ 03 ] the gates`; H2 `Build what the judges *will reward.*`; lead: `A confirmed rubric, one end-to-end flow, a rehearsed pitch, and an honest answer to "what did you build?"`
**Row layout:** two rows, 160px apart, alternating sides. Text column 5 of 12, demo column 7 of 12 (about 640 x 420 frame, radius 24, tall brackets, same shadow). On mobile the demo sits under the text, full width. Dive titles use **Display-S**: Instrument Serif 40/1.1, same italic-ending rule.

### 10.1 Dive A: one idea, tested before any code
- **Eyebrow:** `Gated` (mono, 12px).
- **Title:** `One idea, tested *before any code.*`
- **Body:** `Everyone pitches in silence, then the room reveals, critiques and votes. An AI stress test checks each idea against your confirmed rubric, your hours left and the obvious AI-wrapper trap. The leader locks one.`
- **Benefit line:** `The best idea wins, not the loudest voice, and oversized ideas get flagged before any code is written.`
- **Demo:** three idea chips across the top (fictional ideas for the fictional event, e.g. `Receipt-to-budget`, `Club treasurer bot`, `Event cost splitter`). Below, an idea card (identity sentence "Tool that does X for Y", wow moment, riskiest assumption) and a `Stress test` button.
  - Click a chip: card content swaps (240ms).
  - Click `Stress test`: four bars animate in (480ms, 100ms stagger): `Rubric fit` (weighted by the four rubric criteria shown as a segmented bar), `Finishable in the hours left`, `Technically feasible`, `Different from an AI wrapper`. Each bar ends with a small verdict chip (`strong`, `risky`, `low`), values canned per idea.
  - A `Lock idea` button (leader-only caption) bracket-highlights the card when clicked, adds a lock icon, and shows `The plan starts from this one.`
  - A permanent caption under the frame (12px, `--ink-3`): `Example output with sample data.`

### 10.2 Dive B: the Reality Ledger
- **Eyebrow:** `Honest`
- **Title:** `What did you build *this weekend?*`
- **Body:** `An honest answer prepared in advance. Mark each component as built this weekend, an existing library or API, mocked, or planned. The ledger turns judge questions into answers you already wrote.`
- **Benefit line:** `You can answer judge questions honestly and confidently.`
- **Demo:** a ledger of six components for the fictional app: `Budget dashboard`, `Receipt scanner`, `Payments`, `Club roles`, `Email reminders`, `Export to Sheets`. Each row has a 4-option segmented control (`Built`, `Existing`, `Mocked`, `Planned`, 28px tall, radius 8). Starting state: Built, Mocked, Existing, Built, Planned, Mocked.
  - A stacked bar above the table shows the mix (Built `--ink`, Existing `--brand-to`, Mocked `--bg-accent`, Planned `--border-strong`); it re-animates (320ms) on every change.
  - Below the table, a `What breaks first` card shows one pre-written line per Mocked row, for example `Receipt scanner returns sample data. Say so first.` Lines appear and disappear (200ms) as rows change.
  - Keyboard: segmented controls are radio groups (arrow keys). Focus ring 2px `--brand-from`, 2px offset.
  - Caption: `Example ledger with sample data.`

---

## 11. The stage act: rehearse, then submit with margin (dark, pinned, scroll-linked)

**Job:** the emotional peak and showpiece moment #3. The page goes dark, the product looks lit like an object (Huly's lesson), and the story ends on the `SUBMITTED` stamp landing with hours left. Pillars served: demo-first and honest.

**Pin:** about 300vh. The sticky container is `100svh`. Scroll progress `p` runs 0 to 1. Background `--stage-ink` plus 5% grain. Every scene is a state of one frame, not a new page.

### 11.1 Scene by scene
| p | Scene | What the visitor sees |
|---|---|---|
| 0.00 to 0.12 | **Curtain** | A dark layer rises from the bottom (translateY 100% to 0) with an 80px soft gradient top edge. The nav switches to dark glass. H2 in cream, 80px: `Walk in *ready.*` One line under it, 18px `rgba(244,241,234,0.7)`: `Rehearse out loud. Hear the hard questions first. Submit with margin.` Eyebrow `[ 04 ] the stage`. |
| 0.12 to 0.40 | **Rehearsal** | The stage frame fades in: 960 x 540, `--stage-dark-card`, radius 24, 1px `rgba(255,255,255,0.08)`, rim glow (left violet, right amber, 3.4). Left 60%: the **teleprompter**: five lines of the fictional pitch in Instrument Serif 36/1.3; the current line is `--stage-sun`, others at 30% cream; lines advance with scroll (translateY with 480ms ease). Right 40%: a mic card with the **waveform** (48 bars, 3px wide, 4px gap, height 4 to 56px, `--stage-mint`; amplitude follows a seeded noise function that rises while the current line is active and flattens between lines) and a run-of-show strip below it with five segments (`Problem 0:30`, `Solution 0:45`, `Demo 1:00`, `Impact 0:30`, `Ask 0:15`) and a mono readout `Run 3 · 2:48 / 3:00`. Caption (12px, 55% cream): `Simulated here. In the product the waveform follows your microphone.` |
| 0.40 to 0.62 | **Judge's Chair** | The teleprompter slides left and fades. A question card flips in (rotateX 12 to 0, 480ms): `What did you build this weekend, and what is mocked?` Under it: difficulty dots (two of three filled), `Why asked: judges check that the demo matches the build.`, a risk line `Receipt scanner is mocked.`, and a mint chip `Answer ready`. Two more cards sit behind it, offset 12px each and scaled 0.96 and 0.92; scrolling riffles the deck. A thin connector line from the chip to a small ledger snippet ties back to dive B. |
| 0.62 to 0.78 | **Readiness** | The frame swaps to six rings in a 3 x 2 grid, each 96px, 6px stroke, track `rgba(255,255,255,0.12)`. Labels: `Rubric coverage`, `MVP health`, `Demo rehearsal`, `Pitch deck`, `Submission checklist`, `Fallback insurance`. They fill in 900ms with 100ms stagger to example values (mint at 90 and up, sun between 70 and 89; one ring, Fallback insurance, stops at 76 in sun). A weak-spot chip appears: `Fallback insurance: add a 60-second backup video.` Caption: `Example room.` |
| 0.78 to 1.00 | **Launch Pad and the stamp** | The frame swaps to the Launch Pad. Header `Launch Pad`. Countdown in JetBrains Mono, 96px, cream, tabular nums: `03:12:47`, ticking in real seconds. Guidance line (verbatim from the product): `Submit your project on the event's own platform. When that's done, mark it here to close out this room.` Button `Mark as submitted` (56px tall, cream background, ink text, radius 999) with the caption `Leader only`. At p = 0.86 the in-frame cursor moves to the button and presses it. **The visitor can press it earlier.** |

### 11.2 The stamp (the single most important 1.2 seconds on the page)
- **Look:** the word `SUBMITTED` in JetBrains Mono 700, 64px (36px on mobile), letter-spacing 0.14em, color `--danger`. Double border: outer 4px, inner 1.5px, 6px gap, square corners. Padding 14px 28px. Rotated -6 degrees, centered on the frame. An SVG `feTurbulence` mask (baseFrequency 0.8, 2 octaves, thresholded) knocks about 6% ink gaps out of the stamp so it reads as ink, not a label.
- **Timeline (ms from the button press):**
  - 0: button scales to 0.97 (90ms).
  - 90: stamp enters at scale 1.9, opacity 0, and slams to scale 1, opacity 1 in 140ms with `cubic-bezier(0.5, 0, 1, 1)`.
  - 230: impact. The frame jolts translate(2px, -2px) back to 0 in 80ms. A ring ripples from the stamp (2px `--danger` border, scale 1 to 1.35, opacity 0.5 to 0, 420ms). The countdown freezes at `03:12:47` with a 240ms flash (sun to cream). The HUD pill stops at the same value, its dot turns `--success-fg`.
  - 600: caption fades in under the stamp, Instrument Serif italic 40px, cream: `Submitted with margin.`
  - 900: a horizontal milestone timeline draws under it, six nodes with mono 12px labels: `room created`, `brief confirmed`, `plan generated`, `build started`, `first task done`, `submitted`.
  - 1200: scene settles. The pin holds for another 40vh, then releases.
- **After:** the HUD reads `SUBMITTED` for the rest of the page.
- **No sound, no confetti.** The restraint is the point. (The product itself uses a success sound and confetti on task completion; the landing page deliberately does not.)
- **Reduced motion:** the end state is shown instantly: stamp in place, clock frozen, caption and timeline visible.
- **Accessibility:** the caption is in an `aria-live="polite"` region; the stamp is `role="img"` with label `Submitted`.

**Mobile:** no pin. Four stacked dark cards (Rehearsal, Judge's Chair, Readiness, Launch Pad) at full width. The stamp scene plays once when the Launch Pad card is 60% in view, and the button is tappable.

---

## 12. Assets and the fixture room

### 12.1 The fixture room (everything fictional)
Build one seeded demo room in the real product so every screenshot is consistent. Event: **Campus Build Sprint 2026** (fictional; never named like SIH, MLH or Devpost). Project: **Club budget tracker**. Team of four with first names and initial-letter avatars only (no photos, no real people): Aarav (leader), Meera, Kabir, Isha. Brief and rubric exactly as in 6.2. Idea chips as in 10.1. Ledger rows as in 10.2. Light theme, one browser window at 1600 x 1000, device pixel ratio 2, no dev tools, no real emails or repo names.

### 12.2 Asset list
| Asset | Used in | Source | Spec |
|---|---|---|---|
| Create Room wizard, playbook picker | 9 stage 01 | Fixture screenshot | 1568 x 1000, AVIF + WebP, at most 120KB each |
| Brief (confirmed) | 9 stage 02 | Screenshot | same |
| Team + Skill-Gap Meter | 9 stage 03 | Screenshot | same |
| Ideate + AI Stress Test | 9 stage 04 | Screenshot | same |
| Plan + Docs vault | 9 stage 05 | Screenshot | same |
| Board with dependency lock and blocked card | 9 stage 06 | Screenshot | same |
| Pitch Kit rehearsal | 9 stage 07 | Screenshot | same |
| Launch Pad State A | 9 stage 08 | Screenshot | same |
| Hero demo, dive A, dive B, rail mini-visuals, stage act scenes | 6, 7, 10, 11 | Live-coded React + CSS | no raster assets |
| `[brackit]` wordmark and `[ ]` mark | nav, favicon, loader, footer | SVG, hand-drawn | 2px stroke, square caps |
| Favicon | tab | SVG + 32px PNG | bracket pair in `--stage-sun` on `--stage-ink` |
| Open Graph image | link previews | Static render of the hero end state | 1200 x 630 |
| Grain tiles | light and dark acts | PNG, 128px tile | 3% and 5% opacity |
| Stamp ink filter | stage act | Inline SVG `feTurbulence` | defined once, reused |
| Fonts | global | Self-hosted WOFF2, subset to Latin | Instrument Serif regular and italic, Inter Variable, JetBrains Mono Variable |
**[OPEN] O5:** if the product UI changes before launch, regenerate screenshots from the fixture room, never edit them by hand.

---

## 13. The quiet middle (sections 9 to 14 of the flow)
These sections are deliberately calm: reveal-once, no scroll-linking, no looping motion. They carry coverage and trust. This is where Wispr's restraint matters most and where an Aceternity-style "everything animates" page would fail the effect budget (D5).

### 13.1 Playbooks
- **Eyebrow/H2:** `[ 05 ] playbooks`, `Built for your *format.*` Lead: `Playbooks for the events teams actually enter. Pick one and the room starts with the right clock, team size and rules.`
- **Grid:** 3 x 2, cards 384 x 220, radius 16, `--card`, 1px `--border`, padding 24. Each card: name (Inter 600, 20), a mono meta line, a 40px **duration ring** (arc length = hours / 48, `--ink` on `--border`), and one line of format note.
| Card | Meta | Note |
|---|---|---|
| Smart India Hackathon | `36 h · team of 6` | PPT internal round |
| Devpost online event | `48 h · teams of 1 to 4` | Asynchronous video judging |
| MLH weekend sprint | `36 h` | Weekend format |
| 4-hour AI sprint | `4 h` | Generative AI sprint |
| Corporate innovation | `24 h` | Internal hackathon |
| Solo sprint | `24 h · solo` | Same gates, same plan pipeline |
- **Hover:** card lifts 2px, ring re-draws (480ms), `Open playbook →` fades in (180ms). On touch the link text is always visible. Each card links to `/playbooks`.
- **Under the grid:** `Browse all playbooks →` (link) and a slim band for the tool directory: `Vetted tools for hackathon teams. Zero affiliate links, zero sponsored slots.` + `Explore the tool directory →` [VERIFY: "zero affiliate links" still true; do not add "updated weekly" until confirmed].
- **Footnote (13px, `--ink-2-strong`):** `Playbooks are templates built around these formats. [brackit] is not affiliated with SIH, MLH or Devpost.` [VERIFY wording]

### 13.2 Everything in the room
- **Eyebrow/H2:** `[ 06 ] the room`, `Everything in the room, *nothing to set up.*`
- **Bento (4 columns, 24px gap, min tile height 220, radius 16, `--card`, 1px border):** nine tiles. Label is mono (`[ brief ]`), then one benefit line (16px), then a 3-element CSS micro-visual. No icon-pack icons.
| Tile | Span | Benefit line | Micro-visual |
|---|---|---|---|
| `[ brief ]` | 2 cols | You won't be disqualified for a rule nobody read. | a rule line with a bracket and a tick |
| `[ team ]` | 1 | Roles named and skill gaps visible before the build starts. | a 7-axis mini radar |
| `[ ideate ]` | 1 | The best idea wins, not the loudest voice. | three cards, one locked |
| `[ plan + docs ]` | 1 | You start with a PRD, a stack, phases and tasks, not a blank page. | a stack of 9 thin file bars |
| `[ board ]` | 2 | The team always knows what is next and who is stuck. | three lanes, one card with a lock |
| `[ mvp studio ]` | 1 | You can answer judge questions honestly and confidently. | a 4-color ledger bar |
| `[ tech ]` | 2 | No surprise rule violations, and a demo build a late commit cannot break. Frontend and backend work in parallel from hour one. | a branch line with a frozen tag |
| `[ present ]` | 1 | You practice out loud, against time. | a 12-bar waveform |
| `[ readiness + review ]` | 1 | One view of where the team stands before the judges arrive. | six small rings |
- **Hover:** the label's brackets move 4px outward, border to `--border-strong`, 180ms. Nothing else moves.
- **Density rule:** at most 9 tiles, at most 18 words per tile. This is the section most likely to turn into the crowded wall you do not want. If it feels busy, cut tiles, never shrink text.

### 13.3 Trust
- **Eyebrow/H2:** `[ 07 ] trust`, `Built to hold up *at hour thirty-five.*`
- **Layout:** a spec sheet, four rows, each 96px tall, 1px bottom borders. Columns: mono term (left, 3 cols), plain meaning (center, 6 cols, Inter 18), mono detail (right, 3 cols, `--ink-2-strong`).
| Term | Plain meaning | Detail |
|---|---|---|
| `Zero client keys` | No API key to find, paste or pay for. Nothing sensitive sits in your browser. | AI gateway on the backend |
| `Encrypted access` | GitHub access is stored encrypted, and page scripts cannot read your session. | AES-256-GCM · HttpOnly cookies |
| `Works on bad wifi` | Teammates see changes live. If the connection drops, your room, tasks and docs stay cached and reconnect on their own. | Live sync · 20 s polling fallback |
| `Yours to take` | Export the whole room as a ZIP at any time. | ZIP export |
- Row hover: the detail text goes `--ink`. No badges, no certification logos, no lock icons. Do not write "enterprise-grade" or claim certifications.

### 13.4 Compared to what you use now
- **Eyebrow/H2:** `[ 08 ] compared`, `Keep the chat. *Replace the scatter.*` Lead: `These tools are good at what they are for. A 36-hour sprint is not that.`
- **Tabs (pill tabs, 40px tall):** `WhatsApp / Discord`, `Jira / Linear / Trello`, `Notion / Docs`, `AI chat in a tab`. Arrow keys switch tabs; content crossfades in 240ms.
- **Panel:** two cards side by side (left muted `--surface`, right `--card` with `--ink` 1px border). Left title `Where it breaks in a 36-hour sprint`, right title `In [brackit]`.
| Tab | Left | Right |
|---|---|---|
| WhatsApp / Discord | Links and decisions get buried. No clock. Blockers stay silent. | A structured room with live updates, one-tap blocked alerts and a shared deadline. Keep the chat for banter. |
| Jira / Linear / Trello | Setup eats hours. They know nothing about your brief, rubric or pitch. | Zero setup. Playbooks for common formats, a board seeded from the plan, pitch and demo tools included. |
| Notion / Docs | A blank page, and docs that drift from the code. | Nine structured, versioned Markdown docs generated from the approved idea. |
| AI chat in a tab | Output that is disconnected from your brief. Nobody can defend what was generated. | AI fed with your brief, rubric, approved idea, member skills and hours left, then the Judge's Chair drills you on your own build. |
- Tone: respectful. No logos of competitors, no "versus" language in headings.

### 13.5 Pricing
- **Eyebrow/H2:** `[ 09 ] pricing`, `Free to start. *Pro is on the waitlist.*` Sub: `Three rooms a month, free.`
- **Three cards**, 384 wide, radius 16, padding 32. Free has a 1px `--ink` border and an `Active` chip (`--success-bg` / `--success-fg`); Pro and Max have `--border`.
| | Free | Pro | Max |
|---|---|---|---|
| Price | `$0` | `$9/mo` | `$19/mo` |
| Rooms | 3 a month | 25 a month | Unlimited |
| Includes | Brief, Ideate, Plan, Board, MVP Studio, Docs vault, Tech studios, Pitch Kit, Submission, ZIP export, Playbooks, Tool directory | Everything in Free, plus higher AI rate limits and priority support. Planned, not live: Claude MCP access and post-hackathon continuation (tagged `planned`). | Everything in Pro, plus Review, Retro and Project Summary pages and the GitHub visual branch map [OPEN O3] |
| Button | `Start a room` | `Join the waitlist` | `Join the waitlist` |
- Waitlist button opens the existing modal (optional note, `POST /api/v1/billing/interest`).
- **Never** show a buy button, a "most popular" badge, an annual toggle or a countdown. Under the cards, 13px: `Pro and Max cannot be bought yet. Join the waitlist and tell us what you need.`

### 13.6 FAQ
- **Eyebrow/H2:** `[ 10 ] faq`, `Honest answers to *the usual questions.*`
- **Layout:** left (4 cols, sticky) holds eyebrow and H2; right (8 cols) holds an accordion of 8 items, one open at a time. Item height 72 closed; the toggle is a mono `[+]` / `[−]`; open animation 240ms.
| Question | Answer |
|---|---|
| Does it write my code? | No. It plans, scopes, documents and prepares your pitch. You write and own the code. |
| Why not just use our group chat? | Keep the chat. [brackit] replaces the scattered docs, unread PDFs and loose task lists with one clock-aware room. |
| Do I need an API key or a paid AI account? | No. AI runs through the backend. The free plan includes 3 rooms a month. |
| Does it submit to Devpost, Devfolio or Unstop for me? | No. It prepares your deliverables and a pre-flight checklist. You submit on the event's own platform, then mark it done here. |
| What if the wifi drops? | Your active room, tasks and docs are cached in the browser and the app reconnects automatically. You can also export a ZIP of the whole room. |
| Is my GitHub access safe? | Tokens are encrypted at rest with AES-256-GCM, and sessions use HttpOnly cookies. |
| Is it free? | Free to start. Pro and Max are on a waitlist and not yet purchasable. |
| Is this affiliated with SIH, MLH or Devpost? | No. Playbooks are templates built around those formats. [VERIFY wording] |

---

## 14. The close: final CTA, footer, system pages, voice

### 14.1 Final CTA (dark)
- `--stage-ink` background, 6% white hairline grid, 5% grain. Min-height `100svh`. The nav is dark glass again.
- **The oversized bracket pair:** two brackets 920px apart, 70vh tall, 2px stroke in cream at 28% opacity. They draw on entering view (stroke-dashoffset, 900ms). The H2 lives between them.
- **H2** (cream, 88px, max-width 760, centered): `Your next hackathon starts with *a room.*`
- **Below it (32px gap):** if O4 is yes, a room-name input (56px tall, 480 wide, radius 999, `rgba(255,255,255,0.06)` fill, 1px `rgba(255,255,255,0.18)`, placeholder `Name your room`) with the button `Start a room` (56px, cream background, ink text) attached to its right edge; the name is passed as `?name=`. If O4 is no, just the button and a text link `Browse playbooks`.
- **Caption** (13px, 60% cream): `Free to start. 3 rooms a month. No card.`
- The HUD reads `SUBMITTED` here, a quiet echo of the stamp.

### 14.2 Footer (same dark surface)
- Four blocks in a row (desktop): wordmark plus the line `Built for 36 hours, not 36 sprints.`; **Product** (Playbooks, Tool directory, Pricing, Sign in); **Legal** (Terms, Privacy) [OPEN: these pages must exist before launch]; **Contact** [OPEN: an email on the brackit domain, once O1 is decided].
- Bottom row (mono 12px, 55% cream), 48px above the bottom: `© 2026 [brackit]` on the left, `[brackit] is not affiliated with SIH, MLH or Devpost.` on the right.

### 14.3 System pages and small moments (the Fibery lesson: dry voice, never loud)
| Moment | Copy | Notes |
|---|---|---|
| 404 | `This page missed the deadline.` Sub: `Go back to the room.` Button `Back to [brackit]` | Restyle `/404` with the bracket mark |
| 500 | `Something broke. The clock didn't.` | Existing `/500` page |
| Offline | `No wifi. Your room is cached.` | Only true where the app caches the room |
| Maintenance | `Back shortly.` Sub: `We are making a change.` | `/maintenance` |
| Loader | the `[ ]` pair, breathing (scale 1 to 1.06, 1.2s) | Replaces the old `H` monogram |
| Primary-button hover | arrow nudges 4px right | no text swap, no confetti |
| Empty form errors | Plain sentences. `Every rule needs a tick.` | Same voice as the product |
All copy obeys the banned-word list. No exclamation marks anywhere on the page.

---

## 15. Responsive, accessibility, performance, SEO

### 15.1 Breakpoints and behavior
| Width | Layout | Scroll-linked sections |
|---|---|---|
| 1440 and up | Design frame | Pinned (rail, how it works, stage act) |
| 1024 to 1439 | Container 960 to 1200, frames scale proportionally | Pinned |
| 768 to 1023 | Single column, frames full width | **Unpinned**: stacked variants |
| Below 768 | Single column, 24px padding, nav becomes sheet, HUD at the bottom | **Unpinned**: stacked variants |
Touch: nothing depends on hover. Hover-only text (such as `Open playbook →`) is always visible on touch. Tap targets are at least 44 x 44; the 36px desktop nav button becomes 44px on touch.

### 15.2 Accessibility
- One `h1` (the hero). Section titles are `h2`. Scroll-linked sections keep **all** content in the DOM in reading order, so a screen reader reads all five failure stops and all eight stages without scrolling.
- The HUD is `aria-hidden`; the illustrative-clock sentence is visually hidden in the hero.
- All interactive demos (hero rows, idea chips, ledger controls, tabs, accordion) are keyboard operable with visible focus (2px `--brand-from`, 2px offset). Tabs and segmented controls use arrow keys.
- `prefers-reduced-motion`: static end states everywhere, no looping, no pinned sequences (stacked variants).
- A "Skip to content" link as the first tab stop.

### 15.3 Contrast corrections (override anything above that conflicts)
- `--ink-2` (#737373) on `--shell` (#F5F5F5) is about 4.4:1, below the 4.5:1 AA line for body text. **Add a landing-only token `--ink-2-strong: #595959`** for lead, body and any caption that carries meaning on `--shell` or `--surface`.
- `--ink-3` (#A3A3A3) fails AA on light backgrounds. Use it only for purely decorative text (separators, disabled states, the replay link). **Wherever this document says `--ink-3` for a caption that explains something** (for example `Example output with sample data.`, `Illustrative.`, `Simulated here.`), use `--ink-2-strong` instead. The honesty captions must be readable.
- Cream text on `--stage-ink` at 55% opacity is about AA for large text only; keep cream captions on the dark act at 70% or higher, and 55% only for non-essential mono labels.

### 15.4 Performance goals (targets to aim for, not claims)
- Largest Contentful Paint at or under 2.5 s on a mid-range phone; layout shift under 0.05.
- Landing route JS at or under about 200KB gzip, excluding the shared app shell. Code-split the landing route; lazy-load every section below the hero with `React.lazy` plus an IntersectionObserver trigger 600px before view.
- `LazyMotion` with `domAnimation`. Scroll progress through Motion's `useScroll` only. Pause animations when offscreen. `backdrop-filter` only on the nav. `will-change` only during an active animation.
- Images: AVIF with WebP fallback, explicit `width` and `height`, lazy-loaded below the hero. Preload only Instrument Serif regular and Inter Variable; the rest load on demand. No autoplaying video anywhere.

### 15.5 SEO and sharing
- `title`: `[brackit] · a hackathon OS`. Meta description: `[brackit] is a hackathon OS. Read the brief, pick one idea, plan the build, rehearse the pitch and submit with margin, all on one clock.`
- Open Graph and Twitter large-image card using the 1200 x 630 image. H1 is real text, never an image.
- JSON-LD: `SoftwareApplication` (free offer) and `FAQPage`.
- A pure SPA needs prerendering of `/` for crawlers and link previews (A3). Canonical URL waits on O1.
- Analytics: none until decided. If added, cookie-free, with event names `start_room` (with a `location` property), `browse_playbooks`, `door_click`, `waitlist_open`, `faq_open`.

---

## 16. How this gets built: small slices, one at a time

### 16.1 Working agreements
- **One slice per prompt.** Never ask for a whole section, and never for the whole page. Static first, motion second, responsive third.
- **Every prompt is self-contained and literal.** It pastes only: Part A (or the parts it needs), design system 3.x (only what applies), and the one section it builds. The coding model gets exact file paths, exact copy, exact sizes and timings, and no room to improvise. Opus context stays light.
- **No test, verify or checklist steps inside the prompts.** The owner checks each slice manually in the browser and reports back with a screenshot or recording; the next slice starts only after that checkpoint.
- **Copy lives in data files, not JSX**, so one claims-and-banned-words audit can cover everything.
- **Tokens are never redefined.** Landing-only additions are `--ink-2-strong` and the animation timing variables, in `styles/landing.css`.

### 16.2 Proposed file layout
```
frontend/src/features/landing/
  LandingPage.tsx
  sections/    Hero  Doors  ProofStrip  ProblemRail  Pivot  HowItWorks  DeepDives
               StageAct  Playbooks  RoomGrid  Trust  Compare  Pricing  Faq  FinalCta  Footer
  components/  Bracket  BracketFrame  Wordmark  ClockHud  Eyebrow  ItalicHeading
               DemoCursor  Stamp  Waveform  Ring  MiniVisuals/
  hooks/       useScrollProgress  useInViewOnce  useReducedMotion
  data/        stages  railStops  playbooks  faq  compare  ledger  heroBrief
  styles/      landing.css
```
(Audit the existing `features/landing/` first and decide keep, restyle or delete per file.)

### 16.3 Slice map (each row is one prompt; size S, M, L is the amount of new UI)
| ID | Slice | Depends on | Spec in this file | Size |
|---|---|---|---|---|
| S00 | Foundations: landing.css tokens, fonts, container, section shell, `ItalicHeading`, `Eyebrow` | none | 3.1 to 3.6, 15.3 | M |
| S01 | Bracket kit: `Wordmark`, `Bracket`, `BracketFrame`, highlight bracket with draw-on | S00 | 3.3 | M |
| S02 | Nav (static) and the mobile sheet | S01 | 5 | M |
| S03 | Hero static: text, CTAs, grid background, violet wash | S00, S01 | 6.1 | M |
| S04 | Hero demo, end state only (frame, brief text, eight rows) | S03 | 6.2 | M |
| S05 | Hero demo sequence: autoplay, pointer-yield, replay, reduced motion | S04 | 6.2 | L |
| S06 | Doors and proof strip | S03 | 6.3, 6.4 | S |
| S07 | `ClockHud` with tone and state props | S02 | 3.7 | M |
| S08 | Five rail mini-visuals as components | S00 | 7 | M |
| S09 | Problem rail, static stacked layout | S08 | 7 | M |
| S10 | Problem rail, pin plus scroll-linking, HUD mapping, red tint | S07, S09 | 7 | L |
| S11 | Pivot | S07 | 8 | S |
| S12 | How it works, static (list, frame, stage data, screenshots) | S00 | 9 | M |
| S13 | How it works, scroll-linking, callouts, demo cursor, rings | S07, S12 | 9 | L |
| S14 | Deep dive A (idea stress test) | S00 | 10.1 | M |
| S15 | Deep dive B (Reality Ledger) | S00 | 10.2 | M |
| S16 | Stage act, four scenes as static components | S00 | 11.1 | L |
| S17 | Waveform and teleprompter | S16 | 11.1 | M |
| S18 | Stage act pin and scroll orchestration, nav dark switch | S07, S16 | 11.1 | L |
| S19 | Launch Pad scene, the stamp sequence, HUD freeze | S18 | 11.2 | L |
| S20 | Playbooks | S00 | 13.1 | M |
| S21 | Room grid and its micro-visuals | S00 | 13.2 | M |
| S22 | Trust and compare | S00 | 13.3, 13.4 | M |
| S23 | Pricing and waitlist modal hookup | S00 | 13.5 | M |
| S24 | FAQ | S00 | 13.6 | S |
| S25 | Final CTA and footer | S01 | 14.1, 14.2 | M |
| S26 | System pages restyle and loader | S01 | 14.3 | S |
| S27 | Responsive pass, section by section | all | 15.1 | L (split in 3) |
| S28 | Reduced-motion and accessibility pass | all | 15.2, 15.3 | M |
| S29 | Performance pass: lazy-loading, fonts, images | all | 15.4 | M |
| S30 | SEO, Open Graph, prerender of `/` | all | 15.5 | S |
| S31 | Copy and claims audit against 7 and A7 | all | A6, A7 | S |
Build order is by dependency, but ship the **hero (S00 to S07) first**: if the hero is mediocre, nothing after it saves the page.

---

## 17. Reference harvest: what was taken, what was refused

| Reference | Taken | Refused |
|---|---|---|
| **Huly** | Product framed as a lit object (stage frame with violet and amber rim); the dark/light flip as pacing, used exactly twice; the content swap inside a frame as a demonstration; short two-line section headlines | Abstract orbs and glow that mean nothing; the "everything app" breadth pitch |
| **Aceternity (the website, not the library)** | The calm section pattern: eyebrow with a real count, then H2, one paragraph, one link, then the grid; density control; quiet background grid; a premium, minimal feel [CALIBRATE: based on page text, verify against a recording] | The component-catalog density the owner called overcrowded; stacking many library effects; the "trusted by 120,000" proof style (no equivalent exists here) |
| **Fibery** | One consistent world and a dry voice: the failure rail and the small system-page lines; section labels that have personality | Whimsical illustration, long jokes, anything that fights the "direct, calm, no hype" voice [CALIBRATE: polish unverified] |
| **Wispr Flow** | The base: light, quiet, editorial; the italic-phrase rule on every H2; the hero that performs the product; small eyebrow labels; very few components | Dictation-specific metaphors; the 4x-faster comparison style numbers (no measured number exists here) [CALIBRATE: type and spacing are guessed from text] |

---

## 18. Risks and the pre-launch checklist

### 18.1 Risks
| Risk | Mitigation |
|---|---|
| Pinned sections janky on weak phones | Unpinned stacked variants below 1024 (15.1); animate only transform and opacity |
| The hero demo reads as fake | It is labelled as a sample event with invented text; it behaves like the real product (the gate genuinely blocks) |
| Illustrative story misread as promised results (`submitted with 3 hours left`) | Visible "Illustrative" and "Example" captions (with `--ink-2-strong`); never a stat; never "teams finish X% earlier" |
| Screenshots drift from the product | Regenerate from the fixture room; never hand-edit |
| A pure SPA hurts previews and SEO | Prerender `/` (A3, 15.5) |
| Too many wow moments dilute the page | Effect budget of three (D5); everything else reveal-once |
| Claims creep into copy | Copy lives in data files; audit slice S31 |
| Name rendered wrongly (`Brackit`, `[Brackit]`) | The uppercase gotcha in section 3; S31 greps for variants |

### 18.2 Before anything goes public
- O1 to O8 answered or accepted by default.
- Every `[VERIFY]` item confirmed or removed.
- A grep for the banned words and for `Brackit` / `[Brackit]` / `brackit` used as a bare product name in copy.
- Terms and Privacy pages exist; a contact address exists on the final domain.
- The waitlist endpoint works from the landing page; `/404` and `/offline` are restyled.
- Open Graph image renders in a link preview; prerendered `/` has the H1 in the HTML.

---

## 19. Next conversation topics (to finish the plan together)
1. Veto or change any `[DECIDED]` row in section 2.1.
2. Answer the `[OPEN]` rows (O1 to O8), starting with O3 (what is free) and O4 (`?name=`).
3. Record Wispr Flow and Fibery scrolling, plus Aceternity's homepage, to clear the `[CALIBRATE]` flags.
4. Choose the hero H1 (primary versus the two alternates in 6.1).
5. Then write slice S00 and S01 as the first two build prompts.
