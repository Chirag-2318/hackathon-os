# Demo script

- [0:00 - 0:15] Hook: The problem of chaotic hackathon project starts (15s)
- [0:15 - 0:40] Product Tour: Uploading PDF brief and extracting rubrics in seconds (25s)
- [0:40 - 1:10] Execution Engine: Auto-generated dependency graph and task assignments (30s)
- [1:10 - 1:30] Wrap up and Call to Action (20s)

# Shot list
1. Close up of raw hackathon PDF announcement.
2. Fast screen recording of AI brief parsing.
3. Live interaction on Kanban board dragging tasks.
4. Final team photo and GitHub repo link.

# Likely judge Q&A

Q: What did you build this weekend?
A: We built the end-to-end backend in Spring Boot and the complete React TypeScript frontend from scratch.

Q: What breaks first?
A: Under extreme load, the third-party LLM rate limiter would reject concurrent calls, so we fallback to cached plans.

Q: How do you handle authentication?
A: OAuth2 session-based auth with HttpOnly cookies and no local storage tokens.

Q: Why not use an existing project management tool like Jira?
A: Jira has excessive configuration overhead; Hackathon OS generates the whole plan in under two minutes.

Q: How are task priorities determined?
A: Tasks with downstream blockers are prioritized as HIGH automatically.

Q: Is SSRF a concern with URL fetching?
A: We enforce strict IP range filtering and private network blocking on all link resolutions.

Q: How is the database structured?
A: Fully relational with PostgreSQL Flyway migrations and JSONB fields for flexible rubric criteria.

Q: What is the roadmap after the hackathon?
A: Real-time collaborative websockets and automatic GitHub pull request status webhooks.
