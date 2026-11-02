# 9. File & Media Handling

## 9.1 Upload Endpoints & Processing Pipeline
| File Type | Upload Endpoint | Controller & Service | Size Limit | Validation & Parsing | Storage Target | Serving Strategy |
|---|---|---|---|---|---|---|
| **User Avatar** | `POST /api/v1/users/avatar` | `UserController.java` -> `UserService.java` | 12 MB (Spring limit) | Image format MIME check | Local disk: `${APP_UPLOAD_DIR:./uploads}` (`/app/uploads` in Docker) | Static HTTP resource handler: `/uploads/**` with 1-year public cache |
| **Brief PDF** | `POST /api/v1/rooms/{roomId}/brief/source/pdf` | `BriefController.java` -> `BriefService.java` | 12 MB | PDF magic bytes; Apache PDFBox text extraction | In-Memory (text stored in `briefs.source_text`) | Text rendered in Brief UI; raw PDF discarded |
| **Pitch Rehearsal Audio** | `POST /api/v1/rooms/{roomId}/pitch/rehearsals/{id}/beats/{beatId}/audio` | `RehearsalController.java` -> `RehearsalService.java` | 5 MB ([RehearsalService.java:146](file:///backend/src/main/java/com/hackathonos/backend/pitchkit/RehearsalService.java#L146)) | Audio magic bytes (WebM: `1A 45 DF A3`, WAV: `RIFF...WAVE`, OGG: `OggS`, MP4: `ftyp`) | In-Memory (streamed to Groq Whisper STT API) | Raw audio discarded immediately; transcript text stored in `rehearsals.transcript` JSONB |
| **Pitch Deck PPTX/PDF** | `POST /api/v1/rooms/{roomId}/pitch/deck` | `PitchController.java` -> `PitchDeckService.java` | 12 MB | Apache POI OOXML (`.pptx`) / PDFBox (`.pdf`) | Parsed slide titles and text saved to `pitch_slides` table | Raw presentation discarded; slides rendered via Markdown/HTML in Deck UI |
| **OpenAPI Specification** | `POST /api/v1/rooms/{roomId}/apis/import` | `ApiHubController.java` -> `ApiHubService.java` | 5 MB | OpenAPI 3.0 validation via `SwaggerParser` | Parsed endpoints stored in `api_endpoints` relational table | Endpoints served via `/api/v1/rooms/{roomId}/apis/openapi.json` |
| **Room / User Data Export** | `GET /api/v1/rooms/{roomId}/export.zip`, `GET /api/v1/users/export.zip` | `RoomExportController.java`, `UserController.java` | N/A | Generated ZIP file | Temporary file in container filesystem | Streamed directly to response as `application/zip` |

---

## 9.2 Validation & Quotas
- **Global Size Limits ([application.yml:38-39](file:///backend/src/main/resources/application.yml#L38-L39))**:
  - `spring.servlet.multipart.max-file-size: 12MB`
  - `spring.servlet.multipart.max-request-size: 14MB`
- **Rehearsal Audio Limits**:
  - Chunk limit: 5 MB.
  - Per-rehearsal run cap: max 30 audio chunk uploads tracked via `uploadCountMap` in `RehearsalService.java:152`. Exceeding this returns HTTP 429 `UPLOAD_LIMIT`.
- **User Storage Quotas**:
  - Max disk storage quota: 50 MB per user (`app.max-upload-mb-per-user: 50` in `application.yml:144`).
  - Tracked in `user_upload_usage` table.

---

## 9.3 Storage Architecture & Render Ephemeral Disk Implications (CRITICAL)
- **Local Disk Dependency**: The application stores persistent file uploads (avatars) directly on the local container filesystem at `/app/uploads` ([backend/Dockerfile:21](file:///backend/Dockerfile#L21), [WebMvcConfig.java:50](file:///backend/src/main/java/com/hackathonos/backend/common/config/WebMvcConfig.java#L50)).
- **Zero Cloud Object Storage**: There is no AWS S3, Cloudflare R2, Google Cloud Storage, or MinIO integration in the codebase.
- **Render Ephemeral Filesystem Impact**:
  - Render web service containers have an **ephemeral root filesystem**.
  - Whenever Render:
    1. Spins down the free web service after 15 minutes of inactivity,
    2. Deploys a new Git commit, or
    3. Restarts the container due to memory limits,
    **the entire `/app/uploads` directory is destroyed and recreated empty**.
  - **User Impact**: All custom user avatars uploaded to `/app/uploads` vanish upon restart. Avatars fail to load (HTTP 404) until the user re-uploads their picture.
  - **Production Requirement**: Production deployment requires either mounting a Render Persistent Disk at `/app/uploads` or refactoring file uploads to an S3-compatible cloud object store.
