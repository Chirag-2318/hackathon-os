=====FILE: TASKS_P1.md=====
# Phase Tasks

## Phase intent

Establish a runnable foundation for the Traffic Flow Dashboard: initialize the repository, confirm the FastAPI and React development servers start, and prepare the SQLite schema plus deterministic simulated traffic inputs. This phase is scaffolding only; it should make later map, congestion, prediction, refresh, history, and anomaly work possible without pretending those features are already implemented.

## Tasks

### T-001 - Initialize traffic-dashboard repository and environment
- Phase: P1
- Type: setup
- Role: Backend
- Assignee: @cyber_stag
- Estimate: 0.5h
- Priority: P0
- Depends on: none
- Requirement: FR-001
- Description: Create the `traffic-dashboard` repository with a main branch, `.gitignore`, README skeleton, and backend/frontend environment templates. Keep generated databases, virtual environments, dependencies, and local secrets out of version control.
- Acceptance:
  - The repository contains `.gitignore`, `README.md`, and backend/frontend `.env.example` templates.
  - `.gitignore` excludes the virtual environment, `node_modules`, `.env` files, and the SQLite database.

### T-002 - Bootstrap FastAPI health endpoint and SQLite schema
- Phase: P1
- Type: build
- Role: Backend
- Assignee: @cyber_stag
- Estimate: 0.5h
- Priority: P0
- Depends on: T-001
- Requirement: FR-001, FR-003, FR-007
- Description: Create a pinned `backend/requirements.txt` and a minimal FastAPI `main.py` with a `/health` endpoint. On startup, initialize SQLite tables for `INTERSECTION`, `GPS_OBSERVATION`, `PREDICTION`, `ROUTE`, and `EDGE`, and seed the intersection records.
- Acceptance:
  - Starting the backend locally creates the SQLite schema and seeds five intersection records without a startup error.
  - `GET /health` returns a successful response indicating `status: "ok"` and database connectivity.

### T-003 - Bootstrap the React/Vite frontend
- Phase: P1
- Type: build
- Role: Frontend
- Assignee: @cyber_stag
- Estimate: 0.5h
- Priority: P0
- Depends on: T-001
- Requirement: FR-002, FR-003, FR-005, FR-006, FR-009
- Description: Initialize the React 18 + Vite frontend and add a minimal `App.jsx` that renders the Traffic Flow Dashboard shell. Configure the backend URL through a frontend environment template; leave map layers, metrics, polling, prediction confidence, and anomaly alerts for later phases.
- Acceptance:
  - `npm run dev` serves the frontend at `localhost:5173` and the page renders without a runtime error.
  - The frontend environment template defines `VITE_API_URL=http://localhost:8000`.

### T-004 - Prepare deterministic GPS and intersection seed data
- Phase: P1
- Type: build
- Role: ML / AI
- Assignee: @cyber_stag
- Estimate: 0.5h
- Priority: P1
- Depends on: T-001
- Requirement: FR-001, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009
- Description: Add `backend/data/simulated_gps.csv` with replayable, timestamped GPS traces spanning 36 hours for five intersections, plus `backend/data/intersections.json` with each intersection's ID, name, latitude, and longitude. Use deterministic synthetic data so later model, history, refresh, and anomaly work can be tested offline.
- Acceptance:
  - The CSV contains parseable latitude, longitude, and timestamp fields and includes observations associated with all five seeded intersections.
  - The JSON file contains five intersection records with valid numeric coordinates and names matching the database seed records.

## Order and dependencies

1. T-001 establishes the repository and environment templates.
2. T-002 and T-003 can proceed independently after T-001.
3. T-004 depends on T-001 and supplies deterministic data for later ingestion and ML work.
4. Before closing P1, run the backend health check, start the frontend, and verify the seed files and SQLite records are present.

## Workload for this phase

| Member | Assigned estimate | Available capacity | Difference |
|---|---:|---:|---:|
| @cyber_stag | 2.0h | 1.7h | 0.3h over capacity |

All tasks are assigned to the only member listed in the team roster. The phase owner mentioned elsewhere is not in the authoritative roster, so no task is assigned to that unlisted handle.

## Requirement coverage

- **MUST requirements scaffolded:** FR-001 through seed-data and backend ingestion foundations; FR-002 through frontend/map-app foundation; FR-003 through intersection and observation schema; FR-004 and FR-005 through prediction-related schema and data foundations; FR-006 through the frontend/backend foundation needed for polling.
- **SHOULD requirements scaffolded:** FR-007 through historical observation and prediction tables; FR-008 through retained prediction/history data foundations; FR-009 through deterministic traffic data and the planned frontend shell.
- This phase does not claim the map heatmap, congestion calculations, trained model, confidence display, ten-second refresh, accuracy chart, or anomaly alert are implemented. Those require follow-on build and integration work.

## Carry-over notes

No unfinished tasks are carried over from earlier phases. P1 establishes the foundations only. Implement actual GPS parsing and congestion aggregation, map rendering, prediction inference and confidence, ten-second refresh, historical accuracy comparison, and anomaly alerts in later phases according to the PRD and MVP scope.

## Phase exit check

- Confirm `GET http://localhost:8000/health` succeeds and reports database connectivity.
- Confirm SQLite initializes the five required tables and contains five seeded intersections.
- Confirm the simulated GPS CSV and intersection JSON exist, parse successfully, and refer to the same five intersections.
- Confirm the React/Vite app loads at `http://localhost:5173` without runtime errors.
- Confirm `.env` files, `venv`, `node_modules`, and the SQLite database are excluded from Git.
- Record any incomplete check as a blocker rather than marking the phase complete.

## Reality check

The requested work does not fit the available 1.7 hours at the minimum permitted estimates: four tasks require 2.0 hours, already 0.3 hours over capacity, and the deliverables are ambitious for a single person. Prioritize a runnable repository, `/health`, and a frontend that starts first. If time runs short, reduce the seed dataset to the smallest valid deterministic sample temporarily, then expand it to the required 36-hour traces before the phase is considered complete. Do not silently mark unverified schema or data requirements as done.
=====END FILE=====
