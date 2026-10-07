
```
You are writing a Product Requirements Document (PRD) for ONE phase of a frontend build — the final phase. This PRD will be handed directly to an AI coding agent (Antigravity), which has ALREADY built every prior phase (design system/shell/overlays/motion, public/onboarding, command center, ideation/plan, all Build-phase tools, Pitch/Demo/Submission, Readiness/Retro, Prep/Crowd Check/Tool Directory/Settings). Do not re-explain those — assume they exist. This phase adds new screens ONLY, and closes out the frontend build.

I am attaching five source files: problem.md, ideation.md, tech_stack.md, design.md, animations.md. Treat these as your ONLY source of truth. Do not invent, assume, or infer any fact, filter, or behavior not explicitly present in these files. If something this phase needs is missing or ambiguous, list it under "Open questions — do not guess" instead of filling it in yourself.

## Phase scope: Phase 6b — Notifications, Mentor View, Speed Mode & System Pages

Build exactly these screens, and no others, from design.md Section 6:
- S29 Notifications and activity
- S30 Mentor view (read-only)
- S31 Speed Mode (full content — the icon-rail shell was already built in Phase 0b; this phase builds the Clock/Now/Next up/Blockers/Quick capture content, the yellow event card, and the category list)
- S32 System pages (403, 404, 500, offline, maintenance)

For S29, reproduce the exact inbox list (avatar, title, one-line body, time), the exact unread-row styling (black fill/white text in light theme, cream fill in dark theme), and the exact filter set (All, Mentions, Blockers, System).

For S30, reproduce the exact reduced sidebar (Summary, Plan, Board snapshot, Ask), the read-only chip in the top bar, and the "Ask a mentor" card (context summary display + question field) with no edit controls anywhere on the screen. State explicitly that the actual context-packaging logic is backend — this phase builds the UI display of already-packaged mocked context only.

For S31, reproduce the exact five-part column (Clock in Display size showing time to next checkpoint and to submission; Now — my current task as a purple task card per R6 with checklist/progress ring/"Mark done"; Next up — two compact task rows; Blockers — count and list with dark callout when any; Quick capture — single "Add a task or note" field), the yellow event card (next checkpoint, Details/Dismiss buttons), the category list with count badges (Urgent, Build, Docs, Pitch, used as a filter), compact density, and the dark-theme-default rule (user can override).

For S32, reproduce all five exact states (403 with its "Ask the leader for an invite" message and join-code field; 404; 500; offline with banner and last-synced time; maintenance), each using the illustration slot / one headline / one action pattern described. Cross-reference animations.md Section 9 for how these states animate in.

Apply M10 "'I'm blocked': FAB to dialog and back" from animations.md Section 7 to the blocker FAB's real trigger points in S31 (the dialog itself was already stubbed as a global overlay in Phase 0b — this phase wires the trigger, it does not rebuild the dialog). Apply Section 9's loading/empty/error/offline motion patterns to S32's five states.

## Anti-hallucination rules (apply to every section you write)
- Do not invent additional Notifications filters, additional System page states, or additional Speed Mode column items beyond what's listed.
- Do not invent the actual mentor-context-packaging logic — this phase builds the UI (display + question field) only, against mocked data.
- Do not invent additional crowdedness-meter or category-list items beyond what's given (this phase's category list is Urgent/Build/Docs/Pitch only).
- Every system-page string (especially the 403 message and join-code field) must be reproduced exactly.
- This is the final frontend phase: verify, rather than assume, that every screen S01–S32 across all 14 phases has now been accounted for somewhere; if this PRD notices any screen from design.md Section 6 that was never covered by an earlier phase's scope, flag it explicitly under Open Questions rather than silently building it here or silently dropping it.

## Required structure of the PRD you generate
1. **Phase goal**
2. **In scope** / **Out of scope**
3. **Per-screen spec** — S29, S30, S31, S32: layout, components (existing + any new, fully specified), content/copy (verbatim where given), all listed states, responsive behavior, motion (cited), feature traceability
4. **Signature moment and system motion implemented this phase** — M10, plus Section 9's patterns applied to S32
5. **Data/mock requirements** — MSW fixtures needed, shaped only from displayed fields
6. **Navigation map** — including how error/system pages are reached
7. **Final frontend acceptance criteria** — since this is the last phase, include a full-frontend checklist: every screen S01–S32 exists and is reachable, dark theme works everywhere, Reduce Motion works everywhere, responsive breakpoints hold everywhere, no hardcoded colors/spacing outside tokens, AGENTS.md rules haven't been violated anywhere in the build, and a cross-check confirming no screen from design.md Section 6 was missed across all 14 phases
8. **Open questions — do not guess**

## Output format
Output ONLY the PRD as a single Markdown document, ready to save as `PRD-phase-6b-notifications-mentor-speed-system.md`. Do not add commentary before or after it.
```

---

## How to use this file, phase by phase

1. Open Phase 0a's "Generate-PRD prompt" block.
2. Copy it exactly, in full.
3. Start a fresh Claude conversation (or this one, your call) and attach: `problem.md`, `ideation.md`, `tech_stack.md`, `design.md`, `animations.md`.
4. Paste the copied prompt as your message.
5. Claude returns a PRD `.md` file for that phase only.
6. Save that PRD, hand it to Antigravity as its spec, and let it build against it — nothing else.
7. Once Antigravity finishes and you've checked its output against that phase's acceptance criteria, come back here, move to the next phase in order (0a → 0b → 1a → 1b → 2a → 2b → 3a → 3b → 4a → 4b → 5a → 5b → 6a → 6b), and repeat.

Do not attach a previous phase's *generated PRD* to the next Generate-PRD prompt — always attach the same five original source docs. Each prompt already tells Claude what prior phases exist and to assume them; re-attaching old PRDs risks Claude treating your own generated (possibly imperfect) PRD as a new source of truth, which compounds errors across phases instead of always grounding in the original five docs.
