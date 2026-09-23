# animations.md: Motion Specification

**Status:** Step 5 of the project (motion design). Follows `problem.md`, `ideation.md`, `tech_stack.md`, `design.md`.
**Written:** 20 Sep 2026
**Scope:** What moves, when, how it feels, and how fast, for every interaction. **No application code.** Values are given as tokens and tables so any developer or agent can implement them. Static appearance (colors, layout, states) stays in `design.md`; this file only adds motion on top of it.

**IDs used:** Screens `S01-S32`, components `C01-C40` (from `design.md`), motion moments `M01-M15`, motion tokens `t-*`, `ease-*`, `spring-*`.

---

## 0. What this document is, and one honest note

You asked for animation at the level of Apple iOS and macOS, the kind that makes a user say "wow". Three things I learned from the research change how this file is built:

1. **Apple's "wow" is not spectacle. It is physics, continuity, and restraint.** Apple's own guidance says to add motion purposefully, use it to communicate, and never add it just for its own sake. What people feel as "crazy smooth" comes from springs that carry velocity, elements that move from where they were (not appear from nowhere), and motion that follows your finger exactly. So this file spends its effort on those, and on a small number of carefully designed signature moments, instead of animating everything.
2. **The web cannot fully match native.** No haptic engine on iOS Safari, no system-level gesture integration, and mid-range Android phones (likely for many student users) have a tight frame budget. This file marks what is possible, what degrades, and what is progressive enhancement.
3. **This product is used under time pressure** (`problem.md`: L10, P3.9). A hackathon team at 3 AM does not want to watch a card fly. So the rule is **quiet by default, extraordinary at moments**. Frequent actions are fast and nearly silent; rare milestone moments (idea locked, plan validated, submitted) get the choreography.

---

## 1. Motion principles

| # | Principle | What it means here | Source basis |
|---|---|---|---|
| 1 | **Purposeful** | Every animation answers "why does this move?" (shows where something went, what changed, what to do next). No decorative loops. | Apple HIG: motion supports the experience without overshadowing it |
| 2 | **Physical (springs, not timers)** | Movement follows spring physics that keep velocity when interrupted. Time-based curves only for simple fades and color changes. | WWDC23 "Animate with springs" |
| 3 | **Interruptible and redirectable** | Any animation can be interrupted or reversed mid-way without a jump. Nothing blocks input while it plays. | WWDC23; Apple guidance to let people act without waiting |
| 4 | **Continuous (spatial)** | Things transform from where they came from: a card becomes the page, a button becomes the dialog. Nothing pops in from nowhere. | HIG example: window minimizing to the Dock shows where it went |
| 5 | **Direct manipulation** | Dragged objects follow the pointer 1:1. Release keeps the velocity. | Apple gesture design |
| 6 | **Frequency-aware** | The more often an action happens, the less it animates (Section 2.6). | HIG: avoid animating frequent interactions; practitioner rules |
| 7 | **One small vocabulary** | A handful of tokens and patterns used everywhere. Consistency reads as "built by a team". | Apple consistency principle |
| 8 | **Optional and reducible** | Reduce Motion replaces movement with cross-fades, never with broken UI. Users also get an in-app control. | HIG; Apple accessibility guidance |

**Motion personality:** calm, precise, confident. Playfulness (bounce) appears only at milestones.

---

## 2. The motion system (tokens and rules)

### 2.1 Durations

| Token | Value | Use |
|---|---|---|
| `t-instant` | 0 ms | Keyboard-initiated and very frequent actions (Section 2.6) |
| `t-micro` | 100 ms | Hover color, focus, tooltip fade, icon color |
| `t-fast` | 160 ms | Press feedback, toggles, checkboxes, small menus |
| `t-base` | 220 ms | Popovers, dropdowns, dialogs, banners, toasts |
| `t-slow` | 320 ms | Sheets, page transitions, sidebar collapse |
| `t-emph` | 480 ms | Large layout changes, signature moments |
| `t-hero` | 720 ms | The longest anything on screen may run (rare: submit success, Wrapped) |

**Rules:** UI elements stay under 300 ms unless they are large surfaces or signature moments. A 180 ms dropdown feels faster than a 400 ms one. **Exit is faster than enter** (about 65% of the enter duration): the deliberate phase is slow, the response is snappy.

### 2.2 Easing curves (for non-spring animation)

| Token | Curve | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Default for anything entering, exiting, or responding to input. Fast start, long soft landing |
| `ease-out-soft` | cubic-bezier(0.25, 1, 0.5, 1) | Larger surfaces (sheets, panels) when `ease-out` feels too abrupt |
| `ease-move` | cubic-bezier(0.65, 0, 0.35, 1) | Elements moving between two on-screen positions |
| `ease-linear` | linear | **Only** for continuous rotation (spinner) and real-time progress |

**Never use `ease-in` for UI.** It starts slowly, which delays the exact moment the user is watching, so the interface feels sluggish. Built-in browser easings (`ease`, `ease-in-out`) are too weak; use the tokens above.

### 2.3 Springs (the core of the Apple feel)

Apple describes a spring with two intuitive numbers: **duration** (perceived time to settle) and **bounce** (0 = smooth, above 0 = overshoot, below 0 = flattened). Springs are the only animation type that stays continuous when interrupted, because they can start from any velocity.

| Token | Duration | Bounce | Stiffness / damping / mass (for physics-style APIs) | Use |
|---|---|---|---|---|
| `spring-smooth` | 0.5 s | 0 | 158 / 25.1 / 1 | Default for position and size changes, layout shifts, shared-element moves |
| `spring-sheet` | 0.4 s | 0 | 247 / 31.4 / 1 | Sheets, drawers, panels |
| `spring-snappy` | 0.35 s | 0.15 | 322 / 30.5 / 1 | Toggles, tab/pill indicators, drop settle, small controls |
| `spring-interactive` | 0.2 s | 0 | 987 / 62.8 / 1 | Anything following a pointer (drag lag, tooltip follow, cursor-tracking) |
| `spring-bouncy` | 0.5 s | 0.3 | 158 / 17.6 / 1 | **Rare milestones only** (success marks, achievements) |

Conversion used: stiffness = (2π ÷ duration)², damping = 4π × (1 − bounce) ÷ duration, mass = 1 (Apple's published relationship; the damping form is consistent with critical damping at bounce 0). **Bounce never exceeds 0.3, and most UI uses 0 to 0.15.**

### 2.4 Transform values (distance, scale, opacity)

| Property | Values |
|---|---|
| Small translate | 4 / 8 px (tooltips, inline messages) |
| Medium translate | 16 px (toasts, banners) |
| Large translate | 24 px (step transitions in wizards) |
| Sheets/drawers | Full offset (off-screen) to 0 |
| Press scale | **0.97** (buttons and rows); **0.92** (small icon buttons) |
| Enter scale | Popovers and menus from **0.96**; dialogs from **0.96**; **never from 0** (nothing in the real world appears from nothing) |
| Lift (dragging) | Scale **1.03**, elevation e2 to e3 |
| Card hover (feature cards only) | translateY −2 px, e1 to e2; flat cards do not lift |
| Stagger | 30-60 ms per item, **maximum 8 items** staggered, total under 400 ms |
| Blur | 0-4 px, **only** to hide icon swaps and small cross-fades. No large-area blur (cost) |

### 2.5 Choreography rules

1. **Origin-aware:** popovers, menus, and tooltips scale from their trigger (transform origin at the trigger), not from the center. **Dialogs are exempt** (they stay centered).
2. **Asymmetric timing:** slow the deliberate phase, snap the response. Press-down is quick; release is a spring.
3. **One focal motion at a time:** at most **3 elements animate simultaneously** on a screen; only one is the "hero" of that moment. Everything else waits or stays still.
4. **Layering:** foreground moves first, background follows (backdrop fades 40 ms after the surface starts).
5. **Move, don't teleport:** when something changes place, animate the change (shared geometry), except at `t-instant` tier.
6. **Elevation follows motion:** lifted things get a higher shadow, released things return it. Animate the shadow with an opacity change on a pre-rendered layer, not by interpolating `box-shadow`.
7. **Content does not jump:** loading and state changes never shift surrounding layout.
8. **No motion on first paint of the page shell.** Sidebar, top bar, and canvas are simply present. Only content areas may enter.

### 2.6 Frequency tiers (the most important rule)

| Tier | How often | Examples | Motion allowed |
|---|---|---|---|
| **T0** | Keyboard-initiated or 100+ times per day | Command palette open, arrow-key selection, focus moves, typing, keyboard shortcuts, list filtering, tab switching by keyboard | **None** (or a 100 ms opacity fade at most) |
| **T1** | Tens per day | Hover, press, toggles, checkboxes, tooltips, menus, dragging tasks, marking done | `t-micro` to `t-fast`; springs with bounce 0 to 0.15 |
| **T2** | Several per day | Dialogs, sheets, page/route changes, toasts, banners, tab changes by mouse | `t-base` to `t-slow` |
| **T3** | Rare or milestone | Room creation, idea reveal and lock, plan validated, feature freeze reached, submission, Wrapped | Signature choreography up to `t-hero`, with delight |

Raycast-style: a tool used hundreds of times a day should not animate its open/close. The command palette is therefore **T0**.

### 2.7 Performance rules (so it runs on mid-range phones)

- **Animate only `transform` and `opacity`** (composited on the GPU). Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`. Where a layout change must be animated (sidebar collapse, list reordering, expand/collapse), use the FLIP technique through the animation library, not raw layout properties.
- No `transition: all`; list the properties.
- Do not drive child animations by updating a CSS variable on a parent (causes style recalculation across the subtree).
- **Frame budget:** 16.7 ms at 60 Hz (8.3 ms at 120 Hz). Any animation dropping frames on a throttled mid-range device is cut or simplified.
- Interaction latency target: keep interactions within the "good" range for Interaction to Next Paint (200 ms or less); animation must never delay the response to input.
- No animation runs off-screen. Nothing loops except the spinner.
- **Motion tiers** (Section 3.2) let the app degrade automatically or by user choice.

---

## 3. Accessibility, user control, and device tiers

### 3.1 Reduce Motion (the replacement table)

Apple's guidance is that Reduce Motion means **reduce problematic motion, not remove all animation**: replace slide and zoom effects with cross-fades and keep essential feedback. Every motion in this file has a reduced fallback.

| Full motion | Reduced motion replacement |
|---|---|
| Slide / push / zoom / shared-element move | Cross-fade (`t-base`), no movement |
| Spring with bounce | Smooth, no bounce, shorter (`t-fast`); or instant |
| Parallax, tilt, wiggle, pulse, shake | Removed. Communicate with color, icon, or text change |
| Stagger | Everything appears together |
| Number roll | Instant swap |
| Chart draw-in | Final state shown |
| Long milestone choreography | 200 ms cross-fade of the result |
| Spinner | Non-rotating indicator (slow opacity pulse) or "Working…" text |
| Drag | Still follows the pointer 1:1 (direct manipulation is not decoration); no tilt, no overshoot, no rubber-band |

### 3.2 User control and tiers

| Setting (Settings → Appearance) | Behavior |
|---|---|
| **Motion: Full** | Everything in this file |
| **Motion: Reduced** (default when the system Reduce Motion setting is on) | Section 3.1 replacements |
| **Motion: Off** | Instant state changes. Only essential progress feedback remains |
| **Lite (automatic)** | Reduced-tier behavior for devices that cannot hold frame rate. Triggered by user choice or by measured dropped frames; device-memory hints exist only in some browsers, so do not rely on them |
| **Speed Mode default** | **Reduced** by default (S31): keep press feedback, drag, and toasts; drop stagger, morphs, wiggles, number rolls |

### 3.3 Other accessibility rules

- **No flashing:** nothing flashes more than 3 times in any second (WCAG 2.3.1).
- **No moving content longer than 5 seconds** without a way to pause it (WCAG 2.2.2). Only the loading spinner runs longer, and it is essential status.
- **Decorative motion is hidden from screen readers;** meaningful motion has a text equivalent (a live-region announcement: "Idea locked", "Plan validated", "Submitted").
- **No motion is required to understand state.** Every animated state also changes text, icon, or color.
- Test every screen with Reduce Motion on, in light and dark.

---

## 4. Interaction vocabulary (the universal patterns)

### 4.1 Your three cases, answered directly

| Case | What happens |
|---|---|
| **Hover an icon** | **Navigation icons:** nothing moves, only color (`t-micro`). **Toolbar/icon buttons:** a soft circular background fades in (`t-micro`) and the icon shifts one shade. **Expressive icons** (bell, copy, refresh): the icon effect plays once on hover only if it is not a T0/T1-frequent control (see Section 4.4). Tooltip appears after a 500 ms delay; once one tooltip has shown, neighbors show **instantly** (no delay, no animation) for the next second. Hover motion is **gated to real pointers** (`hover: hover` and `pointer: fine`); touch devices never show hover effects. |
| **Click an icon** | **Immediate press feedback:** scale to 0.92 (icons) or 0.97 (buttons) in `t-fast`, spring back on release. Then the **result animates where it happens**: a toggle icon swaps with a cross-fade + tiny scale + 2 px blur; a "copy" icon becomes a check that draws itself, then reverts after 1.6 s; a menu opens origin-aware from the icon. The click is never blocked while an animation plays. |
| **Access a functionality** (open a feature, page, or tool) | **Route changes** use the transition type that matches the relationship (Section 6.1): sibling pages cross-fade with an 8 px rise; parent to child uses a shared-element/zoom move; overlays (dialog, sheet, drawer) rise from their trigger. **Frequent access (keyboard shortcuts, command palette, sidebar arrow-navigation) is instant.** The first time a user opens a feature, an optional single "first-use" reveal may play (T3) and never again. |

### 4.2 Core patterns

| Pattern | Behavior | Timing |
|---|---|---|
| **Hover (rows, cards)** | Background color change only. Feature cards also lift 2 px + e1→e2 | `t-micro`; lift 200 ms `ease-out` |
| **Press** | Scale 0.97 on down; spring back (`spring-snappy`) on up | Down `t-fast`; up spring |
| **Focus** | Ring appears instantly (no animation) so keyboard users never wait | `t-instant` |
| **Selection** | Row wash fades in; the selection marker (2 px) is instant; a moving selection indicator (tabs, segmented) glides between items | Fade `t-micro`; glide `spring-snappy` |
| **Toggle / switch** | Thumb travels with `spring-snappy`; track color cross-fades; thumb stretches ~10% in the direction of travel while pressed (iOS switch feel) | `spring-snappy` |
| **Checkbox** | The check mark **draws itself** (stroke reveal), box fill fades in | 200 ms `ease-out` |
| **Expand / collapse** | Height animates by FLIP with `spring-smooth`; chevron rotates 90° with `spring-snappy`; inner content fades in 60 ms after | `spring-smooth` |
| **Enter / exit (overlays)** | Enter: opacity + scale from 0.96, origin-aware. Exit: 65% duration | `t-base` / ~140 ms |
| **Reorder / drag** | See M08. Pick-up lifts; neighbors part with a layout spring; drop settles | `spring-snappy` |
| **List add/remove** | New item eases in with 8 px rise + fade; removed item collapses its height with `spring-smooth` after fading | `t-base` |
| **Shared-element move** | An element keeps its identity across screens and morphs position and size | `spring-smooth` (`t-slow` on the View Transitions API path) |
| **Number change** | Digits roll vertically to the new value (Apple's numeric-text behavior); tabular figures keep width stable | `t-base`; seconds never roll |
| **Progress ring / bar** | Value change animates from the current value (retargets if interrupted) | `spring-smooth` |
| **Success** | Circle draws, then check draws, then a small scale settle. Reserved for T3 moments; smaller versions for T1 | See M12 |
| **Error** | Message slides 8 px down + fades in; on invalid submit, the field or summary chip shakes horizontally ±4 px, 2 cycles, 240 ms (the "no" gesture). Never a full-screen shake | `t-base`; shake 240 ms |
| **Loading** | See Section 9 | |

### 4.3 Gestures (direct manipulation)

| Gesture | Behavior |
|---|---|
| **Drag** | 1:1 follow with `spring-interactive` lag of at most one frame; release preserves velocity into the settle spring |
| **Edge swipe back (mobile)** | The page follows the finger; on release, velocity and distance decide commit or cancel; both animate from the current position |
| **Sheet detents (mobile)** | Bottom sheets snap to detents (about 45% and 92% of height) with velocity-aware springs; overscroll past the top rubber-bands |
| **Swipe row actions (mobile lists)** | Partial swipe reveals Done / Blocked; a full swipe commits with a resistance curve near the edge and a small "tick" (haptic if available) |
| **Long-press context menu** | Item lifts (scale 1.03), backdrop dims (blur only on capable devices), menu springs out from the item |
| **Pinch / pan (Diagram Studio)** | Direct zoom and pan with inertia; double-tap fits to screen |
| **Pull to refresh (Home, mobile)** | Content follows the finger with resistance; indicator fills as it stretches; release triggers the spinner |

### 4.4 Icon effects (SF Symbols-style vocabulary)

A small, fixed set, so icons feel like one family. Each plays once (never loops) unless noted.

| Effect | Motion | Used for |
|---|---|---|
| **Swap** | Cross-fade + scale 0.85→1 + 2 px blur, 160 ms | Copy→check, play/pause, sun/moon, sync states, expand/collapse icons |
| **Draw** | Stroke draws along its path, 200-240 ms | Check marks, success ring, done states |
| **Bounce** | Scale 1→1.12→1 with `spring-snappy` | Confirm actions (marked done, saved, connected) |
| **Wiggle** | Rotate ±8°, 2 cycles, 360 ms | New notification on the bell; "attention" on a blocked task icon (max once per event) |
| **Pulse** | Opacity 1→0.5→1, once, 400 ms | Live status when something updates |
| **Rotate** | 90° or 45° with `spring-snappy` | Chevrons, plus→close (menus, FAB) |
| **Spin** | Continuous, linear, 700 ms per turn | Sync/refresh while working (stops when done) |

---

## 5. Component motion catalog

References use `design.md` component IDs. "Reduced" is the fallback from Section 3.1.

| ID | Component | Trigger | Motion (Apple analog in brackets) | Timing | Reduced |
|---|---|---|---|---|---|
| **C01** | Sidebar | Collapse / expand | Width changes by FLIP with `spring-smooth`; labels fade out first (100 ms) and back in after; the active lavender pill keeps identity across widths; tooltips replace labels at rail size. [macOS sidebar collapse] | `spring-smooth` | Cross-fade to rail |
| **C01** | Sidebar nav item | Hover / press | Color only on hover; press scale 0.97; the active pill **glides** to the newly selected item instead of jumping [iOS tab bar selection] | `spring-snappy` | Instant move |
| **C01** | Rail magnification (optional, desktop pointer only) | Hover over rail icons | Icons scale up to 1.15× under the cursor, neighbors 1.07× [macOS Dock]. Delight tier, off in Speed Mode and Reduced | `spring-interactive` | Removed |
| **C02** | Top bar | Scroll | A 1 px bottom border fades in once the page scrolls; large page titles shrink into the bar on mobile [iOS large titles] | 160 ms scroll-linked | Border instant |
| **C02** | Search pill | Press | Opens the command palette (T0, no motion) | `t-instant` | same |
| **C02** | Clock chip | Countdown crosses a threshold | Text changes with number roll; below 10 minutes the chip changes color once and gives one soft pulse every 30 seconds | `t-base` | Color change only |
| **C03** | Phase Track | Phase changes | Black active pill **glides** from the old to the new phase (matched geometry); the completed phase's check draws; the phase dot scales 1→1.3→1 [iOS segmented control] | `spring-snappy` | Cross-fade |
| **C05** | Button | Hover / press / release | Hover: fill shifts one step (`t-micro`). Press: scale 0.97 (`t-fast`). Release: spring back | `t-fast` | Color only |
| **C05** | Button loading | Async action | Label cross-fades to a spinner; **width stays fixed** so nothing shifts | 160 ms | Text "Working…" |
| **C06** | Icon button | Hover / press | Soft circle fades in (`t-micro`); press scale 0.92; effect from Section 4.4 if defined | `t-fast` | Color only |
| **C07** | Chip / tag | Added / removed | Enters with 4 px rise + fade; removal collapses width (FLIP) | `t-base` | Fade |
| **C08** | Status chip | Status changes | Old label cross-fades to new with a 2 px blur; color eases | 160 ms | Instant |
| **C09** | Avatar stack | Member joins / presence | New avatar slides in from the right of the stack (spring); presence dot scales 0→1 | `spring-snappy` | Fade |
| **C10a** | Feature card | Hover / press | Lifts 2 px, shadow e1→e2 (hover only on real pointers); press scale 0.985 | 200 ms `ease-out` | None |
| **C10a→S08** | Feature card → Room page | Click | **Zoom transition:** the card expands to become the page header while the rest of the page fades in around it [iOS 18 zoom navigation transition] | `spring-smooth` | Cross-fade |
| **C10b** | List row | Hover | Wash color; whole row is the target | `t-micro` | same |
| **C10c** | Pastel card | Progress updates | Progress bar retargets with `spring-smooth`; "days left" chip rolls its number | `spring-smooth` | Instant |
| **C10d** | Dark callout card | Appears / dismissed | Enters with 8 px rise + fade; dismissal collapses height (FLIP) | `t-base` | Fade |
| **C10f** | KPI tile | Value changes | Number rolls; delta chip cross-fades | `t-base` | Instant |
| **C10g** | Hero panel (countdown) | Every minute / last hour | Minutes/hours roll on change; **entering the last hour** the panel changes from illustration field to dark surface as one calm cross-fade with the banner dropping in (M11) | `t-emph` | Cross-fade |
| **C11** | Progress ring | Value changes | Stroke animates from current value; percent number rolls | `spring-smooth` | Instant |
| **C12** | Progress bar | Value changes | Fill retargets; never restarts from zero | `spring-smooth` | Instant |
| **C13** | Task card | Hover / drag / done | See M07, M08; hover shows a 1 px stronger border only | `t-micro` | Static |
| **C14** | Kanban column | Card enters/leaves | Neighbors slide to open/close the gap (layout spring); count pill digits roll | `spring-snappy` | Instant |
| **C15** | Data table | Sort / filter / expand | Rows reorder with layout animation (limit to visible rows, disabled above 100 rows); expanding a row uses expand/collapse pattern; **row selection by keyboard is instant** | `spring-smooth` | Fade |
| **C16** | Form controls | Focus / error / valid | Focus ring instant; error message rises 8 px + fades; invalid submit shakes the summary chip; label float (if used) rises with `t-fast` | `t-fast` | Color/text only |
| **C17** | Segmented control | Select | Selected white/cream "thumb" glides between segments (matched geometry) [iOS segmented control] | `spring-snappy` | Instant |
| **C18** | Day pill / week strip | Select / next week | Selected fill glides; on week change the strip slides 24 px and fades, direction follows the arrow | `t-slow` | Cross-fade |
| **C19** | Mini calendar | Month change / select | Month grid cross-fades with 8 px horizontal slide; selected circle scales 0.9→1 with `spring-snappy` | `t-base` | Cross-fade |
| **C20** | Time grid | Scroll to now / drag event | "Now" line eases into view; dragging an event snaps to 15-minute rows with a small settle | `spring-snappy` | Instant |
| **C21** | Event block | Create / drag / resize | New block grows from the click point (scale 0.96→1, origin at click); resize follows pointer 1:1; conflict adds a coral outline with 1 pulse | `spring-snappy` | Fade |
| **C22** | Create popover | Open / close | Origin-aware scale from 0.96 + fade from the clicked time slot | `t-base` / ~140 ms | Fade |
| **C23** | Checklist row | Check | Box fills, check draws; title strike-through line draws left to right; title fades to muted; row settles; if the list re-sorts done items to the bottom, they move with the layout spring after a 200 ms pause (so the user sees the strike first) | see M07 | Instant states |
| **C24** | Detail row | Edit inline | Value cross-fades into an input in place (same size); saved state shows a check swap on the action icon | 160 ms | Instant |
| **C25** | Dialog | Open / close | Scale 0.96→1 + fade; backdrop fades in 40 ms later; exit ~140 ms. **Bottom sheet (mobile):** rises with `spring-sheet`, draggable | `t-base` | Fade |
| **C25** | Right sheet / drawer | Open / close | Slides in with `spring-sheet`; content behind dims (no scale on desktop); drag right to dismiss with rubber-band | `spring-sheet` | Cross-fade |
| **C26** | Command palette | Open, type, select | **T0: opens instantly.** At most a 100 ms opacity fade. Results and selection highlight change instantly. Palette closes instantly after an action | `t-instant` | same |
| **C27** | Toast | Appear / stack / dismiss | Enters with 16 px rise + fade (`spring-smooth`); stacked toasts compress behind the newest; hover expands the stack; swipe dismisses in the direction it entered; timer pauses on hover | `spring-smooth` | Fade |
| **C27** | Banner | Offline / freeze / last hour | Drops from under the top bar (height by FLIP, content pushes down smoothly); dismiss collapses height | `t-base` | Fade |
| **C28** | Empty state | Appears | Content fades in with 8 px rise; illustration is static (no loops) | 240 ms | Fade |
| **C29** | Skeleton | While loading | Very slow opacity "breathing" (0.6↔1 over 1.8 s). **No shimmer sweep.** Resolves with a 160 ms cross-fade into content; layout must not shift | see Section 9 | Static |
| **C30** | Code block | Copy | Copy icon swaps to a check (Draw), label "Copied" for 1.6 s, then reverts | 160 ms | Instant swap |
| **C31** | Doc editor | Slash menu, block drag | Slash menu is origin-aware at the caret; block drag follows the standard drag pattern | `t-base` | Fade |
| **C32** | Charts | First view / data change / hover | Section 8 | | |
| **C33** | Tooltip | Hover / focus | 500 ms delay, then 100 ms fade + 4 px rise; **instant for neighbors within 1 s**; follows the cursor in charts with `spring-interactive` | `t-micro` | Fade only |
| **C34** | Dropzone | Drag over / drop | Border dash color and background wash fade in; on drop the file chip flies from the cursor into the list (matched geometry) | `spring-smooth` | Fade |
| **C35** | Stepper | Step complete | Connecting line fills (progress), circle changes to check (Draw), next step's circle ring appears | 200 ms | Instant |
| **C36** | Tabs | Change | Same as segmented control; panel content cross-fades with an 8 px rise (mouse), instant for keyboard | `t-base` | Cross-fade |
| **C37** | Menu / dropdown | Open / close / hover item | Origin-aware scale 0.96 + fade; item highlight follows the pointer as one moving "pill" (spring) rather than per-item flashes; keyboard highlight instant | `t-base` | Fade |
| **C38** | Count badge | Number changes | Number rolls; badge scales 1→1.15→1 once on increment | `spring-snappy` | Instant |
| **C39** | Blocker FAB | Press | Morphs into the blocker dialog (M10) | `spring-smooth` | Cross-fade |
| **C40** | Illustration slot | Appears | Fade + 8 px rise; static after | 240 ms | Fade |

---

## 6. Screen-level motion

### 6.1 Transition types (how screens relate)

| Relationship | Transition | Desktop | Mobile |
|---|---|---|---|
| **Siblings** (Board ↔ Schedule ↔ Docs) | Content cross-fade with 8 px rise; sidebar and top bar stay still | `t-base` | same |
| **Parent → child** (Room card → Room, Playbook card → detail, Task → drawer) | **Zoom / shared element:** the source expands into the destination | `spring-smooth` | `spring-smooth` |
| **Overlay** (dialog, drawer, sheet, palette) | Rises from trigger (see C25) | `t-base` | Bottom sheet with detents |
| **Wizard steps** (S06, S05) | Shared-axis: outgoing step slides −24 px and fades, incoming from +24 px; direction follows Back/Next | `t-slow` | same |
| **Push navigation (mobile only)** | Incoming page slides from the right with the outgoing page parallaxing ~30% and dimming; edge-swipe back is interactive | `t-slow` (spring) | required |
| **Phase change** (Freeze, Ship) | Color/banner change, no page transition | see M09 | same |

Implementation preference: browser View Transitions API for route and shared-element transitions (same-document transitions are supported in Chrome 111+, Safari 18+, Firefox 144+); fallback is an instant swap. Details in Section 11.

### 6.2 Per-screen highlights

| Screen | Notable motion |
|---|---|
| **S01 Landing** | The hero screen composition is static. The "five ways teams lose" section swaps the paired screen with a cross-fade + 8 px rise as the selected item changes. The phase walkthrough uses scroll-linked progress on the sticky list (enhancement only; static fallback). No parallax, no scroll-jacking. |
| **S02 / S03** | Provider buttons follow standard press. Error text rises 8 px. Invite page: member avatars enter with a 40 ms stagger, once. |
| **S05 Situation picker** | Selected card scales 1.01 and gets the selection ring; unselected cards dim to 70% opacity. Continue button enables by color change. |
| **S06 Wizard** | Shared-axis step transitions; the Clock-strip preview redraws with `spring-smooth` when start/end change; "Create room" triggers M01. |
| **S07 Home** | Cards enter once per session (fade + 8 px, 40 ms stagger, max 6). Rings fill with `spring-smooth`. Card → room uses the zoom transition (M02). Pull to refresh on mobile. |
| **S08 Overview** | KPI numbers roll on change. Clock strip needle drifts (Section 8). Blocker callout enters/collapses by FLIP. Charts animate on first view only. |
| **S09 Brief** | Extracted items appear with a 40 ms stagger as extraction completes; the confirm checkbox draws; the extraction-status ring fills; "source" links scroll the right panel with a smooth scroll and flash the matched line with one soft highlight (fade in/out 600 ms). |
| **S10 Team** | Radar chart polygon morphs (`spring-smooth`) when the roster changes. Check-in scale selection uses Bounce. Rescuer callout enters like any callout. |
| **S11 Ideate** | Stage stepper glides; **M04 reveal** and **M05 lock** are the signature moments; critique dots fill with Bounce; votes only show a "voted" check (no result movement until close). |
| **S12 Plan** | **M06:** copy, validate, results choreography; step statuses change with Swap; locking the plan is the second T3 moment. |
| **S13 Docs** | File tree selection uses the moving highlight; version chip cross-fades; export button shows progress then a Draw check. |
| **S14 Board** | **M07 / M08:** complete and drag. Filters animate cards in and out with the layout spring (limited to 60 visible cards). View switches (Board/List/People) cross-fade. |
| **S15 Schedule** | View changes cross-fade with direction-aware slide; "Now" line eases; event create grows from click; next-up countdown rolls minutes. |
| **S16 MVP** | Reality Ledger status chips Swap; health checklist uses the checklist row motion; the identity sentence edit uses in-place cross-fade. |
| **S17 GitHub** | Connection status changes with Swap; "Sync" icon spins while working then Bounces on success; branch row expands with the expand pattern; lane graph draws once (stroke draw 400 ms). |
| **S18 APIs** | Status dots change color with a soft pulse (once); endpoint groups expand/collapse; import dropzone per C34; parsed endpoints appear with 30 ms stagger (max 8). |
| **S19 Diagrams** | Preview cross-fades on re-render (160 ms, no flash); pan/zoom with inertia; template tiles use feature-card hover. |
| **S20 Pitch** | Slide rail reorder = drag pattern; coverage matrix dots fill with Bounce when a criterion becomes covered; rehearsal timer digits roll on minutes; run counter uses number roll. |
| **S21 Demo** | Beat duration bar retargets with spring; over-limit turns peach with one color transition; shot list reorder = drag pattern. |
| **S22 Submission** | **M11 / M12:** last-hour transition and submit success. Checklist rows verify in sequence during "Verify". |
| **S23 Readiness** | Six rings fill together (one calm 480 ms), then settle; weak-spot list re-sorts with layout spring when items resolve. |
| **S24 Retro** | **M13 Wrapped**; timeline dots enter with 60 ms stagger once; highlighted bar draws with `spring-smooth`. |
| **S25 Prep** | Checklist motion per C23; the event-day card map thumbnail has no motion (static). |
| **S26 Crowd Check** | Crowdedness meter segments fill with spring when values change. |
| **S27 Tools** | Filter changes reflow cards with the layout spring; "last checked" chips static. |
| **S28-S29** | Settings toggles use switch motion; connect/disconnect uses Swap; new notification rows slide in from the top with layout spring; unread state changes by color. |
| **S30 Mentor** | Read-only chip enters once. No editing motion. |
| **S31 Speed Mode** | Reduced tier by default. "Now" card swaps tasks with a cross-fade; the blocker FAB uses M10; only clock numerals and press feedback animate. |
| **S32 System** | Static except standard button motion. Offline banner per C27. |

---

## 7. Signature moments (the "wow" list)

Rules for all: **maximum one T3 moment per screen visit; always skippable by pressing any key or click; never blocks input; total under `t-hero` (720 ms) unless stated; reduced-motion fallback is a 200 ms cross-fade of the final state; a text equivalent is announced to screen readers.**

### M01: Room birth (Create room → Overview) · T3 · S06→S08
- **Story:** "You made something." The wizard's Confirm card becomes the room.
- **Choreography:** (1) Confirm card holds 80 ms; (2) it expands (shared element) into the Overview page header while the wizard fades; (3) Phase Track pills appear left to right (40 ms stagger, 7 pills); (4) Clock strip draws left to right in phase colors (400 ms); (5) KPI tiles fade in (no stagger beyond 4 items).
- **Apple analog:** iOS 18 zoom transition + the "set up complete" reveals in Apple onboarding (general knowledge).
- **Reduced:** cross-fade to Overview.

### M02: Zoom into a room · T2 · S07→S08
- Room feature card expands into the page header; the ring and title keep their identity (shared elements); the rest of the page fades in around it. Back reverses and can be interrupted mid-way.

### M03: Phase glide · T2 · C03 everywhere
- The black active pill slides from the current phase to the next with `spring-snappy`; previous phase's dot becomes a check (Draw); the Clock strip needle continues without pause; the page's Phase-filtered content cross-fades.

### M04: Idea reveal (sealed → revealed) · T3 · S11 Reveal
- **Story:** Everyone's private ideas open at once, so the team sees them together (this is what makes silent ideation fair).
- **Choreography:** cards start as sealed tiles (lock icon, no text). On "Reveal": tiles flip around the vertical axis (90°, swap content, back to 0°) left to right with a 50 ms stagger, `spring-smooth`; authors' avatars fade in last; count pill rolls to the number of ideas. Total about 700 ms for 6 ideas.
- **Reduced:** tiles cross-fade to content together.

### M05: Idea lock (the decision) · T3 · S11 Decide
- **Choreography:** (1) Leader presses **Lock idea**: the button shows press feedback and the lock icon closes (shackle Swap); (2) chosen card scales to 1.03 with e3; other cards dim to 40% and slide into the Parked column with a layout spring; (3) the decision timer chip collapses into a green "Locked" chip (Swap); (4) the chosen card **morphs into the summary card** at the top of the Plan handoff; (5) live-region announcement "Idea locked".
- **Sound/haptic:** optional short vibration on supporting devices.
- **Reduced:** chosen card highlighted, others dimmed, cross-fade summary.

### M06: Prompt Bridge: validate and lock · T3 (lock) / T2 (validate) · S12
- **Copy:** copy icon Swaps to check (1.6 s); code block shows a 1-time soft highlight fade on the copied text.
- **Validate press:** button width holds, label cross-fades to a spinner. On completion, results rows appear with a 40 ms stagger; each row's icon **draws** its check or cross.
- **Pass:** stepper circle fills with Draw and Bounce; the connecting line fills toward the next step.
- **Fail:** the failing rows expand with `spring-smooth`; the summary chip performs the single small shake (Section 4.2); the "Copy repair prompt" button gets a one-time soft emphasis (color wash fade, no glow).
- **Lock plan (all 5 steps):** the nine plan-file rows appear one by one (60 ms stagger, max 8 shown then the ninth with the rest), each with a check Draw; a "Plan locked" seal (Success mark) settles with `spring-bouncy`; the Docs item in the sidebar increments its badge with a number roll.
- **Reduced:** results appear together; no shake.

### M07: Task complete · T1 · S14, S08, S31
- **Choreography:** checkbox check draws (200 ms) → title strike-through line draws left to right (180 ms) → ring fills → after a 200 ms pause the card leaves its column and lands in Done with the layout spring; source and destination count pills roll. On phones, the row collapses with a light "tick" haptic where supported.
- **Rule:** if the same user completes tasks rapidly, the sequence compresses: only the check and the move play.
- **Reduced:** state changes instantly; card moves with a cross-fade.

### M08: Drag and drop (Kanban and lists) · T1 · S14, S11, S20
- **Pick up:** after 120 ms (desktop: immediately on drag start; touch: 200 ms long-press), the card scales to 1.03 with e2→e3; a dashed placeholder holds its slot.
- **While dragging:** card follows 1:1 (`spring-interactive`, at most one frame of lag). **Optional velocity tilt** (up to ±2°, proportional to horizontal speed) resolves the "tilted dragging card" from the reference (`design.md` X10); disabled in Reduced, Speed Mode, and Lite. Neighbors part with a layout spring; target column highlights with a soft lavender wash.
- **Drop:** spring-snappy settle into place (bounce 0.15), shadow returns to flat, count pills roll. **Invalid drop:** the card returns to its origin with `spring-smooth`.
- **Keyboard move (T0):** instant, with a live-region announcement ("Moved to Review, position 2").
- **Edge auto-scroll:** eases faster as the pointer nears the edge.

### M09: Feature freeze reached · T3-lite · S08, S14, C03, clock strip
- **Choreography:** as the needle crosses the freeze flag, the flag settles with a small scale spring and the segment tint moves to Amber; a lavender-wash banner drops in (`t-base`); the "Add task" button's icon Swaps to a lock; the Phase Track glides to Freeze (M03).
- **Rule:** one soft pulse on the clock chip, not repeated.
- **Reduced:** banner and color change only.

### M10: "I'm blocked": FAB to dialog and back · T1 · C39
- **Choreography:** the pink FAB's plus rotates 45° while the button morphs into the dialog card anchored at the FAB's corner (origin-aware, `spring-smooth`); text field focuses at the end of the morph. **Send:** the dialog collapses back into the FAB, which shows a check (Draw) for 1.2 s, then a toast "Captain notified".
- **Apple analog:** Dynamic Island-style morph from a compact control to a larger surface (general knowledge).
- **Reduced:** cross-fade dialog.

### M11: Last hour begins · T3 · S22, S08
- **Choreography:** the hero panel's illustration field cross-fades into the dark surface (480 ms); the countdown numerals stay in place (no jump); a banner reads "Last hour. Only verification and submission from here." and drops in; creation controls dim to disabled with a lock Swap.
- **Countdown:** hours/minutes roll on change; **seconds never roll** (they change instantly); no per-second motion anywhere.

### M12: Submitted (Verify, then success) · T3 · S22
- **Verify:** pressing **Verify & submit** turns the button into a progress bar that fills as real checks complete; each checklist row gets its check Draw in sequence (80 ms apart, in real completion order).
- **Success (Apple Pay-style):** a ring draws around a circle (400 ms), the check draws inside (240 ms), then a `spring-bouncy` scale settle (once). The headline "Submitted" appears with an 8 px rise; the hero panel calms to a neutral surface; the primary button changes to "Start retro".
- **No confetti, no particles, no sound by default.** The restraint is the point.
- **Failure:** the first failing row expands, shakes its status chip once, and focus moves to the fix link.
- **Reduced:** the final success state fades in.

### M13: Hackathon Wrapped · T3 · S24 (first open only)
- **Choreography:** the dark card enters (fade + rise); each stat appears in turn (hours, tasks done, first working demo hour, rehearsals), numerals rolling up to their values (sequential, 200 ms apart); the highlighted bar chart draws; ends on the "View" button. **Total under 4 seconds, skippable with any input.** Never plays again unless the user replays.
- **Reduced:** final card shown.

### M14: Sidebar collapse and rail · T2 · C01
- Covered in C01. The active pill keeps identity; labels fade out before the width change and in after; the tooltip layer takes over. Interrupting mid-collapse reverses from the current width.

### M15: Rubric drawer and command palette · T2 / T0 · overlays
- **Rubric drawer (`R`):** slides in with `spring-sheet`; backdrop dims 32%; rubric criteria rows fade in with a 30 ms stagger (max 6). Dismiss by drag with rubber-band or Esc.
- **Command palette (`Ctrl K`):** T0, opens instantly. No entrance animation. This is deliberate: it is the most frequent action in the product, so speed is the polish.

---

## 8. Data visualization motion

| Chart | First view (once per session per chart) | Data change | Hover / interaction |
|---|---|---|---|
| **Area / line (progress vs plan)** | Left-to-right reveal with `spring-smooth` (about 600 ms) | Path morphs to new values (320 ms); numbers roll | Crosshair and dark tooltip follow the cursor with `spring-interactive`; other series dim to 40% (`t-micro`) |
| **Bar (highlighted bar)** | Bars grow from the baseline with a 30 ms stagger (max 12 bars, then all together); highlighted bar arrives last | Bars retarget height (spring) | Hovered bar lifts 2 px; others dim; tooltip springs in |
| **Category heatmap** | Cells fade in on a diagonal sweep, 8 ms per step, total under 300 ms | New cells fade in; changed cells cross-fade | A soft lens: hovered cell scales 1.15, neighbors 1.05 |
| **Contribution grid** | Fade in by column, 6 ms per column | Same | Tooltip after 300 ms delay |
| **Radar** | Polygon scales from center 0.6→1 with `spring-smooth` | Polygon morphs between shapes | Axis label highlights |
| **Rings / gauges** | Stroke fills from 0 (`spring-smooth`); percent rolls | Retarget from current | None |
| **Sparkline** | Line draws in 320 ms | Retarget | None |
| **Donut** | Segments sweep clockwise 480 ms | Segments retarget | Hovered segment offsets 4 px |

Rules: **charts never re-run the entry animation** when navigating back, re-fetching, or changing filters; only the changed data animates. Live-updating charts animate the change, not the whole chart. Reduced motion shows final state. All chart motion honors the frame budget: charts with more than 300 data points skip entry animation.

**Clock strip:** the "now" needle moves continuously and slowly (it updates once per second with a linear 1 s transition, cheap because it is a single transformed element); freeze and deadline flags are static until M09/M11.

---

## 9. Loading, empty, error, and offline motion

| State | Motion |
|---|---|
| **Route loading (over 300 ms)** | A 2 px lavender progress line at the top of the viewport (trickle, no percentage) [GitHub-style]; under 300 ms shows nothing |
| **Skeleton** | Slow opacity "breathing" (1.8 s), no shimmer sweep; resolves by 160 ms cross-fade; no layout shift |
| **Spinner** | 16-20 px ring, 700 ms per turn, linear; only for waits over 400 ms; Reduced: slow opacity pulse |
| **Optimistic update** | The UI updates instantly; on failure it springs back (`spring-smooth`) and a toast explains |
| **Content arrival** | Fade in (160 ms); lists of new items use the list-add pattern; no cascade on repeat visits |
| **Empty state** | Fade + 8 px rise, static illustration |
| **Inline error** | Rises 8 px + fade; invalid submit performs the small shake |
| **Offline** | The peach banner drops in (`t-base`); edit controls dim with a color change; on reconnect the banner turns green "Back online" for 1.6 s, then collapses |
| **Sync in progress** | Sync icon spins; on finish it Bounces once with a check Swap |
| **Long operations (export zip, extraction)** | Determinate progress bar with `spring-smooth`; completion Draw check; toast |

---

## 10. Motion rules: banned and required

**Banned:**
- `ease-in` on any UI; animating from `scale(0)`; durations over 300 ms on ordinary UI without a stated reason.
- Animating layout properties directly (width/height/top/left/margin/padding), or `transition: all`.
- Bounce above 0.3, or bounce on frequent actions.
- Keyframe animation for anything a user can trigger twice in a second (use interruptible springs or transitions).
- Any animation on T0 actions (keyboard shortcuts, command palette, list navigation).
- Parallax on content, scroll-jacking, scroll-triggered "everything reveals" cascades on every visit.
- Looping decorative motion, pulsing glows, gradients shimmering across surfaces, shimmer-sweep skeletons.
- Confetti, particles, fireworks, typewriter text, marquee text.
- Hover motion on touch devices; ungated hover effects.
- Large-area blur or backdrop-filter animation on low tiers.
- More than 3 simultaneously animating elements; more than one T3 moment per screen visit.
- Sound by default.

**Required:**
- Every animation has a reduced-motion fallback (Section 3.1) and a Motion setting behavior.
- Every animation is interruptible.
- Popovers, menus, and tooltips are origin-aware.
- Enter and exit are asymmetric (exit about 65%).
- Every signature moment is skippable and has a screen-reader equivalent.
- Numbers use tabular figures so rolling digits do not shift layout.

**Motion QA checklist (per screen):** feels right at normal speed and at 10% speed · no dropped frames on a CPU-throttled mid-range device · interruptible mid-way (click twice, drag and reverse) · Reduce Motion behaves per Section 3.1 · no layout shift · keyboard path has no animation delay · no more than 3 simultaneous movers · looks correct in light and dark.

---

## 11. Implementation guidance (tools, not code)

| Need | Recommended tool | Notes |
|---|---|---|
| **Springs, layout animation, shared elements, gestures, presence, reordering** | **Motion for React** (`motion/react`) | Supports spring by duration and bounce, layout animations with shared-element `layoutId`, exit animations, drag with momentum, Reorder, scroll animations. Use **LazyMotion with the `m` component** to keep the initial cost near 4.6 kB. `MotionConfig` has a reduced-motion setting (when reduced motion is on, transform and layout animations are disabled), but **we still supply our own cross-fade replacements** per Section 3.1. |
| **Simple hover, press, tooltip, color** | Plain CSS transitions | No JavaScript needed; gate hover with `hover: hover` and `pointer: fine`. |
| **Springs in CSS** | CSS `linear()` easing (Baseline since Dec 2023: Chrome/Edge 113, Firefox 112, Safari 17.2) | Approximates a spring curve for simple, non-interruptible cases; Motion can also generate CSS spring easing (per its docs; verify current package). |
| **Route transitions and shared elements** | **View Transitions API** | Same-document transitions are Baseline: Chrome/Edge 111, Safari 18, Firefox 144. **View transition "types" are not in Firefox**, and **cross-document transitions are not Baseline** (Chromium and Safari 18.2 only per one 2026 review). Use as progressive enhancement: fallback is an instant swap. Duplicate `view-transition-name` values on visible elements throw and skip the transition, so scope names by id. React 19.2 reportedly ships a `<ViewTransition>` component (single 2026 source; verify). |
| **Scroll-linked effects** | CSS scroll-driven animations | Availability is still limited across browsers; **use only for non-essential enhancement** (header border, progress). |
| **Overlay enter/exit inside shadcn/Base UI** | Base UI's transform-origin variable and enter/exit state attributes | Base UI exposes a transform-origin CSS variable for anchor-aware popovers (confirmed in a practitioner standards file); confirm the exact starting/ending-state attributes in the Base UI docs before wiring. |
| **Drag and drop** | `dnd-kit` with custom drop animation | Keep sensors and keyboard support; replace default drop animation with `spring-snappy`. |
| **Kanban (Kibo UI / ReUI)** | Restyle their default transitions | Replace with the tokens here. |
| **Charts (Evil Charts / Recharts)** | Configure animation to Section 8 | Evil Charts animates by default; align duration and easing, and disable replays. |
| **Toasts** | Sonner-style stacking (or the new shadcn Toast) | Verify it honors Reduce Motion and swipe dismissal. |
| **Bottom sheets with detents** | shadcn Drawer (Vaul-based; verify) | Confirm snap points and velocity handling. |
| **Success marks, rings, checks** | Inline SVG stroke animation | Small, no dependency. |
| **Lottie / Rive** | **Not used initially** | Adds weight and unpredictability; reconsider only for empty-state illustrations. |
| **Haptics** | Vibration API on supporting Android browsers; nothing on iOS Safari | Treat as optional enhancement; never required to understand feedback. |

**Testing:** verify on a real mid-range Android phone and an iPhone with Safari; record at slow speed; test with Reduce Motion enabled; use browser performance tools to check frame times; check that no animation delays input response.

---

## 12. Motion budget per screen

| Rule | Limit |
|---|---|
| T3 moments per screen visit | 1 |
| Elements animating simultaneously | 3 |
| Staggered items | 8 (then group) |
| Longest continuous animation | 720 ms (`t-hero`) |
| Infinite/looping animations | Spinner and skeleton breathing only |
| Charts entering on one screen | 2 |
| Layout-animated rows in a list | 100 visible |

---

## 13. Traceability: motion to features and problems

| Moment | Screens | Feature | Problems it supports |
|---|---|---|---|
| M01, M02 | S06, S07, S08 | F1, F2 | Setup speed (design rule 1); orientation |
| M03, M09 | S08, S14 | F6 | L10, P3.9: time awareness without stress |
| M04, M05 | S11 | F3 | P2.1-P2.4: fair ideation; decisive lock |
| M06 | S12 | F4 | L1, L2: clear plan validation; recover from bad AI output |
| M07, M08 | S14 | F6 | P3.1: shared picture of progress |
| M10 | Anywhere | F7 | P3.1: blockers surfaced fast |
| M11, M12 | S22 | F14 | P4.1-P4.6, D1-D12, W15: calm, verified submission |
| M13 | S24 | F19 | P6.1: retention and portfolio |
| Charts | S08, S10, S14, S17, S24 | F6, F9, F15, F16 | Comprehension of status |
| Reduce Motion, tiers | All | n/a | Accessibility; performance on modest devices; Speed Mode (L10) |

---

## 14. Handoff from `design.md`, assumptions, open questions

**Items `design.md` deferred to this file (all covered):** drag tilt (M08), Evil Charts static configuration (Section 8), skeleton motion (Section 9), loading spinner (Section 9), swipe row actions (Section 4.3), reduced-motion handling (Section 3), Speed Mode motion (Section 3.2).

**Assumptions:**
1. Default motion setting follows the system Reduce Motion setting; otherwise Full.
2. Speed Mode defaults to Reduced.
3. No sound.
4. Confetti and other celebratory particles are permanently out. If you disagree, tell me.
5. Rail magnification is optional and off in Speed Mode.

**Open questions:**
- Should the optional **velocity tilt on drag** ship in version 1, or be held back? (It is the most "designed" detail but is the first thing to cut for performance.)
- Do you want the **Wrapped** sequence to be replayable by a "Replay" link?
- Any interaction in Sections 5-7 you want quieter or livelier?

**Things to verify before building:** current Motion package options for CSS spring generation; the exact Base UI enter/exit attributes; React 19.2 `<ViewTransition>` behavior; Vaul snap-point behavior in the shadcn Drawer; Reduce Motion handling of every third-party component (Kibo Kanban, Evil Charts, Sonner).

---

## 15. Sources

| Claim | Source |
|---|---|
| Apple: add motion purposefully; use motion to communicate; example of minimizing a window to the Dock | https://developers.apple.com/design/human-interface-guidelines/foundations/motion |
| Apple: avoid animating frequent interactions; do not force people to wait for animations (third-party summary of the HIG; verify against Apple's page) | https://lobehub.com/skills/comeonoliver-skillshub-axiom-hig-ref |
| Springs described by duration and bounce; velocity preserved on interruption; bounce ranges; three presets (smooth, snappy, bouncy); mass/stiffness/damping conversion | https://developer.apple.com/videos/play/wwdc2023/10158/ ; https://developer.apple.com/videos/play/wwdc2023/10156/ ; https://wwdcnotes.com/documentation/wwdc23-10158-animate-with-springs/ |
| Reduce Motion: reduce rather than remove; replace slide with cross-fade; flashing limits | https://github.com/pragmamark/pragmaconf23/files/12859801/Animations_for_everyone___Amos_Gyamfi._Stefan_Blos.pdf ; https://github.com/iina/iina/pull/4871 |
| UI rules: under 300 ms; ease-out; origin-aware popovers; never scale(0); press scale 0.97; frequency tiers; keyboard actions not animated; transform/opacity only; interruptible springs; bounce 0.1-0.3 | https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md ; https://emilkowal.ski/ui/7-practical-animation-tips ; https://mcpservers.org/agent-skills/emilkowalski/animate (practitioner guidance, not Apple documentation) |
| Motion for React: LazyMotion to about 4.6 kB; layout animations and shared elements; MotionConfig reduced motion; Reorder; drag | https://motion.dev/docs/react-lazy-motion ; https://motion.dev/docs/react-motion-config ; https://motion.dev/llms.txt |
| View Transitions: same-document Baseline (Chrome 111, Safari 18, Firefox 144); types not in Firefox; cross-document not Baseline; duplicate names throw; React 19.2 ViewTransition | https://web-platform-dx.github.io/web-features-explorer/features/view-transitions ; https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available ; https://brainstormsandraves.com/css/view-transitions-2026/ ; https://www.testmuai.com/learning-hub/view-transitions-api-browser-support/ |
| CSS `linear()` easing Baseline | https://web-platform-dx.github.io/web-features-explorer/features/linear-easing |
| Scroll-driven animation availability (limited) | https://modern-css.com/reference/interop-2026 |
| Product context | `problem.md`, `ideation.md`, `tech_stack.md`, `design.md` |

*From general knowledge (not fetched this session): iOS 18 zoom navigation transition; SF Symbols effect names; Apple's numeric-text digit-roll behavior; the Apple Pay success animation style; WCAG 2.2.2 and 2.3.1; Dynamic Island morph; Dock magnification; Vibration API support limits; INP "good" threshold. Verify before treating as authoritative.*
