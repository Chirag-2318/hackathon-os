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

    private static final Set<String> PROTECTED_DOCS = Set.of(
            "PRD.MD", "MVP.MD", "PROBLEM.MD", "CUT_LIST.MD", "RISKS.MD",
            "TECH_STACK.MD", "PHASES.MD", "DEMO_SCRIPT.MD", "QA.MD", "DECISIONS.MD"
    );

    private final DocRepository docRepository;
    private final DocVersionRepository versionRepository;
    private final DocCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final ActivityLogger activityLogger;
    private final DocHealthChecker healthChecker;

    public DocService(
            DocRepository docRepository,
            DocVersionRepository versionRepository,
            DocCommentRepository commentRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            ActivityLogger activityLogger,
            DocHealthChecker healthChecker
    ) {
        this.docRepository = docRepository;
        this.versionRepository = versionRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.activityLogger = activityLogger;
        this.healthChecker = healthChecker;
    }

    /**
     * Lists documents with health status and latest version preview.
     */
    @Transactional(readOnly = true)
    public DocListResponseDto listDocs(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<Doc> docs = docRepository.findByRoomIdOrderByFileNameAsc(roomId);
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
    @Transactional(readOnly = true)
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
     * Returns raw markdown content for single file download.
     */
    @Transactional(readOnly = true)
    public byte[] downloadDoc(UUID roomId, String fileName, User user) {
        roomAccess.requireMember(roomId, user);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "Document not found: " + fileName));

        List<DocVersion> versions = versionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        String content = versions.isEmpty() ? "" : versions.get(0).getContent();
        return content.getBytes(StandardCharsets.UTF_8);
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
}
