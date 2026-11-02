# 16. Open Questions for the Owner

The following items could not be conclusively determined from static source code inspection and require operational clarification from the project owner:

1. **Render Web Service Plan & Multi-Instance Target**:
   Is Brackit currently running on the Render Free Tier (512 MB RAM, spins down after 15 minutes of inactivity), Starter ($7/mo, always on), or a higher tier? Is horizontal scaling (running 2+ instances behind a load balancer) planned for the upcoming event?
2. **PostgreSQL Hosting & Connection Limits**:
   What managed PostgreSQL tier is provisioned on Render (e.g. Free Tier with max 20 connections, or Starter/Pro with 100+)? What is the exact server-side `max_connections` ceiling?
3. **External LLM Provider & Production Quotas**:
   Is Groq the sole production LLM provider, or are OpenAI / Azure OpenAI / self-hosted vLLM instances used in production? What is your current rate limit tier on Groq (Requests Per Minute / Tokens Per Minute)?
4. **Speech-to-Text Whisper Concurrency**:
   During the final 2 hours of a hackathon sprint, multiple teams will rehearse pitches simultaneously. What peak concurrent audio transcription throughput is expected, and what is the Whisper API's rate limit?
5. **Persistent Disk vs Cloud Object Storage Migration**:
   Has a Render Persistent Disk been mounted to `/app/uploads` to prevent user avatar data loss, or is there an intent to migrate file uploads to an S3-compatible service (Cloudflare R2, AWS S3)?
6. **Transactional Email Provider**:
   Is Gmail SMTP (`smtp.gmail.com:587`) intended for production delivery, or will an enterprise transactional provider (SendGrid, Postmark, AWS SES, Resend) be configured to avoid Gmail's strict 400 email/day limit?
7. **Reason for Excluded Backend Test Suites**:
   Why were 11 test suites (`ai`, `tasks`, `users`, `overview`, `checkpoints`, `invites`, `templates`) excluded from compilation in `backend/pom.xml`? Were they broken by recent schema changes, or are they obsolete?
8. **Deprecation Timeline for Duplicate Components**:
   Can legacy components—specifically `RoomSseBroadcaster.java`, `com.hackathonos.backend.pitch.PitchController`, and `frontend/src/api/useRoomEvents.ts`—be safely deprecated and removed in favor of `RoomEventHub`, `PitchKitController`, and `useRoomLive`?
9. **Expected Peak Concurrency Profile**:
   What is the anticipated peak concurrent user count during the final 3 hours before hackathon submission deadlines (e.g. 100, 300, 1,000 concurrent users)?
10. **Observed Production Failure Logs**:
    What specific error patterns or warnings have been observed in Render production dashboard logs (e.g. OOM kills, Hikari connection timeouts, SSE disconnects, or OAuth redirect mismatches)?
