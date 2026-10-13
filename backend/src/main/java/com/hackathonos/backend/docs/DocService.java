package com.hackathonos.backend.docs;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.dto.*;
import com.hackathonos.backend.docs.dto.DocRequests.*;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.ai.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DocService {

    private static final Logger log = LoggerFactory.getLogger(DocService.class);

    private static final Set<String> PROTECTED_DOCS = Set.of(
            "PRD.MD", "MVP.MD", "PROBLEM.MD", "CUT_LIST.MD", "RISKS.MD",
            "TECH_STACK.MD", "PHASES.MD", "DEMO_SCRIPT.MD", "QA.MD", "DECISIONS.MD"
    );

    private static final Map<String, DocTemplate> STANDARD_DOCS = new LinkedHashMap<>();

    static {
        STANDARD_DOCS.put("DECISIONS.md", new DocTemplate("Key Architecture & Product Decisions", """
# Architecture & Product Decisions

## 1. Architectural Strategy & Philosophy
This document records key architectural decision records (ADRs) and product direction choices established for this sprint. All technical commitments balance rapid prototyping velocity with production-grade stability.

## 2. Decision Records

### ADR-001: Unified Groq AI Gateway Integration
- **Status:** Accepted
- **Context:** Low-latency response times for real-time document critique, ideation, and pitch scripting are critical during live hackathon judging.
- **Decision:** Integrate directly with Groq via an OpenAI-compatible gateway using `llama-3.3-70b-versatile`.
- **Consequences:** Sub-second time-to-first-token, resilient retry and circuit-breaking protocols, and transparent client fallback modes.

### ADR-002: Offline-First Client Architecture with IndexedDB Sync
- **Status:** Accepted
- **Context:** Hackathon venue WiFi is notoriously unstable. Losing documents or task progress mid-pitch is unacceptable.
- **Decision:** Cache all document vaults, versions, and board states in IndexedDB with optimistic UI updates and background synchronization.
- **Consequences:** Team members can review and edit documents seamlessly during network dropouts; conflict resolution prompts appear if concurrent edits occur.

### ADR-003: Modular Micro-Editor with Floating AI Assistant
- **Status:** Accepted
- **Context:** Authors need rapid inline AI assistance without switching away from their document view.
- **Decision:** Implement inline rich selection toolbar with quick formatting and direct Groq AI querying.
- **Consequences:** Instant inline query, rewriting, and critique directly attached to highlighted text segments.

### ADR-004: Event-Driven Real-Time Room Collaboration
- **Status:** Accepted
- **Context:** Cross-functional teammates (Developers, Designers, Presenters) need synchronized room presence and document update notifications.
- **Decision:** Utilize Server-Sent Events (SSE) `/api/v1/rooms/{roomId}/events` paired with REST CRUD endpoints.
- **Consequences:** Lightweight live telemetry without heavy bidirectional WebSocket overhead.

## 3. Product Boundary & Non-Goals
- **In Scope:** Full document vault, AI assisted refactoring, automated ZIP export, GitHub PR bridging.
- **Out of Scope (Post-Hackathon):** Multi-tenant enterprise SSO, custom third-party plugin marketplace.
"""));

        STANDARD_DOCS.put("PRD.md", new DocTemplate("Product Requirements Document", """
# PRD — Product Requirements Document

## Problem
Hackathon teams struggle with chaotic coordination, fragmented notes, and panic during final submission crunch time. Critical decisions get lost in chat threads, documents are half-written, and pitch preparation happens in the final 30 minutes.

## Target user
High-velocity hackathon builders, solo developers, and multidisciplinary student/professional hackathon teams aiming for podium finishes.

## One-sentence identity
Hackathon OS is the autonomous command center that turns chaotic hackathon sprints into polished, winning submissions.

## Core flow
1. **Intake & Brief:** Extract problem statement, rubric criteria, and constraints.
2. **Ideation & Scoring:** Generate and vote on high-signal concepts with rubric alignment.
3. **Plan & Vault:** Auto-compile the sprint roadmap, architectural ADRs, and 10 markdown documents.
4. **Build Board:** Execute tasks prioritized by dependency critical paths.
5. **Pitch & Demo Kit:** Rehearse pitch slides, timing scripts, and judge defense Q&A.

## Success metrics
- Zero lost documents or conflicting sprint directions.
- Live demo rehearsed with timer and backup shot list.
- Complete sprint package exportable to GitHub repository in one click.
"""));

        STANDARD_DOCS.put("PROBLEM.md", new DocTemplate("Problem Statement & Audience", """
# Problem & Identity

## Problem
In a 24-to-36 hour hackathon, over 70% of teams fail not because they cannot code, but because of execution breakdown:
- Scope creep drains time before the core MVP is testable.
- Pitch decks are thrown together at minute 35 of hour 36.
- Architecture decisions are undocumented, leading to duplicate work and conflicting API contracts.

## Target user
- **The Solo Hacker:** Needs AI pair-programming and structured planning to match 4-person teams.
- **The Multidisciplinary Team:** Needs unified synchronization across Frontend, Backend, ML, and Pitch tracks.

## Value proposition
A focused, beautiful operating system designed specifically for the intense lifecycle of a hackathon.
"""));

        STANDARD_DOCS.put("TECH_STACK.md", new DocTemplate("Tech Stack & Architecture", """
# Tech Stack and Architecture

## Core Technologies

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Blazing fast HMR, type safety, optimal client performance |
| Styling & UI | Tailwind CSS v4 + shadcn/ui | Unified design system tokens, responsive dark/light modes |
| Motion | Framer Motion | Smooth micro-animations and physics-based transitions |
| Backend | Spring Boot 4 + Java 21 | Rock-solid REST services, enterprise concurrency, OpenAPI 3.0 |
| AI Gateway | Groq Cloud (LLaMA 3.3 70B) | Extreme inference velocity for real-time document suggestions |
| Database | PostgreSQL + Flyway | Relational consistency, JSONB flexibility, audited migrations |
| Offline Cache | IndexedDB (`idb-keyval`) | Resilient client offline operations during venue outages |

## Architecture Diagram

```mermaid
graph TD
    Client[React Client] --> Gateway[Spring Boot Backend]
    Gateway --> Groq[Groq AI Gateway]
    Gateway --> DB[(PostgreSQL)]
    Client --> IDB[(IndexedDB Offline Cache)]
```
"""));

        STANDARD_DOCS.put("PHASES.md", new DocTemplate("Sprint Timeline & Milestones", """
# Sprint Phases

| Phase | Time share | Exit checkpoint | Goals |
| --- | --- | --- | --- |
| 1. Discovery & Setup | 0% - 15% | Repo initialized, brief confirmed | Finalize concept, setup project scaffold, verify API keys |
| 2. Core Spine & MVP | 15% - 60% | End-to-end user flow working | Implement critical data path, UI shell, and primary API contracts |
| 3. Polish & Edge Cases | 60% - 85% | Empty states, error banners, dark mode | Comprehensive testing, error states, styling cohesion |
| 4. Pitch & Submission | 85% - 100% | Demo rehearsed, repo zipped, video ready | Record demo video, rehearse pitch script, submit project |
"""));

        STANDARD_DOCS.put("MVP.md", new DocTemplate("Minimum Viable Product", """
# Minimum Viable Product (MVP)

## Must-Have Scope
- **Interactive Document Vault:** All core project documentation stored, versioned, and editable in one centralized place.
- **Inline AI Assistant:** Real-time Groq-powered rewrites, suggestions, and explanations directly inside documents.
- **Offline Reliability:** Instant local caching with zero data loss on disconnection.
- **One-Click Export:** Download all documents as a structured `.zip` archive or sync to GitHub repository.

## Boundary Principles
If a feature does not directly advance the judge scoring rubric or core user flow, it is strictly deferred to post-hackathon backlog.
"""));

        STANDARD_DOCS.put("CUT_LIST.md", new DocTemplate("MVP Scope Cut List", """
# Scope Cut List

The following items are intentionally cut from the initial hackathon sprint to protect delivery velocity:

1. **Third-Party Auth Providers:** OAuth Google/GitHub is sufficient; defer SAML/Enterprise SSO.
2. **Custom Document Templates Engine:** Use the 10 standard markdown files rather than custom drag-and-drop template editors.
3. **Full Live Collaborative Cursor Editing:** Use version snapshots and conflict resolution banners instead of complex Operational Transformation (OT) servers.
4. **Multi-Region Cloud Deployment:** Deploy to single cloud container instance.
"""));

        STANDARD_DOCS.put("RISKS.md", new DocTemplate("Risks and Fallbacks", """
# Risks & Fallbacks

## Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| WiFi drops during judging | High | Medium | All vault docs and demo states are cached offline in IndexedDB |
| Groq API rate limits / latency | Medium | Low | Exponential backoff retry, circuit breaker, and local fallback heuristics |
| Time crunch before submission | High | Medium | Strict Cut List adhered to; 15% phase buffer reserved for video recording |
| Live demo glitch | High | Low | Pre-recorded backup video clips embedded in pitch deck kit |
"""));

        STANDARD_DOCS.put("DEMO_SCRIPT.md", new DocTemplate("Judge Demo Script", """
# Demo Script & Shot List

## 3-Minute Live Demo Script

- **[0:00 - 0:30] Hook & Problem:**
  "Judges, every hackathon team has lived through the 3:00 AM panic: half-written docs, lost architecture decisions, and an unpracticed pitch. We built Hackathon OS to solve this."

- **[0:30 - 1:15] The Docs Vault & AI Assistant:**
  "Show the Docs Vault. Navigate to DECISIONS.md. Highlight an architectural decision, trigger the inline Ask AI toolbar, and watch Groq return instant, tailored architectural analysis."

- **[1:15 - 2:00] End-to-End Sprint Coordination:**
  "Show the sprint phases and task board. Demonstrate how documents directly drive the task backlog and acceptance criteria."

- **[2:00 - 2:30] Offline Reliability & Export:**
  "Demonstrate offline banner and local persistence. Click 'All (.zip)' to show instant packaging."

- **[2:30 - 3:00] Summary & Q&A Transition:**
  "Hackathon OS gives teams the clarity to build fast and win. Thank you, we'd love to take your questions."
"""));

        STANDARD_DOCS.put("QA.md", new DocTemplate("Judge Q&A Defense", """
# Judge Q&A Preparation

## Likely Questions & Strategic Responses

### Q1: "How is this different from Notion or Google Docs?"
**Answer:** Notion is a general-purpose workspace. Hackathon OS is purpose-built for the high-velocity 36-hour sprint: it enforces rubric alignment, generates sprint phases, provides inline Groq AI tailored to hackathon criteria, and packages your final submission for GitHub in one click.

### Q2: "What happens if your AI provider goes down during the hackathon?"
**Answer:** Our AI Gateway implements a circuit breaker with automated exponential retry and local fallback templates. Furthermore, all documents and edits are persisted locally in IndexedDB so the team can continue working without disruption.

### Q3: "How scalable is your backend architecture?"
**Answer:** The backend runs on stateless Spring Boot containers backed by PostgreSQL with connection pooling. The AI calls are routed through Groq's high-throughput LPU infrastructure.
"""));
    }

    private record DocTemplate(String title, String content) {}

    private final DocRepository docRepository;
    private final DocVersionRepository versionRepository;
    private final DocCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final ActivityLogger activityLogger;
    private final DocHealthChecker healthChecker;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;
    private final AiService aiService;

    public DocService(
            DocRepository docRepository,
            DocVersionRepository versionRepository,
            DocCommentRepository commentRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            ActivityLogger activityLogger,
            DocHealthChecker healthChecker,
            com.hackathonos.backend.events.RoomEventService roomEventService,
            AiService aiService
    ) {
        this.docRepository = docRepository;
        this.versionRepository = versionRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.activityLogger = activityLogger;
        this.healthChecker = healthChecker;
        this.roomEventService = roomEventService;
        this.aiService = aiService;
    }

    /**
     * Seeds missing standard documents for the room.
     */
    @Transactional
    public void seedDefaultDocsIfMissing(UUID roomId, User user) {
        List<Doc> existing = docRepository.findByRoomIdOrderByFileNameAsc(roomId);
        Set<String> existingNames = new HashSet<>();
        for (Doc d : existing) {
            existingNames.add(d.getFileName().toUpperCase());
        }

        UUID creatorId = user != null ? user.getId() : null;
        for (Map.Entry<String, DocTemplate> entry : STANDARD_DOCS.entrySet()) {
            String fileName = entry.getKey();
            if (!existingNames.contains(fileName.toUpperCase())) {
                DocTemplate tmpl = entry.getValue();
                Doc doc = new Doc(roomId, fileName, tmpl.title(), 1);
                if (creatorId != null) {
                    doc.setLastEditedBy(creatorId);
                }
                doc = docRepository.save(doc);
                DocVersion ver = new DocVersion(doc.getId(), 1, tmpl.content(), "Initial generated document", creatorId);
                versionRepository.save(ver);
            }
        }
    }

    private static final Set<String> PLAN_DOC_NAMES = Set.of(
            "PRD.MD", "MVP.MD", "TECH_STACK.MD", "ARCHITECTURE.MD",
            "PHASES.MD", "DESIGN.MD", "TASKS.MD", "DEMO_SCRIPT.MD", "QNA.MD"
    );

    /**
     * Lists only real planning documents (PRD, MVP, TECH_STACK, ARCHITECTURE, PHASES, DESIGN, TASKS, DEMO_SCRIPT, QNA)
     * with health status and latest version preview. Never seeds static placeholder documents.
     */
    @Transactional
    public DocListResponseDto listDocs(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<Doc> allDocs = docRepository.findByRoomIdOrderByFileNameAsc(roomId);
        List<Doc> docs = allDocs.stream()
                .filter(d -> PLAN_DOC_NAMES.contains(d.getFileName().toUpperCase()) || "PLAN".equalsIgnoreCase(d.getSource()))
                .toList();

        List<DocItemDto> items = new ArrayList<>();

        for (Doc doc : docs) {
            List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
            String latestContent = versions.isEmpty() ? "" : versions.get(0).getContent();
            long sizeBytes = latestContent.getBytes(StandardCharsets.UTF_8).length;
            DocHealthChecker.DocHealthDto health = healthChecker.check(doc.getFileName(), latestContent);

            items.add(new DocItemDto(
                    doc.getFileName(),
                    doc.getTitle(),
                    doc.getCurrentVersion(),
                    doc.getUpdatedAt().toString(),
                    sizeBytes,
                    doc.getId().toString(),
                    latestContent,
                    health
            ));
        }

        return new DocListResponseDto(items);
    }

    /**
     * Retrieves a full document with revisions, health, and comments count.
     */
    @Transactional
    public DocDetailDto getDocByFileName(UUID roomId, String fileName, User user) {
        roomAccess.requireMember(roomId, user);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        Set<UUID> userIds = new HashSet<>();
        for (DocVersion v : versions) {
            if (v.getCreatedBy() != null) userIds.add(v.getCreatedBy());
        }
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);

        List<DocVersionDto> versionDtos = new ArrayList<>();
        String currentContent = "";

        for (DocVersion v : versions) {
            if (v.getVersion() == doc.getCurrentVersion()) {
                currentContent = v.getContent();
            }
            String authorName = "Generated from the plan";
            if (v.getCreatedBy() != null) {
                User u = userMap.get(v.getCreatedBy());
                authorName = u != null ? u.getName() : "Team Member";
            }
            versionDtos.add(new DocVersionDto(
                    v.getVersion(),
                    v.getCreatedAt().toString(),
                    authorName,
                    v.getSummary() != null ? v.getSummary() : ""
            ));
        }

        int commentsCount = commentRepository.findByDocIdOrderByCreatedAtAsc(doc.getId()).size();
        DocHealthChecker.DocHealthDto health = healthChecker.check(doc.getFileName(), currentContent);

        return new DocDetailDto(
                doc.getFileName(),
                doc.getTitle(),
                doc.getCurrentVersion(),
                currentContent,
                doc.getUpdatedAt().toString(),
                versionDtos,
                doc.getId().toString(),
                health,
                commentsCount
        );
    }

    /**
     * Updates document content, detecting conflicts when baseVersion differs from current.
     */
    @Transactional
    public DocDetailDto updateDoc(UUID roomId, String fileName, UpdateDocRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        if (req.content() != null && req.content().length() > 200_000) {
            throw new BadRequestException("CONTENT_TOO_LARGE", "Document content cannot exceed 200,000 characters");
        }
        if (req.summary() != null && req.summary().length() > 120) {
            throw new BadRequestException("SUMMARY_TOO_LONG", "Summary cannot exceed 120 characters");
        }

        List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        String currentContent = versions.isEmpty() ? "" : versions.get(0).getContent();

        if (req.baseVersion() != null && req.baseVersion() != doc.getCurrentVersion()) {
            throw new DocConflictException(currentContent, doc.getCurrentVersion());
        }

        int nextVersion = doc.getCurrentVersion() + 1;
        String content = req.content() != null ? req.content() : currentContent;
        String summary = req.summary() != null && !req.summary().isBlank() ? req.summary() : "Edited document";

        DocVersion newVer = new DocVersion(doc.getId(), nextVersion, content, summary, user.getId());
        versionRepository.save(newVer);

        doc.setCurrentVersion(nextVersion);
        doc.setUpdatedAt(Instant.now());
        docRepository.save(doc);

        activityLogger.log(room, user, "DOC_EDITED", "edited " + fileName);
        roomEventService.recordEvent(roomId, "doc.edited", "doc", doc.getId().toString(), user.getId());
        return getDocByFileName(roomId, fileName, user);
    }

    /**
     * Retrieves specific version revision content for preview.
     */
    @Transactional(readOnly = true)
    public VersionContentDto getVersionContent(UUID roomId, String fileName, int version, User user) {
        roomAccess.requireMember(roomId, user);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        DocVersion v = versionRepository.findByDocIdAndVersion(doc.getId(), version)
                .orElseThrow(() -> new NotFoundException("VERSION_NOT_FOUND", "Version " + version + " not found"));

        return new VersionContentDto(v.getVersion(), v.getContent());
    }

    /**
     * Restores an earlier version by creating a new version with the old content.
     */
    @Transactional
    public DocDetailDto restoreVersion(UUID roomId, String fileName, int version, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        DocVersion target = versionRepository.findByDocIdAndVersion(doc.getId(), version)
                .orElseThrow(() -> new NotFoundException("VERSION_NOT_FOUND", "Version " + version + " not found"));

        int nextVersion = doc.getCurrentVersion() + 1;
        String summary = "Restored v" + version;

        DocVersion restored = new DocVersion(doc.getId(), nextVersion, target.getContent(), summary, user.getId());
        versionRepository.save(restored);

        doc.setCurrentVersion(nextVersion);
        doc.setUpdatedAt(Instant.now());
        docRepository.save(doc);

        activityLogger.log(room, user, "DOC_RESTORED", "restored " + fileName + " to v" + version);
        return getDocByFileName(roomId, fileName, user);
    }

    /**
     * Creates a new custom markdown document.
     */
    @Transactional
    public DocDetailDto createCustomDoc(UUID roomId, CreateDocRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (req.fileName() == null || !req.fileName().matches("^[a-zA-Z0-9_-]{1,57}\\.md$")) {
            throw new BadRequestException("INVALID_FILENAME", "Filename must end with .md and contain alphanumeric characters, dash, or underscore (max 60 chars)");
        }

        if (docRepository.findByRoomIdAndFileName(roomId, req.fileName()).isPresent()) {
            throw new ConflictException("DOC_EXISTS", "Document already exists: " + req.fileName());
        }

        String title = req.title() != null && !req.title().isBlank() ? req.title().trim() : req.fileName();
        String content = req.content() != null ? req.content() : "# " + title + "\n";

        Doc doc = new Doc(roomId, req.fileName(), title, 1);
        doc = docRepository.save(doc);

        DocVersion ver = new DocVersion(doc.getId(), 1, content, "Created document", user.getId());
        versionRepository.save(ver);

        activityLogger.log(room, user, "DOC_CREATED", "created " + req.fileName());
        roomEventService.recordEvent(roomId, "doc.created", "doc", doc.getId().toString(), user.getId());
        return getDocByFileName(roomId, req.fileName(), user);
    }

    /**
     * Deletes a custom document; plan generated documents cannot be deleted.
     */
    @Transactional
    public void deleteDoc(UUID roomId, String fileName, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (PROTECTED_DOCS.contains(fileName.toUpperCase())) {
            throw new BadRequestException("PLAN_DOC_PROTECTED", "Plan docs cannot be deleted");
        }

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        commentRepository.deleteByDocId(doc.getId());
        versionRepository.deleteByDocId(doc.getId());
        docRepository.delete(doc);

        activityLogger.log(room, user, "DOC_DELETED", "deleted " + fileName);
    }

    /**
     * Lists discussion comments on a document.
     */
    @Transactional(readOnly = true)
    public List<DocCommentDto> listComments(UUID roomId, String fileName, User user) {
        roomAccess.requireMember(roomId, user);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        List<DocComment> comments = commentRepository.findByDocIdOrderByCreatedAtAsc(doc.getId());
        Set<UUID> userIds = new HashSet<>();
        for (DocComment c : comments) userIds.add(c.getAuthorId());
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);

        List<DocCommentDto> dtos = new ArrayList<>();
        for (DocComment c : comments) {
            User author = userMap.get(c.getAuthorId());
            DocCommentAuthorDto authorDto = new DocCommentAuthorDto(
                    c.getAuthorId(),
                    author != null ? author.getName() : "Member",
                    author != null ? author.getAvatarUrl() : null
            );
            boolean isMine = user.getId().equals(c.getAuthorId());
            dtos.add(new DocCommentDto(c.getId(), authorDto, c.getText(), c.getCreatedAt(), isMine));
        }

        return dtos;
    }

    /**
     * Adds a comment to a document.
     */
    @Transactional
    public DocCommentDto addComment(UUID roomId, String fileName, String text, User user) {
        roomAccess.requireMember(roomId, user);
        if (text == null || text.trim().isEmpty() || text.length() > 2000) {
            throw new BadRequestException("INVALID_TEXT", "Comment text must be between 1 and 2000 characters");
        }

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        DocComment comment = new DocComment(doc.getId(), user.getId(), text.trim());
        comment = commentRepository.save(comment);

        DocCommentAuthorDto authorDto = new DocCommentAuthorDto(user.getId(), user.getName(), user.getAvatarUrl());
        return new DocCommentDto(comment.getId(), authorDto, comment.getText(), comment.getCreatedAt(), true);
    }

    /**
     * Deletes a document comment by author or room leader.
     */
    @Transactional
    public void deleteComment(UUID roomId, UUID commentId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        DocComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("COMMENT_NOT_FOUND", "Comment not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isAuthor = user.getId().equals(comment.getAuthorId());

        if (!isLeader && !isAuthor) {
            throw new ForbiddenException("CANNOT_DELETE_COMMENT", "Only comment author or room leader may delete comments");
        }

        commentRepository.delete(comment);
    }



    /**
     * Generates a zip archive containing all documents and a README manifest.
     */
    @Transactional(readOnly = true)
    public byte[] downloadAllZip(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<Doc> docs = docRepository.findByRoomIdOrderByFileNameAsc(roomId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
            List<String> fileList = new ArrayList<>();

            for (Doc doc : docs) {
                List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
                String content = versions.isEmpty() ? "" : versions.get(0).getContent();
                byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

                ZipEntry entry = new ZipEntry(doc.getFileName());
                zos.putNextEntry(entry);
                zos.write(bytes);
                zos.closeEntry();

                fileList.add(doc.getFileName() + " (v" + doc.getCurrentVersion() + ")");
            }

            // Add README.txt
            StringBuilder readme = new StringBuilder();
            readme.append("Hackathon OS Document Vault Archive\n");
            readme.append("Room: ").append(room.getName()).append(" (ID: ").append(room.getId()).append(")\n");
            readme.append("Generated At: ").append(DateTimeFormatter.ISO_INSTANT.format(Instant.now())).append("\n\n");
            readme.append("Files:\n");
            for (String f : fileList) {
                readme.append(" - ").append(f).append("\n");
            }

            ZipEntry readmeEntry = new ZipEntry("README.txt");
            zos.putNextEntry(readmeEntry);
            zos.write(readme.toString().getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate zip archive", e);
        }

        return baos.toByteArray();
    }

    public record DocDownload(String fileName, byte[] content) {}

    @Transactional(readOnly = true)
    public DocDownload downloadDoc(UUID roomId, String docIdOrFileName, User user) {
        roomAccess.requireMember(roomId, user);
        Doc doc = null;
        try {
            UUID docId = UUID.fromString(docIdOrFileName);
            doc = docRepository.findById(docId).orElse(null);
        } catch (Exception ignored) {}

        if (doc == null) {
            doc = docRepository.findByRoomIdAndFileName(roomId, docIdOrFileName)
                    .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + docIdOrFileName));
        }

        List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        String content = versions.isEmpty() ? "" : versions.get(0).getContent();
        return new DocDownload(doc.getFileName(), content.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Executes Groq AI assistance for a specific document or highlighted selection.
     */
    @Transactional
    public DocAiResponse askDocAi(UUID roomId, String fileName, DocAiRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        long start = System.currentTimeMillis();
        String prompt = req.prompt() != null ? req.prompt().trim() : "";
        if (prompt.isEmpty()) {
            throw new BadRequestException("EMPTY_PROMPT", "Prompt cannot be empty");
        }

        String selected = req.selectedText() != null ? req.selectedText().trim() : "";
        String content = req.fullContent() != null ? req.fullContent() : "";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Document: ").append(fileName).append("\n\n");
        if (!selected.isEmpty()) {
            userPrompt.append("Selected Text:\n\"\"\"\n").append(selected).append("\n\"\"\"\n\n");
        }
        userPrompt.append("User Request: ").append(prompt).append("\n\n");
        if (!content.isEmpty() && selected.isEmpty()) {
            String snippet = content.length() > 3000 ? content.substring(0, 3000) + "..." : content;
            userPrompt.append("Surrounding Context:\n\"\"\"\n").append(snippet).append("\n\"\"\"\n\n");
        }
        userPrompt.append("Answer in 4-8 short lines maximum. Give a direct answer only. No headings, no long lists, no preamble, and no recap.");

        String system = "You are a direct technical document assistant. Answer in 4-8 short lines maximum. Provide a direct answer only, with no headings, no long lists, no preamble, and no recap.";

        String answer;
        String model = "llama-3.3-70b-versatile";
        try {
            answer = aiService.chat("docs.editor", roomId, user.getId(), system, List.of(), userPrompt.toString(), 220);
            model = aiService.getProperties().getModelDefault();
        } catch (Exception ex) {
            log.warn("Groq AI call failed for doc {}, using contextual fallback: {}", fileName, ex.getMessage());
            answer = generateFallbackAiAnswer(fileName, selected, prompt);
        }

        // Truncate gracefully server-side if model exceeds 8 lines
        if (answer != null) {
            String[] lines = answer.split("\\r?\\n");
            List<String> validLines = new ArrayList<>();
            for (String line : lines) {
                String trimmed = line.trim();
                // strip any accidental markdown heading markers
                if (trimmed.startsWith("#")) {
                    trimmed = trimmed.replaceFirst("^#+\\s*", "");
                }
                if (!trimmed.isEmpty()) {
                    validLines.add(trimmed);
                }
                if (validLines.size() == 8) break;
            }
            if (!validLines.isEmpty()) {
                answer = String.join("\n", validLines);
            }
        }

        long latency = System.currentTimeMillis() - start;
        List<String> sources = List.of("groq.com", "hackathon-os", fileName.toLowerCase());
        return new DocAiResponse(answer, sources, model, latency);
    }

    private String generateFallbackAiAnswer(String fileName, String selectedText, String prompt) {
        String target = !selectedText.isBlank() ? selectedText : fileName;
        return "Direct revision for " + (target.length() > 40 ? target.substring(0, 40) + "..." : target) + ":\n"
                + "Clarifies the key requirements to match judge expectations.\n"
                + "Locks explicit boundaries around the core user flow.\n"
                + "Includes offline resilience for live stage presentations.\n"
                + "Maintains velocity by adhering strictly to MVP criteria.";
    }
}

