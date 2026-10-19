# PROMPT 5 of 5 · v2 the quiet middle gets a voice

**Context.** Playbooks, the room grid, Trust, Compare, Pricing and the FAQ all share the same rhythm (eyebrow, H2, lead, grid), so the middle of the page feels samey. Version 2 keeps them calm but gives each one a small, specific behaviour, plus a shared device that ties them together: a **tick ruler** between sections (a hairline with a tick for every "hour"), and the reference’s card anatomy (a preview on top and a label strip underneath). Nothing here uses the dark theme, glow or new showpiece effects.

Prompt 1 already created the spacing tokens (`--l-section-y`, `--l-head-gap`, `--l-block-gap`), the caption contrast fixes and the `noOrphan` helper. Use them.

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

1. `sections/playbooks.tsx`, `components/playbook-card.tsx`, `data/playbooks.ts`.
2. `sections/room-grid.tsx`, `components/room-visuals.tsx`, `data/room-grid.ts`.
3. `sections/trust.tsx`, `data/trust.ts`.
4. `sections/compare.tsx`, `data/compare.ts`.
5. `sections/pricing.tsx`, `data/pricing.ts`.
6. `sections/faq.tsx`, `data/faq.ts`.
7. `sections/proof-strip.tsx`, `data/proof-strip.ts`.
8. `components/reveal.tsx`, `components/eyebrow.tsx`, `components/italic-heading.tsx`, `components/section.tsx`, `hooks/use-in-view-once.ts`.
9. `styles/landing.css`: all rules for the sections above, and the block from prompt 1 (tokens).

---

## 1. The tick ruler (shared device)

A thin divider placed between the quiet sections. It reads like the ruler under a clock: a 1px hairline with a tick every 24px, fading out at both ends, and a mono label at the left that names the step from one section index to the next. It draws itself once, left to right, when it enters the view.

### 1a. Component `components/tick-ruler.tsx`

```tsx
import { useInViewOnce } from '../hooks/use-in-view-once';

type TickRulerProps = {
  /** mono label, for example "05 → 06" */
  label: string;
};

export function TickRuler({ label }: TickRulerProps) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  return (
    <div ref={ref} className={`l-ruler${seen ? ' is-in' : ''}`} aria-hidden="true">
      <span className="l-ruler__label">{label}</span>
      <span className="l-ruler__line" />
    </div>
  );
}
```

Adapt the hook call to the real signature of `use-in-view-once.ts` (return shape and generic). Keep the component decorative: `aria-hidden`.

### 1b. Where it goes

Render a `TickRuler` in `landing-page.tsx` between these neighbouring sections, with these exact labels (use real characters, the arrow is `→`):

| Between | Label |
|---|---|
| playbooks and room-grid | `05 → 06` |
| room-grid and trust | `06 → 07` |
| trust and compare | `07 → 08` |
| compare and pricing | `08 → 09` |
| pricing and faq | `09 → 10` |

Put the labels in a new `data/rulers.ts` (`export const RULER_LABELS = [...]`), not in JSX. The ruler sits inside the page container width (same left edge as the section content), has `margin-block: 0`, and its own height is 28px. Because the neighbouring sections each have `padding-block: var(--l-section-y)`, the ruler must be placed so it visually sits in the middle of the gap: give it `margin-top: calc(var(--l-section-y) * -0.5)` and `margin-bottom: calc(var(--l-section-y) * -0.5)` and `position: relative; z-index: 1`.

### 1c. CSS

```css
.landing-root .l-ruler {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(100% - 48px, var(--l-container, 1120px));
  height: 28px;
  margin-inline: auto;
  margin-block: calc(var(--l-section-y) * -0.5);
  z-index: 1;
}
.landing-root .l-ruler__label {
  flex: none;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--l-ink-2-strong);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 480ms cubic-bezier(0.22, 1, 0.36, 1), transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-ruler__line {
  flex: 1;
  height: 9px;
  /* hairline along the bottom plus a tick every 24px */
  background:
    repeating-linear-gradient(to right, var(--border-strong) 0 1px, transparent 1px 24px) bottom / 100% 9px no-repeat,
    linear-gradient(var(--border-strong), var(--border-strong)) bottom / 100% 1px no-repeat;
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 60%, transparent 100%);
          mask-image: linear-gradient(to right, #000 0, #000 60%, transparent 100%);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms;
}
.landing-root .l-ruler.is-in .l-ruler__label { opacity: 1; transform: none; }
.landing-root .l-ruler.is-in .l-ruler__line { clip-path: inset(0 0 0 0); }
@media (prefers-reduced-motion: reduce) {
  .landing-root .l-ruler__label { opacity: 1; transform: none; transition: none; }
  .landing-root .l-ruler__line { clip-path: none; transition: none; }
}
```

If the container width variable has a different name than `--l-container`, use the real one (read `components/container.tsx` and its CSS).

---

## 2. Playbooks: the reference card anatomy plus a duration bar

### 2a. Section header with the link on the right

Following the reference, the section header becomes a two-column row on desktop: eyebrow, H2 and lead on the left; the link "Browse all playbooks →" on the right, aligned to the bottom of the lead. Below 900px it stacks and the link goes under the lead. Remove the existing "Browse all playbooks" link under the grid; keep the "Vetted tools for hackathon teams. Zero affiliate links, zero sponsored slots. / Explore the tool directory →" strip and the non-affiliation footnote exactly as they are.

```css
.landing-root .l-sechead { display: grid; gap: 20px; margin-bottom: var(--l-head-gap); }
@media (min-width: 900px) {
  .landing-root .l-sechead { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
}
.landing-root .l-sechead__action { justify-self: start; }
@media (min-width: 900px) { .landing-root .l-sechead__action { justify-self: end; } }
```

### 2b. Card anatomy

Each playbook card becomes: a **preview** area on top (aspect ratio 16 / 8, background `var(--surface)`, bottom hairline) and a **label strip** underneath with the title, the meta line and an arrow that appears on hover. The existing small duration ring moves into the label strip at the right and grows from its current size to 44px with the hours (or its existing text) centred in it at 12px.

**The preview** shows the playbook’s length against a fixed ruler:

- A horizontal track spanning the full preview width with 7 small ticks (0h, 6h, 12h, 18h, 24h, 30h, 36h), mono 11px labels under the first, middle and last tick (`0h`, `18h`, `36h`).
- A bar on the track whose width is `hours / 36` of the track, capped at 100%, with a tall bracket `[` at its left end and `]` at its right end (drawn with borders, 2px, ink). The bar itself is a 6px tall rounded bar with the brand gradient.
- The bar width animates from 0 when the card enters the view (the existing `Reveal`), 700 ms, staggered 60 ms per card index.
- On card hover the two brackets move 3px outward and the card lifts 2px with a soft shadow (180 ms).

**Data.** Open `data/playbooks.ts`. Each playbook already states its length somewhere in its existing strings (for example "36 h" on the Smart India Hackathon card). Add a field `hours: number | null` to the type and set it ONLY from what the existing copy already says. For any playbook whose existing copy gives no number of hours (asynchronous, corporate, solo and similar), set `hours: null`; the preview then shows a dashed track (1px dashed `var(--border-strong)`), no bar, and a mono label in the preview centre reading the card’s existing duration text. Do not invent a single hour value. List every playbook and the value you set in your summary.

```css
.landing-root .l-pb { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 18px; background: var(--card); overflow: hidden; transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1); }
.landing-root .l-pb:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -16px rgb(10 10 10 / 0.18); }
.landing-root .l-pb__preview { position: relative; aspect-ratio: 16 / 8; background: var(--surface); border-bottom: 1px solid var(--border); padding: 22px 22px 16px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; }
.landing-root .l-pb__track { position: relative; height: 22px; }
.landing-root .l-pb__ticks { position: absolute; inset: auto 0 0 0; height: 8px; background: repeating-linear-gradient(to right, var(--border-strong) 0 1px, transparent 1px calc(100% / 6)); }
.landing-root .l-pb__bar { position: absolute; left: 0; top: 4px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--brand-from), var(--brand-to)); width: 0; transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--i, 0) * 60ms); }
.landing-root .l-pb.is-in .l-pb__bar { width: var(--w); }
.landing-root .l-pb__bar::before,
.landing-root .l-pb__bar::after { content: ''; position: absolute; top: -6px; width: 6px; height: 18px; border: 0 solid var(--ink); transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1); }
.landing-root .l-pb__bar::before { left: -3px; border-width: 2px 0 2px 2px; }
.landing-root .l-pb__bar::after { right: -3px; border-width: 2px 2px 2px 0; }
.landing-root .l-pb:hover .l-pb__bar::before { transform: translateX(-3px); }
.landing-root .l-pb:hover .l-pb__bar::after { transform: translateX(3px); }
.landing-root .l-pb__scale { display: flex; justify-content: space-between; font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 11px; color: var(--l-ink-2-strong); }
.landing-root .l-pb__dashed { border-top: 1px dashed var(--border-strong); margin-top: 10px; }
.landing-root .l-pb__dashedlabel { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 12px; color: var(--l-ink-2-strong); text-align: center; }
.landing-root .l-pb__strip { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 18px 18px; }
.landing-root .l-pb__title { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
.landing-root .l-pb__meta { margin: 0; font-size: 13px; color: var(--l-ink-2-strong); }
.landing-root .l-pb__arrow { opacity: 0; transform: translateX(-4px); transition: opacity 180ms ease, transform 180ms ease; }
.landing-root .l-pb:hover .l-pb__arrow { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .landing-root .l-pb, .landing-root .l-pb__bar, .landing-root .l-pb__bar::before, .landing-root .l-pb__bar::after, .landing-root .l-pb__arrow { transition: none; }
  .landing-root .l-pb.is-in .l-pb__bar { width: var(--w); }
}
```

Set `--w` inline on each card as `${Math.min(100, (hours / 36) * 100)}%` and `--i` as the card index. The `is-in` class comes from the existing `Reveal` or `useInViewOnce` (add it to the card element).

---

## 3. Room grid: a deliberate entrance and a calm hover

- Tiles reveal with a **centre-out** stagger instead of reading order. Give each tile an inline `--d` delay in ms from this table for the nine tiles in their current reading order (left to right, top to bottom): `[180, 120, 180, 60, 0, 60, 180, 120, 180]` (if the grid has a different tile count, compute delay as `distance from the middle tile × 60` ms).
- Each tile: opacity 0 and `translateY(12px)` until the grid enters the view, then 480 ms with `--d`.
- Hover (desktop pointer only, `@media (hover: hover)`): the tile lifts 2px, its border becomes `var(--border-strong)`, and its illustration scales to 1.03 (180 ms).
- Illustrations grow by about 12% (increase the illustration box height by 12%; do not redraw them).

```css
.landing-root .l-tile { opacity: 0; transform: translateY(12px); transition: opacity 480ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms), transform 480ms cubic-bezier(0.22, 1, 0.36, 1) var(--d, 0ms), border-color 180ms ease, box-shadow 180ms ease; }
.landing-root .l-grid.is-in .l-tile { opacity: 1; transform: none; }
@media (hover: hover) {
  .landing-root .l-grid.is-in .l-tile:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: 0 12px 26px -16px rgb(10 10 10 / 0.16); transition-delay: 0ms; }
  .landing-root .l-tile:hover .l-tile__art { transform: scale(1.03); }
}
.landing-root .l-tile__art { transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) {
  .landing-root .l-tile { opacity: 1; transform: none; transition: none; }
}
```

Use the real class names of the grid and tiles (`l-grid`, `l-tile`, `l-tile__art` above are placeholders; map them to the existing ones, and add `is-in` to the grid wrapper from the existing in-view hook).

---

## 4. Trust: the spec sheet gets a hover bracket

- On hover of a row (desktop pointer only), two small brackets appear around the row’s left label (the mono label such as `Zero client keys`): `[` and `]` fade in and move 4px outward over 180 ms. Use pseudo-elements on the label.
- The right-hand caption (for example `41 gateways on the backend`) keeps its text but uses the readable colour from prompt 1.
- Row dividers draw in from the left when the spec sheet enters the view (a 1px line scaled from 0 to 1 on X, 600 ms, stagger 90 ms per row).

```css
.landing-root .l-trust__label { position: relative; display: inline-block; padding-inline: 10px; margin-inline: -10px; }
.landing-root .l-trust__label::before,
.landing-root .l-trust__label::after { content: ''; position: absolute; top: -3px; bottom: -3px; width: 5px; border: 0 solid var(--ink); opacity: 0; transition: opacity 180ms ease, transform 180ms ease; }
.landing-root .l-trust__label::before { left: 0; border-width: 1.5px 0 1.5px 1.5px; transform: translateX(4px); }
.landing-root .l-trust__label::after { right: 0; border-width: 1.5px 1.5px 1.5px 0; transform: translateX(-4px); }
@media (hover: hover) {
  .landing-root .l-trust__row:hover .l-trust__label::before { opacity: 1; transform: translateX(0); }
  .landing-root .l-trust__row:hover .l-trust__label::after { opacity: 1; transform: translateX(0); }
}
.landing-root .l-trust__row { position: relative; border-top: 0; }
.landing-root .l-trust__row::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--border-strong); transform: scaleX(0); transform-origin: left; transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--i, 0) * 90ms); }
.landing-root .l-trust.is-in .l-trust__row::before { transform: scaleX(1); }
@media (prefers-reduced-motion: reduce) { .landing-root .l-trust__row::before { transform: scaleX(1); transition: none; } }
```

Map to the real class names. Set `--i` per row inline. If the existing rows use `border-top` for their divider, remove ONLY that border rule so the new drawn line replaces it.

---

## 5. Compare: a sliding tab indicator and a cross-fade

- The four tabs get one shared sliding indicator: a rounded pill behind the active tab that moves and resizes to the active tab (transform and width, 260 ms, `cubic-bezier(0.22, 1, 0.36, 1)`). Measure the active tab with `offsetLeft` and `offsetWidth` in a `useLayoutEffect` and a `ResizeObserver`; set the pill’s `transform: translateX(...)` and `width` inline. The active tab text turns white (the pill is ink); inactive tabs are ink on transparent.
- When the tab changes, the two cards cross-fade: the outgoing content fades to 0 in 140 ms, then the incoming content fades up in 240 ms (use a `key` on the content wrapper and a CSS animation `l-fade-in` 240 ms; no outgoing animation is needed if it complicates the code, but never let content jump).
- The "In [brackit]" card stays visually dominant (white card, `border-strong`, soft shadow); the "Where it breaks" card gets the washed look: `opacity: 0.82` and background `var(--surface)`. Do not change copy.

```css
.landing-root .l-tabs { position: relative; display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); }
.landing-root .l-tabs__pill { position: absolute; left: 0; top: 4px; bottom: 4px; border-radius: 999px; background: var(--ink); transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), width 260ms cubic-bezier(0.22, 1, 0.36, 1); pointer-events: none; }
.landing-root .l-tabs__tab { position: relative; z-index: 1; padding: 8px 16px; border-radius: 999px; background: transparent; color: var(--ink); font-size: 14px; font-weight: 500; transition: color 200ms ease; }
.landing-root .l-tabs__tab[aria-selected='true'] { color: var(--card); }
@keyframes l-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.landing-root .l-compare__content { animation: l-fade-in 240ms cubic-bezier(0.22, 1, 0.36, 1); }
@media (prefers-reduced-motion: reduce) { .landing-root .l-tabs__pill { transition: none; } .landing-root .l-compare__content { animation: none; } }
```

Keep the tabs fully keyboard accessible exactly as they are today (same roles, arrow-key behaviour and focus ring). The pill must not intercept pointer events. On narrow screens where the tabs wrap or scroll, hide the pill and fall back to the existing active-tab background.

---

## 6. FAQ: smooth open and close, and a bracket icon that turns

- Opening and closing an answer animates its height (240 ms). Use the `grid-template-rows: 0fr` to `1fr` technique: the answer wrapper is `display: grid`, its inner element has `overflow: hidden; min-height: 0`.
- The `[+]` and `[-]` icon becomes one icon whose inner glyph rotates: the horizontal bar stays, the vertical bar scales to 0 on open (180 ms), so `[+]` becomes `[–]`. Keep the brackets.
- Only one answer is open at a time if that is how it works today; do not change the behaviour, only the animation.

```css
.landing-root .l-faq__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1); }
.landing-root .l-faq__item[data-open='true'] .l-faq__panel { grid-template-rows: 1fr; }
.landing-root .l-faq__panel > div { min-height: 0; overflow: hidden; }
.landing-root .l-faq__icon-v { transform-origin: center; transition: transform 180ms ease; }
.landing-root .l-faq__item[data-open='true'] .l-faq__icon-v { transform: scaleY(0); }
@media (prefers-reduced-motion: reduce) { .landing-root .l-faq__panel, .landing-root .l-faq__icon-v { transition: none; } }
```

Keep `aria-expanded`, `aria-controls` and the hidden state for assistive tech: when closed, the answer must be `inert` or `visibility: hidden` after the transition so it cannot be tabbed into (use `visibility: hidden` with a `transition: visibility 0s linear 240ms` on close).

---

## 7. Proof strip and Doors: the staggered arrival

From the reference’s logo rows, items arrive one by one.

- Proof strip: the four facts rise 8px and fade in with a 60 ms stagger (`--i`), once, when the strip enters the view. No change to copy or layout.
- Doors: the three cards do the same with a 80 ms stagger, and the live card’s red dot starts pulsing only after its card has arrived.

```css
.landing-root .l-arrive { opacity: 0; transform: translateY(8px); transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--i, 0) * 60ms), transform 420ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--i, 0) * 60ms); }
.landing-root .is-in .l-arrive,
.landing-root .l-arrive.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .landing-root .l-arrive { opacity: 1; transform: none; transition: none; } }
```

---

## 8. Pricing

- Make the three cards the same height (`align-items: stretch` on the grid and the button pinned to the bottom with `margin-top: auto`).
- No other change. Keep the waitlist-only behaviour, labels and copy exactly as they are.

---

## 9. The appended CSS block

Everything above goes in one block at the very end of `styles/landing.css`, under this header, in this order: ruler, section header, playbooks, room grid, trust, compare, FAQ, arrive, pricing.

```css
/* ========== v2 · prompt 5 · quiet middle sections ========== */
```

---

## Rules

- No copy changes except new data fields (`hours`, ruler labels).
- No new dependencies, no images, no emojis. No dark sections here.
- Every animation honours `prefers-reduced-motion`; every hover effect is wrapped in `@media (hover: hover)` or is harmless on touch.
- Keep every existing ARIA role, label and keyboard behaviour.

## When you are done

Reply with a short summary only: files created, files changed, the table of playbook `hours` values you set, which class names you mapped the placeholders to, and any value you had to guess.
