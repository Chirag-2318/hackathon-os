=====FILE: TASKS_P1.md=====
# Phase 1: Foundation and Core Data Flow

## Phase intent
Establish the baseline project scaffolding, mock data models, and local build verification.

## Tasks

### T-001 - Project scaffolding and backend setup
- Phase: P1
- Type: setup
- Role: Backend
- Assignee: @alice
- Estimate: 2h
- Priority: P1
- Depends on: none
- Requirement: FR-001
- Description: Scaffold Spring Boot project with PostgreSQL and essential health endpoints.
- Acceptance:
  - Spring Boot app boots cleanly on port 8080
  - Health check endpoint returns 200 OK

### T-002 - Frontend layout and theme tokens
- Phase: P1
- Type: build
- Role: Frontend
- Assignee: @bob
- Estimate: 3h
- Priority: P1
- Depends on: T-001
- Requirement: FR-002
- Description: Set up React Vite app with Tailwind theme tokens and base layout shell.
- Acceptance:
  - Vite dev server starts without lint or console errors
  - Theme tokens toggle between light and dark modes cleanly

## Order and dependencies
T-001 runs first, followed by T-002 which depends on T-001.

## Workload for this phase
- @alice: 2h
- @bob: 3h

## Requirement coverage
- FR-001: Covered by T-001
- FR-002: Covered by T-002

## Carry-over notes
None.

## Phase exit check
All P1 scaffolding tasks verified.

## Reality check
Feasible within the first 6 hours of the hackathon.
=====END FILE=====
