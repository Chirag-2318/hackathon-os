package com.hackathonos.backend.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.error.PayloadTooLargeException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.SecretCipher;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
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
    private final UserApiKeyRepository apiKeyRepository;
    private final DataExportRepository exportRepository;
    private final NotificationRepository notificationRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final UserMapper userMapper;
    private final SecretCipher secretCipher;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public UserService(UserRepository userRepository,
                       UserSettingsRepository settingsRepository,
                       UserApiKeyRepository apiKeyRepository,
                       DataExportRepository exportRepository,
                       NotificationRepository notificationRepository,
                       RoomRepository roomRepository,
                       RoomMemberRepository memberRepository,
                       UserMapper userMapper,
                       SecretCipher secretCipher,
                       AppProperties appProperties,
                       ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.exportRepository = exportRepository;
        this.notificationRepository = notificationRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.userMapper = userMapper;
        this.secretCipher = secretCipher;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
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
                    existing.setName(name);
                    if (email != null) existing.setEmail(email);
                    if (avatarUrl != null) existing.setAvatarUrl(avatarUrl);
                    if (login != null) existing.setLogin(login);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(new User(
                        provider,
                        providerUserId,
                        name,
                        email,
                        avatarUrl,
                        login
                )));

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
        long unread = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());
        return userMapper.toDetailDto(user, settings, unread);
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

    /**
     * Generates a downloadable JSON export of the user's data and returns an expiring download link.
     */
    @Transactional
    public DataExportResponse exportUserData(User user) {
        Map<String, Object> exportMap = buildExportData(user);
        File exportFile = saveExportFile(user.getId(), exportMap);

        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);
        DataExport exportRecord = new DataExport(user.getId(), exportFile.getAbsolutePath(), expiresAt);
        exportRepository.save(exportRecord);

        String downloadUrl = appProperties.getBaseUrl() + "/api/v1/users/me/export/" + exportRecord.getId();
        return new DataExportResponse(downloadUrl, expiresAt);
    }

    /**
     * Streams the exported JSON file as an attachment for the owner if not expired.
     */
    public Resource getExportAttachment(User user, UUID exportId) {
        DataExport exportRecord = exportRepository.findByIdAndUserId(exportId, user.getId())
                .orElseThrow(() -> new NotFoundException("EXPORT_NOT_FOUND", "Export record not found"));

        if (Instant.now().isAfter(exportRecord.getExpiresAt())) {
            throw new BadRequestException("EXPORT_EXPIRED", "Data export link has expired");
        }

        exportRecord.setDownloadedAt(Instant.now());
        exportRepository.save(exportRecord);

        File file = new File(exportRecord.getFilePath());
        if (!file.exists()) {
            throw new NotFoundException("FILE_NOT_FOUND", "Export file is no longer on disk");
        }
        return new FileSystemResource(file);
    }

    /**
     * Permanently deletes user account, anonymizes history, and invalidates active session.
     * Blocks deletion if user is leader of rooms that contain other teammates.
     */
    @Transactional
    public void deleteAccount(User user, DeleteAccountRequest request, HttpServletRequest httpRequest) {
        if (request == null || !"DELETE".equals(request.confirm())) {
            throw new BadRequestException("CONFIRMATION_REQUIRED", "Body must include confirm: DELETE");
        }

        checkLeadershipConstraints(user);
        cleanupUserRooms(user);
        cleanupUserData(user);
        anonymizeUser(user);

        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
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

    private Map<String, Object> buildExportData(User user) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("profile", Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail() != null ? user.getEmail() : ""));
        root.put("settings", settingsRepository.findById(user.getId()).orElse(null));
        root.put("memberships", memberRepository.findByUserId(user.getId()));
        root.put("rooms", roomRepository.findActiveRoomsByMemberUserId(user.getId()));
        root.put("notifications", notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), org.springframework.data.domain.PageRequest.of(0, 500)));
        return root;
    }

    private File saveExportFile(UUID userId, Map<String, Object> data) {
        File dir = new File(appProperties.getUploadDir(), "exports");
        if (!dir.exists()) dir.mkdirs();
        File file = new File(dir, "export-" + userId + "-" + System.currentTimeMillis() + ".json");
        try (FileWriter writer = new FileWriter(file)) {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(writer, data);
            return file;
        } catch (IOException e) {
            throw new RuntimeException("Failed to write export file", e);
        }
    }

    private void checkLeadershipConstraints(User user) {
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        List<String> blockingRooms = new ArrayList<>();

        for (RoomMember m : memberships) {
            if ("LEADER".equalsIgnoreCase(m.getRole())) {
                long count = memberRepository.countByRoomId(m.getRoomId());
                if (count > 1) {
                    roomRepository.findById(m.getRoomId()).ifPresent(r -> blockingRooms.add(r.getName()));
                }
            }
        }

        if (!blockingRooms.isEmpty()) {
            throw new ConflictException("TRANSFER_LEADERSHIP_FIRST",
                    "You are the leader of active rooms with teammates: " + String.join(", ", blockingRooms) +
                            ". Transfer leadership before deleting your account.");
        }
    }

    private void cleanupUserRooms(User user) {
        List<RoomMember> memberships = memberRepository.findByUserId(user.getId());
        for (RoomMember m : memberships) {
            long memberCount = memberRepository.countByRoomId(m.getRoomId());
            if (memberCount <= 1) {
                roomRepository.deleteById(m.getRoomId());
            } else {
                memberRepository.delete(m);
            }
        }
    }

    private void cleanupUserData(User user) {
        settingsRepository.deleteById(user.getId());
        apiKeyRepository.deleteByUserId(user.getId());
        notificationRepository.deleteByUserId(user.getId());
        exportRepository.deleteByUserId(user.getId());
    }

    private void anonymizeUser(User user) {
        user.setName("Deleted user");
        user.setEmail(null);
        user.setAvatarUrl(null);
        user.setLogin(null);
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
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
                "admin", "root", "support", "system", "hackathonos", "api", "help",
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

        return getMe(user);
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
}
