# Hyperframes Composition Brief: [brackit]

## Objective
Create a 20-second launch-style brag video for [brackit], a hackathon OS.

## Output
- Composition directory: brag-output/composition/
- Rendered video: brag-output/brag.mp4
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: C:/Users/Admin/.antigravity/hackathon-os
- Primary files read: README.md, docs/final-documentation/01-project-overview.md, frontend/src/features/landing/data/hero-copy.ts, frontend/src/features/landing/data/how-stages.ts, frontend/src/features/landing/data/product-fixtures.ts, frontend/src/features/landing/data/stage-act.ts, frontend/src/features/landing/data/room-grid.ts, frontend/src/features/landing/styles/landing.css, frontend/src/features/landing/landing-page.tsx
- Product name: [brackit]
- Tagline / strongest claim: "Most teams don't lose because they can't code. They decide late, scope wrong, and run out of time."
- Key UI or visual moment to recreate: The Kanban board with three lanes (To do / In progress / Done), one blocked task chip; the SUBMITTED stamp over the countdown clock T-03:12:47.
- Copy that must appear verbatim:
  - "Most teams don't lose because they can't code."
  - "They decide late, scope wrong, and run out of time."
  - "8 of 8 rules confirmed" (or "8 of 8 rules confirmed by the leader")
  - "The team always knows what is next and who is stuck."
  - "Walk in ready."
  - "Rehearse out loud. Hear the hard questions first. Submit with margin."
  - "T-03:12:47"
  - "SUBMITTED"
  - "with margin."
  - "[brackit] · a hackathon OS"

## Creative Direction
- Tone preset: cinematic
- Creative direction: "confident hackathon team walking into the room already knowing the answer"
- Interpretation: Big type arrives fast (0.25s ease-out translate) and holds long enough to read. Hard cuts between stages. Dark stage palette (#0E0E10) makes the submit moment feel earned. Motion is purposeful. No abstract filler, no gradient backgrounds, no particle effects.
- Angle: [brackit] is the answer to the ordering problem. The video shows the product doing its job — brief confirmed, board alive, pitch rehearsed, submitted with margin. Confident, never cringe.
- Hook: Two lines of large cream text on dark background. Line 1 arrives at 0.3s, Line 2 at 1.4s. No preamble.
- Outro / punchline: Countdown clock T-03:12:47 → SUBMITTED stamp sweeps in (ease-stamp) → wordmark fades in, holds 2s.
- Avoid:
  - Generic SaaS language ("streamline", "productivity", "workflow")
  - Abstract filler visuals, gradient washes, particle systems
  - Unrelated visual redesign outside the product's color tokens

## Visual Identity
- Background dark (stage): #0E0E10 (--stage-ink from landing.css)
- Background light: #FFFFFF (shell, light sections)
- Text on dark: #F4F1EA (--l-cream from landing.css)
- Secondary text: #595959 (--l-ink-2-strong from landing.css)
- Accent sun: #FDE781 (--stage-sun from landing.css)
- Accent orange: #FF7A1A (--stage-orange from landing.css)
- Accent mint: #A5EFBE (--stage-mint from landing.css)
- Accent sky: #B7D9FF (--stage-sky from landing.css)
- Accent lilac: #C4C5FC (--stage-lilac from landing.css)
- Blocked task accent: #FF7A1A (--stage-orange)
- Confirmed/success accent: #A5EFBE (--stage-mint) or standard green
- Display font: Instrument Serif (italic, serif) — for headings with em elements
- Body font: Inter Variable — for all UI copy and body text
- Mono font: JetBrains Mono Variable — for countdown clock, confirmation chips
- Visual references from the project:
  - Kanban board lanes from BOARD_FIXTURE (product-fixtures.ts)
  - Brief confirmation "8 of 8 rules confirmed" (product-fixtures.ts BRIEF_FIXTURE)
  - Pitch rehearsal segment bar (stage-act.ts REHEARSAL.segments)
  - Countdown clock T-03:12:47 (stage-act.ts LAUNCH.time)
  - SUBMITTED stamp + "with margin." (stage-act.ts LAUNCH.stamp, LAUNCH.result)

## Storyboard
Use brag-output/brag-plan.md as the creative contract.

Scene summary:
1. Hook — 3s — Two cream lines on dark: "Most teams don't lose because they can't code." then "They decide late, scope wrong, and run out of time." Each must be fully visible and readable. Line 2 arrives at 1.4s, holds.
2. Reveal — 3s — Light bg. [brackit] wordmark, Instrument Serif headline "From the first brief to the final submit, on one clock.", green confirmation chip "8 of 8 rules confirmed" (JetBrains Mono). Headline beat-locked to music 6.34s.
3. Board — 5s — Dark bg. Kanban: 3 lanes arrive sequentially. Blocked task glows orange. "The team always knows what is next and who is stuck." Lane 1 beat-locked to music 8.44s.
4. Present — 3s — Dark stage. Pitch segment bar left. "Walk in ready." (Instrument Serif italic) slams in beat-locked to music 12.65s. Sub-text: "Rehearse out loud. Hear the hard questions first. Submit with margin."
5. Submit — 6s — Dark. Countdown "T-03:12:47" holds 1.5s. SUBMITTED stamp sweeps in (ease-stamp), impactBell fires. Clock/stamp fade. [brackit] wordmark fades in, holds 2s. Music fades to 0 in final 1.5s.

## Audio
- Audio role: warm upbeat bed; confident, not frantic
- Audio arc: Music fades in at scene 1. Holds at 0.35 through product beats. Sparse SFX at key moments. Fades to 0 in final 1.5s as wordmark holds.
- Music: assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3
- Music treatment: Start at 0s, volume 0.35. Hold through all scenes. Fade from 0.35 to 0.0 between 18.5s and 20.0s.
- Music cue guidance:
  - Preset: C:/Users/Admin/.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json
  - Tempo: 114.84 BPM (beat interval ~0.52s)
  - Strong cues to beat-lock:
    - 6.34s (intensity 1.00) -> Scene 2 headline reveal // beat-locked: 6.34s
    - 8.44s (intensity 0.99) -> Scene 3 Lane 1 arrival // beat-locked: 8.44s
    - 12.65s (intensity 1.00) -> Scene 4 "Walk in ready." slam-in // beat-locked: 12.65s
  - Sequential board lanes: Lane 1 at 8.44s, Lane 2 at ~8.96s, Lane 3 at ~9.50s (every other beat, each holds ~0.9s+)
- Audio-reactive treatment: subtle; use music RMS to warm the dark backgrounds slightly; give the hero text a soft treble glow on the strong beat moments. No waveform/equalizer visuals, no strobing.
- Audio-coupled moments:
  - Scene 1, Line 1 arrival (0.3s): interface/drop_001.ogg — soft pop-in
  - Scene 1, Line 2 arrival (1.4s): interface/drop_002.ogg — soft pop-in
  - Scene 3, Lane 1 (8.44s): casino/card-place-2.ogg
  - Scene 3, Lane 2 (~8.96s): casino/card-place-2.ogg (or card-place-3.ogg for variety)
  - Scene 3, Lane 3 (~9.50s): casino/card-place-2.ogg
  - Scene 5, SUBMITTED stamp (music ~15.5s): impact/impactBell_heavy_000.ogg
- SFX selection guidance: Prefer low/medium HF-risk sounds for polished moments (interface/drop_*, casino/card-place-*). The bell (impactBell_heavy_000.ogg) is the single loud accent.
- SFX analysis guidance: C:/Users/Admin/.agents/skills/brag/assets/sfx/sfx-analysis.json — use lower high-frequency-risk sounds for repeated/polished moments.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on implemented animation.
- Audio files: Copy chosen music and SFX into brag-output/composition/assets/

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, hyperframes-cli domain skills.
/brag is its own workflow — do NOT enter the hyperframes entry-point intent interview or route into its generic promo/launch-video workflow.

Requirements:
- Show at least one real product UI element: Kanban board (from BOARD_FIXTURE) and the SUBMITTED countdown (from LAUNCH in stage-act.ts).
- Keep all text readable: hook lines hold 1.5s+ after arrival; scene 5 wordmark holds 2s.
- Total duration: exactly 20 seconds.
- Include music/SFX as specified.
- Beat-lock the 3 major reveals listed above (±0.15s tolerance).
- Run npx hyperframes check before rendering — fix all errors.
- Contrast: all text on dark (#0E0E10 bg) must use #F4F1EA or brighter. All text on light (#FFF bg) must pass WCAG AA.
