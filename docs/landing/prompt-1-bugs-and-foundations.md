# PROMPT 1 of 5 · v2 bugs and foundations

**Context.** The [brackit] landing page (`frontend/src/features/landing/`) is version 1 and is complete. We are building version 2. This prompt fixes the confirmed bugs and lays the foundations every later prompt depends on: a Launch Pad layout that no longer lets the stamp cover text, a longer pause after the stamp, orphan-free text, readable captions, and one consistent spacing system. It builds NO new sections and NO hero wall (that is prompts 2 and 3).

## STANDING RULES (apply to everything below)

- Work only inside `frontend/src/features/landing/` unless a section below says otherwise.
- File names are kebab-case, components PascalCase, TypeScript strict, no `any`, `import type` for types, plain-English comments.
- Do NOT add any dependency. The `motion` package is NOT installed and must not be added. All motion is CSS transitions and keyframes, `setTimeout`/`setInterval`, `IntersectionObserver`, `ResizeObserver`, and passive scroll listeners with `requestAnimationFrame`.
- No hard-coded colours in any landing `.tsx` file. Use classes and CSS variables. Colour literals are only allowed inside `styles/landing.css`, and only where this prompt gives them.
- All copy lives in `data/*.ts`, not in JSX. Type real characters (’ – · … ©) in JSX text. Do not use unicode escape sequences in JSX text (they print literally). Escapes are allowed inside plain TypeScript strings in `.ts` files.
- All new CSS goes in ONE new labelled block appended at the very end of `styles/landing.css`, scoped under `.landing-root`. Landing-only classes start with `l-`, landing-only variables with `--l-`. Never edit earlier CSS blocks except where this prompt explicitly names the rule to change.
- Reuse existing product tokens and the existing `--l-*` tokens (`--l-ink-2-strong`, `--l-danger-text`, `--l-cream*`, the easing and duration variables). Find the exact existing variable names in `landing.css` first. If an easing variable does not exist, use the literal `cubic-bezier(0.22, 1, 0.36, 1)`.
- Everything must respect `prefers-reduced-motion: reduce` (final static state, no loops, no autoplay).
- Product name: `[brackit]` lowercase with brackets in copy and headings. Voice: direct, calm, specific, short sentences. No exclamation marks. Banned words: seamless, unleash, supercharge, elevate, effortless.
- Honesty: every demo or screen is fictional, labelled "Example" or "Illustrative". No invented users, quotes, logos, partners, numbers or measured times.
- Do NOT run tests, builds, linters, type-checks or the dev server. Do NOT open a browser. Do NOT write PASS/FAIL reports. The owner tests by hand.
- When you are done, reply with a SHORT summary only: files created, files changed, any decision you had to make, and any value you had to guess.

---

## 0. Read first (read-only)

Read these completely so new code matches the existing style and names:

1. `styles/landing.css` (all of it). Note the existing easing/duration variable names, the `--l-ink-2-strong` token, and every block that styles `.l-launch*`, `.l-stamp*`, `.l-stage*`.
2. `components/scenes/` → the Launch Pad scene file (the one that renders the clock `03:12:47`, the lead sentence, the "Mark as submitted" button, the stamp, "Submitted with margin." and the milestone timeline).
3. `components/stage-overlay.tsx`, `components/stage-shell.tsx`, `components/stage-frame.tsx`.
4. `hooks/use-stage-progress.ts` and `data/stage-act.ts`.
5. `sections/stage-act.tsx`.
6. `components/section.tsx`, `components/italic-heading.tsx`, `components/eyebrow.tsx`.
7. Every file in `sections/` (just to learn the class names each section uses for its outer padding and its header block).
8. `data/hero-demo.ts`, `data/trust.ts`, `data/playbooks.ts` (only to find caption/label strings).

Do not modify anything while reading.

---

## 1. BUG FIX · Launch Pad: the stamp must never cover text

**The bug.** When "Mark as submitted" is pressed, the red `SUBMITTED` stamp lands on top of the lead sentence ("Submit your project on the event’s own platform. When that’s done, mark it here to close out this room.") and on the button, and also clips the last digits of the clock. The text underneath stays visible and collides with the stamp.

**The fix, in one sentence.** The lead sentence, the button and the "Leader only" note live in one box (`.l-launch__ask`). The stamp lives in a second box (`.l-launch__stampbox`). Both boxes sit in the SAME grid cell (stacked), so the stamp lands exactly where the copy was, and the copy is gone by then. Nothing shifts, because the cell has a fixed minimum height.

### 1a. Target markup (adapt names to the existing component, keep the existing clock, timeline and stamp artwork)

```tsx
<div className="l-launch" data-phase={phase}>
  <p className="l-launch__label">Time left</p>
  <p className="l-launch__clock">{clockText}</p>

  <div className="l-launch__zone">
    <div className="l-launch__ask">
      <p className="l-launch__lead">{lead}</p>
      <button type="button" className="l-launch__button" /* keep existing handlers and classes */>
        Mark as submitted
      </button>
      <p className="l-launch__note">Leader only</p>
    </div>
    <div className="l-launch__stampbox" aria-hidden="true">
      {/* the EXISTING stamp element, unchanged artwork */}
    </div>
  </div>

  <p className="l-launch__margin">Submitted with margin.</p>
  {/* the EXISTING milestone timeline, wrapped as: */}
  <div className="l-launch__timeline">{/* existing timeline */}</div>
</div>
```

`phase` is a string with exactly three values:
- `"idle"` before the press.
- `"pressed"` for the 140 ms between the press and the stamp.
- `"stamped"` from the moment the stamp lands until the scene resets.

Map `phase` onto the existing state logic that already drives the stamp (both the visitor click and the demo cursor press paths). If the existing logic is a single boolean "submitted", add the 140 ms `"pressed"` beat with a `setTimeout` (clear it on unmount and on reset). When the scene resets (scrolling back up), set `phase` to `"idle"` immediately.

### 1b. Sequence after the press (all CSS-driven from `data-phase`)

| Time | What happens |
|---|---|
| 0 ms | Button scales to 0.96 (`phase = pressed`). |
| 140 ms | `phase = stamped`. The `.l-launch__ask` box fades to opacity 0 and moves up 6px over 180 ms, then becomes `visibility: hidden`. |
| 240 ms | The stamp slams in (keep the existing slam keyframes and the existing frame jolt and ripple; only re-time them so they start at 240 ms). |
| 700 ms | "Submitted with margin." fades up. |
| 900 ms | The milestone timeline fades up. |

The clock freezes at `03:12:47` exactly as before. Do not change the freeze logic or the HUD `SUBMITTED` state.

### 1c. CSS to append (new block, see section 6 for the block header)

```css
/* Launch Pad zone: copy and stamp share one grid cell */
.landing-root .l-launch__zone {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 184px;
}
.landing-root .l-launch__zone > * { grid-area: 1 / 1; }

.landing-root .l-launch__ask {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 46ch;
  text-align: center;
  transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
              visibility 0s linear 0s;
}
.landing-root .l-launch[data-phase="stamped"] .l-launch__ask {
  opacity: 0;
  transform: translateY(-6px);
  visibility: hidden;
  pointer-events: none;
  transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
              visibility 0s linear 180ms;
}
.landing-root .l-launch[data-phase="pressed"] .l-launch__button {
  transform: scale(0.96);
}

.landing-root .l-launch__stampbox {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  visibility: hidden;
  pointer-events: none;
}
.landing-root .l-launch[data-phase="stamped"] .l-launch__stampbox { visibility: visible; }
/* the stamp can never be wider than its box, so it cannot reach the clock or the timeline */
.landing-root .l-launch__stampbox > * {
  max-width: min(340px, 82%);
  transform-origin: center;
}

/* these two reserve their space from the start, so nothing jumps when they appear */
.landing-root .l-launch__margin,
.landing-root .l-launch__timeline {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 360ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-launch[data-phase="stamped"] .l-launch__margin {
  opacity: 1; transform: none; transition-delay: 460ms;
}
.landing-root .l-launch[data-phase="stamped"] .l-launch__timeline {
  opacity: 1; transform: none; transition-delay: 660ms;
}

@media (prefers-reduced-motion: reduce) {
  .landing-root .l-launch__ask,
  .landing-root .l-launch__margin,
  .landing-root .l-launch__timeline { transition: none; }
}
```

Rules for this section:
- The existing stamp artwork (red ink, double border, text `SUBMITTED`, rotation about -6deg) stays. Constrain its final height to at most 96px and its final width to at most 340px by changing the stamp's own size rule if it is larger than that. Name the rule you changed in your summary.
- If the old CSS positioned the stamp absolutely over the whole scene, remove only that positioning rule (the stamp is now positioned by `.l-launch__stampbox`).
- If the old CSS already has rules for `.l-launch__margin` or the timeline fade, delete only those old fade rules so they do not fight the new ones.

---

## 2. POLISH · The stage must hold after the stamp

**The problem.** After the stamp lands, the pinned frame scrolls away almost at once, so "Submitted with margin." is on screen for about one second. The payoff needs about one more screen of scrolling where the frame stays pinned and nothing moves.

**The fix.** Make the pinned runway longer WITHOUT changing the scroll distance of anything that already happens.

1. In `hooks/use-stage-progress.ts` and `sections/stage-act.tsx`, find the runway length (about 340% of a screen on desktop). Change it to **400%** on desktop. Keep it a single named constant or CSS variable, and name it `--l-stage-runway` if it is a variable.
2. Remap progress so the existing timeline is unchanged: `progressOld = Math.min(1, progressNew * (400 / 340))`. Everything that currently reads the progress (scene cross-fades, the demo cursor, the stamp trigger) must read `progressOld`. The result: all existing events happen at exactly the same scroll positions as today, and the last 15% of the runway (about 60% of a screen) is a pure hold with the stamp, "Submitted with margin." and the timeline fully visible.
3. Do not change phone, tablet or reduced-motion behaviour (they stay stacked and play-once).
4. The nav and HUD behaviour over the dark section stays as is.

---

## 3. BUG FIX · Orphans and widows

**The bug.** The lead under "From kickoff to submission, on one clock." ends with a single word alone on the last line ("… are built / in."). Other leads have the same risk.

### 3a. CSS (append in the new block)

```css
/* balanced headings, no one-word last lines in paragraphs */
.landing-root :where(h1, h2, h3) { text-wrap: balance; }
.landing-root :where(p, li, figcaption, dd) { text-wrap: pretty; }
```

### 3b. A tiny helper

Create `lib/no-orphan.ts`:

```ts
/** Glues the last two words together with a non-breaking space so a paragraph never ends on a single word. */
export function noOrphan(text: string): string {
  const i = text.lastIndexOf(' ');
  if (i <= 0) return text;
  return text.slice(0, i) + '\u00A0' + text.slice(i + 1);
}
```

### 3c. Where to use it

Wrap with `noOrphan(...)` the string rendered for EVERY section lead paragraph (the paragraph directly under each H2) and every short paragraph in cards and tiles (doors, playbooks, room grid tiles, trust rows, compare cards, pricing card notes, FAQ answers). Do it at render time inside the shared component if one exists, otherwise at each place the string is rendered. Do NOT apply it to strings that contain `<`, to the H1/H2 text, or to anything shorter than three words.

---

## 4. POLISH · Small captions must be readable

**The problem.** Small mono captions and labels use `--ink-3` or `--ink-2` on light backgrounds (contrast about 2.3:1 and 4.4:1), and some are 10 to 11px.

**The fix.**

1. In `landing.css`, search every `l-` rule that sets `color: var(--ink-3)` or `color: var(--ink-2)` on TEXT that sits on a light background. Change the text colour to `var(--l-ink-2-strong)`. Leave unchanged: placeholder or disabled text, decorative bracket glyphs, hairlines, and anything on the dark stage or dark final CTA.
2. Every landing text class that is smaller than 12px (labels such as "Pasted text", "Sample brief for a fictional event.", "Example output with sample data.", "Illustrative…", playbook meta lines, the Trust right-hand captions, tile labels like `[ brief ]`) gets `font-size: 12px`. The exception: text inside the hero demo card, the deep-dive demo cards and the stage scenes, which are product miniatures and keep their own sizes.
3. Mono captions get `letter-spacing: 0.02em` and `line-height: 1.5`.
4. On the dark stage, caption colour must be `var(--l-cream)` at no less than 0.62 alpha (use the existing cream family variable that matches).

List in your summary every selector you changed (selector, old colour/size, new colour/size) as a short table.

---

## 5. POLISH · One spacing system for the quiet sections

**The problem.** Gaps between sections are inconsistent: very large after the proof strip and between Playbooks and the room grid, tight elsewhere.

### 5a. Tokens (append in the new block)

```css
.landing-root {
  --l-section-y: clamp(88px, 10vw, 144px);   /* vertical padding of an ordinary section */
  --l-head-gap: clamp(36px, 4.5vw, 60px);    /* header block to content */
  --l-block-gap: clamp(20px, 2.4vw, 32px);   /* gap between blocks inside a section */
}
```

### 5b. Apply

- **Ordinary sections** (playbooks, room-grid, trust, compare, pricing, faq): `padding-block: var(--l-section-y)`, and the margin between the header block (eyebrow + H2 + lead) and the content is `var(--l-head-gap)`. Remove any other top or bottom margin or padding on these sections' outer elements so adjacent sections never add up.
- **Deep dives:** the two dives are separated by `calc(var(--l-section-y) * 0.8)`; the section's top and bottom padding is `var(--l-section-y)`.
- **Doors:** `padding-top: 56px; padding-bottom: 40px`.
- **Proof strip:** `padding-block: 32px`.
- **Do NOT touch:** hero, problem-rail, pivot, how-it-works, stage-act, final-cta, site-footer (they are pinned or have their own rhythm).
- Where the existing rule is a media query that changes padding on small screens, keep the media query but express its values with the tokens above.

In your summary give a short table: section, old padding, new padding.

---

## 6. The appended CSS block

Everything marked "append" above goes into one block at the very end of `styles/landing.css`, in this order, under this header:

```css
/* ========== v2 · prompt 1 · bugs and foundations ========== */
```

Order inside the block: tokens (5a), text-wrap (3a), caption fixes (4), spacing rules (5b), Launch Pad zone (1c).

Where a rule in section 4 or 5b must override an earlier rule of the same specificity, place it in this block (later wins). Only edit an earlier block if it is impossible to override (for example the stamp's own size rule, section 1).

---

## Rules

- Do not change any copy. Do not add sections. Do not touch the hero, the problem rail, the pivot, or the How it works section in this prompt.
- Do not add dependencies. Do not add comments about testing.

## When you are done

Reply with a short summary only: files created, files changed, the tables requested in sections 4 and 5, the name of the stamp rule you changed, and any value you had to guess.
