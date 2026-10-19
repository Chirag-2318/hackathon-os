# Brag Plan: [brackit]

> /brag run for hackathon-os workspace
> Tone: "confident, punchy hackathon-demo energy; modern, clean, a little cinematic, never cringe"
> Output: brag-output/

---

## Step 1 Product Inspection — 9-Question Rubric

**1. What is the app?**
[brackit] is a hackathon OS — a real-time team workspace (React/Spring Boot/PostgreSQL) that takes a team from event brief intake through ideation, planning, Kanban board, pitch rehearsal, and final submission, all synchronized on one shared countdown clock.
Source: README.md line 3; frontend/src/features/landing/data/hero-copy.ts; docs/final-documentation/01-project-overview.md

**2. Most impressive claim?**
"Most teams don't lose because they can't code. They decide late, scope wrong, and run out of time."
Source: frontend/src/features/landing/data/hero-copy.ts — headingLead + lead verbatim

**3. Visual hook?**
Dark cinematic stage (#0E0E10 background, #F4F1EA cream text) with countdown clock T-03:12:47 and readiness rings filling up.
Source: frontend/src/features/landing/styles/landing.css; frontend/src/features/landing/data/stage-act.ts

**4. What to show from actual UI?**
8-stage workflow (Setup→Brief→Team→Ideate→Plan→Board→Pitch kit→Submit) from how-stages.ts. The Kanban board is the strongest "product doing its thing" moment.
Source: frontend/src/features/landing/data/how-stages.ts; frontend/src/features/landing/data/product-fixtures.ts

**5. Shortest satisfying video?** 20 seconds.

**6. Tone?**
- Preset: cinematic
- Creative direction: "confident hackathon team walking into the room already knowing the answer"

**7. Audio?**
Warm upbeat bed, vol-9 track (114.84 BPM), sparse cinematic SFX. One bell on SUBMITTED.

**8. Share caption?**
"We built [brackit] because hackathons aren't won in the code — they're won in the order. From the first brief to the final submit, on one clock."

**9. User flow worth showing?**
Room created → Board seeded (Kanban) → Pitch kit rehearsal → Submit countdown → SUBMITTED stamp.

---

## What is this app?

[brackit] is a hackathon OS — a room-based workspace that keeps a team on one clock from the first brief to the final submit. Brief, idea, plan, board, pitch, submit. In order. Without scatter.

---

## The angle

Most hackathon teams fail for the same boring reason: they never did things in the right order. [brackit] is the answer — not a smarter chat tool or a fancier Notion, but a structured room that knows what a hackathon looks like and puts every stage in front of you, one at a time. The video shows the room, not the marketing. Confident, not cringe.

---

## Hook (first 2-3 seconds)

Big, bold, dark-background type:
> "Most teams don't lose because they can't code."

One hard-cut to the next line. Drop straight into the product's own words (hero-copy.ts).

---

## Key moments (the middle)

1. Brief confirmed: 8 of 8 rules confirmed. Checkmarks. "Rules and rubric, confirmed by the leader."
   Source: how-stages.ts id:'brief' line; product-fixtures.ts BRIEF_FIXTURE confirmedText

2. Board alive: Kanban with three lanes. One blocked task visible. "The team always knows what is next and who is stuck."
   Source: how-stages.ts id:'build'; product-fixtures.ts BOARD_FIXTURE; room-grid.ts board tile line (verbatim)

3. Pitch kit: Rehearsal segment bar. "Rehearse out loud. Hear the hard questions first."
   Source: stage-act.ts STAGE_HEAD.line; how-stages.ts id:'present'

---

## Outro / punchline

Dark stage. Countdown: T-03:12:47. Then green SUBMITTED stamp. Then [brackit] wordmark.
Source: stage-act.ts LAUNCH.time, LAUNCH.stamp, LAUNCH.result (verbatim)

---

## User flow worth showing

Room → Board (Kanban with real lane structure) → Pitch kit rehearsal → Submit countdown → Submitted stamp.

---

## Tone

- Preset: cinematic
- Creative direction: "confident hackathon team walking into the room already knowing the answer"
- Interpretation: Big type arrives fast and holds. Hard cuts between stages. Dark stage palette makes the final submit moment feel earned. No background gradients, no particle effects. Motion is purposeful. Music is an upbeat bed that breathes.

---

## Format: landscape — 1920x1080
## Duration: 20 seconds

---

## Visual identity (from the project)

- Background (dark stage): #0E0E10 (--stage-ink, landing.css)
- Accent sun: #FDE781 (--stage-sun, landing.css)
- Accent orange: #FF7A1A (--stage-orange, landing.css)
- Accent mint: #A5EFBE (--stage-mint, landing.css)
- Accent sky: #B7D9FF (--stage-sky, landing.css)
- Accent lilac: #C4C5FC (--stage-lilac, landing.css)
- Text on dark: #F4F1EA (--l-cream, landing.css)
- Secondary text: #595959 (--l-ink-2-strong, landing.css)
- Display font: Instrument Serif (italic headings)
- Body font: Inter Variable (landing.css --l-font-ui)
- Mono font: JetBrains Mono Variable (clocks, code-like elements)
- Sources: landing.css :root tokens; landing-page.tsx font imports

---

## Share copy (draft)

"We built [brackit] because hackathons aren't won in the code — they're won in the order. From the first brief to the final submit, on one clock."

---

## Audio direction

- Role: Warm upbeat bed; confident energy without being frantic
- Music: happy-beats-business-moves-vol-9-by-ende-dot-app.mp3 (mid-energy, 114.84 BPM)
- Music treatment: Fade in at full volume from 0s. Hold at 0.35 through transitions. Fade out in final 1.5s.
- Music cue guidance (bundled preset):
  - Preset: ~/.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json
  - Tempo: 114.84 BPM (beat interval ~0.52s)
  - Beat-lock targets:
    - Scene 2 reveal -> target 6.34s // beat-locked: 6.34s (intensity 1.00, strong_beat)
    - Scene 3 board reveal -> target 10.54s // beat-locked: 10.54s (intensity 1.00, strong_beat)
    - Scene 4 pitch kit -> target 12.65s // beat-locked: 12.65s (intensity 1.00, strong_beat)
  - Sequential board lanes: snap first lane to 10.54s, second to 11.06s, third to 11.60s (every other beat, each holds ~1.0s)
- Audio-reactive treatment: subtle; use music RMS to warm dark background on scene peaks; soft treble glow on strong beat moments. No waveform/equalizer visuals.
- SFX posture: sparse/moderate; 3 well-placed cinematic cues.
- Audio-coupled moments:
  - Hook line arrivals: interface/drop_001.ogg, interface/drop_002.ogg per line (vol 0.60)
  - Board lane arrivals (x3): casino/card-place-2.ogg (vol 0.65)
  - SUBMITTED stamp: impact/impactBell_heavy_000.ogg (vol 0.80) — the payoff bell
- Restraint rule: SFX must not compete with music bed or distract from text. Bell is the only loud moment.

---

## Music cue guidance

Track: happy-beats-business-moves-vol-9-by-ende-dot-app.mp3
Preset: bundled at ~/.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json
Tempo: 114.84 BPM

Strong cues (top 3 to use):
1. 6.34s (intensity 1.00, strong_beat) -> Scene 2 headline beat-lock
2. 10.54s (intensity 1.00, strong_beat) -> Scene 3 board first lane beat-lock
3. 12.65s (intensity 1.00, strong_beat) -> Scene 4 headline beat-lock

Beat grid (spacing ~0.52s): 1.07, 1.59, 2.12, 2.65, 3.18, 3.70, 4.23, 4.75, 5.28, 5.80, 6.34, 6.86, 7.40, 7.92, 8.44, 9.50, 10.01, 10.54, 11.06, 11.60, 12.12, 12.65, 13.18, 13.70

---

## Storyboard

Total: 20 seconds.

### Scene 1 — Hook — 3s (music start: 0.0s)
Visual: Full-bleed dark #0E0E10. Two lines of large cream Inter Variable bold ~52px:
  Line 1: "Most teams don't lose because they can't code." (slams in at 0.3s)
  Line 2: "They decide late, scope wrong, and run out of time." (slams in at 1.4s)
Both lines hold until 3.0s.
Source text: hero-copy.ts headingLead + lead (adapted)
Sequential/interaction: yes — Line 1 then Line 2, each 0.25s fast translate-Y-in then held.
Audio intent: cold open; music fades in, words hit.
Audio-coupled idea: interface/drop_001.ogg at 0.3s (Line 1); interface/drop_002.ogg at 1.4s (Line 2). Vol 0.60.
Music: upbeat bed fades in from 0s.
Transition mood: hard cut -> Scene 2

### Scene 2 — Reveal — 3s (music: 3.0s; scene: 3.0s-6.0s)
Visual: Light background (#FFFFFF / shell color). [brackit] wordmark slides in from top (0.3s).
Headline (Instrument Serif italic): "From the first brief to the final submit, on one clock." (fades up at 0.6s)
Source: hero-copy.ts lead (adapted)
Bottom-right card: mono font (JetBrains Mono), brief confirmation chip: "8 of 8 rules confirmed" with green checkmark (slides in from right at 1.3s of scene).
Source: product-fixtures.ts BRIEF_FIXTURE confirmedText
Beat-locked: headline reveal targets 6.34s (music) = 3.34s into scene // beat-locked: 6.34s
Sequential/interaction: Wordmark -> Headline -> Card, three arrivals.
Audio intent: confident brand arrival.
Audio-coupled idea: interface/drop_001.ogg at scene+0.3s (wordmark). Nothing else.
Music: warm bed continues.
Transition mood: clean wipe -> Scene 3

### Scene 3 — Board: The team always knows — 5s (music: 6.0s; scene: 6.0s-11.0s)
Visual: Dark background #0E0E10. Kanban board — three lane columns slide in one by one:
  Lane 1 "To do" (2 tasks): beats to music at 10.54s (4.54s into scene)
  Lane 2 "In progress" (2 tasks, one blocked): at 11.06s (5.06s into scene)
  Lane 3 "Done" (2 tasks): at 11.60s (5.60s into scene... but scene ends at 11.0s)

NOTE: Scene 3 is 5s long (6.0s-11.0s). Music beat 10.54s is 4.54s into scene. The lane sequence:
  Lane 1 arrives at scene time 3.8s (music 9.8s, close to beat 9.50s / 10.01s)
  Lane 2 arrives at scene time 4.3s (music 10.3s, close to beat 10.01s)
  Lane 3 arrives at scene time 4.8s (music 10.8s)
  [Revised: distribute 3 lanes across last 2s of scene for visual clarity]
  Actually use: Lane 1 at scene 2.8s (music 8.8s, beat 8.44s), Lane 2 at 3.4s (beat 8.96s), Lane 3 at 3.9s (beat ~9.50s) — all well within scene duration.

Below the board (after all lanes visible): small cream text:
  "The team always knows what is next and who is stuck."
Source: room-grid.ts board tile line (verbatim)
The blocked task chip (OS-08, In progress) glows amber/orange (#FF7A1A).
Sequential/interaction: yes — 3 lanes arrive one by one with card sounds.
Audio intent: the product coming alive.
Audio-coupled idea: casino/card-place-2.ogg per lane (vol 0.65), at the beat-aligned arrival times above.
Music: upbeat bed; audio-reactive dark bg warms on lane beats.
Beat-locked: Lane 1 at music beat 8.44s (scene 2.44s) // beat-locked: 8.44s
Transition mood: clean wipe -> Scene 4

### Scene 4 — Present: Walk in ready — 3s (music: 11.0s; scene: 11.0s-14.0s)
Visual: Dark stage #0E0E10. Left side: the pitch segment bar (from REHEARSAL.segments):
  "Problem 0:30 | Solution 0:45 | Demo 1:00 | Impact 0:30 | Ask 0:15"
Source: stage-act.ts REHEARSAL.segments
Right side: Instrument Serif italic, large:
  "Walk in ready."
Source: stage-act.ts STAGE_HEAD.headingLead + STAGE_HEAD.headingEm (verbatim)
Below headline: smaller cream text:
  "Rehearse out loud. Hear the hard questions first. Submit with margin."
Source: stage-act.ts STAGE_HEAD.line (verbatim)
Headline "Walk in ready." slams in targeting music 12.65s = scene time 1.65s // beat-locked: 12.65s
Sequential/interaction: Segment bar arrives (0.3s) -> headline slams in (1.65s).
Audio intent: growing anticipation — close to submit now.
Audio-coupled idea: impact/impactSoft_medium_001.ogg at headline slam-in (1.65s into scene). Vol 0.70.
Music: same bed, audio-reactive glow on headline text.
Transition mood: hard cut -> Scene 5

### Scene 5 — Submit: Outro/punchline — 6s (music: 14.0s; scene: 14.0s-20.0s)
Visual: Full-bleed dark #0E0E10. Center: countdown clock in JetBrains Mono, large:
  "T-03:12:47"
Source: stage-act.ts LAUNCH.time (verbatim)
Clock arrives at 0.3s into scene. Holds for 1.5s.

At scene 1.5s: green SUBMITTED stamp sweeps in using ease-stamp (cubic-bezier(0.5,0,1,1)):
  "SUBMITTED"
  "with margin."
Source: stage-act.ts LAUNCH.stamp + LAUNCH.result (verbatim)

At scene 1.5s: impactBell_heavy_000.ogg fires. Vol 0.80.

At scene 3.5s: clock and stamp fade out gently (0.4s).
At scene 3.8s: [brackit] wordmark fades in center, large.
Small caption below: "[brackit] · a hackathon OS"
Source: hero-copy.ts eyebrow (verbatim)
Wordmark holds to scene end (6.0s).
Music fades from 0.35 to 0.0 starting at scene 4.5s (music 18.5s), reaching 0 at scene 6.0s (music 20.0s).

Sequential/interaction: clock -> SUBMITTED stamp sweeps -> wordmark fades in.
Audio intent: earned cinematic payoff. Bell punctuates submit. Music fades as wordmark holds.
Audio-coupled idea: impactBell_heavy_000.ogg at stamp landing. Music fades to 0 by end.
Music: fades out in final 1.5s.
Transition mood: end.

---

Scene duration check:
- Scene 1: 3s
- Scene 2: 3s
- Scene 3: 5s
- Scene 4: 3s
- Scene 5: 6s
- Total: 20s [OK, within 15-25s window]

**Music mood for this video:** Upbeat, mid-energy corporate bed — warm, confident, not frenetic.
**Audio summary:** Music fades in at scene 1, holds at 0.35 through product beats, three beat-locked reveals (8.44s, 12.65s from plan; 6.34s for reveal scene), sparse SFX: drop on hook lines, card-place on board lanes, bell on SUBMITTED, music fades to silence as wordmark holds.
