# PROMPT 3 of 5 · v2 hero wall, part B: the camera and the hero

**Context.** Prompt 2 created the wall’s frame, the 14 screens, `data/hero-wall.ts` and the CSS for screens. Nothing renders them yet. This prompt builds the **camera** (a slow pan that lights one screen at a time, with a tiny "dolly" so it feels filmed, not scrolled), the **hero integration** (the wall sits behind the centred hero text, faded so the text stays perfectly legible), and the **first-screen polish** so the hero demo card starts showing on a short laptop screen.

The hero’s centred layout, copy, eyebrow, buttons and interactive demo stay exactly as they are. The wall is an addition behind them.

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

1. `sections/hero.tsx`, `data/hero-copy.ts`, `components/hero-demo-player.tsx`, `hooks/use-hero-demo.ts` (so the wall never interferes with the demo’s autoplay or takeover).
2. `styles/landing.css`: find every rule for `.l-hero*`, the hero container, the hero background, the hero H1 and lead sizes, and the hero demo card’s top margin. Note the exact colour variable the hero background uses.
3. `components/rise.tsx`, `components/container.tsx`.
4. `hooks/use-in-view-once.ts` (style reference for observers).
5. Everything created in prompt 2: `components/hero-wall/*`, `data/hero-wall.ts`.
6. `components/nav.tsx` and the nav CSS (to know the nav’s height and z-index; the wall must sit under it).

---

## 1. How the wall looks and behaves (the spec)

| Item | Decision |
|---|---|
| Where | A layer behind the hero text, from the top of the hero down to about 880px, fading out at the bottom so it never touches the hero demo card. |
| Breakpoint | Desktop only: width 1024px and up. Below that the wall is not rendered at all (a dedicated mobile moment comes later; do not add any fallback now). |
| Camera | One big canvas (6 columns by 5 rows of frames). A "slot" is a fixed point in the layer at 79% of its width and 47% of its height. The camera moves the canvas so the frame being visited sits centred on the slot. |
| Visit order | `WALL_SEQUENCE` from `data/hero-wall.ts` (brief, team, idea, plan, ledger, rehearsal, judge, readiness, launch, then the loop restarts). |
| Rhythm | Each visit: 1150 ms pan, 3600 ms dwell. One full loop is about 43 seconds. |
| Dolly | During each pan the whole layer eases to 95% scale and back (scale in 420 ms, held, out 620 ms after 560 ms), anchored on the slot. It reads as a camera pulling back to travel, then settling. |
| Focus | The frame being left loses `is-focus` when the pan starts (it washes out over 700 ms). The destination gains `is-focus` 250 ms before the pan ends, so it lights up as it lands. |
| Veil | A soft radial veil in the hero background colour sits between the wall and the text so the headline, lead and buttons are never fighting a screen. |
| Caption | A small mono caption near the bottom right of the wall: "Illustrative screens · fictional room". |
| Pausing | The loop stops when the hero is off screen, when the tab is hidden, and when the viewport drops below 1024px. It resumes when the hero is back. |
| Reduced motion | No loop, no pan, no dolly. The wall renders statically with the first frame (`brief`) in focus and its micro-states at their final values. |
| Accessibility | The whole wall is `aria-hidden="true"`, `inert`, `pointer-events: none`, and has no focusable children. |
| First paint | The wall fades in (900 ms) about 600 ms after mount, and the first frame lights 700 ms after that, so the headline always arrives first. |

---

## 2. The hook: `hooks/use-hero-wall.ts` (create with exactly this code)

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { WALL_SEQUENCE } from '../data/hero-wall';

/** Where the lit frame is parked, as a fraction of the wall layer. */
const SLOT_X = 0.79;
const SLOT_Y = 0.47;

const PAN_MS = 1150;
const DWELL_MS = 3600;
const FADE_IN_AT_MS = 600;
const FIRST_LIGHT_AT_MS = 1300;
const FOCUS_BEFORE_END_MS = 250;
const DOLLY_OUT_AT_MS = 560;

type Offset = { x: number; y: number };

export type HeroWallState = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  registerFrame: (key: string) => (el: HTMLDivElement | null) => void;
  offset: Offset;
  ready: boolean;
  instant: boolean;
  dolly: boolean;
  focusKey: string | null;
};

/**
 * Drives the hero wall camera.
 * @param enabled  false below 1024px (the component is not even rendered then)
 * @param reduced  true when the visitor prefers reduced motion
 */
export function useHeroWall(enabled: boolean, reduced: boolean): HeroWallState {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const frames = useRef(new Map<string, HTMLDivElement>());
  const camKey = useRef<string>(WALL_SEQUENCE[0]);
  const readyRef = useRef(false);

  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [instant, setInstant] = useState(true);
  const [dolly, setDolly] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );

  const registerFrame = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) frames.current.set(key, el);
      else frames.current.delete(key);
    },
    [],
  );

  /** Offset that puts the frame centre on the slot. Uses layout coordinates, so transforms do not matter. */
  const measure = useCallback((key: string): Offset | null => {
    const vp = viewportRef.current;
    const el = frames.current.get(key);
    if (!vp || !el) return null;
    return {
      x: Math.round(vp.clientWidth * SLOT_X - (el.offsetLeft + el.offsetWidth / 2)),
      y: Math.round(vp.clientHeight * SLOT_Y - (el.offsetTop + el.offsetHeight / 2)),
    };
  }, []);

  /** Is the wall layer on screen? */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!enabled || !vp) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(vp);
    return () => io.disconnect();
  }, [enabled]);

  /** Is the tab visible? */
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  /** Park the camera on the current frame without animating, and re-park whenever the layer is resized. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!enabled || !vp) return;
    const park = () => {
      const o = measure(camKey.current);
      if (!o) return;
      setInstant(true);
      setOffset(o);
    };
    park();
    const ro = new ResizeObserver(park);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [enabled, measure]);

  /** Reduced motion: static wall, first frame lit, nothing moves. */
  useEffect(() => {
    if (!enabled || !reduced) return;
    setReady(true);
    setFocusKey(WALL_SEQUENCE[0]);
  }, [enabled, reduced]);

  /** The loop. It runs only while the wall is on screen and the tab is visible. */
  useEffect(() => {
    if (!enabled || reduced || !inView || !tabVisible) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const visit = () => {
      const i = WALL_SEQUENCE.indexOf(camKey.current);
      const next = WALL_SEQUENCE[(i + 1) % WALL_SEQUENCE.length];
      const target = measure(next);
      if (!target) return;
      camKey.current = next;
      setFocusKey(null);
      setDolly(true);
      setInstant(false);
      setOffset(target);
      later(() => setDolly(false), DOLLY_OUT_AT_MS);
      later(() => setFocusKey(next), PAN_MS - FOCUS_BEFORE_END_MS);
      later(visit, PAN_MS + DWELL_MS);
    };

    if (!readyRef.current) {
      // first paint: fade the wall in, light the first frame, then start travelling
      later(() => {
        readyRef.current = true;
        setReady(true);
      }, FADE_IN_AT_MS);
      later(() => setFocusKey(WALL_SEQUENCE[0]), FIRST_LIGHT_AT_MS);
      later(visit, FIRST_LIGHT_AT_MS + DWELL_MS);
    } else {
      // resuming after a pause: settle, keep a lit frame, travel after one dwell
      setDolly(false);
      setFocusKey((prev) => prev ?? camKey.current);
      later(visit, DWELL_MS);
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [enabled, reduced, inView, tabVisible, measure]);

  return { viewportRef, registerFrame, offset, ready, instant, dolly, focusKey };
}
```

Notes for the agent:
- Use this code exactly. The loop effect deliberately does NOT depend on `ready` (a `ready` dependency would restart the loop when it flips).
- The observable timeline must be: wall fades in at 600 ms, first frame lights at 1300 ms, first pan starts at 4900 ms, then a pan every 4750 ms, pausing when the wall leaves the screen or the tab is hidden and resuming with one full dwell.
- If strict-mode typing complains about `React.RefObject`, import `type RefObject` from `react` and use it.

---

## 3. The component: `components/hero-wall/hero-wall.tsx`

```tsx
import { useEffect, useState } from 'react';
import { WALL_CAPTION, WALL_FRAMES } from '../../data/hero-wall';
import { useHeroWall } from '../../hooks/use-hero-wall';
import { WallFrame } from './wall-frame';
import { WALL_SCREENS } from './wall-screens';

function useMatch(query: string): boolean {
  const [match, setMatch] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
}

function HeroWallInner({ reduced }: { reduced: boolean }) {
  const wall = useHeroWall(true, reduced);
  return (
    <>
      <div
        className={`l-hero__wall${wall.ready ? ' is-ready' : ''}`}
        aria-hidden="true"
        // @ts-expect-error inert is valid HTML but missing from some React typings
        inert=""
        ref={wall.viewportRef}
      >
        <div className={`l-wall-dolly${wall.dolly ? ' is-dolly' : ''}`}>
          <div
            className={`l-wall-cam${wall.instant ? ' is-instant' : ''}`}
            style={{ transform: `translate3d(${wall.offset.x}px, ${wall.offset.y}px, 0)` }}
          >
            <div className="l-wall-grid">
              {WALL_FRAMES.map((def) => {
                const Screen = WALL_SCREENS[def.screen];
                return (
                  <WallFrame
                    key={def.key}
                    def={def}
                    focused={wall.focusKey === def.key}
                    frameRef={wall.registerFrame(def.key)}
                  >
                    <Screen />
                  </WallFrame>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="l-hero__veil" aria-hidden="true" />
      <p className="l-hero__wallcap" aria-hidden="true">{WALL_CAPTION}</p>
    </>
  );
}

export function HeroWall() {
  const wide = useMatch('(min-width: 1024px)');
  const reduced = useMatch('(prefers-reduced-motion: reduce)');
  if (!wide) return null;
  return <HeroWallInner reduced={reduced} />;
}
```

If the TypeScript project rejects the `@ts-expect-error` line (because `inert` is typed after all), delete that comment line and keep `inert=""`. If React 19 complains about the empty string, use `inert` as a boolean attribute (`inert`), whichever compiles under strict mode without `any`.

---

## 4. Hero integration

In `sections/hero.tsx`:

1. Import `HeroWall` and render `<HeroWall />` as the FIRST child inside the hero’s outermost element (before the container with the eyebrow, H1, lead, buttons and demo).
2. Make sure the hero’s outermost element has the class `l-hero` (add it if the existing class differs; keep the old class too).
3. Give the hero’s content container `position: relative; z-index: 2` (see CSS) so it always sits above the wall and the veil.
4. Do not change any copy, the eyebrow, the buttons, the demo or its player.
5. The wall must NOT start before the hero text has arrived. The text uses the existing `Rise` component; the wall’s own 600 ms start delay in the hook covers this. Do not change `Rise` timings.

---

## 5. CSS to append

Append under this header at the very end of `styles/landing.css`:

```css
/* ========== v2 · prompt 3 · hero wall camera and hero ========== */
```

```css
.landing-root .l-hero { position: relative; isolation: isolate; }

/* the content sits above the wall and the veil */
.landing-root .l-hero > .l-container,
.landing-root .l-hero > .l-hero__inner { position: relative; z-index: 2; }

.landing-root .l-hero__wall {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(100%, 880px);
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  opacity: 0;
  transition: opacity 900ms cubic-bezier(0.22, 1, 0.36, 1);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 8%, #000 58%, transparent 96%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 8%, #000 58%, transparent 96%);
}
.landing-root .l-hero__wall.is-ready { opacity: 1; }

/* veil in the hero background colour: keeps the centred text clean */
.landing-root .l-hero__veil {
  position: absolute;
  inset: 0 0 auto 0;
  height: min(100%, 880px);
  z-index: 1;
  pointer-events: none;
  /* IMPORTANT: replace var(--shell) below with the exact variable the hero background uses */
  background:
    radial-gradient(ellipse 30% 56% at 50% 40%, var(--shell) 54%, transparent 100%),
    linear-gradient(to right, var(--shell) 0, transparent 7%, transparent 100%);
}

.landing-root .l-wall-dolly {
  position: absolute;
  inset: 0;
  transform-origin: 79% 47%;
  transform: scale(1);
  transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-wall-dolly.is-dolly {
  transform: scale(0.95);
  transition: transform 420ms cubic-bezier(0.45, 0, 0.2, 1);
}

.landing-root .l-wall-cam {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
  transition: transform 1150ms cubic-bezier(0.65, 0, 0.2, 1);
}
.landing-root .l-wall-cam.is-instant { transition: none; }

.landing-root .l-wall-grid {
  position: relative;               /* the frames measure their offsets against this element */
  display: grid;
  grid-template-columns: repeat(6, calc(var(--l-wall-w) + 20px));
  grid-auto-rows: calc(var(--l-wall-w) * 0.625 + 50px);
  gap: var(--l-wall-gap);
  width: max-content;
}

.landing-root .l-hero__wallcap {
  position: absolute;
  z-index: 2;
  right: clamp(16px, 3vw, 40px);
  top: calc(min(100%, 880px) - 108px);
  margin: 0;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--l-ink-2-strong);
  pointer-events: none;
}

@media (max-width: 1023px) {
  .landing-root .l-hero__wall,
  .landing-root .l-hero__veil,
  .landing-root .l-hero__wallcap { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-root .l-hero__wall { transition: none; opacity: 1; }
  .landing-root .l-wall-dolly,
  .landing-root .l-wall-cam { transition: none; }
}
```

Important details:
- `.l-wall-frame` has `position: relative` already (prompt 2), and the grid is `position: relative`, so `offsetLeft` and `offsetTop` of a frame are measured against the grid. Do not put a transform on the grid.
- If the hero background is not a flat variable (for example a gradient), replace the veil colours with the hero’s own resting colour at the centre-top of the hero, and tell me in the summary.

---

## 6. First-screen polish (hero layout)

**Goal.** At a 1536 by 872 viewport with the page at the top, the top edge of the hero demo card must sit at **560px or less** from the top of the viewport, so at least a quarter of the card is visible without scrolling. Today it starts at about 640px.

Do this by reducing vertical spacing, NOT by shrinking the headline or changing copy:

1. In the hero CSS, set the hero’s top padding to `clamp(92px, 12vh, 124px)` (it must still clear the floating nav).
2. Tighten the gaps between hero elements to these values: eyebrow to H1 `20px`, H1 to lead `16px`, lead to buttons `26px`, buttons to the "Free to start…" note `12px`, note to the demo card `clamp(28px, 4.5vh, 48px)`.
3. If the H1 is currently larger than `clamp(44px, 6.2vw, 92px)`, cap it at that value.
4. If after these changes the card top is still above 560px at 1536 by 872, reduce the lead-to-buttons and note-to-card gaps further (never below 20px and 24px) until it is. Report the final numbers in the summary.
5. Below 1024px, change nothing.

---

## Rules

- Do not alter the hero demo, its player, its copy or its autoplay trigger.
- Do not alter `Rise`. Do not add dependencies.
- The wall must never receive focus, hover or clicks, and must never be announced by screen readers.
- Do not render the wall in any section other than the hero.

## When you are done

Reply with a short summary only: files created, files changed, the exact hero background variable you used for the veil, the final hero spacing values, and any value you had to guess.
