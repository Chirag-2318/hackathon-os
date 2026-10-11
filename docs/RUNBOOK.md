# Hackathon OS — Operational Runbook

## 1. Local Development Quickstart

### Prerequisites
- Java 25 (Temurin or OpenJDK)
- Node.js 22+ & npm
- PostgreSQL 16+ running on port `5432`

### Launch Backend
```bash
cd backend
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=dev
```
Backend runs on `http://localhost:8080`.

### Launch Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 2. Production Docker Deployment

### Launch Stack
- **Linux / macOS**:
  ```bash
  ./scripts/dev-up.sh
  ```
- **Windows PowerShell**:
  ```powershell
  ./scripts/dev-up.ps1
  ```
Or directly via Docker Compose:
```bash
docker compose up --build -d
```

### Stack Endpoints
- **Application & Reverse Proxy**: `http://localhost`
- **Direct Spring Boot API**: `http://localhost:8080`
- **PostgreSQL Database**: `localhost:5432` (database: `hackathon_os`, user: `hackathon`)

---

## 3. Database Maintenance

### Run Nightly Cleanup Manually
```bash
curl -X POST http://localhost:8080/api/v1/dev/cleanup
```
Or wait for the scheduled `03:00 UTC` execution.

### Backup Database
- **Linux / macOS**: `./scripts/db-backup.sh`
- **Windows**: `./scripts/db-backup.ps1`

### Restore Database
- **Linux / macOS**: `./scripts/db-restore.sh ./backups/hackathon_os_*.sql.gz`
- **Windows**: `./scripts/db-restore.ps1 -BackupFile ./backups/hackathon_os_*.sql`

---

## 4. Troubleshooting & Health Checks

| Symptom | Diagnostic Step | Resolution |
| :--- | :--- | :--- |
| SSE updates not connecting | Check `GET /api/v1/meta` and Nginx logs | Ensure `proxy_buffering off;` is active in reverse proxy config. |
| 401 Session Expired | Inspect browser cookies | Re-authenticate via `/signin` or the `SessionExpiryDialog`. |
| Flyway checksum mismatch | Check Flyway table `flyway_schema_history` | Run `./mvnw flyway:repair`. |
| Frontend compilation error | Run `npm run build` in `frontend/` | Check TypeScript project reference types. |

---

## 5. Common Causes of Runtime Errors

### 1. Stale Build Artifacts
- **Cause**: Moving, renaming, or refactoring classes (e.g. `ErrorResponse`) can leave behind stale compiled class files in `backend/target` during incremental IDE builds or dev runs, causing `NoClassDefFoundError` or `ClassNotFoundException`.
- **Resolution**: Stop the running backend, remove the target directory, and do a clean compile:
  ```bash
  cd backend
  ./mvnw clean compile
  # Or full verification
  ./mvnw clean verify
  ```

### 2. Session Without a Matching Users Row
- **Cause**: The database was reset or cleared while the user's browser still held an active session cookie, or provider ID types differed during lookup.
- **Resolution / Self-Healing**: `CurrentUser.get()` uses `UserService.findOrCreateFromPrincipal()` to automatically reconstruct the user row and default settings directly from the OAuth2 principal if the account is not soft-deleted. If the user account has `deleted_at` set, a `401 ACCOUNT_DELETED` is returned.

### 3. Stale Browser Storage
- **Cause**: Outdated mock room IDs or obsolete client schemas persisted in browser `localStorage`.
- **Resolution**: The frontend uses `hos:storage-version` (current value `"6"`). On app start (`initStorageVersion()`), any version mismatch purges all `hos:*` localStorage entries except theme preferences. Never restore a last opened room unless `GET /rooms/{id}` succeeds.

### 4. Leftover Mock Identifiers
- **Cause**: Hardcoded mock IDs (such as `'r-1'`, `'tpl-campus'`, or non-UUID strings) leaking into components or API calls.
- **Resolution**: Run the static checker:
  ```bash
  cd frontend
  npm run check:static
  ```
  This enforces zero forbidden static strings, mock room IDs, or template IDs across `frontend/src`.

### 5. Coordinated Dev Database Reset & Browser Clearing
- **Procedure**: Whenever dropping, resetting, or migrating the dev database from scratch:
  1. Stop both backend and frontend.
  2. Reset the database (`docker compose down -v` or drop/recreate DB schema).
  3. Clear browser site data / cookies for `localhost:5173` and `localhost:8080`.
  4. Start backend (`mvn clean spring-boot:run -Dspring-boot.run.profiles=dev`) and frontend (`npm run dev`).
  5. Log out if any session remains, and log in freshly via `/sign-in`.

