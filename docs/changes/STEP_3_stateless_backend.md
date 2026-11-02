# Step 3: Make the Backend Stateless (Sessions, Files, OAuth Link State)

## (a) Plain-Language Summary
Previously, user logins were kept only in temporary server memory, user avatar images were stored on the hosting server's temporary hard drive, and connecting GitHub or Canva relied on temporary session data tied to the backend URL rather than the frontend domain. As a result, every backend restart or update automatically logged out all active users, permanently erased uploaded profile pictures, and frequently broke third-party account integrations with error notices.
With this change, user sessions are saved directly to the database with an 8-hour activity window, so restarts no longer interrupt logged-in teammates. Profile avatars now upload through a unified cloud storage system with automatic image resizing and caching, and third-party integrations store their temporary verification codes in the database through public frontend web addresses.
Users will notice that server updates never sign them out, profile pictures persist reliably across deployments, and connecting GitHub or Canva works without state errors.

## (b) Files Changed
### Schema & Migrations
- `backend/src/main/resources/db/migration/V44__spring_session_and_oauth_link_states.sql`: Added `SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`, and `oauth_link_states` tables with indexes for session persistence and stateless OAuth linking.

### Session Configuration & Dependencies
- `backend/pom.xml`: Added `org.springframework.session:spring-session-jdbc` and `software.amazon.awssdk:s3:2.29.51`.
- `backend/src/main/resources/application.yml`: Configured `spring.session.store-type=jdbc`, `initialize-schema=never`, `flush-mode=on_save`, `save-mode=on_set_attribute`, timeout `${SESSION_TIMEOUT:8h}`, and storage configuration defaults.
- `backend/src/main/resources/application-prod.yml`: Enforced production session persistence settings and S3 object storage configuration.
- `backend/src/main/java/com/hackathonos/backend/common/config/SessionConfig.java`: Configured `@EnableJdbcHttpSession` with `DefaultCookieSerializer` enforcing `JSESSIONID`, `HttpOnly`, `SameSite=Lax`, and host-only cookie attributes.

### File Storage Abstraction & Image Processing
- `backend/src/main/java/com/hackathonos/backend/common/storage/StoredFile.java`: Value record containing file input stream, content length, and content type.
- `backend/src/main/java/com/hackathonos/backend/common/storage/FileStorage.java`: Clean interface defining `put`, `get`, `delete`, `exists`, and `publicUrlOrNull`.
- `backend/src/main/java/com/hackathonos/backend/common/storage/LocalDiskFileStorage.java`: Filesystem-backed storage implementation for local development and fallback.
- `backend/src/main/java/com/hackathonos/backend/common/storage/S3CompatibleFileStorage.java`: High-performance AWS SDK v2 S3-compatible client supporting AWS S3, Cloudflare R2, and MinIO with path-style configuration.
- `backend/src/main/java/com/hackathonos/backend/common/storage/InMemoryFileStorage.java`: In-memory storage implementation for lightweight unit/integration testing.
- `backend/src/main/java/com/hackathonos/backend/common/storage/FileStorageConfig.java`: Conditional bean configuration selecting `LocalDiskFileStorage` or `S3CompatibleFileStorage` based on `STORAGE_PROVIDER`.
- `backend/src/main/java/com/hackathonos/backend/common/storage/UploadsController.java`: Controller serving `/uploads/**` directly from `FileStorage` with `Cache-Control: public, max-age=31536000, immutable` and safe 404 responses.
- `backend/src/main/java/com/hackathonos/backend/users/AvatarImageProcessor.java`: Safe image sanitizer validating magic bytes (PNG, JPEG, WebP), resizing to max 256x256 via bicubic interpolation, stripping EXIF metadata, and compressing to JPEG under 150KB.
- `backend/src/main/java/com/hackathonos/backend/common/config/AppProperties.java`: Added `StorageProperties` and `S3Properties`.
- `backend/src/main/java/com/hackathonos/backend/common/config/ProductionStartupValidator.java`: Added loud warning if `STORAGE_PROVIDER=local` in production, and validated required `S3_*` properties when `s3` is configured.
- `backend/src/main/java/com/hackathonos/backend/common/config/WebMvcConfig.java`: Removed physical local file resource handler for `/uploads/**` in favor of `UploadsController`.
- `backend/src/main/java/com/hackathonos/backend/users/UserService.java`: Refactored `uploadAvatar` to validate 3MB limit, process with `AvatarImageProcessor`, store via `FileStorage`, and delete previous avatar keys; refactored `deleteAccount` and `getDataSummary` to use `FileStorage`.
- `backend/src/main/java/com/hackathonos/backend/users/UserDataExportService.java`: Refactored avatar export stream to read from `FileStorage`.

### OAuth Link State & Third-Party Linking
- `backend/src/main/java/com/hackathonos/backend/common/security/OAuthLinkState.java`: JPA entity storing single-use `state`, `provider`, `userId`, `roomId`, `codeVerifier`, `returnPath`, `createdAt`, `expiresAt`, and `usedAt`.
- `backend/src/main/java/com/hackathonos/backend/common/security/OAuthLinkStateRepository.java`: Repository for link states with `@Modifying(clearAutomatically = true)` query for cleaning expired states.
- `backend/src/main/java/com/hackathonos/backend/common/security/OAuthLinkStateService.java`: Service managing single-use state generation, validation, one-time consumption, and public redirect URI resolution from `APP_PUBLIC_URL`.
- `backend/src/main/java/com/hackathonos/backend/github/GitHubController.java`: Refactored `startLink` and `linkCallback` to use database-backed `OAuthLinkStateService` without relying on HTTP session state.
- `backend/src/main/java/com/hackathonos/backend/canva/CanvaController.java`: Refactored `connect` and `callback` to use database-backed `OAuthLinkStateService` with PKCE `codeVerifier`.
- `backend/src/main/java/com/hackathonos/backend/integrations/IntegrationsService.java`: Refactored `getAuthorizeUrl` to use `OAuthLinkStateService`.
- `backend/src/main/java/com/hackathonos/backend/common/jobs/CleanupJob.java`: Added scheduled purging of expired OAuth link states.

### Frontend
- `frontend/src/components/ui/user-avatar.tsx`: Enhanced image fallback pipeline to attempt `providerAvatarUrl` before falling back to name initials when custom avatar returns 404.

### Configuration & Environment Templates
- `.env.example`: Added `SESSION_TIMEOUT`, `STORAGE_PROVIDER`, `S3_*` variables, and documented OAuth callback URLs.
- `backend/.env.example`: Added detailed configuration comments and variables.
- `render-env.template`: Added production variables for `SESSION_TIMEOUT`, `STORAGE_PROVIDER`, `S3_*`, and documented exact Vercel frontend callback URLs.

### Automated Tests
- `backend/src/test/java/com/hackathonos/backend/stateless/JdbcSessionPersistenceTest.java`: Verified PostgreSQL session table persistence, retrieval, deletion, and HTTP 204 logout.
- `backend/src/test/java/com/hackathonos/backend/stateless/AvatarFileStorageTest.java`: Verified magic byte validation, 256x256 resizing, JPEG compression, `UploadsController` 200/404 headers, and storage put/get/delete.
- `backend/src/test/java/com/hackathonos/backend/stateless/OAuthLinkStateTest.java`: Verified state creation, single-use consumption, `STATE_ALREADY_USED`, `STATE_EXPIRED`, `USER_MISMATCH`, and expired state pruning.

## (c) New Environment Variables
- `SESSION_TIMEOUT`: Sliding inactivity timeout for Spring Session (e.g., `8h`, default: `8h`).
- `STORAGE_PROVIDER`: File storage provider (`local` for ephemeral local disk, `s3` for S3 / Cloudflare R2 / MinIO, default: `local`).
- `S3_ENDPOINT`: S3-compatible service URL (e.g. `https://<account-id>.r2.cloudflarestorage.com` or empty for default AWS).
- `S3_REGION`: S3 bucket region (default: `us-east-1` or `auto` for Cloudflare R2).
- `S3_BUCKET`: Target S3 bucket name (e.g. `bracket-uploads`).
- `S3_ACCESS_KEY`: S3 access key ID / API token ID.
- `S3_SECRET_KEY`: S3 secret access key / API secret.
- `S3_PATH_STYLE`: Whether to use path-style addressing (`false` for AWS/R2 default, `true` for MinIO/custom).

## (d) How to Verify Manually
1. Open the application in your browser and sign in using Google or GitHub.
2. Open DevTools (F12) -> Application -> Cookies, and confirm cookie named `JSESSIONID` is present with `HttpOnly` and `SameSite=Lax`.
3. In PostgreSQL, run `SELECT count(*) FROM spring_session;` to verify your session is stored in the database.
4. Restart the backend application server or container (`./mvnw spring-boot:run` or container redeploy).
5. Refresh the frontend application page. Verify you remain signed in and can navigate rooms without being kicked to the login screen.
6. Navigate to Settings -> Profile and upload an avatar picture (PNG or JPEG).
7. Verify the avatar renders immediately. In DevTools Network tab, check the avatar image request to `/uploads/avatars/...`: verify HTTP 200 and response header `Cache-Control: public, max-age=31536000, immutable`.
8. Navigate to Room -> Integrations -> GitHub and click "Connect GitHub". Verify redirection to GitHub authorization page and return to the room with connection active.
9. In PostgreSQL, run `SELECT provider, used_at FROM oauth_link_states WHERE provider = 'github';` to confirm the state was marked used upon callback.
10. Attempt to reuse the callback URL in a second private tab; confirm it rejects cleanly with `400 Bad Request` (`state_already_used`).

## (e) Rollback Notes
- Database changes in migration `V44` only add new tables (`SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES`, `oauth_link_states`) and do not alter existing entity tables.
- If rolling back backend code to an earlier revision without rolling back the database, older versions of the app will simply ignore the new tables and continue running with in-memory sessions.
- If performing a complete database rollback:
  ```sql
  DROP TABLE IF EXISTS oauth_link_states CASCADE;
  DROP TABLE IF EXISTS SPRING_SESSION_ATTRIBUTES CASCADE;
  DROP TABLE IF EXISTS SPRING_SESSION CASCADE;
  DELETE FROM flyway_schema_history WHERE version = '44';
  ```

## (f) Decisions and Assumptions
- Database migration `V44__spring_session_and_oauth_link_states.sql` was selected as the next sequential version following `V43`.
- `spring.session.jdbc.initialize-schema` was set to `never` so Flyway retains exclusive control over schema definitions and indexes across environments.
- Session cookie name was maintained as `JSESSIONID` to avoid breaking existing Nginx and Vercel proxy rewrite rules.
- Session persistence uses flush mode `on_save` and save mode `on_set_attribute` to eliminate unnecessary database writes on polling endpoints (`nav-badges`, `heartbeat`).
- `FileStorage` defaults to `LocalDiskFileStorage` for local development and falls back smoothly if S3 is not configured in non-production profiles.
- Image processor enforces strict 3MB upload limit, validates format magic bytes, downscales to 256x256, strips all metadata, and recompresses as high-quality JPEG under 150KB.
- Frontend `UserAvatar` includes fallback to `providerAvatarUrl` (from OAuth provider) when `/uploads/...` yields HTTP 404 before falling back to text initials.

## (g) Remaining Risks / Follow-ups
- For high concurrent traffic with Cloudflare R2, configuring an edge CDN domain (e.g. `cdn.domain.com`) in front of the bucket could allow offloading image downloads directly from the backend server.
- The `oauth_link_states` table is cleaned periodically by `CleanupJob` every hour; if millions of link attempts occur, an index on `expires_at` is already in place to ensure instant pruning.

## (h) Things the Human Owner Must Do
1. In Cloudflare R2 or AWS S3:
   - Create a bucket named `bracket-uploads` (or your chosen name).
   - Generate an Access Key ID and Secret Access Key with Read & Write permissions to that bucket.
2. In Render Dashboard for the backend web service:
   - Add environment variables:
     - `STORAGE_PROVIDER=s3`
     - `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` (for Cloudflare R2)
     - `S3_REGION=auto`
     - `S3_BUCKET=bracket-uploads`
     - `S3_ACCESS_KEY=<your-key-id>`
     - `S3_SECRET_KEY=<your-secret-key>`
     - `S3_PATH_STYLE=false`
     - `SESSION_TIMEOUT=8h`
3. In GitHub Developer Settings (OAuth Apps):
   - For your GitHub Sync / Link OAuth App, update Authorization Callback URL to:
     `https://<YOUR-VERCEL-DOMAIN>/api/v1/github/link/callback`
4. In Canva Developer Portal:
   - For your Canva Integration App, update the Redirect URI to:
     `https://<YOUR-VERCEL-DOMAIN>/api/v1/integrations/canva/callback`

