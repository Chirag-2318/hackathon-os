package com.hackathonos.backend.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.UploadedFile;
import com.hackathonos.backend.brief.UploadedFileRepository;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.email.EmailOutbox;
import com.hackathonos.backend.email.EmailOutboxRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.Notification;
import com.hackathonos.backend.notifications.NotificationRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskComment;
import com.hackathonos.backend.tasks.TaskCommentRepository;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.docs.DocComment;
import com.hackathonos.backend.docs.DocCommentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Instant;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class UserDataExportService {

    private static final Logger log = LoggerFactory.getLogger(UserDataExportService.class);

    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;
    private final UserPreferenceRepository preferenceRepository;
    private final UserSettingsRepository settingsRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomRepository roomRepository;
    private final IdeaRepository ideaRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final DocCommentRepository docCommentRepository;
    private final DocRepository docRepository;
    private final NotificationRepository notificationRepository;
    private final EmailOutboxRepository emailOutboxRepository;
    private final UserOAuthTokenRepository tokenRepository;
    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.docs.DocVersionRepository docVersionRepository;

    public UserDataExportService(ObjectMapper objectMapper,
                                 AppProperties appProperties,
                                 UserPreferenceRepository preferenceRepository,
                                 UserSettingsRepository settingsRepository,
                                 RoomMemberRepository memberRepository,
                                 RoomRepository roomRepository,
                                 IdeaRepository ideaRepository,
                                 TaskRepository taskRepository,
                                 TaskCommentRepository taskCommentRepository,
                                 DocCommentRepository docCommentRepository,
                                 DocRepository docRepository,
                                 NotificationRepository notificationRepository,
                                 EmailOutboxRepository emailOutboxRepository,
                                 UserOAuthTokenRepository tokenRepository,
                                 UploadedFileRepository uploadedFileRepository,
                                 UserRepository userRepository) {
        this.objectMapper = objectMapper;
        this.appProperties = appProperties;
        this.preferenceRepository = preferenceRepository;
        this.settingsRepository = settingsRepository;
        this.memberRepository = memberRepository;
        this.roomRepository = roomRepository;
        this.ideaRepository = ideaRepository;
        this.taskRepository = taskRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.docCommentRepository = docCommentRepository;
        this.docRepository = docRepository;
        this.notificationRepository = notificationRepository;
        this.emailOutboxRepository = emailOutboxRepository;
        this.tokenRepository = tokenRepository;
        this.uploadedFileRepository = uploadedFileRepository;
        this.userRepository = userRepository;
    }

    public record EmailMetadataExportDto(
            String template,
            Instant createdAt,
            String status,
            Instant sentAt
    ) {}

    public record IntegrationExportDto(
            String provider,
            Instant createdAt,
            Instant lastUsedAt,
            List<String> scopes
    ) {}

    @Transactional(readOnly = true)
    public void writeExportZip(User user, ZipOutputStream zos) throws IOException {
        Instant now = Instant.now();
        String username = user.getUsername() != null ? user.getUsername() : "user";

        // 1. README.txt
        String readme = """
                Hackathon OS - Account Data Export
                ===================================
                Export Date: %s
                Account: @%s

                Files included in this archive:
                - account.json: Account identifiers, login metadata, and export schema version.
                - profile.json: Your public profile details, role tags, and stack.
                - preferences.json: UI settings, theme, timezone, and system preferences.
                - memberships.json: Rooms you are a member of and your role in each.
                - content/ideas.json: Brainstormed ideas authored by you.
                - content/tasks.json: Tasks created by you or assigned to you.
                - content/comments.json: Task and document comments authored by you.
                - notifications.json: In-app notifications sent to your account.
                - emails.json: Transactional emails sent to your address (metadata only, no email bodies).
                - integrations.json: Connected third-party integrations (names and scopes only, never tokens).
                - uploads/: Your avatar and brief files you uploaded.
                - rooms/{roomSlug}/: Documents and summary markdown for rooms you belong to.
                """.formatted(now.toString(), username);
        writeTextEntry(zos, "README.txt", readme);

        // 2. account.json
        Map<String, Object> accountData = new LinkedHashMap<>();
        accountData.put("schemaVersion", 1);
        accountData.put("exportedAt", now.toString());
        accountData.put("userId", user.getId().toString());
        accountData.put("email", user.getEmail());
        accountData.put("signInProviders", List.of(user.getProvider() != null ? user.getProvider() : "DEV"));
        accountData.put("providerUserId", user.getProviderUserId());
        accountData.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        accountData.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        writeJsonEntry(zos, "account.json", accountData);

        // 3. profile.json
        Map<String, Object> profileData = new LinkedHashMap<>();
        profileData.put("username", user.getUsername());
        profileData.put("displayName", user.getName());
        profileData.put("avatarType", user.getAvatarType());
        profileData.put("avatarPreset", user.getAvatarPreset());
        profileData.put("avatarUrl", user.getAvatarUrl());
        profileData.put("roleTags", parseJsonList(user.getRoleTags()));
        profileData.put("experienceLevel", user.getExperienceLevel());
        profileData.put("goal", user.getGoal());
        profileData.put("techStack", parseJsonList(user.getTechStack()));
        writeJsonEntry(zos, "profile.json", profileData);

        // 4. preferences.json
        Map<String, Object> prefsData = new LinkedHashMap<>();
        prefsData.put("preferences", preferenceRepository.findById(user.getId()).orElse(null));
        prefsData.put("settings", settingsRepository.findById(user.getId()).orElse(null));
        writeJsonEntry(zos, "preferences.json", prefsData);

        // 5. memberships.json
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        List<Map<String, Object>> memberList = new ArrayList<>();
        List<Room> rooms = new ArrayList<>();
        for (RoomMember rm : memberships) {
            Optional<Room> rOpt = roomRepository.findById(rm.getRoomId());
            if (rOpt.isPresent()) {
                Room r = rOpt.get();
                rooms.add(r);
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("roomId", r.getId().toString());
                item.put("roomName", r.getName());
                item.put("role", rm.getRole());
                item.put("joinedAt", rm.getJoinedAt() != null ? rm.getJoinedAt().toString() : null);
                memberList.add(item);
            }
        }
        writeJsonEntry(zos, "memberships.json", memberList);

        // 6. content/ideas.json
        List<Idea> userIdeas = ideaRepository.findByAuthorId(user.getId());
        writeJsonEntry(zos, "content/ideas.json", userIdeas);

        // 7. content/tasks.json
        List<Task> userTasks = taskRepository.findByReporterIdOrAssigneeId(user.getId(), user.getId());
        writeJsonEntry(zos, "content/tasks.json", userTasks);

        // 8. content/comments.json
        List<TaskComment> taskComments = taskCommentRepository.findByAuthorId(user.getId());
        List<DocComment> docComments = docCommentRepository.findByAuthorId(user.getId());
        Map<String, Object> commentsData = Map.of(
                "taskComments", taskComments,
                "docComments", docComments
        );
        writeJsonEntry(zos, "content/comments.json", commentsData);

        // 9. notifications.json
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 500));
        writeJsonEntry(zos, "notifications.json", notifs);

        // 10. emails.json (metadata only, never bodies)
        List<EmailMetadataExportDto> emailList = new ArrayList<>();
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            List<EmailOutbox> outbox = emailOutboxRepository.findByToEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail());
            for (EmailOutbox e : outbox) {
                emailList.add(new EmailMetadataExportDto(e.getTemplate(), e.getCreatedAt(), e.getStatus().name(), e.getSentAt()));
            }
        }
        writeJsonEntry(zos, "emails.json", emailList);

        // 11. integrations.json (scopes only, never tokens)
        List<IntegrationExportDto> intList = new ArrayList<>();
        List<UserOAuthToken> tokens = tokenRepository.findByUserId(user.getId());
        for (UserOAuthToken t : tokens) {
            List<String> scopes = parseScopes(t.getScope());
            intList.add(new IntegrationExportDto(t.getProvider(), t.getConnectedAt(), t.getLastUsedAt(), scopes));
        }
        writeJsonEntry(zos, "integrations.json", intList);

        // 12. uploads/ (avatar and uploaded brief files)
        copyUploads(user, zos);

        // 13. rooms/{roomSlug}/docs/*.md and summary.md
        copyRoomData(rooms, zos);
    }

    private void copyUploads(User user, ZipOutputStream zos) {
        try {
            // User avatar if local file exists
            if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
                String sub = user.getAvatarUrl().substring("/uploads/avatars/".length());
                File avatarFile = new File(appProperties.getUploadDir(), "avatars/" + sub);
                if (avatarFile.exists() && avatarFile.isFile()) {
                    writePhysicalFile(zos, "uploads/avatar-" + sub, avatarFile);
                }
            }

            // User uploaded brief files
            List<UploadedFile> files = uploadedFileRepository.findByUploadedBy(user.getId());
            for (UploadedFile uf : files) {
                if (uf.getStoragePath() != null) {
                    File file = new File(uf.getStoragePath());
                    if (file.exists() && file.isFile()) {
                        String name = uf.getOriginalName() != null ? uf.getOriginalName().replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
                        writePhysicalFile(zos, "uploads/" + uf.getId() + "_" + name, file);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to stream some upload files in export: {}", e.getMessage());
        }
    }

    private void copyRoomData(List<Room> rooms, ZipOutputStream zos) {
        for (Room room : rooms) {
            try {
                String slug = slugify(room.getName() != null && !room.getName().isBlank() ? room.getName() : room.getId().toString());

                // summary.md
                StringBuilder sb = new StringBuilder();
                sb.append("# ").append(room.getName() != null ? room.getName() : "Untitled Room").append("\n\n");
                if (room.getDescription() != null && !room.getDescription().isBlank()) {
                    sb.append(room.getDescription()).append("\n\n");
                }
                sb.append("- **Stage:** ").append(room.getStage() != null ? room.getStage() : "BRAINSTORM").append("\n");
                sb.append("- **Created:** ").append(room.getCreatedAt()).append("\n\n");
                sb.append("## Team Members\n");

                List<RoomMember> members = memberRepository.findByRoomId(room.getId());
                for (RoomMember m : members) {
                    User u = userRepository.findById(m.getUserId()).orElse(null);
                    String handle = u != null && u.getUsername() != null ? "@" + u.getUsername() : "deleted";
                    sb.append("- ").append(handle).append(" (").append(m.getRole()).append(")\n");
                }
                sb.append("\n");

                writeTextEntry(zos, "rooms/" + slug + "/summary.md", sb.toString());

                // docs/*.md
                List<Doc> docs = docRepository.findByRoomId(room.getId());
                for (Doc doc : docs) {
                    String docFileName = doc.getFileName() != null && !doc.getFileName().isBlank()
                            ? doc.getFileName()
                            : (doc.getTitle() != null ? slugify(doc.getTitle()) + ".md" : "doc-" + doc.getId() + ".md");
                    if (!docFileName.endsWith(".md")) docFileName += ".md";
                    String content = "";
                    if (docVersionRepository != null) {
                        content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                                .map(dv -> dv.getContent() != null ? dv.getContent() : "")
                                .orElse("");
                    }
                    writeTextEntry(zos, "rooms/" + slug + "/docs/" + docFileName, content);
                }
            } catch (Exception e) {
                log.warn("Failed to export room {}: {}", room.getId(), e.getMessage());
            }
        }
    }

    private void writePhysicalFile(ZipOutputStream zos, String entryPath, File file) throws IOException {
        ZipEntry entry = new ZipEntry(entryPath);
        entry.setSize(file.length());
        zos.putNextEntry(entry);
        Files.copy(file.toPath(), zos);
        zos.closeEntry();
    }

    private void writeJsonEntry(ZipOutputStream zos, String entryPath, Object object) throws IOException {
        ZipEntry entry = new ZipEntry(entryPath);
        zos.putNextEntry(entry);
        byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(object);
        zos.write(bytes);
        zos.closeEntry();
    }

    private void writeTextEntry(ZipOutputStream zos, String entryPath, String text) throws IOException {
        ZipEntry entry = new ZipEntry(entryPath);
        zos.putNextEntry(entry);
        zos.write(text.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private String slugify(String text) {
        if (text == null) return "room";
        String s = text.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return s.isBlank() ? "room" : s;
    }

    @SuppressWarnings("unchecked")
    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<String> parseScopes(String scopes) {
        if (scopes == null || scopes.isBlank()) return Collections.emptyList();
        return Arrays.stream(scopes.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
