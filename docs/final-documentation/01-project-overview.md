# 01 — Project overview

> Purpose: explain the product and current implementation boundary.
> Audience: all readers.
> Snapshot date: 2026-10-19.
> Source snapshot: `211bc96`; working tree pre-existing changes excluded.
> Status: Verified/Inferred; no runtime checks.

Bracket/[brackit] is a collaborative hackathon workspace. A room moves a team from event brief and ideation through planning, build coordination, API/design work, presentation preparation, submission tracking, readiness and retrospective work.

The current product is a React/Vite frontend backed by a Spring Boot/PostgreSQL service. Authentication is OAuth2/session based. Room updates use SSE with polling fallback. AI-assisted generation is backend-mediated and provider-configured; it is not a machine-learning product claim.

Current canonical planning flow: **PRD and MVP → Tech stack and architecture → Phases and design → Demo and Q&A**.
