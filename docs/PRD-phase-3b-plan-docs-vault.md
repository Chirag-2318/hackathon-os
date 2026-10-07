# PRD — Phase 3b: Plan (Prompt Bridge) & Docs Vault

**Source documents:** `design.md`, `tech_stack.md`, `ideation.md`, `animations.md`.
**Assumed already built:** design tokens, components, app shell, global overlays, motion primitives, public/onboarding screens, Home, Room Overview, Brief, Team, and the full Ideation Board (all seven stages).

---

## 1. Phase goal

Build **S12 Plan (Prompt Bridge)** and **S13 Docs vault**. S12 facilitates generating the plan documents using AI, bridging to external tools or an internal managed pro tier, and ends with locking the plan. S13 provides a Notion/GitHub-style viewer and editor for the locked plan documents. The actual prompt generation and backend validation logic are mocked out; this phase focuses exclusively on the frontend UI shell.

---

## 2. In scope / Out of scope

### In scope
- **S12 Plan (Prompt Bridge)**
- **S13 Docs vault**
- **Signature Moment M06:** Prompt Bridge: validate and lock (both Validate and Lock tiers).
- **MSW Data Mocks:** Fixtures for S12 step states, validator responses, and S13 vault documents.

### Out of scope
- Any screen other than S12 and S13 (e.g., S14 Board).
- Actual backend AI prompt generation and response parsing.
- Actual LLM validation logic.
- Real GitHub integration (pushing to repo `/docs` is mocked as disabled).

---

## 3. Per-screen spec

### S12 Plan (Prompt Bridge)

**Layout & Components**
- **Mode Selector:** A segmented control at the top: `Prompt Bridge (free) | Your API key | Managed (Pro)`.
- **Vertical Stepper (C35):** Lists the 5 named steps: `1 PRD & MVP`, `2 Tech stack`, `3 Phases`, `4 Tasks`, `5 Demo & Q&A`.
- **Main Panel (Three-part per-step flow):**
  1. **Copy this prompt:** Shows character count and "Open in" outbound links to external AIs. Includes a code block (C30) with the generated prompt.
  2. **Paste the answer:** A textarea or dropzone (C34) for file drop.
  3. **Check it:** A "Validate" button.
- **Paste Validator Result:** Shows pass/fail rows. Fail rows expand to list exactly what is missing and provide a "Copy repair prompt" button.
- **Right Rail:**
  - **Context Pack Checklist:** Checkboxes indicating fields sent (`Idea`, `Rubric`, `Skills`).
  - **Privacy Note (Always Visible):** "This prompt contains your idea text. It goes to the AI service you paste it into."
  - **Upgrade Card (R1 style):** "Skip copy-paste with Pro".
- **AI-use Policy Gate:** If the Brief restricts AI use, a dark callout (C10d) obscures and disables the flow until the leader overrides it.
- **Final Step:** Review screen listing the generated files with a diff-like summary, followed by a "Lock plan" button.

**States & Vocabulary**
- Step states: `Not started`, `Prompt copied`, `Answer pasted`, `Validated`, `Locked`.

**Motion**
- **M06 (Prompt Bridge: validate and lock):** See Section 4.

**Feature Traceability**
- F4 (Free-tier planning). Problems addressed: L1, L2, L4, W2, W6.

### S13 Docs vault

**Layout & Components**
- **Three-pane Layout:**
  1. **File Tree:** Lists exactly 9 files: `PRD.md`, `PROBLEM.md`, `TECH_STACK.md`, `PHASES.md`, `MVP.md`, `CUT_LIST.md`, `RISKS.md`, `DEMO_SCRIPT.md`, `DECISIONS.md`. Each file row has a version chip and "edited by" meta.
  2. **Editor/Reader (C31):** Notion-like editor for the selected document.
  3. **Outline + History + Comments Pane:** Contextual meta pane on the right.
- **Top Actions:** "Export zip", "Push to repo `/docs`" (disabled with tooltip until GitHub connected).
- **Empty State:** CC0 illustration + "Generate your plan" link back to S12.

**Motion**
- Standard file tree selection highlight (moving pill). Version chips cross-fade on update.

---

## 4. Signature moment implemented this phase

### M06: Prompt Bridge: validate and lock
- **Trigger:** Pressing "Validate" during a step, or "Lock plan" at the final step in S12.
- **Tier:** T2 for Validate, T3 for Lock.
- **Description:**
  - **Copy:** Copy icon Swaps to check (1.6 s); code block shows a 1-time soft highlight fade on the copied text.
  - **Validate press:** Button width holds, label cross-fades to a spinner. On completion, results rows appear with a 40 ms stagger; each row's icon draws its check or cross.
  - **Pass:** Stepper circle fills with Draw and Bounce; the connecting line fills toward the next step.
  - **Fail:** Failing rows expand with `spring-smooth`; the summary chip performs a single small horizontal shake; the "Copy repair prompt" button gets a one-time soft color wash emphasis.
  - **Lock plan:** The nine plan-file rows appear one by one (60 ms stagger, max 8 shown then the ninth with the rest), each with a check Draw; a "Plan locked" seal (Success mark) settles with `spring-bouncy`; the Docs item in the sidebar increments its badge with a number roll.
- **Reduce Motion Fallback:** Results appear together; no shake.

---

## 5. Data/mock requirements

- **S12 Step States:** Fixtures simulating the progression (`Not started` → `Prompt copied` → `Answer pasted` → `Validated`).
- **Validator Results:** MSW mock responses for both a pass scenario and a fail scenario.
  - *Pass Fixture:* All criteria return true.
  - *Fail Fixture:* Returns pass/fail rows. Fail rows must explicitly list missing items (e.g., "Missing user roles", "Missing offline fallback") along with a repair prompt string.
- **AI-use Policy Gate:** The room's Brief mock must support an `aiRestricted` boolean to trigger the gate.
- **S13 Docs Vault:** Fixtures for the 9 listed markdown files, including mock content, version strings, and "edited by" attributions.

---

## 6. Navigation map

S11 Decide → S12 Plan (Prompt Bridge) → S13 Docs vault.
After locking the plan, the user is ready to proceed to **S14 Board** (built in a future phase).

---

## 7. Acceptance criteria

- S12 successfully replicates the 5-step vertical stepper, the 3-part interaction per step, and the right-rail context checklist.
- The AI-use policy gate in S12 correctly locks the UI when the room's policy restricts AI, requiring leader override.
- Paste validation properly renders pass/fail rows and triggers the M06 Validate animation (including the error shake on fail).
- The final "Lock plan" action triggers the M06 Lock choreography, rendering the 9 file rows.
- S13 correctly implements the three-pane layout and lists exactly the 9 required files.
- S13 top actions "Push to repo /docs" is visibly disabled with the correct tooltip.

---

## 8. Open questions — do not guess

- How does the leader override the AI-use policy gate exactly? Is it a single click on the callout button?
- What are the exact external AI links (e.g., ChatGPT, Claude, Gemini) to be provided in the "Open in" section?
- Does the S13 empty state appear only if S12 is completely empty/unlocked, or can the user view partial docs?
