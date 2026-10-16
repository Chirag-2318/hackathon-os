package com.hackathonos.backend.admin;

import com.hackathonos.backend.admin.dto.AdminOverviewDto;
import com.hackathonos.backend.admin.dto.AdminSettingsPatchRequest;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.users.User;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminOverviewController {

    private final AppSettingsService appSettingsService;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.hackathons.HackathonService hackathonService;

    public AdminOverviewController(AppSettingsService appSettingsService,
                                   CurrentUser currentUser,
                                   com.hackathonos.backend.hackathons.HackathonService hackathonService) {
        this.appSettingsService = appSettingsService;
        this.currentUser = currentUser;
        this.hackathonService = hackathonService;
    }

    private void requireAdmin() {
        User user = currentUser.getOptional().orElse(null);
        if (user == null || !appSettingsService.isAdmin(user.getEmail())) {
            throw new NotFoundException("NOT_FOUND", "Resource not found");
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewDto> getOverview() {
        requireAdmin();
        return ResponseEntity.ok(appSettingsService.getAdminOverview());
    }

    @PatchMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody AdminSettingsPatchRequest request) {
        requireAdmin();
        if (request != null && request.signupsOpen() != null) {
            appSettingsService.setSignupsOpen(request.signupsOpen());
        }
        return ResponseEntity.ok(Map.of("signupsOpen", appSettingsService.isSignupsOpen()));
    }

    @PostMapping("/hackathons/reload")
    public ResponseEntity<Map<String, Object>> reloadHackathons() {
        requireAdmin();
        hackathonService.syncHackathons();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reloadedAt", java.time.Instant.now().toString(),
                "message", "Hackathons reloaded from mounted configuration file."
        ));
    }

    @GetMapping(value = "/waitlist.csv", produces = "text/csv")
    public ResponseEntity<String> downloadWaitlistCsv() {
        requireAdmin();
        String csv = appSettingsService.getWaitlistCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"waitlist.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
