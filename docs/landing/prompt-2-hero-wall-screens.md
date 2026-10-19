# PROMPT 2 of 5 · v2 hero wall, part A: the screens

**Context.** Version 2 of the [brackit] landing page adds a "product wall" behind the hero: a large canvas of small product screens (the brief, the team, the idea test, the plan, the ledger, rehearsal, the Judge’s Chair, readiness, the Launch Pad) that a slow camera drifts across, lighting one screen at a time. The pattern is taken from the hero of a site we admire: oversized, softly framed product screens with small mono captions, one screen lifted and sharp while the rest are washed out, a camera that pans between them, and a tiny cursor that acts inside the lit screen.

This prompt builds ONLY the raw material: the frame component, 14 screen components, the data file, and the CSS. It does NOT build the camera, the timers or the hero integration (that is prompt 3). After this prompt, nothing visible changes on the page yet, because nothing renders the wall.

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

1. `styles/landing.css` (all of it): learn the variable names, the existing `.l-` conventions and where the last block ends.
2. `components/hero-demo.tsx` and `data/hero-demo.ts`: the brief rows and the exact fictional brief. The wall's Brief screen must use the same eight rows.
3. `data/idea-demo.ts`, `data/ledger-demo.ts`, `data/stage-act.ts`, `data/how-rings.ts`: reuse their strings and numbers EXACTLY wherever this prompt says "reuse".
4. `components/readiness-rings.tsx`, `components/waveform.tsx`, `components/bracket.tsx`, `components/bracket-mark.tsx`: for the way rings, waveform bars and brackets are drawn.
5. `components/scenes/` (rehearsal, judge, readiness, launch) to keep the wall's miniatures visually consistent with the real stage scenes.

Do not modify any of these.

---

## 1. Design intent (read this before writing code)

- Each frame is a **tray**: a white rounded card with a hairline border, a one-line mono caption on top, and the **screen** inside it with its own hairline border and smaller radius. This is the same anatomy as the reference.
- The screens are tiny, quiet and honest: fictional room "Campus Build Sprint 2026", project "Club budget tracker". No photos, no logos, no real names (initials only).
- Screens are **not interactive**. The whole wall will be `aria-hidden` and `inert`. They are texture with meaning, not controls.
- A frame has two visual states: **rest** (washed out) and **focus** (lifted, sharp, shadowed). Focus is controlled by one class, `is-focus`, set from outside (prompt 3). Small micro-interactions inside a screen (ticks appearing, bars filling, a ghost cursor clicking) play only while its frame has `is-focus`.
- Nothing in this prompt uses images. Everything is CSS and inline SVG.

---

## 2. Files to create

```
components/hero-wall/wall-frame.tsx
components/hero-wall/wall-cursor.tsx
components/hero-wall/screens/brief-screen.tsx
components/hero-wall/screens/team-screen.tsx
components/hero-wall/screens/idea-screen.tsx
components/hero-wall/screens/plan-screen.tsx
components/hero-wall/screens/ledger-screen.tsx
components/hero-wall/screens/rehearsal-screen.tsx
components/hero-wall/screens/judge-screen.tsx
components/hero-wall/screens/readiness-screen.tsx
components/hero-wall/screens/launch-screen.tsx
components/hero-wall/screens/docs-screen.tsx
components/hero-wall/screens/clock-screen.tsx
components/hero-wall/screens/playbooks-screen.tsx
components/hero-wall/screens/summary-screen.tsx
components/hero-wall/screens/tools-screen.tsx
components/hero-wall/wall-screens.ts      (maps a screen id to its component)
data/hero-wall.ts
```

Append the CSS block described in section 6.

---

## 3. `data/hero-wall.ts` (create with exactly this content)

```ts
export type WallScreenId =
  | 'brief' | 'team' | 'idea' | 'plan' | 'ledger' | 'rehearsal' | 'judge'
  | 'readiness' | 'launch' | 'docs' | 'clock' | 'playbooks' | 'summary' | 'tools';

export type WallFrameDef = {
  /** unique key (fillers repeat a screen, so the key differs from the screen id) */
  key: string;
  screen: WallScreenId;
  /** 1-based grid column and row */
  col: number;
  row: number;
  /** how many columns the frame spans (1 or 2) */
  colSpan: 1 | 2;
  /** 1 to 9 for the journey frames the camera visits, null for fillers */
  journeyIndex: number | null;
  /** mono caption */
  label: string;
  /** illustrative clock time shown at the right of the caption, or null */
  time: string | null;
};

export const WALL_COLS = 6;
export const WALL_ROWS = 5;

export const WALL_FRAMES: WallFrameDef[] = [
  // row 1
  { key: 'tools-1',     screen: 'tools',     col: 1, row: 1, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  { key: 'clock-1',     screen: 'clock',     col: 2, row: 1, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  { key: 'playbooks-1', screen: 'playbooks', col: 3, row: 1, colSpan: 2, journeyIndex: null, label: 'Playbooks',      time: null },
  { key: 'docs-1',      screen: 'docs',      col: 5, row: 1, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'summary-1',   screen: 'summary',   col: 6, row: 1, colSpan: 1, journeyIndex: null, label: 'Project summary', time: null },
  // row 2 (journey, left to right)
  { key: 'docs-2',      screen: 'docs',      col: 1, row: 2, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'brief',       screen: 'brief',     col: 2, row: 2, colSpan: 1, journeyIndex: 1, label: 'Read the brief',  time: 'T–35:40' },
  { key: 'team',        screen: 'team',      col: 3, row: 2, colSpan: 1, journeyIndex: 2, label: 'Align the team',  time: 'T–34:10' },
  { key: 'idea',        screen: 'idea',      col: 4, row: 2, colSpan: 1, journeyIndex: 3, label: 'Choose one idea', time: 'T–32:30' },
  { key: 'plan',        screen: 'plan',      col: 5, row: 2, colSpan: 1, journeyIndex: 4, label: 'Plan',            time: 'T–30:00' },
  { key: 'clock-2',     screen: 'clock',     col: 6, row: 2, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  // row 3 (journey, right to left)
  { key: 'summary-2',   screen: 'summary',   col: 1, row: 3, colSpan: 1, journeyIndex: null, label: 'Project summary', time: null },
  { key: 'readiness',   screen: 'readiness', col: 2, row: 3, colSpan: 1, journeyIndex: 8, label: 'Readiness',       time: 'T–03:40' },
  { key: 'judge',       screen: 'judge',     col: 3, row: 3, colSpan: 1, journeyIndex: 7, label: 'Judge’s Chair',   time: 'T–04:10' },
  { key: 'rehearsal',   screen: 'rehearsal', col: 4, row: 3, colSpan: 1, journeyIndex: 6, label: 'Rehearse',        time: 'T–05:30' },
  { key: 'ledger',      screen: 'ledger',    col: 5, row: 3, colSpan: 1, journeyIndex: 5, label: 'Reality Ledger',  time: 'T–12:00' },
  { key: 'tools-2',     screen: 'tools',     col: 6, row: 3, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  // row 4
  { key: 'docs-3',      screen: 'docs',      col: 1, row: 4, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'launch',      screen: 'launch',    col: 2, row: 4, colSpan: 1, journeyIndex: 9, label: 'Launch pad',      time: 'T–03:12' },
  { key: 'summary-3',   screen: 'summary',   col: 3, row: 4, colSpan: 2, journeyIndex: null, label: 'Project summary', time: null },
  { key: 'clock-3',     screen: 'clock',     col: 5, row: 4, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  { key: 'docs-4',      screen: 'docs',      col: 6, row: 4, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  // row 5
  { key: 'playbooks-2', screen: 'playbooks', col: 1, row: 5, colSpan: 2, journeyIndex: null, label: 'Playbooks',      time: null },
  { key: 'tools-3',     screen: 'tools',     col: 3, row: 5, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  { key: 'docs-5',      screen: 'docs',      col: 4, row: 5, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'summary-4',   screen: 'summary',   col: 5, row: 5, colSpan: 2, journeyIndex: null, label: 'Project summary', time: null },
];

/** The order the camera visits the lit frames. It follows the product journey. */
export const WALL_SEQUENCE: string[] = [
  'brief', 'team', 'idea', 'plan', 'ledger', 'rehearsal', 'judge', 'readiness', 'launch',
];

export const WALL_CAPTION = 'Illustrative screens · fictional room';
```

---

## 4. Components

### 4a. `components/hero-wall/wall-frame.tsx`

```tsx
import type { ReactNode } from 'react';
import type { WallFrameDef } from '../../data/hero-wall';

type WallFrameProps = {
  def: WallFrameDef;
  focused: boolean;
  /** register the element so the camera can measure it */
  frameRef?: (el: HTMLDivElement | null) => void;
  children: ReactNode;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function WallFrame({ def, focused, frameRef, children }: WallFrameProps) {
  const caption = def.journeyIndex !== null ? `[ ${pad(def.journeyIndex)} ]  ${def.label}` : def.label;
  return (
    <div
      ref={frameRef}
      className={`l-wall-frame${focused ? ' is-focus' : ''}${def.colSpan === 2 ? ' l-wall-frame--wide' : ''}`}
      data-key={def.key}
      data-screen={def.screen}
      style={{ gridColumn: `${def.col} / span ${def.colSpan}`, gridRow: `${def.row}` }}
    >
      <div className="l-wall-frame__head">
        <span className="l-wall-frame__label">{caption}</span>
        {def.time ? <span className="l-wall-frame__time">{def.time}</span> : null}
      </div>
      <div className="l-wall-frame__screen">{children}</div>
    </div>
  );
}
```

### 4b. `components/hero-wall/wall-cursor.tsx`

A tiny arrow cursor drawn in inline SVG. It takes a start position and a travel distance in DESIGN pixels (the 400 by 250 space of a screen) and plays only while its frame is focused (CSS does that).

```tsx
type WallCursorProps = {
  /** start position inside the screen, in design px */
  x: number;
  y: number;
  /** travel to the click point, in design px */
  dx: number;
  dy: number;
  /** delay before it appears, in ms */
  delay?: number;
};

export function WallCursor({ x, y, dx, dy, delay = 300 }: WallCursorProps) {
  return (
    <svg
      className="l-wall-cursor"
      viewBox="0 0 16 20"
      width="14"
      height="18"
      aria-hidden="true"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        ['--dx' as string]: `${dx}px`,
        ['--dy' as string]: `${dy}px`,
        ['--cd' as string]: `${delay}ms`,
      }}
    >
      <path className="l-wall-cursor__shape" d="M1 1 L1 15 L4.6 11.8 L7 17.5 L9.6 16.4 L7.2 10.8 L12 10.6 Z" />
    </svg>
  );
}
```

### 4c. The screens

Every screen is a function component with NO props that returns ONE root element `<div className="l-ws ...">` (design size 400 by 250 px, see CSS). All text in the screens is aria-hidden by the wall, so no ARIA is needed. Use the shared classes defined in section 6 (`l-ws-head`, `l-ws-title`, `l-ws-meta`, `l-ws-chip`, `l-ws-btn`, `l-ws-row`, `l-ws-check`, `l-ws-bar`, etc.). Class names used in markup below must exist in the CSS of section 6.

Strings marked REUSE must be imported from the named data file, not retyped.

**`brief-screen.tsx`** (REUSE the eight rows of `data/hero-demo.ts`: label and value of Rubric, Deadline, Team size, Demo video, Repo, Tech, AI policy, Start rule)

```tsx
<div className="l-ws l-ws--brief">
  <div className="l-ws-head"><span className="l-ws-title">Brief</span><span className="l-ws-meta">8 items found</span></div>
  <div className="l-ws-rows">
    {rows.map((r, i) => (
      <div key={r.label} className={`l-ws-row${i >= 6 ? ' l-ws-row--late' : ''}`} style={{ ['--i' as string]: i - 6 }}>
        <span className="l-ws-check"><svg viewBox="0 0 10 10" width="8" height="8"><path d="M1.5 5.2 L4 7.6 L8.5 2.4" /></svg></span>
        <span className="l-ws-rowlabel">{r.label}</span>
        <span className="l-ws-rowvalue">{r.value}</span>
      </div>
    ))}
  </div>
  <div className="l-ws-btn l-ws-btn--off l-ws-confirm"><span className="l-ws-confirm__off">Confirm brief</span><span className="l-ws-confirm__on">Brief confirmed</span></div>
  <WallCursor x={300} y={120} dx={-272} dy={52} delay={400} />
</div>
```
Behaviour (CSS): rows 0 to 5 are ticked at rest. Rows 6 and 7 (class `l-ws-row--late`) are unticked at rest and tick one after the other while focused (delays 900 ms and 1250 ms). When both are ticked (1700 ms) the confirm button turns ink and swaps its label to `Brief confirmed`. On leaving focus everything resets after the wash-out finishes (see the reset rule in section 6).

**`team-screen.tsx`** (all fictional, initials only)

```tsx
<div className="l-ws l-ws--team">
  <div className="l-ws-head"><span className="l-ws-title">Team</span><span className="l-ws-chip l-ws-chip--brand">4 members</span></div>
  <div className="l-ws-rows">
    {members.map((m) => (
      <div key={m.initial} className="l-ws-person">
        <span className="l-ws-avatar">{m.initial}</span>
        <span className="l-ws-personrole">{m.role}</span>
        <span className="l-ws-skills">{m.skills.map((s) => <span key={s} className="l-ws-tag">{s}</span>)}</span>
      </div>
    ))}
  </div>
  <div className="l-ws-gap">
    <span className="l-ws-chip l-ws-chip--warn l-ws-gap__off">Gap: demo video, unassigned</span>
    <span className="l-ws-chip l-ws-chip--ok l-ws-gap__on">Demo video: assigned to S</span>
  </div>
</div>
```
with this local constant (put it in the same file):

```ts
const members = [
  { initial: 'A', role: 'Frontend', skills: ['React', 'CSS'] },
  { initial: 'M', role: 'Backend',  skills: ['API', 'Data'] },
  { initial: 'R', role: 'Design',   skills: ['Figma'] },
  { initial: 'S', role: 'Pitch',    skills: ['Speaking', 'Video'] },
];
```
Behaviour: at rest the warn chip shows. While focused, at 1300 ms the warn chip fades out and the success chip fades in in the same spot (they are stacked in one grid cell).

**`idea-screen.tsx`** (REUSE the three idea titles from `data/idea-demo.ts`; the first is the active one. If that file has numeric scores for the first idea use them, otherwise use 82, 64 and 30)

```tsx
<div className="l-ws l-ws--idea">
  <div className="l-ws-head"><span className="l-ws-title">Ideas</span><span className="l-ws-meta">stress test</span></div>
  <div className="l-ws-pills">
    {titles.map((t, i) => <span key={t} className={`l-ws-pill${i === 0 ? ' is-active' : ''}`}>{t}</span>)}
  </div>
  <div className="l-ws-scores">
    {scores.map((s, i) => (
      <div key={s.label} className="l-ws-score" style={{ ['--v' as string]: `${s.value}%`, ['--i' as string]: i }}>
        <span className="l-ws-scorelabel">{s.label}</span>
        <span className="l-ws-track"><span className="l-ws-fill" /></span>
        <span className="l-ws-scorenum">{s.value}</span>
      </div>
    ))}
  </div>
  <div className="l-ws-lock">
    <span className="l-ws-btn l-ws-btn--ink">Lock idea</span>
    <span className="l-ws-lockmark" aria-hidden="true">[ locked ]</span>
  </div>
</div>
```
with scores labelled `Impact`, `Feasibility`, `Mock risk`. Behaviour: at rest the fills are at 0. While focused the three fills grow to their value (700 ms, 120 ms stagger, starting at 500 ms). At 1700 ms the `[ locked ]` mark fades in beside the button.

**`plan-screen.tsx`**

```tsx
<div className="l-ws l-ws--plan">
  <div className="l-ws-head"><span className="l-ws-title">Plan</span><span className="l-ws-meta">phase 2 of 4</span></div>
  <div className="l-ws-cols">
    {columns.map((c) => (
      <div key={c.name} className="l-ws-col">
        <span className="l-ws-colname">{c.name}</span>
        {c.cards.map((card, i) => (
          <div key={card} className={`l-ws-card${c.name === 'Now' && i === 0 ? ' l-ws-card--work' : ''}`}>
            <span className="l-ws-cardtext">{card}</span>
            <span className="l-ws-dot" />
            {c.name === 'Now' && i === 0 ? <span className="l-ws-card__bar"><span /></span> : null}
          </div>
        ))}
      </div>
    ))}
  </div>
</div>
```
with:

```ts
const columns = [
  { name: 'Now',   cards: ['Receipt upload flow', 'Budget total view'] },
  { name: 'Next',  cards: ['Export to Sheets', 'Demo script'] },
  { name: 'Later', cards: ['Polish empty states', 'Backup video'] },
];
```
Behaviour: the first "Now" card shows a thin progress bar that fills 0 to 100% (800 ms, starting at 600 ms) while focused, then the card gets a success tint at 1500 ms.

**`ledger-screen.tsx`** (REUSE the six components, their statuses and the mix bar proportions from `data/ledger-demo.ts`; if the mix is derived, derive it the same way)

```tsx
<div className="l-ws l-ws--ledger">
  <div className="l-ws-head"><span className="l-ws-title">Reality Ledger</span><span className="l-ws-meta">example</span></div>
  <div className="l-ws-mix">{mix.map((m, i) => <span key={m.status} className={`l-ws-mixseg l-ws-mixseg--${m.status}`} style={{ flexGrow: m.count, ['--i' as string]: i }} />)}</div>
  <div className="l-ws-rows">
    {components.map((c) => (
      <div key={c.name} className="l-ws-lrow">
        <span className="l-ws-rowlabel">{c.name}</span>
        <span className={`l-ws-chip l-ws-chip--${c.status}`}>{c.statusLabel}</span>
      </div>
    ))}
  </div>
</div>
```
Status values are the four existing ones: built, existing, mocked, planned. Map each to a chip variant in CSS (built = success, existing = brand, mocked = warn, planned = neutral). Behaviour: while focused the mix segments grow from zero width one after another (500 ms each, 150 ms stagger).

**`rehearsal-screen.tsx`** (REUSE the teleprompter lines and the `Run 2 · 2:41 / 3:00` style line from `data/stage-act.ts`; show only the first five lines)

```tsx
<div className="l-ws l-ws--rehearsal">
  <div className="l-ws-head"><span className="l-ws-title">Pitch rehearsal</span><span className="l-ws-meta">{runLine}</span></div>
  <div className="l-ws-prompter">
    {lines.map((l, i) => <p key={l} className="l-ws-pline" style={{ ['--i' as string]: i }}>{l}</p>)}
  </div>
  <div className="l-ws-wave">{Array.from({ length: 36 }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}</div>
</div>
```
Behaviour: at rest line 1 is ink and the rest are muted. While focused each line becomes ink in turn (700 ms apart, starting at 500 ms) and the previous one fades back to muted. The 36 wave bars animate their height with a staggered keyframe loop (see CSS), but only while focused.

**`judge-screen.tsx`** (REUSE the question and the two ledger chips from the judge scene data in `data/stage-act.ts`)

```tsx
<div className="l-ws l-ws--judge">
  <div className="l-ws-qstack">
    <div className="l-ws-qcard l-ws-qcard--back" />
    <div className="l-ws-qcard">
      <span className="l-ws-meta">Judge’s question</span>
      <p className="l-ws-q">{question}</p>
      <span className="l-ws-chip l-ws-chip--ok l-ws-ready">Answer ready</span>
    </div>
  </div>
  <div className="l-ws-side">
    <span className="l-ws-meta">Reality ledger</span>
    {chips.map((c) => <span key={c.name} className="l-ws-lrow"><span className="l-ws-rowlabel">{c.name}</span><span className={`l-ws-chip l-ws-chip--${c.status}`}>{c.statusLabel}</span></span>)}
  </div>
</div>
```
Behaviour: at rest the back card is tucked under the front card. While focused (from 400 ms) the back card slides 10px right and 8px down and rotates 2deg (a fanned stack), and the `Answer ready` chip pops in (scale 0.7 to 1, 240 ms, from 1100 ms).

**`readiness-screen.tsx`** (REUSE the six labels and percentages from `data/stage-act.ts` or `data/how-rings.ts`, whichever holds the stage scene values: 100, 92, 100, 100, 100, 74)

Draw six rings in a 3 by 2 grid. Each ring is an inline SVG, 40 by 40, radius 16, stroke width 3.5, `stroke-linecap: round`, with a track circle and a value circle. The value circle gets `style={{ ['--p' as string]: percent }}`; its CSS dash is `stroke-dasharray: 100.5` and `stroke-dashoffset: calc(100.5 * (1 - var(--p) / 100))`. The percent text sits centred (mono 9px). The 74 ring uses the warn colour, the others use the success colour. Label under each ring (9px). Behaviour: at rest all rings are EMPTY (offset 100.5). While focused they fill (900 ms, 100 ms stagger, starting at 400 ms).

**`launch-screen.tsx`**

```tsx
<div className="l-ws l-ws--launch">
  <span className="l-ws-meta">TIME LEFT</span>
  <span className="l-ws-bigclock">03:12:47</span>
  <span className="l-ws-btn l-ws-btn--ink l-ws-press">Mark as submitted</span>
  <span className="l-ws-meta">Leader only</span>
</div>
```
Behaviour: the colons blink at a 1 s loop only while focused; at 1500 ms the button does one press pulse (scale 0.94 and back, 260 ms). NO stamp here: the stamp is the finale further down the page and must not be spoiled.

**Filler screens** (aria-hidden texture; no invented copy; text-free skeletons except the clock):

- `docs-screen.tsx`: a header line (`l-ws-title` bar skeleton) and nine rows, each a small rounded square icon and one grey bar of varying width (use 9 widths: 72, 58, 84, 64, 76, 52, 80, 60, 68 percent). Class `l-ws-skel` for the bars.
- `clock-screen.tsx`: the text `T–36:00:00` in JetBrains Mono 40px centred, under it a rail of 8 small dots, the first filled.
- `playbooks-screen.tsx` (wide): three mini cards side by side; each has a bar skeleton for a title, a short bar for meta and a small ring (SVG, 22px) on the right. Use the real names only for the first row title text on the three cards: `Smart India Hackathon`, `MLH weekend sprint`, `Devpost online event` (these names already appear on the page). Everything else is skeleton.
- `summary-screen.tsx` (wide): left a block with three stat skeletons (big bar plus small bar), right a mix bar and four lines of skeleton text. No numbers.
- `tools-screen.tsx`: a 3 by 2 grid of rounded squares (skeletons) each with a short bar below. No brand names, no logos.

### 4d. `components/hero-wall/wall-screens.ts`

```ts
import type { ComponentType } from 'react';
import type { WallScreenId } from '../../data/hero-wall';
import { BriefScreen } from './screens/brief-screen';
// ... import every screen
export const WALL_SCREENS: Record<WallScreenId, ComponentType> = {
  brief: BriefScreen, team: TeamScreen, idea: IdeaScreen, plan: PlanScreen, ledger: LedgerScreen,
  rehearsal: RehearsalScreen, judge: JudgeScreen, readiness: ReadinessScreen, launch: LaunchScreen,
  docs: DocsScreen, clock: ClockScreen, playbooks: PlaybooksScreen, summary: SummaryScreen, tools: ToolsScreen,
};
```

---

## 5. Sizing model (important, it drives the CSS)

- A screen is DESIGNED at 400 by 250 px. A CSS `zoom` factor `--l-wall-k` scales it to the real size, so every number in the screen CSS is written in design px.
- The `--l-wall-w` variable is the REAL width of one screen: 340, 380, 440 or 520 px depending on the viewport. `--l-wall-k = --l-wall-w / 400`.
- A tray is the screen plus 10 px padding on every side plus a 30 px caption row. One grid cell is `--l-wall-w + 20px` wide and `--l-wall-w * 0.625 + 50px` tall. A wide frame spans two cells plus one gap.

---

## 6. CSS to append

Append under this header at the very end of `styles/landing.css`:

```css
/* ========== v2 · prompt 2 · hero wall screens ========== */
```

### 6a. Sizing and tray

```css
.landing-root {
  --l-wall-w: 340px;
  --l-wall-k: 0.85;
  --l-wall-gap: 24px;
}
@media (min-width: 1280px) { .landing-root { --l-wall-w: 380px; --l-wall-k: 0.95; } }
@media (min-width: 1536px) { .landing-root { --l-wall-w: 440px; --l-wall-k: 1.1; } }
@media (min-width: 1920px) { .landing-root { --l-wall-w: 520px; --l-wall-k: 1.3; } }

.landing-root .l-wall-frame {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: calc(var(--l-wall-w) + 20px);
  height: calc(var(--l-wall-w) * 0.625 + 50px);
  padding: 0 10px 10px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgb(10 10 10 / 0.04);
  transition: box-shadow 700ms cubic-bezier(0.22, 1, 0.36, 1),
              border-color 700ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-wall-frame--wide { width: calc(var(--l-wall-w) * 2 + 40px + var(--l-wall-gap)); }

/* the wash: a veil over every frame that is not lit. Cheaper than a CSS filter. */
.landing-root .l-wall-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--shell);
  opacity: 0.66;
  pointer-events: none;
  transition: opacity 700ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-wall-frame.is-focus {
  border-color: var(--border-strong);
  box-shadow:
    0 2px 4px rgb(10 10 10 / 0.04),
    0 18px 40px -12px rgb(10 10 10 / 0.16),
    0 40px 90px -30px rgb(109 94 245 / 0.22);
}
.landing-root .l-wall-frame.is-focus::after { opacity: 0; }

.landing-root .l-wall-frame__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 4px;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--l-ink-2-strong);
  white-space: pre;
}
.landing-root .l-wall-frame__time { color: var(--ink-3); }

.landing-root .l-wall-frame__screen {
  position: relative;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
}
```

### 6b. Screen base and shared parts (design px, 400 by 250)

```css
.landing-root .l-ws {
  position: relative;
  box-sizing: border-box;
  width: 400px;
  height: 250px;
  zoom: var(--l-wall-k);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  background: var(--card);
  color: var(--ink);
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 10px;
  line-height: 1.3;
}
.landing-root .l-wall-frame--wide .l-ws {
  width: calc((var(--l-wall-w) * 2 + 20px + var(--l-wall-gap)) / var(--l-wall-k));
}

.landing-root .l-ws-head { display: flex; align-items: center; justify-content: space-between; height: 16px; flex: none; }
.landing-root .l-ws-title { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
.landing-root .l-ws-meta { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--l-ink-2-strong); }

.landing-root .l-ws-chip { display: inline-flex; align-items: center; height: 16px; padding: 0 7px; border-radius: 999px; font-size: 9px; font-weight: 600; white-space: nowrap; background: var(--shell); color: var(--l-ink-2-strong); }
.landing-root .l-ws-chip--ok,
.landing-root .l-ws-chip--built { background: var(--success-bg); color: var(--success-fg); }
.landing-root .l-ws-chip--warn,
.landing-root .l-ws-chip--mocked { background: var(--warn-bg); color: var(--warn-fg); }
.landing-root .l-ws-chip--brand,
.landing-root .l-ws-chip--existing { background: color-mix(in srgb, var(--brand-from) 12%, transparent); color: var(--brand-from); }
.landing-root .l-ws-chip--planned { background: var(--shell); color: var(--l-ink-2-strong); }

.landing-root .l-ws-btn { display: inline-flex; align-items: center; justify-content: center; height: 24px; padding: 0 14px; border-radius: 999px; font-size: 10px; font-weight: 600; background: var(--ink); color: var(--card); }
.landing-root .l-ws-btn--off { background: var(--border); color: var(--l-ink-2-strong); }

.landing-root .l-ws-skel { display: block; height: 6px; border-radius: 3px; background: var(--border); }

.landing-root .l-ws-rows { display: flex; flex-direction: column; gap: 3px; }
.landing-root .l-ws-row { display: flex; align-items: center; gap: 8px; height: 18px; padding: 0 6px; border-radius: 6px; background: var(--surface); }
.landing-root .l-ws-rowlabel { font-weight: 600; width: 62px; flex: none; }
.landing-root .l-ws-rowvalue { color: var(--l-ink-2-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.landing-root .l-ws-check { display: grid; place-items: center; width: 11px; height: 11px; flex: none; border-radius: 3px; border: 1px solid var(--border-strong); background: var(--card); }
.landing-root .l-ws-check svg { fill: none; stroke: var(--card); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
.landing-root .l-ws-row:not(.l-ws-row--late) .l-ws-check { background: var(--ink); border-color: var(--ink); }
.landing-root .l-ws-row:not(.l-ws-row--late) .l-ws-check svg { opacity: 1; }
```

### 6c. Reset rule and the micro-interactions

The pattern: every animated element has a RESET transition (instant, but delayed 800 ms so it happens after the wash-out) and a FOCUS transition (smooth, with its own delay).

```css
/* Brief */
.landing-root .l-ws-row--late .l-ws-check { transition: background 0s linear 800ms, border-color 0s linear 800ms; }
.landing-root .l-ws-row--late .l-ws-check svg { transition: opacity 0s linear 800ms; }
.landing-root .is-focus .l-ws-row--late .l-ws-check { background: var(--ink); border-color: var(--ink); transition: background 180ms ease calc(900ms + var(--i) * 350ms), border-color 180ms ease calc(900ms + var(--i) * 350ms); }
.landing-root .is-focus .l-ws-row--late .l-ws-check svg { opacity: 1; transition: opacity 180ms ease calc(900ms + var(--i) * 350ms); }
.landing-root .l-ws-confirm { position: relative; align-self: stretch; width: auto; transition: background 0s linear 800ms, color 0s linear 800ms; }
.landing-root .l-ws-confirm__on { position: absolute; opacity: 0; transition: opacity 0s linear 800ms; }
.landing-root .l-ws-confirm__off { transition: opacity 0s linear 800ms; }
.landing-root .is-focus .l-ws-confirm { background: var(--ink); color: var(--card); transition: background 220ms ease 1700ms, color 220ms ease 1700ms; }
.landing-root .is-focus .l-ws-confirm__off { opacity: 0; transition: opacity 160ms ease 1700ms; }
.landing-root .is-focus .l-ws-confirm__on { opacity: 1; transition: opacity 220ms ease 1800ms; }

/* Team */
.landing-root .l-ws-person { display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 6px; border-radius: 8px; background: var(--surface); }
.landing-root .l-ws-avatar { display: grid; place-items: center; width: 20px; height: 20px; flex: none; border-radius: 50%; font-size: 10px; font-weight: 600; color: var(--brand-from); background: color-mix(in srgb, var(--brand-from) 14%, var(--card)); }
.landing-root .l-ws-personrole { font-weight: 600; width: 58px; flex: none; }
.landing-root .l-ws-skills { display: flex; gap: 4px; }
.landing-root .l-ws-tag { padding: 1px 6px; border-radius: 4px; background: var(--card); border: 1px solid var(--border); color: var(--l-ink-2-strong); font-size: 9px; }
.landing-root .l-ws-gap { display: grid; margin-top: auto; }
.landing-root .l-ws-gap > * { grid-area: 1 / 1; justify-self: start; }
.landing-root .l-ws-gap__on { opacity: 0; transition: opacity 0s linear 800ms; }
.landing-root .l-ws-gap__off { transition: opacity 0s linear 800ms; }
.landing-root .is-focus .l-ws-gap__off { opacity: 0; transition: opacity 200ms ease 1300ms; }
.landing-root .is-focus .l-ws-gap__on { opacity: 1; transition: opacity 260ms ease 1400ms; }

/* Idea */
.landing-root .l-ws-pills { display: flex; gap: 5px; flex-wrap: wrap; }
.landing-root .l-ws-pill { padding: 3px 9px; border-radius: 999px; font-size: 9px; font-weight: 600; border: 1px solid var(--border); color: var(--l-ink-2-strong); }
.landing-root .l-ws-pill.is-active { background: var(--ink); border-color: var(--ink); color: var(--card); }
.landing-root .l-ws-scores { display: flex; flex-direction: column; gap: 9px; margin-top: 6px; }
.landing-root .l-ws-score { display: grid; grid-template-columns: 62px 1fr 22px; align-items: center; gap: 8px; }
.landing-root .l-ws-scorelabel { font-weight: 600; }
.landing-root .l-ws-scorenum { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 9px; text-align: right; color: var(--l-ink-2-strong); }
.landing-root .l-ws-track { height: 6px; border-radius: 3px; background: var(--shell); overflow: hidden; }
.landing-root .l-ws-fill { display: block; height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, var(--brand-from), var(--brand-to)); transition: width 0s linear 800ms; }
.landing-root .is-focus .l-ws-fill { width: var(--v); transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1) calc(500ms + var(--i) * 120ms); }
.landing-root .l-ws-lock { display: flex; align-items: center; gap: 10px; margin-top: auto; }
.landing-root .l-ws-lockmark { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 9px; color: var(--brand-from); opacity: 0; transition: opacity 0s linear 800ms; }
.landing-root .is-focus .l-ws-lockmark { opacity: 1; transition: opacity 260ms ease 1700ms; }

/* Plan */
.landing-root .l-ws-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex: 1; }
.landing-root .l-ws-col { display: flex; flex-direction: column; gap: 6px; padding: 7px; border-radius: 8px; background: var(--surface); }
.landing-root .l-ws-colname { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--l-ink-2-strong); }
.landing-root .l-ws-card { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; min-height: 40px; padding: 6px 7px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); font-weight: 500; transition: background 0s linear 800ms; }
.landing-root .l-ws-dot { width: 6px; height: 6px; margin-top: 2px; border-radius: 50%; background: var(--border-strong); flex: none; }
.landing-root .l-ws-card__bar { position: absolute; left: 7px; right: 7px; bottom: 6px; height: 3px; border-radius: 2px; background: var(--shell); overflow: hidden; }
.landing-root .l-ws-card__bar span { display: block; height: 100%; width: 0; background: var(--success-fg); transition: width 0s linear 800ms; }
.landing-root .is-focus .l-ws-card__bar span { width: 100%; transition: width 800ms cubic-bezier(0.22, 1, 0.36, 1) 600ms; }
.landing-root .is-focus .l-ws-card--work { background: var(--success-bg); transition: background 300ms ease 1500ms; }

/* Ledger */
.landing-root .l-ws-mix { display: flex; gap: 2px; height: 6px; flex: none; }
.landing-root .l-ws-mixseg { flex-basis: 0; width: 0; border-radius: 3px; background: var(--ink); }
.landing-root .l-ws-mixseg--existing { background: var(--brand-from); }
.landing-root .l-ws-mixseg--mocked { background: var(--bg-accent); }
.landing-root .l-ws-mixseg--planned { background: var(--border-strong); }
.landing-root .l-ws-mixseg { transform-origin: left center; transform: scaleX(0); transition: transform 0s linear 800ms; }
.landing-root .is-focus .l-ws-mixseg { transform: scaleX(1); transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1) calc(400ms + var(--i) * 150ms); }
.landing-root .l-ws-lrow { display: flex; align-items: center; justify-content: space-between; height: 24px; padding: 0 6px; border-radius: 6px; background: var(--surface); }
.landing-root .l-ws-lrow .l-ws-rowlabel { width: auto; }

/* Rehearsal */
.landing-root .l-ws-prompter { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.landing-root .l-ws-pline { margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: 15px; line-height: 1.15; color: var(--ink); opacity: 0.38; transition: opacity 0s linear 800ms; }
.landing-root .l-ws-pline:first-child { opacity: 1; }
.landing-root .is-focus .l-ws-pline { animation: l-ws-line 3800ms ease both; animation-delay: calc(500ms + var(--i) * 700ms); }
@keyframes l-ws-line { 0% { opacity: 0.38; } 8%, 30% { opacity: 1; } 42%, 100% { opacity: 0.38; } }
.landing-root .l-ws-wave { display: flex; align-items: center; gap: 3px; height: 28px; flex: none; }
.landing-root .l-ws-wave span { flex: 1; height: 30%; border-radius: 2px; background: var(--brand-from); opacity: 0.55; }
.landing-root .is-focus .l-ws-wave span { animation: l-ws-wave 900ms ease-in-out infinite alternate; animation-delay: calc(var(--i) * -63ms); }
@keyframes l-ws-wave { from { height: 18%; } to { height: 100%; } }

/* Judge */
.landing-root .l-ws--judge { flex-direction: row; gap: 14px; align-items: center; }
.landing-root .l-ws-qstack { position: relative; flex: 1.5; height: 150px; }
.landing-root .l-ws-qcard { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--card); box-shadow: 0 4px 14px -6px rgb(10 10 10 / 0.12); }
.landing-root .l-ws-qcard--back { background: var(--surface); transform: none; transition: transform 0s linear 800ms; }
.landing-root .is-focus .l-ws-qcard--back { transform: translate(10px, 8px) rotate(2deg); transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1) 400ms; }
.landing-root .l-ws-q { margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: 17px; line-height: 1.15; }
.landing-root .l-ws-ready { align-self: flex-start; opacity: 0; transform: scale(0.7); transition: opacity 0s linear 800ms, transform 0s linear 800ms; }
.landing-root .is-focus .l-ws-ready { opacity: 1; transform: none; transition: opacity 240ms ease 1100ms, transform 240ms cubic-bezier(0.22, 1, 0.36, 1) 1100ms; }
.landing-root .l-ws-side { flex: 1; display: flex; flex-direction: column; gap: 6px; }

/* Readiness */
.landing-root .l-ws--readiness { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 8px; align-items: center; justify-items: center; }
.landing-root .l-ws-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; font-size: 9px; color: var(--l-ink-2-strong); }
.landing-root .l-ws-ring svg { overflow: visible; }
.landing-root .l-ws-ring__track { fill: none; stroke: var(--shell); stroke-width: 3.5; }
.landing-root .l-ws-ring__value { fill: none; stroke: var(--success-fg); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 100.5; stroke-dashoffset: 100.5; transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0s linear 800ms; }
.landing-root .l-ws-ring--warn .l-ws-ring__value { stroke: var(--warn-fg); }
.landing-root .is-focus .l-ws-ring__value { stroke-dashoffset: calc(100.5 * (1 - var(--p) / 100)); transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) calc(400ms + var(--i) * 100ms); }
.landing-root .l-ws-ring__num { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 9px; fill: var(--ink); }

/* Launch */
.landing-root .l-ws--launch { align-items: center; justify-content: center; gap: 10px; }
.landing-root .l-ws-bigclock { font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 44px; font-weight: 500; letter-spacing: -0.03em; line-height: 1; }
.landing-root .is-focus .l-ws-bigclock { animation: l-ws-colon 1000ms steps(1) infinite; }
@keyframes l-ws-colon { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.55; } }
.landing-root .is-focus .l-ws-press { animation: l-ws-press 260ms ease 1500ms both; }
@keyframes l-ws-press { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.94); } }

/* Fillers */
.landing-root .l-ws--docs .l-ws-row { background: transparent; padding: 0; height: 15px; }
.landing-root .l-ws-docicon { width: 9px; height: 11px; border-radius: 2px; border: 1px solid var(--border-strong); flex: none; }
.landing-root .l-ws--clock { align-items: center; justify-content: center; gap: 14px; }
.landing-root .l-ws-rail { display: flex; gap: 14px; }
.landing-root .l-ws-rail i { width: 7px; height: 7px; border-radius: 50%; background: var(--border-strong); }
.landing-root .l-ws-rail i:first-child { background: var(--ink); }
.landing-root .l-ws--playbooks { flex-direction: row; gap: 10px; align-items: stretch; }
.landing-root .l-ws-minicard { flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--card); }
.landing-root .l-ws-minicard strong { font-size: 11px; font-weight: 600; }
.landing-root .l-ws--summary { flex-direction: row; gap: 18px; align-items: stretch; }
.landing-root .l-ws--summary > div { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.landing-root .l-ws--tools { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-content: center; }
.landing-root .l-ws-toolcell { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.landing-root .l-ws-toolcell i { width: 100%; aspect-ratio: 1.4; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); }

/* The ghost cursor */
.landing-root .l-wall-cursor { position: absolute; z-index: 3; opacity: 0; pointer-events: none; filter: drop-shadow(0 1px 1.5px rgb(10 10 10 / 0.35)); }
.landing-root .l-wall-cursor__shape { fill: var(--ink); stroke: var(--card); stroke-width: 1.2; stroke-linejoin: round; }
.landing-root .is-focus .l-wall-cursor { animation: l-wall-cursor 1700ms cubic-bezier(0.22, 1, 0.36, 1) var(--cd, 300ms) both; }
@keyframes l-wall-cursor {
  0%   { opacity: 0; transform: translate(0, 0) scale(1); }
  14%  { opacity: 1; }
  66%  { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(1); }
  76%  { transform: translate(var(--dx), var(--dy)) scale(0.84); }
  88%  { transform: translate(var(--dx), var(--dy)) scale(1); }
  100% { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(1); }
}

/* reduced motion: no loops, no cursor, no delays; focused frames show final states */
@media (prefers-reduced-motion: reduce) {
  .landing-root .l-wall-frame,
  .landing-root .l-wall-frame *,
  .landing-root .l-wall-frame::after { transition: none !important; animation: none !important; transition-delay: 0s !important; }
  .landing-root .l-wall-cursor { display: none; }
  .landing-root .l-wall-frame.is-focus .l-ws-wave span { height: 70%; }
}
```

The fill-in details the CSS expects (add them to the screens while writing them): the docs filler rows use `<span className="l-ws-docicon" />` plus `<span className="l-ws-skel" style={{ width: '72%' }} />`; the readiness SVG uses `<circle className="l-ws-ring__track" cx="20" cy="20" r="16" />`, `<circle className="l-ws-ring__value" cx="20" cy="20" r="16" pathLength="100.5" style={{ ['--p' as string]: percent, ['--i' as string]: index }} />` and a centred `<text className="l-ws-ring__num" x="20" y="23" textAnchor="middle">{percent}%</text>`; the 74 ring wrapper also gets class `l-ws-ring--warn`.

---

## Rules

- Do NOT render the wall anywhere yet. Do not touch `hero.tsx`, `landing-page.tsx` or any hook.
- Do not retype REUSE strings; import them. If a data file does not expose a value you need, export it from that data file (adding an export is allowed; changing existing values is not).
- No images, no emojis, no new dependencies.
- Keep every screen under about 70 lines of TSX.

## When you are done

Reply with a short summary only: files created, any data file you added an export to, and every value you had to guess.
