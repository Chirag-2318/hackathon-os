package com.hackathonos.backend.users;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.ai.UserAiKeyService userAiKeyService;
    private final com.hackathonos.backend.ai.AiService aiService;

    public UserController(
            UserService userService,
            CurrentUser currentUser,
            com.hackathonos.backend.ai.UserAiKeyService userAiKeyService,
            com.hackathonos.backend.ai.AiService aiService
    ) {
        this.userService = userService;
        this.currentUser = currentUser;
        this.userAiKeyService = userAiKeyService;
        this.aiService = aiService;
    }

    @GetMapping("/api/v1/me")
    public UserDetailDto getMe() {
        User user = currentUser.get();
        return userService.getMe(user);
    }

    @GetMapping("/api/v1/users/me")
    public UserDetailDto getUsersMe() {
        User user = currentUser.get();
        return userService.getMe(user);
    }

    @GetMapping({"/api/v1/users/me/ai-key", "/users/me/ai-key"})
    public com.hackathonos.backend.ai.dto.UserAiKeyResponseDto getAiKey() {
        User user = currentUser.get();
        return userAiKeyService.getKeyResponse(user.getId());
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "ai_key_put", limit = 10, periodSeconds = 3600)
    @PutMapping({"/api/v1/users/me/ai-key", "/users/me/ai-key"})
    public com.hackathonos.backend.ai.dto.UserAiKeyResponseDto setAiKey(@RequestBody com.hackathonos.backend.ai.dto.SetUserAiKeyRequest request) {
        User user = currentUser.get();
        return userAiKeyService.saveKey(user.getId(), request);
    }

    @DeleteMapping({"/api/v1/users/me/ai-key", "/users/me/ai-key"})
    public ResponseEntity<Void> deleteAiKey() {
        User user = currentUser.get();
        userAiKeyService.deleteKey(user.getId());
        return ResponseEntity.noContent().build();
    }

    public record AiKeyTestResponse(boolean ok, Long latencyMs, String error) {}

    @com.hackathonos.backend.common.security.RateLimited(key = "ai_key_test", limit = 1, periodSeconds = 60)
    @PostMapping({"/api/v1/users/me/ai-key/test", "/users/me/ai-key/test"})
    public AiKeyTestResponse testAiKey() {
        User user = currentUser.get();
        try {
            long latencyMs = aiService.ping(user.getId());
            return new AiKeyTestResponse(true, latencyMs, null);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Key test failed.";
            }
            return new AiKeyTestResponse(false, null, msg);
        }
    }


    @com.hackathonos.backend.common.security.RateLimited(key = "username_avail", limit = 30, periodSeconds = 60)
    @GetMapping("/api/v1/users/username-available")
    public UsernameAvailableResponse checkUsernameAvailable(@RequestParam("username") String username) {
        UUID currentUserId = currentUser.getOptional().map(User::getId).orElse(null);
        return userService.checkUsernameAvailability(username, currentUserId);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "avatar_upload", limit = 10, periodSeconds = 60)
    @PostMapping(value = "/api/v1/users/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AvatarUploadResponse uploadAvatar(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        User user = currentUser.get();
        return userService.uploadAvatar(user, file);
    }

    @PostMapping("/api/v1/users/me/onboarding")
    public UserDetailDto completeOnboarding(@RequestBody OnboardingRequest request) {
        User user = currentUser.get();
        return userService.completeOnboarding(user, request);
    }

    @PatchMapping("/api/v1/users/me/profile")
    public UserSummaryDto updateProfile(@RequestBody UpdateProfileRequest request) {
        User user = currentUser.get();
        return userService.updateProfile(user, request);
    }

    @PostMapping("/api/v1/users/me/tour")
    public UserDetailDto updateTour(@Valid @RequestBody TourUpdateRequest request) {
        User user = currentUser.get();
        return userService.updateTour(user, request);
    }

    @PostMapping("/api/v1/users/me/hotspots")
    public UserDetailDto addHotspot(@Valid @RequestBody HotspotRequest request) {
        User user = currentUser.get();
        return userService.addHotspot(user, request);
    }

    @PostMapping("/api/v1/users/me/hotspots/reset")
    public UserDetailDto resetHotspots() {
        User user = currentUser.get();
        return userService.resetHotspots(user);
    }

    @GetMapping("/api/v1/users/me/settings")
    public UserSettingsDto getSettings() {
        User user = currentUser.get();
        return userService.getSettings(user);
    }

    @PatchMapping("/api/v1/users/me/settings")
    public UserSettingsDto updateSettings(@RequestBody UpdateSettingsRequest request) {
        User user = currentUser.get();
        return userService.updateSettings(user, request);
    }

    @GetMapping("/api/v1/users/me/preferences")
    public UserPreferenceDto getPreferences() {
        User user = currentUser.get();
        return userService.getPreferences(user);
    }

    @PatchMapping("/api/v1/users/me/preferences")
    public UserPreferenceDto updatePreferences(@RequestBody UpdateUserPreferenceRequest request) {
        User user = currentUser.get();
        return userService.updatePreferences(user, request);
    }

    @PatchMapping({"/users/me/notification-prefs", "/api/v1/users/me/notification-prefs"})
    public NotificationPrefsResponse updateNotificationPrefs(@RequestBody NotificationPrefsRequest request) {
        User user = currentUser.get();
        return userService.updateNotificationPrefs(user, request);
    }

    @PostMapping("/api/v1/users/me/api-keys")
    public ApiKeyDto addApiKey(@Valid @RequestBody AddApiKeyRequest request) {
        User user = currentUser.get();
        return userService.addApiKey(user, request);
    }

    @DeleteMapping("/api/v1/users/me/api-keys/{id}")
    public void deleteApiKey(@PathVariable UUID id) {
        User user = currentUser.get();
        userService.deleteApiKey(user, id);
    }

    @GetMapping({"/users/me/data-summary", "/api/v1/users/me/data-summary"})
    public DataSummaryResponse getDataSummary() {
        User user = currentUser.get();
        return userService.getDataSummary(user);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "user_export", limit = 3, periodSeconds = 86400)
    @GetMapping({"/users/me/export", "/api/v1/users/me/export"})
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> exportData() {
        User user = currentUser.get();
        String username = user.getUsername() != null ? user.getUsername() : "user";
        String dateStr = java.time.LocalDate.now().toString();
        String filename = "hackathon-os-export-" + username + "-" + dateStr + ".zip";

        org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody responseBody = outputStream -> {
            try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(outputStream)) {
                userService.streamExportZip(user, zos);
                zos.flush();
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(responseBody);
    }

    @GetMapping({"/users/me/delete-preview", "/api/v1/users/me/delete-preview"})
    public DeletePreviewResponse getDeletePreview() {
        User user = currentUser.get();
        return userService.getDeletePreview(user);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "user_delete", limit = 3, periodSeconds = 3600)
    @DeleteMapping({"/users/me", "/api/v1/users/me"})
    public ResponseEntity<Void> deleteAccount(@RequestBody DeleteAccountRequest request,
                                              HttpServletRequest httpRequest,
                                              jakarta.servlet.http.HttpServletResponse httpResponse) {
        User user = currentUser.get();
        userService.deleteAccount(user, request, httpRequest, httpResponse);
        return ResponseEntity.noContent().build();
    }
}
