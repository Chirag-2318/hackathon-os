# Hackathon OS

Hackathon OS is an opinionated execution operating system and real-time collaboration platform for hackathon teams, integrating room scheduling, stage progression (brief, ideate, plan, build), member roles, real-time SSE updates, GitHub branch governance, pitch deck rehearsal, and submission verification.

---

## Architecture Overview

- **Backend**: Spring Boot 4.1.1 (Java 25), PostgreSQL 17 (Flyway migrations `V1`–`V9`), real-time Server-Sent Events (SSE) hub, AES-256-GCM secret encryption, HttpOnly cookie-based session auth with OAuth2 (GitHub & Google).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, real-time SSE hooks with exponential backoff and tab visibility management.
- **Production Packaging**: Multi-stage Dockerfiles, Docker Compose orchestrating PostgreSQL, Spring Boot, React SPA, and Nginx reverse proxy with SSE streaming support.

---

## Quickstart

### 1. One-Click Container Stack (Docker)
- **Linux / macOS**:
  ```bash
  ./scripts/dev-up.sh
  ```
- **Windows PowerShell**:
  ```powershell
  ./scripts/dev-up.ps1
  ```
Access the application at `http://localhost`.

### 2. Local Development

**Backend (port 8080)**:
```bash
cd backend
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend (port 5173)**:
```bash
cd frontend
npm install
npm run dev
```

---

## Testing & Verification

- **Backend Unit & Integration Tests**:
  ```bash
  cd backend
  ./mvnw test
  ```
- **Frontend Unit Tests (Vitest)**:
  ```bash
  cd frontend
  npx vitest run
  ```
- **Frontend Production Build**:
  ```bash
  cd frontend
  npm run build
  ```
- **Zero Mock Data Static Check**:
  ```bash
  cd frontend
  npm run check:static
  ```
- **API Endpoint Coverage Audit**:
  ```bash
  node scripts/endpoint-coverage.mjs
  ```

---

## Documentation Links

- [Backend Architecture Guide](docs/BACKEND_GUIDE.md) — Package layout, domain modules, and service layer.
- [Database Guide](docs/database.md) — ER diagrams, indexing strategy, automated triggers, and backup/restore.
- [API Error Codes Catalog](docs/ERROR_CODES.md) — Standard RFC 7807 error codes and client actions.
- [Security Guidelines](docs/SECURITY.md) — Authentication, RBAC matrix, secret handling, and CSRF protection.
- [Operations Runbook](docs/RUNBOOK.md) — Local runbook, Docker deployment, and troubleshooting.
- [Endpoint Coverage Audit](docs/COVERAGE.md) — Complete endpoint coverage audit (91.9% coverage).
- [Known Gaps & Roadmap](docs/KNOWN_GAPS.md) — Deliberate non-goals and future phase roadmap.
