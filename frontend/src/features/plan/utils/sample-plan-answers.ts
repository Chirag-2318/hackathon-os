/**
 * Sample valid responses for the 5-step AI Planning Chain.
 * Adheres strictly to planService validation rules.
 */

export const SAMPLE_PLAN_ANSWERS: Record<number, string> = {
  0: `# PRD
## Problem
College students struggle to find compatible hackathon teammates with complementary skills and shared sprint goals.
## Target user
Students, first-time hackathon attendees, and solo builders looking for a cohesive squad.
## One-sentence identity
Tinder for hackathon teammates, matching verified GitHub profiles with sprint ambitions.
## Core flow
1. Connect GitHub and specify sprint availability.
2. Select desired role and rate comfort level with core technologies.
3. Swipe through matched teammates based on complementary stack needs.
4. Accept matches into a shared Hackathon OS room with automated workspace creation.
## Wow moment
Instant mutual match triggers an automated repo fork, Discord room, and shared planning board in 2 seconds.
## Must-have features
- Skill-based swipe matching
- GitHub profile verification
- Automated team room creation
## Out of scope
- In-app voice chat
- Payment processing for paid mentors
# MVP
## The one end-to-end flow
From signup to matched team room in under 3 minutes with verified GitHub repos.
## Real vs mocked
| Feature | Implementation | Notes |
| --- | --- | --- |
| GitHub Auth | Real OAuth | Live token validation |
| Matching Algorithm | Real Cosine Similarity | Skill vector embeddings |
| Workspace Scaffolding | Mocked / Local | Fast demo execution |
## Cut list
- Real-time video calling
- Multi-hackathon calendar sync
- Native mobile apps for iOS and Android
## Risks and fallbacks
- GitHub API rate limiting: Fallback to cached profile fixtures.
- Lone wolf users without matches: Automated bot team pairing.`,

  1: `# Tech stack
| Layer | Technology | Rationale | Status |
| --- | --- | --- | --- |
| Frontend | React 19 + Vite | Ultra fast HMR and lightweight bundle | Known |
| Styling | Tailwind CSS v4 | Instant theme tokens and rapid UI design | Known |
| State | Zustand + TanStack Query | Clean server-cache synchronization | Known |
| Embeddings | pgvector on Supabase | High speed cosine similarity search | New |

# Architecture
The web application communicates directly with our backend API gateway, which queries the vector database for real-time teammate recommendations.

\`\`\`mermaid
graph TD
  User[User Client] --> UI[React Frontend]
  UI --> API[API Gateway]
  API --> Engine[Matching Engine]
  Engine --> DB[(Vector DB)]
\`\`\`

# New-tech risks
Pgvector indexing latency during peak submission bursts. Mitigated with in-memory HNSW cache.`,

  2: JSON.stringify([
    {
      id: "phase-0",
      name: "Phase 0: Workspace Scaffolding",
      startPct: 0,
      endPct: 20,
      exitCheckpoint: "Repo created, CI passes, empty mock store initialized.",
      goals: ["Initialize Vite + React repo", "Configure Tailwind v4 theme tokens"]
    },
    {
      id: "phase-1",
      name: "Phase 1: Core Flow MVP",
      startPct: 20,
      endPct: 50,
      exitCheckpoint: "GitHub OAuth and profile swipe deck functional.",
      goals: ["Build swipe card deck", "Connect GitHub user profile fetch"]
    },
    {
      id: "phase-2",
      name: "Phase 2: Match & Room Setup",
      startPct: 50,
      endPct: 75,
      exitCheckpoint: "Mutual match triggers room creation.",
      goals: ["Implement matching algorithm", "Wire room invite link generation"]
    },
    {
      id: "phase-3",
      name: "Phase 3: Feature Freeze & Polish",
      startPct: 75,
      endPct: 90,
      exitCheckpoint: "No new features allowed, all critical bugs resolved.",
      goals: ["Perform cross-browser testing", "Polish animations and empty states"]
    },
    {
      id: "phase-4",
      name: "Phase 4: Pitch Rehearsal & Submission",
      startPct: 90,
      endPct: 100,
      exitCheckpoint: "Demo video recorded, presentation dry run complete.",
      goals: ["Run 2-minute timed rehearsal", "Submit Devpost and live demo link"]
    }
  ], null, 2),

  3: JSON.stringify([
    {
      id: "task-1",
      title: "Initialize Vite + Tailwind v4 project",
      phaseId: "phase-0",
      role: "Frontend",
      estimateMin: 45,
      dependsOn: [],
      acceptance: "Clean build and lint check passing.",
      status: "todo"
    },
    {
      id: "task-2",
      title: "Configure mock data store & API stubs",
      phaseId: "phase-0",
      role: "Backend",
      estimateMin: 60,
      dependsOn: ["task-1"],
      acceptance: "All REST endpoints return fixtures with latency.",
      status: "todo"
    },
    {
      id: "task-3",
      title: "Build swipe card deck component",
      phaseId: "phase-1",
      role: "Frontend",
      estimateMin: 90,
      dependsOn: ["task-1"],
      acceptance: "Left/right swipe gestures trigger vote action.",
      status: "todo"
    },
    {
      id: "task-4",
      title: "Implement skill matching cosine similarity",
      phaseId: "phase-1",
      role: "ML/AI",
      estimateMin: 90,
      dependsOn: ["task-2"],
      acceptance: "Top 5 recommendations ranked by skill complementarity.",
      status: "todo"
    },
    {
      id: "task-5",
      title: "Mutual match room creation flow",
      phaseId: "phase-2",
      role: "Frontend",
      estimateMin: 75,
      dependsOn: ["task-3", "task-4"],
      acceptance: "Match modal allows opening new room immediately.",
      status: "todo"
    },
    {
      id: "task-6",
      title: "UI polish and responsive layout verification",
      phaseId: "phase-3",
      role: "Design",
      estimateMin: 60,
      dependsOn: ["task-5"],
      acceptance: "Zero layout shifts and clean mobile responsive view.",
      status: "todo"
    },
    {
      id: "task-7",
      title: "Record 90-second demo video and pitch deck",
      phaseId: "phase-4",
      role: "Presenter",
      estimateMin: 60,
      dependsOn: ["task-6"],
      acceptance: "Full end-to-end recording with audio uploaded.",
      status: "todo"
    }
  ], null, 2),

  4: `# Demo script
- 0:00 - 0:15 (15s): Hook — The common nightmare of mismatched hackathon teams and last-minute dropouts.
- 0:15 - 0:45 (30s): Problem in Action — Builder A shows an empty workspace with no frontend developer.
- 0:45 - 1:15 (30s): The Solution — Instant swipe match with Builder B, auto-scaffolding the repo and room in 2 seconds.
- 1:15 - 1:30 (15s): Impact & Close — Ready to build from minute one with zero wasted planning overhead.

# Shot list
1. Close-up on the hackathon countdown timer at T-36h.
2. Screen recording of the Tinder-style swipe interface with GitHub tags.
3. Live match confetti celebration and instant workspace opening.
4. Split view of both teammates editing tasks simultaneously on Hackathon OS.

# Likely judge Q&A
**Q1: What did you build this weekend?**
We built a real-time skill matching engine that pairs hackathon builders by complementary strengths and automatically generates their sprint workspace.

**Q2: What breaks first?**
Under massive concurrent traffic, the real-time websocket pairing engine would experience queuing delay before our vector cache warms up.

**Q3: How do you prevent ghosting between matched teammates?**
Matches require a 30-minute confirmation handshake, after which the room opens to alternate candidates if someone remains inactive.

**Q4: How does your skill verification work?**
We parse public GitHub repositories, counting committed languages and recent contributions rather than self-reported resume bullet points.

**Q5: What is your monetization model?**
Organizers sponsor featured team bounties, and enterprise hackathons license the collaborative workspace OS.

**Q6: Can teams have more than two members?**
Yes, room templates support up to 6 members with automated role balancing (Frontend, Backend, ML, Design, Pitch).

**Q7: How did you ensure data privacy of candidate profiles?**
We only ingest public repository metadata and store zero private repository credentials or personal contact details.

**Q8: Why would a judge choose this over standard Slack channels?**
Slack requires chaotic manual coordination. Hackathon OS guarantees 100% team formation and Day 1 sprint velocity.`
};
