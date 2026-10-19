# PROMPT 4 of 5 · v2 the pivot becomes a moment, and the stage gets bigger

**Context.** Two weak spots in version 1, both in the middle of the story:

1. **The pivot** ("Same 36 hours. Different order.") is a nearly empty screen with a small `[ scroll ]` cue; about 4 seconds of scrolling pass over blank space. It is the turn of the whole page (the clock ran out in the rail, now it starts again), so it should be a short, silent, physical moment.
2. **The stage act** (the dark pinned section) uses only about half the screen width, the Judge’s Chair scene is sparse, and the scene text is small for a showpiece.

This prompt rebuilds the pivot as a scroll-driven **clock rewind** and enlarges and enriches the stage act. It does NOT touch the problem rail, How it works, or the stamp logic (done in prompt 1).

**Effect-budget note.** The page has three showpiece moments (hero, rail, stage). The pivot rebuild is not a fourth: it replaces dead space and uses only two cheap transforms (a rewinding number and two sliding brackets). No new decoration, no glow, no particles.

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

1. `sections/pivot.tsx`, `data/pivot-copy.ts`, `hooks/use-pivot-hud.ts`, `hooks/use-hud.tsx` (understand `HUD_ORDER`, how a section reports a time, how the violet pulse is fired, and how the pivot hands over to How it works).
2. `lib/clock.ts` (the exact signature of `formatClock`; it must be used for every clock string).
3. `sections/problem-rail.tsx` (only its last stop and the "None of this is a coding problem…" line, to match the red tone).
4. `components/italic-heading.tsx`, `components/bracket.tsx`.
5. `sections/stage-act.tsx`, `components/stage-shell.tsx`, `components/stage-frame.tsx`, `components/scenes/*` (all four scenes), `data/stage-act.ts`, `hooks/use-stage-progress.ts`.
6. `styles/landing.css`: all rules for `.l-pivot*`, `.l-stage*`, `.l-scene*` and the scene classes.

---

## PART A · The pivot: a clock that rewinds

### A1. The idea

The rail ends at `T–00:00:00`, red. The visitor scrolls into the pivot and the SAME clock is there, huge, still red and still at zero. As they scroll it **rewinds**: the digits run up to `T–36:00:00` while the colour turns from red to ink. Then the heading arrives, and two tall brackets slide in from the screen edges and settle either side of it ("marked and confirmed"), the violet pulse fires once, and the sub line appears. The nav clock pill follows the big clock the whole way, so the page itself rewinds.

### A2. Layout

```
        (sticky, one full screen tall, content centred)

                  T–00:00:00  →  T–36:00:00        <- huge mono clock
                  
   [              Same 36 hours.                 ]  <- brackets slide in from the edges
   [              Different order.               ]
                  Read the rubric. Pick one idea.
                  Ship a demo that works.
                                                    [ scroll ]  (only at the very start)
```

Copy: reuse `data/pivot-copy.ts` exactly (heading "Same 36 hours. *Different order.*", sub "Read the rubric. Pick one idea. Ship a demo that works.", and the scroll cue). Do not change a word.

### A3. Structure

`sections/pivot.tsx` renders:

```tsx
<section ref={sectionRef} className="l-pivot" data-tone="red" aria-labelledby="pivot-heading">
  <div className="l-pivot__sticky">
    <span className="l-pivot__bracket l-pivot__bracket--l" aria-hidden="true" />
    <span className="l-pivot__bracket l-pivot__bracket--r" aria-hidden="true" />
    <div className="l-pivot__stack">
      <p className="l-pivot__clock" aria-hidden="true"><span ref={clockRef}>{formatClock(0)}</span></p>
      <h2 id="pivot-heading" className="l-pivot__heading">{/* existing ItalicHeading with the existing copy */}</h2>
      <p className="l-pivot__sub">{sub}</p>
    </div>
    <p className="l-pivot__cue" aria-hidden="true">{scrollCue}</p>
  </div>
</section>
```

The visible clock is `aria-hidden` (it is decoration; the nav pill already exposes the time). The `h2` stays the real heading for screen readers, and must be present in the DOM at all times (its opacity is animated, but it is never `display: none`).

### A4. The progress mapping

Let `p` be the section’s scroll progress from 0 to 1: `p = clamp((-rect.top) / (rect.height - window.innerHeight), 0, 1)` where `rect` is the section’s bounding rect. Compute it in a passive scroll listener plus `requestAnimationFrame` (same pattern as `use-rail-progress.ts`); attach it only while the section is within one screen of the viewport (an `IntersectionObserver` with `rootMargin: '100% 0px'` toggles the listener).

| p range | What happens |
|---|---|
| 0.00 – 0.12 | Hold. Clock reads `T–00:00:00`, red. Heading invisible. The `[ scroll ]` cue is visible (opacity `1 - p / 0.1`, clamped). |
| 0.12 – 0.72 | The rewind. `seconds = round(36 * 3600 * easeInOutCubic((p - 0.12) / 0.60))`. The clock text is `formatClock(seconds)`. |
| 0.30 | Tone switches from red to ink (`data-tone` changes; the colour transitions in 360 ms). |
| 0.30 – 0.60 | Heading fades in and rises: `--l-pv-h` goes 0 to 1 (linear in this range). |
| 0.50 – 0.85 | Brackets slide in: `--l-pv-b = easeInOutCubic((p - 0.50) / 0.35)`, clamped. |
| 0.85 | Crossing this value going DOWN fires the existing violet pulse ONCE (reuse the exact function the old pivot used). Crossing it going UP resets the one-shot so it can fire again. |
| 0.85 – 0.97 | Sub line fades in: `--l-pv-s = clamp((p - 0.85) / 0.12)`. |
| 0.97 – 1.00 | Hold. Everything final. |

`easeInOutCubic(t) = t < 0.5 ? 4t³ : 1 - (-2t + 2)³ / 2`.

Implementation rules:
- Update the clock by writing `clockRef.current.textContent` directly, and only when the displayed string changes. Do NOT put the seconds in React state.
- Write `--l-pv-h`, `--l-pv-b`, `--l-pv-s` with `section.style.setProperty` and only when a value changed by more than 0.002.
- Set `section.dataset.tone` to `'red'` when `p < 0.30` and `'ink'` otherwise.
- Report the same `seconds` value to the HUD (nav pill and mobile pill) using the same call the old pivot used, throttled to at most once every 80 ms and always on the last change. At `p = 0` the HUD value is `0` (it continues the rail’s `T–00:00:00`) and at the end it is `36 * 3600`, which hands over seamlessly to How it works (which starts at `T–36:00:00`). Keep `HUD_ORDER` unchanged.
- Remove the old "reset the HUD with a violet pulse" immediate jump if the rewind replaces it, but keep the pulse itself (fired once at 0.85).
- Reduced motion, and any case where `matchMedia('(prefers-reduced-motion: reduce)')` is true: render the FINAL state with no sticky runway (`.l-pivot` height auto, vertical padding `var(--l-section-y)` from prompt 1), clock text `formatClock(36 * 3600)`, tone ink, heading, brackets and sub fully visible, no cue, and report `36 * 3600` to the HUD when the section is in view.

### A5. CSS to append (new block, header at the end of Part B’s CSS section)

```css
/* Pivot */
.landing-root .l-pivot {
  --l-pv-h: 0;
  --l-pv-b: 0;
  --l-pv-s: 0;
  position: relative;
  height: 250svh;
}
.landing-root .l-pivot__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.landing-root .l-pivot__stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(18px, 3.2vh, 36px);
  padding-inline: 24px;
  text-align: center;
}
.landing-root .l-pivot__clock {
  margin: 0;
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: clamp(60px, 13.5vw, 200px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  transition: color 360ms cubic-bezier(0.22, 1, 0.36, 1);
}
.landing-root .l-pivot[data-tone='red'] .l-pivot__clock { color: var(--l-danger-text); }

.landing-root .l-pivot__heading {
  opacity: var(--l-pv-h);
  transform: translateY(calc((1 - var(--l-pv-h)) * 18px));
}
.landing-root .l-pivot__sub {
  margin: 0;
  max-width: 44ch;
  color: var(--l-ink-2-strong);
  opacity: var(--l-pv-s);
}
.landing-root .l-pivot__cue {
  position: absolute;
  bottom: 28px;
  left: 50%;
  margin: 0;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono Variable', ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--l-ink-2-strong);
  opacity: calc(1 - var(--l-pv-h) * 4);
}

/* the two brackets: drawn with borders, slide in from the screen edges to flank the stack */
.landing-root .l-pivot__bracket {
  position: absolute;
  top: 50%;
  width: clamp(26px, 3.2vw, 48px);
  height: clamp(220px, 38vh, 380px);
  color: var(--ink);
  opacity: calc(0.12 + var(--l-pv-b) * 0.88);
  pointer-events: none;
  border: 0 solid currentColor;
  border-width: 3px 0 3px 3px;
  border-radius: 3px 0 0 3px;
  left: 50%;
  transform: translate(
    calc((-50vw + 24px) * (1 - var(--l-pv-b)) + (-1 * min(38vw, 600px)) * var(--l-pv-b)),
    -50%
  );
}
.landing-root .l-pivot__bracket--r {
  border-width: 3px 3px 3px 0;
  border-radius: 0 3px 3px 0;
  transform: translate(
    calc((50vw - 24px) * (1 - var(--l-pv-b)) + min(38vw, 600px) * var(--l-pv-b)),
    -50%
  );
}

@media (prefers-reduced-motion: reduce) {
  .landing-root .l-pivot { height: auto; padding-block: var(--l-section-y); --l-pv-h: 1; --l-pv-b: 1; --l-pv-s: 1; }
  .landing-root .l-pivot__sticky { position: static; height: auto; }
  .landing-root .l-pivot__cue { display: none; }
  .landing-root .l-pivot__clock { transition: none; }
}
```

The bracket x-offset is relative to the centre of the screen (`left: 50%`), which is why the transforms use `calc(...)` on the translate.

---

## PART B · The stage act: bigger, richer, readable

### B1. Frame size

Find the rule that sizes the pinned stage frame (`.l-stage__frame` or the equivalent in `stage-frame.tsx` / `stage-shell.tsx`). Set, for desktop (min-width 1024px):

```css
.landing-root .l-stage__frame {
  width: min(1120px, 88vw);
  height: min(640px, 70svh);
}
@media (max-height: 760px) and (min-width: 1024px) {
  .landing-root .l-stage__frame { height: 68svh; }
}
```

Use the real selector. Keep the existing border radius, glow and cross-fade grid cell. The four scenes must still stack in one grid cell and fill the frame (`min-height: 0`, `overflow: hidden`). Phone, tablet and reduced-motion layouts do not change.

### B2. Minimum sizes inside the scenes (desktop only)

Raise the sizes in the scene CSS until each of these minimums holds. Use `clamp()` so they scale with the frame, and never lower an existing larger value:

| Element | Minimum at 1536px wide |
|---|---|
| Scene title label (for example "Pitch rehearsal") | 13px, mono or Inter as it is now |
| Teleprompter lines | 26px, Instrument Serif, active line full ink or full cream as now |
| Judge’s question | 32px, Instrument Serif |
| Readiness rings | 104px diameter, label 14px, percent 20px |
| Launch Pad clock | `clamp(72px, 9vw, 132px)` |
| Launch Pad lead and button | 16px lead, button height 48px |
| All mono captions on the stage | 12px |

### B3. The Judge’s Chair scene, enriched

Currently one question card and two ledger chips in a large empty frame. Rebuild the scene to this layout (two columns, `grid-template-columns: 1.45fr 1fr`, gap `clamp(24px, 3vw, 48px)`, padding `clamp(28px, 4vw, 56px)`):

**Left column**
- The existing stacked question card (keep the existing stack and its fan animation).
- Under the card, one row: a 44px timer ring on the left with the label `00:30 to answer` (mono 12px) next to it, and the existing `Answer ready` chip on the right.
- The timer ring is an SVG circle (r 18, stroke 3, round caps). Its dash offset follows the scene’s local progress: if the scene already receives a progress value (0 to 1), set `style={{ ['--l-scene-p' as string]: progress }}` on the scene root and use `stroke-dashoffset: calc(113 * (1 - var(--l-scene-p)))` with `stroke-dasharray: 113`. If the scene has no progress value, animate it with a 5 s linear CSS keyframe that starts when the scene becomes active (use the same "active" class the scene already has).

**Right column**
- Mono label `Your ledger says` (12px, cream at 0.62).
- Three ledger rows, each a row with the component name left and a status chip right: reuse the two existing chips (Receipt scanner Mocked, Export to Sheets Mocked) and ADD `Budget dashboard` with status `Built` first (it is the first component in `data/ledger-demo.ts`; import its name and status, do not retype).
- Mono label `Next questions` (12px, cream at 0.62), then three lines in Inter 15px at cream 0.7 with a thin top border each:

```
Who is this for, and how do you know?
What happens when a receipt is blurry?
What would you build with another week?
```

Add these strings to `data/stage-act.ts` as `judge.nextQuestions` (an array of three strings), `judge.timerLabel` (`'00:30 to answer'`), `judge.ledgerLabel` (`'Your ledger says'`) and `judge.nextLabel` (`'Next questions'`), and read them from there.

Chip colours on the dark stage: Built uses a mint tint (the existing `--stage-mint` at 0.16 alpha background and `--stage-mint` text), Mocked uses `--stage-sun` at 0.16 alpha with `--stage-sun` text. If the existing chips already do this, reuse their classes.

CSS for the new parts (append):

```css
.landing-root .l-judge { display: grid; grid-template-columns: 1.45fr 1fr; gap: clamp(24px, 3vw, 48px); padding: clamp(28px, 4vw, 56px); align-items: center; height: 100%; }
.landing-root .l-judge__left { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.landing-root .l-judge__meta { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.landing-root .l-judge__timer { display: inline-flex; align-items: center; gap: 12px; font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 12px; letter-spacing: 0.02em; color: rgb(255 255 255 / 0.7); }
.landing-root .l-judge__ring { width: 44px; height: 44px; transform: rotate(-90deg); }
.landing-root .l-judge__ring circle { fill: none; stroke-width: 3; stroke-linecap: round; }
.landing-root .l-judge__ring .track { stroke: rgb(255 255 255 / 0.14); }
.landing-root .l-judge__ring .value { stroke: var(--stage-sun); stroke-dasharray: 113; stroke-dashoffset: calc(113 * (1 - var(--l-scene-p, 0))); }
.landing-root .l-judge__right { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.landing-root .l-judge__label { margin: 0; font-family: 'JetBrains Mono Variable', ui-monospace, monospace; font-size: 12px; letter-spacing: 0.04em; color: rgb(255 255 255 / 0.62); }
.landing-root .l-judge__rows { display: flex; flex-direction: column; gap: 8px; }
.landing-root .l-judge__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 12px; background: var(--stage-dark-card); border: 1px solid rgb(255 255 255 / 0.08); font-size: 15px; color: rgb(255 255 255 / 0.9); }
.landing-root .l-judge__next { display: flex; flex-direction: column; margin-top: 8px; }
.landing-root .l-judge__next p { margin: 0; padding: 12px 0; border-top: 1px solid rgb(255 255 255 / 0.1); font-size: 15px; color: rgb(255 255 255 / 0.7); }
@media (max-width: 1023px) { .landing-root .l-judge { grid-template-columns: 1fr; height: auto; } }
```

If `--l-cream` variables exist, use them in place of the `rgb(255 255 255 / x)` literals (match the nearest alpha).

### B4. Readiness scene fill

The six rings should fill the frame: arrange them as a 3 by 2 grid with `gap: clamp(28px, 4vw, 56px)` centred, and keep the existing amber callout line ("Fallback insurance: add a 60-second backup video…") beneath, with 14px text. Keep all values and labels.

---

## Rules

- Do not change any copy except the new Judge strings listed in B3.
- Do not touch `HUD_ORDER`, `use-stage-progress.ts` timings (prompt 1 already extended the runway), the stamp, or the problem rail.
- No dependencies, no images, no emojis.

## When you are done

Reply with a short summary only: files created, files changed, the exact selector you used for the stage frame, the exact function you reused for the violet pulse, and any value you had to guess.
