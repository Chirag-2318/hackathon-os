# 08 — Frontend routes

> Purpose: document navigation and route status.
> Audience: frontend maintainers and product reviewers.
> Snapshot date: 2026-10-19.
> Source snapshot: `frontend/src/app/routes/router.tsx`.
> Status: Verified source map.

Public routes include landing, sign-in/login, invite/join, playbooks, onboarding, public portfolio, mentor and system pages. The authenticated shell includes home, rooms, playbooks, tools, portfolio, settings, notifications and admin.

Room routes include overview, brief, team, ideate, plan, docs, board, MVP, GitHub, APIs, diagrams, deck, pitch kit, submission, readiness, summary, retro and notifications. Prep, crowd-check and schedule are feature-flag-gated. Legacy pitch/demo/submit paths redirect to canonical deck/pitch-kit/submission states. Routes are lazy-loaded and protected by `ProtectedRoute`.
