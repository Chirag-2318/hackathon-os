# [brackit] landing page: context for version 2

> **How to use this file.** It is the hand-over from a long chat that designed and built version 1 of the landing page. Read it fully before answering anything. The owner will attach a screen recording and screenshots of the current frontend; the job of the new chat is **version 2: an improved version of version 1**. The v1 design spec (`ideation.md`) may also be attached; this file summarizes it and records every place where the build differs from it.
> **Tags used below.** `[DECIDED]` chosen and built. `[OPEN]` waiting on the owner. `[UNVERIFIED]` something the previous chat was told about but never saw (for example a coding agent's final report).

---

## 1. The product and the owner

- **[brackit]** (always lowercase, brackets included, in copy and headings; files, URLs and slugs drop the brackets) is a hackathon OS: an execution operating system and real-time team room for hackathons. The **product is finished and working**; only the landing page was left.
- **Promise:** go from problem statement to a rehearsed, verified submission without losing the clock. Pillars: clock-aware, rubric-aware, gated, demo-first, honest.
- **Audience:** student teams in big competitions (Smart India Hackathon, MLH, Devpost, college events); secondary: corporate hackathons and solo builders.
- **The owner** (Chirag) is a student building this with AI coding agents. He writes briefly and bluntly, works **checkpoint by checkpoint**, and tests everything **manually** in the browser. He wants a "lead frontend developer" collaborator who discusses first, then plans, then produces prompts.

## 2. How we work (follow this exactly)

1. **Discuss and decide first, then build.** For anything big, ideate and agree before writing prompts. Never produce a build prompt for a whole page or a whole section in one go.
2. **The builder is Claude Opus running as a coding agent in the repo.** It executes prompts **literally and has no judgment of its own**. So every build prompt must be exhaustive and self-contained: exact file paths, exact copy, exact sizes and timings, exact CSS, exact component APIs.
3. **Do NOT tell the agent to test, verify, run builds, lint, check in a browser or produce PASS/FAIL reports.** The owner tests by hand because agent testing takes too long. Prompts end with "reply with a short summary only".
4. **Slice the work.** One prompt = one or two (up to three) small slices that depend on each other. The owner explicitly asked for "double the work" per prompt in v1; keep prompts that size, never smaller than needed, never so big the agent stops halfway.
5. **The review loop:** the owner sends screenshots or a screen recording. Claude extracts frames (ffmpeg, about 1 frame per second, tiled into contact sheets) and views them. Then reply in this shape: (a) a short verdict, "passes" or the specific bugs seen, (b) the next prompt in a code block, (c) a short "what you should see afterwards" list. Admit what cannot be judged from stills (animation timing, hover states).
6. **Format preferences:** plain chat or clean markdown, tables and keyword lists over dense prose, no rich artifacts for the conversation, files for real deliverables (create the file, then present it). Do not narrate saving anything to memory.
7. **Be honest.** Say when a claim cannot be verified, when something was guessed (for example callout positions), and when a decision belongs to the owner.

## 3. Tech and code conventions of the landing page

- **Location:** `frontend/src/features/landing/`. Part of the main app: React 19, TypeScript strict, Vite, Tailwind CSS v4, shadcn/ui, Radix, Lucide icons, React Router. It is a Vite SPA (no SSR).
- **Fonts (self-hosted via fontsource):** Instrument Serif (regular + italic) for display, Inter Variable for UI/body, JetBrains Mono Variable for clocks, labels, eyebrows.
- **No animation library.** The `motion` package is deliberately NOT installed. All motion is CSS transitions and keyframes, `setTimeout`/`setInterval`, `IntersectionObserver`, and passive scroll listeners with `requestAnimationFrame`. Pinning is CSS `position: sticky`. No smooth-scroll hijacking, no custom site cursor, no audio.
- **One stylesheet:** `styles/landing.css`, scoped under `.landing-root`. Landing-only classes start with `l-`, landing-only CSS variables with `--l-`. Each slice appended a labelled block at the end of the file. Existing product tokens are reused and never redefined.
- **File naming:** kebab-case files, PascalCase components, strict TypeScript, no `any`, `import type` for types, plain-English comments.
- **Copy lives in `data/*.ts`**, not in JSX, so one audit covers it. No unicode escape sequences inside JSX text (they print literally; this caused a real bug once): type the real characters ’ – · … ©.
- **No hard-coded colours in landing `.tsx` files**; use classes and variables.
- Landing-only additions to the product tokens: `--l-ink-2-strong: #595959` (readable body/lead/captions on light backgrounds; the product's `--ink-2` is about 4.4:1 on `--shell` and `--ink-3` fails AA), `--l-danger-text: #C2272D` (small red text), `--l-cream` family (text on the dark stage), easing and duration variables.

### Product design tokens (reused as is)
`--shell #F5F5F5 · --surface #FBFBFB · --card #FFFFFF · --border #EAEAEA · --border-strong #DADADA · --ink #0A0A0A · --ink-2 #737373 · --ink-3 #A3A3A3 · --brand-from #6D5EF5 · --brand-to #9B8CFF · --bg-accent #F0B04A · --danger #E5484D · --success-bg #DDF7DA · --success-fg #16820F · --warn-bg #FEF1D6 · --warn-fg #A15C07` and the dark "stage" palette `--stage-ink #0E0E10 · --stage-dark-card #151517 · --stage-sun #FDE781 · --stage-orange #FF7A1A · --stage-pink #FCC4E0 · --stage-lilac #C4C5FC · --stage-mint #A5EFBE · --stage-sky #B7D9FF`.

## 4. The concept and the design rules (all [DECIDED], built in v1)

**Thesis: the page is one 36-hour hackathon in a single scroll.** The clock starts at T–36:00:00, the page first shows how teams lose (five failures pinned to the clock), then replays the same 36 hours inside [brackit], and ends with a red `SUBMITTED` stamp landing with hours still on the clock: "Submitted with margin." The brand device is the **bracket pair `[ ]`** ("to bracket" = mark and set apart, which is what the product does to rules, ideas and risks).

Reference harvest: **Wispr Flow** = the base (light, quiet, one typographic rule, a hero that performs the product). **Huly** = product framed as a lit object and the dark/light flip as pacing. **Fibery** = a consistent world and a dry voice. **Aceternity (the website, not the component library)** = calm section rhythm (eyebrow with real count, H2, one paragraph, one link, grid) and density control. The owner finds Aceternity too crowded for this use case.

| Rule | Detail |
|---|---|
| Effect budget | Three showpiece moments: hero demo, the problem rail, the stage act. Everything else is quiet (reveal-once). |
| Type rule | Every H2 ends in an italic phrase (Instrument Serif italic). Never coloured. |
| Theme rhythm | Light base; exactly two dark moments: the stage act and the final call to action (the footer continues the dark). |
| Brackets | Used for: wordmark, standalone `[ ]` mark, highlight around found phrases, tall frames flanking big product frames, `[ 01 ]` eyebrow indexes, the oversized pair around the final CTA. Brackets mean "marked and confirmed", never decoration. |
| Honesty | Every demo is labelled "Example" or "Illustrative". No invented users, quotes, logos or stats. |
| Voice | Direct, calm, specific, short sentences. Banned: seamless, unleash, supercharge, elevate, effortless, "let's get started". No exclamation marks anywhere. |
| Motion | Entering: `cubic-bezier(0.22, 1, 0.36, 1)`; reveal 480ms, hover 180ms, scene 700ms; stagger 60ms per index. Everything respects `prefers-reduced-motion` (final static states; scroll-linked sections fall back to stacked layouts). |
| Never write | The product writes your app / is "autonomous"; submits to Devpost/Devfolio/Unstop; Pro or Max can be bought today; Google-Docs-style live cursors; invented testimonials, user counts, awards, partners, certifications; any measured generation time. |

## 5. What version 1 contains (page order)

`landing-page.tsx` renders inside `HudProvider`: skip link, `Nav` (with a clock slot), `<main id="main" tabIndex={-1}>`, `SiteFooter`, a mobile clock pill and JSON-LD. Sections in order:

| # | Section (file in `sections/`) | What it does |
|---|---|---|
| 0 | `Nav` (components) | Floating pill: wordmark, Playbooks/Tools/Pricing, clock HUD (desktop), Sign in, Start a room; mobile menu sheet with focus trap; compresses after 80px scroll; turns dark glass over dark sections. |
| 1 | `hero` | Pill eyebrow, H1 "Most teams don’t lose because they *can’t code.*", lead, two buttons, and the **interactive hero demo**: a fictional pasted brief gets bracketed, eight items extracted, ticked and confirmed, clock starts. Autoplays once at 40% visible; any press takes over (rows become tickable; early confirm shakes and says "Every rule needs a tick."); `[ replay ]`. |
| 2 | `doors` | Three cards by urgency (event not started / live with pulsing red dot / just exploring). |
| 3 | `proof-strip` | One line of verifiable facts (6 playbooks, 9 docs, 3 rooms free, no API key). |
| 4 | `problem-rail` | `[ 01 ]` Five failure stops on a rail (T–36 → T–00:20), scroll-linked: rail fill, nodes, dimming, red tint after stop 3, big legend clock; drives the HUD clock to T–00:00:00. Five CSS mini-visuals. |
| 5 | `pivot` | "Same 36 hours. *Different order.*" Resets the HUD to T–36:00:00 with a violet pulse. |
| 6 | `how-it-works` | `[ 02 ]` Pinned (sticky, about 70% of a screen per stage) 8-stage tour on desktop: stage list + framed screenshot, bracket callouts, a demo cursor, readiness rings from stage 6, HUD times; stacked cards on phones/tablets/reduced motion. Screenshots are optional (placeholder until real images exist). |
| 7 | `deep-dives` | `[ 03 ]` "Build what the judges *will reward.*" Dive A = interactive idea stress test (3 ideas, run test, lock idea). Dive B = Reality Ledger (6 components, four statuses, mix bar, "What breaks first"). |
| 8 | `stage-act` | `[ 04 ]` The **dark pinned stage** (about 340% runway on desktop): heading, then four scenes in one glowing frame (pitch rehearsal with moving teleprompter and a speaking waveform; Judge’s Chair; six readiness rings; Launch Pad). The demo cursor presses "Mark as submitted" (or the visitor does): red ink `SUBMITTED` stamp slams in, frame jolts, ripple, clock freezes at T–03:12:47, "Submitted with margin.", milestone timeline; the HUD then reads `SUBMITTED` for the rest of the page. Resets if scrolled back up. Stacked and play-once on phones. |
| 9 | `playbooks` | `[ 05 ]` Six format cards with duration rings; links to /playbooks and the tool directory; non-affiliation footnote. |
| 10 | `room-grid` | `[ 06 ]` Nine bento tiles with tiny CSS illustrations. |
| 11 | `trust` | `[ 07 ]` Four-row spec sheet (zero client keys, encrypted access, works on bad wifi, yours to take). |
| 12 | `compare` | `[ 08 ]` Four tabs (chat / trackers / docs / AI chat) with "where it breaks" vs "in [brackit]". |
| 13 | `pricing` | `[ 09 ]` id `pricing`. Free / Pro / Max cards; Pro and Max are waitlist-only (no buy button, no badges). |
| 14 | `faq` | `[ 10 ]` Eight-item accordion. |
| 15 | `final-cta` | Dark; oversized bracket pair draws around "Your next hackathon starts with *a room.*", two buttons. |
| 16 | `site-footer` | Dark footer: wordmark, product links, optional Legal column, copyright, non-affiliation line. |

### The clock HUD system (important for any change to scroll sections)
`hooks/use-hud.tsx`: sections report what the clock should show; **the section with the highest order that is reporting wins**. `HUD_ORDER = { rail: 1, pivot: 2, how: 3, stage: 4, submitted: 5 }`. Desktop shows the pill inside the nav; below 1024px a fixed pill sits bottom-centre. `hooks/use-over-dark.ts` turns the nav and the pills dark while `stage-act`, `final-cta` or `site-footer` is under the nav. Times are illustrative and tied to scroll, never real time.

### File map
- **components/:** container, section, italic-heading, eyebrow, bracket, bracket-frame, bracket-highlight, wordmark, bracket-mark, button, nav, rise (plays on mount), reveal (plays once in view), clock-hud, hero-demo (pure display), hero-demo-player, stage-frame, stage-overlay, readiness-rings, big-ring, idea-stress-demo, ledger-demo, waveform, stage-shell, playbook-card, room-visuals, waitlist-dialog (conditional), landing-json-ld, `scenes/` (rehearsal, judge, readiness, launch), `mini-visuals/` (five rail illustrations).
- **hooks/:** use-scrolled, use-in-view-once, use-hero-demo (state machine), use-hud, use-rail-progress, use-pivot-hud, use-how-progress, use-over-dark, use-stage-progress, use-document-meta.
- **lib/:** clock.ts (formatClock, parseClock), stage-images.ts (optional screenshots via `import.meta.glob`).
- **data/:** nav-links, hero-copy, hero-demo, doors, proof-strip, rail-stops, pivot-copy, how-stages, how-callouts, how-rings, idea-demo, deep-dive-copy, ledger-demo, stage-act, playbooks, room-grid, trust, compare, pricing, waitlist-copy, faq, final-cta, seo.
- **Other:** `styles/landing.css` (one file, slice blocks appended), `assets/how/` (README + future `stage-01` to `stage-08` screenshots), `LAUNCH-CHECKLIST.md` (claims register generated by code search).

## 6. Where the build differs from the original spec (ideation.md)

- The problem rail is **not** pinned for 360vh: the intro column is sticky and the scroll-linking runs on normal scroll (lighter, no scroll-jacking).
- How it works pins at about 70% of a screen per stage (as planned) using plain sticky.
- No separate "curtain" layer on the stage act: the dark section's own edge is the curtain. The heading holds, then lifts; the scenes cross-fade in one grid cell.
- The Launch Pad clock does not tick visibly before the stamp (so it can freeze exactly on 03:12:47); the colons blink instead.
- The hero demo starts at 40% visible (spec said 60%), because 60% would have meant nothing moved on a typical first screen.
- The rubric item in the hero brief is four short brackets (a highlight cannot wrap across lines), turning ink once ticked.
- Deep dive frames have no outer tall brackets (the lock brackets on the card would clash).
- Readiness mini rings and scenes use example values, always labelled.

## 7. Open items and unknowns at hand-over

| Item | Status |
|---|---|
| Real screenshots for How it works (`stage-01` to `stage-08`, 1568x1000 WebP, light theme, one seeded fictional room: event "Campus Build Sprint 2026", project "Club budget tracker", four teammates with initial avatars) | **[OPEN]** Not added yet. The section shows placeholders; callouts and the demo cursor only appear once images exist. |
| Callout and cursor positions (`data/how-callouts.ts`) | **[DECIDED as guesses]** Percentages guessed before any screenshot existed; must be tuned after screenshots arrive. |
| Is "Review, Retro and Project Summary" free or Max-only? | **[OPEN]** Page shows it under Max. |
| Does create-room accept `?name=`? | **[OPEN]** If yes, add a room-name field to the final CTA; currently a plain button. |
| Public domain, canonical URL, Open Graph image (1200x630), prerendering of `/` for crawlers | **[OPEN]** Not done. |
| Responsive pass from a real phone recording (about 390px) | **[OPEN]** Only width-math fixes were applied (hero brief text, stamp size, launch clock, glow blur on small screens). |
| Result of the last build prompt (phone fixes, lazy waitlist dialog, route-level lazy split, claims register `LAUNCH-CHECKLIST.md`) | **[UNVERIFIED]** The agent's final report was not seen. Ask the owner for the list of "Not found" and "Contradicted" claims and fix the copy for each. |
| Waitlist dialog | **[UNVERIFIED]** Built only if the repo already had the request function and a dialog component; otherwise Pro/Max buttons link to /signin. |
| /terms and /privacy routes (footer Legal column) | **[UNVERIFIED]** Column only shows if both exist. |
| Which of the 404 / 500 / maintenance pages were restyled (pages asserted by tests are left alone) | **[UNVERIFIED]** |
| Claims to re-check before launch | "zero affiliate links", AES-256-GCM, HttpOnly cookies, 20 s polling fallback, ZIP export, plan limits and prices, "Claude MCP access" and "post-hackathon continuation" as planned, `?intent=` on sign-in, all links in the doors, playbooks and footer. |
| Bracket loader replacing the product's `H` monogram | **[OPEN]** Touches product code; not done. |

## 8. Version 2: the plan

**Goal:** an improved version of v1. v1 is correct, complete and calm; v2 should be sharper, more distinctive and more polished, **without breaking the rules in section 4** (effect budget, honesty, voice, accessibility, reduced motion). The owner explicitly said more creativity comes after v1.

**Order of work in the new chat:**
1. **Audit v1.** Watch the attached recording and screenshots frame by frame. Produce a short written audit in three buckets: **bugs** (something broken or ugly), **polish** (spacing, rhythm, hierarchy, alignment, copy), **creativity** (where the page is merely fine instead of memorable). Include a phone-width pass if a phone recording is attached.
2. **Ideate v2** the way v1 was ideated: discussion first, wide and deep, down to sizes, timings and copy. Produce a `v2-ideation.md` (about 10% context, 90% ideation) when the owner is ready. Mark `[DECIDED]`, `[OPEN]`, `[CALIBRATE]`, `[VERIFY]`.
3. **Fix the open items** in section 7 as the owner supplies the missing inputs (screenshots first: they unlock the callouts).
4. **Build v2 in slices**, same prompt style and loop as section 2.

**Seed backlog (candidates, not decisions; discuss before building):**
- Hero: a soft light beam falling onto the demo frame (Huly's lesson, in violet); a second demo state where one unconfirmed rule blocks "Room ready"; stronger first-five-seconds hierarchy.
- Problem rail: a signature interaction (for example a scope slider the visitor drags while the clock reacts); stronger visual identity for the five mini visuals.
- How it works: tune callouts to the real screenshots; consider a more cinematic frame treatment.
- Stage act: richer rehearsal and Judge's Chair states; consider an optional sound toggle (off by default, one control in the nav); consider haptics on mobile.
- A whole-page dark-mode toggle.
- A real-numbers proof section, once any real numbers exist (rooms created, submissions marked). Never before.
- Section transitions and rhythm between the quiet middle sections (room grid, trust, compare, pricing, FAQ), which are currently the least distinctive part of the page.
- Mobile: dedicated mobile moments instead of the stacked fallbacks.
- Performance and SEO: prerender `/`, Open Graph image, canonical URL.

## 9. Standard shape of a build prompt (reuse it)

Every prompt in v1 followed this skeleton, and the agent handled it reliably:
1. Context paragraph: what exists, what this prompt builds, what NOT to build; "Do NOT run tests, builds, linters or the dev server."
2. **Standing rules** block (kebab-case, strict TS, no hard-coded colours, no new dependencies, no unicode escapes in JSX, copy in data files, product name rules, only touch `features/landing/` unless stated).
3. **0. Read first (read-only):** the exact files to read so new code matches existing style, plus any discovery the agent must do (for example "find the router package Link is imported from").
4. Numbered sections: data files (full content), hooks (full code when logic is tricky), components (props, markup, notes), section files, updates to existing files, and one **appended CSS block** at the end of `landing.css` (never edit earlier blocks except where a small fix is stated explicitly).
5. **Rules** (which files change, no new dependencies, no emojis, copy exactly as written) and **When you are done** (short summary only: files changed, decisions made, nothing about testing).
Follow it with a short "what you should see afterwards" list for the owner's manual check, and flag anything that was guessed or could not be verified.
