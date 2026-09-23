# ideation.md: What the Platform Gives a Hackathon Team

**Status:** Step 2 of the project (feature ideation). Follows `problem.md`.
**Written:** 19 Sep 2026
**Working title:** "Hackathon OS" (placeholder; rename later)

IDs like **P3.2**, **L1**, **W2**, **D4** point back to `problem.md`. Every feature below exists because of at least one of them, so nothing here is "nice to have for its own sake".

---

## 1. The idea in one paragraph

A team room that carries a hackathon team from **"we just read the problem statement"** to **"we submitted a complete, rehearsed entry"**, in a fixed, time-aware sequence. The leader enters the event's rules; the whole team brainstorms in a structured board; an AI planning step turns the ideas into project files (PRD, tech stack, phases, MVP); a task board runs the build against a *hackathon clock* with checkpoints; and dedicated studios handle GitHub structure, APIs, diagrams, the pitch deck, the demo video, and the submission. After the event, the room becomes a retrospective and a portfolio entry.

**It is not a Jira clone.** Jira tracks tickets. This tracks **decisions, deadlines, and readiness**, because `problem.md` showed that teams mostly lose on *sequencing and judgment*, not on lacking a ticket list.

---

## 2. Design rules (derived from problem.md)

These are the rules every feature must obey. If a feature breaks one, redesign it.

1. **Faster to start than a WhatsApp group.** Tool overhead is itself a hackathon failure mode (problem.md, Section 8). Target: **a usable room in under 3 minutes**, with a "Speed Mode" for events already running.
2. **Opinionated, not configurable.** Teams have no time to design a workflow. Defaults first; customization is hidden.
3. **Checkpoints over tickets.** The core unit is "Is the core flow running yet? Yes/No", not "TASK-142".
4. **The clock is a first-class object.** Everything is shown relative to the event's start, feature freeze, and submission deadline.
5. **Rules are data.** Each event's rules become checklists the platform enforces, because 12 kinds of rule-based elimination exist (D1-D12).
6. **Works offline and on bad venue wifi.** Wifi failure is common at events (P5.1). The room must load from cache and export everything as files.
7. **AI assists; the team owns.** Unread AI output was a documented cause of losing (P3.10, L7). The platform must push the team to *understand* what it generates.
8. **Do not homogenize teams.** If every team feeds the same prompts to the same models, all teams converge on the same plans, which contradicts differentiation (L6, W1). Plans must be built from *the team's own ideas*.

---

## 3. Core objects (shared vocabulary)

| Object | Meaning |
|---|---|
| **Room** | One team's workspace for one hackathon |
| **Brief** | The event's rules, rubric, deadlines, eligibility, problem statement |
| **Idea** | One member's proposal, in a fixed template |
| **Plan** | Set of generated project files (PRD, stack, phases, MVP, cut list, etc.) |
| **Phase** | A time-boxed stretch of the hackathon with an exit checkpoint |
| **Task** | A unit of work assigned to a person and linked to a phase |
| **Checkpoint** | A yes/no gate ("core flow runs end to end?") |
| **Artifact** | Anything produced: docs, diagrams, deck, video, repo links |

---

## 4. What happens when a user lands on the platform

1. **Landing page.** Two big actions: **Create a team room** or **Join with an invite link**. A third small link: **Browse playbooks** (no login needed).
2. **Sign in.** GitHub and Google login (GitHub gives the repo features for free later).
3. **Pick the situation:**
   - **Prep Mode**: the event hasn't started (days ahead).
   - **Speed Mode**: the event is live and the clock is running (fewest possible screens).
   - **Explore**: just looking at playbooks and templates.
4. **Create the room:** name, event template (see F20), start/end time and timezone. Optionally paste the event page link or text.
5. **You are the leader.** You get main access and an invite link for teammates.
6. **First screen is a checklist, not a blank page:** "1) Add the event rules, 2) invite the team, 3) start ideation." Each item is one click.

---

## 5. Roles and permissions

| Role | What they can do |
|---|---|
| **Leader** (the person who created the room; can be transferred) | Full access: edit Brief, lock decisions, assign tasks, change phases, invite/remove members, submit final checklist |
| **Captain** (may be the same person as leader) | The single point of contact for organizers and mentors (P3.8); owns deadlines |
| **Member** | Post ideas, vote, edit assigned tasks, comment, use all studios |
| **Role tags** (Frontend, Backend, ML/AI, Design, Presenter, Domain expert, QA/Demo operator) | Not permissions, but used for the skill-gap check, task suggestions, and presenter/operator split (P5.4) |
| **Guest / Mentor** (later) | Read-only room summary; can leave comments |

---

## 6. Feature-by-feature walkthrough

Each feature uses the same layout: **What you see**, **What you do**, **Why it exists**, **Free vs Pro**, **Notes / risks**.

### F1. Hackathon Brief (rules, rubric, deadlines hub)

- **What you see:** One page that holds everything about the event, in structured cards: problem statement, judging rubric with weights, deadlines (with a countdown and timezone), team eligibility rules, allowed/forbidden tech, AI-use policy, required deliverables (video? repo? PPT?), tracks and sponsor prizes, judging format (live booth, presentation, async video).
- **What you do:** The **leader** pastes the raw event text. The platform structures it (using the Prompt Bridge from F4 in free mode; automatic in Pro). The leader reviews and confirms. You can also fill it in by hand.
- **What you get out of it:**
  - **Rubric Card**: criteria + weights pinned at the top of every screen, so "re-read the rubric before every major decision" (W5) is one glance.
  - **Eligibility Check**: a checklist run against your team (size, same-college rule, mandatory member types, unique name rules).
  - **Rules Checklist**: every hard rule as a tick-box (e.g., "start coding only after kickoff", "video max 2 minutes", "all members registered on the submission platform").
  - **Prize Targeting**: pick the tracks/sponsor prizes you are going for; each brings its own requirements (e.g., "must use sponsor API").
  - **Format Profile**: tells later features how to behave (live demo vs video, PPT-heavy vs demo-heavy).
- **Why it exists:** P0.1, P0.4, P0.5, D1-D12, L4, L8, W5. The problem.md showed some teams are eliminated on rules before quality is judged, and the rules differ per event.
- **Free vs Pro:** Free: manual entry or Prompt Bridge extraction. Pro: paste a link and it parses automatically.
- **Notes:** Extraction can be wrong. **Every extracted rule needs a "confirm" tick from the leader**, and the original text stays visible next to it.

### F2. Team Room (setup, roles, charter)

- **What you see:** Member list with role tags, skills, and availability; a **Skill-Gap Meter** showing which capabilities the team covers (build, design, presentation, domain, AI) and which are missing.
- **What you do:** Members join by invite link, pick role tags, and fill a 60-second profile. The leader assigns the captain. The team completes a **Team Charter** in 5 minutes:
  - Goals poll (win / learn / portfolio / all three) to surface mismatched expectations (P1.4)
  - Commitment check ("how many hours can you really give?") (P1.3)
  - Feedback norms card ("comments are about the work, not the person") (P3.12)
  - Quick intro prompts for strangers who just teamed up (P1.2)
- **Why it exists:** P1.1-P1.6, L5, L9, W9.
- **Free vs Pro:** All free.
- **Notes:** The Skill-Gap Meter can only *warn* ("no one has presentation or design"); it cannot fix a bad team. That is fine: an early warning at hour 0 is still valuable.

### F3. Ideation Board (everyone's view, then the decision)

This is your "everyone gives their thoughts" idea, structured so it produces a *decision*, not just a pile of sticky notes. *(I read your "auja board" as a shared collaborative brainstorm board. Correct me if you meant something else.)*

**The flow (each stage is time-boxed by the leader):**

| Stage | What happens | Why |
|---|---|---|
| 1. **Silent solo round** | Each member writes ideas privately, using the **Idea Card** template. Nobody sees others' cards yet. | Prevents loud voices or the first idea from anchoring the group |
| 2. **Reveal** | All cards appear at once, anonymous or named (leader's choice) | Everyone's view is visible on equal footing |
| 3. **Research attachments** | Members attach quick notes, links, prior art, competing products, user quotes to any card | Ideas get grounded in something real (P2.2) |
| 4. **Structured critique** | Each idea is rated 1-5 on: rubric fit, finishable in the time, differentiation, real user clarity, team skill fit | Turns opinions into comparable numbers |
| 5. **Stress Test** | The platform asks the hard questions per idea (see below) | Catches overscope and crowded ideas early (L2, L6) |
| 6. **Vote** | Anonymous vote on the shortlist | Everyone has a say |
| 7. **Leader decides** | Leader locks the choice. Decision timer applies (default 10 minutes once voting ends) | Avoids the multi-hour debates from P2.4 |

**The Idea Card template (kept short on purpose):**
- Who is this for? (a *specific* person, not "students")
- What is their problem, in one sentence?
- **One-sentence identity:** "This is a tool that does X for Y." (W1)
- The core flow (3-5 steps)
- The "wow moment" (what a judge sees in the first minute)
- Riskiest assumption
- Tech needed and who on the team can build it

**Stress Test questions (asked for each shortlisted idea):**
1. Could this be built end to end in your time, by your team's actual skills? (L2)
2. Does the core demo work without third-party services staying up? (P3.11)
3. Can a judge understand it in 30 seconds?
4. Which 5 other teams are likely to build this? What makes yours different? (L6)
5. Have you talked to, or can you quickly talk to, one real user? (P2.2)
6. Which rubric criteria does it score well on, and which poorly?

- **Why it exists:** P2.1-P2.5, L2, L6, W1, W3, W4.
- **Free vs Pro:** The board and voting are free. The **AI Stress Test** runs through the Prompt Bridge (free) or automatically (Pro).
- **Notes:** The board is the platform's best defense against "everyone builds the same AI-generated idea" (design rule 8): the plan is built from *your team's cards*, not from a blank prompt.

### F4. Plan Generator (turn ideas into a plan)

Once the idea is locked, the platform builds a plan from: the Brief (rubric, rules), the winning Idea Card, team skills, and the time budget. This is where your LLM question matters.

**The honest constraint:** good planning needs a strong model, and API access is billed separately from free chat subscriptions, so many students don't have it. So there are three ways to run the same planner:

| Mode | How it works | Cost to user | Cost to platform |
|---|---|---|---|
| **A. Prompt Bridge (free tier)** | The platform builds the prompts. The user copies each one into **any free AI chat** (Claude, ChatGPT, Gemini, etc.), then pastes the answer back. The platform validates it and turns it into the room's files and tasks. | Free | ~Zero |
| **B. Bring Your Own Key (BYOK)** | The user pastes their own API key; the platform calls the model directly | Their API usage | Low |
| **C. Managed (Pro)** | The platform's own model access, with the agentic planner (see below) | Subscription | Real, must be priced in |

**How the Prompt Bridge works (the free-tier heart of the product):**

1. **Context pack.** The platform compresses the room into a compact block (rubric, rules, idea, skills, time). This step needs *no AI*: it is templating.
2. **Prompt chain, not one giant prompt.** Free chats have message and length limits, so the plan is produced in **4-5 short prompts**, each reusing a short summary of the previous answer:
   - Prompt 1: PRD and MVP scope
   - Prompt 2: Tech stack and architecture (matched to the team's skills)
   - Prompt 3: Phases, cut list, and risks
   - Prompt 4: Tasks, assigned by role
   - Prompt 5: Demo script and likely judge Q&A
3. **Strict output format.** Each prompt ends with "reply only in this format". Documents come back as Markdown; tasks and phases come back as JSON.
4. **Paste-back validator.** The user pastes the answer; the platform checks the format. If something is missing or malformed, it shows exactly what's wrong and offers a **one-click "repair prompt"** to paste back into the same chat.
5. **Review and edit.** The leader reviews every generated item before it lands in the room. Nothing goes live unreviewed.
6. **Lock a version.** The plan is versioned so the team can revise it later.

**Files the plan produces** (the ones you listed, plus the extras problem.md asks for):

| File | Purpose |
|---|---|
| `PRD.md` | What we're building, for whom, and the user flow |
| `PROBLEM.md` | The specific problem and target user, in the team's words |
| `TECH_STACK.md` | Stack choices with reasons and the "known vs new tech" flag (P3: don't experiment with unknown tech) |
| `PHASES.md` | Time-boxed phases with exit checkpoints |
| `MVP.md` | The one end-to-end flow, the wow moment, what is real vs mocked (see F8) |
| `CUT_LIST.md` | What we will cut first if time runs short |
| `RISKS.md` | Riskiest assumptions and fallbacks |
| `DEMO_SCRIPT.md` | The ~90-second demo, written **before** coding starts (W6) |
| `DECISIONS.md` | Log of decisions and who made them |

- **Pro-mode "agentic" planner:** several specialized roles working together: a **Planner** (drafts), a **Scoper** (cuts scope to fit the clock), and a **Judge Simulator** (scores the plan against the rubric and sends it back if it scores poorly). In free mode, the same roles exist as separate prompts in the chain.
- **Why it exists:** L1, L2, L4, W2, W3, W6; also answers "not everyone has API access".
- **Notes / risks:**
  - **Model quality varies.** A plan from a weaker free model can *look* good but be infeasible. So the platform always adds a **feasibility check** ("this plan has N tasks for M people over H hours: is it realistic?").
  - **Do not automate consumer chat interfaces** (browser scraping/auto-typing). That likely breaks provider terms. Keep the bridge manual copy-paste, and check each provider's terms.
  - **Copy-paste friction is real.** Measure how many minutes the whole plan takes; the target is under 10.
  - **Privacy:** tell users that pasting the team's idea into a third-party chat shares it with that provider. Some events ban or restrict AI use; F1's AI-use-policy card must gate this feature.
  - Free chat limits differ by provider and change over time; don't promise specifics.

### F5. Docs Vault (all plan files in one place)

- **What you see:** The plan files above as clean pages, versioned, searchable, with "last edited by".
- **What you do:** Edit inline, comment, restore old versions, and **export the whole set as a zip or push it to the repo's `/docs` folder**.
- **Why it exists:** P3.1 (no shared picture), P4 (README/docs requirements in some events), W15.
- **Free vs Pro:** Free.
- **Notes:** Docs must stay short. A 30-page PRD is a hackathon failure mode.

### F6. Phase Board and Task Engine (the "Jira" core)

- **What you see:**
  - A **Hackathon Clock** across the top: elapsed %, next checkpoint, time to feature freeze, time to submission deadline.
  - The current **Phase** and its tasks, grouped by person.
  - A **Leader Dashboard**: who is working on what, who is idle, who is blocked, and each person's share of the workload.
- **What you do:**
  - The leader (or the plan) creates tasks and assigns them to people or roles.
  - When someone finishes a task, the platform **suggests their next task** from the queue; the leader confirms or reassigns (this is your "once done, a new task is assigned" flow).
  - Anyone can hit **"I'm blocked"**, which alerts the captain with one tap (no long chat threads).
- **Default phase plan (a starting heuristic, adjustable):**

| Share of clock | Phase | Exit checkpoint |
|---|---|---|
| 0-5% | Read brief, team charter | Rules confirmed, roles set |
| 5-15% | Ideation and decision | Idea locked |
| 15-25% | Plan and skeleton | **Core flow runs end to end, however ugly** |
| 25-60% | Build core | Core features done |
| 60-70% | **Feature freeze** | Scope frozen; new tasks now trigger a warning |
| 70-85% | Polish, demo script, submission draft | Draft submission written |
| 85-95% | Rehearsal, video, fallback recording | Rehearsed X times, video recorded |
| Last 5% | Verify and submit | Submission confirmed with buffer |

  *These percentages come from practitioner advice (skeleton early, freeze features, start the submission early: see problem.md W2, W15, P3.9, P4.1). They are anecdotal, not proven. Keep them editable, and check them in the Step 3 interviews.*
- **Scope Guard:** adding a task after feature freeze triggers the question, "Does a judge need to see this to understand the solution?" (W3).
- **Energy-aware suggestions:** hard creative work early, routine work in the middle, no new risky work in the late-night/late-clock window (P3.4, P3.9).
- **Decision timer:** any open decision can carry a countdown; when it ends, the leader decides (W10).
- **Why it exists:** P1.5, P2.4, P3.1, P3.2, P3.6-P3.9, L1, L2, L10, W2, W3, W10.
- **Free vs Pro:** Core board is free. Workload analytics and smart next-task suggestions can be Pro.
- **Notes:** Keep it lighter than Jira on purpose: no epics, sprints, story points, or custom fields.

### F7. Room Feed and Communication

- **What you see:** A light activity feed (what changed, who finished what), an announcements strip from the captain, and links out to the team's existing chat.
- **What you do:** Use **"I'm blocked"**, quick **status pulses** (a 20-second "how's it going?" prompt every few hours), and threads attached to tasks or ideas.
- **Why it exists:** P3.1, P3.8, P3.12. A study of online hackathons found tool complexity overwhelmed participants, so this feature should **not** try to replace Discord or WhatsApp.
- **Free vs Pro:** Free.
- **Build decision (for Step 3):** integrate/link out first; build full chat only if interviews show a real need.

### F8. MVP Studio

Your point that the MVP is what separates projects is exactly what problem.md found in the judge accounts (a working end-to-end demo was the biggest score differentiator).

- **What you see:** One page that defines the MVP and tracks whether it actually works.
- **What you do:** Fill in and maintain:
  - **One-sentence identity** (W1)
  - **The core flow** (one complete path, 3-5 steps)
  - **The wow moment** (first minute of the demo)
  - **Reality Ledger:** each part of the project marked as **Built this weekend / Existing library or API / Mocked / Planned**. This gives an honest answer to the judge's favorite question, "what did you build this weekend?" (W13)
  - **Differentiation statement:** what your project does that the obvious version doesn't (L6)
  - **"What breaks first"** answer, prepared in advance (W8)
- **MVP Health Checklist:**
  - Runs end to end?
  - Works without depending on a flaky external service?
  - A judge can understand it in 30 seconds?
  - The wow moment lands within the first minute?
- **Why it exists:** L1, L2, L3, L6, W1, W2, W8, W13.
- **Free vs Pro:** Free (Prompt Bridge can draft the differentiation statement).

### F9. GitHub Hub

GitHub already does version control well. This adds **project-level meaning that GitHub doesn't show**, as you described.

- **What you see:**
  - **Branch Map:** each branch with its *purpose*, owner, last commit, ahead/behind main, and open PRs.
  - **Branch roles:** mark which branch is `main`, which is **demo-safe / production-ready**, and which are experiments.
  - **"What's missing" view per branch:** e.g., "feature-auth has no tests linked; demo branch lacks the latest fix".
  - **Repo Health Checklist:** README present and useful, run instructions, `.env.example` (and **no secrets committed**), license, deployed link, screenshots.
  - **History Health:** flags a repo with one giant commit and no real history, and flags commits made **before the event's official start** (D7, D8).
- **What you do:** Connect the repo with GitHub login, annotate branches with their purpose, link tasks to branches and PRs. Before the demo, **freeze a demo tag** and note it in the Submission Center.
- **Why it exists:** P3.1, P4.5, D7, D8, W13; also helps the "demo works" goal (L1).
- **Free vs Pro:** Free for public repos and basic read-only checks. Pro can add automated checks.
- **Notes / risks:** Ask for **minimum GitHub permissions (read-only metadata to start)**. Teams are protective of private repos, and trust matters here.

### F10. API Hub (a Swagger-like workspace)

- **What you see:** A registry of every API the project touches, in two groups: **external/public APIs** you consume, and **your own REST endpoints**.
- **What you do:**
  - For each external API: name, base URL, auth type, rate limit, cost, who owns the key, current status (working / failing), and the **fallback** (mock or cached response).
  - For your own backend: define endpoints and get an **OpenAPI spec** (the standard format Swagger tools use). Or import an existing OpenAPI JSON/YAML.
  - See an interactive endpoint documentation page (like Swagger UI) with request/response examples.
  - **Contract-first workflow:** frontend and backend agree on the API shape early and work in parallel.
  - **Mock responses** for each endpoint, so the frontend isn't blocked and the demo has a fallback.
- **Secret safety:** the hub stores **where a key lives**, not the key itself, and warns if an API key pattern shows up in the repo.
- **Why it exists:** P3.1, P3.3, P3.11, L1, W12.
- **Free vs Pro:** Free (OpenAPI import/editing and docs view). Pro can add automated mock servers.
- **Notes:** Use open-source components where possible (verify each license before embedding). Start with import + docs view; a full "try it" client can wait.

### F11. Diagram Studio

- **What you see:** A Mermaid editor with live preview, plus templates for the diagrams judges and teammates actually need: system architecture, user flow, sequence diagram, database schema (ER), roadmap/timeline.
- **What you do:** Edit the text, see the diagram, export SVG/PNG, and insert it into the deck or docs. Or paste your `PRD.md` into the Prompt Bridge to have an AI draft the Mermaid code, then tweak it.
- **Tool directory (linked out, not rebuilt):** Mermaid Live Editor, Excalidraw (hand-drawn whiteboard style), diagrams.net (draw.io). These are established open-source tools.
- **Why it exists:** P3.1 (shared understanding), W4/W7 (clear pitch), L3.
- **Free vs Pro:** Free.

### F12. Pitch Studio (deck and pitch)

You said users don't know what kind of PPT to make or how to stand out. This feature fixes that.

- **What you see:** A **slide-by-slide guide** matched to the event's format (from F1's Format Profile): a live 3-minute pitch, a PPT-first internal round (as in SIH-style events), a 90-second demo pitch, or an async video.
- **What you do:**
  - Follow a template where **each slide states the question it must answer** (e.g., Problem: who suffers and how often? Solution: what does it do, in one sentence? Demo. Impact: what number changes? What's next).
  - Fill each slide's content (with the Prompt Bridge for drafts).
  - Use the **Criteria Coverage Matrix:** rubric criteria on one axis, slides on the other, so you can see whether every scored criterion is addressed on purpose (W5).
  - **Slide Lint:** flags too much text, no problem slide, no impact number, no "what's next".
  - **Standing-out patterns:** open with what the product is (not the tech), lead with the specific user, end with impact and a roadmap.
  - **Pitch Rehearsal Mode:** a timer, run counter ("rehearsed 3 times"), and role split (**one presents, one operates the demo**: P5.4).
  - **Q&A Prep:** the platform generates likely judge questions: "Who exactly is this for?", "What did you build this weekend?", "What breaks first?", plus **Code Defense drills** on your own modules ("explain how this part works"), because teams that couldn't explain their own AI-generated code lost (L7).
- **Export:** outline to Markdown and copyable slide text at first; direct PPTX export later.
- **Why it exists:** P5.1-P5.7, L3, L4, L7, W5, W7, W8.
- **Free vs Pro:** Guide, matrix, lint, rehearsal timer are free. Auto-generated Q&A and Code Defense drills can be Pro (they use AI on the repo).

### F13. Demo and Video Studio

- **What you see:** A **Demo Script Builder** (hook, problem, core flow, wow moment, impact, what's next) with a running-time counter, and a **shot list** for the video.
- **What you do:**
  - Write the script early (it's generated in F4 and kept editable).
  - Follow the **Demo Insurance checklist:** works offline? cached API responses? screenshots ready? backup recording? spare laptop, hotspot, and charger? (P5.1, W12)
  - Check the video against the **event's video rules** (max length, public link, captions), pulled from F1 (D4).
- **Curated Tool Directory** (you link out; you don't rebuild these):

| Need | Tool | Notes (verified where stated) |
|---|---|---|
| Polished screen recording | **Recordly** | Free, open-source recorder and editor with auto-zoom, smooth cursor, and a timeline editor; macOS, Windows, Linux. *Different forks list different licenses (AGPL-3.0 on one, MIT on another): confirm the upstream repo's license before recommending.* |
| Generate a promo video from a repo | **RepoClip** | AI tool that turns a GitHub repo into a promo video. Proprietary, freemium; free plan is limited and may change. |
| Build videos with code | **Remotion** | React-based programmatic video. Has a special license that requires a company license in some cases. |
| The tool you called "Brag" | **Not verified** | I could not find a tool by that name. Send me the link and I'll add and check it. |

  *Keep this directory small and honest: tool, what it's for, cost, license note, and "last checked" date.*
- **Why it exists:** P5.1, P4.4, L1, W6, W12.
- **Free vs Pro:** Free.
- **Notes:** Tools change fast. A stale directory is worse than none, so every card needs a "last checked" date.

### F14. Submission Center

- **What you see:** A countdown to the submission deadline and a **single checklist built from the event's rules** (F1). It is the last screen the team uses.
- **What you do:**
  - **Start early:** the platform nudges "draft your submission text now" at the right phase (P4.1).
  - Generate a **submission draft** from the plan: what it does, why it matters, how it was built, challenges, what's next (structured like typical submission templates: P4.3).
  - Tick through the mandatory items: demo video, repo link, all teammates registered/added, correct track, prizes selected, forms filled (D4-D6, D9-D12).
  - Run a **Judge View check:** preview the submission as a non-technical judge with 60 seconds would see it (P4.6).
  - **Link check:** links open, video is public, repo is public (if required).
  - **Last-hour freeze:** after the freeze time the platform allows only verification and submission, not new features.
- **Why it exists:** P4.1-P4.6, D1-D12, L8, W15.
- **Free vs Pro:** Free.
- **Notes:** The platform cannot submit *for* the team to external platforms (at first); it verifies and reminds. That still removes the biggest avoidable failures.

### F15. Readiness Score and Judge Simulator

- **What you see:** A **Readiness Dashboard** with pass/fail lights for: rubric coverage, MVP runs end to end, demo rehearsed N times, submission complete, roles assigned, fallback recorded.
- **What you do:** Ask the **Judge Simulator** to review the project against the rubric (Prompt Bridge in free, automatic in Pro). It returns likely weak spots and questions.
- **Why it exists:** L1-L4, L7; ties everything into one "are we ready?" view.
- **Free vs Pro:** Dashboard is free. Simulator via Prompt Bridge is free; automatic is Pro.
- **Notes:** The simulated scores are **estimates, not predictions**. Label them clearly to avoid false confidence.

### F16. Team Health and Energy

- **What you see:** A small, private-by-default panel with optional 1-tap check-ins (energy, mood), each member's share of completed work, and rest reminders.
- **What you do:** Check in when prompted. The captain sees aggregate signals, e.g., "one person has done 65% of tasks" or "two people haven't checked in for 8 hours".
- **Why it exists:** P1.6, P3.9, P3.12, L9, L10. The anti-pattern research flagged "rescuer syndrome" and unnoticed overload.
- **Free vs Pro:** Free.
- **Notes:** Keep it **opt-in and gentle**. Surveillance-style tracking would make teams resent the tool.

### F17. Prep Mode (before the event)

- **What you see:** A pre-event checklist with a countdown to kickoff.
- **What you do:**
  - **Environment readiness:** everyone has repo access, event platform login, accounts, dev setup working (P0.2).
  - **Stack sandbox test:** try the chosen tools *before* the clock starts (P3: don't learn a new stack mid-event).
  - **Logistics:** who attends the offline final, who presents, travel and sleep plan (P0.3, P0.4).
  - **30-minute team intro** with the charter (F2).
  - **Read the brief together.**
- **Important guardrail:** F1 asks *"Is pre-existing code or boilerplate allowed?"* Many events ban pre-built work (D7). If banned, Prep Mode limits itself to setup and learning, **not** writing project code.
- **Why it exists:** P0.1-P0.4, P1.2, P3.
- **Free vs Pro:** Free.

### F18. Crowd Check (choosing the right problem/track)

- **What you see:** For events with multiple problem statements or tracks, a helper that estimates **how crowded** each choice is.
- **What you do:** List the options you're considering. The platform asks for likely competing ideas (Prompt Bridge) and lets you record how many teams from your college/community picked each.
- **Over time:** **Anonymous, aggregated choice counts across platform users per event** become real crowdedness data (a network effect). Until then it's a heuristic, not a measurement.
- **Why it exists:** P0.6, P2.3, L6.
- **Free vs Pro:** Free.
- **Notes:** Popularity isn't quality. A crowded choice isn't always wrong, but the team should choose it *knowingly*.

### F19. Retro and Portfolio (after the event)

- **What you see:** An auto-built **Hackathon Report**: the event, the team, your role, project links, timeline ("first working demo at hour X", "submission started at hour Y"), decisions, and the result.
- **What you do:**
  - **Retro:** what worked, what didn't, what we'd change (short prompts).
  - **Continue or archive?** If continuing, get a 2-week plan (problem.md P6.1: most prototypes die; skill diversity and intent to expand predicted long-term continuation).
  - Save it to your **personal Hackathon Portfolio**, resume-friendly and shareable.
  - Build your **personal playbook** across events: your recurring mistakes and what fixed them.
- **Why it exists:** P6.1, and closes the learning loop. It is also **the data source for validating problem.md's ranking of losing causes** with your own users' real timelines.
- **Free vs Pro:** Free; deeper analytics can be Pro.

### F20. Playbooks and Event Templates

- **What you see:** Ready-made templates by event type: **SIH-style (team of 6, PPT round then 36-hour build)**, 48-hour online Devpost-style, weekend MLH-style, 4-hour AI sprint, corporate hackathon, solo.
- **What you do:** Pick one when creating a room. It pre-fills phases, checkpoints, deliverables, and a starting guess at the rubric and rules.
- **Why it exists:** Rules and formats differ per event (problem.md, Section 8, tension 4), and templates cut setup time (design rule 1).
- **Free vs Pro:** Free.
- **Notes:** Templates are only defaults. **The leader's confirmed rules in F1 always win.**

### F21. Solo and Professional Mode

- **What you see:** Same room, simplified for a solo participant or a work-hackathon team (fewer roles, no charter).
- **Why it exists:** You said it's mostly for students but not limited to them.
- **Free vs Pro:** Free.

### F22. Mentor and Organizer Views *(later)*

- **Mentor link:** a read-only summary so a mentor can give useful advice in two minutes without a long briefing (P3.13). Includes an "Ask a mentor" template that packages the team's context and question.
- **Organizer dashboard:** lets an organizer see how many teams are at which checkpoint. This is a possible future revenue channel, but **not part of the first build**.

---

## 7. Free vs Pro at a glance

| Area | Free | Pro / Managed |
|---|---|---|
| Brief (F1) | Manual + Prompt Bridge extraction | Auto-parse from link |
| Team room, charter, roles (F2) | Yes | n/a |
| Ideation board, voting (F3) | Yes | AI stress test automatic |
| Plan generation (F4) | **Prompt Bridge** (copy-paste to any free AI) or **BYOK** | Managed agentic planner |
| Docs vault (F5) | Yes | n/a |
| Phase board, clock, checkpoints (F6) | Yes | Workload analytics, smart next-task |
| Feed / comms (F7) | Yes | n/a |
| MVP studio (F8) | Yes | n/a |
| GitHub hub (F9) | Public repos, basic checks | Automated checks |
| API hub (F10) | OpenAPI import, docs | Automated mock servers |
| Diagram studio (F11) | Yes | n/a |
| Pitch studio (F12) | Guide, matrix, lint, timer | Auto Q&A + Code Defense |
| Demo/video studio (F13) | Yes | n/a |
| Submission center (F14) | Yes | n/a |
| Readiness + simulator (F15) | Dashboard; simulator via bridge | Auto simulator |
| Health, prep, crowd check, retro, templates (F16-F21) | Yes | Deeper analytics |

**Principle:** the free tier must be complete enough to genuinely help a team win. Pro only removes copy-paste friction and adds automation. Otherwise the free tier won't spread, and spread is how this reaches students.

---

## 8. What the user does to win: the playbook, with the platform at each step

| When | What the team does | Where in the platform |
|---|---|---|
| **Days before** | Create the room, enter the brief, invite the team, do the charter, test the stack, plan logistics | F1, F2, F17 |
| **Kickoff (0-5%)** | Confirm rules and rubric; check eligibility | F1 |
| **5-15%** | Silent ideation, reveal, critique, stress test, vote, decide | F3 |
| **15-25%** | Generate plan; write the demo script; build a **rough end-to-end skeleton** | F4, F5, F6, F8 |
| **25-60%** | Build the core; keep GitHub structured; track APIs | F6, F9, F10 |
| **60-70%** | **Feature freeze:** cut per the cut list; run the MVP health check | F6, F8 |
| **70-85%** | Polish; draft the deck and submission text | F12, F14 |
| **85-95%** | Rehearse; record the demo video and a fallback | F12, F13 |
| **Last 5%** | Verify links, checklist, submit with time to spare | F14, F15 |
| **After** | Retro, portfolio, continue-or-archive decision | F19 |

---

## 9. Coverage: does every major problem in problem.md have an answer?

| problem.md item | Addressed by |
|---|---|
| P0.1 rules/rubric unread; L4 | F1 (Rubric Card, Rules Checklist), F12 (coverage matrix) |
| P0.2-P0.4 prep, access, logistics | F17 |
| P0.5, D1-D12 eligibility & rule elimination; L8 | F1, F14 |
| P0.6, P2.3 crowded choices; L6 | F18, F3 stress test |
| P1.1-P1.6 team composition & process; L5, L9 | F2, F6 leader dashboard, F16 |
| P2.1, P3.2 overscope; L2 | F3 stress test, F4 cut list, F6 scope guard |
| P2.2 ungrounded problem | F3 research attachments and real-user question |
| P2.4 decision paralysis | F3 decision timer, F6 |
| P3.1 no shared progress | F6, F5, F7 |
| P3.3, P3.11 integration/flaky dependencies | F10 |
| P3.4, P3.9 energy and late-stage risk | F6 (energy-aware, feature freeze) |
| P3.7 testing late | F6 checkpoints, F8 health check |
| P3.10 unread AI code; L7 | F12 Code Defense, F8 Reality Ledger |
| P3.12 conflict/burnout | F2 norms, F16 |
| P4.x submission mechanics | F14 |
| P5.x pitch and demo; L1, L3 | F8, F12, F13 |
| P6.1 post-event abandonment | F19 |
| **Only partly addressed:** idea quality, domain insight (W14), user access | F3 prompts and research notes *push* toward it but can't replace real users |
| **Not addressable:** judging randomness, format bias, team talent | Out of scope |

---

## 9b. Risks and open questions

1. **Overhead risk.** If the platform slows a team down in a 24-hour sprint, it loses to a chat group and a shared doc. Mitigation: Speed Mode; opinionated defaults; measure "time to first useful action".
2. **Copy-paste friction in the free tier.** Might annoy users. Test the 5-prompt chain with real students and count minutes and failures.
3. **Homogenized plans.** If everyone uses the same prompts, plans converge. Mitigation: plans are always built from the team's own cards; the differentiation check is mandatory.
4. **LLM quality and hallucination.** Validate structure; add the feasibility check; never let the plan go live unreviewed.
5. **Privacy and AI-use rules.** Pasting ideas into third-party chats, and events that restrict AI use. Mitigation: policy card in F1 gates AI features; clear consent notes.
6. **Rules parsing accuracy.** Wrong extraction could give false confidence about eligibility. Always show source text and require leader confirmation.
7. **GitHub trust.** Request minimal permissions; be transparent.
8. **Tool directory rot.** Licenses and free plans change. Add "last checked" dates.
9. **Business model.** Students rarely pay; organizers, colleges, or sponsors might. Undecided.
10. **Build scope.** A platform with 22 features contradicts its own advice ("cut scope"). See Section 10.

**Open questions for you:**
- Send me the link for **"Brag"** so I can verify it.
- Confirm that "auja board" means a shared collaborative brainstorm board.
- Should organizers be a target user from day one, or strictly later?

---

## 10. Suggested build order (input for Step 3)

The product should follow its own advice: **one end-to-end flow first**.

| Priority | Features | Why first |
|---|---|---|
| **P0: the spine** | F1 Brief, F2 Room and roles, F3 Ideation Board, F4 Prompt Bridge and plan files, F5 Docs Vault, F6 Phase board with checkpoints, F14 Submission Center | Delivers "rules → ideas → plan → build → submit" end to end |
| **P1: the differentiators** | F8 MVP Studio, F12 Pitch Studio, F9 GitHub Hub, F10 API Hub, F11 Diagram Studio | The things most students don't know how to do |
| **P2: polish and loop-closing** | F13 Demo/Video, F15 Readiness, F16 Health, F17 Prep, F18 Crowd Check, F19 Retro, F20 Templates | Makes it sticky and produces learning data |
| **P3: expansion** | F21 Solo mode, F22 Mentor/Organizer views, Pro automation | Only after the spine is proven |

**Next step (Step 3):** validate the assumptions in `problem.md` Section 9 with interviews, test the Prompt Bridge chain with real students, then pick the true MVP from the P0 list.

---

## 11. Sources for tool claims made in this document

| Claim | Source |
|---|---|
| Recordly: open-source recorder/editor, auto-zoom, cursor smoothing, timeline, .recordly projects, macOS/Windows/Linux | https://github.com/nonomal/Recordly ; https://abduzeedo.com/node/89092 |
| Recordly forks list different licenses (AGPL-3.0 / MIT) | https://github.com/nonomal/Recordly ; https://backiee.wasmer.app/https_github_com/lsj5031/Recordly |
| RepoClip: repo-to-promo-video, proprietary freemium | https://alternativeto.net/software/repoclip/about |
| Remotion: videos in React; special license, company license may be required | https://github.com/remotion-dev/remotion |
| Everything about hackathon problems, losses, and winners | `problem.md` and its source list |
