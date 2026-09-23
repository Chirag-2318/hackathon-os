# problem.md: Hackathon Operating System ("Jira for Hackathons")

**Status:** Step 1 of the project, problem research
**Written:** 19 Sep 2026
**Purpose:** Define, with evidence, what actually goes wrong for hackathon teams, why teams lose, and what separates winners. Every later step (personas, requirements, features) should trace back to an ID in this file (P-, L-, W-, D-).

---

## 0. How much to trust this document

Read this first, because it changes how you use everything below.

**There is no public dataset of "teams that lost, and why".** Nobody has published labelled win/loss data. What exists is:

| Tier | What it is | Examples | Weight |
|---|---|---|---|
| **A** | Peer-reviewed or thesis-level research on hackathons | Nolte et al. (project continuation), Mendes et al. (online team collaboration), the design-thinking-in-hackathons study | Strong on *how teams work*. Silent on *who wins*. |
| **B** | First-hand accounts from judges/coaches, and official event rules | July 2026 judge notes, MLH coach on Devpost, ETHGlobal/HackNC/HackDuke rules | Strong on *what judges see*. Small samples. |
| **C** | Winner/participant blogs, prep-platform articles | SIH winner retrospectives, "10 tips" posts | Useful patterns, but **survivorship bias** and often **written by companies that sell hackathon prep** |

Consequences for how I built this:

1. **A cause only counts as "strong" if several independent sources point to it.** Where only one source says it, I mark it.
2. **The ranking in Section 3 is my synthesis, not a measured result.** It must be validated by your own interviews (Section 9).
3. **I ignore unsourced statistics.** One SIH blog claims things like "90% of teams fail" and "the presentation is 50% of your score". I found no source for those, so I don't use them as facts.
4. **Some sources contradict each other.** I list those honestly in Section 4.3 instead of smoothing them over.

---

## 1. The short answer

Most hackathon teams do not lose because they cannot code. They lose because of **decisions and sequencing made in the first hours**, and those show up as symptoms at judging time:

- **Late or wrong decisions** (idea, scope, stack, roles) cause **no working end-to-end product until very late**.
- That leaves **no time for demo prep, rehearsal, or a proper submission**.
- The judge, who sees many projects in a few minutes, sees a **fragile demo, a muddled opening, and a team that cannot defend its own build**.
- A separate group never reaches the judges' scoring at all: they are **eliminated on rules** (missing video, unregistered teammate, ineligible team composition, late submission).

The visible reason ("the project was not good") is almost always the last link in a chain. The chains are in Section 3.

---

## 2. What goes wrong, in order of the hackathon timeline

IDs (P-) are for traceability. Each item says what happens, why it happens, and what it costs.

### Phase 0: Before the event starts

**P0.1 Rules, rubric, and problem statement are not fully read**
- *What:* Teams read a title or skim, then build something adjacent to what was asked, or ignore a criterion worth a large share of the score.
- *Why:* Rules are scattered (event page, PDF, Discord announcements, sponsor pages) and long. Also, teams get excited about *their* idea before reading *the organizer's* intent.
- *Cost:* Building the wrong thing; missing hard constraints such as allowed tech, LLM-use rules, README/Docker/`.env` requirements, stop-code time, and time zone. [S3, S4, S6, S1]

**P0.2 Environment and access are not ready**
- *What:* Hours lost on repo access, platform login, API keys, installs.
- *Cost:* Per one experienced participant, a large share of the team's productive hours. [S6]

**P0.3 The humans are not ready**
- *What:* Starting tired, with no blocked calendar, sacrificing sleep entirely. [S6]

**P0.4 The offline final is an afterthought**
- *What:* Online build, in-person final in another city or time zone. Nobody decided who travels or who can present under stress. [S6]

**P0.5 Eligibility rules unknown**
- *What:* Team size, same-college requirement, mandatory female member (SIH), unique team names, etc. [S5, S29]
- *Cost:* Elimination before quality is judged (see Section 5).

**P0.6 Picking the crowded problem statement or track**
- *What:* Everyone chooses the glamorous option (in one SIH account, healthcare-AI drew 15 teams from a single college). Switching to a duller problem changed their odds from 1-in-15 to 1-in-3. [S24]
- *Why:* Popularity is mistaken for quality. Attractive ≠ winnable.

### Phase 1: Team formation

**P1.1 Wrong skill composition**
- *What:* All-backend teams, or all "idea people". Judges see a technically interesting product that demos and pitches badly. Nobody owns frontend, design, or the pitch. [S1, S6, S4]
- *Why:* Teams form around friendship or proximity, not skill gaps.

**P1.2 Strangers start in silence, or friends never discuss expectations**
- *What:* Teams formed on the spot dive into tasks without understanding personalities or working styles. Awkwardness and hesitation to share ideas show up within the first hour or two. [S6]
- *Research backing:* Interdisciplinary teams struggle with communication and collaboration, and the short time frame amplifies it. [S16]

**P1.3 Uncommitted members**
- *What:* People who "might find some time". The load collapses onto one person. [S6]

**P1.4 Misaligned goals**
- *What:* One person wants to win, another wants a certificate, a third wants a LinkedIn line. Effort and risk appetite diverge. [S6]

**P1.5 No coordinator; leadership by accident**
- *What:* Without a formal lead, teams drift out of sync. In a study of online hackathons, leaders emerged by accident, for example simply because someone registered the team, and tasks were self-assigned by interest and skill. [S13, S6]

**P1.6 Single point of failure**
- *What:* One competent coder carries everything ("rescuer syndrome"): burnout, weak delegation, and nobody else understands the system. [S6, S9]

### Phase 2: Ideation

**P2.1 Idea chosen for excitement, not finishability**
- *What:* Ambitious ideas (an "AI agent that reviews legal contracts") eat most of the clock on framework plumbing, and the team discovers late that it doesn't work on real inputs. [S1]

**P2.2 Problem not grounded in real users**
- *What:* Teams speculate from their own assumptions. Access to real users during the event is hard, so mentors and other participants get used as stand-ins, and web searches fill gaps. [S15]
- *Why it matters:* Interviewed winners in that study said a well-grounded problem beats a complex solution to nobody's problem. [S15]

**P2.3 Same idea as everyone else**
- *What:* Generic chatbots and GPT-wrapper apps. Judges have seen dozens; the project blends into the crowd. [S9, S26]

**P2.4 Decision paralysis**
- *What:* One team reportedly spent four hours debating React vs Vue in a 36-hour event. [S3]

**P2.5 Theme revealed late**
- *What:* When the challenge is only revealed at kickoff, teams scramble to understand the domain through quick web searches and forums instead of real domain knowledge. [S15]

### Phase 3: Build

**P3.1 No shared, live picture of progress**
- *What:* Duplicate work, blocked people who don't say so, no one knows what "done" means. In the online-hackathon study, teams mixed synchronous and asynchronous channels just to keep a shared understanding of who was doing what. [S13]
- *Also:* The tooling itself became a burden. Participants reported technical constraints of communication tools as overwhelming. [S13]

**P3.2 Scope creep ("feature-itis")**
- *What:* Many half-built paths; nothing works end to end. [S2, S8, S3]
- *Evidence of the cost:* In one SIH account, a winning team planned 7 features, shipped 2 polished ones, and won; the second-place team showed 5 features, 3 of which crashed in the demo. [S3] (Anecdote, but it matches the judge observations in [S2].)

**P3.3 Integration rabbit holes**
- *What:* Three hours on a third-party API integration, then discovering the same result could be simulated in about 20 lines. [S3]

**P3.4 Complex work at low-energy hours**
- *What:* At 3 AM the brain pushes for the hard solution; errors are introduced that are found at the demo. [S3]

**P3.5 Perfectionism nobody sees**
- *What:* Refactoring for clean code. In one winner's account, judges never looked at code quality, commit history, tests, or docs. [S3]
- *Caveat:* Some events *do* check commit history to detect pre-built work (see D-items). Don't generalise from one account.

**P3.6 Sunk-cost attachment**
- *What:* Continuing with a failing idea because dropping it feels wasteful. The earlier the team says "stop", the more time to pivot. [S6]

**P3.7 Testing left to the end**
- *What:* Small bugs break the demo. [S6]

**P3.8 Communication noise**
- *What:* Group-chat streams and endless threads erode focus. One suggested fix is a single person handling organizer/expert communication. [S6]

**P3.9 Energy mismanagement**
- *What:* Starting a new feature at hour 26 "because there is time". [S3]

**P3.10 Unreviewed AI-generated code**
- *What:* The team ships code it doesn't understand, then cannot answer judges' questions. One first-person loss report attributes the missed win to exactly this. [S9] A second source says winners let AI handle the commodity ~80% and hand-write the differentiating ~20%. [S1]

**P3.11 Fragile external dependencies**
- *What:* Rate limits, API cost caps, third-party outages, or "only works if Person X is online". [S1]

**P3.12 Interpersonal breakdown**
- *What:* Curt feedback under pressure gets read as a personal attack. Irritation, silence, or task avoidance are early overload signals that go unnoticed. [S6]

**P3.13 Mentor access is inconsistent**
- *What:* Mentors help with technical blockers, theme expertise, and pitch feedback when reachable. Inconsistent mentoring was a reported challenge in one hackathon study. [S13, S22]
- *Also:* Online formats reduce interaction with mentors and other teams. [S13]

### Phase 4: Submission

**P4.1 Submission written in the last minutes**
- *What:* A judge sees a project that seems promising but is not described completely enough to score. Advice from a coach who judged about 20 digital hackathons: start the submission Saturday evening, not Sunday morning. [S10, S7]

**P4.2 Mandatory artifacts missing**
- *What:* No demo video (some events won't judge without one), no repo link, teammates not added on the platform. [S18, S19]

**P4.3 Template sections deleted**
- *What:* Teams remove platform headings and omit key details. [S10]

**P4.4 Video too long**
- *What:* One event states it cannot guarantee judges watch past two minutes. [S18]

**P4.5 Repo looks like pre-existing work**
- *What:* Some events treat repos with single large commits and no history as unqualified unless the team proves otherwise. [S17]

**P4.6 GitHub-only link for a non-technical panel**
- *What:* In one event, judges came largely from business backgrounds and were reviewing 200+ projects. A repo link alone communicates little to them. [S21]

### Phase 5: Pitch and demo

**P5.1 Live demo fails, no fallback**
- *What:* Wifi and venue networks fail at many events. Fix from a judge: record a ~60-second screen capture of the working flow as insurance. [S2]

**P5.2 Opening with technology or backstory**
- *What:* Judges cannot hold a story without an anchor. Teams that open with "this is a tool that does X for Y" score better than teams that spend a third of their slot on context. [S2, S7, S3]

**P5.3 Not tailored to the judges or the criteria**
- *What:* Non-technical judges get stack details; technical judges get market talk. Each criterion should be answered explicitly. [S7]

**P5.4 Presenter and demo operator are the same person**
- *What:* Divided attention. One winning team split these roles. [S3]

**P5.5 Unrehearsed, untimed**
- *What:* Improvised pitches overrun. Rehearse out loud; time it. [S8, S3]

**P5.6 Cannot answer questions about own build**
- *What:* Blur about "which part did you build this weekend" reads as hiding something. Naming a known weakness raised scores for one judge. [S2]

**P5.7 Show only what exists, not what could be**
- *What:* Hackathon projects are rarely complete. Teams that also show a credible path forward (roadmap) look further ahead. [S7, S6]

### Phase 6: After

**P6.1 Projects die after the event**
- *What:* Most hackathon prototypes are abandoned. Large-scale research on hackathon repos found: short-term continuation is associated with technical preparation, number of technologies used, and winning; long-term continuation with skill diversity, capabilities relative to the technologies used, and intent to expand the project's reach. Intense short-term activity was associated with *lower* long-term continuation. [S11]
- *Corporate setting:* Financing, team skills fit, and integration into company operations decided continuation. [S12]
- *Another finding:* A rest period after the event and regular sharing of progress build social investment that supports continuation. [S25]

---

## 3. Why teams lose: causal analysis

### 3.1 The arithmetic nobody says out loud
Many teams, a handful of prizes. Most teams lose even when they do everything reasonably well. So "why did we lose?" has two answers: (1) *unavoidable*, because good teams also lose; and (2) *avoidable*, and the rest of this section is about that second part.

### 3.2 Why judging amplifies small execution differences
From a judge who scored three events in July 2026 [S2] and supporting sources [S20, S21]:
- Judges rank each project against the handful they just saw, not against an ideal. Demos start to blur mid-block.
- Rubric scores **compress**: most teams land mid-range on most criteria. The gap that decides winners comes from a few things the rubric doesn't name directly: **whether the demo ran**, **whether the first sentence said what it is**, and **whether the scope matched the time**.
- Judges also score on "could I explain this to another judge an hour later". A project with three features and no center is forgotten even if it is technically stronger.
- Format effects are real: in presentation-style judging, later presenters may suffer as judges tire; async video review rewards teams that are good at video, not only at building. [S20]
- Judges differ. Non-technical judges catch things engineers miss (and vice versa). [S28]

**Implication:** a lot of "losing" is a *communication-of-value under time pressure* failure, not a *building* failure.

### 3.3 Root-cause chains

| Chain | Root cause (upstream) | Middle links | What the judge sees (symptom) |
|---|---|---|---|
| **A. Late-decision chain** | No decision rule; debate on idea/stack (P2.4, P1.5) | Skeleton not running early → all features squeezed late → no test time (P3.7) | Crashes, dead paths, unfinished screens |
| **B. Unread-rules chain** | Rules/rubric skimmed (P0.1) | Effort aimed at wrong criteria or wrong problem | "Doesn't address the problem statement" or low score on a criterion the team never targeted |
| **C. Composition chain** | Skill gap (P1.1) | Nobody owns frontend/design/pitch | Clunky UX, muddled pitch, no domain framing |
| **D. Overscope chain** | Idea chosen for excitement (P2.1, P3.2) | Nothing works end to end | "Platform" that is 20% built; no coherent demo |
| **E. Unowned-code chain** | AI-generated code accepted unread (P3.10) | One person understands (or nobody) | Q&A collapse; judge senses the gap |
| **F. Ungrounded-problem chain** | No user contact (P2.2) | Solution assumptions untested | "Who is this for?" gets a vague answer |
| **G. Crowded-idea chain** | Popular track / generic AI wrapper (P0.6, P2.3) | Blends in | Judge forgets it by the next demo |
| **H. Late-submission chain** | Submission deferred (P4.1) | Incomplete write-up, no video, missing teammates | Not judged, or judged on partial info |
| **I. Team-process chain** | Misaligned goals, no roles, rescuer syndrome (P1.3–P1.6, P3.12) | Burnout, conflict, silent disengagement | Team visibly tired; uneven answers to questions |

### 3.4 The most probable specific reasons (ranked; my synthesis, to be validated)

Ranking logic: how many independent sources flag it × how directly it changes the judge's experience.

1. **L1. No working end-to-end path at judging time.** Judges reduce doubt by seeing something run. A live, working flow beats a more ambitious project shown only as slides, by one judge's account. [S2, S3, S4] *(Strong: multiple sources)*
2. **L2. Scope larger than the clock.** Not "bad ideas", but ideas that cannot finish; the constraint being tested is judgment under limits. [S2, S1, S6, S3, S8] *(Strong)*
3. **L3. The pitch doesn't state what it is, for whom, within the first sentence.** [S2, S7, S3] *(Strong)*
4. **L4. Rubric and problem statement not internalised.** [S1, S4, S6, S7, S3] *(Strong)*
5. **L5. Skill gap in the team, especially presentation/frontend/design.** [S1, S6, S4] *(Moderate to strong)*
6. **L6. Idea not differentiated and not grounded in a specific user.** [S9, S15, S26, S2] *(Moderate)*
7. **L7. Team cannot defend its own build (unread AI code).** [S9, S1] *(Moderate; rising in relevance since 2025)*
8. **L8. Eliminated on rules, not on quality** (Section 5). [S17-S19, S5] *(Strong that it happens; frequency unknown)*
9. **L9. Team process failure** (conflict, uneven load, burnout). [S6, S16, S13] *(Moderate)*
10. **L10. Time and energy mismanagement** (new features late, complex work at night, no rehearsal). [S3, S6, S23] *(Moderate)*

**Notice what is not on the list:** code quality, architecture, tech-stack choice. Judge accounts say these rarely moved scores. [S2, S3]

---

## 4. What winning teams do differently

### 4.1 Traits (W-items)

- **W1. One-sentence identity, decided before coding.** The sentence a judge would repeat to another judge later. [S2]
- **W2. A rough, running skeleton early** (one input, one output, however ugly) rather than late polish. One 2026 guide puts this at the first quarter of the clock; treat as a heuristic, not a law. [S23, S2]
- **W3. A ruthless cut test:** "Does the judge *need* to see this to understand the solution?" If no, cut. [S3]
- **W4. A specific user and a problem the judge has felt.** "Athletes" is not an answer; a specific person with a specific problem is. [S2, S7, S15]
- **W5. Rubric-driven decisions.** Re-read the criteria before scope, demo, and slide-order decisions. Address each criterion explicitly. [S1, S7]
- **W6. Demo script written before the code**, so the project's shape is forced early. [S1, S8]
- **W7. Rehearsed and role-split:** one presents, one operates; opening rehearsed out loud; timed. [S3, S2, S8]
- **W8. Honest about limits.** Naming the known weakness gained more credibility than it cost. [S2]
- **W9. Balanced team** covering build, design, and communication. [S1, S6]
- **W10. Fast decision rule.** One team's rule: any decision taking over 10 minutes is made by the lead. [S3]
- **W11. AI used on the commodity code; the differentiating logic is understood and owned.** [S1, S9]
- **W12. A recorded fallback of the working flow.** [S2]
- **W13. Proof of what was built this weekend.** Clear separation of new work vs. existing pieces. [S2, S17]
- **W14. Domain insight and product judgment.** A 2026 write-up of a Stanford-hosted AI hackathon notes the first-place mobile app was built by a solo designer without an engineering background; the author reads this as product judgment and domain expertise winning. (Single interpretive source; treat lightly.) [S27]
- **W15. Started the submission early**, so the last hours are verification, not writing. [S10]

### 4.2 The pattern behind the traits
Winning teams are not distinguished by raw technical strength. They are distinguished by **judgment under constraint**: what to build, what to cut, what to show, and when to stop. This is a *process* skill, which is exactly the part software could scaffold.

### 4.3 Where sources disagree (unresolved)

| Topic | View 1 | View 2 | My read |
|---|---|---|---|
| **Hardcoding the demo path** | Mock external services, cache API responses, prepare fallbacks so the demo always reaches its punchline [S1] | Hardcoded demos get caught; build something that works on any input [S5] | Depends on the judge and format. Live judges who click around expose hardcoding; async video judges don't. **Event-format-specific.** |
| **How much slides matter** | Slides fill time, don't persuade; want one screenshot of the running thing [S2] | Presentation is heavily weighted (unsourced claim) [S4] | Formats differ. SIH-style events have a PPT-driven internal round [S24]; Devpost-style events are demo/video-driven. **Format-specific.** |
| **Polish** | Legibility helps, elaborate UI adds little [S2] | Usability is an explicit criterion in many rubrics [S1] | Polish only up to the level a first-time user understands the flow. |
| **Hitting all criteria vs. one clear thing** | "Address every point individually" [S7] | "Do one thing really well" [S8, S2] | Compatible: one product identity, but show evidence against each criterion. |

---

## 5. Non-quality eliminations (D-items)

These are losses where the judges never reached "is the project good?" The exact rules vary by event, which itself is a finding: **the rules are heterogeneous and must be read per event.**

| ID | Elimination | Source / example |
|---|---|---|
| D1 | Ineligible team composition (e.g., required minimum female member, exactly 6 members, all from the same college, unique team name without the college name) | SIH rules as listed by [S5] and a college internal-round notice [S29] |
| D2 | Submitting after the internal/nodal (SPOC) deadline | [S5] |
| D3 | Copying prior winners' solutions (a prep site claims judges check; unverified) | [S5] |
| D4 | No demo video where video is mandatory ("won't be judged") | [S18] |
| D5 | Code missing or not linked | [S18] |
| D6 | Teammates not registered or not added on the submission | [S19] |
| D7 | Work begun before the event / project reused from earlier events | [S17, S18, S19] |
| D8 | Repo with no real commit history (single large commit) | [S17] |
| D9 | Wrong track selection or multi-track submission where only one is allowed | [S19] |
| D10 | Cross-posting the same project to multiple hackathons | [S18] |
| D11 | Late submission with no extension | [S18, S19] |
| D12 | Project shown only as idea/wireframe where working code is required | [S19] |

---

## 6. Structural problems participants must absorb (not caused by the team)

- **Unpublished or vague rubric.** One guide advises asking organizers, and assuming demo quality and storytelling if refused. [S1]
- **Inconsistent judging formats and judge fatigue.** [S20, S2]
- **Inconsistent mentoring** and insufficient time reported in a hackathon study. [S22]
- **Online events reduce access** to mentors and other teams, and tool complexity overwhelmed participants. [S13]
- **Communication gets organized around organizer milestones**, so the event's own structure shapes team activity. [S14]
- **Time-boxed by design.** The clock itself is the main adversary; it punishes any process that isn't explicit.

---

## 7. Draft problem statement

> Hackathon participants, mostly students but also working professionals, must make dozens of high-stakes decisions (idea, scope, roles, stack, cut-lines, demo, submission) inside 24-48 hours, with rules scattered across many places and communication scattered across many tools. Teams that lose are usually **not out-coded but out-sequenced**: they decide late, scope wrong, discover rules or requirements late, run out of time for a working demo and rehearsal, and sometimes fail on eligibility or submission mechanics before judging begins. There is no shared, structured system that carries a team from *reading the rules* to *submitting a complete, rehearsed entry*, and none that captures the lessons for the next event.

**Primary user (working assumption):** a student team member in a 24-48h event, especially in their first few hackathons.
**Secondary users:** repeat participants; working professionals; possibly organizers (open question).

---

## 8. Which problems could a tool plausibly address? (bridge to next step, not a solution design)

| Problem group | Related IDs | Nature of the problem | Tool-addressable? |
|---|---|---|---|
| Rules, rubric, eligibility, deadlines | P0.1, P0.4, P0.5, D1-D12 | Information scattered and unread | **Yes**: extraction into a checklist and countdown |
| Sequencing and time allocation | P2.4, P3.4, P3.7, P3.9, P4.1, W2, W6 | Missing structure/checkpoints | **Yes**: phased plan with checkpoints |
| Scope control | P3.2, P2.1, W3 | Discipline problem, needs forcing functions | **Partly**: cut-list prompts, must-have vs. nice-to-have |
| Team formation and roles | P1.1-P1.6, W9 | Composition and clarity | **Partly**: skill-gap check, role assignment, captain |
| Coordination and progress | P3.1, P3.8, P3.12 | Fragmented tools, invisible progress | **Yes**, *if lighter than the chat apps teams already use* |
| Decision speed | P2.4, W10 | Human behavior | **Partly**: decision log, time-boxed decisions |
| Submission mechanics | P4.1-P4.6 | Checklist and verification | **Yes** |
| Pitch and demo readiness | P5.1-P5.7, W6-W8, W12 | Preparation and rehearsal | **Partly**: script scaffold, timer, fallback prompt |
| Understanding own code | P3.10 | Discipline and skill | **Weakly**: reminders only |
| Idea quality, domain insight, user grounding | P0.6, P2.2, P2.3, W4, W14 | Creativity and access to people | **Mostly no**; can prompt, cannot replace |
| Judging randomness and format bias | Section 3.2, 6 | External | **No** |
| Post-event continuation | P6.1 | Motivation, funding, skills | **Weakly** |

### Tensions and risks to take seriously

1. **Tool overhead is itself a hackathon failure mode.** Teams already lose hours to tools, and Jira's reputation is *heavy*. A hackathon tool that takes 30 minutes to set up loses to a WhatsApp group and a shared doc. The product must be faster to start than the alternatives.
2. **The current stack is "free" and familiar** (chat apps, shared docs, GitHub, Devpost). The real competitor is **habit**, not another product.
3. **Adoption is a team decision at hour zero.** One skeptical teammate can veto it.
4. **Rules differ per event.** Ingesting each event's rules reliably is a data problem.
5. **The biggest levers (idea quality, user insight) are the least tool-addressable.**
6. **Who is the customer?** Students rarely pay. Organizers and colleges might. This is an open question.

---

## 9. What desk research cannot answer: validation plan (Step 2)

Before building anything, test the diagnosis on real people.

**Questions this document cannot settle**
1. Which of L1-L10 are the most common *for Indian college teams specifically*? (Most sources are US/global, with a few SIH-focused ones.)
2. How do teams currently manage the event, and what do they use? What actually breaks?
3. Would teams use a structured tool *during* an event, or only before/after?
4. How much do first-time vs. repeat participants differ?
5. Would organizers, colleges, or platforms (Devfolio, Devpost, Unstop) act as distribution or as competitors?

**Suggested primary research**
- **15-20 short interviews** with students from at least 3 colleges: half first-timers, half repeat participants, at least a few who won and a few who lost.
- **3-5 judges/mentors/organizers**, since they see patterns across many teams.
- **Method:** reconstruct the *last hackathon timeline hour by hour*: when was the idea fixed, when did something first run, when was the video/PPT started, what went wrong last, what did they use for tracking.
- **Ask about the lost hackathon specifically**, then dig past the first answer with "why" until you hit a decision or a missing piece of information.

**What would falsify this concept**
- If most teams already run a workable process and their losses are driven by idea and talent, the product's value is limited.
- If teams won't adopt any tool mid-event, the product must live in the *before/after* phases only.

---

## 10. Sources

Tier key: **A** academic, **B** first-hand judge/organizer/official rules, **C** participant or prep-platform blog (bias risk).

| ID | Source | Tier |
|---|---|---|
| S1 | HackerEarth, "10 tips to win a hackathon", https://www.hackerearth.com/blog/10-tips-win-hackathon (vendor; internal claims about MLH not independently verified) | C |
| S2 | M. Kurbaitaev, "What Judges Actually Score" (judged 3 events, July 2026), https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l | B |
| S3 | Reskilll, "What I Learned Building Under Pressure at SIH", https://blogs.reskilll.com/what-i-learned-building-under-pressure-sih-winners-honest-retrospective/ | C |
| S4 | Reskilll, "Common SIH Mistakes That Get Teams Eliminated", https://blogs.reskilll.com/?p=293 (contains unsourced statistics; not used as fact) | C |
| S5 | Reskilll, SIH quick checklist page, https://blogs.reskilll.com/?p=236 | C |
| S6 | S. Kalinina, "How (Not) to Hackathon?", HackerNoon, Dec 2025, https://hackernoon.com/how-not-to-hackathon-the-hackathon-anti-pattern-guide | B/C |
| S7 | J. Scholz, "5 reasons you are losing hackathons", https://dev.to/code42cate/5-reasons-why-you-are-losing-hackathons-4k70 | C |
| S8 | JetBrains, "How to win a hackathon: notes from the judging table", June 2026, https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ | B |
| S9 | "Lost So Bad, Got Humble Again", https://shrit.substack.com/p/lost-so-bad-got-humble-again | C |
| S10 | J. Biggin (MLH coach), "How to make your Devpost submissions not suck", https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0 | B |
| S11 | Nolte, Chounta, Herbsleb, "What Happens to All These Hackathon Projects?", https://www.uttv.ee/naita?id=30436 | A |
| S12 | Ratsoga & Primus (2023), post-hackathon continuation in an African corporate setting, https://ajic.wits.ac.za/article/view/15564 | A |
| S13 | Mendes et al. (2022), virtual collaboration in four online hackathons, https://arxiv.org/pdf/2204.12274 | A |
| S14 | Schulten, Nolte et al. (2022), communication traces in an online hackathon, https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2022.983164/pdf | A |
| S15 | Design-thinking methods used in hackathons (interview study), https://arxiv.org/pdf/2206.04744 | A |
| S16 | Y. Hong (2016), team-building in hackathons, Indiana University thesis, https://scholarworks.indianapolis.iu.edu/items/83af5b1c-efcb-4dfe-94a2-e0f8df9aea1c | A |
| S17 | ETHGlobal ETHOnline 2023 rules, https://ethglobal.com/events/ethonline2023/info/details | B |
| S18 | HackNC 2025 submission rules, https://fourth-brian-c09.notion.site/Submission-Judging-26ad0e356d4f811b8c17dc53a2af4801 | B |
| S19 | HackDuke 2020 submission rules, https://thin-basil-fcf.notion.site/Submission-Guidelines-dd56b43c9d114b9aa209916fb6bf8f68 | B |
| S20 | Builderbase Hackathon Playbook ch. 15 (judging formats), https://intercom.help/builderbase/en/articles/14831464-hackathon-playbook-ch-15-judging-rubrics | B/C |
| S21 | TRON Grand Hackathon Devpost judging guide, https://forum.trondao.org/t/tron-grand-hackathon-improving-your-devpost-judge-score/9393 | C |
| S22 | Naseem et al., school-emergency hackathon in Pakistan, https://ecommons.aku.edu/pakistan_fhs_mc_emerg_med/306 | A |
| S23 | Masai School, "How to win an AI hackathon in 2026", https://www.masaischool.com/blog/how-to-win-an-ai-hackathon-in-2026-full-guide/ | C |
| S24 | Reskilll, "How I won Smart India Hackathon", https://blogs.reskilll.com/?p=448 | C |
| S25 | Indiana University PhD (2024), model of project continuation in game jams and hackathons, https://scholarworks.indianapolis.iu.edu/items/26ad7881-2141-4698-9229-afdb08ecb730 | A |
| S26 | TAIKAI, winning hackathon project ideas (Aug 2026), https://taikai.network/en/blog/winning-hackathon-project-ideas | C |
| S27 | E. Dzhuraeva, "The People Winning AI Hackathons in 2026...", Medium, https://medium.com/@elviraux/the-people-winning-ai-hackathons-in-2026-arent-the-strongest-engineers-anymore-3fc43f1d13d7 | C |
| S29 | IEEE event listing, college-level SIH internal hackathon rules (6 members, one female member, same college), https://events.vtools.ieee.org/m/419221 | B |
| S28 | Slack, "Lessons from five years of hackathons", https://slack.com/intl/en-in/blog/collaboration/lessons-from-five-years-of-hackathons-at-slack | B |

---

## 11. Next step

**Step 2:** Turn Section 9 into an interview guide and run it on real students. Only after that, define personas and the requirements that trace back to the P-, L-, W-, and D-IDs above.
