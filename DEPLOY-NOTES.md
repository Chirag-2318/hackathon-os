# Deployment Guide: Hackathon OS on Render & Vercel

This guide walks through deploying the Hackathon OS backend and PostgreSQL database to Render, and the frontend single-page application to Vercel.

---

## 1. Folder Names
* **Backend:** `backend`
* **Frontend:** `frontend`

---

## 2. Versions Found
* **Java:** `25` (Eclipse Temurin)
* **Build Tool:** Maven 3.9+ with wrapper (`mvnw`)
* **Spring Boot:** `4.1.1`
* **PostgreSQL:** Local development runs PostgreSQL 17 (`postgres:17-alpine`). When creating your PostgreSQL database on Render, choose **PostgreSQL 17** (or the closest available version).

---

## 3. Render Settings

### A. Database (Render PostgreSQL)
1. In the Render Dashboard, click **New +** -> **PostgreSQL**.
2. Name: `hackathon-os-db`.
3. Database: `hackathon_os`.
4. User: `hackathon`.
5. PostgreSQL Version: `17`.
6. Once provisioned, note the **Internal Database URL** or connection credentials (`Host`, `Port`, `Database`, `Username`, `Password`).

### B. Web Service (Render Docker Web Service)
1. Click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the following service settings:
   * **Name:** `hackathon-os-backend`
   * **Root Directory:** `backend`
   * **Runtime:** `Docker`
   * **Dockerfile Path:** `Dockerfile` (relative to the `backend` Root Directory)
   * **Instance Type:** Free (512 MB RAM)
   * **Health Check Path:** `/api/v1/health`
4. Set the environment variables in Render by copying the keys from `render-env.template` (see Section 4).

---

## 4. Environment Variables

Populate these variables in Render under **Web Service -> Environment**:

| Name | Required | What it is | How to get it or example |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Yes | Spring Boot profile to activate | `prod` |
| `PORT` | Yes | HTTP port Render binds to container | `10000` |
| `APP_PUBLIC_URL` | Yes | Public URL of the frontend (Vercel) without trailing slash | `https://your-app.vercel.app` |
| `API_PUBLIC_URL` | Yes | Public URL of the backend (Render) without trailing slash | `https://hackathon-os-backend.onrender.com` |
| `DB_HOST` | Yes | Render Postgres Host (internal host) | From Render Postgres details (e.g. `dpg-xxxx-a.oregon-postgres.render.com`) |
| `DB_PORT` | Yes | Render Postgres Port | `5432` |
| `DB_NAME` | Yes | Render Postgres database name | `hackathon_os` |
| `DB_USERNAME` | Yes | Render Postgres username | From Render Postgres details |
| `DB_PASSWORD` | Yes | Render Postgres password | From Render Postgres details |
| `DB_POOL_SIZE` | Yes | Maximum Hikari connection pool size | `5` |
| `COOKIE_SECURE` | Yes | Require HTTPS for session and CSRF cookies | `true` |
| `COOKIE_SAME_SITE` | Yes | SameSite attribute for cookies | `Lax` |
| `APP_ENCRYPTION_KEY` | Yes | AES-256-GCM key for encrypting user tokens at rest | **32 random bytes, Base64** (e.g. `openssl rand -base64 32`) or **64 hex characters** (e.g. `openssl rand -hex 32`) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App Client ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App Client Secret | From GitHub Developer Settings |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth 2.0 Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth 2.0 Client Secret | From Google Cloud Console |
| `APP_GITHUB_TOKEN` | No | Server-side GitHub token for repo health / stats | Personal Access Token with repo read scope (optional) |
| `APP_GITHUB_USE_FAKE` | No | Simulate GitHub responses if token is absent | `false` |
| `GITHUB_LINK_CLIENT_ID` | No | Client ID for in-app GitHub repository link | Optional integration |
| `GITHUB_LINK_CLIENT_SECRET` | No | Client Secret for in-app GitHub repository link | Optional integration |
| `CANVA_CLIENT_ID` | No | Canva Connect Client ID | Optional integration |
| `CANVA_CLIENT_SECRET` | No | Canva Connect Client Secret | Optional integration |
| `AI_BASE_URL` | Yes | Base URL for OpenAI/Groq compatible AI endpoint | `https://api.groq.com/openai/v1` |
| `AI_API_KEY` | Yes | Platform AI API Key | Groq API Key (`gsk_...`) |
| `AI_MODEL_DEFAULT` | Yes | Default model for chat and task generation | `llama-3.3-70b-versatile` |
| `AI_MODEL_FAST` | Yes | Fast lightweight model for quick suggestions | `llama-3.1-8b-instant` |
| `AI_MODEL_SMART` | Yes | High-reasoning model for planning & critique | `llama-3.3-70b-versatile` |
| `AI_PLATFORM_FALLBACK` | Yes | Prevent platform from subsidizing user AI calls | `false` |
| `STT_BASE_URL` | Yes | Speech-to-Text Whisper API base URL | `https://api.groq.com/openai/v1` |
| `STT_API_KEY` | Yes | Speech-to-Text API Key (or reuse Groq API key) | Groq API Key |
| `STT_MODEL` | Yes | Whisper model for pitch rehearsal transcription | `whisper-large-v3` |
| `MAIL_ENABLED` | Yes | Toggle email delivery | `false` (or `true` if Gmail SMTP is configured) |
| `MAIL_HOST` | If mail enabled | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | If mail enabled | SMTP port | `587` |
| `MAIL_USERNAME` | If mail enabled | Gmail email address | `youremail@gmail.com` |
| `MAIL_APP_PASSWORD` | If mail enabled | Gmail 16-character App Password | Generated from Google Account -> Security -> App passwords |
| `MAIL_FROM_ADDRESS` | If mail enabled | Sender email address | `youremail@gmail.com` |
| `MAIL_FROM_NAME` | No | Sender display name | `Hackathon OS` |
| `MAIL_REPLY_TO` | No | Reply-To address | `support@yourdomain.com` |
| `ADMIN_EMAILS` | Yes | Comma-separated admin email addresses | `admin@example.com` |
| `SUPPORT_EMAIL` | Yes | Support email address shown in errors | `support@example.com` |

---

## 5. OAuth Setup (GitHub & Google)

### Important Architecture Note
The browser **only ever communicates with the Vercel frontend**. All OAuth callback redirects return to the Vercel domain, which Vercel proxies directly to Render. This ensures session cookies remain strictly first-party without cross-origin issues.

### GitHub OAuth App
GitHub OAuth Apps allow only **one** callback URL per application. Because your local development app uses `http://localhost:8080/login/oauth2/code/github`, create a **separate OAuth App** for this deployment:
1. Go to **GitHub -> Settings -> Developer Settings -> OAuth Apps -> New OAuth App**.
2. **Application name:** `Hackathon OS (Production / Test)`
3. **Homepage URL:** `<VERCEL-URL>` (e.g. `https://your-app.vercel.app`)
4. **Authorization callback URL:** `<VERCEL-URL>/login/oauth2/code/github` (e.g. `https://your-app.vercel.app/login/oauth2/code/github`)
5. **Scopes requested:** `read:user`, `user:email`
6. Save and copy **Client ID** to `GITHUB_CLIENT_ID` and generate a **Client Secret** for `GITHUB_CLIENT_SECRET`.

### Google Cloud OAuth 2.0 Client
1. Go to **Google Cloud Console -> APIs & Services -> Credentials**.
2. Edit or create an **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins:** `<VERCEL-URL>` (e.g. `https://your-app.vercel.app`)
4. **Authorized redirect URIs:** `<VERCEL-URL>/login/oauth2/code/google` (e.g. `https://your-app.vercel.app/login/oauth2/code/google`)
5. **Scopes requested:** `openid`, `profile`, `email`
6. Save and copy **Client ID** to `GOOGLE_CLIENT_ID` and **Client Secret** to `GOOGLE_CLIENT_SECRET`.

---

## 6. Vercel Settings (Frontend)

1. In Vercel, click **Add New... -> Project** and import your Git repository.
2. Configure project settings:
   * **Root Directory:** Click Edit and select `frontend`.
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build` (or `tsc -b && vite build`)
   * **Output Directory:** `dist`
   * **Install Command:** `npm install`
3. **Environment Variables:** **None required**.
   In production, the frontend uses relative URLs (such as `/api/v1/me` and `/oauth2/authorization/github`). Vercel proxies these paths directly to Render using `frontend/vercel.json`.

---

## 7. Backend Paths Forwarded by `vercel.json`

The following path prefixes are routed to Render by `frontend/vercel.json`:
* `/api/:path*` -> Backend REST endpoints, health check (`/api/v1/health`), and logout.
* `/oauth2/:path*` -> Spring Security OAuth2 authorization start endpoints (`/oauth2/authorization/{provider}`).
* `/login/oauth2/:path*` -> Spring Security OAuth2 callback exchange endpoints (`/login/oauth2/code/{provider}`).
* `/uploads/:path*` -> Uploaded avatar files served by the backend.

### Action Required:
Open [frontend/vercel.json](file:///c:/Users/Admin/.antigravity/hackathon-os/frontend/vercel.json) and replace `REPLACE-WITH-RENDER-HOST.onrender.com` with your actual Render web service hostname in the 4 rewrite destination URLs:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://hackathon-os-backend.onrender.com/api/:path*" },
    { "source": "/oauth2/:path*", "destination": "https://hackathon-os-backend.onrender.com/oauth2/:path*" },
    { "source": "/login/oauth2/:path*", "destination": "https://hackathon-os-backend.onrender.com/login/oauth2/:path*" },
    { "source": "/uploads/:path*", "destination": "https://hackathon-os-backend.onrender.com/uploads/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  ...
}
```

---

## 8. What Changed and Why

1. **Production Configuration (`application-prod.yml`):**
   * Configured standard Render Postgres environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`).
   * Configured Hikari connection pool size (`maximum-pool-size: 5`, `minimum-idle: 1`) to fit within PostgreSQL free-tier limits.
   * Locked Hibernate schema management to `validate` with Flyway migrations managing the database schema.
   * Disabled SQL logging and debug endpoints in production.
2. **Health Check Endpoint (`/api/v1/health`):**
   * Added `PublicHealthController` returning HTTP 200 and `{"status":"ok"}`.
   * Does not touch the database, allowing Render's health checker to pass immediately during startup.
   * Excluded from Spring Security authentication, CSRF validation, and global IP rate limiting.
3. **Public URL & Redirect Handling (`app.public-url`):**
   * Bound `app.public-url` to `${APP_PUBLIC_URL}`.
   * Defensively strips trailing slashes in `AppProperties`.
   * Updated `CorsConfig` to use `app.public-url` as the allowed origin (retaining local origins in non-prod).
   * Updated `ExplicitRedirectUriOAuth2AuthorizationRequestResolver` to resolve OAuth callbacks to `${APP_PUBLIC_URL}/login/oauth2/code/{registrationId}`.
4. **Cookie Security:**
   * Bound `COOKIE_SECURE` (`true` in production) and `COOKIE_SAME_SITE` (`Lax`).
   * Enforced across session cookies, CSRF tokens, and logout cookie invalidation.
   * Stripped all cookie `Domain` attributes so cookies remain host-only to Vercel.
5. **Secrets Hygiene & Local Configuration:**
   * Removed hard-coded secrets from tracked files.
   * Added `application-local.yml.example` for local overrides.
   * Added `.env`, `application-local.yml`, `*.pem`, `*.key`, `.vercel`, `build/`, `.gradle/` to `.gitignore`.
6. **Multi-Stage Dockerfile (`backend/Dockerfile`):**
   * Built on `eclipse-temurin:25-jdk-alpine` and `eclipse-temurin:25-jre-alpine`.
   * Configured non-root `appuser` execution.
   * Tuned JVM flags for 512 MB RAM limit (`-XX:MaxRAMPercentage=65 -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k`).
   * Configured `PORT=10000` to match Render defaults.
7. **Frontend Same-Origin Configuration:**
   * Configured `VITE_API_BASE_URL` in `apiClient.ts` to default to `""` in production builds.
   * Created `frontend/vercel.json` with reverse proxy rewrites and cache disabling headers for all backend traffic.
   * Verified that all imports in `frontend/src` have exact case matches (0 mismatches) and all assets are tracked in Git.
8. **Database & Seed Data:**
   * Verified all 42 Flyway migrations. Migration `V1__phase1_schema.sql` uses `CREATE EXTENSION IF NOT EXISTS pgcrypto;`, which is supported out-of-the-box on Render PostgreSQL.
   * Reference data (event templates, playbooks, tools directory) is managed directly inside Flyway migrations (`V2`, `V4`, `V8`), ensuring it seeds safely and idempotently in production without dev runners.

---

## 9. Known Limits of this Test Setup

1. **Free Render Instance Sleep:**
   * The free Render web service spins down after 15 minutes of inactivity. The first request after sleeping will experience a cold-start delay of 30 to 60 seconds.
2. **512 MB RAM Ceiling:**
   * The free instance has a strict 512 MB memory limit. The JVM is tuned with serial garbage collection (`-XX:+UseSerialGC`) and tiered compilation stop level 1 (`-XX:TieredStopAtLevel=1`) to keep memory footprint minimal.
3. **In-Memory State Lost on Restart:**
   * **User Sessions:** Spring Security sessions (`JSESSIONID`) are held in JVM memory. When Render sleeps or restarts, existing sessions expire and users must log in again.
   * **Live SSE Connections:** Active Server-Sent Events streams (`RoomEventHub`, `RoomSseBroadcaster`) and active presence maps disconnect upon container restart. The frontend automatically reconnects with exponential backoff once the backend recovers.
   * **Rate Limiting Tokens:** Unauthenticated and authenticated request counters in `RateLimiter` reset on restart.
   * **Local File Uploads:** Uploaded avatar files are saved to container storage at `/app/uploads`. On Render free tier without an attached persistent disk, uploaded avatars are ephemeral across service redeployments.
