# Hackathon OS — Known Gaps & Future Roadmap

## 1. Intentional Non-Goals (Current Release)

1. **Third-Party Live Git Webhooks in Local Dev**:
   - Webhook reception from GitHub requires a publicly resolvable domain or tunnel (ngrok). In local development and automated E2E tests, git drift and commits are simulated deterministically via `/api/v1/dev/rooms/{roomId}/github/add-commits`.
2. **Native Video Rendering Engine**:
   - The platform records video links and checks submission video duration rather than transcoding raw MP4/WebM files on the server, avoiding heavy GPU worker requirements.
3. **Multi-Region Cross-Cluster Replication**:
   - Built as single-region PostgreSQL database with automated nightly backups and zero-downtime Flyway migrations.

---

## 2. Future Phase Enhancements

1. **Live Collaborative Cursor Presence**:
   - While real-time state synchronization is powered by SSE streams and debounce invalidation, character-by-character collaborative markdown editing via Yjs/WebRTC is planned for a future release.
2. **Judge Tournament Portal**:
   - Dedicated judge portal for scoring multiple rooms concurrently against rubric benchmarks.
3. **Automated AI Code Quality Review**:
   - Automated git PR review bot evaluating adherence to prompt bridge architecture contracts.
