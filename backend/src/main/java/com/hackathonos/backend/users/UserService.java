package com.hackathonos.backend.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.error.PayloadTooLargeException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.email.MailService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.users.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final UserApiKeyRepository apiKeyRepository;
    private final DataExportRepository exportRepository;
    private final NotificationRepository notificationRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final UserMapper userMapper;
    private final SecretCipher secretCipher;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final com.hackathonos.backend.email.MailService mailService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DataRetentionService retentionService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UserDataExportService userDataExportService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.email.EmailOutboxRepository emailOutboxRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UserOAuthTokenRepository tokenRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.ideas.IdeaRepository ideaRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.tasks.TaskRepository taskRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.tasks.TaskCommentRepository taskCommentRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.docs.DocCommentRepository docCommentRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.docs.DocVersionRepository docVersionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.brief.UploadedFileRepository uploadedFileRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.activity.ActivityEventRepository activityEventRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.invites.RoomInviteRepository roomInviteRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.email.UserEmailPreferenceRepository emailPreferenceRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.billing.UserPlanRepository userPlanRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.billing.PlanInterestRepository planInterestRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.ai.AiUsageDailyRepository aiUsageDailyRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.integrations.IntegrationsService integrationsService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.activity.ActivityLogger activityLogger;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.docs.DocRepository docRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.ai.UserAiKeyService userAiKeyService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.admin.AppSettingsService appSettingsService;


    public UserService(UserRepository userRepository,
                       UserSettingsRepository settingsRepository,
                       UserPreferenceRepository preferenceRepository,
                       UserApiKeyRepository apiKeyRepository,
                       DataExportRepository exportRepository,
                       NotificationRepository notificationRepository,
                       RoomRepository roomRepository,
                       RoomMemberRepository memberRepository,
                       UserMapper userMapper,
                       SecretCipher secretCipher,
                       AppProperties appProperties,
                       ObjectMapper objectMapper,
                       com.hackathonos.backend.email.MailService mailService) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.preferenceRepository = preferenceRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.exportRepository = exportRepository;
        this.notificationRepository = notificationRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.userMapper = userMapper;
        this.secretCipher = secretCipher;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.mailService = mailService;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void logOverwrittenAvatarsOnStartup() {
        try {
            long count = userRepository.findAll().stream()
                    .filter(User::isOnboardingCompleted)
                    .filter(u -> u.getAvatarUrl() != null &&
                            (u.getAvatarUrl().contains("googleusercontent.com") || u.getAvatarUrl().contains("githubusercontent.com")))
                    .count();
            log.info("Migration check: {} completed-onboarding users have avatar_url pointing to googleusercontent.com or githubusercontent.com", count);
        } catch (Exception e) {
            log.debug("Migration check skipped: {}", e.getMessage());
        }
    }

    /**
     * Resolves or provisions a user from an OAuth2 principal, updating profile details and ensuring default settings.
     * Throws AccountDeletedException (401) if the account was soft-deleted.
     */
    @Transactional
    public User findOrCreateFromPrincipal(org.springframework.security.oauth2.core.user.OAuth2User principal, String registrationId) {
        String provider;
        if (registrationId != null && !registrationId.isBlank()) {
            provider = "github".equalsIgnoreCase(registrationId) ? "GITHUB" : "GOOGLE";
        } else {
            provider = principal.getAttributes().containsKey("login") ? "GITHUB" : "GOOGLE";
        }

        String providerUserId;
        String email = (String) principal.getAttributes().get("email");
        String name;
        String avatarUrl;
        String login;

        if ("GITHUB".equals(provider)) {
            providerUserId = String.valueOf(principal.getAttributes().get("id"));
            login = (String) principal.getAttributes().get("login");
            String rawName = (String) principal.getAttributes().get("name");
            name = (rawName != null && !rawName.isBlank()) ? rawName : (login != null ? login : "GitHub User");
            avatarUrl = (String) principal.getAttributes().get("avatar_url");
        } else {
            providerUserId = String.valueOf(principal.getAttributes().get("sub"));
            login = null;
            String rawName = (String) principal.getAttributes().get("name");
            name = (rawName != null && !rawName.isBlank()) ? rawName : "Google User";
            avatarUrl = (String) principal.getAttributes().get("picture");
        }

        User user = userRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .map(existing -> {
                    if (existing.getDeletedAt() != null) {
                        throw new com.hackathonos.backend.common.error.AccountDeletedException("ACCOUNT_DELETED", "User account has been deleted");
                    }
                    existing.setLastLoginAt(Instant.now());
                    if (email != null) existing.setEmail(email);
                    if (avatarUrl != null) existing.setProviderAvatarUrl(avatarUrl);
                    // Login must only update provider-owned fields. Never overwrite name, username, avatar_type, avatar_preset or avatar_url.
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    if (appSettingsService != null) {
                        appSettingsService.checkCanSignUp(email);
                    }
                    User newUser = new User(
                            provider,
                            providerUserId,
                            name,
                            email,
                            null,
                            login
                    );
                    newUser.setProviderAvatarUrl(avatarUrl);
                    return userRepository.save(newUser);
                });

        if (!settingsRepository.existsById(user.getId())) {
            UserSettings settings = new UserSettings(user.getId(), user.getName());
            settingsRepository.save(settings);
        }

        return user;
    }

    /**
     * Loads identity details for the authenticated user along with their settings and unread count.
     * Used by the frontend on application boot to hydrate user state.
     */
    public UserDetailDto getMe(User user) {
        UserSettings settings = settingsRepository.findById(user.getId())
                .orElseGet(() -> settingsRepository.save(new UserSettings(user.getId(), user.getName())));
        UserPreference preferences = getOrCreatePreferences(user);
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());
        com.hackathonos.backend.users.dto.UserAiKeySummaryDto aiKeySummary = userAiKeyService != null
                ? userAiKeyService.getKeySummary(user.getId())
                : new com.hackathonos.backend.users.dto.UserAiKeySummaryDto(false, null, null);
        boolean isAdmin = appSettingsService != null && appSettingsService.isAdmin(user.getEmail());
        return userMapper.toDetailDto(user, settings, preferences, unread, aiKeySummary, isAdmin);
    }


    public UserPreference getOrCreatePreferences(User user) {
        return preferenceRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserPreference pref = new UserPreference(user.getId());
                    settingsRepository.findById(user.getId()).ifPresent(s -> {
                        if (s.getTheme() != null) pref.setTheme(s.getTheme());
                        if (s.getTimezone() != null) pref.setTimezone(s.getTimezone());
                    });
                    return preferenceRepository.save(pref);
                });
    }

    public UserPreferenceDto getPreferences(User user) {
        return userMapper.toPreferenceDto(getOrCreatePreferences(user));
    }

    @Transactional
    public UserPreferenceDto updatePreferences(User user, UpdateUserPreferenceRequest request) {
        if (request == null) {
            return getPreferences(user);
        }

        if (request.theme() != null) {
            String t = request.theme().toLowerCase().trim();
            if (!List.of("light", "dark", "system").contains(t)) {
                throw new BadRequestException("INVALID_THEME", "Theme must be one of: light, dark, system");
            }
        }
        if (request.textSize() != null) {
            String ts = request.textSize().toLowerCase().trim();
            if (!List.of("small", "default", "large").contains(ts)) {
                throw new BadRequestException("INVALID_TEXT_SIZE", "Text size must be one of: small, default, large");
            }
        }
        if (request.motion() != null) {
            String m = request.motion().toLowerCase().trim();
            if (!List.of("system", "on", "off").contains(m)) {
                throw new BadRequestException("INVALID_MOTION", "Motion must be one of: system, on, off");
            }
        }
        if (request.sidebarDefault() != null) {
            String sd = request.sidebarDefault().toLowerCase().trim();
            if (!List.of("expanded", "collapsed").contains(sd)) {
                throw new BadRequestException("INVALID_SIDEBAR_DEFAULT", "Sidebar default must be one of: expanded, collapsed");
            }
        }
        if (request.timeFormat() != null) {
            String tf = request.timeFormat().toLowerCase().trim();
            if (!List.of("12h", "24h").contains(tf)) {
                throw new BadRequestException("INVALID_TIME_FORMAT", "Time format must be one of: 12h, 24h");
            }
        }
        if (request.timezone() != null && !request.timezone().isBlank()) {
            if (request.timezone().length() > 100) {
                throw new BadRequestException("INVALID_TIMEZONE", "Timezone exceeds maximum length");
            }
        }

        UserPreference pref = getOrCreatePreferences(user);
        if (request.theme() != null) {
            String t = request.theme().toLowerCase().trim();
            pref.setTheme(t);
            settingsRepository.findById(user.getId()).ifPresent(s -> {
                s.setTheme(t);
                settingsRepository.save(s);
            });
        }
        if (request.textSize() != null) {
            pref.setTextSize(request.textSize().toLowerCase().trim());
        }
        if (request.motion() != null) {
            pref.setMotion(request.motion().toLowerCase().trim());
        }
        if (request.sidebarDefault() != null) {
            pref.setSidebarDefault(request.sidebarDefault().toLowerCase().trim());
        }
        if (request.timeFormat() != null) {
            pref.setTimeFormat(request.timeFormat().toLowerCase().trim());
        }
        if (request.timezone() != null) {
            String tz = request.timezone().isBlank() ? null : request.timezone().trim();
            pref.setTimezone(tz);
            if (tz != null) {
                settingsRepository.findById(user.getId()).ifPresent(s -> {
                    s.setTimezone(tz);
                    settingsRepository.save(s);
                });
            }
        }
        pref.setUpdatedAt(Instant.now());
        UserPreference saved = preferenceRepository.save(pref);
        return userMapper.toPreferenceDto(saved);
    }

    /**
     * Returns full user settings including appearance, notifications, billing plan, and API keys.
     * Keys only expose the last 4 characters for security.
     */
    public UserSettingsDto getSettings(User user) {
        UserSettings settings = getOrCreateSettings(user);
        List<UserApiKey> keys = apiKeyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return userMapper.toSettingsDto(user, settings, keys);
    }

    /**
     * Partially updates user preferences including display name, theme, timezone, and notification toggles.
     * Validates that timezone is an authentic IANA zone identifier.
     */
    @Transactional
    public UserSettingsDto updateSettings(User user, UpdateSettingsRequest request) {
        UserSettings settings = getOrCreateSettings(user);
        applySettingsUpdate(settings, request);
        settings.setUpdatedAt(Instant.now());
        settingsRepository.save(settings);

        boolean userChanged = false;
        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setName(request.displayName().trim());
            userChanged = true;
        }

        if (request.profile() != null) {
            Map<String, Object> prof = request.profile();
            if (prof.get("displayName") instanceof String name && !name.isBlank()) {
                user.setName(name.trim());
                userChanged = true;
            }
            if (prof.get("username") instanceof String un && !un.isBlank()) {
                String norm = un.trim().toLowerCase();
                if (!norm.equals(user.getUsername())) {
                    UsernameAvailableResponse avail = checkUsernameAvailability(norm, user.getId());
                    if (!avail.available()) {
                        throw new ConflictException("USERNAME_TAKEN", avail.reason());
                    }
                    user.setUsername(norm);
                    userChanged = true;
                }
            } else if (prof.get("githubHandle") instanceof String gh && !gh.isBlank()) {
                if (user.getUsername() == null || user.getUsername().isBlank()) {
                    String norm = gh.trim().toLowerCase();
                    UsernameAvailableResponse avail = checkUsernameAvailability(norm, user.getId());
                    if (avail.available()) {
                        user.setUsername(norm);
                        userChanged = true;
                    }
                }
            }
            if (prof.get("roleTags") instanceof List<?> roles) {
                try {
                    user.setRoleTags(objectMapper.writeValueAsString(roles));
                    userChanged = true;
                } catch (Exception ignored) {}
            }
            if (prof.get("skills") instanceof String skillsStr) {
                List<String> list = Arrays.stream(skillsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                try {
                    user.setTechStack(objectMapper.writeValueAsString(list));
                    userChanged = true;
                } catch (Exception ignored) {}
            } else if (prof.get("techStack") instanceof List<?> stack) {
                try {
                    user.setTechStack(objectMapper.writeValueAsString(stack));
                    userChanged = true;
                } catch (Exception ignored) {}
            }
            if (prof.get("availability") instanceof String avail && !avail.isBlank()) {
                user.setExperienceLevel(avail.trim());
                userChanged = true;
            }
            if (prof.get("avatarUrl") instanceof String av && !av.isBlank()) {
                user.setAvatarUrl(av.trim());
                userChanged = true;
            }
        }

        if (userChanged) {
            user = userRepository.save(user);
        }

        List<UserApiKey> keys = apiKeyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return userMapper.toSettingsDto(user, settings, keys);
    }

    /**
     * Encrypts and persists an external provider API key for the user.
     * Only the last 4 characters are ever returned to the client.
     */
    @Transactional
    public ApiKeyDto addApiKey(User user, AddApiKeyRequest request) {
        validateProvider(request.provider());
        String encrypted = secretCipher.encrypt(request.key().trim());
        String cleanKey = request.key().trim();
        String last4 = cleanKey.length() <= 4 ? cleanKey : cleanKey.substring(cleanKey.length() - 4);

        UserApiKey apiKey = new UserApiKey(
                user.getId(),
                request.provider().trim().toUpperCase(),
                request.label().trim(),
                encrypted,
                last4
        );
        apiKeyRepository.save(apiKey);
        return userMapper.toApiKeyDto(apiKey);
    }

    /**
     * Deletes a stored API key by ID if owned by the caller.
     */
    @Transactional
    public void deleteApiKey(User user, UUID apiKeyId) {
        UserApiKey key = apiKeyRepository.findByIdAndUserId(apiKeyId, user.getId())
                .orElseThrow(() -> new NotFoundException("API_KEY_NOT_FOUND", "API key not found"));
        apiKeyRepository.delete(key);
    }

    @Transactional(readOnly = true)
    public DataSummaryResponse getDataSummary(User user) {
        // Account
        List<String> providers = user.getProvider() != null ? List.of(user.getProvider()) : List.of("DEV");
        DataSummaryResponse.AccountSummary account = new DataSummaryResponse.AccountSummary(
                user.getEmail(),
                providers,
                user.getLastLoginAt()
        );

        // Profile
        List<String> roles = parseJsonList(user.getRoleTags());
        List<String> stack = parseJsonList(user.getTechStack());
        DataSummaryResponse.ProfileSummary profile = new DataSummaryResponse.ProfileSummary(
                user.getUsername(),
                user.getName(),
                user.getAvatarUrl(),
                roles,
                user.getExperienceLevel(),
                user.getGoal(),
                stack
        );

        // Rooms
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        List<DataSummaryResponse.RoomMembershipSummary> rooms = new ArrayList<>();
        for (RoomMember m : memberships) {
            roomRepository.findById(m.getRoomId()).ifPresent(r ->
                    rooms.add(new DataSummaryResponse.RoomMembershipSummary(r.getId(), r.getName(), m.getRole())));
        }

        // Content
        long ideasCount = ideaRepository != null ? ideaRepository.countByAuthorId(user.getId()) : 0;
        long tasksCount = taskRepository != null ? taskRepository.countByReporterIdOrAssigneeId(user.getId(), user.getId()) : 0;
        long taskComments = taskCommentRepository != null ? taskCommentRepository.countByAuthorId(user.getId()) : 0;
        long docComments = docCommentRepository != null ? docCommentRepository.countByAuthorId(user.getId()) : 0;
        long docsEdited = docVersionRepository != null ? docVersionRepository.countByCreatedBy(user.getId()) : 0;
        DataSummaryResponse.ContentSummary content = new DataSummaryResponse.ContentSummary(
                ideasCount,
                tasksCount,
                taskComments + docComments,
                docsEdited
        );

        // Files
        int fileCount = 0;
        long totalSizeBytes = 0;
        if (uploadedFileRepository != null) {
            List<com.hackathonos.backend.brief.UploadedFile> files = uploadedFileRepository.findByUploadedBy(user.getId());
            fileCount += files.size();
            for (com.hackathonos.backend.brief.UploadedFile f : files) {
                totalSizeBytes += f.getSizeBytes();
            }
        }
        if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
            File avFile = new File(appProperties.getUploadDir(), "avatars/" + user.getAvatarUrl().substring("/uploads/avatars/".length()));
            if (avFile.exists() && avFile.isFile()) {
                fileCount += 1;
                totalSizeBytes += avFile.length();
            }
        }
        DataSummaryResponse.FilesSummary filesSummary = new DataSummaryResponse.FilesSummary(
                fileCount,
                totalSizeBytes,
                formatFileSize(totalSizeBytes)
        );

        // Notifications
        long notifCount = notificationRepository.countByUserId(user.getId());
        DataSummaryResponse.CountSummary notifications = new DataSummaryResponse.CountSummary(notifCount);

        // Email log
        long emailCount = (emailOutboxRepository != null && user.getEmail() != null)
                ? emailOutboxRepository.countByToEmailIgnoreCase(user.getEmail())
                : 0;
        DataSummaryResponse.CountSummary emailLog = new DataSummaryResponse.CountSummary(emailCount);

        // Integrations
        boolean ghEncrypted = tokenRepository != null && tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB").isPresent();
        DataSummaryResponse.IntegrationsSummary integrations = new DataSummaryResponse.IntegrationsSummary(ghEncrypted);

        // Preferences
        UserPreferenceDto preferences = getPreferences(user);

        // Retention
        int notifRetention = retentionService != null ? retentionService.getNotificationsRetentionDays() : 90;
        int emailRetention = retentionService != null ? retentionService.getEmailLogRetentionDays() : 90;
        int roomRetention = retentionService != null ? retentionService.getDeletedRoomsRetentionDays() : 30;
        DataSummaryResponse.RetentionSummary retention = new DataSummaryResponse.RetentionSummary(
                notifRetention,
                emailRetention,
                roomRetention
        );

        return new DataSummaryResponse(
                account,
                profile,
                rooms,
                content,
                filesSummary,
                notifications,
                emailLog,
                integrations,
                preferences,
                retention
        );
    }

    public void streamExportZip(User user, java.util.zip.ZipOutputStream zos) throws IOException {
        if (userDataExportService != null) {
            userDataExportService.writeExportZip(user, zos);
        }
    }

    @Transactional(readOnly = true)
    public DeletePreviewResponse getDeletePreview(User user) {
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        List<DeletePreviewResponse.BlockerRoom> blockers = new ArrayList<>();
        List<DeletePreviewResponse.WillDeleteRoom> willDelete = new ArrayList<>();
        List<UUID> stayingRoomIds = new ArrayList<>();

        for (RoomMember m : memberships) {
            Optional<Room> rOpt = roomRepository.findById(m.getRoomId());
            if (rOpt.isEmpty()) continue;
            Room r = rOpt.get();
            long memberCount = memberRepository.countByRoomId(r.getId());

            if (memberCount <= 1) {
                willDelete.add(new DeletePreviewResponse.WillDeleteRoom(r.getId(), r.getName()));
            } else {
                stayingRoomIds.add(r.getId());
                if ("LEADER".equalsIgnoreCase(m.getRole())) {
                    blockers.add(new DeletePreviewResponse.BlockerRoom(r.getId(), r.getName(), memberCount));
                }
            }
        }

        long ideasCount = 0;
        long tasksCount = 0;
        long commentsCount = 0;

        if (!stayingRoomIds.isEmpty()) {
            if (ideaRepository != null) {
                ideasCount = ideaRepository.findByAuthorId(user.getId()).stream()
                        .filter(i -> stayingRoomIds.contains(i.getRoomId()))
                        .count();
            }
            if (taskRepository != null) {
                tasksCount = taskRepository.findByReporterIdOrAssigneeId(user.getId(), user.getId()).stream()
                        .filter(t -> stayingRoomIds.contains(t.getRoomId()))
                        .count();
            }
            if (taskCommentRepository != null) {
                commentsCount += taskCommentRepository.findByAuthorId(user.getId()).size();
            }
            if (docCommentRepository != null) {
                commentsCount += docCommentRepository.findByAuthorId(user.getId()).size();
            }
        }

        return new DeletePreviewResponse(
                blockers,
                willDelete,
                new DeletePreviewResponse.WillAnonymiseSummary(ideasCount, tasksCount, commentsCount)
        );
    }

    @Transactional
    public void deleteAccount(User user, DeleteAccountRequest request, HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse httpResponse) {
        // 1. Validate username confirmation
        String confirmedUsername = request != null ? (request.confirmUsername() != null ? request.confirmUsername() : request.confirm()) : null;
        if (confirmedUsername == null || !confirmedUsername.trim().equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("CONFIRMATION_MISMATCH", "Body must include confirmUsername matching @" + user.getUsername());
        }

        // 2. Check blockers
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        List<Room> blockerRooms = new ArrayList<>();
        List<Room> soloRooms = new ArrayList<>();
        List<UUID> stayingRoomIds = new ArrayList<>();

        for (RoomMember m : memberships) {
            Optional<Room> rOpt = roomRepository.findById(m.getRoomId());
            if (rOpt.isEmpty()) continue;
            Room r = rOpt.get();
            long memberCount = memberRepository.countByRoomId(r.getId());
            if (memberCount <= 1) {
                soloRooms.add(r);
            } else {
                stayingRoomIds.add(r.getId());
                if ("LEADER".equalsIgnoreCase(m.getRole())) {
                    blockerRooms.add(r);
                }
            }
        }

        if (!blockerRooms.isEmpty()) {
            if (!Boolean.TRUE.equals(request.autoTransferLeadership())) {
                List<String> names = blockerRooms.stream().map(Room::getName).toList();
                throw new ConflictException("TRANSFER_LEADERSHIP_REQUIRED",
                        "You are the leader of rooms with teammates: " + String.join(", ", names) +
                                ". Transfer leadership before deleting your account, or enable autoTransferLeadership.",
                        names);
            }

            // Transfer each blocker room to its longest-standing member
            for (Room br : blockerRooms) {
                List<RoomMember> team = memberRepository.findByRoomId(br.getId());
                RoomMember longestStanding = team.stream()
                        .filter(m -> !m.getUserId().equals(user.getId()))
                        .min(Comparator.comparing(m -> m.getJoinedAt() != null ? m.getJoinedAt() : Instant.EPOCH))
                        .orElse(null);
                if (longestStanding != null) {
                    longestStanding.setRole("LEADER");
                    memberRepository.save(longestStanding);
                    User newLeader = userRepository.findById(longestStanding.getUserId()).orElse(null);
                    String handle = newLeader != null && newLeader.getUsername() != null ? "@" + newLeader.getUsername() : "a teammate";
                    if (activityLogger != null) {
                        activityLogger.log(br, user, "LEADERSHIP_TRANSFERRED", "Leadership transferred to " + handle);
                    }
                }
            }
        }

        List<File> filesToDelete = new ArrayList<>();

        // 3. Solo rooms: hard delete room and contents
        for (Room sr : soloRooms) {
            if (uploadedFileRepository != null) {
                List<com.hackathonos.backend.brief.UploadedFile> roomFiles = uploadedFileRepository.findByRoomIdOrderByCreatedAtDesc(sr.getId());
                for (com.hackathonos.backend.brief.UploadedFile rf : roomFiles) {
                    if (rf.getStoragePath() != null) filesToDelete.add(new File(rf.getStoragePath()));
                }
                uploadedFileRepository.deleteByRoomId(sr.getId());
            }
            if (roomInviteRepository != null) roomInviteRepository.deleteByRoomId(sr.getId());
            if (taskCommentRepository != null) {
                List<Task> roomTasks = taskRepository != null ? taskRepository.findByRoomId(sr.getId()) : Collections.emptyList();
                for (Task rt : roomTasks) {
                    taskCommentRepository.deleteByTaskId(rt.getId());
                }
            }
            if (taskRepository != null) taskRepository.deleteByRoomId(sr.getId());
            if (ideaRepository != null) ideaRepository.deleteByRoomId(sr.getId());
            if (docCommentRepository != null) {
                List<Doc> roomDocs = docRepository != null ? docRepository.findByRoomId(sr.getId()) : Collections.emptyList();
                for (Doc rd : roomDocs) {
                    docCommentRepository.deleteByDocId(rd.getId());
                }
            }
            if (docVersionRepository != null) {
                List<Doc> roomDocs = docRepository != null ? docRepository.findByRoomId(sr.getId()) : Collections.emptyList();
                for (Doc rd : roomDocs) {
                    docVersionRepository.deleteByDocId(rd.getId());
                }
            }
            if (docRepository != null) docRepository.deleteByRoomId(sr.getId());
            if (activityEventRepository != null) activityEventRepository.deleteByRoomId(sr.getId());
            memberRepository.deleteByRoomId(sr.getId());
            roomRepository.delete(sr);
        }

        // 4. Staying rooms: anonymize content to null author
        if (ideaRepository != null) ideaRepository.anonymizeByAuthorId(user.getId());
        if (taskCommentRepository != null) taskCommentRepository.anonymizeByAuthorId(user.getId());
        if (docCommentRepository != null) docCommentRepository.anonymizeByAuthorId(user.getId());
        if (docVersionRepository != null) docVersionRepository.anonymizeByCreatedBy(user.getId());
        if (activityEventRepository != null) activityEventRepository.anonymizeByActorId(user.getId());
        if (taskRepository != null) taskRepository.unassignUser(user.getId());
        if (roomInviteRepository != null) roomInviteRepository.revokePendingByInvitedBy(user.getId());
        memberRepository.deleteByUserId(user.getId());

        // 5. User records cleanup
        notificationRepository.deleteByUserId(user.getId());
        if (emailPreferenceRepository != null) emailPreferenceRepository.deleteByUserId(user.getId());
        preferenceRepository.deleteById(user.getId());
        settingsRepository.deleteById(user.getId());
        apiKeyRepository.deleteByUserId(user.getId());
        exportRepository.deleteByUserId(user.getId());
        if (userPlanRepository != null) userPlanRepository.deleteById(user.getId());
        if (planInterestRepository != null) planInterestRepository.deleteByUserId(user.getId());
        if (aiUsageDailyRepository != null) aiUsageDailyRepository.deleteByUserId(user.getId());
        if (emailOutboxRepository != null && user.getEmail() != null) {
            emailOutboxRepository.deleteByToEmailIgnoreCase(user.getEmail());
        }

        if (uploadedFileRepository != null) {
            List<com.hackathonos.backend.brief.UploadedFile> uFiles = uploadedFileRepository.findByUploadedBy(user.getId());
            for (com.hackathonos.backend.brief.UploadedFile uf : uFiles) {
                if (uf.getStoragePath() != null) filesToDelete.add(new File(uf.getStoragePath()));
            }
            uploadedFileRepository.deleteByUploadedBy(user.getId());
        }

        if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("/uploads/avatars/")) {
            File avFile = new File(appProperties.getUploadDir(), "avatars/" + user.getAvatarUrl().substring("/uploads/avatars/".length()));
            filesToDelete.add(avFile);
        }

        String ghEncryptedToken = null;
        if (tokenRepository != null) {
            Optional<UserOAuthToken> ghToken = tokenRepository.findByUserIdAndProvider(user.getId(), "GITHUB");
            if (ghToken.isPresent()) {
                ghEncryptedToken = ghToken.get().getAccessTokenEncrypted();
            }
            tokenRepository.deleteByUserId(user.getId());
        }

        UUID userId = user.getId();
        userRepository.delete(user);

        // 6. Invalidate session and clear cookies
        if (httpRequest != null) {
            HttpSession session = httpRequest.getSession(false);
            if (session != null) {
                session.invalidate();
            }
        }
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        if (httpResponse != null) {
            clearCookie(httpResponse, "JSESSIONID");
            clearCookie(httpResponse, "SESSION");
            clearCookie(httpResponse, "XSRF-TOKEN");
        }

        // 7. Post-commit: delete disk files, revoke GitHub grant, log hashed user ID
        final String finalGhToken = ghEncryptedToken;
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            for (File f : filesToDelete) {
                                try {
                                    if (f.exists()) f.delete();
                                } catch (Exception ignored) {}
                            }
                            if (finalGhToken != null && integrationsService != null) {
                                try {
                                    integrationsService.tryRevokeGitHubGrant(finalGhToken);
                                } catch (Exception ignored) {}
                            }
                            log.info("Account permanently deleted for user hash: {}", hashUserId(userId));
                        }
                    }
            );
        } else {
            for (File f : filesToDelete) {
                try {
                    if (f.exists()) f.delete();
                } catch (Exception ignored) {}
            }
            if (finalGhToken != null && integrationsService != null) {
                try {
                    integrationsService.tryRevokeGitHubGrant(finalGhToken);
                } catch (Exception ignored) {}
            }
            log.info("Account permanently deleted for user hash: {}", hashUserId(userId));
        }
    }

    private void clearCookie(jakarta.servlet.http.HttpServletResponse response, String name) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from(name, "")
                .path("/")
                .maxAge(0)
                .secure(appProperties.getCookie().isSecure())
                .sameSite(appProperties.getCookie().getSameSite())
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String hashUserId(UUID userId) {
        if (userId == null) return "null";
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(userId.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return "redacted";
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format(Locale.ENGLISH, "%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }

    private UserSettings getOrCreateSettings(User user) {
        return settingsRepository.findById(user.getId())
                .orElseGet(() -> settingsRepository.save(new UserSettings(user.getId(), user.getName())));
    }

    private void validateProvider(String provider) {
        String upper = provider.trim().toUpperCase();
        if (!upper.equals("ANTHROPIC") && !upper.equals("OPENAI") && !upper.equals("GEMINI")) {
            throw new BadRequestException("INVALID_PROVIDER", "Provider must be ANTHROPIC, OPENAI, or GEMINI");
        }
    }

    private void applySettingsUpdate(UserSettings settings, UpdateSettingsRequest request) {
        if (request.displayName() != null) settings.setDisplayName(request.displayName().trim());
        if (request.theme() != null) settings.setTheme(request.theme().trim().toLowerCase());
        if (request.timezone() != null) {
            validateTimezone(request.timezone().trim());
            settings.setTimezone(request.timezone().trim());
        }
        if (request.notifyDeadlines() != null) settings.setNotifyDeadlines(request.notifyDeadlines());
        if (request.notifyMentions() != null) settings.setNotifyMentions(request.notifyMentions());
        if (request.notifyBlocked() != null) settings.setNotifyBlocked(request.notifyBlocked());
        if (request.notifyEmail() != null) settings.setNotifyEmail(request.notifyEmail());

        // Support nested payloads from frontend settings sections
        if (request.profile() != null && request.profile().get("displayName") instanceof String name) {
            settings.setDisplayName(name.trim());
        }
        if (request.appearance() != null) {
            if (request.appearance().get("theme") instanceof String t) settings.setTheme(t.trim().toLowerCase());
            if (request.appearance().get("timezone") instanceof String tz) {
                validateTimezone(tz.trim());
                settings.setTimezone(tz.trim());
            }
        }
        if (request.notifications() != null) {
            applyNestedNotificationToggles(settings, request.notifications());
        }
    }

    private void applyNestedNotificationToggles(UserSettings settings, Map<String, Object> notif) {
        if (notif.get("deadlines") instanceof Boolean b) settings.setNotifyDeadlines(b);
        if (notif.get("mentions") instanceof Boolean b) settings.setNotifyMentions(b);
        if (notif.get("blocked") instanceof Boolean b) settings.setNotifyBlocked(b);
        if (notif.get("email") instanceof Boolean b) settings.setNotifyEmail(b);
        if (notif.get("blockerAlerts") instanceof Boolean b) settings.setNotifyBlocked(b);
        if (notif.get("deadlineReminders") instanceof Boolean b) settings.setNotifyDeadlines(b);
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (Exception e) {
            Map<String, String> errors = Map.of("timezone", "Invalid IANA timezone identifier: " + timezone);
            throw new BadRequestException("VALIDATION_FAILED", "Invalid timezone", errors);
        }
    }

    private final Map<UUID, List<Long>> usernameRateLimits = new ConcurrentHashMap<>();

    private void checkRateLimit(UUID userId) {
        if (userId == null) return;
        long now = System.currentTimeMillis();
        long window = now - 60_000L;
        List<Long> timestamps = usernameRateLimits.compute(userId, (k, list) -> {
            if (list == null) list = new ArrayList<>();
            list.removeIf(t -> t < window);
            list.add(now);
            return list;
        });
        if (timestamps.size() > 30) {
            throw new TooManyRequestsException("Too many username checks. Please wait a moment.");
        }
    }

    public UsernameAvailableResponse checkUsernameAvailability(String username, UUID currentUserId) {
        if (currentUserId != null) {
            checkRateLimit(currentUserId);
        }
        if (username == null || username.isBlank()) {
            return UsernameAvailableResponse.fail("Username cannot be empty");
        }
        String normalized = username.trim().toLowerCase();
        if (normalized.length() < 3 || normalized.length() > 20) {
            return UsernameAvailableResponse.fail("Must be between 3 and 20 characters");
        }
        if (!Character.isLetter(normalized.charAt(0))) {
            return UsernameAvailableResponse.fail("Must start with a letter");
        }
        if (!normalized.matches("^[a-z0-9_.]+$")) {
            return UsernameAvailableResponse.fail("Only letters, numbers, underscores and dots");
        }
        if (normalized.contains("..") || normalized.contains("__") || normalized.contains("._") || normalized.contains("_.")) {
            return UsernameAvailableResponse.fail("No consecutive separators");
        }

        Set<String> reserved = Set.of(
                "admin", "root", "support", "system", "brackit", "hackathonos", "api", "help",
                "null", "undefined", "me", "team", "rooms", "auth", "settings",
                "login", "signup", "user", "users", "bot", "mod", "moderator",
                "security", "staff", "official"
        );
        if (reserved.contains(normalized)) {
            return UsernameAvailableResponse.fail("That handle is reserved");
        }

        Optional<User> existing = userRepository.findByUsernameIgnoreCase(normalized);
        if (existing.isPresent() && (currentUserId == null || !existing.get().getId().equals(currentUserId))) {
            return UsernameAvailableResponse.fail("Someone's already using that");
        }

        return UsernameAvailableResponse.ok();
    }

    public AvatarUploadResponse uploadAvatar(User user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_FILE", "Please choose an image file to upload");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new PayloadTooLargeException("PAYLOAD_TOO_LARGE", "Avatar file exceeds 2MB limit");
        }

        if (appSettingsService != null) {
            appSettingsService.checkUploadQuota(user.getId(), file.getSize());
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("FILE_READ_ERROR", "Could not read uploaded file");
        }

        boolean isPng = bytes.length >= 8 &&
                (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        boolean isJpeg = bytes.length >= 3 &&
                (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
        boolean isWebp = bytes.length >= 12 &&
                bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
                bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';

        if (!isPng && !isJpeg && !isWebp) {
            throw new BadRequestException("INVALID_IMAGE_TYPE", "Only PNG, JPEG, and WebP images are allowed. SVG and GIF are rejected.");
        }

        File uploadDir = new File(appProperties.getUploadDir(), "avatars");
        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            // directory creation failed or already exists
        }

        String filename = UUID.randomUUID().toString() + ".webp";
        File dest = new File(uploadDir, filename);
        try {
            Files.write(dest.toPath(), bytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save avatar image", e);
        }

        String avatarUrl = "/uploads/avatars/" + filename;
        user.setAvatarUrl(avatarUrl);
        user.setAvatarType("CUSTOM");
        userRepository.save(user);

        return new AvatarUploadResponse(avatarUrl);
    }

    @Transactional
    public UserDetailDto completeOnboarding(User user, OnboardingRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new BadRequestException("INVALID_ONBOARDING", "Username is required");
        }
        String normalizedUsername = request.username().trim().toLowerCase();
        UsernameAvailableResponse check = checkUsernameAvailability(normalizedUsername, user.getId());
        if (!check.available()) {
            throw new ConflictException("USERNAME_UNAVAILABLE", check.reason());
        }

        List<String> roleTags = request.roleTags() != null ? request.roleTags() : List.of();
        if (roleTags.size() > 3) {
            throw new BadRequestException("TOO_MANY_ROLES", "You can pick at most 3 roles");
        }

        List<String> techStack = request.techStack() != null ? request.techStack() : List.of();
        if (techStack.size() > 8) {
            throw new BadRequestException("TOO_MANY_SKILLS", "You can pick at most 8 stack items");
        }

        user.setUsername(normalizedUsername);
        user.setAvatarType(request.avatarType() != null ? request.avatarType() : "PRESET");
        user.setAvatarPreset(request.avatarPreset());
        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            user.setAvatarUrl(request.avatarUrl());
        }
        try {
            user.setRoleTags(objectMapper.writeValueAsString(roleTags));
            user.setTechStack(objectMapper.writeValueAsString(techStack));
        } catch (Exception e) {
            user.setRoleTags("[]");
            user.setTechStack("[]");
        }
        user.setExperienceLevel(request.experienceLevel());
        user.setGoal(request.goal());
        user.setOnboardingCompleted(true);
        user.setOnboardedAt(Instant.now());

        try {
            user = userRepository.saveAndFlush(user);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ConflictException("USERNAME_TAKEN", "That handle was just claimed by someone else. Please choose another one.");
        }

        if (user.getConfirmationEmailSentAt() == null && user.getEmail() != null && !user.getEmail().isBlank()) {
            java.util.Map<String, Object> welcomeVars = new java.util.HashMap<>();
            welcomeVars.put("handle", user.getUsername() != null ? user.getUsername() : "hacker");
            welcomeVars.put("displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getName());
            welcomeVars.put("level", user.getExperienceLevel() != null ? user.getExperienceLevel() : "Rookie");
            welcomeVars.put("roleTags", parseJsonList(user.getRoleTags()));
            welcomeVars.put("appUrl", appProperties.getPublicUrl());

            mailService.enqueue("welcome", user.getEmail(), welcomeVars, "welcome:" + user.getId());
            user.setConfirmationEmailSentAt(Instant.now());
            user = userRepository.save(user);
        }

        return getMe(user);
    }

    @Transactional
    public NotificationPrefsResponse updateNotificationPrefs(User user, NotificationPrefsRequest request) {
        if (request != null && request.emailReminders() != null) {
            user.setEmailReminders(request.emailReminders());
            user = userRepository.save(user);
        }
        return new NotificationPrefsResponse(user.isEmailReminders());
    }

    private java.util.List<String> parseJsonList(String json) {
        if (json == null || json.isBlank() || "[]".equals(json)) {
            return java.util.Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Updates tour progression status and path, idempotently recording completion timestamp.
     */
    @Transactional
    public UserDetailDto updateTour(User user, TourUpdateRequest request) {
        String currentStatus = (user.getTourStatus() != null && !user.getTourStatus().isBlank())
                ? user.getTourStatus().toUpperCase()
                : "NOT_STARTED";
        String newStatus = request.status() != null ? request.status().toUpperCase() : null;

        if (newStatus != null) {
            if ("NOT_STARTED".equals(currentStatus) || "SKIPPED".equals(currentStatus)) {
                if ("SKIPPED".equals(newStatus) || "COMPLETED".equals(newStatus)) {
                    user.setTourStatus(newStatus);
                    if ("COMPLETED".equals(newStatus) && user.getTourCompletedAt() == null) {
                        user.setTourCompletedAt(Instant.now());
                    }
                } else {
                    throw new ConflictException("INVALID_TOUR_STATUS", "Tour can only transition to SKIPPED or COMPLETED");
                }
            } else if ("COMPLETED".equals(currentStatus)) {
                // Idempotent repeat: already completed, keep COMPLETED status
            } else if (newStatus.equals(currentStatus)) {
                // Idempotent repeat
            } else {
                throw new ConflictException("TOUR_ALREADY_FINISHED", "Tour status transition not allowed once completed");
            }
        }
        if (request.path() != null) {
            user.setTourPath(request.path());
        }
        if (request.version() != null) {
            user.setTourVersion(request.version());
        }
        user = userRepository.save(user);
        return getMe(user);
    }

    /**
     * Records a hotspot viewed by user, enforcing key character rules and a maximum of 50 keys idempotently.
     */
    @Transactional
    public UserDetailDto addHotspot(User user, HotspotRequest request) {
        List<String> current = new ArrayList<>(userMapper.parseJsonList(user.getHotspotsSeen()));
        String key = request.key().trim();
        if (!current.contains(key)) {
            if (current.size() >= 50) {
                throw new BadRequestException("MAX_HOTSPOTS_REACHED", "Maximum 50 hotspots can be recorded");
            }
            current.add(key);
            try {
                user.setHotspotsSeen(objectMapper.writeValueAsString(current));
            } catch (Exception e) {
                user.setHotspotsSeen("[]");
            }
            user = userRepository.save(user);
        }
        return getMe(user);
    }

    /**
     * Resets viewed hotspots list, clearing page tips and beacons.
     */
    @Transactional
    public UserDetailDto resetHotspots(User user) {
        user.setHotspotsSeen("[]");
        user = userRepository.save(user);
        return getMe(user);
    }

    /**
     * Updates avatar settings and/or role tags for the current user.
     * Idempotent, returns updated UserSummaryDto.
     */
    @Transactional
    public UserSummaryDto updateProfile(User user, UpdateProfileRequest request) {
        if (request == null) {
            return UserSummaryDto.from(user);
        }

        if (request.roleTags() != null) {
            if (request.roleTags().size() > 3) {
                throw new BadRequestException("TOO_MANY_ROLES", "You can pick at most 3 roles");
            }
            try {
                user.setRoleTags(objectMapper.writeValueAsString(request.roleTags()));
            } catch (Exception e) {
                user.setRoleTags("[]");
            }
        }

        String type = request.avatarType() != null ? request.avatarType().trim().toUpperCase() : user.getAvatarType();
        if ("PRESET".equalsIgnoreCase(type)) {
            Integer preset = request.avatarPreset() != null ? request.avatarPreset() : user.getAvatarPreset();
            if (preset == null || preset < 1 || preset > 10) {
                throw new BadRequestException("INVALID_PRESET", "Avatar preset must be between 1 and 10");
            }
            user.setAvatarType("PRESET");
            user.setAvatarPreset(preset);
            user.setAvatarUrl(null);
        } else if ("CUSTOM".equalsIgnoreCase(type)) {
            String url = request.avatarUrl() != null ? request.avatarUrl().trim() : user.getAvatarUrl();
            if (url == null || (!url.startsWith("/uploads/avatars/") && !url.contains("/uploads/avatars/"))) {
                throw new BadRequestException("INVALID_AVATAR_URL", "Custom avatar URL must be one returned by the avatar upload endpoint");
            }
            user.setAvatarType("CUSTOM");
            user.setAvatarUrl(url);
            user.setAvatarPreset(null);
        } else if ("NONE".equalsIgnoreCase(type)) {
            user.setAvatarType("NONE");
            user.setAvatarPreset(null);
            user.setAvatarUrl(null);
        }

        User saved = userRepository.save(user);
        return UserSummaryDto.from(saved);
    }
}
