-- V8__seed_catalog.sql
-- Hackathon OS Phase 4: Seed Real Playbooks & Tools Directory

-- 1. PLAYBOOKS SEED
INSERT INTO playbooks (slug, title, summary, content, category, read_minutes, sort_order) VALUES
(
    'winning-a-24-hour-hackathon',
    'Winning a 24-hour hackathon',
    'A tactical playbook for teams competing in high-intensity 24-hour hackathons, focusing on energy, velocity, and judge alignment.',
    '# Winning a 24-Hour Hackathon

In a 24-hour hackathon, time is your scarcest asset. Most teams fail not because they lacked technical capability, but because they treated 24 hours like a mini-startup instead of a live presentation sprint.

## 1. Hour 0 to 2: The Foundation
* **Read the Rubric First:** Rubrics decide winners. If UX is 30% and Technical Complexity is 20%, an ugly CLI with a neural network loses to a polished web app with simple logic.
* **Lock the Core Flow:** Define the single "Golden Path" interaction that the judges must experience. Everything else is secondary.
* **Assign Strict Roles:** One presenter/designer, one backend engineer, one frontend lead. Avoid committee debates.

## 2. Hour 3 to 14: The Build Engine
* **Mock Early, Wire Later:** Frontends should not wait for real endpoints. Use mock JSON contracts immediately so UI development never stalls.
* **Ruthless Cuts:** If an auth flow or edge-case error boundary takes more than 45 minutes, cut it. Hardcode the logged-in demo user.
* **Commit Often:** Avoid massive 4:00 AM merge conflicts by pushing small, atomic commits to short-lived feature branches.

## 3. Hour 15 to 19: The Feature Freeze
* **Absolute Code Freeze:** No new features after hour 18. Period.
* **Stabilize the Demo Seed:** Create a pristine demo database script or local cache. Never rely on empty state during evaluation.
* **Test Offline:** Conference wifi fails routinely when 500 laptops connect at once. Ensure the demo runs locally on `localhost`.

## 4. Hour 20 to 24: Presentation Polish
* **Rehearse 3 Times Minimum:** Timing is unforgiving. A 3-minute pitch must be practiced until transitions between slides and demo are muscle memory.
* **Submission Buffer:** Submit your links and Devpost/platform fields 60 minutes before deadline. Last-minute upload bottlenecks will cost you points or disqualify you.',
    'strategy',
    6,
    1
),
(
    'reading-the-brief-in-10-minutes',
    'Reading the brief in 10 minutes',
    'How to deconstruct hackathon problem statements, uncover hidden requirements, and spot judge rubrics in minutes.',
    '# Reading the Brief in 10 Minutes

When organizers release the hackathon brief, adrenaline runs high. Teams immediately open IDEs and start coding an idea they discussed in the taxi. This is the fastest route to losing.

## The 4-Pass Extraction Method

### Pass 1: The Deliverables (Minute 0–2)
Scan straight to the end of the brief. Look for the deliverables checklist:
* Is a public GitHub repo required?
* Is a video mandatory? What is the strict maximum length (e.g., 90s vs 2min)?
* Must the project be deployed to a live URL?
* Note any prohibited technologies or pre-existing code restrictions.

### Pass 2: Rubric & Weightings (Minute 2–4)
Extract every scoring criterion and its explicit weight:
* **Impact & Relevance:** Does the brief state a specific target audience?
* **Technical Execution:** Are specific sponsor APIs or LLMs rewarded?
* **Design & Usability:** How much do aesthetics matter?

### Pass 3: Constraints & Eligibility (Minute 4–7)
Identify the fences you cannot jump over:
* AI policies (e.g., must disclose model usage; cannot use unverified external datasets).
* License requirements (e.g., Apache 2.0 or MIT open-source mandate).
* Track-specific rules: If applying for a sponsor prize, check their mandatory SDK.

### Pass 4: The Problem Statement Synthesis (Minute 7–10)
Summarize the problem in one sentence of maximum 20 words:
> *"Who suffers, what is the painful friction, and what measurable outcome solves it?"*

If your idea doesn''t answer this sentence directly, discard it immediately.',
    'planning',
    4,
    2
),
(
    'choosing-an-idea-under-time-pressure',
    'Choosing an idea under time pressure',
    'A framework for evaluating competing ideas quickly and committing as a unified team without endless debate.',
    '# Choosing an Idea Under Time Pressure

Every hackathon team faces the Idea Trap: three teammates each championing their own concept, spending 3 hours debating philosophy while the countdown ticks.

## The 3-Filter Decision Matrix

Evaluate every candidate idea against three uncompromising filters:

### 1. The 30-Second Wow Filter
Can a judge grasp the core differentiation within 30 seconds of looking at the screen?
* If the idea requires a 5-minute explanation of backend distributed consensus, it will fail on stage.
* Visual contrast, immediate utility, and surprising simplicity always win.

### 2. The Weekend Feasibility Filter
Does the team possess the exact technical capability to build the core flow in 10 hours?
* If the idea depends on training an ML model from scratch, drop it.
* If it requires complex real-time WebRTC or hardware bluetooth pairing that nobody has tested before, cut the risk.

### 3. The Sponsor Prize Alignment Filter
Can this idea naturally incorporate 1 or 2 sponsor tracks without feeling shoehorned?
* Winning multiple sponsor bounties often yields greater reward and visibility than the single grand prize.

## How to Break Deadlocks
1. Give each team member 3 sticky notes (or votes).
2. Rank ideas based on total score across the 3 filters.
3. If tied, the **Team Lead makes the final decision immediately**.
4. Disagree and commit: Once decided, zero second-guessing is allowed.',
    'ideation',
    5,
    3
),
(
    'scope-cutting-and-the-feature-freeze',
    'Scope cutting and the feature freeze',
    'The art of ruthless scope pruning to ensure your core user flow is unbreakable before the clock runs out.',
    '# Scope Cutting and the Feature Freeze

The number one predictor of hackathon failure is overscoping. Teams build 70% of 10 different features, leaving a product where nothing actually completes.

## The Three Buckets of Scope

Split your feature roadmap into three explicit categories:

1. **The Hero Flow (P0 - Non-negotiable):**
   * Exactly 3 to 4 sequential screens that tell the story.
   * Example: Login → Enter Prompt → Real-time Insight Rendered → Export Shareable Report.
   * This must work flawlessly without crashes.

2. **The Supporting Illusion (P1 - Polish):**
   * Features that make the product feel real but are not in the primary click path.
   * Hardcode or mock these with realistic data (e.g., pre-seeded history list, mock settings panel).

3. **The Cut List (P2 - Immediate Graveyard):**
   * Password reset emails.
   * Stripe billing integrations.
   * Complex permission hierarchies.
   * Custom theme switchers.
   * Move these to the Cut List immediately.

## Enforcing the Feature Freeze
* **Set a Hard Time:** Typically 6 hours before the submission deadline.
* **The Rule of Freeze:** No new tables, no new endpoints, no new screens.
* **Bug Fixes Only:** Only touch code that directly prevents the Hero Flow from executing.',
    'execution',
    5,
    4
),
(
    'building-a-demo-that-cannot-break',
    'Building a demo that cannot break',
    'Engineering strategies to safeguard your live demonstration against wifi drops, rate limits, and Murphy''s Law.',
    '# Building a Demo That Cannot Break

Anything that can go wrong during a live hackathon demo will go wrong. The wifi will throttle, third-party APIs will 429 rate-limit, and your database connection pool will exhaust. Here is how to make your demo invulnerable.

## 1. The Golden Seed
* Never show an empty state. Judges do not want to see you type fake user profile data into a form for 60 seconds.
* Pre-populate your database with realistic, high-quality sample data: avatars, rich text, timestamps, and realistic metrics.

## 2. The Local Fallback Proxy
* Run all external API calls through a local caching proxy or fallback layer.
* If OpenAI or an external weather API throws an error or times out after 2 seconds, immediately return a realistic cached JSON payload.
* The audience does not care if the response was generated live or pulled from cache; they care about seeing the UX capability.

## 3. The 3-Tier Demo Defense
* **Tier 1: Live Web App.** The primary demonstration running on the presenter laptop.
* **Tier 2: Localhost Mirror.** The identical app running on `localhost:5173` without requiring internet access.
* **Tier 3: The Backup Screen Recording.** A clean, 60-second screen capture video of the exact golden path, stored locally on the desktop. If the laptop freezes or display adapters fail, play the video immediately.',
    'demo',
    5,
    5
),
(
    'pitch-and-rehearsal',
    'Pitch and rehearsal',
    'Mastering the 3-minute hackathon pitch: structure, pacing, stage roles, and handling harsh judge Q&A.',
    '# Pitch and Rehearsal

A mediocre technical project with an exceptional 3-minute pitch will consistently beat an extraordinary technical project with a rambling, confusing presentation.

## The 3-Minute Structure

* **0:00 - 0:30 (The Hook & Problem):**
  * Start with a relatable human problem or startling statistic.
  * Do not introduce team names yet. Grab attention.
* **0:30 - 1:00 (The Solution & Differentiation):**
  * One clear thesis sentence: "We built [Product], which enables [Audience] to [Superpower]."
  * Highlight what makes this different from existing tools.
* **1:00 - 2:15 (The Live Demo):**
  * Hand over smoothly to the operator.
  * Show, don''t tell: "Watch as Sarah uploads the file..."
  * Focus strictly on the "Aha!" moment.
* **2:15 - 2:45 (Architecture & Technical Depth):**
  * One concise slide highlighting tech stack, key algorithms, or challenging engineering hurdles overcome this weekend.
* **2:45 - 3:00 (Business Impact, Vision & Closing):**
  * What is the real-world value? What happens Monday morning?
  * Strong concluding sentence and thank the judges.

## Rehearsal Disciplines
1. **Assign Fixed Roles:** One Presenter who talks and maintains eye contact. One Operator who drives the mouse and keyboard. Never have the presenter type and talk simultaneously.
2. **Time Every Run:** Run with a stopwatch. If you hit 3:05, cut 2 sentences. Organizers will cut your microphone at 3:00.
3. **Practice Q&A Defense:** Prepare answers for the three hardest questions: "What breaks first at scale?", "Why can''t Google or OpenAI build this in a week?", and "What did you actually build this weekend versus using existing libraries?"',
    'pitch',
    6,
    6
),
(
    'submission-checklist',
    'Submission checklist',
    'The final countdown: avoiding disqualification, crafting judge-friendly writeups, and submitting with confidence.',
    '# Submission Checklist

The final hour of a hackathon is pure chaos. Submission platforms like Devpost or Taikai frequently experience heavy server load and sluggish response times. Follow this checklist to guarantee a smooth finish.

## 60 Minutes Before Deadline

- [ ] **Check Repo Visibility:** Is your GitHub repository public? Test by opening an incognito browser window without login.
- [ ] **Verify README:** Does the README include a project title, 1-paragraph summary, setup instructions (`npm install && npm run dev`), and team credits?
- [ ] **Audit Sensitive Secrets:** Ensure no `.env`, `.pem`, AWS keys, or API credentials were inadvertently committed to git history.
- [ ] **Verify Video URL:** Upload the video to YouTube (set to Unlisted, NOT Private) or Loom. Ensure audio is clear and video is 1080p.
- [ ] **Test Live Deployment Link:** Open the live demo link on an external phone using cellular data (to verify it works outside venue wifi).

## 30 Minutes Before Deadline

- [ ] **Complete Text Fields:**
  * Inspiration (Why did you build this?)
  * What it does (Plain English overview)
  * How we built it (Tech stack highlights)
  * Challenges we ran into (Shows honesty and depth)
  * Accomplishments we are proud of
  * What we learned
  * What is next for the project
- [ ] **Track & Prize Selection:** Select all relevant category tracks and sponsor bounties.
- [ ] **Teammate Tagging:** Ensure every teammate is linked to the submission so everyone receives credit.
- [ ] **Click Submit:** Submit early. You can always edit text fields up until the deadline, but securing the submission timestamp prevents disaster.',
    'submission',
    4,
    7
),
(
    'after-the-hackathon-continue-or-archive',
    'After the hackathon: continue or archive',
    'How to evaluate post-hackathon momentum, conduct a blameless retro, and choose whether to turn the project into a startup or archive gracefully.',
    '# After the Hackathon: Continue or Archive

The hackathon is over. The awards ceremony has ended. Your team is exhausted and running on adrenaline and caffeine. What happens now?

## Step 1: The 48-Hour Rest Period
Do not make major career or startup decisions on Sunday night. Sleep, recharge, and step away from the code for at least 48 hours.

## Step 2: The Honest Team Retrospective
Hold a 30-minute blameless debrief with three simple prompts:
* **What went well:** What decisions or technical bets paid off?
* **What didn''t go well:** Where did we lose time? Was communication strained?
* **What will we change next time:** Actionable habits for the next sprint.

## Step 3: The Decision: Continue or Archive?

### When to CONTINUE:
* The problem genuinely excites the team outside the artificial contest environment.
* Real users or hackathon attendees asked: "Can I use this right now?"
* The team has aligned availability and shared vision for the next 2 weeks.
* **The 2-Week Plan:**
  * Week 1: Fix the cut-list items, clean tech debt, and write real documentation.
  * Week 2: Put the product in the hands of 3 real target users and measure usage.

### When to ARCHIVE:
* The project was purely a fun exploration of an unfamiliar library or hackathon theme.
* Team members have conflicting priorities, academic exams, or full-time commitments.
* **How to Archive Gracefully:**
  * Tag the final commit as `v1.0-hackathon`.
  * Add a note to the README with awards won, architecture overview, and personal portfolio links.
  * Celebrate what you learned together and preserve the friendship.',
    'review',
    5,
    8
);

-- 2. TOOLS DIRECTORY SEED
INSERT INTO tools (id, name, category, cost, license, url, description, notes, last_checked, sort_order) VALUES
(
    gen_random_uuid(),
    'Mermaid Live Editor',
    'diagrams',
    'OPEN_SOURCE',
    'MIT',
    'https://mermaid.live',
    'In-browser editor and live preview tool for Mermaid diagrams, flowcharts, sequence diagrams, and architecture graphs.',
    'Fully open-source web editor for generating SVG and PNG diagrams directly from text markdown.',
    '2026-10-11',
    1
),
(
    gen_random_uuid(),
    'Excalidraw',
    'diagrams',
    'OPEN_SOURCE',
    'MIT',
    'https://excalidraw.com',
    'Virtual collaborative whiteboard tool that lets you easily sketch diagrams with a hand-drawn feel.',
    'Free and open source. Excellent for rapid wireframing and architecture sketches during hackathon brainstorms.',
    '2026-10-11',
    2
),
(
    gen_random_uuid(),
    'diagrams.net',
    'diagrams',
    'OPEN_SOURCE',
    'Apache-2.0',
    'https://app.diagrams.net',
    'Feature-rich diagramming software (formerly draw.io) that runs in the browser and integrates with Google Drive and GitHub.',
    'Free and open source web app. Supports detailed UML, cloud architecture icons, and flowcharts.',
    '2026-10-11',
    3
),
(
    gen_random_uuid(),
    'Swagger Editor',
    'api',
    'OPEN_SOURCE',
    'Apache-2.0',
    'https://editor.swagger.io',
    'Browser-based editor for designing, describing, and documenting APIs using OpenAPI Specification.',
    'Standard tool for designing OpenAPI 3.0 / Swagger 2.0 specs with instant visual documentation preview.',
    '2026-10-11',
    4
),
(
    gen_random_uuid(),
    'Recordly',
    'video',
    'OPEN_SOURCE',
    'Check the project page',
    'https://github.com/recordly/recordly',
    'Open-source lightweight screen recorder and editor designed for quick product demos and tutorials.',
    'Recordly is an open-source screen recorder and editor and different forks list different licenses (AGPL-3.0 and MIT), so check the upstream repo.',
    '2026-10-11',
    5
),
(
    gen_random_uuid(),
    'RepoClip',
    'video',
    'FREEMIUM',
    'Check the project page',
    'https://repoclip.com',
    'Automated repository-to-promo-video tool that generates short demonstration reels from GitHub projects.',
    'RepoClip is a proprietary freemium repo-to-promo-video tool and its free plan can change. Check the project page for current tier limits.',
    '2026-10-11',
    6
),
(
    gen_random_uuid(),
    'Remotion',
    'video',
    'FREEMIUM',
    'Check the project page',
    'https://www.remotion.dev',
    'Create real MP4 videos programmatically using React, HTML, CSS, and web animation libraries.',
    'Remotion makes videos in React and its license may require a company license in some commercial cases. Check the project license terms.',
    '2026-10-11',
    7
),
(
    gen_random_uuid(),
    'ShareX',
    'utilities',
    'OPEN_SOURCE',
    'GPL-3.0',
    'https://getsharex.com',
    'Free and open-source screen capture, file sharing and productivity tool for Windows.',
    'Reliable offline tool for taking quick screenshots, annotated callouts, and GIF recordings for README files.',
    '2026-10-11',
    8
),
(
    gen_random_uuid(),
    'Vercel',
    'hosting',
    'FREEMIUM',
    'Proprietary',
    'https://vercel.com',
    'Frontend cloud platform for static sites and serverless deployments with automatic preview links from GitHub.',
    'Generous free hobby tier for personal projects and hackathons. Offers instant HTTPS and CDN distribution.',
    '2026-10-11',
    9
),
(
    gen_random_uuid(),
    'Supabase',
    'database',
    'FREEMIUM',
    'Apache-2.0',
    'https://supabase.com',
    'Open source Firebase alternative providing PostgreSQL databases, authentication, instant APIs, and storage.',
    'Free tier provides managed PostgreSQL instances suitable for rapid hackathon backend prototypes.',
    '2026-10-11',
    10
);
