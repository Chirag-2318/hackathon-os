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

    public UserController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
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

    @GetMapping("/api/v1/users/username-available")
    public UsernameAvailableResponse checkUsernameAvailable(@RequestParam("username") String username) {
        UUID currentUserId = currentUser.getOptional().map(User::getId).orElse(null);
        return userService.checkUsernameAvailability(username, currentUserId);
    }

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

    @PostMapping("/api/v1/users/me/export")
    public DataExportResponse exportData() {
        User user = currentUser.get();
        return userService.exportUserData(user);
    }

    @GetMapping("/api/v1/users/me/export/{exportId}")
    public ResponseEntity<Resource> downloadExport(@PathVariable UUID exportId) {
        User user = currentUser.get();
        Resource resource = userService.getExportAttachment(user, exportId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hackathon-os-export.json\"")
                .body(resource);
    }

    @DeleteMapping("/api/v1/users/me")
    public void deleteAccount(@RequestBody DeleteAccountRequest request, HttpServletRequest httpRequest) {
        User user = currentUser.get();
        userService.deleteAccount(user, request, httpRequest);
    }
}
