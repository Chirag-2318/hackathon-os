# PRD

## Problem
Hackathon participants struggle to assemble high-performing teams with complementary skill sets in the brief hours before kickoff.

## Target user
Hackathon hackers, first-time builders, and solo designers looking for sprint companions.

## One-sentence identity
Hackathon OS is the agile command centre transforming chaotic hackathon ideas into shipped MVPs.

## Core flow
1. Hacker creates or joins a room via invite code.
2. Team pastes competition brief and validates problem criteria.
3. Members submit and vote on raw product concepts.
4. AI generates architectural breakdown and phase checkpoints.

## Wow moment
Instant dependency-resolved Gantt chart with automated task distribution based on member skills.

## Must-have features
- Brief parser with rubric weight checker
- Ideation board with primary selection
- Multi-step structured project planner
- Exportable markdown sprint artifacts

## Out of scope
- Live video call integration
- Native mobile client
- Automatic cloud deployment

# MVP

## The one end-to-end flow
From raw hackathon PDF brief intake to fully assigned Kanban board with 9 generated markdown documentation assets.

## Real vs mocked
| Part | Status |
| --- | --- |
| Brief Intake | Built |
| Task Generator | Built |
| Cloud Deployer | Mocked |

## Cut list
- External GitHub OAuth token linking
- Automatic submission video generator
- Custom judge feedback dashboard

## Risks and fallbacks
- Third-party LLM rate limiting: fallback to local precomputed templates and manual review.
